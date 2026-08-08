const API = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export function getCurrentUser() {
  try { return JSON.parse(localStorage.getItem('te_user')) } catch { return null }
}
export function saveUser(user) { localStorage.setItem('te_user', JSON.stringify(user)) }
export function logoutUser() { localStorage.removeItem('te_user') }

async function apiFetch(path, options = {}) {
  const res = await fetch(API + path, {
    method: options.method || 'GET',
    headers: { 'Content-Type': 'application/json' },
    body: options.body ? JSON.stringify(options.body) : undefined
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.message || 'Something Went Wrong — Is The Backend Running?')
  return data
}

// admin fetch — sends the logged-in user's id so the server can check role
async function adminFetch(path, options = {}) {
  const user = getCurrentUser()
  const res = await fetch(API + path, {
    method: options.method || 'GET',
    headers: { 'Content-Type': 'application/json', 'x-user-id': user?.id || '' },
    body: options.body ? JSON.stringify(options.body) : undefined
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.message || 'Admin Request Failed')
  return data
}

// auth
export const registerUser = (body) => apiFetch('/api/auth/register', { method: 'POST', body })
export const loginUser = (body) => apiFetch('/api/auth/login', { method: 'POST', body })
export const updateProfile = (id, body) => apiFetch(`/api/auth/profile/${id}`, { method: 'PUT', body })
export const fetchUserStats = (id) => apiFetch(`/api/auth/stats/${id}`)
// turfs
export const fetchTurfs = () => apiFetch('/api/turfs')
export const fetchTurf = (id) => apiFetch('/api/turfs/' + id)
export const createTurf = (body) => apiFetch('/api/turfs', { method: 'POST', body })
// bookings
export const fetchBookedSlots = (turfId, date) =>
  apiFetch(`/api/bookings/booked?turfId=${turfId}&date=${date}`)
export const fetchMyBookings = (userId) => apiFetch('/api/bookings/my/' + userId)
export const cancelBookingApi = (id, userId) =>
  apiFetch(`/api/bookings/${id}/cancel`, { method: 'POST', body: { userId } })
export const fetchRefund = (bookingId) => apiFetch('/api/bookings/refund/' + bookingId)
// payments + contact
export const demoPay = (body) => apiFetch('/api/payments/demo-pay', { method: 'POST', body })
export const sendContact = (body) => apiFetch('/api/contact', { method: 'POST', body })

// ── Admin API functions ──────────────────────────────────────────
export const adminStats = () => adminFetch('/api/admin/stats')
// users
export const adminGetUsers = () => adminFetch('/api/admin/users')
export const adminUpdateUser = (id, body) => adminFetch(`/api/admin/users/${id}`, { method: 'PUT', body })
export const adminDeleteUser = (id) => adminFetch(`/api/admin/users/${id}`, { method: 'DELETE' })
// turfs
export const adminGetTurfs = () => adminFetch('/api/admin/turfs')
export const adminUpdateTurf = (id, body) => adminFetch(`/api/admin/turfs/${id}`, { method: 'PUT', body })
export const adminDeleteTurf = (id) => adminFetch(`/api/admin/turfs/${id}`, { method: 'DELETE' })
// bookings
export const adminGetBookings = () => adminFetch('/api/admin/bookings')
export const adminUpdateBooking = (id, body) => adminFetch(`/api/admin/bookings/${id}`, { method: 'PUT', body })
export const adminDeleteBooking = (id) => adminFetch(`/api/admin/bookings/${id}`, { method: 'DELETE' })
// payments, refunds, messages, emails
export const adminGetPayments = () => adminFetch('/api/admin/payments')
export const adminGetRefunds = () => adminFetch('/api/admin/refunds')
export const adminGetMessages = () => adminFetch('/api/admin/messages')
export const adminDeleteMessage = (id) => adminFetch(`/api/admin/messages/${id}`, { method: 'DELETE' })
export const adminGetEmails = () => adminFetch('/api/admin/emails')
// ── Plan API ─────────────────────────────────────────────────────
export const fetchPlanStatus = (userId) => apiFetch(`/api/plans/status/${userId}`)
export const purchasePlan = (body) => apiFetch('/api/plans/purchase', { method: 'POST', body })
// turf owner edit
export const fetchMyTurfs = (userId) => apiFetch(`/api/turfs/my/${userId}`)
export const updateTurf = (id, body) => apiFetch(`/api/turfs/${id}`, { method: 'PUT', body })
// admin plans
export const adminGetPlans = () => adminFetch('/api/admin/plans')
export const fetchMyBookingsGrouped = (userId) => apiFetch(`/api/bookings/my/${userId}`)