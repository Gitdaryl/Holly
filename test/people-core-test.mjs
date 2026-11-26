import assert from 'node:assert/strict'
// Run: npm test   (chunk 1: people-core.js, pure; no store, no network)
// Synthetic data only: 555-01xx phones, example.com emails, invented names.
import {
  phoneKey, emailKey, derivePid, newPid, nameCompatible, textState, emailPolicy, validate, fold, buildPeople, matchRecord, canOpenEpisode,
  parseMarker, isStopText, isStartText, todayET, STOP_WORDS, START_WORDS,
} from '../api/lib/people-core.js'

let pass = 0
const t = (name, fn) => { fn(); pass++; console.log('  ok -', name) }

// ── builders ────────────────────────────────────────────────────────────
const T0 = Date.parse('2026-11-10T15:00:00Z')
const MIN = 60000, DAY = 86400000
const iso = (ms) => new Date(ms).toISOString()
const at = (mins) => iso(T0 + mins * MIN)
let n = 0
const E = (type, by, mins, extra = {}) => ({ id: `e${String(++n).padStart(4, '0')}`, at: at(mins), by, type, ...extra })
const put = (pid, fields, by = 'holly', mins = 0) => E('person.put', by, mins, { pid, fields })
const addPhone = (pid, value, by = 'holly', mins = 0, src) => E('person.contact', by, mins, { pid, kind: 'phone', value, op: 'add', src })
const addEmail = (pid, value, by = 'holly', mins = 0, src) => E('person.contact', by, mins, { pid, kind: 'email', value, op: 'add', src })
const person = (pid, first, last, phone, email, by = 'holly', mins = 0) => [
  put(pid, { first, last }, by, mins),
  ...(phone ? [addPhone(pid, phone, by, mins)] : []),
  ...(email ? [addEmail(pid, email, by, mins)] : []),
]
const NOW = T0 + 10 * DAY
const build = (events, ctx = {}) => buildPeople(events, { now: NOW, ...ctx })
const card = (res, id) => res.cards.find((c) => c.id === id)
const P1 = '(517) 555-0101', K1 = '5175550101'
const P2 = '517-555-0102', K2 = '5175550102'
const P3 = '5175550103', K3 = '5175550103'

// seeded shuffle, so a failure reproduces
const shuffle = (arr, seed) => {
  const a = [...arr]
  let s = seed
  const rnd = () => ((s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296)
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]] }
  return a
}

// ── 4.6 keys ────────────────────────────────────────────────────────────
t('phone key: last ten digits, real numbers only', () => {
  assert.equal(phoneKey('(517) 555-0101'), K1)
  assert.equal(phoneKey('+1 517-555-0101'), K1)
  assert.equal(phoneKey('1-517-555-0101'), K1)
  assert.equal(phoneKey('555-0101'), null, 'seven digits is not a number')
  assert.equal(phoneKey('517555010'), null)
  assert.equal(phoneKey('0175550101'), null, 'area code cannot start with 0')
  assert.equal(phoneKey('1175550101'), null, 'area code cannot start with 1')
  assert.equal(phoneKey('517 555 0101 x12'), null, 'an extension is not a clean number')
  assert.equal(phoneKey(null), null)
})
t('email key: trimmed, lower case, must look like an address', () => {
  assert.equal(emailKey('  Pat@Example.COM '), 'pat@example.com')
  assert.equal(emailKey('not an email'), null)
  assert.equal(emailKey('a@b'), null)
  assert.equal(emailKey(''), null)
})
t('name compatibility (rule 3): Pat and Paul no, Dan and Daniel no, blanks and nameless yes', () => {
  assert.ok(nameCompatible({ first: 'Pat', last: 'Testington' }, { first: 'pat', last: 'TESTINGTON' }))
  assert.ok(nameCompatible({ first: "Pat.", last: 'Test-ington' }, { first: 'Pat', last: 'Testington' }), 'punctuation ignored')
  assert.ok(nameCompatible({ first: 'Pat', last: '' }, { first: 'Pat', last: 'Testington' }), 'one blank last name')
  assert.ok(nameCompatible({ first: '', last: '' }, { first: 'Pat', last: 'Testington' }), 'a text thread has no name')
  assert.ok(!nameCompatible({ first: 'Pat', last: 'Testington' }, { first: 'Paul', last: 'Testington' }))
  assert.ok(!nameCompatible({ first: 'Dan', last: 'Testington' }, { first: 'Daniel', last: 'Testington' }))
  assert.ok(!nameCompatible({ first: 'Pat', last: 'Testington' }, { first: 'Pat', last: 'Otherson' }))
})
t('a card-less id is derived from the key, phone before email, and is stable', () => {
  assert.equal(derivePid(`phone:${K1}`), derivePid(`phone:${K1}`))
  assert.equal(newPid({ phones: [P1], emails: ['pat@example.com'] }), derivePid(`phone:${K1}`))
  assert.equal(newPid({ phones: [], emails: ['PAT@example.com'] }), derivePid('email:pat@example.com'))
  assert.equal(newPid({ phones: ['nope'], emails: [] }), null, 'no key: caller mints a random id')
})

// ── 4.2 fold rules ──────────────────────────────────────────────────────
t('field rule: newest wins, and a hand edit is never replaced by an import, even a newer one', () => {
  let r = build([put('pa', { first: 'Pat' }, 'import', 10), put('pa', { first: 'Patty' }, 'import', 20)])
  assert.equal(card(r, 'pa').first, 'Patty', 'newest import wins over an older import')
  r = build([put('pa', { first: 'Patricia' }, 'holly', 10), put('pa', { first: 'Pat' }, 'import', 99)])
  assert.equal(card(r, 'pa').first, 'Patricia', 'a later import cannot replace a hand value')
  r = build([put('pa', { first: 'Patricia' }, 'holly', 10), put('pa', { first: 'Trish' }, 'yeti', 20)])
  assert.equal(card(r, 'pa').first, 'Trish', 'newest hand wins over an older hand')
  r = build([put('pa', { first: 'Pat', last: 'A' }, 'holly', 10), put('pa', { last: 'B' }, 'import', 20)])
  assert.equal(`${card(r, 'pa').first} ${card(r, 'pa').last}`, 'Pat A', 'each field is its own register')
})
t('contact points: a phone removed by hand stays removed when an old import is replayed', () => {
  const base = [put('pa', { first: 'Pat' }, 'holly', 0), addPhone('pa', P1, 'import', 1, 'mc')]
  assert.equal(card(build(base), 'pa').phones.length, 1)
  const removed = [...base, E('person.contact', 'holly', 5, { pid: 'pa', kind: 'phone', value: P1, op: 'remove' })]
  assert.equal(card(build(removed), 'pa').phones.length, 0)
  const reimport = [...removed, addPhone('pa', P1, 'import', 50, 'csv')]
  assert.equal(card(build(reimport), 'pa').phones.length, 0, 'the old file does not bring it back')
  const readded = [...reimport, addPhone('pa', '517.555.0101', 'holly', 60)]
  assert.equal(card(build(readded), 'pa').phones.length, 1, 'a newer hand add does')
})
t('contact points remember where each came from', () => {
  const r = build([put('pa', { first: 'Pat' }), addEmail('pa', 'Pat@Example.com', 'import', 1, 'mc'), addEmail('pa', 'pat@example.com', 'import', 2, 'csv')])
  assert.deepEqual(card(r, 'pa').emails.map((e) => [e.key, e.src]), [['pat@example.com', ['csv', 'mc']]])
})
t('notes are a set keyed by event id, newest first; a plain note is not contact', () => {
  const n1 = E('person.note', 'holly', 5, { pid: 'pa', kind: 'note', text: 'one' })
  const n2 = E('person.note', 'holly', 9, { pid: 'pa', kind: 'call', text: 'two' })
  const r = build([put('pa', { first: 'Pat' }), n1, n2, n1])
  assert.deepEqual(card(r, 'pa').notes.map((x) => x.text), ['two', 'one'])
})
t('next step: the newest wins; "done" clears it', () => {
  const a = E('person.step', 'holly', 5, { pid: 'pa', text: 'call back', due: '2026-12-01' })
  const b = E('person.step', 'holly', 9, { pid: 'pa', text: 'send comps', due: '2026-12-03' })
  assert.equal(card(build([put('pa', { first: 'Pat' }), a, b]), 'pa').nextStep.text, 'send comps')
  const done = E('person.step', 'holly', 12, { pid: 'pa', done: true })
  assert.equal(card(build([put('pa', { first: 'Pat' }), a, b, done]), 'pa').nextStep, null)
})

// a busy scenario that touches every event type, for the replay tests
const scenario = () => {
  const ev = [
    ...person('pa', 'Pat', 'Testington', P1, 'pat@example.com'),
    ...person('pb', 'Chris', 'Testington', P2, null, 'import'),
    ...person('pc', 'Sam', 'Sampleton', P3, 'sam@example.com', 'import'),
    put('pa', { lakes: ['devils'], tags: ['mc-vip'], how: 'open house' }, 'holly', 3),
    put('pa', { first: 'Patricia' }, 'import', 40),
    E('person.contact', 'holly', 7, { pid: 'pc', kind: 'phone', value: P3, op: 'remove' }),
    addPhone('pc', P3, 'import', 70),
    E('person.note', 'holly', 8, { pid: 'pa', kind: 'call', text: 'talked about selling' }),
    E('person.note', 'import', 8, { pid: 'pb', kind: 'note', text: 'from mailchimp' }),
    E('person.step', 'holly', 9, { pid: 'pa', text: 'send comps', due: '2026-11-12' }),
    E('rel.put', 'holly', 10, { pid: 'pa', relId: 'r1', side: 'sell', stage: 'contacted', lake: 'devils', address: '1 Test Lake Rd' }),
    E('rel.put', 'import', 11, { pid: 'pb', relId: 'r2', side: 'buy', stage: 'closed', closedOn: '2023-06-15', price: 450000, saleKey: 'k1' }),
    E('rel.put', 'holly', 30, { pid: 'pa', relId: 'r1', stage: 'showing' }),
    E('person.link', 'holly', 20, { a: 'pa', b: 'pb', kind: 'household' }),
    E('person.link', 'holly', 21, { a: 'pb', b: 'pc', kind: 'same' }),
    E('person.unlink', 'holly', 22, { a: 'pb', b: 'pc' }),
    E('person.link', 'holly', 23, { a: 'pb', b: 'pc', kind: 'same' }),
    E('consent.text', 'holly', 24, { phone: K1, state: 'agreed', how: 'on the phone' }),
    E('consent.text', 'holly', 25, { phone: K2, state: 'withdrawn' }),
    E('review.asked', 'holly', 26, { pid: 'pb', how: 'in person' }),
    E('settings.set', 'holly', 27, { key: 'quiet.days', value: 3 }),
    E('settings.set', 'yeti', 28, { key: 'quiet.days', value: 4 }),
    E('import.batch', 'import', 29, { batchId: 'b1', source: 'csv', people: [{ pid: 'pd', fields: { first: 'Dana', last: 'Sampleton' }, contacts: [{ kind: 'email', value: 'dana@example.com', src: 'csv' }], notes: [{ id: 'x1', text: 'imported note' }] }], rels: [{ pid: 'pd', relId: 'r9', side: 'sell', stage: 'closed', closedOn: '2024-05-01' }] }),
  ]
  return ev
}
const ctxFull = () => ({
  leads: [
    { id: 'L2', name: 'Pat Testington', phone: P1, email: 'pat@example.com', source: 'Contact form', when: at(5), smsConsent: true },
    { id: 'L1', name: 'Walk In', phone: '517-555-0140', email: '', source: 'Waitlist', about: 'Devils Lake', when: at(6), smsConsent: false, smsDeclined: true },
  ],
  markers: [{ leadId: 'L2', ts: T0 + 15 * MIN, status: 'called', echo: false }, { leadId: 'L2', ts: T0 + 16 * MIN, status: 'client', echo: true }],
  threads: [{ phone: '5175550140', messages: [{ direction: 'in', body: 'Hi', receivedAt: at(50) }] }, { phone: P2, messages: [{ direction: 'out', body: 'hello', author: 'holly', receivedAt: at(51) }] }],
  deals: [{ id: 'D1', side: 'buyer', clientName: 'Sam Sampleton', clientPhone: P3, status: 'active', consent: 'yes', updatedAt: at(60), createdAt: at(55), overdue: 1, unanswered: true, address: '2 Test Rd' }],
  emailStatus: { 'pat@example.com': 'confirmed', 'sam@example.com': 'unsubscribed' },
})
const snapshot = (events, ctx) => JSON.stringify(buildPeople(events, { now: NOW, ...ctx }))

t('replaying the same changes twice gives an identical result', () => {
  const ev = scenario()
  assert.equal(snapshot([...ev, ...ev], ctxFull()), snapshot(ev, ctxFull()))
})
t('shuffled order gives an identical result (20 shuffles, events and records)', () => {
  const ev = scenario()
  const want = snapshot(ev, ctxFull())
  for (let s = 1; s <= 20; s++) {
    const c = ctxFull()
    c.leads = shuffle(c.leads, s); c.markers = shuffle(c.markers, s); c.threads = shuffle(c.threads, s)
    assert.equal(snapshot(shuffle(ev, s), c), want, `shuffle ${s}`)
  }
  assert.equal(buildPeople(ev, { now: NOW, ...ctxFull() }).ignored, 0, 'nothing in the scenario is dropped')
})
t('an event with the same time and a different id still resolves the same way both orders', () => {
  const a = { id: 'aaaa', at: at(5), by: 'holly', type: 'person.put', pid: 'pa', fields: { first: 'Aye' } }
  const b = { id: 'bbbb', at: at(5), by: 'holly', type: 'person.put', pid: 'pa', fields: { first: 'Bee' } }
  assert.equal(card(build([a, b]), 'pa').first, card(build([b, a]), 'pa').first)
})

// ── 4.2 links ───────────────────────────────────────────────────────────
t('link merges two cards; unlink restores both exactly (deep equal to never linked)', () => {
  const base = [...person('pa', 'Pat', 'Testington', P1, 'pat@example.com'), ...person('pb', 'Pat', 'Testington', P2, null),
    E('person.note', 'holly', 4, { pid: 'pa', kind: 'note', text: 'about a' }), E('person.note', 'holly', 5, { pid: 'pb', kind: 'note', text: 'about b' }),
    E('rel.put', 'holly', 6, { pid: 'pb', relId: 'r1', side: 'buy', stage: 'contacted' })]
  const never = build(base)
  assert.equal(never.cards.length, 2)
  const linked = build([...base, E('person.link', 'holly', 10, { a: 'pa', b: 'pb', kind: 'same' })])
  assert.equal(linked.cards.length, 1)
  const m = linked.cards[0]
  assert.equal(m.id, 'pa', 'the smaller id is the merged id, always')
  assert.deepEqual(m.phones.map((p) => p.key), [K1, K2])
  assert.deepEqual(m.notes.map((x) => x.text).sort(), ['about a', 'about b'])
  assert.equal(m.episodes.length, 1)
  const unlinked = build([...base, E('person.link', 'holly', 10, { a: 'pa', b: 'pb', kind: 'same' }), E('person.unlink', 'holly', 20, { a: 'pb', b: 'pa' })])
  assert.deepEqual(unlinked, never)
  const relinked = build([...base, E('person.link', 'holly', 10, { a: 'pa', b: 'pb', kind: 'same' }), E('person.unlink', 'holly', 20, { a: 'pa', b: 'pb' }), E('person.link', 'holly', 30, { a: 'pb', b: 'pa', kind: 'same' })])
  assert.equal(relinked.cards.length, 1, 'newest fact per pair wins, in either argument order')
})
t('a chain of links is one card; unlinking the middle pair splits it', () => {
  const base = [...person('pa', 'Pat', 'T', P1), ...person('pb', 'Pat', 'T', P2), ...person('pc', 'Pat', 'T', P3)]
  const chain = [...base, E('person.link', 'holly', 1, { a: 'pa', b: 'pb', kind: 'same' }), E('person.link', 'holly', 2, { a: 'pb', b: 'pc', kind: 'same' })]
  assert.equal(build(chain).cards.length, 1)
  const split = build([...chain, E('person.unlink', 'holly', 3, { a: 'pb', b: 'pc' })])
  assert.deepEqual(split.cards.map((c) => c.pids), [['pa', 'pb'], ['pc']])
})
t('household and distinct links never merge; household shows on both cards; both silence the possibly-same-person flag', () => {
  const base = [...person('pa', 'Pat', 'Testington', P1, 'shared@example.com'), ...person('pb', 'Chris', 'Testington', P2, 'shared@example.com')]
  const open = build(base)
  assert.equal(open.cards.length, 2)
  assert.deepEqual(open.suggestions.map((s) => s.why), ['same email'], 'undecided is kept separate and flagged')
  const hh = build([...base, E('person.link', 'holly', 5, { a: 'pa', b: 'pb', kind: 'household' })])
  assert.equal(hh.cards.length, 2)
  assert.deepEqual(hh.suggestions, [])
  assert.deepEqual([card(hh, 'pa').household, card(hh, 'pb').household], [['pb'], ['pa']])
  const dist = build([...base, E('person.link', 'holly', 5, { a: 'pa', b: 'pb', kind: 'distinct' })])
  assert.deepEqual(dist.suggestions, [])
  assert.deepEqual(card(dist, 'pa').household, [])
})
t('a household shares a row\'s permission only through the address: ticked on one phone does not carry to another number', () => {
  const ev = [...person('pa', 'Pat', 'T', P1), ...person('pb', 'Pat', 'T', P2), E('person.link', 'holly', 5, { a: 'pa', b: 'pb', kind: 'same' })]
  const leads = [{ id: 'L1', name: 'Pat T', phone: P1, source: 'Contact form', when: at(1), smsConsent: true }]
  const m = build(ev, { leads }).cards[0]
  const by = Object.fromEntries(m.phones.map((p) => [p.key, p.text.state]))
  assert.deepEqual(by, { [K1]: 'ticked', [K2]: 'none' })
})

// ── 4.3 / 4.4 episodes, stage, pile ─────────────────────────────────────
t('episodes: stage moves with the newest rel.put; pile follows the stage', () => {
  const base = person('pa', 'Pat', 'T', P1)
  const rel = (mins, extra) => E('rel.put', 'holly', mins, { pid: 'pa', relId: 'r1', ...extra })
  const pile = (...more) => card(build([...base, ...more]), 'pa')
  assert.equal(pile().pile, 'sphere')
  assert.equal(pile(rel(1, { side: 'buy', stage: 'contacted' })).pile, 'lead')
  assert.equal(pile(rel(1, { side: 'buy', stage: 'contacted' }), rel(2, { stage: 'showing' })).stage, 'showing')
  assert.equal(pile(rel(1, { side: 'buy', stage: 'offer' })).pile, 'current client')
  assert.equal(pile(rel(1, { side: 'buy', stage: 'under_contract' })).pile, 'current client')
  const closed = pile(rel(1, { side: 'buy', stage: 'closed', closedOn: '2023-06-15' }))
  assert.equal(closed.pile, 'past client')
  assert.equal(closed.episodes[0].closedOn, '2023-06-15')
  const both = pile(rel(1, { side: 'buy', stage: 'closed' }), E('rel.put', 'holly', 3, { pid: 'pa', relId: 'r2', side: 'sell', stage: 'contacted' }))
  assert.deepEqual(both.chips, ['lead', 'past client'], 'one person can show several chips')
  assert.equal(both.pile, 'lead')
  const lost = pile(rel(1, { side: 'buy', stage: 'lost', reason: 'bought elsewhere' }))
  assert.equal(lost.pile, 'sphere'); assert.equal(lost.episodes[0].reason, 'bought elsewhere')
})
t('"past client" is not a stage: it is anyone with a closed episode, and stays after a new open one', () => {
  const c = card(build([...person('pa', 'Pat', 'T', P1), E('rel.put', 'holly', 1, { pid: 'pa', relId: 'r1', side: 'sell', stage: 'closed' }), E('rel.put', 'holly', 2, { pid: 'pa', relId: 'r2', side: 'buy', stage: 'offer' })]), 'pa')
  assert.deepEqual(c.chips, ['current client', 'past client'])
})
t('one open episode per side; a lost episode needs a reason (validate)', () => {
  const c = card(build([...person('pa', 'Pat', 'T', P1), E('rel.put', 'holly', 1, { pid: 'pa', relId: 'r1', side: 'buy', stage: 'showing' }), E('rel.put', 'holly', 1, { pid: 'pa', relId: 'r2', side: 'sell', stage: 'closed' })]), 'pa')
  assert.equal(canOpenEpisode(c, 'buy'), false)
  assert.equal(canOpenEpisode(c, 'sell'), true, 'a closed sale does not block a new one')
  assert.ok(validate(E('rel.put', 'holly', 1, { pid: 'pa', relId: 'r1', stage: 'lost' })).some((p) => /reason/.test(p)))
  assert.deepEqual(validate(E('rel.put', 'holly', 1, { pid: 'pa', relId: 'r1', stage: 'lost', reason: 'went quiet' })), [])
})
t('stage: the newest of card, Inbox marker and roadmap; Inbox status maps to stage', () => {
  const lead = { id: 'L1', name: 'Pat T', phone: P1, source: 'Contact form', when: at(0) }
  const stageOf = (markers, events = [], extra = {}) => { const r = build(events, { leads: [lead], markers, ...extra }); return r.cards[0] }
  assert.equal(stageOf([]).stage, 'new')
  const mk = (mins, status, echo = false) => ({ leadId: 'L1', ts: T0 + mins * MIN, status, echo })
  assert.equal(stageOf([mk(5, 'called')]).stage, 'contacted')
  assert.equal(stageOf([mk(5, 'called'), mk(6, 'showing')]).stage, 'showing')
  assert.equal(stageOf([mk(5, 'client')]).stage, 'under_contract')
  assert.equal(stageOf([mk(5, 'dead')]).stage, 'lost')
  // card says offer at t=50, a later Inbox "showing" at t=60 is newer, and wins
  const card50 = [...person('pa', 'Pat', 'T', P1), E('rel.put', 'holly', 50, { pid: 'pa', relId: 'r1', side: 'buy', stage: 'offer' })]
  assert.equal(stageOf([mk(40, 'called')], card50).stage, 'offer')
  assert.equal(stageOf([mk(60, 'showing')], card50).stage, 'showing')
})
t('stage: a -p echo marker is neither a stage fact nor contact (the finer card stage is not overwritten)', () => {
  const lead = { id: 'L1', name: 'Pat T', phone: P1, source: 'Contact form', when: at(0) }
  const ev = [...person('pa', 'Pat', 'T', P1), E('rel.put', 'holly', 50, { pid: 'pa', relId: 'r1', side: 'buy', stage: 'offer' })]
  const echo = { leadId: 'L1', ts: T0 + 51 * MIN, status: 'client', echo: true }
  const c = card(build(ev, { leads: [lead], markers: [echo] }), 'pa')
  assert.equal(c.stage, 'offer')
  assert.equal(c.lastContact, null, 'an echo of "called" must not reset gone quiet either')
  const echoCalled = { leadId: 'L1', ts: T0 + 52 * MIN, status: 'called', echo: true }
  assert.equal(card(build(ev, { leads: [lead], markers: [echoCalled] }), 'pa').lastContact, null)
  assert.deepEqual(parseMarker('admin/status/11111111-1111-1111-1111-111111111111/1760000000000-called-p'), { leadId: '11111111-1111-1111-1111-111111111111', ts: 1760000000000, status: 'called', echo: true })
  assert.deepEqual(parseMarker('admin/status/abc/1760000000000-client').echo, false)
  assert.equal(parseMarker('admin/status/abc/oops'), null)
})
t('roadmap: created = under contract, closed = closed, cancelled = back to showing with a line', () => {
  const deal = (status) => ({ id: 'D1', side: 'buyer', clientName: 'Pat T', clientPhone: P1, status, consent: 'none', updatedAt: at(10), createdAt: at(5), overdue: 0, unanswered: false })
  const c = (s) => build([], { deals: [deal(s)] }).cards[0]
  assert.equal(c('active').stage, 'under_contract'); assert.equal(c('active').pile, 'current client')
  assert.equal(c('closed').stage, 'closed'); assert.equal(c('closed').pile, 'past client')
  assert.equal(c('cancelled').stage, 'showing'); assert.equal(c('cancelled').stageLine, 'roadmap cancelled'); assert.equal(c('cancelled').pile, 'lead')
})
t('pile order: client > lead > past client > lake owner or waitlist buyer > sphere', () => {
  const wait = { id: 'L1', name: 'Walk In', phone: '517-555-0140', source: 'Waitlist', about: 'Devils Lake', when: at(0) }
  const owner = { id: 'L2', name: 'Lake Owner', phone: '517-555-0141', source: 'Lake owner', about: 'Round Lake', when: at(0) }
  const dead = (id) => ({ leadId: id, ts: T0 + MIN, status: 'dead', echo: false })
  const r = build([], { leads: [wait, owner], markers: [dead('L1'), dead('L2')] })
  assert.deepEqual(r.cards.map((c) => [c.name, c.pile]), [['Lake Owner', 'lake owner'], ['Walk In', 'waitlist buyer']])
  assert.deepEqual(r.cards.map((c) => c.lakes), [['Round Lake'], ['Devils Lake']])
})

// ── one relationship, several sources: the newest fact decides pile, quiet and Today ──
t('card closes the lead: lost on the card (with its dead echo) removes the lead chip, the new-lead row and quiet', () => {
  const lead = { id: 'L1', name: 'Pat Testington', phone: P1, source: 'Contact form', when: at(0) }
  const ev = [...person('pa', 'Pat', 'Testington', P1, null, 'holly', 1), E('rel.put', 'holly', 10, { pid: 'pa', relId: 'r1', side: 'buy', stage: 'lost', reason: 'bought elsewhere' })]
  const echo = { leadId: 'L1', ts: T0 + 10 * MIN, status: 'dead', echo: true }
  const r = build(ev, { leads: [lead], markers: [echo] })
  const c = card(r, 'pa')
  assert.deepEqual([c.chips, c.pile, c.quiet, c.stage], [['sphere'], 'sphere', null, 'lost'])
  assert.deepEqual(r.waiting, [])
  // without the echo the lead is still a fresh new lead: that is the contrast
  assert.deepEqual(card(build(ev, { leads: [lead] }), 'pa').chips, ['lead'])
})
t('card moves the lead along: contacted on the card (with its called echo) is one relationship, not a new lead plus a contacted one', () => {
  const lead = { id: 'L1', name: 'Pat Testington', phone: P1, source: 'Contact form', when: at(0) }
  const ev = [...person('pa', 'Pat', 'Testington', P1, null, 'holly', 1), E('rel.put', 'holly', 10, { pid: 'pa', relId: 'r1', side: 'buy', stage: 'contacted' })]
  const r = build(ev, { leads: [lead], markers: [{ leadId: 'L1', ts: T0 + 10 * MIN, status: 'called', echo: true }] })
  assert.deepEqual(r.waiting.map((w) => w.kind), ['quiet'], 'no "new lead" row once she has worked it; contacted ten days ago is quiet, correctly')
  assert.deepEqual(card(r, 'pa').episodes.map((e) => e.origin), ['card'])
})
t('Inbox closes the card: a newer Inbox dead marker closes an open card episode (no lead chip, not quiet)', () => {
  const lead = { id: 'L1', name: 'Pat Testington', phone: P1, source: 'Contact form', when: at(0) }
  const ev = [...person('pa', 'Pat', 'Testington', P1, null, 'holly', 1), E('rel.put', 'holly', 10, { pid: 'pa', relId: 'r1', side: 'buy', stage: 'showing' })]
  const dead = { leadId: 'L1', ts: T0 + 20 * MIN, status: 'dead', echo: false }
  const c = card(build(ev, { leads: [lead], markers: [dead] }), 'pa')
  assert.deepEqual([c.chips, c.quiet, c.stage], [['sphere'], null, 'lost'])
  const older = { leadId: 'L1', ts: T0 + 5 * MIN, status: 'dead', echo: false }
  assert.equal(card(build(ev, { leads: [lead], markers: [older] }), 'pa').stage, 'showing', 'an older Inbox fact does not close a newer card stage')
  // the owner can swap back: card says showing again after the Inbox dead
  const back = [...ev, E('rel.put', 'holly', 30, { pid: 'pa', relId: 'r1', stage: 'showing' })]
  const echo = { leadId: 'L1', ts: T0 + 30 * MIN, status: 'showing', echo: true }
  assert.equal(card(build(back, { leads: [lead], markers: [dead, echo] }), 'pa').stage, 'showing')
})
t('an imported closed sale never hides a fresh lead, and neither does a hand-backfilled one', () => {
  const lead = { id: 'L1', name: 'Pat Testington', phone: P1, source: 'Contact form', when: at(5) }
  for (const by of ['import', 'holly']) {
    const ev = [...person('pa', 'Pat', 'Testington', P1, null, by, 1), E('rel.put', by, 50, { pid: 'pa', relId: 'old', side: 'sell', stage: 'closed', closedOn: '2023-06-15' })]
    const c = card(build(ev, { leads: [lead] }), 'pa')
    assert.deepEqual(c.chips, ['lead', 'past client'], by)
  }
  // and a newer Inbox marker (even dead) never rewrites a closed sale
  const ev = [...person('pa', 'Pat', 'Testington', P1, null, 'holly', 1), E('rel.put', 'holly', 2, { pid: 'pa', relId: 'old', side: 'sell', stage: 'closed', closedOn: '2023-06-15' })]
  const c = card(build(ev, { leads: [lead], markers: [{ leadId: 'L1', ts: T0 + 30 * MIN, status: 'dead', echo: false }] }), 'pa')
  assert.deepEqual(c.chips, ['past client'])
  assert.equal(c.episodes.find((e) => e.origin === 'card').stage, 'closed')
})

// ── 4.4 last contact, gone quiet ────────────────────────────────────────
t('last contact: inbound and Holly\'s own texts count; automatic texts, plain notes and echoes do not', () => {
  const lead = { id: 'L1', name: 'Pat T', phone: P1, source: 'Contact form', when: at(0) }
  const msg = (mins, direction, author) => ({ direction, body: 'x', receivedAt: at(mins), author })
  const thread = (...m) => [{ phone: P1, messages: m }]
  const lc = (ctx, events = []) => build(events, { leads: [lead], ...ctx }).cards[0].lastContact
  assert.equal(lc({ threads: thread(msg(100, 'in'), msg(200, 'out', 'auto')) }), T0 + 100 * MIN)
  assert.equal(lc({ threads: thread(msg(100, 'in'), msg(150, 'out', 'holly'), msg(200, 'out', 'auto')) }), T0 + 150 * MIN)
  const base = person('pa', 'Pat', 'T', P1)
  assert.equal(lc({}, [...base, E('person.note', 'holly', 300, { pid: 'pa', kind: 'note', text: 'thinking' })]), null)
  assert.equal(lc({}, [...base, E('person.note', 'holly', 300, { pid: 'pa', kind: 'voicemail', text: 'left one', contactAt: at(250) })]), T0 + 250 * MIN)
  assert.equal(lc({ markers: [{ leadId: 'L1', ts: T0 + 260 * MIN, status: 'called', echo: false }, { leadId: 'L1', ts: T0 + 400 * MIN, status: 'showing', echo: true }] }), T0 + 260 * MIN)
  assert.equal(lc({ markers: [{ leadId: 'L1', ts: T0 + 260 * MIN, status: 'client', echo: false }] }), null, 'only Called and Showing are contact')
})
t('last contact also counts a stationery letter and a roadmap reply', () => {
  const ev = person('pa', 'Pat', 'T', P1, 'pat@example.com')
  assert.equal(card(build(ev, { letters: [{ to: 'PAT@example.com', at: at(33) }] }), 'pa').lastContact, T0 + 33 * MIN)
  const deal = { id: 'D1', side: 'buyer', clientName: 'Pat T', clientPhone: P1, status: 'active', consent: 'none', updatedAt: at(1), overdue: 0, unanswered: false, lastHollyNoteAt: at(44) }
  assert.equal(card(build(ev, { deals: [deal] }), 'pa').lastContact, T0 + 44 * MIN)
})
t('gone quiet: open at contacted, showing or offer, past N days; a future next step snoozes; a touch, a lower bar, or a loss clears it', () => {
  const todayStr = todayET(NOW)
  const plus = (d) => todayET(NOW + d * DAY)
  const quiet = (stage, extra = [], settings = []) => card(build([...person('pa', 'Pat', 'T', P1), E('rel.put', 'holly', 0, { pid: 'pa', relId: 'r1', side: 'buy', stage }), ...extra, ...settings]), 'pa').quiet
  assert.equal(quiet('showing').days, 10, 'no contact ever: counted from when it entered the stage')
  assert.equal(quiet('new'), null, 'a brand new lead is Today\'s "not yet contacted", not quiet')
  assert.equal(quiet('under_contract'), null)
  assert.equal(quiet('closed'), null)
  assert.equal(quiet('lost'), null)
  assert.equal(quiet('showing', [E('person.step', 'holly', 5, { pid: 'pa', text: 'call', due: plus(2) })]), null, 'a future next step is the snooze')
  assert.ok(quiet('showing', [E('person.step', 'holly', 5, { pid: 'pa', text: 'call', due: todayStr })]), 'due today is not a snooze')
  assert.equal(quiet('showing', [E('person.note', 'holly', 9 * 24 * 60, { pid: 'pa', kind: 'call', text: 'rang' })]), null, 'a touch yesterday')
  assert.ok(quiet('showing', [E('person.note', 'holly', 3 * 24 * 60, { pid: 'pa', kind: 'call', text: 'rang' })]), 'a touch 7 days ago is still quiet')
  assert.equal(quiet('showing', [], [E('settings.set', 'holly', 1, { key: 'quiet.days', value: 20 })]), null, 'quiet.days is a setting')
})

// ── 4.5 permission ──────────────────────────────────────────────────────
t('STOP and START words are Twilio\'s, matched on the whole message, any case', () => {
  assert.deepEqual([...STOP_WORDS].sort(), ['cancel', 'end', 'optout', 'quit', 'revoke', 'stop', 'stopall', 'unsubscribe'])
  assert.deepEqual([...START_WORDS].sort(), ['start', 'unstop'])
  for (const s of ['STOP', ' stop ', 'Stop.', 'StopAll', 'UNSUBSCRIBE', 'quit!']) assert.ok(isStopText(s), s)
  for (const s of ['stop calling me', 'please stop', 'stopping by', 'yes', '', 'bus stop']) assert.ok(!isStopText(s), s)
  assert.ok(isStartText('Start') && isStartText('UNSTOP') && !isStartText('yes') && !isStartText('start texting me'))
})
t('text state: none, ticked, agreed (event or roadmap YES), replied, declined', () => {
  const ts = (e) => textState(K1, e)
  assert.equal(ts({}).state, 'none'); assert.equal(ts({}).canText, false)
  assert.deepEqual([ts({ forms: [{ smsConsent: true, when: at(1) }] }).state, ts({ forms: [{ smsConsent: true, when: at(1) }] }).canText], ['ticked', true])
  assert.equal(ts({ events: [{ state: 'agreed', at: at(1), how: 'in person' }] }).state, 'agreed')
  assert.match(ts({ events: [{ state: 'agreed', at: at(1), how: 'in person' }] }).why, /in person/)
  assert.equal(ts({ deals: [{ consent: 'yes', updatedAt: at(1) }] }).state, 'agreed')
  assert.equal(ts({ deals: [{ consent: 'asked', updatedAt: at(1) }] }).state, 'none', 'asked is not agreed')
  assert.deepEqual([ts({ messages: [{ direction: 'in', body: 'hi there', receivedAt: at(1) }] }).state, ts({ messages: [{ direction: 'in', body: 'hi', receivedAt: at(1) }] }).canText], ['replied', true])
  assert.equal(ts({ messages: [{ direction: 'out', body: 'hi', receivedAt: at(1) }] }).state, 'none', 'our own text is not their reply')
  assert.deepEqual([ts({ forms: [{ smsDeclined: true, when: at(1) }] }).state, ts({ forms: [{ smsDeclined: true, when: at(1) }] }).canText], ['declined', false])
  assert.equal(ts({ events: [{ state: 'withdrawn', at: at(1) }] }).state, 'declined')
})
t('text state choice 1: STOP is sticky, and beats a tick or an agreement of ANY date', () => {
  const stop = { direction: 'in', body: 'STOP', receivedAt: at(10) }
  assert.equal(textState(K1, { messages: [stop] }).state, 'stopped')
  assert.equal(textState(K1, { messages: [stop], forms: [{ smsConsent: true, when: at(5) }] }).state, 'stopped')
  assert.equal(textState(K1, { messages: [stop], forms: [{ smsConsent: true, when: at(99) }] }).state, 'stopped', 'a LATER tick does not undo it')
  assert.equal(textState(K1, { messages: [stop], events: [{ state: 'agreed', at: at(99) }], deals: [{ consent: 'yes', updatedAt: at(99) }] }).state, 'stopped')
  assert.equal(textState(K1, { messages: [stop, { direction: 'in', body: 'ok thanks', receivedAt: at(20) }] }).state, 'stopped', 'another message does not clear it')
  assert.equal(textState(K1, { messages: [stop] }).canText, false)
  assert.equal(textState(K1, { messages: [stop] }).canCall, true)
})
t('text state choice 2: START clears it, facts older than the START are void, the number is "replied"', () => {
  const stop = { direction: 'in', body: 'stop', receivedAt: at(10) }
  const start = { direction: 'in', body: 'UNSTOP', receivedAt: at(30) }
  assert.equal(textState(K1, { messages: [stop, start] }).state, 'replied')
  assert.equal(textState(K1, { messages: [stop, start], forms: [{ smsConsent: true, when: at(5) }] }).state, 'replied', 'the old tick is void')
  assert.equal(textState(K1, { messages: [stop, start], forms: [{ smsConsent: true, when: at(40) }] }).state, 'ticked', 'a new tick counts')
  assert.equal(textState(K1, { messages: [stop, start, { ...stop, receivedAt: at(40) }] }).state, 'stopped', 'STOP after START stops again')
  assert.equal(textState(K1, { messages: [{ direction: 'in', body: 'STOP', receivedAt: at(10) }, { direction: 'in', body: 'YES', receivedAt: at(20) }] }).state, 'stopped', 'YES is not treated as an opt-in')
})
t('text state choice 3: not literal newest-wins (a tick survives a later reply; a newer decline beats an older tick; a tie goes to the safer answer)', () => {
  const reply = { direction: 'in', body: 'thanks', receivedAt: at(50) }
  assert.equal(textState(K1, { messages: [reply], forms: [{ smsConsent: true, when: at(10) }] }).state, 'ticked')
  assert.equal(textState(K1, { forms: [{ smsConsent: true, when: at(10) }, { smsDeclined: true, when: at(20) }] }).state, 'declined')
  assert.equal(textState(K1, { forms: [{ smsConsent: true, when: at(30) }, { smsDeclined: true, when: at(20) }] }).state, 'ticked')
  assert.equal(textState(K1, { messages: [reply], forms: [{ smsDeclined: true, when: at(20) }] }).state, 'replied', 'a text after a decline lifts it to replied')
  assert.equal(textState(K1, { forms: [{ smsConsent: true, when: at(20) }, { smsDeclined: true, when: at(20) }] }).state, 'declined', 'tie')
  assert.equal(textState(K1, { events: [{ state: 'agreed', at: at(10) }, { state: 'withdrawn', at: at(20) }] }).state, 'declined')
})
t('a roadmap YES is dated by its own yesAt only: an edit to the roadmap does not re-date it', () => {
  const late = at(90)
  const yes = (extra) => ({ consent: 'yes', updatedAt: late, ...extra })
  assert.equal(textState(K1, { deals: [yes({ textConsent: { yesAt: at(5) } })], events: [{ state: 'withdrawn', at: at(20) }] }).state, 'declined', 'a later withdrawn beats the YES')
  assert.equal(textState(K1, { deals: [yes()], events: [{ state: 'withdrawn', at: at(20) }] }).state, 'declined', 'an undated YES is the oldest fact')
  const stop = { direction: 'in', body: 'STOP', receivedAt: at(10) }, start = { direction: 'in', body: 'START', receivedAt: at(30) }
  assert.equal(textState(K1, { messages: [stop, start], deals: [yes()] }).state, 'replied', 'an undated YES does not come back after STOP then START')
  assert.equal(textState(K1, { messages: [stop, start], deals: [yes({ textConsent: { yesAt: at(5) } })] }).state, 'replied')
  assert.equal(textState(K1, { messages: [stop, start], deals: [yes({ textConsent: { yesAt: at(40) } })] }).state, 'agreed', 'a YES after the START counts')
  assert.equal(textState(K1, { deals: [yes()] }).state, 'agreed', 'with nothing else, an undated YES still stands')
})
t('a display-only card ("Pat and Chris Example") is named, so it never auto-merges with a different name', () => {
  const cards = build([put('pc', { display: 'Pat and Chris Example' }), addPhone('pc', P1)]).cards
  assert.equal(cards[0].name, 'Pat and Chris Example')
  const pat = matchRecord(cards, { first: 'Pat', last: 'Example', phones: [P1], emails: [] })
  assert.deepEqual([pat.kind, pat.suggest], ['new', ['pc']])
  assert.equal(matchRecord(cards, { display: 'pat and chris example', phones: [P1], emails: [] }).kind, 'merge', 'the exact same typed name is the same card')
  assert.equal(matchRecord(cards, { first: '', last: '', phones: [P1], emails: [] }).kind, 'merge', 'a nameless thread still merges')
  const twin = build([put('a', { display: 'Pat and Chris Example' }), put('b', { display: 'Pat and Chris Example' })])
  assert.deepEqual(twin.suggestions.map((x) => x.why), ['same name, no phone or email'])
})
t('permission follows the number: a card shows each phone\'s own state, and a card-less thread with STOP is stopped', () => {
  const ev = [...person('pa', 'Pat', 'T', P1), addPhone('pa', P2)]
  const ctx = {
    leads: [{ id: 'L1', name: 'Pat T', phone: P1, source: 'Contact form', when: at(1), smsConsent: true }],
    threads: [{ phone: P2, messages: [{ direction: 'in', body: 'STOP', receivedAt: at(5) }] }],
  }
  const c = card(build(ev, ctx), 'pa')
  assert.deepEqual(c.phones.map((p) => [p.key, p.text.state]), [[K1, 'ticked'], [K2, 'stopped']])
})
t('an imported phone lands as "none": the import can never grant text permission', () => {
  const batch = E('import.batch', 'import', 5, { batchId: 'b1', source: 'csv', people: [{ pid: 'pi', fields: { first: 'Dan', last: 'T' }, contacts: [{ kind: 'phone', value: P1, src: 'csv' }] }] })
  assert.equal(card(build([batch]), 'pi').phones[0].text.state, 'none')
  const forged = E('consent.text', 'import', 6, { phone: K1, state: 'agreed' })
  const r = build([batch, forged])
  assert.equal(card(r, 'pi').phones[0].text.state, 'none'); assert.equal(r.ignored, 1)
  assert.ok(validate(forged).some((p) => /import can never grant/.test(p)))
  assert.deepEqual(validate(E('consent.text', 'import', 6, { phone: K1, state: 'withdrawn' })), [], 'an import may only tighten')
})
t('email policy table, and the card shows each address\'s own line', () => {
  assert.deepEqual(['confirmed', 'pending', null, 'unsubscribed', 'bounced', 'complained', 'never_opted_in'].map((s) => { const p = emailPolicy(s); return [p.line, p.newsletter, p.yearly, p.emailButton] }), [
    ['On the newsletter', true, true, true], ['Not on the newsletter', false, true, true], ['Not on the newsletter', false, true, true],
    ['Do not email', false, false, false], ['Do not email', false, false, false], ['Do not email', false, false, false], ['Do not email', false, false, false],
  ])
  const c = card(build([...person('pa', 'Pat', 'T', null, 'pat@example.com'), addEmail('pa', 'sam@example.com')], { emailStatus: { 'pat@example.com': 'unsubscribed' } }), 'pa')
  assert.deepEqual(c.emails.map((e) => [e.key, e.line, e.emailButton]), [['pat@example.com', 'Do not email', false], ['sam@example.com', 'Not on the newsletter', true]])
})

// ── 4.6 matching ────────────────────────────────────────────────────────
const people = () => build([
  ...person('pat', 'Pat', 'Testington', P1, 'pat@example.com'),
  ...person('paul', 'Paul', 'Otherson', P2, 'paul@example.com'),
  ...person('dan', 'Dan', 'Sampleton', P3, 'dan@example.com'),
]).cards
t('matching rule 2 and 3: no shared key is new; same name on a shared key merges', () => {
  assert.deepEqual(matchRecord(people(), { first: 'Zed', last: 'Nobody', phones: ['517-555-0199'], emails: [] }), { kind: 'new', suggest: [], why: 'no shared phone or email' })
  const m = matchRecord(people(), { first: 'pat', last: 'TESTINGTON', phones: [], emails: ['PAT@example.com'] })
  assert.equal(m.kind, 'merge'); assert.equal(m.pid, 'pat'); assert.deepEqual(m.link, [])
  assert.equal(matchRecord(people(), { first: 'Pat', last: '', phones: [P1], emails: [] }).kind, 'merge', 'a blank last name is compatible')
})
t('matching rule 4: Pat and Paul on a family landline, and Dan and Daniel, do NOT merge; they are flagged', () => {
  const cards = build([...person('pat', 'Pat', 'Testington', P1, null)]).cards
  const m = matchRecord(cards, { first: 'Paul', last: 'Testington', phones: [P1], emails: [] })
  assert.deepEqual([m.kind, m.suggest], ['new', ['pat']])
  const dan = matchRecord(people(), { first: 'Daniel', last: 'Sampleton', phones: [], emails: ['dan@example.com'] })
  assert.deepEqual([dan.kind, dan.suggest], ['new', ['dan']])
})
t('matching rule 3 bridge: one row carrying a phone and an email joins the two cards that are the same person', () => {
  const cards = build([...person('lead', 'Pat', 'Testington', P1, null), ...person('mc', 'Pat', 'Testington', null, 'pat@example.com', 'import')]).cards
  const m = matchRecord(cards, { first: 'Pat', last: 'Testington', phones: [P1], emails: ['pat@example.com'] })
  assert.equal(m.kind, 'merge'); assert.equal(m.pid, 'lead'); assert.deepEqual(m.link, [['lead', 'mc']])
  const split = build([...person('lead', 'Pat', 'Testington', P1, null), ...person('mc', 'Paul', 'Testington', null, 'pat@example.com', 'import')]).cards
  const no = matchRecord(split, { first: 'Pat', last: 'Testington', phones: [P1], emails: ['pat@example.com'] })
  assert.deepEqual([no.kind, no.suggest], ['new', ['lead', 'mc']], 'candidates that disagree: no merge at all')
})
t('matching: a nameless text thread merges only when every candidate agrees; two different people on one number is a flag', () => {
  const one = build(person('pat', 'Pat', 'Testington', P1)).cards
  assert.equal(matchRecord(one, { first: '', last: '', phones: [P1], emails: [] }).kind, 'merge')
  const two = build([...person('a', 'Pat', 'T', P1), ...person('b', 'Paul', 'T', P1)]).cards
  assert.equal(matchRecord(two, { first: '', last: '', phones: [P1], emails: [] }).kind, 'new')
})
t('matching rule 5: a row with no phone and no email is never merged; an exact name is only a suggestion', () => {
  const cards = people()
  const same = matchRecord(cards, { first: 'Pat', last: 'Testington', phones: [], emails: [] })
  assert.deepEqual([same.kind, same.suggest], ['new', ['pat']])
  assert.deepEqual(matchRecord(cards, { first: 'Zed', last: 'Nobody', phones: [], emails: [] }).suggest, [])
  assert.deepEqual(matchRecord(cards, { first: 'Pat', last: '', phones: ['nope'], emails: [] }).kind, 'new')
})
t('possibly the same person: a no-contact card with an exact-name twin is listed; cards with a shared key too', () => {
  const r = build([...person('a', 'Pat', 'Testington'), ...person('b', 'pat', 'testington'), ...person('c', 'Sam', 'Sampleton', P1), ...person('d', 'Sam', 'Other', P1)])
  assert.deepEqual(r.suggestions.map((s) => [s.a, s.b, s.why]), [['a', 'b', 'same name, no phone or email'], ['c', 'd', 'same phone']])
})

// ── 4.6 attaching records that live elsewhere ───────────────────────────
t('attach: a lead, a text thread and a roadmap join the card by phone, then email; the card shows the name each arrived with', () => {
  const ev = person('pa', 'Pat', 'Testington', P1, 'pat@example.com')
  const r = build(ev, {
    leads: [{ id: 'L1', name: 'Patricia T', phone: '517 555 0101', source: 'Contact form', when: at(1) }, { id: 'L2', name: 'Pat Testington', phone: '', email: 'PAT@example.com', source: 'Chat', when: at(2) }],
    threads: [{ phone: K1, messages: [{ direction: 'in', body: 'hi', receivedAt: at(3) }] }],
    deals: [{ id: 'D1', side: 'buyer', clientName: 'Pat T', clientPhone: '(517) 555-0101', status: 'active', consent: 'none', updatedAt: at(4), overdue: 0, unanswered: false }],
  })
  assert.equal(r.cards.length, 1)
  const c = r.cards[0]
  assert.deepEqual([c.leads.map((l) => l.name).sort(), c.threads.length, c.deals.length], [['Pat Testington', 'Patricia T'], 1, 1])
})
t('attach: two cards share a phone, so a record goes to the better name match, else the older card', () => {
  const ev = [...person('pa', 'Pat', 'Testington', P1, null, 'holly', 0), ...person('pb', 'Chris', 'Testington', P1, null, 'holly', 5)]
  const lead = (id, name) => ({ id, name, phone: P1, source: 'Contact form', when: at(9) })
  const r = build(ev, { leads: [lead('L1', 'Chris Testington'), lead('L2', 'Zed Other')] })
  assert.deepEqual(card(r, 'pb').leads.map((l) => l.id), ['L1'])
  assert.deepEqual(card(r, 'pa').leads.map((l) => l.id), ['L2'], 'no name match: the older card')
})
t('a lead with no card is a person at once: two forms from one phone are one person, an email-only form joins by email', () => {
  const r = build([], { leads: [
    { id: 'L1', name: 'Pat Testington', phone: P1, email: 'pat@example.com', source: 'Contact form', when: at(1) },
    { id: 'L2', name: 'Pat T', phone: P1, email: 'other@example.com', source: 'Waitlist', about: 'Devils Lake', when: at(2) },
    { id: 'L3', name: 'Pat Testington', phone: '', email: 'other@example.com', source: 'Chat', when: at(3) },
    { id: 'L4', name: 'Sam Sampleton', phone: P2, source: 'Contact form', when: at(4) },
  ] })
  assert.equal(r.cards.length, 2)
  const pat = r.cards.find((c) => c.first === 'Pat')
  assert.deepEqual([pat.virtual, pat.leads.length, pat.id], [true, 3, derivePid(`phone:${K1}`)])
  assert.equal(r.cards.find((c) => c.first === 'Sam').id, derivePid(`phone:${K2}`))
})
t('a text thread alone is a person named by its number; the desk\'s own cell is never one', () => {
  const r = build([], { hollyPhone: '5175550188', threads: [{ phone: P1, messages: [{ direction: 'in', body: 'hello', receivedAt: at(1) }] }, { phone: '517-555-0188', messages: [{ direction: 'in', body: 'me', receivedAt: at(2) }] }] })
  assert.deepEqual(r.cards.map((c) => [c.name, c.phones.map((p) => p.key)]), [['', [K1]]])
})
t('touching a card-less lead twice, or from two writers at once, leaves one card (same derived id)', () => {
  const lead = { id: 'L1', name: 'Pat Testington', phone: P1, source: 'Contact form', when: at(1) }
  const pid = newPid({ phones: [P1], emails: [] })
  assert.equal(pid, build([], { leads: [lead] }).cards[0].id)
  const writer = (mins) => [put(pid, { first: 'Pat', last: 'Testington' }, 'holly', mins), addPhone(pid, P1, 'holly', mins)]
  const r = build([...writer(10), ...writer(10), ...writer(11)], { leads: [lead] })
  assert.equal(r.cards.length, 1)
  assert.deepEqual([r.cards[0].virtual, r.cards[0].id, r.cards[0].leads.length], [false, pid, 1])
})
t('matching runs first: a lead that arrives for a phone already on a card does not make a second card', () => {
  const ev = person('pa', 'Pat', 'Testington', P1)
  const r = build(ev, { leads: [{ id: 'L1', name: 'Pat Testington', phone: P1, source: 'Contact form', when: at(1) }] })
  assert.equal(r.cards.length, 1)
  assert.equal(matchRecord(r.cards, { first: 'Pat', last: 'Testington', phones: [P1], emails: [] }).pid, 'pa')
})

// ── Today ───────────────────────────────────────────────────────────────
t('Today: the plan\'s order (new lead, their text, roadmap, next step, quiet), oldest first, one row per person', () => {
  const today = todayET(NOW)
  const ev = [
    ...person('q', 'Quiet', 'Person', '517-555-0150'), E('rel.put', 'holly', 0, { pid: 'q', relId: 'r', side: 'buy', stage: 'showing' }),
    ...person('s', 'Step', 'Person', '517-555-0151'), E('person.step', 'holly', 1, { pid: 's', text: 'send comps', due: today }),
    ...person('f', 'Future', 'Person', '517-555-0152'), E('person.step', 'holly', 1, { pid: 'f', text: 'later', due: todayET(NOW + 3 * DAY) }),
  ]
  const lead = (id, name, phone, mins) => ({ id, name, phone, source: 'Contact form', when: at(mins) })
  const ctx = {
    leads: [lead('LN', 'New Person', '517-555-0160', 100), lead('LO', 'Older Person', '517-555-0161', 50)],
    threads: [
      { phone: '517-555-0162', messages: [{ direction: 'in', body: 'Is the cottage still available?', receivedAt: at(200) }] },
      { phone: '517-555-0163', messages: [{ direction: 'in', body: 'hi', receivedAt: at(10) }, { direction: 'out', body: 'hello', author: 'holly', receivedAt: at(11) }] },
      { phone: '517-555-0164', messages: [{ direction: 'in', body: 'STOP', receivedAt: at(12) }] },
    ],
    deals: [{ id: 'D1', side: 'buyer', clientName: 'Road Map', clientPhone: '517-555-0165', status: 'active', consent: 'none', updatedAt: at(300), overdue: 2, unanswered: false }],
  }
  const w = build(ev, ctx).waiting
  assert.deepEqual(w.map((x) => [x.kind, x.name]), [
    ['new_lead', 'Older Person'], ['new_lead', 'New Person'], ['text', ''], ['roadmap', 'Road Map'], ['next_step', 'Step Person'], ['quiet', 'Quiet Person'],
  ])
  assert.match(w[2].reason, /cottage/)
  assert.match(w[3].reason, /2 roadmap steps overdue/)
  const dup = build([...ev, ...person('x', 'Both', 'Reasons', '517-555-0170'), E('person.step', 'holly', 1, { pid: 'x', text: 'ring', due: today })], { leads: [lead('LX', 'Both Reasons', '517-555-0170', 5)] }).waiting
  assert.deepEqual(dup.filter((x) => x.name === 'Both Reasons').map((x) => [x.kind, x.also]), [['new_lead', ['next_step']]])
})

// ── imports expand into ordinary changes ────────────────────────────────
t('import.batch: one change, expands to people, contacts, notes and sales; a hand edit still wins; replay is harmless', () => {
  const batch = E('import.batch', 'import', 50, { batchId: 'b1', source: 'csv', people: [
    { pid: 'pi', fields: { first: 'Dan', last: 'Testington', tags: ['2023'] }, contacts: [{ kind: 'email', value: 'dan@example.com', src: 'mc' }, { kind: 'phone', value: P1, src: 'csv' }], notes: [{ id: 'n1', text: 'likes the lake' }] },
  ], rels: [{ pid: 'pi', relId: 's1', side: 'sell', stage: 'closed', closedOn: '2023-06-15', price: 450000, saleKey: 'k1' }] })
  const hand = put('pi', { first: 'Daniel' }, 'holly', 10)
  const r = build([batch, hand, batch])
  const c = card(r, 'pi')
  assert.deepEqual([c.first, c.last, c.tags, c.pile], ['Daniel', 'Testington', ['2023'], 'past client'])
  assert.deepEqual([c.emails.map((e) => e.src), c.phones.map((p) => p.src), c.notes.map((x) => x.text)], [[['mc']], [['csv']], ['likes the lake']])
  assert.deepEqual([c.episodes[0].price, c.episodes[0].saleKey, c.sources], [450000, 'k1', ['csv', 'mc']])
  assert.equal(snapshot([batch, hand, batch]), snapshot([hand, batch]))
})
t('validate: the store can refuse a bad change before it is written', () => {
  const ok = E('person.contact', 'holly', 1, { pid: 'pa', kind: 'phone', value: P1, op: 'add' })
  assert.deepEqual(validate(ok), [])
  assert.ok(validate({ ...ok, value: '555-0101' }).length)
  assert.ok(validate({ ...ok, by: 'robot' }).length)
  assert.ok(validate({ ...ok, type: 'person.teleport' }).length)
  assert.ok(validate(E('person.link', 'holly', 1, { a: 'pa', b: 'pa', kind: 'same' })).length)
  assert.ok(validate(E('person.note', 'holly', 1, { pid: 'pa', text: '  ' })).length)
  assert.ok(validate(E('consent.text', 'holly', 1, { phone: 'nope', state: 'agreed' })).length)
  assert.deepEqual(validate(E('consent.text', 'holly', 1, { phone: P1, state: 'agreed', how: 'in person' })), [])
})
t('an unknown or malformed change is ignored and counted, never thrown', () => {
  const r = build([put('pa', { first: 'Pat' }), { id: 'z1', at: at(1), by: 'holly', type: 'person.teleport' }, E('person.contact', 'holly', 1, { pid: 'pa', kind: 'phone', value: 'nope', op: 'add' }), null, {}])
  assert.equal(r.cards.length, 1); assert.equal(r.ignored, 2)
})

console.log(`\n${pass} checks passed`)
