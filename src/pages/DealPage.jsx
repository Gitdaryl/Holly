import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { WHO } from '../data/deal-templates';
import { PHONE } from '../data/profiles';

// /deal/<id>?k=<key>: a client's transaction roadmap. The link Holly texts is
// the login: no account, no password, nothing to fill out. The page is built
// from one JSON read and stays readable on a phone in a parking lot.
//
// noindex: one-to-one pages for a named client, never SEO content.

const FONT = "'Inter', -apple-system, sans-serif";
const SERIF = "'Source Serif 4', Georgia, serif";
const INK = '#1c2b29', PINK = '#e64774', TEAL = '#237168', DEEP = '#1a554e', MUTED = '#66706e', LINE = '#eeddd8', CREAM = '#fdf7f5', BLUSH = '#fbeae6', PETAL = '#f5b5c7';
const CALL = PHONE.replace(/\D/g, '');
const TEXT = '5173008226'; // the desk number: replies land in Holly's Texts tab

const fmt = (iso, opts = { weekday: 'short', month: 'short', day: 'numeric' }) => (iso ? new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-US', { ...opts, timeZone: 'UTC' }) : '');
const todayISO = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Detroit' });

async function post(url, body) {
  const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error || 'Something went wrong.');
  return d;
}

function Chip({ who }) {
  const mine = who === 'you';
  return <span style={{ fontSize: '0.66rem', fontWeight: 800, letterSpacing: '0.6px', textTransform: 'uppercase', padding: '0.2rem 0.5rem', borderRadius: '6px', background: mine ? PINK : BLUSH, color: mine ? 'white' : DEEP }}>{WHO[who] || 'Everyone'}</span>;
}

function Btn({ href, onClick, children, solid, small, disabled }) {
  const style = { display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: small ? '0.45rem 0.75rem' : '0.7rem 1.1rem', borderRadius: '10px', fontFamily: FONT, fontSize: small ? '0.78rem' : '0.9rem', fontWeight: 700, textDecoration: 'none', cursor: disabled ? 'default' : 'pointer', border: `1px solid ${solid ? PINK : LINE}`, background: solid ? PINK : 'white', color: solid ? 'white' : INK, opacity: disabled ? 0.55 : 1 };
  return href ? <a href={href} style={style}>{children}</a> : <button type="button" onClick={onClick} disabled={disabled} style={style}>{children}</button>;
}

function Dot({ state }) {
  if (state === 'done') return (
    <span style={{ width: 22, height: 22, borderRadius: '50%', background: TEAL, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4L19 7" /></svg>
    </span>
  );
  if (state === 'next') return <span style={{ width: 22, height: 22, borderRadius: '50%', background: PINK, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><span className="hg-ring" style={{ margin: 0 }} /></span>;
  if (state === 'late') return <span style={{ width: 22, height: 22, borderRadius: '50%', border: `3px solid #d97706`, background: 'white', flexShrink: 0 }} />;
  return <span style={{ width: 22, height: 22, borderRadius: '50%', border: `3px solid ${PETAL}`, background: 'white', flexShrink: 0 }} />;
}

function Step({ s, state, isLast, base, onDid, didSent, first }) {
  const [open, setOpen] = useState(state === 'next' || state === 'late');
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '22px 1fr', gap: '0.9rem', position: 'relative' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Dot state={state} />
        {!isLast && <span style={{ flex: 1, width: 3, background: state === 'done' ? TEAL : LINE, margin: '4px 0', borderRadius: 2, minHeight: 18 }} />}
      </div>
      <div style={{ paddingBottom: isLast ? 0 : '1.25rem', minWidth: 0 }}>
        <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: FONT, color: INK }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.8px', textTransform: 'uppercase', color: state === 'late' ? '#b45309' : state === 'done' ? TEAL : PINK }}>
            {s.done ? `Done${s.doneOn ? ` · ${fmt(s.doneOn)}` : ''}` : s.date ? fmt(s.date) : 'Date to come'}{state === 'late' ? ' · past due' : ''}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.15rem' }}>
            <span style={{ fontFamily: SERIF, fontSize: state === 'next' ? '1.2rem' : '1.05rem', fontWeight: 700, color: state === 'done' ? MUTED : INK, textDecoration: 'none' }}>{s.title}</span>
            <Chip who={s.who} />
          </div>
        </button>
        {open && (
          <div className="hg-rise" style={{ marginTop: '0.55rem', fontSize: '0.9rem', lineHeight: 1.65, color: '#4a5654' }}>
            {s.detail && <p style={{ margin: '0 0 0.5rem' }}>{s.detail}</p>}
            {s.action && <p style={{ margin: '0 0 0.5rem', padding: '0.7rem 0.85rem', background: s.who === 'you' ? '#fff5f8' : BLUSH, borderRadius: '10px', borderLeft: `3px solid ${s.who === 'you' ? PINK : PETAL}` }}><strong style={{ color: INK }}>{s.who === 'you' ? 'What you do: ' : 'What happens: '}</strong>{s.action}</p>}
            {s.note && <p style={{ margin: '0 0 0.5rem', fontStyle: 'italic' }}><strong style={{ color: INK, fontStyle: 'normal' }}>Holly: </strong>{s.note}</p>}
            <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap', marginTop: '0.4rem' }}>
              {s.link && <Btn small href={s.link.url}>{s.link.label}</Btn>}
              {s.date && !s.done && <Btn small href={`${base}&ics=1&step=${s.id}`}>Add to calendar</Btn>}
              {s.who === 'you' && !s.done && (didSent ? <span style={{ fontSize: '0.8rem', fontWeight: 700, color: TEAL, alignSelf: 'center' }}>Told Holly you did this</span> : <Btn small onClick={() => onDid(s)}>I did this</Btn>)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function DealPage() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const k = params.get('k') || '';
  const base = `/api/deal?id=${encodeURIComponent(id || '')}&k=${encodeURIComponent(k)}`;
  const [deal, setDeal] = useState(null);
  const [error, setError] = useState('');
  const [question, setQuestion] = useState('');
  const [sending, setSending] = useState(false);
  const [did, setDid] = useState({});
  const [toast, setToast] = useState('');

  useEffect(() => {
    const meta = document.createElement('meta'); meta.name = 'robots'; meta.content = 'noindex,nofollow'; document.head.appendChild(meta);
    return () => meta.remove();
  }, []);
  useEffect(() => {
    fetch(base).then(async (r) => { const d = await r.json().catch(() => ({})); if (!r.ok) throw new Error(d.error || 'This link did not work.'); return d; })
      .then((d) => { setDeal(d); document.title = `Your roadmap · ${d.address}`; })
      .catch((e) => setError(e.message));
  }, [base]);

  const today = todayISO();
  const states = useMemo(() => {
    if (!deal) return [];
    const nextId = deal.progress.next?.id;
    return deal.steps.map((s) => (s.done ? 'done' : s.date && s.date < today ? 'late' : s.id === nextId ? 'next' : 'todo'));
  }, [deal, today]);

  const ask = async (e) => {
    e.preventDefault();
    if (question.trim().length < 2) return;
    setSending(true);
    try {
      const { note } = await post(base, { action: 'ask', message: question.trim() });
      setDeal({ ...deal, notes: [...deal.notes, note] });
      setQuestion(''); setToast('Sent. Holly gets it as a text.');
    } catch (err) { setToast(err.message); }
    setSending(false);
    setTimeout(() => setToast(''), 4000);
  };
  const onDid = async (s) => {
    try {
      const { note } = await post(base, { action: 'did', stepId: s.id });
      setDid({ ...did, [s.id]: true });
      setDeal({ ...deal, notes: [...deal.notes, note] });
    } catch (err) { setToast(err.message); setTimeout(() => setToast(''), 4000); }
  };

  const shell = (children) => (
    <div style={{ minHeight: '100vh', background: CREAM, fontFamily: FONT, color: INK }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Source+Serif+4:ital,opsz,wght@0,8..60,400..800;1,8..60,400..600&family=Inter:wght@300..700&display=swap');
        * { box-sizing: border-box; } body { margin: 0; }
        .dl-wrap { max-width: 640px; margin: 0 auto; padding: 0 1rem 5rem; }
        .dl-card { background: white; border: 1px solid ${LINE}; border-radius: 16px; padding: 1.1rem 1.15rem; }
        textarea.dl-ask { width: 100%; min-height: 84px; font: inherit; font-size: 0.95rem; padding: 0.75rem 0.85rem; border: 1px solid ${LINE}; border-radius: 12px; resize: vertical; color: ${INK}; background: white; }
        textarea.dl-ask:focus { outline: 2px solid ${PETAL}; border-color: ${PINK}; }
      `}</style>
      <header style={{ position: 'sticky', top: 0, zIndex: 20, background: 'rgba(253,247,245,0.95)', backdropFilter: 'blur(10px)', borderBottom: `1px solid ${LINE}` }}>
        <div style={{ maxWidth: '640px', margin: '0 auto', padding: '0.7rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
          <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', textDecoration: 'none', color: INK, minWidth: 0 }}>
            <img src="/images/holly-headshot.webp" alt="" width="34" height="34" style={{ borderRadius: '50%', objectFit: 'cover' }} />
            <span style={{ lineHeight: 1.1 }}><strong style={{ display: 'block', fontSize: '0.9rem' }}>Holly Griewahn</strong><span style={{ fontSize: '0.7rem', color: MUTED }}>Foundation Realty</span></span>
          </a>
          <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
            <Btn small href={`sms:${TEXT}`}>Text</Btn>
            <Btn small solid href={`tel:${CALL}`}>Call</Btn>
          </div>
        </div>
      </header>
      <div className="dl-wrap">{children}</div>
      {toast && <div role="status" style={{ position: 'fixed', left: '50%', bottom: '1.5rem', transform: 'translateX(-50%)', background: DEEP, color: 'white', padding: '0.7rem 1.1rem', borderRadius: '30px', fontSize: '0.85rem', fontWeight: 600, boxShadow: '0 8px 24px rgba(10,38,35,0.3)', zIndex: 30, maxWidth: 'calc(100% - 2rem)' }}>{toast}</div>}
    </div>
  );

  if (error) return shell(
    <div className="dl-card" style={{ marginTop: '2rem', textAlign: 'center', padding: '2.5rem 1.25rem' }}>
      <div style={{ fontFamily: SERIF, fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.5rem' }}>This link did not open</div>
      <p style={{ color: MUTED, lineHeight: 1.6, margin: '0 0 1.2rem' }}>{error}</p>
      <Btn solid href={`sms:${TEXT}?&body=${encodeURIComponent('Hi Holly, my roadmap link is not opening.')}`}>Text Holly</Btn>
    </div>,
  );
  if (!deal) return shell(<div style={{ textAlign: 'center', color: MUTED, padding: '4rem 0' }}>Opening your roadmap…</div>);

  const { progress: p } = deal;
  const pct = p.total ? Math.round((p.done / p.total) * 100) : 0;
  const closing = deal.status === 'closed' ? `Closed${deal.closingOn ? ` ${fmt(deal.closingOn)}` : ''}`
    : deal.status === 'cancelled' ? 'This transaction was cancelled'
      : deal.closingOn ? `Closing ${fmt(deal.closingOn, { weekday: 'long', month: 'long', day: 'numeric' })}${deal.daysToClose > 1 ? ` · in ${deal.daysToClose} days` : deal.daysToClose === 1 ? ' · tomorrow' : deal.daysToClose === 0 ? ' · today' : ''}` : 'Closing date to come';
  const first = deal.clientName.split(' ')[0];
  const next = deal.progress.next;
  const mapsHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${deal.address}${deal.city ? `, ${deal.city}` : ''}, MI`)}`;

  return shell(
    <>
      <section style={{ padding: '1.6rem 0 1.2rem' }}>
        <div style={{ fontSize: '0.72rem', fontWeight: 800, letterSpacing: '1.4px', textTransform: 'uppercase', color: PINK }}>{deal.side === 'seller' ? 'Your sale' : 'Your purchase'} · roadmap for {first}</div>
        <h1 style={{ fontFamily: SERIF, fontSize: 'clamp(1.6rem, 6vw, 2.2rem)', fontWeight: 800, lineHeight: 1.12, margin: '0.35rem 0 0.4rem' }}>{deal.address}</h1>
        <div style={{ fontSize: '0.95rem', color: '#4a5654' }}>{closing}</div>
        <div style={{ marginTop: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 700, color: MUTED, marginBottom: '0.35rem' }}><span>{p.done} of {p.total} steps done</span><span>{pct}%</span></div>
          <div style={{ height: 10, background: BLUSH, borderRadius: 6, overflow: 'hidden' }}><div style={{ width: `${pct}%`, height: '100%', background: `linear-gradient(90deg, ${TEAL}, ${PINK})`, borderRadius: 6, transition: 'width 0.8s cubic-bezier(0.2,0.8,0.3,1)' }} /></div>
        </div>
      </section>

      {next && deal.status === 'active' && (
        <section className="dl-card hg-land" style={{ marginBottom: '1.25rem', borderLeft: `4px solid ${PINK}` }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase', color: PINK, marginBottom: '0.25rem' }}>Up next{next.date ? ` · ${fmt(next.date)}` : ''}</div>
          <div style={{ fontFamily: SERIF, fontSize: '1.25rem', fontWeight: 700 }}>{next.title}</div>
          <div style={{ marginTop: '0.3rem' }}><Chip who={next.who} /></div>
          {next.action && <p style={{ fontSize: '0.9rem', lineHeight: 1.6, color: '#4a5654', margin: '0.6rem 0 0' }}>{next.action}</p>}
        </section>
      )}

      <section className="dl-card" style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', marginBottom: '1.1rem', flexWrap: 'wrap' }}>
          <div style={{ fontFamily: SERIF, fontSize: '1.2rem', fontWeight: 700 }}>Every step</div>
          <Btn small href={`${base}&ics=1`}>Add all dates to calendar</Btn>
        </div>
        {deal.steps.map((s, i) => <Step key={s.id} s={s} state={states[i]} isLast={i === deal.steps.length - 1} base={base} onDid={onDid} didSent={did[s.id]} first={first} />)}
        <p style={{ fontSize: '0.75rem', color: MUTED, lineHeight: 1.5, margin: '1.1rem 0 0' }}>Dates come from your signed agreement and the typical timing in Lenawee County. Holly updates this page as the transaction moves, and texts you before each deadline.</p>
      </section>

      <section className="dl-card" style={{ marginBottom: '1.25rem' }} id="ask">
        <div style={{ fontFamily: SERIF, fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.25rem' }}>Ask Holly</div>
        <p style={{ fontSize: '0.85rem', color: MUTED, margin: '0 0 0.8rem', lineHeight: 1.5 }}>Anything about a step, a date, or what to bring. It reaches her phone right away.</p>
        {deal.notes.length > 0 && (
          <div style={{ display: 'grid', gap: '0.5rem', marginBottom: '0.9rem' }}>
            {deal.notes.map((n) => n.kind === 'did'
              ? <div key={n.id} style={{ fontSize: '0.75rem', color: MUTED, textAlign: 'center' }}>{n.text} · {fmt(n.at.slice(0, 10), { month: 'short', day: 'numeric' })}</div>
              : (
                <div key={n.id} style={{ justifySelf: n.from === 'holly' ? 'start' : 'end', maxWidth: '88%', background: n.from === 'holly' ? BLUSH : DEEP, color: n.from === 'holly' ? INK : 'white', padding: '0.6rem 0.85rem', borderRadius: n.from === 'holly' ? '14px 14px 14px 4px' : '14px 14px 4px 14px', fontSize: '0.9rem', lineHeight: 1.5 }}>
                  <div style={{ fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.6px', textTransform: 'uppercase', opacity: 0.75, marginBottom: '0.15rem' }}>{n.from === 'holly' ? 'Holly' : first} · {fmt(n.at.slice(0, 10), { month: 'short', day: 'numeric' })}</div>
                  {n.text}
                </div>
              ))}
          </div>
        )}
        <form onSubmit={ask}>
          <label htmlFor="dl-q" style={{ position: 'absolute', left: -9999 }}>Your question for Holly</label>
          <textarea id="dl-q" className="dl-ask" value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Type your question…" maxLength={1000} />
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.6rem', flexWrap: 'wrap' }}>
            <Btn solid onClick={ask} disabled={sending || question.trim().length < 2}>{sending ? 'Sending…' : 'Send to Holly'}</Btn>
            <Btn href={`sms:${TEXT}?&body=${encodeURIComponent(`Hi Holly, about ${deal.address}: `)}`}>Text instead</Btn>
          </div>
        </form>
      </section>

      <section className="dl-card" style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <img src="/images/holly-headshot.webp" alt="Holly Griewahn" width="64" height="64" style={{ borderRadius: '50%', objectFit: 'cover' }} />
        <div style={{ flex: 1, minWidth: 180 }}>
          <div style={{ fontFamily: SERIF, fontSize: '1.1rem', fontWeight: 700 }}>Holly Griewahn</div>
          <div style={{ fontSize: '0.8rem', color: MUTED }}>REALTOR®, Foundation Realty · 2026 Lenawee County REALTOR of the Year</div>
        </div>
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          <Btn small href={mapsHref}>Open in Maps</Btn>
          <Btn small solid href={`tel:${CALL}`}>Call Holly</Btn>
        </div>
      </section>
    </>,
  );
}
