import React, { useState, useEffect } from 'react';
import { regions } from './data/regions';
import { lakes, lakeSearchIndex } from './data/lakes';
import { amenityData, propertiesData, testimonials, blogPosts, propertyTypes } from './data/amenities';

// ═══════════════════════════════════════════════════════════
// ICONS LIBRARY
// ═══════════════════════════════════════════════════════════

const Icons = {
  home: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  waves: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/></svg>,
  fish: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6.5 12c.94-3.46 4.94-6 8.5-6 3.56 0 6.06 2.54 7 6-.94 3.47-3.44 6-7 6s-7.56-2.53-8.5-6z"/><path d="M18 12v.5"/><path d="M16 17.93a9.77 9.77 0 010-11.86"/><path d="M2 12h4"/></svg>,
  arrow: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
  back: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>,
  phone: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>,
  mail: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
  search: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  star: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  quote: () => <svg width="32" height="32" viewBox="0 0 24 24" fill="rgba(255,255,255,0.08)"><path d="M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z"/></svg>,
  school: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>,
  utensils: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 002-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 00-5 5v6c0 1.1.9 2 2 2h3zm0 0v7"/></svg>,
  shoppingBag: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>,
  medical: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>,
  wrench: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>,
  anchor: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="5" r="3"/><line x1="12" y1="22" x2="12" y2="8"/><path d="M5 12H2a10 10 0 0020 0h-3"/></svg>,
  car: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 16H9m10 0h3v-3.15a1 1 0 00-.84-.99L16 11l-2.7-3.6a1 1 0 00-.8-.4H5.24a2 2 0 00-1.8 1.1l-.8 1.63A6 6 0 002 12.42V16h2"/><circle cx="6.5" cy="16.5" r="2.5"/><circle cx="16.5" cy="16.5" r="2.5"/></svg>,
  map: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>,
  compass: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>,
  blog: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg>,
  clock: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  tree: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22V8"/><path d="M5 12l7-8 7 8"/><path d="M3 17l9-6 9 6"/></svg>,
  barn: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21V11l9-7 9 7v10"/><path d="M3 21h18"/><path d="M9 21v-6h6v6"/><path d="M12 4v4"/></svg>,
  pin: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>,
};

// ═══════════════════════════════════════════════════════════
// REUSABLE COMPONENTS
// ═══════════════════════════════════════════════════════════

function AmenitySection({ title, icon, items, type }) {
  if (type === 'list') {
    return (
      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1a2332', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {icon} {title}
        </h3>
        <div style={{ display: 'grid', gap: '0.75rem' }}>
          {items.map((item, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', background: '#f8f7f5', borderRadius: '10px', border: '1px solid #e8e4df' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#1a2332' }}>{item.name}</div>
                <div style={{ fontSize: '0.78rem', color: '#6b7a8d' }}>{item.type}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.82rem', color: '#e84393', fontWeight: 600 }}>{item.distance}</div>
                {item.rating && <div style={{ fontSize: '0.72rem', color: '#6b7a8d' }}>{item.rating}</div>}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (type === 'grid') {
    return (
      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1a2332', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {icon} {title}
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
          {Object.entries(items).map(([key, value]) => (
            <div key={key} style={{ padding: '0.75rem 1rem', background: '#f8f7f5', borderRadius: '10px', border: '1px solid #e8e4df' }}>
              <div style={{ fontSize: '0.72rem', color: '#6b7a8d', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.25rem' }}>{key}</div>
              <div style={{ fontSize: '0.85rem', color: '#1a2332', fontWeight: 500 }}>{value}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
}

function RegionMap({ region }) {
  const { lat, lng } = region.coordinates;
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  if (isMobile || !apiKey) {
    return (
      <div style={{ borderRadius: '14px', overflow: 'hidden', border: '1px solid #e8e4df' }}>
        <div style={{ height: '300px', background: 'linear-gradient(135deg, #1a2332, #2c3e50)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: 'white', gap: '0.75rem' }}>
          <Icons.map />
          <span style={{ fontSize: '1.1rem', fontWeight: 600 }}>{region.name}</span>
          <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>{lat.toFixed(4)}N, {(lng * -1).toFixed(4)}W</span>
          <a href={`https://www.google.com/maps/@${lat},${lng},13z`} target="_blank" rel="noopener noreferrer"
            style={{ marginTop: '0.5rem', padding: '0.6rem 1.5rem', background: 'rgba(255,255,255,0.15)', borderRadius: '8px', color: 'white', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 500, border: '1px solid rgba(255,255,255,0.2)' }}>
            Open in Google Maps
          </a>
        </div>
      </div>
    );
  }

  return (
    <div style={{ borderRadius: '14px', overflow: 'hidden', border: '1px solid #e8e4df' }}>
      <iframe
        title={`${region.name} Map`}
        width="100%"
        height="400"
        style={{ border: 0, display: 'block' }}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        src={`https://www.google.com/maps/embed/v1/view?key=${apiKey}&center=${lat},${lng}&zoom=13&maptype=satellite`}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// MAIN APPLICATION
// ═══════════════════════════════════════════════════════════

export default function IrishHillsRealty() {
  const [currentView, setCurrentView] = useState('home');
  const [activeFilter, setActiveFilter] = useState('all');
  const [scrolled, setScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeAmenityTab, setActiveAmenityTab] = useState('schools');
  const [highlightedLake, setHighlightedLake] = useState(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navigateToRegion = (slug, lakeFocus) => {
    setCurrentView(slug);
    setActiveFilter('all');
    setActiveAmenityTab('schools');
    setHighlightedLake(lakeFocus || null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateHome = () => {
    setCurrentView('home');
    setSearchQuery('');
    setHighlightedLake(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateToBlog = () => {
    window.location.href = '/blog';
  };

  // Smart search: matches regions, lakes, towns, property types
  const getSearchResults = (query) => {
    if (!query || query.length < 2) return { regions: Object.values(regions), type: 'all' };
    const q = query.toLowerCase().trim();

    // Check lake search index first
    const regionFromLake = lakeSearchIndex[q];
    if (regionFromLake) {
      return { regions: [regions[regionFromLake]], type: 'lake-match', matchedLake: q };
    }

    // Search across regions and lakes
    const matchedRegions = Object.values(regions).filter(r =>
      r.name.toLowerCase().includes(q) ||
      r.subtitle.toLowerCase().includes(q) ||
      r.description.toLowerCase().includes(q) ||
      r.county.toLowerCase().includes(q) ||
      r.township.toLowerCase().includes(q) ||
      r.propertyTypes.some(pt => pt.includes(q)) ||
      r.lakes.some(lakeSlug => {
        const lake = lakes[lakeSlug];
        return lake && lake.name.toLowerCase().includes(q);
      })
    );

    // Also check property type keywords
    if (['farm', 'barn', 'rural', 'acreage', 'land', 'country'].some(kw => q.includes(kw))) {
      const farmRegions = Object.values(regions).filter(r => r.propertyTypes.includes('farm') || r.propertyTypes.includes('rural'));
      const merged = [...new Set([...matchedRegions, ...farmRegions])];
      return { regions: merged, type: 'property-type' };
    }
    if (['cottage', 'cabin'].some(kw => q.includes(kw))) {
      const cottageRegions = Object.values(regions).filter(r => r.propertyTypes.includes('cottage'));
      return { regions: [...new Set([...matchedRegions, ...cottageRegions])], type: 'property-type' };
    }
    if (['historic', 'victorian', 'downtown'].some(kw => q.includes(kw))) {
      return { regions: [regions['tecumseh-eastern'], ...matchedRegions].filter(Boolean), type: 'property-type' };
    }

    return { regions: matchedRegions, type: 'search' };
  };

  const searchResults = getSearchResults(searchQuery);
  const currentRegion = regions[currentView] || null;
  const regionLakes = currentRegion ? currentRegion.lakes.map(s => lakes[s]).filter(Boolean) : [];
  const regionProperties = currentRegion ? propertiesData.filter(p => p.region === currentView) : [];
  const filteredProperties = activeFilter === 'all' ? regionProperties : regionProperties.filter(p => p.type === activeFilter);
  const regionAmenities = currentRegion ? amenityData[currentView] : null;

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=DM+Sans:wght@300;400;500;600;700&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    @keyframes fadeUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes gentleFloat { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
    @keyframes shimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
    .region-card { transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1); }
    .region-card:hover { transform: translateY(-10px); box-shadow: 0 30px 60px rgba(26,35,50,0.12); }
    .region-card:hover .region-card-cta { background: #1a2332; color: #faf9f7; letter-spacing: 1.5px; }
    .lake-chip { transition: all 0.3s ease; cursor: pointer; }
    .lake-chip:hover { transform: translateY(-3px); box-shadow: 0 8px 25px rgba(26,35,50,0.15); }
    .property-card { transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1); }
    .property-card:hover { transform: translateY(-8px); box-shadow: 0 25px 50px rgba(26,35,50,0.15); }
    .stat-pill { display: inline-flex; align-items: center; gap: 0.3rem; padding: 0.3rem 0.75rem; border-radius: 20px; font-size: 0.78rem; font-weight: 600; }
  `;

  // ═══ REGION DETAIL PAGE ═══
  const RegionDetailPage = () => {
    if (!currentRegion) return null;

    const amenityTabs = regionAmenities ? [
      { id: 'schools', label: 'Schools', icon: <Icons.school /> },
      { id: 'dining', label: 'Dining', icon: <Icons.utensils /> },
      { id: 'shopping', label: 'Shopping', icon: <Icons.shoppingBag /> },
      { id: 'medical', label: 'Medical', icon: <Icons.medical /> },
      { id: 'utilities', label: 'Utilities', icon: <Icons.wrench /> },
      { id: 'recreation', label: 'Recreation', icon: <Icons.compass /> },
      { id: 'distances', label: 'Commute', icon: <Icons.car /> },
    ] : [];

    return (
      <div style={{ minHeight: '100vh', background: '#faf9f7' }}>
        {/* Region Hero */}
        <div style={{ height: '50vh', minHeight: '420px', position: 'relative', background: currentRegion.gradient, overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 30% 50%, rgba(255,255,255,0.08) 0%, transparent 50%)' }} />
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
            <div style={{ textAlign: 'center', maxWidth: '800px' }}>
              <button onClick={navigateHome} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', color: 'white', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', marginBottom: '2rem', transition: 'all 0.3s ease' }}>
                <Icons.back /> All Regions
              </button>
              <h1 style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', fontWeight: 800, color: 'white', marginBottom: '0.75rem', fontFamily: "'Playfair Display', serif" }}>{currentRegion.name}</h1>
              <p style={{ fontSize: 'clamp(1rem, 2.5vw, 1.3rem)', color: 'rgba(255,255,255,0.85)', fontWeight: 300, marginBottom: '1rem' }}>{currentRegion.subtitle}</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center' }}>
                <span className="stat-pill" style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}><Icons.pin /> {currentRegion.county} County</span>
                <span className="stat-pill" style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}>{currentRegion.township}</span>
                <span className="stat-pill" style={{ background: 'rgba(232,67,147,0.8)', color: 'white' }}>{currentRegion.priceRange}</span>
              </div>
            </div>
          </div>
        </div>

        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '3rem 2rem' }}>
          {/* Region Description */}
          <div style={{ marginBottom: '3rem' }}>
            <p style={{ fontSize: '1.1rem', lineHeight: 1.8, color: '#4a5568' }}>{currentRegion.description}</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '1.5rem' }}>
              {currentRegion.highlights.map((h, i) => (
                <span key={i} style={{ padding: '0.4rem 0.8rem', background: '#f0eee9', borderRadius: '6px', fontSize: '0.82rem', color: '#6b7a8d', fontWeight: 500 }}>{h}</span>
              ))}
            </div>
          </div>

          {/* Property Types Available */}
          <div style={{ marginBottom: '3rem', padding: '2rem', background: '#f8f7f5', borderRadius: '14px', border: '1px solid #e8e4df' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#1a2332', marginBottom: '1rem' }}>Property Types in This Area</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {currentRegion.propertyTypes.map(pt => {
                const typeInfo = propertyTypes[pt];
                return typeInfo ? (
                  <div key={pt} style={{ padding: '0.5rem 1rem', background: 'white', borderRadius: '8px', border: '1px solid #e8e4df' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1a2332' }}>{typeInfo.label}</div>
                    <div style={{ fontSize: '0.72rem', color: '#6b7a8d' }}>{typeInfo.description}</div>
                  </div>
                ) : null;
              })}
            </div>
          </div>

          {/* Lakes in This Region */}
          {regionLakes.length > 0 && (
            <div style={{ marginBottom: '3rem' }}>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.8rem', fontWeight: 600, color: '#1a2332', marginBottom: '1.5rem' }}>
                {regionLakes.length === 1 ? 'The Lake' : `Lakes in ${currentRegion.name}`}
              </h2>
              <div style={{ display: 'grid', gap: '1.5rem' }}>
                {regionLakes.map(lake => (
                  <div key={lake.slug} className="lake-chip" id={`lake-${lake.slug}`}
                    style={{
                      background: highlightedLake === lake.slug ? 'rgba(232,67,147,0.05)' : 'white',
                      borderRadius: '14px', padding: '1.75rem', border: highlightedLake === lake.slug ? '2px solid #e84393' : '1px solid #e8e4df'
                    }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                      <div style={{ flex: 1, minWidth: '250px' }}>
                        <h3 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#1a2332', marginBottom: '0.25rem' }}>{lake.name}</h3>
                        <p style={{ fontSize: '0.85rem', color: '#e84393', fontWeight: 600, fontStyle: 'italic', marginBottom: '0.75rem' }}>{lake.tagline}</p>
                        <p style={{ fontSize: '0.92rem', color: '#4a5568', lineHeight: 1.7, marginBottom: '1rem' }}>{lake.description}</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                          {lake.features.map((f, i) => (
                            <span key={i} style={{ padding: '0.3rem 0.6rem', background: '#f0eee9', borderRadius: '6px', fontSize: '0.75rem', color: '#6b7a8d', fontWeight: 500 }}>{f}</span>
                          ))}
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: '140px' }}>
                        {lake.acres && (
                          <div style={{ padding: '0.5rem 0.75rem', background: '#f0eee9', borderRadius: '8px', textAlign: 'center' }}>
                            <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#1a2332' }}>{lake.acres.toLocaleString()}</div>
                            <div style={{ fontSize: '0.68rem', color: '#6b7a8d', textTransform: 'uppercase' }}>Acres</div>
                          </div>
                        )}
                        {lake.depth && (
                          <div style={{ padding: '0.5rem 0.75rem', background: '#f0eee9', borderRadius: '8px', textAlign: 'center' }}>
                            <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#1a2332' }}>{lake.depth} ft</div>
                            <div style={{ fontSize: '0.68rem', color: '#6b7a8d', textTransform: 'uppercase' }}>Max Depth</div>
                          </div>
                        )}
                        {lake.avgPrice && (
                          <div style={{ padding: '0.5rem 0.75rem', background: 'rgba(232,67,147,0.08)', borderRadius: '8px', textAlign: 'center' }}>
                            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#e84393' }}>{lake.avgPrice}</div>
                            <div style={{ fontSize: '0.68rem', color: '#6b7a8d', textTransform: 'uppercase' }}>Avg Price</div>
                          </div>
                        )}
                        <div style={{ padding: '0.4rem 0.75rem', background: lake.access === 'private' ? 'rgba(139,92,246,0.1)' : 'rgba(16,185,129,0.1)', borderRadius: '8px', textAlign: 'center' }}>
                          <div style={{ fontSize: '0.78rem', fontWeight: 600, color: lake.access === 'private' ? '#7c3aed' : '#059669' }}>
                            {lake.access === 'private' ? 'Private Lake' : 'Public Access'} &middot; {lake.type === 'no-wake' ? 'No Wake' : 'All-Sports'}
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* Fish Species */}
                    {lake.fishSpecies && lake.fishSpecies.length > 0 && (
                      <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <Icons.fish />
                        <span style={{ fontSize: '0.78rem', color: '#6b7a8d' }}>{lake.fishSpecies.join(' · ')}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Amenities Section */}
          {regionAmenities && (
            <div style={{ marginBottom: '3rem' }}>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.8rem', fontWeight: 600, color: '#1a2332', marginBottom: '1.5rem' }}>Neighborhood & Amenities</h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '2rem' }}>
                {amenityTabs.map(tab => (
                  <button key={tab.id} onClick={() => setActiveAmenityTab(tab.id)} style={{
                    display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', borderRadius: '8px',
                    border: activeAmenityTab === tab.id ? '2px solid #e84393' : '1px solid #e8e4df',
                    background: activeAmenityTab === tab.id ? 'rgba(232,67,147,0.08)' : 'white',
                    color: activeAmenityTab === tab.id ? '#e84393' : '#6b7a8d',
                    cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, transition: 'all 0.3s ease'
                  }}>
                    {tab.icon} {tab.label}
                  </button>
                ))}
              </div>
              {activeAmenityTab === 'schools' && <AmenitySection title="Schools" icon={<Icons.school />} items={regionAmenities.schools} type="list" />}
              {activeAmenityTab === 'dining' && <AmenitySection title="Dining" icon={<Icons.utensils />} items={regionAmenities.dining} type="list" />}
              {activeAmenityTab === 'shopping' && <AmenitySection title="Shopping" icon={<Icons.shoppingBag />} items={regionAmenities.shopping} type="list" />}
              {activeAmenityTab === 'medical' && <AmenitySection title="Medical" icon={<Icons.medical />} items={regionAmenities.medical} type="list" />}
              {activeAmenityTab === 'utilities' && <AmenitySection title="Utilities & Services" icon={<Icons.wrench />} items={regionAmenities.utilities} type="grid" />}
              {activeAmenityTab === 'recreation' && <AmenitySection title="Recreation" icon={<Icons.compass />} items={regionAmenities.recreation} type="list" />}
              {activeAmenityTab === 'distances' && (
                <div style={{ marginBottom: '2rem' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1a2332', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Icons.car /> Commute Distances
                  </h3>
                  <div style={{ display: 'grid', gap: '0.75rem' }}>
                    {regionAmenities.distances.map((d, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', background: '#f8f7f5', borderRadius: '10px', border: '1px solid #e8e4df' }}>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#1a2332' }}>{d.to}</div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '0.85rem', color: '#e84393', fontWeight: 600 }}>{d.miles} mi</span>
                          <span style={{ fontSize: '0.78rem', color: '#6b7a8d', marginLeft: '0.5rem' }}>{d.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {!regionAmenities && (
            <div style={{ marginBottom: '3rem', padding: '2rem', background: '#f8f7f5', borderRadius: '14px', border: '1px solid #e8e4df', textAlign: 'center' }}>
              <Icons.map />
              <p style={{ color: '#6b7a8d', marginTop: '0.5rem' }}>Detailed amenity data coming soon for {currentRegion.name}.</p>
              <p style={{ color: '#e84393', fontWeight: 600, fontSize: '0.9rem', marginTop: '0.5rem' }}>Call Holly for the inside scoop!</p>
            </div>
          )}

          {/* Map */}
          <div style={{ marginBottom: '3rem' }}>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.8rem', fontWeight: 600, color: '#1a2332', marginBottom: '1.5rem' }}>Location</h2>
            <RegionMap region={currentRegion} />
          </div>

          {/* Properties */}
          {regionProperties.length > 0 && (
            <div style={{ marginBottom: '3rem' }}>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.8rem', fontWeight: 600, color: '#1a2332', marginBottom: '1.5rem' }}>Available Properties</h2>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                {['all', ...new Set(regionProperties.map(p => p.type))].map(f => {
                  const label = f === 'all' ? 'All' : (propertyTypes[f]?.label || f);
                  return (
                    <button key={f} onClick={() => setActiveFilter(f)} style={{
                      padding: '0.5rem 1rem', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer',
                      border: activeFilter === f ? '2px solid #e84393' : '1px solid #e8e4df',
                      background: activeFilter === f ? 'rgba(232,67,147,0.08)' : 'white',
                      color: activeFilter === f ? '#e84393' : '#6b7a8d', transition: 'all 0.3s ease'
                    }}>
                      {label}
                    </button>
                  );
                })}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                {filteredProperties.map(prop => (
                  <div key={prop.id} className="property-card" style={{ background: 'white', borderRadius: '14px', overflow: 'hidden', border: '1px solid #e8e4df', cursor: 'pointer' }}>
                    <div style={{ height: '160px', background: prop.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icons.home />
                    </div>
                    <div style={{ padding: '1.25rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                        <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#e84393' }}>{prop.price}</div>
                        <span style={{ padding: '0.2rem 0.5rem', background: '#f0eee9', borderRadius: '4px', fontSize: '0.68rem', color: '#6b7a8d', fontWeight: 600 }}>
                          {propertyTypes[prop.type]?.label || prop.type}
                        </span>
                      </div>
                      <div style={{ fontSize: '1rem', fontWeight: 600, color: '#1a2332', marginBottom: '0.5rem' }}>{prop.title}</div>
                      <div style={{ fontSize: '0.82rem', color: '#6b7a8d', marginBottom: '0.75rem' }}>{prop.description}</div>
                      {prop.beds && (
                        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: '#94a3b8' }}>
                          <span>{prop.beds} bed</span><span>{prop.baths} bath</span><span>{prop.sqft} sqft</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Contact CTA */}
          <div style={{ background: 'linear-gradient(135deg, #1a2332, #2c3e50)', borderRadius: '16px', padding: '3rem 2rem', textAlign: 'center', color: 'white' }}>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.8rem', fontWeight: 600, marginBottom: '0.75rem' }}>Interested in {currentRegion.name}?</h2>
            <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '2rem', maxWidth: '500px', margin: '0 auto 2rem' }}>
              Holly has 30+ years of expertise in this area. Get the inside scoop on properties, communities, and what it's really like to live here.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', background: '#e84393', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem' }}>
                <Icons.phone /> Call Holly
              </button>
              <button style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', background: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '10px', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem' }}>
                <Icons.mail /> Email Holly
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ═══ HOME PAGE ═══
  const HomePage = () => (
    <div style={{ minHeight: '100vh', background: '#faf9f7' }}>
      {/* Hero */}
      <div style={{ height: '85vh', position: 'relative', background: 'linear-gradient(135deg, #0f2940 0%, #1a3a52 50%, #0f2940 100%)', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.15) 0%, transparent 50%), radial-gradient(circle at 80% 50%, rgba(139, 92, 246, 0.15) 0%, transparent 50%)' }} />
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3rem', maxWidth: '1200px', width: '100%' }}>
            <div style={{ flex: 1, textAlign: 'left', position: 'relative', zIndex: 1 }}>
              <h1 style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', fontWeight: 800, background: 'linear-gradient(135deg, #e84393 0%, #a78bfa 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '1rem', letterSpacing: '-0.02em', fontFamily: "'Playfair Display', serif" }}>
                Holly Griewahn
              </h1>
              <p style={{ fontSize: 'clamp(1rem, 2.5vw, 1.5rem)', color: '#94a3b8', marginBottom: '0.5rem', fontWeight: 300 }}>
                Foundation Realty | The Irish Hills Authority
              </p>
              <p style={{ fontSize: '1rem', color: '#60a5fa', fontWeight: 600, marginBottom: '1rem' }}>
                Lakes, Farms, Country Estates & Village Living
              </p>
              <p style={{ fontSize: '0.95rem', color: 'rgba(255,255,255,0.5)', marginBottom: '2rem', maxWidth: '520px', lineHeight: 1.7 }}>
                From Grass Lake to Posey Lake, Michigan Center to Tecumseh - 9 distinct regions, 50+ lakes, and every type of property in between. 30+ years of knowing every road, every lake, and every neighbor.
              </p>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <button onClick={() => document.getElementById('region-grid')?.scrollIntoView({ behavior: 'smooth' })} style={{ padding: '0.85rem 2rem', background: '#e84393', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 8px 30px rgba(232,67,147,0.3)' }}>
                  Explore Regions <Icons.arrow />
                </button>
                <button style={{ padding: '0.85rem 2rem', background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.25)', borderRadius: '10px', fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Icons.phone /> Call Holly
                </button>
              </div>
            </div>
            <div style={{ flex: '0 0 auto', display: 'none', paddingLeft: '0.5rem' }} className="holly-photo-container">
              <img src="/images/holly-cutout.png" alt="Holly Griewahn - Foundation Realty" style={{
                height: '500px', maxHeight: '70vh', objectFit: 'contain', filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.4))',
              }} />
            </div>
          </div>
        </div>
      </div>

      {/* Territory Stats Bar */}
      <div style={{ background: '#1a2332', padding: '1.5rem 2rem' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem', textAlign: 'center' }}>
          {[
            { val: '9', label: 'Regions' },
            { val: '50+', label: 'Lakes' },
            { val: '4', label: 'Counties' },
            { val: '30+', label: 'Years Experience' },
            { val: '3', label: 'Round Lakes' },
          ].map(({ val, label }) => (
            <div key={label}>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#e84393' }}>{val}</div>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Region Grid */}
      <section id="region-grid" style={{ padding: '5rem 2rem', background: '#faf9f7' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '2.5rem', fontWeight: 600, color: '#1a2332', marginBottom: '0.75rem' }}>Explore the Territory</h2>
            <div style={{ width: '40px', height: '3px', background: '#e84393', margin: '0 auto 1rem', borderRadius: '2px' }} />
            <p style={{ color: '#6b7a8d', fontSize: '1rem', marginBottom: '1.5rem', maxWidth: '600px', margin: '0 auto 1.5rem' }}>
              Search by lake name, town, property type, or browse by region
            </p>
            <div style={{ maxWidth: '500px', margin: '0 auto', position: 'relative' }}>
              <div style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}><Icons.search /></div>
              <input type="text" placeholder='Try "Devils Lake", "farmland", "Tecumseh", "cottage"...' value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{
                width: '100%', padding: '0.85rem 1rem 0.85rem 2.5rem', borderRadius: '10px', border: '1px solid #e8e4df',
                fontSize: '0.9rem', outline: 'none', fontFamily: 'inherit'
              }} />
            </div>
          </div>

          {searchResults.regions.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '2rem' }}>
              {searchResults.regions.map((region, i) => (
                <div key={region.slug} className="region-card" onClick={() => navigateToRegion(region.slug)} style={{
                  background: 'white', borderRadius: '16px', overflow: 'hidden', cursor: 'pointer',
                  border: '1px solid #e8e4df', animation: `fadeUp 0.6s ease-out ${i * 0.06}s both`, opacity: 0
                }}>
                  <div style={{ height: '160px', background: region.gradient, position: 'relative', display: 'flex', alignItems: 'flex-end', padding: '1.25rem' }}>
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                      <span style={{ padding: '0.25rem 0.6rem', background: 'rgba(255,255,255,0.2)', borderRadius: '6px', fontSize: '0.72rem', color: 'white', fontWeight: 600, backdropFilter: 'blur(4px)' }}>{region.county} County</span>
                      <span style={{ padding: '0.25rem 0.6rem', background: 'rgba(255,255,255,0.2)', borderRadius: '6px', fontSize: '0.72rem', color: 'white', fontWeight: 600, backdropFilter: 'blur(4px)' }}>{region.priceRange}</span>
                      {region.lakes.length > 0 && (
                        <span style={{ padding: '0.25rem 0.6rem', background: 'rgba(255,255,255,0.2)', borderRadius: '6px', fontSize: '0.72rem', color: 'white', fontWeight: 600, backdropFilter: 'blur(4px)' }}>
                          {region.lakes.length} {region.lakes.length === 1 ? 'lake' : 'lakes'}
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ padding: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#1a2332', marginBottom: '0.25rem' }}>{region.name}</h3>
                    <p style={{ fontSize: '0.85rem', color: '#e84393', marginBottom: '0.5rem', fontStyle: 'italic', fontWeight: 500 }}>{region.subtitle}</p>
                    <p style={{ fontSize: '0.82rem', color: '#6b7a8d', marginBottom: '1rem', lineHeight: 1.5 }}>{region.character}</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginBottom: '1rem' }}>
                      {region.propertyTypes.slice(0, 4).map(pt => (
                        <span key={pt} style={{ padding: '0.2rem 0.5rem', background: '#f0eee9', borderRadius: '4px', fontSize: '0.68rem', color: '#6b7a8d', fontWeight: 500 }}>
                          {propertyTypes[pt]?.label || pt}
                        </span>
                      ))}
                    </div>
                    <div className="region-card-cta" style={{ padding: '0.75rem', borderRadius: '10px', textAlign: 'center', fontWeight: 600, fontSize: '0.85rem', border: '2px solid #1a2332', color: '#1a2332', transition: 'all 0.4s ease', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                      Explore Region <Icons.arrow />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
              <p style={{ color: '#94a3b8', fontSize: '1.1rem', marginBottom: '0.5rem' }}>No results for "{searchQuery}"</p>
              <p style={{ color: '#6b7a8d', fontSize: '0.9rem' }}>Try a lake name, town, or property type like "farm" or "lakefront"</p>
            </div>
          )}
        </div>
      </section>

      {/* Testimonials */}
      <section style={{ padding: '6rem 2rem', background: '#1a2332', color: 'white' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '2.5rem', fontWeight: 600, marginBottom: '0.75rem' }}>What Clients Say</h2>
            <div style={{ width: '40px', height: '3px', background: '#e84393', margin: '0 auto', borderRadius: '2px' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
            {testimonials.map((t, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '16px', padding: '2.5rem 2rem', border: '1px solid rgba(255,255,255,0.06)', position: 'relative', animation: `fadeUp 0.6s ease-out ${i * 0.15}s both`, opacity: 0 }}>
                <div style={{ position: 'absolute', top: '1.5rem', left: '1.5rem' }}><Icons.quote /></div>
                <p style={{ fontSize: '1.05rem', lineHeight: 1.7, color: 'rgba(255,255,255,0.8)', marginBottom: '1.5rem', fontStyle: 'italic', position: 'relative' }}>"{t.quote}"</p>
                <div>
                  <div style={{ fontWeight: 600, color: 'white' }}>{t.name}</div>
                  <div style={{ fontSize: '0.82rem', color: '#e84393' }}>{t.location}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Blog Preview */}
      <section style={{ padding: '5rem 2rem', background: '#faf9f7' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '2.5rem', fontWeight: 600, color: '#1a2332', marginBottom: '0.75rem' }}>Local Knowledge Blog</h2>
            <div style={{ width: '40px', height: '3px', background: '#e84393', margin: '0 auto 1rem', borderRadius: '2px' }} />
            <p style={{ color: '#6b7a8d', fontSize: '1.05rem' }}>Tips, guides, and market insights from Holly</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
            {blogPosts.slice(0, 3).map((post, i) => (
              <div key={post.id} className="region-card" style={{ background: 'white', borderRadius: '16px', overflow: 'hidden', border: '1px solid #e8e4df', cursor: 'pointer', animation: `fadeUp 0.6s ease-out ${i * 0.1}s both`, opacity: 0 }}>
                <div style={{ height: '12px', background: 'linear-gradient(135deg, #e84393, #f093fb)' }} />
                <div style={{ padding: '1.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                    <span style={{ padding: '0.25rem 0.6rem', background: 'rgba(232,67,147,0.1)', borderRadius: '6px', fontSize: '0.72rem', color: '#e84393', fontWeight: 600 }}>{post.category}</span>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Icons.clock /> {post.readTime}</span>
                  </div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1a2332', marginBottom: '0.75rem', lineHeight: 1.4 }}>{post.title}</h3>
                  <p style={{ fontSize: '0.88rem', color: '#6b7a8d', lineHeight: 1.6, marginBottom: '1rem' }}>{post.excerpt}</p>
                  <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>{post.date}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
            <button onClick={navigateToBlog} style={{ padding: '0.75rem 2rem', background: 'white', color: '#1a2332', border: '2px solid #1a2332', borderRadius: '10px', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', transition: 'all 0.3s ease' }}>
              View All Posts <Icons.arrow />
            </button>
          </div>
        </div>
      </section>
    </div>
  );

  // ═══ BLOG PAGE ═══
  const BlogPage = () => (
    <div style={{ minHeight: '100vh', background: '#faf9f7' }}>
      <div style={{ height: '40vh', minHeight: '300px', position: 'relative', background: 'linear-gradient(135deg, #1a2332 0%, #2c3e50 100%)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <button onClick={navigateHome} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', color: 'white', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', marginBottom: '2rem' }}>
            <Icons.back /> Home
          </button>
          <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 800, color: 'white', fontFamily: "'Playfair Display', serif", marginBottom: '0.75rem' }}>Local Knowledge Blog</h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1.1rem' }}>Tips, guides, and market insights from Holly Griewahn</p>
        </div>
      </div>
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '3rem 2rem' }}>
        {blogPosts.map((post, i) => (
          <article key={post.id} style={{ background: 'white', borderRadius: '16px', border: '1px solid #e8e4df', padding: '2rem', marginBottom: '1.5rem', cursor: 'pointer', transition: 'all 0.3s ease', animation: `fadeUp 0.5s ease-out ${i * 0.08}s both`, opacity: 0 }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 15px 40px rgba(26,35,50,0.1)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <span style={{ padding: '0.25rem 0.6rem', background: 'rgba(232,67,147,0.1)', borderRadius: '6px', fontSize: '0.75rem', color: '#e84393', fontWeight: 600 }}>{post.category}</span>
              <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>{post.date}</span>
              <span style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Icons.clock /> {post.readTime}</span>
            </div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#1a2332', marginBottom: '0.75rem', lineHeight: 1.4 }}>{post.title}</h2>
            <p style={{ fontSize: '0.95rem', color: '#6b7a8d', lineHeight: 1.7, marginBottom: '1rem' }}>{post.excerpt}</p>
            <span style={{ fontSize: '0.85rem', color: '#e84393', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>Read More <Icons.arrow /></span>
          </article>
        ))}
      </div>
    </div>
  );

  // ═══ MAIN RETURN ═══
  return (
    <div style={{ fontFamily: "'DM Sans', -apple-system, sans-serif", color: '#1a2332', minHeight: '100vh', background: '#faf9f7' }}>
      <style>{css}{`
        @media (min-width: 900px) {
          .holly-photo-container { display: block !important; }
        }
        @media (max-width: 600px) {
          .phone-text { display: none; }
        }
        @media (max-width: 400px) {
          .stat-bar-grid { grid-template-columns: repeat(3, 1fr) !important; }
        }
      `}</style>

      {/* Navigation */}
      <nav style={{
        position: 'fixed', top: 0, width: '100%', zIndex: 1000, transition: 'all 0.4s ease',
        background: scrolled ? 'rgba(250,249,247,0.95)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(26,35,50,0.08)' : '1px solid transparent',
        padding: scrolled ? '0.75rem 2rem' : '1.25rem 2rem'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }} onClick={navigateHome}>
            <img src="/images/foundation-logo.png" alt="Foundation Realty" style={{ height: '32px' }} />
            <span style={{ fontWeight: 700, fontSize: '1rem', color: scrolled ? '#1a2332' : 'white', transition: 'color 0.4s ease' }}>Holly Griewahn</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <button onClick={navigateHome} style={{ background: 'none', border: 'none', cursor: 'pointer', color: scrolled ? '#1a2332' : 'white', fontWeight: 600, fontSize: '0.85rem', transition: 'color 0.4s ease', fontFamily: 'inherit' }}>Regions</button>
            <button onClick={navigateToBlog} style={{ background: 'none', border: 'none', cursor: 'pointer', color: scrolled ? '#1a2332' : 'white', fontWeight: 600, fontSize: '0.85rem', transition: 'color 0.4s ease', fontFamily: 'inherit' }}>Blog</button>
            <a href="tel:5174033413" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: scrolled ? '#e84393' : 'white', textDecoration: 'none', fontWeight: 600, fontSize: '0.85rem', transition: 'color 0.4s ease' }}>
              <Icons.phone /> <span className="phone-text">(517) 403-3413</span>
            </a>
          </div>
        </div>
      </nav>

      {/* Page Content */}
      {currentView === 'home' ? <HomePage /> : currentView === 'blog' ? <BlogPage /> : <RegionDetailPage />}

      {/* Footer */}
      <footer style={{ background: '#0f1923', padding: '4rem 2rem 2rem', color: '#94a3b8' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <img src="/images/foundation-logo.png" alt="Foundation Realty" style={{ height: '32px' }} />
              <span style={{ fontWeight: 700, color: 'white', fontSize: '1rem' }}>Foundation Realty</span>
            </div>
            <p style={{ fontSize: '0.9rem', lineHeight: 1.7, marginBottom: '1rem' }}>
              Holly Griewahn brings 30+ years of local expertise to every transaction. From lakefront estates to family farms, village homes to country retreats - the Irish Hills authority.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <a href="tel:5174033413" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#e84393', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 500 }}>
                <Icons.phone /> (517) 403-3413
              </a>
            </div>
          </div>
          <div>
            <h3 style={{ fontFamily: "'Playfair Display', serif", color: 'white', marginBottom: '1rem', fontSize: '1.2rem' }}>Explore</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {['All Regions', 'Lakefront Properties', 'Rural & Farm Properties', 'Blog', 'Contact Holly'].map(link => (
                <a key={link} href="#" onClick={(e) => { e.preventDefault(); if (link === 'All Regions') navigateHome(); if (link === 'Blog') navigateToBlog(); }}
                  style={{ color: '#94a3b8', textDecoration: 'none', transition: 'color 0.3s ease', fontSize: '0.9rem' }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#e84393'}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}
                >{link}</a>
              ))}
            </div>
          </div>
          <div>
            <h3 style={{ fontFamily: "'Playfair Display', serif", color: 'white', marginBottom: '1rem', fontSize: '1.2rem' }}>Regions</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {Object.values(regions).slice(0, 6).map(r => (
                <a key={r.slug} href="#" onClick={(e) => { e.preventDefault(); navigateToRegion(r.slug); }}
                  style={{ color: '#94a3b8', textDecoration: 'none', transition: 'color 0.3s ease', fontSize: '0.9rem' }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#e84393'}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}
                >{r.name}</a>
              ))}
            </div>
          </div>
        </div>
        <div style={{ paddingTop: '2rem', borderTop: '1px solid rgba(232,67,147,0.2)', textAlign: 'center', fontSize: '0.9rem' }}>
          <p>&copy; 2025 Holly Griewahn | Foundation Realty | Irish Hills Real Estate</p>
          <p style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>All listings and information deemed reliable but not guaranteed.</p>
        </div>
      </footer>
    </div>
  );
}
