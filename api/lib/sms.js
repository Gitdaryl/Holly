// Speed-to-lead SMS. Two directions, one Twilio number:
//   notifyHolly(text)         Holly's phone buzzes seconds after a lead lands.
//   textLead(phone, text)     the lead hears back before Holly has read it.
//
// Every caller persists the lead FIRST (Blob or Notion) and treats this as
// best-effort: a Twilio outage or missing env must never fail an intake.
// Phone normalization lives here, not at the call sites. Manitou-Beach lost
// months of admin alerts to a "+1+1..." double prefix from formatting twice.
//
// Env: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE (E.164 sender),
//      HOLLY_SMS_PHONE (her cell, any US format). Unset HOLLY_SMS_PHONE means
//      Holly is not texted; leads still get their auto-reply if Twilio is set.

export function normalizePhone(raw) {
  return String(raw || '').replace(/\D/g, '').slice(-10)
}

export function toE164(raw) {
  const d = normalizePhone(raw)
  return d.length === 10 ? `+1${d}` : null
}

// Human-friendly (517) 403-3413 for message bodies.
export function prettyPhone(raw) {
  const d = normalizePhone(raw)
  return d.length === 10 ? `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}` : String(raw || '')
}

async function send(toE164, body) {
  const sid = process.env.TWILIO_ACCOUNT_SID
  const token = process.env.TWILIO_AUTH_TOKEN
  const from = process.env.TWILIO_PHONE
  if (!sid || !token || !from) return { ok: false, error: 'twilio env not set' }
  if (!toE164) return { ok: false, error: 'bad phone' }
  try {
    const r = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ From: from, To: toE164, Body: body.slice(0, 1500) }).toString(),
      signal: AbortSignal.timeout(10000),
    })
    if (!r.ok) {
      const text = await r.text()
      console.error(`sms: ${toE164} failed ${r.status}: ${text.slice(0, 200)}`)
      return { ok: false, error: text.slice(0, 200) }
    }
    return { ok: true }
  } catch (e) {
    console.error('sms: error', e.message)
    return { ok: false, error: e.message }
  }
}

export async function notifyHolly(text) {
  const to = toE164(process.env.HOLLY_SMS_PHONE)
  if (!to) return { ok: false, error: 'HOLLY_SMS_PHONE not set' }
  return send(to, text)
}

// Leads opted in by typing their number into a form asking Holly to contact
// them; one confirmation text is the expected response, not marketing.
export async function textLead(phone, text) {
  const to = toE164(phone)
  if (!to) return { ok: false, error: 'lead has no usable phone' }
  return send(to, text)
}

export const HOLLY_PRETTY = '(517) 403-3413'
