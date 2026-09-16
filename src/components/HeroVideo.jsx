import React, { useState, useEffect } from 'react';

// Muted looping background clip for heroes. Falls back to the poster when the
// viewer prefers reduced motion, and to the gradient when a region has no footage.
export default function HeroVideo({ video, poster, gradient, dim = 0.45 }) {
  const [reduceMotion, setReduceMotion] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduceMotion(mq.matches);
    const onChange = (e) => setReduceMotion(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  if (!video) return null;
  return (
    <>
      {reduceMotion ? (
        <img src={poster} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        <video autoPlay muted loop playsInline preload="metadata" poster={poster}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', background: gradient }}>
          <source src={video} type="video/mp4" />
        </video>
      )}
      <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(to bottom, rgba(15,41,64,${dim}) 0%, rgba(15,41,64,${dim + 0.25}) 100%)` }} />
    </>
  );
}
