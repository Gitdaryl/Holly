import React, { useState, useEffect, useRef } from 'react';

// Shared site nav for every public page. Derived from ListingsPage's old
// NavBar so the look stays the same; adds a mobile hamburger panel and the
// Text Holly / Call Holly buttons everywhere.
//
// Plain <a href> is used for internal links (not react-router <Link>) since
// this component is shared with App.jsx, which does not use react-router.

const CALL_HREF = 'tel:5174033413';
const smsHref = (body) => `sms:+15173008226?&body=${encodeURIComponent(body)}`;

const NAV_LINKS = [
  { key: 'listings', label: 'Listings', to: '/listings' },
  { key: 'sold', label: 'Sold', to: '/sold' },
  { key: 'sell', label: 'Sell', to: '/sell' },
  { key: 'cma', label: 'Home Value', to: '/cma' },
  { key: 'blog', label: 'Blog', to: '/blog' },
  { key: 'about', label: 'About', to: '/about' },
];

export default function SiteNav({
  active,
  transparent = false,
  back,
  textBody = 'Hi Holly, I found you on your website.',
}) {
  const [scrolled, setScrolled] = useState(!transparent);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!transparent) { setScrolled(true); return; }
    const onScroll = () => setScrolled(window.scrollY > 60);
    onScroll();
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, [transparent]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e) => { if (e.key === 'Escape') setMenuOpen(false); };
    const onResize = () => { if (window.innerWidth >= 769) setMenuOpen(false); };
    document.addEventListener('keydown', onKey);
    window.addEventListener('resize', onResize);
    return () => {
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', onResize);
    };
  }, [menuOpen]);

  const solid = scrolled;
  const linkColor = (isActive) => (isActive ? (solid ? '#1a2332' : 'white') : (solid ? '#4a5568' : 'rgba(255,255,255,0.85)'));
  const smsBody = smsHref(textBody);
  const close = () => setMenuOpen(false);

  return (
    <>
      <style>{`
        .sitenav-desktop-links, .sitenav-desktop-cta { display: flex; }
        .sitenav-burger { display: none; }
        @media (max-width: 768px) {
          .sitenav-desktop-links, .sitenav-desktop-cta { display: none !important; }
          .sitenav-burger { display: inline-flex !important; }
        }
        .sitenav-panel-link:active, .sitenav-panel-btn:active { opacity: 0.7; }
      `}</style>

      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 500,
        background: solid ? 'rgba(250,249,247,0.97)' : 'transparent',
        backdropFilter: solid ? 'blur(12px)' : 'none',
        borderBottom: solid ? '1px solid #e8e4df' : 'none',
        transition: 'background 0.3s ease, border-color 0.3s ease',
        padding: '1rem 1.25rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxSizing: 'border-box',
      }}>
        {/* Left: logo, or back link when provided */}
        {back ? (
          <a href={back.to} onClick={close} style={{
            display: 'flex', alignItems: 'center', gap: '0.4rem', textDecoration: 'none',
            color: solid ? '#4a5568' : 'rgba(255,255,255,0.9)', fontSize: '0.85rem', fontWeight: 600,
            minWidth: 0,
          }}>
            <span aria-hidden="true">←</span>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{back.label}</span>
          </a>
        ) : (
          <a href="/" onClick={close} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.6rem', minWidth: 0, flexShrink: 0 }}>
            <img src="/images/foundation-logo.png" alt="Foundation Realty" style={{ height: '30px', flexShrink: 0 }} />
            <span style={{ color: solid ? '#1a2332' : 'white', fontWeight: 700, fontSize: '0.9rem', whiteSpace: 'nowrap' }}>Holly Griewahn</span>
          </a>
        )}

        {/* Desktop links */}
        {!back && (
          <nav className="sitenav-desktop-links" style={{ gap: '1.1rem', alignItems: 'center' }}>
            {NAV_LINKS.map(link => (
              <a key={link.key} href={link.to} style={{
                color: linkColor(active === link.key), textDecoration: 'none', fontSize: '0.85rem',
                fontWeight: active === link.key ? 700 : 600,
                borderBottom: active === link.key ? '2px solid #e84393' : '2px solid transparent',
                paddingBottom: '2px',
              }}>
                {link.label}
              </a>
            ))}
          </nav>
        )}

        {/* Desktop CTAs */}
        <div className="sitenav-desktop-cta" style={{ gap: '0.6rem', alignItems: 'center', flexShrink: 0 }}>
          <a href={smsBody} style={{
            color: solid ? '#1a2332' : 'white',
            border: `1.5px solid ${solid ? '#1a2332' : 'rgba(255,255,255,0.55)'}`,
            padding: '0.42rem 0.9rem', borderRadius: '8px', textDecoration: 'none',
            fontSize: '0.8rem', fontWeight: 600, whiteSpace: 'nowrap',
          }}>
            Text Holly
          </a>
          <a href={CALL_HREF} style={{
            background: '#e84393', color: 'white', padding: '0.45rem 1.1rem', borderRadius: '8px',
            textDecoration: 'none', fontSize: '0.82rem', fontWeight: 600, whiteSpace: 'nowrap',
          }}>
            Call Holly
          </a>
        </div>

        {/* Hamburger (mobile only) */}
        <button
          type="button"
          className="sitenav-burger"
          aria-label="Menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(o => !o)}
          style={{
            alignItems: 'center', justifyContent: 'center',
            width: 40, height: 40, borderRadius: '8px', flexShrink: 0,
            background: menuOpen ? (solid ? '#f0eee9' : 'rgba(255,255,255,0.15)') : 'transparent',
            border: `1.5px solid ${solid ? '#e8e4df' : 'rgba(255,255,255,0.4)'}`,
            cursor: 'pointer',
          }}
        >
          {menuOpen ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={solid ? '#1a2332' : 'white'} strokeWidth="2.2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={solid ? '#1a2332' : 'white'} strokeWidth="2.2" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          )}
        </button>
      </header>

      {/* Mobile menu panel */}
      {menuOpen && (
        <div style={{
          position: 'fixed', top: '72px', left: 0, right: 0, bottom: 0, zIndex: 490,
          background: '#faf9f7', overflowY: 'auto', padding: '0.5rem 1.25rem 2rem',
          borderTop: '1px solid #e8e4df',
        }}>
          {back && (
            <a href={back.to} onClick={close} className="sitenav-panel-link" style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem', minHeight: '48px',
              color: '#4a5568', textDecoration: 'none', fontSize: '1rem', fontWeight: 600,
              borderBottom: '1px solid #f0eee9',
            }}>
              ← {back.label}
            </a>
          )}
          {NAV_LINKS.map(link => (
            <a key={link.key} href={link.to} onClick={close} className="sitenav-panel-link" style={{
              display: 'flex', alignItems: 'center', minHeight: '48px',
              color: active === link.key ? '#e84393' : '#1a2332', textDecoration: 'none',
              fontSize: '1.05rem', fontWeight: active === link.key ? 700 : 600,
              borderBottom: '1px solid #f0eee9',
            }}>
              {link.label}
            </a>
          ))}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1.25rem' }}>
            <a href={smsBody} onClick={close} className="sitenav-panel-btn" style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '48px',
              border: '2px solid #1a2332', color: '#1a2332', borderRadius: '10px',
              textDecoration: 'none', fontWeight: 700, fontSize: '0.95rem',
            }}>
              Text Holly
            </a>
            <a href={CALL_HREF} onClick={close} className="sitenav-panel-btn" style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '48px',
              background: '#e84393', color: 'white', borderRadius: '10px',
              textDecoration: 'none', fontWeight: 700, fontSize: '0.95rem',
            }}>
              Call Holly
            </a>
          </div>
        </div>
      )}
    </>
  );
}
