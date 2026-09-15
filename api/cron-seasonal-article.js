// Vercel Cron: 1st of every month, 8am ET (13:00 UTC).
// Writes "Irish Hills this month": what the lakes are doing this season,
// Holly's current listings, upcoming local events from manitoubeachmichigan.com,
// and a short note from Holly. Needs nothing in the content calendar.
//
// Manual: GET /api/cron-seasonal-article?dry=1 returns the article without saving.
// One article per month; a second run in the same month exits early.
//
// Ground rules baked into the prompt: every number comes from the data passed in.
// No invented market stats, no made-up events, no prices not in the feed.

import Anthropic from '@anthropic-ai/sdk';
import { propertiesData, propertyTypes } from '../src/data/amenities.js';
import { regions } from '../src/data/regions.js';
import { loadCorpus, repairJson, findArticleBySlug, saveArticle } from './lib/article-utils.js';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const SITE_URL = process.env.SITE_URL || 'https://hollygriewahn.vercel.app';
const EVENTS_URL = 'https://manitoubeachmichigan.com/api/events';
const EVENTS_PAGE = 'https://manitoubeachmichigan.com/events';
const EVENT_WINDOW_DAYS = 45;
const MAX_EVENTS = 8;

// What lake country is actually doing each month. General, checkable, no numbers.
const SEASON_NOTES = {
  1: 'Deep winter. Lakes are frozen, ice fishing shanties are out on Devils Lake, and the village is quiet. Buyers who look now have the least competition of the year; sellers who list now stand out because almost nobody else does.',
  2: 'Still frozen, still quiet. Cottage owners are thinking about spring projects. Serious buyers start touring because they want to close before the docks go in.',
  3: 'Ice-out month. Water opens up, roads get soft, and the first lake-home listings of the year start to appear. Spring inventory is being decided right now in kitchens around the lake.',
  4: 'Docks and hoists start going back in. Contractors are booked, so buyers should plan inspections early. This is the front edge of the spring selling season.',
  5: 'Memorial Day weekend opens the lake season. Boats launch, seasonal businesses reopen, and showings compete with people simply enjoying the water.',
  6: 'Peak lake life begins. Long evenings, fireworks planning, full marinas. Homes show their best now and buyers can see exactly what summer here looks like.',
  7: 'The busiest month on the water. Fourth of July on Devils Lake, live music in the village, rentals full. Buyers touring now see the lake at full volume, which is honest.',
  8: 'Late summer. Warm water, calmer weekends after the holiday rush, and the first sellers who want to close before the season ends. A good month to negotiate.',
  9: 'The lake exhales. Kids are back in school, weekends are quieter, docks start coming out at the end of the month. Fall color is a few weeks away and prices tend to soften with the crowds.',
  10: 'Fall color month. Hayes State Park and the Irish Hills are at their best. Cottages get winterized, and buyers who tour now see the property with the leaves down and nothing to hide.',
  11: 'Docks are out, boats are stored, and the lake goes still. Sellers who stay on the market now are motivated. Holiday events bring the village back to life on weekends.',
  12: 'Holiday season around the lake: lighted parades, village events, quiet snowy shorelines. A slow market month, which is exactly why a serious buyer can do well in it.',
};

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function fmtDate(iso) {
  const d = new Date(`${iso}T12:00:00-04:00`);
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'America/Detroit' });
}

async function upcomingEvents(now) {
  try {
    const res = await fetch(EVENTS_URL, { headers: { 'User-Agent': 'holly-site-seasonal-article' } });
    if (!res.ok) return [];
    const { events = [] } = await res.json();
    const start = now.toISOString().slice(0, 10);
    const endDate = new Date(now.getTime() + EVENT_WINDOW_DAYS * 86400000).toISOString().slice(0, 10);
    const inWindow = events
      .filter(e => e.date && e.date >= start && e.date <= endDate && e.name)
      .sort((a, b) => a.date.localeCompare(b.date));
    // One per name so a weekly recurring event does not eat the whole list.
    const seen = new Set();
    const picked = [];
    for (const e of inWindow) {
      const key = e.name.toLowerCase().replace(/\s+/g, ' ').trim();
      if (seen.has(key)) continue;
      seen.add(key);
      picked.push({
        name: e.name,
        date: fmtDate(e.date),
        ...(e.dateEnd && e.dateEnd !== e.date ? { through: fmtDate(e.dateEnd) } : {}),
        time: e.time || null,
        location: e.location || null,
        category: e.category || null,
        // Blank cost is NOT free; only pass a cost when the organizer set one.
        cost: e.cost || null,
        description: (e.description || '').replace(/\s+/g, ' ').slice(0, 240),
      });
      if (picked.length >= MAX_EVENTS) break;
    }
    return picked;
  } catch {
    return [];
  }
}

function listingsSummary() {
  const active = propertiesData.filter(p => p.status === 'active');
  return active.map(p => ({
    title: p.title,
    address: p.address,
    price: p.price,
    type: propertyTypes[p.type]?.label || p.type,
    area: regions[p.region]?.name || p.region,
    ...(p.beds ? { beds: p.beds, baths: p.baths } : {}),
    ...(p.sqft ? { sqft: p.sqft } : {}),
    ...(p.lot ? { lot: p.lot } : {}),
    summary: p.summary,
    url: `/property/${p.id}`,
  }));
}

function coverFor(month) {
  // Prefer a lake photo over a storefront for the cover.
  const lake = propertiesData.filter(p => p.image && (p.type === 'lakefront' || p.type === 'lake-access'));
  const pool = lake.length ? lake : propertiesData.filter(p => p.image);
  if (!pool.length) return null;
  return `${SITE_URL}${pool[month % pool.length].image}`;
}

export async function buildSeasonalArticle(now = new Date()) {
  const month = now.getMonth() + 1;
  const monthName = MONTHS[month - 1];
  const year = now.getFullYear();
  const slug = `irish-hills-${monthName.toLowerCase()}-${year}`;

  const [events, corpus] = await Promise.all([upcomingEvents(now), Promise.resolve(loadCorpus())]);
  const listings = listingsSummary();

  const systemPrompt = `You are writing a monthly article for Holly Griewahn's website in Holly's own first-person voice. Holly is a real estate agent with Foundation Realty in Manitou Beach, Michigan, and has sold lake property in the Irish Hills for over 30 years.

${corpus}

=== HARD RULES ===
1. Every number, price, date, address, and event in the article must come from the DATA below. Do not invent market statistics, percentages, median prices, days-on-market figures, or events. If you want to say something about the market, say it qualitatively and seasonally.
2. Do not claim an event is free unless its cost says so. If cost is missing, do not mention cost.
3. Write at a 7th-8th grade level. Short paragraphs, 2-3 sentences.
4. Subheadings as questions where natural.
5. First person, warm, specific, local. Sound like a neighbor who happens to know every lake, not a brochure.
6. Never use banned phrases. Never use em dashes.
7. 900-1300 words. One CTA near the end using the CTA links.
8. Structure, in this order:
   - Opening: what ${monthName} feels like around Devils Lake and the Irish Hills (use the SEASON NOTE, in your own words).
   - "What's the market doing this month?": seasonal, qualitative advice for buyers and sellers. Then a short "What I have listed right now" list: one bulleted_list_item per listing, format "Title, Price: one-line summary". Do not put URL paths in the bullets; after the list, add one paragraph saying all of them are on the Listings page with photos.
   - "What's happening around the lake?": the upcoming EVENTS as bulleted_list_item entries with name, date, time, and place; one line of why it's worth going. Close this section by pointing readers to ${EVENTS_PAGE} for the full calendar. If EVENTS is empty, write a short paragraph about the season instead and still point to the calendar.
   - "A note from Holly": 3-4 sentences about who she is and how she works, drawn from BRAND POSITIONING. Personal, not a resume.
   - CTA paragraph.
   - 3-4 FAQs a buyer or seller would actually ask in ${monthName}.

Return ONLY valid JSON:
{
  "title": "...",
  "excerpt": "One sentence, max 160 chars",
  "editorsNote": "1-2 sentences from Holly",
  "category": "Seasonal",
  "tags": ["...", "..."],
  "blocks": [{"type": "paragraph|heading_2|heading_3|quote|callout|divider|bulleted_list_item|numbered_list_item", "text": "..."}],
  "faqs": [{"question": "...", "answer": "..."}]
}`;

  const userPrompt = `=== DATE ===
${monthName} ${year}

=== SEASON NOTE ===
${SEASON_NOTES[month]}

=== HOLLY'S ACTIVE LISTINGS ===
${JSON.stringify(listings, null, 1)}

=== EVENTS (next ${EVENT_WINDOW_DAYS} days, from manitoubeachmichigan.com) ===
${events.length ? JSON.stringify(events, null, 1) : 'NONE'}

Write the ${monthName} ${year} article.`;

  const message = await client.messages.create({
    model: 'claude-sonnet-5',
    max_tokens: 6000,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  });

  const text = message.content.find(b => b.type === 'text')?.text;
  if (!text) {
    throw new Error(`No text block in model response (stop_reason=${message.stop_reason}, blocks=${message.content.map(b => b.type).join(',')})`);
  }
  const article = JSON.parse(repairJson(text));
  return { slug, article, monthName, year, events, listings, coverImageUrl: coverFor(month) };
}

export default async function handler(req, res) {
  const dry = req.query?.dry === '1';
  const now = new Date();

  try {
    const month = now.getMonth() + 1;
    const slug = `irish-hills-${MONTHS[month - 1].toLowerCase()}-${now.getFullYear()}`;

    if (!dry) {
      const existing = await findArticleBySlug(slug);
      if (existing) {
        console.log(`[cron-seasonal-article] ${slug} already exists, skipping`);
        return res.status(200).json({ skipped: true, slug });
      }
    }

    const built = await buildSeasonalArticle(now);

    if (dry) {
      return res.status(200).json({ dry: true, ...built });
    }

    const autonomous = process.env.AUTO_PUBLISH_MODE === 'autonomous';
    const notionUrl = await saveArticle({
      article: built.article,
      slug: built.slug,
      category: 'Seasonal',
      coverImageUrl: built.coverImageUrl,
      autonomous,
    });

    console.log(`[cron-seasonal-article] Saved "${built.article.title}" (${autonomous ? 'published' : 'draft'})`);
    return res.status(200).json({
      success: true,
      slug: built.slug,
      title: built.article.title,
      mode: autonomous ? 'autonomous' : 'safe',
      events: built.events.length,
      listings: built.listings.length,
      notionUrl,
    });
  } catch (err) {
    console.error('[cron-seasonal-article]', err.message);
    return res.status(500).json({ error: err.message });
  }
}
