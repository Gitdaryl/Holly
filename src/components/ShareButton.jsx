import React, { useEffect, useRef, useState } from 'react';
import { track } from '../lib/track';

// One share control for a listing. On phones (and any browser with the Web
// Share API) it opens the native share sheet: Messages, WhatsApp, Mail, Copy,
// whatever the person already uses. Everywhere else it opens a small menu with
// Copy link, Text, Email and Facebook. Every route counts as one 'share' event.

const ICON = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
  </svg>
);

export default function ShareButton({ title, text, url, label = 'Share', compact = false, style = {} }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const wrap = useRef(null);
  const shareUrl = url || (typeof window !== 'undefined' ? window.location.origin + window.location.pathname : '');
  const shareText = text || title;

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    const onClick = (e) => { if (wrap.current && !wrap.current.contains(e.target)) setOpen(false); };
    window.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClick);
    return () => { window.removeEventListener('keydown', onKey); document.removeEventListener('mousedown', onClick); };
  }, [open]);

  const onShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title, text: shareText, url: shareUrl });
        track('share');
      } catch (err) {
        // The person closed the sheet. Nothing to do.
      }
      return;
    }
    setOpen((v) => !v);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      track('share');
      setTimeout(() => { setCopied(false); setOpen(false); }, 1400);
    } catch (err) {
      window.prompt('Copy this link', shareUrl);
    }
  };

  const enc = encodeURIComponent;
  const items = [
    { key: 'copy', label: copied ? 'Link copied' : 'Copy link', onClick: copy },
    { key: 'text', label: 'Text it', href: `sms:?&body=${enc(`${shareText} ${shareUrl}`)}` },
    { key: 'email', label: 'Email it', href: `mailto:?subject=${enc(title)}&body=${enc(`${shareText}\n\n${shareUrl}`)}` },
    { key: 'facebook', label: 'Share on Facebook', href: `https://www.facebook.com/sharer/sharer.php?u=${enc(shareUrl)}`, external: true },
  ];

  const base = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
    background: 'white', color: '#1a2332', border: '1px solid #e8e4df', borderRadius: '10px',
    padding: compact ? '0.75rem' : '0.7rem 1rem', fontSize: '0.88rem', fontWeight: 700,
    fontFamily: 'inherit', cursor: 'pointer', minWidth: compact ? 48 : undefined, ...style,
  };

  return (
    <div ref={wrap} style={{ position: 'relative', display: compact ? 'inline-flex' : 'block' }}>
      <button type="button" onClick={onShare} aria-label={compact ? label : undefined} aria-haspopup="menu" aria-expanded={open} style={base}>
        {ICON}
        {!compact && label}
      </button>
      {open && (
        <div role="menu" aria-label="Share this listing" style={{ position: 'absolute', bottom: compact ? 'calc(100% + 0.5rem)' : undefined, top: compact ? undefined : 'calc(100% + 0.4rem)', right: 0, minWidth: 200, background: 'white', border: '1px solid #e8e4df', borderRadius: '12px', boxShadow: '0 16px 40px rgba(26,35,50,0.16)', padding: '0.4rem', zIndex: 200 }}>
          {items.map((it) => it.href ? (
            <a key={it.key} role="menuitem" href={it.href} target={it.external ? '_blank' : undefined} rel={it.external ? 'noopener noreferrer' : undefined}
              onClick={() => { track('share'); setOpen(false); }}
              style={{ display: 'block', padding: '0.65rem 0.8rem', borderRadius: '8px', color: '#1a2332', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600 }}>
              {it.label}
            </a>
          ) : (
            <button key={it.key} role="menuitem" type="button" onClick={it.onClick}
              style={{ display: 'block', width: '100%', textAlign: 'left', padding: '0.65rem 0.8rem', borderRadius: '8px', background: 'none', border: 'none', color: copied ? '#059669' : '#1a2332', fontSize: '0.9rem', fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>
              {it.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
