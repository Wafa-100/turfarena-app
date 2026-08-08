import { useEffect, useState } from 'react'
import { adminGetPayments } from '../utils/api'
import { formatDateTime } from '../utils/slots'

export default function ManagePayments() {
  const [payments, setPayments] = useState([])
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')

  useEffect(() => { adminGetPayments().then(setPayments).catch(e => setError(e.message)) }, [])

  const filtered = payments.filter(p =>
    p.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.paymentId?.toLowerCase().includes(search.toLowerCase())
  )

  const total = filtered.reduce((s, p) => s + (p.amount || 0), 0)

  return (
    <div className="admin-page">
      <h1 className="admin-page-title">Payments</h1>
      {error && <p className="error">{error}</p>}
      <div className="admin-summary">Total Collected: <b>₹{total}</b> From {filtered.length} Payments</div>
      <input className="admin-search" placeholder="Search By User Or Payment ID…"
        value={search} onChange={e => setSearch(e.target.value)} />

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr><th>Payment ID</th><th>User</th><th>Turf</th><th>Amount</th><th>Mode</th><th>Status</th><th>Date</th></tr>
          </thead>
          <tbody>
            {filtered.map(p => (
              <tr key={p._id}>
                <td className="mono">{p.paymentId}</td>
                <td>{p.user?.name}<br /><span className="muted small">{p.user?.email}</span></td>
                <td>{p.turf?.name}</td>
                <td>₹{p.amount}</td>
                <td>{p.method}</td>
                <td><span className="a-badge a-badge-green">{p.status}</span></td>
                <td className="small">{formatDateTime(p.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}