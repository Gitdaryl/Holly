import crypto from 'node:crypto'
import { put, list, head } from '@vercel/blob'
import { todayISO, listAll } from './engage-store.js'

// Newsletter subscribers, in the holly-engage Blob store.
//
//   news/subs/<emailHash>.json                     current state, one per person
//   news/events/<YYYY-MM-DD>/<stamp>-<uuid>.json   append-only audit trail
//   news/issues/<issueId>.json                     draft -> approved -> sent
//   news/sends/<issueId>/<emailHash>               one empty blob per delivery
//
// Two things here differ from the rest of this codebase on purpose:
//
// 1. THE PATHNAME IS A HASH, NOT THE ADDRESS. Dedupe then comes free and
//    atomic - put() with addRandomSuffix:false overwrites, so resubscribing
//    cannot create a second row and there is no read-check-write race. It
//    also means an admin list() returns hashes, not 400 email addresses.
//
// 2. SUBSCRIBER BLOBS ARE PRIVATE. Everything else here is access:'public'.
//    A single lead blob behind an unguessable URL is one exposure; a bulk
//    mailing list is a different risk class. The cost is that these must be
//    read with a signed request, NOT `fetch(b.url)` the way api/admin.js and
//    api/waitlist.js read theirs - hence readSub() below. If you are about to
//    "fix" this back to public, that is why it is not.

const SUBS = 'news/subs/'
export const ISSUES = 'news/issues/'
export const SENDS = 'news/sends/'

const PRIVATE = { access: 'private', addRandomSuffix: false, contentType: 'application/json' }
const PUBLIC = { access: 'public', addRandomSuffix: false, contentType: 'application/json' }

export const STATUSES = ['pending', 'confirmed', 'unsubscribed', 'bounced', 'complained']
// Never mail anyone not in this set. Read at SEND time, never from a snapshot
// taken when the issue was drafted: CAN-SPAM wants opt-outs honored promptly
// and a stale list is how you mail someone who already left.
export const MAILABLE = new Set(['confirmed'])

export const normalize = (email) => String(email || '').trim().toLowerCase()
export const hashEmail = (email) =>
  crypto.createHash('sha256').update(normalize(email)).digest('hex').slice(0, 32)

// Deliberately loose. Rejecting odd-but-valid addresses loses real people,
// and the confirmation email is the real validator: a typo never confirms.
export function validEmail(email) {
  const e = normalize(email)
  return e.length >= 5 && e.length <= 200 && /^[^@\s]+@[^@\s.]+\.[^@\s]+$/.test(e)
}

export const subPath = (hash) => `${SUBS}${hash}.json`

export async function readSub(hash) {
  try {
    const b = await head(subPath(hash))
    if (!b) return null
    const r = await fetch(b.downloadUrl || b.url)
    return r.ok ? await r.json() : null
  } catch {
    return null
  }
}

export async function writeSub(sub) {
  await put(subPath(sub.hash), JSON.stringify(sub, null, 2), PRIVATE)
  return sub
}

// Append-only, so "when did they consent and from where" survives any later
// overwrite of the subscriber blob. This is the evidence you produce when
// somebody reports the mail as spam.
export async function logEvent(hash, action, extra = {}) {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  try {
    await put(
      `news/events/${todayISO()}/${stamp}-${crypto.randomUUID()}.json`,
      JSON.stringify({ hash, action, at: new Date().toISOString(), ...extra }, null, 2),
      PRIVATE,
    )
  } catch (err) {
    console.error('newsletter event log failed:', err.message)
  }
}

export function newSub(email, { source = 'site', ip = null, userAgent = null } = {}) {
  const e = normalize(email)
  return {
    email: e,
    hash: hashEmail(e),
    status: 'pending',
    source: String(source).slice(0, 40),
    subscribedAt: new Date().toISOString(),
    confirmedAt: null,
    unsubscribedAt: null,
    userAgent: userAgent ? String(userAgent).slice(0, 300) : null,
    consent: { method: 'double-opt-in', requestIp: ip, confirmIp: null, confirmedAt: null },
  }
}

// Counts by status. list() returns pathnames only, so this is one scan and no
// content reads - and no email addresses cross the wire to do it.
export async function counts() {
  const { paths } = await listAll(SUBS)
  return { subscribers: paths.length }
}

export async function issue(id) {
  try {
    const b = await head(`${ISSUES}${id}.json`)
    if (!b) return null
    const r = await fetch(b.downloadUrl || b.url)
    return r.ok ? await r.json() : null
  } catch {
    return null
  }
}

export async function writeIssue(data) {
  await put(`${ISSUES}${data.id}.json`, JSON.stringify(data, null, 2), PUBLIC)
  return data
}

export const allSubPaths = () => listAll(SUBS)
export const hashFromPath = (p) => p.slice(SUBS.length).replace(/\.json$/, '')
