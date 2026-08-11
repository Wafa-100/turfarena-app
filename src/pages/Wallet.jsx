import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchWallet, topUpWallet } from '../utils/api'
import { formatDateTime } from '../utils/slots'
import Icon from '../components/Icon'

const QUICK = [500, 1000, 2000, 5000]

/* No TurfArena Wallet here — you cannot fund a wallet with itself */
const MODES = [
  { id: 'card',       label: 'Card',        icon: 'card' },
  { id: 'upi',        label: 'UPI',         icon: 'phone' },
  { id: 'netbanking', label: 'Net Banking', icon: 'bank' },
  { id: 'wallet',     label: 'Other wallet', icon: 'wallet' }
]
const BANKS = ['State Bank of India', 'HDFC Bank', 'ICICI Bank', 'Axis Bank', 'Kotak Mahindra Bank']
const WALLETS = ['Paytm', 'PhonePe', 'Google Pay', 'Amazon Pay']

const SOURCE_ICON = {
  topup: 'plus', booking: 'calendar', plan: 'star',
  refund: 'undo', cashback: 'bolt'
}

export default function Wallet({ user }) {
  const navigate = useNavigate()
  const [balance, setBalance] = useState(0)
  const [txns, setTxns] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [showAdd, setShowAdd] = useState(false)
  const [amount, setAmount] = useState('')
  const [mode, setMode] = useState('card')
  const [cardNumber, setCardNumber] = useState('4242 4242 4242 4242')
  const [expiry, setExpiry] = useState('12/29')
  const [cvv, setCvv] = useState('123')
  const [upiId, setUpiId] = useState('')
  const [bank, setBank] = useState(BANKS[0])
  const [walletApp, setWalletApp] = useState(WALLETS[0])
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(null)
  const [txnDetail, setTxnDetail] = useState(null)

  function load() {
    fetchWallet(user.id)
      .then(r => { setBalance(r.balance); setTxns(r.transactions) })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }
  useEffect(load, [])

  const amt = Number(amount) || 0
  const valid = amt >= 100 && amt <= 50000

  async function add() {
    setBusy(true); setError('')
    setTimeout(async () => {
      try {
        const r = await topUpWallet({
          userId: user.id, amount: amt,
          paymentMode: mode, cardNumber, upiId, bank, wallet: walletApp
        })
        setDone(r)
        setShowAdd(false)
        setAmount('')
        load()
      } catch (e) { setError(e.message); setBusy(false) }
      finally { setBusy(false) }
    }, 1500)
  }

  return (
    <div className="page wl-page">

      <header className="wl-head">
        <button className="mg-back" onClick={() => navigate('/profile')}>
          <Icon name="chevron" size={18} className="mg-back-icon" />
        </button>
        <h1 className="wl-title">Wallet</h1>
      </header>

      {/* Balance card */}
      <div className="wl-card">
        <div className="wl-card-glow" />
        <p className="wl-card-label">Available balance</p>
        <p className="wl-balance">₹{balance.toLocaleString('en-IN')}</p>
        <p className="wl-card-sub">
          Use it for bookings and plans — instantly, no card needed
        </p>
        <button className="wl-add-btn" onClick={() => { setShowAdd(true); setDone(null) }}>
          <Icon name="plus" size={17} /> Add money
        </button>
      </div>

      {error && <p className="error">{error}</p>}

      {/* Quick add */}
      <p className="wl-section">Quick add</p>
      <div className="wl-quick">
        {QUICK.map(q => (
          <button key={q} className="wl-quick-btn"
            onClick={() => { setAmount(String(q)); setShowAdd(true); setDone(null) }}>
            ₹{q.toLocaleString('en-IN')}
          </button>
        ))}
      </div>

      {/* History */}
      <p className="wl-section">Transactions</p>
      {loading && <p className="muted">Loading…</p>}
      {!loading && txns.length === 0 && (
        <div className="wl-empty">
          <Icon name="receipt" size={32} />
          <p className="wl-empty-title">No transactions yet</p>
          <p className="wl-empty-sub">Money you add or spend will appear here.</p>
        </div>
      )}

      <div className="wl-txns">
        {txns.map(t => (
          <button key={t._id} className="wl-txn wl-txn-tap"
            onClick={() => setTxnDetail(t)}>
            <span className={'wl-txn-icon' + (t.type === 'credit' ? ' wl-in' : ' wl-out')}>
              <Icon name={SOURCE_ICON[t.source] || 'receipt'} size={16} />
            </span>
            <div className="wl-txn-mid">
              <p className="wl-txn-desc">{t.description || t.source}</p>
              <p className="wl-txn-time">{formatDateTime(t.createdAt)}</p>
            </div>
            <div className="wl-txn-right">
              <p className={'wl-txn-amt' + (t.type === 'credit' ? ' wl-amt-in' : '')}>
                {t.type === 'credit' ? '+' : '−'}₹{t.amount.toLocaleString('en-IN')}
              </p>
              <p className="wl-txn-bal">₹{t.balanceAfter.toLocaleString('en-IN')}</p>
            </div>
            <span className="wl-txn-chev">›</span>
          </button>
        ))}
        {txnDetail && (
        <div className="overlay" onClick={() => setTxnDetail(null)}>
          <div className="sheet sheet-short" onClick={e => e.stopPropagation()}>
            <div className="sheet-head">
              <h2>Transaction receipt</h2>
              <button className="sheet-close" onClick={() => setTxnDetail(null)}>
                <Icon name="close" size={14} />
              </button>
            </div>

            <div className="sheet-body">
              <div className="ticket-card">
                <div className={'wl-rc-mark' + (txnDetail.type === 'credit' ? ' wl-rc-in' : '')}>
                  <Icon name={txnDetail.type === 'credit' ? 'plus' : 'arrow'} size={26} />
                </div>

                <p className="wl-rc-amt">
                  {txnDetail.type === 'credit' ? '+' : '−'}
                  ₹{txnDetail.amount.toLocaleString('en-IN')}
                </p>
                <p className="wl-rc-desc">{txnDetail.description || txnDetail.source}</p>

                <div className="ticket-divider">
                  <span /><span className="ticket-scissors">✂</span><span />
                </div>

                <div className="ticket-details">
                  <div className="ticket-detail-row">
                    <span>Type</span>
                    <span>{txnDetail.type === 'credit' ? 'Money in' : 'Money out'}</span>
                  </div>
                  <div className="ticket-detail-row">
                    <span>Reason</span>
                    <span style={{ textTransform: 'capitalize' }}>{txnDetail.source}</span>
                  </div>
                  {txnDetail.method && (
                    <div className="ticket-detail-row">
                      <span>Paid with</span><span>{txnDetail.method}</span>
                    </div>
                  )}
                  {txnDetail.reference && (
                    <div className="ticket-detail-row">
                      <span>Reference</span>
                      <span className="ticket-mono">{txnDetail.reference}</span>
                    </div>
                  )}
                  <div className="ticket-detail-row">
                    <span>Date &amp; time</span>
                    <span>{formatDateTime(txnDetail.createdAt)}</span>
                  </div>
                  <div className="ticket-detail-row">
                    <span>Balance after</span>
                    <span className="ticket-amount">
                      ₹{txnDetail.balanceAfter.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="ticket-detail-row">
                    <span>Status</span>
                    <span className="ticket-status-badge">SUCCESSFUL</span>
                  </div>
                </div>

                <div className="ticket-divider"><span /><span /></div>

                <p className="wl-rc-foot">
                  TurfArena Wallet · Demo transaction
                </p>
              </div>

              <button className="btn-ghost" onClick={() => setTxnDetail(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
      </div>

      {/* ══ ADD MONEY SHEET ══ */}
      {showAdd && (
        <div className="overlay" onClick={() => !busy && setShowAdd(false)}>
          <div className="pay-card" onClick={e => e.stopPropagation()}>
            <div className="pay-head">
              <h2>Add money</h2>
              <button className="pay-close" disabled={busy} onClick={() => setShowAdd(false)}>
                <Icon name="close" size={14} />
              </button>
            </div>

            <label className="pay-field-label">Amount</label>
            <div className="wl-amt-wrap">
              <span className="wl-amt-cur">₹</span>
              <input className="wl-amt-input" inputMode="numeric"
                value={amount}
                onChange={e => setAmount(e.target.value.replace(/\D/g, '').slice(0, 5))}
                placeholder="0" autoFocus />
            </div>
            <div className="wl-chips">
              {QUICK.map(q => (
                <button key={q}
                  className={'wl-chip' + (amt === q ? ' wl-chip-on' : '')}
                  onClick={() => setAmount(String(q))}>
                  +₹{q.toLocaleString('en-IN')}
                </button>
              ))}
            </div>
            {amount && !valid && (
              <p className="au-field-err">
                {amt < 100 ? 'Minimum is ₹100' : 'Maximum is ₹50,000 at a time'}
              </p>
            )}

            <div className="demo-note">Demo payment — no real money is charged</div>

            <p className="pay-mode-label">Pay using</p>
            <div className="pay-mode-grid">
              {MODES.map(m => (
                <button key={m.id}
                  className={'pay-mode-btn' + (mode === m.id ? ' pay-mode-active' : '')}
                  onClick={() => setMode(m.id)}>
                  <Icon name={m.icon} size={19} className="pay-mode-icon" />
                  <p style={{ fontSize: 11.5, marginTop: 5, fontWeight: 600 }}>{m.label}</p>
                </button>
              ))}
            </div>

            {mode === 'card' && (<>
              <label className="pay-field-label">Card number</label>
              <input value={cardNumber} onChange={e => setCardNumber(e.target.value)} maxLength={19} />
              <div className="two-col">
                <div><label className="pay-field-label">Expiry</label>
                  <input value={expiry} onChange={e => setExpiry(e.target.value)} /></div>
                <div><label className="pay-field-label">CVV</label>
                  <input value={cvv} onChange={e => setCvv(e.target.value)} maxLength={4} /></div>
              </div>
            </>)}
            {mode === 'upi' && (<>
              <label className="pay-field-label">UPI ID</label>
              <input value={upiId} onChange={e => setUpiId(e.target.value)} placeholder="name@bank" />
            </>)}
            {mode === 'netbanking' && (<>
              <label className="pay-field-label">Select your bank</label>
              <select value={bank} onChange={e => setBank(e.target.value)}>
                {BANKS.map(b => <option key={b}>{b}</option>)}
              </select>
            </>)}
            {mode === 'wallet' && (
              <div className="wallet-grid">
                {WALLETS.map(w => (
                  <button key={w} className={'wallet-btn' + (walletApp === w ? ' wallet-active' : '')}
                    onClick={() => setWalletApp(w)}>{w}</button>
                ))}
              </div>
            )}

            {error && <p className="error">{error}</p>}
            <button className="btn-primary" disabled={busy || !valid} onClick={add}>
              {busy ? 'Adding…' : valid ? `Add ₹${amt.toLocaleString('en-IN')}` : 'Enter an amount'}
            </button>
          </div>
        </div>
      )}

      {/* ══ SUCCESS ══ */}
      {done && (
        <div className="overlay" onClick={() => setDone(null)}>
          <div className="pay-card" onClick={e => e.stopPropagation()} style={{ textAlign: 'center' }}>
            <div className="wl-done-icon"><Icon name="check" size={30} /></div>
            <h2 style={{ marginBottom: 4 }}>Money added</h2>
            <p className="muted" style={{ fontSize: 13.5, marginBottom: 18 }}>
              ₹{done.amount.toLocaleString('en-IN')} is now in your wallet
            </p>
            <div className="confirm-card" style={{ textAlign: 'left', marginTop: 0 }}>
              <div className="ticket-details">
                <div className="ticket-detail-row">
                  <span>Added</span>
                  <span className="ticket-amount">₹{done.amount.toLocaleString('en-IN')}</span>
                </div>
                <div className="ticket-detail-row">
                  <span>New balance</span><span>₹{done.balance.toLocaleString('en-IN')}</span>
                </div>
                <div className="ticket-detail-row">
                  <span>Paid with</span><span>{done.method}</span>
                </div>
                <div className="ticket-detail-row">
                  <span>Reference</span><span className="ticket-mono">{done.reference}</span>
                </div>
              </div>
            </div>
            <button className="btn-primary" onClick={() => setDone(null)}>Done</button>
          </div>
        </div>
      )}
    </div>
  )
}