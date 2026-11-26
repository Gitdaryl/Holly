// In-memory stand-in for @vercel/blob, so the real admin and cron handlers can
// run end to end with no store and no network. test/register.mjs points the
// '@vercel/blob' import here. Blobs are served back at https://mem.test/<path>
// (the test's fetch stub answers those). Writes replace silently: the tests
// freeze the clock, so two saves can land on the same timestamped path.
export const store = new Map()
const meta = (pathname) => ({ pathname, url: `https://mem.test/${pathname}`, downloadUrl: `https://mem.test/${pathname}`, uploadedAt: new Date() })

export async function put(pathname, body) {
  store.set(pathname, typeof body === 'string' ? body : String(body))
  return meta(pathname)
}

export async function list({ prefix = '', limit = 1000, cursor } = {}) {
  const all = [...store.keys()].filter((k) => k.startsWith(prefix)).sort()
  const start = cursor ? Number(cursor) : 0
  const page = all.slice(start, start + limit)
  const next = start + page.length
  return { blobs: page.map(meta), hasMore: next < all.length, cursor: next < all.length ? String(next) : undefined }
}

export async function del(paths) {
  for (const p of [].concat(paths)) store.delete(String(p).replace('https://mem.test/', ''))
}

export async function head(pathname) {
  const key = String(pathname).replace('https://mem.test/', '')
  if (!store.has(key)) throw new Error('BlobNotFoundError')
  return meta(key)
}

// get(pathname, { access, useCache }): the stream-and-metadata shape of the real SDK,
// or null when the path is missing. Reads are always fresh here.
export async function get(pathname) {
  const key = String(pathname).replace('https://mem.test/', '')
  if (!store.has(key)) return null
  const body = store.get(key)
  return { statusCode: 200, stream: new Response(body).body, headers: new Headers(), blob: { ...meta(key), size: body.length, contentType: 'application/json', etag: `"${key.length}-${body.length}"` } }
}
