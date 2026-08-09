import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { fetchTurf } from '../utils/api'
import { buildMapUrl, buildMapLink } from '../utils/geocode'
import Icon from '../components/Icon'

export default function TurfDetails({ user }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const [turf, setTurf] = useState(null)
  const [error, setError] = useState('')
  const [idx, setIdx] = useState(0)

  useEffect(() => {
    fetchTurf(id).then(setTurf).catch(e => setError(e.message))
  }, [id])

  if (error) return <div className="page"><p className="error">{error}</p></div>
  if (!turf) return <div className="page"><p className="muted">Loading…</p></div>

  const photos = (turf.photos?.length ? turf.photos : [turf.photo]).filter(Boolean)
  const hasMap = turf.lat && turf.lng
  const isOwner = user && turf.owner && String(turf.owner) === String(user.id)

  const facts = [
    { icon: 'clock',  label: 'Open',    value: `${turf.openTime} – ${turf.closeTime}` },
    { icon: 'ball',   label: 'Surface', value: turf.surface || 'Artificial turf' },
    { icon: 'shield', label: 'Size',    value: turf.size || 'Standard' }
  ]

  return (
    <div className="td-page">

      {/* ── Gallery ── */}
      <div className="td-gallery">
        {photos.length > 0 ? (
          <img key={idx} src={photos[idx]} alt={turf.name} className="td-img" />
        ) : (
          <div className="td-img td-noimg" />
        )}
        <div className="td-scrim" />

        <button className="td-back" onClick={() => navigate(-1)}>
          <Icon name="chevron" size={19} className="td-back-icon" />
        </button>

        {photos.length > 1 && (
          <>
            <span className="td-counter">{idx + 1} / {photos.length}</span>
            <div className="td-dots">
              {photos.map((_, i) => (
                <button key={i}
                  className={'td-dot' + (i === idx ? ' td-dot-on' : '')}
                  onClick={() => setIdx(i)} />
              ))}
            </div>
            <button className="td-nav td-nav-l"
              onClick={() => setIdx(i => (i - 1 + photos.length) % photos.length)}>‹</button>
            <button className="td-nav td-nav-r"
              onClick={() => setIdx(i => (i + 1) % photos.length)}>›</button>
          </>
        )}

        <div className="td-hero-text">
          <span className="td-sport">{turf.sport}</span>
          <h1 className="td-name">{turf.name}</h1>
          <p className="td-loc">
            <Icon name="pin" size={13} /> {turf.address}, {turf.city}
          </p>
        </div>
      </div>

      <div className="td-body">

        {/* ── Price + rating strip ── */}
        <div className="td-strip">
          <div>
            <p className="td-strip-label">Starting from</p>
            <p className="td-strip-price">
              ₹{turf.price}<span>/hr</span>
            </p>
          </div>
          {turf.rating > 0 && (
            <div className="td-strip-rating">
              <Icon name="star" size={15} filled />
              <div>
                <p className="td-strip-rate-num">{turf.rating}</p>
                <p className="td-strip-rate-lbl">{turf.reviews || 0} reviews</p>
              </div>
            </div>
          )}
        </div>

        {/* ── Facts ── */}
        <div className="td-facts">
          {facts.map(f => (
            <div key={f.label} className="td-fact">
              <Icon name={f.icon} size={17} className="td-fact-icon" />
              <p className="td-fact-label">{f.label}</p>
              <p className="td-fact-value">{f.value}</p>
            </div>
          ))}
        </div>

        {/* ── About ── */}
        {turf.description && (
          <section className="td-section">
            <h2 className="td-h2">About this ground</h2>
            <p className="td-desc">{turf.description}</p>
          </section>
        )}

        {/* ── Amenities ── */}
        {turf.amenities?.length > 0 && (
          <section className="td-section">
            <h2 className="td-h2">What's here</h2>
            <div className="td-amenities">
              {turf.amenities.map(a => (
                <span key={a} className="td-amenity">
                  <Icon name="check" size={13} /> {a}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* ── Location ── */}
        <section className="td-section">
          <h2 className="td-h2">Getting there</h2>
          {hasMap ? (
            <>
              <iframe
                title={`Map of ${turf.name}`}
                className="td-map"
                loading="lazy"
                src={buildMapUrl(turf.lat, turf.lng)}
              />
              <a className="td-link" href={buildMapLink(turf.lat, turf.lng, turf.name)}
                target="_blank" rel="noreferrer">
                <Icon name="pin" size={17} />
                <span>Open directions</span>
                <Icon name="chevron" size={16} className="td-link-arrow" />
              </a>
            </>
          ) : (
            <p className="td-desc">{turf.address}, {turf.city}</p>
          )}

          <a className="td-link" href={`tel:${turf.phone}`}>
            <Icon name="card" size={17} />
            <span>{turf.phone}</span>
            <Icon name="chevron" size={16} className="td-link-arrow" />
          </a>
        </section>

        {isOwner && (
          <button className="td-owner-btn" onClick={() => navigate(`/edit-turf/${turf._id}`)}>
            Edit my ground
          </button>
        )}

        <div style={{ height: 92 }} />
      </div>

      {/* ── Sticky book bar ── */}
      <div className="td-bar">
        <div className="td-bar-inner">
          <div>
            <p className="td-bar-label">From</p>
            <p className="td-bar-price">₹{turf.price}<span>/hr</span></p>
          </div>
          <button className="td-bar-btn" onClick={() => navigate(`/book/${turf._id}`)}>
            Check availability
          </button>
        </div>
      </div>
    </div>
  )
}