import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { marketFor, marketIndex } from '../lib/market';
import { soldBadge, fmtPrice } from '../lib/listing-stats';
import { coverFor } from '../lib/cover';
import { NavBar } from './ListingsPage';
import LakeWaitlist from '../components/LakeWaitlist';
import { TrustStrip } from '../components/GoogleReviews';

// /market/<lake>: what Holly sold on this lake this year, with the region for
// context, and an owner sign-up ("text me when something sells or lists").
// /market: every lake with a count. All figures are Holly's own sales and the
// page says so; no MLS-wide claims.

const SERIF = "'Playfair Display', serif";
const FONT = "'DM Sans', -apple-system, sans-serif";

function Tile({ value, label, sub }) {
  return (
    <div style={{ background: 'white', border: '1px solid #e8e4df', borderRadius: '14px', padding: '1.1rem 0.75rem', textAlign: 'center' }}>
      <div style={{ fontFamily: SERIF, fontSize: 'clamp(1.4rem, 4vw, 2rem)', fontWeight: 800, color: '#1a2332', lineHeight: 1.1 }}>{value}</div>
      <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.6px', marginTop: '0.4rem' }}>{label}</div>
      {sub && <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '0.15rem' }}>{sub}</div>}
    </div>
  );
}

function MonthChart({ byMonth, lakeName, regionName, hasLakeData }) {
  const key = hasLakeData ? 'lake' : 'region';
  const max = Math.max(1, ...byMonth.map((m) => m[key]));
  const now = new Date().getMonth();
  return (
    <div style={{ background: 'white', border: '1px solid #e8e4df', borderRadius: '16px', padding: '1.25rem 1.25rem 0.9rem' }}>
      <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.9rem' }}>
        Closings by month, {hasLakeData ? lakeName : regionName}
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '5px', height: '90px' }}>
        {byMonth.map((m, i) => (
          <div key={m.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%' }}>
            {m[key] > 0 && <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#1a2332', marginBottom: '3px' }}>{m[key]}</div>}
            <div style={{ width: '100%', height: `${Math.max(4, (m[key] / max) * 64)}px`, background: i > now ? '#f0eee9' : m[key] ? '#e84393' : '#e8e4df', borderRadius: '4px 4px 0 0' }} />
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: '5px', marginTop: '0.4rem' }}>
        {byMonth.map((m) => <div key={m.month} style={{ flex: 1, textAlign: 'center', fontSize: '0.6rem', color: '#94a3b8', fontWeight: 600 }}>{m.month[0]}</div>)}
      </div>
    </div>
  );
}

function SaleRow({ p }) {
  const cover = coverFor(p, { w: 320, h: 200 });
  return (
    <Link to={`/property/${p.slug}`} style={{ display: 'flex', gap: '0.85rem', alignItems: 'center', padding: '0.7rem 0', borderTop: '1px solid #f0eee9', textDecoration: 'none', color: '#1a2332' }}>
      <div style={{ width: 72, height: 50, borderRadius: '8px', background: cover ? `url(${cover}) center / cover` : p.gradient, flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>{p.title}</div>
        <div style={{ fontSize: '0.75rem', color: '#6b7a8d' }}>{soldBadge(p)} · {new Date(`${p.soldOn}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' })}</div>
      </div>
      <div style={{ fontFamily: SERIF, fontWeight: 800, fontSize: '1.05rem', whiteSpace: 'nowrap' }}>{fmtPrice(p.soldPrice ? parseInt(String(p.soldPrice).replace(/[^0-9]/g, ''), 10) : 0)}</div>
    </Link>
  );
}

function Shell({ children, title }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    window.scrollTo({ top: 0 });
    document.title = title;
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, [title]);
  return (
    <div style={{ minHeight: '100vh', background: '#faf9f7', fontFamily: FONT, color: '#1a2332' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700;800&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .mk-tiles { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.75rem; }
        .mk-two { display: grid; grid-template-columns: 1.1fr 0.9fr; gap: 1.25rem; align-items: start; }
        @media (max-width: 760px) { .mk-tiles { grid-template-columns: repeat(2, 1fr); } .mk-two { grid-template-columns: 1fr; } }
      `}</style>
      <NavBar scrolled={scrolled} />
      {children}
      <footer style={{ background: '#0f1923', padding: '2rem', textAlign: 'center' }}>
        <p style={{ color: '#64748b', fontSize: '0.82rem' }}>&copy; 2026 Holly Griewahn | Foundation Realty | Manitou Beach, Michigan</p>
      </footer>
    </div>
  );
}

export default function MarketPage() {
  const { slug } = useParams();
  if (!slug) return <MarketIndex />;
  const m = marketFor(slug);
  if (!m) {
    return (
      <Shell title="Market reports | Holly Griewahn">
        <div style={{ padding: '8rem 2rem', textAlign: 'center' }}>
          <h1 style={{ fontFamily: SERIF, marginBottom: '1rem' }}>No report for that lake</h1>
          <Link to="/market" style={{ color: '#e84393', fontWeight: 700 }}>See all lake reports</Link>
        </div>
      </Shell>
    );
  }

  const { lake, region, year, lakeSold, regionSold, forSale, lakeStats, regionStats, byMonth, hasLakeData } = m;
  const s = hasLakeData ? lakeStats : regionStats;
  const scope = hasLakeData ? lake.name : region.name;
  const range = s.low && s.high ? (s.low === s.high ? fmtPrice(s.low) : `${fmtPrice(s.low)} to ${fmtPrice(s.high)}`) : '—';

  return (
    <Shell title={`${lake.name} sales report ${year} | Holly Griewahn`}>
      <div style={{ minHeight: '46vh', background: 'linear-gradient(135deg, #1a2332 0%, #2c4a6e 60%, #1a3a4a 100%)', display: 'flex', alignItems: 'flex-end', padding: '7rem 2rem 2.5rem', position: 'relative' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 70% 30%, rgba(232,67,147,0.14) 0%, transparent 50%)' }} />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: '960px', margin: '0 auto', width: '100%' }}>
          <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', marginBottom: '0.9rem', fontSize: '0.78rem' }}>
            <Link to="/market" style={{ color: 'rgba(255,255,255,0.55)', textDecoration: 'none' }}>Lake reports</Link>
            <span style={{ color: 'rgba(255,255,255,0.35)' }}>›</span>
            <Link to={`/lakes/${lake.slug}`} style={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none' }}>{lake.name}</Link>
          </div>
          <p style={{ color: '#f6a5c9', fontSize: '0.78rem', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '0.6rem' }}>{year} sales report</p>
          <h1 style={{ fontFamily: SERIF, fontSize: 'clamp(1.9rem, 5vw, 3rem)', fontWeight: 800, color: 'white', lineHeight: 1.15, marginBottom: '0.6rem' }}>
            {hasLakeData ? `What Holly sold on ${lake.name} in ${year}` : `${lake.name} and the ${region.name} market, ${year}`}
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '1rem', maxWidth: '600px', lineHeight: 1.6, marginBottom: '1rem' }}>
            {hasLakeData
              ? `${lakeStats.sold} closed sale${lakeStats.sold > 1 ? 's' : ''} on ${lake.name} this year through Holly Griewahn, Foundation Realty. Real prices, real days on market.`
              : `Holly has not closed a ${lake.name} sale yet this year. Here is what she sold across ${region.name}, which is the market ${lake.name} homes are priced against.`}
          </p>
          <TrustStrip dark />
        </div>
      </div>

      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '2rem 1.5rem 5rem' }}>
        <div className="mk-tiles" style={{ marginBottom: '1.25rem' }}>
          <Tile value={s.sold} label={`Sold in ${year}`} sub={scope} />
          <Tile value={s.avgDays === null ? '—' : s.avgDays} label="Avg days to sell" sub="Holly's listings" />
          <Tile value={s.median ? fmtPrice(s.median) : '—'} label="Median sale price" sub={range} />
          <Tile value={s.dayOne} label="Sold day one" sub="before the public saw it" />
        </div>

        <div className="mk-two" style={{ marginBottom: '1.25rem' }}>
          <MonthChart byMonth={byMonth} lakeName={lake.name} regionName={region.name} hasLakeData={hasLakeData} />
          <div style={{ background: 'white', border: '1px solid #e8e4df', borderRadius: '16px', padding: '1.25rem 1.5rem' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.6rem' }}>What this means if you own on {lake.name}</div>
            <p style={{ fontSize: '0.9rem', lineHeight: 1.65, color: '#4a5568' }}>
              {s.dayOne > 0
                ? `${s.dayOne} of these ${s.sold} homes sold the day they listed, to buyers Holly already had waiting. `
                : ''}
              {lake.avgPrice ? `Typical lakefront on ${lake.name} runs around ${lake.avgPrice}. ` : ''}
              Prices move month to month on the lake, so the only number that matters is what a buyer would pay for your home this season. Holly will tell you that from these sales, not from a national estimate.
            </p>
            <Link to="/cma" style={{ display: 'inline-block', marginTop: '0.9rem', background: '#e84393', color: 'white', padding: '0.7rem 1.2rem', borderRadius: '10px', textDecoration: 'none', fontWeight: 700, fontSize: '0.88rem' }}>What's my {lake.name} home worth?</Link>
          </div>
        </div>

        {(hasLakeData ? lakeSold : regionSold).length > 0 && (
          <div style={{ background: 'white', border: '1px solid #e8e4df', borderRadius: '16px', padding: '1.25rem 1.5rem', marginBottom: '1.25rem' }}>
            <h2 style={{ fontFamily: SERIF, fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>{hasLakeData ? `Sold on ${lake.name}` : `Sold across ${region.name}`}, {year}</h2>
            {(hasLakeData ? lakeSold : regionSold).map((p) => <SaleRow key={p.id} p={p} />)}
          </div>
        )}

        {forSale.length > 0 && (
          <div style={{ background: 'white', border: '1px solid #e8e4df', borderRadius: '16px', padding: '1.25rem 1.5rem', marginBottom: '1.25rem' }}>
            <h2 style={{ fontFamily: SERIF, fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>For sale on {lake.name} now</h2>
            {forSale.map((p) => (
              <Link key={p.id} to={`/property/${p.slug}`} style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', padding: '0.6rem 0', borderTop: '1px solid #f0eee9', textDecoration: 'none', color: '#1a2332' }}>
                <span style={{ fontWeight: 600 }}>{p.title}</span><span style={{ fontWeight: 800, color: '#e84393' }}>{p.price}</span>
              </Link>
            ))}
          </div>
        )}

        <LakeWaitlist lake={lake.slug} lakeName={lake.name} role="owner" />

        <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '1.25rem', lineHeight: 1.5 }}>
          Figures are Holly Griewahn's own closed sales through Foundation Realty in {year}, not the full MLS. Days to sell is measured from listing to accepted offer on the sales where Holly was the listing agent.
        </p>
      </div>
    </Shell>
  );
}

function MarketIndex() {
  const rows = marketIndex();
  const year = new Date().getFullYear();
  return (
    <Shell title={`Irish Hills lake sales reports ${year} | Holly Griewahn`}>
      <div style={{ background: 'linear-gradient(135deg, #1a2332 0%, #2c4a6e 60%, #1a3a4a 100%)', padding: '7rem 2rem 2.5rem' }}>
        <div style={{ maxWidth: '960px', margin: '0 auto' }}>
          <p style={{ color: '#f6a5c9', fontSize: '0.78rem', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '0.6rem' }}>Lake by lake</p>
          <h1 style={{ fontFamily: SERIF, fontSize: 'clamp(1.9rem, 5vw, 3rem)', fontWeight: 800, color: 'white', lineHeight: 1.15, marginBottom: '0.6rem' }}>{year} sales reports</h1>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '1rem', maxWidth: '600px', lineHeight: 1.6 }}>Holly's closed sales on each Irish Hills lake this year: how many, how fast, for how much.</p>
        </div>
      </div>
      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '2rem 1.5rem 5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
        {rows.map((r) => (
          <Link key={r.lake.slug} to={`/market/${r.lake.slug}`} style={{ background: 'white', border: '1px solid #e8e4df', borderRadius: '14px', padding: '1.1rem 1.25rem', textDecoration: 'none', color: '#1a2332', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
            <div>
              <div style={{ fontWeight: 700 }}>{r.lake.name}</div>
              <div style={{ fontSize: '0.75rem', color: '#6b7a8d' }}>{r.region?.name}{r.active ? ` · ${r.active} for sale` : ''}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: SERIF, fontSize: '1.4rem', fontWeight: 800, color: r.sold ? '#e84393' : '#cbd5e0' }}>{r.sold}</div>
              <div style={{ fontSize: '0.62rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>sold {year}</div>
            </div>
          </Link>
        ))}
      </div>
    </Shell>
  );
}
