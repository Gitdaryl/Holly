# What Yeti and Holly still need to supply

Written 2026-09-21 after the design pass, updated the same evening.
DONE 2026-09-21 from Yeti's Desktop folders: daytime Devils Lake hero (home, Devils
Lake, Manitou Beach), Grass Lake hero + card, Devils Lake card, About hero portrait
(front door), About candids (sign in the snow, porch, desk), 800x800 headshot.
Everything not on this list is built.
Drop files in the paths given, as JPG or PNG; the webp sweep converts them at push.

## 1. Daytime Devils Lake drone clip (DONE 2026-09-21)

Used for the home hero, the Devils Lake page and the Manitou Beach region.
Until it exists the home page runs the Clark Lake marina clip and the two
Manitou pages run the night fireworks clip.

- Format: MP4, H.264, no audio, 10 to 15 seconds, loops cleanly (end on a
  frame that resembles the start, or a slow push that can cut back)
- Size: 1920x1080 preferred, 1280x720 acceptable; keep the file under 3 MB
  (`ffmpeg -i in.mov -an -vf scale=1280:-2 -c:v libx264 -crf 28 -preset slow out.mp4`)
- Subject: water, docks, boats, blue sky, mid-morning or golden hour, no fireworks
- Poster frame: 1280x720 still from the same clip, `poster.webp`
- Paths: `public/regions/home/hero.mp4` + `poster.webp`, and
  `public/regions/manitou-beach/hero.mp4` + `poster.webp`

## 2. Holly portrait, daylight, on the water (still open; the front-door shot is in use meanwhile)

Replaces the studio cut-out on the home hero and the About page.

- Full length, standing, lake behind her, natural light, shot at eye level
- 1600x2400 minimum (2:3), sharp, plenty of headroom and space on one side
- Two versions help: one with background (for About), one cut out on
  transparent PNG (for the home hero, replaces `public/images/holly-cutout.webp`)
- Also a square headshot 800x800 for the review card and schema

## 3. About page candids (DONE: 3 in place; two more welcome, on the water)

- Holly with clients at a closing, at a dock, in a listing, in the village
- 1600x1067 (3:2) landscape, JPG
- Path: `public/images/about/01.jpg` … `05.jpg` (the page picks them up once
  present; until then it shows the portrait only)

## 4. Two region cards with no photo (Grass Lake DONE, Tecumseh still open)

Grass Lake & Michigan Center, and Tecumseh & Eastern Lenawee show a gradient.

- Card still: 1280x720 JPG, `public/regions/grass-lake-michigan-center/card.jpg`
  and `public/regions/tecumseh-eastern/card.jpg`
- Optional hero clip for each: same spec as item 1

## 5. Per-lake stills (optional, nice to have)

Each lake page now uses its region's drone clip. A still of the actual lake is
better for the 17 lakes that are not the region's headline lake.

- 1920x1080 JPG, `public/lakes/<slug>/hero.jpg`
- Then add `hero: { poster: '/lakes/<slug>/hero.webp' }` to that lake in
  `src/data/lakes.js` (video optional)

## 6. Sold property photos (Holly + intern, in progress)

- One folder per sold listing: `public/listings/<slug>/01.jpg` … `08.jpg`
  where `<slug>` is the URL slug already on the /sold page
- `01` is the exterior or water-side shot; it becomes the cover everywhere
- 1600x1067 (3:2) JPG, max 8 photos per listing
- Then in `src/data/amenities.js` set
  `image: '/listings/<slug>/01.webp', photos: photoSet('<slug>', N)`
  on that entry, same as the active listings. Ask me and I will do the data edit.

## 7. Facts per active listing (6 listings)

For the hero fact line on each lakefront listing:

- Frontage in feet (`frontage: 60` on the entry in amenities.js)
- Confirm the lake slug on any entry where `lake` is null but the home is
  on a lake

## 8. Five facts for the About page

The page is live on what the site already says. These make it hers:

1. The year she started in real estate, and where
2. Which lake she lives on and roughly how long
3. One sentence on why lakes (family history, boating, grew up here)
4. Any designations or awards worth naming (exact wording)
5. Anything she wants left out

## 9. Domain cutover

When hollygriewahn.com moves off Placester:

- Set the Vercel env `PUBLIC_SITE_URL=https://hollygriewahn.com` and redeploy
  (canonicals, sitemap, schema and OG tags all key off it)
- Add the domain to the Vercel project; the old site's listing URLs will 404,
  so send me the top 10 old URLs if you want redirects
