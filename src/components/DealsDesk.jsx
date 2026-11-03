import React, { useEffect, useRef, useState } from 'react';
import { WHO } from '../data/deal-templates';

// The Deals tab on Holly's desk: every transaction roadmap she is running,
// a two-minute form to start one (or read the purchase agreement for the
// dates), and an editor for the steps. The client side is /deal/<id>?k=.
// Reads and writes go through /api/admin (bearer session); see lib/deals.js.

const SERIF = "'Source Serif 4', Georgia, serif";
const INK = '#1c2b29', DEEP = '#1a554e', PINK = '#e64774', TEAL = '#237168', MUTED = '#66706e', LINE = '#eeddd8', BLUSH = '#fbeae6';

async function api(path, { method = 'GET', body, session } = {}) {
  const r = await fetch(path, { method, headers: { 'Content-Type': 'application/json', ...(session ? { Authorization: `Bearer ${session}` } : {}) }, body: body ? JSON.stringify(body) : undefined });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error(data.error || `Request failed (${r.status})`), { status: r.status });
  return data;
}
const fmt = (iso) => (iso ? new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }) : '');
const todayISO = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Detroit' });
const digits = (p) => String(p || '').replace(/\D/g, '');
const uid = () => `step-${Math.random().toString(36).slice(2, 8)}`;

const inputStyle = { width: '100%', font: 'inherit', fontSize: '0.9rem', padding: '0.55rem 0.7rem', border: `1px solid ${LINE}`, borderRadius: '9px', color: INK, background: 'white' };
function Field({ label, children, hint }) {
  return (
    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: MUTED }}>
      <span style={{ display: 'block', marginBottom: '0.25rem' }}>{label}</span>
      {children}
      {hint && <span style={{ display: 'block', fontWeight: 500, marginTop: '0.25rem', lineHeight: 1.4 }}>{hint}</span>}
    </label>
  );
}
function Seg({ value, onChange, options }) {
  return (
    <div style={{ display: 'inline-flex', border: `1px solid ${LINE}`, borderRadius: '9px', overflow: 'hidden' }}>
      {options.map(([v, l]) => <button key={v} type="button" onClick={() => onChange(v)} style={{ padding: '0.5rem 0.9rem', border: 'none', fontFamily: 'inherit', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer', background: value === v ? DEEP : 'white', color: value === v ? 'white' : INK }}>{l}</button>)}
    </div>
  );
}
function Note({ tone = 'info', children }) {
  const c = tone === 'error' ? ['#fee2e2', '#b91c1c'] : tone === 'ok' ? ['#e6f3f1', DEEP] : [BLUSH, INK];
  return <div style={{ background: c[0], color: c[1], fontSize: '0.85rem', lineHeight: 1.5, padding: '0.7rem 0.9rem', borderRadius: '10px' }}>{children}</div>;
}

// ── list ───────────────────────────────────────────────────────────────

function Progress({ p }) {
  const pct = p.total ? Math.round((p.done / p.total) * 100) : 0;
  return <div style={{ height: 7, background: BLUSH, borderRadius: 4, overflow: 'hidden' }}><div style={{ width: `${pct}%`, height: '100%', background: `linear-gradient(90deg, ${TEAL}, ${PINK})` }} /></div>;
}

function List({ session, onOpen, onNew }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => { api('/api/admin?view=deals', { session }).then(setData).catch((e) => setError(e.message)); }, [session]);
  if (error) return <Note tone="error">{error}</Note>;
  if (!data) return <div style={{ textAlign: 'center', color: MUTED, padding: '3rem', fontSize: '0.85rem' }}>Loading…</div>;
  const active = data.deals.filter((d) => d.status === 'active');
  const past = data.deals.filter((d) => d.status !== 'active');
  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', marginBottom: '0.9rem', flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontFamily: SERIF, fontSize: '1.3rem', fontWeight: 700 }}>{active.length ? `${active.length} under contract` : 'Roadmaps'}</div>
          <p style={{ fontSize: '0.82rem', color: MUTED, margin: 0 }}>One page per client, every date from offer to keys. They get it by text; no app, no login.</p>
        </div>
        <button className="adm-btn pink" onClick={onNew}>New roadmap</button>
      </div>
      {!data.deals.length && (
        <div className="adm-card" style={{ textAlign: 'center', padding: '2.5rem 1rem' }}>
          <div style={{ fontFamily: SERIF, fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.4rem' }}>No roadmaps yet</div>
          <div style={{ fontSize: '0.85rem', color: MUTED, lineHeight: 1.6 }}>Next accepted offer, tap New roadmap. Upload the purchase agreement and the dates fill themselves in; two minutes, then text the client their link.</div>
        </div>
      )}
      <div style={{ display: 'grid', gap: '0.75rem' }}>
        {[...active, ...past].map((d) => (
          <button key={d.id} type="button" className="adm-card" onClick={() => onOpen(d.id)} style={{ textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit', color: INK, opacity: d.status === 'active' ? 1 : 0.7 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', alignItems: 'flex-start' }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: '1rem' }}>{d.address}</div>
                <div style={{ fontSize: '0.78rem', color: MUTED }}>{d.clientName} · {d.side === 'seller' ? 'selling' : 'buying'}{d.status !== 'active' ? ` · ${d.status}` : d.daysToClose != null ? ` · closes ${fmt(d.closingOn)} (${d.daysToClose < 0 ? `${-d.daysToClose}d ago` : d.daysToClose === 0 ? 'today' : `in ${d.daysToClose}d`})` : ''}</div>
              </div>
              <div style={{ display: 'flex', gap: '0.3rem', flexShrink: 0 }}>
                {d.unanswered && <span title="Unanswered question" style={{ fontSize: '0.65rem', fontWeight: 800, background: PINK, color: 'white', padding: '0.2rem 0.5rem', borderRadius: '6px' }}>QUESTION</span>}
                {d.overdue > 0 && <span style={{ fontSize: '0.65rem', fontWeight: 800, background: '#fef3c7', color: '#b45309', padding: '0.2rem 0.5rem', borderRadius: '6px' }}>{d.overdue} PAST DUE</span>}
              </div>
            </div>
            <div style={{ margin: '0.7rem 0 0.35rem' }}><Progress p={d.progress} /></div>
            <div style={{ fontSize: '0.78rem', color: MUTED }}>{d.progress.done}/{d.progress.total} done{d.progress.next ? ` · next: ${d.progress.next.title}${d.progress.next.date ? ` ${fmt(d.progress.next.date)}` : ''}` : ' · all steps done'}</div>
          </button>
        ))}
      </div>
    </>
  );
}

// ── new ────────────────────────────────────────────────────────────────

const EMPTY = { side: 'buyer', financing: 'financed', lakeHome: true, address: '', city: '', clientName: '', clientPhone: '', clientEmail: '', price: '', acceptedOn: todayISO(), closingOn: '', lender: '', titleCompany: '' };

function NewDeal({ session, onCreated, onCancel }) {
  const [f, setF] = useState(EMPTY);
  const [reading, setReading] = useState(false);
  const [found, setFound] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const fileRef = useRef();
  const set = (k) => (e) => setF({ ...f, [k]: e?.target ? (e.target.type === 'checkbox' ? e.target.checked : e.target.value) : e });

  const readContract = async (file) => {
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) { setError('Keep the PDF under 4 MB (print to PDF again at lower quality, or paste the first pages as text).'); return; }
    setReading(true); setError(''); setFound(null);
    try {
      const b64 = await new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result).split(',')[1]); r.onerror = rej; r.readAsDataURL(file); });
      const { found: got } = await api('/api/admin?action=deal-extract', { method: 'POST', session, body: { pdf: b64, name: file.name } });
      setFound(got);
      setF((cur) => ({
        ...cur,
        address: got.address || cur.address,
        price: got.price || cur.price,
        acceptedOn: got.acceptedOn || cur.acceptedOn,
        closingOn: got.closingOn || cur.closingOn,
        financing: got.financing === 'cash' ? 'cash' : cur.financing,
        lender: got.lender || cur.lender,
        titleCompany: got.titleCompany || cur.titleCompany,
        clientName: cur.clientName || (cur.side === 'seller' ? got.sellerNames : got.buyerNames) || '',
      }));
    } catch (e) { setError(e.message); }
    setReading(false);
  };

  const create = async (e) => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      const { deal } = await api('/api/admin?action=deal-save', { method: 'POST', session, body: { deal: { ...f, price: f.price ? Number(String(f.price).replace(/[^\d.]/g, '')) : null, steps: [] } } });
      // Contract dates beat template dates where the contract named them.
      if (found && (found.earnestDueOn || found.inspectionEndsOn || found.financingCommitmentOn)) {
        const steps = deal.steps.map((s) => {
          if (s.id === 'emd' && found.earnestDueOn) return { ...s, date: found.earnestDueOn, offset: null };
          if (s.id === 'inspection' && found.inspectionEndsOn) return { ...s, date: found.inspectionEndsOn, offset: null, note: s.note || 'Inspection contingency ends on this date.' };
          if (s.id === 'loan-commitment' && found.financingCommitmentOn) return { ...s, date: found.financingCommitmentOn, offset: null };
          return s;
        });
        const saved = await api('/api/admin?action=deal-save', { method: 'POST', session, body: { deal: { ...deal, steps }, redate: false } });
        return onCreated(saved.deal.id);
      }
      onCreated(deal.id);
    } catch (err) { setError(err.message); setSaving(false); }
  };

  return (
    <form onSubmit={create} style={{ display: 'grid', gap: '0.9rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontFamily: SERIF, fontSize: '1.3rem', fontWeight: 700 }}>New roadmap</div>
        <button type="button" className="adm-btn" onClick={onCancel}>Back</button>
      </div>
      <div className="adm-card" style={{ borderLeft: `4px solid ${PINK}` }}>
        <div style={{ fontWeight: 700, marginBottom: '0.3rem' }}>Start from the purchase agreement</div>
        <p style={{ fontSize: '0.82rem', color: MUTED, margin: '0 0 0.7rem', lineHeight: 1.5 }}>Upload the signed PDF and the address, price, acceptance and closing dates fill in. Check every date against the contract before you send; this reads, it does not decide.</p>
        <input ref={fileRef} type="file" accept="application/pdf" onChange={(e) => readContract(e.target.files?.[0])} style={{ fontSize: '0.85rem' }} disabled={reading} />
        {reading && <div style={{ fontSize: '0.82rem', color: PINK, fontWeight: 700, marginTop: '0.5rem' }}>Reading the contract…</div>}
        {found && (
          <div style={{ marginTop: '0.7rem', display: 'grid', gap: '0.4rem' }}>
            <Note tone="ok">Filled in from the contract. {[found.earnestDueOn && `Deposit due ${fmt(found.earnestDueOn)}`, found.inspectionEndsOn && `inspection ends ${fmt(found.inspectionEndsOn)}`, found.financingCommitmentOn && `loan commitment ${fmt(found.financingCommitmentOn)}`].filter(Boolean).join(', ') || 'No contingency dates were named.'}{found.possession ? ` Possession: ${found.possession}` : ''}</Note>
            {found.warnings?.length > 0 && <Note>{found.warnings.map((w, i) => <div key={i}>• {w}</div>)}</Note>}
            {found.otherDates?.length > 0 && <Note>Other dates named: {found.otherDates.map((d) => `${d.title} ${fmt(d.date)}`).join('; ')}. Add any that matter as steps after you create the roadmap.</Note>}
          </div>
        )}
      </div>
      <div className="adm-card" style={{ display: 'grid', gap: '0.8rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <Seg value={f.side} onChange={set('side')} options={[['buyer', 'Client is buying'], ['seller', 'Client is selling']]} />
          <Seg value={f.financing} onChange={set('financing')} options={[['financed', 'Mortgage'], ['cash', 'Cash']]} />
          <label style={{ fontSize: '0.82rem', fontWeight: 700, display: 'inline-flex', gap: '0.4rem', alignItems: 'center' }}><input type="checkbox" checked={f.lakeHome} onChange={set('lakeHome')} /> Lake home (adds well, septic and dock steps)</label>
        </div>
        <Field label="Property address"><input style={inputStyle} value={f.address} onChange={set('address')} placeholder="1234 Round Lake Hwy" required /></Field>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
          <Field label="City"><input style={inputStyle} value={f.city} onChange={set('city')} placeholder="Manitou Beach" /></Field>
          <Field label="Price"><input style={inputStyle} inputMode="numeric" value={f.price} onChange={set('price')} placeholder="425000" /></Field>
        </div>
        <Field label="Client's name"><input style={inputStyle} value={f.clientName} onChange={set('clientName')} placeholder="Jane and Tom Miller" required /></Field>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
          <Field label="Client's cell" hint="The roadmap link and reminders go here."><input style={inputStyle} inputMode="tel" value={f.clientPhone} onChange={set('clientPhone')} placeholder="517 555 0100" /></Field>
          <Field label="Client's email"><input style={inputStyle} inputMode="email" value={f.clientEmail} onChange={set('clientEmail')} /></Field>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
          <Field label="Offer accepted"><input style={inputStyle} type="date" value={f.acceptedOn} onChange={set('acceptedOn')} required /></Field>
          <Field label="Closing date" hint={f.closingOn ? '' : `Blank = ${f.financing === 'cash' ? 30 : 45} days out; change it any time.`}><input style={inputStyle} type="date" value={f.closingOn} onChange={set('closingOn')} /></Field>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
          <Field label="Lender"><input style={inputStyle} value={f.lender} onChange={set('lender')} /></Field>
          <Field label="Title company"><input style={inputStyle} value={f.titleCompany} onChange={set('titleCompany')} /></Field>
        </div>
      </div>
      {error && <Note tone="error">{error}</Note>}
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button className="adm-btn pink" type="submit" disabled={saving}>{saving ? 'Building…' : 'Build the roadmap'}</button>
        <button type="button" className="adm-btn" onClick={onCancel}>Cancel</button>
      </div>
      <p style={{ fontSize: '0.75rem', color: MUTED, lineHeight: 1.5, margin: 0 }}>The steps use typical Lenawee County timing from these two dates. You will see every step next and can change any date, wording, or order before the client sees it.</p>
    </form>
  );
}

// ── detail / editor ────────────────────────────────────────────────────

function StepEditor({ s, i, n, onChange, onRemove, onMove }) {
  const [open, setOpen] = useState(false);
  const today = todayISO();
  const late = !s.done && s.date && s.date < today;
  return (
    <div style={{ borderTop: `1px solid #f6e9e5`, padding: '0.7rem 0' }}>
      <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
        <input type="checkbox" checked={s.done} onChange={(e) => onChange({ ...s, done: e.target.checked, doneOn: e.target.checked ? today : null })} aria-label={`${s.title} done`} style={{ width: 20, height: 20, accentColor: TEAL }} />
        <button type="button" onClick={() => setOpen(!open)} style={{ flex: 1, textAlign: 'left', background: 'none', border: 'none', padding: 0, fontFamily: 'inherit', color: INK, cursor: 'pointer', minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: '0.92rem', textDecoration: s.done ? 'line-through' : 'none', color: s.done ? MUTED : INK }}>{s.title}</div>
          <div style={{ fontSize: '0.74rem', color: late ? '#b45309' : MUTED }}>{s.date ? fmt(s.date) : 'no date'} · {WHO[s.who]}{late ? ' · past due' : ''}{s.remind === false ? ' · no reminder' : ''}</div>
        </button>
        <input type="date" value={s.date || ''} onChange={(e) => onChange({ ...s, date: e.target.value || null, offset: null })} aria-label={`${s.title} date`} style={{ ...inputStyle, width: 'auto', padding: '0.35rem 0.4rem', fontSize: '0.78rem' }} />
      </div>
      {open && (
        <div style={{ display: 'grid', gap: '0.55rem', marginTop: '0.6rem', paddingLeft: '1.9rem' }}>
          <Field label="Title"><input style={inputStyle} value={s.title} onChange={(e) => onChange({ ...s, title: e.target.value })} /></Field>
          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', alignItems: 'end' }}>
            <Field label="Who acts"><select style={{ ...inputStyle, width: 'auto' }} value={s.who} onChange={(e) => onChange({ ...s, who: e.target.value })}>{Object.entries(WHO).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></Field>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'inline-flex', gap: '0.4rem', alignItems: 'center', paddingBottom: '0.6rem' }}><input type="checkbox" checked={s.remind !== false} onChange={(e) => onChange({ ...s, remind: e.target.checked })} /> Text reminders</label>
          </div>
          <Field label="What it is (client sees this)"><textarea style={{ ...inputStyle, minHeight: 60 }} value={s.detail} onChange={(e) => onChange({ ...s, detail: e.target.value })} /></Field>
          <Field label="What to do"><textarea style={{ ...inputStyle, minHeight: 60 }} value={s.action} onChange={(e) => onChange({ ...s, action: e.target.value })} /></Field>
          <Field label="Your note on this step (optional, client sees it)"><input style={inputStyle} value={s.note || ''} onChange={(e) => onChange({ ...s, note: e.target.value })} placeholder="Inspector is Mike at 9am, I'll meet you there." /></Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '0.6rem' }}>
            <Field label="Link label"><input style={inputStyle} value={s.link?.label || ''} onChange={(e) => onChange({ ...s, link: { label: e.target.value, url: s.link?.url || '' } })} placeholder="Inspection report" /></Field>
            <Field label="Link (https)"><input style={inputStyle} value={s.link?.url || ''} onChange={(e) => onChange({ ...s, link: { label: s.link?.label || '', url: e.target.value } })} placeholder="https://…" /></Field>
          </div>
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            <button type="button" className="adm-btn" onClick={() => onMove(-1)} disabled={i === 0}>Move up</button>
            <button type="button" className="adm-btn" onClick={() => onMove(1)} disabled={i === n - 1}>Move down</button>
            <button type="button" className="adm-btn" onClick={onRemove} style={{ color: '#b91c1c' }}>Remove step</button>
          </div>
        </div>
      )}
    </div>
  );
}

function Detail({ session, id, onBack }) {
  const [data, setData] = useState(null);
  const [deal, setDeal] = useState(null);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [saving, setSaving] = useState(false);
  const [reply, setReply] = useState('');
  const [dirty, setDirty] = useState(false);
  const load = () => api(`/api/admin?view=deal&id=${id}`, { session }).then((d) => { setData(d); setDeal(d.deal); setDirty(false); }).catch((e) => setError(e.message));
  useEffect(() => { load(); }, [session, id]); // eslint-disable-line react-hooks/exhaustive-deps
  if (error) return <Note tone="error">{error}</Note>;
  if (!deal) return <div style={{ textAlign: 'center', color: MUTED, padding: '3rem', fontSize: '0.85rem' }}>Loading…</div>;

  const edit = (patch) => { setDeal({ ...deal, ...patch }); setDirty(true); };
  const setStep = (i, s) => edit({ steps: deal.steps.map((x, j) => (j === i ? s : x)) });
  const datesMoved = data.deal.closingOn !== deal.closingOn || data.deal.acceptedOn !== deal.acceptedOn;
  const flash = (t) => { setMsg(t); setTimeout(() => setMsg(''), 4000); };
  const save = async () => {
    setSaving(true); setError('');
    try { const r = await api('/api/admin?action=deal-save', { method: 'POST', session, body: { deal } }); setData({ ...data, deal: r.deal }); setDeal(r.deal); setDirty(false); flash('Saved. The client page is updated.'); }
    catch (e) { setError(e.message); }
    setSaving(false);
  };
  const send = async () => {
    if (dirty) { setError('Save your changes first, then text the link.'); return; }
    if (!window.confirm(`Text the roadmap link to ${deal.clientName} at ${deal.clientPhone}?`)) return;
    try { await api('/api/admin?action=deal-send', { method: 'POST', session, body: { id } }); flash('Texted.'); load(); } catch (e) { setError(e.message); }
  };
  const copy = async () => { try { await navigator.clipboard.writeText(data.link); flash('Link copied.'); } catch { flash(data.link); } };
  const answer = async (e) => {
    e.preventDefault();
    try { const r = await api('/api/admin?action=deal-reply', { method: 'POST', session, body: { id, text: reply.trim() } }); setData({ ...data, notes: [...data.notes, r.note] }); setReply(''); flash(r.texted ? 'Replied, and texted.' : 'Replied on the page.'); }
    catch (err) { setError(err.message); }
  };
  const first = deal.clientName.split(' ')[0];
  const p = { done: deal.steps.filter((s) => s.done).length, total: deal.steps.length };

  return (
    <div style={{ display: 'grid', gap: '0.9rem', paddingBottom: '4rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem' }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: SERIF, fontSize: '1.3rem', fontWeight: 700, lineHeight: 1.15 }}>{deal.address}</div>
          <div style={{ fontSize: '0.8rem', color: MUTED }}>{deal.clientName} · {deal.side === 'seller' ? 'selling' : 'buying'} · {deal.financing === 'cash' ? 'cash' : 'mortgage'}{deal.price ? ` · $${deal.price.toLocaleString()}` : ''}</div>
        </div>
        <button type="button" className="adm-btn" onClick={onBack}>All roadmaps</button>
      </div>

      <div className="adm-card" style={{ display: 'grid', gap: '0.7rem' }}>
        <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
          <button type="button" className="adm-btn pink" onClick={send} disabled={!deal.clientPhone}>Text {first} the link</button>
          <button type="button" className="adm-btn" onClick={copy}>Copy link</button>
          <a className="adm-btn" href={data.link} target="_blank" rel="noreferrer">See it as {first}</a>
          {deal.clientPhone && <a className="adm-btn" href={`tel:${digits(deal.clientPhone)}`}>Call</a>}
        </div>
        <div style={{ fontSize: '0.78rem', color: MUTED }}>{data.sent ? `Link texted ${data.sent} time${data.sent === 1 ? '' : 's'}.` : 'The client has not been sent the link yet.'} {p.done}/{p.total} steps done.</div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'end' }}>
          <Field label="Status"><select style={{ ...inputStyle, width: 'auto' }} value={deal.status} onChange={(e) => edit({ status: e.target.value })}><option value="active">Under contract</option><option value="closed">Closed</option><option value="cancelled">Cancelled</option></select></Field>
          <Field label="Offer accepted"><input style={{ ...inputStyle, width: 'auto' }} type="date" value={deal.acceptedOn || ''} onChange={(e) => edit({ acceptedOn: e.target.value })} /></Field>
          <Field label="Closing"><input style={{ ...inputStyle, width: 'auto' }} type="date" value={deal.closingOn || ''} onChange={(e) => edit({ closingOn: e.target.value })} /></Field>
        </div>
        {datesMoved && <Note>Saving will move every step that is still on its template timing to match the new dates. Steps you dated by hand stay put.</Note>}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
          <Field label="Client's cell"><input style={inputStyle} value={deal.clientPhone || ''} onChange={(e) => edit({ clientPhone: e.target.value })} /></Field>
          <Field label="Client's email"><input style={inputStyle} value={deal.clientEmail || ''} onChange={(e) => edit({ clientEmail: e.target.value })} /></Field>
          <Field label="Lender"><input style={inputStyle} value={deal.lender || ''} onChange={(e) => edit({ lender: e.target.value })} /></Field>
          <Field label="Title company"><input style={inputStyle} value={deal.titleCompany || ''} onChange={(e) => edit({ titleCompany: e.target.value })} /></Field>
        </div>
        <Field label="Your private notes (never shown to the client)"><textarea style={{ ...inputStyle, minHeight: 56 }} value={deal.internal || ''} onChange={(e) => edit({ internal: e.target.value })} /></Field>
      </div>

      <div className="adm-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
          <div style={{ fontWeight: 700 }}>Steps</div>
          <button type="button" className="adm-btn" onClick={() => edit({ steps: [...deal.steps, { id: uid(), title: 'New step', who: 'both', detail: '', action: '', note: '', remind: true, offset: null, date: null, done: false, doneOn: null, link: null }] })}>Add a step</button>
        </div>
        <p style={{ fontSize: '0.78rem', color: MUTED, margin: '0 0 0.4rem', lineHeight: 1.5 }}>Tick a step when it happens; the client sees it turn green and the next one light up. Tap a title to edit its words, who acts, or add a link.</p>
        {deal.steps.map((s, i) => (
          <StepEditor key={s.id} s={s} i={i} n={deal.steps.length} onChange={(ns) => setStep(i, ns)} onRemove={() => edit({ steps: deal.steps.filter((_, j) => j !== i) })}
            onMove={(d) => { const a = [...deal.steps]; const [x] = a.splice(i, 1); a.splice(i + d, 0, x); edit({ steps: a }); }} />
        ))}
      </div>

      <div className="adm-card">
        <div style={{ fontWeight: 700, marginBottom: '0.5rem' }}>Questions from {first}</div>
        {!data.notes.length && <div style={{ fontSize: '0.82rem', color: MUTED }}>Nothing yet. Questions typed on the roadmap land here and on your phone.</div>}
        <div style={{ display: 'grid', gap: '0.45rem', marginBottom: data.notes.length ? '0.8rem' : 0 }}>
          {data.notes.map((n) => (
            <div key={n.id} style={{ justifySelf: n.from === 'holly' ? 'end' : 'start', maxWidth: '90%', background: n.from === 'holly' ? DEEP : n.kind === 'did' ? '#e6f3f1' : BLUSH, color: n.from === 'holly' ? 'white' : INK, padding: '0.55rem 0.8rem', borderRadius: '12px', fontSize: '0.86rem', lineHeight: 1.45 }}>
              <div style={{ fontSize: '0.62rem', fontWeight: 800, letterSpacing: '0.5px', textTransform: 'uppercase', opacity: 0.75 }}>{n.from === 'holly' ? 'You' : first} · {new Date(n.at).toLocaleString('en-US', { timeZone: 'America/Detroit', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</div>
              {n.text}
            </div>
          ))}
        </div>
        <form onSubmit={answer} style={{ display: 'flex', gap: '0.5rem', alignItems: 'end' }}>
          <textarea style={{ ...inputStyle, minHeight: 48, flex: 1 }} value={reply} onChange={(e) => setReply(e.target.value)} placeholder={`Reply to ${first} (shows on the page and goes out as a text)`} />
          <button className="adm-btn pink" type="submit" disabled={reply.trim().length < 2}>Reply</button>
        </form>
      </div>

      {error && <Note tone="error">{error}</Note>}
      {(dirty || msg) && (
        <div style={{ position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 60, background: 'rgba(253,247,245,0.96)', backdropFilter: 'blur(10px)', borderTop: `1px solid ${LINE}`, padding: '0.7rem 1rem' }}>
          <div style={{ maxWidth: '760px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '0.82rem', color: dirty ? PINK : TEAL, fontWeight: 700 }}>{msg || 'Unsaved changes'}</span>
            {dirty && <div style={{ display: 'flex', gap: '0.4rem' }}><button type="button" className="adm-btn" onClick={load}>Discard</button><button type="button" className="adm-btn pink" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button></div>}
          </div>
        </div>
      )}
    </div>
  );
}

export default function DealsDesk({ session, initialId }) {
  const [view, setView] = useState(initialId ? { id: initialId } : 'list');
  useEffect(() => { if (initialId) setView({ id: initialId }); }, [initialId]);
  if (view === 'new') return <NewDeal session={session} onCreated={(id) => setView({ id })} onCancel={() => setView('list')} />;
  if (view && view.id) return <Detail session={session} id={view.id} onBack={() => setView('list')} />;
  return <List session={session} onOpen={(id) => setView({ id })} onNew={() => setView('new')} />;
}
