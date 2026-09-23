import { findProperty, buildReport, renderReportHtml } from './lib/report.js'
import { sanitizeSlug } from './lib/engage-store.js'
import { narrativeFor } from './lib/narrative.js'

// Holly's approval step: this is the only endpoint that emails a seller.
// Reached from the "Send this to the seller" button in her Friday email.

export default async function handler(req, res) {
  const slug = sanitizeSlug(req.query.slug)
  const secret = process.env.ADMIN_SECRET
  if (!secret || req.query.key !== secret) return res.status(401).send(page('Not authorized', 'That link is not valid.'))

  const property = findProperty(slug)
  if (!property) return res.status(404).send(page('Listing not found', slug))
  if (!property.sellerEmail) return res.status(400).send(page('No seller email', `${property.title} has no sellerEmail set.`))

  try {
    const report = await buildReport(property, 7)
    report.narrative = await narrativeFor(property, report, { write: false }) || await narrativeFor(property, report)
    const html = renderReportHtml(report, { audience: 'seller' })

    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) throw new Error('RESEND_API_KEY not set')

    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'Holly Griewahn <noreply@yetigroove.com>',
        to: [property.sellerEmail],
        cc: [process.env.HOLLY_CONTACT_EMAIL || 'admin@yetigroove.com'],
        reply_to: process.env.HOLLY_REPLY_TO || process.env.HOLLY_CONTACT_EMAIL || 'admin@yetigroove.com',
        subject: `Your weekly listing report - ${property.title}`,
        html,
      }),
    })
    if (!r.ok) throw new Error(await r.text())

    return res.status(200).send(page('Sent', `The report for ${property.title} went to ${property.sellerEmail}. You are copied.`))
  } catch (err) {
    console.error('seller-report-send failed:', err)
    return res.status(500).send(page('Send failed', err.message))
  }
}

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

const page = (title, body) => `<!doctype html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title></head>
<body style="margin:0;background:#fdf7f5;font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif">
<div style="max-width:460px;margin:14vh auto;padding:32px;background:#fff;border:1px solid #eeddd8;border-radius:16px;text-align:center">
<h1 style="font-size:22px;color:#1c2b29;margin:0 0 10px">${esc(title)}</h1>
<p style="font-size:15px;color:#66706e;line-height:1.6;margin:0">${esc(body)}</p>
</div></body></html>`
