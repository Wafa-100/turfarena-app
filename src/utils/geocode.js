// OpenStreetMap Nominatim geocoding — free, no API key required
export async function geocodeAddress(address) {
  if (!address || address.trim().length < 5) return null
  try {
    const query = encodeURIComponent(address.trim() + ', India')
    const url = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1&addressdetails=1`
    const res = await fetch(url, {
      headers: {
        'Accept-Language': 'en-US,en',
        'User-Agent': 'TurfArena-College-Project/1.0'
      }
    })
    const data = await res.json()
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
        displayName: data[0].display_name
      }
    }
    return null
  } catch {
    return null
  }
}

// Build an OpenStreetMap embed URL from lat/lng — real location, no API key
export function buildMapUrl(lat, lng) {
  const west  = (lng - 0.008).toFixed(6)
  const south = (lat - 0.005).toFixed(6)
  const east  = (lng + 0.008).toFixed(6)
  const north = (lat + 0.005).toFixed(6)
  return `https://www.openstreetmap.org/export/embed.html?bbox=${west},${south},${east},${north}&layer=mapnik&marker=${lat},${lng}`
}

// Link to open the location in OSM (like "Open in Maps")
export function buildMapLink(lat, lng, name) {
  return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}&zoom=16&layers=M`
}