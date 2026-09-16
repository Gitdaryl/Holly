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
