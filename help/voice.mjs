// The narration voice, and the one function that turns a line into an mp3. Same narrator as the On Point help clips
// (ElevenLabs "Chris", eleven_multilingual_v2), picked by Yeti Oct 13 2026 as plain enough to hold attention.
// HELP_VOICE=<id> tries another voice. Lines are cached in help/cache/<sha1>.mp3, so a re-record with the same
// words costs nothing. The key is ELEVENLABS_API_KEY from the environment or ~/.claude/.env; never printed.
// Spoken text gets the shared respellings (Manitou -> Manitaw); captions keep the real spelling.
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

export const VOICE = {
  id: process.env.HELP_VOICE || 'iP95p4xoKVk53GoZ742B',
  name: process.env.HELP_VOICE ? 'HELP_VOICE override' : 'Chris',
  model: 'eleven_multilingual_v2',
  settings: { stability: 0.6, similarity_boost: 0.75, style: 0, use_speaker_boost: true, speed: 0.95 },
}
const CACHE = fileURLToPath(new URL('./cache/', import.meta.url))
const RESPELL = { Manitou: 'Manitaw' }

function apiKey() {
  if (process.env.ELEVENLABS_API_KEY) return process.env.ELEVENLABS_API_KEY.trim()
  const f = join(homedir(), '.claude/.env')
  if (!existsSync(f)) return null
  const line = readFileSync(f, 'utf8').split('\n').find((l) => l.startsWith('ELEVENLABS_API_KEY='))
  return line ? line.slice(19).trim().replace(/^["']|["']$/g, '') : null
}
export const spoken = (text) => Object.entries(RESPELL).reduce((t, [a, b]) => t.replace(new RegExp(`\\b${a}\\b`, 'gi'), b), text)
export function seconds(file) {
  return Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file], { encoding: 'utf8' }).trim())
}

export async function speak(text) {
  mkdirSync(CACHE, { recursive: true })
  const say = spoken(text)
  const file = join(CACHE, `${createHash('sha1').update(`${VOICE.id}|${VOICE.model}|${say}`).digest('hex')}.mp3`)
  if (!existsSync(file)) {
    const key = apiKey()
    if (!key) throw new Error('No ELEVENLABS_API_KEY in the environment or ~/.claude/.env')
    const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE.id}?output_format=mp3_44100_128`, {
      method: 'POST',
      headers: { 'xi-api-key': key, 'content-type': 'application/json', accept: 'audio/mpeg' },
      body: JSON.stringify({ text: say, model_id: VOICE.model, voice_settings: VOICE.settings }),
    })
    if (!r.ok) throw new Error(`ElevenLabs ${r.status}: ${(await r.text()).slice(0, 200)}`)
    writeFileSync(file, Buffer.from(await r.arrayBuffer()))
  }
  return { file, seconds: seconds(file) }
}
