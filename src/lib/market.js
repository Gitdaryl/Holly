// Market report data for one lake: Holly's sales on the lake this year, the
// surrounding region's sales for context when the lake itself is thin, and
// the numbers a seller asks first (how many, how fast, for how much).
// Everything here is Holly's own sales; the page says so.

import { lakes } from '../data/lakes.js'
import { regions } from '../data/regions.js'
import { propertiesData } from '../data/amenities.js'
import { isSold, isActive, soldStats, trackRecord } from './listing-stats.js'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export function marketFor(lakeSlug) {
  const lake = lakes[lakeSlug]
  if (!lake) return null
  const region = regions[lake.region]
  const year = new Date().getFullYear()

  const onLake = propertiesData.filter((p) => p.lake === lake.slug)
  const inRegion = propertiesData.filter((p) => p.region === lake.region)
  const lakeSold = onLake.filter(isSold).sort((a, b) => String(b.soldOn).localeCompare(String(a.soldOn)))
  const regionSold = inRegion.filter(isSold).sort((a, b) => String(b.soldOn).localeCompare(String(a.soldOn)))

  const stats = (list) => {
    const r = trackRecord(list)
    const prices = list.filter(isSold).map((p) => soldStats(p).soldPrice).filter(Boolean)
    return {
      ...r,
      low: prices.length ? Math.min(...prices) : null,
      high: prices.length ? Math.max(...prices) : null,
      median: prices.length ? median(prices) : null,
      dayOne: list.filter((p) => isSold(p) && soldStats(p).days === 0).length,
    }
  }

  const byMonth = MONTHS.map((m, i) => ({
    month: m,
    lake: lakeSold.filter((p) => new Date(`${p.soldOn}T12:00:00Z`).getUTCMonth() === i).length,
    region: regionSold.filter((p) => new Date(`${p.soldOn}T12:00:00Z`).getUTCMonth() === i).length,
  }))

  return {
    lake, region, year,
    lakeSold, regionSold,
    forSale: onLake.filter(isActive),
    lakeStats: stats(onLake),
    regionStats: stats(inRegion),
    byMonth,
    hasLakeData: lakeSold.length > 0,
  }
}

export function marketIndex() {
  return Object.values(lakes)
    .map((l) => {
      const onLake = propertiesData.filter((p) => p.lake === l.slug)
      const prices = onLake.filter(isSold).map((p) => soldStats(p).soldPrice).filter(Boolean)
      return { lake: l, region: regions[l.region], ...trackRecord(onLake), median: prices.length ? median(prices) : null, high: prices.length ? Math.max(...prices) : null }
    })
    .sort((a, b) => b.sold - a.sold || (b.lake.acres || 0) - (a.lake.acres || 0))
}

// Whole-year totals, the number to lead with before any lake slice.
export function yearTotals() {
  const sold = propertiesData.filter(isSold)
  const prices = sold.map((p) => soldStats(p).soldPrice).filter(Boolean)
  const withLake = sold.filter((p) => p.lake).length
  return { ...trackRecord(propertiesData), median: prices.length ? median(prices) : null, high: prices.length ? Math.max(...prices) : null, dayOne: sold.filter((p) => soldStats(p).days === 0).length, unassigned: sold.length - withLake }
}

function median(nums) {
  const s = [...nums].sort((a, b) => a - b)
  const mid = Math.floor(s.length / 2)
  return s.length % 2 ? s[mid] : Math.round((s[mid - 1] + s[mid]) / 2)
}
