import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  fetchMyBookings, cancelBookingGroup, fetchRefundForBooking
} from '../utils/api'
import { prettyDate, todayIso } from '../utils/slots'
import BookingTicket from '../components/BookingTicket'
import BankFields, { validateBank } from '../components/BankFields'
import Icon from '../components/Icon'

const REFUND_METHODS = [
  { id: 'original', label: 'Original payment method', sub: 'Back to how you paid · 3–5 days',   icon: 'undo',   needs: null },
  { id: 'wallet',   label: 'TurfArena Wallet',        sub: 'Instant · use on your next booking', icon: 'wallet', needs: null },
  { id: 'upi',      label: 'UPI',                     sub: 'Instant to your UPI ID',             icon: 'phone',  needs: 'upi' },
  { id: 'bank',     label: 'Bank account',            sub: '3–5 working days',                   icon: 'bank',   needs: 'bank' }
]

const hourOf = s => parseInt(s, 10)

/*
  Group hours booked in one transaction into a single row.

  Key order matters:
    1. bookingGroup  — set on everything booked after this fix
    2. payment id    — older paid bookings
    3. turf+date+minute — older venue bookings, which had neither

  Status is part of the key, so a partly-cancelled booking correctly
  appears once under Upcoming and once under Cancelled.
*/
function groupBookings(list) {
  const map = new Map()

  for (const b of list) {
    let base
    if (b.bookingGroup) base = b.bookingGroup
    else if (b.payment?._id || b.payment) base = String(b.payment?._id || b.payment)
    else {
      const minute = new Date(b.createdAt).toISOString().slice(0, 16)
      base = `${b.turf?._id || b.turf}-${b.date}-${minute}`
    }

    const key = `${base}::${b.status}`
    if (!map.has(key)) map.set(key, [])
    map.get(key).push(b)
  }

  return [...map.entries()].map(([key, group]) => {
    const sorted = [...group].sort((a, b) => hourOf(a.slot) - hourOf(b.slot))
    const first = sorted[0]
    const total = sorted.reduce((s, x) => s + (x.price || 0), 0)

    // "11:00 - 16:00" only when the hours are consecutive
    const consecutive = sorted.every((b, i) =>
      i === 0 || hourOf(b.slot) === hourOf(sorted[i - 1].slot) + 1
    )
    const range = sorted.length === 1
      ? first.slot
      : consecutive
        ? `${sorted[0].slot.split(' - ')[0]} - ${sorted[sorted.length - 1].slot.split(' - ')[1]}`
        : `${sorted.length} hours`

    return {
      key,
      bookings: sorted,
      first,
      count: sorted.length,
      total,
      date: first.date,
      status: first.status,
      payAtVenue: !!first.payAtVenue,
      createdAt: first.createdAt,
      consecutive,
      range
    }
  })
}

export default function MyBookings({ user }) {
  const navigate = useNavigate()
  const [all, setAll] = useState([])
  const [tab, setTab] = useState('upcoming')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [detail, setDetail] = useState(null)
  const [detailRefund, setDetailRefund] = useState(null)

  const [cancelling, setCancelling] = useState(null)
  const [chosen, setChosen] = useState([])          // booking ids to cancel
  const [method, setMethod] = useState('original')
  const [detailsInput, setDetailsInput] = useState('')
  const [bankDetails, setBankDetails] = useState({})
  const [bankErrs, setBankErrs] = useState({})
  const [busy, setBusy] = useState(false)
  const [receipt, setReceipt] = useState(null)

  function load() {
    setLoading(true)
    fetchMyBookings(user.id)
      .then(setAll)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }
  useEffect(load, [])

  useEffect(() => {
    setDetailRefund(null)
    if (detail && detail.status === 'Cancelled') {
      fetchRefundForBooking(detail.first._id).then(setDetailRefund).catch(() => {})
    }
  }, [detail])

  const today = todayIso()
  const groups = groupBookings(all)

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

  /* Open the cancel sheet with every hour pre-selected */
  function startCancel(group) {
    setChosen(group.bookings.map(b => b._id))
    setCancelling(group)
    setDetail(null)
    setError('')
  }

  function toggleHour(id) {
    setChosen(c => c.includes(id) ? c.filter(x => x !== id) : [...c, id])
  }

  const chosenBookings = cancelling
    ? cancelling.bookings.filter(b => chosen.includes(b._id))
    : []
  const chosenTotal = chosenBookings.reduce((s, b) => s + (b.price || 0), 0)
  const partial = cancelling && chosen.length < cancelling.count

  async function confirmCancel() {
    if (!chosen.length) { setError('Select at least one hour'); return }

    const m = selectedMethod
    const venue = cancelling.payAtVenue

    if (!venue) {
      if (m.needs === 'upi' && !detailsInput.trim()) {
        setError('Enter your UPI ID'); return
      }
      if (m.needs === 'bank') {
        const e = validateBank({ ...bankDetails, confirmNumber: bankDetails.confirmNumber }, 'bank')
        setBankErrs(e)
        if (Object.keys(e).length) return
      }
    }

    setBusy(true)
    try {
      const details = m.needs === 'bank'
        ? `${bankDetails.accountName} · ${bankDetails.accountNumber} · ${bankDetails.ifsc}`
        : detailsInput.trim()

      const result = await cancelBookingGroup({
        userId: user.id,
        bookingIds: chosen,
        refundMethod: venue ? 'No payment taken' : m.label,
        refundDetails: venue ? '' : details
      })

      setCancelling(null)
      setChosen([])
      setDetailsInput('')
      setBankDetails({})
      setBankErrs({})
      setMethod('original')
      if (result.refund) setReceipt(result.refund)
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
        <h1>My bookings</h1>
        <p className="muted">Tap any booking to see the full pass</p>
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

      {loading && <p className="muted">Loading your bookings…</p>}
      {error && !cancelling && <p className="error">{error}</p>}

      {!loading && active.list.length === 0 && (
        <div className="mb-empty">
          <div className="mb-empty-icon">
            <Icon name={tab === 'upcoming' ? 'calendar' : tab === 'past' ? 'check' : 'undo'} size={34} />
          </div>
          <p className="mb-empty-title">
            {tab === 'upcoming' ? 'No upcoming bookings'
              : tab === 'past' ? 'Nothing completed yet'
              : 'No cancellations'}
          </p>
          <p className="mb-empty-sub">
            {tab === 'upcoming' ? 'Find a ground and book your next game.'
              : tab === 'past' ? 'Your finished games will appear here.'
              : 'Cancelled bookings and refunds show up here.'}
          </p>
          {tab === 'upcoming' && (
            <button className="btn-primary" onClick={() => navigate('/')}>
              Browse grounds
            </button>
          )}
        </div>
      )}

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
                    <Icon name="clock" size={13} />
                    <span className="mb-range">{g.range}</span>
                    {g.count > 1 && <span className="mb-hours-pill">{g.count} hrs</span>}
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
                  {g.payAtVenue && st !== 'Cancelled' && (
                    <span className="mb-venue-pill">Due at ground</span>
                  )}
                </p>
                <p className="mb-tap-hint">Tap to view pass</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* ══ DETAIL SHEET ══ */}
      {detail && (
        <div className="overlay" onClick={() => setDetail(null)}>
          <div className="sheet" onClick={e => e.stopPropagation()}>
            <div className="sheet-head">
              <h2>Booking pass</h2>
              <button className="sheet-close" onClick={() => setDetail(null)}>
                <Icon name="close" size={14} />
              </button>
            </div>

            <div className="sheet-body">
              <BookingTicket
                bookings={detail.bookings}
                payment={detail.first.payment}
                status={statusOf(detail)}
                refund={detailRefund}
              />

              {statusOf(detail) === 'Confirmed' && (
                <button className="mb-cancel-full" onClick={() => startCancel(detail)}>
                  {detail.count > 1
                    ? 'Cancel hours & get refund'
                    : detail.payAtVenue ? 'Cancel reservation' : 'Cancel & get refund'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══ CANCEL SHEET ══ */}
      {cancelling && (
        <div className="overlay" onClick={() => !busy && setCancelling(null)}>
          <div className="sheet sheet-short" onClick={e => e.stopPropagation()}>
            <div className="sheet-head">
              <h2>{cancelling.payAtVenue ? 'Cancel reservation' : 'Cancel booking'}</h2>
              <button className="sheet-close" disabled={busy} onClick={() => setCancelling(null)}>
                <Icon name="close" size={14} />
              </button>
            </div>

            <div className="sheet-body">

              {/* Hour picker — only when there is more than one */}
              {cancelling.count > 1 && (
                <>
                  <div className="hp-head">
                    <p className="rf-section-label" style={{ margin: 0 }}>
                      Which hours are you cancelling?
                    </p>
                    <button className="hp-all"
                      onClick={() => setChosen(
                        chosen.length === cancelling.count
                          ? []
                          : cancelling.bookings.map(b => b._id)
                      )}>
                      {chosen.length === cancelling.count ? 'Clear all' : 'Select all'}
                    </button>
                  </div>

                  <div className="hp-list">
                    {cancelling.bookings.map((b, i) => {
                      const on = chosen.includes(b._id)
                      return (
                        <button key={b._id}
                          className={'hp-row' + (on ? ' hp-row-on' : '')}
                          onClick={() => toggleHour(b._id)}>
                          <span className={'hp-box' + (on ? ' hp-box-on' : '')}>
                            {on && <Icon name="check" size={12} />}
                          </span>
                          <span className="hp-num">{i + 1}</span>
                          <span className="hp-time">{b.slot}</span>
                          <span className="hp-price">₹{b.price}</span>
                        </button>
                      )
                    })}
                  </div>

                  {partial && chosen.length > 0 && (
                    <p className="hp-note">
                      <Icon name="info" size={14} />
                      {cancelling.count - chosen.length} hour
                      {cancelling.count - chosen.length > 1 ? 's' : ''} will stay booked.
                    </p>
                  )}
                </>
              )}

              {cancelling.payAtVenue ? (
                <>
                  <div className="rf-amount-card">
                    <p className="rf-amount-label">Nothing to refund</p>
                    <p className="rf-amount">₹0</p>
                    <p className="rf-amount-sub">
                      You had not paid for this reservation — {cancelling.first.turf?.name}
                      {' · '}{prettyDate(cancelling.date)}
                    </p>
                  </div>

                  <p className="rf-note">
                    Cancelling releases {chosen.length === 1 ? 'this hour' : 'these hours'} so
                    other players can book {chosen.length === 1 ? 'it' : 'them'}.
                  </p>

                  {error && <p className="error">{error}</p>}

                  <button className="btn-primary" disabled={busy || !chosen.length}
                    onClick={confirmCancel}>
                    {busy ? 'Cancelling…'
                      : `Cancel ${chosen.length} hour${chosen.length > 1 ? 's' : ''}`}
                  </button>
                  <button className="btn-ghost" disabled={busy} onClick={() => setCancelling(null)}>
                    Keep it
                  </button>
                </>
              ) : (
                <>
                  <div className="rf-amount-card">
                    <p className="rf-amount-label">Refund amount</p>
                    <p className="rf-amount">₹{chosenTotal.toLocaleString('en-IN')}</p>
                    <p className="rf-amount-sub">
                      {cancelling.first.turf?.name} · {prettyDate(cancelling.date)}
                      {' · '}{chosen.length} hour{chosen.length > 1 ? 's' : ''}
                    </p>
                  </div>

                  <p className="rf-section-label">Where should we send the refund?</p>
                  <div className="rf-methods">
                    {REFUND_METHODS.map(m => (
                      <button key={m.id}
                        className={'rf-method' + (method === m.id ? ' rf-method-on' : '')}
                        onClick={() => { setMethod(m.id); setDetailsInput(''); setBankErrs({}) }}>
                        <span className="rf-method-icon"><Icon name={m.icon} size={19} /></span>
                        <div className="rf-method-text">
                          <p className="rf-method-label">{m.label}</p>
                          <p className="rf-method-sub">{m.sub}</p>
                        </div>
                        <span className={'rf-radio' + (method === m.id ? ' rf-radio-on' : '')} />
                      </button>
                    ))}
                  </div>

                  {selectedMethod?.needs === 'upi' && (
                    <div className="rf-input-wrap">
                      <label className="rf-input-label">UPI ID</label>
                      <input value={detailsInput}
                        onChange={e => setDetailsInput(e.target.value)}
                        placeholder="yourname@paytm" />
                    </div>
                  )}

                  {selectedMethod?.needs === 'bank' && (
                    <div className="rf-bank">
                      <BankFields value={bankDetails} onChange={setBankDetails}
                        errors={bankErrs} showConfirm mode="bank" />
                    </div>
                  )}

                  <p className="rf-note">
                    {method === 'wallet'
                      ? 'Wallet refunds are instant and can be used on your next booking.'
                      : 'Demo refund — the receipt is stored and stays in your Cancelled tab.'}
                  </p>

                  {error && <p className="error">{error}</p>}

                  <button className="btn-primary" disabled={busy || !chosen.length}
                    onClick={confirmCancel}>
                    {busy ? 'Processing…'
                      : `Cancel & refund ₹${chosenTotal.toLocaleString('en-IN')}`}
                  </button>
                  <button className="btn-ghost" disabled={busy} onClick={() => setCancelling(null)}>
                    Keep my booking
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══ REFUND RECEIPT ══ */}
      {receipt && (
        <div className="overlay" onClick={() => setReceipt(null)}>
          <div className="sheet sheet-short" onClick={e => e.stopPropagation()}>
            <div className="sheet-body" style={{ textAlign: 'center' }}>
              <div className="rf-done-icon"><Icon name="undo" size={28} /></div>
              <h2 style={{ marginBottom: 4 }}>Refund processed</h2>
              <p className="muted" style={{ fontSize: 13.5, marginBottom: 16 }}>
                {receipt.slotCount} hour{receipt.slotCount > 1 ? 's' : ''} cancelled and
                released for other players.
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
                    <span>Hours refunded</span><span>{receipt.slotCount}</span>
                  </div>
                  <div className="ticket-detail-row">
                    <span>Refund to</span><span>{receipt.refundMethod}</span>
                  </div>
                  {receipt.refundDetails && (
                    <div className="ticket-detail-row">
                      <span>Account</span><span className="ticket-mono">{receipt.refundDetails}</span>
                    </div>
                  )}
                  <div className="ticket-detail-row">
                    <span>Expected by</span><span>{receipt.expectedBy}</span>
                  </div>
                  <div className="ticket-detail-row">
                    <span>Status</span>
                    <span className="ticket-status-badge tsb-amber">{receipt.status}</span>
                  </div>
                </div>
              </div>

              <button className="btn-primary"
                onClick={() => { setReceipt(null); setTab('cancelled') }}>
                View in Cancelled
              </button>
              <button className="btn-ghost" onClick={() => setReceipt(null)}>Done</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}