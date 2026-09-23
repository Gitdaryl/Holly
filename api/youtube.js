// GET /api/youtube
// Latest episodes of Holly & The Yeti, for the video wall on /holly-yeti.
// All the work is in lib/youtube-feed.js so the prerender can use it too.

import { fetchVideos } from './lib/youtube-feed.js'

const FRESH = 'public, s-maxage=21600, stale-while-revalidate=86400' // 6h: a weekly show
const DEGRADED = 'public, s-maxage=300, stale-while-revalidate=3600' // 5m: retry soon

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  // Set before anything can fail. The Manitou version of this endpoint only
  // set a cache header on success, so every visitor hit the function
  // precisely when it was already failing.
  res.setHeader('Cache-Control', DEGRADED)

  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const { videos, source, channelId } = await fetchVideos()
  if (videos.length) res.setHeader('Cache-Control', FRESH)
  return res.status(200).json({ videos, source, channelId })
}
