import { useState, useEffect } from 'react'
import { prettyDate, formatDateTime } from '../utils/slots'
import { fetchBookingEmail } from '../utils/api'
import Icon from './Icon'

/* QR pattern generated from the booking id */
function MockQR({ value, dim }) {
  const n = 17
  const seed = [...(value || 'demo')].reduce((a, c, i) => a * 31 + c.charCodeAt(0) * (i + 1), 7)
  const cells = Array.from({ length: n * n }, (_, i) => {
    const r = Math.floor(i / n), c = i % n
    if (r < 5 && c < 5)    { const m = Math.max(Math.abs(r - 2), Math.abs(c - 2));       return m !== 1 }
    if (r < 5 && c >= n-5) { const m = Math.max(Math.abs(r - 2), Math.abs(c - (n - 3))); return m !== 1 }
    if (r >= n-5 && c < 5) { const m = Math.max(Math.abs(r - (n - 3)), Math.abs(c - 2)); return m !== 1 }
    return ((seed * (i + 1) * 997 + i * 137) % 100) < 52
  })
  return (
    <div className={'qr-wrap' + (dim ? ' qr-dim' : '')}>
      <div className="qr-grid" style={{ gridTemplateColumns: `repeat(${n}, 1fr)` }}>
        {cells.map((d, i) => <div key={i} className={d ? 'qr-dark' : 'qr-light'} />)}
      </div>
    </div>
  )
}

export default function BookingTicket({ bookings, payment, email: emailProp, status, refund }) {
  const [email, setEmail] = useState(emailProp || null)
  const [showEmail, setShowEmail] = useState(false)

  const first = bookings[0]

  useEffect(() => {
    if (!emailProp && first?._id) {
      fetchBookingEmail(first._id).then(setEmail).catch(() => {})
    }
  }, [first?._id])

  const slots = bookings
    .map(b => b.slot)
    .sort((a, b) => parseInt(a, 10) - parseInt(b, 10))
  const multi = bookings.length > 1
  const total = payment?.amount ?? bookings.reduce((s, b) => s + (b.price || 0), 0)
  const cancelled = status === 'Cancelled'

  const statusLabel =
    status === 'Cancelled' ? 'CANCELLED'
      : status === 'Completed' ? 'COMPLETED'
      : 'CONFIRMED'

  return (
    <div className={'ticket-card' + (cancelled ? ' ticket-cancelled' : '')}>
      {cancelled && <div className="ticket-stamp">CANCELLED</div>}

      <div className="ticket-turf-name">{first.turf?.name || 'Turf'}</div>
      <p className="ticket-turf-city">
        <Icon name="pin" size={13} /> {first.turf?.city}
      </p>

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
            {multi ? `${bookings.length} hours` : first.slot}
          </p>
        </div>
      </div>

      {multi && (
        <>
          <div className="ticket-divider"><span /><span /></div>
          <p className="ticket-slots-label">YOUR HOURS</p>
          <div className="ticket-slots">
            {slots.map((s, i) => (
              <div key={s} className="ticket-slot-row">
                <span className="ticket-slot-num">{i + 1}</span>
                <span className="ticket-slot-time">{s}</span>
                <span className="ticket-slot-price">₹{bookings[i]?.price}</span>
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
          <div className="ticket-detail-row"><span>Hours booked</span><span>{bookings.length}</span></div>
        )}
        <div className="ticket-detail-row">
          <span>{cancelled ? 'Amount' : 'Total paid'}</span>
          <span className="ticket-amount">₹{total.toLocaleString('en-IN')}</span>
        </div>
        <div className="ticket-detail-row"><span>Payment</span><span>{payment?.method || '—'}</span></div>
        <div className="ticket-detail-row">
          <span>Payment ID</span><span className="ticket-mono">{payment?.paymentId || '—'}</span>
        </div>
        <div className="ticket-detail-row">
          <span>Booked at</span><span>{formatDateTime(first.createdAt)}</span>
        </div>
        <div className="ticket-detail-row">
          <span>Status</span>
          <span className={'ticket-status-badge'
            + (cancelled ? ' tsb-red' : status === 'Completed' ? ' tsb-grey' : '')}>
            {statusLabel}
          </span>
        </div>
      </div>

      {cancelled && refund && (
        <>
          <div className="ticket-divider"><span /><span /></div>
          <div className="refund-receipt">
            <div className="refund-receipt-head">
              <span className="refund-receipt-icon"><Icon name="undo" size={17} /></span>
              <div>
                <p className="refund-receipt-title">Refund receipt</p>
                <p className="refund-receipt-sub">{refund.status}</p>
              </div>
              <span className="refund-receipt-amt">₹{refund.amount?.toLocaleString('en-IN')}</span>
            </div>
            <div className="ticket-details" style={{ marginTop: 12 }}>
              <div className="ticket-detail-row">
                <span>Refund ID</span><span className="ticket-mono">{refund.refundId}</span>
              </div>
              <div className="ticket-detail-row">
                <span>Refund to</span><span>{refund.refundMethod}</span>
              </div>
              {refund.refundDetails && (
                <div className="ticket-detail-row">
                  <span>Account</span><span className="ticket-mono">{refund.refundDetails}</span>
                </div>
              )}
              <div className="ticket-detail-row">
                <span>Initiated</span><span>{formatDateTime(refund.createdAt)}</span>
              </div>
              {refund.expectedBy && (
                <div className="ticket-detail-row">
                  <span>Expected by</span><span>{refund.expectedBy}</span>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      <div className="ticket-divider"><span /><span /></div>

      <div className="ticket-qr-section">
        <MockQR value={String(first._id)} dim={cancelled} />
        <p className="ticket-qr-label">
          {cancelled ? 'This pass is no longer valid' : 'Scan at venue entrance'}
        </p>
      </div>

      {email && (
        <>
          <button className="btn-email-toggle" onClick={() => setShowEmail(v => !v)}>
            <Icon name="mail" size={15} />
            {showEmail ? 'Hide' : 'View'} confirmation email
          </button>
          {showEmail && (
            <div className="email-card" style={{ marginTop: 10 }}>
              <p style={{ fontSize: 12, marginBottom: 4 }}>
                <b>To:</b> {email.to}<br /><b>Subject:</b> {email.subject}
              </p>
              <div className="email-body">{email.body}</div>
            </div>
          )}
        </>
      )}
    </div>
  )
}