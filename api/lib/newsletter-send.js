import crypto from 'node:crypto'
import { put } from '@vercel/blob'
import { propertiesData } from '../../src/data/amenities.js'
import { lakes } from '../../src/data/lakes.js'
import { regions } from '../../src/data/regions.js'
import { isActive } from '../../src/lib/listing-stats.js'
import { fetchEvents, EVENT_PAGE } from './events-feed.js'
import { listAll, todayISO } from './engage-store.js'
import { allSubPaths, hashFromPath, readSub, issue as readIssue, writeIssue, ISSUES, SENDS, MAILABLE } from './newsletter-store.js'
import { renderIssue } from './newsletter-email.js'
import { mintUnsub } from './newsletter-token.js'
import { newsletterFrom, sendMail, sendMailBatch } from './mail.js'

// Writing and sending an issue, for the desk's Letter tab.
//
//   draft -> sending -> sent. Holly can edit a draft as often as she likes;
//   once sending starts the issue is frozen.
//
// THE SEND IS RESUMABLE, and that is the whole design. A Vercel function has a
// time limit and a list can outgrow one call, so the desk calls send() again
// and again until it reports nothing left. Each call does a slice. Per
// recipient, three empty marker blobs record where things stand, all in the
// pathname so progress is one list() with no content reads:
//
//   news/sends/<issueId>/<emailHash>.claimed   written BEFORE the mail goes out
//   news/sends/<issueId>/<emailHash>.sent      written after Resend accepted it
//   news/sends/<issueId>/<emailHash>.failed    Resend refused it; retried next call
//
// A claimed address with no .sent and no .failed means the function died
// mid-batch: we cannot know if it went out, so it is NOT retried (a second
// copy is worse than a missed one) and the desk shows it as "unconfirmed".
// Resend's Idempotency-Key is keyed on the exact batch, so an honest retry of
// the same batch within 24h is deduplicated on their side as well.
//
// Subscribers are read at SEND time, never from a snapshot: someone who
// unsubscribed five minutes ago must not get it.

export const siteUrl = () => (process.env.PUBLIC_SITE_URL || 'https://hollygriewahn.vercel.app').replace(/\/$/, '')
const unsubUrl = (hash) => `${siteUrl()}/api/newsletter?action=unsubscribe&t=${encodeURIComponent(mintUnsub(hash))}`
const BATCH = 100 // Resend's batch maximum
const BUDGET_MS = 20000 // stop starting new batches after this; the function limit is 30s

// What is still missing, in words Holly (and Yeti) can act on.
export function readiness() {
  const from = newsletterFrom()
  const site = siteUrl()
  const waitingOn = []
  if (!from) waitingOn.push('A sending address. Holly finishes the email steps, then Yeti sets NEWSLETTER_FROM.')
  if (!site.includes('hollygriewahn.com')) waitingOn.push('The switch to hollygriewahn.com. Unsubscribe links live in inboxes for a year, so they cannot point at the temporary address.')
  if (!process.env.RESEND_API_KEY) waitingOn.push('RESEND_API_KEY is not set.')
  if (!process.env.NEWSLETTER_SECRET) waitingOn.push('NEWSLETTER_SECRET is not set.')
  const canTest = Boolean(from && process.env.RESEND_API_KEY && process.env.NEWSLETTER_SECRET)
  return { from, site, canTest, canSend: canTest && site.includes('hollygriewahn.com'), waitingOn }
}

async function allSubs() {
  const { paths } = await allSubPaths()
  const subs = await Promise.all(paths.map((p) => readSub(hashFromPath(p))))
  return subs.filter(Boolean)
}

export async function subscriberCounts() {
  const c = { confirmed: 0, pending: 0, unsubscribed: 0 }
  for (const s of await allSubs()) if (s.status in c) c[s.status]++
  return c
}

export async function listIssues() {
  const { paths } = await listAll(ISSUES)
  const issues = (await Promise.all(paths.map((p) => readIssue(p.slice(ISSUES.length).replace(/\.json$/, ''))))).filter(Boolean)
  return issues
    .map(({ id, headline, status, updatedAt, sentAt, result }) => ({ id, headline, status, updatedAt, sentAt, result: result || null }))
    .sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)))
}

// A fresh draft, filled from what is true today: her active listings and the
// next few weeks of local events. The words (headline aside) are hers.
export async function starter() {
  const today = todayISO()
  const month = new Date(`${today}T12:00:00`).toLocaleDateString('en-US', { month: 'long' })
  const listings = propertiesData.filter(isActive).map((p) => ({
    slug: p.slug,
    title: p.title,
    line: [p.price, p.beds && `${p.beds} bed`, p.baths && `${p.baths} bath`, lakes[p.lake]?.name || regions[p.region]?.name].filter(Boolean).join(' · '),
  }))
  const horizon = new Date(Date.now() + 45 * 86400000).toISOString().slice(0, 10)
  const { events: feed } = await fetchEvents({ full: true })
  const events = feed.filter((e) => e.date <= horizon).slice(0, 6).map((e) => ({
    name: e.name,
    when: [new Date(`${e.date}T12:00:00`).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }), e.time].filter(Boolean).join(', '),
    location: e.location || '',
    url: e.url || EVENT_PAGE(e.id),
  }))
  return {
    id: `${today.slice(0, 7)}-${crypto.randomBytes(3).toString('hex')}`,
    status: 'draft',
    headline: `${month} on the lakes`,
    preheader: '',
    intro: '',
    marketNote: '',
    listings,
    eventLead: '',
    events,
    closing: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

const TEXT = { headline: 120, preheader: 140, intro: 3000, marketNote: 1500, eventLead: 400, closing: 1500 }

export async function save(input) {
  const id = String(input?.id || '').replace(/[^a-z0-9-]/gi, '').slice(0, 40)
  if (!id) throw Object.assign(new Error('Missing issue id.'), { status: 400 })
  const current = await readIssue(id)
  if (current && current.status !== 'draft') throw Object.assign(new Error('This letter has already gone out and can no longer be edited.'), { status: 409 })
  const next = { ...(current || { id, createdAt: new Date().toISOString() }), status: 'draft', updatedAt: new Date().toISOString() }
  for (const [k, max] of Object.entries(TEXT)) next[k] = String(input[k] ?? '').slice(0, max)
  next.listings = (Array.isArray(input.listings) ? input.listings : []).slice(0, 12).map((l) => ({ slug: String(l.slug || ''), title: String(l.title || '').slice(0, 120), line: String(l.line || '').slice(0, 160) }))
  next.events = (Array.isArray(input.events) ? input.events : []).slice(0, 10).map((e) => ({ name: String(e.name || '').slice(0, 120), when: String(e.when || '').slice(0, 60), location: String(e.location || '').slice(0, 120), url: /^https:\/\//.test(e.url) ? e.url : EVENT_PAGE() }))
  return writeIssue(next)
}

export const preview = (issue) => renderIssue(issue, { unsubUrl: `${siteUrl()}/api/newsletter?action=unsubscribe&t=preview`, siteUrl: siteUrl() })

export async function sendTest(id, to) {
  const ready = readiness()
  if (!ready.canTest) throw Object.assign(new Error(`Test sends are off until: ${ready.waitingOn[0]}`), { status: 409 })
  const issue = await readIssue(id)
  if (!issue) throw Object.assign(new Error('Save the letter first.'), { status: 404 })
  const r = await sendMail({ to, subject: `[Test] ${issue.headline}`, html: preview(issue) })
  if (!r.ok) throw Object.assign(new Error(`Test send failed: ${r.error}`), { status: 502 })
  return { ok: true, to }
}

async function progress(id) {
  const { paths } = await listAll(`${SENDS}${id}/`)
  const st = { sent: new Set(), failed: new Set(), claimed: new Set() }
  for (const p of paths) {
    const m = p.slice(`${SENDS}${id}/`.length).match(/^([^/.]+)\.(sent|failed|claimed)$/)
    if (m) st[m[2]].add(m[1])
  }
  for (const h of st.sent) st.failed.delete(h)
  const inDoubt = [...st.claimed].filter((h) => !st.sent.has(h) && !st.failed.has(h))
  return { ...st, inDoubt }
}

const mark = (id, hash, state, body = '1') =>
  put(`${SENDS}${id}/${hash}.${state}`, body, { access: 'public', addRandomSuffix: false, allowOverwrite: true, contentType: 'text/plain' })

// One slice of the send. The desk calls this until { done: true }.
export async function send(id) {
  const started = Date.now()
  const ready = readiness()
  if (!ready.canSend) throw Object.assign(new Error(`Sending is off until: ${ready.waitingOn[0]}`), { status: 409 })
  const issue = await readIssue(id)
  if (!issue) throw Object.assign(new Error('No such letter.'), { status: 404 })
  if (issue.status === 'sent') throw Object.assign(new Error('This letter has already gone out.'), { status: 409 })
  if (issue.status !== 'sending') await writeIssue({ ...issue, status: 'sending', sendingSince: new Date().toISOString() })

  const st = await progress(id)
  const subs = (await allSubs()).filter((s) => MAILABLE.has(s.status))
  const todo = subs.filter((s) => !st.sent.has(s.hash) && !st.inDoubt.includes(s.hash))
  let error = null

  for (let i = 0; i < todo.length && Date.now() - started < BUDGET_MS; i += BATCH) {
    const batch = todo.slice(i, i + BATCH)
    await Promise.all(batch.map((s) => mark(id, s.hash, 'claimed')))
    const key = crypto.createHash('sha256').update(`${id}:${batch.map((s) => s.hash).join(',')}`).digest('hex')
    const r = await sendMailBatch(batch.map((s) => {
      const u = unsubUrl(s.hash)
      return {
        to: s.email,
        subject: issue.headline,
        html: renderIssue(issue, { unsubUrl: u, siteUrl: siteUrl() }),
        headers: { 'List-Unsubscribe': `<${u}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' },
      }
    }), { idempotencyKey: key })
    if (r.ok) {
      await Promise.all(batch.map((s) => mark(id, s.hash, 'sent')))
      batch.forEach((s) => { st.sent.add(s.hash); st.failed.delete(s.hash) })
    } else {
      await Promise.all(batch.map((s) => mark(id, s.hash, 'failed', r.error)))
      batch.forEach((s) => st.failed.add(s.hash))
      error = r.error
      break // one refusal usually means all would be refused (bad sender, quota); stop and report
    }
  }

  const remaining = subs.filter((s) => !st.sent.has(s.hash) && !st.inDoubt.includes(s.hash)).length
  const result = { sent: st.sent.size, failed: st.failed.size, unconfirmed: st.inDoubt.length, remaining }
  const done = remaining === 0
  const latest = await readIssue(id)
  await writeIssue({ ...latest, status: done ? 'sent' : 'sending', result, ...(done ? { sentAt: new Date().toISOString() } : {}) })
  return { ...result, done, error }
}
