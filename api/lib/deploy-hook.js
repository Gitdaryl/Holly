import { put, list } from '@vercel/blob'

// Ask Vercel to rebuild the site.
//
// Why this exists: scripts/prerender.mjs writes a STATIC snapshot of every
// public page at build time, and that snapshot is what non-JS crawlers
// (GPTBot, ClaudeBot, PerplexityBot) actually read. Content that changes
// without a deploy - the events feed, an article published by cron - is
// invisible to them until something rebuilds. A daily rebuild bounds that
// staleness at 24 hours.
//
// Never throws, and never blocks its caller's real work: a cron that publishes
// an article has already succeeded by the time it asks for a rebuild.

const MAX_PER_DAY = 6

// Same shape as loginAllowed() in admin-auth.js: list() is the source of
// truth and every attempt is an append-only marker, because blob CONTENT
// reads are CDN-cached and a read-modify-write counter silently loses writes.
export async function triggerRebuild(reason = 'manual') {
  const url = process.env.VERCEL_DEPLOY_HOOK_URL
  if (!url) return { ok: false, why: 'VERCEL_DEPLOY_HOOK_URL not set' }

  try {
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Detroit' })
    const prefix = `deploy/hooks/${today}/`
    const { blobs } = await list({ prefix, limit: MAX_PER_DAY + 1 })
    if (blobs.length >= MAX_PER_DAY) return { ok: false, why: `daily rebuild cap (${MAX_PER_DAY})` }

    await put(`${prefix}${Date.now()}-${reason}`, '1', {
      access: 'public', addRandomSuffix: false, contentType: 'text/plain',
    })

    const r = await fetch(url, { method: 'POST' })
    return { ok: r.ok, status: r.status, reason, used: blobs.length + 1 }
  } catch (err) {
    console.error('deploy hook failed:', err.message)
    return { ok: false, why: err.message }
  }
}
