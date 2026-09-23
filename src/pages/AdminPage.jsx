import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { startTour } from '../components/Tour';

// /admin: Holly's one screen. Phone-first. Inbox (every lead, every source),
// Waitlist (buyers per lake), Listings (this week's numbers + report links).
// Login is a texted link; the session lives in localStorage for 30 days.
// Nothing here is a second copy of data: every tab reads the same blobs the
// public site writes.

const SESSION_KEY = 'hg-admin-session';
const FONT = "'Inter', -apple-system, sans-serif";
const SERIF = "'Source Serif 4', Georgia, serif";
const NAVY = '#1c2b29', DEEP = '#1a554e', PINK = '#e64774', MUTED = '#66706e', LINE = '#eeddd8', CREAM = '#fdf7f5';

const STATUS = {
  new:     { label: 'New',         bg: 'rgba(230,71,116,0.12)', fg: PINK },
  called:  { label: 'Called',      bg: 'rgba(167,198,195,0.35)', fg: '#1a554e' },
  showing: { label: 'Showing set', bg: '#237168',               fg: '#ffffff' },
  client:  { label: 'Client',      bg: 'rgba(173,53,87,0.12)',  fg: '#ad3557' },
  dead:    { label: 'Dead',        bg: '#f6e9e5',               fg: '#98a3a1' },
};

function getSession() { try { return localStorage.getItem(SESSION_KEY) || ''; } catch { return ''; } }
function setSession(t) { try { t ? localStorage.setItem(SESSION_KEY, t) : localStorage.removeItem(SESSION_KEY); } catch { /* ignore */ } }

async function api(path, { method = 'GET', body, session } = {}) {
  const r = await fetch(path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(session ? { Authorization: `Bearer ${session}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error(data.error || `Request failed (${r.status})`), { status: r.status });
  return data;
}

const ago = (iso) => {
  if (!iso) return '';
  const m = Math.round((Date.now() - new Date(iso)) / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  if (d < 14) return `${d}d ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};
const digits = (p) => String(p || '').replace(/\D/g, '');
// Absolute time in Holly's zone (Eastern), whatever the phone or server is set to.
const ET = { timeZone: 'America/Detroit' };
const when = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  const sameDay = d.toLocaleDateString('en-US', ET) === new Date().toLocaleDateString('en-US', ET);
  const t = d.toLocaleTimeString('en-US', { ...ET, hour: 'numeric', minute: '2-digit' });
  return sameDay ? t : `${d.toLocaleDateString('en-US', { ...ET, month: 'short', day: 'numeric' })}, ${t}`;
};

// ── shells ─────────────────────────────────────────────────────────────

function Shell({ children, tab, setTab, onLogout }) {
  const tabs = [['inbox', 'Inbox'], ['texts', 'Texts'], ['waitlist', 'Waitlist'], ['listings', 'Listings'], ['stats', 'Stats']];
  return (
    <div style={{ minHeight: '100vh', background: CREAM, fontFamily: FONT, color: NAVY }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Source+Serif+4:ital,opsz,wght@0,8..60,400..800;1,8..60,400..600&family=Inter:wght@300..700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .adm-tab { flex: 1; padding: 0.85rem 0.5rem; border: none; background: none; font-family: inherit; font-size: 0.82rem; font-weight: 700; color: ${MUTED}; cursor: pointer; border-bottom: 3px solid transparent; }
        .adm-tab.on { color: ${NAVY}; border-bottom-color: ${PINK}; }
        .adm-card { background: white; border: 1px solid ${LINE}; border-radius: 14px; padding: 1rem 1.1rem; }
        .adm-btn { display: inline-flex; align-items: center; justify-content: center; gap: 0.35rem; padding: 0.55rem 0.9rem; border-radius: 9px; font-family: inherit; font-size: 0.82rem; font-weight: 700; text-decoration: none; cursor: pointer; border: 1px solid ${LINE}; background: white; color: ${NAVY}; }
        .adm-btn.pink { background: ${PINK}; color: white; border-color: ${PINK}; }
        select.adm-status { transition: background-color 0.3s, color 0.3s; font-family: inherit; font-size: 0.78rem; font-weight: 700; border-radius: 20px; padding: 0.3rem 1.6rem 0.3rem 0.7rem; border: 1px solid transparent; cursor: pointer; appearance: none; -webkit-appearance: none; background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='6'><path d='M0 0l5 6 5-6z' fill='%236b7a8d'/></svg>"); background-repeat: no-repeat; background-position: right 0.6rem center; }
      `}</style>
      <header data-tour="desk" style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(253,247,245,0.96)', backdropFilter: 'blur(10px)', borderBottom: `1px solid ${LINE}` }}>
        <div style={{ maxWidth: '760px', margin: '0 auto', padding: '0.75rem 1rem 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
            <img src="/images/foundation-logo.png" alt="Foundation Realty" style={{ height: '24px' }} />
            <span style={{ fontWeight: 700, color: NAVY, fontSize: '0.85rem' }}>Holly's desk</span>
          </Link>
          <div style={{ display: 'flex', gap: '0.9rem' }}>
            <button onClick={startTour} style={{ background: 'none', border: 'none', color: PINK, fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Take the tour</button>
            <button onClick={onLogout} style={{ background: 'none', border: 'none', color: MUTED, fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Sign out</button>
          </div>
        </div>
        <div style={{ maxWidth: '760px', margin: '0 auto', display: 'flex' }}>
          {tabs.map(([k, l]) => <button key={k} data-tour={`tab-${k}`} className={`adm-tab${tab === k ? ' on' : ''}`} onClick={() => setTab(k)}>{l}</button>)}
        </div>
      </header>
      <main style={{ maxWidth: '760px', margin: '0 auto', padding: '1rem 1rem 4rem' }}>{children}</main>
    </div>
  );
}

function Empty({ title, body }) {
  return (
    <div className="adm-card" style={{ textAlign: 'center', padding: '2.5rem 1rem' }}>
      <div style={{ fontFamily: SERIF, fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.4rem' }}>{title}</div>
      <div style={{ fontSize: '0.85rem', color: MUTED, lineHeight: 1.6 }}>{body}</div>
    </div>
  );
}

function Loading() { return <div style={{ textAlign: 'center', color: MUTED, padding: '3rem', fontSize: '0.85rem' }}>Loading…</div>; }
function ErrorBox({ error }) { return <div className="adm-card" style={{ borderColor: '#fecaca', color: '#b91c1c', fontSize: '0.85rem' }}>{error}</div>; }

// ── login ──────────────────────────────────────────────────────────────

function Login({ onSession }) {
  const [state, setState] = useState('idle');
  const [error, setError] = useState('');
  const [key, setKey] = useState('');
  const [showKey, setShowKey] = useState(false);

  const textMe = async () => {
    setState('sending'); setError('');
    try { await api('/api/admin?action=login', { method: 'POST' }); setState('sent'); }
    catch (e) { setState('idle'); setError(e.message); }
  };
  // Accepts an admin key, a session, or a pasted login link (even the whole
  // text message): people paste the link here instead of the address bar.
  const useKey = async (e) => {
    e.preventDefault();
    const raw = key.trim();
    const fromLink = raw.match(/[?&]t=([^\s&#]+)/);
    const candidate = fromLink ? decodeURIComponent(fromLink[1]) : raw;
    setError('');
    try { await api('/api/admin?view=ping', { session: candidate }); onSession(candidate); return; }
    catch { /* not a key or a live session; it may be a 15-minute login token */ }
    try {
      const d = await api(`/api/admin?action=session&t=${encodeURIComponent(candidate)}`);
      onSession(d.session);
    } catch {
      setError(fromLink ? 'That link has expired. Ask for a new one.' : 'That key did not work.');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: DEEP, fontFamily: FONT, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Source+Serif+4:ital,opsz,wght@0,8..60,400..800;1,8..60,400..600&family=Inter:wght@300..700&display=swap'); * { box-sizing: border-box; margin: 0; padding: 0; }`}</style>
      <div style={{ width: '100%', maxWidth: '380px', background: 'white', borderRadius: '18px', padding: '2rem 1.5rem', textAlign: 'center' }}>
        <img src="/images/foundation-logo.png" alt="Foundation Realty" style={{ height: '28px', marginBottom: '0.9rem' }} />
        <img src="/images/signature.webp" alt="" aria-hidden="true" width="900" height="238" style={{ display: 'block', width: '190px', height: 'auto', margin: '0 auto 0.4rem' }} />
        <h1 style={{ fontFamily: SERIF, fontSize: '1.5rem', fontWeight: 800, color: NAVY, marginBottom: '0.4rem' }}>Holly's desk</h1>
        <p style={{ fontSize: '0.88rem', color: MUTED, lineHeight: 1.6, marginBottom: '1.5rem' }}>No password. Tap the button and a login link lands on your phone.</p>
        {state === 'sent' ? (
          <div style={{ background: CREAM, border: `1px solid ${LINE}`, borderRadius: '12px', padding: '1rem', fontSize: '0.88rem', color: NAVY, lineHeight: 1.6 }}>
            Sent. Open the text and tap the link. It works for 15 minutes.
          </div>
        ) : (
          <button onClick={textMe} disabled={state === 'sending'} style={{ width: '100%', background: PINK, color: 'white', border: 'none', padding: '0.95rem', borderRadius: '12px', fontWeight: 700, fontSize: '1rem', fontFamily: 'inherit', cursor: 'pointer', opacity: state === 'sending' ? 0.7 : 1 }}>
            {state === 'sending' ? 'Sending…' : 'Text me a login link'}
          </button>
        )}
        {error && <p style={{ color: '#b91c1c', fontSize: '0.82rem', marginTop: '0.75rem' }}>{error}</p>}
        <button onClick={() => setShowKey((v) => !v)} style={{ background: 'none', border: 'none', color: '#98a3a1', fontSize: '0.72rem', marginTop: '1.25rem', cursor: 'pointer', fontFamily: 'inherit' }}>Have a link or a key?</button>
        {showKey && (
          <form onSubmit={useKey} style={{ display: 'flex', gap: '0.5rem', marginTop: '0.6rem' }}>
            <input value={key} onChange={(e) => setKey(e.target.value)} placeholder="Paste your login link or admin key" style={{ flex: 1, padding: '0.6rem 0.75rem', borderRadius: '8px', border: `1px solid ${LINE}`, fontFamily: 'inherit', fontSize: '0.85rem' }} />
            <button className="adm-btn" type="submit" style={{ fontFamily: 'inherit' }}>Go</button>
          </form>
        )}
      </div>
    </div>
  );
}

// ── inbox ──────────────────────────────────────────────────────────────

// The desk lives on her home screen, where the phone keeps it in memory for
// days. Reload whenever she comes back to it so the list is never stale.
function useOnReturn(fn) {
  useEffect(() => {
    const on = () => { if (document.visibilityState === 'visible') fn(); };
    document.addEventListener('visibilitychange', on);
    return () => document.removeEventListener('visibilitychange', on);
  }, [fn]);
}

const SEEN_KEY = 'hg-inbox-seen';
function readSeen() { try { return Number(localStorage.getItem(SEEN_KEY)) || 0; } catch { return 0; } }
function writeSeen() { try { localStorage.setItem(SEEN_KEY, String(Date.now())); } catch { /* ignore */ } }


function LeadCard({ lead, session, onStatus, fresh }) {
  const st = STATUS[lead.status] || STATUS.new;
  const [busy, setBusy] = useState(false);
  const [asked, setAsked] = useState(Boolean(lead.reviewAskedAt));
  const askReview = async () => {
    if (!window.confirm(`Text ${lead.name} Holly's Google review link now?`)) return;
    setBusy(true);
    try { await api('/api/admin?action=review', { method: 'POST', session, body: { id: lead.id, phone: lead.phone, name: lead.name } }); setAsked(true); }
    catch (err) { alert(err.message); }
    setBusy(false);
  };
  const change = async (e) => {
    const status = e.target.value;
    setBusy(true);
    try { await api('/api/admin?action=status', { method: 'POST', session, body: { id: lead.id, status } }); onStatus(lead.id, status); }
    catch (err) { alert(err.message); }
    setBusy(false);
  };
  return (
    <div className={`adm-card${fresh ? ' hg-land' : ''}`} style={{ opacity: lead.status === 'dead' ? 0.55 : 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '0.4rem' }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: '1rem', lineHeight: 1.3 }}>{fresh && <span className="hg-ring" aria-label="Arrived since you last looked" />}{lead.name}</div>
          <div style={{ fontSize: '0.75rem', color: MUTED, marginTop: '0.15rem' }}>
            <span style={{ fontWeight: 700, color: PINK }}>{lead.source}</span>
            {lead.about ? <> · {lead.link ? <Link to={lead.link} style={{ color: MUTED }}>{lead.about}</Link> : lead.about}</> : null}
            {' · '}<span title={when(lead.when)}>{ago(lead.when)}</span>
          </div>
        </div>
        <select data-tour="status" className="adm-status" value={lead.status} onChange={change} disabled={busy} style={{ background: st.bg, color: st.fg, backgroundColor: st.bg }}>
          {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>
      {lead.detail && <div style={{ fontSize: '0.86rem', color: '#4a5654', lineHeight: 1.55, margin: '0.5rem 0 0.75rem', whiteSpace: 'pre-wrap' }}>{lead.detail}</div>}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: lead.detail ? 0 : '0.6rem' }}>
        {lead.phone && <a className="adm-btn pink" href={`tel:${digits(lead.phone)}`}>Call</a>}
        {lead.phone && <a className="adm-btn" href={`sms:${digits(lead.phone)}`}>Text</a>}
        {lead.email && <a className="adm-btn" href={`mailto:${lead.email}`}>Email</a>}
        {lead.phone && lead.status === 'client' && (
          <button className="adm-btn" disabled={busy || asked} onClick={askReview} style={{ opacity: asked ? 0.6 : 1 }}>
            {asked ? 'Review link sent' : 'Ask for a review'}
          </button>
        )}
        {!lead.phone && !lead.email && <span style={{ fontSize: '0.78rem', color: '#98a3a1' }}>No contact details</span>}
      </div>
    </div>
  );
}

function Inbox({ session }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('open');
  const [fresh, setFresh] = useState(() => new Set());
  // Leads that arrived since she last opened the inbox drop in and ring.
  const load = useCallback(() => {
    const since = readSeen();
    return api('/api/admin?view=inbox', { session }).then((d) => {
      setFresh(new Set(since ? d.items.filter((l) => new Date(l.when).getTime() > since).map((l) => l.id) : []));
      writeSeen(); setData(d); setError('');
    }).catch((e) => setError(e.message));
  }, [session]);
  useEffect(() => { load(); }, [load]);
  useOnReturn(load);
  if (error) return <ErrorBox error={error} />;
  if (!data) return <Loading />;
  const onStatus = (id, status) => setData((d) => ({ ...d, items: d.items.map((l) => (l.id === id ? { ...l, status } : l)) }));
  const items = data.items.filter((l) => filter === 'all' ? true : filter === 'open' ? !['dead', 'client'].includes(l.status) : l.status === filter);
  const newCount = data.items.filter((l) => l.status === 'new').length;
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '1rem', marginBottom: '0.9rem', flexWrap: 'wrap' }}>
        <div style={{ fontFamily: SERIF, fontSize: '1.3rem', fontWeight: 700 }}>{newCount ? `${newCount} new` : 'Inbox'} <span style={{ fontSize: '0.8rem', color: MUTED, fontFamily: FONT, fontWeight: 600 }}>· {data.total} total</span></div>
        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
          {[['open', 'Open'], ['new', 'New'], ['called', 'Called'], ['showing', 'Showings'], ['all', 'All']].map(([k, l]) => (
            <button key={k} onClick={() => setFilter(k)} className="adm-btn" style={{ padding: '0.35rem 0.7rem', fontSize: '0.75rem', background: filter === k ? DEEP : 'white', color: filter === k ? 'white' : MUTED, borderColor: filter === k ? DEEP : LINE }}>{l}</button>
          ))}
        </div>
      </div>
      {items.length === 0 ? (
        <Empty title="Nothing here" body={filter === 'open' ? 'Every lead is handled. When someone fills in a form on the site it shows up here and on your phone.' : 'No leads match that filter.'} />
      ) : (
        <div style={{ display: 'grid', gap: '0.75rem' }}>{items.map((l) => <LeadCard key={l.id} lead={l} session={session} onStatus={onStatus} fresh={fresh.has(l.id)} />)}</div>
      )}
      {data.capped && <p style={{ fontSize: '0.75rem', color: '#98a3a1', marginTop: '1rem', textAlign: 'center' }}>Showing the latest {data.items.length}.</p>}
    </>
  );
}

// ── texts ──────────────────────────────────────────────────────────────

const pretty = (p) => { const d = digits(p).slice(-10); return d.length === 10 ? `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}` : p; };

function Thread({ thread, session, onSent, onBack }) {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const send = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setBusy(true);
    try { await api('/api/admin?action=reply', { method: 'POST', session, body: { to: thread.phone, body: text.trim() } }); onSent(thread.phone, text.trim()); setText(''); }
    catch (err) { alert(err.message); }
    setBusy(false);
  };
  return (
    <div className="adm-card" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.85rem 1rem', borderBottom: `1px solid ${LINE}` }}>
        <button onClick={onBack} className="adm-btn" style={{ padding: '0.35rem 0.6rem' }}>←</button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700 }}>{thread.name || pretty(thread.phone)}</div>
          {thread.name && <div style={{ fontSize: '0.75rem', color: MUTED }}>{pretty(thread.phone)}</div>}
        </div>
        <a className="adm-btn pink" href={`tel:${digits(thread.phone)}`} style={{ padding: '0.45rem 0.7rem' }}>Call</a>
      </div>
      <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '55vh', overflowY: 'auto', background: CREAM }}>
        {thread.messages.map((m, i) => (
          <div key={i} style={{ alignSelf: m.direction === 'in' ? 'flex-start' : 'flex-end', maxWidth: '82%' }}>
            <div style={{ background: m.direction === 'in' ? 'white' : DEEP, color: m.direction === 'in' ? NAVY : 'white', border: m.direction === 'in' ? `1px solid ${LINE}` : 'none', borderRadius: m.direction === 'in' ? '14px 14px 14px 4px' : '14px 14px 4px 14px', padding: '0.6rem 0.85rem', fontSize: '0.9rem', lineHeight: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{m.body}{m.media?.length ? m.media.map((u, j) => <div key={j}><a href={u} target="_blank" rel="noopener" style={{ color: 'inherit' }}>photo {j + 1}</a></div>) : null}</div>
            <div style={{ fontSize: '0.68rem', color: '#98a3a1', marginTop: '0.2rem', textAlign: m.direction === 'in' ? 'left' : 'right' }}>{m.direction === 'out' ? (m.author === 'holly' ? 'Holly' : 'Auto') + ' · ' : ''}{when(m.receivedAt)}</div>
          </div>
        ))}
      </div>
      <form onSubmit={send} style={{ display: 'flex', gap: '0.5rem', padding: '0.75rem', borderTop: `1px solid ${LINE}` }}>
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Reply as Holly" style={{ flex: 1, padding: '0.7rem 0.85rem', borderRadius: '10px', border: `1px solid ${LINE}`, fontFamily: 'inherit', fontSize: '0.92rem' }} />
        <button className="adm-btn pink" type="submit" disabled={busy || !text.trim()}>{busy ? '…' : 'Send'}</button>
      </form>
    </div>
  );
}

function Texts({ session }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(null);
  const load = useCallback(() => api('/api/admin?view=texts', { session }).then((d) => { setData(d); setError(''); }).catch((e) => setError(e.message)), [session]);
  useEffect(() => { load(); }, [load]);
  useOnReturn(load);
  if (error) return <ErrorBox error={error} />;
  if (!data) return <Loading />;
  const onSent = (phone, body) => setData((d) => ({ ...d, threads: d.threads.map((t) => t.phone === phone ? { ...t, unanswered: false, messages: [...t.messages, { direction: 'out', body, author: 'holly', receivedAt: new Date().toISOString() }] } : t) }));
  const thread = data.threads.find((t) => t.phone === open);
  if (thread) return <Thread thread={thread} session={session} onSent={onSent} onBack={() => setOpen(null)} />;
  if (!data.threads.length) return <Empty title="No texts yet" body="Every text to (517) 300-8226, and every auto-reply the site sends, shows up here as a conversation you can answer from this page." />;
  const waiting = data.threads.filter((t) => t.unanswered).length;
  return (
    <>
      <div style={{ fontFamily: SERIF, fontSize: '1.3rem', fontWeight: 700, marginBottom: '0.25rem' }}>{waiting ? `${waiting} waiting on you` : 'Texts'}</div>
      <p style={{ fontSize: '0.82rem', color: MUTED, marginBottom: '1rem' }}>Conversations on (517) 300-8226. Replies go out from that number.</p>
      <div style={{ display: 'grid', gap: '0.6rem' }}>
        {data.threads.map((t) => (
          <button key={t.phone} onClick={() => setOpen(t.phone)} className="adm-card" style={{ textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', gap: '0.75rem', alignItems: 'center', borderLeft: t.unanswered ? `4px solid ${PINK}` : `1px solid ${LINE}` }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem' }}>
                <span style={{ fontWeight: 700, color: NAVY }}>{t.name || pretty(t.phone)}</span>
                <span style={{ fontSize: '0.72rem', color: '#98a3a1', whiteSpace: 'nowrap' }}>{ago(t.last.receivedAt)}</span>
              </div>
              <div style={{ fontSize: '0.85rem', color: t.unanswered ? NAVY : MUTED, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '0.15rem' }}>{t.last.direction === 'out' ? 'You: ' : ''}{t.last.body}</div>
            </div>
          </button>
        ))}
      </div>
    </>
  );
}

// ── waitlist ───────────────────────────────────────────────────────────

function Waitlist({ session }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(null);
  useEffect(() => { api('/api/admin?view=waitlist', { session }).then(setData).catch((e) => setError(e.message)); }, [session]);
  if (error) return <ErrorBox error={error} />;
  if (!data) return <Loading />;
  if (!data.groups.length) return <Empty title="No buyers registered yet" body="Every lake page has a 'Get first look' form. Share a lake page link and the registrations land here, sorted by lake." />;
  return (
    <>
      <div style={{ fontFamily: SERIF, fontSize: '1.3rem', fontWeight: 700, marginBottom: '0.25rem' }}>{data.total} buyers waiting</div>
      <p style={{ fontSize: '0.82rem', color: MUTED, marginBottom: '1rem' }}>The number you quote at a listing appointment. Tap a lake to see who.</p>
      <div style={{ display: 'grid', gap: '0.75rem' }}>
        {data.groups.map((g) => (
          <div key={g.lake} className="adm-card">
            <button onClick={() => setOpen(open === g.lake ? null : g.lake)} style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', color: NAVY, padding: 0 }}>
              <span style={{ fontWeight: 700, fontSize: '1rem' }}>{g.name}</span>
              <span style={{ fontFamily: SERIF, fontSize: '1.4rem', fontWeight: 800, color: PINK }}>{g.entries.length}</span>
            </button>
            {open === g.lake && (
              <div style={{ marginTop: '0.75rem', borderTop: `1px solid ${LINE}` }}>
                {g.entries.map((e) => (
                  <div key={e.id} style={{ padding: '0.7rem 0', borderBottom: `1px solid #f6e9e5`, display: 'flex', justifyContent: 'space-between', gap: '0.75rem', alignItems: 'center' }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>{e.name}</div>
                      <div style={{ fontSize: '0.75rem', color: MUTED }}>{[e.budget, e.timing, ago(e.receivedAt)].filter(Boolean).join(' · ')}</div>
                      {e.notes && <div style={{ fontSize: '0.8rem', color: '#4a5654', marginTop: '0.2rem' }}>{e.notes}</div>}
                    </div>
                    <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
                      {e.phone && <a className="adm-btn pink" href={`tel:${digits(e.phone)}`} style={{ padding: '0.45rem 0.7rem' }}>Call</a>}
                      {e.phone && <a className="adm-btn" href={`sms:${digits(e.phone)}`} style={{ padding: '0.45rem 0.7rem' }}>Text</a>}
                      {!e.phone && e.email && <a className="adm-btn" href={`mailto:${e.email}`} style={{ padding: '0.45rem 0.7rem' }}>Email</a>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}

// ── listings ───────────────────────────────────────────────────────────

function Bars({ series }) {
  const max = Math.max(1, ...series.map((d) => d.count));
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: '34px' }}>
      {series.map((d) => <div key={d.date} title={`${d.date}: ${d.count}`} style={{ flex: 1, height: `${Math.max(6, (d.count / max) * 100)}%`, background: d.count ? PINK : LINE, borderRadius: '3px 3px 0 0' }} />)}
    </div>
  );
}

function Stat({ v, l }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontFamily: SERIF, fontSize: '1.4rem', fontWeight: 800, lineHeight: 1 }}>{v}</div>
      <div style={{ fontSize: '0.62rem', fontWeight: 700, color: '#98a3a1', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '0.25rem' }}>{l}</div>
    </div>
  );
}

function Listings({ session }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState('');
  useEffect(() => { api('/api/admin?view=listings', { session }).then(setData).catch((e) => setError(e.message)); }, [session]);
  if (error) return <ErrorBox error={error} />;
  if (!data) return <Loading />;
  const copy = async (slug, text) => { try { await navigator.clipboard.writeText(text); setCopied(slug); setTimeout(() => setCopied(''), 1500); } catch { /* ignore */ } };
  return (
    <>
      <div style={{ fontFamily: SERIF, fontSize: '1.3rem', fontWeight: 700, marginBottom: '0.25rem' }}>This week</div>
      <p style={{ fontSize: '0.82rem', color: MUTED, marginBottom: '1rem' }}>Last 7 days on each active listing's page. "Your report" is what you see; "Seller link" is the counts-only page you can send.</p>
      <div style={{ display: 'grid', gap: '0.75rem' }}>
        {data.items.map((p) => (
          <div key={p.slug} className="adm-card">
            <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'center', marginBottom: '0.85rem' }}>
              {p.image && <img src={p.image} alt="" style={{ width: 56, height: 44, objectFit: 'cover', borderRadius: '8px', flexShrink: 0 }} />}
              <div style={{ minWidth: 0, flex: 1 }}>
                <Link to={p.page} style={{ fontWeight: 700, color: NAVY, textDecoration: 'none', fontSize: '0.95rem', display: 'block' }}>{p.title}</Link>
                <div style={{ fontSize: '0.75rem', color: MUTED }}>{p.price}{p.daysOnMarket !== null ? ` · ${p.daysOnMarket} days on market` : ''}{p.lake ? ` · ${p.lake}` : ''}</div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <Stat v={p.metrics.views.period} l="Views" />
              <Stat v={p.metrics.saves.period} l="Saves" />
              <Stat v={p.metrics.showings.period} l="Showings" />
              <Stat v={p.metrics.waitlist ? p.metrics.waitlist.total : '—'} l="Lake buyers" />
            </div>
            <Bars series={p.series} />
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.85rem' }}>
              <a className="adm-btn pink" href={`/api/seller-report?slug=${p.slug}&key=${encodeURIComponent(session)}`} target="_blank" rel="noopener">Your report</a>
              {p.sellerLink && <button className="adm-btn" onClick={() => copy(p.slug, p.sellerLink)}>{copied === p.slug ? 'Copied' : 'Copy seller link'}</button>}
              {!p.sellerEmail && <span style={{ fontSize: '0.72rem', color: '#98a3a1', alignSelf: 'center' }}>No seller email set, Friday report is off</span>}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

// Tells her how to put the desk on her home screen, once, on a phone, and only
// while she is still opening it in a browser. After that it never appears.
function AddToHomeScreen() {
  const [hide, setHide] = useState(() => {
    try {
      if (localStorage.getItem('hg-a2hs') === '1') return true;
      if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) return true;
      return !/Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
    } catch { return true; }
  });
  if (hide) return null;
  const ios = /iPhone|iPad|iPod/i.test(navigator.userAgent);
  return (
    <div className="adm-card" style={{ background: DEEP, color: 'white', borderColor: DEEP, marginBottom: '0.9rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontWeight: 700, marginBottom: '0.25rem' }}>Put this on your home screen</div>
          <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.75)', lineHeight: 1.55, margin: 0 }}>
            {ios
              ? 'Tap the Share button at the bottom of Safari, then "Add to Home Screen". It becomes an icon like an app, and you will not need a login link again.'
              : 'Open your browser menu and choose "Add to Home screen" or "Install app". It becomes an icon like an app, and you will not need a login link again.'}
          </p>
        </div>
        <button onClick={() => { try { localStorage.setItem('hg-a2hs', '1'); } catch { /* ignore */ } setHide(true); }}
          style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', fontSize: '1.1rem', cursor: 'pointer', lineHeight: 1, padding: 0 }} aria-label="Dismiss">×</button>
      </div>
    </div>
  );
}

// ── stats ──────────────────────────────────────────────────────────────

const LEVEL = { act: { bg: 'rgba(230,71,116,0.1)', fg: PINK, label: 'Do now' }, watch: { bg: 'rgba(245,179,1,0.14)', fg: '#a16207', label: 'Look' }, good: { bg: 'rgba(35,113,104,0.12)', fg: '#1a554e', label: 'Good' }, info: { bg: '#f6e9e5', fg: MUTED, label: 'FYI' } };
const SOURCE_LABEL = (s) => s === 'direct' ? 'Direct / typed in' : s.startsWith('utm:') ? `Campaign: ${s.slice(4)}` : s.replace(/^(l\.|m\.|lm\.)/, '').replace('facebook.com', 'Facebook').replace('instagram.com', 'Instagram').replace('google.com', 'Google').replace('t.co', 'X / Twitter');
const PAGE_LABEL = (p) => p === '/' ? 'Home' : p.replace(/^\/lakes\//, 'Lake: ').replace(/^\/market\//, 'Report: ').replace(/^\/property\//, 'Listing: ').replace(/-/g, ' ');

function Delta({ now, before }) {
  if (!before) return null;
  const pct = Math.round(((now - before) / before) * 100);
  if (!pct) return <span style={{ fontSize: '0.68rem', color: MUTED }}>same as before</span>;
  return <span style={{ fontSize: '0.68rem', fontWeight: 700, color: pct > 0 ? DEEP : '#9c2f4c' }}>{pct > 0 ? '▲' : '▼'} {Math.abs(pct)}% vs prior</span>;
}

function Stats({ session, setTab }) {
  const [days, setDays] = useState(7);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => { setData(null); api(`/api/admin?view=stats&days=${days}`, { session }).then(setData).catch((e) => setError(e.message)); }, [session, days]);
  if (error) return <ErrorBox error={error} />;
  if (!data) return <Loading />;
  const { now, before } = data;
  const rate = now.visitors ? Math.round((now.leadEvents / now.visitors) * 100) : 0;
  const table = (rows, cols) => (
    <div className="adm-card" style={{ padding: 0, overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
        <thead><tr>{cols.map((c) => <th key={c.k} style={{ textAlign: c.align || 'right', padding: '0.6rem 0.8rem', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#98a3a1', borderBottom: `1px solid ${LINE}` }}>{c.h}</th>)}</tr></thead>
        <tbody>{rows.map((r, i) => <tr key={i}>{cols.map((c) => <td key={c.k} style={{ textAlign: c.align || 'right', padding: '0.55rem 0.8rem', borderBottom: '1px solid #f6e9e5', fontWeight: c.align === 'left' ? 600 : 500 }}>{c.f ? c.f(r) : r[c.k]}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '1rem', marginBottom: '0.9rem', flexWrap: 'wrap' }}>
        <div style={{ fontFamily: SERIF, fontSize: '1.3rem', fontWeight: 700 }}>Last {days} days</div>
        <div style={{ display: 'flex', gap: '0.35rem' }}>
          {[7, 30, 90].map((d) => <button key={d} onClick={() => setDays(d)} className="adm-btn" style={{ padding: '0.35rem 0.7rem', fontSize: '0.75rem', background: days === d ? DEEP : 'white', color: days === d ? 'white' : MUTED, borderColor: days === d ? DEEP : LINE }}>{d}d</button>)}
        </div>
      </div>

      <div style={{ fontSize: '0.72rem', fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '0.5rem' }}>Where to look</div>
      <div style={{ display: 'grid', gap: '0.5rem', marginBottom: '1.25rem' }}>
        {data.attention.map((a, i) => {
          const L = LEVEL[a.level] || LEVEL.info;
          const inner = (
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', background: 'white', border: `1px solid ${LINE}`, borderLeft: `4px solid ${L.fg}`, borderRadius: '12px', padding: '0.75rem 0.9rem' }}>
              <span style={{ fontSize: '0.62rem', fontWeight: 800, color: L.fg, background: L.bg, padding: '0.2rem 0.5rem', borderRadius: '20px', whiteSpace: 'nowrap', marginTop: '0.1rem' }}>{L.label}</span>
              <span style={{ fontSize: '0.88rem', lineHeight: 1.5 }}>{a.text}</span>
            </div>
          );
          if (a.tab) return <button key={i} onClick={() => setTab(a.tab)} style={{ all: 'unset', cursor: 'pointer', display: 'block' }}>{inner}</button>;
          if (a.path) return <Link key={i} to={a.path} style={{ textDecoration: 'none', color: 'inherit' }}>{inner}</Link>;
          return <div key={i}>{inner}</div>;
        })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.6rem', marginBottom: '1.25rem' }}>
        {[[now.visitors, 'Visitors', <Delta now={now.visitors} before={before.visitors} />], [now.views, 'Page views', <Delta now={now.views} before={before.views} />], [now.leadEvents, 'Leads', <Delta now={now.leadEvents} before={before.leadEvents} />], [`${rate}%`, 'Visitors to leads', null]].map(([v, l, d]) => (
          <div key={l} className="adm-card" style={{ textAlign: 'center', padding: '0.9rem 0.5rem' }}>
            <div style={{ fontFamily: SERIF, fontSize: '1.5rem', fontWeight: 800, lineHeight: 1 }}>{v}</div>
            <div style={{ fontSize: '0.62rem', fontWeight: 700, color: '#98a3a1', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '0.3rem' }}>{l}</div>
            <div style={{ marginTop: '0.2rem' }}>{d}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gap: '1rem' }}>
        {data.lakes.length > 0 && <div><div style={{ fontSize: '0.72rem', fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '0.5rem' }}>Lakes: readers to sign-ups</div>{table(data.lakes, [{ k: 'lake', h: 'Lake', align: 'left' }, { k: 'visitors', h: 'People' }, { k: 'buyers', h: 'Buyers' }, { k: 'owners', h: 'Owners' }])}</div>}
        {data.listings.length > 0 && <div><div style={{ fontSize: '0.72rem', fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '0.5rem' }}>Listings: lookers to showing requests</div>{table(data.listings, [{ k: 'title', h: 'Listing', align: 'left' }, { k: 'visitors', h: 'People' }, { k: 'showings', h: 'Showings' }])}</div>}
        {now.pages.length > 0 && <div><div style={{ fontSize: '0.72rem', fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '0.5rem' }}>Most read pages</div>{table(now.pages.slice(0, 12), [{ k: 'path', h: 'Page', align: 'left', f: (r) => PAGE_LABEL(r.path) }, { k: 'views', h: 'Views' }])}</div>}
        {now.sources.length > 0 && <div><div style={{ fontSize: '0.72rem', fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '0.5rem' }}>Where visitors came from</div>{table(now.sources, [{ k: 'source', h: 'Source', align: 'left', f: (r) => SOURCE_LABEL(r.source) }, { k: 'visitors', h: 'Visitors' }])}</div>}
        {Object.keys(now.events).length > 0 && <div><div style={{ fontSize: '0.72rem', fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '0.5rem' }}>Actions taken</div>{table(Object.entries(now.events).sort((a, b) => b[1] - a[1]).map(([e, n]) => ({ e, n })), [{ k: 'e', h: 'Action', align: 'left', f: (r) => ({ waitlist: 'Joined a lake waitlist', owner: 'Owner asked for updates', showing: 'Requested a showing', cma: 'Asked home value', contact: 'Sent a message', chat_open: 'Opened the chat', chat_lead: 'Left details in chat', call: 'Tapped to call', text: 'Tapped to text', review: 'Went to leave a review', save: 'Saved a listing', share: 'Shared a listing' }[r.e] || r.e) }, { k: 'n', h: 'Times' }])}</div>}
      </div>
      <p style={{ fontSize: '0.72rem', color: '#98a3a1', marginTop: '1rem' }}>Counts visitors to this site only, not Zillow or the MLS. Your own visits to the desk are never counted.</p>
    </>
  );
}

// ── page ───────────────────────────────────────────────────────────────

export default function AdminPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [session, setSess] = useState(getSession);
  const [tab, setTab] = useState(() => params.get('tab') || 'inbox');
  useEffect(() => { const t = params.get('tab'); if (t) setTab(t); }, [params]);
  const [exchanging, setExchanging] = useState(Boolean(params.get('t')));
  const [linkError, setLinkError] = useState('');

  useEffect(() => {
    document.title = "Holly's desk";
    // iOS uses the page it was added from, so these only exist while she is on
    // the desk: the home screen icon then opens straight here, full screen.
    const tags = [
      ['meta', { name: 'robots', content: 'noindex,nofollow' }],
      ['meta', { name: 'apple-mobile-web-app-capable', content: 'yes' }],
      ['meta', { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' }],
      ['meta', { name: 'apple-mobile-web-app-title', content: "Holly's desk" }],
      ['link', { rel: 'manifest', href: '/desk.webmanifest' }],
      ['link', { rel: 'apple-touch-icon', href: '/desk-192.png' }],
    ].map(([tag, attrs]) => {
      const el = document.createElement(tag);
      Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
      document.head.appendChild(el);
      return el;
    });
    return () => tags.forEach((el) => el.remove());
  }, []);

  // Arriving from the texted link: trade it for a session, then clean the URL.
  useEffect(() => {
    const t = params.get('t');
    if (!t) return;
    api(`/api/admin?action=session&t=${encodeURIComponent(t)}`)
      .then((d) => { setSession(d.session); setSess(d.session); navigate('/admin', { replace: true }); })
      .catch((e) => setLinkError(e.message))
      .finally(() => setExchanging(false));
  }, [params, navigate]);

  const onSession = useCallback((s) => { setSession(s); setSess(s); }, []);
  // The tour is offered, never forced: it walks onto the public site partway
  // through, and auto-running it made the login link look like it opened the
  // website instead of the desk.
  const [firstTime, setFirstTime] = useState(false);
  useEffect(() => {
    if (!session) return;
    try { setFirstTime(!localStorage.getItem('hg-tour-seen')); } catch { /* ignore */ }
  }, [session]);
  const dismissWelcome = () => { try { localStorage.setItem('hg-tour-seen', '1'); } catch { /* ignore */ } setFirstTime(false); };
  const logout = () => { setSession(''); setSess(''); };

  if (exchanging) return <div style={{ minHeight: '100vh', background: DEEP, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT }}>Signing you in…</div>;
  if (!session) return (
    <>
      {linkError && <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '0.75rem 1rem', fontSize: '0.85rem', textAlign: 'center', fontFamily: FONT }}>{linkError}</div>}
      <Login onSession={onSession} />
    </>
  );

  return (
    <Shell tab={tab} setTab={setTab} onLogout={logout}>
      <SessionGuard session={session} onExpired={logout}>
        {firstTime && (
          <div className="adm-card" style={{ borderLeft: `4px solid ${PINK}`, marginBottom: '0.9rem' }}>
            <div style={{ fontFamily: SERIF, fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.3rem' }}>Welcome to your desk, Holly.</div>
            <p style={{ fontSize: '0.88rem', color: MUTED, lineHeight: 1.55, margin: '0 0 0.8rem' }}>
              Every lead from your site lands here, and your phone gets a text the moment one arrives. The tour takes about two minutes: the first half stays right here, then it offers to show you the public side of your site.
            </p>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button className="adm-btn pink" onClick={() => { dismissWelcome(); startTour(); }}>Take the tour</button>
              <button className="adm-btn" onClick={dismissWelcome}>Not now</button>
            </div>
          </div>
        )}
        <AddToHomeScreen />
        {tab === 'inbox' && <Inbox session={session} />}
        {tab === 'texts' && <Texts session={session} />}
        {tab === 'waitlist' && <Waitlist session={session} />}
        {tab === 'listings' && <Listings session={session} />}
        {tab === 'stats' && <Stats session={session} setTab={setTab} />}
      </SessionGuard>
    </Shell>
  );
}

// A stale session (30 days, or ADMIN_SECRET rotated) drops back to login
// instead of showing three "Not signed in" boxes.
function SessionGuard({ session, onExpired, children }) {
  const [ok, setOk] = useState(null);
  useEffect(() => {
    api('/api/admin?view=ping', { session }).then(() => setOk(true)).catch((e) => { if (e.status === 401) onExpired(); else setOk(true); });
  }, [session, onExpired]);
  return ok ? children : <Loading />;
}
