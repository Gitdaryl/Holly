import { list, put, del } from '@vercel/blob'
import { propertiesData } from '../src/data/amenities.js'
import { lakes } from '../src/data/lakes.js'
import { regions } from '../src/data/regions.js'
import { buildReport, sellerKeyFor, SITE } from './lib/report.js'
import { windowDays, todayISO } from './lib/engage-store.js'
import { authorize, loginAllowed, mintLinkToken, mintSession, verify } from './lib/admin-auth.js'
import { notifyHolly, textLead, HOLLY_PRETTY, normalizePhone } from './lib/sms.js'
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
    if (view === 'stats') return res.status(200).json(await stats(Math.min(90, Math.max(1, parseInt(req.query.days, 10) || 7))))
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
    return { ...base, source: data.role === 'owner' ? 'Lake owner' : 'Waitlist', about: data.lakeName || bucket,
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

// ── stats ───────────────────────────────────────────────────────────────

// Counts come from hit pathnames only (see api/track.js), never blob reads:
//   hits/<date>/<event>/<path enc>/<source>/<device>/<session>-<uuid>
const decodePath = (enc) => (enc === 'home' ? '/' : '/' + enc.replace(/~/g, '/'))

async function hitsFor(days) {
  const rows = []
  await Promise.all(days.map(async (d) => {
    for (const b of await allBlobs(`hits/${d}/`)) {
      const [, date, event, enc, source, device, file] = b.pathname.split('/')
      if (!file) continue
      rows.push({ date, event, path: decodePath(enc), source, device, sid: file.slice(0, 36) })
    }
  }))
  return rows
}

function summarize(rows) {
  const views = rows.filter((r) => r.event === 'view')
  const sessions = new Set(views.map((r) => r.sid))
  const count = (list, key) => {
    const m = {}
    for (const r of list) m[r[key]] = (m[r[key]] || 0) + 1
    return Object.entries(m).sort((a, b) => b[1] - a[1])
  }
  const sessionsBy = (key) => {
    const m = {}
    for (const r of views) (m[r[key]] ||= new Set()).add(r.sid)
    return Object.entries(m).map(([k, v]) => [k, v.size]).sort((a, b) => b[1] - a[1])
  }
  const events = {}
  for (const r of rows) if (r.event !== 'view') events[r.event] = (events[r.event] || 0) + 1
  return {
    views: views.length,
    visitors: sessions.size,
    pages: count(views, 'path').slice(0, 25).map(([path, n]) => ({ path, views: n })),
    sources: sessionsBy('source').slice(0, 12).map(([source, n]) => ({ source, visitors: n })),
    devices: sessionsBy('device').map(([device, n]) => ({ device, visitors: n })),
    events,
    leadEvents: ['waitlist', 'owner', 'showing', 'cma', 'contact', 'chat_lead'].reduce((a, e) => a + (events[e] || 0), 0),
  }
}

async function stats(days) {
  const end = todayISO()
  const thisWin = windowDays(end, days)
  const priorWin = windowDays(thisWin[0], days + 1).slice(0, days)
  const [rows, prior, inboxData, textData] = await Promise.all([hitsFor(thisWin), hitsFor(priorWin), inbox(), texts()])
  const now = summarize(rows)
  const before = summarize(prior)

  // Per lake: page views on /lakes/x and /market/x vs sign-ups made there.
  const lakeRows = Object.values(lakes).map((l) => {
    const onPages = (r) => r.path === `/lakes/${l.slug}` || r.path === `/market/${l.slug}`
    const v = rows.filter((r) => r.event === 'view' && onPages(r))
    return { lake: l.name, slug: l.slug, views: v.length, visitors: new Set(v.map((r) => r.sid)).size,
      buyers: rows.filter((r) => r.event === 'waitlist' && onPages(r)).length,
      owners: rows.filter((r) => r.event === 'owner' && onPages(r)).length }
  }).filter((x) => x.views || x.buyers || x.owners).sort((a, b) => b.views - a.views)

  // Per active listing: page views vs showing requests.
  const listingRows = propertiesData.filter((p) => String(p.status || 'active') === 'active').map((p) => {
    const v = rows.filter((r) => r.event === 'view' && r.path === `/property/${p.slug}`)
    return { title: p.title, slug: p.slug, views: v.length, visitors: new Set(v.map((r) => r.sid)).size,
      showings: rows.filter((r) => r.event === 'showing' && r.path === `/property/${p.slug}`).length }
  }).sort((a, b) => b.views - a.views)

  // Where to pay attention. Rules, not magic: each one names a page and a move.
  const attention = []
  const stale = inboxData.items.filter((l) => l.status === 'new' && Date.now() - new Date(l.when) > 24 * 3600 * 1000)
  if (stale.length) attention.push({ level: 'act', text: `${stale.length} lead${stale.length > 1 ? 's' : ''} waiting more than a day: ${stale.slice(0, 3).map((l) => l.name).join(', ')}${stale.length > 3 ? '…' : ''}.`, tab: 'inbox' })
  const waitingTexts = textData.threads.filter((t) => t.unanswered).length
  if (waitingTexts) attention.push({ level: 'act', text: `${waitingTexts} text conversation${waitingTexts > 1 ? 's' : ''} waiting on a reply.`, tab: 'texts' })
  for (const l of lakeRows) {
    if (l.visitors >= 15 && !l.buyers && !l.owners) attention.push({ level: 'watch', text: `${l.lake}: ${l.visitors} people read the page, nobody signed up. Worth a post pointing at the waitlist.`, path: `/lakes/${l.slug}` })
    if (l.owners) attention.push({ level: 'good', text: `${l.owners} owner${l.owners > 1 ? 's' : ''} on ${l.lake} asked for sale updates. Those are future listings; a call beats a text.`, tab: 'inbox' })
  }
  for (const p of listingRows) {
    if (p.visitors >= 12 && !p.showings) attention.push({ level: 'watch', text: `${p.title}: ${p.visitors} people looked, none asked to see it. Check the first photo and the price.`, path: `/property/${p.slug}` })
    if (!p.views && days >= 7) attention.push({ level: 'watch', text: `${p.title}: no page views in ${days} days. Share the link somewhere.`, path: `/property/${p.slug}` })
  }
  const topSrc = now.sources.find((s) => !['direct', 'google.com', 'google'].includes(s.source))
  if (topSrc && now.visitors >= 20 && topSrc.visitors / now.visitors >= 0.3) attention.push({ level: 'good', text: `${topSrc.source} sent ${Math.round((topSrc.visitors / now.visitors) * 100)}% of visitors. Whatever you posted there, do it again.` })
  if (before.visitors >= 20) {
    const pct = Math.round(((now.visitors - before.visitors) / before.visitors) * 100)
    if (pct <= -30) attention.push({ level: 'watch', text: `Visitors down ${Math.abs(pct)}% vs the previous ${days} days.` })
    if (pct >= 30) attention.push({ level: 'good', text: `Visitors up ${pct}% vs the previous ${days} days.` })
  }
  if ((now.events.chat_open || 0) >= 5 && !(now.events.chat_lead || 0)) attention.push({ level: 'watch', text: `${now.events.chat_open} people opened the chat, none left details. Read a few conversations for what they asked.` })
  const mobile = now.devices.find((d) => d.device === 'mobile')
  if (mobile && now.visitors >= 20 && mobile.visitors / now.visitors >= 0.7) attention.push({ level: 'info', text: `${Math.round((mobile.visitors / now.visitors) * 100)}% of visitors are on a phone. Check new pages on yours first.` })
  if (!attention.length) attention.push({ level: 'good', text: now.visitors ? 'Nothing needs attention. Leads answered, pages converting.' : 'No traffic recorded yet in this window.' })

  return { days, window: { start: thisWin[0], end }, now, before: { views: before.views, visitors: before.visitors, leadEvents: before.leadEvents }, lakes: lakeRows, listings: listingRows, attention }
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
  const holly = normalizePhone(process.env.HOLLY_SMS_PHONE || '')
  for (const t of list) {
    t.name = names[t.phone.slice(-10)] || null
    if (holly && t.phone.slice(-10) === holly) { t.name = 'Holly (your cell)'; t.unanswered = false }
  }
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
  for (const p of phones) for (const pre of [`sms/${p}/`, `sms/1${p}/`]) for (const b of await allBlobs(pre)) removed.push(b.pathname)
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
