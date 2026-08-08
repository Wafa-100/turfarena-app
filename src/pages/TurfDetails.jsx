import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { fetchTurf } from '../utils/api'
import { buildMapUrl, buildMapLink } from '../utils/geocode'

export default function TurfDetails({user}) {
  const { id } = useParams()
  const navigate = useNavigate()
  const [turf, setTurf] = useState(null)
  const [error, setError] = useState('')
  const [photoIdx, setPhotoIdx] = useState(0)

  useEffect(() => {
    fetchTurf(id).then(setTurf).catch(e => setError(e.message))
  }, [id])

  if (error) return <div className="page"><p className="error">{error}</p></div>
  if (!turf) return <div className="page"><p className="muted">Loading…</p></div>

  // Build the photos list — use photos[] first, fall back to single photo
  const allPhotos = (turf.photos && turf.photos.length > 0)
    ? turf.photos
    : (turf.photo ? [turf.photo] : [`https://picsum.photos/seed/${turf._id}/600/400`])

  const prevPhoto = () => setPhotoIdx(i => (i - 1 + allPhotos.length) % allPhotos.length)
  const nextPhoto = () => setPhotoIdx(i => (i + 1) % allPhotos.length)

  const hasMap = turf.lat && turf.lng

  return (
    <div className="page no-pad-top">

      {/* ── Photo carousel ── */}
      <div className="carousel-wrap">
        <img
          key={photoIdx}
          src={allPhotos[photoIdx]}
          alt={`${turf.name} photo ${photoIdx + 1}`}
          className="hero-img carousel-img"
        />

        {/* Back button */}
        <button className="back-fab" onClick={() => navigate(-1)}>←</button>

        {/* Left / right arrows — only show if more than 1 photo */}
        {allPhotos.length > 1 && (
          <>
            <button className="carousel-arrow carousel-left" onClick={prevPhoto}>‹</button>
            <button className="carousel-arrow carousel-right" onClick={nextPhoto}>›</button>
          </>
        )}

        {/* Photo counter badge */}
        {allPhotos.length > 1 && (
          <div className="carousel-counter">
            {photoIdx + 1} / {allPhotos.length}
          </div>
        )}

        {/* Dot indicators */}
        {allPhotos.length > 1 && (
          <div className="carousel-dots">
            {allPhotos.map((_, i) => (
              <button key={i}
                className={'carousel-dot' + (i === photoIdx ? ' carousel-dot-active' : '')}
                onClick={() => setPhotoIdx(i)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Details ── */}
      <div className="page-inner">
        <div className="card-title-row">
          <h1>{turf.name}</h1>
          <span className="rating">★ {turf.rating}</span>
        </div>
        <p className="muted">{turf.sport} • {turf.city}</p>
        <p className="price big">₹{turf.price}<span className="muted small"> /Hour</span></p>

        <h3 className="section-title">Details</h3>
        <ul className="detail-list">
          <li><span>Timings</span><b>{turf.openTime} – {turf.closeTime}</b></li>
          <li><span>Surface</span><b>{turf.surface}</b></li>
          <li><span>Size</span><b>{turf.size}</b></li>
          <li><span>Address</span><b>{turf.address}</b></li>
        </ul>

        <h3 className="section-title">Amenities</h3>
        <div className="chips">
          {(turf.amenities || []).map(a => <span key={a} className="chip">{a}</span>)}
        </div>

        <h3 className="section-title">About</h3>
        <p>{turf.description}</p>

        {/* ── REAL OpenStreetMap location ── */}
        <h3 className="section-title">Location</h3>
        {hasMap ? (
          <>
            <iframe
              title="real-map"
              className="map-frame"
              loading="lazy"
              src={buildMapUrl(turf.lat, turf.lng)}
            />
            <a
              className="link-row"
              href={buildMapLink(turf.lat, turf.lng, turf.name)}
              target="_blank" rel="noreferrer"
            >
              📍 Open In OpenStreetMap — {turf.address}, {turf.city}
            </a>
          </>
        ) : (
          <p className="coord-note">📍 {turf.address}, {turf.city}</p>
        )}

        <a className="link-row" href={`tel:${turf.phone}`}>📞 {turf.phone}</a>

{/* Show Edit button ONLY to the turf owner */}
        {user && turf.owner && String(turf.owner) === String(user.id) && (
          <button className="btn-owner-edit"
            onClick={() => navigate(`/edit-turf/${turf._id}`)}>
            ✏️ Edit My Turf Details
          </button>
        )}

        <button className="btn-primary sticky-cta"
          onClick={() => navigate(`/book/${turf._id}`)}>
          Book Now
        </button>
      </div>
    </div>
  )
}