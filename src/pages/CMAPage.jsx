import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const PROPERTY_TYPES = [
  { value: 'lakefront', label: 'Lakefront' },
  { value: 'lake-access', label: 'Lake Access / Deeded' },
  { value: 'waterfront-other', label: 'River / Pond / Waterfront' },
  { value: 'rural', label: 'Rural / Country' },
  { value: 'farm', label: 'Farm / Agricultural' },
  { value: 'historic', label: 'Historic / Vintage' },
  { value: 'residential', label: 'Residential / Subdivision' },
  { value: 'condo', label: 'Condo / Cottage' },
];

const CONDITIONS = [
  { value: 'excellent', label: 'Excellent', desc: 'Move-in ready, recently updated' },
  { value: 'good', label: 'Good', desc: 'Well maintained, minor updates needed' },
  { value: 'fair', label: 'Fair', desc: 'Functional but needs cosmetic work' },
  { value: 'needs-work', label: 'Needs Work', desc: 'Major repairs or renovation needed' },
];

const TIMELINES = [
  { value: 'asap', label: 'As Soon as Possible' },
  { value: '3-6', label: '3 to 6 Months' },
  { value: '6-12', label: '6 to 12 Months' },
  { value: 'exploring', label: 'Just Exploring' },
];

const REGIONS = [
  { value: 'brooklyn-columbia', label: 'Brooklyn / Lake Columbia' },
  { value: 'clarklake', label: 'Clark Lake' },
  { value: 'devils-lake', label: "Devil's Lake" },
  { value: 'hayes', label: "Hayes State Park" },
  { value: 'loch-erin', label: 'Loch Erin' },
  { value: 'manitou-beach', label: 'Manitou Beach / Round Lake' },
  { value: 'leann', label: 'Lake Leann' },
  { value: 'wamplers', label: 'Wamplers Lake' },
  { value: 'other', label: 'Other / Not Sure' },
];

const EMPTY = {
  address: '',
  region: '',
  type: '',
  beds: '',
  baths: '',
  sqft: '',
  yearBuilt: '',
  condition: '',
  timeline: '',
  extras: [],
  name: '',
  email: '',
  phone: '',
  notes: '',
};

const EXTRAS = [
  'Garage', 'Pole Barn', 'Boat Dock', 'Boat Lift', 'Guest Cottage',
  'Pool', 'Finished Basement', 'Waterfront Footage', 'Large Lot (2+ acres)',
];

export default function CMAPage() {
  const [form, setForm] = useState(EMPTY);
  const [step, setStep] = useState(1); // 1 = property, 2 = contact
  const [status, setStatus] = useState('idle'); // idle | sending | sent | error
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0 });
    document.title = "What's My Home Worth? | Holly Griewahn";
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const toggleExtra = (val) => {
    setForm(prev => ({
      ...prev,
      extras: prev.extras.includes(val) ? prev.extras.filter(e => e !== val) : [...prev.extras, val],
    }));
  };

  const step1Valid = form.address.trim() && form.type && form.condition;
  const step2Valid = form.name.trim() && (form.email.trim() || form.phone.trim());

  const submit = async () => {
    setStatus('sending');
    try {
      const res = await fetch('/api/cma', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Failed');
      setStatus('sent');
    } catch {
      setStatus('error');
    }
  };

  const inputStyle = {
    width: '100%', padding: '0.65rem 0.875rem',
    borderRadius: '10px', border: '1.5px solid #e8e4df',
    fontSize: '0.9rem', fontFamily: 'inherit',
    outline: 'none', background: 'white', color: '#1a2332',
    transition: 'border-color 0.2s',
  };

  const labelStyle = {
    display: 'block', fontSize: '0.78rem', fontWeight: 700,
    color: '#6b7a8d', textTransform: 'uppercase', letterSpacing: '0.5px',
    marginBottom: '0.4rem',
  };

  return (
    <div style={{ minHeight: '100vh', background: '#faf9f7', fontFamily: "'DM Sans', -apple-system, sans-serif", color: '#1a2332' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700;800&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input:focus, select:focus, textarea:focus { border-color: #e84393 !important; box-shadow: 0 0 0 3px rgba(232,67,147,0.1); }
        .type-pill:hover { border-color: #e84393; }
        .cond-card:hover { border-color: #e84393; background: rgba(232,67,147,0.03); }
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
          <a href="tel:5174033413" style={{ background: '#e84393', color: 'white', padding: '0.4rem 1rem', borderRadius: '8px', textDecoration: 'none', fontSize: '0.8rem', fontWeight: 600 }}>
            Call Holly
          </a>
        </nav>
      </header>

      {/* Hero */}
      <div style={{
        minHeight: '40vh',
        background: 'linear-gradient(135deg, #1a2332 0%, #2c3e50 50%, #3d5a73 100%)',
        display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
        padding: '0 2rem 3rem', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(ellipse at 70% 30%, rgba(232,67,147,0.12) 0%, transparent 55%)' }} />
        <div style={{ maxWidth: '640px', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(232,67,147,0.15)', border: '1px solid rgba(232,67,147,0.3)', padding: '0.3rem 0.8rem', borderRadius: '20px', marginBottom: '1rem' }}>
            <span style={{ width: 6, height: 6, background: '#e84393', borderRadius: '50%' }} />
            <span style={{ color: '#e84393', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Free Home Valuation</span>
          </div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 800, color: 'white', lineHeight: 1.2, marginBottom: '0.75rem' }}>
            What's Your Home Worth?
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1rem', lineHeight: 1.6, maxWidth: '480px' }}>
            Holly knows Irish Hills property values better than anyone. Get a real Comparative Market Analysis from a local expert who's sold homes on these lakes for years.
          </p>
        </div>
      </div>

      {/* Form card */}
      <div style={{ maxWidth: '640px', margin: '-2rem auto 4rem', padding: '0 1.25rem' }}>
        <div style={{ background: 'white', borderRadius: '20px', boxShadow: '0 20px 60px rgba(26,35,50,0.12)', border: '1px solid #e8e4df', overflow: 'hidden' }}>

          {/* Progress bar */}
          {status === 'idle' && (
            <div style={{ padding: '1.25rem 2rem', borderBottom: '1px solid #f0ece8', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              {[1, 2].map(n => (
                <React.Fragment key={n}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.78rem', fontWeight: 800,
                      background: step >= n ? '#e84393' : '#f0ece8',
                      color: step >= n ? 'white' : '#94a3b8',
                      transition: 'all 0.3s',
                    }}>{n}</div>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: step >= n ? '#1a2332' : '#94a3b8' }}>
                      {n === 1 ? 'Property Details' : 'Your Info'}
                    </span>
                  </div>
                  {n < 2 && <div style={{ flex: 1, height: 2, background: step > n ? '#e84393' : '#f0ece8', borderRadius: 2, transition: 'background 0.3s' }} />}
                </React.Fragment>
              ))}
            </div>
          )}

          <div style={{ padding: '2rem' }}>

            {/* SUCCESS */}
            {status === 'sent' && (
              <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg, #e84393, #c0166d)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.6rem', fontWeight: 700, color: '#1a2332', marginBottom: '0.75rem' }}>
                  Request Received!
                </h2>
                <p style={{ color: '#4a5568', lineHeight: 1.7, marginBottom: '0.5rem', fontSize: '0.95rem' }}>
                  Thanks, {form.name.split(' ')[0]}! Holly will review your property details and reach out with your Comparative Market Analysis, usually within 24 hours.
                </p>
                <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '2rem' }}>
                  Need to talk sooner? Call Holly at{' '}
                  <a href="tel:5174033413" style={{ color: '#e84393', fontWeight: 700 }}>(517) 403-3413</a>
                </p>
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <Link to="/listings" style={{ background: '#1a2332', color: 'white', padding: '0.7rem 1.4rem', borderRadius: '10px', textDecoration: 'none', fontWeight: 700, fontSize: '0.88rem' }}>
                    Browse Listings
                  </Link>
                  <Link to="/" style={{ background: '#f0ece8', color: '#4a5568', padding: '0.7rem 1.4rem', borderRadius: '10px', textDecoration: 'none', fontWeight: 700, fontSize: '0.88rem' }}>
                    Back to Home
                  </Link>
                </div>
              </div>
            )}

            {/* STEP 1: Property Details */}
            {status === 'idle' && step === 1 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div>
                  <label style={labelStyle}>Property Address *</label>
                  <input
                    style={inputStyle}
                    placeholder="123 Lake Shore Drive, Brooklyn MI"
                    value={form.address}
                    onChange={e => set('address', e.target.value)}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Area / Region</label>
                  <select style={inputStyle} value={form.region} onChange={e => set('region', e.target.value)}>
                    <option value="">Select an area...</option>
                    {REGIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                </div>

                <div>
                  <label style={labelStyle}>Property Type *</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                    {PROPERTY_TYPES.map(pt => (
                      <button key={pt.value} className="type-pill" onClick={() => set('type', pt.value)} style={{
                        padding: '0.6rem 0.75rem', borderRadius: '10px', cursor: 'pointer', fontFamily: 'inherit',
                        border: `1.5px solid ${form.type === pt.value ? '#e84393' : '#e8e4df'}`,
                        background: form.type === pt.value ? 'rgba(232,67,147,0.06)' : 'white',
                        color: form.type === pt.value ? '#c0166d' : '#4a5568',
                        fontWeight: form.type === pt.value ? 700 : 500,
                        fontSize: '0.83rem', textAlign: 'left', transition: 'all 0.2s',
                      }}>
                        {pt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={labelStyle}>Beds</label>
                    <select style={inputStyle} value={form.beds} onChange={e => set('beds', e.target.value)}>
                      <option value="">Beds</option>
                      {[1,2,3,4,5,'6+'].map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Baths</label>
                    <select style={inputStyle} value={form.baths} onChange={e => set('baths', e.target.value)}>
                      <option value="">Baths</option>
                      {[1,1.5,2,2.5,3,3.5,'4+'].map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Sq Ft</label>
                    <input style={inputStyle} placeholder="e.g. 1800" value={form.sqft} onChange={e => set('sqft', e.target.value)} />
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>Year Built</label>
                  <input style={{ ...inputStyle, maxWidth: '160px' }} placeholder="e.g. 1975" value={form.yearBuilt} onChange={e => set('yearBuilt', e.target.value)} />
                </div>

                <div>
                  <label style={labelStyle}>Condition *</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {CONDITIONS.map(c => (
                      <button key={c.value} className="cond-card" onClick={() => set('condition', c.value)} style={{
                        padding: '0.75rem 1rem', borderRadius: '10px', cursor: 'pointer', fontFamily: 'inherit',
                        border: `1.5px solid ${form.condition === c.value ? '#e84393' : '#e8e4df'}`,
                        background: form.condition === c.value ? 'rgba(232,67,147,0.05)' : 'white',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        transition: 'all 0.2s', textAlign: 'left',
                      }}>
                        <span style={{ fontWeight: 700, color: form.condition === c.value ? '#c0166d' : '#1a2332', fontSize: '0.9rem' }}>{c.label}</span>
                        <span style={{ color: '#94a3b8', fontSize: '0.78rem' }}>{c.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>Notable Features (check all that apply)</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                    {EXTRAS.map(e => (
                      <button key={e} onClick={() => toggleExtra(e)} style={{
                        padding: '0.35rem 0.75rem', borderRadius: '20px', cursor: 'pointer', fontFamily: 'inherit',
                        border: `1.5px solid ${form.extras.includes(e) ? '#e84393' : '#e8e4df'}`,
                        background: form.extras.includes(e) ? 'rgba(232,67,147,0.07)' : 'white',
                        color: form.extras.includes(e) ? '#c0166d' : '#4a5568',
                        fontWeight: form.extras.includes(e) ? 700 : 500,
                        fontSize: '0.78rem', transition: 'all 0.2s',
                      }}>
                        {e}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>Selling Timeline</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                    {TIMELINES.map(t => (
                      <button key={t.value} onClick={() => set('timeline', t.value)} style={{
                        padding: '0.6rem 0.75rem', borderRadius: '10px', cursor: 'pointer', fontFamily: 'inherit',
                        border: `1.5px solid ${form.timeline === t.value ? '#e84393' : '#e8e4df'}`,
                        background: form.timeline === t.value ? 'rgba(232,67,147,0.06)' : 'white',
                        color: form.timeline === t.value ? '#c0166d' : '#4a5568',
                        fontWeight: form.timeline === t.value ? 700 : 500,
                        fontSize: '0.83rem', transition: 'all 0.2s',
                      }}>
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => { if (step1Valid) setStep(2); }}
                  disabled={!step1Valid}
                  style={{
                    width: '100%', background: step1Valid ? 'linear-gradient(135deg, #e84393, #c0166d)' : '#e8e4df',
                    color: step1Valid ? 'white' : '#94a3b8',
                    border: 'none', padding: '0.9rem', borderRadius: '12px',
                    fontSize: '0.95rem', fontWeight: 700, cursor: step1Valid ? 'pointer' : 'default',
                    fontFamily: 'inherit', transition: 'all 0.25s',
                  }}
                >
                  Continue to Contact Info
                </button>
              </div>
            )}

            {/* STEP 2: Contact Info */}
            {status === 'idle' && step === 2 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <button onClick={() => setStep(1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '0.82rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem', padding: 0, alignSelf: 'flex-start', fontFamily: 'inherit' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
                  Back to property details
                </button>

                <div style={{ background: '#f7f3f0', borderRadius: '12px', padding: '1rem', fontSize: '0.85rem', color: '#4a5568' }}>
                  <strong style={{ color: '#1a2332' }}>{form.address}</strong>
                  {form.type && <span> &bull; {PROPERTY_TYPES.find(t => t.value === form.type)?.label}</span>}
                  {form.beds && <span> &bull; {form.beds} bed</span>}
                  {form.baths && <span> / {form.baths} bath</span>}
                </div>

                <div>
                  <label style={labelStyle}>Your Name *</label>
                  <input style={inputStyle} placeholder="First and Last Name" value={form.name} onChange={e => set('name', e.target.value)} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={labelStyle}>Email *</label>
                    <input style={inputStyle} type="email" placeholder="you@email.com" value={form.email} onChange={e => set('email', e.target.value)} />
                  </div>
                  <div>
                    <label style={labelStyle}>Phone</label>
                    <input style={inputStyle} type="tel" placeholder="(517) 555-0000" value={form.phone} onChange={e => set('phone', e.target.value)} />
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>Anything else Holly should know?</label>
                  <textarea style={{ ...inputStyle, resize: 'vertical', minHeight: '90px' }} placeholder="Recent updates, special features, situation details..." value={form.notes} onChange={e => set('notes', e.target.value)} />
                </div>

                <div style={{ background: 'rgba(232,67,147,0.05)', borderRadius: '12px', padding: '1rem', border: '1px solid rgba(232,67,147,0.15)', fontSize: '0.82rem', color: '#6b7a8d' }}>
                  Holly will review your details and provide a personalized CMA within 24 hours. No obligation, no pressure - just honest market insight from a local expert.
                </div>

                <button
                  onClick={submit}
                  disabled={!step2Valid || status === 'sending'}
                  style={{
                    width: '100%', background: step2Valid ? 'linear-gradient(135deg, #e84393, #c0166d)' : '#e8e4df',
                    color: step2Valid ? 'white' : '#94a3b8',
                    border: 'none', padding: '0.9rem', borderRadius: '12px',
                    fontSize: '0.95rem', fontWeight: 700, cursor: step2Valid ? 'pointer' : 'default',
                    fontFamily: 'inherit', transition: 'all 0.25s',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                  }}
                >
                  {status === 'sending' ? (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
                        <circle cx="12" cy="12" r="10" strokeDasharray="31.4" strokeDashoffset="10"/>
                      </svg>
                      Sending...
                    </>
                  ) : 'Get My Free Home Valuation'}
                </button>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

                {status === 'error' && (
                  <p style={{ color: '#dc2626', fontSize: '0.85rem', textAlign: 'center' }}>
                    Something went wrong. Please call Holly at <a href="tel:5174033413" style={{ color: '#e84393' }}>(517) 403-3413</a>.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Trust bar */}
        <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', marginTop: '1.5rem', flexWrap: 'wrap' }}>
          {[
            { icon: '🏡', text: 'Local market expert' },
            { icon: '⚡', text: 'Reply within 24 hours' },
            { icon: '🔒', text: 'No obligation' },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: '#6b7a8d', fontWeight: 600 }}>
              <span>{item.icon}</span>
              <span>{item.text}</span>
            </div>
          ))}
        </div>
      </div>

      <footer style={{ background: '#0f1923', padding: '2rem', textAlign: 'center' }}>
        <p style={{ color: '#64748b', fontSize: '0.82rem' }}>&copy; 2025 Holly Griewahn | Foundation Realty | Irish Hills Real Estate</p>
      </footer>
    </div>
  );
}
