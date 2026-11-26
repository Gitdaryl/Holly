import { put, list, get, del } from '@vercel/blob'

// Storage for the person record, in the PRIVATE Blob store `holly-people`
// (Production) or `holly-people-test` (Preview and Development). The token is
// PEOPLE_READ_WRITE_TOKEN and is passed explicitly on every call in this file
// and nowhere else, so nothing here can fall back to BLOB_READ_WRITE_TOKEN
// (the public holly-engage store) by accident.
//
// Chunk 0c only needs probe(). Chunk 2 adds the change log and readers here.

export function token() {
  const t = process.env.PEOPLE_READ_WRITE_TOKEN
  if (!t) throw new Error('PEOPLE_READ_WRITE_TOKEN is not set.')
  return t
}

async function readText(res) {
  if (!res) return null
  return new Response(res.stream).text()
}

// Round trip against the real private store, with its own throwaway prefix.
// Every step reports ok plus what was seen, so a failure shows its evidence.
export async function probe() {
  const t = token()
  const run = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
  const prefix = `probe/${run}/`
  const path = `${prefix}a.json`
  const out = { env: process.env.VERCEL_ENV || 'local', prefix, steps: {} }
  const step = async (name, fn) => {
    try {
      out.steps[name] = { ok: true, ...(await fn()) }
    } catch (err) {
      out.steps[name] = { ok: false, error: `${err.name}: ${err.message}` }
    }
  }
  const common = { token: t, access: 'private' }
  const write = { ...common, addRandomSuffix: false, contentType: 'application/json' }

  await step('put', async () => {
    const r = await put(path, JSON.stringify({ n: 1 }), write)
    if (r.pathname !== path) throw new Error(`pathname came back as ${r.pathname}`)
    return { pathname: r.pathname }
  })

  await step('list', async () => {
    const r = await list({ prefix, token: t })
    const names = r.blobs.map((b) => b.pathname)
    if (!names.includes(path)) throw new Error(`not listed, saw ${JSON.stringify(names)}`)
    return { found: names.length }
  })

  await step('get', async () => {
    const r = await get(path, { ...common, useCache: false })
    const body = await readText(r)
    if (body !== '{"n":1}') throw new Error(`read back ${JSON.stringify(body)}`)
    return { statusCode: r.statusCode, body }
  })

  // The append-only rule rests on this: a second put to the same path MUST throw.
  await step('secondPutThrows', async () => {
    try {
      await put(path, JSON.stringify({ n: 2 }), write)
    } catch (err) {
      return { threw: `${err.name}: ${err.message}` }
    }
    throw new Error('second put to the same path did not throw')
  })

  // Not one of the five, but the design leans on it (snapshots, settings):
  // an explicit overwrite must be visible at once through get(useCache:false).
  await step('overwriteReadsFresh', async () => {
    await put(path, JSON.stringify({ n: 3 }), { ...write, allowOverwrite: true })
    const body = await readText(await get(path, { ...common, useCache: false }))
    if (body !== '{"n":3}') throw new Error(`stale read: ${JSON.stringify(body)}`)
    return { body }
  })

  await step('delete', async () => {
    await del(path, { token: t })
    const gone = await get(path, { ...common, useCache: false })
    if (gone) throw new Error('still readable after delete')
    const r = await list({ prefix, token: t })
    if (r.blobs.length) throw new Error(`still listed: ${r.blobs.map((b) => b.pathname)}`)
    return { gone: true }
  })

  out.ok = ['put', 'list', 'get', 'secondPutThrows', 'delete'].every((k) => out.steps[k]?.ok)
  return out
}
