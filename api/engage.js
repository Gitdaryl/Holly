import { put, del } from '@vercel/blob'
import { listAll, sanitizeSlug, todayISO } from './lib/engage-store.js'

// Per-listing engagement counters for Holly's property pages.
// GET  /api/engage?slug=x            -> current totals
// POST /api/engage?slug=x            -> { action: 'view' } | { action: 'save', on, visitor }
//
// Dates live in the pathname so the weekly seller report can slice by window.
// See api/lib/engage-store.js for the layout and why counters are not JSON.

export default async function handler(req, res) {
  const slug = sanitizeSlug(req.query.slug)
  if (!slug) return res.status(400).json({ error: 'slug required' })

  const base = `engage/${slug}`
  const day = todayISO()

  try {
    if (req.method === 'POST') {
      const { action, on, visitor } = req.body || {}
      const visitorId = String(visitor || '').replace(/[^a-zA-Z0-9-]/g, '').slice(0, 64)

      if (action === 'view') {
        await put(`${base}/views/${day}/${crypto.randomUUID()}`, '1', {
          access: 'public',
          addRandomSuffix: false,
          contentType: 'text/plain',
        })
      } else if (action === 'save' && visitorId) {
        const statePath = `${base}/saves/${visitorId}`
        if (on === false) {
          await del(statePath).catch(() => {})
        } else {
          await put(statePath, '1', {
            access: 'public',
            addRandomSuffix: false,
            allowOverwrite: true,
            contentType: 'text/plain',
          })
          // Append-only twin so "saves this week" is answerable. An un-save
          // does not remove it: the seller report counts the act, not the
          // surviving state, and a save that was later undone still happened.
          await put(`${base}/events/saved/${day}/${crypto.randomUUID()}`, '1', {
            access: 'public',
            addRandomSuffix: false,
            contentType: 'text/plain',
          })
        }
      } else {
        return res.status(400).json({ error: 'unknown action' })
      }
    }

    const [views, saves] = await Promise.all([
      listAll(`${base}/views/`),
      listAll(`${base}/saves/`),
    ])

    res.setHeader('Cache-Control', 'no-store')
    return res.status(200).json({
      views: views.paths.length,
      saves: saves.paths.length,
      capped: views.capped || saves.capped,
    })
  } catch (err) {
    console.error('engage failed:', err)
    return res.status(500).json({ error: err.message })
  }
}
