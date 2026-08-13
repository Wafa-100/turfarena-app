const API = import.meta.env.VITE_API_URL || 'http://localhost:5000'

/* ── Pull coordinates out of a Google Maps URL ──
   Handles every shape Google's share button produces:
     https://www.google.com/maps/place/Name/@12.4996,74.9869,17z
     https://www.google.com/maps/@12.4996,74.9869,15z
     https://maps.app.goo.gl/AbC123          ← short link, needs unshortening
     https://www.google.com/maps?q=12.4996,74.9869
*/
export function parseMapsUrl(url) {
  if (!url) return null
  const clean = url.trim()

  // @lat,lng — the most common form
  const at = clean.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/)
  if (at) return { lat: parseFloat(at[1]), lng: parseFloat(at[2]) }

  // ?q=lat,lng  or  ?ll=lat,lng
  const q = clean.match(/[?&](?:q|ll|query)=(-?\d+\.\d+),\s*(-?\d+\.\d+)/)
  if (q) return { lat: parseFloat(q[1]), lng: parseFloat(q[2]) }

  // !3dLAT!4dLNG — appears in longer place URLs and is the most precise
  const d = clean.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/)
  if (d) return { lat: parseFloat(d[1]), lng: parseFloat(d[2]) }

  // Bare "12.4996, 74.9869" pasted straight from Google's coordinate display
  const bare = clean.match(/^\s*(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)\s*$/)
  if (bare) return { lat: parseFloat(bare[1]), lng: parseFloat(bare[2]) }

  return null
}

/* Short links (maps.app.goo.gl) hide the coordinates behind a redirect,
   so the server follows it for us */
export async function expandMapsUrl(url) {
  const res = await fetch(`${API}/api/geocode/expand?url=${encodeURIComponent(url)}`)
  const data = await res.json()
  if (!res.ok) throw new Error(data.message || 'Could not read that link')
  return data
}

/* Address → coordinates, via free Nominatim on our server */
export async function geocodeAddress(address) {
  const res = await fetch(`${API}/api/geocode?address=${encodeURIComponent(address)}`)
  const data = await res.json()
  if (!res.ok) throw new Error(data.message || 'Could not find that address')
  return data
}

/* Coordinates → address */
export async function reverseGeocode(lat, lng) {
  const res = await fetch(`${API}/api/geocode/reverse?lat=${lat}&lng=${lng}`)
  const data = await res.json()
  if (!res.ok) throw new Error(data.message || 'Could not identify that location')
  return data
}

/* The map shown on the turf page — OSM embed, free and unlimited */
export function buildMapUrl(lat, lng) {
  const d = 0.003
  return 'https://www.openstreetmap.org/export/embed.html'
    + `?bbox=${lng - d}%2C${lat - d}%2C${lng + d}%2C${lat + d}`
    + `&layer=mapnik&marker=${lat}%2C${lng}`
}

/* Directions — opens Google Maps, which needs no API key */
export function buildDirectionsLink(lat, lng) {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`
}

/* View the place on Google Maps */
export function buildMapLink(lat, lng) {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
}