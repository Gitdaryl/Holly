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
