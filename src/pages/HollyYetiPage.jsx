import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import SiteNav from '../components/SiteNav';
import VideoWall from '../components/VideoWall';
import GoogleReviews from '../components/GoogleReviews';
import { propertiesData } from '../data/amenities';
import { trackRecord, isSold, soldStats, fmtPrice } from '../lib/listing-stats';
import { SHOW } from '../data/profiles';

// "Holly & The Yeti" on Holly's own site.
//
// Deliberately NOT the same page as manitoubeachmichigan.com/holly-yeti. That
// one sells the show to visitors. This one is for someone who already watched
// an episode and wondered who the Realtor is, so it ends where her site ends:
// listings, sold, what your place is worth. Different copy on purpose - two
// near-identical pages on two domains compete and neither reads as canonical.

const FONT = "'DM Sans', -apple-system, sans-serif";
const SERIF = "'Playfair Display', serif";
const CALL_HREF = 'tel:5174033413';
const SMS_HREF = 'sms:+15173008226?&body=Hi%20Holly%2C%20I%20found%20you%20through%20the%20show.';

const SOCIALS = [
  { label: 'YouTube', href: SHOW.youtube },
  { label: 'Facebook', href: SHOW.facebook },
  { label: 'Instagram', href: SHOW.instagram },
];

function NumberTile({ value, label }) {
  return (
    <div style={{ background: 'white', border: '1px solid #e8e4df', borderRadius: '14px', padding: '1.25rem 0.9rem', textAlign: 'center' }}>
      <div style={{ fontFamily: SERIF, fontSize: 'clamp(1.6rem, 4vw, 2.1rem)', fontWeight: 800, color: '#e84393', lineHeight: 1.1 }}>{value}</div>
      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.6px', marginTop: '0.4rem' }}>{label}</div>
    </div>
  );
}

function HostCard({ name, role, children, to, href }) {
  const inner = (
    <>
      <div style={{ fontFamily: SERIF, fontSize: '1.25rem', fontWeight: 700, color: '#1a2332', marginBottom: '0.2rem' }}>{name}</div>
      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#e84393', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '0.75rem' }}>{role}</div>
      <div style={{ fontSize: '0.95rem', color: '#4a5568', lineHeight: 1.7 }}>{children}</div>
    </>
  );
  const box = { display: 'block', textDecoration: 'none', color: 'inherit', background: 'white', border: '1px solid #e8e4df', borderRadius: '14px', padding: '1.5rem' };
  if (to) return <Link to={to} style={box}>{inner}</Link>;
  if (href) return <a href={href} target="_blank" rel="noopener" style={box}>{inner}</a>;
  return <div style={box}>{inner}</div>;
}

export default function HollyYetiPage() {
  useEffect(() => {
    window.scrollTo({ top: 0 });
    document.title = 'Holly & The Yeti | The Show, and the Irish Hills Realtor Behind It';
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
      'Holly Griewahn co-hosts Holly & The Yeti, a show about life around Devils Lake and the Irish Hills. Watch the episodes, then see what she has for sale on the lakes.'
    );
    return () => {
      if (created) meta.remove();
      else if (prev !== null) meta.setAttribute('content', prev);
    };
  }, []);

  const soldEntries = propertiesData.filter(isSold);
  const year = soldEntries.reduce((max, p) => {
    const y = parseInt(String(p.soldOn || '').slice(0, 4), 10);
    return y > max ? y : max;
  }, 0) || new Date().getFullYear();
  const yearSold = soldEntries.filter((p) => String(p.soldOn || '').startsWith(String(year)));
  const record = trackRecord(yearSold);
  const fastSales = yearSold.filter((p) => {
    const s = soldStats(p);
    return s && s.side !== 'buyer' && s.days !== null && s.days <= 7;
  }).length;

  const card = { background: 'white', border: '1px solid #e8e4df', borderRadius: '14px', padding: '1.5rem' };
  const h2 = { fontFamily: SERIF, fontSize: '1.4rem', fontWeight: 700, color: '#1a2332', marginBottom: '1rem' };

  return (
    <div style={{ minHeight: '100vh', background: '#faf9f7', fontFamily: FONT, color: '#1a2332' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700;800&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        .hy-hosts { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.25rem; }
        .hy-numbers { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.9rem; }
        .hy-next { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.9rem; }
        @media (max-width: 700px) {
          .hy-hosts, .hy-next { grid-template-columns: 1fr; }
          .hy-numbers { grid-template-columns: repeat(2, 1fr); }
        }
      `}</style>

      <SiteNav transparent textBody="Hi Holly, I found you through the show." />

      {/* Hero. The socials sit BELOW the property CTAs on purpose: on the
          Manitou page the channel is the destination, here it is the door
          somebody already came through. */}
      <div style={{ position: 'relative', overflow: 'hidden', minHeight: '54vh', display: 'flex', alignItems: 'flex-end', background: 'linear-gradient(135deg, #1a2332 0%, #1a3a52 55%, #0f2940 100%)' }}>
        <div style={{ position: 'relative', zIndex: 2, maxWidth: '1100px', margin: '0 auto', width: '100%', padding: '9rem 1.5rem 3rem' }}>
          <div style={{ maxWidth: '640px' }}>
            <h1 style={{ fontFamily: SERIF, fontSize: 'clamp(2.2rem, 5.5vw, 3.6rem)', fontWeight: 800, color: 'white', lineHeight: 1.1, marginBottom: '0.6rem' }}>
              Holly &amp; The Yeti
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.78)', fontSize: '1.05rem', lineHeight: 1.6, marginBottom: '1.75rem' }}>
              A show about life around Devils Lake and the Irish Hills. One of the two hosts has been selling property out here for thirty years. The other is a cryptid.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
              <Link to="/listings" style={{ padding: '0.8rem 1.6rem', background: '#e84393', color: 'white', borderRadius: '10px', textDecoration: 'none', fontWeight: 700, fontSize: '0.95rem' }}>See Holly&rsquo;s listings</Link>
              <Link to="/cma" style={{ padding: '0.8rem 1.6rem', background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '10px', textDecoration: 'none', fontWeight: 700, fontSize: '0.95rem' }}>What&rsquo;s my home worth?</Link>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {SOCIALS.map((s) => (
                <a key={s.label} href={s.href} target="_blank" rel="noopener" style={{ padding: '0.45rem 0.95rem', borderRadius: '30px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.22)', color: 'rgba(255,255,255,0.85)', textDecoration: 'none', fontSize: '0.82rem', fontWeight: 600 }}>
                  {s.label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '3rem 1.5rem 1rem' }}>

        <VideoWall limit={4} channelUrl={SHOW.youtube} heading="Latest episodes" />

        {/* Who's who. New copy, not the Manitou bios. */}
        <section style={{ marginBottom: '3rem' }}>
          <h2 style={h2}>Who&rsquo;s who</h2>
          <div className="hy-hosts">
            <HostCard name="Holly Griewahn" role="Realtor, Foundation Realty" to="/about">
              Holly has sold lake, cottage, farm and village property around the Irish Hills for more than thirty years, out of the Foundation Realty office on Walnut Street in Manitou Beach. On the show she is the one who knows which lake is which, who owns what, and why that channel lot floods.
            </HostCard>
            <HostCard name="Daryl, &ldquo;The Yeti&rdquo;" role="Filmmaker and co-host" href="https://manitoubeachmichigan.com">
              Daryl films the place for a living and runs the Manitou Beach Michigan community site. He brings the camera, the questions, and an accent nobody can account for.
            </HostCard>
          </div>
        </section>

        {/* The reason this page lives on her domain and not only on Manitou's. */}
        <section style={{ marginBottom: '3rem' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '0.5rem' }}>Off camera</div>
          <h2 style={h2}>What Holly actually does the rest of the week</h2>
          <div className="hy-numbers" style={{ marginBottom: '1.25rem' }}>
            <NumberTile value={record.sold} label={`Sold in ${year}`} />
            <NumberTile value={fmtPrice(record.volume)} label="Volume" />
            <NumberTile value={record.listSides} label="As listing agent" />
            <NumberTile value={fastSales} label="Sold in a week" />
          </div>
          <div className="hy-next">
            <Link to="/sold" style={{ ...card, display: 'block', textDecoration: 'none', color: 'inherit' }}>
              <div style={{ fontWeight: 700, marginBottom: '0.3rem' }}>Every sale</div>
              <div style={{ fontSize: '0.88rem', color: '#6b7a8d', lineHeight: 1.6 }}>The whole {year} list, with what each one sold for.</div>
            </Link>
            <Link to="/listings" style={{ ...card, display: 'block', textDecoration: 'none', color: 'inherit' }}>
              <div style={{ fontWeight: 700, marginBottom: '0.3rem' }}>For sale now</div>
              <div style={{ fontSize: '0.88rem', color: '#6b7a8d', lineHeight: 1.6 }}>What is on the market around the lakes today.</div>
            </Link>
            <Link to="/cma" style={{ ...card, display: 'block', textDecoration: 'none', color: 'inherit' }}>
              <div style={{ fontWeight: 700, marginBottom: '0.3rem' }}>What&rsquo;s mine worth?</div>
              <div style={{ fontSize: '0.88rem', color: '#6b7a8d', lineHeight: 1.6 }}>Answered with sales on your lake, not a national guess.</div>
            </Link>
          </div>
        </section>

        <section style={{ marginBottom: '3rem' }}>
          <GoogleReviews limit={3} />
        </section>

        {/* Closing CTA */}
        <div style={{ background: 'linear-gradient(135deg, #1a2332, #2c3e50)', borderRadius: '16px', padding: '2.5rem 2rem', textAlign: 'center', marginBottom: '3rem' }}>
          <h2 style={{ fontFamily: SERIF, fontSize: 'clamp(1.5rem, 3.5vw, 2rem)', fontWeight: 700, color: 'white', marginBottom: '0.75rem' }}>
            Watched an episode and started looking at lake houses?
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.75)', marginBottom: '1.5rem', lineHeight: 1.7 }}>
            That happens. Call or text Holly. She will tell you honestly if the lake you have in mind is the wrong one.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href={SMS_HREF} style={{ padding: '0.8rem 1.6rem', background: '#e84393', color: 'white', borderRadius: '10px', textDecoration: 'none', fontWeight: 700, fontSize: '0.95rem' }}>Text Holly</a>
            <a href={CALL_HREF} style={{ padding: '0.8rem 1.6rem', background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '10px', textDecoration: 'none', fontWeight: 700, fontSize: '0.95rem' }}>(517) 403-3413</a>
          </div>
        </div>
      </div>

      <footer style={{ background: '#0f1923', padding: '2rem', textAlign: 'center' }}>
        <div style={{ color: '#64748b', fontSize: '0.82rem' }}>Holly Griewahn | Foundation Realty | Manitou Beach, Michigan</div>
      </footer>
    </div>
  );
}
