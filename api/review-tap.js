// Holly's NFC keyring and review QR. One link we own, so the chip never holds a raw Google URL:
//   /review/tap  keyring chip  -> Google review form
//   /review/qr   QR code       -> Google review form
//   /review      link in a text or email
// vercel.json rewrites each one here. One tiny Blob per follow, counted from list() pathnames
// (taps/review/<via>/<uuid>), so the count never reads blob content and never sees a stale CDN copy.
// GET ?report=1 with the admin key returns the counts.
import { put, list } from '@vercel/blob'
import { randomUUID } from 'node:crypto'
import { authorize } from './lib/admin-auth.js'
import { WRITE_REVIEW_URL } from './reviews.js'

const VIA = ['tap', 'qr', 'link']

// Link previews and crawlers follow links too; they are not taps.
const BOT = /bot|crawl|spider|slurp|facebookexternalhit|facebot|whatsapp|telegram|discord|slack|skype|preview|embed|curl|wget|python|headless|lighthouse|pingdom|uptime/i
const isBot = (ua) => !ua || BOT.test(ua)

async function tally(days = 30) {
  const since = Date.now() - days * 864e5
  const out = Object.fromEntries(VIA.map((v) => [v, { all: 0, recent: 0 }]))
  out.last = null
  let cursor
  for (let p = 0; p < 20; p++) {
    const r = await list({ prefix: 'taps/review/', limit: 1000, cursor })
    for (const b of r.blobs) {
      const via = b.pathname.split('/')[2]
      if (!out[via] || !VIA.includes(via)) continue
      const t = new Date(b.uploadedAt).getTime()
      out[via].all++
      if (t >= since) out[via].recent++
      if (!out.last || t > out.last) out.last = t
    }
    if (!r.hasMore) break
    cursor = r.cursor
  }
  return out
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')

  if (req.query?.report) {
    if (!authorize(req)) return res.status(401).json({ success: false, error: 'unauthorized' })
    try {
      return res.status(200).json({ success: true, counts: await tally() })
    } catch (e) {
      console.error('review-tap report:', e.message)
      return res.status(200).json({ success: false, error: 'could not read taps' }) // 200: Cloudflare masks 502/504
    }
  }

  const via = VIA.includes(req.query?.v) ? req.query.v : 'link'
  // Count without making the person wait on storage: whichever finishes first wins.
  if (req.method === 'GET' && !isBot(req.headers['user-agent'])) {
    await Promise.race([
      put(`taps/review/${via}/${randomUUID()}`, '1', { access: 'public', addRandomSuffix: false, contentType: 'text/plain' })
        .catch((e) => console.error('review-tap:', via, e.message)),
      new Promise((ok) => setTimeout(ok, 900)),
    ])
  }
  res.statusCode = 302
  res.setHeader('Location', WRITE_REVIEW_URL)
  res.end()
}
