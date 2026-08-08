// 1-hour slots from opening to closing, e.g. "06:00 - 07:00"
export function generateSlots(openTime, closeTime) {
  const start = parseInt(openTime.split(':')[0], 10)
  let end = parseInt(closeTime.split(':')[0], 10)
  if (end === 0) end = 24 // "24:00"/"00:00" means midnight
  const slots = []
  for (let h = start; h < end; h++) {
    const from = String(h).padStart(2, '0') + ':00'
    const to = String((h + 1) % 24).padStart(2, '0') + ':00'
    slots.push(`${from} - ${to}`)
  }
  return slots
}

// today's date as "YYYY-MM-DD" (real system date)
export function todayIso() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// the REAL next 7 days starting today
export function getNext7Days() {
  const days = []
  const today = new Date()
  for (let i = 0; i < 7; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    const label = d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })
    days.push({ iso, label, isToday: i === 0 })
  }
  return days
}

// real-world rule: on TODAY, a slot whose start hour has already begun cannot be booked
export function isPastSlot(dateIso, slot) {
  if (dateIso !== todayIso()) return false
  const startHour = parseInt(slot.split(':')[0], 10)
  return startHour <= new Date().getHours()
}

// "2026-07-30" → "Thu, 30 Jul 2026"
export function prettyDate(iso) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
  })
}

// a database timestamp → "30 Jul 2026, 06:45 pm"
export function formatDateTime(value) {
  return new Date(value).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  })
}