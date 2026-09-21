// GET /api/events
// Proxies the Manitou Beach Michigan events feed for the lake pages. The
// upstream API sends no CORS header, so the browser can't call it directly;
// this function fetches it server-side and hands back a trimmed, sorted list.
//
// Never breaks the page: any upstream failure returns 200 with { events: [] }.

const UPSTREAM = 'https://manitoubeachmichigan.com/api/events?upcoming=1'
const MAX_EVENTS = 40

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')

  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const r = await fetch(UPSTREAM, { signal: AbortSignal.timeout(6000) })
    if (!r.ok) throw new Error(`upstream ${r.status}`)
    const data = await r.json()
    const today = todayISO()

    const events = (data.events || [])
      .filter((e) => e && e.date && e.date >= today)
      .sort((a, b) => String(a.date).localeCompare(String(b.date)))
      .slice(0, MAX_EVENTS)
      .map((e) => ({
        id: e.id,
        name: e.name,
        date: e.date,
        dateEnd: e.dateEnd || null,
        time: e.time || null,
        location: e.location || null,
        category: e.category || null,
        eventUrl: e.eventUrl || null,
        cost: e.cost || null,
      }))

    res.setHeader('Cache-Control', 'public, s-maxage=900, stale-while-revalidate=3600')
    return res.status(200).json({ events })
  } catch (err) {
    console.error('events proxy failed:', err.message)
    res.setHeader('Cache-Control', 'public, s-maxage=900, stale-while-revalidate=3600')
    return res.status(200).json({ events: [] })
  }
}

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}
