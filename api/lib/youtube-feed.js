// Latest uploads for a YouTube channel, without an API key.
//
// youtube.com/feeds/videos.xml returns the 15 most recent uploads, needs no
// key and has no quota; the Data API's search.list costs 100 quota units a
// call and needs a key that can silently expire. So RSS is the primary path
// and the key is an optional second try.
//
// Lives in lib/ so the prerender can call it directly. A build must never
// depend on the deployed site answering - least of all on the first build
// after the domain moves.

const DEFAULT_CHANNEL = 'UCnjEuUEFlrsNzkWDyLkarcA' // HollyandtheYeti
const RSS = (id) => `https://www.youtube.com/feeds/videos.xml?channel_id=${id}`
const MAX = 6
const TIMEOUT_MS = 6000

export const channelId = () => process.env.YOUTUBE_CHANNEL_ID || DEFAULT_CHANNEL

const pick = (block, tag) => block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`))?.[1]?.trim() || ''

function decode(s) {
  return s
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'").replace(/&apos;/g, "'").replace(/&amp;/g, '&')
}

// A regex and not an XML parser on purpose: this feed is a fixed, flat shape
// and a dependency is not worth it. An entry missing an id or title is
// skipped rather than half-rendered.
function parseFeed(xml) {
  const out = []
  for (const block of xml.split('<entry>').slice(1)) {
    const videoId = pick(block, 'yt:videoId')
    const title = decode(pick(block, 'title'))
    if (!videoId || !title) continue
    out.push({
      videoId,
      title,
      // media:description is empty on this channel, so nothing downstream
      // should depend on it. Kept for shape compatibility.
      description: decode(pick(block, 'media:description')),
      publishedAt: pick(block, 'published').slice(0, 10),
      thumbnail: block.match(/<media:thumbnail[^>]*url="([^"]+)"/)?.[1] || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
    })
    if (out.length >= MAX) break
  }
  return out
}

// Fallback only: costs 100 quota units, so it runs only when RSS failed.
async function viaDataApi(id) {
  const key = process.env.YOUTUBE_API_KEY
  if (!key) return []
  const url = `https://www.googleapis.com/youtube/v3/search?channelId=${id}&order=date&type=video&part=snippet&maxResults=${MAX}&key=${key}`
  const r = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) })
  if (!r.ok) throw new Error(`data api ${r.status}`)
  const d = await r.json()
  return (d.items || []).map((i) => ({
    videoId: i.id.videoId,
    title: decode(i.snippet.title),
    description: i.snippet.description || '',
    publishedAt: (i.snippet.publishedAt || '').slice(0, 10),
    thumbnail: i.snippet.thumbnails?.medium?.url || `https://i.ytimg.com/vi/${i.id.videoId}/hqdefault.jpg`,
  }))
}

// Never throws. An empty list is the correct degraded state: the video wall
// hides itself, and a missing section costs nothing while a section full of
// someone else's videos costs credibility.
export async function fetchVideos() {
  const id = channelId()
  try {
    const r = await fetch(RSS(id), { signal: AbortSignal.timeout(TIMEOUT_MS) })
    if (!r.ok) throw new Error(`rss ${r.status}`)
    const videos = parseFeed(await r.text())
    if (!videos.length) throw new Error('rss returned no entries')
    return { videos, source: 'rss', channelId: id }
  } catch (err) {
    console.error('youtube rss failed:', err.message)
    try {
      const videos = await viaDataApi(id)
      if (videos.length) return { videos, source: 'data-api', channelId: id }
    } catch (e2) {
      console.error('youtube data api failed:', e2.message)
    }
    return { videos: [], source: 'none', channelId: id }
  }
}
