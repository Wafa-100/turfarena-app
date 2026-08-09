import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  fetchMyBookings, cancelBookingGroup, fetchRefundByPayment
} from '../utils/api'
import { prettyDate, todayIso } from '../utils/slots'
import BookingTicket from '../components/BookingTicket'

const REFUND_METHODS = [
  { id: 'original', label: 'Original Payment Method', sub: 'Back To How You Paid', icon: '↩️', needs: null },
  { id: 'upi',      label: 'UPI',                     sub: 'Instant To Your UPI ID', icon: '📱', needs: 'UPI ID (e.g. name@paytm)' },
  { id: 'bank',     label: 'Bank Account',            sub: '3–5 Working Days',       icon: '🏦', needs: 'Account Number' },
  { id: 'wallet',   label: 'TurfArena Wallet',        sub: 'Instant, Use On Next Booking', icon: '👛', needs: null }
]

/* Group bookings that were paid for together into one entry */
function groupByPayment(list) {
  const map = new Map()
  for (const b of list) {
    const key = b.payment?._id || b.payment || b._id
    if (!map.has(key)) map.set(key, [])
    map.get(key).push(b)
  }
  return [...map.entries()].map(([key, group]) => {
    const sorted = [...group].sort(
      (a, b) => parseInt(a.slot, 10) - parseInt(b.slot, 10)
    )
    const first = sorted[0]
    return {
      key,
      paymentId: first.payment?._id || null,
      bookings: sorted,
      first,
      count: sorted.length,
      total: first.payment?.amount ?? sorted.reduce((s, x) => s + (x.price || 0), 0),
      date: first.date,
      status: first.status,
      createdAt: first.createdAt,
      // "08:00 - 11:00" when the hours run back to back
      range: sorted.length > 1
        ? `${sorted[0].slot.split(' - ')[0]} - ${sorted[sorted.length - 1].slot.split(' - ')[1]}`
        : first.slot
    }
  })
}

export default function MyBookings({ user }) {
  const navigate = useNavigate()
  const [all, setAll] = useState([])
  const [tab, setTab] = useState('upcoming')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [detail, setDetail] = useState(null)     // group being viewed
  const [detailRefund, setDetailRefund] = useState(null)

  const [cancelling, setCancelling] = useState(null)  // group being cancelled
  const [method, setMethod] = useState('original')
  const [detailsInput, setDetailsInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [receipt, setReceipt] = useState(null)   // refund just created

  function load() {
    setLoading(true)
    fetchMyBookings(user.id)
      .then(setAll)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }
  useEffect(load, [])

  // when a cancelled group is opened, pull its refund receipt
  useEffect(() => {
    setDetailRefund(null)
    if (detail && detail.status === 'Cancelled' && detail.paymentId) {
      fetchRefundByPayment(detail.paymentId).then(setDetailRefund).catch(() => {})
    }
  }, [detail])

  const today = todayIso()
  const groups = groupByPayment(all)

  const upcoming  = groups.filter(g => g.status === 'Confirmed' && g.date >= today)
  const past      = groups.filter(g => g.status === 'Confirmed' && g.date <  today)
  const cancelled = groups.filter(g => g.status === 'Cancelled')

  const TABS = [
    { id: 'upcoming',  label: 'Upcoming',  list: upcoming },
    { id: 'past',      label: 'Completed', list: past },
    { id: 'cancelled', label: 'Cancelled', list: cancelled }
  ]
  const active = TABS.find(t => t.id === tab)

  const selectedMethod = REFUND_METHODS.find(m => m.id === method)

  async function confirmCancel() {
    if (selectedMethod?.needs && !detailsInput.trim()) return
    setBusy(true)
    try {
      const result = await cancelBookingGroup({
        userId: user.id,
        paymentId: cancelling.paymentId,
        refundMethod: selectedMethod.label,
        refundDetails: detailsInput.trim()
      })
      setCancelling(null)
      setDetailsInput('')
      setMethod('original')
      setReceipt(result.refund)
      load()
    } catch (e) {
      setError(e.message)
      setCancelling(null)
    } finally {
      setBusy(false)
    }
  }

  const statusOf = g =>
    g.status === 'Cancelled' ? 'Cancelled'
      : g.date >= today ? 'Confirmed' : 'Completed'

  return (
    <div className="page mb-page">
      <header className="page-head">
        <h1>My Bookings</h1>
        <p className="muted">Tap Any Booking To See The Full Pass</p>
      </header>

      <div className="mb-tabs">
        {TABS.map(t => (
          <button key={t.id}
            className={'mb-tab' + (tab === t.id ? ' mb-tab-on' : '')}
            onClick={() => setTab(t.id)}>
            {t.label}
            {t.list.length > 0 && <span className="mb-tab-count">{t.list.length}</span>}
          </button>
        ))}
      </div>

      {loading && <p className="muted">Loading Your Bookings…</p>}
      {error && <p className="error">{error}</p>}

      {!loading && active.list.length === 0 && (
        <div className="mb-empty">
          <div className="mb-empty-icon">
            {tab === 'upcoming' ? '📅' : tab === 'past' ? '✅' : '↩️'}
          </div>
          <p className="mb-empty-title">
            {tab === 'upcoming' ? 'No Upcoming Bookings'
              : tab === 'past' ? 'Nothing Completed Yet'
              : 'No Cancellations'}
          </p>
          <p className="mb-empty-sub">
            {tab === 'upcoming' ? 'Find A Ground And Book Your Next Game.'
              : tab === 'past' ? 'Your Finished Games Will Appear Here.'
              : 'Cancelled Bookings And Refunds Show Up Here.'}
          </p>
          {tab === 'upcoming' && (
            <button className="btn-primary" onClick={() => navigate('/')}>
              Browse Grounds
            </button>
          )}
        </div>
      )}

      {/* ── Booking list — ONE row per payment ── */}
      <div className="mb-list">
        {active.list.map(g => {
          const st = statusOf(g)
          return (
            <div key={g.key}
              className={'mb-card mb-clickable' + (st === 'Cancelled' ? ' mb-card-off' : '')}
              onClick={() => setDetail(g)}>

              <div className="mb-card-head">
                <div className="mb-date-box">
                  <span className="mb-date-day">{g.date.split('-')[2]}</span>
                  <span className="mb-date-mon">
                    {new Date(g.date).toLocaleDateString('en-IN', { month: 'short' }).toUpperCase()}
                  </span>
                </div>

                <div className="mb-card-mid">
                  <p className="mb-turf">{g.first.turf?.name || 'Turf'}</p>
                  <p className="mb-city">{g.first.turf?.city}</p>
                  <p className="mb-time">
                    🕐 {g.range}
                    {g.count > 1 && <span className="mb-hours-pill">{g.count} Hours</span>}
                  </p>
                </div>

                <div className="mb-card-right">
                  <span className={'mb-status ' +
                    (st === 'Cancelled' ? 'mb-status-red'
                      : st === 'Confirmed' ? 'mb-status-green' : 'mb-status-grey')}>
                    {st}
                  </span>
                  <span className="mb-chevron">›</span>
                </div>
              </div>

              <div className="mb-card-foot">
                <p className="mb-total">
                  ₹{g.total.toLocaleString('en-IN')}
                  {g.count > 1 && <span className="mb-total-sub"> · {g.count} hrs</span>}
                </p>
                <p className="mb-tap-hint">Tap To View Pass</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* ══ DETAIL SHEET — the full ticket ══ */}
      {detail && (
        <div className="overlay" onClick={() => setDetail(null)}>
          <div className="sheet" onClick={e => e.stopPropagation()}>
            <div className="sheet-head">
              <h2>Booking Pass</h2>
              <button className="sheet-close" onClick={() => setDetail(null)}>✕</button>
            </div>

            <div className="sheet-body">
              <BookingTicket
                bookings={detail.bookings}
                payment={detail.first.payment}
                status={statusOf(detail)}
                refund={detailRefund}
              />

              {statusOf(detail) === 'Confirmed' && (
                <button className="mb-cancel-full"
                  onClick={() => { setCancelling(detail); setDetail(null) }}>
                  Cancel Booking & Get Refund
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══ CANCEL — choose refund method ══ */}
      {cancelling && (
        <div className="overlay" onClick={() => !busy && setCancelling(null)}>
          <div className="sheet sheet-short" onClick={e => e.stopPropagation()}>
            <div className="sheet-head">
              <h2>Cancel Booking</h2>
              <button className="sheet-close" disabled={busy}
                onClick={() => setCancelling(null)}>✕</button>
            </div>

            <div className="sheet-body">
              <div className="rf-amount-card">
                <p className="rf-amount-label">Refund Amount</p>
                <p className="rf-amount">₹{cancelling.total.toLocaleString('en-IN')}</p>
                <p className="rf-amount-sub">
                  {cancelling.first.turf?.name} · {prettyDate(cancelling.date)} · {cancelling.range}
                </p>
              </div>

              <p className="rf-section-label">Where Should We Send The Refund?</p>
              <div className="rf-methods">
                {REFUND_METHODS.map(m => (
                  <button key={m.id}
                    className={'rf-method' + (method === m.id ? ' rf-method-on' : '')}
                    onClick={() => { setMethod(m.id); setDetailsInput('') }}>
                    <span className="rf-method-icon">{m.icon}</span>
                    <div className="rf-method-text">
                      <p className="rf-method-label">{m.label}</p>
                      <p className="rf-method-sub">{m.sub}</p>
                    </div>
                    <span className={'rf-radio' + (method === m.id ? ' rf-radio-on' : '')} />
                  </button>
                ))}
              </div>

              {selectedMethod?.needs && (
                <div className="rf-input-wrap">
                  <label className="rf-input-label">{selectedMethod.needs}</label>
                  <input value={detailsInput}
                    onChange={e => setDetailsInput(e.target.value)}
                    placeholder={selectedMethod.needs} />
                </div>
              )}

              <p className="rf-note">
                Refund Processed — The Receipt Is Saved In The My Bookings
                And Stays Available In Your Cancelled Tab.
              </p>

              <button className="btn-primary" disabled={busy}
                onClick={confirmCancel}>
                {busy ? 'Processing Refund…'
                  : `Cancel & Refund ₹${cancelling.total.toLocaleString('en-IN')}`}
              </button>
              <button className="btn-ghost" disabled={busy}
                onClick={() => setCancelling(null)}>
                Keep My Booking
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ REFUND RECEIPT — right after cancelling ══ */}
      {receipt && (
        <div className="overlay" onClick={() => setReceipt(null)}>
          <div className="sheet sheet-short" onClick={e => e.stopPropagation()}>
            <div className="sheet-body" style={{ textAlign: 'center' }}>
              <div className="rf-done-icon">↩</div>
              <h2 style={{ marginBottom: 4 }}>Refund Processed</h2>
              <p className="muted" style={{ fontSize: 13.5, marginBottom: 16 }}>
                Your Booking Is Cancelled And The Slots Are Free Again.
              </p>

              <div className="confirm-card" style={{ textAlign: 'left' }}>
                <div className="ticket-details">
                  <div className="ticket-detail-row">
                    <span>Refund ID</span><span className="ticket-mono">{receipt.refundId}</span>
                  </div>
                  <div className="ticket-detail-row">
                    <span>Amount</span>
                    <span className="ticket-amount">₹{receipt.amount?.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="ticket-detail-row">
                    <span>Hours Refunded</span><span>{receipt.slotCount}</span>
                  </div>
                  <div className="ticket-detail-row">
                    <span>Refund To</span><span>{receipt.refundMethod}</span>
                  </div>
                  {receipt.refundDetails && (
                    <div className="ticket-detail-row">
                      <span>Account</span><span className="ticket-mono">{receipt.refundDetails}</span>
                    </div>
                  )}
                  <div className="ticket-detail-row">
                    <span>Expected By</span><span>{receipt.expectedBy}</span>
                  </div>
                  <div className="ticket-detail-row">
                    <span>Status</span>
                    <span className="ticket-status-badge tsb-amber">{receipt.status}</span>
                  </div>
                </div>
              </div>

              <button className="btn-primary"
                onClick={() => { setReceipt(null); setTab('cancelled') }}>
                View In Cancelled
              </button>
              <button className="btn-ghost" onClick={() => setReceipt(null)}>Done</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}