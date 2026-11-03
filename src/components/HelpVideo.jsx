import React, { useEffect, useRef, useState } from 'react';

// "Watch how" on a desk tab: opens the tab's help video (public/help/<id>.mp4, recorded by help/record.mjs) in a
// full-screen player. Nothing downloads until it is tapped.
export default function HelpVideo({ id, label = 'Watch how', minutes }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    ref.current?.focus();
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);
  return (
    <>
      <button type="button" className="adm-btn" onClick={() => setOpen(true)} aria-label={`${label}: play the video`}>
        <svg width="12" height="12" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4l13 8-13 8z" fill="currentColor" /></svg>
        {label}{minutes ? ` (${minutes} min)` : ''}
      </button>
      {open && (
        <div role="dialog" aria-modal="true" aria-label={label} onClick={() => setOpen(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(10,38,35,0.88)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ position: 'relative', height: 'min(88vh, 900px)', aspectRatio: '390 / 844', maxWidth: '100%' }}>
            <video ref={ref} src={`/help/${id}.mp4`} poster={`/help/${id}.webp`} controls autoPlay playsInline preload="metadata"
              style={{ width: '100%', height: '100%', borderRadius: '16px', background: '#1a554e', display: 'block' }} />
            <button type="button" onClick={() => setOpen(false)} aria-label="Close the video"
              style={{ position: 'absolute', top: '-0.6rem', right: '-0.6rem', width: 40, height: 40, borderRadius: '50%', border: 'none', background: 'white', color: '#1c2b29', fontSize: '1.3rem', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 14px rgba(0,0,0,0.3)' }}>×</button>
          </div>
        </div>
      )}
    </>
  );
}
