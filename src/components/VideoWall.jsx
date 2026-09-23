import React, { useEffect, useRef, useState } from 'react';

// Latest episodes of Holly & The Yeti, with a click-to-play lightbox.
//
// Fetches /api/youtube, which is RSS-backed and needs no API key. Renders
// nothing at all when there is nothing to show: a missing section reads as
// "no episodes yet", an error box reads as "this site is broken".
//
// Each card is a real <button> rather than a clickable <div> so it is
// reachable by keyboard, and the embed is youtube-nocookie with rel=0 so
// opening an episode does not set third-party cookies or end on a grid of
// somebody else's videos.

const SERIF = "'Source Serif 4', Georgia, serif";

function fmtDate(iso) {
  if (!iso) return '';
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function Lightbox({ video, onClose }) {
  const panelRef = useRef(null);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    // Without this the page keeps scrolling behind the fixed overlay.
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panelRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={video.title}
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(10,38,35,0.94)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        style={{ width: '100%', maxWidth: '900px', outline: 'none' }}
      >
        <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, borderRadius: '14px', overflow: 'hidden', background: '#000' }}>
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${video.videoId}?autoplay=1&rel=0`}
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }}
          />
        </div>
        <button
          type="button"
          onClick={onClose}
          style={{ font: 'inherit', cursor: 'pointer', marginTop: '1rem', padding: '0.6rem 1.2rem', background: 'rgba(255,255,255,0.12)', color: 'white', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '10px', fontWeight: 600, fontSize: '0.9rem' }}
        >
          Close
        </button>
      </div>
    </div>
  );
}

export default function VideoWall({ limit = 4, channelUrl, heading = 'Latest episodes' }) {
  const [videos, setVideos] = useState(null);
  const [open, setOpen] = useState(null);
  const triggerRef = useRef(null);

  useEffect(() => {
    let alive = true;
    fetch('/api/youtube')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (alive) setVideos(d?.videos || []); })
      .catch(() => { if (alive) setVideos([]); });
    return () => { alive = false; };
  }, []);

  if (!videos || videos.length === 0) return null;

  const close = () => {
    setOpen(null);
    triggerRef.current?.focus();   // put focus back where it came from
  };

  return (
    <section style={{ marginBottom: '3rem' }}>
      <style>{`
        .vw-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 1.25rem; }
        .vw-card:hover .vw-play { transform: scale(1.08); }
      `}</style>

      <h2 style={{ fontFamily: SERIF, fontSize: '1.4rem', fontWeight: 700, color: '#1c2b29', marginBottom: '1rem' }}>{heading}</h2>

      <div className="vw-grid">
        {videos.slice(0, limit).map((v) => (
          <button
            key={v.videoId}
            type="button"
            className="vw-card"
            aria-label={`Play ${v.title}`}
            onClick={(e) => { triggerRef.current = e.currentTarget; setOpen(v); }}
            style={{ all: 'unset', cursor: 'pointer', display: 'block', background: 'white', border: '1px solid #eeddd8', borderRadius: '14px', overflow: 'hidden' }}
          >
            <div style={{ position: 'relative', aspectRatio: '16 / 9', background: '#0e2d29' }}>
              <img src={v.thumbnail} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              <span
                className="vw-play"
                aria-hidden="true"
                style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 52, height: 52, borderRadius: '50%', background: '#e64774', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 18px rgba(0,0,0,0.35)', transition: 'transform 0.18s' }}
              >
                <svg width="18" height="20" viewBox="0 0 18 20" fill="white" style={{ marginLeft: 3 }}><path d="M0 0l18 10L0 20z" /></svg>
              </span>
            </div>
            <div style={{ padding: '0.9rem 1rem 1.1rem' }}>
              <div style={{ fontFamily: SERIF, fontSize: '1rem', fontWeight: 700, color: '#1c2b29', lineHeight: 1.35, marginBottom: '0.35rem' }}>{v.title}</div>
              <div style={{ fontSize: '0.78rem', color: '#98a3a1' }}>{fmtDate(v.publishedAt)}</div>
            </div>
          </button>
        ))}
      </div>

      {channelUrl && (
        <div style={{ marginTop: '1.25rem' }}>
          <a href={channelUrl} target="_blank" rel="noopener" style={{ color: '#e64774', fontWeight: 700, textDecoration: 'none', fontSize: '0.9rem' }}>
            Every episode on YouTube &rarr;
          </a>
        </div>
      )}

      {open && <Lightbox video={open} onClose={close} />}
    </section>
  );
}
