import {
  validEmail, normalize, hashEmail, newSub, readSub, writeSub, logEvent,
  counts, MAILABLE,
} from './lib/newsletter-store.js'
import { verify, mintConfirm, mintUnsub } from './lib/newsletter-token.js'
import { renderTransactional, renderPage } from './lib/newsletter-email.js'
import { sendMail, newsletterFrom } from './lib/mail.js'

// Subscribe, confirm, unsubscribe. No sending of issues happens here.
//
//   POST  /api/newsletter                      { email, source }
//   GET   /api/newsletter?action=confirm&t=
//   GET   /api/newsletter?action=unsubscribe&t=
//   POST  /api/newsletter?action=unsubscribe&t=   RFC 8058 one-click
//   GET   /api/newsletter?action=count
//   GET   /api/newsletter?action=health
//
// Double opt-in on purpose. A brand new sending domain with no reputation is
// about to send its first bulk mail, and confirmed opt-in is the strongest
// protection against the first-send complaint spike that gets a domain
// throttled. It is also the only way to PROVE consent when somebody
// complains. It costs perhaps a quarter of signups, and those are the quarter
// who would have reported it.

const SITE = () => (process.env.PUBLIC_SITE_URL || 'https://hollygriewahn.vercel.app').replace(/\/$/, '')
const confirmUrl = (t) => `${SITE()}/api/newsletter?action=confirm&t=${encodeURIComponent(t)}`
const unsubUrl = (t) => `${SITE()}/api/newsletter?action=unsubscribe&t=${encodeURIComponent(t)}`

const html = (res, code, body) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  return res.status(code).send(body)
}

export default async function handler(req, res) {
  const action = req.query?.action || ''

  if (action === 'health') {
    res.setHeader('Cache-Control', 'no-store')
    let store = false
    try { await counts(); store = true } catch { /* reported below */ }
    return res.status(200).json({
      ok: store && Boolean(process.env.NEWSLETTER_SECRET) && Boolean(process.env.RESEND_API_KEY) && Boolean(newsletterFrom()),
      blobStore: store,
      newsletterSecret: Boolean(process.env.NEWSLETTER_SECRET),
      resendKey: Boolean(process.env.RESEND_API_KEY),
      from: newsletterFrom(),
      site: SITE(),
      // The gate that matters. Unsubscribe links are absolute URLs that live
      // in inboxes forever; if they are built on a host that stops resolving,
      // the opt-out breaks for every message already sent.
      safeToSend: SITE().includes('hollygriewahn.com'),
    })
  }

  if (action === 'count') {
    try {
      const c = await counts()
      res.setHeader('Cache-Control', 'public, s-maxage=300')
      return res.status(200).json(c)
    } catch {
      return res.status(200).json({ subscribers: 0 })
    }
  }

  // ── RFC 8058 one-click. Must act on an unauthenticated POST, return fast,
  // and render nothing. Mail clients call this without a human present.
  if (action === 'unsubscribe' && req.method === 'POST') {
    const p = verify(req.query?.t, 'unsub')
    if (!p) return res.status(400).end()
    await setUnsubscribed(p.h, 'one-click')
    return res.status(200).end()
  }

  if (action === 'unsubscribe') {
    const p = verify(req.query?.t, 'unsub')
    if (!p) {
      return html(res, 400, renderPage(
        'That link has expired',
        'We could not read that unsubscribe link. Reply to any of Holly’s emails with the word "stop" and she will take you off the list herself.',
        { siteUrl: SITE() },
      ))
    }
    await setUnsubscribed(p.h, 'link')
    return html(res, 200, renderPage(
      'You are unsubscribed',
      'You will not get the newsletter again. Nothing else changes, and Holly is still a phone call away if you ever need her.',
      { siteUrl: SITE(), cta: { label: 'Back to the site', href: SITE() } },
    ))
  }

  if (action === 'confirm') {
    const p = verify(req.query?.t, 'confirm')
    if (!p) {
      return html(res, 400, renderPage(
        'That link has expired',
        'Confirmation links are good for a week. Sign up again and we will send a fresh one.',
        { siteUrl: SITE(), cta: { label: 'Sign up again', href: `${SITE()}/events` } },
      ))
    }
    const sub = await readSub(p.h)
    if (!sub) {
      return html(res, 404, renderPage(
        'We could not find that signup',
        'It may have been removed. Sign up again and we will send a fresh confirmation.',
        { siteUrl: SITE(), cta: { label: 'Sign up again', href: `${SITE()}/events` } },
      ))
    }

    if (sub.status !== 'confirmed') {
      sub.status = 'confirmed'
      sub.confirmedAt = new Date().toISOString()
      sub.consent.confirmedAt = sub.confirmedAt
      sub.consent.confirmIp = ipOf(req)
      await writeSub(sub)
      await logEvent(sub.hash, 'confirmed', { ip: sub.consent.confirmIp })

      // Best effort, after the state is already saved.
      sendMail({
        to: sub.email,
        subject: 'You are on the list',
        html: renderTransactional('welcome', { unsubUrl: unsubUrl(mintUnsub(sub.hash)), siteUrl: SITE() }),
        headers: listHeaders(sub.hash),
      }).catch(() => {})
    }

    return html(res, 200, renderPage(
      'You are on the list',
      'Once a month or so: what sold around the lakes, what came up, and what is on locally. You can leave any time from the link at the bottom of every email.',
      { siteUrl: SITE(), cta: { label: 'See what is for sale', href: `${SITE()}/listings` } },
    ))
  }

  // ── subscribe
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  let b = req.body
  if (typeof b === 'string') { try { b = JSON.parse(b) } catch { b = null } }
  const email = normalize(b?.email)
  if (!validEmail(email)) return res.status(400).json({ error: 'That email address does not look right.' })

  const hash = hashEmail(email)
  const existing = await readSub(hash)

  if (existing && existing.status === 'confirmed') {
    return res.status(200).json({ success: true, already: true })
  }

  const sub = existing && existing.status !== 'unsubscribed'
    ? { ...existing, subscribedAt: new Date().toISOString() }
    : newSub(email, { source: b?.source, ip: ipOf(req), userAgent: req.headers['user-agent'] })

  // Somebody who left and came back is a fresh opt-in, and must confirm again.
  if (existing && existing.status === 'unsubscribed') {
    sub.status = 'pending'
    sub.unsubscribedAt = null
  }

  // 1. Persist, and fail loudly if that fails. The house rule in this repo:
  //    nothing is "received" until it is written down.
  try {
    await writeSub(sub)
  } catch (err) {
    console.error('newsletter persist failed:', err.message)
    return res.status(500).json({ error: 'Could not save that. Please try again, or text Holly at (517) 403-3413.' })
  }
  await logEvent(hash, existing ? 'resubscribe' : 'subscribe', { source: sub.source })

  // 2. Notify, best effort. A failed confirmation email must not lose the row.
  const mail = await sendMail({
    to: email,
    subject: 'Confirm your email',
    html: renderTransactional('confirm', {
      confirmUrl: confirmUrl(mintConfirm(hash)),
      unsubUrl: unsubUrl(mintUnsub(hash)),
      siteUrl: SITE(),
    }),
    headers: listHeaders(hash),
  })
  if (!mail.ok) console.error('newsletter confirm email failed:', mail.error)

  return res.status(200).json({ success: true, pending: true, sent: mail.ok })
}

async function setUnsubscribed(hash, how) {
  const sub = await readSub(hash)
  if (!sub) return
  if (sub.status === 'unsubscribed') return
  sub.status = 'unsubscribed'
  sub.unsubscribedAt = new Date().toISOString()
  await writeSub(sub)
  await logEvent(hash, 'unsubscribe', { how })
}

// Both headers, per recipient. Gmail and Yahoo treat one-click unsubscribe as
// a bulk-sender requirement, and it is a placement signal well below their
// volume threshold.
export function listHeaders(hash) {
  const t = mintUnsub(hash)
  return {
    'List-Unsubscribe': `<${unsubUrl(t)}>`,
    'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
  }
}

const ipOf = (req) => (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || null

export { MAILABLE }
