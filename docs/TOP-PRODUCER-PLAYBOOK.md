# Top-producer features: how Holly uses them

Built 2026-09-16. Four things a top producer's site does that this one now does.

## 1. Speed to lead (SMS)

Every intake (showing request, home value, lake waitlist, contact form, chat
lead) texts Holly within seconds and sends the lead one confirmation text from
Holly's number. Email is still sent as the record.

Env on the Vercel project (copy from Manitou-Beach or Yeti-Groove):

```
TWILIO_ACCOUNT_SID   TWILIO_AUTH_TOKEN   TWILIO_PHONE (E.164 sender)
HOLLY_SMS_PHONE      her cell, any US format. Unset = Holly is not texted.
RESEND_API_KEY       still required for the email record and seller reports.
```

Persist-first is unchanged: SMS failing never loses a lead.

## 2. Sold archive

When a listing closes, do not delete it. In `src/data/amenities.js`:

```
status: 'sold', soldOn: '2026-09-01', soldPrice: '$860,000',
```

That flips the page to "Sold in 26 days at 101.3% of list", adds it to
`/sold`, the Sold tab on `/listings`, and the "Holly on {lake}" card on the
lake page. Past sales from before the site can be added the same way. The
`slug` never changes; it keys the engagement history.

Get from Holly: her last 12 to 24 months of closed sales (address, lake, list
price, listed date, closed date, sold price). Empty page until then.

## 3. Buyer waitlist per lake

Every lake page has "Get first look at {lake}". Registrations go to Blob
(`waitlist/<lake>/…`), the Holly Leads Notion DB (source "Lake Waitlist"),
Holly's phone, and the buyer gets a confirmation text.

- Public count: `/api/waitlist?lake=devils-lake`
- All lakes: `/api/waitlist?all=1`
- Holly's full list: `/api/waitlist?lake=devils-lake&key=<ADMIN_SECRET>`
- The weekly seller report now shows "Buyers registered for {lake}".

The number shows on the lake page once it reaches 3. Below that it reads as an
invitation, not an empty room.

## 4. Listing plan link (pre-appointment)

`/plan` (Holly only, not linked anywhere) builds a link like
`/plan/devils-lake/4834-round-lake-hwy?for=Jim`. Text it the night before the
appointment. The page shows the live buyer count for that lake, Holly's sold
numbers, the day-we-list timeline, and a sample Friday seller report. Nothing
is stored; the page is built from the URL. Pages are noindex.

## 5. Holly's desk (/admin)

hollygriewahn.vercel.app/admin. No password: tap "Text me a login link", a
15-minute link lands on HOLLY_SMS_PHONE, opening it keeps her signed in on that
phone for 30 days. Yeti can paste ADMIN_SECRET under "Have a key instead?".

- **Inbox**: every lead from every source (showing, home value, waitlist,
  contact, chat), newest first, tap to call/text/email, status per lead
  (New, Called, Showing set, Client, Dead). Status is append-only in Blob
  (`admin/status/<leadId>/<ts>-<status>`), newest wins.
- **Waitlist**: buyers per lake with contact buttons. The number she quotes.
- **Listings**: this week's views/saves/showings/lake buyers per active
  listing, "Your report" (agent view), "Copy seller link".

Login texts are rate limited (1/min, 10/day) so the public login page cannot
SMS-bomb her. Rotating ADMIN_SECRET signs every phone out.

Phase 2 (not built): two-way texting from the page (inbound Twilio webhook +
reply), mark-sold from the Listings tab. Phase 3: text the whole lake
waitlist about a new listing, blog review tab.

## 6. Texts (two-way SMS on 517-300-8226)

Holly's site number is (517) 300-8226, attached to the Manitou Beach
Messaging Service (verified 10DLC campaign). Outbound lead alerts and
auto-replies come from it. Inbound texts hit /api/sms-inbound (Twilio
signature verified), are stored under sms/<10 digits>/, and are forwarded to
HOLLY_SMS_PHONE. The Texts tab in /admin shows every thread with both sides,
names threads from lead records, flags ones waiting on Holly, and replies go
out from the site number. Voice on that number is not wired yet.

## 7. Calls to the site number

A call to (517) 300-8226 rings Holly's cell showing the site number as caller
ID. She hears "Holly, a call from your website. Press 1 to take it." Voicemail
cannot press 1, so an unanswered call never lands in her carrier mailbox:
the caller hears a short message, leaves a voicemail (up to 2 min), and
Holly gets a text with the transcript (Deepgram Nova-3 via DEEPGRAM_API_KEY,
Twilio's own transcription as fallback) and a signed audio link served by
/api/voicemail (Twilio's media URLs are auth-walled). Re-transcribe any
recording: /api/admin?view=transcribe&rec=RE... with the admin bearer. Missed calls and
voicemails log into the caller's thread in the Texts tab. Code:
api/voice-inbound.js (Dial + screen + Record + transcribeCallback).
Holly should save 517-300-8226 in her contacts so it is not flagged as spam.

## 8. Follow-up that runs itself (api/cron-followup.js, hourly at :15)

- **Holly nudges.** A lead still "New" in her desk after 1 hour gets her one
  reminder text, another at 24 hours, then it stops. Several waiting -> one
  summary text. Flipping the status in the desk stops the nudges.
- **Buyer check-ins.** Waitlist buyers get a text from Holly on day 3 and
  day 14 ("anything new on your Devils Lake search?").
- **Seller nurture.** Home-value requesters get a 30/60/90-day check-in.
- Automation never texts anyone who has already texted back or whom Holly
  has replied to from the desk, and never anyone marked Client or Dead.
- Quiet hours 9pm-8am Eastern. Twilio handles STOP replies automatically.
- Preview without sending: /api/cron-followup?dry=1 with the admin bearer.
- /api/admin?action=purge-tests (POST {phones:[...]}) removes test records.

## 9. The chat widget

api/chat.js builds its knowledge from the same files the site renders
(lakes.js, regions.js, listings and sales in amenities.js), so the chat
cannot disagree with the pages. Rules that matter: only Holly's own listings
are "for sale", prices are quoted verbatim or not at all, unknowns get
"I'm not sure, want Holly to text you?" Runs on Sonnet with the facts block
prompt-cached. To teach it something new, put the fact in the data files,
not in the prompt.

## 10. Lake sales reports (/market/<lake>)

One page per lake: what Holly sold there this year (median, range, days to
sell, day-one sales, closings by month), region context when the lake has
no sales yet, for-sale list, and an owner sign-up ("text me when something
sells or lists on my lake"). Owners are stored as waitlist entries with
role=owner (.owner.json), show as "Lake owner" in the inbox and Notion
source "Lake Owner", and never count toward the public buyer number.
Prerendered with FAQ schema so "what do homes sell for on Clark Lake"
can be answered from Holly's page. Data comes from amenities.js, so the
report updates itself as sales are added.
