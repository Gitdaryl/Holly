// Injected into every page the recorder opens. Draws on top of the site without touching its CSS: a cursor with a
// press pulse, a spotlight ring (Holly's raspberry) around the thing being talked about with the rest dimmed, and a
// caption bar (deep teal) carrying the sentence being spoken. Pointer-events none, so the page gets every tap.
// Ported from the On Point help recorder (~/Projects/onpoint-office/help/lib/overlay.js).
;(() => {
  if (window.__tour || window.top !== window) return
  const RING = '#e64774'
  const MARK = 'data-tour-target'
  const PAD = 6
  let root, ring, cursor, cap, capText, pulse
  let target = null, drawn = null, tween = null, cx = -100, cy = -100, shown = false

  function build() {
    if (root || !document.body) return
    const css = document.createElement('style')
    css.textContent = `
      #__tour-root { position: fixed; inset: 0; pointer-events: none; z-index: 2147483647; }
      #__tour-ring { position: fixed; left: 0; top: 0; width: 0; height: 0; border: 3px solid ${RING}; border-radius: 12px;
        box-shadow: 0 0 0 200vmax rgba(10, 38, 35, 0.32); opacity: 0; transition: opacity 200ms ease; box-sizing: border-box; }
      #__tour-ring.on { opacity: 1; }
      #__tour-cursor { position: fixed; left: 0; top: 0; width: 28px; height: 28px; opacity: 0;
        transition: transform 600ms cubic-bezier(0.45, 0, 0.25, 1), opacity 200ms ease; will-change: transform; }
      #__tour-cursor.on { opacity: 1; }
      #__tour-cursor svg { display: block; width: 28px; height: 28px; transform-origin: 3px 2px; transition: transform 120ms ease; }
      #__tour-cursor.down svg { transform: scale(0.86); }
      #__tour-pulse { position: fixed; left: 0; top: 0; width: 44px; height: 44px; margin: -22px 0 0 -22px; border-radius: 50%;
        border: 3px solid ${RING}; opacity: 0; transform: scale(0.4); }
      #__tour-pulse.go { animation: __tour-pulse 420ms ease-out; }
      @keyframes __tour-pulse { 0% { opacity: 0.9; transform: scale(0.4); } 100% { opacity: 0; transform: scale(1.3); } }
      #__tour-cap { position: fixed; left: 0; right: 0; bottom: 0; background: rgba(26, 85, 78, 0.96); color: #fff;
        padding: 12px 16px 14px; text-align: center; opacity: 0; transition: opacity 150ms ease;
        font: 600 18px/1.35 Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif; }
      #__tour-cap.on { opacity: 1; }
      #__tour-cap.top { top: 0; bottom: auto; }
    `
    root = document.createElement('div'); root.id = '__tour-root'; root.setAttribute('aria-hidden', 'true')
    ring = document.createElement('div'); ring.id = '__tour-ring'
    pulse = document.createElement('div'); pulse.id = '__tour-pulse'
    cursor = document.createElement('div'); cursor.id = '__tour-cursor'
    cursor.innerHTML = '<svg viewBox="0 0 28 28"><path d="M3 2 L3 22 L8.6 17 L12.4 25.6 L16.2 24 L12.5 15.6 L20 15.4 Z" fill="#fff" stroke="#1A1A1A" stroke-width="1.8" stroke-linejoin="round"/></svg>'
    cap = document.createElement('div'); cap.id = '__tour-cap'
    capText = document.createElement('span'); cap.appendChild(capText)
    root.append(ring, pulse, cursor, cap)
    document.documentElement.append(css, root)
    requestAnimationFrame(tick)
  }
  function tick() {
    if (target && !target.isConnected) target = document.querySelector(`[${MARK}]`)
    if (target) {
      const r = target.getBoundingClientRect()
      const visible = r.width > 0 && r.height > 0
      let box = { x: r.left - PAD, y: r.top - PAD, w: r.width + PAD * 2, h: r.height + PAD * 2 }
      if (tween) {
        const k = Math.min(1, (performance.now() - tween.t0) / 350)
        const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2
        const f = tween.from
        box = { x: f.x + (box.x - f.x) * e, y: f.y + (box.y - f.y) * e, w: f.w + (box.w - f.w) * e, h: f.h + (box.h - f.h) * e }
        if (k >= 1) tween = null
      }
      drawn = box
      ring.style.transform = `translate(${box.x}px, ${box.y}px)`
      ring.style.width = `${box.w}px`; ring.style.height = `${box.h}px`
      ring.classList.toggle('on', visible)
      placeCaption(visible ? r : null)
    } else { ring.classList.remove('on'); drawn = null; placeCaption(null) }
    requestAnimationFrame(tick)
  }
  function placeCaption(r) {
    if (!shown) return
    const h = window.innerHeight
    const capH = cap.getBoundingClientRect().height
    const low = r && (r.bottom > h * 0.72 || r.bottom + PAD > h - capH)
    cap.classList.toggle('top', !!low && r.top - PAD > capH)
  }
  window.__tour = {
    caption(text) { build(); capText.textContent = text || ''; shown = !!text; cap.classList.toggle('on', shown); if (!shown) cap.classList.remove('top') },
    target(on) {
      build()
      const next = on ? document.querySelector(`[${MARK}]`) : null
      tween = next && drawn && next !== target ? { from: drawn, t0: performance.now() } : null
      target = next
    },
    cursorAt(x, y) { build(); cursor.style.transition = 'none'; cx = x; cy = y; cursor.style.transform = `translate(${x - 3}px, ${y - 2}px)`; void cursor.offsetWidth; cursor.style.transition = ''; cursor.classList.add('on') },
    moveCursor(x, y, ms = 600) { build(); cursor.classList.add('on'); cursor.style.transitionDuration = `${ms}ms, 200ms`; cx = x; cy = y; cursor.style.transform = `translate(${x - 3}px, ${y - 2}px)`; return new Promise((d) => setTimeout(d, ms)) },
    where() { return { x: cx, y: cy } },
    press() {
      build(); cursor.classList.add('down')
      pulse.style.left = `${cx}px`; pulse.style.top = `${cy}px`
      pulse.classList.remove('go'); void pulse.offsetWidth; pulse.classList.add('go')
      setTimeout(() => cursor.classList.remove('down'), 140)
      return new Promise((d) => setTimeout(d, 160))
    },
    hideCursor() { build(); cursor.classList.remove('on') },
  }
  // "Print / Save as PDF" opens a new window. In a recording that window would be off camera, so it opens over the
  // page instead, as a full-screen frame the tour can close.
  window.open = () => {
    const f = document.createElement('iframe')
    f.id = '__tour-popup'
    f.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;border:0;background:#fff;z-index:2147483600'
    document.body.appendChild(f)
    let html = ''
    return { document: { open() {}, write(h) { html += h }, close() { f.srcdoc = html } }, close() { f.remove() }, focus() {} }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build, { once: true })
  else build()
})()
