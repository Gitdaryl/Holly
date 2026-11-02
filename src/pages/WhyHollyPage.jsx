import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import SiteNav from '../components/SiteNav';
import CountUp from '../components/CountUp';
import { useGoogleReviews, Stars } from '../components/GoogleReviews';
import { lakes } from '../data/lakes';
import { propertiesData, amenityData } from '../data/amenities';
import { AWARDS, awardText } from '../data/profiles';
import { marketFor, marketIndex } from '../lib/market';
import { isSold, soldStats, trackRecord, fmtPrice } from '../lib/listing-stats';

// /why-holly: the page Holly opens on her phone or laptop at a listing
// appointment. Two ways to read it: a normal scroll page (in the site menu)
// and a full-screen PRESENT mode, one idea per screen, swipe or arrow keys.
//
// Rules this page lives by:
//   - It never promises a sale price or a faster sale.
//   - Every number is counted from the data modules at render time or fetched
//     live (/api/reviews, /api/waitlist). The only fixed numbers are inside
//     the clearly labelled SAMPLE Monday update.
//   - The comparison column is "A typical listing" and is written as a
//     question to ask, because we cannot speak for how every agent works.
//   - Every feature named here exists in the repo (see the report that
//     shipped with this page for the file behind each line).

const FONT = "'Inter', -apple-system, sans-serif";
const SERIF = "'Source Serif 4', Georgia, serif";
const CALL_HREF = 'tel:5174033413';
const SMS_HREF = `sms:+15173008226?&body=${encodeURIComponent("Hi Holly, I'm thinking about selling my lake home.")}`;

// ── numbers, counted once from the data ───────────────────────────────────

function computeProof() {
  const soldAll = propertiesData.filter(isSold);
  // Same year rule as the About page: the latest year with a closed sale.
  const year = soldAll.reduce((max, p) => {
    const y = parseInt(String(p.soldOn || '').slice(0, 4), 10);
    return y > max ? y : max;
  }, 0) || new Date().getFullYear();
  const yearSold = soldAll.filter((p) => String(p.soldOn || '').startsWith(String(year)));
  const rec = trackRecord(yearSold);
  const stats = yearSold.map(soldStats);
  const listSide = stats.filter((s) => s.side !== 'buyer');
  return {
    year,
    sold: rec.sold,
    volume: rec.volume,
    avgDays: rec.avgDays,
    listSides: rec.listSides,
    fast: listSide.filter((s) => s.days !== null && s.days <= 7).length,
    bothSides: stats.filter((s) => s.side === 'both').length,
    lakeCount: Object.keys(lakes).length,
  };
}
const PROOF = computeProof();

const LAKE_OPTIONS = Object.values(lakes).sort((a, b) => a.name.localeCompare(b.name));
const LAKES_WITH_SALES = marketIndex().filter((r) => r.sold > 0).map((r) => r.lake);

const short = (n) => {
  if (!n) return '';
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  return `$${Math.round(n / 1000)}K`;
};

// ── small hooks ───────────────────────────────────────────────────────────

const motionOK = () => typeof window !== 'undefined'
  && 'IntersectionObserver' in window
  && !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

function useInView() {
  const ref = useRef(null);
  const [seen, setSeen] = useState(() => !motionOK());
  useEffect(() => {
    if (seen) return undefined;
    const el = ref.current;
    if (!el) return undefined;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setSeen(true); io.disconnect(); }
    }, { threshold: 0, rootMargin: '0px 0px -8% 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, [seen]);
  return [ref, seen];
}

// Rises in once when scrolled to. Hidden beforehand only when motion is on
// and the observer exists; otherwise it is simply there.
function Reveal({ as: Tag = 'div', delay = 0, className = '', style, children, ...rest }) {
  const [ref, seen] = useInView();
  const [animate] = useState(motionOK);
  const cls = [className, animate ? (seen ? 'hg-rise' : 'wh-pending') : ''].filter(Boolean).join(' ');
  return (
    <Tag ref={ref} className={cls} style={{ ...style, animationDelay: animate && delay ? `${delay}ms` : undefined }} {...rest}>
      {children}
    </Tag>
  );
}

function useWaitlistCounts() {
  const [counts, setCounts] = useState(null);
  useEffect(() => {
    let on = true;
    fetch('/api/waitlist?all=1')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (on && d && d.counts) setCounts(d.counts); })
      .catch(() => {});
    return () => { on = false; };
  }, []);
  return counts;
}

// ── icons ─────────────────────────────────────────────────────────────────

function Check({ draw = false, size = 24, color = '#237168' }) {
  return (
    <svg className={draw ? 'hg-check' : undefined} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={{ flexShrink: 0 }}>
      <circle cx="12" cy="12" r="11" fill={color} />
      <path d="M7 12.5l3.2 3.2L17 9" fill="none" stroke="white" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Ask({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={{ flexShrink: 0 }}>
      <circle cx="12" cy="12" r="10.5" fill="none" stroke="#66706e" strokeWidth="1.6" strokeDasharray="3 2.4" />
      <path d="M9.4 9.3a2.7 2.7 0 015.2.9c0 1.8-2.6 2.2-2.6 3.8" fill="none" stroke="#4a5654" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="12" cy="17" r="1.1" fill="#4a5654" />
    </svg>
  );
}

// ── shared section frame (scroll mode and present mode use the same one) ──

function Section({ id, tone = 'light', eyebrow, title, lede, present, children, wide }) {
  const hid = `${id}-h${present ? '-p' : ''}`;
  return (
    <section id={present ? undefined : id} aria-labelledby={hid} className={`wh-sec wh-${tone}`}>
      <div className="wh-wrap" style={wide ? { maxWidth: 1100 } : undefined}>
        {eyebrow && <div className="wh-eyebrow">{eyebrow}</div>}
        <h2 id={hid} className="wh-h2">{title}</h2>
        {lede && <p className="wh-lede">{lede}</p>}
        {children}
      </div>
    </section>
  );
}

// ── 1. Hero / title ───────────────────────────────────────────────────────

function Awards({ center }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: center ? 'center' : 'flex-start' }}>
      {AWARDS.map((a) => (
        <span key={a.title} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.8rem', borderRadius: 30, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(245,181,199,0.45)', color: 'white', fontSize: '0.8rem', fontWeight: 600 }}>
          <span aria-hidden="true" style={{ color: '#f5b5c7' }}>&#9733;</span>{awardText(a)}
        </span>
      ))}
    </div>
  );
}

function Hero({ onPresent, present }) {
  return (
    <section className="wh-sec wh-dark wh-hero" aria-labelledby={present ? 'wh-title-p' : 'wh-title'}>
      <div className="wh-wrap">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1.5rem' }}>
          <img src="/images/holly-headshot.webp" alt="Holly Griewahn" width="64" height="64" style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', border: '2px solid #f5b5c7' }} />
          <div>
            <div style={{ color: 'white', fontWeight: 700, fontSize: '1rem' }}>Holly Griewahn</div>
            <div style={{ color: 'rgba(255,255,255,0.78)', fontSize: '0.85rem' }}>Foundation Realty, Manitou Beach</div>
          </div>
        </div>
        <div className="wh-eyebrow">For sellers</div>
        <h1 id={present ? 'wh-title-p' : 'wh-title'} className="wh-h1">
          Price it to what is <span className="hg-underline">really closing</span>. Then watch it work, every week.
        </h1>
        <p className="wh-lede" style={{ maxWidth: 620 }}>
          No promised number here. Here is what you get instead: proof of what has really sold, a fast answer for every buyer who reaches out, and a clear update on your home every Monday.
        </p>
        {!present && (
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', margin: '1.75rem 0 1.75rem' }}>
            <button type="button" onClick={onPresent} className="wh-btn wh-btn-primary">
              <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d="M7 4.5v15l12-7.5z" /></svg>
              Present this
            </button>
            <a href="#compare" className="wh-btn wh-btn-ghost">See the comparison</a>
          </div>
        )}
        <div style={{ marginTop: present ? '1.75rem' : 0 }}><Awards /></div>
        <img src="/images/signature-blush.webp" alt="" aria-hidden="true" width="900" height="238" style={{ width: 'min(260px, 60vw)', height: 'auto', marginTop: '1.75rem', opacity: 0.9 }} />
      </div>
    </section>
  );
}

// ── 2. Proof ──────────────────────────────────────────────────────────────

function ProofTile({ value, label, delay }) {
  return (
    <Reveal delay={delay} className="wh-tile">
      <div className="wh-tile-num"><CountUp value={value} /></div>
      <div className="wh-tile-label">{label}</div>
    </Reveal>
  );
}

function Proof({ present }) {
  const reviews = useGoogleReviews();
  return (
    <Section id="proof" eyebrow={`Holly's closed sales, ${PROOF.year}`} title="Sold, not promised" present={present}
      lede="Counted from Holly's closed sales, the same records behind her public sold page. Nothing here is an estimate.">
      <div className="wh-tiles">
        <ProofTile value={String(PROOF.sold)} label={`Homes sold in ${PROOF.year}`} delay={0} />
        <ProofTile value={short(PROOF.volume)} label="Total sold" delay={80} />
        <ProofTile value={String(PROOF.fast)} label="Homes sold in a week or less" delay={160} />
        <ProofTile value={String(PROOF.bothSides)} label="Sales where Holly also brought the buyer" delay={240} />
      </div>
      <p className="wh-note">
        {PROOF.avgDays !== null && <>Homes Holly listed took <strong>{PROOF.avgDays}</strong> days to sell on average, across {PROOF.listSides} sales. </>}
        Every sale is on her public page with how long it took, photos and a map, so you can check her work before you hire her.
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1rem 1.5rem', marginTop: '1.25rem' }}>
        <Link to="/sold" className="wh-btn wh-btn-primary">See every sale and the sold map</Link>
        {reviews && reviews.count > 0 && (
          <a href={reviews.mapsUrl} target="_blank" rel="noopener" className="wh-rating">
            <strong style={{ fontSize: '1.25rem', color: '#1c2b29' }}>{reviews.rating.toFixed(1)}</strong>
            <Stars n={reviews.rating} size={18} />
            <span>{reviews.count} reviews on Google</span>
          </a>
        )}
      </div>
    </Section>
  );
}

// ── 3. Tap what matters ───────────────────────────────────────────────────

const PRIORITIES = [
  { id: 'price', label: 'The highest price', honest: true,
    answer: 'A price is a forecast, not a promise, and Holly will not promise you a number. She sets it from what has really sold on your lake and nearby. Then every Monday you see whether buyers agree, so any change is made on evidence, not hope.' },
  { id: 'reply', label: 'Buyers answered fast',
    answer: 'When a buyer asks to see your home, Holly\'s phone buzzes within seconds, any hour, and the buyer hears back from her number right away, so nobody is left waiting.' },
  { id: 'informed', label: 'Knowing what is happening',
    answer: 'Every Monday you get a short note: how many people looked at your home, how many saved it, how many asked to see it, and what Holly recommends next. She reads and approves each one before it reaches you, so you are never guessing.' },
  { id: 'proof', label: 'Proof, not talk',
    answer: `${PROOF.sold} sales in ${PROOF.year}, every one on her public sold page with how long it took. You can check her work before you hire her.` },
  { id: 'buyers', label: 'Buyers already looking',
    answer: `Buyers can sign up on any of the ${PROOF.lakeCount} lake pages to hear first. When your home comes up, Holly reaches out to any buyers waiting on your lake.` },
  { id: 'found', label: 'Buyers finding your home',
    answer: 'When movers compare lakes on Google or ask an AI assistant, Holly\'s lake pages give them clear, real answers about what has sold and what each lake is like, and your home sits on those pages. Nobody can promise a ranking, but your home is on pages built to be found.' },
  { id: 'calls', label: 'No missed calls',
    answer: 'Calls to Holly\'s website number ring her cell. If she cannot pick up, the caller leaves a message and she gets it as a text she can read at a glance, so a buyer is never lost to voicemail.' },
  { id: 'local', label: 'Someone who knows the lakes',
    answer: `${awardText(AWARDS[0])}. And a page with real sales and facts for each of the ${PROOF.lakeCount} lakes.` },
  { id: 'late', label: 'Questions answered at night',
    answer: 'Heather, Holly\'s site assistant, answers buyer questions any hour from Holly\'s real listings, sales and lake facts, then passes the buyer\'s details to Holly. A question asked at 11pm is not left waiting till morning.' },
];

function Priorities({ present }) {
  const [picked, setPicked] = useState([]);
  const [bump, setBump] = useState(0);
  const toggle = (id) => {
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
    setBump((b) => b + 1);
  };
  const chosen = PRIORITIES.filter((p) => picked.includes(p.id));
  const systems = chosen.filter((p) => !p.honest).length;
  const r = 34;
  const circ = 2 * Math.PI * r;
  const frac = chosen.length ? systems / chosen.length : 0;
  return (
    <Section id="matters" eyebrow="Your priorities" title="What matters most to you?" present={present}
      lede="Tap everything that applies. Each one shows how Holly handles it.">
      <div className="wh-pri-grid">
        <div className="wh-chips" role="group" aria-label="Seller priorities">
          {PRIORITIES.map((p) => {
            const on = picked.includes(p.id);
            return (
              <button key={p.id} type="button" aria-pressed={on} onClick={() => toggle(p.id)} className={`wh-chip${on ? ' is-on' : ''}`}>
                <span className="wh-chip-box" aria-hidden="true">{on ? <Check size={20} draw color={p.honest ? '#ad3557' : '#237168'} /> : null}</span>
                {p.label}
              </button>
            );
          })}
        </div>
        <div className="wh-tally" aria-live="polite">
          <svg width="88" height="88" viewBox="0 0 88 88" aria-hidden="true" key={bump} className={bump ? 'hg-pop' : undefined}>
            <circle cx="44" cy="44" r={r} fill="none" stroke="#f6e0e6" strokeWidth="8" />
            <circle cx="44" cy="44" r={r} fill="none" stroke="#237168" strokeWidth="8" strokeLinecap="round"
              strokeDasharray={circ} strokeDashoffset={circ * (1 - frac)} transform="rotate(-90 44 44)" style={{ transition: 'stroke-dashoffset 0.5s ease' }} />
            <text x="44" y="50" textAnchor="middle" fontFamily={SERIF} fontWeight="800" fontSize="20" fill="#1c2b29">{systems}/{chosen.length}</text>
          </svg>
          <div>
            {chosen.length === 0 ? (
              <div style={{ fontWeight: 700 }}>Pick a few to start.</div>
            ) : (
              <>
                <div style={{ fontWeight: 800, fontSize: '1.05rem' }}>{systems} of your {chosen.length} {chosen.length === 1 ? 'pick is' : 'picks are'} backed by something you can see and check.</div>
                {chosen.some((p) => p.honest) && <div style={{ color: '#4a5654', fontSize: '0.9rem', marginTop: '0.25rem' }}>On price, you get a straight answer instead of a promise.</div>}
              </>
            )}
          </div>
        </div>
      </div>
      {chosen.length > 0 && (
        <ul className="wh-answers">
          {chosen.map((p) => (
            <li key={p.id} className="hg-rise">
              {p.honest ? <span className="wh-tag wh-tag-berry">Straight answer</span> : <span className="wh-tag">How Holly handles it</span>}
              <strong>{p.label}.</strong> {p.answer}
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}

// ── 4. Speed to lead (phone mock) ─────────────────────────────────────────

function Phone({ label, dark, children, buzz, innerRef }) {
  return (
    <figure ref={innerRef} style={{ margin: 0, flex: '1 1 260px', maxWidth: 320, width: '100%', scrollMarginBottom: 16 }}>
      <figcaption className="wh-phone-cap">{label}</figcaption>
      <div className={`wh-phone${buzz ? ' hg-buzz' : ''}`} style={{ background: dark ? 'linear-gradient(170deg,#1a554e,#123f3a)' : '#ffffff' }}>
        <div className="wh-notch" aria-hidden="true" />
        {children}
      </div>
    </figure>
  );
}

function SpeedDemo({ present }) {
  const [ref, seen] = useInView();
  const [reduce] = useState(() => !motionOK());
  const [step, setStep] = useState(reduce ? 4 : 0);
  const [run, setRun] = useState(0);
  useEffect(() => {
    if (reduce || !seen) return undefined;
    setStep(0);
    const t = [700, 1700, 3000, 4600].map((ms, i) => setTimeout(() => setStep(i + 1), ms));
    return () => t.forEach(clearTimeout);
  }, [seen, run, reduce]);

  // Phones stack on a narrow screen, so in present mode the buyer's phone is
  // below the fold when its text arrives. Bring it up as the reply starts.
  const buyerRef = useRef(null);
  useEffect(() => {
    if (!present || reduce || step !== 2 || window.innerWidth >= 700) return;
    buyerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [present, reduce, step]);

  return (
    <Section id="speed" tone="dark" eyebrow="Fast answers" title="A buyer asks at 9pm. Holly knows in seconds." present={present} wide
      lede="Any time a buyer reaches out through the site, by showing request, home value form, lake sign-up, message or chat, Holly's phone buzzes right away.">
      <div ref={ref} className="wh-phones">
        <Phone label="Holly's phone" dark buzz={step === 1 || step === 4}>
          <div style={{ textAlign: 'center', color: 'white', padding: '1.6rem 0 1rem' }}>
            <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>Saturday</div>
            <div style={{ fontFamily: SERIF, fontSize: '2.6rem', fontWeight: 600, lineHeight: 1 }}>9:12</div>
          </div>
          {step >= 1 && (
            <div className="wh-banner hg-bubble">
              <div className="wh-banner-app">Messages from (517) 300-8226 <span>now</span></div>
              Sam wants to see your lake house, Saturday morning. Call: (517) 555-0142
            </div>
          )}
          {step >= 4 && (
            <div className="wh-banner hg-bubble" style={{ marginTop: '0.5rem' }}>
              <div className="wh-banner-app">Still waiting <span>1h, then 24h</span></div>
              Still waiting on you: Sam (showing request, 1h ago). Open your desk or tap to call.
            </div>
          )}
          {step === 0 && <div style={{ color: 'rgba(255,255,255,0.7)', textAlign: 'center', fontSize: '0.85rem' }}>Waiting for a buyer</div>}
        </Phone>
        <Phone label="The buyer's phone" innerRef={buyerRef}>
          <div style={{ textAlign: 'center', padding: '0.9rem 0 0.6rem', borderBottom: '1px solid #f1e4e0', marginBottom: '0.75rem' }}>
            <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#1a554e', color: 'white', fontWeight: 700, fontSize: '0.85rem', display: 'grid', placeItems: 'center', margin: '0 auto 0.25rem' }} aria-hidden="true">HG</div>
            <div style={{ fontSize: '0.75rem', color: '#4a5654', fontWeight: 600 }}>(517) 300-8226</div>
          </div>
          <div className="wh-sys">Showing request sent from the listing page</div>
          {step === 2 && <div className="wh-in hg-bubble" aria-label="Typing"><span className="hg-typing"><span /><span /><span /></span></div>}
          {step >= 3 && (
            <div className="wh-in hg-bubble">
              Hi Sam, this is Holly Griewahn with Foundation Realty. Got your request to see the lake house. I'll call you shortly to set it up. Anything urgent, text me here or call (517) 403-3413.
            </div>
          )}
        </Phone>
      </div>
      <p className="wh-sample-note">Sample texts. The wording is what the live system sends; the names and number are made up.</p>
      {!reduce && (
        <button type="button" className="wh-btn wh-btn-ghost" style={{ marginTop: '0.75rem' }} onClick={() => setRun((n) => n + 1)}>
          Play it again
        </button>
      )}
      <ul className="wh-facts">
        <li><Check size={22} /> <span>Anyone who asks to see a home, requests a home value or joins a lake list gets a text back from Holly's number right away, so they know they were heard.</span></li>
        <li><Check size={22} /> <span>If a new request has not been answered, Holly gets a reminder after 1 hour and again after 24 hours, so nothing slips through.</span></li>
        <li><Check size={22} /> <span>One number for texts and calls, (517) 300-8226. Calls ring her cell, and a voicemail reaches her as a text she can read.</span></li>
        <li><Check size={22} /> <span>Every request lands in one place on her phone, with one tap to call or text back.</span></li>
      </ul>
    </Section>
  );
}

// ── 5. Comparison ─────────────────────────────────────────────────────────

const COMPARE = [
  { what: 'A list price set from homes that actually closed, and you see those sales', holly: 'Lake sales reports, public', link: '/market', them: 'Ask what the number is based on' },
  { what: 'The agent hears about every buyer request within seconds', holly: 'Any hour, any way they reach out', them: 'Ask how fast they hear about a buyer' },
  { what: 'Buyers hear back right away', holly: 'Showing and home value requests, lake sign-ups', them: 'Ask them' },
  { what: 'Nothing slips through if the agent is busy', holly: 'A reminder at 1 hour and 24 hours', them: 'Ask what happens if a request is missed' },
  { what: 'A written update every Monday', holly: 'Who looked, who asked, what to do next', them: 'Ask how often, and ask for a sample' },
  { what: 'Your listing\'s live numbers, any day', holly: 'A private link for you', them: 'Ask them' },
  { what: 'Every sale this year, public', holly: `${PROOF.sold} sales on the sold page`, link: '/sold', them: 'Ask to see the full list' },
  { what: 'Buyers who want first look at your lake', holly: `On all ${PROOF.lakeCount} lake pages`, them: 'Ask who is already waiting' },
  { what: 'Buyer questions answered at 2am', holly: 'Heather, the site assistant', them: 'Ask them' },
  { what: 'Your home is easy to find on Google and in AI assistants', holly: 'Pages built to be found', them: 'Ask how buyers will find it' },
  { what: 'On the MLS and the big home sites', holly: 'Through Foundation Realty', them: 'Standard. Every listing should have this.', same: true },
];

function CompareRow({ row, i }) {
  const [ref, seen] = useInView();
  const [animate] = useState(motionOK);
  return (
    <tr ref={ref} className={animate ? (seen ? 'hg-rise' : 'wh-pending') : undefined} style={{ animationDelay: animate ? `${Math.min(i, 4) * 50}ms` : undefined }}>
      <th scope="row" className="wh-c-what">{row.what}</th>
      <td className="wh-c-holly" data-label="With Holly">
        <span className="wh-cell"><Check draw={animate && seen} /> <span><span className="wh-sr">Yes. </span>{row.link ? <a href={row.link}>{row.holly}</a> : row.holly}</span></span>
      </td>
      <td className="wh-c-them" data-label="A typical listing">
        <span className="wh-cell">{row.same ? <Check color="#66706e" /> : <Ask />} <span>{row.them}</span></span>
      </td>
    </tr>
  );
}

function Compare({ present }) {
  return (
    <Section id="compare" eyebrow="Side by side" title="What you get, next to a typical listing" present={present} wide
      lede="We cannot speak for how every agent works, so the right-hand column is a question you can ask, not a claim about anyone.">
      <div className="wh-table-wrap">
        <table className="wh-table">
          <thead>
            <tr>
              <th scope="col"><span className="wh-sr">What you get</span></th>
              <th scope="col" className="wh-th-holly">With Holly</th>
              <th scope="col" className="wh-th-them">A typical listing</th>
            </tr>
          </thead>
          <tbody>
            {COMPARE.map((row, i) => <CompareRow key={row.what} row={row} i={i} />)}
          </tbody>
        </table>
      </div>
    </Section>
  );
}

// ── 6. Lake picker ────────────────────────────────────────────────────────

function lakeView(slug) {
  const m = marketFor(slug);
  if (!m) return null;
  const st = m.hasLakeData ? m.lakeStats : m.regionStats;
  return {
    m, st,
    scope: m.hasLakeData ? `on ${m.lake.name}` : `in the ${m.region.name} area`,
    range: st.low && st.high ? (st.low === st.high ? fmtPrice(st.low) : `${short(st.low)} to ${short(st.high)}`) : null,
    drives: (amenityData[m.lake.region]?.distances || []).slice(0, 3),
  };
}

function LakePicker({ present }) {
  const [slug, setSlug] = useState(LAKES_WITH_SALES[0]?.slug || LAKE_OPTIONS[0].slug);
  const counts = useWaitlistCounts();
  const v = lakeView(slug);
  const lake = lakes[slug];
  const waiting = counts && counts[slug] >= 3 ? counts[slug] : null;
  const selectId = present ? 'wh-lake-p' : 'wh-lake';
  const typeLabel = lake.type === 'all-sports' ? 'All-sports' : lake.type === 'no-wake' ? 'No-wake' : 'Private';
  return (
    <Section id="your-lake" eyebrow="Your lake, real numbers" title="Pick your lake" present={present}
      lede="Holly's own closed sales on that lake, or its area when the lake has none yet. The same numbers as the public lake sales report.">
      <div className="wh-picker">
        <label htmlFor={selectId} className="wh-sr">Choose a lake</label>
        <select id={selectId} value={slug} onChange={(e) => setSlug(e.target.value)} className="wh-select">
          {LAKE_OPTIONS.map((l) => <option key={l.slug} value={l.slug}>{l.name}</option>)}
        </select>
        {LAKES_WITH_SALES.length > 0 && (
          <div className="wh-quick" role="group" aria-label="Lakes where Holly has sold this year">
            {LAKES_WITH_SALES.map((l) => (
              <button key={l.slug} type="button" aria-pressed={slug === l.slug} onClick={() => setSlug(l.slug)} className={`wh-qchip${slug === l.slug ? ' is-on' : ''}`}>{l.name}</button>
            ))}
          </div>
        )}
      </div>

      <div key={slug} className="wh-lake-card hg-rise">
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '0.5rem 1rem', alignItems: 'baseline' }}>
          <h3 style={{ fontFamily: SERIF, fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>{lake.name}</h3>
          <div style={{ fontSize: '0.88rem', color: '#4a5654' }}>
            {[lake.acres && `${lake.acres.toLocaleString()} acres`, lake.depth && `${lake.depth} ft deep`, typeLabel, lake.access === 'private' ? 'Private access' : 'Public access'].filter(Boolean).join(' · ')}
          </div>
        </div>

        {v.st.sold > 0 ? (
          <>
            <div className="wh-sub">Holly's sales {v.scope}, {v.m.year}</div>
            <div className="wh-tiles wh-tiles-sm">
              <div className="wh-tile"><div className="wh-tile-num"><CountUp value={String(v.st.sold)} /></div><div className="wh-tile-label">Closed {v.st.sold === 1 ? 'sale' : 'sales'}</div></div>
              <div className="wh-tile"><div className="wh-tile-num"><CountUp value={short(v.st.median)} /></div><div className="wh-tile-label">{v.st.sold === 1 ? 'Sale price' : 'Typical sale price'}</div></div>
              {v.st.avgDays !== null && <div className="wh-tile"><div className="wh-tile-num"><CountUp value={String(v.st.avgDays)} /></div><div className="wh-tile-label">{v.st.listSides === 1 ? 'Days to sell' : 'Avg days to sell'}</div></div>}
              <div className="wh-tile"><div className="wh-tile-num"><CountUp value={String(v.m.forSale.length)} /></div><div className="wh-tile-label">For sale with Holly now</div></div>
            </div>
            {v.range && <p className="wh-note" style={{ marginTop: '0.75rem' }}>Price range {v.scope}: <strong>{v.range}</strong>.</p>}
          </>
        ) : (
          <p className="wh-note" style={{ marginTop: '1rem' }}>
            No closed sales from Holly on {lake.name} or in the {v.m.region.name} area yet in {v.m.year}. The {lake.name} report still lists what is for sale and lets owners sign up to hear when a home there sells or lists.
          </p>
        )}

        <div className="wh-lake-foot">
          <div>
            <div className="wh-sub" style={{ marginTop: 0 }}>Buyers on this lake</div>
            {waiting
              ? <p style={{ margin: 0 }}><strong style={{ fontSize: '1.3rem' }}>{waiting}</strong> buyers registered for {lake.name}.</p>
              : <p style={{ margin: 0 }}>Buyers can sign up to hear about homes on {lake.name} first, and Holly keeps in touch with them.</p>}
          </div>
          {v.drives.length > 0 && (
            <div>
              <div className="wh-sub" style={{ marginTop: 0 }}>Drive times buyers see</div>
              <p style={{ margin: 0 }}>{v.drives.map((d) => `${d.to} ${d.time}`).join(' · ')}</p>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginTop: '1.25rem' }}>
          <Link to={`/market/${slug}`} className="wh-btn wh-btn-primary">{lake.name} sales report</Link>
          <Link to={`/lakes/${slug}`} className="wh-btn wh-btn-outline">The {lake.name} page</Link>
        </div>
      </div>
    </Section>
  );
}

// ── 7. How we sell your home ──────────────────────────────────────────────

// Steps marked built: false are the plan for each listing, not software that
// exists today (video tour, social launch set). Holly delivers them by hand
// until they are productised. Do not demo this page for a seller without
// knowing who produces each of them. Everything else is live in the repo.
const PLAN = [
  { key: 'before', tab: 'Before launch', lede: 'Before the sign goes in.', steps: [
    { title: 'Priced from closed sales', built: true, body: 'Your list price is set from what has actually closed on your lake and nearby. The sales are public in the lake sales reports, so you can check the work.', link: '/market', cta: 'Lake sales reports' },
    { title: 'Photo and video tour', built: false, body: 'Professional photos, a walk-through video and drone footage of your home and the water, shot and edited before launch so day one looks finished.' },
    { title: 'Your lake\'s buyers hear first', built: true, body: 'Buyers who signed up for your lake are one tap away from Holly\'s phone. She reaches out to them before your home goes public, so the people most likely to care hear first.' },
  ] },
  { key: 'launch', tab: 'Launch week', lede: 'Your home goes live in every place a buyer looks.', steps: [
    { title: 'Your own page, built to share', built: true, body: 'A page for your address: gallery, video tour, the facts, a map and a one-tap showing request. Pasted into Facebook, a text or an Instagram bio, it shows your photo and price. You can share it too.' },
    { title: 'Social launch', built: false, body: 'A launch post and a short reel cut from your video, on Holly\'s Facebook and Instagram, pointing at your page.' },
    { title: 'MLS and the big home sites', built: true, body: 'Listed through Foundation Realty on the MLS, which feeds the big home-search sites, like every listing should be.' },
    { title: 'Your lake\'s page', built: true, body: 'Buyers reading about your lake find your home on its page and in its sales report.' },
  ] },
  { key: 'after', tab: 'Every week', lede: 'The listing keeps working, and you can see it.', steps: [
    { title: 'Heather answers buyers, any hour', built: true, body: 'Holly\'s site assistant answers buyer questions from your listing\'s real facts and passes the buyer\'s details to Holly, so a question asked at 11pm gets an answer instead of waiting till morning.' },
    { title: 'Monday update and live numbers', built: true, body: 'How many people looked, saved it and asked to see it, every Monday, plus a private link to check the live numbers any day. You never have to wait to know where you stand.' },
    { title: 'Changes made on evidence', built: true, body: 'Lots of looks but no showings usually points at price or photos. Nobody looking points at reach. Holly gets a flag for both, so the next move comes from the numbers, not a hunch.' },
    { title: 'On the record', built: true, body: 'When it sells, your sale stays on her public sold page, with how long it took to sell.' },
  ] },
];

function DayWeList({ present }) {
  const [phase, setPhase] = useState(0);
  const tabRefs = useRef([]);
  const idBase = present ? 'whp-p' : 'whp';
  let n = 0;
  const startAt = PLAN.slice(0, phase).reduce((a, p) => a + p.steps.length, 0);
  const onKey = (e) => {
    let next = null;
    if (e.key === 'ArrowRight') next = (phase + 1) % PLAN.length;
    else if (e.key === 'ArrowLeft') next = (phase + PLAN.length - 1) % PLAN.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = PLAN.length - 1;
    if (next === null) return;
    e.preventDefault();
    e.stopPropagation();
    setPhase(next);
    tabRefs.current[next] && tabRefs.current[next].focus();
  };
  const cur = PLAN[phase];
  return (
    <Section id="day-we-list" eyebrow="The plan" title="How we sell your home, step by step" present={present}
      lede="Every place a buyer might look, in the order it happens.">
      <div role="tablist" aria-label="Selling plan phases" className="wh-tabs" onKeyDown={onKey}>
        {PLAN.map((p, i) => (
          <button key={p.key} type="button" role="tab" id={`${idBase}-tab-${p.key}`} aria-selected={phase === i}
            aria-controls={`${idBase}-panel`} tabIndex={phase === i ? 0 : -1}
            ref={(el) => { tabRefs.current[i] = el; }} onClick={() => setPhase(i)}
            className={`wh-tab${phase === i ? ' wh-tab-on' : ''}`}>
            <span className="wh-tab-n">{i + 1}</span>{p.tab}
          </button>
        ))}
      </div>
      <div role="tabpanel" id={`${idBase}-panel`} aria-labelledby={`${idBase}-tab-${cur.key}`} className="wh-plan">
        <p className="wh-plan-lede">{cur.lede}</p>
        <ol className="wh-steps" start={startAt + 1}>
          {cur.steps.map((st, i) => {
            n += 1;
            return (
              <Reveal as="li" key={`${cur.key}-${st.title}`} delay={i * 70} className="wh-step">
                <span className="wh-step-num" aria-hidden="true">{startAt + n}</span>
                <div>
                  <div className="wh-step-title">{st.title}</div>
                  <div className="wh-step-body">{st.body}</div>
                  {st.link && <a href={st.link} className="wh-flink wh-flink-light">{st.cta}</a>}
                </div>
              </Reveal>
            );
          })}
        </ol>
        <div className="wh-plan-nav">
          {phase > 0 && <button type="button" className="wh-btn wh-btn-ghost" onClick={() => setPhase(phase - 1)}>Back: {PLAN[phase - 1].tab}</button>}
          {phase < PLAN.length - 1 && <button type="button" className="wh-btn wh-btn-primary" onClick={() => setPhase(phase + 1)}>Next: {PLAN[phase + 1].tab}</button>}
        </div>
      </div>
    </Section>
  );
}

// ── 8. Monday update (sample) ─────────────────────────────────────────────

function MondayUpdate({ present }) {
  // SAMPLE numbers. Labelled on the card itself; not from any real listing.
  const tiles = [['41', 'People looked'], ['6', 'Saved it'], ['2', 'Asked to see it']];
  return (
    <Section id="monday" tone="blush" eyebrow="Every Monday" title="Your inbox, every Monday morning" present={present}
      lede="Built from your listing's real numbers and Holly's sales on your lake. Nothing reaches you until Holly has read it and approved it.">
      <Reveal className="wh-mail">
        <div className="wh-mail-head">
          <div>
            <div style={{ fontWeight: 700 }}>Holly Griewahn</div>
            <div style={{ fontSize: '0.85rem', color: '#4a5654' }}>Your home this week</div>
          </div>
          <span className="wh-sample">Sample</span>
        </div>
        <div className="wh-mail-tiles">
          {tiles.map(([n, l]) => (
            <div key={l} className="wh-mtile"><div className="wh-mtile-num">{n}</div><div className="wh-tile-label">{l}</div></div>
          ))}
        </div>
        <div className="wh-mail-sec"><div className="wh-sub">What happened this week</div><p>41 people viewed your listing page and 6 saved it, both up on last week. Two asked to see it in person.</p></div>
        <div className="wh-mail-sec"><div className="wh-sub">What the market is doing</div><p>Written from Holly's actual closed sales on your lake or area: what sold, for how much, and how fast.</p></div>
        <div className="wh-mail-sec"><div className="wh-sub">What Holly recommends</div><p>A specific next step: hold, adjust, change a photo or the description, hold an open house, or wait through a date.</p></div>
        <div className="wh-approved"><Check size={20} /> Approved by Holly before sending</div>
      </Reveal>
      <p className="wh-sample-note" style={{ color: '#4a5654' }}>Sample with made-up numbers. Your update uses your listing's real ones.</p>
    </Section>
  );
}

// ── 9. Found everywhere ───────────────────────────────────────────────────

const FOUND = [
  { t: 'Easy for buyers to find', b: 'When movers compare lakes on Google or ask an AI assistant, Holly\'s lake pages give them clear, real answers: what has sold, what homes cost, what each lake is like. Your home sits on those pages. Nobody can promise a ranking, but your home is on pages built to be found.' },
  { t: 'Heather, at any hour', b: 'Heather is Holly\'s site assistant. Buyers get real answers about your home and the lake any time of day, from Holly\'s actual listings and sales. When they are ready to talk, their details go straight to Holly.' },
  { t: 'A page for every lake', b: `${PROOF.lakeCount} lake pages, each with real sales and a sign-up for buyers who want first look.`, link: '/market', cta: 'See the lake reports' },
  { t: 'Things to do, for buyers', b: 'A calendar of what is happening around the lakes, so buyers picture the life, not just the house.', link: '/events', cta: 'See the events' },
  { t: 'Holly & The Yeti', b: 'A show about life around Devils Lake and the Irish Hills, co-hosted by Holly, so buyers see how she talks about the lakes before they ever call.', link: '/holly-yeti', cta: 'Watch the show' },
  { t: 'Nothing slips through', b: 'Every buyer request, text and call lands in one place on Holly\'s phone, with one tap to call or text back, so no one is left waiting while she is out showing homes.' },
];

function Found({ present }) {
  const reviews = useGoogleReviews();
  return (
    <Section id="found" tone="dark" eyebrow="Reach" title="Where buyers find your home" present={present} wide>
      <div className="wh-found">
        {FOUND.map((f, i) => (
          <Reveal key={f.t} className="wh-fcard" delay={i * 60}>
            <div className="wh-fcard-t">{f.t}</div>
            <p>{f.b}</p>
            {f.link && <a href={f.link} className="wh-flink">{f.cta}</a>}
          </Reveal>
        ))}
      </div>
      {reviews && reviews.count > 0 && (
        <a href={reviews.mapsUrl} target="_blank" rel="noopener" className="wh-rating wh-rating-dark">
          <strong style={{ fontSize: '1.5rem' }}>{reviews.rating.toFixed(1)}</strong>
          <Stars n={reviews.rating} size={20} />
          <span>{reviews.count} reviews on Google, live</span>
        </a>
      )}
    </Section>
  );
}

// ── 10. Questions to ask every agent ──────────────────────────────────────

const QUESTIONS = [
  'What is your price based on? Can I see the sales it came from?',
  'If a buyer asks about my home at 9pm on a Saturday, when do you hear about it, and when do they hear back?',
  'Can I see every home you sold this year, and how long each took to sell?',
  'How often will I hear from you, and what numbers will be in it?',
  'Can I see how many people viewed and saved my listing, on any day?',
  'If the price is wrong, how will we know, and when?',
  'Which buyers are already waiting for a home on my lake?',
  'Who answers buyer questions when you are with another client?',
  'What exactly will you do to market my home, and when? Can I see it written down?',
];

function Questions({ present }) {
  const [done, setDone] = useState([]);
  const [msg, setMsg] = useState('');
  const toggle = (i) => setDone((d) => (d.includes(i) ? d.filter((x) => x !== i) : [...d, i]));
  const share = async () => {
    const text = `Questions to ask every agent you interview:\n${QUESTIONS.map((q, i) => `${i + 1}. ${q}`).join('\n')}`;
    try {
      if (navigator.share) { await navigator.share({ title: 'Questions to ask every agent', text }); setMsg('Shared.'); return; }
      await navigator.clipboard.writeText(text);
      setMsg('Copied. Paste it into a note or a text.');
    } catch {
      setMsg('Could not share from this browser. A screenshot works too.');
    }
  };
  const idBase = present ? 'whq-p' : 'whq';
  return (
    <Section id="questions" eyebrow="Before you sign" title="Questions to ask every agent you interview" present={present}
      lede="Including Holly. Tick them off as you go; good answers come with something you can see.">
      <ul className="wh-qlist">
        {QUESTIONS.map((q, i) => (
          <Reveal as="li" key={q} delay={i * 50}>
            <input type="checkbox" id={`${idBase}-${i}`} checked={done.includes(i)} onChange={() => toggle(i)} />
            <label htmlFor={`${idBase}-${i}`}>{q}</label>
          </Reveal>
        ))}
      </ul>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginTop: '1.25rem' }}>
        <button type="button" onClick={share} className="wh-btn wh-btn-primary">Share this list</button>
        <span aria-live="polite" style={{ color: '#4a5654', fontSize: '0.9rem' }}>{msg}</span>
      </div>
    </Section>
  );
}

// ── 11. Close ─────────────────────────────────────────────────────────────

function Close({ present }) {
  return (
    <Section id="next" tone="dark" eyebrow="Next step" title="No promised price. A plan you can watch work." present={present}>
      <p className="wh-lede">Start with what homes like yours have actually sold for.</p>
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', margin: '1.5rem 0' }}>
        <Link to="/cma" className="wh-btn wh-btn-primary">What is my home worth</Link>
        <a href={SMS_HREF} className="wh-btn wh-btn-ghost">Text Holly</a>
        <a href={CALL_HREF} className="wh-btn wh-btn-white">Call (517) 403-3413</a>
      </div>
      <Awards />
      <img src="/images/signature-blush.webp" alt="Holly Griewahn" width="900" height="238" style={{ width: 'min(240px, 60vw)', height: 'auto', marginTop: '1.5rem' }} />
    </Section>
  );
}

// ── Present mode ──────────────────────────────────────────────────────────

const SLIDES = [
  { key: 'title', label: 'Title', render: (p) => <Hero {...p} /> },
  { key: 'proof', label: 'Sold, not promised', render: (p) => <Proof {...p} /> },
  { key: 'matters', label: 'Your priorities', render: (p) => <Priorities {...p} /> },
  { key: 'speed', label: 'Fast answers', render: (p) => <SpeedDemo {...p} /> },
  { key: 'compare', label: 'Side by side', render: (p) => <Compare {...p} /> },
  { key: 'lake', label: 'Your lake', render: (p) => <LakePicker {...p} /> },
  { key: 'day', label: 'How we sell', render: (p) => <DayWeList {...p} /> },
  { key: 'monday', label: 'Every Monday', render: (p) => <MondayUpdate {...p} /> },
  { key: 'found', label: 'Reach', render: (p) => <Found {...p} /> },
  { key: 'questions', label: 'Questions to ask', render: (p) => <Questions {...p} /> },
  { key: 'next', label: 'Next step', render: (p) => <Close {...p} /> },
];

const FOCUSABLE = 'a[href], button:not([disabled]), select, input, textarea, [tabindex]:not([tabindex="-1"])';

function Presenter({ start = 0, onClose }) {
  const [i, setI] = useState(start);
  const [dir, setDir] = useState('next');
  const rootRef = useRef(null);
  const stageRef = useRef(null);
  const touch = useRef(null);
  const last = SLIDES.length - 1;

  const go = useCallback((n) => {
    const t = Math.max(0, Math.min(last, n));
    if (t === i) return;
    setDir(t > i ? 'next' : 'prev');
    setI(t);
  }, [i, last]);

  // Lock the page behind, focus the dialog, give focus back on exit.
  useEffect(() => {
    const prevFocus = document.activeElement;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    rootRef.current?.focus();
    return () => {
      document.body.style.overflow = prevOverflow;
      if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
      prevFocus?.focus?.();
    };
  }, []);

  useEffect(() => { if (stageRef.current) stageRef.current.scrollTop = 0; }, [i]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); onClose(); return; }
      const tag = e.target?.tagName;
      const typing = tag === 'SELECT' || tag === 'INPUT' || tag === 'TEXTAREA';
      if (e.key === 'Tab') {
        const els = Array.from(rootRef.current?.querySelectorAll(FOCUSABLE) || []).filter((el) => el.offsetParent !== null);
        if (!els.length) return;
        const first = els[0];
        const lastEl = els[els.length - 1];
        if (e.shiftKey && (document.activeElement === first || document.activeElement === rootRef.current)) { e.preventDefault(); lastEl.focus(); }
        else if (!e.shiftKey && document.activeElement === lastEl) { e.preventDefault(); first.focus(); }
        return;
      }
      if (typing) return;
      if (e.key === 'ArrowRight' || e.key === 'PageDown') { e.preventDefault(); go(i + 1); }
      else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); go(i - 1); }
      else if (e.key === 'Home') { e.preventDefault(); go(0); }
      else if (e.key === 'End') { e.preventDefault(); go(last); }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [i, go, last, onClose]);

  const onTouchStart = (e) => { const t = e.touches[0]; touch.current = { x: t.clientX, y: t.clientY }; };
  const onTouchEnd = (e) => {
    const s = touch.current;
    touch.current = null;
    if (!s) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - s.x;
    const dy = t.clientY - s.y;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) go(i + (dx < 0 ? 1 : -1));
  };

  const canFull = typeof document !== 'undefined' && document.fullscreenEnabled;
  const toggleFull = () => {
    if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
    else rootRef.current?.requestFullscreen?.().catch(() => {});
  };

  return (
    <div ref={rootRef} role="dialog" aria-modal="true" aria-label="Why Holly, presentation" tabIndex={-1} className="wh-present">
      <div ref={stageRef} className="wh-stage" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        <div key={i} className={`wh-slide hg-slide-${dir}`}>
          {SLIDES[i].render({ present: true })}
        </div>
      </div>
      <div className="wh-sr" aria-live="polite">{`Slide ${i + 1} of ${SLIDES.length}: ${SLIDES[i].label}`}</div>
      <nav className="wh-bar" aria-label="Presentation controls">
        <button type="button" onClick={onClose} className="wh-bar-btn" aria-label="Exit presentation (Esc)">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><path d="M18 6L6 18M6 6l12 12" /></svg>
          <span className="wh-bar-txt">Exit</span>
        </button>
        <button type="button" onClick={() => go(i - 1)} disabled={i === 0} className="wh-bar-btn" aria-label="Previous slide">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6" /></svg>
          <span className="wh-bar-txt">Prev</span>
        </button>
        <div className="wh-dots">
          <div className="wh-dots-btns">
            {SLIDES.map((s, n) => (
              <button key={s.key} type="button" onClick={() => go(n)} aria-label={`Go to slide ${n + 1}: ${s.label}`} aria-current={n === i ? 'step' : undefined} className="wh-dotbtn">
                <span className={n === i ? 'is-on' : ''} />
              </button>
            ))}
          </div>
          <div className="wh-dots-passive" aria-hidden="true">
            {SLIDES.map((s, n) => <span key={s.key} className={n === i ? 'is-on' : n < i ? 'is-past' : ''} />)}
          </div>
          <div className="wh-count">{i + 1} / {SLIDES.length}</div>
        </div>
        {canFull && (
          <button type="button" onClick={toggleFull} className="wh-bar-btn wh-full" aria-label="Toggle full screen">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" /></svg>
          </button>
        )}
        <button type="button" onClick={() => (i === last ? onClose() : go(i + 1))} className="wh-bar-btn wh-next" aria-label={i === last ? 'Finish presentation' : 'Next slide'}>
          <span>{i === last ? 'Done' : 'Next'}</span>
          {i !== last && <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 18l6-6-6-6" /></svg>}
        </button>
      </nav>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────

export default function WhyHollyPage() {
  const [presenting, setPresenting] = useState(() => {
    try { return new URLSearchParams(window.location.search).get('present') === '1'; } catch { return false; }
  });

  useEffect(() => {
    window.scrollTo({ top: 0 });
    document.title = 'Why Holly | Selling your lake home with Holly Griewahn, Foundation Realty';
    let meta = document.querySelector('meta[name="description"]');
    let created = false;
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'description');
      document.head.appendChild(meta);
      created = true;
    }
    const prev = meta.getAttribute('content');
    meta.setAttribute('content', 'What a seller gets when Holly Griewahn lists their Irish Hills lake home: a price set from real closed sales, buyers answered in seconds, a seller update every Monday, and every sale on the record.');
    return () => {
      if (created) meta.remove();
      else if (prev !== null) meta.setAttribute('content', prev);
    };
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#fdf7f5', fontFamily: FONT, color: '#1c2b29' }}>
      <style>{CSS}</style>
      <SiteNav active="why" transparent textBody="Hi Holly, I'm thinking about selling my lake home." />

      <main>
        <Hero onPresent={() => setPresenting(true)} />
        <Proof />
        <Priorities />
        <SpeedDemo />
        <Compare />
        <LakePicker />
        <DayWeList />
        <MondayUpdate />
        <Found />
        <Questions />
        <Close />
      </main>

      <footer style={{ background: '#0e2d29', padding: '2rem', textAlign: 'center' }}>
        <p style={{ color: 'rgba(255,255,255,0.72)', fontSize: '0.82rem', margin: 0 }}>Holly Griewahn | Foundation Realty | Manitou Beach, Michigan</p>
      </footer>

      {presenting && <Presenter onClose={() => setPresenting(false)} />}
    </div>
  );
}

// ── styles ────────────────────────────────────────────────────────────────

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Source+Serif+4:ital,opsz,wght@0,8..60,400..800;1,8..60,400..600&family=Inter:wght@300..700&display=swap');
* { box-sizing: border-box; }
body { margin: 0; }
.wh-pending { opacity: 0; }
.wh-sr { position: absolute !important; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0; }

.wh-sec { padding: 4.5rem 1rem; background: #fdf7f5; color: #1c2b29; }
.wh-blush { background: #fbeae6; }
.wh-dark { background: linear-gradient(160deg, #1a554e 0%, #1d5f57 55%, #123f3a 100%); color: white; }
.wh-hero { padding-top: 7.5rem; padding-bottom: 4rem; }
.wh-wrap { max-width: 960px; margin: 0 auto; width: 100%; }
.wh-eyebrow { font-size: 0.78rem; font-weight: 800; letter-spacing: 1.4px; text-transform: uppercase; color: #ad3557; margin-bottom: 0.6rem; }
.wh-dark .wh-eyebrow { color: #f5b5c7; }
.wh-h1 { font-family: ${SERIF}; font-size: clamp(2.1rem, 6.4vw, 3.6rem); font-weight: 800; line-height: 1.1; margin: 0 0 1rem; color: white; max-width: 820px; }
.wh-h2 { font-family: ${SERIF}; font-size: clamp(1.7rem, 4.6vw, 2.5rem); font-weight: 750; line-height: 1.15; margin: 0 0 0.75rem; }
.wh-lede { font-size: 1.05rem; line-height: 1.6; color: #4a5654; margin: 0 0 1.75rem; max-width: 680px; }
.wh-dark .wh-lede { color: rgba(255,255,255,0.84); }
.wh-note { font-size: 0.95rem; line-height: 1.6; color: #4a5654; margin: 1.25rem 0 0; }
.wh-sub { font-size: 0.75rem; font-weight: 800; letter-spacing: 1px; text-transform: uppercase; color: #4a5654; margin: 1.25rem 0 0.5rem; }
.wh-sample-note { font-size: 0.8rem; color: rgba(255,255,255,0.78); margin: 1rem 0 0; }

.wh-btn { display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem; min-height: 48px; padding: 0.75rem 1.4rem; border-radius: 12px; font-family: ${FONT}; font-size: 1rem; font-weight: 700; text-decoration: none; cursor: pointer; border: 0; transition: transform 0.15s ease, box-shadow 0.15s ease; }
.wh-btn:active { transform: scale(0.97); }
.wh-btn:focus-visible, .wh-chip:focus-visible, .wh-qchip:focus-visible, .wh-bar-btn:focus-visible, .wh-dotbtn:focus-visible, .wh-select:focus-visible { outline: 3px solid #f5b5c7; outline-offset: 2px; }
.wh-btn-primary { background: #ad3557; color: white; box-shadow: 0 6px 18px rgba(173,53,87,0.28); }
.wh-btn-primary:hover { box-shadow: 0 8px 24px rgba(173,53,87,0.36); }
.wh-btn-ghost { background: rgba(255,255,255,0.1); color: white; border: 1px solid rgba(255,255,255,0.4); }
.wh-sec:not(.wh-dark) .wh-btn-ghost { background: transparent; color: #1a554e; border: 1.5px solid #1a554e; }
.wh-btn-outline { background: white; color: #1a554e; border: 1.5px solid #1a554e; }
.wh-btn-white { background: white; color: #1c2b29; }

.wh-tiles { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.75rem; }
.wh-tile { background: white; border: 1px solid #eeddd8; border-radius: 16px; padding: 1.1rem 0.9rem; }
.wh-tile-num { font-family: ${SERIF}; font-size: clamp(1.9rem, 5vw, 2.6rem); font-weight: 800; color: #1a554e; line-height: 1.05; }
.wh-tile-label { font-size: 0.8rem; font-weight: 600; color: #4a5654; margin-top: 0.35rem; line-height: 1.35; }
.wh-tiles-sm .wh-tile-num { font-size: clamp(1.5rem, 4vw, 2rem); }
@media (max-width: 760px) { .wh-tiles { grid-template-columns: repeat(2, 1fr); } }

.wh-rating { display: inline-flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; text-decoration: none; color: #4a5654; font-size: 0.9rem; font-weight: 600; min-height: 44px; }
.wh-rating-dark { color: rgba(255,255,255,0.86); margin-top: 2rem; }
.wh-rating-dark strong { color: white; }

.wh-pri-grid { display: grid; grid-template-columns: 1fr 260px; gap: 1.5rem; align-items: start; }
@media (max-width: 760px) { .wh-pri-grid { grid-template-columns: 1fr; } .wh-tally { order: -1; } }
.wh-chips { display: flex; flex-wrap: wrap; gap: 0.6rem; }
.wh-chip { display: inline-flex; align-items: center; gap: 0.55rem; min-height: 48px; padding: 0.55rem 1rem 0.55rem 0.6rem; border-radius: 30px; background: white; border: 1.5px solid #eeddd8; color: #1c2b29; font-family: ${FONT}; font-size: 0.98rem; font-weight: 600; cursor: pointer; transition: border-color 0.2s ease, background 0.2s ease, transform 0.15s ease; text-align: left; }
.wh-chip:active { transform: scale(0.97); }
.wh-chip.is-on { border-color: #1a554e; background: #eef5f4; }
.wh-chip-box { width: 24px; height: 24px; border-radius: 50%; border: 1.5px solid #b9c4c2; display: inline-grid; place-items: center; flex-shrink: 0; }
.wh-chip.is-on .wh-chip-box { border: 0; }
.wh-tally { display: flex; gap: 1rem; align-items: center; background: white; border: 1px solid #eeddd8; border-radius: 16px; padding: 1rem; }
.wh-answers { list-style: none; padding: 0; margin: 1.5rem 0 0; display: grid; gap: 0.6rem; }
.wh-answers li { background: white; border: 1px solid #eeddd8; border-radius: 14px; padding: 0.9rem 1rem; line-height: 1.55; font-size: 0.98rem; }
.wh-tag { display: inline-block; font-size: 0.75rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.6px; background: #e3efed; color: #1a554e; padding: 0.15rem 0.5rem; border-radius: 6px; margin-right: 0.5rem; vertical-align: 1px; }
.wh-tag-berry { background: #fbeae6; color: #ad3557; }

.wh-phones { display: flex; gap: 1.25rem; flex-wrap: wrap; justify-content: center; }
.wh-phone-cap { font-size: 0.78rem; font-weight: 800; letter-spacing: 1px; text-transform: uppercase; color: #f5b5c7; margin-bottom: 0.5rem; text-align: center; }
.wh-phone { position: relative; border-radius: 34px; border: 8px solid #0e2d29; min-height: 360px; padding: 1.4rem 0.8rem 1rem; box-shadow: 0 20px 50px rgba(0,0,0,0.3); color: #1c2b29; }
.wh-notch { position: absolute; top: 6px; left: 50%; transform: translateX(-50%); width: 72px; height: 18px; border-radius: 12px; background: #0e2d29; }
.wh-banner { background: rgba(255,255,255,0.95); border-radius: 14px; padding: 0.65rem 0.75rem; font-size: 0.85rem; line-height: 1.4; color: #1c2b29; }
.wh-banner-app { display: flex; justify-content: space-between; gap: 0.5rem; font-size: 0.75rem; font-weight: 700; color: #4a5654; margin-bottom: 0.2rem; }
.wh-banner-app span { font-weight: 600; }
.wh-sys { text-align: center; font-size: 0.75rem; color: #4a5654; margin-bottom: 0.75rem; }
.wh-in { background: #f1ecea; border-radius: 16px 16px 16px 4px; padding: 0.6rem 0.8rem; font-size: 0.85rem; line-height: 1.45; max-width: 92%; }
.wh-facts { list-style: none; padding: 0; margin: 1.75rem 0 0; display: grid; gap: 0.75rem; max-width: 720px; }
.wh-facts li { display: flex; gap: 0.7rem; align-items: flex-start; line-height: 1.55; color: rgba(255,255,255,0.92); }

.wh-table-wrap { background: white; border: 1px solid #eeddd8; border-radius: 18px; overflow: hidden; }
.wh-table { width: 100%; border-collapse: collapse; }
.wh-table thead th { text-align: left; padding: 0.9rem 1rem; font-size: 0.8rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px; border-bottom: 1px solid #eeddd8; }
.wh-th-holly { color: #1a554e; background: #eef5f4; }
.wh-th-them { color: #4a5654; }
.wh-table tbody th, .wh-table tbody td { padding: 0.9rem 1rem; border-bottom: 1px solid #f6e9e5; vertical-align: middle; text-align: left; }
.wh-table tbody tr:last-child th, .wh-table tbody tr:last-child td { border-bottom: 0; }
.wh-c-what { font-weight: 650; font-size: 0.98rem; line-height: 1.4; width: 42%; }
.wh-c-holly { background: #f6faf9; font-size: 0.92rem; font-weight: 600; color: #1a554e; width: 30%; }
.wh-c-holly a { color: #1a554e; }
.wh-c-them { font-size: 0.92rem; color: #4a5654; }
.wh-cell { display: inline-flex; align-items: center; gap: 0.55rem; line-height: 1.35; }
@media (max-width: 680px) {
  .wh-table thead { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0,0,0,0); }
  .wh-table, .wh-table tbody, .wh-table tr, .wh-table th, .wh-table td { display: block; width: 100%; }
  .wh-table tbody tr { padding: 0.9rem 1rem; border-bottom: 1px solid #f6e9e5; }
  .wh-table tbody th, .wh-table tbody td { padding: 0; border: 0; background: none; }
  .wh-c-what { margin-bottom: 0.6rem; }
  .wh-c-holly, .wh-c-them { display: grid !important; grid-template-columns: 112px 1fr; align-items: center; gap: 0.5rem; padding: 0.35rem 0 !important; }
  .wh-c-holly::before, .wh-c-them::before { content: attr(data-label); font-size: 0.75rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; color: #4a5654; }
}

.wh-picker { display: flex; flex-wrap: wrap; gap: 0.75rem; align-items: center; margin-bottom: 1.25rem; }
.wh-select { font-family: ${FONT}; font-size: 16px; font-weight: 600; min-height: 48px; padding: 0.6rem 2.4rem 0.6rem 0.9rem; border-radius: 12px; border: 1.5px solid #1a554e; background: white url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%231a554e' stroke-width='3' stroke-linecap='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E") no-repeat right 0.85rem center; color: #1c2b29; appearance: none; -webkit-appearance: none; max-width: 100%; }
.wh-quick { display: flex; flex-wrap: wrap; gap: 0.5rem; }
.wh-qchip { min-height: 44px; padding: 0.45rem 0.95rem; border-radius: 30px; border: 1.5px solid #eeddd8; background: white; font-family: ${FONT}; font-size: 0.9rem; font-weight: 600; color: #1c2b29; cursor: pointer; }
.wh-qchip.is-on { border-color: #1a554e; background: #1a554e; color: white; }
.wh-lake-card { background: white; border: 1px solid #eeddd8; border-radius: 18px; padding: 1.4rem; }
.wh-lake-card .wh-tile { background: #fdf7f5; }
.wh-lake-foot { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem 1.5rem; margin-top: 1.25rem; padding-top: 1.1rem; border-top: 1px solid #f6e9e5; font-size: 0.95rem; line-height: 1.55; color: #1c2b29; }
@media (max-width: 680px) { .wh-lake-foot { grid-template-columns: 1fr; } }

.wh-timeline { list-style: none; padding: 0 0 0 2rem; margin: 0.5rem 0 0; position: relative; }
.wh-line { position: absolute; left: 0.55rem; top: 0.4rem; bottom: 0.4rem; width: 3px; border-radius: 2px; background: linear-gradient(#e64774, #237168); }
.wh-timeline li { position: relative; padding: 0 0 1.5rem; }
.wh-dot { position: absolute; left: calc(-2rem + 0.2rem); top: 0.15rem; width: 17px; height: 17px; border-radius: 50%; background: white; border: 3px solid #e64774; }
.wh-when { font-size: 0.75rem; font-weight: 800; letter-spacing: 0.8px; text-transform: uppercase; color: #ad3557; }
.wh-step-title { font-weight: 750; font-size: 1.08rem; margin: 0.15rem 0 0.25rem; }
.wh-step-body { color: #4a5654; line-height: 1.6; font-size: 0.97rem; max-width: 620px; }

.wh-mail { background: white; border-radius: 18px; box-shadow: 0 18px 50px rgba(28,43,41,0.12); padding: 1.4rem; max-width: 620px; border-top: 6px solid #e64774; }
.wh-mail-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; padding-bottom: 1rem; border-bottom: 1px solid #f6e9e5; }
.wh-sample { font-size: 0.75rem; font-weight: 800; letter-spacing: 1px; text-transform: uppercase; background: #1a554e; color: white; padding: 0.3rem 0.6rem; border-radius: 6px; }
.wh-mail-tiles { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem; margin: 1rem 0 0.25rem; }
.wh-mtile { background: #fdf7f5; border-radius: 12px; padding: 0.7rem 0.6rem; text-align: center; }
.wh-mtile-num { font-family: ${SERIF}; font-size: 1.6rem; font-weight: 800; color: #1c2b29; }
.wh-mail-sec p { margin: 0; line-height: 1.6; color: #1c2b29; font-size: 0.97rem; }
.wh-approved { display: flex; align-items: center; gap: 0.5rem; margin-top: 1.25rem; padding-top: 1rem; border-top: 1px solid #f6e9e5; font-weight: 700; color: #1a554e; font-size: 0.92rem; }

.wh-tabs { display: flex; gap: 0.5rem; margin: 0.25rem 0 1.1rem; flex-wrap: wrap; }
.wh-tab { display: inline-flex; align-items: center; gap: 0.5rem; min-height: 44px; padding: 0.5rem 0.95rem 0.5rem 0.55rem; border-radius: 999px; border: 1.5px solid #eeddd8; background: white; color: #1c2b29; font: 700 0.92rem 'Inter', system-ui, sans-serif; cursor: pointer; transition: background 0.2s, border-color 0.2s, color 0.2s; }
.wh-tab:hover { border-color: #ad3557; }
.wh-tab:focus-visible { outline: 3px solid #237168; outline-offset: 2px; }
.wh-tab-n { display: inline-grid; place-items: center; width: 26px; height: 26px; border-radius: 50%; background: #fbeae6; color: #ad3557; font-size: 0.8rem; font-weight: 800; }
.wh-tab-on { background: #1a554e; border-color: #1a554e; color: white; }
.wh-tab-on .wh-tab-n { background: #f5b5c7; color: #1a554e; }
.wh-plan-lede { margin: 0 0 1rem; color: #4a5654; font-size: 1.02rem; line-height: 1.55; }
.wh-steps { list-style: none; padding: 0; margin: 0; display: grid; gap: 0.75rem; }
.wh-step { display: grid; grid-template-columns: 40px 1fr; gap: 0.9rem; align-items: start; background: white; border: 1px solid #eeddd8; border-radius: 16px; padding: 1rem 1.1rem; }
.wh-step-num { display: grid; place-items: center; width: 36px; height: 36px; border-radius: 50%; background: #e64774; color: white; font-family: ${SERIF}; font-weight: 800; font-size: 1.05rem; }
.wh-flink.wh-flink-light { color: #ad3557; }
.wh-plan-nav { display: flex; gap: 0.75rem; flex-wrap: wrap; margin-top: 1.1rem; }
@media (max-width: 520px) { .wh-tabs { flex-wrap: nowrap; gap: 0.35rem; } .wh-tab { flex: 1 1 0; justify-content: center; text-align: center; padding: 0.4rem 0.35rem; font-size: 0.82rem; line-height: 1.2; border-radius: 14px; } .wh-tab-n { display: none; } .wh-plan-nav .wh-btn { flex: 1 1 100%; } }

.wh-found { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.9rem; }
@media (max-width: 860px) { .wh-found { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 560px) { .wh-found { grid-template-columns: 1fr; } }
.wh-fcard { background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.14); border-radius: 16px; padding: 1.15rem; }
.wh-fcard-t { font-family: ${SERIF}; font-size: 1.2rem; font-weight: 700; color: white; margin-bottom: 0.4rem; }
.wh-fcard p { margin: 0; color: rgba(255,255,255,0.84); line-height: 1.55; font-size: 0.94rem; }
.wh-flink { display: inline-flex; align-items: center; min-height: 44px; color: #f5b5c7; font-weight: 700; font-size: 0.92rem; }

.wh-qlist { list-style: none; padding: 0; margin: 0; display: grid; gap: 0.6rem; }
.wh-qlist li { display: flex; align-items: flex-start; gap: 0.8rem; background: white; border: 1px solid #eeddd8; border-radius: 14px; padding: 0.85rem 1rem; }
.wh-qlist input { width: 24px; height: 24px; margin: 0.1rem 0 0; accent-color: #1a554e; flex-shrink: 0; cursor: pointer; }
.wh-qlist label { flex: 1; line-height: 1.5; font-size: 1rem; font-weight: 600; cursor: pointer; min-height: 28px; }
.wh-qlist input:checked + label { color: #4a5654; text-decoration: line-through; text-decoration-color: #e64774; text-decoration-thickness: 2px; }

/* Present mode */
.wh-present { position: fixed; inset: 0; z-index: 10000; display: flex; flex-direction: column; background: #fdf7f5; outline: none; font-family: ${FONT}; }
.wh-stage { flex: 1; min-height: 0; overflow-y: auto; display: flex; flex-direction: column; overscroll-behavior: contain; }
.wh-slide { flex: 1 0 auto; display: flex; flex-direction: column; }
.wh-slide > .wh-sec { flex: 1 0 auto; display: flex; flex-direction: column; justify-content: center; padding-top: 3rem; padding-bottom: 3rem; }
.wh-slide > .wh-hero { padding-top: 3rem; }
.wh-present .wh-h2 { font-size: clamp(2rem, 5.6vw, 3.2rem); }
.wh-present .wh-lede { font-size: clamp(1.05rem, 2.2vw, 1.3rem); }
.wh-bar { flex-shrink: 0; display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 0.75rem calc(0.5rem + env(safe-area-inset-bottom)); background: #0e2d29; color: white; }
.wh-bar-btn { display: inline-flex; align-items: center; justify-content: center; gap: 0.35rem; min-width: 48px; min-height: 48px; padding: 0 0.8rem; border-radius: 12px; border: 1px solid rgba(255,255,255,0.25); background: rgba(255,255,255,0.06); color: white; font-family: ${FONT}; font-size: 0.95rem; font-weight: 700; cursor: pointer; }
.wh-bar-btn:disabled { opacity: 0.4; cursor: default; }
.wh-next { background: #ad3557; border-color: #ad3557; padding: 0 1.1rem; }
.wh-dots { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 0.2rem; min-width: 0; }
.wh-dots-btns { display: flex; }
.wh-dotbtn { width: 36px; height: 44px; display: grid; place-items: center; background: none; border: 0; cursor: pointer; padding: 0; border-radius: 8px; }
.wh-dotbtn span, .wh-dots-passive span { display: block; width: 8px; height: 8px; border-radius: 50%; background: rgba(255,255,255,0.35); transition: width 0.25s ease, background 0.25s ease; }
.wh-dotbtn span.is-on, .wh-dots-passive span.is-on { width: 22px; border-radius: 5px; background: #f5b5c7; }
.wh-dots-passive span.is-past { background: rgba(245,181,199,0.6); }
.wh-dots-passive { display: none; gap: 4px; }
.wh-count { font-size: 0.75rem; font-weight: 700; color: rgba(255,255,255,0.78); }
@media (max-width: 720px) {
  .wh-dots-btns, .wh-full { display: none !important; }
  .wh-dots-passive { display: flex; }
  .wh-bar-txt { display: none; }
  .wh-present .wh-sec { padding-left: 1rem; padding-right: 1rem; }
}

@media (prefers-reduced-motion: reduce) {
  .wh-pending { opacity: 1 !important; }
  .wh-btn, .wh-chip, .wh-dotbtn span, .wh-dots-passive span { transition: none !important; }
}
`;
