import { useEffect, useState } from 'react'
import { adminGetRefunds } from '../utils/api'
import { formatDateTime } from '../utils/slots'

export default function ManageRefunds() {
  const [refunds, setRefunds] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminGetRefunds()
      .then(setRefunds)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const total = refunds.reduce((s, r) => s + (r.amount || 0), 0)
  const slots = refunds.reduce((s, r) => s + (r.slotCount || r.bookings?.length || 0), 0)

  return (
    <div className="admin-page">
      <h1 className="admin-page-title">Refunds</h1>
      {error && <p className="error">{error}</p>}
      {loading && <p className="muted">Loading…</p>}

      <div className="admin-summary">
        Total Refunded: <b>₹{total.toLocaleString('en-IN')}</b> Across {refunds.length} Refunds
        {slots > 0 && <> · {slots} Hours Released</>}
      </div>

      {!loading && refunds.length === 0 && !error && (
        <p className="muted">No Refunds Yet.</p>
      )}

      {refunds.length > 0 && (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Refund ID</th><th>User</th><th>Booking</th><th>Hours</th>
                <th>Amount</th><th>Refund To</th><th>Status</th><th>Processed</th>
              </tr>
            </thead>
            <tbody>
              {refunds.map(r => {
                const first = r.bookings?.[0]
                const times = (r.bookings || [])
                  .map(b => b.slot)
                  .sort((a, b) => parseInt(a, 10) - parseInt(b, 10))
                return (
                  <tr key={r._id}>
                    <td className="mono">{r.refundId}</td>
                    <td>
                      <b>{r.user?.name || '—'}</b><br />
                      <span className="muted small">{r.user?.email}</span>
                    </td>
                    <td>
                      {first?.date || '—'}<br />
                      <span className="muted small">{times.join(', ') || '—'}</span>
                    </td>
                    <td>{r.slotCount || r.bookings?.length || 1}</td>
                    <td><b>₹{r.amount?.toLocaleString('en-IN')}</b></td>
                    <td>
                      {r.refundMethod || 'Original Method'}
                      {r.refundDetails && (
                        <><br /><span className="muted small mono">{r.refundDetails}</span></>
                      )}
                    </td>
                    <td><span className="a-badge a-badge-yellow">{r.status}</span></td>
                    <td className="small">
                      {formatDateTime(r.createdAt)}
                      {r.expectedBy && (
                        <><br /><span className="muted">by {r.expectedBy}</span></>
                      )}
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