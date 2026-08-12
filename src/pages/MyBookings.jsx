import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  fetchMyBookings, cancelBookingGroup, fetchRefundForBooking,
  fetchMyPlans, cancelPlan
} from '../utils/api'
import {
  prettyDate, formatDateTime,
  slotIsCancellable, groupIsOver, groupStart,
  SLOT_CANCEL_HOURS
} from '../utils/slots'
import BookingTicket from '../components/BookingTicket'
import BankFields, { validateBank } from '../components/BankFields'
import Countdown from '../components/Countdown'
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
    1. bookingGroup — everything booked after session 12
    2. payment id   — older paid bookings
    3. turf+date+minute — older pay-at-venue bookings

  Status is part of the key, so a partly-cancelled booking shows
  once under Upcoming and once under Cancelled.
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

/* Shared by the Plans tab and the Cancelled tab */
/* Shared by the Plans tab and the Cancelled tab */
function PlanCard({ p, onClick }) {
  if (!p) return null

  const live = p.status === 'active'
  const exp = p.expiryDate ? new Date(p.expiryDate) : null
  const expired = live && exp && exp < new Date()

  const fmt = (d) => {
    if (!d) return '—'
    const date = new Date(d)
    if (isNaN(date.getTime())) return '—'
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
  }

  const label =
    p.status === 'cancelled' ? `Cancelled ${fmt(p.cancelledAt || p.createdAt)}`
      : expired ? `Expired ${fmt(p.expiryDate)}`
      : exp ? `Until ${fmt(p.expiryDate)}`
      : 'Active'

  const startMs = p.startDate ? new Date(p.startDate).getTime() : null
  const showCountdown = live && !expired && !p.isMature && startMs && !isNaN(startMs)

  return (
    <div className={'mb-card mb-clickable' + (!live || expired ? ' mb-card-off' : '')}
      onClick={onClick}>
      <div className="mb-card-head">
        <div className={'pl-icon' + (p.planType === 'yearly' ? ' pl-icon-gold' : '')}>
          <Icon name={p.planType === 'yearly' ? 'star' : 'calendar'}
            size={20} filled={p.planType === 'yearly'} />
        </div>
        <div className="mb-card-mid">
          <p className="mb-turf">{p.planType === 'yearly' ? 'Yearly' : 'Monthly'} plan</p>
          <p className="mb-city">{p.turfLimit || 0} grounds</p>
          <p className="mb-time">
            <Icon name="clock" size={13} />
            <span className="mb-range">{label}</span>
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

      {showCountdown && (
        <div className="mb-strip">
          <Countdown
            to={new Date(startMs + 24 * 3600e3)}
            label="Grounds go live in"
            icon={<Icon name="clock" size={12} />}
          />
        </div>
      )}

      <div className="mb-card-foot">
        <p className="mb-total">
          ₹{(p.price || 0).toLocaleString('en-IN')}
          {p.status === 'cancelled' && <span className="mb-refund-pill">Refunded</span>}
          {expired && <span className="mb-expired-pill">Expired</span>}
        </p>
        <p className="mb-tap-hint">Tap for details</p>
      </div>
    </div>
  )
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

  const groups = groupBookings(all)

  const upcoming = groups.filter(g => g.status === 'Confirmed' && !groupIsOver(g))
  const past     = groups.filter(g => g.status === 'Confirmed' &&  groupIsOver(g))
  const cancelledBookings = groups.filter(g => g.status === 'Cancelled')

  // Active plans first, then expired ones
  const activePlans = plans
    .filter(p => p.status !== 'cancelled')
    .sort((a, b) => {
      const aDone = new Date(a.expiryDate) < new Date()
      const bDone = new Date(b.expiryDate) < new Date()
      if (aDone !== bDone) return aDone ? 1 : -1
      return new Date(b.createdAt) - new Date(a.createdAt)
    })
  const cancelledPlans = plans.filter(p => p.status === 'cancelled')

  // Cancelled bookings and plans, newest first
  const cancelledItems = [
    ...cancelledBookings.map(g => ({
      kind: 'booking', at: new Date(g.createdAt).getTime(), data: g
    })),
    ...cancelledPlans.map(p => ({
      kind: 'plan', at: new Date(p.cancelledAt || p.createdAt).getTime(), data: p
    }))
  ].sort((a, b) => b.at - a.at)

  const TABS = [
    { id: 'upcoming',  label: 'Upcoming',  count: upcoming.length },
    { id: 'past',      label: 'Past',      count: past.length },
    { id: 'cancelled', label: 'Cancelled', count: cancelledItems.length },
    { id: 'plans',     label: 'Plans',     count: activePlans.length }
  ]
  const activeList = tab === 'upcoming' ? upcoming : tab === 'past' ? past : []
  const selectedMethod = REFUND_METHODS.find(m => m.id === method)

  const statusOf = g =>
    g.status === 'Cancelled' ? 'Cancelled'
      : groupIsOver(g) ? 'Completed' : 'Confirmed'

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
      setTab('cancelled')
      load()
    } catch (e) {
      setError(e.message)
      setCancellingPlan(null)
    } finally {
      setBusy(false)
    }
  }

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

      {/* ══ UPCOMING / PAST ══ */}
      {(tab === 'upcoming' || tab === 'past') && !loading && activeList.length === 0 && (
        <div className="mb-empty">
          <div className="mb-empty-icon">
            <Icon name={tab === 'upcoming' ? 'calendar' : 'check'} size={34} />
          </div>
          <p className="mb-empty-title">
            {tab === 'upcoming' ? 'No upcoming bookings' : 'Nothing completed yet'}
          </p>
          <p className="mb-empty-sub">
            {tab === 'upcoming'
              ? 'Find a ground and book your next game.'
              : 'Your finished games will appear here.'}
          </p>
          {tab === 'upcoming' && (
            <button className="btn-primary" onClick={() => navigate('/')}>Browse grounds</button>
          )}
        </div>
      )}

      {(tab === 'upcoming' || tab === 'past') && (
        <div className="mb-list">
          {activeList.map(g => {
            const st = statusOf(g)
            const canCancel = st === 'Confirmed' &&
              g.bookings.some(b => slotIsCancellable(b.date, b.slot))

            return (
              <div key={g.key} className="mb-card mb-clickable"
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
                      (st === 'Confirmed' ? 'mb-status-green' : 'mb-status-grey')}>
                      {st}
                    </span>
                    <span className="mb-chevron">›</span>
                  </div>
                </div>

                {st === 'Confirmed' && (
                  <div className={'mb-strip' + (!canCancel ? ' mb-strip-locked' : '')}>
                    <Countdown
                      to={groupStart(g)}
                      label="Starts in"
                      icon={<Icon name="clock" size={12} />}
                    />
                    {!canCancel && (
                      <span className="mb-strip-note">
                        <Icon name="lock" size={11} /> Cancellation closed
                      </span>
                    )}
                  </div>
                )}

                <div className="mb-card-foot">
                  <p className="mb-total">
                    ₹{g.total.toLocaleString('en-IN')}
                    {g.payAtVenue && <span className="mb-venue-pill">Due at ground</span>}
                  </p>
                  <p className="mb-tap-hint">Tap to view pass</p>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ══ CANCELLED — bookings and plans together ══ */}
      {tab === 'cancelled' && !loading && (
        <>
          {cancelledItems.length === 0 && (
            <div className="mb-empty">
              <div className="mb-empty-icon"><Icon name="undo" size={34} /></div>
              <p className="mb-empty-title">No cancellations</p>
              <p className="mb-empty-sub">
                Cancelled bookings, plans and their refunds show up here.
              </p>
            </div>
          )}

          <div className="mb-list">
            {cancelledItems.map(item =>
              item.kind === 'plan' ? (
                <PlanCard key={item.data._id} p={item.data}
                  onClick={() => setPlanDetail(item.data)} />
              ) : (
                <div key={item.data.key} className="mb-card mb-clickable mb-card-off"
                  onClick={() => setDetail(item.data)}>
                  <div className="mb-card-head">
                    <div className="mb-date-box">
                      <span className="mb-date-day">{item.data.date.split('-')[2]}</span>
                      <span className="mb-date-mon">
                        {new Date(item.data.date)
                          .toLocaleDateString('en-IN', { month: 'short' }).toUpperCase()}
                      </span>
                    </div>
                    <div className="mb-card-mid">
                      <p className="mb-turf">{item.data.first.turf?.name || 'Turf'}</p>
                      <p className="mb-city">{item.data.first.turf?.city}</p>
                      <p className="mb-time">
                        <Icon name="clock" size={13} />
                        <span className="mb-range">{item.data.range}</span>
                        {item.data.count > 1 && (
                          <span className="mb-hours-pill">{item.data.count} hrs</span>
                        )}
                      </p>
                    </div>
                    <div className="mb-card-right">
                      <span className="mb-status mb-status-red">Cancelled</span>
                      <span className="mb-chevron">›</span>
                    </div>
                  </div>
                  <div className="mb-card-foot">
                    <p className="mb-total">
                      ₹{item.data.total.toLocaleString('en-IN')}
                      {!item.data.payAtVenue && (
                        <span className="mb-refund-pill">Refunded</span>
                      )}
                    </p>
                    <p className="mb-tap-hint">Tap to view pass</p>
                  </div>
                </div>
              )
            )}
          </div>
        </>
      )}

      {/* ══ PLANS ══ */}
      {tab === 'plans' && !loading && (
        <>
          {activePlans.length === 0 && (
            <div className="mb-empty">
              <div className="mb-empty-icon"><Icon name="star" size={34} /></div>
              <p className="mb-empty-title">No active plans</p>
              <p className="mb-empty-sub">
                Buy an owner plan to list your ground on TurfArena.
              </p>
              <button className="btn-primary" onClick={() => navigate('/plan')}>
                View plans
              </button>
            </div>
          )}
          <div className="mb-list">
            {activePlans.map(p => (
              <PlanCard key={p._id} p={p} onClick={() => setPlanDetail(p)} />
            ))}
          </div>
        </>
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

              {statusOf(detail) === 'Confirmed' && (
                <div className="mb-detail-timer">
                  <Icon name="clock" size={15} />
                  <div>
                    <p className="mb-detail-timer-label">Your game starts in</p>
                    <Countdown to={groupStart(detail)} className="cd-big" />
                  </div>
                </div>
              )}

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
                  {planDetail.refundId && (
                    <div className="ticket-detail-row">
                      <span>Refund ID</span>
                      <span className="ticket-mono">{planDetail.refundId}</span>
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

              {planDetail.status === 'active' &&
               new Date(planDetail.expiryDate) < new Date() && (
                <div className="pl-expired">
                  <Icon name="clock" size={16} />
                  <div>
                    <p className="pl-expired-title">This plan has expired</p>
                    <p className="pl-expired-sub">
                      Your grounds are hidden from players. Buy a new plan and they
                      come back 24 hours later — nothing was deleted.
                    </p>
                  </div>
                </div>
              )}

              {planDetail.status === 'active' && !planDetail.isMature && planDetail.startDate && (
                <div className="pl-note">
                  <Icon name="clock" size={16} />
                  <div>
                    <p className="pl-note-title">Grounds go live in</p>
                    <Countdown
                      to={new Date(new Date(planDetail.startDate).getTime() + 24 * 3600e3)}
                      className="cd-big"
                    />
                    <p className="pl-note-sub">
                      They stay hidden from players until then, which is also your
                      cancellation window.
                    </p>
                  </div>
                </div>
              )}

              {planDetail.status === 'active' && 
               new Date(planDetail.expiryDate) >= new Date() && planDetail.startDate && (
                planDetail.canCancel ? (
                  <>
                    <div className="pl-window">
                      <Icon name="alert" size={15} />
                      <span>Full refund available for</span>
                      <Countdown
                        to={new Date(new Date(planDetail.startDate).getTime() + 24 * 3600e3)}
                        compact
                      />
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
                      You had not paid — {cancelling.first.turf?.name}
                      {' · '}{prettyDate(cancelling.date)}
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
              <button className="sheet-close" disabled={busy}
                onClick={() => setCancellingPlan(null)}>
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
              <button className="btn-ghost" disabled={busy}
                onClick={() => setCancellingPlan(null)}>
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