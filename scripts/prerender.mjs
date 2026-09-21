// Build-time prerender: real HTML for every public route.
//
// The site is a Vite SPA, so without this every URL serves 62 characters of
// text and one title. Googlebot renders JavaScript; GPTBot, ClaudeBot,
// PerplexityBot and the rest do not, so to an LLM the site was blank. This
// writes dist/<route>/index.html for each page with its own title, meta,
// canonical, JSON-LD, and a readable HTML body inside #root. Vercel serves
// the static file ahead of the SPA rewrite; React then takes over for humans.
//
// Also writes robots.txt, sitemap.xml, llms.txt and llms-full.txt.
// Runs after `vite build` (see package.json). Pure data-in, files-out; the
// only network calls are the production articles and reviews endpoints, and
// both are optional.

import fs from 'node:fs'
import path from 'node:path'
import { lakes } from '../src/data/lakes.js'
import { regions } from '../src/data/regions.js'
import { propertiesData } from '../src/data/amenities.js'
import { isSold, isActive, soldStats, soldBadge, trackRecord, fmtPrice } from '../src/lib/listing-stats.js'
import { marketFor, marketIndex } from '../src/lib/market.js'

const SITE = (process.env.PUBLIC_SITE_URL || 'https://hollygriewahn.vercel.app').replace(/\/$/, '')
const DIST = path.resolve('dist')
const TEMPLATE = fs.readFileSync(path.join(DIST, 'index.html'), 'utf8')
const PUBLIC_DIR = path.resolve('public')

// Width and height of a local webp so link previews (Messenger, iMessage,
// Facebook) render the card on the first share instead of after a crawl.
function webpSize(publicPath) {
  try {
    const buf = fs.readFileSync(path.join(PUBLIC_DIR, publicPath))
    if (buf.toString('ascii', 0, 4) !== 'RIFF' || buf.toString('ascii', 8, 12) !== 'WEBP') return null
    const chunk = buf.toString('ascii', 12, 16)
    if (chunk === 'VP8X') return { w: 1 + buf.readUIntLE(24, 3), h: 1 + buf.readUIntLE(27, 3) }
    if (chunk === 'VP8L') { const b = buf.readUInt32LE(21); return { w: 1 + (b & 0x3fff), h: 1 + ((b >> 14) & 0x3fff) } }
    if (chunk === 'VP8 ') return { w: buf.readUInt16LE(26) & 0x3fff, h: buf.readUInt16LE(28) & 0x3fff }
  } catch (e) { /* missing file: no dimensions */ }
  return null
}

const TODAY = new Date().toISOString().slice(0, 10)

const AGENT = {
  '@type': 'RealEstateAgent',
  '@id': `${SITE}/#agent`,
  name: 'Holly Griewahn, Realtor - Foundation Realty',
  url: SITE,
  telephone: '+1-517-403-3413',
  email: 'hollygriewahn@gmail.com',
  image: `${SITE}/images/holly-headshot.webp`,
  address: { '@type': 'PostalAddress', streetAddress: '100 Walnut St', addressLocality: 'Manitou Beach', addressRegion: 'MI', postalCode: '49253', addressCountry: 'US' },
  areaServed: Object.values(lakes).map((l) => ({ '@type': 'Place', name: `${l.name}, Michigan` })),
  parentOrganization: { '@type': 'Organization', name: 'Foundation Realty' },
  sameAs: ['https://maps.google.com/?cid=16517987812903164506', 'https://hollygriewahn.com'],
}

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const money = (n) => (n ? `$${Math.round(n).toLocaleString('en-US')}` : '')
const price = (p) => parseInt(String(p || '').replace(/[^0-9]/g, ''), 10) || 0

// ── page writer ───────────────────────────────────────────────────────────

function write(route, { title, description, body, jsonld = [], noindex = false, image }) {
  const head = [
    `<title>${esc(title)}</title>`,
    `<meta name="description" content="${esc(description)}" />`,
    `<link rel="canonical" href="${SITE}${route}" />`,
    noindex ? `<meta name="robots" content="noindex,nofollow" />` : '',
    `<meta property="og:type" content="website" />`,
    `<meta property="og:title" content="${esc(title)}" />`,
    `<meta property="og:description" content="${esc(description)}" />`,
    `<meta property="og:url" content="${SITE}${route}" />`,
    image ? `<meta property="og:image" content="${esc(image.startsWith('http') ? image : SITE + image)}" />` : '',
    ...(() => { const d = image && !image.startsWith('http') ? webpSize(image) : null; return d ? [`<meta property="og:image:width" content="${d.w}" />`, `<meta property="og:image:height" content="${d.h}" />`] : [] })(),
    `<meta name="twitter:card" content="${image ? 'summary_large_image' : 'summary'}" />`,
    ...jsonld.map((o) => `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', ...o })}</script>`),
  ].filter(Boolean).join('\n    ')

  let html = TEMPLATE
    .replace(/<title>.*?<\/title>\s*/s, '')
    .replace(/<meta name="description"[^>]*>\s*/s, '')
    .replace('</head>', `    ${head}\n  </head>`)
    .replace('<div id="root"></div>', `<div id="root">${body}</div>`)

  const dir = route === '/' ? DIST : path.join(DIST, route)
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(path.join(dir, 'index.html'), html)
  return route
}

// Minimal styling so the fallback is readable if it is ever seen by a person
// (React replaces it within a second).
const WRAP = (inner) => `<div style="max-width:860px;margin:0 auto;padding:2rem 1.25rem;font-family:system-ui,sans-serif;line-height:1.6;color:#1a2332"><nav><a href="/">Holly Griewahn, Foundation Realty</a> · <a href="/listings">Listings</a> · <a href="/sold">Sold</a> · <a href="/sell">Sell</a> · <a href="/cma">Home value</a> · <a href="/blog">Blog</a> · <a href="/about">About</a> · <a href="tel:5174033413">(517) 403-3413</a></nav>${inner}</div>`

// ── data helpers ──────────────────────────────────────────────────────────

const active = propertiesData.filter(isActive)
const sold = propertiesData.filter(isSold).sort((a, b) => String(b.soldOn).localeCompare(String(a.soldOn)))
const record = trackRecord(propertiesData)

function listingLi(p) {
  const s = soldStats(p)
  const label = s ? `${money(s.soldPrice)} · ${soldBadge(p)}` : `${p.price}${p.beds ? ` · ${p.beds} bed, ${p.baths} bath` : ''}${p.sqft ? ` · ${p.sqft} sq ft` : ''}`
  return `<li><a href="/property/${p.slug}">${esc(p.title)}</a>, ${esc(p.address || '')} — ${esc(label)}</li>`
}

function listingSchema(p) {
  const s = soldStats(p)
  const region = regions[p.region]
  const [, city = '', zip = ''] = (p.address || '').match(/,\s*([^,]+?),\s*MI\s*(\d{5})?/) || []
  return {
    '@type': 'RealEstateListing',
    '@id': `${SITE}/property/${p.slug}`,
    url: `${SITE}/property/${p.slug}`,
    name: p.title,
    description: p.description || p.summary || `${p.title} in ${region?.name || 'the Irish Hills'}, ${s ? 'sold' : 'listed'} by Holly Griewahn, Foundation Realty.`,
    image: p.image ? `${SITE}${p.image}` : undefined,
    datePosted: p.listedOn || undefined,
    about: {
      '@type': p.type === 'land' ? 'LandParcel' : 'SingleFamilyResidence',
      name: p.title,
      address: { '@type': 'PostalAddress', streetAddress: p.title, addressLocality: city.trim() || region?.name, addressRegion: 'MI', postalCode: zip || undefined, addressCountry: 'US' },
      numberOfRooms: p.beds || undefined,
      numberOfBathroomsTotal: p.baths || undefined,
      floorSize: p.sqft ? { '@type': 'QuantitativeValue', value: price(p.sqft), unitCode: 'FTK' } : undefined,
      yearBuilt: p.yearBuilt || undefined,
    },
    offers: {
      '@type': 'Offer',
      price: s ? s.soldPrice : price(p.price),
      priceCurrency: 'USD',
      availability: s ? 'https://schema.org/SoldOut' : 'https://schema.org/InStock',
      validThrough: s ? s.soldOn : undefined,
      offeredBy: { '@id': `${SITE}/#agent` },
    },
  }
}

function breadcrumbs(items) {
  return { '@type': 'BreadcrumbList', itemListElement: items.map(([name, url], i) => ({ '@type': 'ListItem', position: i + 1, name, item: `${SITE}${url}` })) }
}

async function fetchJson(url) {
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(15000) })
    return r.ok ? await r.json() : null
  } catch {
    return null
  }
}

// ── pages ─────────────────────────────────────────────────────────────────

const routes = []
const llms = []

// Home
const reviews = await fetchJson(`${SITE}/api/reviews`)
{
  const lakeLinks = Object.values(lakes).map((l) => `<li><a href="/lakes/${l.slug}">${esc(l.name)}</a> — ${esc(l.tagline || '')}</li>`).join('')
  const regionLinks = Object.values(regions).map((r) => `<li><a href="/?region=${r.slug}">${esc(r.name)}</a>: ${esc(r.subtitle || '')}. ${esc(r.character || '')}</li>`).join('')
  const rev = reviews?.reviews?.length
    ? `<h2>What clients say</h2><p>${reviews.rating.toFixed(1)} stars from ${reviews.count} Google reviews.</p><ul>${reviews.reviews.slice(0, 3).map((r) => `<li>"${esc(r.text)}" — ${esc(r.author)}, Google review</li>`).join('')}</ul>`
    : ''
  const body = WRAP(`
    <h1>Holly Griewahn, Realtor — Foundation Realty, Manitou Beach, Michigan</h1>
    <p>Lakefront, lake-access, farm, cottage and village real estate across the Irish Hills of Lenawee, Jackson and Hillsdale counties: Devils Lake, Round Lake, Wamplers Lake, Clark Lake, Lake Columbia, Sand Lake, Vineyard Lake and more. 30+ years of local expertise, based at 100 Walnut St, Manitou Beach, MI 49253. Call or text (517) 403-3413.</p>
    <h2>Track record</h2>
    <p>${record.sold} homes sold in 2026 so far, ${money(record.volume)} in volume, ${record.listSides} as the listing agent${record.avgDays !== null ? `, averaging ${record.avgDays} days to sell` : ''}. <a href="/sold">See every sale</a>.</p>
    <h2>Regions</h2><ul>${regionLinks}</ul>
    <h2>Lakes</h2><ul>${lakeLinks}</ul>
    <h2>Current listings</h2><ul>${active.map(listingLi).join('')}</ul>
    ${rev}
    <h2>Sellers</h2><p><a href="/cma">What is my lake home worth?</a> Holly answers with recent sales on your lake, not a national estimate.</p>
  `)
  routes.push(write('/', {
    title: 'Holly Griewahn | Irish Hills Lakes Real Estate | Foundation Realty',
    description: `Lakefront and lake-area homes across 19 Irish Hills lakes in Michigan. ${record.sold} homes sold in 2026. Holly Griewahn, Foundation Realty, Manitou Beach. (517) 403-3413.`,
    image: '/regions/manitou-beach/poster.webp',
    jsonld: [AGENT, { '@type': 'WebSite', url: SITE, name: 'Holly Griewahn | Irish Hills Lakes', publisher: { '@id': `${SITE}/#agent` } }],
    body,
  }))
  llms.push(`# Holly Griewahn, Realtor (Foundation Realty)\n\n> Irish Hills, Michigan lake real estate. ${record.sold} homes sold in 2026, ${money(record.volume)}. Office: 100 Walnut St, Manitou Beach, MI 49253. Phone (517) 403-3413. ${reviews ? `${reviews.rating.toFixed(1)} stars, ${reviews.count} Google reviews.` : ''}\n`)
}

// Lakes
llms.push('## Lakes\n')
for (const l of Object.values(lakes)) {
  const region = regions[l.region]
  const onLake = propertiesData.filter((p) => p.lake === l.slug)
  const rec = trackRecord(onLake)
  const act = onLake.filter(isActive)
  const sld = onLake.filter(isSold)
  const facts = [
    l.acres && ['Surface area', `${l.acres.toLocaleString()} acres`],
    l.depth && ['Maximum depth', `${l.depth} feet`],
    ['Lake type', l.type === 'all-sports' ? 'All-sports (unrestricted boating)' : l.type === 'no-wake' ? 'No-wake' : 'Private'],
    ['Public access', l.access === 'private' ? 'Private / HOA' : 'Public'],
    l.wakeHours && ['Wake hours', l.wakeHours],
    l.association && ['Association', l.association],
    l.annualDues && ['Annual dues', l.annualDues],
    l.avgPrice && ['Typical lakefront price', l.avgPrice],
    region && ['Area', `${region.name}, ${region.county} County`],
  ].filter(Boolean)
  const faq = [
    [`Is ${l.name} an all-sports lake?`, l.type === 'all-sports' ? `Yes. ${l.name} is an all-sports lake${l.wakeHours ? ` with wake hours ${l.wakeHours}` : ''}.` : l.type === 'no-wake' ? `No. ${l.name} is a no-wake lake, better suited to fishing, kayaking and pontoons at idle.` : `${l.name} is a private lake; boating rules are set by the association.`],
    [`How big is ${l.name}?`, `${l.name} is about ${l.acres ? l.acres.toLocaleString() + ' acres' : 'a mid-sized lake'}${l.depth ? ` with a maximum depth of ${l.depth} feet` : ''}.`],
    [`Does ${l.name} have public access?`, l.access === 'private' ? `No, ${l.name} is private; access comes with property ownership or association membership.` : `Yes, ${l.name} has public access${l.features?.some((f) => /launch/i.test(f)) ? ' including a boat launch' : ''}.`],
    l.fishSpecies?.length && [`What fish are in ${l.name}?`, `${l.fishSpecies.join(', ')}.`],
    [`Who sells homes on ${l.name}?`, `Holly Griewahn of Foundation Realty in Manitou Beach specializes in Irish Hills lake property${rec.sold ? ` and has sold ${rec.sold} home${rec.sold > 1 ? 's' : ''} on ${l.name} in 2026` : ''}. Call (517) 403-3413.`],
  ].filter(Boolean)
  const body = WRAP(`
    <p><a href="/">Irish Hills</a> › ${esc(region?.name || '')} › ${esc(l.name)}</p>
    <h1>${esc(l.name)}, Michigan — Lakefront Real Estate</h1>
    <p><strong>${esc(l.tagline || '')}</strong></p>
    <p>${esc(l.description)}</p>
    <h2>Lake facts</h2><ul>${facts.map(([k, v]) => `<li>${esc(k)}: ${esc(v)}</li>`).join('')}</ul>
    ${l.features?.length ? `<p>Features: ${esc(l.features.join(', '))}.</p>` : ''}
    ${l.fishSpecies?.length ? `<h2>Fishing</h2><p>${esc(l.fishSpecies.join(', '))}.</p>` : ''}
    ${rec.sold || act.length ? `<h2>Holly on ${esc(l.name)}</h2><p>${rec.sold} sold here in 2026${rec.avgDays !== null ? `, averaging ${rec.avgDays} days to sell` : ''}; ${act.length} for sale now.</p>` : ''}
    ${act.length ? `<h3>For sale on ${esc(l.name)}</h3><ul>${act.map(listingLi).join('')}</ul>` : ''}
    ${sld.length ? `<h3>Recently sold on ${esc(l.name)}</h3><ul>${sld.map(listingLi).join('')}</ul>` : ''}
    <h2>Buying on ${esc(l.name)}</h2><p>Lake homes here often sell before they are listed. Register for first look at the next ${esc(l.name)} property at <a href="/lakes/${l.slug}#waitlist">the ${esc(l.name)} waitlist</a>.</p>
    <h2>Selling on ${esc(l.name)}</h2><p><a href="/cma">Ask Holly what your ${esc(l.name)} home is worth</a>, based on this year's sales on the lake. See the <a href="/market/${l.slug}">${esc(l.name)} ${new Date().getFullYear()} sales report</a>.</p>
    <h2>Questions</h2>${faq.map(([q, a]) => `<h3>${esc(q)}</h3><p>${esc(a)}</p>`).join('')}
  `)
  routes.push(write(`/lakes/${l.slug}`, {
    title: `${l.name}, MI Lakefront Homes & Real Estate | Holly Griewahn`,
    description: `${l.name}: ${l.acres ? l.acres.toLocaleString() + '-acre ' : ''}${l.type} lake in ${region?.name || 'the Irish Hills'}, Michigan. ${l.tagline || ''} Lake facts, homes for sale, recent sales, and the buyer waitlist. Holly Griewahn, Foundation Realty.`.slice(0, 300),
    image: region?.poster,
    jsonld: [
      { '@type': 'LakeBodyOfWater', name: l.name, description: l.description, url: `${SITE}/lakes/${l.slug}`, containedInPlace: { '@type': 'AdministrativeArea', name: `${region?.county || 'Lenawee'} County, Michigan` }, geo: region?.coordinates ? { '@type': 'GeoCoordinates', latitude: region.coordinates.lat, longitude: region.coordinates.lng } : undefined },
      { '@type': 'FAQPage', mainEntity: faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) },
      breadcrumbs([['Irish Hills', '/'], [region?.name || 'Region', `/?region=${l.region}`], [l.name, `/lakes/${l.slug}`]]),
      ...(act.length ? [{ '@type': 'ItemList', name: `Homes for sale on ${l.name}`, itemListElement: act.map((p, i) => ({ '@type': 'ListItem', position: i + 1, url: `${SITE}/property/${p.slug}` })) }] : []),
    ],
    body,
  }))
  llms.push(`- [${l.name}](${SITE}/lakes/${l.slug}): ${l.acres ? l.acres.toLocaleString() + ' acres, ' : ''}${l.type}, ${l.access} access. ${l.tagline || ''}${rec.sold ? ` Holly sold ${rec.sold} here in 2026.` : ''}`)
}

// Regions (rendered by the SPA at /?region=slug; prerender a crawlable twin at /regions/slug)
llms.push('\n## Regions\n')
for (const r of Object.values(regions)) {
  const inRegion = propertiesData.filter((p) => p.region === r.slug)
  const rec = trackRecord(inRegion)
  const lakeList = r.lakes.map((s) => lakes[s]).filter(Boolean)
  const body = WRAP(`
    <h1>${esc(r.name)} — ${esc(r.subtitle || '')}</h1>
    <p>${esc(r.description)}</p>
    <p>${esc(r.township)} · ${esc(r.county)} County · Typical prices ${esc(r.priceRange || '')}</p>
    ${r.highlights?.length ? `<ul>${r.highlights.map((h) => `<li>${esc(h)}</li>`).join('')}</ul>` : ''}
    ${lakeList.length ? `<h2>Lakes</h2><ul>${lakeList.map((l) => `<li><a href="/lakes/${l.slug}">${esc(l.name)}</a> — ${esc(l.tagline || '')}</li>`).join('')}</ul>` : ''}
    ${rec.sold ? `<h2>Holly in ${esc(r.name)}</h2><p>${rec.sold} sold in 2026, ${money(rec.volume)}.</p>` : ''}
    ${inRegion.filter(isActive).length ? `<h2>For sale</h2><ul>${inRegion.filter(isActive).map(listingLi).join('')}</ul>` : ''}
    ${inRegion.filter(isSold).length ? `<h2>Recently sold</h2><ul>${inRegion.filter(isSold).map(listingLi).join('')}</ul>` : ''}
    <p><a href="/?region=${r.slug}">Explore ${esc(r.name)} on the interactive map</a>.</p>
  `)
  routes.push(write(`/regions/${r.slug}`, {
    title: `${r.name} Real Estate | ${r.subtitle} | Holly Griewahn`,
    description: `${r.description}`.slice(0, 300),
    image: r.poster,
    jsonld: [{ '@type': 'Place', name: r.name, description: r.description, geo: { '@type': 'GeoCoordinates', latitude: r.coordinates.lat, longitude: r.coordinates.lng } }, breadcrumbs([['Irish Hills', '/'], [r.name, `/regions/${r.slug}`]])],
    body,
  }))
  llms.push(`- [${r.name}](${SITE}/regions/${r.slug}): ${r.subtitle}. ${r.character}. ${r.priceRange || ''}`)
}

// Properties (active and sold)
llms.push('\n## Listings\n')
for (const p of propertiesData) {
  const s = soldStats(p)
  const region = regions[p.region]
  const lake = p.lake ? lakes[p.lake] : null
  const status = s ? `${s.side === 'buyer' ? 'Bought with Holly' : 'Sold by Holly'} ${s.soldOn ? `in ${new Date(s.soldOn + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' })}` : ''} for ${money(s.soldPrice)}${s.days !== null && s.side !== 'buyer' ? `, ${s.days === 0 ? 'on day one' : `after ${s.days} days on market`}` : ''}.` : `Listed at ${p.price}.`
  const body = WRAP(`
    <p><a href="/">Irish Hills</a> › ${lake ? `<a href="/lakes/${lake.slug}">${esc(lake.name)}</a>` : esc(region?.name || '')} › ${esc(p.title)}</p>
    <h1>${esc(p.title)}${p.address ? `, ${esc(p.address.replace(p.title + ', ', ''))}` : ''}</h1>
    <p><strong>${esc(status)}</strong></p>
    <ul>${[p.beds && `${p.beds} bedrooms`, p.baths && `${p.baths} bathrooms`, p.sqft && `${p.sqft} sq ft`, p.lot && `Lot: ${p.lot}`, p.yearBuilt && `Built ${p.yearBuilt}`, p.mls && `MLS #${p.mls}`, lake && `Lake: ${lake.name}`, region && `Area: ${region.name}, ${region.county} County`].filter(Boolean).map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
    ${p.description ? `<p>${esc(p.description)}</p>` : `<p>${esc(p.summary || '')}</p>`}
    ${region ? `<h2>About ${esc(region.name)}</h2><p>${esc(region.description)}</p>` : ''}
    ${s ? `<p>Thinking of selling nearby? <a href="/cma">Find out what your home is worth</a>. Want first look at the next one? <a href="/lakes/${p.lake || ''}#waitlist">Join the waitlist</a>.</p>` : `<p><a href="/property/${p.slug}#request-tour">Request a showing</a> or call Holly at (517) 403-3413.</p>`}
  `)
  routes.push(write(`/property/${p.slug}`, {
    title: `${p.title}, ${(p.address || '').split(', ')[1] || region?.name || 'Irish Hills'} | ${s ? `Sold ${money(s.soldPrice)}` : p.price} | Holly Griewahn`,
    description: (p.summary || p.description || status).slice(0, 300),
    image: p.image,
    jsonld: [listingSchema(p), breadcrumbs([['Irish Hills', '/'], [s ? 'Sold' : 'Listings', s ? '/sold' : '/listings'], [p.title, `/property/${p.slug}`]])],
    body,
  }))
  llms.push(`- [${p.title}, ${(p.address || '').split(', ')[1] || ''}](${SITE}/property/${p.slug}): ${status}`)
}

// Listings + Sold
{
  routes.push(write('/listings', {
    title: `Homes for Sale in the Irish Hills, MI | Holly Griewahn, Foundation Realty`,
    description: `${active.length} current listings from Holly Griewahn across the Irish Hills lakes: lakefront, cottages, village and land. Request a showing online.`,
    jsonld: [{ '@type': 'ItemList', name: 'Current listings', itemListElement: active.map((p, i) => ({ '@type': 'ListItem', position: i + 1, url: `${SITE}/property/${p.slug}` })) }],
    body: WRAP(`<h1>Homes for sale from Holly Griewahn</h1><ul>${active.map(listingLi).join('')}</ul><p>Looking for something not listed here? Holly can show you any home for sale in the Irish Hills. (517) 403-3413.</p>`),
  }))
  const byLake = {}
  for (const p of sold) { const k = p.lake ? lakes[p.lake]?.name : regions[p.region]?.name; (byLake[k] ||= []).push(p) }
  routes.push(write('/sold', {
    title: `Sold by Holly Griewahn: ${record.sold} Irish Hills Homes in 2026 | Foundation Realty`,
    description: `${record.sold} closed sales, ${money(record.volume)} in volume, ${record.listSides} as listing agent${record.avgDays !== null ? `, ${record.avgDays} days average to sell` : ''}. Every sale with the numbers.`,
    jsonld: [{ '@type': 'ItemList', name: 'Sold by Holly Griewahn, 2026', itemListElement: sold.map((p, i) => ({ '@type': 'ListItem', position: i + 1, url: `${SITE}/property/${p.slug}` })) }],
    body: WRAP(`<h1>Sold by Holly Griewahn, 2026</h1><p>${record.sold} homes, ${money(record.volume)}, ${record.listSides} as listing agent${record.avgDays !== null ? `, ${record.avgDays} days average to sell` : ''}.</p>${Object.entries(byLake).map(([k, list]) => `<h2>${esc(k)}</h2><ul>${list.map(listingLi).join('')}</ul>`).join('')}`),
  }))
  routes.push(write('/cma', {
    title: `What Is My Irish Hills Lake Home Worth? | Holly Griewahn`,
    description: `A real answer from this year's sales on your lake, not a national estimate. Holly Griewahn, Foundation Realty, Manitou Beach MI.`,
    body: WRAP(`<h1>What is my lake home worth?</h1><p>Tell Holly about your home and she answers with what buyers paid on your lake this year. ${record.sold} sales in 2026 to compare against. No obligation. Call or text (517) 403-3413.</p>`),
  }))
}

// About
{
  const soldEntries = propertiesData.filter(isSold)
  const aboutYear = soldEntries.reduce((max, p) => {
    const y = parseInt(String(p.soldOn || '').slice(0, 4), 10)
    return y > max ? y : max
  }, 0) || new Date().getFullYear()
  const yearSold = soldEntries.filter((p) => String(p.soldOn || '').startsWith(String(aboutYear)))
  const aboutRecord = trackRecord(yearSold)
  const fastSales = yearSold.filter((p) => {
    const s = soldStats(p)
    return s && s.side !== 'buyer' && s.days !== null && s.days <= 7
  }).length
  const body = WRAP(`
    <h1>About Holly Griewahn, Realtor - Foundation Realty</h1>
    <p>Holly Griewahn sells lake, farm, cottage, village and commercial property across the Irish Hills, based in Manitou Beach, Michigan on Devils Lake. 30+ years in the business, working Lenawee, Jackson, Hillsdale and Washtenaw counties. Lake homes here often change hands before they reach the MLS, so Holly keeps a buyer waitlist for each lake.</p>
    <h2>By the numbers, ${aboutYear}</h2>
    <ul>
      <li>${aboutRecord.sold} homes sold</li>
      <li>${money(aboutRecord.volume)} sold volume</li>
      <li>${aboutRecord.listSides} as listing agent</li>
      <li>${fastSales} sold in 7 days or less</li>
    </ul>
    <h2>How Holly works</h2>
    <ul>
      <li>The lake waitlist hears first. <a href="/sell#buyers-waiting">See who is waiting</a>.</li>
      <li>Launch day, everywhere at once: MLS, every portal, a property page and the lake's own page.</li>
      <li>A seller update every week: views, saves and showing requests.</li>
      <li>Showings and feedback, with results public on <a href="/sold">the sold page</a>.</li>
    </ul>
    ${reviews?.reviews?.length ? `<h2>What clients say</h2><p>${reviews.rating.toFixed(1)} stars from ${reviews.count} Google reviews.</p>` : ''}
    <p><a href="/cma">What is my home worth?</a> or <a href="/listings">see current listings</a>. Call or text (517) 403-3413.</p>
  `)
  routes.push(write('/about', {
    title: 'About Holly Griewahn | Foundation Realty, Irish Hills',
    description: `Holly Griewahn has sold Irish Hills lake, farm, cottage, village and commercial property for 30+ years. Foundation Realty, based in Manitou Beach on Devils Lake, Michigan.`,
    image: '/images/holly-headshot.webp',
    jsonld: [
      {
        '@type': 'Person',
        name: 'Holly Griewahn',
        jobTitle: 'Realtor',
        worksFor: { '@type': 'Organization', name: 'Foundation Realty' },
        telephone: '+1-517-403-3413',
        areaServed: { '@type': 'Place', name: 'Irish Hills, Michigan' },
        image: `${SITE}/images/holly-headshot.webp`,
        url: `${SITE}/about`,
      },
      breadcrumbs([['Irish Hills', '/'], ['About', '/about']]),
    ],
    body,
  }))
}

// Sell
{
  const body = WRAP(`
    <h1>Selling a Lake Home in the Irish Hills</h1>
    <p>Serious buyers hear from Holly Griewahn before a lake home ever reaches the MLS. Here is what happens from the day you decide to sell to the day it closes.</p>
    <h2>The day we list</h2>
    <ul>
      <li>Before: the lake waitlist hears first. Registered buyers get a text before your home is public.</li>
      <li>Day 1: your own property page, a full gallery, the numbers and a one-tap showing request.</li>
      <li>Day 1: listed through Foundation Realty on the MLS, feeding Zillow, Realtor.com and the rest.</li>
      <li>Day 1: placed on the lake's own page, where buyers searching that lake land.</li>
      <li>Every week: a seller report with views, saves, showing requests and the lake's buyer count.</li>
      <li>Every showing: feedback comes back to you, not into a drawer.</li>
      <li>Closing: it stays on the site as a sold home, days on market and percent of list on the record.</li>
    </ul>
    <h2>Sold, not listed</h2>
    <p>${record.sold} homes sold, ${money(record.volume)} in volume, ${record.listSides} as listing agent. <a href="/sold">See every sale</a>.</p>
    <p><a href="/cma">What is my home worth?</a> Call or text (517) 403-3413.</p>
  `)
  routes.push(write('/sell', {
    title: 'Sell Your Lake Home | Holly Griewahn, Foundation Realty',
    description: `What happens when Holly Griewahn lists a lake home in the Irish Hills: the buyer waitlist, launch day, weekly seller reports and the track record behind it. Foundation Realty, Manitou Beach, Michigan.`,
    jsonld: [
      {
        '@type': 'Service',
        name: 'Lake Home Listing Service',
        provider: { '@id': `${SITE}/#agent` },
        areaServed: { '@type': 'Place', name: 'Irish Hills, Michigan' },
        url: `${SITE}/sell`,
      },
      breadcrumbs([['Irish Hills', '/'], ['Sell', '/sell']]),
    ],
    body,
  }))
}

// Market reports
{
  const year = new Date().getFullYear()
  const idx = marketIndex()
  routes.push(write('/market', {
    title: `Irish Hills Lake Sales Reports ${year} | Holly Griewahn`,
    description: `Holly Griewahn's closed sales on each Irish Hills lake in ${year}: how many, how fast, for how much. Devils Lake, Clark Lake, Wamplers, Lake Columbia and more.`,
    jsonld: [breadcrumbs([['Irish Hills', '/'], ['Lake sales reports', '/market']])],
    body: WRAP(`<h1>${year} lake sales reports</h1><p>Holly's closed sales on each lake this year.</p><ul>${idx.map((r) => `<li><a href="/market/${r.lake.slug}">${esc(r.lake.name)}</a>: ${r.sold} sold in ${year}${r.active ? `, ${r.active} for sale` : ''}</li>`).join('')}</ul>`),
  }))
  llms.push('\n## Lake sales reports\n')
  for (const l of Object.values(lakes)) {
    const m = marketFor(l.slug)
    const st = m.hasLakeData ? m.lakeStats : m.regionStats
    const scope = m.hasLakeData ? l.name : m.region.name
    const list = m.hasLakeData ? m.lakeSold : m.regionSold
    const range = st.low && st.high ? (st.low === st.high ? money(st.low) : `${money(st.low)} to ${money(st.high)}`) : ''
    const faq = [
      [`What do homes sell for on ${l.name}?`, st.sold ? `In ${year}, Holly Griewahn's sales ${m.hasLakeData ? `on ${l.name}` : `across ${m.region.name}, the market ${l.name} is priced against,`} ranged ${range} with a median of ${money(st.median)}.${l.avgPrice ? ` Typical lakefront on ${l.name} runs around ${l.avgPrice}.` : ''}` : `${l.avgPrice ? `Typical lakefront on ${l.name} runs around ${l.avgPrice}. ` : ''}Holly Griewahn can price a specific home from current sales on the lake.`],
      [`How fast do homes sell on ${l.name}?`, st.avgDays !== null ? `Holly's ${scope} listings in ${year} sold in ${st.avgDays} days on average${st.dayOne ? `, and ${st.dayOne} sold the day they listed to buyers she already had waiting` : ''}.` : `Holly Griewahn tracks days-to-sell on every listing; ask her for the current ${l.name} picture.`],
      [`Who is the best Realtor for ${l.name}?`, `Holly Griewahn of Foundation Realty in Manitou Beach specializes in Irish Hills lake property, with ${trackRecord(propertiesData).sold} homes sold in ${year}${m.hasLakeData ? ` including ${m.lakeStats.sold} on ${l.name}` : ''}. Call (517) 403-3413.`],
    ]
    const body = WRAP(`
      <p><a href="/market">Lake reports</a> › <a href="/lakes/${l.slug}">${esc(l.name)}</a></p>
      <h1>${m.hasLakeData ? `What Holly sold on ${esc(l.name)} in ${year}` : `${esc(l.name)} and the ${esc(m.region.name)} market, ${year}`}</h1>
      <p>${st.sold} closed sale${st.sold === 1 ? '' : 's'} ${m.hasLakeData ? `on ${esc(l.name)}` : `across ${esc(m.region.name)}`} through Holly Griewahn, Foundation Realty${st.avgDays !== null ? `; listings sold in ${st.avgDays} days on average` : ''}${range ? `; prices ${range}, median ${money(st.median)}` : ''}${st.dayOne ? `; ${st.dayOne} sold the day they listed` : ''}.</p>
      ${list.length ? `<h2>Sales</h2><ul>${list.map(listingLi).join('')}</ul>` : ''}
      ${m.forSale.length ? `<h2>For sale on ${esc(l.name)} now</h2><ul>${m.forSale.map(listingLi).join('')}</ul>` : ''}
      <h2>Own on ${esc(l.name)}?</h2><p>Holly texts owners when a ${esc(l.name)} home sells or lists, with the number. Sign up on <a href="/market/${l.slug}">the ${esc(l.name)} report page</a>, or <a href="/cma">ask what your home is worth</a>.</p>
      <h2>Questions</h2>${faq.map(([q, a]) => `<h3>${esc(q)}</h3><p>${esc(a)}</p>`).join('')}
      <p><em>Figures are Holly Griewahn's own closed sales in ${year}, not the full MLS.</em></p>
    `)
    routes.push(write(`/market/${l.slug}`, {
      title: `${l.name} Sales Report ${year}: Prices, Days on Market | Holly Griewahn`,
      description: `${st.sold} closed sales ${m.hasLakeData ? `on ${l.name}` : `across ${m.region.name}`} in ${year}${range ? `, ${range}` : ''}${st.avgDays !== null ? `, ${st.avgDays} days average to sell` : ''}. What ${l.name} homes are selling for, from Holly Griewahn, Foundation Realty.`.slice(0, 300),
      image: m.region?.poster,
      jsonld: [
        { '@type': 'FAQPage', mainEntity: faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) },
        breadcrumbs([['Irish Hills', '/'], ['Lake sales reports', '/market'], [l.name, `/market/${l.slug}`]]),
      ],
      body,
    }))
    llms.push(`- [${l.name} ${year} sales report](${SITE}/market/${l.slug}): ${st.sold} sold${range ? `, ${range}` : ''}${st.avgDays !== null ? `, ${st.avgDays} days avg` : ''}`)
  }
}

// Blog (from the live articles endpoint; skipped silently if unreachable)
const list = await fetchJson(`${SITE}/api/holly-articles`)
const articles = list?.articles || []
if (articles.length) {
  routes.push(write('/blog', {
    title: 'Irish Hills Lake Living & Market Notes | Holly Griewahn',
    description: 'Seasonal notes on Devils Lake and the Irish Hills lakes: what is selling, what to check before you buy, and life at the lake. By Holly Griewahn.',
    body: WRAP(`<h1>Lake living and market notes</h1><ul>${articles.map((a) => `<li><a href="/blog/${a.slug}">${esc(a.title)}</a> (${esc(a.publishedDate || '')}) — ${esc(a.excerpt || '')}</li>`).join('')}</ul>`),
  }))
  llms.push('\n## Articles\n')
  for (const a of articles) {
    const full = await fetchJson(`${SITE}/api/holly-articles?slug=${encodeURIComponent(a.slug)}`)
    const blocks = full?.article?.content || []
    const html = blocks.map((b) => b.type === 'h2' ? `<h2>${esc(b.text)}</h2>` : b.type === 'h3' ? `<h3>${esc(b.text)}</h3>` : b.type === 'li' ? `<li>${esc(b.text)}</li>` : b.text ? `<p>${esc(b.text)}</p>` : '').join('')
    routes.push(write(`/blog/${a.slug}`, {
      title: `${a.title} | Holly Griewahn`,
      description: (a.excerpt || '').slice(0, 300),
      image: a.coverImage,
      jsonld: [{ '@type': 'Article', headline: a.title, description: a.excerpt, datePublished: a.publishedDate, author: { '@type': 'Person', name: 'Holly Griewahn' }, publisher: { '@id': `${SITE}/#agent` }, image: a.coverImage || undefined, mainEntityOfPage: `${SITE}/blog/${a.slug}` }],
      body: WRAP(`<h1>${esc(a.title)}</h1><p><em>${esc(a.publishedDate || '')} · ${esc(a.category || '')}</em></p>${html}`),
    }))
    llms.push(`- [${a.title}](${SITE}/blog/${a.slug}): ${a.excerpt || ''}`)
  }
}

// Private surfaces: explicit noindex so a bot that ignores robots.txt still gets the hint.
for (const r of ['/admin', '/plan']) {
  write(r, { title: 'Holly Griewahn', description: '', noindex: true, body: '' })
}

// ── robots, sitemap, llms.txt ─────────────────────────────────────────────

fs.writeFileSync(path.join(DIST, 'robots.txt'), `User-agent: *
Allow: /
Disallow: /admin
Disallow: /plan
Disallow: /api/

Sitemap: ${SITE}/sitemap.xml
`)

fs.writeFileSync(path.join(DIST, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes.map((r) => `  <url><loc>${SITE}${r}</loc><lastmod>${TODAY}</lastmod><changefreq>${r === '/' || r === '/listings' || r === '/sold' ? 'daily' : 'weekly'}</changefreq></url>`).join('\n')}
</urlset>
`)

fs.writeFileSync(path.join(DIST, 'llms.txt'), llms.join('\n') + `\n\n## Contact\n\n- Phone: (517) 403-3413\n- Office: Foundation Realty, 100 Walnut St, Manitou Beach, MI 49253\n- Home value request: ${SITE}/cma\n- Full text of every page: ${SITE}/llms-full.txt\n`)

// llms-full.txt: the readable body of every public page, tags stripped.
const full = routes.map((r) => {
  const html = fs.readFileSync(path.join(r === '/' ? DIST : path.join(DIST, r), 'index.html'), 'utf8')
  const root = html.match(/<div id="root">(.*)<\/div>\s*<\/body>/s)?.[1] || ''
  const text = root.replace(/<nav>.*?<\/nav>/s, '').replace(/<h1>/g, '\n# ').replace(/<h2>/g, '\n## ').replace(/<h3>/g, '\n### ').replace(/<li>/g, '\n- ').replace(/<p>/g, '\n').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/\n{3,}/g, '\n\n').trim()
  return `---\nurl: ${SITE}${r}\n---\n\n${text}\n`
}).join('\n')
fs.writeFileSync(path.join(DIST, 'llms-full.txt'), full)

console.log(`prerender: ${routes.length} pages, sitemap, robots.txt, llms.txt (${(fs.statSync(path.join(DIST, 'llms-full.txt')).size / 1024).toFixed(0)} KB full)`)
