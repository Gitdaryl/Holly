import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { regions } from '../data/regions';
import { propertiesData, propertyTypes } from '../data/amenities';

export default function PropertyPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [formData, setFormData] = useState({ firstName: '', lastName: '', email: '', phone: '', message: '', preferredTime: '' });
  const [formStatus, setFormStatus] = useState('idle');
  const [formError, setFormError] = useState('');

  useEffect(() => {
    window.scrollTo({ top: 0 });
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const property = propertiesData.find(p => String(p.id) === String(id));
  const region = property ? regions[property.region] : null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormStatus('sending');
    setFormError('');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          message: `Property Inquiry: ${property?.title} (${property?.price})\n\nPreferred time: ${formData.preferredTime}\n\n${formData.message}`,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Send failed');
      setFormStatus('sent');
    } catch (err) {
      setFormStatus('idle');
      setFormError(err.message || 'Something went wrong. Try calling directly.');
    }
  };

  if (!property) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#faf9f7', fontFamily: "'DM Sans', sans-serif", padding: '2rem', textAlign: 'center' }}>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '2rem', color: '#1a2332', marginBottom: '1rem' }}>Property Not Found</h1>
        <p style={{ color: '#6b7a8d', marginBottom: '2rem' }}>This listing may no longer be available. Call Holly for current properties.</p>
        <Link to="/listings" style={{ background: '#e84393', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '10px', textDecoration: 'none', fontWeight: 700 }}>
          Browse All Listings
        </Link>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#faf9f7', fontFamily: "'DM Sans', -apple-system, sans-serif", color: '#1a2332' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700;800&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @media (max-width: 768px) {
          .property-layout { flex-direction: column !important; }
          .property-sidebar { position: static !important; width: 100% !important; }
        }
        @media (max-width: 600px) {
          .mobile-cta { display: flex !important; }
        }
      `}</style>

      {/* Nav */}
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: scrolled ? 'rgba(250,249,247,0.97)' : 'rgba(15,25,35,0.6)',
        backdropFilter: 'blur(12px)',
        borderBottom: scrolled ? '1px solid #e8e4df' : 'none',
        transition: 'all 0.4s ease', padding: '1rem 2rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: 38, height: 38, borderRadius: '50%', background: scrolled ? '#1a2332' : 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          </div>
          <span style={{ color: scrolled ? '#1a2332' : 'white', fontWeight: 700, fontSize: '0.95rem' }}>Holly Griewahn</span>
        </Link>
        <nav style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          <Link to="/listings" style={{ color: scrolled ? '#4a5568' : 'rgba(255,255,255,0.85)', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600 }}>
            ← Listings
          </Link>
          <a href="tel:5174033413" style={{ background: '#e84393', color: 'white', padding: '0.45rem 1.1rem', borderRadius: '8px', textDecoration: 'none', fontSize: '0.82rem', fontWeight: 600 }}>
            Call Holly
          </a>
        </nav>
      </header>

      {/* Photo Hero */}
      <div style={{
        height: '55vh', minHeight: '380px',
        background: property.gradient,
        display: 'flex', alignItems: 'flex-end',
        padding: '0 2rem 2.5rem',
        position: 'relative',
      }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.55) 100%)' }} />
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.12 }}>
          <svg width="120" height="120" viewBox="0 0 24 24" fill="white" stroke="none"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22" fill="white"/></svg>
        </div>
        <div style={{ position: 'relative', zIndex: 1, maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            <span style={{ background: 'rgba(232,67,147,0.9)', color: 'white', padding: '0.3rem 0.8rem', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
              {propertyTypes[property.type]?.label || property.type}
            </span>
            <span style={{ background: 'rgba(34,197,94,0.85)', color: 'white', padding: '0.3rem 0.8rem', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 700 }}>Active</span>
          </div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 800, color: 'white', lineHeight: 1.2, marginBottom: '0.5rem' }}>
            {property.title}
          </h1>
          {region && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
              {region.name}
            </div>
          )}
        </div>
      </div>

      {/* Mobile sticky CTA */}
      <div className="mobile-cta" style={{ display: 'none', position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 90, background: 'white', borderTop: '1px solid #e8e4df', padding: '0.75rem 1.5rem', gap: '0.75rem' }}>
        <a href="tel:5174033413" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', background: '#e84393', color: 'white', padding: '0.75rem', borderRadius: '10px', textDecoration: 'none', fontWeight: 700, fontSize: '0.9rem' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
          Call Holly
        </a>
        <a href="#request-tour" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'white', color: '#1a2332', padding: '0.75rem', borderRadius: '10px', textDecoration: 'none', fontWeight: 700, fontSize: '0.9rem', border: '2px solid #1a2332' }}>
          Request Tour
        </a>
      </div>

      {/* Content */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2.5rem 1.5rem 5rem' }}>
        <div className="property-layout" style={{ display: 'flex', gap: '2.5rem', alignItems: 'flex-start' }}>

          {/* Main column */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Price + Stats */}
            <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e8e4df', padding: '1.75rem', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#e84393', fontFamily: "'Playfair Display', serif", marginBottom: '1rem' }}>
                {property.price}
              </div>
              {property.beds && (
                <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                  {[
                    { label: 'Bedrooms', value: property.beds },
                    { label: 'Bathrooms', value: property.baths },
                    { label: 'Sq Ft', value: property.sqft },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1a2332' }}>{value}</div>
                      <div style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Description */}
            <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e8e4df', padding: '1.75rem', marginBottom: '1.5rem' }}>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.3rem', fontWeight: 700, marginBottom: '1rem', color: '#1a2332' }}>About This Property</h2>
              <p style={{ color: '#4a5568', lineHeight: 1.8, fontSize: '0.95rem' }}>{property.description}</p>
              {region && (
                <div style={{ marginTop: '1.25rem', padding: '1rem', background: '#f8f7f5', borderRadius: '10px', border: '1px solid #e8e4df' }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.4rem' }}>Location</div>
                  <div style={{ fontWeight: 600, color: '#1a2332', marginBottom: '0.2rem' }}>{region.name}</div>
                  <div style={{ fontSize: '0.85rem', color: '#6b7a8d' }}>{region.county} County — {region.priceRange}</div>
                </div>
              )}
            </div>

            {/* Region Context */}
            {region && (
              <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e8e4df', padding: '1.75rem', marginBottom: '1.5rem' }}>
                <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.3rem', fontWeight: 700, marginBottom: '0.75rem', color: '#1a2332' }}>About {region.name}</h2>
                <p style={{ color: '#4a5568', lineHeight: 1.7, fontSize: '0.9rem', marginBottom: '1rem' }}>{region.description}</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
                  {region.highlights.slice(0, 4).map((h, i) => (
                    <span key={i} style={{ padding: '0.3rem 0.75rem', background: '#f0eee9', borderRadius: '20px', fontSize: '0.78rem', color: '#4a5568', fontWeight: 500 }}>{h}</span>
                  ))}
                </div>
                <Link to={`/?region=${region.slug}`} style={{ color: '#e84393', fontSize: '0.85rem', fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                  Explore {region.name}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                </Link>
              </div>
            )}

            {/* Map placeholder */}
            {region?.coordinates && (
              <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e8e4df', padding: '1.75rem', marginBottom: '1.5rem' }}>
                <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.3rem', fontWeight: 700, marginBottom: '1rem', color: '#1a2332' }}>Location Map</h2>
                <div style={{ borderRadius: '12px', overflow: 'hidden', height: '300px' }}>
                  <iframe
                    title="Property Location"
                    src={`https://www.google.com/maps/embed/v1/place?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''}&q=${region.coordinates.lat},${region.coordinates.lng}&zoom=13&maptype=satellite`}
                    style={{ width: '100%', height: '100%', border: 'none' }}
                    allowFullScreen
                  />
                </div>
              </div>
            )}
          </div>

          {/* Sidebar - Request a Showing form */}
          <div className="property-sidebar" style={{ width: '340px', flexShrink: 0, position: 'sticky', top: '90px' }}>
            <div id="request-tour" style={{ background: 'white', borderRadius: '16px', border: '1px solid #e8e4df', padding: '1.75rem', marginBottom: '1rem' }}>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.2rem', fontWeight: 700, color: '#1a2332', marginBottom: '0.25rem' }}>Request a Showing</h3>
              <p style={{ fontSize: '0.82rem', color: '#94a3b8', marginBottom: '1.25rem' }}>Holly will get back to you within a few hours.</p>

              {formStatus === 'sent' ? (
                <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
                  <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(34,197,94,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                  <h4 style={{ fontFamily: "'Playfair Display', serif", color: '#1a2332', marginBottom: '0.5rem' }}>Request Sent!</h4>
                  <p style={{ fontSize: '0.85rem', color: '#6b7a8d', lineHeight: 1.6 }}>Holly will reach out soon. You can also call her directly at <a href="tel:5174033413" style={{ color: '#e84393', fontWeight: 600, textDecoration: 'none' }}>(517) 403-3413</a></p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                    <div>
                      <label style={{ fontSize: '0.73rem', fontWeight: 700, color: '#6b7a8d', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '0.35rem' }}>First Name *</label>
                      <input required value={formData.firstName} onChange={e => setFormData(d => ({ ...d, firstName: e.target.value }))} style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid #e8e4df', fontSize: '0.88rem', fontFamily: 'inherit', outline: 'none' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.73rem', fontWeight: 700, color: '#6b7a8d', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '0.35rem' }}>Last Name</label>
                      <input value={formData.lastName} onChange={e => setFormData(d => ({ ...d, lastName: e.target.value }))} style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid #e8e4df', fontSize: '0.88rem', fontFamily: 'inherit', outline: 'none' }} />
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.73rem', fontWeight: 700, color: '#6b7a8d', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '0.35rem' }}>Email *</label>
                    <input required type="email" value={formData.email} onChange={e => setFormData(d => ({ ...d, email: e.target.value }))} style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid #e8e4df', fontSize: '0.88rem', fontFamily: 'inherit', outline: 'none' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.73rem', fontWeight: 700, color: '#6b7a8d', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '0.35rem' }}>Phone</label>
                    <input type="tel" value={formData.phone} onChange={e => setFormData(d => ({ ...d, phone: e.target.value }))} style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid #e8e4df', fontSize: '0.88rem', fontFamily: 'inherit', outline: 'none' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.73rem', fontWeight: 700, color: '#6b7a8d', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '0.35rem' }}>Preferred Time</label>
                    <select value={formData.preferredTime} onChange={e => setFormData(d => ({ ...d, preferredTime: e.target.value }))} style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid #e8e4df', fontSize: '0.88rem', fontFamily: 'inherit', background: 'white', cursor: 'pointer', outline: 'none' }}>
                      <option value="">Any time</option>
                      <option>Weekday morning</option>
                      <option>Weekday afternoon</option>
                      <option>Weekend morning</option>
                      <option>Weekend afternoon</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.73rem', fontWeight: 700, color: '#6b7a8d', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '0.35rem' }}>Message</label>
                    <textarea value={formData.message} onChange={e => setFormData(d => ({ ...d, message: e.target.value }))} rows={3} placeholder="Questions, financing situation, timeline..." style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid #e8e4df', fontSize: '0.88rem', fontFamily: 'inherit', resize: 'vertical', outline: 'none' }} />
                  </div>
                  {formError && <p style={{ color: '#ef4444', fontSize: '0.82rem' }}>{formError}</p>}
                  <button type="submit" disabled={formStatus === 'sending'} style={{ background: '#e84393', color: 'white', border: 'none', padding: '0.85rem', borderRadius: '10px', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', fontFamily: 'inherit', opacity: formStatus === 'sending' ? 0.7 : 1, transition: 'opacity 0.2s' }}>
                    {formStatus === 'sending' ? 'Sending...' : 'Request Showing'}
                  </button>
                </form>
              )}
            </div>

            {/* Agent card */}
            <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e8e4df', padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg, #1a2332, #2c4a6e)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ color: 'white', fontWeight: 800, fontSize: '1.1rem' }}>H</span>
              </div>
              <div>
                <div style={{ fontWeight: 700, color: '#1a2332', fontSize: '0.95rem' }}>Holly Griewahn</div>
                <div style={{ fontSize: '0.78rem', color: '#6b7a8d' }}>Foundation Realty</div>
                <a href="tel:5174033413" style={{ fontSize: '0.82rem', color: '#e84393', fontWeight: 600, textDecoration: 'none' }}>(517) 403-3413</a>
              </div>
            </div>
          </div>
        </div>

        {/* More in this region */}
        {region && (() => {
          const similar = propertiesData.filter(p => p.region === property.region && p.id !== property.id).slice(0, 3);
          if (!similar.length) return null;
          return (
            <div style={{ marginTop: '3rem' }}>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.5rem', fontWeight: 700, color: '#1a2332', marginBottom: '1.25rem' }}>
                More in {region.name}
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.25rem' }}>
                {similar.map(p => (
                  <Link key={p.id} to={`/property/${p.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div style={{ background: 'white', borderRadius: '14px', overflow: 'hidden', border: '1px solid #e8e4df', transition: 'all 0.3s ease' }}
                      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 12px 30px rgba(26,35,50,0.1)'; }}
                      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                    >
                      <div style={{ height: '140px', background: p.gradient }} />
                      <div style={{ padding: '1rem' }}>
                        <div style={{ fontWeight: 700, color: '#e84393', fontSize: '1.1rem', marginBottom: '0.25rem' }}>{p.price}</div>
                        <div style={{ fontWeight: 600, color: '#1a2332', fontSize: '0.9rem', marginBottom: '0.25rem' }}>{p.title}</div>
                        {p.beds && <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>{p.beds} bed · {p.baths} bath · {p.sqft} sqft</div>}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
              <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                <Link to={`/listings?region=${property.region}`} style={{ color: '#e84393', fontWeight: 700, textDecoration: 'none', fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                  View all listings in {region.name}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                </Link>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Footer */}
      <footer style={{ background: '#0f1923', padding: '2rem', textAlign: 'center' }}>
        <p style={{ color: '#64748b', fontSize: '0.82rem' }}>&copy; 2025 Holly Griewahn | Foundation Realty | Irish Hills Real Estate</p>
        <p style={{ color: '#475569', fontSize: '0.75rem', marginTop: '0.4rem' }}>All listings and information deemed reliable but not guaranteed.</p>
      </footer>
    </div>
  );
}
