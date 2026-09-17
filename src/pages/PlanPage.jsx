import React, { useState, useEffect } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { lakes } from '../data/lakes';
import { regions } from '../data/regions';
import { propertiesData } from '../data/amenities';
import HeroVideo from '../components/HeroVideo';
import { useWaitlistCount } from '../components/LakeWaitlist';
import { TrustStrip } from '../components/GoogleReviews';
import { trackRecord, isActive, isSold, soldBadge } from '../lib/listing-stats';

// /plan/<lake>/<address-slug>?for=<first name>
//
// The page Holly texts a seller the night before a listing appointment. It is
// built from the URL alone (no database row, nothing to set up): the address
// comes from the slug, the numbers come from the lake, the buyer count is live.
// /plan with no params is the link builder Holly uses to make one.
//
// noindex: these are one-to-one pages for a named prospect, not SEO content.

const FONT = "'DM Sans', -apple-system, sans-serif";
const SERIF = "'Playfair Display', serif";

function addressFromSlug(slug) {
  const SMALL = new Set(['and', 'of', 'the']);
  const ABBR = { hwy: 'Hwy', rd: 'Rd', st: 'St', dr: 'Dr', ln: 'Ln', ct: 'Ct', ave: 'Ave', blvd: 'Blvd', n: 'N', s: 'S', e: 'E', w: 'W', ne: 'NE', nw: 'NW', se: 'SE', sw: 'SW' };
  return String(slug || '')
    .split('-')
    .filter(Boolean)
    .map((w) => ABBR[w] || (SMALL.has(w) ? w : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(' ');
}

function slugify(text) {
  return String(text || '').toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').replace(/-+/g, '-');
}

function useNoIndex() {
  useEffect(() => {
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex,nofollow';
    document.head.appendChild(meta);
    return () => { document.head.removeChild(meta); };
  }, []);
}

function Tile({ value, label, accent }) {
  return (
    <div style={{ background: 'white', border: '1px solid #e8e4df', borderRadius: '14px', padding: '1.1rem 0.75rem', textAlign: 'center' }}>
      <div style={{ fontFamily: SERIF, fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: 800, color: accent ? '#e84393' : '#1a2332', lineHeight: 1.1 }}>{value}</div>
      <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.6px', marginTop: '0.4rem' }}>{label}</div>
    </div>
  );
}

function Step({ when, title, children }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: '1rem', padding: '1.1rem 0', borderTop: '1px solid #f0eee9' }}>
      <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#e84393', textTransform: 'uppercase', letterSpacing: '0.8px', paddingTop: '0.2rem' }}>{when}</div>
      <div>
        <div style={{ fontWeight: 700, color: '#1a2332', marginBottom: '0.3rem' }}>{title}</div>
        <div style={{ fontSize: '0.88rem', color: '#4a5568', lineHeight: 1.65 }}>{children}</div>
      </div>
    </div>
  );
}

// A seller report rendered from sample numbers so the prospect sees the actual
// artifact, not a description of one.
function SampleReport({ lakeName }) {
  const bars = [3, 7, 5, 11, 9, 14, 8];
  const max = Math.max(...bars);
  return (
    <div style={{ background: '#faf9f7', border: '1px solid #e8e4df', borderRadius: '16px', padding: '1.5rem', position: 'relative' }}>
      <span style={{ position: 'absolute', top: '1rem', right: '1rem', fontSize: '0.65rem', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase', background: '#1a2332', color: 'white', padding: '0.25rem 0.55rem', borderRadius: '6px' }}>Sample</span>
      <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '1.4px', textTransform: 'uppercase', color: '#e84393' }}>Weekly Seller Report</div>
      <div style={{ fontFamily: SERIF, fontSize: '1.15rem', fontWeight: 700, color: '#1a2332', margin: '0.3rem 0 1rem' }}>Your home · this week</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginBottom: '0.75rem' }}>
        {[['57', 'Page views'], ['9', 'Saved it'], ['3', 'Showing requests']].map(([v, l]) => (
          <div key={l} style={{ background: 'white', border: '1px solid #e8e4df', borderRadius: '12px', padding: '0.8rem 0.5rem', textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1a2332' }}>{v}</div>
            <div style={{ fontSize: '0.62rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{l}</div>
          </div>
        ))}
      </div>
      <div style={{ background: 'white', border: '1px solid #e8e4df', borderRadius: '12px', padding: '0.9rem 0.9rem 0.5rem' }}>
        <div style={{ fontSize: '0.62rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.6rem' }}>Page views by day</div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '56px' }}>
          {bars.map((b, i) => <div key={i} style={{ flex: 1, height: `${(b / max) * 100}%`, background: '#e84393', borderRadius: '4px 4px 0 0' }} />)}
        </div>
      </div>
      <div style={{ fontSize: '0.8rem', color: '#4a5568', marginTop: '0.75rem', display: 'flex', justifyContent: 'space-between' }}>
        <span>Buyers registered for {lakeName}</span><strong>14</strong>
      </div>
    </div>
  );
}

function PlanBuilder() {
  useNoIndex();
  const [address, setAddress] = useState('');
  const [lake, setLake] = useState('devils-lake');
  const [name, setName] = useState('');
  const [copied, setCopied] = useState(false);
  const path = `/plan/${lake}/${slugify(address) || 'your-address'}${name ? `?for=${encodeURIComponent(name.trim())}` : ''}`;
  const url = `${typeof window !== 'undefined' ? window.location.origin : ''}${path}`;
  const copy = async () => {
    try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch { /* ignore */ }
  };
  const input = { width: '100%', padding: '0.7rem 0.85rem', borderRadius: '8px', border: '1px solid #e8e4df', fontSize: '0.95rem', fontFamily: 'inherit', outline: 'none', background: 'white' };
  return (
    <div style={{ minHeight: '100vh', background: '#faf9f7', fontFamily: FONT, color: '#1a2332', padding: '3rem 1.5rem' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=DM+Sans:wght@400;600;700&display=swap'); * { box-sizing: border-box; margin: 0; padding: 0; }`}</style>
      <div style={{ maxWidth: '520px', margin: '0 auto' }}>
        <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', textDecoration: 'none', marginBottom: '2rem' }}>
          <img src="/images/foundation-logo.png" alt="Foundation Realty" style={{ height: '28px' }} />
          <span style={{ fontWeight: 700, color: '#1a2332', fontSize: '0.9rem' }}>Holly Griewahn</span>
        </Link>
        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#e84393', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.4rem' }}>Holly only</div>
        <h1 style={{ fontFamily: SERIF, fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.5rem' }}>Build a listing plan link</h1>
        <p style={{ color: '#6b7a8d', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>Text it to the seller the night before the appointment. Nothing to save; the page is built from the link itself.</p>
        <div data-tour="plan-builder" style={{ display: 'grid', gap: '0.9rem', background: 'white', border: '1px solid #e8e4df', borderRadius: '16px', padding: '1.5rem' }}>
          <div>
            <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#6b7a8d', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '0.35rem' }}>Property address</label>
            <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Street address" style={input} />
          </div>
          <div>
            <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#6b7a8d', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '0.35rem' }}>Lake</label>
            <select value={lake} onChange={(e) => setLake(e.target.value)} style={{ ...input, cursor: 'pointer' }}>
              {Object.values(lakes).map((l) => <option key={l.slug} value={l.slug}>{l.name}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#6b7a8d', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '0.35rem' }}>Seller's first name (optional)</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Seller's first name" style={input} />
          </div>
          <div style={{ background: '#faf9f7', border: '1px dashed #e8e4df', borderRadius: '10px', padding: '0.8rem', fontSize: '0.82rem', wordBreak: 'break-all', color: '#4a5568' }}>{url}</div>
          <div style={{ display: 'flex', gap: '0.6rem' }}>
            <button type="button" onClick={copy} style={{ flex: 1, background: '#e84393', color: 'white', border: 'none', padding: '0.8rem', borderRadius: '10px', fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer' }}>{copied ? 'Copied' : 'Copy link'}</button>
            <a href={path} target="_blank" rel="noopener" style={{ flex: 1, textAlign: 'center', background: 'white', color: '#1a2332', border: '2px solid #1a2332', padding: '0.7rem', borderRadius: '10px', fontWeight: 700, textDecoration: 'none' }}>Preview</a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PlanPage() {
  const { lake: lakeSlug, address } = useParams();
  if (!lakeSlug) return <PlanBuilder />;
  return <Plan lakeSlug={lakeSlug} addressSlug={address} />;
}

function Plan({ lakeSlug, addressSlug }) {
  useNoIndex();
  const [params] = useSearchParams();
  const sellerName = (params.get('for') || '').slice(0, 40);
  const lake = lakes[lakeSlug];
  const region = lake ? regions[lake.region] : null;
  const addressText = addressFromSlug(addressSlug);
  const [count] = useWaitlistCount(lake ? lake.slug : null);

  useEffect(() => {
    window.scrollTo({ top: 0 });
    document.title = `The plan for ${addressText} | Holly Griewahn`;
  }, [addressText]);

  if (!lake) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT, padding: '2rem', textAlign: 'center' }}>
        <div>
          <h1 style={{ fontFamily: SERIF, marginBottom: '0.5rem' }}>That link is missing its lake</h1>
          <p style={{ color: '#6b7a8d' }}>Ask Holly to resend it, or call <a href="tel:5174033413" style={{ color: '#e84393', fontWeight: 600 }}>(517) 403-3413</a>.</p>
        </div>
      </div>
    );
  }

  const onLake = propertiesData.filter((p) => p.lake === lake.slug);
  const record = trackRecord(onLake);
  const sold = onLake.filter(isSold).sort((a, b) => String(b.soldOn || '').localeCompare(String(a.soldOn || ''))).slice(0, 3);
  const active = onLake.filter(isActive).slice(0, 3);
  const example = propertiesData.find((p) => isActive(p) && p.image) || null;
  const allRecord = trackRecord(propertiesData);

  return (
    <div style={{ minHeight: '100vh', background: '#faf9f7', fontFamily: FONT, color: '#1a2332' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700;800&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .plan-tiles { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.75rem; }
        .plan-two { display: grid; grid-template-columns: 1.2fr 1fr; gap: 1.5rem; align-items: start; }
        @media (max-width: 760px) { .plan-tiles { grid-template-columns: repeat(2, 1fr); } .plan-two { grid-template-columns: 1fr; } }
      `}</style>

      {/* Hero on the region's drone loop */}
      <div style={{ minHeight: '62vh', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'flex-end', padding: '6rem 2rem 2.5rem', background: region?.gradient || '#1a2332' }}>
        <HeroVideo video={region?.video} poster={region?.poster} gradient={region?.gradient} dim={0.4} />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: '960px', margin: '0 auto', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
            <img src="/images/foundation-logo.png" alt="Foundation Realty" style={{ height: '30px' }} />
            <span style={{ color: 'white', fontWeight: 700, fontSize: '0.9rem' }}>Holly Griewahn</span>
          </div>
          <p style={{ color: '#f6a5c9', fontSize: '0.78rem', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '0.6rem' }}>
            {sellerName ? `Prepared for ${sellerName}` : 'Listing plan'}
          </p>
          <h1 style={{ fontFamily: SERIF, fontSize: 'clamp(1.9rem, 5vw, 3.1rem)', fontWeight: 800, color: 'white', lineHeight: 1.15, marginBottom: '0.6rem' }}>
            The plan for {addressText}
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.78)', fontSize: '1rem', maxWidth: '560px', lineHeight: 1.6 }}>
            What happens the day we list, who is already waiting on {lake.name}, and what you will see every week until it closes.
          </p>
          <div style={{ marginTop: '1rem' }}><TrustStrip dark /></div>
        </div>
      </div>

      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '2rem 1.5rem 5rem' }}>

        {/* Live numbers */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.75rem' }}>Right now on {lake.name}</div>
          <div className="plan-tiles">
            <Tile value={count === null ? '—' : count} label="Buyers registered" accent />
            <Tile value={record.sold || allRecord.sold} label={record.sold ? 'Sold here by Holly' : 'Sold by Holly'} />
            <Tile value={(record.avgDays ?? allRecord.avgDays) === null ? '—' : (record.avgDays ?? allRecord.avgDays)} label="Avg days to sell" />
            <Tile value={(record.avgPct || allRecord.avgPct) ? `${record.avgPct || allRecord.avgPct}%` : '—'} label="Of list price" />
          </div>
          <p style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '0.6rem' }}>
            Buyers registered is live: people who asked to hear about the next {lake.name} home before it reaches the MLS.
          </p>
        </div>

        <div className="plan-two">
          {/* Timeline */}
          <div style={{ background: 'white', border: '1px solid #e8e4df', borderRadius: '16px', padding: '1.75rem' }}>
            <h2 style={{ fontFamily: SERIF, fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.5rem' }}>The day we list</h2>
            <p style={{ fontSize: '0.88rem', color: '#6b7a8d', lineHeight: 1.6, marginBottom: '0.5rem' }}>This is how Holly runs a listing today, not a plan for someday.</p>
            <Step when="Before" title={`The ${lake.name} waitlist hears first`}>
              {count >= 3 ? `${count} registered buyers` : 'Registered buyers'} get a text from Holly about your home before it is public. Serious buyers on a lake do not wait for Zillow.
            </Step>
            <Step when="Day 1" title="Your own property page">
              Full gallery, the numbers, a one-tap showing request that reaches Holly's phone within seconds, and a Save button so we can see who is coming back.
              {example && <> See a live one: <Link to={`/property/${example.slug}`} style={{ color: '#e84393', fontWeight: 600, textDecoration: 'none' }}>{example.title}</Link>.</>}
            </Step>
            <Step when="Day 1" title="MLS and every portal">
              Listed through Foundation Realty on the MLS, which feeds Zillow, Realtor.com and the rest. Your page is where the serious traffic lands.
            </Step>
            <Step when="Day 1" title={`Placed on the ${lake.name} page`}>
              Buyers searching for {lake.name} land on <Link to={`/lakes/${lake.slug}`} style={{ color: '#e84393', fontWeight: 600, textDecoration: 'none' }}>a page about the lake itself</Link>, with your home on it. That page keeps working through the winter.
            </Step>
            <Step when="Every Friday" title="Your seller report">
              Views, saves, showing requests and the {lake.name} buyer count, in your inbox every week. You never have to wonder what is happening.
            </Step>
            <Step when="Every showing" title="You hear what buyers said">
              Holly follows up with the showing agent and the feedback comes to you, not into a drawer.
            </Step>
            <Step when="Closing" title="It stays on the site as a sold home">
              Days on market and percent of list, on the record. That is what the next seller on {lake.name} will see.
            </Step>
          </div>

          {/* Sample report + CTA */}
          <div style={{ display: 'grid', gap: '1.25rem' }}>
            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.6rem' }}>What Friday looks like</div>
              <SampleReport lakeName={lake.name} />
            </div>

            {(sold.length > 0 || active.length > 0) && (
              <div style={{ background: 'white', border: '1px solid #e8e4df', borderRadius: '16px', padding: '1.25rem 1.5rem' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.6rem' }}>
                  {sold.length > 0 ? `Sold by Holly on ${lake.name}` : `Holly's listings on ${lake.name}`}
                </div>
                {(sold.length > 0 ? sold : active).map((p) => (
                  <Link key={p.id} to={`/property/${p.slug}`} style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', fontSize: '0.85rem', textDecoration: 'none', color: '#1a2332', padding: '0.5rem 0', borderTop: '1px solid #f0eee9' }}>
                    <span style={{ fontWeight: 600 }}>{p.title}</span>
                    <span style={{ color: '#6b7a8d', whiteSpace: 'nowrap' }}>{isSold(p) ? soldBadge(p) : p.price}</span>
                  </Link>
                ))}
              </div>
            )}

            <div style={{ background: 'linear-gradient(135deg, #1a2332, #2c3e50)', borderRadius: '16px', padding: '1.5rem', color: 'white' }}>
              <div style={{ fontFamily: SERIF, fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.4rem' }}>Questions before we meet?</div>
              <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, marginBottom: '1rem' }}>Holly will bring the recent {lake.name} sales and a pricing range for {addressText}.</p>
              <a href="sms:+15174033413" style={{ display: 'block', textAlign: 'center', background: '#e84393', color: 'white', padding: '0.75rem', borderRadius: '10px', textDecoration: 'none', fontWeight: 700, marginBottom: '0.5rem' }}>Text Holly</a>
              <a href="tel:5174033413" style={{ display: 'block', textAlign: 'center', background: 'rgba(255,255,255,0.1)', color: 'white', padding: '0.7rem', borderRadius: '10px', textDecoration: 'none', fontWeight: 600, border: '1px solid rgba(255,255,255,0.2)' }}>Call (517) 403-3413</a>
            </div>
          </div>
        </div>
      </div>

      <footer style={{ background: '#0f1923', padding: '2rem', textAlign: 'center' }}>
        <p style={{ color: '#64748b', fontSize: '0.82rem' }}>Holly Griewahn | Foundation Realty | Manitou Beach, Michigan</p>
      </footer>
    </div>
  );
}
