import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { fetchTurf, fetchBookedSlots, demoPay } from '../utils/api'
import { generateSlots, getNext7Days, isPastSlot, prettyDate } from '../utils/slots'

const BANKS = ['SBI', 'HDFC Bank', 'ICICI Bank', 'Axis Bank', 'Kotak Bank']
const WALLETS = ['Paytm', 'PhonePe', 'Google Pay', 'Amazon Pay']
const MODES = [
  { id: 'card', label: 'Card', icon: '💳' },
  { id: 'upi', label: 'UPI', icon: '📱' },
  { id: 'netbanking', label: 'Net Banking', icon: '🏦' },
  { id: 'wallet', label: 'Wallet', icon: '👛' }
]

export default function Booking({ user }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const days = getNext7Days()

  const [turf, setTurf] = useState(null)
  const [taken, setTaken] = useState([])
  const [date, setDate] = useState(days[0].iso)
  const [picked, setPicked] = useState([])          // ← ARRAY of slots now
  const [error, setError] = useState('')

  const [showPay, setShowPay] = useState(false)
  const [mode, setMode] = useState('card')
  const [cardName, setCardName] = useState(user.name)
  const [cardNumber, setCardNumber] = useState('')
  const [expiry, setExpiry] = useState('')
  const [cvv, setCvv] = useState('')
  const [upiId, setUpiId] = useState('')
  const [bank, setBank] = useState(BANKS[0])
  const [wallet, setWallet] = useState(WALLETS[0])
  const [processing, setProcessing] = useState(false)

  useEffect(() => { fetchTurf(id).then(setTurf).catch(e => setError(e.message)) }, [id])
  useEffect(() => {
    if (!turf) return
    fetchBookedSlots(turf._id, date).then(setTaken).catch(() => setTaken([]))
  }, [turf, date])

  if (!turf) return <div className="page"><p className="muted">{error || 'Loading…'}</p></div>

  const slots = generateSlots(turf.openTime, turf.closeTime)
  const total = turf.price * picked.length

  // toggle a slot on/off
  function toggle(slot) {
    setPicked(p => p.includes(slot) ? p.filter(s => s !== slot) : [...p, slot])
  }

  // sort picked slots by start hour so the summary reads in order
  const sorted = [...picked].sort((a, b) =>
    parseInt(a.split(':')[0], 10) - parseInt(b.split(':')[0], 10)
  )

  async function pay() {
    setProcessing(true); setError('')
    setTimeout(async () => {
      try {
        const result = await demoPay({
          turfId: turf._id, date, slots: sorted, userId: user.id,
          paymentMode: mode, cardNumber, upiId, bank, wallet
        })
        navigate('/confirmation', { state: result })
      } catch (err) { setError(err.message); setProcessing(false) }
    }, 1600)
  }

  return (
    <div className="page bk-page">
      {/* Turf strip */}
      <div className="bk-turf-strip">
        <img src={turf.photo || turf.photos?.[0]} alt="" className="bk-turf-img"
          onError={e => { e.target.style.display = 'none' }} />
        <div>
          <h1 className="bk-turf-name">{turf.name}</h1>
          <p className="bk-turf-meta">{turf.sport} · {turf.city}</p>
          <p className="bk-turf-rate">₹{turf.price} <span>Per Hour</span></p>
        </div>
      </div>

      {/* Date picker */}
      <div className="bk-section">
        <div className="bk-section-head">
          <h2 className="bk-label">Select Date</h2>
          <span className="bk-hint">Next 7 Days</span>
        </div>
        <div className="bk-date-row">
          {days.map(d => {
            const on = date === d.iso
            const [wd, dd] = d.label.split(', ')
            return (
              <button key={d.iso} className={'bk-date' + (on ? ' bk-date-on' : '')}
                onClick={() => { setDate(d.iso); setPicked([]) }}>
                <span className="bk-date-wd">{d.isToday ? 'TODAY' : wd.toUpperCase()}</span>
                <span className="bk-date-dd">{dd ? dd.split(' ')[0] : ''}</span>
                <span className="bk-date-mo">{dd ? dd.split(' ')[1] : ''}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Slots */}
      <div className="bk-section">
        <div className="bk-section-head">
          <h2 className="bk-label">Choose Your Hours</h2>
          <span className="bk-hint">Tap To Select Multiple Slots</span>
        </div>

        <div className="bk-legend">
          <span><i className="bk-dot bk-dot-free" /> Available</span>
          <span><i className="bk-dot bk-dot-sel" /> Selected</span>
          <span><i className="bk-dot bk-dot-gone" /> Unavailable</span>
        </div>

        <div className="bk-slots">
          {slots.map(s => {
            const isTaken = taken.includes(s)
            const isPast = isPastSlot(date, s)
            const off = isTaken || isPast
            const on = picked.includes(s)
            return (
              <button key={s} disabled={off}
                className={'bk-slot' + (on ? ' bk-slot-on' : '') + (off ? ' bk-slot-off' : '')}
                onClick={() => toggle(s)}>
                <span className="bk-slot-time">{s}</span>
                {isTaken && <span className="bk-slot-note">Booked</span>}
                {!isTaken && isPast && <span className="bk-slot-note">Passed</span>}
                {on && <span className="bk-slot-tick">✓</span>}
              </button>
            )
          })}
        </div>
      </div>

      {error && !showPay && <p className="error">{error}</p>}
      <div style={{ height: picked.length ? 150 : 20 }} />

      {/* Sticky summary bar */}
      {picked.length > 0 && (
        <div className="bk-bar">
          <div className="bk-bar-inner">
            <div className="bk-bar-top">
              <div>
                <p className="bk-bar-count">
                  {picked.length} Hour{picked.length > 1 ? 's' : ''} Selected
                </p>
                <p className="bk-bar-slots">{sorted.join(' · ')}</p>
              </div>
              <button className="bk-clear" onClick={() => setPicked([])}>Clear</button>
            </div>
            <div className="bk-bar-bottom">
              <div>
                <p className="bk-bar-tlabel">Total</p>
                <p className="bk-bar-total">₹{total.toLocaleString('en-IN')}</p>
                <p className="bk-bar-calc">₹{turf.price} × {picked.length}</p>
              </div>
              <button className="bk-pay" onClick={() => { setError(''); setShowPay(true) }}>
                Continue To Pay
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment sheet */}
      {showPay && (
        <div className="overlay">
          <div className="pay-card">
            <div className="pay-head">
              <h2>Complete Payment</h2>
              <button className="pay-close" onClick={() => setShowPay(false)}>✕</button>
            </div>

            <div className="pay-summary">
              <div className="pay-sum-row"><span>{turf.name}</span><span>{prettyDate(date)}</span></div>
              <div className="pay-slot-chips">
                {sorted.map(s => <span key={s} className="pay-chip">{s}</span>)}
              </div>
              <div className="pay-sum-row pay-sum-total">
                <span>{picked.length} Hour{picked.length > 1 ? 's' : ''} × ₹{turf.price}</span>
                <b>₹{total.toLocaleString('en-IN')}</b>
              </div>
            </div>

            <div className="demo-note">Online Payment — All Payments Are Fully Secured</div>

            <p className="pay-mode-label">Payment Method</p>
            <div className="pay-mode-grid">
              {MODES.map(m => (
                <button key={m.id} className={'pay-mode-btn' + (mode === m.id ? ' pay-mode-active' : '')}
                  onClick={() => setMode(m.id)}>
                  <span style={{ fontSize: 19 }}>{m.icon}</span>
                  <p style={{ fontSize: 11.5, marginTop: 4, fontWeight: 600 }}>{m.label}</p>
                </button>
              ))}
            </div>

            {mode === 'card' && (<>
              <label className="pay-field-label">Name On Card</label>
              <input value={cardName} onChange={e => setCardName(e.target.value)} />
              <label className="pay-field-label">Card Number</label>
              <input value={cardNumber} onChange={e => setCardNumber(e.target.value)} maxLength={19} />
              <div className="two-col">
                <div><label className="pay-field-label">Expiry</label>
                  <input value={expiry} onChange={e => setExpiry(e.target.value)} placeholder="MM/YY" /></div>
                <div><label className="pay-field-label">CVV</label>
                  <input value={cvv} onChange={e => setCvv(e.target.value)} maxLength={4} /></div>
              </div>
            </>)}
            {mode === 'upi' && (<>
              <label className="pay-field-label">UPI ID</label>
              <input value={upiId} onChange={e => setUpiId(e.target.value)} placeholder="yourname@paytm" />
            </>)}
            {mode === 'netbanking' && (<>
              <label className="pay-field-label">Select Your Bank</label>
              <select value={bank} onChange={e => setBank(e.target.value)}>
                {BANKS.map(b => <option key={b}>{b}</option>)}
              </select>
            </>)}
            {mode === 'wallet' && (<>
              <label className="pay-field-label">Choose Wallet</label>
              <div className="wallet-grid">
                {WALLETS.map(w => (
                  <button key={w} className={'wallet-btn' + (wallet === w ? ' wallet-active' : '')}
                    onClick={() => setWallet(w)}>{w}</button>
                ))}
              </div>
            </>)}

            {error && <p className="error">{error}</p>}
            <button className="btn-primary" disabled={processing} onClick={pay}>
              {processing ? 'Processing…' : `Pay ₹${total.toLocaleString('en-IN')}`}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}