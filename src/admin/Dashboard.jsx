import { useEffect, useState } from 'react'
import { adminStats } from '../utils/api'
import { formatDateTime } from '../utils/slots'

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    adminStats().then(setData).catch(e => setError(e.message))
  }, [])

  if (error) return <div className="admin-page"><p className="error">{error}</p></div>
  if (!data) return <div className="admin-page"><p className="muted">Loading…</p></div>

  const stats = [
    { label: 'Total Users', value: data.totalUsers, icon: '👥', color: '#3b82f6' },
    { label: 'Turfs Listed', value: data.totalTurfs, icon: '🏟️', color: '#16a34a' },
    { label: 'Confirmed Bookings', value: data.totalBookings, icon: '📅', color: '#8b5cf6' },
    { label: 'Total Revenue', value: `₹${data.totalRevenue}`, icon: '💰', color: '#f59e0b' },
    { label: 'Cancellations', value: data.totalCancelled, icon: '❌', color: '#ef4444' },
    { label: 'Refunds Issued', value: data.totalRefunds, icon: '↩️', color: '#06b6d4' },
    { label: 'Messages', value: data.totalMessages, icon: '✉️', color: '#ec4899' }
  ]

  return (
    <div className="admin-page">
      <h1 className="admin-page-title">Dashboard</h1>

      <div className="dash-grid">
        {stats.map(s => (
          <div key={s.label} className="dash-card" style={{ borderLeft: `4px solid ${s.color}` }}>
            <span className="dash-icon">{s.icon}</span>
            <div>
              <p className="dash-value">{s.value}</p>
              <p className="dash-label">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <h2 className="admin-section-title">Recent Bookings</h2>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Turf</th><th>User</th><th>Date</th><th>Slot</th><th>Status</th><th>Booked At</th>
            </tr>
          </thead>
          <tbody>
            {data.recentBookings.map(b => (
              <tr key={b._id}>
                <td>{b.turf?.name || '—'}</td>
                <td>{b.user?.name || '—'}</td>
                <td>{b.date}</td>
                <td>{b.slot}</td>
                <td><span className={'a-badge ' + (b.status === 'Confirmed' ? 'a-badge-green' : 'a-badge-red')}>{b.status}</span></td>
                <td>{formatDateTime(b.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}