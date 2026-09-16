import crypto from 'node:crypto'
import { put } from '@vercel/blob'
import { todayISO } from './lib/engage-store.js'
import { notifyHolly, prettyPhone } from './lib/sms.js'

// Twilio webhook for texts sent TO Holly's number (517-300-8226).
// Persist first (sms/<from digits>/<date>/<stamp>.json, one blob per message,
// the same append-only shape as leads), then forward to Holly's cell so a
// reply never sits in an unwatched inbox. The Texts tab in /admin reads the
// same blobs. Twilio's signature is verified so nobody can inject "messages".

function readBody(req) {
  return new Promise((resolve) => {
    let data = ''
    req.on('data', (c) => { data += c })
    req.on('end', () => resolve(data))
  })
}

// https://www.twilio.com/docs/usage/webhooks/webhooks-security
function validSignature(req, url, params) {
  const token = process.env.TWILIO_AUTH_TOKEN
  const sig = req.headers['x-twilio-signature']
  if (!token || !sig) return false
  const data = url + Object.keys(params).sort().map((k) => k + params[k]).join('')
  const want = crypto.createHmac('sha1', token).update(Buffer.from(data, 'utf8')).digest('base64')
  const a = Buffer.from(String(sig).padEnd(64, '\0').slice(0, 64))
  const b = Buffer.from(want.padEnd(64, '\0').slice(0, 64))
  return crypto.timingSafeEqual(a, b)
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  // Vercel's Node runtime parses form bodies into req.body; fall back to the
  // raw stream if it did not.
  const params = req.body && typeof req.body === 'object'
    ? Object.fromEntries(Object.entries(req.body).map(([k, v]) => [k, String(v)]))
    : Object.fromEntries(new URLSearchParams(await readBody(req)))
  const url = `https://${req.headers['x-forwarded-host'] || req.headers.host}${req.url}`
  if (!validSignature(req, url, params)) {
    console.error('sms-inbound: bad signature')
    return res.status(403).end()
  }

  const from = String(params.From || '')
  const body = String(params.Body || '').slice(0, 1600)
  const media = Number(params.NumMedia || 0)
  const msg = {
    direction: 'in',
    from,
    to: params.To || null,
    body,
    media: media ? Array.from({ length: media }, (_, i) => params[`MediaUrl${i}`]).filter(Boolean) : [],
    sid: params.MessageSid || null,
    receivedAt: new Date().toISOString(),
  }

  try {
    const stamp = msg.receivedAt.replace(/[:.]/g, '-')
    await put(`sms/${from.replace(/\D/g, '')}/${todayISO()}/${stamp}-in.json`, JSON.stringify(msg, null, 2), {
      access: 'public', addRandomSuffix: false, contentType: 'application/json',
    })
  } catch (err) {
    console.error('sms-inbound persist failed:', err.message)
  }

  // Forward. Holly replies from her own phone for now; the Texts tab will let
  // her answer from the site number instead.
  await notifyHolly(`Text from ${prettyPhone(from)}:\n${body || (media ? `(${media} photo${media > 1 ? 's' : ''})` : '(empty)')}`)

  res.setHeader('Content-Type', 'text/xml')
  return res.status(200).send('<?xml version="1.0" encoding="UTF-8"?><Response></Response>')
}
