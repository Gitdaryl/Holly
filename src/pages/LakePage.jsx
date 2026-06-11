import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { lakes } from '../data/lakes';
import { regions } from '../data/regions';
import { propertiesData, propertyTypes } from '../data/amenities';

const TYPE_COLOR = {
  'all-sports': { bg: 'rgba(59,130,246,0.1)', text: '#2563eb', label: 'All-Sports Lake' },
  'no-wake': { bg: 'rgba(16,185,129,0.1)', text: '#059669', label: 'No-Wake Lake' },
  'private': { bg: 'rgba(168,85,247,0.1)', text: '#7c3aed', label: 'Private Lake' },
};

const LAKE_GRADIENTS = {
  'all-sports': 'linear-gradient(135deg, #0f2d5e 0%, #1a4d8f 40%, #1e6fbf 100%)',
  'no-wake': 'linear-gradient(135deg, #0d3d2b 0%, #1a5c40 40%, #1e8c5e 100%)',
  'private': 'linear-gradient(135deg, #2d1a5e 0%, #4a2d8f 40%, #6b3fbf 100%)',
};

function StatCard({ label, value, sub }) {
  return (
    <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e8e4df', padding: '1rem 1.25rem', textAlign: 'center' }}>
      <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1a2332', fontFamily: "'Playfair Display', serif" }}>{value}</div>
      <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '0.25rem' }}>{label}</div>
      {sub && <div style={{ fontSize: '0.72rem', color: '#cbd5e0', marginTop: '0.15rem' }}>{sub}</div>}
    </div>
  );
}

export default function LakePage() {
  const { slug } = useParams();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0 });
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const lake = lakes[slug];
  const region = lake ? regions[lake.region] : null;
  const nearbyProps = lake
    ? propertiesData.filter(p => p.region === lake.region).slice(0, 3)
    : [];

  useEffect(() => {
    if (lake) {
      document.title = `${lake.name} Michigan Real Estate | Holly Griewahn`;
    }
  }, [lake]);

  if (!lake) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#faf9f7', fontFamily: "'DM Sans', sans-serif", padding: '2rem', textAlign: 'center' }}>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '2rem', color: '#1a2332', marginBottom: '1rem' }}>Lake Not Found</h1>
        <Link to="/" style={{ background: '#e84393', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '10px', textDecoration: 'none', fontWeight: 700 }}>
          Browse All Regions
        </Link>
      </div>
    );
  }

  const typeStyle = TYPE_COLOR[lake.type] || TYPE_COLOR['all-sports'];
  const gradient = LAKE_GRADIENTS[lake.type] || LAKE_GRADIENTS['all-sports'];

  return (
    <div style={{ minHeight: '100vh', background: '#faf9f7', fontFamily: "'DM Sans', -apple-system, sans-serif", color: '#1a2332' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700;800&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @media (max-width: 768px) { .lake-grid { grid-template-columns: repeat(2, 1fr) !important; } }
      `}</style>

      {/* Nav */}
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: scrolled ? 'rgba(250,249,247,0.97)' : 'rgba(15,25,50,0.5)',
        backdropFilter: 'blur(12px)',
        borderBottom: scrolled ? '1px solid #e8e4df' : 'none',
        transition: 'all 0.4s ease', padding: '1rem 2rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: scrolled ? '#1a2332' : 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          </div>
          <span style={{ color: scrolled ? '#1a2332' : 'white', fontWeight: 700, fontSize: '0.9rem' }}>Holly Griewahn</span>
        </Link>
        <nav style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
          <Link to="/listings" style={{ color: scrolled ? '#4a5568' : 'rgba(255,255,255,0.85)', textDecoration: 'none', fontSize: '0.82rem', fontWeight: 600 }}>Listings</Link>
          <Link to="/cma" style={{ color: scrolled ? '#4a5568' : 'rgba(255,255,255,0.85)', textDecoration: 'none', fontSize: '0.82rem', fontWeight: 600 }}>Home Value</Link>
          <a href="tel:5174033413" style={{ background: '#e84393', color: 'white', padding: '0.4rem 1rem', borderRadius: '8px', textDecoration: 'none', fontSize: '0.8rem', fontWeight: 600 }}>
            Call Holly
          </a>
        </nav>
      </header>

      {/* Hero */}
      <div style={{
        minHeight: '52vh', background: gradient,
        display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
        padding: '0 2rem 3rem', position: 'relative', overflow: 'hidden',
      }}>
        {/* Water ripple effect */}
        <div style={{ position: 'absolute', inset: 0, opacity: 0.06, backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 40px, rgba(255,255,255,0.5) 40px, rgba(255,255,255,0.5) 41px)' }} />
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(ellipse at 20% 80%, rgba(255,255,255,0.06) 0%, transparent 60%)' }} />

        <div style={{ maxWidth: '900px', position: 'relative', zIndex: 1 }}>
          {/* Breadcrumb */}
          <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', marginBottom: '1rem', fontSize: '0.78rem' }}>
            <Link to="/" style={{ color: 'rgba(255,255,255,0.55)', textDecoration: 'none' }}>Irish Hills</Link>
            <span style={{ color: 'rgba(255,255,255,0.35)' }}>›</span>
            {region && <Link to={`/?region=${lake.region}`} style={{ color: 'rgba(255,255,255,0.55)', textDecoration: 'none' }}>{region.name}</Link>}
            <span style={{ color: 'rgba(255,255,255,0.35)' }}>›</span>
            <span style={{ color: 'rgba(255,255,255,0.8)' }}>{lake.name}</span>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            <span style={{ background: typeStyle.bg, color: 'white', padding: '0.3rem 0.8rem', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,0.2)' }}>
              {typeStyle.label}
            </span>
            {lake.access === 'public' && (
              <span style={{ background: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.9)', padding: '0.3rem 0.8rem', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 700, border: '1px solid rgba(255,255,255,0.2)' }}>Public Access</span>
            )}
            {lake.access === 'private' && (
              <span style={{ background: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.9)', padding: '0.3rem 0.8rem', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 700, border: '1px solid rgba(255,255,255,0.2)' }}>Private / HOA</span>
            )}
          </div>

          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(2rem, 5vw, 3.2rem)', fontWeight: 800, color: 'white', lineHeight: 1.15, marginBottom: '0.6rem' }}>
            {lake.name}
          </h1>
          {lake.tagline && (
            <p style={{ fontSize: '1.05rem', color: 'rgba(255,255,255,0.72)', fontWeight: 400, maxWidth: '520px' }}>{lake.tagline}</p>
          )}
        </div>
      </div>

      {/* Stats bar */}
      <div style={{ background: 'white', borderBottom: '1px solid #e8e4df', padding: '1.25rem 2rem' }}>
        <div className="lake-grid" style={{ maxWidth: '900px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
          <StatCard label="Surface Area" value={`${lake.acres?.toLocaleString() || '—'} ac`} />
          <StatCard label="Max Depth" value={lake.depth ? `${lake.depth} ft` : '—'} />
          <StatCard label="Type" value={lake.type === 'all-sports' ? 'All-Sports' : lake.type === 'no-wake' ? 'No-Wake' : 'Private'} />
          <StatCard label="Avg Home Price" value={lake.avgPrice || '—'} sub="lakefront" />
        </div>
      </div>

      {/* Main content */}
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2.5rem 1.5rem 4rem' }}>

        {/* About */}
        <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e8e4df', padding: '2rem', marginBottom: '1.5rem' }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.4rem', fontWeight: 700, color: '#1a2332', marginBottom: '1rem' }}>
            About {lake.name}
          </h2>
          <p style={{ color: '#4a5568', lineHeight: 1.8, fontSize: '0.95rem', marginBottom: lake.features?.length ? '1.5rem' : 0 }}>
            {lake.description}
          </p>
          {lake.features?.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {lake.features.map((f, i) => (
                <span key={i} style={{ padding: '0.3rem 0.75rem', background: '#f0f9ff', borderRadius: '20px', fontSize: '0.78rem', color: '#2563eb', fontWeight: 600, border: '1px solid #bfdbfe' }}>{f}</span>
              ))}
            </div>
          )}
        </div>

        {/* Two columns: fishing + rules */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.5rem' }}>

          {lake.fishSpecies?.length > 0 && (
            <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e8e4df', padding: '1.5rem' }}>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.1rem', fontWeight: 700, color: '#1a2332', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#e84393" strokeWidth="2"><path d="M6.5 12c.94-3.46 4.94-6 8.5-6 3.56 0 6.06 2.54 7 6-.94 3.47-3.44 6-7 6s-7.56-2.53-8.5-6z"/></svg>
                Fish Species
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {lake.fishSpecies.map((f, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.88rem', color: '#4a5568' }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#e84393', flexShrink: 0 }} />
                    {f}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e8e4df', padding: '1.5rem' }}>
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.1rem', fontWeight: 700, color: '#1a2332', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#e84393" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              Lake Details
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {lake.wakeHours && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ color: '#6b7a8d' }}>Wake hours</span>
                  <span style={{ color: '#1a2332', fontWeight: 600 }}>{lake.wakeHours}</span>
                </div>
              )}
              {lake.association && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ color: '#6b7a8d' }}>Association</span>
                  <span style={{ color: '#1a2332', fontWeight: 600, textAlign: 'right', maxWidth: '55%' }}>{lake.association}</span>
                </div>
              )}
              {lake.annualDues && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ color: '#6b7a8d' }}>Annual dues</span>
                  <span style={{ color: '#1a2332', fontWeight: 600 }}>{lake.annualDues}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ color: '#6b7a8d' }}>Access</span>
                <span style={{ color: '#1a2332', fontWeight: 600, textTransform: 'capitalize' }}>{lake.access || 'Public'}</span>
              </div>
              {region && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ color: '#6b7a8d' }}>Area</span>
                  <span style={{ color: '#1a2332', fontWeight: 600 }}>{region.county} County</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Map */}
        {region?.coordinates && (
          <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e8e4df', padding: '1.5rem', marginBottom: '1.5rem' }}>
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.1rem', fontWeight: 700, color: '#1a2332', marginBottom: '1rem' }}>Location</h3>
            <div style={{ borderRadius: '12px', overflow: 'hidden', height: '280px' }}>
              <iframe
                title={`${lake.name} location map`}
                src={`https://www.google.com/maps/embed/v1/place?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''}&q=${lake.name}+Michigan&zoom=13&maptype=satellite`}
                style={{ width: '100%', height: '100%', border: 'none' }}
                allowFullScreen
              />
            </div>
          </div>
        )}

        {/* Nearby properties */}
        {nearbyProps.length > 0 && (
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '1rem' }}>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.3rem', fontWeight: 700, color: '#1a2332' }}>
                Properties Near {lake.name}
              </h2>
              <Link to={`/listings?region=${lake.region}`} style={{ color: '#e84393', fontSize: '0.82rem', fontWeight: 700, textDecoration: 'none' }}>
                View all →
              </Link>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem' }}>
              {nearbyProps.map(p => (
                <Link key={p.id} to={`/property/${p.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div style={{ background: 'white', borderRadius: '14px', overflow: 'hidden', border: '1px solid #e8e4df', transition: 'all 0.25s ease' }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 10px 28px rgba(26,35,50,0.1)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                  >
                    <div style={{ height: '130px', background: p.gradient }} />
                    <div style={{ padding: '0.9rem' }}>
                      <div style={{ fontWeight: 800, color: '#e84393', fontSize: '1.05rem', marginBottom: '0.2rem' }}>{p.price}</div>
                      <div style={{ fontWeight: 600, color: '#1a2332', fontSize: '0.88rem', marginBottom: '0.25rem' }}>{p.title}</div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{propertyTypes[p.type]?.label}</div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Region context */}
        {region && (
          <div style={{ background: 'linear-gradient(135deg, #1a2332, #2c3e50)', borderRadius: '16px', padding: '2rem', color: 'white', display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.4rem' }}>Part of</div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.4rem' }}>{region.name}</div>
              <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.65)', lineHeight: 1.5 }}>{region.character}</div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <Link to={`/?region=${lake.region}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(255,255,255,0.12)', color: 'white', padding: '0.6rem 1.1rem', borderRadius: '8px', textDecoration: 'none', fontWeight: 600, fontSize: '0.85rem', border: '1px solid rgba(255,255,255,0.2)' }}>
                Explore Region
              </Link>
              <Link to="/cma" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: '#e84393', color: 'white', padding: '0.6rem 1.1rem', borderRadius: '8px', textDecoration: 'none', fontWeight: 600, fontSize: '0.85rem' }}>
                What's My Home Worth?
              </Link>
            </div>
          </div>
        )}
      </div>

      <footer style={{ background: '#0f1923', padding: '2rem', textAlign: 'center' }}>
        <p style={{ color: '#64748b', fontSize: '0.82rem' }}>&copy; 2025 Holly Griewahn | Foundation Realty | Irish Hills Real Estate</p>
      </footer>
    </div>
  );
}
