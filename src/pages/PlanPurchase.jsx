import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { purchasePlan } from '../utils/api'

const PLANS = [
  {
    id: 'monthly',
    label: 'Monthly Plan',
    price: 500,
    duration: '30 days',
    turfLimit: 3,
    icon: '📅',
    color: '#3b82f6',
    features: ['Add Up To 3 Turfs', 'Active For 30 Days', 'Turfs Hidden After Expiry', 'Renew Anytime']
  },
  {
    id: 'yearly',
    label: 'Yearly Plan',
    price: 4500,
    duration: '365 days',
    turfLimit: 6,
    icon: '⭐',
    color: '#f59e0b',
    features: ['Add Up To 6 Turfs', 'Active For 365 Days', 'Best Value — Save 17%', 'Priority Listing'],
    popular: true
  }
]

const BANKS = ['SBI', 'HDFC Bank', 'ICICI Bank', 'Axis Bank', 'Kotak Bank']
const WALLETS = ['Paytm', 'PhonePe', 'Google Pay', 'Amazon Pay']

export default function PlanPurchase({ user }) {
  const navigate = useNavigate()
  const [selected, setSelected] = useState(null)
  const [showPay, setShowPay] = useState(false)
  const [payMode, setPayMode] = useState('card')
  const [cardNumber, setCardNumber] = useState('')
  const [expiry, setExpiry] = useState('')
  const [cvv, setCvv] = useState('')
  const [upiId, setUpiId] = useState('')
  const [bank, setBank] = useState(BANKS[0])
  const [wallet, setWallet] = useState(WALLETS[0])
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(null)

  async function handlePay() {
    setProcessing(true)
    setError('')
    setTimeout(async () => {
      try {
        const result = await purchasePlan({
          userId: user.id,
          planType: selected.id,
          paymentMethod: payMode,
          cardNumber, upiId, bank, wallet
        })
        setSuccess(result)
        setShowPay(false)
      } catch (err) {
        setError(err.message)
        setProcessing(false)
      }
    }, 1800)
  }

  if (success) {
    const exp = new Date(success.expiryDate).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'long', year: 'numeric'
    })
    return (
      <div className="page center-page">
        <div className="success-tick">✓</div>
        <h1>Plan Activated!</h1>
        <p className="muted">You Can Now Add Turfs To Turf Arena.</p>
        <div className="plan-success-card">
          <p className="plan-success-type">
            {success.plan.planType === 'monthly' ? '📅 Monthly Plan' : '⭐ Yearly Plan'}
          </p>
          <ul className="detail-list">
            <li><span>Turfs Allowed</span><b>{success.plan.turfLimit}</b></li>
            <li><span>Expires On</span><b>{exp}</b></li>
            <li><span>Amount Paid</span><b>₹{success.plan.price}</b></li>
            <li><span>Payment ID</span><b>{success.plan.paymentId}</b></li>
          </ul>
        </div>
        <button className="btn-primary" onClick={() => navigate('/add-turf')}>
          Add Your First Turf →
        </button>
        <button className="btn-ghost" onClick={() => navigate('/')}>Back To Home</button>
      </div>
    )
  }

  return (
    <div className="page">
      <header className="page-head">
        <h1>Choose A Plan</h1>
        <p className="muted">Purchase A Plan To Start Listing Your Turfs</p>
      </header>

      {/* Plan cards */}
      {PLANS.map(plan => (
        <div key={plan.id}
          className={'plan-card' + (selected?.id === plan.id ? ' plan-card-selected' : '')}
          style={{ borderColor: selected?.id === plan.id ? plan.color : undefined }}
          onClick={() => setSelected(plan)}>
          {plan.popular && <div className="plan-popular">BEST VALUE</div>}
          <div className="plan-card-top">
            <span className="plan-icon">{plan.icon}</span>
            <div>
              <h3>{plan.label}</h3>
              <p className="muted small">{plan.duration} · {plan.turfLimit} Turfs</p>
            </div>
            <div className="plan-price-badge" style={{ background: plan.color }}>
              ₹{plan.price.toLocaleString('en-IN')}
            </div>
          </div>
          <ul className="plan-features">
            {plan.features.map(f => (
              <li key={f}><span className="plan-check">✓</span> {f}</li>
            ))}
          </ul>
          <div className={'plan-select-ring' + (selected?.id === plan.id ? ' plan-select-ring-active' : '')}
            style={{ borderColor: plan.color, background: selected?.id === plan.id ? plan.color : undefined }}>
            {selected?.id === plan.id && '✓'}
          </div>
        </div>
      ))}

      {error && <p className="error">{error}</p>}

      <button className="btn-primary" disabled={!selected}
        onClick={() => { setError(''); setShowPay(true) }}>
        {selected ? `Buy ${selected.label} — ₹${selected.price.toLocaleString('en-IN')}` : 'Select A Plan'}
      </button>

      {/* Demo payment overlay */}
      {showPay && selected && (
        <div className="overlay">
          <div className="pay-card">
            <h2 style={{ textAlign: 'center' }}>Online Payment</h2>
            <p className="pay-amount">₹{selected.price.toLocaleString('en-IN')}</p>
            <p className="muted small" style={{ textAlign: 'center' }}>{selected.label} · {selected.duration}</p>
            <div className="demo-note">
              🔒 Online Payment — All Payments Are Secured.
            </div>

            <div className="pay-mode-grid">
              {[{id:'card',l:'Card',i:'💳'},{id:'upi',l:'UPI',i:'📱'},{id:'netbanking',l:'Net Banking',i:'🏦'},{id:'wallet',l:'Wallet',i:'👛'}].map(m => (
                <button key={m.id} className={'pay-mode-btn' + (payMode === m.id ? ' pay-mode-active' : '')}
                  onClick={() => setPayMode(m.id)}>
                  <span style={{ fontSize: 18 }}>{m.i}</span>
                  <p style={{ fontSize: 11, marginTop: 3 }}>{m.l}</p>
                </button>
              ))}
            </div>

            {payMode === 'card' && (
              <>
                <label className="small"><b>Card Number</b></label>
                <input value={cardNumber} onChange={e => setCardNumber(e.target.value)} />
                <div className="two-col">
                  <div><label className="small"><b>Expiry</b></label><input value={expiry} onChange={e => setExpiry(e.target.value)} /></div>
                  <div><label className="small"><b>CVV</b></label><input value={cvv} onChange={e => setCvv(e.target.value)} /></div>
                </div>
              </>
            )}
            {payMode === 'upi' && (
              <><label className="small"><b>UPI ID</b></label>
              <input value={upiId} onChange={e => setUpiId(e.target.value)} placeholder="name@paytm" /></>
            )}
            {payMode === 'netbanking' && (
              <><label className="small"><b>Select Bank</b></label>
              <select value={bank} onChange={e => setBank(e.target.value)}>
                {BANKS.map(b => <option key={b}>{b}</option>)}
              </select></>
            )}
            {payMode === 'wallet' && (
              <div className="wallet-grid">
                {WALLETS.map(w => (
                  <button key={w} className={'wallet-btn' + (wallet === w ? ' wallet-active' : '')}
                    onClick={() => setWallet(w)}>{w}</button>
                ))}
              </div>
            )}

            {error && <p className="error">{error}</p>}
            <button className="btn-primary" disabled={processing} onClick={handlePay}>
              {processing ? 'Activating Plan…' : `Pay ₹${selected.price.toLocaleString('en-IN')}`}
            </button>
            <button className="btn-ghost" disabled={processing} onClick={() => setShowPay(false)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  )
}