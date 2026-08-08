import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchMyBookings, cancelBookingApi, fetchRefund } from '../utils/api'
import { prettyDate, formatDateTime, todayIso } from '../utils/slots'

function RefundNote({ id }) {
  const [r, setR] = useState(null)
  useEffect(() => { fetchRefund(id).then(setR).catch(() => {}) }, [id])
  if (!r) return null
  return (
    <div className="mb-refund">
      <span className="mb-refund-icon">↩️</span>
      <div>
        <p className="mb-refund-title">₹{r.amount} Refunded</p>
        <p className="mb-refund-sub">Ref: {r.refundId}</p>
      </div>
    </div>
  )
}

export default function MyBookings({ user }) {
  const navigate = useNavigate()
  const [all, setAll] = useState([])
  const [tab, setTab] = useState('upcoming')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  function load() {
    fetchMyBookings(user.id)
      .then(setAll)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }
  useEffect(load, [])

  async function cancel(id) {
    if (!window.confirm('Cancel This Booking? Your Money Will Be Refunded.')) return
    try { await cancelBookingApi(id, user.id); load() }
    catch (e) { setError(e.message) }
  }

  const today = todayIso()
  const upcoming = all.filter(b => b.status === 'Confirmed' && b.date >= today)
  const past     = all.filter(b => b.status === 'Confirmed' && b.date < today)
  const cancelled = all.filter(b => b.status === 'Cancelled')

  const TABS = [
    { id: 'upcoming',  label: 'Upcoming',  list: upcoming },
    { id: 'past',      label: 'Completed', list: past },
    { id: 'cancelled', label: 'Cancelled', list: cancelled }
  ]
  const active = TABS.find(t => t.id === tab)

  return (
    <div className="page mb-page">
      <header className="page-head">
        <h1>My Bookings</h1>
        <p className="muted">All Your Ground Reservations</p>
      </header>

      <div className="mb-tabs">
        {TABS.map(t => (
          <button key={t.id} className={'mb-tab' + (tab === t.id ? ' mb-tab-on' : '')}
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
            {tab === 'upcoming'
              ? 'Find A Ground And Book Your Next Game.'
              : tab === 'past'
              ? 'Your Finished Games Will Appear Here.'
              : 'Cancelled Bookings And Refunds Show Up Here.'}
          </p>
          {tab === 'upcoming' && (
            <button className="btn-primary" onClick={() => navigate('/')}>Browse Grounds</button>
          )}
        </div>
      )}

      <div className="mb-list">
        {active.list.map(b => {
          const isUpcoming = b.status === 'Confirmed' && b.date >= today
          return (
            <div key={b._id} className={'mb-card' + (b.status === 'Cancelled' ? ' mb-card-off' : '')}>
              <div className="mb-card-head">
                <div className="mb-date-box">
                  <span className="mb-date-day">{b.date.split('-')[2]}</span>
                  <span className="mb-date-mon">
                    {new Date(b.date).toLocaleDateString('en-IN', { month: 'short' }).toUpperCase()}
                  </span>
                </div>
                <div className="mb-card-mid">
                  <p className="mb-turf">{b.turf?.name || 'Turf'}</p>
                  <p className="mb-city">{b.turf?.city}</p>
                  <p className="mb-time">🕐 {b.slot}</p>
                </div>
                <span className={'mb-status ' +
                  (b.status === 'Cancelled' ? 'mb-status-red'
                    : isUpcoming ? 'mb-status-green' : 'mb-status-grey')}>
                  {b.status === 'Cancelled' ? 'Cancelled' : isUpcoming ? 'Confirmed' : 'Completed'}
                </span>
              </div>

              <div className="mb-card-foot">
                <div className="mb-meta">
                  <p className="mb-meta-row"><span>Amount</span><b>₹{b.price}</b></p>
                  <p className="mb-meta-row"><span>Payment</span><b>{b.payment?.paymentId || '—'}</b></p>
                  <p className="mb-meta-row"><span>Booked</span><b>{formatDateTime(b.createdAt)}</b></p>
                </div>
                {isUpcoming && (
                  <button className="mb-cancel" onClick={() => cancel(b._id)}>Cancel & Refund</button>
                )}
              </div>

              {b.status === 'Cancelled' && <RefundNote id={b._id} />}
            </div>
          )
        })}
      </div>
    </div>
  )
}