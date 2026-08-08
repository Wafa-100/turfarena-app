import { useEffect, useState } from 'react'
import { adminGetBookings, adminUpdateBooking, adminDeleteBooking } from '../utils/api'
import { formatDateTime } from '../utils/slots'

export default function ManageBookings() {
  const [bookings, setBookings] = useState([])
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')

  function load() { adminGetBookings().then(setBookings).catch(e => setError(e.message)) }
  useEffect(load, [])

  async function toggleStatus(b) {
    const newStatus = b.status === 'Confirmed' ? 'Cancelled' : 'Confirmed'
    try { await adminUpdateBooking(b._id, { status: newStatus }); load() } catch (e) { setError(e.message) }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete This Booking Record?')) return
    try { await adminDeleteBooking(id); load() } catch (e) { setError(e.message) }
  }

  const filtered = bookings.filter(b =>
    b.turf?.name?.toLowerCase().includes(search.toLowerCase()) ||
    b.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
    b.user?.email?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="admin-page">
      <h1 className="admin-page-title">Manage Bookings</h1>
      {error && <p className="error">{error}</p>}
      <input className="admin-search" placeholder="Search By Turf Or User…"
        value={search} onChange={e => setSearch(e.target.value)} />

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr><th>Turf</th><th>User</th><th>Date</th><th>Slot</th><th>Price</th><th>Payment</th><th>Status</th><th>Booked At</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {filtered.map(b => (
              <tr key={b._id}>
                <td>{b.turf?.name || '—'}</td>
                <td>{b.user?.name}<br /><span className="muted small">{b.user?.email}</span></td>
                <td>{b.date}</td>
                <td>{b.slot}</td>
                <td>₹{b.price}</td>
                <td className="small">{b.payment?.paymentId}<br />{b.payment?.method}</td>
                <td><span className={'a-badge ' + (b.status === 'Confirmed' ? 'a-badge-green' : 'a-badge-red')}>{b.status}</span></td>
                <td className="small">{formatDateTime(b.createdAt)}</td>
                <td>
                  <button className="a-btn a-btn-edit" onClick={() => toggleStatus(b)}>
                    {b.status === 'Confirmed' ? 'Cancel' : 'Restore'}
                  </button>
                  <button className="a-btn a-btn-delete" onClick={() => handleDelete(b._id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}