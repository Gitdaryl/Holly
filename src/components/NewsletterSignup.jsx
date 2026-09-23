import React, { useEffect, useState } from 'react';
import { track } from '../lib/track.js';

// Newsletter signup, as a normal in-flow section.
//
// Deliberately NOT a popup and not a fourth item in MobileActionBar: the
// action bar, the chat widget and the desk chip already hold both bottom
// corners on a phone, and Call / Text / Home Value all outrank a newsletter.
//
// Double opt-in, so the success state says "check your email", never "you're
// subscribed". Saying subscribed before they confirm is a small lie that
// makes the confirmation email look like spam.

const FONT = "'Inter', -apple-system, sans-serif";
const SERIF = "'Source Serif 4', Georgia, serif";

export default function NewsletterSignup({ source = 'site', dark = false, heading, blurb }) {
  const [email, setEmail] = useState('');
  const [state, setState] = useState('idle'); // idle | sending | done | already | error
  const [msg, setMsg] = useState('');
  const [ready, setReady] = useState(null);

  // The form only appears once the newsletter can actually deliver a
  // confirmation email. Without NEWSLETTER_SECRET and a verified From
  // address, a signup would persist as "pending" and the person would wait
  // for a confirmation that never comes - a dead form in front of Holly's
  // clients is worse than no form. This unhides itself the moment the
  // environment is set, with no code change.
  useEffect(() => {
    let alive = true;
    fetch('/api/newsletter?action=health')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (alive) setReady(Boolean(d?.blobStore && d?.newsletterSecret && d?.resendKey && d?.from)); })
      .catch(() => { if (alive) setReady(false); });
    return () => { alive = false; };
  }, []);

  async function submit(e) {
    e.preventDefault();
    if (state === 'sending') return;
    setState('sending');
    try {
      const r = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) {
        setMsg(d.error || 'That did not go through. Try again in a moment.');
        setState('error');
        return;
      }
      track('newsletter', { source });
      setState(d.already ? 'already' : 'done');
    } catch {
      setMsg('That did not go through. Check your connection and try again.');
      setState('error');
    }
  }

  if (!ready) return null;

  const ink = dark ? 'white' : '#1c2b29';
  const body = dark ? 'rgba(255,255,255,0.75)' : '#4a5654';
  const box = dark
    ? { background: 'transparent', border: 'none', padding: 0 }
    : { background: 'white', border: '1px solid #eeddd8', borderRadius: '14px', padding: '1.75rem' };

  return (
    <section style={{ ...box, fontFamily: FONT, marginBottom: dark ? 0 : '3rem' }}>
      <h2 style={{ fontFamily: SERIF, fontSize: '1.4rem', fontWeight: 700, color: ink, marginBottom: '0.5rem' }}>
        {heading || 'The note from the lakes'}
      </h2>
      <p style={{ color: body, lineHeight: 1.7, marginBottom: '1.25rem', maxWidth: '38rem' }}>
        {blurb || 'Once a month, roughly. What sold around the lakes, what came up, and what is on locally. No pitch, and you can leave from the bottom of any email.'}
      </p>

      {state === 'done' && (
        <div style={{ color: ink, fontWeight: 700 }}>
          Check your email and tap the confirm button. That is the last step.
        </div>
      )}
      {state === 'already' && (
        <div style={{ color: ink, fontWeight: 700 }}>You are already on the list.</div>
      )}

      {state !== 'done' && state !== 'already' && (
        <form onSubmit={submit} style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', maxWidth: '30rem' }}>
          <label htmlFor={`nl-${source}`} style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>
            Your email address
          </label>
          <input
            id={`nl-${source}`}
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Your email address"
            autoComplete="email"
            style={{
              flex: '1 1 14rem', minWidth: 0, font: 'inherit', fontSize: '0.95rem',
              padding: '0.75rem 0.9rem', borderRadius: '10px',
              border: `1px solid ${dark ? 'rgba(255,255,255,0.3)' : '#eeddd8'}`,
              background: dark ? 'rgba(255,255,255,0.1)' : 'white',
              color: ink,
            }}
          />
          <button
            type="submit"
            disabled={state === 'sending'}
            style={{
              font: 'inherit', fontWeight: 700, fontSize: '0.95rem', cursor: state === 'sending' ? 'default' : 'pointer',
              padding: '0.75rem 1.5rem', borderRadius: '10px', border: 'none',
              background: '#e64774', color: 'white', opacity: state === 'sending' ? 0.6 : 1,
            }}
          >
            {state === 'sending' ? 'Sending…' : 'Sign me up'}
          </button>
        </form>
      )}

      {state === 'error' && (
        <div style={{ marginTop: '0.75rem', color: '#e64774', fontSize: '0.9rem', fontWeight: 600 }}>{msg}</div>
      )}
    </section>
  );
}
