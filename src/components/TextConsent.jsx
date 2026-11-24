import React from 'react';
import { SMS_LABEL, SMS_SMALL_PRINT } from '../lib/sms-consent.js';

// The optional text box shown on every form that takes a phone number.
// Rules it exists to satisfy (carrier review of the texting campaign):
//   - unchecked by default and never required to submit the form,
//   - names the sender (Holly Griewahn) in the label,
//   - frequency, rates, STOP/HELP and links to Privacy and Terms sit beside it,
//   - consent is not bundled into anything else on the form.
// The wording lives in src/lib/sms-consent.js so the form, the stored consent
// record and the Privacy/Terms pages all quote the same text.
export default function TextConsent({ checked, onChange, dark = false, style }) {
  const small = dark ? 'rgba(255,255,255,0.6)' : '#66706e';
  const link = dark ? '#f5b5c7' : '#ad3557';
  return (
    <label
      style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', cursor: 'pointer', margin: '0 0 1rem', ...style }}
    >
      <input
        type="checkbox"
        name="smsConsent"
        checked={Boolean(checked)}
        onChange={(e) => onChange(e.target.checked)}
        style={{ marginTop: '0.2rem', width: '1.1rem', height: '1.1rem', flex: '0 0 auto', accentColor: '#e64774' }}
      />
      <span style={{ fontSize: '0.85rem', lineHeight: 1.45, color: dark ? 'white' : '#1c2b29' }}>
        {SMS_LABEL}
        <span style={{ display: 'block', fontSize: '0.75rem', color: small, marginTop: '0.25rem' }}>
          {SMS_SMALL_PRINT}{' '}
          <a href="/privacy" target="_blank" rel="noopener" style={{ color: link }}>Privacy</a>
          {' and '}
          <a href="/terms" target="_blank" rel="noopener" style={{ color: link }}>Terms</a>.
        </span>
      </span>
    </label>
  );
}
