import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { purchasePlan, fetchWallet } from '../utils/api'
import BankFields from '../components/BankFields'
import Icon from '../components/Icon'

const PLANS = [
  {
    id: 'monthly',
    name: 'Monthly',
    price: 2500,
    perMonth: 2500,
    period: 'per month',
    turfs: 3,
    days: 30,
    blurb: 'Good for a single ground or a first listing.',
    features: [
      'List up to 3 grounds',
      'Unlimited bookings each month',
      'Edit prices and photos anytime',
      'Cancel or renew whenever you like'
    ]
  },
  {
    id: 'yearly',
    name: 'Yearly',
    price: 25000,
    perMonth: 2084,
    period: 'per year',
    turfs: 6,
    days: 365,
    recommended: true,
    saving: 5000,
    blurb: 'For owners running multiple grounds year-round.',
    features: [
      'List up to 6 grounds',
      'Unlimited bookings all year',
      'Priority placement in search',
      'Two months free versus monthly'
    ]
  }
]

const MODES = [
  { id: 'turfwallet', label: 'Wallet',      icon: 'wallet' },
  { id: 'card',       label: 'Card',        icon: 'card' },
  { id: 'upi',        label: 'UPI',         icon: 'phone' },
  { id: 'netbanking', label: 'Net Banking', icon: 'bank' }
]

export default function PlanPurchase({ user }) {
  const navigate = useNavigate()
  const [picked, setPicked] = useState(PLANS[1])
  const [showPay, setShowPay] = useState(false)
  const [mode, setMode] = useState('turfwallet')
  const [cardNumber, setCardNumber] = useState('4242 4242 4242 4242')
  const [expiry, setExpiry] = useState('12/29')
  const [cvv, setCvv] = useState('123')
  const [upiId, setUpiId] = useState('')
  const [bankDetails, setBankDetails] = useState({})
  const [walletBal, setWalletBal] = useState(0)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(null)

  useEffect(() => {
    fetchWallet(user.id).then(r => setWalletBal(r.balance)).catch(() => {})
  }, [])

  const walletShort = walletBal < picked.price

  async function pay() {
    setBusy(true)
    setError('')
    setTimeout(async () => {
      try {
        const r = await purchasePlan({
          userId: user.id,
          planType: picked.id,
          paymentMethod: mode,
          cardNumber,
          upiId,
          bank: bankDetails.bankName
        })
        setDone(r)
        setShowPay(false)
      } catch (e) {
        setError(e.message)
        setBusy(false)
      }
    }, 1600)
  }

  if (done) {
    const exp = new Date(done.expiryDate).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'long', year: 'numeric'
    })
    return (
      <div className="pp-done">
        <div className="pp-done-mark"><Icon name="check" size={30} /></div>
        <h1 className="pp-done-title">You're all set</h1>
       <p className="pp-done-sub">
          Your {done.plan.planType} plan is active. Grounds you add will appear to
          players in {done.activationHours || 24} hours.
        </p>
        {done.needsSelection && (
          <div className="pl-warn" style={{ marginBottom: 16 }}>
            <Icon name="alert" size={16} />
            <div>
              <p className="pl-warn-title">You have more grounds than this plan covers</p>
              <p className="pl-warn-sub">
                {done.turfsUsed} listed, {done.plan.turfLimit} allowed — choose which stay live.
              </p>
            </div>
          </div>
        )}

        <div className="pp-done-card">
          <div className="pp-done-row">
            <span>Plan</span>
            <b>{done.plan.planType === 'yearly' ? 'Yearly' : 'Monthly'}</b>
          </div>
          <div className="pp-done-row"><span>Grounds allowed</span><b>{done.plan.turfLimit}</b></div>
          <div className="pp-done-row"><span>Active until</span><b>{exp}</b></div>
          <div className="pp-done-row">
            <span>Paid</span><b>₹{done.plan.price.toLocaleString('en-IN')}</b>
          </div>
          <div className="pp-done-row">
            <span>Reference</span><b className="mono">{done.plan.paymentId}</b>
          </div>
        </div>

        <button className="pp-cta"
          onClick={() => navigate(done.needsSelection ? '/select-grounds' : '/add-turf')}>
          {done.needsSelection ? 'Choose my grounds' : 'List your first ground'}
          <Icon name="arrow" size={17} />
        </button>
        
        <button className="btn-ghost" onClick={() => navigate('/')}>Back to home</button>
      </div>
    )
  }

  return (
    <div className="pp-page">
      <header className="pp-head">
        <p className="pp-eyebrow">For ground owners</p>
        <h1 className="pp-title">Put your ground<br />in front of players</h1>
        <p className="pp-sub">
          Choose a plan to start listing. Every plan includes unlimited bookings.
        </p>
      </header>

      <div className="pp-plans">
        {PLANS.map(p => {
          const on = picked.id === p.id
          return (
            <button key={p.id}
              className={'pp-plan' + (on ? ' pp-plan-on' : '') + (p.recommended ? ' pp-plan-rec' : '')}
              onClick={() => setPicked(p)}>

              {p.recommended && <span className="pp-tag">Most popular</span>}

              <div className="pp-plan-top">
                <div>
                  <p className="pp-plan-name">{p.name}</p>
                  <p className="pp-plan-blurb">{p.blurb}</p>
                </div>
                <span className={'pp-radio' + (on ? ' pp-radio-on' : '')}>
                  {on && <Icon name="check" size={13} />}
                </span>
              </div>

              <div className="pp-price">
                <span className="pp-price-cur">₹</span>
                <span className="pp-price-num">{p.price.toLocaleString('en-IN')}</span>
                <span className="pp-price-per">{p.period}</span>
              </div>

              {p.saving ? (
                <p className="pp-saving">
                  Works out to ₹{p.perMonth.toLocaleString('en-IN')}/month
                  <b> — save ₹{p.saving.toLocaleString('en-IN')}</b>
                </p>
              ) : (
                <p className="pp-saving pp-saving-plain">Billed monthly, cancel anytime</p>
              )}

              <ul className="pp-features">
                {p.features.map(f => (
                  <li key={f}>
                    <span className="pp-check"><Icon name="check" size={11} /></span>
                    {f}
                  </li>
                ))}
              </ul>
            </button>
          )
        })}
      </div>

      {error && <p className="error">{error}</p>}

      <div className="pp-foot">
        <p className="pp-foot-note">
          <Icon name="shield" size={14} /> Demo payment — no money is charged
        </p>
        <div className="pp-terms">
          <div className="pp-term">
            <Icon name="clock" size={15} />
            <span>Your grounds go live <b>24 hours</b> after purchase</span>
          </div>
          <div className="pp-term">
            <Icon name="undo" size={15} />
            <span>Cancel for a full refund within <b>24 hours</b> — locked after that</span>
          </div>
        </div>
        <button className="pp-cta" onClick={() => { setError(''); setShowPay(true) }}>
          Continue with {picked.name} — ₹{picked.price.toLocaleString('en-IN')}
        </button>
      </div>

      {showPay && (
        <div className="overlay" onClick={() => !busy && setShowPay(false)}>
          <div className="pay-card" onClick={e => e.stopPropagation()}>
            <div className="pay-head">
              <h2>Confirm your plan</h2>
              <button className="pay-close" disabled={busy} onClick={() => setShowPay(false)}>
                <Icon name="close" size={14} />
              </button>
            </div>

            <div className="pp-pay-summary">
              <div className="pp-pay-row">
                <span>{picked.name} plan</span>
                <b>₹{picked.price.toLocaleString('en-IN')}</b>
              </div>
              <div className="pp-pay-row pp-pay-muted">
                <span>{picked.turfs} grounds · {picked.days} days</span>
                <span>incl. all taxes</span>
              </div>
            </div>

            <p className="pay-mode-label">Payment method</p>
            <div className="pp-modes">
              {MODES.map(m => {
                const short = m.id === 'turfwallet' && walletShort
                return (
                  <button key={m.id} disabled={short}
                    className={'pp-mode' + (mode === m.id ? ' pp-mode-on' : '')
                      + (short ? ' pay-mode-short' : '')}
                    onClick={() => setMode(m.id)}>
                    <Icon name={m.icon} size={19} className="pp-mode-icon" />
                    <span>{m.label}</span>
                    {m.id === 'turfwallet' && (
                      <span className="pp-mode-bal">₹{walletBal.toLocaleString('en-IN')}</span>
                    )}
                  </button>
                )
              })}
            </div>

            {mode === 'turfwallet' && (
              <div className={'wl-pay-box' + (walletShort ? ' wl-pay-short' : '')}>
                <div className="wl-pay-row">
                  <span>Wallet balance</span><b>₹{walletBal.toLocaleString('en-IN')}</b>
                </div>
                <div className="wl-pay-row">
                  <span>This plan</span><b>−₹{picked.price.toLocaleString('en-IN')}</b>
                </div>
                <div className="wl-pay-row wl-pay-after">
                  <span>Balance after</span>
                  <b>₹{Math.max(0, walletBal - picked.price).toLocaleString('en-IN')}</b>
                </div>
                {walletShort && (
                  <button className="wl-topup-link" onClick={() => navigate('/wallet')}>
                    Short by ₹{(picked.price - walletBal).toLocaleString('en-IN')} — add money
                  </button>
                )}
              </div>
            )}

            {mode === 'card' && (<>
              <label className="pay-field-label">Card number</label>
              <input value={cardNumber} onChange={e => setCardNumber(e.target.value)} maxLength={19} />
              <div className="two-col">
                <div>
                  <label className="pay-field-label">Expiry</label>
                  <input value={expiry} onChange={e => setExpiry(e.target.value)} />
                </div>
                <div>
                  <label className="pay-field-label">CVV</label>
                  <input value={cvv} onChange={e => setCvv(e.target.value)} maxLength={4} />
                </div>
              </div>
            </>)}

            {mode === 'upi' && (<>
              <label className="pay-field-label">UPI ID</label>
              <input value={upiId} onChange={e => setUpiId(e.target.value)} placeholder="name@bank" />
            </>)}

            {mode === 'netbanking' && (
              <BankFields value={bankDetails} onChange={setBankDetails}
                errors={{}} mode="bank" />
            )}

            {error && <p className="error">{error}</p>}

           <div className="pp-confirm-note">
              <Icon name="alert" size={14} />
              <span>
                After 24 hours this plan cannot be cancelled or refunded.
              </span>
            </div>

            <button className="pp-cta"
              disabled={busy || (mode === 'turfwallet' && walletShort)}
              onClick={pay} style={{ marginTop: 16 }}>
              {busy ? 'Activating…' : `Pay ₹${picked.price.toLocaleString('en-IN')}`}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}