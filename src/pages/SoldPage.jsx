import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { regions } from '../data/regions';
import { lakes } from '../data/lakes';
import { propertiesData } from '../data/amenities';
import { NavBar, PropertyCard } from './ListingsPage';
import { isSold, trackRecord, fmtPrice } from '../lib/listing-stats';
import { TrustStrip } from '../components/GoogleReviews';
import SoldMap from '../components/SoldMap';

// /sold: the proof page. A sold listing never leaves the site; it becomes a
// case study with days-on-market and percent-of-list, grouped by lake. This is
// the page Holly texts a seller the night before a listing appointment.

function Tile({ value, label }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '14px', padding: '1.25rem 1rem', textAlign: 'center', backdropFilter: 'blur(6px)' }}>
      <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', fontWeight: 800, color: 'white', lineHeight: 1.1 }}>{value}</div>
      <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '0.4rem' }}>{label}</div>
    </div>
  );
}

export default function SoldPage() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    window.scrollTo({ top: 0 });
    document.title = 'Sold by Holly Griewahn | Irish Hills Lakes';
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const sold = propertiesData.filter(isSold).sort((a, b) => String(b.soldOn || '').localeCompare(String(a.soldOn || '')));
  const record = trackRecord(propertiesData);

  // Group by lake first, region for anything without a lake (village, land).
  const groups = new Map();
  for (const p of sold) {
    const key = p.lake ? `lake:${p.lake}` : `region:${p.region}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(p);
  }
  const groupLabel = (key) => {
    const [kind, slug] = key.split(':');
    return kind === 'lake' ? (lakes[slug]?.name || slug) : (regions[slug]?.name || slug);
  };
  const groupLink = (key) => {
    const [kind, slug] = key.split(':');
    return kind === 'lake' ? `/lakes/${slug}` : `/?region=${slug}`;
  };

  return (
    <div style={{ minHeight: '100vh', background: '#faf9f7', fontFamily: "'DM Sans', -apple-system, sans-serif", color: '#1a2332' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700;800&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .sold-tiles { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.75rem; }
        @media (max-width: 700px) { .sold-tiles { grid-template-columns: repeat(2, 1fr); } }
      `}</style>
      <NavBar scrolled={scrolled} />

      <div style={{ minHeight: '48vh', background: 'linear-gradient(135deg, #1a2332 0%, #2c4a6e 60%, #1a3a4a 100%)', display: 'flex', alignItems: 'flex-end', padding: '7rem 2rem 2.5rem', position: 'relative' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 70% 30%, rgba(232,67,147,0.14) 0%, transparent 50%)' }} />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
          <p style={{ color: '#f6a5c9', fontSize: '0.78rem', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Track record</p>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 800, color: 'white', lineHeight: 1.15, marginBottom: '0.75rem' }}>
            Sold by Holly
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.72)', fontSize: '1rem', maxWidth: '560px', lineHeight: 1.6, marginBottom: '1.75rem' }}>
            Every sale stays on this site with the numbers that matter to a seller: how fast, and for how much.
          </p>
          <div style={{ marginBottom: '1.5rem' }}><TrustStrip dark /></div>
          <div className="sold-tiles">
            <Tile value={record.sold} label="Homes sold" />
            <Tile value={record.avgDays === null ? '—' : record.avgDays} label="Avg days to sell (listings)" />
            {record.avgPct
              ? <Tile value={`${record.avgPct}%`} label="Avg % of list price" />
              : <Tile value={record.listSides} label="As listing agent" />}
            <Tile value={record.volume ? `$${(record.volume / 1e6).toFixed(1)}M` : '—'} label="Sold volume" />
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2.5rem 1.5rem 5rem' }}>
        {sold.length > 0 && <SoldMap highlight={sold} caption={`${sold.length} homes sold in 2026`} height={440} />}
        {sold.length === 0 ? (
          <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e8e4df', padding: '3rem 2rem', textAlign: 'center' }}>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.4rem', marginBottom: '0.5rem' }}>Closed sales are being added</h2>
            <p style={{ color: '#6b7a8d', fontSize: '0.92rem', lineHeight: 1.6, maxWidth: '480px', margin: '0 auto 1.5rem' }}>
              Want to know what recently sold on your lake and what it means for your home? Holly has the numbers.
            </p>
            <Link to="/cma" style={{ display: 'inline-block', background: '#e84393', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '10px', textDecoration: 'none', fontWeight: 700 }}>What's my home worth?</Link>
          </div>
        ) : (
          [...groups.entries()].map(([key, list]) => {
            const r = trackRecord(list);
            return (
              <section key={key} style={{ marginBottom: '2.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                  <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.4rem', fontWeight: 700 }}>
                    <Link to={groupLink(key)} style={{ color: '#1a2332', textDecoration: 'none' }}>{groupLabel(key)}</Link>
                  </h2>
                  <div style={{ fontSize: '0.82rem', color: '#6b7a8d', fontWeight: 600 }}>
                    {r.sold} sold{r.avgDays !== null ? ` · avg ${r.avgDays} days to sell` : ''}{r.avgPct ? ` · ${r.avgPct}% of list` : ''}{r.volume ? ` · ${fmtPrice(r.volume)}` : ''}
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                  {list.map(p => <PropertyCard key={p.id} property={p} />)}
                </div>
              </section>
            );
          })
        )}

        <div style={{ marginTop: '1rem', background: 'linear-gradient(135deg, #1a2332, #2c3e50)', borderRadius: '16px', padding: '2.5rem 2rem', textAlign: 'center', color: 'white' }}>
          <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.5rem', marginBottom: '0.5rem' }}>Thinking about selling?</h3>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.92rem', marginBottom: '1.5rem', maxWidth: '480px', marginLeft: 'auto', marginRight: 'auto' }}>
            Holly will show you what your lake's buyers are paying right now and the plan to get your home in front of them.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/cma" style={{ padding: '0.8rem 1.75rem', background: '#e84393', color: 'white', borderRadius: '10px', textDecoration: 'none', fontWeight: 700, fontSize: '0.9rem' }}>What's my home worth?</Link>
            <a href="tel:5174033413" style={{ padding: '0.8rem 1.75rem', background: 'rgba(255,255,255,0.1)', color: 'white', borderRadius: '10px', textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem', border: '1px solid rgba(255,255,255,0.2)' }}>Call (517) 403-3413</a>
          </div>
        </div>
      </div>

      <footer style={{ background: '#0f1923', padding: '2rem', textAlign: 'center' }}>
        <p style={{ color: '#64748b', fontSize: '0.82rem' }}>&copy; 2026 Holly Griewahn | Foundation Realty | Manitou Beach, Michigan</p>
      </footer>
    </div>
  );
}
