// Event selection and grouping, shared by the "Coming up around {lake}" card
// and the /events page. Pure functions, no React, no fetching.
//
// TOWN_KEYWORDS is the one that must not fork: it decides which lake page
// claims which event, and a second copy would quietly diverge.

export const TOWN_KEYWORDS = {
  'manitou-beach': ['Manitou Beach', 'Devils Lake', 'Addison'],
  'onsted-hayes': ['Onsted', 'Hayes'],
  'cambridge-corridor': ['Cambridge', 'Onsted', 'US-12', 'Brooklyn'],
  'clark-lake': ['Clark Lake', 'Brooklyn'],
  'brooklyn-columbia': ['Brooklyn', 'Columbia'],
  'jerome-somerset': ['Jerome', 'Somerset'],
  'southern-lakes': ['Hudson', 'Osseo', 'Pittsford'],
  'grass-lake-michigan-center': ['Grass Lake', 'Michigan Center'],
  'tecumseh-eastern': ['Tecumseh'],
};

const DAY_MS = 24 * 60 * 60 * 1000;

// Noon avoids the UTC-vs-local off-by-one that turns "Jul 4" into "Jul 3".
export const dateOf = (iso) => (iso ? new Date(`${iso}T12:00:00`) : null);

export function shortDate(iso) {
  const d = dateOf(iso);
  if (!d || Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export function monthLabel(iso) {
  const d = dateOf(iso);
  if (!d || Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export function upcomingWithin(events, days) {
  const now = new Date();
  const cutoff = new Date(now.getTime() + days * DAY_MS);
  return (events || []).filter((e) => {
    const d = dateOf(e.date);
    return d && !Number.isNaN(d.getTime()) && d >= now && d <= cutoff;
  });
}

// Events whose location names one of this region's towns, backfilled with the
// soonest events overall once local runs thin. The whole feed is Irish Hills,
// so a backfilled row is still relevant, just less local.
export function localFirst(events, regionSlug, { min = 3, max = 4 } = {}) {
  const keywords = TOWN_KEYWORDS[regionSlug] || [];
  const matchesTown = (e) =>
    keywords.some((k) => (e.location || '').toLowerCase().includes(k.toLowerCase()));

  const rows = (events || []).filter(matchesTown).slice(0, max);
  if (rows.length < min) {
    const used = new Set(rows.map((e) => e.id));
    for (const e of events || []) {
      if (rows.length >= max) break;
      if (used.has(e.id)) continue;
      rows.push(e);
      used.add(e.id);
    }
  }
  return rows;
}

// [{ key: '2026-10', label: 'October 2026', events: [...] }], in date order.
export function groupByMonth(events) {
  const months = new Map();
  for (const e of events || []) {
    const key = String(e.date || '').slice(0, 7);
    if (!key) continue;
    if (!months.has(key)) months.set(key, { key, label: monthLabel(e.date), events: [] });
    months.get(key).events.push(e);
  }
  return [...months.values()].sort((a, b) => a.key.localeCompare(b.key));
}

// [{ name, count }] by frequency, for the filter chips.
export function categories(events) {
  const counts = new Map();
  for (const e of events || []) {
    if (!e.category) continue;
    counts.set(e.category, (counts.get(e.category) || 0) + 1);
  }
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}
