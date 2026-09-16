import React, { useState, useEffect } from 'react';

// Live Google reviews. One fetch, shared by every component on the page via a
// module-level promise, so the home page and a trust strip never double-hit
// the API. If Google is unreachable the components render nothing rather than
// a broken box; the rating is proof, and stale or missing proof is worse than
// none.

let cached = null;
function load() {
  if (!cached) {
    cached = fetch('/api/reviews').then((r) => (r.ok ? r.json() : null)).catch(() => null);
  }
  return cached;
}

export function useGoogleReviews() {
  const [data, setData] = useState(null);
  useEffect(() => { let on = true; load().then((d) => { if (on) setData(d); }); return () => { on = false; }; }, []);
  return data;
}

export function Stars({ n = 5, size = 16, color = '#f5b301' }) {
  return (
    <span aria-label={`${n} out of 5 stars`} style={{ display: 'inline-flex', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24" fill={i <= Math.round(n) ? color : 'rgba(128,128,128,0.25)'}>
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </span>
  );
}

const G = () => (
  <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
  </svg>
);

// Compact "5.0 · 44 Google reviews" line for property, sold and plan pages.
export function TrustStrip({ dark = false, align = 'left' }) {
  const d = useGoogleReviews();
  if (!d || !d.count) return null;
  const fg = dark ? 'white' : '#1a2332';
  const muted = dark ? 'rgba(255,255,255,0.7)' : '#6b7a8d';
  return (
    <a href={d.mapsUrl} target="_blank" rel="noopener" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', justifyContent: align === 'center' ? 'center' : 'flex-start', flexWrap: 'wrap' }}>
      <G />
      <span style={{ fontWeight: 800, color: fg, fontSize: '0.95rem' }}>{d.rating.toFixed(1)}</span>
      <Stars n={d.rating} size={14} />
      <span style={{ color: muted, fontSize: '0.82rem', fontWeight: 600 }}>{d.count} Google reviews</span>
    </a>
  );
}

// Full section for the home page. Three newest reviews, rating header, links
// to read them all and to leave one.
export default function GoogleReviews({ limit = 3 }) {
  const d = useGoogleReviews();
  if (!d || !d.reviews?.length) return null;
  return (
    <section style={{ padding: '6rem 2rem', background: '#1a2332', color: 'white' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '2.5rem', fontWeight: 600, marginBottom: '0.75rem' }}>What Clients Say</h2>
          <div style={{ width: '40px', height: '3px', background: '#e84393', margin: '0 auto 1.25rem', borderRadius: '2px' }} />
          <a href={d.mapsUrl} target="_blank" rel="noopener" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', textDecoration: 'none', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '30px', padding: '0.55rem 1.1rem' }}>
            <G />
            <span style={{ fontWeight: 800, color: 'white', fontSize: '1.1rem' }}>{d.rating.toFixed(1)}</span>
            <Stars n={d.rating} size={16} />
            <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.88rem', fontWeight: 600 }}>{d.count} reviews on Google</span>
          </a>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
          {d.reviews.slice(0, limit).map((r, i) => (
            <div key={r.time || i} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '16px', padding: '2rem', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column' }}>
              <Stars n={r.rating} size={15} />
              <p style={{ fontSize: '1rem', lineHeight: 1.7, color: 'rgba(255,255,255,0.82)', margin: '1rem 0 1.25rem', flex: 1 }}>{r.text.length > 320 ? r.text.slice(0, 300).replace(/\s+\S*$/, '') + '…' : r.text}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                {r.photo && <img src={r.photo} alt="" width="36" height="36" style={{ borderRadius: '50%' }} loading="lazy" referrerPolicy="no-referrer" />}
                <div>
                  <div style={{ fontWeight: 600, color: 'white', fontSize: '0.92rem' }}>{r.author}</div>
                  <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)' }}>Google review · {r.when}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap', marginTop: '2.5rem' }}>
          <a href={d.mapsUrl} target="_blank" rel="noopener" style={{ padding: '0.75rem 1.5rem', background: 'rgba(255,255,255,0.08)', color: 'white', borderRadius: '10px', textDecoration: 'none', fontWeight: 600, fontSize: '0.88rem', border: '1px solid rgba(255,255,255,0.15)' }}>Read all {d.count} reviews</a>
          <a href={d.writeUrl} target="_blank" rel="noopener" style={{ padding: '0.75rem 1.5rem', background: '#e84393', color: 'white', borderRadius: '10px', textDecoration: 'none', fontWeight: 700, fontSize: '0.88rem' }}>Worked with Holly? Leave a review</a>
        </div>
      </div>
    </section>
  );
}
