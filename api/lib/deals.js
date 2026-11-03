import crypto from 'node:crypto'
import { list, put } from '@vercel/blob'
import { SITE } from './report.js'
import { WHO, SIDES as SIDE_INFO, addDays, daysBetween } from '../../src/data/deal-templates.js'

// A "deal" is one client's transaction roadmap: the dated steps from offer
// accepted to closing, what each one means, and who acts. Holly builds it on
// the desk; the client follows it at /deal/<id>?k=<key>, no account needed.
//
// Storage follows the rest of the site: every write is a NEW blob, never a
// rewrite, because blob content reads are CDN-cached and a read-modify-write
// on one pathname silently serves stale JSON.
//   deals/<id>/v/<ts>.json                 each save; newest pathname wins
//   deals/<id>/notes/<ts>-<from>.json      client questions, Holly's replies
//   deals/<id>/sent/<ts>                   the link was texted (marker)
//   deals/<id>/reminded/<stepId>/<kind>    reminder markers (cron)
//
// The client key is an HMAC of the id under ADMIN_SECRET: nothing to store,
// nothing to expire, and rotating ADMIN_SECRET revokes every link at once
// (same trade-off the desk login already makes).

export const SIDES = ['buyer', 'seller']
export const STATUSES = ['active', 'closed', 'cancelled']
export const WHO_KEYS = Object.keys(WHO)

const secret = () => process.env.ADMIN_SECRET || ''
const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/
const UUID = /^[0-9a-f-]{36}$/

export function dealKey(id) {
  return crypto.createHmac('sha256', secret()).update(`deal:${id}`).digest('base64url').slice(0, 22)
}

export function verifyKey(id, k) {
  if (!secret() || !UUID.test(String(id || '')) || typeof k !== 'string' || k.length !== 22) return false
  const a = Buffer.from(k)
  const b = Buffer.from(dealKey(id))
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}

export const dealLink = (id) => `${SITE}/deal/${id}?k=${dealKey(id)}`

async function pager(prefix) {
  const out = []
  let cursor
  do {
    const page = await list({ prefix, limit: 1000, cursor })
    out.push(...page.blobs)
    cursor = page.hasMore ? page.cursor : null
  } while (cursor)
  return out
}

async function readJSON(url) {
  try {
    const r = await fetch(url, { cache: 'no-store' })
    return r.ok ? await r.json() : null
  } catch {
    return null
  }
}

const str = (v, max = 300) => String(v == null ? '' : v).trim().slice(0, max)
const day = (v) => (ISO_DAY.test(String(v || '')) ? String(v) : null)

// Shapes an incoming deal from the desk into exactly what gets stored. Throws
// on anything that would make the client page unreadable.
export function normalizeDeal(input, existing = null) {
  const b = input || {}
  const side = SIDES.includes(b.side) ? b.side : existing?.side || 'buyer'
  const acceptedOn = day(b.acceptedOn) || existing?.acceptedOn || null
  if (!acceptedOn) throw Object.assign(new Error('Enter the date the offer was accepted.'), { status: 400 })
  const financing = b.financing === 'cash' ? 'cash' : existing?.financing || 'financed'
  // No closing date yet: use the template default so the steps and the page agree.
  const closingOn = day(b.closingOn) || existing?.closingOn || addDays(acceptedOn, SIDE_INFO[side].closeDaysDefault[financing])
  const address = str(b.address, 160) || existing?.address || ''
  if (!address) throw Object.assign(new Error('Enter the property address.'), { status: 400 })
  const clientName = str(b.clientName, 80) || existing?.clientName || ''
  if (!clientName) throw Object.assign(new Error('Enter the client\'s name.'), { status: 400 })
  const rawSteps = Array.isArray(b.steps) ? b.steps.slice(0, 60) : existing?.steps || []
  const steps = rawSteps.map((s, i) => ({
    id: /^[a-z0-9-]{1,40}$/.test(String(s?.id || '')) ? s.id : `step-${i + 1}-${crypto.randomUUID().slice(0, 6)}`,
    title: str(s?.title, 90) || `Step ${i + 1}`,
    who: WHO_KEYS.includes(s?.who) ? s.who : 'both',
    detail: str(s?.detail, 600),
    action: str(s?.action, 600),
    note: str(s?.note, 600),
    remind: s?.remind !== false,
    offset: s?.offset && ['A', 'C'].includes(s.offset.from) && Number.isFinite(Number(s.offset.days)) ? { from: s.offset.from, days: Number(s.offset.days) } : null,
    date: day(s?.date),
    done: Boolean(s?.done),
    doneOn: day(s?.doneOn) || (s?.done ? new Date().toISOString().slice(0, 10) : null),
    link: s?.link && /^https:\/\//.test(String(s.link.url || '')) ? { label: str(s.link.label, 60) || 'Open', url: str(s.link.url, 500) } : null,
  }))
  return {
    id: existing?.id || (UUID.test(String(b.id || '')) ? b.id : crypto.randomUUID()),
    side,
    financing,
    lakeHome: Boolean(b.lakeHome),
    address,
    city: str(b.city, 80),
    lake: str(b.lake, 60),
    clientName,
    clientPhone: str(b.clientPhone, 30).replace(/[^\d+() .-]/g, '').trim(),
    clientEmail: /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(b.clientEmail || '')) ? str(b.clientEmail, 120) : '',
    price: Number.isFinite(Number(b.price)) && Number(b.price) > 0 ? Math.round(Number(b.price)) : null,
    lender: str(b.lender, 80),
    titleCompany: str(b.titleCompany, 80),
    acceptedOn,
    closingOn,
    status: STATUSES.includes(b.status) ? b.status : existing?.status || 'active',
    internal: str(b.internal, 1000),
    steps,
    createdAt: existing?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

export async function saveDeal(deal) {
  await put(`deals/${deal.id}/v/${Date.now()}.json`, JSON.stringify(deal, null, 2), { access: 'public', addRandomSuffix: false, contentType: 'application/json' })
  return deal
}

export async function loadDeal(id) {
  if (!UUID.test(String(id || ''))) return null
  const blobs = await pager(`deals/${id}/v/`)
  if (!blobs.length) return null
  const latest = blobs.sort((a, b) => (a.pathname < b.pathname ? 1 : -1))[0]
  return readJSON(latest.url)
}

export async function listDeals() {
  const blobs = (await pager('deals/')).filter((b) => /^deals\/[0-9a-f-]{36}\/v\/\d+\.json$/.test(b.pathname))
  const latest = new Map()
  for (const b of blobs) {
    const id = b.pathname.split('/')[1]
    const cur = latest.get(id)
    if (!cur || b.pathname > cur.pathname) latest.set(id, b)
  }
  const deals = (await Promise.all([...latest.values()].map((b) => readJSON(b.url)))).filter(Boolean)
  const rank = { active: 0, closed: 1, cancelled: 2 }
  return deals.sort((a, b) => (rank[a.status] - rank[b.status]) || String(a.closingOn || '').localeCompare(String(b.closingOn || '')))
}

export async function addNote(id, { from, kind = 'ask', text, stepId = null, name = '' }) {
  const at = new Date().toISOString()
  const note = { id: crypto.randomUUID(), from, kind, text: str(text, 1000), stepId, name: str(name, 80), at }
  await put(`deals/${id}/notes/${at.replace(/[:.]/g, '-')}-${from}.json`, JSON.stringify(note), { access: 'public', addRandomSuffix: false, contentType: 'application/json' })
  return note
}

export async function loadNotes(id) {
  const blobs = await pager(`deals/${id}/notes/`)
  const notes = (await Promise.all(blobs.map((b) => readJSON(b.url)))).filter(Boolean)
  return notes.sort((a, b) => String(a.at).localeCompare(String(b.at)))
}

// Client-side abuse guard: one roadmap should never produce more than a
// handful of notes a day. list() is authoritative (pathnames, not content).
export async function notesToday(id) {
  const today = new Date().toISOString().slice(0, 10)
  return (await pager(`deals/${id}/notes/${today}`)).length
}

export async function markSent(id) {
  await put(`deals/${id}/sent/${Date.now()}`, '1', { access: 'public', addRandomSuffix: false, contentType: 'text/plain' })
}

export async function sentCount(id) {
  return (await pager(`deals/${id}/sent/`)).length
}

export async function reminded(id) {
  const set = new Set()
  for (const b of await pager(`deals/${id}/reminded/`)) set.add(b.pathname.split('/').slice(3).join('/'))
  return set
}

export async function markReminded(id, stepId, kind) {
  await put(`deals/${id}/reminded/${stepId}/${kind}`, String(Date.now()), { access: 'public', addRandomSuffix: false, contentType: 'text/plain' })
}

// ── derived views ──────────────────────────────────────────────────────

export function progress(deal) {
  const total = deal.steps.length
  const done = deal.steps.filter((s) => s.done).length
  const next = deal.steps.find((s) => !s.done) || null
  return { total, done, next }
}

export function todayET() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Detroit' })
}

// What the client page receives: the roadmap and nothing Holly keeps to herself.
export function publicView(deal, notes = []) {
  const { internal, clientEmail, ...rest } = deal
  const today = todayET()
  return {
    ...rest,
    daysToClose: deal.closingOn ? daysBetween(today, deal.closingOn) : null,
    progress: progress(deal),
    notes: notes.map(({ id, from, kind, text, stepId, at }) => ({ id, from, kind, text, stepId, at })),
    link: dealLink(deal.id),
  }
}

export function summary(deal, notes = []) {
  const p = progress(deal)
  const today = todayET()
  const overdue = deal.steps.filter((s) => !s.done && s.date && s.date < today).length
  const lastClientNote = [...notes].reverse().find((n) => n.from === 'client')
  const lastHollyNote = [...notes].reverse().find((n) => n.from === 'holly')
  const unanswered = lastClientNote && (!lastHollyNote || lastHollyNote.at < lastClientNote.at)
  return {
    id: deal.id, side: deal.side, address: deal.address, city: deal.city, clientName: deal.clientName, clientPhone: deal.clientPhone,
    status: deal.status, acceptedOn: deal.acceptedOn, closingOn: deal.closingOn, daysToClose: deal.closingOn ? daysBetween(today, deal.closingOn) : null,
    progress: p, overdue, unanswered: Boolean(unanswered), updatedAt: deal.updatedAt, link: dealLink(deal.id),
  }
}

// ── calendar ───────────────────────────────────────────────────────────

const icsEscape = (s) => String(s || '').replace(/\\/g, '\\\\').replace(/;/g, '\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n')

// One all-day event per dated step (or one step when stepId is given). Dates
// are floating all-day values, so they land on the right day in any zone.
export function ics(deal, stepId = null) {
  const steps = deal.steps.filter((s) => s.date && (!stepId || s.id === stepId))
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Holly Griewahn//Roadmap//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH']
  for (const s of steps) {
    const d = s.date.replace(/-/g, '')
    lines.push(
      'BEGIN:VEVENT',
      `UID:${deal.id}-${s.id}@hollygriewahn`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${d}`,
      `DTEND;VALUE=DATE:${addDays(s.date, 1).replace(/-/g, '')}`,
      `SUMMARY:${icsEscape(`${s.title} · ${deal.address}`)}`,
      `DESCRIPTION:${icsEscape(`${s.detail}${s.action ? `\n\nWhat to do: ${s.action}` : ''}\n\nYour roadmap: ${dealLink(deal.id)}`)}`,
      `LOCATION:${icsEscape(deal.address)}`,
      'END:VEVENT',
    )
  }
  lines.push('END:VCALENDAR')
  return lines.join('\r\n') + '\r\n'
}
