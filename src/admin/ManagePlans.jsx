import { useEffect, useState } from 'react'
import { adminGetPlans } from '../utils/api'
import { formatDateTime } from '../utils/slots'

export default function ManagePlans() {
  const [plans, setPlans] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    adminGetPlans().then(setPlans).catch(e => setError(e.message))
  }, [])

  const now = new Date()
  const revenue = plans.reduce((s, p) => s + (p.price || 0), 0)
  const active = plans.filter(p => new Date(p.expiryDate) >= now).length

  return (
    <div className="admin-page">
      <h1 className="admin-page-title">Owner Plans ({plans.length})</h1>
      {error && <p className="error">{error}</p>}

      <div className="dash-grid" style={{ marginBottom: 20 }}>
        {[
          { label: 'Total Plans', value: plans.length, icon: '📋', color: '#3b82f6' },
          { label: 'Active Plans', value: active, icon: '✅', color: '#16a34a' },
          { label: 'Expired Plans', value: plans.length - active, icon: '⏰', color: '#ef4444' },
          { label: 'Total Revenue', value: `₹${revenue.toLocaleString('en-IN')}`, icon: '💰', color: '#f59e0b' }
        ].map(s => (
          <div key={s.label} className="dash-card" style={{ borderLeft: `4px solid ${s.color}` }}>
            <span className="dash-icon">{s.icon}</span>
            <div><p className="dash-value">{s.value}</p><p className="dash-label">{s.label}</p></div>
          </div>
        ))}
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr><th>User</th><th>Plan</th><th>Price</th><th>Turfs Used</th><th>Start</th><th>Expires</th><th>Payment ID</th><th>Status</th></tr>
          </thead>
          <tbody>
            {plans.map(p => {
              const expired = new Date(p.expiryDate) < now
              return (
                <tr key={p._id}>
                  <td><b>{p.user?.name}</b><br /><span className="muted small">{p.user?.email}</span></td>
                  <td>
                    <span className={'a-badge ' + (p.planType === 'yearly' ? 'a-badge-yellow' : 'a-badge-blue')}>
                      {p.planType === 'yearly' ? '⭐ Yearly' : '📅 Monthly'}
                    </span>
                  </td>
                  <td>₹{p.price?.toLocaleString('en-IN')}</td>
                  <td>{p.turfsUsed} / {p.turfLimit}</td>
                  <td className="small">{formatDateTime(p.startDate)}</td>
                  <td className="small">{formatDateTime(p.expiryDate)}</td>
                  <td className="mono small">{p.paymentId}</td>
                  <td>
                    <span className={'a-badge ' + (expired ? 'a-badge-red' : 'a-badge-green')}>
                      {expired ? 'Expired' : 'Active'}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}