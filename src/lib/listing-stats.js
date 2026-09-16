// Sold-listing math shared by the property page, the /sold archive, the lake
// pages, and the listing plan. One place so "SOLD in 9 days, 102% of list"
// means the same thing everywhere Holly shows it.
//
// A sold listing carries: status: 'sold', soldOn (YYYY-MM-DD), soldPrice ('$…'),
// and keeps price (the list price) and listedOn. Nothing else changes, and the
// slug never changes, so the engagement history and seller report survive.

export function parsePrice(str) {
  if (typeof str === 'number') return str
  return parseInt(String(str || '').replace(/[$,+\s]/g, ''), 10) || 0
}

export function fmtPrice(n) {
  return n ? `$${Math.round(n).toLocaleString('en-US')}` : ''
}

export function daysBetween(fromISO, toISO) {
  if (!fromISO || !toISO) return null
  const ms = new Date(`${toISO}T12:00:00Z`) - new Date(`${fromISO}T12:00:00Z`)
  return Math.max(0, Math.round(ms / 86400000))
}

export const isSold = (p) => String(p.status || '').toLowerCase() === 'sold'
export const isActive = (p) => String(p.status || 'active').toLowerCase() === 'active'

// { days, pctOfList, soldPrice, listPrice } or null when the listing is not sold.
export function soldStats(p) {
  if (!isSold(p)) return null
  const listPrice = parsePrice(p.price)
  const soldPrice = parsePrice(p.soldPrice) || null // unknown stays unknown, never "100%"
  return {
    // Paragon exports carry DOM directly (list to pending); listings the site
    // tracked itself derive it from the dates.
    days: Number.isInteger(p.dom) ? p.dom : daysBetween(p.listedOn, p.soldOn),
    side: p.side || 'list',
    pctOfList: listPrice && soldPrice ? Math.round((soldPrice / listPrice) * 1000) / 10 : null,
    soldPrice,
    listPrice,
    soldOn: p.soldOn || null,
  }
}

// One-line badge text: "Sold in 9 days at 102% of list". Degrades when a date
// or price is missing rather than printing "NaN".
export function soldBadge(p) {
  const s = soldStats(p)
  if (!s) return null
  if (s.side === 'buyer') return 'Bought with Holly'
  if (s.days === 0) return 'Sold day one'
  const parts = ['Sold']
  if (s.days !== null) parts.push(`in ${s.days} ${s.days === 1 ? 'day' : 'days'}`)
  if (s.pctOfList) parts.push(`at ${s.pctOfList}% of list`)
  return parts.join(' ')
}

// Aggregate for a set of listings (a lake, a region, or everything).
// Averages skip listings missing the underlying field so one undated sale
// does not drag the mean to zero.
export function trackRecord(list) {
  const sold = list.filter(isSold).map(soldStats)
  // Days-to-sell is a listing-agent number, so buyer-side sales stay out of it.
  const withDays = sold.filter((s) => s.days !== null && s.side !== 'buyer')
  const withPct = sold.filter((s) => s.pctOfList)
  const volume = sold.reduce((sum, s) => sum + (s.soldPrice || 0), 0)
  return {
    sold: sold.length,
    active: list.filter(isActive).length,
    listSides: sold.filter((s) => s.side !== 'buyer').length,
    avgDays: withDays.length ? Math.round(withDays.reduce((a, s) => a + s.days, 0) / withDays.length) : null,
    avgPct: withPct.length ? Math.round((withPct.reduce((a, s) => a + s.pctOfList, 0) / withPct.length) * 10) / 10 : null,
    volume,
  }
}

export function fmtSoldDate(iso) {
  if (!iso) return ''
  return new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' })
}
