import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import SiteNav from '../components/SiteNav';
import ScrollSignature from '../components/ScrollSignature';
import BrokerSignature from '../components/BrokerSignature';
import GoogleReviews from '../components/GoogleReviews';
import NewsletterSignup from '../components/NewsletterSignup';
import { propertiesData } from '../data/amenities';
import { trackRecord, isSold, soldStats, fmtPrice } from '../lib/listing-stats';

// Public "About Holly" page. Built from the same track-record data as the
// rest of the site (trackRecord over propertiesData) and the PlanPage
// timeline, so nothing here can drift out of sync with what the site
// actually shows elsewhere.

const FONT = "'Inter', -apple-system, sans-serif";
const SERIF = "'Source Serif 4', Georgia, serif";
const CALL_HREF = 'tel:5174033413';
const SMS_HREF = 'sms:+15173008226?&body=Hi%20Holly%2C%20I%20found%20you%20on%20your%20website.';

function NumberTile({ value, label }) {
  return (
    <div style={{ background: 'white', border: '1px solid #eeddd8', borderRadius: '14px', padding: '1.25rem 0.9rem', textAlign: 'center' }}>
      <div style={{ fontFamily: SERIF, fontSize: 'clamp(1.6rem, 4vw, 2.1rem)', fontWeight: 800, color: '#e64774', lineHeight: 1.1 }}>{value}</div>
      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#98a3a1', textTransform: 'uppercase', letterSpacing: '0.6px', marginTop: '0.4rem' }}>{label}</div>
    </div>
  );
}

function WorkStep({ n, title, children, to }) {
  const box = { background: 'white', border: '1px solid #eeddd8', borderRadius: '14px', padding: '1.5rem', display: 'block', textDecoration: 'none', color: 'inherit' };
  const content = (
    <>
      <div style={{ fontFamily: SERIF, fontSize: '1.3rem', fontWeight: 800, color: '#e64774', marginBottom: '0.5rem' }}>{n}</div>
      <div style={{ fontWeight: 700, color: '#1c2b29', marginBottom: '0.4rem', fontSize: '1rem' }}>{title}</div>
      <div style={{ fontSize: '0.95rem', color: '#4a5654', lineHeight: 1.65 }}>{children}</div>
    </>
  );
  return to ? <Link to={to} style={box}>{content}</Link> : <div style={box}>{content}</div>;
}

// Optional candid photo strip. The files may not exist yet, so each tile
// removes itself on error and the whole strip renders nothing when none load.
// Every photo keeps its own aspect ratio and the row shares one height, so a
// vertical shot sits narrower beside a horizontal one instead of being cropped.
// Order: vertical, horizontal, vertical, so the landscape frame anchors the middle.
const ABOUT_PHOTOS = ['/images/about/01.webp', '/images/about/03.webp', '/images/about/02.webp', '/images/about/04.webp', '/images/about/05.webp'];
function AboutPhotoStrip() {
  const [photos, setPhotos] = useState(ABOUT_PHOTOS.map((src) => ({ src, ratio: null })));
  const live = photos.filter((p) => p.ratio !== false);
  if (!live.length) return null;
  return (
    <div className="about-strip" style={{ margin: '2.5rem 0' }}>
      {live.map((p) => (
        <div
          key={p.src}
          className={p.ratio && p.ratio < 1 ? 'about-strip-tile about-strip-tall' : 'about-strip-tile'}
          style={{ flex: `${p.ratio || 1} 1 0`, aspectRatio: p.ratio ? `${p.ratio}` : '3 / 2', borderRadius: '12px', overflow: 'hidden', background: '#f6e9e5', minWidth: 0 }}
        >
          <img
            src={p.src}
            alt="Holly Griewahn with clients in the Irish Hills"
            loading="lazy"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            onLoad={(e) => { const { naturalWidth: w, naturalHeight: h } = e.currentTarget; if (w && h) setPhotos((prev) => prev.map((q) => (q.src === p.src ? { ...q, ratio: w / h } : q))); }}
            onError={() => setPhotos((prev) => prev.map((q) => (q.src === p.src ? { ...q, ratio: false } : q)))}
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
    <div style={{ minHeight: '100vh', background: '#fdf7f5', fontFamily: FONT, color: '#1c2b29' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Source+Serif+4:ital,opsz,wght@0,8..60,400..800;1,8..60,400..600&family=Inter:wght@300..700&display=swap');
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
              .about-strip { display: flex; gap: 0.75rem; align-items: stretch; }
        @media (max-width: 640px) {
          .about-strip { flex-wrap: wrap; }
          .about-strip-tile { flex: 1 1 100% !important; order: 1; }
          .about-strip-tall { flex: 1 1 calc(50% - 0.375rem) !important; order: 2; }
        }
      `}</style>

      <SiteNav active="about" transparent textBody="Hi Holly, I found you on your website." />

      {/* Hero */}
      <div style={{ position: 'relative', overflow: 'hidden', minHeight: '62vh', display: 'flex', alignItems: 'flex-end', background: 'linear-gradient(135deg, #1a554e 0%, #1d5f57 55%, #123f3a 100%)' }}>
        <div className="about-hero-portrait" style={{ position: 'absolute', right: '3rem', bottom: 0, height: '520px', maxHeight: '68vh', zIndex: 1 }}>
          <img src="/images/holly-about.webp" alt="Holly Griewahn, Foundation Realty" style={{ height: '100%', maxHeight: '520px', aspectRatio: '4 / 5', objectFit: 'cover', display: 'block', borderRadius: '18px 18px 0 0', boxShadow: '0 30px 60px rgba(0,0,0,0.35)' }} />
        </div>
        <div style={{ position: 'relative', zIndex: 2, maxWidth: '1100px', margin: '0 auto', width: '100%', padding: '9rem 1.5rem 3rem' }}>
          <div style={{ maxWidth: '600px' }}>
            <h1 style={{ margin: '0 0 0.9rem', lineHeight: 0 }}>
              <span style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap' }}>Holly Griewahn, Foundation Realty</span>
              <BrokerSignature width="clamp(210px, 28vw, 360px)" />
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.78)', fontSize: '1.05rem', marginBottom: '1.75rem' }}>Foundation Realty &middot; Manitou Beach, Michigan</p>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <a href={SMS_HREF} style={{ padding: '0.8rem 1.6rem', background: '#e64774', color: 'white', borderRadius: '10px', textDecoration: 'none', fontWeight: 700, fontSize: '0.95rem' }}>Text Holly</a>
              <a href={CALL_HREF} style={{ padding: '0.8rem 1.6rem', background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '10px', textDecoration: 'none', fontWeight: 700, fontSize: '0.95rem' }}>Call Holly</a>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile-only portrait, stacked above the copy */}
      <div className="about-mobile-portrait" style={{ textAlign: 'center', padding: '1.5rem 1.5rem 0' }}>
        <img src="/images/holly-about.webp" alt="Holly Griewahn, Foundation Realty" style={{ width: '100%', maxWidth: '320px', aspectRatio: '4 / 5', objectFit: 'cover', margin: '0 auto', display: 'block', borderRadius: '16px', boxShadow: '0 16px 40px rgba(26,85,78,0.18)' }} />
      </div>

      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2.5rem 1.5rem 1rem' }}>
        {/* Thirty years copy */}
        <div style={{ maxWidth: '760px', margin: '0 auto 1rem' }}>
          <h2 style={{ fontFamily: SERIF, fontSize: 'clamp(1.6rem, 4vw, 2.2rem)', fontWeight: 700, marginBottom: '1.25rem', textAlign: 'center' }}>Thirty years on these lakes</h2>
          <p style={{ fontSize: '1.02rem', lineHeight: 1.8, color: '#4a5654', marginBottom: '1.1rem' }}>
            Holly Griewahn sells lake, farm, cottage, village and commercial property across the Irish Hills, from Devils Lake and Round Lake in Lenawee County out through Jackson, Hillsdale and Washtenaw counties. Thirty-plus years in, she still works the same territory she started in, one lake and one township at a time.
          </p>
          <p style={{ fontSize: '1.02rem', lineHeight: 1.8, color: '#4a5654', marginBottom: '1.1rem' }}>
            She lives on Devils Lake herself, in Manitou Beach, so the market she works is the market she wakes up to. That matters on the water, where a dock, a sandbar or a no-wake stretch can move a price more than square footage does.
          </p>
          <p style={{ fontSize: '1.02rem', lineHeight: 1.8, color: '#4a5654' }}>
            Lake homes here often change hands before they ever reach the MLS. Holly keeps a waitlist for each lake, so buyers hear about a home the day it comes available and sellers can walk into a listing appointment already knowing who is waiting.
          </p>
          <ScrollSignature width="clamp(200px, 30vw, 260px)" style={{ margin: '0.75rem 0 0 auto' }} />
        </div>

        <AboutPhotoStrip />

        {/* By the numbers */}
        <div style={{ margin: '3rem 0' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#98a3a1', textTransform: 'uppercase', letterSpacing: '1px', textAlign: 'center', marginBottom: '1rem' }}>By the numbers, {year}</div>
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
          <p style={{ color: '#66706e', fontSize: '0.98rem' }}>The same process on every listing, not a plan for someday.</p>
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

      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 1.5rem' }}>
        <NewsletterSignup source="about" />
      </div>

      {/* Closing CTA */}
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 1.5rem 4rem' }}>
        <div style={{ background: 'linear-gradient(135deg, #1a554e, #237168)', borderRadius: '18px', padding: '2.5rem 2rem', textAlign: 'center', color: 'white' }}>
          <h2 style={{ fontFamily: SERIF, fontSize: 'clamp(1.5rem, 3.5vw, 2rem)', fontWeight: 700, marginBottom: '1.5rem' }}>Where would you like to start?</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', maxWidth: '640px', margin: '0 auto 1.75rem' }}>
            <Link to="/cma" style={{ background: '#e64774', color: 'white', padding: '1rem', borderRadius: '12px', textDecoration: 'none', fontWeight: 700, fontSize: '0.95rem' }}>Selling? Start with what it is worth</Link>
            <Link to="/listings" style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.3)', color: 'white', padding: '1rem', borderRadius: '12px', textDecoration: 'none', fontWeight: 700, fontSize: '0.95rem' }}>Buying a lake home? Get first look</Link>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href={SMS_HREF} style={{ padding: '0.7rem 1.4rem', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.3)', color: 'white', borderRadius: '10px', textDecoration: 'none', fontWeight: 600, fontSize: '0.88rem' }}>Text Holly</a>
            <a href={CALL_HREF} style={{ padding: '0.7rem 1.4rem', background: 'white', color: '#1c2b29', borderRadius: '10px', textDecoration: 'none', fontWeight: 600, fontSize: '0.88rem' }}>Call (517) 403-3413</a>
          </div>
        </div>
      </div>

      <footer style={{ background: '#0e2d29', padding: '2rem', textAlign: 'center' }}>
        <p style={{ color: '#66706e', fontSize: '0.82rem' }}>Holly Griewahn | Foundation Realty | Manitou Beach, Michigan</p>
      </footer>
    </div>
  );
}
