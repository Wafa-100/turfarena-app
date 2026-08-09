import { useEffect, useState } from 'react'
import { adminGetUsers, adminUpdateUser, adminDeleteUser } from '../utils/api'
import Icon from '../components/Icon'

export default function ManageUsers() {
  const [users, setUsers] = useState([])
  const [editUser, setEditUser] = useState(null)
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')
  const [lastRefresh, setLastRefresh] = useState(new Date())

  function load() {
    adminGetUsers()
      .then(data => { setUsers(data); setLastRefresh(new Date()) })
      .catch(e => setError(e.message))
  }
  useEffect(load, [])

  async function handleSave() {
    try {
      await adminUpdateUser(editUser._id, {
        name: editUser.name, email: editUser.email,
        phone: editUser.phone, role: editUser.role
      })
      setEditUser(null)
      load()
    } catch (e) { setError(e.message) }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete This User?')) return
    try { await adminDeleteUser(id); load() } catch (e) { setError(e.message) }
  }

  const filtered = users.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="admin-page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 className="admin-page-title" style={{ marginBottom: 0 }}>
          Manage Users ({users.length})
        </h1>
        <div style={{ textAlign: 'right' }}>
          <button className="a-btn a-btn-edit" onClick={load} style={{ padding: '8px 16px' }}>
            <Icon name="refresh" size={13} /> Refresh
          </button>
          <p className="muted small" style={{ marginTop: 4 }}>
            Last Updated: {lastRefresh.toLocaleTimeString('en-IN')}
          </p>
        </div>
      </div>

      <p className="admin-summary">
        ℹ️ Profile Edits By Users Are Reflected Here Automatically — Click Refresh To See Latest Changes.
      </p>

      {error && <p className="error">{error}</p>}

      <input className="admin-search" placeholder="Search By Name Or Email…"
        value={search} onChange={e => setSearch(e.target.value)} />

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr><th>Name</th><th>Email</th><th>Phone</th><th>Role</th><th>Joined</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {filtered.map(u => (
              <tr key={u._id}>
                <td><b>{u.name}</b></td>
                <td>{u.email}</td>
                <td>{u.phone || '—'}</td>
                <td>
                  <span className={'a-badge ' + (u.role === 'admin' ? 'a-badge-purple' : 'a-badge-blue')}>
                    {u.role}
                  </span>
                </td>
                <td>{new Date(u.createdAt).toLocaleDateString('en-IN')}</td>
                <td>
                  <button className="a-btn a-btn-edit" onClick={() => setEditUser({ ...u })}>Edit</button>
                  <button className="a-btn a-btn-delete" onClick={() => handleDelete(u._id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editUser && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3>Edit User</h3>
            <label>Name</label>
            <input value={editUser.name}
              onChange={e => setEditUser({ ...editUser, name: e.target.value })} />
            <label>Email</label>
            <input value={editUser.email}
              onChange={e => setEditUser({ ...editUser, email: e.target.value })} />
            <label>Phone</label>
            <input value={editUser.phone || ''}
              onChange={e => setEditUser({ ...editUser, phone: e.target.value })} />
            <label>Role</label>
            <select value={editUser.role}
              onChange={e => setEditUser({ ...editUser, role: e.target.value })}>
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
            <div className="modal-actions">
              <button className="a-btn a-btn-edit" onClick={handleSave}>Save</button>
              <button className="a-btn a-btn-delete" onClick={() => setEditUser(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}