import { put } from '@vercel/blob'
import { sanitizeSlug, todayISO } from './lib/engage-store.js'
import { notifyHolly, textLead, HOLLY_PRETTY, prettyPhone } from './lib/sms.js'

// Showing requests, attributed to a listing.
// PERSIST FIRST, notify second: the lead is written to Blob before any email
// is attempted, so a Resend outage can never lose a lead. Holly's /api/contact
// had the opposite order and dropped every submission while RESEND_API_KEY was
// unset in production.

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const slug = sanitizeSlug(req.query.slug)
  if (!slug) return res.status(400).json({ error: 'slug required' })

  const { name, phone, email, preferred, message, title } = req.body || {}
  if (!name || !phone) return res.status(400).json({ error: 'Name and phone are required.' })

  const lead = {
    slug,
    listing: title ? String(title).slice(0, 300) : null,
    name: String(name).slice(0, 200),
    phone: String(phone).slice(0, 50),
    email: email ? String(email).slice(0, 200) : null,
    preferred: preferred ? String(preferred).slice(0, 300) : null,
    message: message ? String(message).slice(0, 2000) : null,
    receivedAt: new Date().toISOString(),
    userAgent: req.headers['user-agent'] || null,
  }

  // 1. Persist. If this fails the request fails loudly and the visitor is told
  //    to call instead, which is better than a silent success.
  try {
    const stamp = lead.receivedAt.replace(/[:.]/g, '-')
    await put(
      `leads/${slug}/${todayISO()}/${stamp}-${crypto.randomUUID()}.json`,
      JSON.stringify(lead, null, 2),
      { access: 'public', addRandomSuffix: false, contentType: 'application/json' },
    )
  } catch (err) {
    console.error('Lead persist failed:', err)
    return res.status(500).json({ error: 'Could not save your request. Please call or text Holly directly.' })
  }

  // 2. Notify. Failure is logged but never loses the lead. SMS first: the
  //    text is what Holly actually sees within the minute, email is the record.
  const first = lead.name.split(' ')[0]
  const [sms, reply, emailed] = await Promise.all([
    notifyHolly(`${lead.name} wants to see ${lead.listing || lead.slug}${lead.preferred ? `, ${lead.preferred.toLowerCase()}` : ''}.${lead.message ? `\n"${lead.message.slice(0, 180)}"` : ''}\nCall: ${prettyPhone(lead.phone)}`),
    textLead(lead.phone, `Hi ${first}, this is Holly Griewahn with Foundation Realty. Got your request to see ${lead.listing || 'the listing'}. I'll call you shortly to set it up. Anything urgent, text me here or call ${HOLLY_PRETTY}.`),
    emailHolly(lead).catch((err) => { console.error('Lead email failed (lead IS saved):', err); return false }),
  ])

  return res.status(200).json({ success: true, notified: emailed || sms.ok, sms: sms.ok, autoReply: reply.ok })
}

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

async function emailHolly(lead) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return false
  const to = process.env.HOLLY_CONTACT_EMAIL || 'admin@yetigroove.com'

  const row = (label, value) =>
    value ? `<tr><td style="padding:8px 0;font-weight:600;width:130px">${esc(label)}</td><td style="padding:8px 0">${esc(value)}</td></tr>` : ''

  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
      <h2 style="color:#1c2b29;margin-bottom:4px">New Showing Request</h2>
      <p style="color:#66706e;font-size:14px;margin-top:0">${esc(lead.listing || lead.slug)}</p>
      <hr style="border:none;border-top:1px solid #eeddd8;margin:20px 0" />
      <table style="width:100%;border-collapse:collapse">
        ${row('Name', lead.name)}
        ${row('Phone', lead.phone)}
        ${row('Email', lead.email)}
        ${row('Preferred time', lead.preferred)}
        ${row('Message', lead.message)}
        ${row('Received', lead.receivedAt)}
      </table>
    </div>`

  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'Holly Listings <noreply@yetigroove.com>',
      to: [to],
      ...(lead.email ? { reply_to: lead.email } : {}),
      subject: `Showing request: ${lead.name} - ${lead.listing || lead.slug}`,
      html,
    }),
  })
  if (!r.ok) throw new Error(await r.text())
  return true
}
