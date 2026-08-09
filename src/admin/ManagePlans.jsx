import { useEffect, useState } from 'react'
import { adminGetPlans } from '../utils/api'
import { formatDateTime } from '../utils/slots'
import Icon from '../components/Icon'

export default function ManagePlans() {
  const [plans, setPlans] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminGetPlans()
      .then(setPlans)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const now = new Date()
  const revenue = plans.reduce((s, p) => s + (p.price || 0), 0)
  const active = plans.filter(p => new Date(p.expiryDate) >= now).length

  const stats = [
    { label: 'Total Plans',   value: plans.length,     icon: 'receipt', color: 'var(--info)' },
    { label: 'Active Plans',  value: active,           icon: 'check',   color: 'var(--brand)' },
    { label: 'Expired Plans', value: plans.length - active, icon: 'clock', color: 'var(--danger)' },
    { label: 'Total Revenue', value: `₹${revenue.toLocaleString('en-IN')}`, icon: 'rupee', color: 'var(--gold)' }
  ]

  return (
    <div className="admin-page">
      <h1 className="admin-page-title">Owner Plans ({plans.length})</h1>
      {error && <p className="error">{error}</p>}
      {loading && <p className="muted">Loading…</p>}

      <div className="dash-grid" style={{ marginBottom: 20 }}>
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

      {!loading && plans.length === 0 && !error && (
        <p className="muted">No plans purchased yet.</p>
      )}

      {plans.length > 0 && (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>User</th><th>Plan</th><th>Price</th><th>Grounds Used</th>
                <th>Start</th><th>Expires</th><th>Payment ID</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              {plans.map(p => {
                const expired = new Date(p.expiryDate) < now
                const yearly = p.planType === 'yearly'
                return (
                  <tr key={p._id}>
                    <td>
                      <b>{p.user?.name || '—'}</b><br />
                      <span className="muted small">{p.user?.email}</span>
                    </td>
                    <td>
                      <span className={'a-badge ' + (yearly ? 'a-badge-yellow' : 'a-badge-blue')}>
                        <Icon name={yearly ? 'star' : 'calendar'} size={11} filled={yearly} />
                        {yearly ? 'Yearly' : 'Monthly'}
                      </span>
                    </td>
                    <td><b>₹{p.price?.toLocaleString('en-IN')}</b></td>
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
      )}
    </div>
  )
}