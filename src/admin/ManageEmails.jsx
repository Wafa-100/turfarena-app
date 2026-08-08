import { useEffect, useState } from 'react'
import { adminGetEmails } from '../utils/api'
import { formatDateTime } from '../utils/slots'

export default function ManageEmails() {
  const [emails, setEmails] = useState([])
  const [selected, setSelected] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => { adminGetEmails().then(setEmails).catch(e => setError(e.message)) }, [])

  return (
    <div className="admin-page">
      <h1 className="admin-page-title">Email Logs ({emails.length})</h1>
      {error && <p className="error">{error}</p>}

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr><th>To</th><th>Subject</th><th>Sent At</th><th>Preview</th></tr>
          </thead>
          <tbody>
            {emails.map(e => (
              <tr key={e._id}>
                <td>{e.to}</td>
                <td>{e.subject}</td>
                <td className="small">{formatDateTime(e.createdAt)}</td>
                <td>
                  <button className="a-btn a-btn-edit" onClick={() => setSelected(e)}>View Email</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && (
        <div className="modal-overlay">
          <div className="modal-card modal-wide">
            <h3>📧 Email Preview</h3>
            <p><b>To:</b> {selected.to}</p>
            <p><b>Subject:</b> {selected.subject}</p>
            <pre className="email-preview-body">{selected.body}</pre>
            <div className="modal-actions">
              <button className="a-btn a-btn-edit" onClick={() => setSelected(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}