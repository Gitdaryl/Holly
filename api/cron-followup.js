import { put } from '@vercel/blob'
import { inbox, allBlobs } from './admin.js'
import { notifyHolly, textLead, prettyPhone, normalizePhone, HOLLY_PRETTY } from './lib/sms.js'

// Hourly follow-up. Three jobs, all idempotent through append-only markers:
//
//   1. Holly nudges   a lead still "New" after 1h texts Holly once more, and
//                     once more at 24h, then stops. Several waiting -> one
//                     summary text, not a pile.
//   2. Buyer check-in waitlist buyers hear from Holly on day 3 and day 14,
//                     unless they already texted back, she replied, or the
//                     lead is marked Client or Dead.
//   3. Seller nurture home-value requesters get a 30/60/90-day check-in
//                     under the same rules.
//
// Quiet hours 9pm-8am Eastern: nothing goes out, the next hourly run picks
// it up. ?dry=1 previews without sending or writing markers.
// Markers: admin/nudged/<id>/<n>, admin/checkin/<id>/<n>, admin/nurture/<id>/<n>

const HOUR = 3600 * 1000
const DAY = 24 * HOUR

export default async function handler(req, res) {
  const auth = req.headers.authorization || ''
  const secret = process.env.ADMIN_SECRET
  const isVercelCron = req.headers['user-agent']?.includes('vercel-cron')
  if (!isVercelCron && (!secret || auth !== `Bearer ${secret}`)) return res.status(401).json({ error: 'unauthorized' })

  const dry = req.query.dry === '1'
  const hourET = Number(new Date().toLocaleString('en-US', { timeZone: 'America/Detroit', hour: 'numeric', hour12: false }))
  if (!dry && (hourET < 8 || hourET >= 21)) return res.status(200).json({ ok: true, skipped: 'quiet hours', hourET })

  const { items } = await inbox()
  const now = Date.now()
  const [nudged, checkin, nurture, replied] = await Promise.all([
    levels('admin/nudged/'), levels('admin/checkin/'), levels('admin/nurture/'), engaged(),
  ])
  const age = (l) => now - new Date(l.when).getTime()
  const open = (l) => !['client', 'dead'].includes(l.status)
  const actions = []

  // 1. Holly nudges
  const waiting = items.filter((l) => l.status === 'new' && age(l) >= HOUR)
  const due = waiting.filter((l) => (nudged[l.id] || 0) < (age(l) >= DAY ? 2 : 1))
  if (due.length) {
    const level = (l) => (age(l) >= DAY ? 2 : 1)
    const line = (l) => `${l.name} (${l.source}${l.about ? `, ${l.about}` : ''}, ${hoursAgo(age(l))})${l.phone ? ` ${prettyPhone(l.phone)}` : ''}`
    const text = due.length === 1
      ? `Still waiting on you: ${line(due[0])}. Open your desk or tap to call.`
      : `${due.length} leads still waiting on you:\n${due.slice(0, 4).map(line).join('\n')}${due.length > 4 ? `\n+${due.length - 4} more` : ''}\nOpen your desk when you can.`
    actions.push({ job: 'nudge', to: 'holly', text, ids: due.map((l) => l.id) })
    if (!dry) {
      await notifyHolly(text)
      for (const l of due) await mark('admin/nudged/', l.id, level(l))
    }
  }

  // 2. Waitlist check-ins (day 3, day 14)
  for (const l of items.filter((l) => l.source === 'Waitlist' && l.phone && open(l))) {
    if (replied.has(normalizePhone(l.phone))) continue
    const days = age(l) / DAY
    const step = days >= 14 ? 2 : days >= 3 ? 1 : 0
    if (!step || (checkin[l.id] || 0) >= step) continue
    const first = l.name.split(' ')[0]
    const lake = l.about || 'the lake'
    const text = step === 1
      ? `Hi ${first}, Holly Griewahn here. Anything new on your ${lake} search? If you tell me what you're after (frontage, bedrooms, budget) I'll keep an eye out and text you first when something fits.`
      : `Hi ${first}, quick check-in from Holly. Still looking on ${lake}? Happy to set up a time to talk through what's coming up. Call or text me at ${HOLLY_PRETTY}.`
    actions.push({ job: 'checkin', step, to: l.phone, name: l.name, text })
    if (!dry) {
      const r = await textLead(l.phone, text, { author: 'auto' })
      if (r.ok) await mark('admin/checkin/', l.id, step)
    }
  }

  // 3. Seller nurture (30/60/90)
  for (const l of items.filter((l) => l.source === 'Home value' && l.phone && open(l))) {
    if (replied.has(normalizePhone(l.phone))) continue
    const days = age(l) / DAY
    const step = days >= 90 ? 3 : days >= 60 ? 2 : days >= 30 ? 1 : 0
    if (!step || (nurture[l.id] || 0) >= step) continue
    const first = l.name.split(' ')[0]
    const addr = l.about ? ` on ${l.about}` : ''
    const text = step === 1
      ? `Hi ${first}, Holly Griewahn here. Still thinking about selling${addr}? The number can move month to month on the lake, so if you want a fresh look, just say the word.`
      : step === 2
        ? `Hi ${first}, Holly checking in. If timing on${addr || ' your home'} has changed either way, I'm glad to update the value or just answer questions. No pressure.`
        : `Hi ${first}, last check-in from Holly on${addr || ' your home'}. Whenever you're ready, I'm at ${HOLLY_PRETTY}. Thanks for thinking of me.`
    actions.push({ job: 'nurture', step, to: l.phone, name: l.name, text })
    if (!dry) {
      const r = await textLead(l.phone, text, { author: 'auto' })
      if (r.ok) await mark('admin/nurture/', l.id, step)
    }
  }

  return res.status(200).json({ ok: true, dry, hourET, considered: items.length, actions })
}

// Highest marker level per lead id under a prefix: prefix/<id>/<n>
async function levels(prefix) {
  const out = {}
  for (const b of await allBlobs(prefix)) {
    const [, , id, n] = b.pathname.split('/')
    out[id] = Math.max(out[id] || 0, Number(n) || 0)
  }
  return out
}

// Numbers that already have a real conversation going: an inbound text from
// them, or a reply Holly wrote herself. Automation stays out of those.
async function engaged() {
  const set = new Set()
  const blobs = (await allBlobs('sms/')).filter((b) => /-(in|out)\.json$/.test(b.pathname))
  const inbound = blobs.filter((b) => b.pathname.endsWith('-in.json'))
  for (const b of inbound) set.add(b.pathname.split('/')[1].slice(-10))
  // Holly-authored replies need the content; check only threads not already engaged.
  const outs = blobs.filter((b) => b.pathname.endsWith('-out.json') && !set.has(b.pathname.split('/')[1].slice(-10)))
  for (const b of outs) {
    try {
      const m = await (await fetch(b.url)).json()
      if (m.author === 'holly') set.add(b.pathname.split('/')[1].slice(-10))
    } catch { /* ignore */ }
  }
  return set
}

async function mark(prefix, id, n) {
  await put(`${prefix}${id}/${n}`, String(Date.now()), { access: 'public', addRandomSuffix: false, contentType: 'text/plain' })
}

function hoursAgo(ms) {
  const h = Math.round(ms / HOUR)
  return h < 24 ? `${h}h ago` : `${Math.round(h / 24)}d ago`
}
