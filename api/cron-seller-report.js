import { propertiesData } from '../src/data/amenities.js'
import { buildReport, renderReportHtml, sellerKeyFor, SITE } from './lib/report.js'

// Friday morning: build every active listing's seller report and email the
// finished reports to HOLLY, each with a one-click send link.
//
// The gate is deliberately on the SEND, not the build. An automated email to a
// client's seller carrying a wrong number cannot be recalled, and Holly is the
// one whose name is on it. Same shape as the AI Holly video workflow: the
// machine produces the finished artifact, the human approves the outward step.

export default async function handler(req, res) {
  const auth = req.headers.authorization || ''
  const secret = process.env.ADMIN_SECRET
  const isVercelCron = req.headers['user-agent']?.includes('vercel-cron')
  if (!isVercelCron && (!secret || auth !== `Bearer ${secret}`)) {
    return res.status(401).json({ error: 'unauthorized' })
  }

  const listings = propertiesData.filter((p) => p.status === 'active' && p.sellerEmail)
  if (!listings.length) {
    return res.status(200).json({ ok: true, built: 0, note: 'No active listing has a sellerEmail set.' })
  }

  const results = []
  for (const property of listings) {
    try {
      const report = await buildReport(property, 7)
      const html = renderReportHtml(report, { audience: 'seller' })
      const sendUrl = `${SITE}/api/seller-report-send?slug=${property.slug}&key=${encodeURIComponent(secret || '')}`
      await emailHolly(property, report, html, sendUrl)
      results.push({ slug: property.slug, ok: true, views: report.metrics.views.period })
    } catch (err) {
      console.error(`seller report failed for ${property.slug}:`, err)
      results.push({ slug: property.slug, ok: false, error: err.message })
      await alert(`Seller report FAILED for ${property.slug}: ${err.message}`)
    }
  }

  return res.status(200).json({ ok: true, built: results.length, results })
}

async function emailHolly(property, report, sellerHtml, sendUrl) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) throw new Error('RESEND_API_KEY not set')
  const to = process.env.HOLLY_CONTACT_EMAIL || 'admin@yetigroove.com'
  const m = report.metrics

  const banner = `
    <div style="max-width:640px;margin:0 auto;padding:16px;font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif">
      <div style="background:#1a2332;color:#fff;border-radius:14px;padding:18px 20px">
        <div style="font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#f6a5c9">Ready to send</div>
        <p style="margin:8px 0 14px;font-size:15px;line-height:1.6">
          This week for <strong>${property.title}</strong>: ${m.views.period} views, ${m.saves.period} saves,
          ${m.showings.period} showing requests. Below is exactly what
          ${property.sellerName || 'the seller'} will see.
        </p>
        <a href="${sendUrl}" style="display:inline-block;background:#e84393;color:#fff;text-decoration:none;font-weight:700;font-size:14px;padding:11px 22px;border-radius:10px">
          Send this to ${property.sellerName || 'the seller'}
        </a>
        <p style="margin:12px 0 0;font-size:12px;color:#b8c2cf">Nothing is sent to the seller until you click.</p>
      </div>
    </div>`

  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'Seller Reports <noreply@yetigroove.com>',
      to: [to],
      subject: `Seller report ready: ${property.title} (${m.views.period} views this week)`,
      html: banner + sellerHtml,
    }),
  })
  if (!r.ok) throw new Error(await r.text())
}

async function alert(message) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'Seller Reports <noreply@yetigroove.com>',
      to: [process.env.HOLLY_CONTACT_EMAIL || 'admin@yetigroove.com'],
      subject: 'Seller report job failed',
      html: `<pre style="font-family:monospace">${message}</pre>`,
    }),
  }).catch(() => {})
}
