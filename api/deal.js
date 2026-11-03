import { loadDeal, verifyKey, publicView, loadNotes, addNote, notesToday, ics } from './lib/deals.js'
import { notifyHolly, prettyPhone } from './lib/sms.js'
import { SITE } from './lib/report.js'

// The client's side of a transaction roadmap. No account: the link Holly
// texts carries the key, and the key is all this endpoint checks.
//   GET  /api/deal?id=&k=              the roadmap (public view) + notes
//   GET  /api/deal?id=&k=&ics=1[&step=] all dates (or one) as a calendar file
//   POST /api/deal?id=&k=  {action:'ask', message}        question for Holly
//   POST /api/deal?id=&k=  {action:'did', stepId}         "I did this" on a client step
// Every write persists first; the text to Holly is best-effort.

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')
  const { id, k } = req.query
  if (!verifyKey(id, k)) return res.status(404).json({ error: 'This link is not valid. Ask Holly to send it again.' })
  const deal = await loadDeal(id)
  if (!deal) return res.status(404).json({ error: 'This roadmap is no longer available.' })

  if (req.method === 'GET') {
    if (req.query.ics === '1') {
      const stepId = String(req.query.step || '').replace(/[^a-z0-9-]/g, '') || null
      res.setHeader('Content-Type', 'text/calendar; charset=utf-8')
      res.setHeader('Content-Disposition', `attachment; filename="${stepId || 'roadmap'}-${deal.address.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.ics"`)
      return res.status(200).send(ics(deal, stepId))
    }
    return res.status(200).json(publicView(deal, await loadNotes(id)))
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const { action } = req.body || {}
  if ((await notesToday(id)) >= 30) return res.status(429).json({ error: 'That is plenty for today. Call or text Holly directly.' })
  const first = deal.clientName.split(' ')[0]
  const deskLink = `${SITE}/admin?tab=deals&id=${deal.id}`

  if (action === 'ask') {
    const message = String(req.body.message || '').trim().slice(0, 1000)
    if (message.length < 2) return res.status(400).json({ error: 'Type your question first.' })
    const note = await addNote(id, { from: 'client', kind: 'ask', text: message, name: deal.clientName })
    await notifyHolly(`${first} asked on the ${deal.address} roadmap:\n"${message.slice(0, 300)}"\nReply on your desk: ${deskLink}${deal.clientPhone ? `\nor text ${prettyPhone(deal.clientPhone)}` : ''}`)
    return res.status(200).json({ ok: true, note })
  }

  if (action === 'did') {
    const stepId = String(req.body.stepId || '')
    const step = deal.steps.find((s) => s.id === stepId)
    if (!step) return res.status(400).json({ error: 'That step is not on this roadmap.' })
    if (step.who !== 'you') return res.status(400).json({ error: 'Only your own steps can be marked done here.' })
    const note = await addNote(id, { from: 'client', kind: 'did', text: `${first} marked "${step.title}" done.`, stepId, name: deal.clientName })
    await notifyHolly(`${first} says "${step.title}" is done on ${deal.address}. Confirm it on your desk: ${deskLink}`)
    return res.status(200).json({ ok: true, note })
  }

  return res.status(400).json({ error: 'unknown action' })
}
