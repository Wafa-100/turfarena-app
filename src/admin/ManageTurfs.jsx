import { useEffect, useState } from 'react'
import { adminGetTurfs, adminUpdateTurf, adminDeleteTurf } from '../utils/api'
import Icon from '../components/Icon'

export default function ManageTurfs() {
  const [turfs, setTurfs] = useState([])
  const [editTurf, setEditTurf] = useState(null)
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')

  function load() { adminGetTurfs().then(setTurfs).catch(e => setError(e.message)) }
  useEffect(load, [])

  async function handleSave() {
    try {
      await adminUpdateTurf(editTurf._id, {
        name: editTurf.name, sport: editTurf.sport, city: editTurf.city,
        address: editTurf.address, price: editTurf.price, rating: editTurf.rating,
        openTime: editTurf.openTime, closeTime: editTurf.closeTime,
        surface: editTurf.surface, size: editTurf.size, phone: editTurf.phone,
        description: editTurf.description,
        amenities: Array.isArray(editTurf.amenities)
          ? editTurf.amenities
          : (editTurf.amenities || '').split(',').map(a => a.trim())
      })
      setEditTurf(null); load()
    } catch (e) { setError(e.message) }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete This Turf?')) return
    try { await adminDeleteTurf(id); load() } catch (e) { setError(e.message) }
  }

  const filtered = turfs.filter(t =>
    t.name?.toLowerCase().includes(search.toLowerCase()) ||
    t.city?.toLowerCase().includes(search.toLowerCase())
  )

  function upd(k, v) { setEditTurf(t => ({ ...t, [k]: v })) }

  return (
    <div className="admin-page">
      <h1 className="admin-page-title">Manage Turfs ({turfs.length})</h1>
      {error && <p className="error">{error}</p>}

      <input className="admin-search" placeholder="Search By Name Or City…"
        value={search} onChange={e => setSearch(e.target.value)} />

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Photo</th><th>Name</th><th>Sport</th><th>City</th>
              <th>Price</th><th>Rating</th><th>Photos</th><th>Location</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(t => (
              <tr key={t._id}>
                <td>
                  <img src={t.photo || t.photos?.[0]} alt=""
                    style={{ width: 50, height: 36, objectFit: 'cover', borderRadius: 6 }}
                    onError={e => { e.target.style.display = 'none' }} />
                </td>
                <td><b>{t.name}</b></td>
                <td>{t.sport}</td>
                <td>{t.city}</td>
                <td>₹{t.price}</td>
                <td>
                  <span className="admin-rating">
                    <Icon name="star" size={12} filled /> {t.rating}
                  </span>
                </td>
                <td>
                  <span className="a-badge a-badge-blue">
                    <Icon name="camera" size={11} />
                    {t.photos?.length || 0}
                  </span>
                </td>
                <td>
                  {t.lat && t.lng
                    ? <span className="a-badge a-badge-green"><Icon name="pin" size={11} /> Set</span>
                    : <span className="a-badge a-badge-red"><Icon name="close" size={11} /> None</span>}
                </td>
                <td>
                  <button className="a-btn a-btn-edit" onClick={() => setEditTurf({ ...t })}>Edit</button>
                  <button className="a-btn a-btn-delete" onClick={() => handleDelete(t._id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editTurf && (
        <div className="modal-overlay">
          <div className="modal-card modal-wide">
            <h3>Edit Turf: {editTurf.name}</h3>
            <div className="modal-grid">
              {[['name','Name'],['sport','Sport'],['city','City'],['address','Address'],
                ['price','Price (₹)'],['rating','Rating'],['openTime','Open Time'],
                ['closeTime','Close Time'],['surface','Surface'],['size','Size'],['phone','Phone'],
                ['lat','Latitude'],['lng','Longitude']
              ].map(([k,l]) => (
                <div key={k}>
                  <label>{l}</label>
                  <input value={editTurf[k] || ''} onChange={e => upd(k, e.target.value)} />
                </div>
              ))}
              <div className="modal-full">
                <label>Description</label>
                <textarea rows={2} value={editTurf.description || ''}
                  onChange={e => upd('description', e.target.value)} />
              </div>
              <div className="modal-full">
                <label>Amenities (Comma Separated)</label>
                <input
                  value={Array.isArray(editTurf.amenities)
                    ? editTurf.amenities.join(', ')
                    : editTurf.amenities || ''}
                  onChange={e => upd('amenities', e.target.value.split(',').map(a => a.trim()))}
                />
              </div>
            </div>
            <div className="modal-actions">
              <button className="a-btn a-btn-edit" onClick={handleSave}>Save Changes</button>
              <button className="a-btn a-btn-delete" onClick={() => setEditTurf(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}