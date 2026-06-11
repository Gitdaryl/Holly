import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { regions } from '../data/regions';
import { propertiesData, propertyTypes } from '../data/amenities';

const PRICE_RANGES = [
  { label: 'Any Price', min: 0, max: Infinity },
  { label: 'Under $200K', min: 0, max: 200000 },
  { label: '$200K–$350K', min: 200000, max: 350000 },
  { label: '$350K–$500K', min: 350000, max: 500000 },
  { label: '$500K+', min: 500000, max: Infinity },
];

function parsePrice(str) {
  return parseInt(str.replace(/[$,+]/g, ''), 10) || 0;
}

function NavBar({ scrolled }) {
  return (
    <header style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      background: scrolled ? 'rgba(250,249,247,0.97)' : 'transparent',
      backdropFilter: scrolled ? 'blur(12px)' : 'none',
      borderBottom: scrolled ? '1px solid #e8e4df' : 'none',
      transition: 'all 0.4s ease',
      padding: '1rem 2rem',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    }}>
      <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{
          width: 38, height: 38, borderRadius: '50%',
          background: scrolled ? '#1a2332' : 'rgba(255,255,255,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
        </div>
        <span style={{ color: scrolled ? '#1a2332' : 'white', fontWeight: 700, fontSize: '0.95rem' }}>Holly Griewahn</span>
      </Link>
      <nav style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
        <Link to="/" style={{ color: scrolled ? '#4a5568' : 'rgba(255,255,255,0.85)', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600 }}>Regions</Link>
        <span style={{ color: scrolled ? '#1a2332' : 'white', fontSize: '0.85rem', fontWeight: 700, borderBottom: '2px solid #e84393', paddingBottom: '2px' }}>Listings</span>
        <Link to="/blog" style={{ color: scrolled ? '#4a5568' : 'rgba(255,255,255,0.85)', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600 }}>Blog</Link>
        <a href="tel:5174033413" style={{ background: '#e84393', color: 'white', padding: '0.45rem 1.1rem', borderRadius: '8px', textDecoration: 'none', fontSize: '0.82rem', fontWeight: 600 }}>
          Call Holly
        </a>
      </nav>
    </header>
  );
}

function PropertyCard({ property }) {
  const region = regions[property.region];
  return (
    <Link to={`/property/${property.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
      <article style={{
        background: 'white', borderRadius: '16px', overflow: 'hidden',
        border: '1px solid #e8e4df', transition: 'all 0.3s ease', cursor: 'pointer',
        height: '100%', display: 'flex', flexDirection: 'column',
      }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 16px 40px rgba(26,35,50,0.12)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
      >
        {/* Photo / Gradient */}
        <div style={{ height: '200px', background: property.gradient, position: 'relative', flexShrink: 0 }}>
          <div style={{ position: 'absolute', top: '1rem', left: '1rem' }}>
            <span style={{
              background: 'rgba(232,67,147,0.92)', color: 'white',
              padding: '0.3rem 0.75rem', borderRadius: '20px',
              fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase',
            }}>
              {propertyTypes[property.type]?.label || property.type}
            </span>
          </div>
          {property.status && (
            <div style={{ position: 'absolute', top: '1rem', right: '1rem' }}>
              <span style={{
                background: property.status === 'Active' ? 'rgba(34,197,94,0.9)' : 'rgba(100,116,139,0.9)',
                color: 'white', padding: '0.25rem 0.6rem', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 700,
              }}>
                {property.status || 'Active'}
              </span>
            </div>
          )}
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            opacity: 0.3,
          }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="white" stroke="none">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22" fill="white"/>
            </svg>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#e84393', marginBottom: '0.35rem', fontFamily: "'Playfair Display', serif" }}>
            {property.price}
          </div>
          <div style={{ fontSize: '1rem', fontWeight: 700, color: '#1a2332', marginBottom: '0.4rem', lineHeight: 1.3 }}>
            {property.title}
          </div>
          {region && (
            <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
              {region.name}
            </div>
          )}
          <div style={{ fontSize: '0.82rem', color: '#6b7a8d', marginBottom: '1rem', lineHeight: 1.5, flex: 1 }}>
            {property.description}
          </div>
          {property.beds && (
            <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: '#64748b', borderTop: '1px solid #f0eee9', paddingTop: '0.75rem' }}>
              <span style={{ fontWeight: 600 }}>{property.beds} <span style={{ fontWeight: 400 }}>bed</span></span>
              <span style={{ fontWeight: 600 }}>{property.baths} <span style={{ fontWeight: 400 }}>bath</span></span>
              <span style={{ fontWeight: 600 }}>{property.sqft} <span style={{ fontWeight: 400 }}>sqft</span></span>
            </div>
          )}
        </div>
      </article>
    </Link>
  );
}

export default function ListingsPage() {
  const [searchParams] = useSearchParams();
  const [scrolled, setScrolled] = useState(false);
  const [search, setSearch] = useState('');
  const [activeType, setActiveType] = useState('all');
  const [activePriceIdx, setActivePriceIdx] = useState(0);
  const [activeRegion, setActiveRegion] = useState(searchParams.get('region') || 'all');
  const [minBeds, setMinBeds] = useState(0);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const priceRange = PRICE_RANGES[activePriceIdx];

  const filtered = propertiesData.filter(p => {
    if (activeType !== 'all' && p.type !== activeType) return false;
    if (activeRegion !== 'all' && p.region !== activeRegion) return false;
    if (minBeds > 0 && (p.beds || 0) < minBeds) return false;
    const price = parsePrice(p.price);
    if (price < priceRange.min || price > priceRange.max) return false;
    if (search) {
      const q = search.toLowerCase();
      const haystack = `${p.title} ${p.description} ${regions[p.region]?.name || ''} ${p.lake || ''}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });

  const regionList = Object.values(regions);

  return (
    <div style={{ minHeight: '100vh', background: '#faf9f7', fontFamily: "'DM Sans', -apple-system, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700;800&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .filter-btn:hover { border-color: #e84393 !important; color: #e84393 !important; }
        @media (max-width: 768px) {
          .listings-layout { flex-direction: column !important; }
          .listings-sidebar { display: none !important; }
          .filter-scroll { overflow-x: auto; flex-wrap: nowrap !important; padding-bottom: 0.5rem; }
        }
      `}</style>

      <NavBar scrolled={scrolled} />

      {/* Hero */}
      <div style={{
        height: '42vh', minHeight: '320px',
        background: 'linear-gradient(135deg, #1a2332 0%, #2c4a6e 60%, #1a3a4a 100%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '0 2rem', textAlign: 'center', position: 'relative',
      }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 30% 60%, rgba(232,67,147,0.1) 0%, transparent 50%)' }} />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: '640px' }}>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.78rem', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
            Irish Hills Real Estate
          </p>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 800, color: 'white', lineHeight: 1.2, marginBottom: '1.5rem' }}>
            Find Your Irish Hills Home
          </h1>
          {/* Search bar */}
          <div style={{ position: 'relative', maxWidth: '500px', margin: '0 auto' }}>
            <svg style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by lake, town, or property type..."
              style={{
                width: '100%', padding: '0.9rem 1rem 0.9rem 3rem',
                borderRadius: '12px', border: 'none', fontSize: '0.95rem',
                fontFamily: 'inherit', outline: 'none',
                boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
              }}
            />
          </div>
        </div>
      </div>

      {/* IDX Notice Banner */}
      <div style={{ background: 'linear-gradient(90deg, rgba(232,67,147,0.08), rgba(232,67,147,0.04))', borderBottom: '1px solid rgba(232,67,147,0.15)', padding: '0.75rem 2rem', textAlign: 'center' }}>
        <p style={{ fontSize: '0.82rem', color: '#6b7a8d' }}>
          <span style={{ color: '#e84393', fontWeight: 700 }}>Live MLS listings coming soon.</span>
          {' '}Currently showing sample properties. For full MLS access, call Holly at{' '}
          <a href="tel:5174033413" style={{ color: '#e84393', fontWeight: 600, textDecoration: 'none' }}>(517) 403-3413</a>
        </p>
      </div>

      {/* Main layout */}
      <div className="listings-layout" style={{ display: 'flex', maxWidth: '1200px', margin: '0 auto', padding: '2rem 1.5rem', gap: '2rem' }}>

        {/* Sidebar */}
        <aside className="listings-sidebar" style={{ width: '260px', flexShrink: 0 }}>
          <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e8e4df', padding: '1.5rem', position: 'sticky', top: '80px' }}>
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.1rem', fontWeight: 700, color: '#1a2332', marginBottom: '1.25rem' }}>Refine Search</h3>

            {/* Region filter */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6b7a8d', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '0.5rem' }}>Region</label>
              <select value={activeRegion} onChange={e => setActiveRegion(e.target.value)} style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid #e8e4df', fontSize: '0.85rem', fontFamily: 'inherit', color: '#1a2332', background: 'white', cursor: 'pointer' }}>
                <option value="all">All Regions</option>
                {regionList.map(r => <option key={r.slug} value={r.slug}>{r.name}</option>)}
              </select>
            </div>

            {/* Price filter */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6b7a8d', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '0.5rem' }}>Price Range</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                {PRICE_RANGES.map((r, i) => (
                  <button key={i} onClick={() => setActivePriceIdx(i)} style={{
                    padding: '0.5rem 0.75rem', borderRadius: '8px', fontSize: '0.83rem', cursor: 'pointer', textAlign: 'left',
                    border: activePriceIdx === i ? '2px solid #e84393' : '1px solid #e8e4df',
                    background: activePriceIdx === i ? 'rgba(232,67,147,0.06)' : 'transparent',
                    color: activePriceIdx === i ? '#e84393' : '#4a5568', fontWeight: activePriceIdx === i ? 700 : 400,
                    transition: 'all 0.2s ease',
                  }}>
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Min beds */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6b7a8d', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '0.5rem' }}>Min Bedrooms</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {[0, 2, 3, 4].map(n => (
                  <button key={n} onClick={() => setMinBeds(n)} style={{
                    flex: 1, padding: '0.5rem', borderRadius: '8px', fontSize: '0.82rem', cursor: 'pointer',
                    border: minBeds === n ? '2px solid #e84393' : '1px solid #e8e4df',
                    background: minBeds === n ? 'rgba(232,67,147,0.06)' : 'transparent',
                    color: minBeds === n ? '#e84393' : '#4a5568', fontWeight: minBeds === n ? 700 : 400,
                    transition: 'all 0.2s ease',
                  }}>
                    {n === 0 ? 'Any' : `${n}+`}
                  </button>
                ))}
              </div>
            </div>

            {/* Contact CTA */}
            <div style={{ background: 'linear-gradient(135deg, #1a2332, #2c3e50)', borderRadius: '12px', padding: '1.25rem', color: 'white', textAlign: 'center' }}>
              <div style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.7)', marginBottom: '0.75rem', lineHeight: 1.5 }}>
                Don't see what you're looking for? Holly knows every listing in the area.
              </div>
              <a href="tel:5174033413" style={{ display: 'block', background: '#e84393', color: 'white', padding: '0.65rem', borderRadius: '8px', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 700 }}>
                Call Holly
              </a>
              <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)', marginTop: '0.5rem' }}>
                (517) 403-3413
              </div>
            </div>
          </div>
        </aside>

        {/* Results */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Property type filter bar */}
          <div className="filter-scroll" style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            {[{ key: 'all', label: 'All Types' }, ...Object.entries(propertyTypes).map(([k, v]) => ({ key: k, label: v.label }))].map(({ key, label }) => (
              <button key={key} className="filter-btn" onClick={() => setActiveType(key)} style={{
                padding: '0.5rem 1rem', borderRadius: '20px', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
                border: activeType === key ? '2px solid #e84393' : '1px solid #e8e4df',
                background: activeType === key ? 'rgba(232,67,147,0.08)' : 'white',
                color: activeType === key ? '#e84393' : '#6b7a8d', transition: 'all 0.2s ease',
              }}>
                {label}
              </button>
            ))}
          </div>

          {/* Result count */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <p style={{ fontSize: '0.88rem', color: '#6b7a8d' }}>
              <span style={{ fontWeight: 700, color: '#1a2332' }}>{filtered.length}</span> {filtered.length === 1 ? 'property' : 'properties'} found
            </p>
            {(activeType !== 'all' || activeRegion !== 'all' || activePriceIdx !== 0 || minBeds > 0 || search) && (
              <button onClick={() => { setActiveType('all'); setActiveRegion('all'); setActivePriceIdx(0); setMinBeds(0); setSearch(''); }}
                style={{ background: 'none', border: 'none', color: '#e84393', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}>
                Clear filters
              </button>
            )}
          </div>

          {/* Grid */}
          {filtered.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
              {filtered.map(p => <PropertyCard key={p.id} property={p} />)}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '4rem 2rem', background: 'white', borderRadius: '16px', border: '1px solid #e8e4df' }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#cbd5e0" strokeWidth="1.5" style={{ marginBottom: '1rem' }}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.3rem', color: '#1a2332', marginBottom: '0.5rem' }}>No properties match your filters</h3>
              <p style={{ color: '#6b7a8d', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Try adjusting your filters or call Holly for off-market properties in this area.</p>
              <a href="tel:5174033413" style={{ display: 'inline-block', background: '#e84393', color: 'white', padding: '0.65rem 1.5rem', borderRadius: '10px', textDecoration: 'none', fontWeight: 700, fontSize: '0.9rem' }}>
                Call Holly — (517) 403-3413
              </a>
            </div>
          )}

          {/* Bottom CTA */}
          <div style={{ marginTop: '3rem', background: 'linear-gradient(135deg, #1a2332, #2c3e50)', borderRadius: '16px', padding: '2.5rem 2rem', textAlign: 'center', color: 'white' }}>
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.6rem', fontWeight: 700, marginBottom: '0.75rem' }}>Can't find what you're looking for?</h3>
            <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '1.5rem', maxWidth: '480px', margin: '0 auto 1.5rem' }}>
              Holly works with off-market properties and knows buyers before they list. She may have exactly what you need.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <a href="tel:5174033413" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: '#e84393', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '10px', textDecoration: 'none', fontWeight: 700 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
                Call Holly
              </a>
              <Link to="/#contact" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.15)', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '10px', textDecoration: 'none', fontWeight: 600, border: '1px solid rgba(255,255,255,0.25)' }}>
                Send a Message
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer style={{ background: '#0f1923', padding: '2rem', marginTop: '2rem', textAlign: 'center' }}>
        <p style={{ color: '#64748b', fontSize: '0.82rem' }}>
          &copy; 2025 Holly Griewahn | Foundation Realty | Irish Hills Real Estate
        </p>
        <p style={{ color: '#475569', fontSize: '0.75rem', marginTop: '0.4rem' }}>
          All listings and information deemed reliable but not guaranteed.
        </p>
      </footer>
    </div>
  );
}
