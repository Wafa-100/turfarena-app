export function priceForSlot(turf, slot) {
  if (!turf) return 0
  if (turf.pricingMode !== 'bands' || !turf.priceBands?.length) return turf.price

  const h = parseInt(slot, 10)
  for (const b of turf.priceBands) {
    const from = parseInt(b.from, 10)
    let to = parseInt(b.to, 10)
    if (to === 0) to = 24
    const inBand = to <= from ? (h >= from || h < to) : (h >= from && h < to)
    if (inBand) return b.price
  }
  return turf.price
}

export function totalForSlots(turf, slots) {
  return slots.reduce((sum, s) => sum + priceForSlot(turf, s), 0)
}

export function priceRange(turf) {
  if (!turf) return ''
  if (turf.pricingMode !== 'bands' || !turf.priceBands?.length) return `₹${turf.price}`
  const prices = turf.priceBands.map(b => b.price)
  const lo = Math.min(...prices), hi = Math.max(...prices)
  return lo === hi ? `₹${lo}` : `₹${lo} – ₹${hi}`
}

export const BAND_PRESETS = [
  { label: 'Morning',   from: '06:00', to: '12:00' },
  { label: 'Afternoon', from: '12:00', to: '17:00' },
  { label: 'Evening',   from: '17:00', to: '21:00' },
  { label: 'Night',     from: '21:00', to: '24:00' }
]