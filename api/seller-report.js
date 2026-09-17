import { findProperty, buildReport, renderReportHtml, audienceFor, sellerKeyFor, SITE } from './lib/report.js'
import { sanitizeSlug } from './lib/engage-store.js'
import { narrativeFor } from './lib/narrative.js'

// The live seller report. Two audiences, one URL:
//   ?key=<ADMIN_SECRET>      Holly. Sees buyer lead detail. This is the link
//                            she opens on a laptop at a listing appointment.
//   ?key=<seller key>        the seller. Counts only, no buyer PII.
// A per-listing seller key comes from /api/seller-report?slug=x&key=<admin>&links=1

export default async function handler(req, res) {
  const slug = sanitizeSlug(req.query.slug)
  if (!slug) return res.status(400).json({ error: 'slug required' })

  const property = findProperty(slug)
  if (!property) return res.status(404).json({ error: 'listing not found' })

  const audience = audienceFor(slug, req.query.key)
  if (!audience) {
    res.setHeader('Cache-Control', 'no-store')
    return res.status(401).json({ error: 'A valid report key is required.' })
  }

  // Handy for Holly: mint the seller-facing link without running anything local.
  if (req.query.links && audience === 'agent') {
    const key = sellerKeyFor(slug)
    return res.status(200).json({
      slug,
      sellerLink: `${SITE}/api/seller-report?slug=${slug}&key=${key}`,
      agentLink: `${SITE}/api/seller-report?slug=${slug}&key=<ADMIN_SECRET>`,
    })
  }

  const days = Math.min(90, Math.max(1, parseInt(req.query.days, 10) || 7))

  try {
    const report = await buildReport(property, days)
    if (days === 7 && req.query.plain !== '1') report.narrative = await narrativeFor(property, report)
    res.setHeader('Cache-Control', 'no-store')

    if (req.query.format === 'json') {
      const { leadPaths, ...safe } = report
      return res.status(200).json(audience === 'agent' ? report : safe)
    }

    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    return res.status(200).send(renderReportHtml(report, { audience }))
  } catch (err) {
    console.error('seller-report failed:', err)
    return res.status(500).json({ error: err.message })
  }
}
