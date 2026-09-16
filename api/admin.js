import { list, put } from '@vercel/blob'
import { propertiesData } from '../src/data/amenities.js'
import { lakes } from '../src/data/lakes.js'
import { regions } from '../src/data/regions.js'
import { buildReport, sellerKeyFor, SITE } from './lib/report.js'
import { authorize, loginAllowed, mintLinkToken, mintSession, verify } from './lib/admin-auth.js'
import { notifyHolly } from './lib/sms.js'

// Holly's admin. One function, four jobs:
//   POST ?action=login                text Holly a 15-minute login link
//   GET  ?action=session&t=<link>     trade the link for a 30-day session
//   GET  ?view=inbox|waitlist|listings   (bearer: session or ADMIN_SECRET)
//   POST ?action=status  {id, status}    (bearer) flip a lead's status
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
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
    const view = req.query.view
    if (view === 'ping') return res.status(200).json({ ok: true })
    if (view === 'inbox') return res.status(200).json(await inbox())
    if (view === 'waitlist') return res.status(200).json(await waitlist())
    if (view === 'listings') return res.status(200).json(await listings())
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

async function allBlobs(prefix) {
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

async function inbox() {
  const [leadBlobs, waitBlobs, status] = await Promise.all([allBlobs('leads/'), allBlobs('waitlist/'), statusMap()])
  const blobs = [...leadBlobs, ...waitBlobs]
    .filter((b) => b.pathname.endsWith('.json'))
    .sort((a, b) => sortKey(b.pathname).localeCompare(sortKey(a.pathname)))
    .slice(0, MAX_LEADS)
  const items = (await readJson(blobs)).map(normalize).map((l) => ({ ...l, status: status[l.id]?.status || 'new' }))
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
