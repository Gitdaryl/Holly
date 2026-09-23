// Sending email, in one place.
//
// The From address is an environment variable from day one. api/contact.js
// and api/cron-seller-report.js hardcode noreply@yetigroove.com, which is
// fine for an internal alert to Holly and wrong for anything a client reads:
// DMARC then aligns to Yeti's domain and the recipient sees a brand they do
// not know.
//
// The newsletter should send from a SUBDOMAIN of hers (news.hollygriewahn.com)
// so a bad send cannot damage the reputation of her real mail. That is set up
// in Resend and DNS, not here; here we just refuse to guess.

const ENDPOINT = 'https://api.resend.com/emails'

export const newsletterFrom = () =>
  process.env.NEWSLETTER_FROM || process.env.MAIL_FROM || null

// Returns { ok, id } or { ok:false, error }. Never throws: a caller that has
// already persisted its record must not fail because mail did.
export async function sendMail({ to, subject, html, text, from, replyTo, headers }) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return { ok: false, error: 'RESEND_API_KEY not set' }
  const sender = from || newsletterFrom()
  if (!sender) return { ok: false, error: 'no From address configured (set NEWSLETTER_FROM)' }

  try {
    const r = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: sender,
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
        ...(text ? { text } : {}),
        ...(replyTo ? { reply_to: replyTo } : {}),
        ...(headers ? { headers } : {}),
      }),
      signal: AbortSignal.timeout(15000),
    })
    const body = await r.json().catch(() => ({}))
    if (!r.ok) return { ok: false, error: body?.message || `resend ${r.status}` }
    return { ok: true, id: body.id }
  } catch (err) {
    return { ok: false, error: err.message }
  }
}

// Up to 100 messages in one call (Resend's batch maximum), each with its own
// headers so every recipient gets their own one-click unsubscribe. The
// Idempotency-Key makes an honest retry of the same batch safe: Resend drops
// the duplicate for 24 hours. Returns { ok, ids } or { ok:false, error }.
export async function sendMailBatch(messages, { idempotencyKey } = {}) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return { ok: false, error: 'RESEND_API_KEY not set' }
  const sender = newsletterFrom()
  if (!sender) return { ok: false, error: 'no From address configured (set NEWSLETTER_FROM)' }
  if (!messages.length) return { ok: true, ids: [] }
  try {
    const r = await fetch(`${ENDPOINT}/batch`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        ...(idempotencyKey ? { 'Idempotency-Key': idempotencyKey.slice(0, 256) } : {}),
      },
      body: JSON.stringify(messages.map((m) => ({
        from: sender,
        to: [m.to],
        subject: m.subject,
        html: m.html,
        ...(m.headers ? { headers: m.headers } : {}),
      }))),
      signal: AbortSignal.timeout(20000),
    })
    const body = await r.json().catch(() => ({}))
    if (!r.ok) return { ok: false, error: body?.message || `resend ${r.status}` }
    return { ok: true, ids: (body.data || []).map((d) => d.id) }
  } catch (err) {
    return { ok: false, error: err.message }
  }
}
