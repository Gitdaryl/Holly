import React, { useLayoutEffect, useRef } from 'react';

// Her signature as a sign-off, written by the reader's scroll: blank as it
// comes up from the bottom of the screen, fully written by the time it reaches
// the middle, and scrolling back up un-writes it. The reveal edge leans with
// her script so it reads as a pen, not a wipe. Reduced motion shows it written.
// (The home hero signature writes itself on load instead: it is already on
// screen at scroll 0, where a scrubbed one would sit blank.)
const LEAN = 7; // percent of width the reveal edge leans, to match the script's slant

export default function ScrollSignature({ width = 220, style }) {
  const ref = useRef(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined;
    let raf = 0;
    const update = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const start = vh - r.height * 0.25;           // just entering at the bottom
      const end = vh * 0.55 - r.height / 2;         // middle sits a little below center
      const t = Math.min(1, Math.max(0, (start - r.top) / (start - end)));
      const p = t * t * (3 - 2 * t);                // ease in and out
      const x = -LEAN + p * (100 + LEAN * 2);       // bottom of the pen edge, in %
      el.style.clipPath = p >= 1 ? 'none' : `polygon(0 0, ${x + LEAN}% 0, ${x}% 100%, 0 100%)`;
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <img ref={ref} src="/images/signature.webp" alt="" aria-hidden="true" width="900" height="238"
      style={{ display: 'block', width, maxWidth: '100%', height: 'auto', ...style }} />
  );
}
