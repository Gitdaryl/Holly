import React from 'react';
import { BROKERAGE } from '../data/profiles';

// Holly's signature paired with her brokerage, the way her yard sign pairs
// them. Michigan law (MCL 339.2512e, in force since Jan 1 2018) requires the
// employing broker's name in "equal or greater type size" than the
// salesperson's in all advertising, websites included; LARA reads that as the
// block holding her name never being taller than the block holding the
// broker's. So both are sized from ONE number: the logo panel is always at
// least as tall as the signature. Change --sig-w, never either height alone.
const SIG_RATIO = 238 / 900; // signature.webp height / width

export default function BrokerSignature({ width = 'clamp(210px, 30vw, 380px)', animate = false, style }) {
  const sigH = `calc(${width} * ${SIG_RATIO})`;
  return (
    <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.9rem 1.25rem', ...style }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', height: sigH, minHeight: '56px', padding: '0 0.9rem', background: 'white', borderRadius: '10px', boxShadow: '0 6px 18px rgba(10,38,35,0.25)' }}>
        <img src="/images/foundation-logo.png" alt={BROKERAGE.name} width="339" height="148" style={{ height: '82%', width: 'auto', display: 'block' }} />
      </span>
      <img className={animate ? 'sig-ink' : undefined} src="/images/signature-blush.webp" alt="" aria-hidden="true" width="900" height="238"
        style={{ width, height: 'auto', display: 'block', filter: 'drop-shadow(0 2px 12px rgba(10,38,35,0.45))' }} />
    </div>
  );
}
