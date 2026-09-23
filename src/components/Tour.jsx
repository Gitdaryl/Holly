import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { propertiesData } from '../data/amenities';

// Guided tour of the site for Holly. Each step names a page and a target;
// the tour navigates there, spotlights the element, and explains it in a
// callout with Next / Back. Runs across real pages (admin, lake, report,
// listing, home) so she sees the live thing, not a mockup. Starts on her
// first sign-in to the desk, replays from the "Take the tour" button.

const firstActive = propertiesData.find((p) => String(p.status || 'active') === 'active' && p.image) || propertiesData[0];

export const STEPS = [
  { path: '/admin?tab=inbox', target: '[data-tour="desk"]', title: 'This is your desk',
    text: 'Every lead from the site lands here: showing requests, home-value asks, lake waitlists, chat, the contact form. Newest at the top. Each one also texts your phone the moment it arrives, so this is the place you come back to, not the place you find out.' },
  { path: '/admin?tab=inbox', target: '[data-tour="status"]', title: 'One tap per lead',
    text: 'Flip a lead to Called, Showing set, Client or Dead. New leads you have not touched nudge you by text after an hour and again after a day; changing the status is what stops the nudges. Flip someone to Client and an "Ask for a review" button appears.', optional: true },
  { path: '/admin?tab=texts', target: '[data-tour="tab-texts"]', title: 'Texts, both directions',
    text: 'Your site number is 517-300-8226. Anyone who texts it shows up here as a conversation, and you can answer from this page as Holly. The auto-replies the site sends are here too, so you always see what the lead has already been told. Missed calls and voicemails land in the same thread.' },
  { path: '/admin?tab=waitlist', target: '[data-tour="tab-waitlist"]', title: 'Buyers waiting, by lake',
    text: 'People who signed up for first look on a lake. This is the number you say out loud at a listing appointment: "I have nine buyers registered for Round Lake." Tap a lake to see who, tap a name to call.' },
  { path: '/admin?tab=listings', target: '[data-tour="tab-listings"]', title: 'Your listings this week',
    text: 'Views, saves, showing requests and buyers-on-the-lake for each active listing. "Your report" is the full picture with buyer names; "Copy seller link" is the counts-only version you can send. Every Friday a finished seller report is emailed to you with a one-click send button, so sellers hear from you weekly without you writing anything.' },
  { path: '/admin?tab=stats', target: '[data-tour="tab-stats"]', title: 'Where to look',
    text: 'Visitors, what they read, where they came from, and what they did. The top of this tab is a short list of things worth your attention: a lead waiting too long, a lake page people read but nobody signs up on, a listing with lookers and no showings. Read the list, ignore the rest.' },
  // Everything from here on leaves the desk and walks the public site, so the
  // tour asks first. Holly's demo ended up on her own homepage because these
  // steps navigated away without warning.
  { path: '/lakes/devils-lake', target: '[data-tour="track-record"]', title: 'Every lake page carries your record', site: true,
    text: 'Sold here, days to sell, what is for sale now. When a seller on Devils Lake Googles the lake, this is what they find. It fills in automatically as sales are added.' },
  { path: '/lakes/devils-lake', target: '#waitlist', title: 'Get first look', site: true,
    text: 'Buyers register here. They get a text from your number within seconds, you get a text with their budget and timing, and they hear from you again on day 3 and day 14 unless you have already talked. Sellers love hearing that buyers are waiting; this is where those buyers come from.' },
  { path: '/market/devils-lake', target: '[data-tour="sold-map"]', title: 'Lake sales reports', site: true,
    text: 'One page per lake with your sales on it: median, range, days to sell, closings by month, and a map. Pink pins are this lake, grey pins are the rest of your year. Hover a pin for the sale. Satellite button top right if you want the shoreline.' },
  { path: '/market/devils-lake', target: '#waitlist', title: 'Owners sign up here', site: true,
    text: 'An owner who asks for updates on their lake is a future listing. They get "Holly texts you when a Devils Lake home sells or lists" and you get their street and whether they are thinking of selling. Call those, do not just text.' },
  { path: `/property/${firstActive.slug}`, target: '#request-tour', title: 'A listing page that works for you', site: true,
    text: 'Request a showing goes to your phone and to the desk within seconds; the buyer gets a confirmation text from your number. Save this home tells us who is coming back. Both feed the seller report. Every listing also gets an aerial or your photos, the numbers, and the map.' },
  { path: '/sold', target: '[data-tour="sold-tiles"]', title: 'Sold never disappears', site: true,
    text: 'Every closed sale stays on the site with the two numbers a seller cares about: how fast and for how much. This is the page to text a seller the night before an appointment. Mark a listing sold and it moves here on its own.' },
  { path: '/plan', target: '[data-tour="plan-builder"]', title: 'The night-before link', site: true,
    text: 'Type the address and the lake, copy the link, text it to the seller before you meet. They open a page built for their house: how many buyers are waiting on their lake, what you sold there, what happens the day you list, and a sample of the Friday report. Nothing to save; the link builds the page.' },
  { path: '/', target: '[data-tour="reviews"]', title: 'Your Google reviews, live', site: true,
    text: 'Your 5.0 rating and newest reviews pull straight from Google, so the site never shows a stale quote. The rating also sits on every listing page next to your name. Keep asking at closing; the desk has a one-tap review text for that.' },
  { path: '/', target: '[aria-label^="Chat with Heather"]', title: 'Heather knows what you know', site: true,
    text: 'Heather is your assistant on the site, named by you. Heather answers from the same data the site shows: every lake, your listings, your sales, and will not invent a price or a listing. When someone wants you, Heather takes their name and number and they land in your desk. Ask Heather something on your own phone; you will see.' },
  { path: '/admin?tab=inbox', target: '[data-tour="desk"]', title: 'What runs by itself',
    text: 'Leads text you and get an auto-reply. Untouched leads nudge you. Waitlist buyers and home-value askers get follow-ups on a schedule. Sellers get a Friday report. Calls to the site number ring your cell and take a voicemail with a transcript. Reviews, sold pages, lake reports and the chat update from the data. You answer the phone and go to appointments. That is the whole job.' },
];

const KEY = 'hg-tour-step';
const SEEN = 'hg-tour-seen';

export function startTour() {
  try { sessionStorage.setItem(KEY, '0'); } catch { /* ignore */ }
  window.dispatchEvent(new Event('hg-tour'));
}

export default function Tour() {
  const location = useLocation();
  const navigate = useNavigate();
  const [step, setStep] = useState(() => { try { const v = sessionStorage.getItem(KEY); return v === null ? null : Number(v); } catch { return null; } });
  const [rect, setRect] = useState(null);
  const timer = useRef(null);

  useEffect(() => {
    const on = () => { try { const v = sessionStorage.getItem(KEY); setStep(v === null ? null : Number(v)); } catch { /* ignore */ } };
    window.addEventListener('hg-tour', on);
    return () => window.removeEventListener('hg-tour', on);
  }, []);

  const go = useCallback((n) => {
    if (n === null || n < 0 || n >= STEPS.length) {
      try { sessionStorage.removeItem(KEY); localStorage.setItem(SEEN, '1'); } catch { /* ignore */ }
      setStep(null); setRect(null);
      // Always land back where the tour started, never stranded on a public page.
      if (window.location.pathname !== '/admin') navigate('/admin');
      return;
    }
    try { sessionStorage.setItem(KEY, String(n)); } catch { /* ignore */ }
    setStep(n); setRect(null);
  }, [navigate]);

  // Navigate to the step's page, then find and measure the target.
  useEffect(() => {
    if (step === null) return;
    const s = STEPS[step];
    const here = location.pathname + location.search;
    if (here !== s.path) { navigate(s.path); return; }
    let tries = 0;
    clearInterval(timer.current);
    timer.current = setInterval(() => {
      const el = document.querySelector(s.target);
      tries += 1;
      if (el) {
        clearInterval(timer.current);
        el.scrollIntoView({ block: 'center', behavior: 'smooth' });
        setTimeout(() => setRect(el.getBoundingClientRect()), 450);
      } else if (tries > 20) {
        clearInterval(timer.current);
        setRect('none');
      }
    }, 150);
    return () => clearInterval(timer.current);
  }, [step, location.pathname, location.search, navigate]);

  useEffect(() => {
    if (step === null) return;
    const onResize = () => { const el = document.querySelector(STEPS[step].target); if (el) setRect(el.getBoundingClientRect()); };
    window.addEventListener('resize', onResize); window.addEventListener('scroll', onResize, true);
    return () => { window.removeEventListener('resize', onResize); window.removeEventListener('scroll', onResize, true); };
  }, [step]);

  if (step === null) return null;
  const s = STEPS[step];
  const leavingDesk = !s.site && STEPS[step + 1]?.site;
  const onSite = Boolean(s.site);
  const has = rect && rect !== 'none';
  const pad = 10;
  const vw = window.innerWidth, vh = window.innerHeight;
  const cardW = Math.min(360, vw - 32);
  // Callout below the target when there is room, otherwise above, otherwise centered.
  let top, left;
  if (has) {
    const below = rect.bottom + pad + 12;
    const above = rect.top - pad - 12;
    left = Math.max(16, Math.min(vw - cardW - 16, rect.left + rect.width / 2 - cardW / 2));
    if (vh - below > 240) top = below;
    else if (above > 240) top = above - 220;
    else { top = Math.max(16, vh / 2 - 110); left = 16; }
  } else { top = Math.max(16, vh / 2 - 130); left = Math.max(16, vw / 2 - cardW / 2); }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, fontFamily: "'Inter', system-ui, sans-serif" }}>
      {has ? (
        <div style={{ position: 'fixed', top: rect.top - pad, left: rect.left - pad, width: rect.width + pad * 2, height: rect.height + pad * 2, borderRadius: '14px', boxShadow: '0 0 0 9999px rgba(10,38,35,0.62), 0 0 0 3px #e64774', pointerEvents: 'none', transition: 'all 0.3s ease' }} />
      ) : (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,38,35,0.62)' }} />
      )}
      <div style={{ position: 'fixed', top, left, width: cardW, background: 'white', borderRadius: '16px', padding: '1.1rem 1.2rem', boxShadow: '0 20px 60px rgba(0,0,0,0.35)', color: '#1c2b29' }}>
        <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#e64774', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.35rem' }}>Tour · {step + 1} of {STEPS.length}</div>
        <div style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem', lineHeight: 1.25 }}>{s.title}</div>
        <p style={{ fontSize: '0.88rem', lineHeight: 1.6, color: '#4a5654', margin: 0 }}>{s.text}</p>
        {rect === 'none' && <p style={{ fontSize: '0.75rem', color: '#98a3a1', marginTop: '0.5rem' }}>(Nothing to point at yet on this page; it appears once there is data.)</p>}
        {leavingDesk && <p style={{ fontSize: '0.8rem', color: '#66706e', marginTop: '0.6rem', lineHeight: 1.5 }}>That is your desk. The rest of the tour leaves it and walks the public side of your site. You can stop here and come back to it any time.</p>}
        {onSite && <p style={{ fontSize: '0.75rem', color: '#98a3a1', marginTop: '0.5rem' }}>You are on the public side of your site now. <a href="/admin" style={{ color: '#e64774', fontWeight: 700 }}>Back to your desk</a></p>}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.9rem' }}>
          <button onClick={() => go(null)} style={{ background: 'none', border: 'none', color: '#98a3a1', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', padding: 0, whiteSpace: 'nowrap' }}>{leavingDesk ? 'Stop here' : 'Skip tour'}</button>
          <div style={{ flex: 1, display: 'flex', gap: '3px', justifyContent: 'center' }}>
            {STEPS.map((_, i) => <span key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: i === step ? '#e64774' : i < step ? '#1c2b29' : '#eeddd8' }} />)}
          </div>
          {step > 0 && <button onClick={() => go(step - 1)} style={{ background: 'white', border: '1px solid #eeddd8', color: '#1c2b29', padding: '0.5rem 0.8rem', borderRadius: '9px', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', fontFamily: 'inherit' }}>Back</button>}
          <button onClick={() => go(step + 1)} style={{ background: '#e64774', border: 'none', color: 'white', padding: '0.5rem 1rem', borderRadius: '9px', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', fontFamily: 'inherit' }}>{step === STEPS.length - 1 ? 'Done' : leavingDesk ? 'Show me the site' : 'Next'}</button>
        </div>
      </div>
    </div>
  );
}
