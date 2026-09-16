import { put, list } from '@vercel/blob'
import { lakes } from '../src/data/lakes.js'
import { sanitizeSlug, todayISO, listAll } from './lib/engage-store.js'
import { saveLeadToNotion } from './lib/leads.js'
import { notifyHolly, textLead, HOLLY_PRETTY, prettyPhone } from './lib/sms.js'
import { audienceFor } from './lib/report.js'

// Buyer waitlist per lake. "Tell me when something comes up on Clark Lake."
//
// Two jobs:
//   1. Buyer side: first look before a listing hits the MLS.
//   2. Seller side: Holly walks into a listing appointment with "I have 14
//      buyers registered for Round Lake." No other agent here can say that.
//
// POST /api/waitlist?lake=<slug>          body { name, phone, email, budget, timing, notes }
// GET  /api/waitlist?lake=<slug>          { lake, count }              public, count only
// GET  /api/waitlist?all=1                { counts: { <lake>: n } }    public, counts only
// GET  /api/waitlist?lake=<slug>&key=ADMIN full entries for Holly
//
// PERSIST FIRST, notify second. Layout mirrors leads/:
//   waitlist/<lake>/<YYYY-MM-DD>/<stamp>-<uuid>.json
// Counts come from list(), never from a read-modify-write JSON (CDN cache).

export default async function handler(req, res) {
  if (req.method === 'GET') return get(req, res)
  if (req.method === 'POST') return post(req, res)
  return res.status(405).json({ error: 'Method not allowed' })
}

async function get(req, res) {
  res.setHeader('Cache-Control', 'no-store')

  if (req.query.all) {
    const { paths } = await listAll('waitlist/')
    const counts = {}
    for (const p of paths) {
      const lake = p.split('/')[1]
      counts[lake] = (counts[lake] || 0) + 1
    }
    return res.status(200).json({ counts, total: paths.length })
  }

  const lake = sanitizeSlug(req.query.lake)
  if (!lake || !lakes[lake]) return res.status(400).json({ error: 'unknown lake' })

  // Holly's view: every registration with contact details.
  if (req.query.key) {
    if (audienceFor(lake, req.query.key) !== 'agent') return res.status(401).json({ error: 'admin key required' })
    const entries = []
    let cursor
    do {
      const page = await list({ prefix: `waitlist/${lake}/`, limit: 1000, cursor })
      for (const b of page.blobs) {
        try {
          const r = await fetch(b.url, { cache: 'no-store' })
          entries.push(await r.json())
        } catch (err) {
          console.error('waitlist read failed', b.pathname, err.message)
        }
      }
      cursor = page.hasMore ? page.cursor : null
    } while (cursor)
    entries.sort((a, b) => String(b.receivedAt).localeCompare(String(a.receivedAt)))
    return res.status(200).json({ lake, name: lakes[lake].name, count: entries.length, entries })
  }

  const { paths } = await listAll(`waitlist/${lake}/`)
  return res.status(200).json({ lake, name: lakes[lake].name, count: paths.length })
}

async function post(req, res) {
  const lake = sanitizeSlug(req.query.lake)
  if (!lake || !lakes[lake]) return res.status(400).json({ error: 'unknown lake' })

  const { name, phone, email, budget, timing, notes } = req.body || {}
  if (!name || (!phone && !email)) return res.status(400).json({ error: 'Name and a phone or email are required.' })

  const entry = {
    lake,
    lakeName: lakes[lake].name,
    name: String(name).slice(0, 200),
    phone: phone ? String(phone).slice(0, 50) : null,
    email: email ? String(email).slice(0, 200) : null,
    budget: budget ? String(budget).slice(0, 100) : null,
    timing: timing ? String(timing).slice(0, 100) : null,
    notes: notes ? String(notes).slice(0, 2000) : null,
    receivedAt: new Date().toISOString(),
    userAgent: req.headers['user-agent'] || null,
  }

  // 1. Persist.
  try {
    const stamp = entry.receivedAt.replace(/[:.]/g, '-')
    await put(
      `waitlist/${lake}/${todayISO()}/${stamp}-${crypto.randomUUID()}.json`,
      JSON.stringify(entry, null, 2),
      { access: 'public', addRandomSuffix: false, contentType: 'application/json' },
    )
  } catch (err) {
    console.error('Waitlist persist failed:', err)
    return res.status(500).json({ error: 'Could not save your request. Please call or text Holly directly.' })
  }

  // 2. Notify, best-effort, in parallel. Nothing here can lose the entry.
  const first = entry.name.split(' ')[0]
  const interest = [
    `Wants first look on ${entry.lakeName}`,
    entry.budget && `Budget: ${entry.budget}`,
    entry.timing && `Timing: ${entry.timing}`,
    entry.notes,
  ].filter(Boolean).join('. ')

  const [notion, sms, reply, count] = await Promise.all([
    saveLeadToNotion({ name: entry.name, email: entry.email, phone: entry.phone, interest, region: lakes[lake].region, source: 'Lake Waitlist' })
      .then(() => true).catch((err) => { console.error('Waitlist Notion save failed:', err.message); return false }),
    notifyHolly(`New buyer on ${entry.lakeName}: ${entry.name}${entry.budget ? `, ${entry.budget}` : ''}${entry.timing ? `, ${entry.timing.toLowerCase()}` : ''}.${entry.notes ? `\nWants: ${entry.notes.slice(0, 160)}` : ''}\n${entry.phone ? `Call: ${prettyPhone(entry.phone)}` : `Email: ${entry.email}`}`),
    entry.phone
      ? textLead(entry.phone, `Hi ${first}, Holly Griewahn here (Foundation Realty). You're on my ${entry.lakeName} list. When something comes up you'll hear from me before it hits the market. Anything specific you're after? Text me here or call ${HOLLY_PRETTY}.`)
      : Promise.resolve({ ok: false }),
    listAll(`waitlist/${lake}/`).then((r) => r.paths.length).catch(() => null),
  ])

  return res.status(200).json({ success: true, count, notion, sms: sms.ok, autoReply: reply.ok })
}
