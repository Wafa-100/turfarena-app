import { useLocation, useNavigate } from 'react-router-dom'
import BookingTicket from '../components/BookingTicket'

export default function BookingConfirmation() {
  const navigate = useNavigate()
  const state = useLocation().state

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

  return (
    <div className="page ticket-page">
      <div className="ticket-header">
        <div className="ticket-check-anim"><div className="ticket-check-circle">✓</div></div>
        <h1 className="ticket-title">Booking Confirmed</h1>
        <p className="ticket-subtitle">
          {list.length > 1 ? `${list.length} Hours Reserved` : 'Your Slot Is Reserved'}
          {' · '}Show This At The Venue
        </p>
      </div>

      <BookingTicket
        bookings={list}
        payment={payment}
        email={email}
        status="Confirmed"
      />

      <div className="ticket-actions">
        <button className="btn-primary" onClick={() => navigate('/bookings')}>
          View My Bookings
        </button>
        <button className="btn-ghost" onClick={() => navigate('/')}>
          Back To Home
        </button>
      </div>
    </div>
  )
}