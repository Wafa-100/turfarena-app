import { useEffect, useState } from 'react'
import { adminGetRefunds } from '../utils/api'
import { formatDateTime } from '../utils/slots'

export default function ManageRefunds() {
  const [refunds, setRefunds] = useState([])
  const [error, setError] = useState('')

  useEffect(() => { adminGetRefunds().then(setRefunds).catch(e => setError(e.message)) }, [])

  const total = refunds.reduce((s, r) => s + (r.amount || 0), 0)

  return (
    <div className="admin-page">
      <h1 className="admin-page-title">Refunds</h1>
      {error && <p className="error">{error}</p>}
      <div className="admin-summary">Total Refunded: <b>₹{total}</b> Across {refunds.length} Refunds</div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr><th>Refund ID</th><th>User</th><th>Booking Date</th><th>Slot</th><th>Amount</th><th>Reason</th><th>Status</th><th>Refunded At</th></tr>
          </thead>
          <tbody>
            {refunds.map(r => (
              <tr key={r._id}>
                <td className="mono">{r.refundId}</td>
                <td>{r.user?.name}<br /><span className="muted small">{r.user?.email}</span></td>
                <td>{r.booking?.date || '—'}</td>
                <td>{r.booking?.slot || '—'}</td>
                <td>₹{r.amount}</td>
                <td>{r.reason}</td>
                <td><span className="a-badge a-badge-yellow">{r.status}</span></td>
                <td className="small">{formatDateTime(r.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}