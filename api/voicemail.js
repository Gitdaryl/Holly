import crypto from 'node:crypto'

// GET /api/voicemail?rec=RE...&k=<sig>
// Streams a Twilio voicemail recording through the site. Twilio media URLs
// need account auth (correctly), so Holly's phone was hitting a login box.
// The link is signed with ADMIN_SECRET; only links minted by the voice
// webhook work, and rotating ADMIN_SECRET expires every old one.

export function voicemailLink(site, recordingSid) {
  return `${site}/api/voicemail?rec=${recordingSid}&k=${sig(recordingSid)}`
}

const sig = (rec) => crypto.createHmac('sha256', process.env.ADMIN_SECRET || '').update(`voicemail:${rec}`).digest('base64url').slice(0, 24)

export default async function handler(req, res) {
  const rec = String(req.query.rec || '')
  const k = String(req.query.k || '')
  if (!/^RE[0-9a-f]{32}$/.test(rec)) return res.status(400).send('bad recording id')
  const want = sig(rec)
  if (k.length !== want.length || !crypto.timingSafeEqual(Buffer.from(k), Buffer.from(want))) return res.status(403).send('not authorized')

  const sid = process.env.TWILIO_ACCOUNT_SID
  const token = process.env.TWILIO_AUTH_TOKEN
  if (!sid || !token) return res.status(500).send('twilio not configured')

  const r = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Recordings/${rec}.mp3`, {
    headers: { Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString('base64')}` },
  })
  if (!r.ok) return res.status(r.status === 404 ? 404 : 502).send('recording unavailable')
  res.setHeader('Content-Type', 'audio/mpeg')
  res.setHeader('Cache-Control', 'private, max-age=3600')
  res.setHeader('Content-Disposition', `inline; filename="voicemail-${rec.slice(-6)}.mp3"`)
  return res.status(200).send(Buffer.from(await r.arrayBuffer()))
}
