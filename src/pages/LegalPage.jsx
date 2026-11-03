import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import SiteNav from '../components/SiteNav';
import { PRIVACY, TERMS, LEGAL_UPDATED } from '../data/legal';

const SERIF = "'Source Serif 4', Georgia, serif";

export default function LegalPage({ kind }) {
  const doc = kind === 'terms' ? TERMS : PRIVACY;
  useEffect(() => { document.title = `${doc.title} | Holly Griewahn, Foundation Realty`; window.scrollTo(0, 0); }, [doc]);
  return (
    <div style={{ background: '#fdf7f5', color: '#1c2b29', minHeight: '100vh' }}>
      <SiteNav />
      <main style={{ maxWidth: 720, margin: '0 auto', padding: '7rem 1.25rem 4rem' }}>
        <h1 style={{ fontFamily: SERIF, fontSize: 'clamp(1.9rem, 5vw, 2.6rem)', fontWeight: 700, marginBottom: '0.4rem' }}>{doc.title}</h1>
        <p style={{ color: '#66706e', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Last updated {LEGAL_UPDATED}</p>
        <p style={{ fontSize: '1.05rem', lineHeight: 1.65, marginBottom: '2rem' }}>{doc.intro}</p>
        {doc.sections.map((s) => (
          <section key={s.h} style={{ marginBottom: '1.75rem' }}>
            <h2 style={{ fontFamily: SERIF, fontSize: '1.3rem', fontWeight: 700, marginBottom: '0.5rem' }}>{s.h}</h2>
            {s.p && <p style={{ lineHeight: 1.65 }}>{s.p}</p>}
            {s.items && <ul style={{ paddingLeft: '1.2rem', lineHeight: 1.65 }}>{s.items.map((i) => <li key={i} style={{ marginBottom: '0.4rem' }}>{i}</li>)}</ul>}
          </section>
        ))}
        <p style={{ marginTop: '2.5rem' }}><Link to={kind === 'terms' ? '/privacy' : '/terms'} style={{ color: '#ad3557', fontWeight: 600 }}>{kind === 'terms' ? 'Read the Privacy Policy' : 'Read the Terms'}</Link></p>
      </main>
    </div>
  );
}
