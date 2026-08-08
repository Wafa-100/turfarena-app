import { useEffect, useState } from 'react'
import { adminGetMessages, adminDeleteMessage } from '../utils/api'
import { formatDateTime } from '../utils/slots'

export default function ManageMessages() {
  const [messages, setMessages] = useState([])
  const [error, setError] = useState('')

  function load() { adminGetMessages().then(setMessages).catch(e => setError(e.message)) }
  useEffect(load, [])

  async function handleDelete(id) {
    if (!window.confirm('Delete This Message?')) return
    try { await adminDeleteMessage(id); load() } catch (e) { setError(e.message) }
  }

  return (
    <div className="admin-page">
      <h1 className="admin-page-title">Contact Messages ({messages.length})</h1>
      {error && <p className="error">{error}</p>}

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr><th>From</th><th>Email</th><th>Message</th><th>Received</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {messages.map(m => (
              <tr key={m._id}>
                <td>{m.name}</td>
                <td>{m.email}</td>
                <td style={{ maxWidth: 300 }}>{m.message}</td>
                <td className="small">{formatDateTime(m.createdAt)}</td>
                <td>
                  <button className="a-btn a-btn-delete" onClick={() => handleDelete(m._id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}