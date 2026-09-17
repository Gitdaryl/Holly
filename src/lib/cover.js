// Cover image for a listing card or hero. Real photos win; a sold listing
// imported without photos gets a live satellite aerial of the address, which
// for lake property shows the thing buyers care about (the frontage). Google
// terms forbid storing Static Maps images, so this is always a live URL.
const KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

export function coverFor(p, { w = 640, h = 400 } = {}) {
  if (p.image) return p.image;
  if (p.address && KEY) {
    const q = encodeURIComponent(p.address.replace(/, MI$/, ', MI'));
    return `https://maps.googleapis.com/maps/api/staticmap?center=${q}&zoom=18&size=${w}x${h}&scale=2&maptype=satellite&key=${KEY}`;
  }
  return null;
}

export const isAerial = (p) => !p.image && Boolean(p.address && KEY);

// Static map of sold pins. Google geocodes at most ~15 address markers per
// image, so pins use the stored lat/lng. `highlight` pins are pink, the rest
// grey, so a lake report shows its own sales against the whole year.
const MAP_STYLE = [
  'feature:water|color:0x9ec9e2', 'feature:landscape|color:0xf5f2ec', 'feature:road|color:0xffffff',
  'feature:road|element:labels|visibility:off', 'feature:poi|visibility:off', 'feature:transit|visibility:off',
  'feature:administrative|element:labels.text.fill|color:0x6b7a8d',
].map((s) => `style=${encodeURIComponent(s)}`).join('&');

export function soldMapUrl(highlight, others = [], { w = 640, h = 360 } = {}) {
  if (!KEY) return null;
  const pts = (list) => list.filter((p) => p.geo).map((p) => `${p.geo.lat},${p.geo.lng}`).join('%7C');
  const hi = pts(highlight); const lo = pts(others);
  if (!hi && !lo) return null;
  const markers = [
    lo ? `markers=color:0xcbd5e0%7Csize:small%7C${lo}` : '',
    hi ? `markers=color:0xe84393%7Csize:mid%7C${hi}` : '',
  ].filter(Boolean).join('&');
  return `https://maps.googleapis.com/maps/api/staticmap?size=${w}x${h}&scale=2&maptype=roadmap&${markers}&${MAP_STYLE}&key=${KEY}`;
}
