// Holly's stationery: the letters she sends around an offer, a contract and a
// closing, in her voice, on her letterhead. One list of templates, shared by
// the desk (fill in, preview, print, text) and the API (email).
//
// A template turns a few fields into LETTER TEXT in a tiny markup that Holly
// can edit by hand before sending:
//   blank line        new paragraph
//   # Heading         a heading
//   - item            a bulleted list (consecutive lines)
//   > note            a highlighted box
//   Label :: value    a two-column row (consecutive lines make a table)
// src/lib/letter-html.js renders that text to email-safe HTML and plain text.
//
// Writing rules, because many of her clients are older or new to all of this:
// short sentences, one idea each, no jargon without a plain-words line, and
// the "what to do now" always in its own list. Dollar amounts and dates
// are spelled out. Nothing here is legal advice; the forms say what they say.

export const TERMS = {
  'earnest money': 'A good-faith deposit the buyer puts down after the offer is accepted. It is held by the title company and counts toward the purchase at closing.',
  contingency: 'A condition that has to be met for the sale to go through, like a passing inspection or an approved loan. If it is not met, the buyer can usually walk away and get the deposit back.',
  'pre-approval': 'A letter from a lender saying how much they expect to lend the buyer, based on a real look at income and credit.',
  appraisal: 'An independent opinion of what the home is worth, ordered by the buyer\'s lender to make sure the loan is not more than the home.',
  'title company': 'The neutral office that checks the ownership records, holds the deposit, handles the money, and runs the closing.',
  'closing': 'The meeting where papers are signed, money changes hands, and ownership transfers. In Michigan it is usually at the title company.',
  'seller concession': 'Money the seller agrees to put toward the buyer\'s closing costs instead of lowering the price.',
  'counter-offer': 'A reply to an offer that changes one or more terms. It replaces the original offer; the other side can accept it, decline it, or counter again.',
  'walk-through': 'A last look at the home, usually the day before closing, to confirm it is in the condition that was agreed to.',
  'possession': 'The day the buyer gets the keys and can move in. It is often closing day, but it can be later if the contract says so.',
  'inspection period': 'The number of days after acceptance that the buyer has to inspect the home and decide whether to go ahead, ask for repairs, or walk away.',
};

const money = (v) => {
  const n = Number(String(v || '').replace(/[^\d.]/g, ''));
  return n > 0 ? `$${Math.round(n).toLocaleString('en-US')}` : '';
};
export const longDate = (iso) => (/^\d{4}-\d{2}-\d{2}$/.test(String(iso || '')) ? new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' }) : String(iso || ''));
const first = (name) => String(name || '').trim().split(/\s+and\s+|,|&/)[0].trim().split(' ')[0] || 'there';
const or = (v, fallback) => (String(v || '').trim() ? String(v).trim() : fallback);
const lines = (v) => String(v || '').split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
const fin = (v) => (v === 'cash' ? 'Cash, no loan needed' : 'A mortgage, with a pre-approval letter from the lender');

// Field types: text, textarea, money, date, select, phone, email.
// `deal` names the roadmap field that prefills this one when Holly picks a deal.
const F = {
  clientName: { key: 'clientName', label: 'Client name(s)', ph: 'Who the letter is to, as you say it to them', deal: 'clientName', req: true },
  to: { key: 'to', label: 'Send to (email)', ph: 'Their email address', type: 'email', deal: 'clientEmail' },
  phone: { key: 'phone', label: 'Their cell', ph: 'Their cell number', type: 'phone', deal: 'clientPhone' },
  address: { key: 'address', label: 'Property address', ph: 'Street address and town', deal: 'address', req: true },
  price: { key: 'price', label: 'Price', ph: 'Dollar amount', type: 'money', deal: 'price' },
  financing: { key: 'financing', label: 'How it is paid', type: 'select', options: [['financed', 'Mortgage'], ['cash', 'Cash']], deal: 'financing' },
  earnest: { key: 'earnest', label: 'Earnest money', ph: 'Dollar amount of the deposit', type: 'money' },
  closingOn: { key: 'closingOn', label: 'Closing date', type: 'date', deal: 'closingOn' },
  inspectionDays: { key: 'inspectionDays', label: 'Inspection period (days)', ph: 'Number of days', type: 'text' },
  included: { key: 'included', label: 'What is included', ph: 'One per line: appliances, dock sections, boat lift, and so on', type: 'textarea' },
  expires: { key: 'expires', label: 'Offer good until', ph: 'Day and time, as written on the offer' },
  roadmap: { key: 'roadmap', label: 'Roadmap link', ph: 'Paste the client\'s roadmap link (Deals tab, Copy link)', deal: 'link' },
  hollyNote: { key: 'hollyNote', label: 'Your personal line', ph: 'One or two sentences in your own words. This goes near the top.', type: 'textarea' },
  lender: { key: 'lender', label: 'Lender', ph: 'Lender name', deal: 'lender' },
  titleCompany: { key: 'titleCompany', label: 'Title company', ph: 'Title company name', deal: 'titleCompany' },
  titlePhone: { key: 'titlePhone', label: 'Title company phone', ph: 'The number the client should call to confirm wire instructions', type: 'phone' },
};

const CLOSE = (f) => `Call or text me any time with questions, big or small. That is what I am here for.\n\nHolly`;
const WHO = (f) => `Dear ${or(f.clientName, 'friend')},`;

export const TEMPLATES = [
  {
    id: 'offer-cover', group: 'Offers', name: 'Offer cover letter', audience: 'The listing agent, with your buyer\'s offer',
    when: 'Goes on top of a buyer\'s offer so the other side sees the terms at a glance and who these buyers are.',
    fields: [
      { key: 'listingAgent', label: 'Listing agent', ph: 'Agent\'s name', req: true },
      { key: 'buyerNames', label: 'Your buyers', ph: 'Buyer name(s)', req: true, deal: 'clientName' },
      F.address, F.price, F.financing, F.earnest, F.closingOn, F.inspectionDays, F.included, F.expires,
      { key: 'about', label: 'About these buyers', ph: 'Two or three sentences the seller would like to hear: who they are, why this home, how ready they are.', type: 'textarea' },
    ],
    terms: ['earnest money', 'contingency', 'pre-approval'],
    subject: (f) => `Offer on ${f.address} from ${f.buyerNames}`,
    text: (f) => [
      `Dear ${or(f.listingAgent, 'colleague')},`,
      `Please find attached an offer on ${f.address} from my buyers, ${f.buyerNames}. The terms are summarized below so your sellers can see them at a glance.`,
      `Price :: ${money(f.price) || 'See offer'}\nPaid by :: ${fin(f.financing)}\nEarnest money :: ${money(f.earnest) || 'See offer'}\nClosing :: ${f.closingOn ? longDate(f.closingOn) : 'See offer'}\nInspection period :: ${or(f.inspectionDays, 'See offer')}${/^\d+$/.test(String(f.inspectionDays || '').trim()) ? ' days' : ''}\nGood until :: ${or(f.expires, 'See offer')}`,
      lines(f.included).length ? `# Included in the offer\n${lines(f.included).map((l) => `- ${l}`).join('\n')}` : '',
      f.about ? `# About the buyers\n${f.about}` : '',
      `I am glad to walk your sellers through any part of this. Thank you for your time with it, and for taking good care of the home.`,
      `Warm regards,\n\nHolly`,
    ],
    sms: (f) => `Hi, Holly Griewahn here. I just sent over an offer on ${f.address} from ${f.buyerNames}${money(f.price) ? ` at ${money(f.price)}` : ''}. Happy to walk your sellers through it. Call or text me any time.`,
  },
  {
    id: 'offer-explained', group: 'Offers', name: 'Your offer, explained', audience: 'Your buyer, right after you write the offer',
    when: 'So your buyer knows exactly what they are signing and what happens next, without a phone call at 10pm.',
    fields: [F.clientName, F.to, F.phone, F.address, F.price, F.financing, F.earnest, F.closingOn, F.inspectionDays, F.expires, F.hollyNote],
    terms: ['earnest money', 'contingency', 'inspection period', 'counter-offer'],
    subject: (f) => `Your offer on ${f.address}, in plain words`,
    text: (f) => [
      WHO(f),
      f.hollyNote || `Here is your offer on ${f.address}, in plain words, so there are no surprises.`,
      `# What we are offering`,
      `Price :: ${money(f.price) || 'As written on the offer'}\nPaid by :: ${fin(f.financing)}\nEarnest money :: ${money(f.earnest) || 'As written on the offer'}\nClosing :: ${f.closingOn ? longDate(f.closingOn) : 'As written on the offer'}\nInspection period :: ${or(f.inspectionDays, 'As written')}${/^\d+$/.test(String(f.inspectionDays || '').trim()) ? ' days after they accept' : ''}\nThe seller has until :: ${or(f.expires, 'See the offer')}`,
      `# What happens next`,
      `- The seller can accept, say no, or come back with changes (a counter-offer). I will call you the moment I hear.\n- If they accept, your earnest money is due within a few days. I will tell you exactly where it goes and how.\n- Your offer does not lock you in blindly. The inspection and loan conditions are there to protect you.`,
      `# What to do now`,
      `- Sign the offer where I have marked it. It only becomes real once you sign.\n- Keep your phone close${or(f.expires, '') ? ` until ${f.expires}` : ''}.\n- Do not open new credit or move large sums between accounts until we close.`,
      `> If any line of this is unclear, call me before you sign. I would rather explain it twice than have you guess once.`,
      CLOSE(f),
    ],
    sms: (f) => `Hi ${first(f.clientName)}, Holly here. Your offer on ${f.address}${money(f.price) ? ` at ${money(f.price)}` : ''} is written up. I sent you a one-page letter that explains every line in plain words. Sign where marked and keep your phone close. Questions, just reply.`,
  },
  {
    id: 'offer-received', group: 'Offers', name: 'An offer came in', audience: 'Your seller, when an offer lands',
    when: 'Lays the offer out in plain words with your read and their three choices, so the decision call is short.',
    fields: [F.clientName, F.to, F.phone, F.address, F.price, F.financing, F.earnest, F.closingOn, F.inspectionDays, F.included, F.expires,
      { key: 'asks', label: 'What the buyer is asking for', ph: 'One per line: seller concession, home warranty, the boat lift, and so on', type: 'textarea' },
      { key: 'read', label: 'Your read on it', ph: 'Two or three sentences: how this offer compares, how solid the buyer looks, what you would do.', type: 'textarea' }],
    terms: ['earnest money', 'contingency', 'appraisal', 'seller concession', 'counter-offer'],
    subject: (f) => `An offer on ${f.address}`,
    text: (f) => [
      WHO(f),
      `Good news: an offer came in on ${f.address}. Here it is in plain words, then my read, then your choices.`,
      `# The offer`,
      `Price :: ${money(f.price) || 'See the offer'}\nPaid by :: ${fin(f.financing)}\nEarnest money :: ${money(f.earnest) || 'See the offer'}\nClosing :: ${f.closingOn ? longDate(f.closingOn) : 'See the offer'}\nInspection period :: ${or(f.inspectionDays, 'See the offer')}${/^\d+$/.test(String(f.inspectionDays || '').trim()) ? ' days' : ''}\nWe must answer by :: ${or(f.expires, 'See the offer')}`,
      lines(f.asks).length ? `# What the buyer is asking for\n${lines(f.asks).map((l) => `- ${l}`).join('\n')}` : '',
      lines(f.included).length ? `# What they expect to stay with the home\n${lines(f.included).map((l) => `- ${l}`).join('\n')}` : '',
      f.read ? `# My read\n${f.read}` : '',
      `# Your three choices`,
      `- Accept it as written. We sign and the clock starts.\n- Counter it. We change the price, the dates, or what stays, and send it back. They can accept, decline, or counter again.\n- Decline it. No reply is needed beyond a no, and we keep showing the home.`,
      `> Nothing is decided until you sign. Call me and we will talk it through; this usually takes ten minutes.`,
      CLOSE(f),
    ],
    sms: (f) => `Hi ${first(f.clientName)}, Holly here. An offer just came in on ${f.address}${money(f.price) ? ` at ${money(f.price)}` : ''}. I sent you a one-page letter with the terms in plain words and my read. Call me when you have read it${or(f.expires, '') ? `; we need to answer by ${f.expires}` : ''}.`,
  },
  {
    id: 'counter', group: 'Offers', name: 'Counter-offer, explained', audience: 'Your buyer or seller, when a counter comes back',
    when: 'Shows exactly what changed and what did not, so the client is not re-reading the whole contract.',
    fields: [F.clientName, F.to, F.phone, F.address,
      { key: 'changes', label: 'What changed', ph: 'One per line, as "was X, now Y": price was $425,000, now $435,000', type: 'textarea', req: true },
      { key: 'same', label: 'What stayed the same', ph: 'One per line', type: 'textarea' },
      F.expires,
      { key: 'read', label: 'What I would do', ph: 'Your recommendation in two sentences.', type: 'textarea' }],
    terms: ['counter-offer', 'contingency'],
    subject: (f) => `The counter-offer on ${f.address}`,
    text: (f) => [
      WHO(f),
      `A counter-offer came back on ${f.address}. A counter replaces the last offer, so only the lines below are different. Everything else stands.`,
      `# What changed\n${lines(f.changes).map((l) => `- ${l}`).join('\n')}`,
      lines(f.same).length ? `# What stayed the same\n${lines(f.same).map((l) => `- ${l}`).join('\n')}` : '',
      f.read ? `# What I would do\n${f.read}` : '',
      `# Your choices`,
      `- Accept the counter. We sign and move on.\n- Counter back. We change what we need to and send it over.\n- Walk away. No harm done.`,
      `> We need to answer by ${or(f.expires, 'the time written on the counter')}. Call me and we will decide together.`,
      CLOSE(f),
    ],
    sms: (f) => `Hi ${first(f.clientName)}, Holly here. A counter came back on ${f.address}. I sent you a short letter showing exactly what changed. Call me when you have it in front of you${or(f.expires, '') ? `; we answer by ${f.expires}` : ''}.`,
  },
  {
    id: 'accepted', group: 'Under contract', name: 'Offer accepted', audience: 'Your client, the day it is accepted',
    when: 'Congratulations, the roadmap link, and the first three things that happen, all in one note they will keep.',
    fields: [F.clientName, F.to, F.phone, F.address, F.closingOn, F.earnest, F.roadmap, F.lender, F.titleCompany, F.hollyNote],
    terms: ['earnest money', 'title company', 'inspection period'],
    subject: (f) => `It's accepted: ${f.address}`,
    text: (f) => [
      WHO(f),
      f.hollyNote || `Congratulations. Your offer on ${f.address} was accepted${f.closingOn ? `, and we are set to close on ${longDate(f.closingOn)}` : ''}.`,
      f.roadmap ? `# Your roadmap\nEvery step from here to the keys, with its date and what to do, is on one page made just for you. Save this link on your phone:\n${f.roadmap}\nI will text you before each deadline, and you can ask me questions right on that page.` : '',
      `# The first three things`,
      `- Earnest money${money(f.earnest) ? ` of ${money(f.earnest)}` : ''} is due within a few days. It goes to ${or(f.titleCompany, 'the title company')}. I will tell you exactly how; please never wire money from instructions that only arrived by email.\n- Your home inspection gets booked this week. I can recommend inspectors.\n- ${or(f.lender, 'Your lender')} will ask for paperwork. Send it the same day you get the request; that is what keeps the closing date.`,
      `> Until closing: no new credit cards, no new car, no job change, no big money moves without a quick call to me first. Lenders check again right before closing.`,
      CLOSE(f),
    ],
    sms: (f) => `${first(f.clientName)}, it's accepted! ${f.address} is under contract${f.closingOn ? `, closing ${longDate(f.closingOn)}` : ''}. Your roadmap with every step and date: ${or(f.roadmap, '(link to follow)')} I'll text you before each deadline. Holly`,
  },
  {
    id: 'inspection-ask', group: 'Under contract', name: 'Inspection results and our ask', audience: 'Your buyer, after the inspection',
    when: 'What the inspector found, what you are asking the seller for, and the deadline.',
    fields: [F.clientName, F.to, F.phone, F.address,
      { key: 'findings', label: 'What the inspector found', ph: 'One per line, biggest first, in plain words', type: 'textarea', req: true },
      { key: 'asks', label: 'What we are asking the seller for', ph: 'One per line: repair, credit, or price change', type: 'textarea', req: true },
      F.expires, F.hollyNote],
    terms: ['inspection period', 'contingency', 'seller concession'],
    subject: (f) => `Inspection results for ${f.address} and what we are asking`,
    text: (f) => [
      WHO(f),
      f.hollyNote || `The inspection on ${f.address} is done. Here is what was found, what I suggest we ask for, and what happens next. The full report is attached or linked separately.`,
      `# What the inspector found\n${lines(f.findings).map((l) => `- ${l}`).join('\n')}`,
      `# What we are asking the seller for\n${lines(f.asks).map((l) => `- ${l}`).join('\n')}`,
      `# What happens next`,
      `- The seller can agree, offer something different, or say no.\n- If we cannot agree${or(f.expires, '') ? ` by ${f.expires}` : ' inside the inspection period'}, you can still walk away and get your earnest money back. That is what the inspection condition is for.\n- Most of the time we land somewhere in the middle. I will keep you posted the same day anything moves.`,
      `> Tell me if anything on the list matters more or less to you than I have assumed. This is your home, not a checklist.`,
      CLOSE(f),
    ],
    sms: (f) => `Hi ${first(f.clientName)}, Holly here. The inspection on ${f.address} is done. I sent you a short letter with what was found and what I suggest we ask the seller for. Read it and call me${or(f.expires, '') ? `; we answer by ${f.expires}` : ''}.`,
  },
  {
    id: 'inspection-request', group: 'Under contract', name: 'The buyer\'s repair request', audience: 'Your seller, when the buyer asks for repairs',
    when: 'What the buyer wants, what it would cost you, your choices, and your read.',
    fields: [F.clientName, F.to, F.phone, F.address,
      { key: 'asks', label: 'What the buyer is asking for', ph: 'One per line', type: 'textarea', req: true },
      { key: 'read', label: 'Your read', ph: 'What is reasonable, what is not, and what you would do.', type: 'textarea' },
      F.expires],
    terms: ['inspection period', 'seller concession', 'contingency'],
    subject: (f) => `The buyer's request after the inspection, ${f.address}`,
    text: (f) => [
      WHO(f),
      `The buyer finished their inspection of ${f.address} and sent a request. Here it is in plain words, then my read, then your choices.`,
      `# What they are asking for\n${lines(f.asks).map((l) => `- ${l}`).join('\n')}`,
      f.read ? `# My read\n${f.read}` : '',
      `# Your choices`,
      `- Agree to all of it.\n- Agree to some of it, or offer a credit at closing instead of doing the work.\n- Say no. The buyer then decides whether to go ahead anyway or walk away.`,
      `> We answer by ${or(f.expires, 'the date written in the request')}. Call me and we will sort it out together.`,
      CLOSE(f),
    ],
    sms: (f) => `Hi ${first(f.clientName)}, Holly here. The buyer sent their request after the inspection of ${f.address}. I sent you a short letter with the list and my read. Call me when you have it${or(f.expires, '') ? `; we answer by ${f.expires}` : ''}.`,
  },
  {
    id: 'closing-day', group: 'Closing', name: 'Closing day details', audience: 'Your client, the week of closing',
    when: 'When, where, what to bring, and the money, with the wire-fraud warning in bold.',
    fields: [F.clientName, F.to, F.phone, F.address, F.closingOn,
      { key: 'time', label: 'Time', ph: 'Time of the closing', req: true },
      { key: 'place', label: 'Where', ph: 'Title company name and street address', req: true },
      F.titlePhone,
      { key: 'funds', label: 'Money the client brings', ph: 'Dollar amount, or "the title company will confirm the exact figure"', type: 'text' },
      { key: 'walkthrough', label: 'Walk-through', ph: 'Day and time of the final walk-through' },
      { key: 'side', label: 'Client is', type: 'select', options: [['buyer', 'Buying'], ['seller', 'Selling']], deal: 'side' }],
    terms: ['closing', 'walk-through', 'possession', 'title company'],
    subject: (f) => `Closing day for ${f.address}: ${f.closingOn ? longDate(f.closingOn) : 'the details'}`,
    text: (f) => [
      WHO(f),
      `Here is everything for closing on ${f.address}. Keep this where you can find it.`,
      `When :: ${f.closingOn ? longDate(f.closingOn) : 'See below'}${f.time ? ` at ${f.time}` : ''}\nWhere :: ${or(f.place, 'The title company')}\nPlan on :: About an hour of signing${f.walkthrough ? `\nWalk-through :: ${f.walkthrough}` : ''}`,
      `# What to bring`,
      f.side === 'seller'
        ? `- A government photo ID for each person on the deed.\n- Every key, garage opener, mailbox key, gate code, and any dock or lift keys.\n- Your bank details for where the proceeds should be wired. Confirm them with the title company by phone, not by email.`
        : `- A government photo ID for each buyer.\n- Your closing funds (see below).\n- Your proof of homeowners insurance, if the title company has not already received it.`,
      f.side === 'seller'
        ? `# Your proceeds\nThe title company wires your money after the deed is recorded, usually the same day or the next business day. Tell them where it goes ahead of time and confirm by phone.`
        : `# The money\nAmount :: ${or(f.funds, 'The title company will confirm the exact figure a day or two before')}\nHow :: Wire transfer or cashier's check, as the title company instructs`,
      `> Wire fraud is real and it targets closings. Before you send any money, call ${or(f.titlePhone, 'the title company at a number you already have')} and read the instructions back to a person. Never trust wiring instructions that arrived only by email, even if the email looks like it came from me.`,
      `# After you sign`,
      f.side === 'seller'
        ? `- The buyer gets the keys once the deed records and the funds are confirmed.\n- Leave the home broom clean, with manuals and warranties on the counter.\n- Then it is done. Thank you for trusting me with it.`
        : `- The title company records the deed and confirms the funds. That can take a few hours.\n- I hand you the keys as soon as it is official. ${f.walkthrough ? 'We will have already done the walk-through.' : 'We do a final walk-through the day before.'}\n- Then it is yours.`,
      CLOSE(f),
    ],
    sms: (f) => `Hi ${first(f.clientName)}, Holly here. Closing for ${f.address} is ${f.closingOn ? longDate(f.closingOn) : 'set'}${f.time ? ` at ${f.time}` : ''}, ${or(f.place, 'at the title company')}. Bring photo ID. Before sending any money, CALL the title company to confirm wire instructions; never trust email alone. Details in the letter I sent.`,
  },
  {
    id: 'welcome-home', group: 'Closing', name: 'Welcome home / thank you', audience: 'Your client, after closing',
    when: 'A warm note they keep, with the review link and a reminder you are still here.',
    fields: [F.clientName, F.to, F.phone, F.address,
      { key: 'side', label: 'Client', type: 'select', options: [['buyer', 'Bought'], ['seller', 'Sold']], deal: 'side' },
      { key: 'reviewUrl', label: 'Review link', ph: 'Your Google review link', deal: 'reviewUrl' },
      F.hollyNote],
    terms: [],
    subject: (f) => (f.side === 'seller' ? `Thank you, and congratulations` : `Welcome home`),
    text: (f) => [
      WHO(f),
      f.hollyNote || (f.side === 'seller' ? `It is done. ${f.address} has a new owner, and you have your next chapter. Thank you for trusting me with it.` : `Welcome home. ${f.address} is yours, and I hope the first night there is a good one.`),
      `# I am still here`,
      `- Contractors, cleaners, dock people, septic folks: I know who is good around the lakes. Ask any time.\n- Tax questions, the homestead exemption, where the township office is: ask.\n- And when a friend starts thinking about ${f.side === 'seller' ? 'selling' : 'a lake home'}, I would be honored to take their call.`,
      f.reviewUrl ? `# One small favor\nIf you have two minutes, a Google review helps the next family find me. It means more than you know.\n${f.reviewUrl}` : '',
      `With thanks,\n\nHolly`,
    ],
    sms: (f) => `${first(f.clientName)}, ${f.side === 'seller' ? 'congratulations on the sale' : 'welcome home'}! Thank you for trusting me with ${f.address}. I'm still here for anything you need around the lakes.${f.reviewUrl ? ` If you have two minutes, a Google review helps the next family find me: ${f.reviewUrl}` : ''} Holly`,
  },
  {
    id: 'thinking-of-selling', group: 'Prospecting', name: 'Thinking of selling?', audience: 'A homeowner you know, or a neighbor of a sale',
    when: 'A soft, personal letter: what is happening on their lake and an offer to come by, no pressure.',
    fields: [
      { key: 'clientName', label: 'Homeowner name(s)', ph: 'As you would greet them', req: true },
      F.address,
      { key: 'lake', label: 'Lake or area', ph: 'Devils Lake, Round Lake, Lake Columbia, and so on' },
      { key: 'news', label: 'What just happened nearby', ph: 'One or two sentences: a sale on their street, how fast it went, what buyers are asking for.', type: 'textarea' },
      F.hollyNote],
    terms: [],
    subject: (f) => `A note about ${or(f.lake, 'your lake')}`,
    text: (f) => [
      WHO(f),
      f.hollyNote || `I hope this finds you well. I am writing because I have been busy on ${or(f.lake, 'your lake')} lately and thought you might like to know what is happening around you.`,
      f.news ? `# What is happening nearby\n${f.news}` : '',
      `# No pressure, just an offer`,
      `If you have ever wondered what ${or(f.address, 'your home')} would bring, I am glad to come by, walk through with you, and give you an honest number based on what has actually sold. There is no cost and no obligation; most people just like to know.`,
      `I was named the 2026 Lenawee County REALTOR of the Year, which I mention only so you know I am not new at this. I have sold a lot of homes on these lakes, and I would be glad to tell you how.`,
      `Warm regards,\n\nHolly`,
    ],
    sms: (f) => `Hi ${first(f.clientName)}, Holly Griewahn here (Foundation Realty). I've been busy on ${or(f.lake, 'your lake')} and wondered if you'd like to know what homes nearby are bringing. Glad to come by with an honest number, no cost, no obligation. Call or text any time.`,
  },
  {
    id: 'blank', group: 'Blank', name: 'Letter on Holly\'s paper', audience: 'Anyone',
    when: 'Your letterhead, your words.',
    fields: [F.clientName, F.to, F.phone,
      { key: 'subjectLine', label: 'Subject', ph: 'What the letter is about' },
      { key: 'body', label: 'Your letter', ph: 'Write it here. Blank line between paragraphs. Start a line with "- " for a list, "# " for a heading, "> " for a highlighted note.', type: 'textarea', req: true }],
    terms: [],
    subject: (f) => or(f.subjectLine, 'A note from Holly'),
    text: (f) => [WHO(f), f.body, `Warm regards,\n\nHolly`],
    sms: (f) => String(f.body || '').slice(0, 300),
  },
];

export const byId = (id) => TEMPLATES.find((t) => t.id === id) || null;

// Blank required fields read as plain words, never as 'undefined', so a half
// filled letter still previews sensibly.
const DEFAULTS = { address: 'the home', clientName: 'friend', buyerNames: 'my buyers', listingAgent: 'colleague' };
export function withDefaults(fields) {
  const clean = Object.fromEntries(Object.entries(fields || {}).filter(([, v]) => String(v == null ? '' : v).trim() !== ''));
  return { ...DEFAULTS, ...clean };
}
export const subjectFor = (t, f) => t.subject(withDefaults(f));
export const smsFor = (t, f) => t.sms(withDefaults(f));

// Letter text from a template and its fields. Empty blocks drop out.
export function compose(template, fields) {
  return template.text(withDefaults(fields)).map((b) => String(b || '').trim()).filter(Boolean).join('\n\n');
}

// Prefill fields from a roadmap (deal) record. The desk calls this when Holly
// picks a deal; everything she then types wins over it.
export function fromDeal(template, deal, extra = {}) {
  const out = {};
  for (const f of template.fields) {
    if (!f.deal) continue;
    const v = f.deal === 'reviewUrl' ? extra.reviewUrl : deal[f.deal];
    if (v != null && v !== '') out[f.key] = typeof v === 'number' ? String(v) : String(v);
  }
  if (deal.address && template.fields.some((f) => f.key === 'address')) out.address = `${deal.address}${deal.city ? `, ${deal.city}` : ''}`;
  return out;
}
