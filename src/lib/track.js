// First-party page and event tracking. One beacon per page view or action,
// nothing personal: path, referrer host, campaign tag, device class, and an
// anonymous session id. Holly's own admin and plan pages are never tracked.
// The server files each hit by pathname so the stats tab can count with
// list() alone and never read blob contents.

const SID_KEY = 'hg-session'

function sessionId() {
  try {
    let s = sessionStorage.getItem(SID_KEY)
    if (!s) { s = crypto.randomUUID(); sessionStorage.setItem(SID_KEY, s) }
    return s
  } catch { return 'anon' }
}

let utm = null
function campaign() {
  if (utm !== null) return utm
  try {
    const q = new URLSearchParams(window.location.search)
    utm = q.get('utm_source') || q.get('src') || ''
    if (utm) sessionStorage.setItem('hg-utm', utm)
    else utm = sessionStorage.getItem('hg-utm') || ''
  } catch { utm = '' }
  return utm
}

const PRIVATE = /^\/(admin|plan)(\/|$)/

export function track(event, path = window.location.pathname, extra = {}) {
  if (PRIVATE.test(path)) return
  try {
    const body = JSON.stringify({
      e: event,
      p: path,
      r: document.referrer ? new URL(document.referrer).hostname.replace(/^www\./, '') : '',
      c: campaign(),
      d: /Mobi|Android|iPhone/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
      s: sessionId(),
      ...extra,
    })
    if (navigator.sendBeacon) navigator.sendBeacon('/api/track', new Blob([body], { type: 'application/json' }))
    else fetch('/api/track', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true }).catch(() => {})
  } catch { /* tracking never breaks the page */ }
}

// Same-host referrers are navigation, not traffic sources.
export const pageview = (path) => track('view', path)
