import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TEMPLATES, TERMS, byId, compose, fromDeal, subjectFor, smsFor } from '../data/stationery';
import { renderLetter, renderText, printWrap } from '../lib/letter-html';
import { BROKERAGE, PHONE, AWARDS, awardText } from '../data/profiles';
import HelpVideo from './HelpVideo';

// The Stationery tab: pick a letter, fill in a few fields (or pull them from
// a roadmap), read it, fix a word, then print it to PDF, text the short
// version, email it (once sending is switched on), or copy the text.
// The preview IS the letter: the same renderer makes the email.

const SERIF = "'Source Serif 4', Georgia, serif";
const INK = '#1c2b29', DEEP = '#1a554e', PINK = '#e64774', TEAL = '#237168', MUTED = '#66706e', LINE = '#eeddd8', BLUSH = '#fbeae6';
const PRETTY = PHONE.replace(/^\+1-/, '').replace(/^(\d{3})-(\d{3})-(\d{4})$/, '($1) $2-$3');
const inputStyle = { width: '100%', font: 'inherit', fontSize: '0.92rem', padding: '0.55rem 0.7rem', border: `1px solid ${LINE}`, borderRadius: '9px', color: INK, background: 'white' };

async function api(path, { method = 'GET', body, session } = {}) {
  const r = await fetch(path, { method, headers: { 'Content-Type': 'application/json', ...(session ? { Authorization: `Bearer ${session}` } : {}) }, body: body ? JSON.stringify(body) : undefined });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error(data.error || `Request failed (${r.status})`), { status: r.status });
  return data;
}
const todayLong = () => new Date().toLocaleDateString('en-US', { timeZone: 'America/Detroit', month: 'long', day: 'numeric', year: 'numeric' });
const when = (iso) => new Date(iso).toLocaleString('en-US', { timeZone: 'America/Detroit', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

function Note({ tone = 'info', children }) {
  const c = tone === 'error' ? ['#fee2e2', '#b91c1c'] : tone === 'ok' ? ['#e6f3f1', DEEP] : [BLUSH, INK];
  return <div style={{ background: c[0], color: c[1], fontSize: '0.85rem', lineHeight: 1.5, padding: '0.7rem 0.9rem', borderRadius: '10px' }}>{children}</div>;
}

function Pick({ onPick, recent }) {
  const groups = [...new Set(TEMPLATES.map((t) => t.group))];
  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
        <div style={{ fontFamily: SERIF, fontSize: '1.3rem', fontWeight: 700 }}>Stationery</div>
        <HelpVideo id="stationery" minutes={2} />
      </div>
      <p style={{ fontSize: '0.82rem', color: MUTED, margin: '0.2rem 0 1rem', lineHeight: 1.5 }}>Letters on your paper, in your voice, written so a first-time or older client follows every line. Pick one, fill in a few blanks, read it, send it.</p>
      {groups.map((g) => (
        <div key={g} style={{ marginBottom: '1.1rem' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase', color: PINK, margin: '0 0 0.5rem' }}>{g}</div>
          <div style={{ display: 'grid', gap: '0.5rem' }}>
            {TEMPLATES.filter((t) => t.group === g).map((t) => (
              <button key={t.id} type="button" className="adm-card" onClick={() => onPick(t)} style={{ textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit', color: INK, padding: '0.85rem 1rem' }}>
                <div style={{ fontWeight: 700, fontSize: '0.98rem' }}>{t.name}</div>
                <div style={{ fontSize: '0.78rem', color: TEAL, fontWeight: 600, margin: '0.1rem 0 0.25rem' }}>To: {t.audience}</div>
                <div style={{ fontSize: '0.82rem', color: '#4a5654', lineHeight: 1.45 }}>{t.when}</div>
              </button>
            ))}
          </div>
        </div>
      ))}
      {recent?.length > 0 && (
        <div className="adm-card" style={{ marginTop: '0.5rem' }}>
          <div style={{ fontWeight: 700, marginBottom: '0.4rem' }}>Recent letters</div>
          {recent.map((r) => (
            <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', fontSize: '0.8rem', padding: '0.35rem 0', borderTop: `1px solid #f6e9e5` }}>
              <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}><strong>{byId(r.templateId)?.name || r.templateId}</strong>{r.clientName ? ` · ${r.clientName}` : ''}{r.subject ? ` · ${r.subject}` : ''}</span>
              <span style={{ color: MUTED, flexShrink: 0 }}>{r.how} · {when(r.at)}</span>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

function Write({ session, template, meta, deals, initialDeal, onBack, onLogged }) {
  const [fields, setFields] = useState({});
  const [dealId, setDealId] = useState(initialDeal || '');
  const [text, setText] = useState('');
  const [textDirty, setTextDirty] = useState(false);
  const [subject, setSubject] = useState('');
  const [subjectDirty, setSubjectDirty] = useState(false);
  const [sms, setSms] = useState('');
  const [smsDirty, setSmsDirty] = useState(false);
  const [showSms, setShowSms] = useState(false);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState('');
  const appliedDeal = useRef('');

  // Pull from a roadmap: template fields that map to deal fields fill in; what Holly typed wins.
  useEffect(() => {
    if (!dealId || appliedDeal.current === dealId) return;
    api(`/api/admin?view=deal&id=${dealId}`, { session }).then(({ deal, link }) => {
      appliedDeal.current = dealId;
      const pre = fromDeal(template, { ...deal, link }, { reviewUrl: meta?.reviewUrl });
      setFields((cur) => ({ ...pre, ...Object.fromEntries(Object.entries(cur).filter(([, v]) => String(v || '').trim())) }));
    }).catch((e) => setError(e.message));
  }, [dealId, session, template, meta]);
  useEffect(() => { if (!fields.reviewUrl && meta?.reviewUrl && template.fields.some((f) => f.key === 'reviewUrl')) setFields((c) => ({ ...c, reviewUrl: meta.reviewUrl })); }, [meta, template, fields.reviewUrl]);

  const composed = useMemo(() => compose(template, fields), [template, fields]);
  const autoSubject = useMemo(() => subjectFor(template, fields), [template, fields]);
  const autoSms = useMemo(() => smsFor(template, fields), [template, fields]);
  useEffect(() => { if (!textDirty) setText(composed); }, [composed, textDirty]);
  useEffect(() => { if (!subjectDirty) setSubject(autoSubject); }, [autoSubject, subjectDirty]);
  useEffect(() => { if (!smsDirty) setSms(autoSms); }, [autoSms, smsDirty]);

  const terms = template.terms.map((k) => [k, TERMS[k]]);
  const common = { subject, text, dateStr: todayLong(), terms, phone: PHONE.replace(/-/g, ''), prettyPhone: PRETTY, brokerage: BROKERAGE, awards: AWARDS[0] ? awardText(AWARDS[0]) : '' };
  const html = useMemo(() => renderLetter({ ...common, siteUrl: window.location.origin }), [subject, text]); // eslint-disable-line react-hooks/exhaustive-deps
  const plain = useMemo(() => renderText(common), [subject, text]); // eslint-disable-line react-hooks/exhaustive-deps
  const missing = template.fields.filter((f) => f.req && !String(fields[f.key] || '').trim()).map((f) => f.label);
  const flash = (t) => { setMsg(t); setTimeout(() => setMsg(''), 4000); };
  const base = { templateId: template.id, dealId: dealId || null, clientName: fields.clientName || fields.buyerNames || '' };
  const logIt = (how, extra = {}) => api('/api/admin?action=stationery-log', { method: 'POST', session, body: { ...base, how, subject, ...extra } }).then(onLogged).catch(() => {});

  const print = () => {
    const w = window.open('', '_blank');
    if (!w) { setError('Your browser blocked the new window. Allow pop-ups for this site and tap Print again.'); return; }
    w.document.open(); w.document.write(printWrap(html)); w.document.close();
    logIt('print');
  };
  const copy = async () => { try { await navigator.clipboard.writeText(plain); flash('Copied the letter as text.'); logIt('copy'); } catch { setError('Could not copy. Select the text in the preview instead.'); } };
  const mailto = () => { window.location.href = `mailto:${encodeURIComponent(fields.to || '')}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(plain)}`; logIt('mailto', { to: fields.to || '' }); };
  const email = async () => {
    if (!window.confirm(`Email this letter to ${fields.to}?`)) return;
    setBusy('email'); setError('');
    try { await api('/api/admin?action=stationery-email', { method: 'POST', session, body: { ...base, fields, text, subject, to: fields.to } }); flash(`Emailed to ${fields.to}.`); onLogged(); }
    catch (e) { setError(e.message); }
    setBusy('');
  };
  const sendSms = async () => {
    if (!window.confirm(`Text this to ${fields.phone}?`)) return;
    setBusy('sms'); setError('');
    try { await api('/api/admin?action=stationery-text', { method: 'POST', session, body: { ...base, phone: fields.phone, body: sms } }); flash('Texted.'); onLogged(); }
    catch (e) { setError(e.message); }
    setBusy('');
  };
  const set = (k) => (e) => setFields({ ...fields, [k]: e.target.value });

  return (
    <div style={{ display: 'grid', gap: '0.9rem', paddingBottom: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem' }}>
        <div><div style={{ fontFamily: SERIF, fontSize: '1.3rem', fontWeight: 700, lineHeight: 1.15 }}>{template.name}</div><div style={{ fontSize: '0.8rem', color: MUTED }}>To: {template.audience}</div></div>
        <button type="button" className="adm-btn" onClick={onBack}>All letters</button>
      </div>

      <div className="adm-card" style={{ display: 'grid', gap: '0.75rem' }}>
        {deals?.length > 0 && (
          <label style={{ fontSize: '0.75rem', fontWeight: 700, color: MUTED }}>
            <span style={{ display: 'block', marginBottom: '0.25rem' }}>Pull the names, address and dates from a roadmap</span>
            <select style={{ ...inputStyle, width: 'auto', maxWidth: '100%' }} value={dealId} onChange={(e) => { appliedDeal.current = ''; setDealId(e.target.value); }}>
              <option value="">Type them in by hand</option>
              {deals.map((d) => <option key={d.id} value={d.id}>{d.address} · {d.clientName}</option>)}
            </select>
          </label>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.6rem' }}>
          {template.fields.map((f) => (
            <label key={f.key} style={{ fontSize: '0.75rem', fontWeight: 700, color: MUTED, gridColumn: f.type === 'textarea' ? '1 / -1' : 'auto' }}>
              <span style={{ display: 'block', marginBottom: '0.25rem' }}>{f.label}{f.req ? ' *' : ''}</span>
              {f.type === 'textarea' ? <textarea style={{ ...inputStyle, minHeight: 72 }} value={fields[f.key] || ''} onChange={set(f.key)} placeholder={f.ph} />
                : f.type === 'select' ? <select style={inputStyle} value={fields[f.key] || f.options[0][0]} onChange={set(f.key)}>{f.options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
                  : <input style={inputStyle} type={f.type === 'date' ? 'date' : f.type === 'email' ? 'email' : 'text'} inputMode={f.type === 'money' ? 'numeric' : f.type === 'phone' ? 'tel' : undefined} value={fields[f.key] || ''} onChange={set(f.key)} placeholder={f.ph} />}
            </label>
          ))}
        </div>
        {missing.length > 0 && <div style={{ fontSize: '0.78rem', color: PINK, fontWeight: 600 }}>Still needed: {missing.join(', ')}</div>}
      </div>

      <div className="adm-card" style={{ display: 'grid', gap: '0.6rem' }}>
        <label style={{ fontSize: '0.75rem', fontWeight: 700, color: MUTED }}><span style={{ display: 'block', marginBottom: '0.25rem' }}>Subject / title</span><input style={inputStyle} value={subject} onChange={(e) => { setSubject(e.target.value); setSubjectDirty(true); }} /></label>
        <label style={{ fontSize: '0.75rem', fontWeight: 700, color: MUTED }}>
          <span style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}><span>The letter (fix any word here)</span>{textDirty && <button type="button" onClick={() => { setTextDirty(false); setText(composed); }} style={{ background: 'none', border: 'none', color: PINK, fontFamily: 'inherit', fontWeight: 700, cursor: 'pointer', fontSize: '0.75rem' }}>Rebuild from the fields</button>}</span>
          <textarea style={{ ...inputStyle, minHeight: 260, fontFamily: 'ui-monospace, Menlo, monospace', fontSize: '0.84rem', lineHeight: 1.5 }} value={text} onChange={(e) => { setText(e.target.value); setTextDirty(true); }} />
          <span style={{ display: 'block', fontWeight: 500, marginTop: '0.3rem', lineHeight: 1.4 }}>Blank line = new paragraph. Start a line with "# " for a heading, "- " for a list, "> " for a highlighted note. "Label :: value" lines make a table.</span>
        </label>
      </div>

      <div className="adm-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '0.6rem 1rem', borderBottom: `1px solid ${LINE}`, fontSize: '0.75rem', fontWeight: 700, color: MUTED }}>Preview. This is exactly what prints or emails.</div>
        <iframe title="Letter preview" srcDoc={html} style={{ width: '100%', height: '720px', border: 'none', display: 'block', background: '#fdf7f5' }} />
      </div>

      <div className="adm-card" style={{ display: 'grid', gap: '0.6rem' }}>
        <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
          <button type="button" className="adm-btn pink" onClick={print}>Print / Save as PDF</button>
          <button type="button" className="adm-btn" onClick={copy}>Copy as text</button>
          {template.fields.some((f) => f.key === 'to') && (meta?.ready
            ? <button type="button" className="adm-btn" onClick={email} disabled={!fields.to || busy === 'email'}>{busy === 'email' ? 'Sending…' : `Email to ${fields.to || '…'}`}</button>
            : <button type="button" className="adm-btn" onClick={mailto} disabled={!fields.to}>Open in your email app</button>)}
          {template.fields.some((f) => f.key === 'phone') && <button type="button" className="adm-btn" onClick={() => setShowSms(!showSms)} disabled={!fields.phone}>Text the short version</button>}
        </div>
        {!meta?.ready && template.fields.some((f) => f.key === 'to') && <div style={{ fontSize: '0.75rem', color: MUTED, lineHeight: 1.5 }}>Sending the branded email from here switches on once your sending address is set up. Until then: Print / Save as PDF and attach it, or "Open in your email app" puts the plain text in a new message.</div>}
        {showSms && (
          <div style={{ display: 'grid', gap: '0.4rem' }}>
            <textarea style={{ ...inputStyle, minHeight: 90 }} value={sms} onChange={(e) => { setSms(e.target.value); setSmsDirty(true); }} />
            <div style={{ display: 'flex', gap: '0.45rem', alignItems: 'center' }}>
              <button type="button" className="adm-btn pink" onClick={sendSms} disabled={busy === 'sms' || sms.trim().length < 5}>{busy === 'sms' ? 'Sending…' : `Text ${fields.phone}`}</button>
              <span style={{ fontSize: '0.75rem', color: MUTED }}>{sms.length} characters. Goes from your desk number; replies land in Texts.</span>
            </div>
          </div>
        )}
        {error && <Note tone="error">{error}</Note>}
        {msg && <Note tone="ok">{msg}</Note>}
      </div>
    </div>
  );
}

export default function StationeryDesk({ session, initialDeal }) {
  const [template, setTemplate] = useState(null);
  const [meta, setMeta] = useState(null);
  const [deals, setDeals] = useState([]);
  const navigate = useNavigate();
  const loadMeta = () => api('/api/admin?view=stationery', { session }).then(setMeta).catch(() => setMeta({ ready: false, recent: [] }));
  useEffect(() => {
    loadMeta();
    api('/api/admin?view=deals', { session }).then((d) => setDeals(d.deals.filter((x) => x.status === 'active'))).catch(() => {});
  }, [session]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!template) return <Pick recent={meta?.recent} onPick={setTemplate} />;
  return <Write session={session} template={template} meta={meta} deals={deals} initialDeal={initialDeal} onLogged={loadMeta} onBack={() => { setTemplate(null); if (initialDeal) navigate('/admin?tab=stationery', { replace: true }); }} />;
}
