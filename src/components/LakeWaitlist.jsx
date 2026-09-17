import React, { useState, useEffect } from 'react';

// "Get first look" card for a lake page. Shows the live count once there are
// enough registrations for the number to sell itself; before that it reads as
// an invitation, not an empty room.

const SHOW_COUNT_FROM = 3;

export function useWaitlistCount(lake) {
  const [count, setCount] = useState(null);
  useEffect(() => {
    if (!lake) return;
    let alive = true;
    fetch(`/api/waitlist?lake=${encodeURIComponent(lake)}`)
      .then(r => (r.ok ? r.json() : null))
      .then(d => { if (alive && d) setCount(d.count); })
      .catch(() => {});
    return () => { alive = false; };
  }, [lake]);
  return [count, setCount];
}

const input = { width: '100%', padding: '0.65rem 0.8rem', borderRadius: '8px', border: '1px solid #e8e4df', fontSize: '0.9rem', fontFamily: 'inherit', outline: 'none', background: 'white' };
const label = { fontSize: '0.72rem', fontWeight: 700, color: '#6b7a8d', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '0.35rem' };

export default function LakeWaitlist({ lake, lakeName, compact = false, role = 'buyer' }) {
  const owner = role === 'owner';
  const [count, setCount] = useWaitlistCount(lake);
  const [form, setForm] = useState({ name: '', phone: '', email: '', budget: '', timing: '', notes: '' });
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setStatus('sending'); setError('');
    try {
      const r = await fetch(`/api/waitlist?lake=${encodeURIComponent(lake)}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, role }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Send failed');
      if (typeof d.count === 'number') setCount(d.count);
      setStatus('sent');
    } catch (err) {
      setStatus('idle');
      setError(err.message || 'Something went wrong. Call or text Holly instead.');
    }
  };

  const headline = owner
    ? `Own on ${lakeName}? Hear about every sale first`
    : count >= SHOW_COUNT_FROM
      ? `${count} buyers are waiting on ${lakeName}`
      : `Get first look at ${lakeName}`;

  return (
    <div id="waitlist" style={{ background: 'linear-gradient(135deg, #1a2332, #24405c)', borderRadius: '16px', padding: compact ? '1.5rem' : '2rem', color: 'white', scrollMarginTop: '90px' }}>
      <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#f6a5c9', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.5rem' }}>{owner ? 'For owners' : 'Before it hits the MLS'}</div>
      <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: compact ? '1.3rem' : '1.5rem', fontWeight: 700, marginBottom: '0.5rem', lineHeight: 1.25 }}>{headline}</h2>
      <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.72)', lineHeight: 1.6, marginBottom: '1.25rem', maxWidth: '520px' }}>
        {owner
          ? `Holly texts you when a ${lakeName} home sells or lists, with the number. No newsletter, no pressure, just what your lake is doing. Useful whether you sell next spring or never.`
          : `Lake homes here often sell before they are listed. Tell Holly what you're after and you'll hear about the next ${lakeName} property before the public does.`}
      </p>

      {status === 'sent' ? (
        <div style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.18)', borderRadius: '12px', padding: '1.25rem' }}>
          <div style={{ fontWeight: 700, marginBottom: '0.25rem' }}>{owner ? `You'll hear about ${lakeName} sales first.` : `You're on the ${lakeName} list.`}</div>
          <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.72)', lineHeight: 1.6 }}>
            Holly will reach out to learn exactly what you want. In a hurry? Call or text <a href="tel:5174033413" style={{ color: '#f6a5c9', fontWeight: 600, textDecoration: 'none' }}>(517) 403-3413</a>.
          </div>
        </div>
      ) : (
        <form onSubmit={submit} style={{ display: 'grid', gridTemplateColumns: compact ? '1fr' : 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
          <div>
            <label style={label}>Your name *</label>
            <input required value={form.name} onChange={set('name')} placeholder="Your name" style={input} />
          </div>
          <div>
            <label style={label}>Mobile *</label>
            <input required type="tel" value={form.phone} onChange={set('phone')} placeholder="Your mobile number" style={input} />
          </div>
          <div>
            <label style={label}>Email</label>
            <input type="email" value={form.email} onChange={set('email')} placeholder="Your email" style={input} />
          </div>
          {owner ? (
            <>
              <div>
                <label style={label}>Your street on {lakeName}</label>
                <input value={form.budget} onChange={set('budget')} placeholder="Street name" style={input} />
              </div>
              <div>
                <label style={label}>Thinking of selling?</label>
                <select value={form.timing} onChange={set('timing')} style={{ ...input, cursor: 'pointer' }}>
                  <option value="">Select one</option>
                  <option>Not selling, just curious</option>
                  <option>Maybe within a year</option>
                  <option>Maybe this season</option>
                  <option>Yes, let's talk</option>
                </select>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={label}>Anything Holly should know?</label>
                <input value={form.notes} onChange={set('notes')} placeholder="Frontage, year built, what you'd want for it" style={input} />
              </div>
            </>
          ) : (
            <>
              <div>
                <label style={label}>Budget</label>
                <select value={form.budget} onChange={set('budget')} style={{ ...input, cursor: 'pointer' }}>
                  <option value="">Select a range</option>
                  <option>Under $300K</option>
                  <option>$300K to $500K</option>
                  <option>$500K to $750K</option>
                  <option>$750K to $1M</option>
                  <option>$1M and up</option>
                </select>
              </div>
              <div>
                <label style={label}>Timing</label>
                <select value={form.timing} onChange={set('timing')} style={{ ...input, cursor: 'pointer' }}>
                  <option value="">Select timing</option>
                  <option>Ready now</option>
                  <option>This season</option>
                  <option>Within a year</option>
                  <option>Just watching</option>
                </select>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={label}>What are you after?</label>
                <input value={form.notes} onChange={set('notes')} placeholder="Frontage, bedrooms, all-sports, a fixer, a turnkey cottage" style={input} />
              </div>
            </>
          )}
          {error && <p style={{ gridColumn: '1 / -1', color: '#fca5a5', fontSize: '0.85rem' }}>{error}</p>}
          <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <button type="submit" disabled={status === 'sending'} style={{ background: '#e84393', color: 'white', border: 'none', padding: '0.85rem 1.5rem', borderRadius: '10px', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', fontFamily: 'inherit', opacity: status === 'sending' ? 0.7 : 1 }}>
              {status === 'sending' ? 'Adding you...' : owner ? `Keep me posted on ${lakeName}` : `Put me on the ${lakeName} list`}
            </button>
            <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>One text to confirm. No spam, no drip campaign.</span>
          </div>
        </form>
      )}
    </div>
  );
}
