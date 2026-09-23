import React, { useLayoutEffect, useRef, useState } from 'react';

// A stat that counts up from zero the first time it scrolls into view, once.
// Takes the display string ("50+", "$10.6M", "1,300 ac") and animates only
// the number inside it. Anything without a number, reduced motion, or no
// IntersectionObserver just renders the value as given.
const NUM = /^([^\d]*)(\d[\d,]*(?:\.\d+)?)(.*)$/;

export default function CountUp({ value, duration = 900 }) {
  const str = String(value ?? '');
  const [shown, setShown] = useState(str);
  const ref = useRef(null);

  useLayoutEffect(() => {
    setShown(str);
    const m = str.match(NUM);
    if (!m || typeof IntersectionObserver === 'undefined') return undefined;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined;
    const [, pre, num, suf] = m;
    const target = parseFloat(num.replace(/,/g, ''));
    if (!target) return undefined;
    const dec = (num.split('.')[1] || '').length;
    const fmt = (n) => pre + (num.includes(',')
      ? n.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec })
      : n.toFixed(dec)) + suf;
    setShown(fmt(0));
    let raf;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const t0 = performance.now();
      const step = (t) => {
        const p = Math.min(1, (t - t0) / duration);
        if (p < 1) { setShown(fmt(target * (1 - Math.pow(1 - p, 3)))); raf = requestAnimationFrame(step); } else setShown(str);
      };
      raf = requestAnimationFrame(step);
    }, { threshold: 0.4 });
    io.observe(ref.current);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, [str, duration]);

  return <span ref={ref} style={{ fontVariantNumeric: 'tabular-nums' }}>{shown}</span>;
}
