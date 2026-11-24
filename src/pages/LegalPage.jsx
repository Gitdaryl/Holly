import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import SiteNav from '../components/SiteNav';
import { LEGAL, LEGAL_UPDATED } from '../data/legal';

// /privacy and /terms. The text lives in src/data/legal.js and is also written
// into static HTML at build time (scripts/prerender.mjs), so crawlers and the
// carrier's campaign reviewer see the same words without running JavaScript.

const FONT = "'Inter', -apple-system, sans-serif";
const SERIF = "'Source Serif 4', Georgia, serif";

export default function LegalPage({ kind }) {
  const doc = LEGAL[kind];
  const other = kind === 'privacy' ? { to: '/terms', label: 'Terms of Use and Text Message Terms' } : { to: '/privacy', label: 'Privacy Policy' };

  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = `${doc.title} | Holly Griewahn, Foundation Realty`;
  }, [doc]);

  return (
    <div style={{ minHeight: '100vh', background: '#fdf7f5', fontFamily: FONT, color: '#1c2b29' }}>
      <SiteNav textBody="Hi Holly, I found you on your website." />
      <main style={{ maxWidth: '720px', margin: '0 auto', padding: '6.5rem 1.25rem 4rem' }}>
        <h1 style={{ fontFamily: SERIF, fontSize: 'clamp(1.8rem, 5vw, 2.4rem)', lineHeight: 1.2, margin: '0 0 1.25rem' }}>{doc.title}</h1>
        {doc.blocks.map(([type, content], i) => {
          if (type === 'h') return <h2 key={i} style={{ fontFamily: SERIF, fontSize: '1.25rem', margin: '1.75rem 0 0.4rem' }}>{content}</h2>;
          if (type === 'ul') return (
            <ul key={i} style={{ paddingLeft: '1.25rem', margin: '0 0 0.75rem', lineHeight: 1.7, color: '#364240' }}>
              {content.map((li, j) => <li key={j} style={{ marginBottom: '0.4rem' }}>{li}</li>)}
            </ul>
          );
          return <p key={i} style={{ lineHeight: 1.7, color: '#364240', margin: '0 0 0.75rem' }}>{content}</p>;
        })}
        <p style={{ color: '#66706e', fontSize: '0.9rem', marginTop: '2.25rem' }}>Last updated {LEGAL_UPDATED}</p>
        <p style={{ marginTop: '1rem' }}><Link to={other.to} style={{ color: '#ad3557', fontWeight: 600 }}>{other.label}</Link></p>
      </main>
    </div>
  );
}
