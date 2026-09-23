import crypto from 'node:crypto'

// Signed links for newsletter confirm and unsubscribe.
//
// Same HMAC shape as api/lib/admin-auth.js, with one deliberate difference:
// its OWN secret. A subscriber's unsubscribe token travels in plain email to
// hundreds of people and gets forwarded, logged and scraped. It must be
// structurally incapable of being mistaken for an admin session, and keyspace
// separation costs exactly one environment variable.
//
// Fails closed: with NEWSLETTER_SECRET unset, verify() returns null for
// everything and no link works.

const secret = () => process.env.NEWSLETTER_SECRET || ''
const b64u = (s) => Buffer.from(s).toString('base64url')
const unb64u = (s) => Buffer.from(s, 'base64url').toString()

const DAY = 24 * 60 * 60 * 1000

// Confirm links are short-lived because an unconfirmed address is not yet a
// subscriber. Unsubscribe links are NOT: CAN-SPAM requires the opt-out to
// keep working long after the message was sent, and people unsubscribe from
// year-old email. An expired unsubscribe link is a compliance failure with a
// friendly error page on top.
export const CONFIRM_TTL = 7 * DAY
export const UNSUB_TTL = 400 * DAY

export function sign(payload) {
  const body = b64u(JSON.stringify(payload))
  const sig = crypto.createHmac('sha256', secret()).update(body).digest('base64url')
  return `${body}.${sig}`
}

export function verify(token, kind) {
  if (!token || !secret() || typeof token !== 'string') return null
  const [body, sig] = token.split('.')
  if (!body || !sig) return null
  const want = crypto.createHmac('sha256', secret()).update(body).digest('base64url')
  const a = Buffer.from(sig.padEnd(64, '\0').slice(0, 64))
  const b = Buffer.from(want.padEnd(64, '\0').slice(0, 64))
  if (!crypto.timingSafeEqual(a, b)) return null
  try {
    const payload = JSON.parse(unb64u(body))
    if (!payload.exp || payload.exp < Date.now()) return null
    if (kind && payload.k !== kind) return null
    return payload
  } catch {
    return null
  }
}

export const mintConfirm = (hash) => sign({ k: 'confirm', h: hash, exp: Date.now() + CONFIRM_TTL })
export const mintUnsub = (hash) => sign({ k: 'unsub', h: hash, exp: Date.now() + UNSUB_TTL })
