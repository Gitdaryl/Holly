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
// THE PATHNAME IS A KEYED HASH OF THE ADDRESS, and both halves of that
// matter:
//
//   Hash, not the address: dedupe comes free and atomic, because the address
//   always maps to one pathname and put(..., allowOverwrite) replaces it.
//   Resubscribing cannot create a second row and there is no
//   read-check-write race. An admin list() also returns hashes rather than
//   hundreds of email addresses.
//
//   KEYED (HMAC with NEWSLETTER_SECRET), not a plain sha256: the store
//   `holly-engage` is a PUBLIC blob store, so a blob's URL is derivable from
//   its pathname. With a plain hash, anyone who guessed an email address
//   could compute the path, fetch the blob, and learn whether that person is
//   on Holly's list and what we hold about them. A keyed hash cannot be
//   computed without the secret, so the list cannot be enumerated or probed.
//
// We tried access:'private' first. Vercel rejects it: "Cannot use private
// access on a public store" - private is a STORE-level setting, and
// holly-engage already holds public blobs (listing photos, engagement) that
// a flip would break. A dedicated private store is the stronger option and
// is worth doing later; the keyed hash closes the actual hole today without
// a second store and a second token.
//
// CONSEQUENCE, AND IT IS IMPORTANT: NEWSLETTER_SECRET is effectively
// permanent once the first issue ships. Rotating it changes every pathname
// (orphaning every subscriber record) AND invalidates every unsubscribe
// token already sitting in somebody's inbox, which is a compliance failure.
// Rotating it is a migration, not a config change.

const SUBS = 'news/subs/'
export const ISSUES = 'news/issues/'
export const SENDS = 'news/sends/'

// Current-state documents: the same pathname is written again as a person
// moves pending -> confirmed -> unsubscribed. allowOverwrite is REQUIRED for
// that; without it @vercel/blob throws "This blob already exists" on the
// second write, which would break confirmation for every subscriber.
const STATE = { access: 'public', addRandomSuffix: false, allowOverwrite: true, contentType: 'application/json' }

// Append-only records. Deliberately NO allowOverwrite: every path is unique,
// so a collision means a bug, and it should be loud rather than silently
// eating an audit entry.
const APPEND = { access: 'public', addRandomSuffix: false, contentType: 'application/json' }

export const STATUSES = ['pending', 'confirmed', 'unsubscribed', 'bounced', 'complained']
// Never mail anyone not in this set. Read at SEND time, never from a snapshot
// taken when the issue was drafted: CAN-SPAM wants opt-outs honored promptly
// and a stale list is how you mail someone who already left.
export const MAILABLE = new Set(['confirmed'])

export const normalize = (email) => String(email || '').trim().toLowerCase()

// Throws with no secret rather than silently falling back to an unkeyed hash,
// which would put every subscriber behind a guessable public URL.
export function hashEmail(email) {
  const secret = process.env.NEWSLETTER_SECRET
  if (!secret) throw new Error('NEWSLETTER_SECRET is not set')
  return crypto.createHmac('sha256', secret).update(normalize(email)).digest('hex').slice(0, 32)
}

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
  await put(subPath(sub.hash), JSON.stringify(sub, null, 2), STATE)
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
      APPEND,
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
  await put(`${ISSUES}${data.id}.json`, JSON.stringify(data, null, 2), STATE)
  return data
}

export const allSubPaths = () => listAll(SUBS)
export const hashFromPath = (p) => p.slice(SUBS.length).replace(/\.json$/, '')
