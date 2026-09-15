import { list } from '@vercel/blob'

// Shared read helpers for listing engagement.
//
// Every event is its own tiny blob and the DATE lives in the pathname, so a
// weekly report is a prefix scan plus string parsing. Two reasons for that
// shape:
//   1. Blob CONTENT reads go through a CDN cache, so read-modify-write on a
//      counter JSON silently loses increments. The list API is authoritative.
//   2. The seller report needs "this week", not "ever". Dates in the key mean
//      one list call per counter instead of one per day.
//
// Layout:
//   engage/<slug>/views/<YYYY-MM-DD>/<uuid>          append-only, one per session
//   engage/<slug>/saves/<visitorId>                   current state, put/del toggle
//   engage/<slug>/events/saved/<YYYY-MM-DD>/<uuid>    append-only, for weekly delta
//   leads/<slug>/<YYYY-MM-DD>/<stamp>-<uuid>.json     showing requests

const MAX_PAGES = 20 // 20k events per counter before exact counting stops

// Pulls every blob under a prefix. Returns pathnames, not content.
export async function listAll(prefix) {
  const paths = []
  let cursor
  for (let page = 0; page < MAX_PAGES; page++) {
    const res = await list({ prefix, limit: 1000, cursor })
    for (const b of res.blobs) paths.push(b.pathname)
    if (!res.hasMore) return { paths, capped: false }
    cursor = res.cursor
  }
  return { paths, capped: true }
}

// The date bucket is always the path segment right before the filename.
export function dateOf(pathname) {
  const parts = pathname.split('/')
  const seg = parts[parts.length - 2]
  return /^\d{4}-\d{2}-\d{2}$/.test(seg) ? seg : null
}

// Counts blobs whose date bucket falls in [startISO, endISO], both inclusive.
// Lexical string comparison is correct for YYYY-MM-DD and avoids timezone drift.
export function countInWindow(paths, startISO, endISO) {
  let n = 0
  for (const p of paths) {
    const d = dateOf(p)
    if (d && d >= startISO && d <= endISO) n++
  }
  return n
}

// Daily series across the window, zero-filled, oldest first.
export function dailySeries(paths, days) {
  const counts = new Map(days.map((d) => [d, 0]))
  for (const p of paths) {
    const d = dateOf(p)
    if (d && counts.has(d)) counts.set(d, counts.get(d) + 1)
  }
  return days.map((d) => ({ date: d, count: counts.get(d) }))
}

// Inclusive list of YYYY-MM-DD strings ending at endISO, oldest first.
export function windowDays(endISO, length) {
  const out = []
  const end = new Date(`${endISO}T12:00:00Z`) // noon UTC: no DST edge can shift the date
  for (let i = length - 1; i >= 0; i--) {
    const d = new Date(end)
    d.setUTCDate(d.getUTCDate() - i)
    out.push(d.toISOString().slice(0, 10))
  }
  return out
}

export function todayISO() {
  // Eastern Time is Holly's market; a report generated Friday night must not
  // roll to Saturday because the server runs UTC.
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Detroit' })
}

export const sanitizeSlug = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9-]/g, '')
