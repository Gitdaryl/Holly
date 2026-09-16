import { list, put, del } from '@vercel/blob'
import { propertiesData } from '../src/data/amenities.js'
import { lakes } from '../src/data/lakes.js'
import { regions } from '../src/data/regions.js'
import { buildReport, sellerKeyFor, SITE } from './lib/report.js'
import { authorize, loginAllowed, mintLinkToken, mintSession, verify } from './lib/admin-auth.js'
import { notifyHolly, textLead, HOLLY_PRETTY } from './lib/sms.js'
import { WRITE_REVIEW_URL } from './reviews.js'
import { transcribeWithDeepgram } from './voice-inbound.js'

// Holly's admin. One function, four jobs:
//   POST ?action=login                text Holly a 15-minute login link
//   GET  ?action=session&t=<link>     trade the link for a 30-day session
//   GET  ?view=inbox|waitlist|listings   (bearer: session or ADMIN_SECRET)
//   POST ?action=status  {id, status}    (bearer) flip a lead's status
//   POST ?action=review  {id, phone, name} (bearer) text the client Holly's Google review link
//   GET  ?view=texts                    (bearer) every SMS thread, newest first
//   POST ?action=reply   {to, body}     (bearer) send a text from the site number
//
// Reads are assembled from the same append-only blobs the intakes write, so
// the admin never has a second copy of the truth. Lead status is append-only
// too: admin/status/<leadId>/<ts>-<status>; the newest pathname wins and
// nothing is ever read-modify-written (blob content reads are CDN-cached).

export const STATUSES = ['new', 'called', 'showing', 'client', 'dead']

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')
  const action = req.query.action

  if (req.method === 'POST' && action === 'login') return login(req, res)
  if (req.method === 'GET' && action === 'session') return session(req, res)

  if (!authorize(req)) return res.status(401).json({ error: 'Not signed in.' })

  try {
    if (req.method === 'POST' && action === 'status') return setStatus(req, res)
    if (req.method === 'POST' && action === 'review') return askReview(req, res)
    if (req.method === 'POST' && action === 'reply') return reply(req, res)
    if (req.method === 'POST' && action === 'purge-tests') return purgeTests(req, res)
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
    const view = req.query.view
    if (view === 'ping') return res.status(200).json({ ok: true })
    if (view === 'inbox') return res.status(200).json(await inbox())
    if (view === 'waitlist') return res.status(200).json(await waitlist())
    if (view === 'listings') return res.status(200).json(await listings())
    if (view === 'texts') return res.status(200).json(await texts())
    if (view === 'transcribe') {
      // Re-run a voicemail through Deepgram: ?view=transcribe&rec=RE...
      if (!/^RE[0-9a-f]{32}$/.test(String(req.query.rec || ''))) return res.status(400).json({ error: 'bad recording id' })
      if (!process.env.DEEPGRAM_API_KEY) return res.status(500).json({ error: 'DEEPGRAM_API_KEY not set' })
      return res.status(200).json({ rec: req.query.rec, text: await transcribeWithDeepgram(req.query.rec) })
    }
    return res.status(400).json({ error: 'unknown view' })
  } catch (err) {
    console.error('admin failed:', err)
    return res.status(500).json({ error: err.message })
  }
}

// ── auth ────────────────────────────────────────────────────────────────

async function login(req, res) {
  if (!process.env.HOLLY_SMS_PHONE) return res.status(500).json({ error: 'HOLLY_SMS_PHONE not set' })
  const gate = await loginAllowed()
  if (!gate.ok) return res.status(429).json({ error: `Too many login texts (${gate.why}). Try again shortly.` })
  const link = `${SITE}/admin?t=${mintLinkToken()}`
  const r = await notifyHolly(`Your Holly admin login link (good for 15 minutes):\n${link}`)
  if (!r.ok) return res.status(500).json({ error: 'Could not send the text. Ask Yeti.' })
  return res.status(200).json({ sent: true })
}

function session(req, res) {
  const p = verify(req.query.t)
  if (!p || p.k !== 'link') return res.status(401).json({ error: 'That link is expired or invalid. Request a new one.' })
  return res.status(200).json({ session: mintSession() })
}

// ── inbox ───────────────────────────────────────────────────────────────

const MAX_LEADS = 200

export async function allBlobs(prefix) {
  const out = []
  let cursor
  do {
    const page = await list({ prefix, limit: 1000, cursor })
    out.push(...page.blobs)
    cursor = page.hasMore ? page.cursor : null
  } while (cursor)
  return out
}

// leads/<bucket>/<date>/<stamp>-<uuid>.json -> sort key "<date>/<stamp>-<uuid>"
const sortKey = (pathname) => pathname.split('/').slice(2).join('/')
const idOf = (pathname) => pathname.replace(/\.json$/, '').slice(-36)

async function readJson(blobs) {
  const out = []
  for (let i = 0; i < blobs.length; i += 25) {
    const batch = await Promise.all(
      blobs.slice(i, i + 25).map(async (b) => {
        try {
          const r = await fetch(b.url)
          return { pathname: b.pathname, data: await r.json() }
        } catch (err) {
          console.error('admin read failed', b.pathname, err.message)
          return null
        }
      }),
    )
    out.push(...batch.filter(Boolean))
  }
  return out
}

async function reviewAskedMap() {
  const blobs = await allBlobs('admin/review-asked/')
  const map = {}
  for (const b of blobs) {
    const [, , id, ts] = b.pathname.split('/')
    map[id] = Math.max(map[id] || 0, Number(ts) || 0)
  }
  return map
}

async function statusMap() {
  const blobs = await allBlobs('admin/status/')
  const map = {}
  for (const b of blobs) {
    const [, , id, file] = b.pathname.split('/')
    const [ts, status] = file.split('-')
    const t = Number(ts)
    if (!map[id] || t > map[id].t) map[id] = { t, status }
  }
  return map
}

function normalize({ pathname, data }) {
  const [root, bucket] = pathname.split('/')
  const base = {
    id: idOf(pathname),
    when: data.receivedAt || null,
    name: data.name || 'Unknown',
    phone: data.phone || null,
    email: data.email || null,
  }
  if (root === 'waitlist') {
    return { ...base, source: 'Waitlist', about: data.lakeName || bucket,
      detail: [data.budget, data.timing, data.notes].filter(Boolean).join(' · '), link: `/lakes/${bucket}` }
  }
  if (bucket === '_contact') return { ...base, source: 'Contact form', about: data.region ? (regions[data.region]?.name || data.region) : '', detail: data.message || '' }
  if (bucket === '_chat') return { ...base, source: 'Chat', about: data.region ? (regions[data.region]?.name || data.region) : '', detail: data.interest || '' }
  if (bucket === '_cma') {
    return { ...base, source: 'Home value', about: data.address || '',
      detail: [data.type, data.timeline && `timeline: ${data.timeline}`, data.notes].filter(Boolean).join(' · ') }
  }
  const prop = propertiesData.find((p) => p.slug === bucket)
  return { ...base, source: 'Showing request', about: prop?.title || data.listing || bucket,
    detail: [data.preferred, data.message].filter(Boolean).join(' · '), link: prop ? `/property/${prop.slug}` : null }
}

export async function inbox() {
  const [leadBlobs, waitBlobs, status, asked] = await Promise.all([allBlobs('leads/'), allBlobs('waitlist/'), statusMap(), reviewAskedMap()])
  const blobs = [...leadBlobs, ...waitBlobs]
    .filter((b) => b.pathname.endsWith('.json'))
    .sort((a, b) => sortKey(b.pathname).localeCompare(sortKey(a.pathname)))
    .slice(0, MAX_LEADS)
  const items = (await readJson(blobs)).map(normalize).map((l) => ({ ...l, status: status[l.id]?.status || 'new', reviewAskedAt: asked[l.id] || null }))
  const counts = {}
  for (const l of items) counts[l.status] = (counts[l.status] || 0) + 1
  return { items, counts, total: leadBlobs.length + waitBlobs.length, capped: blobs.length === MAX_LEADS }
}

async function setStatus(req, res) {
  const { id, status } = req.body || {}
  if (!/^[0-9a-f-]{36}$/.test(String(id || ''))) return res.status(400).json({ error: 'bad id' })
  if (!STATUSES.includes(status)) return res.status(400).json({ error: 'bad status' })
  await put(`admin/status/${id}/${Date.now()}-${status}`, '1', { access: 'public', addRandomSuffix: false, contentType: 'text/plain' })
  return res.status(200).json({ ok: true, id, status })
}

// One tap at closing: the client gets Holly's review link by text, from the
// same number that has been texting them all along. Manual on purpose; an
// automatic ask that lands on the wrong day is how you get a 3-star review.
async function askReview(req, res) {
  const { id, phone, name } = req.body || {}
  if (!/^[0-9a-f-]{36}$/.test(String(id || ''))) return res.status(400).json({ error: 'bad id' })
  if (!phone) return res.status(400).json({ error: 'This lead has no phone number.' })
  const first = String(name || '').trim().split(' ')[0] || 'there'
  const r = await textLead(phone, `Hi ${first}, it's Holly Griewahn. Thank you for trusting me with your sale. If you have two minutes, a Google review helps the next family find me: ${WRITE_REVIEW_URL}  Thank you! ${HOLLY_PRETTY}`)
  if (!r.ok) return res.status(502).json({ error: `Text failed: ${r.error}` })
  await put(`admin/review-asked/${id}/${Date.now()}`, '1', { access: 'public', addRandomSuffix: false, contentType: 'text/plain' })
  return res.status(200).json({ ok: true })
}

// ── texts ───────────────────────────────────────────────────────────────

// Threads keyed by the other party's number. Names come from the inbox: if a
// lead form carried that phone, the thread shows who it is.
async function texts() {
  const blobs = (await allBlobs('sms/')).filter((b) => b.pathname.endsWith('.json'))
  const msgs = await readJson(blobs)
  const threads = {}
  for (const { pathname, data } of msgs) {
    const key = pathname.split('/')[1].slice(-10) // early inbound blobs used 11 digits
    if (!threads[key]) threads[key] = { phone: key, messages: [] }
    threads[key].messages.push(data)
  }
  const list = Object.values(threads)
  for (const t of list) {
    t.messages.sort((a, b) => String(a.receivedAt).localeCompare(String(b.receivedAt)))
    t.last = t.messages[t.messages.length - 1]
    t.unanswered = t.last.direction === 'in'
  }
  list.sort((a, b) => String(b.last.receivedAt).localeCompare(String(a.last.receivedAt)))

  // Attach names from lead records that carried the same phone.
  const leadBlobs = [...(await allBlobs('leads/')), ...(await allBlobs('waitlist/'))].filter((b) => b.pathname.endsWith('.json'))
  const leads = await readJson(leadBlobs)
  const names = {}
  for (const { data } of leads) {
    const d = String(data.phone || '').replace(/\D/g, '').slice(-10)
    if (d && data.name && !names[d]) names[d] = data.name
  }
  for (const t of list) t.name = names[t.phone.slice(-10)] || null
  return { threads: list }
}

async function reply(req, res) {
  const { to, body } = req.body || {}
  if (!to || !String(body || '').trim()) return res.status(400).json({ error: 'Number and message are required.' })
  const r = await textLead(to, String(body).trim().slice(0, 1500), { author: 'holly' })
  if (!r.ok) return res.status(502).json({ error: `Text failed: ${r.error}` })
  return res.status(200).json({ ok: true })
}

// Remove everything created while testing: leads, waitlist entries, texts and
// calls from Yeti's number, plus their status markers. Matches on the name
// ("test", "delete me") or on the phone numbers passed in. Admin only.
async function purgeTests(req, res) {
  const phones = (req.body?.phones || []).map((p) => String(p).replace(/\D/g, '').slice(-10)).filter(Boolean)
  const isTest = (data) => /\b(test|delete me)\b/i.test(String(data?.name || '')) || phones.includes(String(data?.phone || '').replace(/\D/g, '').slice(-10))
  const removed = []
  const leadBlobs = [...(await allBlobs('leads/')), ...(await allBlobs('waitlist/'))].filter((b) => b.pathname.endsWith('.json'))
  const ids = new Set()
  for (const { pathname, data } of await readJson(leadBlobs)) {
    if (isTest(data)) { ids.add(idOf(pathname)); removed.push(pathname) }
  }
  for (const b of await allBlobs('admin/')) {
    const id = b.pathname.split('/')[2]
    if (ids.has(id)) removed.push(b.pathname)
  }
  for (const p of phones) for (const b of await allBlobs(`sms/${p}/`)) removed.push(b.pathname)
  for (let i = 0; i < removed.length; i += 50) await del(removed.slice(i, i + 50))
  return res.status(200).json({ removed: removed.length, leads: ids.size })
}

// ── waitlist ────────────────────────────────────────────────────────────

async function waitlist() {
  const blobs = (await allBlobs('waitlist/')).filter((b) => b.pathname.endsWith('.json'))
  const entries = await readJson(blobs)
  const byLake = {}
  for (const { pathname, data } of entries) {
    const lake = pathname.split('/')[1]
    if (!byLake[lake]) byLake[lake] = { lake, name: lakes[lake]?.name || lake, region: lakes[lake]?.region || null, entries: [] }
    byLake[lake].entries.push({ id: idOf(pathname), ...data })
  }
  const groups = Object.values(byLake)
  for (const g of groups) g.entries.sort((a, b) => String(b.receivedAt).localeCompare(String(a.receivedAt)))
  groups.sort((a, b) => b.entries.length - a.entries.length)
  return { groups, total: entries.length }
}

// ── listings ────────────────────────────────────────────────────────────

async function listings() {
  const active = propertiesData.filter((p) => String(p.status || 'active') === 'active')
  const items = await Promise.all(
    active.map(async (p) => {
      const r = await buildReport(p, 7)
      const sellerKey = sellerKeyFor(p.slug)
      return {
        slug: p.slug, title: p.title, price: p.price, image: p.image || null,
        lake: p.lake ? lakes[p.lake]?.name : null, region: regions[p.region]?.name || null,
        listedOn: p.listedOn, daysOnMarket: r.daysOnMarket,
        sellerName: p.sellerName, sellerEmail: p.sellerEmail,
        metrics: r.metrics, series: r.series,
        sellerLink: sellerKey ? `${SITE}/api/seller-report?slug=${p.slug}&key=${sellerKey}` : null,
        page: `/property/${p.slug}`,
      }
    }),
  )
  items.sort((a, b) => b.metrics.views.period - a.metrics.views.period)
  return { items }
}
