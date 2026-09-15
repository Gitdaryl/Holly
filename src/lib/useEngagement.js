import { useEffect, useState } from 'react'

// Fires one view per listing per browser session and exposes the save toggle.
// Session-deduped so a seller refreshing their own page ten times does not
// inflate the number Holly is about to put in front of them.

const VISITOR_KEY = 'hg-visitor'

function visitorId() {
  try {
    let v = localStorage.getItem(VISITOR_KEY)
    if (!v) {
      v = crypto.randomUUID()
      localStorage.setItem(VISITOR_KEY, v)
    }
    return v
  } catch {
    return null // private mode: engagement degrades, the page still works
  }
}

export function useEngagement(slug) {
  const [counts, setCounts] = useState(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!slug) return
    const visitor = visitorId()

    try {
      setSaved(localStorage.getItem(`hg-saved-${slug}`) === '1')
    } catch { /* ignore */ }

    const seenKey = `hg-seen-${slug}`
    let alreadySeen = true
    try {
      alreadySeen = sessionStorage.getItem(seenKey) === '1'
      if (!alreadySeen) sessionStorage.setItem(seenKey, '1')
    } catch {
      alreadySeen = false
    }

    // Already counted this session: read the totals, do not add another view.
    const req = alreadySeen
      ? fetch(`/api/engage?slug=${encodeURIComponent(slug)}`)
      : fetch(`/api/engage?slug=${encodeURIComponent(slug)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'view', visitor }),
        })

    req
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setCounts(d))
      .catch(() => {})
  }, [slug])

  const toggleSave = async () => {
    const visitor = visitorId()
    if (!visitor) return
    const next = !saved
    setSaved(next)
    try {
      localStorage.setItem(`hg-saved-${slug}`, next ? '1' : '0')
    } catch { /* ignore */ }
    try {
      const r = await fetch(`/api/engage?slug=${encodeURIComponent(slug)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save', on: next, visitor }),
      })
      if (r.ok) setCounts(await r.json())
    } catch { /* the optimistic state stands */ }
  }

  return { counts, saved, toggleSave }
}
