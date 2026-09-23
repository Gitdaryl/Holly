import { put } from '@vercel/blob'
import { todayISO } from './lib/engage-store.js'

// POST /api/track  { e, p, r, c, d, s }
// One empty blob per hit, everything in the pathname so stats are a list()
// scan with no content reads:
//   hits/<date>/<event>/<path enc>/<source>/<device>/<session>-<uuid>
// "source" is the referrer host, or the campaign tag prefixed with "utm:",
// or "direct". Paths encode "/" as "~".

const EVENTS = new Set(['view', 'waitlist', 'owner', 'showing', 'cma', 'contact', 'chat_open', 'chat_lead', 'call', 'text', 'review', 'save', 'share', 'plan_open', 'newsletter'])
const SITE_HOSTS = /(^|\.)hollygriewahn\.(vercel\.app|com)$/i

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  let b = req.body
  if (typeof b === 'string') { try { b = JSON.parse(b) } catch { b = null } }
  if (!b || !EVENTS.has(b.e)) return res.status(204).end()

  const path = String(b.p || '/').slice(0, 120).replace(/[^a-zA-Z0-9\-_/.?=&]/g, '').split('?')[0] || '/'
  if (/^\/(admin|plan)(\/|$)/.test(path)) return res.status(204).end()
  const enc = path === '/' ? 'home' : path.replace(/^\//, '').replace(/\//g, '~')
  const ref = String(b.r || '').toLowerCase().slice(0, 60).replace(/[^a-z0-9.-]/g, '')
  const utm = String(b.c || '').toLowerCase().slice(0, 40).replace(/[^a-z0-9_-]/g, '')
  const source = utm ? `utm:${utm}` : ref && !SITE_HOSTS.test(ref) ? ref : 'direct'
  const device = b.d === 'mobile' ? 'mobile' : 'desktop'
  const sid = String(b.s || 'anon').replace(/[^a-zA-Z0-9-]/g, '').slice(0, 36) || 'anon'

  try {
    await put(`hits/${todayISO()}/${b.e}/${enc}/${source}/${device}/${sid}-${crypto.randomUUID()}`, '1', {
      access: 'public', addRandomSuffix: false, contentType: 'text/plain',
    })
  } catch (err) {
    console.error('track failed:', err.message)
  }
  return res.status(204).end()
}
