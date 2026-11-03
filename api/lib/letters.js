import crypto from 'node:crypto'
import { list, put } from '@vercel/blob'
import { SITE } from './report.js'
import { PRETTY_PHONE } from './newsletter-email.js'
import { BROKERAGE, PHONE, AWARDS, awardText } from '../../src/data/profiles.js'
import { byId, TERMS, subjectFor } from '../../src/data/stationery.js'
import { renderLetter, renderText } from '../../src/lib/letter-html.js'

// Stationery on the server: build the final HTML/text for an email from the
// same renderer the desk previews with, and keep a record of every letter
// that went out (append-only, like everything else here):
//   letters/<date ET>/<ts>-<uuid>.json   { templateId, dealId, to, how, subject, at }

export function build({ templateId, fields = {}, text = '', subject = '' }) {
  const t = byId(templateId)
  if (!t) throw Object.assign(new Error('Unknown letter template.'), { status: 400 })
  const dateStr = new Date().toLocaleDateString('en-US', { timeZone: 'America/Detroit', month: 'long', day: 'numeric', year: 'numeric' })
  const subj = String(subject || subjectFor(t, fields) || '').trim().slice(0, 160)
  const body = String(text || '').trim().slice(0, 20000)
  if (body.length < 10) throw Object.assign(new Error('The letter is empty.'), { status: 400 })
  const common = { subject: subj, text: body, dateStr, terms: t.terms.map((k) => [k, TERMS[k]]).filter(([, m]) => m), phone: PHONE.replace(/-/g, ''), prettyPhone: PRETTY_PHONE, brokerage: BROKERAGE, awards: AWARDS[0] ? awardText(AWARDS[0]) : '' }
  return { subject: subj, html: renderLetter({ ...common, siteUrl: SITE }), text: renderText(common) }
}

export async function log(entry) {
  const at = new Date().toISOString()
  const day = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Detroit' })
  const rec = { id: crypto.randomUUID(), at, ...entry }
  await put(`letters/${day}/${Date.now()}-${rec.id}.json`, JSON.stringify(rec), { access: 'public', addRandomSuffix: false, contentType: 'application/json' })
  return rec
}

export async function recent(n = 30) {
  const out = []
  let cursor
  do {
    const page = await list({ prefix: 'letters/', limit: 1000, cursor })
    out.push(...page.blobs)
    cursor = page.hasMore ? page.cursor : null
  } while (cursor)
  const latest = out.sort((a, b) => (a.pathname < b.pathname ? 1 : -1)).slice(0, n)
  const recs = await Promise.all(latest.map(async (b) => { try { return await (await fetch(b.url, { cache: 'no-store' })).json() } catch { return null } }))
  return recs.filter(Boolean)
}
