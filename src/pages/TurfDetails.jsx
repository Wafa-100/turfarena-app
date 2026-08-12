import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { fetchTurf, fetchTurfReviews, canReviewTurf } from '../utils/api'
import { buildMapUrl, buildMapLink } from '../utils/geocode'
import { priceRange } from '../utils/pricing'
import { Stars } from '../components/StarRating'
import ReviewCard from '../components/ReviewCard'
import Countdown from '../components/Countdown'
import Icon from '../components/Icon'

export default function TurfDetails({ user }) {
  const { id } = useParams()
  const navigate = useNavigate()

  const [turf, setTurf] = useState(null)
  const [error, setError] = useState('')
  const [idx, setIdx] = useState(0)

  const [reviews, setReviews] = useState([])
  const [reviewTotal, setReviewTotal] = useState(0)
  const [showAll, setShowAll] = useState(false)
  const [sort, setSort] = useState('recent')
  const [filterStar, setFilterStar] = useState('all')
  const [canReview, setCanReview] = useState(null)

  useEffect(() => {
    fetchTurf(id).then(setTurf).catch(e => setError(e.message))
  }, [id])

  function loadReviews() {
    const q = `?sort=${sort}&rating=${filterStar}` + (showAll ? '' : '&limit=5')
    fetchTurfReviews(id, q)
      .then(r => { setReviews(r.reviews); setReviewTotal(r.total) })
      .catch(() => {})
  }
  useEffect(() => { loadReviews() }, [id, sort, filterStar, showAll])

  useEffect(() => {
    if (user) canReviewTurf(id, user.id).then(setCanReview).catch(() => {})
  }, [id])

  if (error) return <div className="page"><p className="error">{error}</p></div>
  if (!turf) return <div className="page"><p className="muted">Loading…</p></div>

  const photos = (turf.photos?.length ? turf.photos : [turf.photo]).filter(Boolean)
  const hasMap = turf.lat && turf.lng
  const isOwner = user && turf.owner && String(turf.owner) === String(user.id)
  const notLive = turf.isLive === false
  const closed = turf.isOpen === false

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

        {/* ── Not live yet ── */}
        {notLive && (
          <div className="td-pending">
            <Icon name={turf.pendingActivation ? 'clock' : 'lock'} size={18} />
            <div>
              <p className="td-pending-title">
                {turf.pendingActivation ? 'Not live yet'
                  : turf.notSelected ? 'Hidden by the owner'
                  : 'Not accepting bookings'}
              </p>
              <p className="td-pending-sub">
                {turf.pendingActivation
                  ? 'This ground becomes bookable 24 hours after the plan started.'
                  : turf.notSelected
                    ? "The owner's current plan does not include this ground."
                    : 'The owner does not have an active plan.'}
              </p>
              {turf.pendingActivation && turf.planStartDate && (
                <div style={{ marginTop: 8 }}>
                  <Countdown
                    to={new Date(new Date(turf.planStartDate).getTime() + 24 * 3600e3)}
                    label="Live in"
                    icon={<Icon name="clock" size={12} />}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Closed ── */}
        {closed && !notLive && (
          <div className="td-closed">
            <Icon name="lock" size={18} />
            <div>
              <p className="td-closed-title">Closed for bookings</p>
              <p className="td-closed-sub">
                {turf.closedNote || 'The owner has paused new bookings.'}
              </p>
            </div>
          </div>
        )}

        {/* ── Price strip ── */}
        <div className="td-strip">
          <div>
            <p className="td-strip-label">
              {turf.pricingMode === 'bands' ? 'Rates from' : 'Price per hour'}
            </p>
            <p className="td-strip-price">
              {priceRange(turf)}<span>/hr</span>
            </p>
            {turf.paymentMode === 'venue' && (
              <span className="td-venue-tag">
                <Icon name="wallet" size={12} /> Pay at ground
              </span>
            )}
          </div>

          {turf.reviewCount > 0 ? (
            <div className="td-strip-rating">
              <Stars value={turf.rating} size={14} />
              <div>
                <p className="td-strip-rate-num">{turf.rating}</p>
                <p className="td-strip-rate-lbl">{turf.reviewCount} reviews</p>
              </div>
            </div>
          ) : (
            <span className="td-no-rating">No ratings yet</span>
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

        {/* ── Rate bands ── */}
        {turf.pricingMode === 'bands' && turf.priceBands?.length > 0 && (
          <section className="td-section">
            <h2 className="td-h2">Rates by time</h2>
            <div className="td-bands">
              {turf.priceBands.map((b, i) => (
                <div key={i} className="td-band">
                  <div>
                    <p className="td-band-label">{b.label || 'Slot'}</p>
                    <p className="td-band-time">{b.from} – {b.to}</p>
                  </div>
                  <span className="td-band-price">₹{b.price}<small>/hr</small></span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Reviews ── */}
        <section className="td-section">
          <div className="rv-head-row">
            <h2 className="td-h2" style={{ margin: 0 }}>
              Reviews {reviewTotal > 0 && `(${reviewTotal})`}
            </h2>
            {canReview?.canReview && (
              <button className="rv-write-btn"
                onClick={() => navigate(`/reviews?turf=${id}`)}>
                <Icon name="edit" size={14} /> Write one
              </button>
            )}
          </div>

          {reviewTotal === 0 ? (
            <div className="rv-empty">
              <Icon name="star" size={28} />
              <p className="rv-empty-title">No reviews yet</p>
              <p className="rv-empty-sub">
                {canReview?.canReview
                  ? 'You have played here — be the first to review it.'
                  : 'Reviews appear once players have been here.'}
              </p>
              {canReview?.canReview && (
                <button className="btn-ghost" onClick={() => navigate(`/reviews?turf=${id}`)}>
                  Write the first review
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="rv-summary">
                <div className="rv-score">
                  <p className="rv-score-num">{turf.rating}</p>
                  <Stars value={turf.rating} size={15} />
                  <p className="rv-score-count">{turf.reviewCount} reviews</p>
                </div>
                <div className="rv-bars">
                  {[['five', 5], ['four', 4], ['three', 3], ['two', 2], ['one', 1]]
                    .map(([key, n]) => {
                      const count = turf.ratingBreakdown?.[key] || 0
                      const pct = turf.reviewCount ? (count / turf.reviewCount) * 100 : 0
                      return (
                        <button key={n}
                          className={'rv-bar-row' + (filterStar === String(n) ? ' rv-bar-on' : '')}
                          onClick={() =>
                            setFilterStar(filterStar === String(n) ? 'all' : String(n))}>
                          <span className="rv-bar-n">{n}</span>
                          <span className="rv-bar-track">
                            <span className="rv-bar-fill" style={{ width: `${pct}%` }} />
                          </span>
                          <span className="rv-bar-c">{count}</span>
                        </button>
                      )
                    })}
                </div>
              </div>

              <div className="rv-filters">
                <select value={sort} onChange={e => setSort(e.target.value)} className="rv-sort">
                  <option value="recent">Most recent</option>
                  <option value="helpful">Most helpful</option>
                  <option value="highest">Highest rated</option>
                  <option value="lowest">Lowest rated</option>
                </select>
                {filterStar !== 'all' && (
                  <button className="rv-clear" onClick={() => setFilterStar('all')}>
                    {filterStar} stars <Icon name="close" size={12} />
                  </button>
                )}
              </div>

              <div className="rv-list">
                {reviews.map(r => (
                  <ReviewCard key={r._id} review={r} user={user}
                    isOwner={isOwner} onChange={loadReviews} />
                ))}
              </div>

              {!showAll && reviewTotal > 5 && (
                <button className="rv-more" onClick={() => setShowAll(true)}>
                  Show all {reviewTotal} reviews
                </button>
              )}
              {showAll && reviews.length > 5 && (
                <button className="rv-more" onClick={() => setShowAll(false)}>
                  Show fewer
                </button>
              )}
            </>
          )}
        </section>

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
            <Icon name="phone" size={17} />
            <span>{turf.phone}</span>
            <Icon name="chevron" size={16} className="td-link-arrow" />
          </a>
        </section>

        {isOwner && (
          <>
            <button className="td-owner-btn" onClick={() => navigate(`/manage/${turf._id}`)}>
              Manage this ground
            </button>
            <button className="btn-ghost" onClick={() => navigate(`/edit-turf/${turf._id}`)}>
              Edit listing details
            </button>
          </>
        )}

        <div style={{ height: 92 }} />
      </div>

      {/* ── Sticky bar ── */}
      <div className="td-bar">
        <div className="td-bar-inner">
          <div>
            <p className="td-bar-label">
              {turf.paymentMode === 'venue' ? 'Pay at ground' : 'From'}
            </p>
            <p className="td-bar-price">₹{turf.price}<span>/hr</span></p>
          </div>
          <button className="td-bar-btn"
            disabled={notLive || closed}
            onClick={() => navigate(`/book/${turf._id}`)}>
            {notLive
              ? (turf.pendingActivation ? 'Not live yet' : 'Closed')
              : closed ? 'Currently closed'
              : 'Check availability'}
          </button>
        </div>
      </div>
    </div>
  )
}