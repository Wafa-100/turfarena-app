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

export const SLOT_CANCEL_HOURS = 1

export function slotStart(date, slot) {
  const hour = parseInt(slot, 10)
  const [y, m, d] = date.split('-').map(Number)
  return new Date(y, m - 1, d, hour, 0, 0)
}

export function hoursUntilSlot(date, slot) {
  return (slotStart(date, slot).getTime() - Date.now()) / 36e5
}

export function slotIsCancellable(date, slot) {
  return hoursUntilSlot(date, slot) >= SLOT_CANCEL_HOURS
}

/* "2 hours", "45 minutes", "started" */
export function timeUntil(date, slot) {
  const h = hoursUntilSlot(date, slot)
  if (h < 0) return 'started'
  if (h < 1) return `${Math.round(h * 60)} minutes`
  if (h < 24) return `${Math.floor(h)} hour${Math.floor(h) > 1 ? 's' : ''}`
  return `${Math.floor(h / 24)} day${Math.floor(h / 24) > 1 ? 's' : ''}`
}

/* When a slot ends. "23:00 - 00:00" ends at midnight the next day. */
export function slotEnd(date, slot) {
  const endPart = slot.split(' - ')[1] || slot.split(' - ')[0]
  let endHour = parseInt(endPart, 10)
  const [y, m, d] = date.split('-').map(Number)
  if (endHour === 0) return new Date(y, m - 1, d + 1, 0, 0, 0)
  return new Date(y, m - 1, d, endHour, 0, 0)
}

export function slotIsOver(date, slot) {
  return slotEnd(date, slot).getTime() <= Date.now()
}

/* A group is finished once its LAST hour has ended */
export function groupEnd(group) {
  const last = group.bookings[group.bookings.length - 1]
  return slotEnd(group.date, last.slot)
}

export function groupIsOver(group) {
  return groupEnd(group).getTime() <= Date.now()
}

/* First hour of a group, for the "starts in" countdown */
export function groupStart(group) {
  return slotStart(group.date, group.bookings[0].slot)
}