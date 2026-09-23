import React, { useEffect, useState } from 'react';
import { upcomingWithin, localFirst, shortDate } from '../lib/events';

// "Coming up around {lake}" card on the lake page. Pulls the shared Irish
// Hills events feed (proxied through /api/events), prefers events whose
// location matches this lake's town, and fills out to 4 with the soonest
// events overall since the whole feed is Irish Hills anyway.
//
// Selection and date formatting live in src/lib/events.js, shared with the
// /events page so the two can't disagree about which lake owns which event.

const WINDOW_DAYS = 21;
const MIN_LOCAL = 3;
const MAX_ROWS = 4;

// Most upstream records have no eventUrl, but every one has an id, and the
// detail page is always /events/<id>.
const eventHref = (e) =>
  e.eventUrl || (e.id ? `https://manitoubeachmichigan.com/events/${e.id}` : 'https://manitoubeachmichigan.com/events');

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

  const upcoming = upcomingWithin(events, WINDOW_DAYS);
  if (upcoming.length === 0) return null;

  const rows = localFirst(upcoming, lake.region, { min: MIN_LOCAL, max: MAX_ROWS });
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
            href={eventHref(e)}
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
