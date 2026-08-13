const API = import.meta.env.VITE_API_URL || 'http://localhost:5000'
const MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY

/* Address → coordinates, via our server so the key stays hidden */
export async function geocodeAddress(address) {
  const res = await fetch(`${API}/api/geocode?address=${encodeURIComponent(address)}`)
  const data = await res.json()
  if (!res.ok) throw new Error(data.message || 'Could not find that address')
  return data
}

/* Coordinates → address, for "use my current location" */
export async function reverseGeocode(lat, lng) {
  const res = await fetch(`${API}/api/geocode/reverse?lat=${lat}&lng=${lng}`)
  const data = await res.json()
  if (!res.ok) throw new Error(data.message || 'Could not identify that location')
  return data
}

/* The embedded map.
   Uses placeId when we have it — that pins Google's own record of the
   place rather than a coordinate pair, which is more accurate. */
export function buildMapUrl(lat, lng, placeId) {
  if (!MAPS_KEY) {
    return `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.004}%2C${lat - 0.004}%2C${lng + 0.004}%2C${lat + 0.004}&marker=${lat}%2C${lng}`
  }
  if (placeId)
    return `https://www.google.com/maps/embed/v1/place?key=${MAPS_KEY}&q=place_id:${placeId}&zoom=17`
  return `https://www.google.com/maps/embed/v1/place?key=${MAPS_KEY}&q=${lat},${lng}&zoom=17`
}

/* The "Get directions" link.
   Opens the Google Maps app on a phone, the site on desktop, and
   starts navigation from wherever the user currently is. */
export function buildDirectionsLink(lat, lng, placeId, name) {
  const base = 'https://www.google.com/maps/dir/?api=1'
  const dest = `&destination=${lat},${lng}`
  const place = placeId ? `&destination_place_id=${placeId}` : ''
  return base + dest + place + '&travelmode=driving'
}

/* Just view the place, not navigate to it */
export function buildMapLink(lat, lng, placeId, name) {
  if (placeId)
    return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}&query_place_id=${placeId}`
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
}