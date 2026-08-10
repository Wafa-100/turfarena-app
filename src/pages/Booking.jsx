import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { fetchTurf, fetchBookedSlots, demoPay } from '../utils/api'
import { generateSlots, getNext7Days, isPastSlot, prettyDate } from '../utils/slots'
import { priceForSlot, totalForSlots } from '../utils/pricing'
import Icon from '../components/Icon'

const BANKS = ['SBI', 'HDFC Bank', 'ICICI Bank', 'Axis Bank', 'Kotak Bank']
const WALLETS = ['Paytm', 'PhonePe', 'Google Pay', 'Amazon Pay']
const MODES = [
  { id: 'card',       label: 'Card',        icon: 'card' },
  { id: 'upi',        label: 'UPI',         icon: 'phone' },
  { id: 'netbanking', label: 'Net Banking', icon: 'bank' },
  { id: 'wallet',     label: 'Wallet',      icon: 'wallet' }
]

export default function Booking({ user }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const days = getNext7Days()

  const [turf, setTurf] = useState(null)
  const [taken, setTaken] = useState([])
  const [blockedInfo, setBlockedInfo] = useState([])
  const [date, setDate] = useState(days[0].iso)
  const [picked, setPicked] = useState([])
  const [error, setError] = useState('')

  const [showPay, setShowPay] = useState(false)
  const [mode, setMode] = useState('card')
  const [cardName, setCardName] = useState(user.name)
  const [cardNumber, setCardNumber] = useState('4242 4242 4242 4242')
  const [expiry, setExpiry] = useState('12/29')
  const [cvv, setCvv] = useState('123')
  const [upiId, setUpiId] = useState('')
  const [bank, setBank] = useState(BANKS[0])
  const [wallet, setWallet] = useState(WALLETS[0])
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    fetchTurf(id).then(setTurf).catch(e => setError(e.message))
  }, [id])

  useEffect(() => {
    if (!turf) return
    fetchBookedSlots(turf._id, date)
      .then(r => {
        // new shape { booked, blocked, all } — old shape was a plain array
        if (Array.isArray(r)) { setTaken(r); setBlockedInfo([]) }
        else { setTaken(r.all || []); setBlockedInfo(r.blocked || []) }
      })
      .catch(() => { setTaken([]); setBlockedInfo([]) })
  }, [turf, date])

  if (!turf) return <div className="page"><p className="muted">{error || 'Loading…'}</p></div>

  const slots = generateSlots(turf.openTime, turf.closeTime)
  const total = totalForSlots(turf, picked)
  const closed = turf.isOpen === false

  function toggle(slot) {
    setPicked(p => p.includes(slot) ? p.filter(s => s !== slot) : [...p, slot])
  }

  const sorted = [...picked].sort((a, b) => parseInt(a, 10) - parseInt(b, 10))

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

      <div className="bk-turf-strip">
        <img src={turf.photo || turf.photos?.[0]} alt="" className="bk-turf-img"
          onError={e => { e.target.style.display = 'none' }} />
        <div>
          <h1 className="bk-turf-name">{turf.name}</h1>
          <p className="bk-turf-meta">{turf.sport} · {turf.city}</p>
          <p className="bk-turf-rate">
            {turf.pricingMode === 'bands' ? 'from ' : ''}₹{turf.price} <span>per hour</span>
          </p>
        </div>
      </div>

      {closed && (
        <div className="bk-closed">
          <Icon name="lock" size={20} />
          <div>
            <p className="bk-closed-title">This ground is closed</p>
            <p className="bk-closed-sub">
              {turf.closedNote || 'The owner has paused bookings. Check back soon.'}
            </p>
          </div>
        </div>
      )}

      <div className="bk-section">
        <div className="bk-section-head">
          <h2 className="bk-label">Select date</h2>
          <span className="bk-hint">Next 7 days</span>
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

      <div className="bk-section">
        <div className="bk-section-head">
          <h2 className="bk-label">Choose your hours</h2>
          <span className="bk-hint">Tap to select multiple</span>
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
            const off = isTaken || isPast || closed
            const on = picked.includes(s)
            const blocked = blockedInfo.find(b => b.slot === s)

            return (
              <button key={s} disabled={off}
                className={'bk-slot' + (on ? ' bk-slot-on' : '') + (off ? ' bk-slot-off' : '')}
                onClick={() => toggle(s)}>
                <span className="bk-slot-time">{s}</span>
                <span className="bk-slot-cost">₹{priceForSlot(turf, s)}</span>
                {blocked && <span className="bk-slot-note">Unavailable</span>}
                {!blocked && isTaken && <span className="bk-slot-note">Booked</span>}
                {!isTaken && !blocked && isPast && <span className="bk-slot-note">Passed</span>}
                {on && <span className="bk-slot-tick"><Icon name="check" size={11} /></span>}
              </button>
            )
          })}
        </div>
      </div>

      {picked.length > 0 && (
        <div className="summary-card">
          <p><Icon name="calendar" size={14} /> {prettyDate(date)}</p>
          <p><Icon name="clock" size={14} /> {sorted.join(' · ')}</p>
          <p><Icon name="rupee" size={14} /> Total: <b>₹{total.toLocaleString('en-IN')}</b></p>
        </div>
      )}

      {error && !showPay && <p className="error">{error}</p>}
      <div style={{ height: picked.length ? 160 : 20 }} />

      {picked.length > 0 && (
        <div className="bk-bar">
          <div className="bk-bar-inner">
            <div className="bk-bar-top">
              <div>
                <p className="bk-bar-count">
                  {picked.length} hour{picked.length > 1 ? 's' : ''} selected
                </p>
                <p className="bk-bar-slots">{sorted.join(' · ')}</p>
              </div>
              <button className="bk-clear" onClick={() => setPicked([])}>Clear</button>
            </div>
            <div className="bk-bar-bottom">
              <div>
                <p className="bk-bar-tlabel">Total</p>
                <p className="bk-bar-total">₹{total.toLocaleString('en-IN')}</p>
                <p className="bk-bar-calc">
                  {picked.length} hour{picked.length > 1 ? 's' : ''}
                  {turf.pricingMode === 'bands' ? ' · rates vary by time' : ` × ₹${turf.price}`}
                </p>
              </div>
              <button className="bk-pay" onClick={() => { setError(''); setShowPay(true) }}>
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {showPay && (
        <div className="overlay">
          <div className="pay-card">
            <div className="pay-head">
              <h2>Complete payment</h2>
              <button className="pay-close" onClick={() => setShowPay(false)}>
                <Icon name="close" size={14} />
              </button>
            </div>

            <div className="pay-summary">
              <div className="pay-sum-row"><span>{turf.name}</span><span>{prettyDate(date)}</span></div>
              <div className="pay-slot-chips">
                {sorted.map(s => (
                  <span key={s} className="pay-chip">
                    {s} <b>₹{priceForSlot(turf, s)}</b>
                  </span>
                ))}
              </div>
              <div className="pay-sum-row pay-sum-total">
                <span>{picked.length} hour{picked.length > 1 ? 's' : ''}</span>
                <b>₹{total.toLocaleString('en-IN')}</b>
              </div>
            </div>

            <div className="demo-note">Demo payment — no real money is charged</div>

            <p className="pay-mode-label">Payment method</p>
            <div className="pay-mode-grid">
              {MODES.map(m => (
                <button key={m.id} className={'pay-mode-btn' + (mode === m.id ? ' pay-mode-active' : '')}
                  onClick={() => setMode(m.id)}>
                  <Icon name={m.icon} size={19} className="pay-mode-icon" />
                  <p style={{ fontSize: 11.5, marginTop: 5, fontWeight: 600 }}>{m.label}</p>
                </button>
              ))}
            </div>

            {mode === 'card' && (<>
              <label className="pay-field-label">Name on card</label>
              <input value={cardName} onChange={e => setCardName(e.target.value)} />
              <label className="pay-field-label">Card number</label>
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
              <label className="pay-field-label">Select your bank</label>
              <select value={bank} onChange={e => setBank(e.target.value)}>
                {BANKS.map(b => <option key={b}>{b}</option>)}
              </select>
            </>)}
            {mode === 'wallet' && (<>
              <label className="pay-field-label">Choose wallet</label>
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