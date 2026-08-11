import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { fetchTurf, updateTurf } from '../utils/api'
import { geocodeAddress, buildMapUrl } from '../utils/geocode'
import TimeSelect from '../components/TimeSelect'

export default function EditTurf({ user }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [geocoding, setGeocoding] = useState(false)
  const [mapPreview, setMapPreview] = useState(null)
  const [f, setF] = useState(null)

  useEffect(() => {
    fetchTurf(id).then(turf => {
      // Security: only owner can access this page
      if (!turf.owner || turf.owner.toString() !== user.id) {
        navigate(`/turf/${id}`)
        return
      }
      const photos = Array.isArray(turf.photos) ? turf.photos : []
      setF({
        name: turf.name || '',
        sport: turf.sport || 'Football',
        address: turf.address || '',
        city: turf.city || '',
        price: turf.price || '',
        openTime: turf.openTime || '06:00',
        closeTime: turf.closeTime || '23:00',
        surface: turf.surface || '',
        size: turf.size || '',
        amenities: Array.isArray(turf.amenities) ? turf.amenities.join(', ') : '',
        description: turf.description || '',
        phone: turf.phone || '',
        lat: turf.lat || '',
        lng: turf.lng || '',
        photo1: photos[0] || turf.photo || '',
        photo2: photos[1] || '',
        photo3: photos[2] || '',
        photo4: photos[3] || '',
        photo5: photos[4] || '',
      })
      if (turf.lat && turf.lng) setMapPreview({ lat: turf.lat, lng: turf.lng })
    }).catch(e => setError(e.message))
    .finally(() => setLoading(false))
  }, [id])

  function upd(k, v) { setF(p => ({ ...p, [k]: v })) }

  async function handleGeocode() {
    const query = [f.address, f.city].filter(Boolean).join(', ')
    setGeocoding(true)
    const result = await geocodeAddress(query)
    setGeocoding(false)
    if (result) {
      setF(p => ({ ...p, lat: result.lat.toFixed(6), lng: result.lng.toFixed(6) }))
      setMapPreview({ lat: result.lat, lng: result.lng })
    } else setError('Location Not Found. Try A More Specific Address.')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const photos = [f.photo1, f.photo2, f.photo3, f.photo4, f.photo5]
        .filter(p => p.trim() !== '')
      await updateTurf(id, {
        userId: user.id,
        name: f.name, sport: f.sport, address: f.address, city: f.city,
        price: Number(f.price),
        openTime: f.openTime, closeTime: f.closeTime,
        surface: f.surface, size: f.size,
        amenities: f.amenities.split(',').map(a => a.trim()).filter(Boolean),
        description: f.description, phone: f.phone,
        lat: f.lat ? Number(f.lat) : null,
        lng: f.lng ? Number(f.lng) : null,
        photos
      })
      navigate(`/turf/${id}`)
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  if (loading) return <div className="page"><p className="muted">Loading…</p></div>
  if (!f) return <div className="page"><p className="error">{error || 'Could Not Load Turf'}</p></div>

  return (
    <div className="page">
      <header className="page-head">
        <h1>Edit My Turf</h1>
        <p className="muted">Only You (The Owner) Can Edit This Turf</p>
      </header>

      <form className="form" onSubmit={handleSubmit}>
        <label>Turf Name *</label>
        <input value={f.name} onChange={e => upd('name', e.target.value)} required />

        <label>Sport *</label>
        <select value={f.sport} onChange={e => upd('sport', e.target.value)}>
          {['Football','Cricket','Badminton','Tennis','Multi-Sport'].map(s =>
            <option key={s}>{s}</option>
          )}
        </select>

        <label>Address *</label>
        <input value={f.address} onChange={e => upd('address', e.target.value)} required />

        <label>City *</label>
        <input value={f.city} onChange={e => upd('city', e.target.value)} required />

        <button type="button" className="btn-locate" onClick={handleGeocode} disabled={geocoding}>
          {geocoding ? '🔍 Finding Location…' : '📍 Update Location From Address'}
        </button>

        {mapPreview && (
          <iframe title="map-preview" className="map-frame"
            src={buildMapUrl(mapPreview.lat, mapPreview.lng)}
            style={{ height: 140, marginBottom: 10 }} />
        )}

        <div className="two-col">
          <div><label>Latitude</label><input value={f.lat} onChange={e => upd('lat', e.target.value)} /></div>
          <div><label>Longitude</label><input value={f.lng} onChange={e => upd('lng', e.target.value)} /></div>
        </div>

        <label>Price Per Hour (₹) *</label>
        <input type="number" value={f.price} onChange={e => upd('price', e.target.value)} required />

        <div className="two-col">
          <div>
            <label>Opens at</label>
            <TimeSelect value={f.openTime} onChange={v => upd('openTime', v)} />
          </div>
          <div>
            <label>Closes at</label>
            <TimeSelect value={f.closeTime} onChange={v => upd('closeTime', v)} />
          </div>
        </div>

        <div className="two-col">
          <div><label>Surface</label><input value={f.surface} onChange={e => upd('surface', e.target.value)} /></div>
          <div><label>Size</label><input value={f.size} onChange={e => upd('size', e.target.value)} /></div>
        </div>

        <label>Amenities (Comma Separated)</label>
        <input value={f.amenities} onChange={e => upd('amenities', e.target.value)} />

        <label>Description</label>
        <textarea rows={3} value={f.description} onChange={e => upd('description', e.target.value)} />

        <label>Contact Phone *</label>
        <input value={f.phone} onChange={e => upd('phone', e.target.value)} required />

        <div className="photos-section">
          <h3 style={{ margin: '14px 0 8px' }}>📸 Photos (Up To 5)</h3>
          {[1,2,3,4,5].map(n => (
            <div key={n}>
              <label>Photo {n} {n === 1 ? '(Main)' : '(Optional)'}</label>
              <input value={f[`photo${n}`]} onChange={e => upd(`photo${n}`, e.target.value)} />
              {f[`photo${n}`]?.startsWith('http') && (
                <img src={f[`photo${n}`]} alt="" className="photo-preview-thumb"
                  onError={e => { e.target.style.display='none' }} />
              )}
            </div>
          ))}
        </div>

        {error && <p className="error">{error}</p>}

        <button className="btn-primary" type="submit" disabled={busy}>
          {busy ? 'Saving Changes…' : 'Save Changes'}
        </button>
        <button className="btn-ghost" type="button" onClick={() => navigate(`/turf/${id}`)}>
          Cancel
        </button>
      </form>
    </div>
  )
}