import { useEffect, useState } from 'react'
import { adminStats } from '../utils/api'
import { formatDateTime } from '../utils/slots'
import Icon from '../components/Icon'

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    adminStats().then(setData).catch(e => setError(e.message))
  }, [])

  if (error) return <div className="admin-page"><p className="error">{error}</p></div>
  if (!data) return <div className="admin-page"><p className="muted">Loading…</p></div>

  const stats = [
    { label: 'Total Users',        value: data.totalUsers,     icon: 'users',    color: 'var(--info)' },
    { label: 'Grounds Listed',     value: data.totalTurfs,     icon: 'building', color: 'var(--brand)' },
    { label: 'Confirmed Bookings', value: data.totalBookings,  icon: 'calendar', color: '#7C3AED' },
    { label: 'Total Revenue',      value: `₹${data.totalRevenue?.toLocaleString('en-IN')}`, icon: 'rupee', color: 'var(--gold)' },
    { label: 'Cancellations',      value: data.totalCancelled, icon: 'close',    color: 'var(--danger)' },
    { label: 'Refunds Issued',     value: data.totalRefunds,   icon: 'undo',     color: '#06B6D4' },
    { label: 'Messages',           value: data.totalMessages,  icon: 'chat',     color: '#EC4899' }
  ]

  return (
    <div className="admin-page">
      <h1 className="admin-page-title">Dashboard</h1>

      <div className="dash-grid">
        {stats.map(s => (
          <div key={s.label} className="dash-card" style={{ borderLeft: `4px solid ${s.color}` }}>
            <span className="dash-icon" style={{ color: s.color }}>
              <Icon name={s.icon} size={26} />
            </span>
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
              <th>Ground</th><th>User</th><th>Date</th><th>Slot</th><th>Status</th><th>Booked At</th>
            </tr>
          </thead>
          <tbody>
            {data.recentBookings.map(b => (
              <tr key={b._id}>
                <td>{b.turf?.name || '—'}</td>
                <td>{b.user?.name || '—'}</td>
                <td>{b.date}</td>
                <td>{b.slot}</td>
                <td>
                  <span className={'a-badge ' + (b.status === 'Confirmed' ? 'a-badge-green' : 'a-badge-red')}>
                    {b.status}
                  </span>
                </td>
                <td>{formatDateTime(b.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}