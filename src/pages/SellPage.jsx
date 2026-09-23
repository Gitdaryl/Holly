import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import SiteNav from '../components/SiteNav';
import { TrustStrip } from '../components/GoogleReviews';
import { lakes } from '../data/lakes';
import { propertiesData } from '../data/amenities';
import { trackRecord, fmtPrice } from '../lib/listing-stats';

// Public, indexable version of PlanPage for sellers who are not yet a named
// prospect on a specific address. Same facts (buyer waitlist, the listing
// day timeline, the weekly seller report, the track record) made generic.

const FONT = "'Inter', -apple-system, sans-serif";
const SERIF = "'Source Serif 4', Georgia, serif";
const CALL_HREF = 'tel:5174033413';
const SMS_HREF = 'sms:+15173008226?&body=Hi%20Holly%2C%20I%20found%20you%20on%20your%20website.';

function Step({ when, title, children }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: '1rem', padding: '1.1rem 0', borderTop: '1px solid #f6e9e5' }}>
      <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#e64774', textTransform: 'uppercase', letterSpacing: '0.8px', paddingTop: '0.2rem' }}>{when}</div>
      <div>
        <div style={{ fontWeight: 700, color: '#1c2b29', marginBottom: '0.3rem', fontSize: '1rem' }}>{title}</div>
        <div style={{ fontSize: '0.95rem', color: '#4a5654', lineHeight: 1.65 }}>{children}</div>
      </div>
    </div>
  );
}

// A seller report rendered from sample numbers, generic (no named lake or
// address) so it works as public marketing rather than a one-to-one page.
function SampleReport() {
  const bars = [3, 7, 5, 11, 9, 14, 8];
  const max = Math.max(...bars);
  return (
    <div style={{ background: '#fdf7f5', border: '1px solid #eeddd8', borderRadius: '16px', padding: '1.5rem', position: 'relative' }}>
      <span style={{ position: 'absolute', top: '1rem', right: '1rem', fontSize: '0.75rem', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase', background: '#1a554e', color: 'white', padding: '0.25rem 0.55rem', borderRadius: '6px' }}>Sample</span>
      <div style={{ fontSize: '0.78rem', fontWeight: 700, letterSpacing: '1.4px', textTransform: 'uppercase', color: '#e64774' }}>Weekly Seller Report</div>
      <div style={{ fontFamily: SERIF, fontSize: '1.15rem', fontWeight: 700, color: '#1c2b29', margin: '0.3rem 0 1rem' }}>Your home, this week</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginBottom: '0.75rem' }}>
        {[['57', 'Page views'], ['9', 'Saved it'], ['3', 'Showing requests']].map(([v, l]) => (
          <div key={l} style={{ background: 'white', border: '1px solid #eeddd8', borderRadius: '12px', padding: '0.8rem 0.5rem', textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1c2b29' }}>{v}</div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#98a3a1', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{l}</div>
          </div>
        ))}
      </div>
      <div style={{ background: 'white', border: '1px solid #eeddd8', borderRadius: '12px', padding: '0.9rem 0.9rem 0.5rem' }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#98a3a1', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.6rem' }}>Page views by day</div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '56px' }}>
          {bars.map((b, i) => <div key={i} style={{ flex: 1, height: `${(b / max) * 100}%`, background: '#e64774', borderRadius: '4px 4px 0 0' }} />)}
        </div>
      </div>
      <div style={{ fontSize: '0.95rem', color: '#4a5654', marginTop: '0.75rem', display: 'flex', justifyContent: 'space-between' }}>
        <span>Buyers registered on your lake</span><strong>14</strong>
      </div>
    </div>
  );
}

export default function SellPage() {
  const [counts, setCounts] = useState(null);

  useEffect(() => {
    window.scrollTo({ top: 0 });
    document.title = 'Sell your lake home | Holly Griewahn, Foundation Realty';
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
      "What happens when Holly Griewahn lists a lake home in the Irish Hills: the buyer waitlist, launch day, weekly seller reports and the track record behind it. Foundation Realty, Manitou Beach, Michigan."
    );
    return () => {
      if (created) meta.remove();
      else if (prev !== null) meta.setAttribute('content', prev);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/waitlist?all=1')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (!cancelled && data && data.counts) setCounts(data.counts); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const waitingLakes = counts
    ? Object.entries(counts)
        .filter(([, n]) => n >= 3)
        .map(([slug, n]) => ({ slug, n, name: lakes[slug]?.name || slug }))
        .sort((a, b) => b.n - a.n)
    : [];

  const record = trackRecord(propertiesData);

  return (
    <div style={{ minHeight: '100vh', background: '#fdf7f5', fontFamily: FONT, color: '#1c2b29' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Source+Serif+4:ital,opsz,wght@0,8..60,400..800;1,8..60,400..600&family=Inter:wght@300..700&display=swap');
        * { box-sizing: border-box; }
        .sell-two { display: grid; grid-template-columns: 1.2fr 1fr; gap: 1.5rem; align-items: start; }
        @media (max-width: 760px) { .sell-two { grid-template-columns: 1fr; } }
      `}</style>

      <SiteNav active="sell" transparent textBody="Hi Holly, I'm thinking about selling my lake home." />

      {/* Hero */}
      <div style={{ minHeight: '54vh', display: 'flex', alignItems: 'flex-end', padding: '9rem 1.5rem 3rem', background: 'linear-gradient(135deg, #1a554e 0%, #1d5f57 55%, #123f3a 100%)' }}>
        <div style={{ maxWidth: '760px', margin: '0 auto', width: '100%' }}>
          <h1 style={{ fontFamily: SERIF, fontSize: 'clamp(2rem, 5.5vw, 3.2rem)', fontWeight: 800, color: 'white', lineHeight: 1.15, marginBottom: '0.75rem' }}>Selling a lake home in the Irish Hills</h1>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '1.05rem', lineHeight: 1.6, marginBottom: '1.75rem', maxWidth: '600px' }}>
            Serious buyers hear from Holly before a lake home ever reaches the MLS. Here is what happens from the day you decide to the day it closes.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <Link to="/cma" style={{ padding: '0.85rem 1.7rem', background: '#e64774', color: 'white', borderRadius: '10px', textDecoration: 'none', fontWeight: 700, fontSize: '0.95rem' }}>What is my home worth</Link>
            <a href={SMS_HREF} style={{ padding: '0.85rem 1.7rem', background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '10px', textDecoration: 'none', fontWeight: 700, fontSize: '0.95rem' }}>Text Holly</a>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '3rem 1.5rem 1rem' }}>

        {/* Buyers already waiting */}
        {waitingLakes.length > 0 && (
          <div id="buyers-waiting" style={{ marginBottom: '3rem' }}>
            <h2 style={{ fontFamily: SERIF, fontSize: 'clamp(1.5rem, 3.5vw, 2rem)', fontWeight: 700, marginBottom: '0.6rem' }}>Buyers already waiting</h2>
            <p style={{ fontSize: '0.98rem', color: '#66706e', lineHeight: 1.6, marginBottom: '1.25rem' }}>
              People who asked to hear about the next home on their lake before it is public.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
              {waitingLakes.map((l) => (
                <Link key={l.slug} to={`/lakes/${l.slug}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.55rem 1rem', background: 'white', border: '1px solid #eeddd8', borderRadius: '30px', textDecoration: 'none', color: '#1c2b29', fontSize: '0.9rem', fontWeight: 600 }}>
                  {l.name} &middot; {l.n} buyers
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* The day we list */}
        <div id="day-we-list" style={{ background: 'white', border: '1px solid #eeddd8', borderRadius: '16px', padding: '1.75rem', marginBottom: '3rem' }}>
          <h2 style={{ fontFamily: SERIF, fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>The day we list</h2>
          <p style={{ fontSize: '0.98rem', color: '#66706e', lineHeight: 1.6, marginBottom: '0.5rem' }}>How Holly runs a listing, from the waitlist to closing.</p>
          <Step when="Before" title="The lake waitlist hears first">
            Registered buyers get a text from Holly about your home before it is public. Serious buyers on a lake do not wait for Zillow.
          </Step>
          <Step when="Day 1" title="Your own property page">
            A full gallery, the numbers, a one-tap showing request that reaches Holly's phone within seconds, and a save button so we can see who comes back.
          </Step>
          <Step when="Day 1" title="MLS and every portal">
            Listed through Foundation Realty on the MLS, which feeds Zillow, Realtor.com and the rest.
          </Step>
          <Step when="Day 1" title="Placed on the lake's own page">
            Buyers searching for your lake land on a page about the lake itself, with your home on it. That page keeps working through the winter.
          </Step>
          <Step when="Every week" title="Your seller report">
            Views, saves, showing requests and the lake's buyer count, in your inbox on a schedule.
          </Step>
          <Step when="Every showing" title="You hear what buyers said">
            Holly follows up with the showing agent and the feedback comes to you, not into a drawer.
          </Step>
          <Step when="Closing" title="It stays on the site as a sold home">
            Days on market and percent of list, on the record.
          </Step>
        </div>

        <div className="sell-two" style={{ marginBottom: '3rem' }}>
          {/* Sample report */}
          <div id="seller-report">
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#98a3a1', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.6rem' }}>What sellers get every Monday</div>
            <SampleReport />
          </div>

          {/* Sold, not listed */}
          <div style={{ background: 'white', border: '1px solid #eeddd8', borderRadius: '16px', padding: '1.5rem' }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#98a3a1', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.75rem' }}>Sold, not listed</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem', marginBottom: '1rem' }}>
              <div>
                <div style={{ fontFamily: SERIF, fontSize: '1.8rem', fontWeight: 800, color: '#e64774' }}>{record.sold}</div>
                <div style={{ fontSize: '0.75rem', color: '#98a3a1', textTransform: 'uppercase' }}>Homes sold</div>
              </div>
              <div>
                <div style={{ fontFamily: SERIF, fontSize: '1.8rem', fontWeight: 800, color: '#1c2b29' }}>{(record.volume ? `$${(record.volume / 1e6).toFixed(1)}M` : 'n/a')}</div>
                <div style={{ fontSize: '0.75rem', color: '#98a3a1', textTransform: 'uppercase' }}>Sold volume</div>
              </div>
            </div>
            <Link to="/sold" style={{ color: '#e64774', fontWeight: 700, fontSize: '0.9rem', textDecoration: 'none' }}>See every sale</Link>
          </div>
        </div>

        <div style={{ marginBottom: '3rem' }}>
          <TrustStrip align="center" />
        </div>

        {/* Closing CTA */}
        <div style={{ background: 'linear-gradient(135deg, #1a554e, #237168)', borderRadius: '16px', padding: '2.5rem 2rem', textAlign: 'center', color: 'white', marginBottom: '3rem' }}>
          <h2 style={{ fontFamily: SERIF, fontSize: 'clamp(1.4rem, 3.5vw, 1.9rem)', fontWeight: 700, marginBottom: '1.25rem' }}>Find out what your lake home is worth</h2>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/cma" style={{ padding: '0.85rem 1.7rem', background: '#e64774', color: 'white', borderRadius: '10px', textDecoration: 'none', fontWeight: 700, fontSize: '0.95rem' }}>What is my home worth</Link>
            <a href={SMS_HREF} style={{ padding: '0.85rem 1.7rem', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.3)', color: 'white', borderRadius: '10px', textDecoration: 'none', fontWeight: 700, fontSize: '0.95rem' }}>Text Holly</a>
            <a href={CALL_HREF} style={{ padding: '0.85rem 1.7rem', background: 'white', color: '#1c2b29', borderRadius: '10px', textDecoration: 'none', fontWeight: 700, fontSize: '0.95rem' }}>Call (517) 403-3413</a>
          </div>
        </div>
      </div>

      <footer style={{ background: '#0e2d29', padding: '2rem', textAlign: 'center' }}>
        <p style={{ color: '#66706e', fontSize: '0.82rem' }}>Holly Griewahn | Foundation Realty | Manitou Beach, Michigan</p>
      </footer>
    </div>
  );
}
