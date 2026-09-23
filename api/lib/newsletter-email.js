import { BRAND } from './report.js'
import { BROKERAGE, PHONE } from '../../src/data/profiles.js'

// THE newsletter's entire visual surface. One renderer, deliberately.
//
// The Manitou version of this grew THREE divergent templates for one
// newsletter (a cron email builder, a web-view builder, and a separate
// welcome email) plus a fourth in the admin preview. They drifted, and a
// change to the footer had to be made four times or it was wrong somewhere.
//
// So: the admin preview, the test send and the real send all call
// renderIssue() with a different unsubUrl. There is no web variant. If a web
// archive page is ever wanted, render this same HTML - do not write a second
// builder.
//
// Email constraints that are NOT style choices:
//   - Tables and inline styles. Gmail and Outlook strip <style> and <link>.
//   - Georgia / system sans, never the site webfonts: @import is stripped and
//     the @font-face fallback fails silently, so the mail arrives in Times.
//   - 600px max width.
//   - The postal address and a plainly visible Unsubscribe are in every
//     message, transactional ones included. CAN-SPAM requires both, and a
//     9px grey unsubscribe link is how you train people to hit "spam".

const SERIF = "Georgia, 'Times New Roman', serif"
const SANS = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif"

export const ADDRESS = `${BROKERAGE.address.street}, ${BROKERAGE.address.city}, ${BROKERAGE.address.region} ${BROKERAGE.address.postal}`
export const PRETTY_PHONE = PHONE.replace(/^\+1-/, '').replace(/^(\d{3})-(\d{3})-(\d{4})$/, '($1) $2-$3')

// Yeti reads an em dash as machine-written. Every string that reaches a
// reader goes through this.
export const stripEmDashes = (s) =>
  String(s == null ? '' : s).replace(/\s*—\s*/g, ' - ').replace(/–/g, '-')

const esc = (s) => stripEmDashes(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const shell = (inner, { unsubUrl, siteUrl, preheader = '' }) => `<!DOCTYPE html>
<html><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Holly Griewahn</title>
</head>
<body style="margin:0;padding:0;background:${BRAND.cream};">
${preheader ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(preheader)}</div>` : ''}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.cream};padding:24px 12px;">
<tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border:1px solid ${BRAND.line};border-radius:14px;overflow:hidden;">

<tr><td style="background:#1a554e;padding:22px 28px;">
  <div style="font:700 11px/1 ${SANS};letter-spacing:.12em;text-transform:uppercase;color:#f5b5c7;margin-bottom:7px;">Foundation Realty &middot; Irish Hills</div>
  <div style="font:400 23px/1.2 ${SERIF};color:#ffffff;">Holly Griewahn</div>
</td></tr>

${inner}

<tr><td style="background:#fbf0ed;border-top:1px solid ${BRAND.line};padding:22px 28px;font:400 12px/1.7 ${SANS};color:${BRAND.muted};">
  <div style="font-weight:700;color:${BRAND.navy};">Holly Griewahn &middot; Foundation Realty</div>
  <div>${esc(ADDRESS)}</div>
  <div><a href="tel:${PHONE.replace(/[^0-9+]/g, '')}" style="color:${BRAND.muted};">${esc(PRETTY_PHONE)}</a> &middot; <a href="${siteUrl}" style="color:${BRAND.muted};">${esc(siteUrl.replace(/^https?:\/\//, ''))}</a></div>
  <div style="margin-top:12px;">
    <a href="${unsubUrl}" style="color:${BRAND.pink};font-weight:700;text-decoration:underline;">Unsubscribe</a>
    <span style="color:#9aa7b4;"> - one click, no questions.</span>
  </div>
</td></tr>

</table>
</td></tr></table>
</body></html>`

const h2 = (t) => `<h2 style="font:400 19px/1.3 ${SERIF};color:${BRAND.navy};margin:0 0 10px;">${esc(t)}</h2>`
const p = (t) => `<p style="font:400 15px/1.75 ${SANS};color:#4a5654;margin:0 0 14px;">${esc(t)}</p>`
const button = (label, href) =>
  `<a href="${href}" style="display:inline-block;background:${BRAND.pink};color:#ffffff;font:700 15px/1 ${SANS};padding:14px 26px;border-radius:10px;text-decoration:none;">${esc(label)}</a>`
const rule = `<tr><td style="padding:0 28px;"><div style="height:1px;background:#f6e9e5;"></div></td></tr>`

// ── the newsletter ────────────────────────────────────────────────────────

export function renderIssue(issue, { unsubUrl, siteUrl }) {
  const sec = []

  sec.push(`<tr><td style="padding:26px 28px 6px;">
    ${h2(issue.headline || 'From the lakes')}
    ${(issue.intro || '').split('\n').filter(Boolean).map(p).join('')}
  </td></tr>`)

  if (issue.marketNote) {
    sec.push(rule)
    sec.push(`<tr><td style="padding:22px 28px 6px;">${h2('The market')}${p(issue.marketNote)}
      <div style="margin:4px 0 6px;">${button('What is my home worth?', `${siteUrl}/cma`)}</div>
    </td></tr>`)
  }

  if (issue.listings?.length) {
    sec.push(rule)
    sec.push(`<tr><td style="padding:22px 28px 6px;">${h2('On the market')}
      ${issue.listings.map((l) => `<div style="padding:10px 0;border-top:1px solid #f6e9e5;">
        <a href="${siteUrl}/property/${esc(l.slug)}" style="font:700 15px/1.4 ${SANS};color:${BRAND.navy};text-decoration:none;">${esc(l.title)}</a>
        <div style="font:400 13px/1.6 ${SANS};color:${BRAND.muted};">${esc(l.line)}</div>
      </div>`).join('')}
    </td></tr>`)
  }

  if (issue.events?.length) {
    sec.push(rule)
    sec.push(`<tr><td style="padding:22px 28px 6px;">${h2("What's on")}
      ${issue.eventLead ? p(issue.eventLead) : ''}
      ${issue.events.map((e) => `<div style="padding:8px 0;border-top:1px solid #f6e9e5;font:400 14px/1.6 ${SANS};color:#4a5654;">
        <a href="${e.url}" style="color:${BRAND.navy};font-weight:700;text-decoration:none;">${esc(e.name)}</a>
        <span style="color:${BRAND.muted};"> &middot; ${esc(e.when)}${e.location ? ` &middot; ${esc(e.location)}` : ''}</span>
      </div>`).join('')}
      <div style="margin:14px 0 6px;font:400 13px/1.6 ${SANS};">
        <a href="${siteUrl}/events" style="color:${BRAND.pink};font-weight:700;">The full calendar</a>
      </div>
    </td></tr>`)
  }

  if (issue.closing) {
    sec.push(rule)
    sec.push(`<tr><td style="padding:22px 28px 26px;">${p(issue.closing)}
      <div style="font:400 15px/1.75 ${SANS};color:#4a5654;">Holly</div>
    </td></tr>`)
  }

  return shell(sec.join(''), { unsubUrl, siteUrl, preheader: issue.preheader })
}

// ── confirm and welcome, same shell ───────────────────────────────────────

export function renderTransactional(kind, { confirmUrl, unsubUrl, siteUrl }) {
  if (kind === 'confirm') {
    return shell(`<tr><td style="padding:26px 28px;">
      ${h2('One tap and you are on the list')}
      ${p('You (or somebody using this address) asked for Holly Griewahn’s note from the Irish Hills lakes. Confirm it and you are in.')}
      <div style="margin:6px 0 16px;">${button('Yes, sign me up', confirmUrl)}</div>
      ${p('If that was not you, ignore this. Nothing happens and you will not hear from us again.')}
    </td></tr>`, { unsubUrl, siteUrl, preheader: 'Confirm your email and you are on the list.' })
  }

  return shell(`<tr><td style="padding:26px 28px;">
    ${h2('You are on the list')}
    ${p('Once a month, roughly: what sold around the lakes, what came up, and what is on locally. Nothing else, and no pitch.')}
    ${p('If you ever want to know what your place would bring, just reply to this - it reaches Holly.')}
    <div style="margin:6px 0 16px;">${button('See what is for sale', `${siteUrl}/listings`)}</div>
  </td></tr>`, { unsubUrl, siteUrl, preheader: 'Once a month from the Irish Hills lakes.' })
}

// ── the confirm / unsubscribe landing pages ───────────────────────────────
//
// Served as HTML by the function itself, not an SPA route. An unsubscribe
// that depends on a JS bundle loading is an unsubscribe that can fail, and a
// failed unsubscribe is the one failure with legal weight.

export function renderPage(title, message, { siteUrl, cta }) {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex">
<title>${esc(title)} | Holly Griewahn</title></head>
<body style="margin:0;background:${BRAND.cream};font-family:${SANS};color:${BRAND.navy};">
<div style="max-width:520px;margin:0 auto;padding:16vh 24px 24px;">
  <div style="background:#fff;border:1px solid ${BRAND.line};border-radius:14px;padding:32px;">
    <div style="font:700 11px/1 ${SANS};letter-spacing:.12em;text-transform:uppercase;color:#98a3a1;margin-bottom:10px;">Foundation Realty</div>
    <h1 style="font:400 26px/1.25 ${SERIF};margin:0 0 12px;">${esc(title)}</h1>
    <p style="font:400 15px/1.75 ${SANS};color:#4a5654;margin:0 0 20px;">${esc(message)}</p>
    ${cta ? `<a href="${cta.href}" style="display:inline-block;background:${BRAND.pink};color:#fff;font-weight:700;padding:12px 22px;border-radius:10px;text-decoration:none;">${esc(cta.label)}</a>` : ''}
  </div>
  <div style="text-align:center;margin-top:18px;font-size:12px;color:${BRAND.muted};">
    Holly Griewahn &middot; Foundation Realty &middot; ${esc(ADDRESS)}<br>
    <a href="${siteUrl}" style="color:${BRAND.muted};">${esc(siteUrl.replace(/^https?:\/\//, ''))}</a>
  </div>
</div></body></html>`
}
