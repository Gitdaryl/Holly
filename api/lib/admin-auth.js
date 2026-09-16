import crypto from 'node:crypto'
import { list, put } from '@vercel/blob'

// Holly's admin login: no password. She taps "Text me a login link", a
// 15-minute link lands on her cell, opening it mints a 30-day session that
// the browser keeps. Both tokens are HMAC-signed with ADMIN_SECRET and carry
// their own expiry, so there is no session table and rotating ADMIN_SECRET
// logs every device out at once. Yeti can also use ADMIN_SECRET itself as
// the bearer, same as the seller report.

const secret = () => process.env.ADMIN_SECRET || ''
const b64u = (s) => Buffer.from(s).toString('base64url')
const unb64u = (s) => Buffer.from(s, 'base64url').toString()

export function sign(payload) {
  const body = b64u(JSON.stringify(payload))
  const sig = crypto.createHmac('sha256', secret()).update(body).digest('base64url')
  return `${body}.${sig}`
}

export function verify(token) {
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
    return payload
  } catch {
    return null
  }
}

export const mintLinkToken = () => sign({ k: 'link', exp: Date.now() + 15 * 60 * 1000, n: crypto.randomUUID() })
export const mintSession = () => sign({ k: 'session', exp: Date.now() + 30 * 24 * 60 * 60 * 1000 })

// 'agent' for a valid session or the raw ADMIN_SECRET; null otherwise.
export function authorize(req) {
  const bearer = (req.headers.authorization || '').replace(/^Bearer\s+/i, '').trim()
  const key = bearer || (req.query && req.query.key) || ''
  if (!key) return null
  const admin = secret()
  if (admin) {
    const a = Buffer.from(String(key).slice(0, 128).padEnd(128, '\0'))
    const b = Buffer.from(admin.slice(0, 128).padEnd(128, '\0'))
    if (crypto.timingSafeEqual(a, b)) return 'agent'
  }
  const p = verify(key)
  return p && p.k === 'session' ? 'agent' : null
}

// Login-link requests are rate limited by an append-only marker per request,
// so a stranger on the login page cannot SMS-bomb Holly. list() is the source
// of truth (blob content reads are CDN-cached, pathnames are not).
export async function loginAllowed() {
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Detroit' })
  const prefix = `admin/login-requests/${today}/`
  const { blobs } = await list({ prefix, limit: 100 })
  if (blobs.length >= 10) return { ok: false, why: 'daily limit' }
  const latest = blobs.map((b) => Number(b.pathname.slice(prefix.length))).filter(Boolean).sort((a, b) => b - a)[0]
  if (latest && Date.now() - latest < 60 * 1000) return { ok: false, why: 'wait a minute' }
  await put(`${prefix}${Date.now()}`, '1', { access: 'public', addRandomSuffix: false, contentType: 'text/plain' })
  return { ok: true }
}
