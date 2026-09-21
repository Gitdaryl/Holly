import React, { useEffect, useState } from 'react';

// "Coming up around {lake}" card on the lake page. Pulls the shared Irish
// Hills events feed (proxied through /api/events), prefers events whose
// location matches this lake's town, and fills out to 4 with the soonest
// events overall since the whole feed is Irish Hills anyway.

const TOWN_KEYWORDS = {
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
const WINDOW_DAYS = 21;
const MIN_LOCAL = 3;
const MAX_ROWS = 4;

function shortDate(iso) {
  if (!iso) return '';
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export default function LakeEvents({ lake }) {
  const [events, setEvents] = useState(null);

  useEffect(() => {
    let alive = true;
    fetch('/api/events')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (alive) setEvents(d?.events || []); })
      .catch(() => { if (alive) setEvents([]); });
    return () => { alive = false; };
  }, []);

  if (!lake || !events || events.length === 0) return null;

  const now = new Date();
  const cutoff = new Date(now.getTime() + WINDOW_DAYS * DAY_MS);
  const upcoming = events.filter((e) => {
    const d = new Date(`${e.date}T12:00:00`);
    return !Number.isNaN(d.getTime()) && d >= now && d <= cutoff;
  });
  if (upcoming.length === 0) return null;

  const keywords = TOWN_KEYWORDS[lake.region] || [];
  const matchesTown = (e) => keywords.some((k) => (e.location || '').toLowerCase().includes(k.toLowerCase()));

  const local = upcoming.filter(matchesTown);
  let rows = local.slice(0, MAX_ROWS);
  if (rows.length < MIN_LOCAL) {
    const usedIds = new Set(rows.map((e) => e.id));
    for (const e of upcoming) {
      if (rows.length >= MAX_ROWS) break;
      if (usedIds.has(e.id)) continue;
      rows.push(e);
      usedIds.add(e.id);
    }
  }
  if (rows.length === 0) return null;

  return (
    <div style={{ background: 'white', borderRadius: '14px', border: '1px solid #e8e4df', padding: '1.5rem' }}>
      <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.1rem', fontWeight: 700, color: '#1a2332', marginBottom: '1rem' }}>
        Coming up around {lake.name}
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {rows.map((e) => (
          <a
            key={e.id}
            href={e.eventUrl || 'https://manitoubeachmichigan.com/events'}
            target="_blank"
            rel="noopener"
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '1rem', textDecoration: 'none', color: '#1a2332', padding: '0.6rem 0', borderTop: '1px solid #f0eee9' }}
          >
            <span style={{ minWidth: 0 }}>
              <span style={{ fontWeight: 600, fontSize: '0.9rem', display: 'block' }}>{e.name}</span>
              {e.location && <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>{e.location}</span>}
            </span>
            <span style={{ textAlign: 'right', whiteSpace: 'nowrap', color: '#6b7a8d', fontSize: '0.82rem' }}>
              {shortDate(e.date)}
              {e.time && <><br />{e.time}</>}
            </span>
          </a>
        ))}
      </div>
      <div style={{ marginTop: '1rem', fontSize: '0.75rem', color: '#94a3b8' }}>
        Events via <a href="https://manitoubeachmichigan.com" target="_blank" rel="noopener" style={{ color: '#e84393', fontWeight: 600, textDecoration: 'none' }}>Manitou Beach Michigan</a>
      </div>
    </div>
  );
}
