// The Manitou Beach Michigan events feed, in one place.
//
// This module is the only thing that knows the upstream URL, how to build a
// deep link to an event, and how to trim a raw upstream record. The /api/events
// proxy, the prerender script and the newsletter draft all read through here so
// the three cannot drift apart.
//
// The upstream sends no CORS header, which is why the browser never calls it
// directly. Nothing here throws: a dead upstream yields an empty list.

const ORIGIN = 'https://manitoubeachmichigan.com'

export const UPSTREAM = `${ORIGIN}/api/events?upcoming=1`
export const CREDIT = { name: 'Manitou Beach Michigan', url: ORIGIN }
export const EVENTS_INDEX = `${ORIGIN}/events`

// Only about 1 in 6 upstream records carries eventUrl, so never rely on it.
// The canonical detail page is always /events/<id>.
export const EVENT_PAGE = (id) => (id ? `${ORIGIN}/events/${id}` : EVENTS_INDEX)

const TIMEOUT_MS = 6000
const MAX_EVENTS = 40        // the lake-page card's long-standing cap
const MAX_EVENTS_FULL = 120  // the feed ran to 64 in Sep 2026; leave headroom

export function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

// The 9-key shape every caller has seen since this feed shipped. Do not add to
// it: LakeEvents and anything else on the default response depends on it.
function trim(e) {
  return {
    id: e.id,
    name: e.name,
    date: e.date,
    dateEnd: e.dateEnd || null,
    time: e.time || null,
    location: e.location || null,
    category: e.category || null,
    eventUrl: e.eventUrl || null,
    cost: e.cost || null,
  }
}

// What an actual events page needs. `url` is precomputed so no caller has to
// know the deep-link rule.
function trimFull(e) {
  return {
    ...trim(e),
    description: e.description || null,
    timeEnd: e.timeEnd || null,
    url: EVENT_PAGE(e.id),
  }
}

// Returns { events, ok, status } so a caller can report health without a
// second request. Never throws.
export async function fetchEvents({ full = false } = {}) {
  try {
    const r = await fetch(UPSTREAM, { signal: AbortSignal.timeout(TIMEOUT_MS) })
    if (!r.ok) throw new Error(`upstream ${r.status}`)
    const data = await r.json()
    const today = todayISO()

    const events = (data.events || [])
      .filter((e) => e && e.date && e.date >= today)
      .sort((a, b) => String(a.date).localeCompare(String(b.date)))
      .slice(0, full ? MAX_EVENTS_FULL : MAX_EVENTS)
      .map(full ? trimFull : trim)

    return { events, ok: true, status: r.status }
  } catch (err) {
    console.error('events feed failed:', err.message)
    return { events: [], ok: false, status: 0, error: err.message }
  }
}
