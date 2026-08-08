import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { createTurf, fetchPlanStatus } from '../utils/api'
import { geocodeAddress, buildMapUrl } from '../utils/geocode'

export default function AddTurf({ user }) {
  const navigate = useNavigate()

  // ── Plan state ──
  const [planInfo, setPlanInfo] = useState(null)
  const [planLoading, setPlanLoading] = useState(true)

  // ── Form state ──
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [geocoding, setGeocoding] = useState(false)
  const [foundLocation, setFoundLocation] = useState(null)

  const [f, setF] = useState({
    name: '', sport: 'Football', address: '', city: '',
    price: '', openTime: '06:00', closeTime: '23:00',
    surface: '', size: '', amenities: '', description: '', phone: '',
    lat: '', lng: '',
    photo1: '', photo2: '', photo3: '', photo4: '', photo5: ''
  })

  useEffect(() => {
    fetchPlanStatus(user.id)
      .then(setPlanInfo)
      .catch(() => setPlanInfo({ hasPlan: false }))
      .finally(() => setPlanLoading(false))
  }, [])

  function upd(k, v) { setF(p => ({ ...p, [k]: v })) }

  async function handleFindLocation() {
    const query = [f.address, f.city].filter(Boolean).join(', ')
    if (!query || query.length < 5) {
      setError('Please Enter Address And City First')
      return
    }
    setGeocoding(true)
    setError('')
    setFoundLocation(null)
    const result = await geocodeAddress(query)
    setGeocoding(false)
    if (result) {
      setF(p => ({ ...p, lat: result.lat.toFixed(6), lng: result.lng.toFixed(6) }))
      setFoundLocation(result)
    } else {
      setError('Could Not Find Location. Try A More Specific Address.')
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const photos = [f.photo1, f.photo2, f.photo3, f.photo4, f.photo5]
        .filter(p => p.trim() !== '')

      await createTurf({
        userId: user.id,
        name: f.name,
        sport: f.sport,
        address: f.address,
        city: f.city,
        price: Number(f.price) || 0,
        openTime: f.openTime,
        closeTime: f.closeTime,
        surface: f.surface,
        size: f.size,
        amenities: f.amenities ? f.amenities.split(',').map(a => a.trim()) : [],
        description: f.description,
        phone: f.phone,
        lat: f.lat ? Number(f.lat) : undefined,
        lng: f.lng ? Number(f.lng) : undefined,
        photos
      })
      navigate('/')
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  /* ═══════════════════════════════════════════════
     EARLY RETURNS — must come BEFORE the main return
     ═══════════════════════════════════════════════ */

  if (planLoading) {
    return (
      <div className="page">
        <p className="muted">Checking Your Plan…</p>
      </div>
    )
  }

  if (!planInfo?.hasPlan) {
    return (
      <div className="page center-page">
        <div style={{ fontSize: 60, marginTop: 30 }}>🔒</div>
        <h1 style={{ marginTop: 14 }}>Plan Required</h1>
        <p className="muted" style={{ marginTop: 8, marginBottom: 20 }}>
          You Need An Active Plan To List Your Turf On Turf Arena.
        </p>
        <div className="plan-success-card">
          <p style={{ fontWeight: 700, marginBottom: 10 }}>Available Plans</p>
          <ul className="detail-list">
            <li><span>📅 Monthly</span><b>₹500 · 3 turfs · 30 days</b></li>
            <li><span>⭐ Yearly</span><b>₹4500 · 6 turfs · 365 days</b></li>
          </ul>
        </div>
        <button className="btn-primary" onClick={() => navigate('/plan')}>
          View Plans &amp; Purchase
        </button>
        <button className="btn-ghost" onClick={() => navigate('/')}>
          Back To Home
        </button>
      </div>
    )
  }

  if (planInfo.turfsUsed >= planInfo.plan.turfLimit) {
    return (
      <div className="page center-page">
        <div style={{ fontSize: 60, marginTop: 30 }}>⚠️</div>
        <h1 style={{ marginTop: 14 }}>Turf Limit Reached</h1>
        <p className="muted" style={{ marginTop: 8, marginBottom: 20 }}>
          Your {planInfo.plan.planType} Plan Allows {planInfo.plan.turfLimit} Turfs.
          You Have Already Added {planInfo.turfsUsed}.
        </p>
        <button className="btn-primary" onClick={() => navigate('/profile')}>
          View My Turfs
        </button>
        <button className="btn-ghost" onClick={() => navigate('/')}>
          Back To Home
        </button>
      </div>
    )
  }

  /* ═══════════════════════════════════════════════
     MAIN RETURN — the actual form
     ═══════════════════════════════════════════════ */

  return (
    <div className="page">
      <header className="page-head">
        <h1>Register Your Turf</h1>
        <p className="muted">Fill Your Details — All Details Are Saved. </p>
      </header>

      <div className="plan-status-card" style={{ marginBottom: 18, marginTop: 0 }}>
        <p style={{ fontSize: 13, fontWeight: 700 }}>
          {planInfo.plan.planType === 'monthly'
            ? '📅 Monthly Plan Active'
            : '⭐ Yearly Plan Active'}
        </p>
        <p className="muted small">
          {planInfo.turfsUsed} / {planInfo.plan.turfLimit} Turfs Used
          {' · '}{planInfo.daysLeft} Days Remaining
        </p>
      </div>

      <form className="form" onSubmit={handleSubmit}>

        <label>Turf Name *</label>
        <input value={f.name} onChange={e => upd('name', e.target.value)} required />

        <label>Sport *</label>
        <select value={f.sport} onChange={e => upd('sport', e.target.value)}>
          <option>Football</option>
          <option>Cricket</option>
          <option>Badminton</option>
          <option>Tennis</option>
          <option>Multi-Sport</option>
        </select>

        <label>Address *</label>
        <input value={f.address} onChange={e => upd('address', e.target.value)}
          placeholder="Street, Area" required />

        <label>City *</label>
        <input value={f.city} onChange={e => upd('city', e.target.value)}
          placeholder="Mumbai, Bengaluru…" required />

        <button type="button" className="btn-locate"
          onClick={handleFindLocation} disabled={geocoding}>
          {geocoding ? '🔍 Finding Location…' : '📍 Find Real Location From Address'}
        </button>

        {foundLocation && (
          <div className="location-found">
            <p className="success-note">✅ Location Found: {f.lat}, {f.lng}</p>
            <p className="muted small" style={{ marginBottom: 8 }}>
              {foundLocation.displayName}
            </p>
            <iframe title="location-preview" className="map-frame"
              src={buildMapUrl(Number(f.lat), Number(f.lng))}
              style={{ height: 160 }} />
          </div>
        )}

        <div className="two-col">
          <div>
            <label>Latitude (auto-filled)</label>
            <input value={f.lat} onChange={e => upd('lat', e.target.value)}
              placeholder="19.1364" />
          </div>
          <div>
            <label>Longitude(auto-filled)</label>
            <input value={f.lng} onChange={e => upd('lng', e.target.value)}
              placeholder="72.8296" />
          </div>
        </div>

        <label>Price Per Hour (₹) *</label>
        <input type="number" value={f.price}
          onChange={e => upd('price', e.target.value)} required />

        <div className="two-col">
          <div>
            <label>Opens At</label>
            <input value={f.openTime} onChange={e => upd('openTime', e.target.value)}
              placeholder="06:00" />
          </div>
          <div>
            <label>Closes At</label>
            <input value={f.closeTime} onChange={e => upd('closeTime', e.target.value)}
              placeholder="23:00" />
          </div>
        </div>

        <div className="two-col">
          <div>
            <label>Surface</label>
            <input value={f.surface} onChange={e => upd('surface', e.target.value)}
              placeholder="Artificial grass" />
          </div>
          <div>
            <label>Size</label>
            <input value={f.size} onChange={e => upd('size', e.target.value)}
              placeholder="40m x 20m" />
          </div>
        </div>

        <label>Amenities (Comma Separated)</label>
        <input value={f.amenities} onChange={e => upd('amenities', e.target.value)}
          placeholder="Floodlights, Parking, Washroom" />

        <label>Description</label>
        <textarea rows={3} value={f.description}
          onChange={e => upd('description', e.target.value)} />

        <label>Contact Phone *</label>
        <input value={f.phone} onChange={e => upd('phone', e.target.value)} required />

        <div className="photos-section">
          <h3 style={{ margin: '16px 0 10px' }}>📸 Turf Photos (Up To 5)</h3>
          <p className="muted small" style={{ marginBottom: 12 }}>
            Paste Image URLs.
          </p>
          {[1, 2, 3, 4, 5].map(n => (
            <div key={n}>
              <label>
                Photo {n} URL {n === 1 ? '(Main Photo)' : '(Optional)'}
              </label>
              <input value={f[`photo${n}`]}
                onChange={e => upd(`photo${n}`, e.target.value)}
                placeholder={n === 1 ? 'https://…' : `https://… photo ${n}`} />
              {f[`photo${n}`] && f[`photo${n}`].startsWith('http') && (
                <img src={f[`photo${n}`]} alt={`Preview ${n}`}
                  className="photo-preview-thumb"
                  onError={e => { e.target.style.display = 'none' }} />
              )}
            </div>
          ))}
        </div>

        {error && <p className="error">{error}</p>}

        <button className="btn-primary" type="submit" disabled={busy}>
          {busy ? 'Publishing…' : 'Publish Turf'}
        </button>
      </form>
    </div>
  )
}