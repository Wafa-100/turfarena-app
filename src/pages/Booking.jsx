import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { fetchTurf, fetchBookedSlots, demoPay, fetchWallet } from '../utils/api'
import { generateSlots, getNext7Days, isPastSlot, prettyDate } from '../utils/slots'
import { priceForSlot, totalForSlots } from '../utils/pricing'
import BankFields from '../components/BankFields'
import Icon from '../components/Icon'

const MODES = [
  { id: 'turfwallet', label: 'Wallet',      icon: 'wallet' },
  { id: 'card',       label: 'Card',        icon: 'card' },
  { id: 'upi',        label: 'UPI',         icon: 'phone' },
  { id: 'netbanking', label: 'Net Banking', icon: 'bank' }
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

  const [walletBal, setWalletBal] = useState(0)
  const [showPay, setShowPay] = useState(false)
  const [mode, setMode] = useState('turfwallet')
  const [cardName, setCardName] = useState(user.name)
  const [cardNumber, setCardNumber] = useState('4242 4242 4242 4242')
  const [expiry, setExpiry] = useState('12/29')
  const [cvv, setCvv] = useState('123')
  const [upiId, setUpiId] = useState('')
  const [bankDetails, setBankDetails] = useState({})
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    fetchTurf(id).then(setTurf).catch(e => setError(e.message))
    fetchWallet(user.id).then(r => setWalletBal(r.balance)).catch(() => {})
  }, [id])

  useEffect(() => {
    if (!turf) return
    fetchBookedSlots(turf._id, date)
      .then(r => {
        if (Array.isArray(r)) { setTaken(r); setBlockedInfo([]) }
        else { setTaken(r.all || []); setBlockedInfo(r.blocked || []) }
      })
      .catch(() => { setTaken([]); setBlockedInfo([]) })
  }, [turf, date])

  if (!turf) return <div className="page"><p className="muted">{error || 'Loading…'}</p></div>

  const slots = generateSlots(turf.openTime, turf.closeTime)
  const total = totalForSlots(turf, picked)
  const closed = turf.isOpen === false
  const isVenue = turf.paymentMode === 'venue'
  const walletShort = walletBal < total

  function toggle(slot) {
    setPicked(p => p.includes(slot) ? p.filter(s => s !== slot) : [...p, slot])
  }

  const sorted = [...picked].sort((a, b) => parseInt(a, 10) - parseInt(b, 10))

  async function pay() {
    setProcessing(true)
    setError('')
    setTimeout(async () => {
      try {
        const result = await demoPay({
          turfId: turf._id, date, slots: sorted, userId: user.id,
          paymentMode: mode,
          cardNumber, upiId,
          bank: bankDetails.bankName,
          accountNumber: bankDetails.accountNumber,
          ifsc: bankDetails.ifsc,
          accountName: bankDetails.accountName
        })
        navigate('/confirmation', { state: result })
      } catch (err) {
        setError(err.message)
        setProcessing(false)
      }
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

      {isVenue && !closed && (
        <div className="bk-venue">
          <Icon name="wallet" size={19} />
          <div>
            <p className="bk-venue-title">Pay at the ground</p>
            <p className="bk-venue-sub">
              Reserve your hours free now, and pay the owner directly when you arrive.
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
                <p className="bk-bar-tlabel">{isVenue ? 'Due at ground' : 'Total'}</p>
                <p className="bk-bar-total">₹{total.toLocaleString('en-IN')}</p>
                <p className="bk-bar-calc">
                  {picked.length} hour{picked.length > 1 ? 's' : ''}
                  {turf.pricingMode === 'bands' ? ' · rates vary by time' : ` × ₹${turf.price}`}
                </p>
              </div>
              <button className="bk-pay" onClick={() => { setError(''); setShowPay(true) }}>
                {isVenue ? 'Reserve' : 'Continue'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showPay && (
        <div className="overlay">
          <div className="pay-card">
            <div className="pay-head">
              <h2>{isVenue ? 'Confirm reservation' : 'Complete payment'}</h2>
              <button className="pay-close" onClick={() => setShowPay(false)}>
                <Icon name="close" size={14} />
              </button>
            </div>

            <div className="pay-summary">
              <div className="pay-sum-row">
                <span>{turf.name}</span><span>{prettyDate(date)}</span>
              </div>
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

            {isVenue ? (
              <>
                <div className="bk-venue-box">
                  <Icon name="info" size={18} />
                  <div>
                    <p className="bk-venue-box-title">
                      ₹{total.toLocaleString('en-IN')} due at the ground
                    </p>
                    <p className="bk-venue-box-sub">
                      Nothing is charged now. Show your booking ID and pay the owner
                      when you arrive.
                    </p>
                  </div>
                </div>

                {error && <p className="error">{error}</p>}
                <button className="btn-primary" disabled={processing} onClick={pay}>
                  {processing ? 'Reserving…' : 'Confirm reservation'}
                </button>
              </>
            ) : (
              <>
                <div className="demo-note">Demo payment — no real money is charged</div>

                <p className="pay-mode-label">Payment method</p>
                <div className="pay-mode-grid">
                  {MODES.map(m => {
                    const short = m.id === 'turfwallet' && walletShort
                    return (
                      <button key={m.id} disabled={short}
                        className={'pay-mode-btn'
                          + (mode === m.id ? ' pay-mode-active' : '')
                          + (short ? ' pay-mode-short' : '')}
                        onClick={() => setMode(m.id)}>
                        <Icon name={m.icon} size={19} className="pay-mode-icon" />
                        <p style={{ fontSize: 11.5, marginTop: 5, fontWeight: 600 }}>{m.label}</p>
                        {m.id === 'turfwallet' && (
                          <p className="pay-mode-bal">₹{walletBal.toLocaleString('en-IN')}</p>
                        )}
                      </button>
                    )
                  })}
                </div>

                {mode === 'turfwallet' && (
                  <div className={'wl-pay-box' + (walletShort ? ' wl-pay-short' : '')}>
                    <div className="wl-pay-row">
                      <span>Wallet balance</span>
                      <b>₹{walletBal.toLocaleString('en-IN')}</b>
                    </div>
                    <div className="wl-pay-row">
                      <span>This booking</span>
                      <b>−₹{total.toLocaleString('en-IN')}</b>
                    </div>
                    <div className="wl-pay-row wl-pay-after">
                      <span>Balance after</span>
                      <b>₹{Math.max(0, walletBal - total).toLocaleString('en-IN')}</b>
                    </div>
                    {walletShort && (
                      <button className="wl-topup-link" onClick={() => navigate('/wallet')}>
                        Short by ₹{(total - walletBal).toLocaleString('en-IN')} — add money
                      </button>
                    )}
                  </div>
                )}

                {mode === 'card' && (<>
                  <label className="pay-field-label">Name on card</label>
                  <input value={cardName} onChange={e => setCardName(e.target.value)} />
                  <label className="pay-field-label">Card number</label>
                  <input value={cardNumber} onChange={e => setCardNumber(e.target.value)} maxLength={19} />
                  <div className="two-col">
                    <div>
                      <label className="pay-field-label">Expiry</label>
                      <input value={expiry} onChange={e => setExpiry(e.target.value)} placeholder="MM/YY" />
                    </div>
                    <div>
                      <label className="pay-field-label">CVV</label>
                      <input value={cvv} onChange={e => setCvv(e.target.value)} maxLength={4} />
                    </div>
                  </div>
                </>)}

                {mode === 'upi' && (<>
                  <label className="pay-field-label">UPI ID</label>
                  <input value={upiId} onChange={e => setUpiId(e.target.value)}
                    placeholder="yourname@paytm" />
                </>)}

                {mode === 'netbanking' && (
                  <BankFields value={bankDetails} onChange={setBankDetails}
                    errors={{}} mode="bank" />
                )}

                {error && <p className="error">{error}</p>}
                <button className="btn-primary"
                  disabled={processing || (mode === 'turfwallet' && walletShort)}
                  onClick={pay}>
                  {processing ? 'Processing…' : `Pay ₹${total.toLocaleString('en-IN')}`}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}