// The demo world the help videos run in: every /api call the desk and the client page make is answered here, in
// memory, with made-up people at made-up addresses ("Sample"). Nothing reaches the real site, Blob, Twilio or
// Claude. Dates are relative to today, so a re-record next spring still looks current.
import { buildSteps, redate, addDays, daysBetween } from '../../src/data/deal-templates.js'

export const IDS = { seller: '0d1e2a3b-4c5d-4e6f-8a7b-9c0d1e2f3a4b', buyer: '1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d' }
const today = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Detroit' })
const stamp = () => new Date().toISOString()

export function demoWorld(base) {
  const T = today()
  const deals = new Map()
  const notes = new Map()
  const sent = new Map()
  const letters = [
    { id: 'l1', templateId: 'accepted', clientName: 'Jordan Sample', subject: "It's accepted: 88 Sample Point Rd", how: 'print', at: new Date(Date.now() - 86400e3 * 6).toISOString() },
  ]
  const link = (id) => `${base}/deal/${id}?k=demo-key-demo-key-12`

  // A seller already under contract: shows on the list, and is the roadmap the stationery video pulls from.
  const sA = addDays(T, -12), sC = addDays(T, 23)
  const seller = {
    id: IDS.seller, side: 'seller', financing: 'financed', lakeHome: true, address: '88 Sample Point Rd', city: 'Irish Hills', lake: '',
    clientName: 'Jordan Sample', clientPhone: '(517) 555-0188', clientEmail: 'jordan@example.com', price: 412000,
    lender: '', titleCompany: 'Sample County Title', acceptedOn: sA, closingOn: sC, status: 'active', internal: '',
    steps: buildSteps({ side: 'seller', financing: 'financed', lakeHome: true, acceptedOn: sA, closingOn: sC }).map((s) => (s.date <= addDays(T, -1) ? { ...s, done: true, doneOn: s.date } : s)),
    createdAt: stamp(), updatedAt: stamp(),
  }
  deals.set(seller.id, seller)

  const progress = (d) => ({ total: d.steps.length, done: d.steps.filter((s) => s.done).length, next: d.steps.find((s) => !s.done) || null })
  const summary = (d) => {
    const n = notes.get(d.id) || []
    const lastC = [...n].reverse().find((x) => x.from === 'client'), lastH = [...n].reverse().find((x) => x.from === 'holly')
    return {
      id: d.id, side: d.side, address: d.address, city: d.city, clientName: d.clientName, clientPhone: d.clientPhone, status: d.status,
      acceptedOn: d.acceptedOn, closingOn: d.closingOn, daysToClose: daysBetween(today(), d.closingOn), progress: progress(d),
      overdue: d.steps.filter((s) => !s.done && s.date && s.date < today()).length, unanswered: Boolean(lastC && (!lastH || lastH.at < lastC.at)), link: link(d.id),
    }
  }
  const note = (id, n) => { const list = notes.get(id) || []; const x = { id: `n${list.length + 1}-${id.slice(0, 4)}`, at: stamp(), ...n }; list.push(x); notes.set(id, list); return x }

  // What "reading the contract" finds, after a pause long enough to see "Reading the contract…"
  const A = addDays(T, -1), C = addDays(T, 42)
  const found = {
    address: '123 Sample Shore Dr, Manitou Beach', price: 489000, buyerNames: 'Pat and Chris Sample', sellerNames: 'R. Seller',
    acceptedOn: A, closingOn: C, financing: 'financed', lender: 'Sample Lakes Credit Union', titleCompany: 'Sample County Title',
    earnestMoney: 5000, earnestDueOn: addDays(A, 3), inspectionEndsOn: addDays(A, 10), financingCommitmentOn: addDays(C, -10),
    possession: 'At closing.', otherDates: [], warnings: [],
  }

  async function handle(route) {
    const req = route.request()
    const u = new URL(req.url())
    const q = Object.fromEntries(u.searchParams)
    const body = req.method() === 'POST' ? (req.postDataJSON() || {}) : {}
    const json = (b, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(b) })

    if (u.pathname === '/api/deal') {
      const d = deals.get(q.id)
      if (!d) return json({ error: 'This roadmap is no longer available.' }, 404)
      if (req.method() === 'POST') {
        const first = d.clientName.split(' ')[0]
        if (body.action === 'ask') return json({ ok: true, note: note(d.id, { from: 'client', kind: 'ask', text: body.message }) })
        if (body.action === 'did') { const s = d.steps.find((x) => x.id === body.stepId); return json({ ok: true, note: note(d.id, { from: 'client', kind: 'did', text: `${first} marked "${s.title}" done.`, stepId: s.id }) }) }
      }
      return json({ ...d, daysToClose: daysBetween(today(), d.closingOn), progress: progress(d), notes: notes.get(d.id) || [], link: link(d.id) })
    }
    if (u.pathname === '/api/admin') {
      const v = q.view, a = q.action
      if (v === 'ping') return json({ ok: true })
      if (v === 'deals') return json({ deals: [...deals.values()].map(summary) })
      if (v === 'deal') { const d = deals.get(q.id); return d ? json({ deal: d, notes: notes.get(d.id) || [], sent: sent.get(d.id) || 0, link: link(d.id) }) : json({ error: 'No such deal.' }, 404) }
      if (v === 'stationery') return json({ ready: false, from: null, reviewUrl: 'https://search.google.com/local/writereview?placeid=demo', recent: [...letters].reverse() })
      if (a === 'deal-extract') { await new Promise((r) => setTimeout(r, 2600)); return json({ found }) }
      if (a === 'deal-save') {
        const inc = body.deal || {}
        const prev = inc.id ? deals.get(inc.id) : null
        let d = { ...(prev || {}), ...inc, id: inc.id || IDS.buyer, price: inc.price ? Number(inc.price) : prev?.price || null, status: inc.status || prev?.status || 'active', updatedAt: stamp(), createdAt: prev?.createdAt || stamp() }
        if (!d.closingOn) d.closingOn = addDays(d.acceptedOn, d.financing === 'cash' ? 30 : 45)
        if (!d.steps || !d.steps.length) d.steps = buildSteps(d)
        if (prev && (prev.closingOn !== d.closingOn || prev.acceptedOn !== d.acceptedOn) && body.redate !== false) d.steps = redate(d.steps, d)
        deals.set(d.id, d)
        return json({ deal: d, link: link(d.id) })
      }
      if (a === 'deal-send') { sent.set(body.id, (sent.get(body.id) || 0) + 1); return json({ ok: true }) }
      if (a === 'deal-reply') return json({ ok: true, note: note(body.id, { from: 'holly', kind: 'reply', text: body.text }), texted: true })
      if (a?.startsWith('stationery-')) {
        const rec = { id: `l${letters.length + 1}`, at: stamp(), templateId: body.templateId, clientName: body.clientName, subject: body.subject || (body.body || '').slice(0, 80), how: a === 'stationery-text' ? 'text' : a === 'stationery-email' ? 'email' : body.how }
        letters.push(rec)
        return json({ ok: true, rec })
      }
      return json({ error: `demo has no answer for ${v || a}` }, 400)
    }
    // anything else the site asks (events feed, reviews, tracking): an empty, harmless answer
    return json({})
  }
  return { handle, deals, notes }
}
