import React from 'react';
import { useLocation } from 'react-router-dom';
import { BROKERAGE } from '../data/profiles';

// The line Michigan requires on every page that advertises: the employing
// broker's name plus its phone number or street address (MCL 339.2512e).
// Mounted once in Router so no page can ship without it. When Holly opens her
// own brokerage, BROKERAGE in src/data/profiles.js is the only thing to change.
export default function BrokerNotice() {
  const { pathname } = useLocation();
  if (pathname.startsWith('/admin')) return null;
  const a = BROKERAGE.address;
  return (
    <div style={{ background: '#0b2622', color: 'rgba(255,255,255,0.72)', fontSize: '0.78rem', lineHeight: 1.6, textAlign: 'center', padding: '0.85rem 1rem' }}>
      Holly Griewahn is a REALTOR&reg; with <strong style={{ color: 'white', fontWeight: 600 }}>{BROKERAGE.name}</strong>, {a.street}, {a.city}, {a.region} {a.postal}.
    </div>
  );
}
