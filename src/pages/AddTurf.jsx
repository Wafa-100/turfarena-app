import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { createTurf, fetchPlanStatus } from '../utils/api'
import { geocodeAddress, buildMapUrl } from '../utils/geocode'
import BankFields, { validateBank } from '../components/BankFields'
import Icon from '../components/Icon'
import TimeSelect from '../components/TimeSelect'

export default function AddTurf({ user }) {
  const navigate = useNavigate()

  // plan
  const [planInfo, setPlanInfo] = useState(null)
  const [planLoading, setPlanLoading] = useState(true)

  // flow
  const [step, setStep] = useState('mode')      // 'mode' → 'form'
  const [payMode, setPayMode] = useState(null)  // 'venue' | 'online'
  const [bank, setBank] = useState({ businessType: 'individual' })
  const [bankErrs, setBankErrs] = useState({})

  // form
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
      setError('Please enter address and city first')
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
      setError('Could not find that location. Try a more specific address.')
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
        photos,
        paymentMode: payMode,
        payout: payMode === 'online' ? {
          businessType: bank.businessType || 'individual',
          businessName: bank.businessName,
          displayName: f.name,
          pan: bank.pan,
          gst: bank.gst || '',
          street: bank.street,
          city: bank.city,
          state: bank.state,
          postalCode: bank.postalCode,
          accountName: bank.accountName,
          accountNumber: bank.accountNumber,
          ifsc: bank.ifsc,
          bankName: bank.bankName
        } : undefined
      })
      navigate('/')
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  /* ══ Gates ══ */

  if (planLoading) {
    return <div className="page"><p className="muted">Checking your plan…</p></div>
  }

  if (!planInfo?.hasPlan) {
    return (
      <div className="gate">
        <div className="gate-mark"><Icon name="lock" size={26} /></div>
        <h1 className="gate-title">A plan is needed</h1>
        <p className="gate-sub">
          Listing a ground on TurfArena requires an active owner plan.
          Choose one and you can publish straight away.
        </p>

        <div className="gate-card">
          <p className="gate-card-label">Available plans</p>
          <div className="gate-row">
            <div>
              <p className="gate-row-name">
                <span className="a-badge a-badge-blue">
                  <Icon name="calendar" size={11} /> Monthly
                </span>
              </p>
              <p className="gate-row-meta">3 grounds · 30 days</p>
            </div>
            <span className="gate-row-price">₹2,500</span>
          </div>
          <div className="gate-row">
            <div>
              <p className="gate-row-name">
                <span className="a-badge a-badge-yellow">
                  <Icon name="star" size={11} filled /> Yearly
                </span>
                <span className="gate-badge">Best value</span>
              </p>
              <p className="gate-row-meta">6 grounds · 365 days</p>
            </div>
            <span className="gate-row-price">₹25,000</span>
          </div>
        </div>

        <button className="pp-cta" onClick={() => navigate('/plan')}>
          View plans <Icon name="arrow" size={17} />
        </button>
        <button className="btn-ghost" onClick={() => navigate('/')}>Back to home</button>
      </div>
    )
  }

  if (planInfo.turfsUsed >= planInfo.plan.turfLimit) {
    return (
      <div className="gate">
        <div className="gate-mark gate-mark-warn"><Icon name="alert" size={26} /></div>
        <h1 className="gate-title">You've used every slot</h1>
        <p className="gate-sub">
          Your {planInfo.plan.planType} plan covers {planInfo.plan.turfLimit} grounds,
          and all {planInfo.turfsUsed} are live. Remove one, or upgrade for more room.
        </p>

        <div className="gate-card">
          <div className="gate-row">
            <div>
              <p className="gate-row-name">Grounds listed</p>
              <p className="gate-row-meta">{planInfo.daysLeft} days left on this plan</p>
            </div>
            <span className="gate-row-price">
              {planInfo.turfsUsed}/{planInfo.plan.turfLimit}
            </span>
          </div>
        </div>

        <button className="pp-cta" onClick={() => navigate('/profile')}>
          Manage my grounds <Icon name="arrow" size={17} />
        </button>
        <button className="btn-ghost" onClick={() => navigate('/')}>Back to home</button>
      </div>
    )
  }

  /* ══ Step 1 — how do players pay? ══ */

  if (step === 'mode') {
    return (
      <div className="page pm-page">
        <header className="page-head">
          <h1>How will players pay?</h1>
          <p className="muted">You can change this later from your ground settings.</p>
        </header>

        <button className={'pm-card' + (payMode === 'venue' ? ' pm-card-on' : '')}
          onClick={() => setPayMode('venue')}>
          <div className="pm-card-head">
            <span className="pm-icon"><Icon name="wallet" size={22} /></span>
            <div>
              <p className="pm-title">Pay at the ground</p>
              <p className="pm-sub">Players reserve free, then pay you in person</p>
            </div>
            <span className={'rf-radio' + (payMode === 'venue' ? ' rf-radio-on' : '')} />
          </div>
          <ul className="pm-points">
            <li><Icon name="check" size={12} /> No bank details needed</li>
            <li><Icon name="check" size={12} /> You keep 100% — no commission</li>
            <li><Icon name="check" size={12} /> Start listing right away</li>
            <li className="pm-minus"><Icon name="alert" size={12} /> More no-shows, since nothing is paid upfront</li>
          </ul>
        </button>

        <button className={'pm-card' + (payMode === 'online' ? ' pm-card-on' : '')}
          onClick={() => setPayMode('online')}>
          <div className="pm-card-head">
            <span className="pm-icon pm-icon-alt"><Icon name="card" size={22} /></span>
            <div>
              <p className="pm-title">Online payment</p>
              <p className="pm-sub">Players pay in the app, money reaches your bank</p>
            </div>
            <span className={'rf-radio' + (payMode === 'online' ? ' rf-radio-on' : '')} />
          </div>
          <ul className="pm-points">
            <li><Icon name="check" size={12} /> Paid before they arrive — far fewer no-shows</li>
            <li><Icon name="check" size={12} /> Settled to your account automatically</li>
            <li><Icon name="check" size={12} /> Refunds handled for you</li>
            <li className="pm-minus"><Icon name="info" size={12} /> 10% platform commission per booking</li>
          </ul>
        </button>

        {payMode === 'online' && (
          <div className="pm-bank">
            <p className="pm-bank-title">Payout details</p>
            <p className="pm-bank-sub">
              Razorpay needs these to send money to your account. Everything is
              stored securely and used only for settlements.
            </p>
            <BankFields
              value={bank}
              onChange={setBank}
              errors={bankErrs}
              showConfirm
              mode="full"
            />
          </div>
        )}

        {error && <p className="error">{error}</p>}

        <button className="btn-primary" disabled={!payMode}
          onClick={() => {
            if (payMode === 'online') {
              const e = validateBank({ ...bank, confirmNumber: bank.confirmNumber }, 'full')
              setBankErrs(e)
              if (Object.keys(e).length) {
                setError('Please fix the highlighted fields')
                return
              }
            }
            setError('')
            setStep('form')
          }}>
          {payMode ? 'Continue' : 'Choose an option'}
        </button>
      </div>
    )
  }

  /* ══ Step 2 — the ground itself ══ */

  return (
    <div className="page">
      <button className="pm-change" onClick={() => setStep('mode')}>
        <Icon name="chevron" size={14} className="mg-back-icon" />
        {payMode === 'online' ? 'Online payment' : 'Pay at ground'} — change
      </button>

      <header className="page-head">
        <h1>List your ground</h1>
        <p className="muted">Players will see everything you enter here.</p>
      </header>

      <div className="at-banner">
        <span className="at-banner-dot" />
        <div>
          <p className="at-banner-title">
            {planInfo.plan.planType === 'monthly' ? 'Monthly' : 'Yearly'} plan active
          </p>
          <p className="at-banner-sub">
            {planInfo.turfsUsed} of {planInfo.plan.turfLimit} grounds used
            {' · '}{planInfo.daysLeft} days left
          </p>
        </div>
      </div>

      <form className="form" onSubmit={handleSubmit}>

        <label>Ground name *</label>
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
          placeholder="Street, area" required />

        <label>City *</label>
        <input value={f.city} onChange={e => upd('city', e.target.value)}
          placeholder="Mumbai, Bengaluru…" required />

        <button type="button" className="btn-locate"
          onClick={handleFindLocation} disabled={geocoding}>
          {geocoding
            ? 'Finding location…'
            : <><Icon name="pin" size={17} /> Find location from address</>}
        </button>

        {foundLocation && (
          <div className="location-found">
            <p className="success-note">
              <Icon name="check" size={14} /> Location found — {f.lat}, {f.lng}
            </p>
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
            <label>Latitude</label>
            <input value={f.lat} onChange={e => upd('lat', e.target.value)}
              placeholder="19.1364" />
          </div>
          <div>
            <label>Longitude</label>
            <input value={f.lng} onChange={e => upd('lng', e.target.value)}
              placeholder="72.8296" />
          </div>
        </div>

        <label>Price per hour (₹) *</label>
        <input type="number" value={f.price}
          onChange={e => upd('price', e.target.value)} required />

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

        <label>Amenities (comma separated)</label>
        <input value={f.amenities} onChange={e => upd('amenities', e.target.value)}
          placeholder="Floodlights, Parking, Washroom" />

        <label>Description</label>
        <textarea rows={3} value={f.description}
          onChange={e => upd('description', e.target.value)} />

        <label>Contact phone *</label>
        <input value={f.phone} onChange={e => upd('phone', e.target.value)} required />

        <div className="photos-section">
          <h3 className="at-photos-head">
            <Icon name="camera" size={18} /> Ground photos
            <span className="at-photos-count">up to 5</span>
          </h3>
          <p className="muted small" style={{ marginBottom: 12 }}>
            Paste image URLs. Leave blank to use a placeholder.
          </p>
          {[1, 2, 3, 4, 5].map(n => (
            <div key={n}>
              <label>Photo {n} {n === 1 ? '(Main)' : '(Optional)'}</label>
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
          {busy ? 'Publishing…' : 'Publish ground'}
        </button>
      </form>
    </div>
  )
}