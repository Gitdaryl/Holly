import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { lakes } from '../data/lakes';

// Fixed bottom action bar shown only under 768px (CSS media query does the
// hiding, not JS, so there's no layout flash). Hidden on /admin, /plan, and
// /property/* - PropertyPage already ships its own Call/Request Tour bar.

const CALL_HREF = 'tel:5174033413';
const DEFAULT_TEXT_BODY = "Hi Holly, I found you on your website.";

function lakeNameFromPath(pathname) {
  const m = pathname.match(/^\/(?:lakes|market)\/([^/]+)/);
  if (!m) return null;
  return lakes[m[1]]?.name || null;
}

export default function MobileActionBar({ textBody }) {
  const { pathname } = useLocation();
  const hidden = pathname.startsWith('/admin') || pathname.startsWith('/plan') || pathname.startsWith('/property');

  useEffect(() => {
    if (hidden) return undefined;
    document.body.classList.add('has-mobile-action-bar');
    return () => document.body.classList.remove('has-mobile-action-bar');
  }, [hidden]);

  if (hidden) return null;

  const lakeName = lakeNameFromPath(pathname);
  const body = textBody || (lakeName ? `Hi Holly, I'm interested in ${lakeName}` : DEFAULT_TEXT_BODY);
  const smsHref = `sms:+15173008226?&body=${encodeURIComponent(body)}`;

  const itemStyle = {
    flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    gap: '0.15rem', textDecoration: 'none', color: '#1c2b29', fontSize: '0.75rem', fontWeight: 700,
    fontFamily: "'Inter', -apple-system, sans-serif",
  };

  return (
    <>
      <style>{`
        .mobile-action-bar { display: none; }
        @media (max-width: 768px) {
          .mobile-action-bar { display: flex !important; }
          body.has-mobile-action-bar { padding-bottom: calc(64px + env(safe-area-inset-bottom)); }
        }
      `}</style>
      <nav className="mobile-action-bar" aria-label="Quick actions" style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 480,
        background: 'white', borderTop: '1px solid #eeddd8',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}>
        <div style={{ display: 'flex', flex: 1, height: '64px' }}>
          <a href={CALL_HREF} style={itemStyle}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#e64774" strokeWidth="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
            Call
          </a>
          <a href={smsHref} style={{ ...itemStyle, borderLeft: '1px solid #f6e9e5', borderRight: '1px solid #f6e9e5' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#e64774" strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
            Text
          </a>
          <a href="/cma" style={itemStyle}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#e64774" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            Home Value
          </a>
        </div>
      </nav>
    </>
  );
}
