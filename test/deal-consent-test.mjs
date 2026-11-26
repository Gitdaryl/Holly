import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
// Run: npm test   (node --import ./test/register.mjs test/deal-consent-test.mjs)
process.env.ADMIN_SECRET = 'test-secret'
process.env.TWILIO_ACCOUNT_SID = 'ACtest'; process.env.TWILIO_AUTH_TOKEN = 'tok'; process.env.TWILIO_PHONE = '+15173008226'
process.env.HOLLY_SMS_PHONE = '5174033413'
// Freeze "now" at 10:00 ET on Nov 25 2026 so the cron is outside quiet hours.
const FIXED = Date.parse('2026-11-25T15:00:00Z')
const RealDate = Date
globalThis.Date = class extends RealDate { constructor(...a) { a.length ? super(...a) : super(FIXED) } static now() { return FIXED } }
// Record Twilio sends; serve the in-memory store for blob reads.
const sent = []
const realFetch = globalThis.fetch
globalThis.fetch = async (url, opts) => {
  const u = String(url)
  if (u.startsWith('https://mem.test/')) { const { store } = await import('./blob-mock.mjs'); const k = u.replace('https://mem.test/', ''); return store.has(k) ? new Response(store.get(k), { status: 200 }) : new Response('', { status: 404 }) }
  if (u.includes('api.twilio.com')) { const p = new URLSearchParams(opts.body); sent.push({ to: p.get('To'), body: p.get('Body') }); return new Response('{}', { status: 201 }) }
  return realFetch(url, opts)
}
const deals = await import('../api/lib/deals.js')
const { DEAL_CONSENT_TEXT } = await import('../src/lib/sms-consent.js')
const admin = (await import('../api/admin.js')).default
const cron = (await import('../api/cron-followup.js')).default
const { store } = await import('./blob-mock.mjs')

const call = async (handler, { method = 'POST', query = {}, body = {}, headers = {} } = {}) => {
  let out = { status: 200, json: null }
  const res = { setHeader() {}, status(c) { out.status = c; return this }, json(j) { out.json = j; return this }, send(t) { out.json = t; return this }, end() { return this } }
  await handler({ method, query, body, headers: { authorization: 'Bearer test-secret', ...headers } }, res)
  return out
}
const adm = (action, body) => call(admin, { query: { action }, body })
const base = (over) => ({ side: 'buyer', financing: 'financed', address: '1 Lake Rd', clientName: 'Pat Sample', clientPhone: '(517) 555-0101', acceptedOn: '2026-11-10', closingOn: '2026-12-20', ...over })
let pass = 0; const ok = (name) => { pass++; console.log('  ok -', name) }

// 1. the script equals the filed sample #4. The fixture is a copy of CAMPAIGN.MessageSamples[3]
//    from campaign.py on the VPS (Nov 25 2026); pass another copy as the first argument to compare.
const filed = process.argv[2] || readFileSync(new URL('./fixtures/filed-sample-4.txt', import.meta.url), 'utf8')
assert.equal(DEAL_CONSENT_TEXT, filed); ok('consent text is character-for-character the filed sample #4')

// 2. save a fresh deal through the real admin handler; no consent yet
let r = await adm('deal-save', { deal: base({ steps: [{ id: 'inspect', title: 'Inspection', who: 'you', date: '2026-11-27', remind: true }] }) })
assert.equal(r.status, 200); const A = r.json.deal
assert.equal(A.textConsent, null); ok('new deal starts with no consent')

// 3. a forged consent in the posted body is ignored
r = await adm('deal-save', { deal: { ...A, textConsent: { phone: '5175550101', requestedAt: 'x', yesAt: '2026-01-01', version: 'forged' } } })
assert.equal(r.json.deal.textConsent, null); ok('desk-posted consent record is ignored (server owns it)')

// 4. link text and "also text" reply are refused before YES
r = await adm('deal-send', { id: A.id }); assert.equal(r.status, 400); assert.match(r.json.error, /YES/); ok('"Text the link" refused before YES')
sent.length = 0
r = await adm('deal-reply', { id: A.id, text: 'Hello there' }); assert.equal(r.json.texted, false); assert.equal(sent.length, 0); ok('reply is saved on the page but NOT texted before YES')

// 5. YES cannot be marked before the consent text is sent
r = await adm('deal-consent-yes', { id: A.id }); assert.equal(r.status, 400); ok('cannot mark YES before the consent text is sent')

// 6. send the consent text: exactly one text, exactly the filed words
sent.length = 0
r = await adm('deal-consent-request', { id: A.id }); assert.equal(r.status, 200)
assert.equal(sent.length, 1); assert.equal(sent[0].to, '+15175550101'); assert.equal(sent[0].body, DEAL_CONSENT_TEXT)
assert.equal(deals.consentState(r.json.deal), 'asked'); ok('consent text sent once, exact words, state = asked')

// 7. still no reminders or link while only asked
const dry1 = await call(cron, { method: 'GET', query: { dry: '1' } })
assert.equal(dry1.json.actions.filter((a) => a.job === 'deal-client').length, 0); ok('cron sends nothing to a client who was asked but has not said YES')

// 8. mark YES -> reminders and link allowed
r = await adm('deal-consent-yes', { id: A.id }); assert.equal(r.status, 200); assert.equal(deals.consentState(r.json.deal), 'yes')
const dry2 = await call(cron, { method: 'GET', query: { dry: '1' } })
assert.equal(dry2.json.actions.filter((a) => a.job === 'deal-client').length, 1); ok('after YES the cron plans the client reminder')
sent.length = 0
r = await adm('deal-send', { id: A.id }); assert.equal(r.status, 200); assert.equal(sent.length, 1); ok('link text allowed after YES')

// 9. changing the number drops the YES
let cur = await deals.loadDeal(A.id)
r = await adm('deal-save', { deal: { ...cur, clientPhone: '517-555-0199' } })
assert.equal(r.json.deal.textConsent, null); assert.equal(deals.hasTextConsent(r.json.deal), false); ok('a YES does not carry over to a different phone number')

// 10. an older deal with a phone and no record is silent in a real (non-dry) cron run
const oldDeal = deals.normalizeDeal(base({ clientName: 'Old Client', address: '9 Old Rd', clientPhone: '5175550777', steps: [{ id: 'x', title: 'Appraisal', who: 'you', date: '2026-11-27', remind: true }] }))
await deals.saveDeal(oldDeal)
// give A back a YES on its new number for contrast
cur = await deals.loadDeal(A.id)
await adm('deal-consent-request', { id: A.id }); await adm('deal-consent-yes', { id: A.id })
sent.length = 0
const live = await call(cron, { method: 'GET', query: {} })
const toClients = sent.filter((s) => s.to !== '+15174033413').map((s) => s.to)
assert.deepEqual([...new Set(toClients)], ['+15175550199']); ok('real cron run texts only the client who said YES; the older roadmap gets nothing')
assert(!sent.some((s) => s.to === '+15175550777')); ok('older roadmap with no recorded YES received no text')

// 11. the client page never sees the consent record
const pv = deals.publicView(await deals.loadDeal(A.id)); assert.equal('textConsent' in pv, false); assert.equal('contactPref' in pv, false); ok('client roadmap page does not expose consent or preference')

// 12. preference is saved and survives later saves
cur = await deals.loadDeal(A.id)
r = await adm('deal-save', { deal: { ...cur, contactPref: 'both' } }); assert.equal(r.json.deal.contactPref, 'both')
r = await adm('deal-save', { deal: { ...r.json.deal, contactPref: undefined } }); assert.equal(r.json.deal.contactPref, 'both'); ok('contact preference saved and kept')
console.log(`\n${pass} checks passed`)
