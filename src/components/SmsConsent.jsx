import React from 'react';
import { Link } from 'react-router-dom';

// Texting consent, separate from the form and optional, as carrier review
// requires: unchecked by default, names the sender, links privacy and terms.
// The server only texts a lead when this box was ticked.
export default function SmsConsent({ checked, onChange, dark = false }) {
  const ink = dark ? 'rgba(255,255,255,0.85)' : '#1c2b29';
  const muted = dark ? 'rgba(255,255,255,0.65)' : '#66706e';
  const link = { color: dark ? '#f5b5c7' : '#ad3557', fontWeight: 600 };
  return (
    <label style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start', cursor: 'pointer', margin: '0 0 0.8rem', fontSize: '0.8rem', lineHeight: 1.45, fontWeight: 400, color: muted, textTransform: 'none', letterSpacing: 0 }}>
      <input type="checkbox" checked={Boolean(checked)} onChange={(e) => onChange(e.target.checked)} style={{ flex: '0 0 auto', width: 20, height: 20, padding: 0, margin: '1px 0 0', accentColor: '#e64774' }} />
      <span>
        <strong style={{ color: ink, fontWeight: 600 }}>Holly Griewahn can text me about this request.</strong>{' '}
        Optional. Message frequency varies. Message and data rates may apply. Reply STOP to end, HELP for help.{' '}
        <Link to="/privacy" style={link}>Privacy</Link> and <Link to="/terms" style={link}>Terms</Link>.
      </span>
    </label>
  );
}
