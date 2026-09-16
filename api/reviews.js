// GET /api/reviews
// Holly's Google Business Profile rating and her five most recent reviews,
// fetched server-side so the site shows real proof instead of placeholder
// quotes. Google's terms allow a place_id to be stored forever and everything
// else to be cached for up to 30 days; the CDN keeps this for a day and
// serves stale for another while it refreshes, so one Places call a day.

export const PLACE_ID = 'ChIJk9xXaWsdPYgRWhpTWGauO-U' // Holly Griewahn, Realtor - Foundation Realty
export const WRITE_REVIEW_URL = `https://search.google.com/local/writereview?placeid=${PLACE_ID}`
export const MAPS_URL = 'https://maps.google.com/?cid=16517987812903164506'

export default async function handler(req, res) {
  const key = process.env.GOOGLE_PLACES_KEY || process.env.VITE_GOOGLE_MAPS_API_KEY
  if (!key) return res.status(500).json({ error: 'Maps key not set' })

  try {
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${PLACE_ID}&fields=name,rating,user_ratings_total,reviews,url&reviews_sort=newest&key=${key}`
    const r = await fetch(url)
    const data = await r.json()
    if (data.status !== 'OK') throw new Error(`${data.status} ${data.error_message || ''}`)
    const p = data.result
    const reviews = (p.reviews || [])
      .filter((v) => v.rating >= 4 && v.text)
      .map((v) => ({
        author: v.author_name,
        rating: v.rating,
        when: v.relative_time_description,
        time: v.time,
        text: v.text,
        photo: v.profile_photo_url || null,
        url: v.author_url || null,
      }))
    res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=86400')
    return res.status(200).json({
      rating: p.rating,
      count: p.user_ratings_total,
      reviews,
      mapsUrl: p.url || MAPS_URL,
      writeUrl: WRITE_REVIEW_URL,
    })
  } catch (err) {
    console.error('reviews failed:', err.message)
    res.setHeader('Cache-Control', 'no-store')
    return res.status(502).json({ error: err.message, writeUrl: WRITE_REVIEW_URL, mapsUrl: MAPS_URL })
  }
}
