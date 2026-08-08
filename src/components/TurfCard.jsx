import { Link } from 'react-router-dom'

export default function TurfCard({ turf }) {
  return (
    <Link to={`/turf/${turf._id}`} className="card">
      <img src={turf.photo} alt={turf.name} className="card-img" />
      <div className="card-body">
        <div className="card-title-row">
          <h3>{turf.name}</h3>
          <span className="rating">★ {turf.rating}</span>
        </div>
        <p className="muted">{turf.sport} • {turf.city}</p>
        <p className="muted small">{turf.address}</p>
        <p className="price">₹{turf.price}<span className="muted small"> /Hour</span></p>
      </div>
    </Link>
  )
}