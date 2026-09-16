import crypto from 'node:crypto'
import { put } from '@vercel/blob'
import { todayISO } from './lib/engage-store.js'
import { notifyHolly, prettyPhone, toE164 } from './lib/sms.js'
import { voicemailLink } from './voicemail.js'
import { SITE } from './lib/report.js'

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

// Pulls the mp3 with the account credentials and sends the bytes to Deepgram.
export async function transcribeWithDeepgram(recordingSid) {
  const sid = process.env.TWILIO_ACCOUNT_SID
  const token = process.env.TWILIO_AUTH_TOKEN
  const audio = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Recordings/${recordingSid}.mp3`, {
    headers: { Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString('base64')}` },
  })
  if (!audio.ok) throw new Error(`recording fetch ${audio.status}`)
  const r = await fetch('https://api.deepgram.com/v1/listen?model=nova-3&smart_format=true&punctuate=true', {
    method: 'POST',
    headers: { Authorization: `Token ${process.env.DEEPGRAM_API_KEY}`, 'Content-Type': 'audio/mpeg' },
    body: Buffer.from(await audio.arrayBuffer()),
    signal: AbortSignal.timeout(25000),
  })
  if (!r.ok) throw new Error(`deepgram ${r.status}: ${(await r.text()).slice(0, 200)}`)
  const j = await r.json()
  return (j.results?.channels?.[0]?.alternatives?.[0]?.transcript || '').trim()
}

const twiml = (res, inner) => {
  res.setHeader('Content-Type', 'text/xml')
  return res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?><Response>${inner}</Response>`)
}

async function log(from, entry) {
  const key = String(from).replace(/\D/g, '').slice(-10) || 'unknown'
  try {
    const receivedAt = new Date().toISOString()
    await put(`sms/${key}/${todayISO()}/${receivedAt.replace(/[:.]/g, '-')}-call.json`,
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

  // Recording/transcription callbacks do not carry the caller's number, so the
  // Dial leg bakes it into their URLs (Twilio signs the full URL, query included).
  const qs = new URL(url).searchParams
  const from = params.From || qs.get('from') || ''
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
  // Transcription callback: Twilio posts the text a minute or so after the
  // recording ends. Store it in the thread and text it to Holly.
  if (req.url.includes('transcript=1')) {
    const text = (params.TranscriptionText || '').trim()
    const audio = params.RecordingSid ? voicemailLink(SITE, params.RecordingSid) : null
    await log(from, { kind: 'voicemail', body: text ? `Voicemail: "${text}"` : 'Voicemail (no transcript)', audio, status: params.TranscriptionStatus || null })
    await notifyHolly(`Voicemail from ${prettyPhone(from)}${audio ? `, listen: ${audio}` : ''}\nRough transcript: "${text || '(none)'}"`)
    return res.status(200).end()
  }
  // Recording is downloadable (recordingStatusCallback). With a Deepgram key
  // the transcript is made here, far more accurately than Twilio's built-in
  // engine; without one, Twilio's transcribeCallback path above still runs.
  if (req.url.includes('ready=1')) {
    if (!process.env.DEEPGRAM_API_KEY || params.RecordingStatus !== 'completed') return res.status(200).end()
    const rec = params.RecordingSid
    const audio = rec ? voicemailLink(SITE, rec) : null
    let text = ''
    try {
      text = await transcribeWithDeepgram(rec)
    } catch (err) {
      console.error('deepgram failed:', err.message)
    }
    await log(from, { kind: 'voicemail', body: text ? `Voicemail: "${text}"` : 'Voicemail (no transcript)', audio, engine: 'deepgram' })
    await notifyHolly(`Voicemail from ${prettyPhone(from)}${audio ? `, listen: ${audio}` : ''}\n"${text || '(could not transcribe, use the link)'}"`)
    return res.status(200).end()
  }
  // Record's action: the caller is still on the line, just close out politely.
  if (req.url.includes('recorded=1')) return twiml(res, '')

  if (!holly) return twiml(res, `<Say voice="Polly.Joanna">Thanks for calling Holly Griewahn at Foundation Realty. Please text this number and Holly will get right back to you.</Say>`)

  // Second leg: the Dial finished. Anything but "completed" means she missed it.
  if (params.DialCallStatus) {
    // DialBridged is false when the screen hung up before connecting (voicemail
    // answered, or nobody pressed 1), even though Twilio calls that "completed".
    const missed = params.DialCallStatus !== 'completed' || params.DialBridged === 'false'
    await log(from, { status: params.DialCallStatus, duration: Number(params.DialCallDuration || 0), body: missed ? 'Missed call' : `Call, ${params.DialCallDuration || 0}s` })
    if (missed) {
      await notifyHolly(`Missed call on the site number from ${prettyPhone(from)}. Call back or reply from the Texts tab.`)
      const base = url.split('?')[0]
      const who = `&from=${encodeURIComponent(from)}`
      const transcription = process.env.DEEPGRAM_API_KEY
        ? `recordingStatusCallback="${base}?ready=1${who}" recordingStatusCallbackEvent="completed" recordingStatusCallbackMethod="POST"`
        : `transcribe="true" transcribeCallback="${base}?transcript=1${who}"`
      return twiml(res, `<Say voice="Polly.Joanna">Holly is with a client right now. She has your number and will call you back shortly. Leave a message after the tone, or text this number.</Say><Record maxLength="120" playBeep="true" timeout="5" ${transcription} action="${base}?recorded=1" method="POST" /><Say voice="Polly.Joanna">Thanks, Holly will be in touch.</Say>`)
    }
    return twiml(res, '')
  }

  // First leg: ring Holly's cell, then come back here with the result.
  const base = url.split('?')[0]
  return twiml(res, `<Dial timeout="25" callerId="${params.To || ''}" action="${base}" method="POST"><Number url="${base}?screen=1" method="POST">${holly}</Number></Dial>`)
}
