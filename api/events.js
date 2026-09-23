// GET /api/events
// Proxies the Manitou Beach Michigan events feed. The upstream API sends no
// CORS header, so the browser can't call it directly; this function fetches it
// server-side and hands back a trimmed, sorted list.
//
//   (no params)     the 40-row, 9-key shape the lake-page card has always seen.
//                   Do not change this response: src/components/LakeEvents.jsx
//                   is live on every lake page.
//   ?all=1          up to 120 rows, plus description, timeEnd and a precomputed
//                   deep link. What /events and the newsletter draft use.
//   ?action=health  self-check: did the upstream answer, and with how many.
//
// Never breaks the page: any upstream failure returns 200 with { events: [] }.

import { fetchEvents, CREDIT } from './lib/events-feed.js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')

  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const full = req.query?.all === '1' || req.query?.all === 'true'
  const { events, ok, status, error } = await fetchEvents({ full })

  if (req.query?.action === 'health') {
    res.setHeader('Cache-Control', 'no-store')
    return res.status(200).json({
      ok,
      upstream: status,
      count: events.length,
      error: error || null,
      fetchedAt: new Date().toISOString(),
      credit: CREDIT,
    })
  }

  res.setHeader('Cache-Control', 'public, s-maxage=900, stale-while-revalidate=3600')
  return res.status(200).json({ events })
}
