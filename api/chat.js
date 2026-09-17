// POST /api/chat
// Accepts: { messages: [{role, content}], sessionId }
// Returns: { reply: string }
//
// The system prompt is built from the same data files the site renders, so
// the chat cannot disagree with the pages: every lake's facts, the live
// listings, this year's sales, and what Holly can do next for the visitor.
// The facts block is identical between requests, so it is marked for
// Anthropic prompt caching and costs almost nothing after the first call.

import Anthropic from '@anthropic-ai/sdk';
import { lakes } from '../src/data/lakes.js';
import { regions } from '../src/data/regions.js';
import { propertiesData } from '../src/data/amenities.js';
import { isActive, isSold, soldStats, trackRecord } from '../src/lib/listing-stats.js';
import { SITE } from './lib/report.js';

const money = (n) => (n ? `$${Math.round(n).toLocaleString('en-US')}` : '');

function buildFacts() {
  const lakeList = Object.values(lakes).sort((a, b) => (b.acres || 0) - (a.acres || 0));
  const lakeLines = lakeList.map((l) => {
    const r = regions[l.region];
    const rec = trackRecord(propertiesData.filter((p) => p.lake === l.slug));
    const bits = [
      l.acres ? `${l.acres.toLocaleString()} acres` : null,
      l.depth ? `${l.depth} ft deep` : null,
      l.type === 'all-sports' ? 'all-sports' : l.type === 'no-wake' ? 'no-wake' : 'private',
      l.access === 'private' ? 'private access' : 'public access',
      l.wakeHours ? `wake hours ${l.wakeHours}` : null,
      l.association ? `association: ${l.association}${l.annualDues ? ` (${l.annualDues})` : ''}` : null,
      l.avgPrice ? `typical lakefront ${l.avgPrice}` : null,
      l.fishSpecies?.length ? `fish: ${l.fishSpecies.join(', ')}` : null,
      rec.sold ? `Holly sold ${rec.sold} here in 2026` : null,
      rec.active ? `${rec.active} for sale now` : null,
    ].filter(Boolean).join('; ');
    return `- ${l.name} (${r?.name || ''}, ${r?.county || ''} County): ${bits}. ${l.tagline || ''} Page: ${SITE}/lakes/${l.slug}`;
  });

  const biggest = lakeList[0];
  const biggestPrivate = lakeList.find((l) => l.access === 'private');

  const active = propertiesData.filter(isActive).map((p) => {
    const lk = p.lake ? lakes[p.lake]?.name : null;
    return `- ${p.title}, ${(p.address || '').split(', ')[1] || regions[p.region]?.name}: ${p.price}${p.beds ? `, ${p.beds} bed/${p.baths} bath` : ''}${p.sqft ? `, ${p.sqft} sq ft` : ''}${p.lot ? `, ${p.lot}` : ''}${lk ? `, on ${lk}` : ''}. ${p.summary || ''} ${SITE}/property/${p.slug}`;
  });

  const rec = trackRecord(propertiesData);
  const sold = propertiesData.filter(isSold).map((p) => {
    const s = soldStats(p);
    return `- ${p.title}, ${(p.address || '').split(', ')[1] || ''}: ${money(s.soldPrice)}, ${s.side === 'buyer' ? "Holly's buyer" : s.days === 0 ? 'sold day one' : `${s.days} days on market`}${p.lake ? `, ${lakes[p.lake]?.name}` : ''}`;
  });

  const regionLines = Object.values(regions).map((r) => `- ${r.name}: ${r.subtitle}. ${r.description} Typical prices ${r.priceRange || 'vary'}. Lakes: ${r.lakes.map((s) => lakes[s]?.name).filter(Boolean).join(', ') || 'none'}.`);

  return `## Lakes Holly covers (sorted by size)
${lakeLines.join('\n')}

Size facts, get these right: the biggest lake in the territory is ${biggest.name} at about ${biggest.acres.toLocaleString()} acres (the largest inland lake in Lenawee County). ${biggestPrivate ? `${biggestPrivate.name} (${biggestPrivate.acres} acres) is the largest PRIVATE lake, not the largest lake.` : ''}

## Regions
${regionLines.join('\n')}

## Holly's listings for sale right now (${active.length})
${active.join('\n') || '- none at the moment'}

## Holly's 2026 sales (${rec.sold} homes, ${money(rec.volume)}, ${rec.listSides} as listing agent${rec.avgDays !== null ? `, listings sold in ${rec.avgDays} days on average` : ''})
${sold.join('\n')}

## Things you can point people to
- Any lake page has a "Get first look" waitlist: Holly texts registered buyers before a listing hits the MLS. Link: ${SITE}/lakes/<lake-slug>#waitlist
- Sellers: "What's my home worth" at ${SITE}/cma. Holly answers from this year's sales on their lake.
- Every sale with the numbers: ${SITE}/sold
- Holly's Google reviews: 5.0 stars, 40+ reviews.`;
}

const PERSONA = `You are the assistant on Holly Griewahn's website. Holly is a Realtor with Foundation Realty in Manitou Beach, Michigan, 30+ years in the Irish Hills, office at 100 Walnut St, phone (517) 403-3413. You sound like a friendly local who knows every lake and back road.

## How to behave
- Answer from the facts below. If something is not in the facts, say you're not sure and offer to have Holly text them. Never invent prices, acreage, dates or listing details.
- Keep replies to 2 to 4 sentences unless a real explanation is needed. Plain language: "lake house", not "waterfront residential property".
- When a lake comes up, mention what Holly has done there if the facts show it, and offer the waitlist link for that lake. When selling comes up, offer the home-value link.
- Practical knowledge you can share: lakefront means the lot touches the water; lake access means a deeded right to use the lake without touching it (usually 30 to 60 percent cheaper). All-sports allows motorboats; no-wake is for fishing and paddling. Most lake homes are on septic and a well; seawall and dock condition matter at inspection. Private lakes carry association dues.
- If they want Holly, collect their first name and phone (or email) and tell them Holly will text them shortly. If they'd rather call: (517) 403-3413.
- Prices, acreage and days-on-market are quoted exactly as they appear in the facts, never rounded to fit a question. If nothing matches a budget or filter, say so plainly and show the closest ones at their real prices.
- Plain text only: no markdown, no asterisks, no bold, no bullet lists. Write links as plain URLs. Never use em dashes or en dashes.
- You are not Holly and do not pretend to be; say "Holly" in the third person.

`;

let cachedFacts = null;
const systemBlocks = () => {
  if (!cachedFacts) cachedFacts = buildFacts();
  return [
    { type: 'text', text: PERSONA },
    { type: 'text', text: cachedFacts, cache_control: { type: 'ephemeral' } },
  ];
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { messages } = req.body || {};
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages array required' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('ANTHROPIC_API_KEY not set');
    return res.status(500).json({ error: 'Chat service not configured' });
  }

  try {
    const client = new Anthropic({ apiKey });
    const safeMessages = messages
      .filter((m) => m.role && m.content && typeof m.content === 'string')
      .slice(-20)
      .map((m) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content.slice(0, 2000) }));

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 500,
      system: systemBlocks(),
      messages: safeMessages,
    });

    const reply = response.content[0]?.text || "I'm not sure about that one. Call Holly directly at (517) 403-3413 and she'll have the answer.";
    return res.status(200).json({ reply });
  } catch (err) {
    console.error('Chat API error:', err.message);
    return res.status(500).json({ error: 'Chat service unavailable. Call Holly at (517) 403-3413.' });
  }
}
