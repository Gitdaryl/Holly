import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import SiteNav from '../components/SiteNav';
import GoogleReviews from '../components/GoogleReviews';
import { propertiesData } from '../data/amenities';
import { trackRecord, isSold, soldStats, fmtPrice } from '../lib/listing-stats';

// Public "About Holly" page. Built from the same track-record data as the
// rest of the site (trackRecord over propertiesData) and the PlanPage
// timeline, so nothing here can drift out of sync with what the site
// actually shows elsewhere.

const FONT = "'DM Sans', -apple-system, sans-serif";
const SERIF = "'Playfair Display', serif";
const CALL_HREF = 'tel:5174033413';
const SMS_HREF = 'sms:+15173008226?&body=Hi%20Holly%2C%20I%20found%20you%20on%20your%20website.';

function NumberTile({ value, label }) {
  return (
    <div style={{ background: 'white', border: '1px solid #e8e4df', borderRadius: '14px', padding: '1.25rem 0.9rem', textAlign: 'center' }}>
      <div style={{ fontFamily: SERIF, fontSize: 'clamp(1.6rem, 4vw, 2.1rem)', fontWeight: 800, color: '#e84393', lineHeight: 1.1 }}>{value}</div>
      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.6px', marginTop: '0.4rem' }}>{label}</div>
    </div>
  );
}

function WorkStep({ n, title, children, to }) {
  const box = { background: 'white', border: '1px solid #e8e4df', borderRadius: '14px', padding: '1.5rem', display: 'block', textDecoration: 'none', color: 'inherit' };
  const content = (
    <>
      <div style={{ fontFamily: SERIF, fontSize: '1.3rem', fontWeight: 800, color: '#e84393', marginBottom: '0.5rem' }}>{n}</div>
      <div style={{ fontWeight: 700, color: '#1a2332', marginBottom: '0.4rem', fontSize: '1rem' }}>{title}</div>
      <div style={{ fontSize: '0.95rem', color: '#4a5568', lineHeight: 1.65 }}>{children}</div>
    </>
  );
  return to ? <Link to={to} style={box}>{content}</Link> : <div style={box}>{content}</div>;
}

// Optional candid photo strip. The files may not exist yet, so each tile
// removes itself on error and the whole strip renders nothing when none load.
function AboutPhotoStrip() {
  const [srcs, setSrcs] = useState([
    '/images/about/01.webp',
    '/images/about/02.webp',
    '/images/about/03.webp',
    '/images/about/04.webp',
    '/images/about/05.webp',
  ]);
  if (!srcs.length) return null;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem', margin: '2.5rem 0' }}>
      {srcs.map((src) => (
        <div key={src} style={{ aspectRatio: '3 / 2', borderRadius: '12px', overflow: 'hidden', background: '#f0eee9' }}>
          <img
            src={src}
            alt="Holly Griewahn with clients in the Irish Hills"
            loading="lazy"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            onError={() => setSrcs((prev) => prev.filter((u) => u !== src))}
          />
        </div>
      ))}
    </div>
  );
}

export default function AboutPage() {
  useEffect(() => {
    window.scrollTo({ top: 0 });
    document.title = 'About Holly Griewahn | Foundation Realty, Irish Hills';
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
      'Holly Griewahn has sold Irish Hills lake, farm, cottage, village and commercial property for 30+ years. Foundation Realty, based in Manitou Beach on Devils Lake, Michigan.'
    );
    return () => {
      if (created) meta.remove();
      else if (prev !== null) meta.setAttribute('content', prev);
    };
  }, []);

  const soldEntries = propertiesData.filter(isSold);
  const year =
    soldEntries.reduce((max, p) => {
      const y = parseInt(String(p.soldOn || '').slice(0, 4), 10);
      return y > max ? y : max;
    }, 0) || new Date().getFullYear();
  const yearSold = soldEntries.filter((p) => String(p.soldOn || '').startsWith(String(year)));
  const record = trackRecord(yearSold);
  const fastSales = yearSold.filter((p) => {
    const s = soldStats(p);
    return s && s.side !== 'buyer' && s.days !== null && s.days <= 7;
  }).length;

  return (
    <div style={{ minHeight: '100vh', background: '#faf9f7', fontFamily: FONT, color: '#1a2332' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700;800&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        .about-hero-portrait { display: none; }
        .about-mobile-portrait { display: block; }
        .about-steps { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.25rem; }
        .about-numbers { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.9rem; }
        @media (min-width: 860px) {
          .about-hero-portrait { display: block !important; }
          .about-mobile-portrait { display: none !important; }
        }
        @media (max-width: 700px) {
          .about-steps { grid-template-columns: 1fr; }
          .about-numbers { grid-template-columns: repeat(2, 1fr); }
        }
      `}</style>

      <SiteNav active="about" transparent textBody="Hi Holly, I found you on your website." />

      {/* Hero */}
      <div style={{ position: 'relative', overflow: 'hidden', minHeight: '62vh', display: 'flex', alignItems: 'flex-end', background: 'linear-gradient(135deg, #1a2332 0%, #1a3a52 55%, #0f2940 100%)' }}>
        <div className="about-hero-portrait" style={{ position: 'absolute', right: '3rem', bottom: 0, height: '520px', maxHeight: '68vh', zIndex: 1 }}>
          <img src="/images/holly-about.webp" alt="Holly Griewahn, Foundation Realty" style={{ height: '100%', maxHeight: '520px', aspectRatio: '4 / 5', objectFit: 'cover', display: 'block', borderRadius: '18px 18px 0 0', boxShadow: '0 30px 60px rgba(0,0,0,0.35)' }} />
        </div>
        <div style={{ position: 'relative', zIndex: 2, maxWidth: '1100px', margin: '0 auto', width: '100%', padding: '9rem 1.5rem 3rem' }}>
          <div style={{ maxWidth: '600px' }}>
            <h1 style={{ fontFamily: SERIF, fontSize: 'clamp(2.2rem, 5.5vw, 3.6rem)', fontWeight: 800, color: 'white', lineHeight: 1.1, marginBottom: '0.6rem' }}>Holly Griewahn</h1>
            <p style={{ color: 'rgba(255,255,255,0.78)', fontSize: '1.05rem', marginBottom: '1.75rem' }}>Foundation Realty &middot; Manitou Beach, Michigan</p>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <a href={SMS_HREF} style={{ padding: '0.8rem 1.6rem', background: '#e84393', color: 'white', borderRadius: '10px', textDecoration: 'none', fontWeight: 700, fontSize: '0.95rem' }}>Text Holly</a>
              <a href={CALL_HREF} style={{ padding: '0.8rem 1.6rem', background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '10px', textDecoration: 'none', fontWeight: 700, fontSize: '0.95rem' }}>Call Holly</a>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile-only portrait, stacked above the copy */}
      <div className="about-mobile-portrait" style={{ textAlign: 'center', padding: '1.5rem 1.5rem 0' }}>
        <img src="/images/holly-about.webp" alt="Holly Griewahn, Foundation Realty" style={{ width: '100%', maxWidth: '320px', aspectRatio: '4 / 5', objectFit: 'cover', margin: '0 auto', display: 'block', borderRadius: '16px', boxShadow: '0 16px 40px rgba(26,35,50,0.18)' }} />
      </div>

      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2.5rem 1.5rem 1rem' }}>
        {/* Thirty years copy */}
        <div style={{ maxWidth: '760px', margin: '0 auto 1rem' }}>
          <h2 style={{ fontFamily: SERIF, fontSize: 'clamp(1.6rem, 4vw, 2.2rem)', fontWeight: 700, marginBottom: '1.25rem', textAlign: 'center' }}>Thirty years on these lakes</h2>
          <p style={{ fontSize: '1.02rem', lineHeight: 1.8, color: '#4a5568', marginBottom: '1.1rem' }}>
            Holly Griewahn sells lake, farm, cottage, village and commercial property across the Irish Hills, from Devils Lake and Round Lake in Lenawee County out through Jackson, Hillsdale and Washtenaw counties. Thirty-plus years in, she still works the same territory she started in, one lake and one township at a time.
          </p>
          <p style={{ fontSize: '1.02rem', lineHeight: 1.8, color: '#4a5568', marginBottom: '1.1rem' }}>
            She lives on Devils Lake herself, in Manitou Beach, so the market she works is the market she wakes up to. That matters on the water, where a dock, a sandbar or a no-wake stretch can move a price more than square footage does.
          </p>
          <p style={{ fontSize: '1.02rem', lineHeight: 1.8, color: '#4a5568' }}>
            Lake homes here often change hands before they ever reach the MLS. Holly keeps a waitlist for each lake, so buyers hear about a home the day it comes available and sellers can walk into a listing appointment already knowing who is waiting.
          </p>
        </div>

        <AboutPhotoStrip />

        {/* By the numbers */}
        <div style={{ margin: '3rem 0' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', textAlign: 'center', marginBottom: '1rem' }}>By the numbers, {year}</div>
          <div className="about-numbers">
            <NumberTile value={record.sold} label="Homes sold" />
            <NumberTile value={(record.volume ? `$${(record.volume / 1e6).toFixed(1)}M` : 'n/a')} label="Sold volume" />
            <NumberTile value={record.listSides} label="As listing agent" />
            <NumberTile value={fastSales} label="Sold in 7 days or less" />
          </div>
        </div>
      </div>

      {/* What clients say */}
      <GoogleReviews limit={3} />

      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '3.5rem 1.5rem' }}>
        {/* How Holly works */}
        <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
          <h2 style={{ fontFamily: SERIF, fontSize: 'clamp(1.6rem, 4vw, 2.2rem)', fontWeight: 700, marginBottom: '0.5rem' }}>How Holly works</h2>
          <p style={{ color: '#6b7a8d', fontSize: '0.98rem' }}>The same process on every listing, not a plan for someday.</p>
        </div>
        <div className="about-steps">
          <WorkStep n="01" title="The waitlist hears first" to="/sell#buyers-waiting">
            Buyers registered on a lake get a text from Holly before a home is public. See who is already waiting.
          </WorkStep>
          <WorkStep n="02" title="Launch day, everywhere at once" to="/sell#day-we-list">
            MLS, every portal, a property page and the lake's own page, all live the day a home lists.
          </WorkStep>
          <WorkStep n="03" title="A seller update, every week" to="/sell#seller-report">
            Views, saves and showing requests land in the seller's inbox on a schedule, not a guess.
          </WorkStep>
          <WorkStep n="04" title="Showings and feedback" to="/sold">
            Holly follows up after every showing, and the results are public record on the sold page.
          </WorkStep>
        </div>
      </div>

      {/* Closing CTA */}
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 1.5rem 4rem' }}>
        <div style={{ background: 'linear-gradient(135deg, #1a2332, #2c3e50)', borderRadius: '18px', padding: '2.5rem 2rem', textAlign: 'center', color: 'white' }}>
          <h2 style={{ fontFamily: SERIF, fontSize: 'clamp(1.5rem, 3.5vw, 2rem)', fontWeight: 700, marginBottom: '1.5rem' }}>Where would you like to start?</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', maxWidth: '640px', margin: '0 auto 1.75rem' }}>
            <Link to="/cma" style={{ background: '#e84393', color: 'white', padding: '1rem', borderRadius: '12px', textDecoration: 'none', fontWeight: 700, fontSize: '0.95rem' }}>Selling? Start with what it is worth</Link>
            <Link to="/listings" style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.3)', color: 'white', padding: '1rem', borderRadius: '12px', textDecoration: 'none', fontWeight: 700, fontSize: '0.95rem' }}>Buying a lake home? Get first look</Link>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href={SMS_HREF} style={{ padding: '0.7rem 1.4rem', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.3)', color: 'white', borderRadius: '10px', textDecoration: 'none', fontWeight: 600, fontSize: '0.88rem' }}>Text Holly</a>
            <a href={CALL_HREF} style={{ padding: '0.7rem 1.4rem', background: 'white', color: '#1a2332', borderRadius: '10px', textDecoration: 'none', fontWeight: 600, fontSize: '0.88rem' }}>Call (517) 403-3413</a>
          </div>
        </div>
      </div>

      <footer style={{ background: '#0f1923', padding: '2rem', textAlign: 'center' }}>
        <p style={{ color: '#64748b', fontSize: '0.82rem' }}>Holly Griewahn | Foundation Realty | Manitou Beach, Michigan</p>
      </footer>
    </div>
  );
}
