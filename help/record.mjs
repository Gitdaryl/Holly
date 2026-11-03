// Records one help video from a tour script: drives the real desk and client pages (a fresh `npm run build`, served
// by vite preview) on the demo world's made-up data (help/lib/demo.mjs), with a cursor, a ring and a caption drawn on
// top (help/lib/overlay.js), narrates each step (help/voice.mjs), and writes public/help/<id>.mp4 + <id>.webp.
// A screen change means rerunning this, never editing a video.
//
//   npm run build && node help/record.mjs roadmaps        (or: stationery)
//   node help/record.mjs roadmaps --headed                (watch it drive)
//   node help/record.mjs roadmaps --script                (print the narration only, no recording)
//
// Frames come from Chrome's screencast at 2x (sharp on a phone), each stamped with the wall clock, so the narration
// is placed by the same clock the steps were timed with. Needs ffmpeg and the Playwright Chromium in ~/Library/Caches.
import { chromium } from 'playwright-core'
import { execFileSync, spawn } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { demoWorld } from './lib/demo.mjs'
import { speak, VOICE } from './voice.mjs'

const ROOT = fileURLToPath(new URL('../', import.meta.url))
const PORT = 4179
const BASE = `http://localhost:${PORT}`
const VIEW = { width: 390, height: 844 }
const SCALE = 2   // output is upscaled to this; the screencast itself is 1x
const TAIL = 1.2

const args = process.argv.slice(2)
const id = args.find((a) => !a.startsWith('--'))
if (!id) { console.error('usage: node help/record.mjs <tour> [--headed] [--script]'); process.exit(1) }
const tour = (await import(`./tours/${id}.mjs`)).default
if (args.includes('--script')) { tour.steps.forEach((s, i) => console.log(`${String(i + 1).padStart(2)}. ${s.say}`)); process.exit(0) }
if (!existsSync(join(ROOT, 'dist/index.html'))) { console.error('No dist/. Run npm run build first.'); process.exit(1) }

function chromePath() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH
  const cache = join(homedir(), 'Library/Caches/ms-playwright')
  const shell = readdirSync(cache).filter((d) => d.startsWith('chromium_headless_shell-')).sort().pop()
  return join(cache, shell, 'chrome-headless-shell-mac-arm64/chrome-headless-shell')
}
const up = async () => { try { return (await fetch(BASE, { signal: AbortSignal.timeout(1500) })).ok } catch { return false } }
let server = null
async function ensureServer() {
  if (await up()) return
  server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], { cwd: ROOT, stdio: 'ignore', detached: true })
  server.unref()
  for (let i = 0; i < 60; i++) { if (await up()) return; await new Promise((r) => setTimeout(r, 500)) }
  throw new Error('vite preview did not answer')
}
process.on('exit', () => { if (server) try { process.kill(-server.pid, 'SIGTERM') } catch { /* gone */ } })

// ---- narration first: each step's hold is built around its line's real length
console.log(`\n== ${id}: ${tour.title}  (voice: ${VOICE.name} ${VOICE.id})`)
const lines = []
for (const [i, s] of tour.steps.entries()) {
  const vo = await speak(s.say)
  lines.push(vo)
  console.log(`  ${String(i + 1).padStart(2)}. ${vo.seconds.toFixed(2)} s  ${s.say}`)
}

await ensureServer()
const dir = join(ROOT, 'help/out', id)
rmSync(dir, { recursive: true, force: true })
mkdirSync(join(dir, 'frames'), { recursive: true })

const browser = await chromium.launch({ executablePath: chromePath(), headless: !args.includes('--headed') })
const context = await browser.newContext({ viewport: VIEW, deviceScaleFactor: SCALE, isMobile: true, hasTouch: true, colorScheme: 'light', locale: 'en-US', timezoneId: 'America/Detroit', serviceWorkers: 'block' })
await context.addInitScript({ path: join(ROOT, 'help/lib/overlay.js') })
// Signed in on the desk only: the client page must look the way a client sees it (no "Your desk" chip).
await context.addInitScript({ content: `try {
  localStorage.setItem('hg-tour-seen', '1'); localStorage.setItem('hg-a2hs', '1');
  if (location.pathname.startsWith('/admin')) localStorage.setItem('hg-admin-session', 'demo-session');
  else localStorage.removeItem('hg-admin-session');
} catch {}` })
const world = demoWorld(BASE)
await context.route('**/api/**', (r) => world.handle(r))
const page = await context.newPage()
const problems = []
page.on('pageerror', (e) => problems.push(e.message))
page.on('dialog', (d) => d.accept())

// ---- screencast: every frame saved with its wall-clock time
const cdp = await context.newCDPSession(page)
const frames = []
// JPEG width and height, read from the SOF marker
function jpegSize(buf) {
  for (let i = 2; i + 9 < buf.length;) {
    if (buf[i] !== 0xff) return null
    if (buf[i + 1] >= 0xc0 && buf[i + 1] <= 0xc2) return { w: buf.readUInt16BE(i + 7), h: buf.readUInt16BE(i + 5) }
    i += 2 + buf.readUInt16BE(i + 2)
  }
  return null
}
// Chrome's screencast sends CSS-pixel frames whatever the device scale, and the first frame or two can be a
// different shape (the blank page before the first paint). ffmpeg sizes the whole video from the first frame, so a
// frame that is not phone-shaped is dropped, never stretched.
let dropped = 0
cdp.on('Page.screencastFrame', async ({ data, metadata, sessionId }) => {
  cdp.send('Page.screencastFrameAck', { sessionId }).catch(() => {})
  const buf = Buffer.from(data, 'base64')
  const sz = jpegSize(buf)
  if (!sz || Math.abs(sz.w / sz.h - VIEW.width / VIEW.height) > 0.01) { dropped++; return }
  const f = join(dir, 'frames', `${String(frames.length).padStart(6, '0')}.jpg`)
  writeFileSync(f, buf)
  frames.push({ f, t: metadata.timestamp })
})
const cast = { format: 'jpeg', quality: 88, maxWidth: VIEW.width * SCALE, maxHeight: VIEW.height * SCALE, everyNthFrame: 1 }
const restartCast = async () => { await cdp.send('Page.stopScreencast').catch(() => {}); await cdp.send('Page.startScreencast', cast) }
const now = () => Date.now() / 1000

// ---- helpers a tour step gets (same shape as the On Point recorder)
let current = null
async function point(loc, { ring = true } = {}) {
  await loc.waitFor({ state: 'visible', timeout: 15000 })
  const same = current && await loc.evaluate((el) => el.hasAttribute('data-tour-target')).catch(() => false)
  if (!same) {
    await loc.evaluate((el) => {
      document.querySelectorAll('[data-tour-target]').forEach((e) => e.removeAttribute('data-tour-target'))
      el.setAttribute('data-tour-target', '1')
      el.style.scrollMarginTop = '120px'
      const r = el.getBoundingClientRect()
      if (r.top < 110 || r.bottom > window.innerHeight * 0.7) el.scrollIntoView({ behavior: 'smooth', block: r.height > window.innerHeight * 0.55 ? 'start' : 'center', inline: 'nearest' })
    })
    let last = null
    for (let i = 0; i < 25; i++) {
      const b = await loc.boundingBox()
      if (last && b && Math.abs(b.y - last.y) < 0.5 && Math.abs(b.x - last.x) < 0.5) break
      last = b
      await page.waitForTimeout(60)
    }
    current = loc
  }
  const b = await loc.boundingBox()
  const x = Math.min(VIEW.width - 16, Math.max(10, b.x + Math.min(b.width / 2, 110)))
  const y = Math.min(VIEW.height - 16, Math.max(10, b.y + Math.min(b.height / 2, 24)))
  const at = await page.evaluate(() => window.__tour.where())
  if (Math.hypot(at.x - x, at.y - y) > 2) await page.evaluate(({ x, y }) => window.__tour.moveCursor(x, y, 600), { x, y })
  if (ring) await page.evaluate(() => window.__tour.target(true))
}
const press = () => page.evaluate(() => window.__tour.press())
let beat = { start: 0, vo: 0 }
const lateEnough = async () => { const at = beat.start + Math.max(0.9, beat.vo * 0.75); if (now() < at) await page.waitForTimeout((at - now()) * 1000) }
const ui = {
  page, base: BASE, world,
  point,
  async tap(loc) { await point(loc); await lateEnough(); await press(); await loc.click() },
  async type(loc, text) { await point(loc); await press(); await loc.click(); await loc.pressSequentially(text, { delay: 40 }) },
  async retype(loc, text) { await point(loc); await press(); await loc.click(); await loc.fill(''); await loc.pressSequentially(text, { delay: 40 }) },
  async fill(loc, text) { await point(loc); await press(); await loc.fill(text) },
  async pick(loc, value) { await point(loc); await lateEnough(); await press(); await loc.selectOption(value) },
  async check(loc) { await point(loc); await lateEnough(); await press(); await loc.check() },
  async go(path) {
    current = null
    await page.goto(`${BASE}${path}`)
    await page.evaluate(() => document.fonts.ready)
    await restartCast()
  },
  async card(html) {
    current = null
    await page.setContent(html, { waitUntil: 'networkidle' })
    await page.evaluate(() => document.fonts.ready)
    await page.evaluate(() => window.__tour.hideCursor())
    await restartCast()
  },
  async scrollTop() { await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' })); await page.waitForTimeout(500) },
  noRing: () => page.evaluate(() => window.__tour.target(false)).then(() => { current = null }),
  wait: (ms) => page.waitForTimeout(ms),
}

await cdp.send('Page.startScreencast', cast)
if (tour.ready) await tour.ready(page, ui)
await page.evaluate(() => window.__tour.cursorAt(250, 520))

const steps = []
for (const [i, s] of tour.steps.entries()) {
  const vo = lines[i]
  if (s.before) await s.before(page, ui)          // scene changes (a new page) happen before the line starts
  const start = now()
  beat = { start, vo: vo.seconds }
  await page.evaluate((t) => window.__tour.caption(t), s.caption === false ? '' : s.say)
  if (s.target) await point(s.target(page, ui))
  else await ui.noRing()
  if (s.action) await s.action(page, ui)
  const hold = Math.max(vo.seconds + (s.pause ?? 0.55), 1.8)
  const spent = now() - start
  if (spent < hold) await page.waitForTimeout((hold - spent) * 1000)
  steps.push({ step: i + 1, start, end: now(), vo: vo.seconds, file: vo.file, say: s.say, over: Math.max(0, spent - hold) })
}
const endAt = steps[steps.length - 1].start + steps[steps.length - 1].vo + TAIL
if (now() < endAt) await page.waitForTimeout((endAt - now()) * 1000)
await cdp.send('Page.stopScreencast').catch(() => {})
await page.waitForTimeout(300)
await browser.close()
if (!frames.length) throw new Error('no frames captured')

// ---- frames -> constant 30 fps video; narration placed by wall clock
const t0 = frames[0].t
const list = frames.map((fr, k) => `file '${fr.f}'\nduration ${Math.max(0.001, ((frames[k + 1]?.t ?? endAt) - fr.t)).toFixed(4)}`).join('\n') + `\nfile '${frames[frames.length - 1].f}'\n`
writeFileSync(join(dir, 'frames.txt'), list)
const dur = endAt - t0
const ins = [], parts = []
steps.forEach((s, k) => {
  ins.push('-i', s.file)
  parts.push(`[${k + 1}:a]aresample=48000,aformat=channel_layouts=mono,adelay=${Math.round((s.start - t0) * 1000)}:all=1[a${k}]`)
})
const mix = `${parts.join(';')};${steps.map((_, k) => `[a${k}]`).join('')}amix=inputs=${steps.length}:normalize=0:dropout_transition=0,apad,atrim=0:${dur.toFixed(3)},loudnorm=I=-16:TP=-1.5:LRA=11[aout]`
mkdirSync(join(ROOT, 'public/help'), { recursive: true })
const mp4 = join(ROOT, 'public/help', `${id}.mp4`)
rmSync(mp4, { force: true })
execFileSync('ffmpeg', ['-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', join(dir, 'frames.txt'), ...ins,
  '-filter_complex', `[0:v]fps=30,scale=${VIEW.width * SCALE}:${VIEW.height * SCALE}:flags=lanczos,format=yuv420p[v];${mix}`, '-map', '[v]', '-map', '[aout]',
  '-c:v', 'libx264', '-preset', 'slow', '-crf', '24', '-tune', 'stillimage', '-c:a', 'aac', '-b:a', '128k', '-ac', '1', '-movflags', '+faststart',
  '-t', dur.toFixed(3), mp4], { stdio: ['ignore', 'inherit', 'inherit'] })
const posterStep = steps[Math.min(steps.length - 1, tour.poster ?? 1)]
execFileSync('ffmpeg', ['-v', 'error', '-y', '-ss', String(Math.max(0, posterStep.start - t0 + 1.2)), '-i', mp4, '-frames:v', '1', '-c:v', 'libwebp', '-quality', '80', join(ROOT, 'public/help', `${id}.webp`)])
// a contact sheet of eight frames, to look at before shipping
const secs = Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', mp4], { encoding: 'utf8' }).trim())
execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', mp4, '-vf', `fps=8/${secs},scale=390:-1,tile=8x1`, '-frames:v', '1', join(dir, 'sheet.jpg')])
const gaps = frames.slice(1).map((fr, k) => fr.t - frames[k].t).filter((g) => g > 4).length
writeFileSync(join(dir, 'steps.json'), JSON.stringify({ id, title: tour.title, voice: VOICE, seconds: secs, frames: frames.length, problems, steps: steps.map((s) => ({ ...s, start: +(s.start - t0).toFixed(3), end: +(s.end - t0).toFixed(3) })) }, null, 2))
const mb = (Number(execFileSync('stat', ['-f', '%z', mp4], { encoding: 'utf8' })) / 1e6).toFixed(1)
const dims = execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'v', '-show_entries', 'stream=width,height', '-of', 'csv=p=0:s=x', mp4], { encoding: 'utf8' }).trim()
if (dims !== `${VIEW.width * SCALE}x${VIEW.height * SCALE}`) { console.log(`  WRONG SIZE ${dims}`); process.exitCode = 1 }
console.log(`  -> public/help/${id}.mp4  ${dims}  ${secs.toFixed(1)} s  ${mb} MB  ${frames.length} frames (${dropped} odd-shaped dropped)${gaps ? `  (${gaps} still stretches over 4 s)` : ''}`)
const late = steps.filter((s) => s.over > 0.3)
if (late.length) console.log(`  steps that ran past their line: ${late.map((s) => `${s.step} (+${s.over.toFixed(1)} s)`).join(', ')}`)
if (problems.length) { console.log(`  PAGE ERRORS: ${problems.join(' | ')}`); process.exitCode = 1 }
console.log(`  contact sheet: help/out/${id}/sheet.jpg`)

process.exit(process.exitCode || 0)
