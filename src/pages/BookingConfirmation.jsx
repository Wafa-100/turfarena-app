import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { prettyDate, formatDateTime } from '../utils/slots'

function MockQR({ value }) {
  const n = 17
  const seed = [...(value || 'demo')].reduce((a, c, i) => a * 31 + c.charCodeAt(0) * (i + 1), 7)
  const cells = Array.from({ length: n * n }, (_, i) => {
    const r = Math.floor(i / n), c = i % n
    if (r < 5 && c < 5)        { const m = Math.max(Math.abs(r-2), Math.abs(c-2)); return m !== 1 }
    if (r < 5 && c >= n-5)     { const m = Math.max(Math.abs(r-2), Math.abs(c-(n-3))); return m !== 1 }
    if (r >= n-5 && c < 5)     { const m = Math.max(Math.abs(r-(n-3)), Math.abs(c-2)); return m !== 1 }
    return ((seed * (i + 1) * 997 + i * 137) % 100) < 52
  })
  return (
    <div className="qr-wrap">
      <div className="qr-grid" style={{ gridTemplateColumns: `repeat(${n}, 1fr)` }}>
        {cells.map((d, i) => <div key={i} className={d ? 'qr-dark' : 'qr-light'} />)}
      </div>
    </div>
  )
}

export default function BookingConfirmation() {
  const navigate = useNavigate()
  const state = useLocation().state
  const [showEmail, setShowEmail] = useState(false)

  if (!state) {
    return (
      <div className="page center-page">
        <p className="muted">No Booking To Show.</p>
        <button className="btn-primary" onClick={() => navigate('/')}>Back To Home</button>
      </div>
    )
  }

  const { bookings, booking, payment, email } = state
  const list = bookings && bookings.length ? bookings : [booking]
  const first = list[0]
  const multi = list.length > 1
  const sortedSlots = list.map(b => b.slot)
    .sort((a, b) => parseInt(a.split(':')[0], 10) - parseInt(b.split(':')[0], 10))

  return (
    <div className="page ticket-page">
      <div className="ticket-header">
        <div className="ticket-check-anim"><div className="ticket-check-circle">✓</div></div>
        <h1 className="ticket-title">Booking Confirmed</h1>
        <p className="ticket-subtitle">
          {multi ? `${list.length} Hours Reserved` : 'Your Slots Is Reserved'} · Show This At The Venue
        </p>
      </div>

      <div className="ticket-card">
        <div className="ticket-turf-name">{first.turf?.name || 'Turf'}</div>
        <p className="ticket-turf-city">📍 {first.turf?.city}</p>

        <div className="ticket-divider"><span /><span className="ticket-scissors">✂</span><span /></div>

        <div className="ticket-datetime-row">
          <div className="ticket-datetime-block">
            <p className="ticket-datetime-label">DATE</p>
            <p className="ticket-datetime-value">{prettyDate(first.date)}</p>
          </div>
          <div className="ticket-datetime-sep" />
          <div className="ticket-datetime-block">
            <p className="ticket-datetime-label">{multi ? 'DURATION' : 'TIME SLOT'}</p>
            <p className="ticket-datetime-value time-value">
              {multi ? `${list.length} Hours` : first.slot}
            </p>
          </div>
        </div>

        {/* All booked slots listed */}
        {multi && (
          <>
            <div className="ticket-divider"><span /><span /></div>
            <p className="ticket-slots-label">YOUR HOURS</p>
            <div className="ticket-slots">
              {sortedSlots.map((s, i) => (
                <div key={s} className="ticket-slot-row">
                  <span className="ticket-slot-num">{i + 1}</span>
                  <span className="ticket-slot-time">{s}</span>
                  <span className="ticket-slot-price">₹{list[i].price}</span>
                </div>
              ))}
            </div>
          </>
        )}

        <div className="ticket-divider"><span /><span /></div>

        <div className="ticket-details">
          <div className="ticket-detail-row">
            <span>Booking ID</span>
            <span className="ticket-id">{String(first._id).slice(-10).toUpperCase()}</span>
          </div>
          {multi && (
            <div className="ticket-detail-row"><span>Slots Booked</span><span>{list.length}</span></div>
          )}
          <div className="ticket-detail-row">
            <span>Total Paid</span>
            <span className="ticket-amount">₹{(payment?.amount || first.price).toLocaleString('en-IN')}</span>
          </div>
          <div className="ticket-detail-row"><span>Payment</span><span>{payment?.method}</span></div>
          <div className="ticket-detail-row">
            <span>Payment ID</span><span className="ticket-mono">{payment?.paymentId}</span>
          </div>
          <div className="ticket-detail-row">
            <span>Booked At</span><span>{formatDateTime(first.createdAt)}</span>
          </div>
          <div className="ticket-detail-row">
            <span>Status</span><span className="ticket-status-badge">CONFIRMED</span>
          </div>
        </div>

        <div className="ticket-divider"><span /><span /></div>

        <div className="ticket-qr-section">
          <MockQR value={first._id} />
          <p className="ticket-qr-label">Scan At Venue Entrance</p>
        </div>
      </div>

      <button className="btn-email-toggle" onClick={() => setShowEmail(v => !v)}>
        {showEmail ? 'Hide' : 'View'} Confirmation Email
      </button>
      {showEmail && email && (
        <div className="email-card" style={{ marginTop: 8 }}>
          <p style={{ fontSize: 12, marginBottom: 4 }}>
            <b>To:</b> {email.to}<br /><b>Subject:</b> {email.subject}
          </p>
          <div className="email-body">{email.body}</div>
        </div>
      )}

      <div className="ticket-actions">
        <button className="btn-primary" onClick={() => navigate('/bookings')}>View My Bookings</button>
        <button className="btn-ghost" onClick={() => navigate('/')}>Back To Home</button>
      </div>
    </div>
  )
}