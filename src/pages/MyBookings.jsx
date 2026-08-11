import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  fetchMyBookings, cancelBookingGroup, fetchRefundForBooking,
  fetchMyPlans, cancelPlan
} from '../utils/api'
import {
  prettyDate, todayIso, formatDateTime,
  slotIsCancellable, timeUntil, SLOT_CANCEL_HOURS
} from '../utils/slots'
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
    const consecutive = sorted.every((b, i) =>
      i === 0 || hourOf(b.slot) === hourOf(sorted[i - 1].slot) + 1
    )
    return {
      key,
      bookings: sorted,
      first,
      count: sorted.length,
      total: sorted.reduce((s, x) => s + (x.price || 0), 0),
      date: first.date,
      status: first.status,
      payAtVenue: !!first.payAtVenue,
      createdAt: first.createdAt,
      range: sorted.length === 1
        ? first.slot
        : consecutive
          ? `${sorted[0].slot.split(' - ')[0]} - ${sorted[sorted.length - 1].slot.split(' - ')[1]}`
          : `${sorted.length} hours`
    }
  })
}

export default function MyBookings({ user }) {
  const navigate = useNavigate()
  const [all, setAll] = useState([])
  const [plans, setPlans] = useState([])
  const [tab, setTab] = useState('upcoming')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [detail, setDetail] = useState(null)
  const [detailRefund, setDetailRefund] = useState(null)
  const [planDetail, setPlanDetail] = useState(null)

  const [cancelling, setCancelling] = useState(null)
  const [cancellingPlan, setCancellingPlan] = useState(null)
  const [chosen, setChosen] = useState([])
  const [method, setMethod] = useState('original')
  const [detailsInput, setDetailsInput] = useState('')
  const [bankDetails, setBankDetails] = useState({})
  const [bankErrs, setBankErrs] = useState({})
  const [busy, setBusy] = useState(false)
  const [receipt, setReceipt] = useState(null)

  function load() {
    setLoading(true)
    Promise.all([fetchMyBookings(user.id), fetchMyPlans(user.id)])
      .then(([b, p]) => { setAll(b); setPlans(p) })
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
    { id: 'upcoming',  label: 'Upcoming',  count: upcoming.length },
    { id: 'past',      label: 'Past',      count: past.length },
    { id: 'cancelled', label: 'Cancelled', count: cancelled.length },
    { id: 'plans',     label: 'Plans',     count: plans.length }
  ]
  const selectedMethod = REFUND_METHODS.find(m => m.id === method)

  /* ── slot cancellation ── */
  function startCancel(group) {
    const eligible = group.bookings.filter(b => slotIsCancellable(b.date, b.slot))
    setChosen(eligible.map(b => b._id))
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

  async function confirmCancel() {
    if (!chosen.length) { setError('Select at least one hour'); return }

    const m = selectedMethod
    const venue = cancelling.payAtVenue

    if (!venue) {
      if (m.needs === 'upi' && !detailsInput.trim()) { setError('Enter your UPI ID'); return }
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

      setCancelling(null); setChosen([]); setDetailsInput('')
      setBankDetails({}); setBankErrs({}); setMethod('original')
      if (result.refund) setReceipt(result.refund)
      load()
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  /* ── plan cancellation ── */
  async function confirmCancelPlan() {
    const m = selectedMethod
    if (m.needs === 'upi' && !detailsInput.trim()) { setError('Enter your UPI ID'); return }
    if (m.needs === 'bank') {
      const e = validateBank({ ...bankDetails, confirmNumber: bankDetails.confirmNumber }, 'bank')
      setBankErrs(e)
      if (Object.keys(e).length) return
    }

    setBusy(true)
    try {
      const details = m.needs === 'bank'
        ? `${bankDetails.accountName} · ${bankDetails.accountNumber} · ${bankDetails.ifsc}`
        : detailsInput.trim()

      const result = await cancelPlan({
        userId: user.id,
        planId: cancellingPlan._id,
        refundMethod: m.label,
        refundDetails: details
      })

      setCancellingPlan(null); setDetailsInput('')
      setBankDetails({}); setBankErrs({}); setMethod('original')
      setReceipt(result.refund)
      load()
    } catch (e) {
      setError(e.message)
      setCancellingPlan(null)
    } finally {
      setBusy(false)
    }
  }

  const statusOf = g =>
    g.status === 'Cancelled' ? 'Cancelled'
      : g.date >= today ? 'Confirmed' : 'Completed'

  const activeList =
    tab === 'upcoming' ? upcoming :
    tab === 'past' ? past :
    tab === 'cancelled' ? cancelled : []

  return (
    <div className="page mb-page">
      <header className="page-head">
        <h1>My bookings</h1>
        <p className="muted">Tap anything to see the full details</p>
      </header>

      <div className="mb-tabs mb-tabs-4">
        {TABS.map(t => (
          <button key={t.id}
            className={'mb-tab' + (tab === t.id ? ' mb-tab-on' : '')}
            onClick={() => setTab(t.id)}>
            {t.label}
            {t.count > 0 && <span className="mb-tab-count">{t.count}</span>}
          </button>
        ))}
      </div>

      {loading && <p className="muted">Loading…</p>}
      {error && !cancelling && !cancellingPlan && <p className="error">{error}</p>}

      {/* ══ PLANS ══ */}
      {tab === 'plans' && !loading && (
        <>
          {plans.length === 0 && (
            <div className="mb-empty">
              <div className="mb-empty-icon"><Icon name="star" size={34} /></div>
              <p className="mb-empty-title">No plans yet</p>
              <p className="mb-empty-sub">
                Buy an owner plan to list your ground on TurfArena.
              </p>
              <button className="btn-primary" onClick={() => navigate('/plan')}>
                View plans
              </button>
            </div>
          )}

          <div className="mb-list">
            {plans.map(p => {
              const live = p.status === 'active'
              const exp = new Date(p.expiryDate)
              const expired = live && exp < new Date()
              return (
                <div key={p._id} className={'mb-card mb-clickable' + (!live ? ' mb-card-off' : '')}
                  onClick={() => setPlanDetail(p)}>
                  <div className="mb-card-head">
                    <div className={'pl-icon' + (p.planType === 'yearly' ? ' pl-icon-gold' : '')}>
                      <Icon name={p.planType === 'yearly' ? 'star' : 'calendar'}
                        size={20} filled={p.planType === 'yearly'} />
                    </div>
                    <div className="mb-card-mid">
                      <p className="mb-turf">
                        {p.planType === 'yearly' ? 'Yearly' : 'Monthly'} plan
                      </p>
                      <p className="mb-city">{p.turfLimit} grounds</p>
                      <p className="mb-time">
                        <Icon name="clock" size={13} />
                        <span className="mb-range">
                          {live && !expired
                            ? `Until ${exp.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`
                            : p.status === 'cancelled' ? 'Cancelled' : 'Expired'}
                        </span>
                      </p>
                    </div>
                    <div className="mb-card-right">
                      <span className={'mb-status ' +
                        (p.status === 'cancelled' ? 'mb-status-red'
                          : expired ? 'mb-status-grey' : 'mb-status-green')}>
                        {p.status === 'cancelled' ? 'Cancelled' : expired ? 'Expired' : 'Active'}
                      </span>
                      <span className="mb-chevron">›</span>
                    </div>
                  </div>

                  {live && !expired && !p.isMature && (
                    <div className="pl-pending">
                      <Icon name="clock" size={13} />
                      Grounds go live in {p.hoursToActivation} hour
                      {p.hoursToActivation > 1 ? 's' : ''}
                    </div>
                  )}

                  <div className="mb-card-foot">
                    <p className="mb-total">₹{p.price?.toLocaleString('en-IN')}</p>
                    <p className="mb-tap-hint">Tap for details</p>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* ══ BOOKINGS ══ */}
      {tab !== 'plans' && !loading && activeList.length === 0 && (
        <div className="mb-empty">
          <div className="mb-empty-icon">
            <Icon name={tab === 'upcoming' ? 'calendar' : tab === 'past' ? 'check' : 'undo'} size={34} />
          </div>
          <p className="mb-empty-title">
            {tab === 'upcoming' ? 'No upcoming bookings'
              : tab === 'past' ? 'Nothing completed yet' : 'No cancellations'}
          </p>
          <p className="mb-empty-sub">
            {tab === 'upcoming' ? 'Find a ground and book your next game.'
              : tab === 'past' ? 'Your finished games will appear here.'
              : 'Cancelled bookings and refunds show up here.'}
          </p>
          {tab === 'upcoming' && (
            <button className="btn-primary" onClick={() => navigate('/')}>Browse grounds</button>
          )}
        </div>
      )}

      {tab !== 'plans' && (
        <div className="mb-list">
          {activeList.map(g => {
            const st = statusOf(g)
            const locked = st === 'Confirmed' &&
              !g.bookings.some(b => slotIsCancellable(b.date, b.slot))
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

                {locked && (
                  <div className="mb-locked">
                    <Icon name="lock" size={12} />
                    Starts in {timeUntil(g.date, g.bookings[0].slot)} — cancellation closed
                  </div>
                )}

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
      )}

      {/* ══ BOOKING DETAIL ══ */}
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

              {statusOf(detail) === 'Confirmed' && (() => {
                const any = detail.bookings.some(b => slotIsCancellable(b.date, b.slot))
                return any ? (
                  <button className="mb-cancel-full" onClick={() => startCancel(detail)}>
                    {detail.count > 1 ? 'Cancel hours & get refund'
                      : detail.payAtVenue ? 'Cancel reservation' : 'Cancel & get refund'}
                  </button>
                ) : (
                  <div className="mb-locked-box">
                    <Icon name="lock" size={18} />
                    <div>
                      <p className="mb-locked-title">Cancellation closed</p>
                      <p className="mb-locked-sub">
                        Bookings can be cancelled up to {SLOT_CANCEL_HOURS} hour before the
                        slot begins. Contact the ground directly if you cannot make it.
                      </p>
                    </div>
                  </div>
                )
              })()}
            </div>
          </div>
        </div>
      )}

      {/* ══ PLAN DETAIL ══ */}
      {planDetail && (
        <div className="overlay" onClick={() => setPlanDetail(null)}>
          <div className="sheet sheet-short" onClick={e => e.stopPropagation()}>
            <div className="sheet-head">
              <h2>Plan details</h2>
              <button className="sheet-close" onClick={() => setPlanDetail(null)}>
                <Icon name="close" size={14} />
              </button>
            </div>
            <div className="sheet-body">
              <div className="ticket-card">
                <div className={'pl-hero' + (planDetail.planType === 'yearly' ? ' pl-hero-gold' : '')}>
                  <Icon name={planDetail.planType === 'yearly' ? 'star' : 'calendar'}
                    size={28} filled={planDetail.planType === 'yearly'} />
                </div>
                <div className="ticket-turf-name">
                  {planDetail.planType === 'yearly' ? 'Yearly' : 'Monthly'} plan
                </div>
                <p className="ticket-turf-city">{planDetail.turfLimit} grounds included</p>

                <div className="ticket-divider">
                  <span /><span className="ticket-scissors">✂</span><span />
                </div>

                <div className="ticket-details">
                  <div className="ticket-detail-row">
                    <span>Amount paid</span>
                    <span className="ticket-amount">₹{planDetail.price?.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="ticket-detail-row">
                    <span>Purchased</span><span>{formatDateTime(planDetail.startDate)}</span>
                  </div>
                  <div className="ticket-detail-row">
                    <span>Valid until</span><span>{formatDateTime(planDetail.expiryDate)}</span>
                  </div>
                  <div className="ticket-detail-row">
                    <span>Payment</span><span>{planDetail.paymentMethod}</span>
                  </div>
                  <div className="ticket-detail-row">
                    <span>Reference</span>
                    <span className="ticket-mono">{planDetail.paymentId}</span>
                  </div>
                  {planDetail.cancelledAt && (
                    <div className="ticket-detail-row">
                      <span>Cancelled</span><span>{formatDateTime(planDetail.cancelledAt)}</span>
                    </div>
                  )}
                  <div className="ticket-detail-row">
                    <span>Status</span>
                    <span className={'ticket-status-badge'
                      + (planDetail.status === 'cancelled' ? ' tsb-red' : '')}>
                      {planDetail.status.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>

              {planDetail.status === 'active' && !planDetail.isMature && (
                <div className="pl-note">
                  <Icon name="clock" size={16} />
                  <div>
                    <p className="pl-note-title">
                      Grounds go live in {planDetail.hoursToActivation} hour
                      {planDetail.hoursToActivation > 1 ? 's' : ''}
                    </p>
                    <p className="pl-note-sub">
                      They stay hidden from players until then, which is also your
                      cancellation window.
                    </p>
                  </div>
                </div>
              )}

              {planDetail.status === 'active' && (
                planDetail.canCancel ? (
                  <>
                    <div className="pl-window">
                      <Icon name="alert" size={15} />
                      <span>
                        {planDetail.hoursToCancel} hour{planDetail.hoursToCancel > 1 ? 's' : ''} left
                        to cancel with a full refund
                      </span>
                    </div>
                    <button className="mb-cancel-full"
                      onClick={() => { setCancellingPlan(planDetail); setPlanDetail(null) }}>
                      Cancel plan & get refund
                    </button>
                  </>
                ) : (
                  <div className="mb-locked-box">
                    <Icon name="lock" size={18} />
                    <div>
                      <p className="mb-locked-title">Cancellation closed</p>
                      <p className="mb-locked-sub">
                        Plans can only be cancelled within 24 hours of purchase.
                        This one is now locked until it expires.
                      </p>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══ CANCEL SLOTS ══ */}
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
              {cancelling.count > 1 && (
                <>
                  <div className="hp-head">
                    <p className="rf-section-label" style={{ margin: 0 }}>
                      Which hours are you cancelling?
                    </p>
                  </div>
                  <div className="hp-list">
                    {cancelling.bookings.map((b, i) => {
                      const allowed = slotIsCancellable(b.date, b.slot)
                      const on = chosen.includes(b._id)
                      return (
                        <button key={b._id} disabled={!allowed}
                          className={'hp-row' + (on ? ' hp-row-on' : '')
                            + (!allowed ? ' hp-row-locked' : '')}
                          onClick={() => allowed && toggleHour(b._id)}>
                          <span className={'hp-box' + (on ? ' hp-box-on' : '')}>
                            {on && <Icon name="check" size={12} />}
                            {!allowed && <Icon name="lock" size={11} />}
                          </span>
                          <span className="hp-num">{i + 1}</span>
                          <span className="hp-time">{b.slot}</span>
                          {allowed
                            ? <span className="hp-price">₹{b.price}</span>
                            : <span className="hp-late">Too late</span>}
                        </button>
                      )
                    })}
                  </div>
                  {cancelling.count > chosen.length && chosen.length > 0 && (
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
                      You had not paid — {cancelling.first.turf?.name} · {prettyDate(cancelling.date)}
                    </p>
                  </div>
                  <p className="rf-note">
                    Cancelling releases these hours for other players.
                  </p>
                  {error && <p className="error">{error}</p>}
                  <button className="btn-primary" disabled={busy || !chosen.length}
                    onClick={confirmCancel}>
                    {busy ? 'Cancelling…' : `Cancel ${chosen.length} hour${chosen.length > 1 ? 's' : ''}`}
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

                  {error && <p className="error">{error}</p>}

                  <button className="btn-primary" disabled={busy || !chosen.length}
                    onClick={confirmCancel}>
                    {busy ? 'Processing…' : `Cancel & refund ₹${chosenTotal.toLocaleString('en-IN')}`}
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

      {/* ══ CANCEL PLAN ══ */}
      {cancellingPlan && (
        <div className="overlay" onClick={() => !busy && setCancellingPlan(null)}>
          <div className="sheet sheet-short" onClick={e => e.stopPropagation()}>
            <div className="sheet-head">
              <h2>Cancel plan</h2>
              <button className="sheet-close" disabled={busy} onClick={() => setCancellingPlan(null)}>
                <Icon name="close" size={14} />
              </button>
            </div>

            <div className="sheet-body">
              <div className="rf-amount-card">
                <p className="rf-amount-label">Refund amount</p>
                <p className="rf-amount">₹{cancellingPlan.price?.toLocaleString('en-IN')}</p>
                <p className="rf-amount-sub">
                  {cancellingPlan.planType === 'yearly' ? 'Yearly' : 'Monthly'} plan
                  {' · '}bought {formatDateTime(cancellingPlan.startDate)}
                </p>
              </div>

              <div className="pl-warn">
                <Icon name="alert" size={16} />
                <div>
                  <p className="pl-warn-title">Your grounds will be hidden</p>
                  <p className="pl-warn-sub">
                    Nothing is deleted. Buy a plan again and they reappear 24 hours later.
                  </p>
                </div>
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

              {error && <p className="error">{error}</p>}

              <button className="btn-primary" disabled={busy} onClick={confirmCancelPlan}>
                {busy ? 'Cancelling…'
                  : `Cancel plan & refund ₹${cancellingPlan.price?.toLocaleString('en-IN')}`}
              </button>
              <button className="btn-ghost" disabled={busy} onClick={() => setCancellingPlan(null)}>
                Keep my plan
              </button>
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
                {receipt.slotCount > 0
                  ? `${receipt.slotCount} hour${receipt.slotCount > 1 ? 's' : ''} cancelled and released.`
                  : 'Your plan has been cancelled.'}
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

              <button className="btn-primary" onClick={() => setReceipt(null)}>Done</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}