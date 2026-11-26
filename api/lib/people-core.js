import { createHash } from 'node:crypto'

// The person record, as pure functions. No storage, no network, no clock: the
// caller hands in the change log (events), the records that live elsewhere
// (leads, text threads, status markers, roadmaps, newsletter status) and `now`.
// Everything on a card is WORKED OUT from those inputs; nothing derived is stored.
//
// The rules live in PERSON-RECORD-PLAN.md sections 4.2 to 4.6. Short version:
//   * The log is a set of small changes. Replaying it twice, or in any order,
//     gives the same cards: events are de-duplicated by id and every rule below
//     is "highest rank wins", never "last applied wins".
//   * A value set by hand (holly, yeti) is never replaced by an import.
//   * Permission belongs to a phone number or an email address, never a person.
//   * A merged card is computed from its members, so unlinking restores both.

export const HAND = new Set(['holly', 'yeti'])
export const BY = new Set(['holly', 'yeti', 'import', 'system'])
export const STAGES = ['new', 'contacted', 'showing', 'offer', 'under_contract', 'closed', 'lost']
export const OPEN_STAGES = ['new', 'contacted', 'showing', 'offer', 'under_contract']
export const SIDES = ['buy', 'sell', 'unknown']
export const NOTE_KINDS = ['note', 'call', 'met', 'email', 'text', 'voicemail']
export const TOUCH_KINDS = ['call', 'met', 'email', 'text', 'voicemail'] // a plain note is not contact
export const LINK_KINDS = ['same', 'household', 'distinct']
export const SETTINGS_DEFAULTS = { 'quiet.days': 5, 'digest.enabled': false, 'lakeTexts.mode': 'off', 'yearlyEmail.enabled': false }
export const LEAD_TO_STAGE = { new: 'new', called: 'contacted', showing: 'showing', client: 'under_contract', dead: 'lost' }

const FIELDS = ['first', 'last', 'display', 'how', 'lakes', 'tags', 'addresses', 'extra']
const EPISODE_FIELDS = ['side', 'stage', 'reason', 'address', 'lake', 'openedOn', 'closedOn', 'price', 'saleKey', 'src']
const DAY = 86400000

// ── small helpers ───────────────────────────────────────────────────────

const ms = (at) => {
  const t = typeof at === 'number' ? at : Date.parse(at)
  return Number.isFinite(t) ? t : 0
}
const cmpStr = (a, b) => (a < b ? -1 : a > b ? 1 : 0)
const by = (f) => (a, b) => cmpStr(f(a), f(b))
const uniq = (a) => [...new Set(a)]

// Rank of one fact. Hand beats import; then newest; then event id as a tiebreak
// so two writers at the same millisecond still resolve the same way everywhere.
const rank = (ev) => ({ h: HAND.has(ev.by) ? 1 : 0, t: ms(ev.at), id: String(ev.id) })
const cmpRank = (a, b) => a.h - b.h || a.t - b.t || cmpStr(a.id, b.id)
const keepBest = (map, key, cand) => {
  if (!map[key] || cmpRank(cand.rank, map[key].rank) > 0) map[key] = cand
}

export function todayET(now) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Detroit', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(ms(now)))
}

// ── keys ────────────────────────────────────────────────────────────────

// A phone key is exactly ten digits, area code 2-9. Anything else is not a
// number we can match on (an extension, a short string, a typo).
export function phoneKey(raw) {
  let d = String(raw ?? '').replace(/\D/g, '')
  if (d.length === 11 && d[0] === '1') d = d.slice(1)
  if (d.length !== 10 || !/^[2-9]/.test(d)) return null
  return d
}

export function emailKey(raw) {
  const e = String(raw ?? '').trim().toLowerCase()
  return /^[^@\s,;<>]+@[^@\s,;<>]+\.[^@\s,;<>]+$/.test(e) ? e : null
}

export function prettyPhone(key) {
  return key && key.length === 10 ? `(${key.slice(0, 3)}) ${key.slice(3, 6)}-${key.slice(6)}` : String(key || '')
}

// A card id for someone who has no card yet. Derived from the key, so the desk
// and the hourly job, creating the card at the same moment, write the same id.
// Matching always runs first; this is only used when no card matches.
export function derivePid(key) {
  return 'p-' + createHash('sha256').update(String(key)).digest('hex').slice(0, 20)
}

export function newPid(rec) {
  const phone = (rec.phones || []).map(phoneKey).filter(Boolean).sort()[0]
  if (phone) return derivePid(`phone:${phone}`)
  const email = (rec.emails || []).map(emailKey).filter(Boolean).sort()[0]
  return email ? derivePid(`email:${email}`) : null // no key: the caller mints a random id
}

// ── names ───────────────────────────────────────────────────────────────

const nameKey = (s) => String(s || '').toLowerCase().replace(/[^\p{L}\p{N}]/gu, '')
// A name typed as one string ("Pat and Chris Example") has a display but no first
// and last. It is still a name, so it must never read as nameless and auto-merge.
const fullName = (n) => nameKey(n.display || n.name || `${n.first || ''} ${n.last || ''}`)
const hasName = (n) => Boolean(nameKey(n.first) || nameKey(n.last) || fullName(n))
const parsedName = (n) => Boolean(nameKey(n.first))

// Plan 4.6 rule 3. Equal first names (case and punctuation ignored) and equal
// or one blank last name; or one side has no name at all (a text thread).
// Pat and Paul do not match. Dan and Daniel do not match: they cost one tap.
export function nameCompatible(a, b) {
  if (!hasName(a) || !hasName(b)) return true
  if (!parsedName(a) || !parsedName(b)) return fullName(a) === fullName(b) // only the same typed name
  const fa = nameKey(a.first), fb = nameKey(b.first)
  if (!fa || !fb || fa !== fb) return false
  const la = nameKey(a.last), lb = nameKey(b.last)
  return !la || !lb || la === lb
}

const sameName = (a, b) => hasName(a) && hasName(b) && fullName(a) === fullName(b)

// ── text permission: STOP, START, and what a phone number has agreed to ──

// Twilio's default opt-out words for long codes (docs: Advanced Opt-Out).
// START and UNSTOP are its reserved opt-in words. YES is deliberately NOT here:
// treating it as an opt-in could show a number as textable that never was.
export const STOP_WORDS = new Set(['stop', 'unsubscribe', 'end', 'quit', 'stopall', 'revoke', 'optout', 'cancel'])
export const START_WORDS = new Set(['start', 'unstop'])
const bodyWord = (b) => String(b || '').trim().toLowerCase().replace(/^[^a-z]+|[^a-z]+$/g, '')
export const isStopText = (body) => STOP_WORDS.has(bodyWord(body))
export const isStartText = (body) => START_WORDS.has(bodyWord(body))

// One function for the card and for the desk's send buttons. evidence:
//   messages: this number's thread  [{ direction, body, receivedAt }]
//   forms:    leads with this phone [{ smsConsent, smsDeclined, smsConsentAt|when }]
//   events:   consent.text changes for this phone [{ state, at }]
//   deals:    roadmaps with this phone [{ consent: 'yes'|'asked'|'none', textConsent?, updatedAt }]
//
// Three choices that the plan did not spell out (list for Yeti):
//  1. STOP is sticky: it beats a tick or an "agreed" of ANY date. Only an
//     inbound START or UNSTOP clears it.
//  2. After START, every fact dated before the START is void. The number is
//     `replied` (they texted the line) until a new tick or agreement.
//  3. Not literal "newest wins": a tick or agreement survives a later inbound
//     text, a newer decline beats an older tick, and a text after a decline
//     lifts it to `replied`. A tie goes to the safer answer.
export function textState(phone, evidence = {}) {
  const inbound = (evidence.messages || [])
    .filter((m) => m.direction === 'in')
    .map((m) => ({ at: ms(m.receivedAt), body: m.body }))
  const stopAt = Math.max(0, ...inbound.filter((m) => isStopText(m.body)).map((m) => m.at))
  const startAt = Math.max(0, ...inbound.filter((m) => isStartText(m.body)).map((m) => m.at))
  const out = (state, at, why) => ({ state, at: at || null, why, canText: ['ticked', 'agreed', 'replied'].includes(state), canCall: true })

  if (stopAt && !(startAt > stopAt)) return out('stopped', stopAt, 'Texted STOP')
  const floor = stopAt ? startAt : 0 // after a STOP, only what came after the START counts
  const live = (at) => at > floor || !floor

  const positives = []
  for (const f of evidence.forms || []) {
    const at = ms(f.smsConsentAt || f.when)
    if (f.smsConsent === true && live(at)) positives.push({ state: 'ticked', at, why: 'Ticked the texting box on a form' })
  }
  for (const e of evidence.events || []) {
    const at = ms(e.at)
    if (e.state === 'agreed' && live(at)) positives.push({ state: 'agreed', at, why: e.how ? `They told me I can text them (${e.how})` : 'They told me I can text them' })
  }
  for (const d of evidence.deals || []) {
    // dated ONLY by its own yesAt: an edit to the roadmap must not re-date the YES.
    // An undated YES is the oldest fact there is (it loses to any later withdrawal and is void after a STOP).
    const at = ms(d.textConsent?.yesAt)
    if ((d.consent === 'yes' || d.textConsent?.yesAt) && live(at)) positives.push({ state: 'agreed', at, why: 'Replied YES to the roadmap text' })
  }
  const negatives = []
  for (const f of evidence.forms || []) {
    const at = ms(f.smsConsentAt || f.when)
    if (f.smsDeclined === true && live(at)) negatives.push({ state: 'declined', at, why: 'Saw the texting box and left it unticked' })
  }
  for (const e of evidence.events || []) {
    const at = ms(e.at)
    if (e.state === 'withdrawn' && live(at)) negatives.push({ state: 'declined', at, why: 'Told me not to text' })
  }
  const best = (list) => list.reduce((a, b) => (!a || b.at > a.at || (b.at === a.at && b.state === 'agreed') ? b : a), null)
  const P = best(positives)
  const N = best(negatives)
  // the START text itself is a reply: it sits exactly on the floor, so it is allowed through
  const replies = inbound.filter((m) => (!floor || m.at >= floor) && !isStopText(m.body))
  const repliedAt = Math.max(0, ...replies.map((m) => m.at))
  const replied = replies.length ? { state: 'replied', at: repliedAt, why: 'They texted the site line first' } : null

  if (P && (!N || P.at > N.at)) return out(P.state, P.at, P.why)
  if (N) return replied && replied.at > N.at ? out('replied', replied.at, replied.why) : out('declined', N.at, N.why)
  if (replied) return out('replied', replied.at, replied.why)
  return out('none', null, 'Never asked')
}

// Email, per address. One home: the newsletter store. This table is what a card
// shows and what every automated sender must agree with.
export function emailPolicy(status) {
  switch (status) {
    case 'confirmed': return { status, line: 'On the newsletter', newsletter: true, yearly: true, emailButton: true }
    case 'unsubscribed':
    case 'bounced':
    case 'complained':
    case 'never_opted_in': return { status, line: 'Do not email', newsletter: false, yearly: false, emailButton: false }
    default: return { status: status || null, line: 'Not on the newsletter', newsletter: false, yearly: true, emailButton: true } // pending, or no record
  }
}

// ── events: validate, expand, fold ──────────────────────────────────────

export const EVENT_TYPES = ['person.put', 'person.contact', 'person.note', 'person.step', 'rel.put', 'person.link', 'person.unlink', 'consent.text', 'review.asked', 'settings.set', 'import.batch']

// Problems with an event, as plain sentences. Empty means fine. The store runs
// this before writing, so a bad change never reaches the log.
export function validate(ev) {
  const p = []
  if (!ev || typeof ev !== 'object') return ['not an object']
  if (!ev.id || typeof ev.id !== 'string') p.push('id is required')
  if (!ms(ev.at)) p.push('at must be a date')
  if (!BY.has(ev.by)) p.push('by must be holly, yeti, import or system')
  if (!EVENT_TYPES.includes(ev.type)) { p.push(`unknown type ${ev.type}`); return p }
  const needPid = ['person.put', 'person.contact', 'person.note', 'person.step', 'rel.put', 'review.asked']
  if (needPid.includes(ev.type) && !ev.pid) p.push('pid is required')
  if (ev.type === 'person.contact') {
    if (!['phone', 'email'].includes(ev.kind)) p.push('kind must be phone or email')
    else if (!(ev.kind === 'phone' ? phoneKey(ev.value) : emailKey(ev.value))) p.push(`not a usable ${ev.kind}`)
    if (!['add', 'remove'].includes(ev.op)) p.push('op must be add or remove')
  }
  if (ev.type === 'person.note') {
    if (!NOTE_KINDS.includes(ev.kind || 'note')) p.push('unknown note kind')
    if (!String(ev.text || '').trim()) p.push('a note needs text')
  }
  if (ev.type === 'rel.put') {
    if (!ev.relId) p.push('relId is required')
    if (ev.side && !SIDES.includes(ev.side)) p.push('unknown side')
    if (ev.stage && !STAGES.includes(ev.stage)) p.push('unknown stage')
    if (ev.stage === 'lost' && !String(ev.reason || '').trim()) p.push('lost needs a reason')
  }
  if (ev.type === 'person.link' || ev.type === 'person.unlink') {
    if (!ev.a || !ev.b || ev.a === ev.b) p.push('a link needs two different people')
    if (ev.type === 'person.link' && !LINK_KINDS.includes(ev.kind)) p.push('kind must be same, household or distinct')
  }
  if (ev.type === 'consent.text') {
    if (!phoneKey(ev.phone)) p.push('consent belongs to a usable phone number')
    if (!['agreed', 'withdrawn'].includes(ev.state)) p.push('state must be agreed or withdrawn')
    if (ev.by === 'import' && ev.state === 'agreed') p.push('an import can never grant text permission')
  }
  if (ev.type === 'settings.set' && !ev.key) p.push('key is required')
  if (ev.type === 'import.batch' && !ev.batchId) p.push('batchId is required')
  return p
}

// An import is ONE change, so it is all-or-nothing. It expands into ordinary
// changes with deterministic ids, all by 'import', so the hand-beats-import rule
// covers it with no special case.
function expand(ev) {
  if (ev.type !== 'import.batch') return [ev]
  const out = []
  const base = { at: ev.at, by: 'import' }
  const sub = (n, e) => out.push({ ...base, id: `${ev.id}#${n}`, ...e })
  let n = 0
  for (const p of ev.people || []) {
    if (p.fields) sub(n++, { type: 'person.put', pid: p.pid, fields: p.fields, src: ev.source })
    for (const c of p.contacts || []) sub(n++, { type: 'person.contact', pid: p.pid, kind: c.kind, value: c.value, op: 'add', src: c.src || ev.source })
    for (const [i, note] of (p.notes || []).entries()) {
      out.push({ ...base, id: note.id ? `${ev.id}#note:${note.id}` : `${ev.id}#${n++}:note${i}`, type: 'person.note', pid: p.pid, kind: note.kind || 'note', text: note.text, contactAt: note.contactAt })
    }
  }
  for (const r of ev.rels || []) {
    const { pid, relId, ...rest } = r
    sub(n++, { type: 'rel.put', pid, relId, ...rest, src: r.src || ev.source })
  }
  return out
}

// De-duplicate by id (a replayed change is harmless), expand imports, sort.
function prepare(raw) {
  const byId = new Map()
  for (const ev of raw || []) {
    if (!ev || !ev.id) continue
    const have = byId.get(ev.id)
    if (!have || JSON.stringify(ev) < JSON.stringify(have)) byId.set(ev.id, ev)
  }
  const flat = []
  for (const ev of byId.values()) flat.push(...expand(ev))
  return flat.sort((a, b) => ms(a.at) - ms(b.at) || cmpStr(String(a.id), String(b.id)))
}

export function fold(rawEvents) {
  const S = { people: {}, links: {}, consent: [], reviews: [], settings: {}, ignored: 0 }
  const person = (pid, at) => {
    const P = (S.people[pid] ||= { pid, createdAt: Infinity, fields: {}, contacts: {}, csrc: {}, sources: new Set(), notes: {}, step: null, eps: {} })
    if (ms(at) < P.createdAt) P.createdAt = ms(at)
    return P
  }
  for (const ev of prepare(rawEvents)) {
    const r = rank(ev)
    switch (ev.type) {
      case 'person.put': {
        const P = person(ev.pid, ev.at)
        for (const f of FIELDS) if (ev.fields && f in ev.fields) keepBest(P.fields, f, { rank: r, value: ev.fields[f] })
        if (ev.src) P.sources.add(ev.src)
        break
      }
      case 'person.contact': {
        const key = ev.kind === 'phone' ? phoneKey(ev.value) : ev.kind === 'email' ? emailKey(ev.value) : null
        if (!key || !['add', 'remove'].includes(ev.op)) { S.ignored++; break }
        const P = person(ev.pid, ev.at)
        const rk = `${ev.kind}:${key}`
        keepBest(P.contacts, rk, { rank: r, value: { op: ev.op, kind: ev.kind, key, raw: String(ev.value).trim() } })
        if (ev.op === 'add' && ev.src) (P.csrc[rk] ||= new Set()).add(ev.src)
        if (ev.op === 'add' && ev.src) P.sources.add(ev.src)
        break
      }
      case 'person.note': {
        const P = person(ev.pid, ev.at)
        P.notes[ev.id] = { id: ev.id, pid: ev.pid, kind: NOTE_KINDS.includes(ev.kind) ? ev.kind : 'note', text: String(ev.text || ''), at: ms(ev.at), contactAt: ms(ev.contactAt) || ms(ev.at), by: ev.by }
        break
      }
      case 'person.step': {
        const P = person(ev.pid, ev.at)
        const cand = { rank: { h: 0, t: ms(ev.at), id: String(ev.id) }, value: ev.done ? null : { text: String(ev.text || ''), due: ev.due || null } }
        if (!P.step || cmpRank(cand.rank, P.step.rank) > 0) P.step = cand
        break
      }
      case 'rel.put': {
        const P = person(ev.pid, ev.at)
        const E = (P.eps[ev.relId] ||= { relId: ev.relId, pid: ev.pid, fields: {} })
        for (const f of EPISODE_FIELDS) if (f in ev && ev[f] !== undefined) keepBest(E.fields, f, { rank: r, value: ev[f] })
        break
      }
      case 'person.link':
      case 'person.unlink': {
        if (!ev.a || !ev.b || ev.a === ev.b) { S.ignored++; break }
        const pair = [ev.a, ev.b].sort().join('|')
        const cand = { rank: { h: 0, t: ms(ev.at), id: String(ev.id) }, value: ev.type === 'person.unlink' ? null : ev.kind }
        if (!S.links[pair] || cmpRank(cand.rank, S.links[pair].rank) > 0) S.links[pair] = cand
        break
      }
      case 'consent.text': {
        const phone = phoneKey(ev.phone)
        if (!phone || !['agreed', 'withdrawn'].includes(ev.state) || (ev.by === 'import' && ev.state === 'agreed')) { S.ignored++; break }
        S.consent.push({ id: ev.id, phone, state: ev.state, how: ev.how || '', note: ev.note || '', at: ms(ev.at), by: ev.by })
        break
      }
      case 'review.asked': {
        person(ev.pid, ev.at)
        S.reviews.push({ id: ev.id, pid: ev.pid, how: ev.how || '', at: ms(ev.at) })
        break
      }
      case 'settings.set': {
        const cand = { rank: { h: 0, t: ms(ev.at), id: String(ev.id) }, value: ev.value }
        if (!S.settings[ev.key] || cmpRank(cand.rank, S.settings[ev.key].rank) > 0) S.settings[ev.key] = cand
        break
      }
      default: S.ignored++
    }
  }
  return S
}

export const setting = (S, key) => (S.settings[key] ? S.settings[key].value : SETTINGS_DEFAULTS[key])

// Cards that are one person: union-find rebuilt from scratch from the surviving
// `same` links, so an unlink (a newer fact for the pair) takes effect at once.
export function groupsOf(S) {
  const parent = {}
  const find = (x) => (parent[x] === x ? x : (parent[x] = find(parent[x])))
  for (const pid of Object.keys(S.people)) parent[pid] = pid
  for (const [pair, l] of Object.entries(S.links)) {
    if (l.value !== 'same') continue
    const [a, b] = pair.split('|')
    if (!(a in parent) || !(b in parent)) continue
    const ra = find(a), rb = find(b)
    if (ra !== rb) parent[ra < rb ? rb : ra] = ra < rb ? ra : rb // the smaller id is the root
  }
  const groups = {}
  for (const pid of Object.keys(parent).sort()) (groups[find(pid)] ||= []).push(pid)
  return groups
}

// ── status markers ──────────────────────────────────────────────────────

// admin/status/<leadId>/<ts>-<status>[-p]. The `-p` marks an echo the card wrote
// so the Inbox and the hourly job stay coherent; it is never a stage fact and
// never contact. (admin.js statusMap reads file.split('-') and ignores the 3rd part.)
export function parseMarker(pathname) {
  const parts = String(pathname).split('/')
  const file = parts[parts.length - 1] || ''
  const [ts, status, flag] = file.split('-')
  const id = parts.length >= 4 ? parts[parts.length - 2] : null
  if (!id || !Number(ts) || !LEAD_TO_STAGE[status]) return null
  return { leadId: id, ts: Number(ts), status, echo: flag === 'p' }
}

// ── building cards ──────────────────────────────────────────────────────

const mergeRegs = (target, regs) => {
  for (const [k, reg] of Object.entries(regs)) keepBest(target, k, reg)
}

function baseCard(S, gid, members) {
  const fields = {}, contacts = {}, csrc = {}, eps = [], notes = [], sources = new Set()
  let step = null, createdAt = Infinity
  for (const pid of members) {
    const P = S.people[pid]
    mergeRegs(fields, P.fields)
    mergeRegs(contacts, P.contacts)
    for (const [k, set] of Object.entries(P.csrc)) {
      csrc[k] ||= new Set()
      set.forEach((s) => csrc[k].add(s))
    }
    P.sources.forEach((s) => sources.add(s))
    notes.push(...Object.values(P.notes))
    for (const E of Object.values(P.eps)) eps.push(E)
    if (P.step && (!step || cmpRank(P.step.rank, step.rank) > 0)) step = P.step
    createdAt = Math.min(createdAt, P.createdAt)
  }
  const v = (f, d = '') => (fields[f] ? fields[f].value : d)
  const first = String(v('first')), last = String(v('last'))
  return {
    id: gid, pids: members, virtual: false, createdAt: Number.isFinite(createdAt) ? createdAt : 0,
    first, last, name: String(v('display') || `${first} ${last}`.trim()),
    how: String(v('how')), lakes: [...(v('lakes', []) || [])].sort(), tags: [...(v('tags', []) || [])].sort(),
    addresses: v('addresses', []) || [], extra: v('extra', {}) || {},
    sources: [...sources].sort(),
    _contacts: contacts, _csrc: csrc,
    notes: notes.sort((a, b) => b.at - a.at || cmpStr(a.id, b.id)),
    nextStep: step && step.value ? { ...step.value } : null,
    _eps: eps, leads: [], threads: [], deals: [],
  }
}

function episodeFrom(E) {
  const f = (k, d = null) => (E.fields[k] ? E.fields[k].value : d)
  const stage = STAGES.includes(f('stage')) ? f('stage') : 'new'
  return {
    id: `${E.pid}:${E.relId}`, origin: 'card', relId: E.relId, pid: E.pid, side: SIDES.includes(f('side')) ? f('side') : 'unknown', stage,
    stageAt: E.fields.stage ? E.fields.stage.rank.t : 0, reason: f('reason', ''), address: f('address', ''), lake: f('lake', ''),
    openedOn: f('openedOn'), closedOn: f('closedOn'), price: f('price'), saleKey: f('saleKey'), line: '',
  }
}

// The newest lead status that is NOT an echo, else "new" at the form's date.
function leadStatus(lead, markers) {
  const mine = markers.filter((m) => m.leadId === lead.id && !m.echo).sort((a, b) => b.ts - a.ts || cmpStr(b.status, a.status))
  return mine[0] ? { status: mine[0].status, at: mine[0].ts } : { status: 'new', at: ms(lead.when) }
}

const SIDE_OF_SOURCE = { Waitlist: 'buy', 'Lake owner': 'sell', 'Home value': 'sell' }
const sideFits = (a, b) => a === 'unknown' || b === 'unknown' || a === b

function leadEpisode(lead, st) {
  return {
    id: `lead:${lead.id}`, origin: 'lead', relId: null, pid: null, side: SIDE_OF_SOURCE[lead.source] || 'unknown', stage: LEAD_TO_STAGE[st.status],
    stageAt: st.at, reason: st.status === 'dead' ? 'Marked dead in the Inbox' : '', address: lead.source === 'Home value' ? lead.about || '' : '',
    lake: lead.source === 'Waitlist' || lead.source === 'Lake owner' ? lead.about || '' : '', openedOn: null, closedOn: null, price: null, saleKey: null, line: '',
  }
}

// created = under contract; closed = closed; cancelled = back to showing (a
// buyer whose deal fell through is still a hot client).
function dealEpisode(d) {
  const at = ms(d.updatedAt) || ms(d.createdAt) || ms(d.acceptedOn)
  const stage = d.status === 'closed' ? 'closed' : d.status === 'cancelled' ? 'showing' : 'under_contract'
  return {
    id: `deal:${d.id}`, origin: 'roadmap', relId: null, pid: null, side: d.side === 'seller' ? 'sell' : d.side === 'buyer' ? 'buy' : 'unknown', stage,
    stageAt: d.status === 'active' ? ms(d.createdAt) || at : at, reason: '', address: d.address || '', lake: '', openedOn: d.acceptedOn || null,
    closedOn: d.status === 'closed' ? d.closingOn || null : null, price: null, saleKey: null, line: d.status === 'cancelled' ? 'roadmap cancelled' : '',
  }
}

const ORIGIN_RANK = { lead: 1, roadmap: 2, card: 3 }

// buildPeople: the whole answer. Inputs are plain data; nothing is read or written.
//   ctx.now          ms or ISO (required in tests)
//   ctx.leads        [{ id, name, phone, email, source, about, when, smsConsent, smsDeclined, smsConsentAt? }]   (admin inbox() items)
//   ctx.markers      [{ leadId, ts, status, echo }]   (parseMarker of admin/status/ paths)
//   ctx.threads      [{ phone, messages: [{ direction, body, receivedAt, author? }] }]   (admin texts())
//   ctx.deals        [{ id, side, address, clientName, clientPhone, clientEmail?, status, acceptedOn, closingOn, createdAt?, updatedAt,
//                       consent, textConsent?, overdue, dueToday?, unanswered, lastClientNoteAt?, lastHollyNoteAt? }]   (deals.summary)
//   ctx.emailStatus  { 'a@b.com': 'confirmed' | ... }   (newsletter store)
//   ctx.letters      [{ to, at }]   stationery letters sent
//   ctx.hollyPhone   her own cell: its thread is never "waiting on me"
export function buildPeople(events, ctx = {}) {
  const S = fold(events)
  const now = ms(ctx.now ?? Date.now())
  const today = todayET(now)
  const quietDays = Number(setting(S, 'quiet.days')) || SETTINGS_DEFAULTS['quiet.days']
  const hollyCell = phoneKey(ctx.hollyPhone)
  const leads = [...(ctx.leads || [])].sort(by((l) => l.id))
  const markers = [...(ctx.markers || [])].sort((a, b) => a.ts - b.ts || cmpStr(a.leadId, b.leadId) || cmpStr(a.status, b.status))
  const threads = [...(ctx.threads || [])].filter((t) => phoneKey(t.phone) && phoneKey(t.phone) !== hollyCell).sort(by((t) => phoneKey(t.phone)))
  const deals = [...(ctx.deals || [])].sort(by((d) => d.id))
  const emailStatus = ctx.emailStatus || {}

  // 1. cards from the log
  const groups = groupsOf(S)
  const cards = {}
  for (const [gid, members] of Object.entries(groups)) cards[gid] = baseCard(S, gid, members)
  const cardPhones = {}, cardEmails = {}
  for (const c of Object.values(cards)) {
    for (const reg of Object.values(c._contacts)) {
      if (reg.value.op !== 'add') continue
      ;(reg.value.kind === 'phone' ? cardPhones : cardEmails)[reg.value.key] ||= []
      ;(reg.value.kind === 'phone' ? cardPhones : cardEmails)[reg.value.key].push(c.id)
    }
  }

  // 2. records that live elsewhere. Each goes to a card by phone, then email: the
  //    better name match, else the older card (a household that shares a phone
  //    splits its forms correctly). The keys of an attached record extend the
  //    card's keys, so a form that carries only the email still finds the card its
  //    sibling form joined. Whatever finds no card becomes a card-less person.
  const recs = []
  for (const l of leads) recs.push({ kind: 'lead', id: `lead:${l.id}`, name: l.name, phones: [phoneKey(l.phone)].filter(Boolean), emails: [emailKey(l.email)].filter(Boolean), ref: l })
  for (const t of threads) recs.push({ kind: 'thread', id: `thread:${phoneKey(t.phone)}`, name: '', phones: [phoneKey(t.phone)], emails: [], ref: t })
  for (const d of deals) recs.push({ kind: 'deal', id: `deal:${d.id}`, name: d.clientName, phones: [phoneKey(d.clientPhone)].filter(Boolean), emails: [emailKey(d.clientEmail)].filter(Boolean), ref: d })

  const nameOf = (c) => ({ first: c.first, last: c.last })
  const splitName = (n) => { const parts = String(n || '').trim().split(/\s+/); return { first: parts[0] || '', last: parts.slice(1).join(' ') } }
  const better = (r, cand) => {
    // 2 = first and last match, 1 = first matches, 0 = no information
    const rn = splitName(r.name), cn = nameOf(cand)
    if (!hasName(rn) || nameKey(rn.first) !== nameKey(cn.first)) return 0
    return nameKey(rn.last) === nameKey(cn.last) ? 2 : 1
  }
  const listFor = (target, r) => (r.kind === 'lead' ? target.leads : r.kind === 'thread' ? target.threads : target.deals)
  const pick = (r) => {
    let ids = uniq(r.phones.flatMap((p) => cardPhones[p] || []))
    if (!ids.length) ids = uniq(r.emails.flatMap((e) => cardEmails[e] || []))
    if (!ids.length) return null
    return ids.map((id) => cards[id]).sort((a, b) => better(r, b) - better(r, a) || a.createdAt - b.createdAt || cmpStr(a.id, b.id))[0]
  }
  let left = recs
  for (let pass = 0; pass < 4 && left.length; pass++) {
    const next = []
    for (const r of left) {
      const target = pick(r)
      if (!target) { next.push(r); continue }
      listFor(target, r).push(r.ref)
      for (const ph of r.phones) if (!(cardPhones[ph] ||= []).includes(target.id)) cardPhones[ph].push(target.id)
      for (const em of r.emails) if (!(cardEmails[em] ||= []).includes(target.id)) cardEmails[em].push(target.id)
    }
    if (next.length === left.length) break
    left = next
  }

  // card-less people: two forms from one phone are one person, and an email-only
  // form joins the person who used that email
  const parent = left.map((_, i) => i)
  const find = (i) => (parent[i] === i ? i : (parent[i] = find(parent[i])))
  const seen = {}
  left.forEach((r, i) => {
    for (const k of [...r.phones.map((p) => `p:${p}`), ...r.emails.map((e) => `e:${e}`)]) {
      if (k in seen) parent[find(i)] = find(seen[k])
      else seen[k] = i
    }
  })
  const recGroups = {}
  left.forEach((r, i) => (recGroups[find(i)] ||= []).push(r))
  const virtuals = {}
  for (const rs of Object.values(recGroups)) {
    const ps = uniq(rs.flatMap((r) => r.phones)).sort()
    const es = uniq(rs.flatMap((r) => r.emails)).sort()
    const key = ps.length ? `phone:${ps[0]}` : es.length ? `email:${es[0]}` : `rec:${rs[0].id}`
    const vid = derivePid(key)
    let target = cards[vid] || virtuals[vid]
    if (!target) {
      const named = rs.map((r) => splitName(r.name)).find(hasName) || { first: '', last: '' }
      target = virtuals[vid] = { ...baseCard({ people: {} }, vid, []), id: vid, pids: [], virtual: true, first: named.first, last: named.last, name: `${named.first} ${named.last}`.trim() }
      const when = rs.map((r) => ms(r.ref.when || r.ref.updatedAt || 0)).filter(Boolean)
      target.createdAt = when.length ? Math.min(...when) : 0
    }
    for (const r of rs) listFor(target, r).push(r.ref)
  }
  const all = [...Object.values(cards), ...Object.values(virtuals)]

  // 3. per-phone evidence, global: permission follows the number, not the card
  const evByPhone = {}
  const ev = (p) => (evByPhone[p] ||= { messages: [], forms: [], events: [], deals: [] })
  for (const t of threads) ev(phoneKey(t.phone)).messages.push(...(t.messages || []))
  for (const l of leads) if (phoneKey(l.phone)) ev(phoneKey(l.phone)).forms.push(l)
  for (const d of deals) if (phoneKey(d.clientPhone)) ev(phoneKey(d.clientPhone)).deals.push(d)
  for (const c of S.consent) ev(c.phone).events.push(c)

  // 4. everything worked out, per card
  for (const c of all) finishCard(c, { S, now, today, quietDays, markers, emailStatus, evByPhone, ctx, hollyCell })

  // household: a link that is not a merge. Shown on both cards; nothing is shared.
  const cardOf = {}
  for (const c of all) for (const pid of c.pids) cardOf[pid] = c
  for (const c of all) c.household = []
  for (const [pair, l] of Object.entries(S.links)) {
    if (l.value !== 'household') continue
    const [a, b] = pair.split('|').map((pid) => cardOf[pid])
    if (!a || !b || a === b) continue
    if (!a.household.includes(b.id)) a.household.push(b.id)
    if (!b.household.includes(a.id)) b.household.push(a.id)
  }
  for (const c of all) c.household.sort()

  all.sort(by((c) => `${c.name.toLowerCase() || '~'}|${c.id}`))
  const out = { today, cards: all.map(publicCard), suggestions: suggestions(all, S) }
  out.waiting = waitingOnMe(all, { today, now, hollyCell })
  out.ignored = S.ignored
  return out
}

function finishCard(c, k) {
  const { S, now, today, quietDays, markers, emailStatus, evByPhone, ctx } = k

  // contact points: the log first, then what the attached records carry
  const phones = {}, emails = {}
  for (const [rk, reg] of Object.entries(c._contacts)) {
    if (reg.value.op !== 'add') continue
    const src = [...(c._csrc[rk] || [])].sort()
    ;(reg.value.kind === 'phone' ? phones : emails)[reg.value.key] = { key: reg.value.key, value: reg.value.raw, src }
  }
  const removed = (kind, key) => c._contacts[`${kind}:${key}`]?.value.op === 'remove'
  const addFrom = (map, kind, key, raw, src) => {
    if (!key || removed(kind, key)) return
    if (map[key]) { if (!map[key].src.includes(src)) map[key].src = [...map[key].src, src].sort() } else map[key] = { key, value: raw, src: [src] }
  }
  for (const l of c.leads) { addFrom(phones, 'phone', phoneKey(l.phone), l.phone, 'form'); addFrom(emails, 'email', emailKey(l.email), emailKey(l.email), 'form') }
  for (const t of c.threads) addFrom(phones, 'phone', phoneKey(t.phone), t.phone, 'text')
  for (const d of c.deals) { addFrom(phones, 'phone', phoneKey(d.clientPhone), d.clientPhone, 'roadmap'); addFrom(emails, 'email', emailKey(d.clientEmail), emailKey(d.clientEmail), 'roadmap') }
  c.phones = Object.values(phones).sort(by((p) => p.key)).map((p) => ({ ...p, pretty: prettyPhone(p.key), text: textState(p.key, evByPhone[p.key] || {}) }))
  c.emails = Object.values(emails).sort(by((e) => e.key)).map((e) => ({ ...e, ...emailPolicy(emailStatus[e.key]) }))

  // episodes and the stage facts they carry
  const eps = c._eps.map(episodeFrom)
  // An echo (-p) means "the card owns this lead's stage": the card wrote it when
  // Holly set a stage there. While the newest marker is an echo, the lead has no
  // stage of its own, so it cannot stay "new" forever beside the card's episode.
  // A real Inbox marker newer than the echo hands ownership back to the Inbox.
  const owned = (l) => {
    let echo = 0, real = 0
    for (const m of markers) if (m.leadId === l.id) { if (m.echo) echo = Math.max(echo, m.ts); else real = Math.max(real, m.ts) }
    return echo > 0 && echo >= real
  }
  for (const l of c.leads) if (!owned(l)) eps.push(leadEpisode(l, leadStatus(l, markers)))
  // The newest fact wins, so a real Inbox marker newer than an OPEN card episode's
  // stage replaces it (Inbox dead closes it). Closed history never loses this way,
  // and an imported or back-filled closed sale is not open, so it hides no lead.
  for (const e of eps) {
    if (e.origin !== 'card' || !OPEN_STAGES.includes(e.stage)) continue
    let best = null
    for (const l of c.leads) {
      if (!sideFits(SIDE_OF_SOURCE[l.source] || 'unknown', e.side)) continue
      for (const m of markers) if (m.leadId === l.id && !m.echo && m.ts > e.stageAt && (!best || m.ts > best.ts)) best = m
    }
    if (best) Object.assign(e, { stage: LEAD_TO_STAGE[best.status], stageAt: best.ts, reason: best.status === 'dead' ? 'Marked dead in the Inbox' : e.reason, line: 'set in the Inbox' })
  }
  for (const d of c.deals) eps.push(dealEpisode(d))
  eps.sort((a, b) => b.stageAt - a.stageAt || cmpStr(a.id, b.id))
  c.episodes = eps.map((e) => ({ ...e, open: OPEN_STAGES.includes(e.stage) }))
  const newest = [...eps].sort((a, b) => b.stageAt - a.stageAt || (ORIGIN_RANK[b.origin] || 0) - (ORIGIN_RANK[a.origin] || 0) || cmpStr(a.id, b.id))[0]
  c.stage = newest ? newest.stage : null
  c.stageAt = newest ? newest.stageAt : null
  c.stageLine = newest ? newest.line : ''

  // pile (one, by precedence) and chips (all that apply)
  const open = c.episodes.filter((e) => e.open)
  const chips = []
  if (open.some((e) => e.stage === 'offer' || e.stage === 'under_contract')) chips.push('current client')
  if (open.some((e) => ['new', 'contacted', 'showing'].includes(e.stage))) chips.push('lead')
  if (c.episodes.some((e) => e.stage === 'closed')) chips.push('past client')
  if (c.leads.some((l) => l.source === 'Lake owner')) chips.push('lake owner')
  if (c.leads.some((l) => l.source === 'Waitlist')) chips.push('waitlist buyer')
  if (!chips.length) chips.push('sphere')
  c.chips = chips
  c.pile = chips[0]
  c.lakes = uniq([...c.lakes, ...c.episodes.map((e) => e.lake).filter(Boolean)]).sort()

  // last contact: what Holly and they actually said. Automatic texts do not count.
  const times = []
  for (const t of c.threads) for (const m of t.messages || []) {
    if (m.direction === 'in' || m.author === 'holly') times.push(ms(m.receivedAt))
  }
  for (const n of c.notes) if (TOUCH_KINDS.includes(n.kind)) times.push(n.contactAt)
  for (const l of c.leads) for (const m of markers) if (m.leadId === l.id && !m.echo && (m.status === 'called' || m.status === 'showing')) times.push(m.ts)
  for (const d of c.deals) times.push(ms(d.lastClientNoteAt), ms(d.lastHollyNoteAt))
  for (const lt of ctx.letters || []) if (emailKey(lt.to) && c.emails.some((e) => e.key === emailKey(lt.to))) times.push(ms(lt.at))
  const last = Math.max(0, ...times.filter(Boolean))
  c.lastContact = last || null

  // gone quiet: open at contacted, showing or offer; no contact for N days;
  // no next step dated in the future (a future step is the snooze)
  const watching = c.episodes.filter((e) => e.open && ['contacted', 'showing', 'offer'].includes(e.stage))
  const snoozed = c.nextStep && c.nextStep.due && c.nextStep.due > today
  c.quiet = null
  if (watching.length && !snoozed) {
    const since = last || Math.max(...watching.map((e) => e.stageAt))
    if (now - since > quietDays * DAY) c.quiet = { days: Math.floor((now - since) / DAY), since }
  }

  // review: asked on the card, or on an attached lead (admin/review-asked marker comes in as lead.reviewAskedAt)
  const asked = S.reviews.filter((r) => c.pids.includes(r.pid)).map((r) => r.at)
  for (const l of c.leads) if (l.reviewAskedAt) asked.push(ms(l.reviewAskedAt))
  c.reviewAskedAt = Math.max(0, ...asked) || null
}

function suggestions(cards, S) {
  const linked = (a, b) => {
    for (const pa of a.pids) for (const pb of b.pids) if (S.links[[pa, pb].sort().join('|')]?.value) return true
    return false
  }
  const idx = {}
  for (const c of cards) {
    for (const p of c.phones) (idx[`p:${p.key}`] ||= []).push(c)
    for (const e of c.emails) (idx[`e:${e.key}`] ||= []).push(c)
    if (!c.phones.length && !c.emails.length && hasName(c)) (idx[`n:${fullName(c)}`] ||= []).push(c)
  }
  const out = {}
  for (const [k, list] of Object.entries(idx)) {
    for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) {
      const [a, b] = [list[i], list[j]].sort(by((c) => c.id))
      if (a.id === b.id || linked(a, b)) continue
      out[`${a.id}|${b.id}`] ||= { a: a.id, b: b.id, why: k[0] === 'p' ? 'same phone' : k[0] === 'e' ? 'same email' : 'same name, no phone or email' }
    }
  }
  return Object.values(out).sort(by((s) => `${s.a}|${s.b}`))
}

const KIND_ORDER = ['new_lead', 'text', 'roadmap', 'next_step', 'quiet']

// Today: who is waiting on me, in the plan's order. One row per person, with
// the highest reason first and the others listed.
function waitingOnMe(cards, { today, now, hollyCell }) {
  const rows = []
  for (const c of cards) {
    const reasons = []
    for (const e of c.episodes) {
      if (e.origin === 'lead' && e.stage === 'new') {
        const l = c.leads.find((x) => `lead:${x.id}` === e.id)
        reasons.push({ kind: 'new_lead', text: `New ${String(l.source || 'form').toLowerCase()} lead`, since: e.stageAt, action: 'call' })
      }
    }
    for (const t of c.threads) {
      const msgs = [...(t.messages || [])].sort((a, b) => ms(a.receivedAt) - ms(b.receivedAt))
      const lastMsg = msgs[msgs.length - 1]
      if (lastMsg && lastMsg.direction === 'in' && !isStopText(lastMsg.body) && !isStartText(lastMsg.body)) {
        reasons.push({ kind: 'text', text: `They texted: "${String(lastMsg.body || '').slice(0, 60)}"`, since: ms(lastMsg.receivedAt), action: 'reply' })
      }
    }
    for (const d of c.deals) {
      if (d.status !== 'active') continue
      if (d.overdue > 0 || d.dueToday > 0) reasons.push({ kind: 'roadmap', text: d.overdue > 0 ? `${d.overdue} roadmap step${d.overdue > 1 ? 's' : ''} overdue` : 'Roadmap step due today', since: ms(d.updatedAt), action: 'open' })
      if (d.unanswered) reasons.push({ kind: 'roadmap', text: 'Roadmap question waiting', since: ms(d.lastClientNoteAt) || ms(d.updatedAt), action: 'reply' })
    }
    if (c.nextStep && c.nextStep.due && c.nextStep.due <= today) reasons.push({ kind: 'next_step', text: `Next step: ${c.nextStep.text}`, since: ms(c.nextStep.due), action: 'open' })
    if (c.quiet) reasons.push({ kind: 'quiet', text: `Quiet for ${c.quiet.days} days`, since: c.quiet.since, action: 'call' })
    if (!reasons.length) continue
    reasons.sort((a, b) => KIND_ORDER.indexOf(a.kind) - KIND_ORDER.indexOf(b.kind) || a.since - b.since)
    rows.push({ pid: c.id, name: c.name, kind: reasons[0].kind, reason: reasons[0].text, action: reasons[0].action, since: reasons[0].since, also: uniq(reasons.slice(1).map((r) => r.kind)) })
  }
  return rows.sort((a, b) => KIND_ORDER.indexOf(a.kind) - KIND_ORDER.indexOf(b.kind) || a.since - b.since || cmpStr(a.pid, b.pid))
}

function publicCard(c) {
  const { _contacts, _csrc, _eps, ...rest } = c
  return rest
}

// ── matching a new record to the cards that already exist (plan 4.6) ─────

// rec: { first, last, phones: [], emails: [] }   cards: buildPeople().cards
// Returns { kind: 'merge', pid, link: [[a, b], ...], suggest: [] }
//      or { kind: 'new', suggest: [card ids], why }
// A wrong merge leaks notes between people; a missed merge costs one tap. So
// anything doubtful stays separate and is listed as "possibly the same person".
export function matchRecord(cards, rec) {
  const ps = uniq((rec.phones || []).map(phoneKey).filter(Boolean))
  const es = uniq((rec.emails || []).map(emailKey).filter(Boolean))
  const name = { first: rec.first, last: rec.last, display: rec.display }
  if (!ps.length && !es.length) {
    // rule 5: never merged automatically; an exact name is only a suggestion
    const same = cards.filter((c) => sameName(name, c)).map((c) => c.id).sort()
    return { kind: 'new', suggest: same, why: same.length ? 'same name, no phone or email' : 'no way to match' }
  }
  const cand = cards.filter((c) => c.phones.some((p) => ps.includes(p.key)) || c.emails.some((e) => es.includes(e.key))).sort(by((c) => c.id))
  if (!cand.length) return { kind: 'new', suggest: [], why: 'no shared phone or email' }
  const ok = cand.every((c) => nameCompatible(name, c)) && cand.every((a) => cand.every((b) => nameCompatible(a, b)))
  if (!ok) return { kind: 'new', suggest: cand.map((c) => c.id), why: 'a shared phone or email with a different name' }
  const root = [...cand].sort((a, b) => a.createdAt - b.createdAt || cmpStr(a.id, b.id))[0]
  return { kind: 'merge', pid: root.id, link: cand.filter((c) => c.id !== root.id).map((c) => [root.id, c.id].sort()), suggest: [], why: cand.length > 1 ? 'bridges cards that are the same person' : 'same person' }
}

// May a card open another episode on this side? One open episode per side.
export function canOpenEpisode(card, side) {
  return !card.episodes.some((e) => e.origin === 'card' && e.open && e.side === side)
}
