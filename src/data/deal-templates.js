// Step templates for a transaction roadmap ("deal"). Shared by the desk (to
// build a new deal) and the API (to validate one).
//
// Every date is an OFFSET from one of two anchors: A = the day the offer was
// accepted, C = the closing date. The numbers are typical Lenawee County /
// Irish Hills timing, not law: Holly changes any of them to match the actual
// purchase agreement, and the desk says so next to the dates.
//
// `who` is who acts on the step, in the client's words:
//   you      the client does something
//   holly    Holly handles it
//   lender   the buyer's lender
//   title    the title company
//   both     a shared moment (offer accepted, closing day)
// `only` limits a step to a situation: 'financed' (dropped for cash buyers),
// 'lake' (added only for a lake home).

export const WHO = {
  you: 'You',
  holly: 'Holly',
  lender: 'Your lender',
  title: 'Title company',
  both: 'Everyone',
};

export const SIDES = {
  buyer: { label: 'Buying', title: 'Your purchase', closeDaysDefault: { financed: 45, cash: 30 } },
  seller: { label: 'Selling', title: 'Your sale', closeDaysDefault: { financed: 45, cash: 30 } },
};

const A = (days) => ({ from: 'A', days });
const C = (days) => ({ from: 'C', days });

export const BUYER_STEPS = [
  { id: 'accepted', title: 'Offer accepted', who: 'both', offset: A(0), remind: false,
    detail: 'The seller signed your offer. From here every date counts from this day.',
    action: 'Celebrate, then keep an eye on this page. Holly will text you before each deadline.' },
  { id: 'emd', title: 'Earnest money deposit', who: 'you', offset: A(2),
    detail: 'Your good-faith deposit goes to the title company or the broker\'s trust account and is credited back to you at closing.',
    action: 'Deliver the deposit by the date in your agreement. If you are wiring it, call the title company first to confirm the instructions by phone. Never trust wiring instructions that arrive by email alone.' },
  { id: 'loan-app', title: 'Loan application and paperwork', who: 'you', offset: A(3), only: 'financed',
    detail: 'Your lender needs a full application and documents to start underwriting.',
    action: 'Send your lender pay stubs, W-2s, two months of bank statements, and ID. Do not open new credit, change jobs, or move large sums between accounts until after closing.' },
  { id: 'inspection', title: 'Home inspection', who: 'you', offset: A(7),
    detail: 'A licensed inspector goes through the house, roof, electrical, plumbing and mechanicals. Your inspection period ends on the date in your agreement.',
    action: 'Book the inspector right away and attend if you can. Holly can recommend inspectors.' },
  { id: 'well-septic', title: 'Well and septic inspection', who: 'you', offset: A(7), only: 'lake',
    detail: 'Lake and country homes usually have a private well and septic system. A separate inspection checks the water and the drain field.',
    action: 'Schedule it alongside the home inspection so both results come back inside your inspection period.' },
  { id: 'inspection-response', title: 'Inspection response', who: 'both', offset: A(10),
    detail: 'You decide what, if anything, to ask the seller to fix or credit. Holly negotiates it.',
    action: 'Tell Holly what matters to you from the inspection report. She will write the request and bring back the seller\'s answer.' },
  { id: 'title-commitment', title: 'Title commitment', who: 'title', offset: A(14),
    detail: 'The title company searches the property\'s history and issues a commitment showing anything that must be cleared before closing.',
    action: 'Nothing to do unless Holly flags an item. You will get a copy for your records.' },
  { id: 'appraisal', title: 'Appraisal', who: 'lender', offset: A(18), only: 'financed',
    detail: 'Your lender orders an appraisal to confirm the home is worth the loan.',
    action: 'Nothing to do. Holly will let you know when it comes back.' },
  { id: 'insurance', title: 'Homeowners insurance', who: 'you', offset: A(21),
    detail: 'Your lender needs proof of insurance before closing, and you want it in place the day you own the home.',
    action: 'Get quotes now and send the policy binder to your lender and the title company. Lake homes may need a separate flood or dock rider; ask the agent.' },
  { id: 'loan-commitment', title: 'Loan commitment', who: 'lender', offset: C(-10), only: 'financed',
    detail: 'Underwriting approves your loan. This is the financing contingency date in your agreement.',
    action: 'Answer any last lender questions the same day you get them.' },
  { id: 'closing-disclosure', title: 'Closing Disclosure', who: 'lender', offset: C(-3), only: 'financed',
    detail: 'By law you receive the Closing Disclosure at least three business days before closing. It shows your final loan terms and the cash you bring.',
    action: 'Read it against your earlier Loan Estimate and ask Holly or your lender about anything that moved.' },
  { id: 'funds', title: 'Closing funds', who: 'you', offset: C(-2),
    detail: 'The title company tells you the exact amount to bring and how.',
    action: 'Arrange the wire or cashier\'s check. Call the title company at a number you already know to confirm the wire instructions before sending.' },
  { id: 'walkthrough', title: 'Final walk-through', who: 'you', offset: C(-1),
    detail: 'One last look at the home to confirm it is in the condition you agreed to and any repairs are done.',
    action: 'Walk through with Holly. Run the faucets, flip the lights, check the agreed repairs.' },
  { id: 'closing', title: 'Closing day', who: 'both', offset: C(0),
    detail: 'You sign at the title company. Once the deed records and funds are confirmed, the home is yours.',
    action: 'Bring a government photo ID. Plan on about an hour of signing.' },
  { id: 'keys', title: 'Keys and move-in', who: 'holly', offset: C(0), remind: false,
    detail: 'Holly hands over keys, openers and any dock or gate keys once the title company confirms funding.',
    action: 'Set up utilities in your name for closing day, and let Holly know if you want a photo at the door.' },
];

export const SELLER_STEPS = [
  { id: 'accepted', title: 'Offer accepted', who: 'both', offset: A(0), remind: false,
    detail: 'You accepted the buyer\'s offer. Every date below counts from today.',
    action: 'Keep this page handy. Holly will text you before each step.' },
  { id: 'emd', title: 'Buyer\'s deposit arrives', who: 'title', offset: A(2),
    detail: 'The buyer\'s earnest money goes to the title company or broker trust account. It is not your money until closing.',
    action: 'Nothing to do. Holly confirms when it is received.' },
  { id: 'lake-items', title: 'List what stays with the lake', who: 'you', offset: A(5), only: 'lake',
    detail: 'Dock sections, boat lift, hoist, shore station, canopy and anchors are often negotiated separately on a lake home.',
    action: 'Tell Holly exactly which lake items stay and which go so it is written down before the inspection.' },
  { id: 'inspection', title: 'Buyer\'s inspection', who: 'you', offset: A(7),
    detail: 'The buyer\'s inspector spends two to three hours at the house. You will be asked to be away.',
    action: 'Have the house clean, every light working, utilities on, pets out, and the well, septic lid, furnace and electrical panel easy to reach.' },
  { id: 'inspection-response', title: 'Inspection response', who: 'both', offset: A(10),
    detail: 'The buyer may ask for repairs or a credit. Holly negotiates it with you.',
    action: 'Holly will call you with the request and her read on it before you answer anything.' },
  { id: 'title-work', title: 'Title work and payoff', who: 'title', offset: A(14),
    detail: 'The title company searches the title and orders your mortgage payoff so it can be paid from your proceeds at closing.',
    action: 'Have your lender name and loan number ready for Holly. If anyone besides you is on the deed, tell her now.' },
  { id: 'appraisal', title: 'Appraisal visit', who: 'lender', offset: A(18), only: 'financed',
    detail: 'The buyer\'s lender sends an appraiser to confirm the value.',
    action: 'Treat it like a showing: tidy, lights on, and let Holly know of any upgrades the appraiser should hear about.' },
  { id: 'loan-commitment', title: 'Buyer\'s loan approved', who: 'lender', offset: C(-10), only: 'financed',
    detail: 'The buyer\'s financing contingency clears.',
    action: 'Nothing to do. This is the point where the sale is nearly certain.' },
  { id: 'utilities', title: 'Schedule utility transfers', who: 'you', offset: C(-7),
    detail: 'Electric, gas, propane, internet, trash and any lake association dues need to move out of your name as of closing day.',
    action: 'Call each provider to stop service on closing day. Do not shut anything off early; the buyer\'s walk-through needs power and water.' },
  { id: 'move-out', title: 'Move out, broom clean', who: 'you', offset: C(-1),
    detail: 'The home should be empty of everything that is not staying, and broom clean, before the buyer\'s final walk-through.',
    action: 'Leave manuals, warranties, spare keys, openers and any dock or lift hardware that stays. Take a few photos of the empty home for your records.' },
  { id: 'walkthrough', title: 'Buyer\'s final walk-through', who: 'both', offset: C(-1),
    detail: 'The buyer confirms the home is as agreed and repairs are done.',
    action: 'Be out of the house. Holly attends.' },
  { id: 'closing', title: 'Closing and proceeds', who: 'both', offset: C(0),
    detail: 'You sign the deed and closing papers at the title company. Your proceeds are wired after the deed records.',
    action: 'Bring a government photo ID, all keys, openers and codes. Tell the title company ahead of time where to wire your proceeds, and confirm it by phone.' },
];

// Plain-English labels for the three questions the desk asks when it makes a deal.
export const FINANCING = { financed: 'Mortgage', cash: 'Cash' };

export function templateSteps({ side = 'buyer', financing = 'financed', lakeHome = false } = {}) {
  const base = side === 'seller' ? SELLER_STEPS : BUYER_STEPS;
  return base
    .filter((s) => !(s.only === 'financed' && financing === 'cash'))
    .filter((s) => !(s.only === 'lake' && !lakeHome))
    .map((s) => ({ ...s }));
}

// YYYY-MM-DD arithmetic without timezone drift: treat the date as a UTC day.
export function addDays(iso, days) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(iso || ''))) return null;
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + Number(days || 0));
  return d.toISOString().slice(0, 10);
}

export function daysBetween(fromISO, toISO) {
  if (!fromISO || !toISO) return null;
  return Math.round((new Date(`${toISO}T00:00:00Z`) - new Date(`${fromISO}T00:00:00Z`)) / 86400000);
}

// Builds the dated step list for a new deal. Steps keep their offset so the
// desk can re-date everything when the closing date moves.
export function buildSteps({ side, financing, lakeHome, acceptedOn, closingOn }) {
  const close = closingOn || addDays(acceptedOn, (SIDES[side] || SIDES.buyer).closeDaysDefault[financing === 'cash' ? 'cash' : 'financed']);
  return templateSteps({ side, financing, lakeHome }).map((s) => ({
    id: s.id,
    title: s.title,
    who: s.who,
    detail: s.detail,
    action: s.action,
    remind: s.remind !== false,
    offset: s.offset,
    date: s.offset.from === 'C' ? addDays(close, s.offset.days) : addDays(acceptedOn, s.offset.days),
    done: s.id === 'accepted',
    doneOn: s.id === 'accepted' ? acceptedOn : null,
    note: '',
    link: null,
  }));
}

// Re-dates every step that still follows its template offset. Steps Holly
// dated by hand (offset: null) are left alone.
export function redate(steps, { acceptedOn, closingOn }) {
  return steps.map((s) => {
    if (!s.offset) return s;
    const anchor = s.offset.from === 'C' ? closingOn : acceptedOn;
    return anchor ? { ...s, date: addDays(anchor, s.offset.days) } : s;
  });
}
