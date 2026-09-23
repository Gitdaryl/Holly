import { next } from '@vercel/functions'
import { put } from '@vercel/blob'
import { matchAgent } from './api/lib/ai-agents.js'

// Records AI agents reading the site. They never run JavaScript, so the
// page-view beacon in src/lib/track.js cannot see them; this is the only
// place they show up. One empty blob per visit, everything in the pathname so
// the desk counts with list() alone:
//   bots/<date ET>/<agent key>/<path enc>/<uuid>
// Never blocks or changes a response: the write runs after it, and any error
// is swallowed. People are untouched (no user-agent match, straight through).

export const config = {
  matcher: ['/((?!api/|assets/|images/|regions/|_vercel).*)'],
}

const SKIP = /\.(js|css|map|webp|png|jpe?g|gif|svg|ico|mp4|mov|webm|woff2?|json|webmanifest)$/i
const PRIVATE = /^\/(admin|plan)(\/|$)/
// Crawlers re-fetch the same page many times a day; count each page once per
// agent per day (per server instance, best effort). Live fetches are each a
// separate question, so every one counts.
const seen = new Set()

export default function middleware(request, context) {
  try {
    const agent = matchAgent(request.headers.get('user-agent'))
    if (agent) {
      const path = new URL(request.url).pathname
      if (!SKIP.test(path) && !PRIVATE.test(path)) {
        const day = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Detroit' })
        const enc = path === '/' ? 'home' : path.replace(/^\//, '').replace(/\/$/, '').replace(/\//g, '~').replace(/[^a-zA-Z0-9\-_.~]/g, '').slice(0, 120) || 'home'
        const once = `${day}|${agent.key}|${enc}`
        if (agent.kind === 'live' || !seen.has(once)) {
          if (seen.size > 5000) seen.clear()
          seen.add(once)
          const write = put(`bots/${day}/${agent.key}/${enc}/${crypto.randomUUID()}`, '1', {
            access: 'public', addRandomSuffix: false, contentType: 'text/plain',
          }).catch((err) => console.error('bot log failed:', err.message))
          context?.waitUntil?.(write)
        }
      }
    }
  } catch (err) {
    console.error('middleware:', err.message)
  }
  return next()
}
