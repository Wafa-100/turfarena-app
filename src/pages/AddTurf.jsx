import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { createTurf, fetchPlanStatus } from '../utils/api'
import BankFields, { validateBank } from '../components/BankFields'
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

const STEPS = ['Basics', 'Details', 'Location', 'Payment']

export default function AddTurf({ user }) {
  const navigate = useNavigate()

  const [planInfo, setPlanInfo] = useState(null)
  const [planLoading, setPlanLoading] = useState(true)

  const [step, setStep] = useState(0)
  const [payMode, setPayMode] = useState(null)
  const [bank, setBank] = useState({ businessType: 'individual' })
  const [bankErrs, setBankErrs] = useState({})

  const [photos, setPhotos] = useState([])
  const [loc, setLoc] = useState({})
  const [amenities, setAmenities] = useState([])
  const [f, setF] = useState({
    name: '', sport: 'Football', price: '',
    openTime: '06:00', closeTime: '23:00',
    surface: '', size: '', description: '', phone: user.phone || ''
  })

  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(null)

  useEffect(() => {
    fetchPlanStatus(user.id)
      .then(setPlanInfo)
      .catch(() => setPlanInfo({ hasPlan: false }))
      .finally(() => setPlanLoading(false))
  }, [])

  const upd = (k, v) => setF(p => ({ ...p, [k]: v }))
  const toggleAmenity = a =>
    setAmenities(x => x.includes(a) ? x.filter(y => y !== a) : [...x, a])

  /* ══ Gates ══ */

  if (planLoading)
    return <div className="page"><p className="muted">Checking your plan…</p></div>

  if (!planInfo?.hasPlan) {
    return (
      <div className="gate">
        <div className="gate-mark"><Icon name="lock" size={26} /></div>
        <h1 className="gate-title">A plan is needed</h1>
        <p className="gate-sub">
          Listing a ground on TurfArena requires an active owner plan.
        </p>
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
          and all {planInfo.turfsUsed} are listed.
        </p>
        <button className="pp-cta" onClick={() => navigate('/profile')}>
          Manage my grounds <Icon name="arrow" size={17} />
        </button>
        <button className="btn-ghost" onClick={() => navigate('/')}>Back to home</button>
      </div>
    )
  }

  /* ══ Success ══ */

  if (done) {
    return (
      <div className="at-done">
        <div className="at-done-mark"><Icon name="check" size={30} /></div>
        <h1 className="at-done-title">{done.name} is listed</h1>
        <p className="at-done-sub">
          Your ground goes live for players in {done.goesLiveIn || 24} hours.
        </p>

        {done.photo && <img src={done.photo} alt="" className="at-done-img" />}

        <div className="pl-note" style={{ textAlign: 'left' }}>
          <Icon name="clock" size={16} />
          <div>
            <p className="pl-note-title">Why the wait?</p>
            <p className="pl-note-sub">
              New grounds go live 24 hours after your plan started — the same window
              in which you can cancel your plan for a full refund.
            </p>
          </div>
        </div>

        <button className="pp-cta" onClick={() => navigate(`/manage/${done._id}`)}>
          Set up slots and pricing <Icon name="arrow" size={17} />
        </button>
        <button className="btn-ghost" onClick={() => navigate('/profile')}>
          Back to my grounds
        </button>
      </div>
    )
  }

  /* ══ Validation ══ */

  function validateStep() {
    setError('')

    if (step === 0) {
      if (!f.name.trim()) { setError('Give your ground a name'); return false }
      if (!f.price || Number(f.price) <= 0) { setError('Set an hourly price'); return false }
      if (photos.length === 0) { setError('Add at least one photo'); return false }
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

    if (step === 3) {
      if (!payMode) { setError('Choose how players will pay'); return false }
      if (payMode === 'online') {
        const e = validateBank({ ...bank, confirmNumber: bank.accountNumber }, 'full')
        setBankErrs(e)
        if (Object.keys(e).length) { setError('Please fix the highlighted fields'); return false }
      }
      return true
    }

    return true
  }

  async function submit() {
    if (!validateStep()) return
    setBusy(true); setError('')
    try {
      const turf = await createTurf({
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
        photos,
        paymentMode: payMode,
        payout: payMode === 'online' ? {
          businessType: bank.businessType || 'individual',
          businessName: bank.businessName,
          displayName: f.name,
          pan: bank.pan,
          gst: bank.gst || '',
          street: bank.street, city: bank.city,
          state: bank.state, postalCode: bank.postalCode,
          accountName: bank.accountName,
          accountNumber: bank.accountNumber,
          ifsc: bank.ifsc,
          bankName: bank.bankName
        } : undefined
      })
      setDone(turf)
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  return (
    <div className="page at-page">

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
            <h1 className="at-title">Tell us about your ground</h1>
            <p className="at-sub">This is what players see first.</p>
          </header>

          <label className="at-label">Photos</label>
          <PhotoUpload photos={photos} onChange={setPhotos} max={5} />

          <label className="at-label">Ground name</label>
          <input value={f.name} onChange={e => upd('name', e.target.value)}
            placeholder="e.g. Green Field Arena" />

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
              onChange={e => upd('price', e.target.value)} placeholder="1200" />
            <span className="at-price-per">/ hour</span>
          </div>
          <p className="at-hint">
            You can set different rates for morning and evening later.
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
              <input value={f.surface} onChange={e => upd('surface', e.target.value)}
                placeholder="Artificial grass" />
            </div>
            <div>
              <label className="at-label">Size</label>
              <input value={f.size} onChange={e => upd('size', e.target.value)}
                placeholder="40m x 20m" />
            </div>
          </div>

          <label className="at-label">Contact number</label>
          <div className="au-phone-wrap">
            <span className="au-phone-code">+91</span>
            <input className="au-phone-input" inputMode="numeric"
              value={f.phone}
              onChange={e => upd('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
              placeholder="9876543210" maxLength={10} />
            <span className={'au-phone-count' + (f.phone.length === 10 ? ' au-count-ok' : '')}>
              {f.phone.length}/10
            </span>
          </div>

          <label className="at-label">
            Description <span className="at-optional">optional</span>
          </label>
          <textarea rows={3} value={f.description}
            onChange={e => upd('description', e.target.value)}
            placeholder="What makes your ground worth booking?" />
        </>
      )}

      {/* ══ 2 — LOCATION ══ */}
      {step === 2 && (
        <>
          <header className="at-head">
            <h1 className="at-title">Where can players find you?</h1>
            <p className="at-sub">
              An accurate pin means fewer confused players calling you.
            </p>
          </header>

          <AddressPicker value={loc} onChange={setLoc} />
        </>
      )}

      {/* ══ 3 — PAYMENT ══ */}
      {step === 3 && (
        <>
          <header className="at-head">
            <h1 className="at-title">How will players pay?</h1>
            <p className="at-sub">You can change this later from your ground settings.</p>
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
              <li className="pm-minus"><Icon name="alert" size={12} /> More no-shows</li>
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
              <li><Icon name="check" size={12} /> Paid before they arrive</li>
              <li><Icon name="check" size={12} /> Settled automatically</li>
              <li className="pm-minus"><Icon name="info" size={12} /> 10% platform commission</li>
            </ul>
          </button>

          {payMode === 'online' && (
            <div className="pm-bank">
              <p className="pm-bank-title">Payout details</p>
              <p className="pm-bank-sub">
                Razorpay needs these to send money to your account.
              </p>
              <BankFields value={bank} onChange={setBank} errors={bankErrs} mode="full" />
            </div>
          )}
        </>
      )}

      {error && <p className="error">{error}</p>}

      <div className="at-nav">
        {step > 0 && (
          <button className="at-back" onClick={() => { setStep(step - 1); setError('') }}>
            Back
          </button>
        )}
        {step < 3 ? (
          <button className="at-next" onClick={() => validateStep() && setStep(step + 1)}>
            Continue <Icon name="arrow" size={16} />
          </button>
        ) : (
          <button className="at-next" disabled={busy} onClick={submit}>
            {busy ? 'Publishing…' : 'Publish ground'}
          </button>
        )}
      </div>
    </div>
  )
}