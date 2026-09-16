import crypto from 'node:crypto'
import { put } from '@vercel/blob'
import { todayISO } from './lib/engage-store.js'
import { notifyHolly, prettyPhone, toE164 } from './lib/sms.js'

// Twilio voice webhook for calls TO Holly's site number (517-300-8226).
// Rings her cell for 25 seconds; if she does not pick up the caller hears a
// short message and a callback text goes to Holly so a missed call is never
// a lost lead. Every call is logged under sms/<10 digits>/ so it shows in the
// same thread as their texts.
//
// Twilio calls this twice: once when the call arrives (no DialCallStatus) and
// once after the Dial completes (with DialCallStatus).

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

const twiml = (res, inner) => {
  res.setHeader('Content-Type', 'text/xml')
  return res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?><Response>${inner}</Response>`)
}

async function log(from, entry) {
  try {
    const receivedAt = new Date().toISOString()
    await put(`sms/${String(from).replace(/\D/g, '').slice(-10)}/${todayISO()}/${receivedAt.replace(/[:.]/g, '-')}-call.json`,
      JSON.stringify({ direction: 'in', kind: 'call', from, receivedAt, ...entry }, null, 2),
      { access: 'public', addRandomSuffix: false, contentType: 'application/json' })
  } catch (err) {
    console.error('voice log failed:', err.message)
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const params = req.body && typeof req.body === 'object' ? Object.fromEntries(Object.entries(req.body).map(([k, v]) => [k, String(v)])) : {}
  const url = `https://${req.headers['x-forwarded-host'] || req.headers.host}${req.url}`
  if (!validSignature(req, url, params)) return res.status(403).end()

  const from = params.From || ''
  const holly = toE164(process.env.HOLLY_SMS_PHONE)

  // Screening leg, on Holly's side of the call. Carrier voicemail "answers"
  // a forwarded call and Twilio would count it as completed, so the bridge
  // only happens when a human presses 1. Voicemail cannot, so the caller falls
  // through to the missed-call path instead of her mailbox.
  if (req.url.includes('screen=1')) {
    if (params.Digits === '1') return twiml(res, '')
    if (params.Digits) return twiml(res, '<Hangup/>')
    const base = url.split('?')[0]
    return twiml(res, `<Gather numDigits="1" timeout="6" action="${base}?screen=1" method="POST"><Say voice="Polly.Joanna">Holly, a call from your website. Press 1 to take it.</Say></Gather><Hangup/>`)
  }
  if (!holly) return twiml(res, `<Say voice="Polly.Joanna">Thanks for calling Holly Griewahn at Foundation Realty. Please text this number and Holly will get right back to you.</Say>`)

  // Second leg: the Dial finished. Anything but "completed" means she missed it.
  if (params.DialCallStatus) {
    // DialBridged is false when the screen hung up before connecting (voicemail
    // answered, or nobody pressed 1), even though Twilio calls that "completed".
    const missed = params.DialCallStatus !== 'completed' || params.DialBridged === 'false'
    await log(from, { status: params.DialCallStatus, duration: Number(params.DialCallDuration || 0), body: missed ? 'Missed call' : `Call, ${params.DialCallDuration || 0}s` })
    if (missed) {
      await notifyHolly(`Missed call on the site number from ${prettyPhone(from)}. Call back or reply from the Texts tab.`)
      return twiml(res, `<Say voice="Polly.Joanna">Holly is with a client right now. She has your number and will call you back shortly. You can also text this number.</Say>`)
    }
    return twiml(res, '')
  }

  // First leg: ring Holly's cell, then come back here with the result.
  const base = url.split('?')[0]
  return twiml(res, `<Dial timeout="25" callerId="${params.To || ''}" action="${base}" method="POST"><Number url="${base}?screen=1" method="POST">${holly}</Number></Dial>`)
}
