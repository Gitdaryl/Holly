import Anthropic from '@anthropic-ai/sdk'
import { list, put } from '@vercel/blob'
import { lakes } from '../../src/data/lakes.js'
import { regions } from '../../src/data/regions.js'
import { marketFor } from '../../src/lib/market.js'

// The written part of the seller report: what happened, what the market is
// doing, what Holly recommends. Claude drafts it from the report's own
// numbers and Holly's sales on the lake; nothing outside those facts. The
// draft is stored per listing per week so the email Holly approves on
// Monday is the email the seller receives when she clicks send.

const money = (n) => (n ? `$${Math.round(n).toLocaleString('en-US')}` : '')
// Page counters exist from the day the site's storage went live; a listing
// older than that has history the numbers cannot see.
const TRACKING_SINCE = '2026-09-16'

function facts(property, report) {
  const m = report.metrics
  const lake = property.lake ? lakes[property.lake] : null
  const region = regions[property.region]
  const mk = property.lake ? marketFor(property.lake) : null
  const scope = mk ? (mk.hasLakeData ? mk.lakeStats : mk.regionStats) : null
  const scopeName = mk ? (mk.hasLakeData ? lake.name : region?.name) : region?.name
  const soldLines = mk
    ? (mk.hasLakeData ? mk.lakeSold : mk.regionSold).slice(0, 6).map((p) => `${p.title}: ${p.soldPrice}, ${Number.isInteger(p.dom) ? (p.dom === 0 ? 'sold day one' : `${p.dom} days on market`) : ''}`)
    : []
  const month = new Date().toLocaleDateString('en-US', { month: 'long', timeZone: 'America/Detroit' })
  return `Listing: ${property.title}, ${property.address || ''}. List price ${property.price}. ${property.beds ? `${property.beds} bed / ${property.baths} bath. ` : ''}${lake ? `On ${lake.name} (${lake.type}${lake.acres ? `, ${lake.acres} acres` : ''}). ` : ''}Days on market: ${report.daysOnMarket ?? 'unknown'}. Month: ${month}.
This week on the listing page: ${m.views.period} views (prior week ${m.views.prior}), ${m.saves.period} saves (prior ${m.saves.prior}), ${m.showings.period} showing requests (prior ${m.showings.prior}). Since page counting began on ${TRACKING_SINCE}${property.listedOn && property.listedOn < TRACKING_SINCE ? ` (the listing went live ${property.listedOn}, before counting started, so earlier activity is not in these numbers and the totals must not be read as a slow start)` : ''}: ${m.views.total} views, ${m.saves.total} saves, ${m.showings.total} showing requests.
${m.waitlist ? `Buyers registered on Holly's ${m.waitlist.lakeName} waitlist: ${m.waitlist.total} (${m.waitlist.period} new this week).` : ''}
Holly's ${new Date().getFullYear()} sales ${scopeName ? `in ${scopeName}` : ''}: ${scope ? `${scope.sold} sold, median ${money(scope.median)}, range ${money(scope.low)} to ${money(scope.high)}, ${scope.avgDays !== null ? `${scope.avgDays} days average to sell` : ''}, ${scope.dayOne} sold day one.` : 'none recorded.'}
${soldLines.length ? `Recent: ${soldLines.join('; ')}.` : ''}
Seasonal note: Irish Hills lake buyers are most active late spring through Labor Day; September and October bring serious, fewer buyers; winter is slow with dock-out and frozen lakes.`
}

const SYSTEM = `You write Holly Griewahn's weekly update to a home seller. Holly is a Realtor with Foundation Realty in Manitou Beach, Michigan. Write as Holly, first person, warm and direct, the way a trusted local agent talks. Plain language, short sentences, no jargon, no em dashes, no exclamation marks, no markdown.
Use only the facts provided. Never invent showings, offers, competitor listings, or prices.
Fair Housing: describe the property, the price, and the market. Never describe or suggest the kind of people who live, belong, or would be happy somewhere (families, retirees, professionals, quiet types, and so on), and never reference protected characteristics. If a number is zero, say so plainly and explain what it means at this point in the season. Do not pad.
Return JSON with three keys:
"summary": 2 to 4 sentences on what happened this week on their listing, in context of the prior week and totals.
"market": 2 to 3 sentences on what Holly's sales on their lake or area say about pricing and pace right now.
"recommendation": 1 to 2 sentences on the next step. Be specific: hold, adjust, a photo or description change, an open house, or simply wait through a date. If there is nothing to change, say to hold and name when to revisit.`

export async function draftNarrative(property, report) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return null
  const client = new Anthropic({ apiKey })
  // Sonnet 5 thinks before it answers by default; the reasoning eats the
  // token budget and truncates the JSON. This is a short writing task.
  const r = await client.messages.create({
    model: 'claude-sonnet-5',
    max_tokens: 1500,
    thinking: { type: 'disabled' },
    system: SYSTEM,
    messages: [{ role: 'user', content: facts(property, report) }],
  })
  const text = r.content.filter((b) => b.type === 'text').map((b) => b.text).join('')
  const json = text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1)
  const out = JSON.parse(json)
  if (!out.summary || !out.recommendation) throw new Error('narrative incomplete')
  return { summary: String(out.summary), market: String(out.market || ''), recommendation: String(out.recommendation), model: 'claude-sonnet-5', writtenAt: new Date().toISOString() }
}

// One narrative per listing per report week. The cron writes it Monday; the
// send endpoint and the live report read the same one back.
export async function narrativeFor(property, report, { write = true } = {}) {
  const key = `reports/${property.slug}/${report.window.end}.json`
  try {
    const { blobs } = await list({ prefix: key, limit: 1 })
    if (blobs.length) return await (await fetch(blobs[0].url, { cache: 'no-store' })).json()
  } catch (err) {
    console.error('narrative read failed:', err.message)
  }
  if (!write) return null
  try {
    const n = await draftNarrative(property, report)
    if (n) await put(key, JSON.stringify(n, null, 2), { access: 'public', addRandomSuffix: false, contentType: 'application/json' })
    return n
  } catch (err) {
    console.error('narrative draft failed:', err.message)
    return null
  }
}
