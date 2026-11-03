# Deals: client transaction roadmaps

What it is: one page per client under contract, every step from offer to keys, dated, with what each step means and who acts. Modeled on trackre.app, built into Holly's site instead of a $19/month app the client has to install.

- Client page: `/deal/<id>?k=<key>` (src/pages/DealPage.jsx, api/deal.js). No account. The key is an HMAC of the id under ADMIN_SECRET (api/lib/deals.js), so rotating ADMIN_SECRET kills every link.
- Desk: Deals tab (src/components/DealsDesk.jsx). New roadmap = upload the purchase agreement (Claude reads address, price, dates; `deal-extract` in api/admin.js) or type the two dates. Steps come from src/data/deal-templates.js (buyer financed, buyer cash, seller, with lake-home extras) and are re-dated automatically when the closing date moves, unless Holly dated a step by hand.
- Reminders: job 4 in api/cron-followup.js (hourly, quiet hours apply). Client gets a text two days before each dated step and the morning of a step that is theirs; Holly gets one morning summary of today's and overdue steps. Markers under `deals/<id>/reminded/`.
- Questions: the client's "Ask Holly" box stores a note and texts Holly with a desk link. Holly's reply shows on the page and goes out as a text from the desk number.
- Calendar: `/api/deal?...&ics=1` (all dates) or `&step=<id>` (one), floating all-day events.
- Storage: append-only blobs under `deals/<id>/` (see the header of api/lib/deals.js). Never read-modify-write one pathname.

Testing: `vercel env pull` for the Blob token, then `node api/...` handlers are plain functions. A dry run of reminders: `curl -H "Authorization: Bearer $ADMIN_SECRET" "https://<site>/api/cron-followup?dry=1"`.

Not built yet: document uploads (contracts stay in the Dotloop/MLS link on a step), lender/title partner logins, per-step comments by the client beyond the shared question box.

## Stationery (added Nov 3 2026)
- Desk Stationery tab (src/components/StationeryDesk.jsx): 11 letters in src/data/stationery.js (offer cover, your offer explained, an offer came in, counter-offer, offer accepted, inspection results and ask, buyer's repair request, closing day details, welcome home, thinking of selling, blank letterhead). Fields prefill from a roadmap ("Pull from a roadmap", or "Write a letter" on the deal).
- One renderer, src/lib/letter-html.js, makes the preview, the print window (Print / Save as PDF) and the email. Letterhead carries Foundation Realty at the same size as Holly's name, and the signature pairs with a logo panel of equal height (MCL 339.2512e).
- Email from the desk needs RESEND_API_KEY plus NEWSLETTER_FROM or MAIL_FROM; until then the button becomes "Open in your email app" (plain text via mailto). Text the short version goes from the desk number. Every send/print/copy is logged under letters/<date>/.
- Role-play test script: docs/ROLEPLAY-TEST.md.
