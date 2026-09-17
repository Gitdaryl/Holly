import crypto from 'node:crypto'
import { propertiesData } from '../../src/data/amenities.js'
import { lakes } from '../../src/data/lakes.js'
import { listAll, countInWindow, dailySeries, windowDays, todayISO } from './engage-store.js'
import { verify as verifyAdminToken } from './admin-auth.js'

export const SITE = process.env.PUBLIC_SITE_URL || 'https://hollygriewahn.vercel.app'

const BRAND = {
  navy: '#1a2332',
  pink: '#e84393',
  cream: '#faf9f7',
  line: '#e8e4df',
  muted: '#6b7a8d',
}

export function findProperty(slugOrId) {
  const q = String(slugOrId || '')
  return propertiesData.find((p) => p.slug === q || String(p.id) === q) || null
}

// Per-listing seller link token, derived rather than stored: Holly can hand out
// or regenerate a link without a database, and rotating ADMIN_SECRET invalidates
// every old link at once.
export function sellerKeyFor(slug) {
  const secret = process.env.ADMIN_SECRET
  if (!secret) return null
  return crypto.createHmac('sha256', secret).update(`seller-report:${slug}`).digest('hex').slice(0, 24)
}

// 'agent' sees buyer contact details, 'seller' sees counts only. Buyer PII must
// never land in a seller's inbox.
export function audienceFor(slug, key) {
  if (!key) return null
  const admin = process.env.ADMIN_SECRET
  if (admin && crypto.timingSafeEqual(Buffer.from(pad(key)), Buffer.from(pad(admin)))) return 'agent'
  // A signed admin session (from /admin) opens the agent view too, so Holly
  // never has to see or paste ADMIN_SECRET.
  const session = verifyAdminToken(key)
  if (session && session.k === 'session') return 'agent'
  const expected = sellerKeyFor(slug)
  if (expected && crypto.timingSafeEqual(Buffer.from(pad(key)), Buffer.from(pad(expected)))) return 'seller'
  return null
}

// Fixed-width buffers so timingSafeEqual never throws on a length mismatch,
// which would itself leak length information.
const pad = (s) => String(s).slice(0, 128).padEnd(128, '\0')

export async function buildReport(property, days = 7) {
  const slug = property.slug
  const end = todayISO()
  const thisWindow = windowDays(end, days)
  const priorWindow = windowDays(thisWindow[0], days + 1).slice(0, days)

  // Buyers registered for this listing's lake: the one number on the report
  // that no portal can show a seller.
  const lake = property.lake && lakes[property.lake] ? lakes[property.lake] : null
  const [views, saved, leads, waitlist] = await Promise.all([
    listAll(`engage/${slug}/views/`),
    listAll(`engage/${slug}/events/saved/`),
    listAll(`leads/${slug}/`),
    lake ? listAll(`waitlist/${property.lake}/`).then((r) => ({ ...r, paths: r.paths.filter((p) => !p.endsWith('.owner.json')) })) : Promise.resolve({ paths: [], capped: false }),
  ])

  const win = (paths) => countInWindow(paths, thisWindow[0], thisWindow[days - 1])
  const prior = (paths) => countInWindow(paths, priorWindow[0], priorWindow[days - 1])

  return {
    slug,
    title: property.title,
    price: property.price,
    status: property.status,
    sellerName: property.sellerName,
    sellerEmail: property.sellerEmail,
    generatedAt: new Date().toISOString(),
    window: { start: thisWindow[0], end: thisWindow[days - 1], days },
    daysOnMarket: property.listedOn ? daysBetween(property.listedOn, end) : null,
    metrics: {
      views: { period: win(views.paths), prior: prior(views.paths), total: views.paths.length },
      saves: { period: win(saved.paths), prior: prior(saved.paths), total: saved.paths.length },
      showings: { period: win(leads.paths), prior: prior(leads.paths), total: leads.paths.length },
      waitlist: lake ? { period: win(waitlist.paths), total: waitlist.paths.length, lakeName: lake.name } : null,
    },
    series: dailySeries(views.paths, thisWindow),
    leadPaths: leads.paths,
    capped: views.capped || saved.capped || leads.capped,
  }
}

function daysBetween(fromISO, toISO) {
  const ms = new Date(`${toISO}T12:00:00Z`) - new Date(`${fromISO}T12:00:00Z`)
  return Math.max(0, Math.round(ms / 86400000))
}

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const fmtDate = (iso) =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })

// Percent change, but only when the prior period is big enough for a percentage
// to mean anything. 1 view to 3 is not "up 200%".
function change(period, prior) {
  if (prior < 5) return null
  const pct = Math.round(((period - prior) / prior) * 100)
  if (pct === 0) return null
  return { pct: Math.abs(pct), dir: pct > 0 ? 'up' : 'down' }
}

function statTile(label, value, delta) {
  const arrow = delta
    ? `<div style="font-size:12px;font-weight:600;color:${delta.dir === 'up' ? '#2f855a' : BRAND.muted};margin-top:4px">
         ${delta.dir === 'up' ? '&#9650;' : '&#9660;'} ${delta.pct}% vs prior week</div>`
    : `<div style="font-size:12px;color:${BRAND.muted};margin-top:4px">&nbsp;</div>`
  return `
    <td width="33%" valign="top" style="padding:0 6px">
      <div style="background:#fff;border:1px solid ${BRAND.line};border-radius:14px;padding:18px 16px;text-align:center">
        <div style="font-size:34px;font-weight:800;color:${BRAND.navy};line-height:1.1">${value}</div>
        <div style="font-size:12px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:${BRAND.muted};margin-top:6px">${esc(label)}</div>
        ${arrow}
      </div>
    </td>`
}

// Bar chart built from table cells, not SVG or canvas: this markup has to
// survive Gmail and Outlook as well as a browser.
function barChart(series) {
  const max = Math.max(1, ...series.map((d) => d.count))
  const bars = series
    .map((d) => {
      const h = Math.max(3, Math.round((d.count / max) * 90))
      return `
        <td valign="bottom" align="center" style="padding:0 3px">
          <div style="font-size:11px;font-weight:700;color:${BRAND.navy};margin-bottom:4px">${d.count}</div>
          <div style="height:${h}px;background:${BRAND.pink};border-radius:5px 5px 0 0"></div>
          <div style="font-size:10px;color:${BRAND.muted};padding-top:6px">${fmtDate(d.date)}</div>
        </td>`
    })
    .join('')
  return `
    <div style="background:#fff;border:1px solid ${BRAND.line};border-radius:14px;padding:20px 16px 12px">
      <div style="font-size:12px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:${BRAND.muted};margin-bottom:14px">Page views by day</div>
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation"><tr>${bars}</tr></table>
    </div>`
}

function leadTable(report) {
  if (!report.leadPaths.length) return ''
  const rows = report.leadPaths
    .slice(-12)
    .reverse()
    .map((p) => {
      const seg = p.split('/')
      return `<tr><td style="padding:6px 0;border-bottom:1px solid ${BRAND.line};font-size:13px;color:${BRAND.navy}">${esc(fmtDate(seg[2] || report.window.end))}</td>
        <td style="padding:6px 0;border-bottom:1px solid ${BRAND.line};font-size:13px;color:${BRAND.muted}">${esc(seg[3] || '')}</td></tr>`
    })
    .join('')
  return `
    <div style="background:#fff;border:1px solid ${BRAND.line};border-radius:14px;padding:20px;margin-top:14px">
      <div style="font-size:12px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:${BRAND.muted};margin-bottom:10px">Showing requests (agent view)</div>
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation">${rows}</table>
      <p style="font-size:12px;color:${BRAND.muted};margin:12px 0 0">Full contact details are in your lead email and in Blob under <code>leads/${esc(report.slug)}/</code>. They are never included in the seller's copy.</p>
    </div>`
}

export function renderReportHtml(report, { audience = 'seller' } = {}) {
  const m = report.metrics
  const greeting = report.sellerName ? `${esc(report.sellerName)},` : 'Here is this week&rsquo;s activity.'
  const dom = report.daysOnMarket === null ? '' : ` &middot; ${report.daysOnMarket} days on market`

  const summary =
    m.views.period === 0
      ? 'No traffic recorded this week. If the listing just went live, give it a few days for the page to be indexed and shared.'
      : `${m.views.period} ${m.views.period === 1 ? 'person' : 'people'} viewed your listing page this week, ${m.saves.period} saved it, and ${m.showings.period} asked to see it in person. Since it was listed, the page has been viewed ${m.views.total} times.`

  return `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>Seller Report &middot; ${esc(report.title)}</title></head>
<body style="margin:0;padding:0;background:${BRAND.cream}">
<div style="max-width:640px;margin:0 auto;padding:28px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif">

  <div style="text-align:center;margin-bottom:24px">
    <div style="font-size:13px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:${BRAND.pink}">Weekly Seller Report</div>
    <h1 style="font-size:26px;color:${BRAND.navy};margin:8px 0 4px;line-height:1.25">${esc(report.title)}</h1>
    <div style="font-size:14px;color:${BRAND.muted}">${esc(report.price || '')}${dom}</div>
    <div style="font-size:13px;color:${BRAND.muted};margin-top:6px">${fmtDate(report.window.start)} &ndash; ${fmtDate(report.window.end)}</div>
  </div>

  <p style="font-size:15px;color:${BRAND.navy};line-height:1.65;margin:0 0 20px">
    ${greeting}<br>${summary}
  </p>

  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:0 -6px 14px"><tr>
    ${statTile('Page views', m.views.period, change(m.views.period, m.views.prior))}
    ${statTile('Saved it', m.saves.period, change(m.saves.period, m.saves.prior))}
    ${statTile('Showing requests', m.showings.period, change(m.showings.period, m.showings.prior))}
  </tr></table>

  ${barChart(report.series)}

  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-top:14px">
    <tr><td style="background:#fff;border:1px solid ${BRAND.line};border-radius:14px;padding:18px 20px">
      <div style="font-size:12px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:${BRAND.muted};margin-bottom:10px">Since listed</div>
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
        <tr><td style="font-size:14px;color:${BRAND.navy};padding:4px 0">Total page views</td><td align="right" style="font-size:14px;font-weight:700;color:${BRAND.navy}">${m.views.total}</td></tr>
        <tr><td style="font-size:14px;color:${BRAND.navy};padding:4px 0">Total saves</td><td align="right" style="font-size:14px;font-weight:700;color:${BRAND.navy}">${m.saves.total}</td></tr>
        <tr><td style="font-size:14px;color:${BRAND.navy};padding:4px 0">Total showing requests</td><td align="right" style="font-size:14px;font-weight:700;color:${BRAND.navy}">${m.showings.total}</td></tr>
        ${m.waitlist ? `<tr><td style="font-size:14px;color:${BRAND.navy};padding:4px 0">Buyers registered for ${esc(m.waitlist.lakeName)}${m.waitlist.period ? ` <span style="color:${BRAND.muted};font-size:12px">(+${m.waitlist.period} this week)</span>` : ''}</td><td align="right" style="font-size:14px;font-weight:700;color:${BRAND.navy}">${m.waitlist.total}</td></tr>` : ''}
      </table>
    </td></tr>
  </table>

  ${audience === 'agent' ? leadTable(report) : ''}

  <div style="text-align:center;margin-top:26px;padding-top:20px;border-top:1px solid ${BRAND.line}">
    <a href="${SITE}/property/${esc(report.slug)}" style="display:inline-block;background:${BRAND.pink};color:#fff;text-decoration:none;font-weight:700;font-size:14px;padding:11px 24px;border-radius:10px">View the listing page</a>
    <p style="font-size:13px;color:${BRAND.muted};line-height:1.6;margin:18px 0 0">
      Holly Griewahn &middot; Foundation Realty<br>
      <a href="tel:5174033413" style="color:${BRAND.pink};text-decoration:none">(517) 403-3413</a>
    </p>
    <p style="font-size:11px;color:${BRAND.muted};margin-top:14px">
      Counts are page activity on hollygriewahn.com and do not include MLS or Zillow traffic.
      ${report.capped ? 'Volume exceeded the exact-count ceiling; totals are a floor.' : ''}
    </p>
  </div>
</div></body></html>`
}
