import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import SiteNav from '../components/SiteNav';
import { TrustStrip } from '../components/GoogleReviews';
import NewsletterSignup from '../components/NewsletterSignup';
import { lakes } from '../data/lakes';
import { regions } from '../data/regions';
import { TOWN_KEYWORDS, groupByMonth, categories, shortDate, dateOf } from '../lib/events';

// Public events page for the Irish Hills lakes. The calendar itself belongs to
// Manitou Beach Michigan, which is credited in the page and linked on every
// row; this page is the version a buyer reads, so it ends with "and here is
// what it costs to own here".
//
// The prerendered copy in scripts/prerender.mjs is a build-time snapshot
// refreshed daily; this component replaces it with live data on mount.

const FONT = "'DM Sans', -apple-system, sans-serif";
const SERIF = "'Playfair Display', serif";
const CALL_HREF = 'tel:5174033413';
const SMS_HREF = 'sms:+15173008226?&body=Hi%20Holly%2C%20I%20saw%20your%20Irish%20Hills%20events%20page.';
const CREDIT_URL = 'https://manitoubeachmichigan.com';

const DAY_MS = 24 * 60 * 60 * 1000;
const RANGES = [
  { key: 'week', label: 'This week', days: 7 },
  { key: 'month', label: 'This month', days: 31 },
  { key: 'all', label: 'Everything', days: null },
];

function truncate(s, n) {
  const t = String(s || '').replace(/\s+/g, ' ').trim();
  return t.length > n ? `${t.slice(0, n - 1).trimEnd()}…` : t;
}

function Pill({ on, children, ...rest }) {
  return (
    <button
      type="button"
      {...rest}
      style={{
        font: 'inherit', cursor: 'pointer', padding: '0.5rem 1rem', borderRadius: '30px',
        fontSize: '0.85rem', fontWeight: 600, whiteSpace: 'nowrap',
        background: on ? '#e84393' : 'white',
        color: on ? 'white' : '#4a5568',
        border: `1px solid ${on ? '#e84393' : '#e8e4df'}`,
      }}
    >
      {children}
    </button>
  );
}

function EventRow({ e }) {
  const href = e.url || e.eventUrl || `${CREDIT_URL}/events`;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener"
      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1.25rem', textDecoration: 'none', color: '#1a2332', padding: '1rem 0', borderTop: '1px solid #f0eee9' }}
    >
      <span style={{ minWidth: 0 }}>
        <span style={{ fontWeight: 600, fontSize: '1rem', display: 'block', marginBottom: '0.15rem' }}>{e.name}</span>
        {e.description && (
          <span style={{ fontSize: '0.88rem', color: '#4a5568', lineHeight: 1.55, display: 'block', marginBottom: '0.3rem' }}>
            {truncate(e.description, 140)}
          </span>
        )}
        <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
          {e.location}
          {e.cost && <span style={{ marginLeft: '0.6rem', padding: '0.1rem 0.5rem', borderRadius: '30px', background: '#f0eee9', color: '#6b7a8d', fontWeight: 600 }}>{e.cost}</span>}
        </span>
      </span>
      <span style={{ textAlign: 'right', whiteSpace: 'nowrap', color: '#6b7a8d', fontSize: '0.85rem', paddingTop: '0.1rem' }}>
        {shortDate(e.date)}
        {e.time && <><br /><span style={{ fontSize: '0.8rem' }}>{e.time}{e.timeEnd ? `–${e.timeEnd}` : ''}</span></>}
      </span>
    </a>
  );
}

export default function EventsPage() {
  const [events, setEvents] = useState(null);
  const [range, setRange] = useState('month');
  const [cat, setCat] = useState(null);

  useEffect(() => {
    window.scrollTo({ top: 0 });
    document.title = "Irish Hills & Devils Lake Events | What's On Around the Lakes";
    let meta = document.querySelector('meta[name="description"]');
    let created = false;
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'description');
      document.head.appendChild(meta);
      created = true;
    }
    const prev = meta.getAttribute('content');
    meta.setAttribute(
      'content',
      'Live music, festivals and lake happenings around Devils Lake, Manitou Beach, Onsted, Brooklyn and the Irish Hills. Listed by Manitou Beach Michigan, collected here by Realtor Holly Griewahn.'
    );
    return () => {
      if (created) meta.remove();
      else if (prev !== null) meta.setAttribute('content', prev);
    };
  }, []);

  useEffect(() => {
    let alive = true;
    fetch('/api/events?all=1')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (alive) setEvents(d?.events || []); })
      .catch(() => { if (alive) setEvents([]); });
    return () => { alive = false; };
  }, []);

  const all = events || [];
  const cats = useMemo(() => categories(all).slice(0, 5), [events]);

  const shown = useMemo(() => {
    const days = RANGES.find((r) => r.key === range)?.days;
    let list = all;
    if (days) {
      const cutoff = new Date(Date.now() + days * DAY_MS);
      list = list.filter((e) => { const d = dateOf(e.date); return d && d <= cutoff; });
    }
    if (cat) list = list.filter((e) => e.category === cat);
    return list;
  }, [events, range, cat]);

  const months = useMemo(() => groupByMonth(shown), [shown]);

  // Which corners of the lakes have the most going on. Counted from the whole
  // feed, not the filtered view, so the answer doesn't jump as you filter.
  const busiest = useMemo(() => {
    const counts = Object.entries(TOWN_KEYWORDS).map(([slug, towns]) => ({
      slug,
      name: regions[slug]?.name || slug,
      count: all.filter((e) => towns.some((t) => (e.location || '').toLowerCase().includes(t.toLowerCase()))).length,
      lake: Object.values(lakes).find((l) => l.region === slug),
    }));
    return counts.filter((r) => r.count > 0 && r.lake).sort((a, b) => b.count - a.count).slice(0, 3);
  }, [events]);

  const card = { background: 'white', border: '1px solid #e8e4df', borderRadius: '14px', padding: '1.5rem' };
  const h2 = { fontFamily: SERIF, fontSize: '1.4rem', fontWeight: 700, color: '#1a2332', marginBottom: '1rem' };

  return (
    <div style={{ minHeight: '100vh', background: '#faf9f7', fontFamily: FONT, color: '#1a2332' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700;800&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        .ev-filters { display: flex; gap: 0.5rem; flex-wrap: wrap; }
        .ev-owning { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.9rem; }
        @media (max-width: 700px) { .ev-owning { grid-template-columns: 1fr; } }
      `}</style>

      <SiteNav active="events" transparent textBody="Hi Holly, I saw your Irish Hills events page." />

      {/* Hero */}
      <div style={{ position: 'relative', overflow: 'hidden', minHeight: '54vh', display: 'flex', alignItems: 'flex-end', background: 'linear-gradient(135deg, #1a2332 0%, #1a3a52 55%, #0f2940 100%)' }}>
        <div style={{ position: 'relative', zIndex: 2, maxWidth: '1100px', margin: '0 auto', width: '100%', padding: '9rem 1.5rem 3rem' }}>
          <div style={{ maxWidth: '640px' }}>
            <h1 style={{ fontFamily: SERIF, fontSize: 'clamp(2.2rem, 5.5vw, 3.6rem)', fontWeight: 800, color: 'white', lineHeight: 1.1, marginBottom: '0.6rem' }}>
              What&rsquo;s on around the Irish Hills lakes
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.78)', fontSize: '1.05rem', lineHeight: 1.6, marginBottom: '1.75rem' }}>
              Live music, festivals and lake happenings around Devils Lake, Manitou Beach, Onsted and Brooklyn. This is what a weekend here actually looks like.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <Link to="/listings" style={{ padding: '0.8rem 1.6rem', background: '#e84393', color: 'white', borderRadius: '10px', textDecoration: 'none', fontWeight: 700, fontSize: '0.95rem' }}>See homes for sale</Link>
              <Link to="/cma" style={{ padding: '0.8rem 1.6rem', background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '10px', textDecoration: 'none', fontWeight: 700, fontSize: '0.95rem' }}>What&rsquo;s my home worth?</Link>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '3rem 1.5rem 1rem' }}>

        {/* Credit, up front rather than buried in a footer */}
        <div style={{ marginBottom: '1.5rem', fontSize: '0.85rem', color: '#6b7a8d' }}>
          Calendar listed and maintained by{' '}
          <a href={CREDIT_URL} target="_blank" rel="noopener" style={{ color: '#e84393', fontWeight: 600, textDecoration: 'none' }}>Manitou Beach Michigan</a>
          . Every listing links to their page for details, tickets and changes.
        </div>

        {/* Filters */}
        <div className="ev-filters" style={{ marginBottom: '2rem' }}>
          {RANGES.map((r) => (
            <Pill key={r.key} on={range === r.key} onClick={() => setRange(r.key)}>{r.label}</Pill>
          ))}
          {cats.length > 1 && <span style={{ width: '1px', background: '#e8e4df', margin: '0 0.25rem' }} />}
          {cats.length > 1 && cats.map((c) => (
            <Pill key={c.name} on={cat === c.name} onClick={() => setCat(cat === c.name ? null : c.name)}>
              {c.name} <span style={{ opacity: 0.6 }}>{c.count}</span>
            </Pill>
          ))}
        </div>

        {/* The list */}
        {events === null && <div style={{ ...card, color: '#6b7a8d' }}>Loading what&rsquo;s on&hellip;</div>}

        {events !== null && shown.length === 0 && (
          <div style={{ ...card, marginBottom: '3rem' }}>
            <h2 style={h2}>Nothing listed in this window</h2>
            <p style={{ color: '#4a5568', lineHeight: 1.7, marginBottom: '1rem' }}>
              Try &ldquo;Everything&rdquo; above, or see the full Irish Hills calendar at Manitou Beach Michigan.
            </p>
            <a href={`${CREDIT_URL}/events`} target="_blank" rel="noopener" style={{ color: '#e84393', fontWeight: 700, textDecoration: 'none' }}>
              Open the full calendar &rarr;
            </a>
          </div>
        )}

        {months.map((m, i) => (
          <React.Fragment key={m.key}>
            <div style={{ ...card, marginBottom: '1.5rem' }}>
              <h2 style={h2}>{m.label}</h2>
              <div>{m.events.map((e) => <EventRow key={e.id} e={e} />)}</div>
            </div>

            {/* After the first month, the reason this page is on a realtor's site */}
            {i === 0 && busiest.length > 0 && (
              <div style={{ ...card, marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '0.5rem' }}>
                  Coming to the lake this weekend?
                </div>
                <h2 style={h2}>Where all of this is happening</h2>
                <div className="ev-owning" style={{ marginBottom: '1.25rem' }}>
                  {busiest.map((r) => (
                    <Link key={r.slug} to={`/lakes/${r.lake.slug}`} style={{ display: 'block', textDecoration: 'none', color: 'inherit', border: '1px solid #e8e4df', borderRadius: '14px', padding: '1.1rem' }}>
                      <div style={{ fontWeight: 700, color: '#1a2332', marginBottom: '0.2rem' }}>{r.lake.name}</div>
                      <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.5rem' }}>{r.name}</div>
                      <div style={{ fontSize: '0.85rem', color: '#e84393', fontWeight: 600 }}>{r.count} event{r.count === 1 ? '' : 's'} nearby &rarr;</div>
                    </Link>
                  ))}
                </div>
                <p style={{ color: '#4a5568', lineHeight: 1.7, marginBottom: '1rem' }}>
                  Holly has sold around these lakes for thirty years. If a weekend here has you wondering what it costs to stay, that is a short conversation.
                </p>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <Link to="/cma" style={{ padding: '0.7rem 1.3rem', background: '#e84393', color: 'white', borderRadius: '10px', textDecoration: 'none', fontWeight: 700, fontSize: '0.9rem' }}>What&rsquo;s my home worth?</Link>
                  <Link to="/listings" style={{ padding: '0.7rem 1.3rem', background: '#f0eee9', color: '#1a2332', borderRadius: '10px', textDecoration: 'none', fontWeight: 700, fontSize: '0.9rem' }}>Homes for sale</Link>
                </div>
              </div>
            )}
          </React.Fragment>
        ))}

        <div style={{ margin: '2rem 0 3rem' }}>
          <TrustStrip align="center" />
        </div>

        <NewsletterSignup
          source="events"
          heading="Want this in your inbox?"
          blurb="Once a month: what is on around the lakes, what sold, and what came up for sale. No pitch."
        />

        {/* Closing CTA */}
        <div style={{ background: 'linear-gradient(135deg, #1a2332, #2c3e50)', borderRadius: '16px', padding: '2.5rem 2rem', textAlign: 'center', marginBottom: '3rem' }}>
          <h2 style={{ fontFamily: SERIF, fontSize: 'clamp(1.5rem, 3.5vw, 2rem)', fontWeight: 700, color: 'white', marginBottom: '0.75rem' }}>
            Thinking about a place on the lake?
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.75)', marginBottom: '1.5rem', lineHeight: 1.7 }}>
            Call or text Holly. No pitch, and she will tell you if the lake you have in mind is the wrong one.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href={SMS_HREF} style={{ padding: '0.8rem 1.6rem', background: '#e84393', color: 'white', borderRadius: '10px', textDecoration: 'none', fontWeight: 700, fontSize: '0.95rem' }}>Text Holly</a>
            <a href={CALL_HREF} style={{ padding: '0.8rem 1.6rem', background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '10px', textDecoration: 'none', fontWeight: 700, fontSize: '0.95rem' }}>(517) 403-3413</a>
          </div>
        </div>
      </div>

      <footer style={{ background: '#0f1923', padding: '2rem', textAlign: 'center' }}>
        <div style={{ color: '#64748b', fontSize: '0.82rem' }}>Holly Griewahn | Foundation Realty | Manitou Beach, Michigan</div>
      </footer>
    </div>
  );
}
