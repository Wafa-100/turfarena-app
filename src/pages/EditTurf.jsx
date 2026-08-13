import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { fetchTurf, updateTurf } from '../utils/api'
import PhotoUpload from '../components/PhotoUpload'
import AddressPicker from '../components/AddressPicker'
import TimeSelect from '../components/TimeSelect'
import Icon from '../components/Icon'

const SPORTS = [
  { id: 'Football',    icon: 'ball' },
  { id: 'Cricket',     icon: 'ball' },
  { id: 'Badminton',   icon: 'ball' },
  { id: 'Tennis',      icon: 'ball' },
  { id: 'Multi-Sport', icon: 'star' }
]

const AMENITIES = [
  'Floodlights', 'Parking', 'Washroom', 'Changing room',
  'Drinking water', 'Seating', 'First aid', 'Equipment rental',
  'Cafeteria', 'CCTV'
]

const STEPS = ['Basics', 'Details', 'Location']

export default function EditTurf({ user }) {
  const { id } = useParams()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState(0)
  const [photos, setPhotos] = useState([])
  const [loc, setLoc] = useState({})
  const [amenities, setAmenities] = useState([])
  const [f, setF] = useState({
    name: '', sport: 'Football', price: '',
    openTime: '06:00', closeTime: '23:00',
    surface: '', size: '', description: '', phone: ''
  })

  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetchTurf(id)
      .then(t => {
        if (!t.owner || String(t.owner) !== String(user.id)) {
          navigate('/')
          return
        }
        setF({
          name: t.name || '',
          sport: t.sport || 'Football',
          price: String(t.price || ''),
          openTime: t.openTime || '06:00',
          closeTime: t.closeTime || '23:00',
          surface: t.surface || '',
          size: t.size || '',
          description: t.description || '',
          phone: (t.phone || '').replace(/\D/g, '').slice(-10)
        })
        setPhotos(t.photos?.length ? t.photos : (t.photo ? [t.photo] : []))
        setAmenities(t.amenities || [])
        setLoc({
          address: t.address,
          lat: t.lat,
          lng: t.lng,
          city: t.city,
          placeId: t.placeId,
          formattedAddress: t.formattedAddress,
          mapPrecision: t.mapPrecision
        })
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [id])

  const upd = (k, v) => setF(p => ({ ...p, [k]: v }))
  const toggleAmenity = a =>
    setAmenities(x => x.includes(a) ? x.filter(y => y !== a) : [...x, a])

  if (loading) return <div className="page"><p className="muted">Loading…</p></div>

  /* ══ Saved ══ */

  if (saved) {
    return (
      <div className="at-done">
        <div className="at-done-mark"><Icon name="check" size={30} /></div>
        <h1 className="at-done-title">Changes saved</h1>
        <p className="at-done-sub">{f.name} has been updated.</p>

        {photos[0] && <img src={photos[0]} alt="" className="at-done-img" />}

        <button className="pp-cta" onClick={() => navigate(`/turf/${id}`)}>
          View my ground <Icon name="arrow" size={17} />
        </button>
        <button className="btn-ghost" onClick={() => navigate(`/manage/${id}`)}>
          Manage slots and pricing
        </button>
      </div>
    )
  }

  function validateStep() {
    setError('')

    if (step === 0) {
      if (!f.name.trim()) { setError('Give your ground a name'); return false }
      if (!f.price || Number(f.price) <= 0) { setError('Set an hourly price'); return false }
      if (photos.length === 0) { setError('Keep at least one photo'); return false }
      return true
    }

    if (step === 1) {
      if (!f.phone.trim() || f.phone.length !== 10) {
        setError('Add a valid 10-digit contact number'); return false
      }
      return true
    }

    if (step === 2) {
      if (!loc.lat) { setError('Find your ground on the map'); return false }
      return true
    }

    return true
  }

  async function save() {
    if (!validateStep()) return
    setBusy(true); setError('')
    try {
      await updateTurf(id, {
        userId: user.id,
        name: f.name.trim(),
        sport: f.sport,
        address: loc.address,
        city: loc.city || '',
        price: Number(f.price),
        openTime: f.openTime,
        closeTime: f.closeTime,
        surface: f.surface,
        size: f.size,
        amenities,
        description: f.description,
        phone: f.phone,
        lat: loc.lat,
        lng: loc.lng,
        placeId: loc.placeId,
        formattedAddress: loc.formattedAddress,
        mapPrecision: loc.mapPrecision,
        photos
      })
      setSaved(true)
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  return (
    <div className="page at-page">

      <button className="pm-change" onClick={() => navigate(`/turf/${id}`)}>
        <Icon name="chevron" size={14} className="mg-back-icon" />
        Back to ground
      </button>

      <div className="at-steps">
        {STEPS.map((s, i) => (
          <div key={s} className={'at-step'
            + (i === step ? ' at-step-on' : '')
            + (i < step ? ' at-step-done' : '')}>
            <span className="at-step-dot">
              {i < step ? <Icon name="check" size={11} /> : i + 1}
            </span>
            <span className="at-step-label">{s}</span>
          </div>
        ))}
      </div>

      {/* ══ 0 — BASICS ══ */}
      {step === 0 && (
        <>
          <header className="at-head">
            <h1 className="at-title">Edit your ground</h1>
            <p className="at-sub">Update what players see first.</p>
          </header>

          <label className="at-label">Photos</label>
          <PhotoUpload photos={photos} onChange={setPhotos} max={5} />

          <label className="at-label">Ground name</label>
          <input value={f.name} onChange={e => upd('name', e.target.value)} />

          <label className="at-label">Sport</label>
          <div className="at-sports">
            {SPORTS.map(s => (
              <button key={s.id} type="button"
                className={'at-sport' + (f.sport === s.id ? ' at-sport-on' : '')}
                onClick={() => upd('sport', s.id)}>
                <Icon name={s.icon} size={17} />
                {s.id}
              </button>
            ))}
          </div>

          <label className="at-label">Price per hour</label>
          <div className="at-price">
            <span className="at-price-cur">₹</span>
            <input type="number" inputMode="numeric" value={f.price}
              onChange={e => upd('price', e.target.value)} />
            <span className="at-price-per">/ hour</span>
          </div>
          <p className="at-hint">
            Time-based rates are set in Manage Ground → Pricing.
          </p>
        </>
      )}

      {/* ══ 1 — DETAILS ══ */}
      {step === 1 && (
        <>
          <header className="at-head">
            <h1 className="at-title">The details</h1>
            <p className="at-sub">These help players decide.</p>
          </header>

          <label className="at-label">Opening hours</label>
          <div className="two-col">
            <div>
              <p className="at-mini">Opens</p>
              <TimeSelect value={f.openTime} onChange={v => upd('openTime', v)} />
            </div>
            <div>
              <p className="at-mini">Closes</p>
              <TimeSelect value={f.closeTime} onChange={v => upd('closeTime', v)} />
            </div>
          </div>

          <label className="at-label">What's available?</label>
          <div className="at-amenities">
            {AMENITIES.map(a => (
              <button key={a} type="button"
                className={'at-amenity' + (amenities.includes(a) ? ' at-amenity-on' : '')}
                onClick={() => toggleAmenity(a)}>
                {amenities.includes(a) && <Icon name="check" size={12} />}
                {a}
              </button>
            ))}
          </div>

          <div className="two-col">
            <div>
              <label className="at-label">Surface</label>
              <input value={f.surface} onChange={e => upd('surface', e.target.value)} />
            </div>
            <div>
              <label className="at-label">Size</label>
              <input value={f.size} onChange={e => upd('size', e.target.value)} />
            </div>
          </div>

          <label className="at-label">Contact number</label>
          <div className="au-phone-wrap">
            <span className="au-phone-code">+91</span>
            <input className="au-phone-input" inputMode="numeric"
              value={f.phone}
              onChange={e => upd('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
              maxLength={10} />
            <span className={'au-phone-count' + (f.phone.length === 10 ? ' au-count-ok' : '')}>
              {f.phone.length}/10
            </span>
          </div>

          <label className="at-label">
            Description <span className="at-optional">optional</span>
          </label>
          <textarea rows={3} value={f.description}
            onChange={e => upd('description', e.target.value)} />
        </>
      )}

      {/* ══ 2 — LOCATION ══ */}
      {step === 2 && (
        <>
          <header className="at-head">
            <h1 className="at-title">Where can players find you?</h1>
            <p className="at-sub">
              Search again if you have moved, or leave it as it is.
            </p>
          </header>

          <AddressPicker value={loc} onChange={setLoc} />
        </>
      )}

      {error && <p className="error">{error}</p>}

      <div className="at-nav">
        {step > 0 && (
          <button className="at-back" onClick={() => { setStep(step - 1); setError('') }}>
            Back
          </button>
        )}
        {step < 2 ? (
          <button className="at-next" onClick={() => validateStep() && setStep(step + 1)}>
            Continue <Icon name="arrow" size={16} />
          </button>
        ) : (
          <button className="at-next" disabled={busy} onClick={save}>
            {busy ? 'Saving…' : 'Save changes'}
          </button>
        )}
      </div>
    </div>
  )
}