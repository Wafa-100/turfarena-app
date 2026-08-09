import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchTurfs } from '../utils/api'
import Icon from '../components/Icon'

const SPORTS = ['All', 'Football', 'Cricket', 'Badminton', 'Tennis', 'Multi-Sport']

function greet() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function TurfCardSkeleton() {
  return (
    <div className="tcard tcard-sk">
      <div className="sk tcard-sk-img" />
      <div className="tcard-sk-body">
        <div className="sk sk-line" style={{ width: '62%' }} />
        <div className="sk sk-line" style={{ width: '40%' }} />
      </div>
    </div>
  )
}

function TurfCard({ turf }) {
  const photo = turf.photo || turf.photos?.[0]
  return (
    <Link to={`/turf/${turf._id}`} className="tcard">
      <div className="tcard-media">
        {photo
          ? <img src={photo} alt={turf.name} className="tcard-img" loading="lazy" decoding="async" />
          : <div className="tcard-img tcard-noimg" />}
        <div className="tcard-scrim" />

        <span className="tcard-sport">{turf.sport}</span>

        {turf.rating > 0 && (
          <span className="tcard-rating">
            <Icon name="star" size={11} filled />
            {turf.rating}
          </span>
        )}

        <div className="tcard-overlay">
          <h3 className="tcard-name">{turf.name}</h3>
          <p className="tcard-loc">
            <Icon name="pin" size={12} />
            {turf.city}
          </p>
        </div>
      </div>

      <div className="tcard-foot">
        <div className="tcard-price">
          <span className="tcard-price-num">₹{turf.price}</span>
          <span className="tcard-price-unit">/ hour</span>
        </div>
        <span className="tcard-cta">
          Book <Icon name="arrow" size={15} />
        </span>
      </div>
    </Link>
  )
}

export default function Home({ user }) {
  const [turfs, setTurfs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [sport, setSport] = useState('All')

  useEffect(() => {
    fetchTurfs()
      .then(setTurfs)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const q = query.trim().toLowerCase()
  const filtered = turfs.filter(t =>
    (sport === 'All' || t.sport === sport) &&
    (!q || t.name.toLowerCase().includes(q) || t.city.toLowerCase().includes(q))
  )

  const firstName = user.name.trim().split(' ')[0]
  const cities = [...new Set(turfs.map(t => t.city))].length

  return (
    <div className="hm-page">

      {/* ── Editorial header ── */}
      <header className="hm-head">
        <p className="hm-eyebrow">{greet()}</p>
        <h1 className="hm-name">{firstName}</h1>
        <p className="hm-sub">
          {turfs.length} grounds{cities > 0 && <> across {cities} cities</>} — ready when you are
        </p>
      </header>

      {/* ── Search ── */}
      <div className="hm-search">
        <Icon name="search" size={18} className="hm-search-icon" />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search a ground or city"
        />
        {query && (
          <button className="hm-search-clear" onClick={() => setQuery('')}>✕</button>
        )}
      </div>

      {/* ── Sport filter ── */}
      <div className="hm-filters">
        {SPORTS.map(s => (
          <button
            key={s}
            className={'hm-filter' + (sport === s ? ' hm-filter-on' : '')}
            onClick={() => setSport(s)}
          >
            {s}
          </button>
        ))}
      </div>

      {/* ── Results ── */}
      <div className="hm-results-bar">
        <span className="hm-results-count">
          {loading ? 'Finding grounds' : `${filtered.length} available`}
        </span>
        {sport !== 'All' && (
          <button className="hm-clear-filter" onClick={() => setSport('All')}>
            Clear filter
          </button>
        )}
      </div>

      {error && <p className="error">{error}</p>}

      <div className="hm-grid">
        {loading && [0, 1, 2].map(i => <TurfCardSkeleton key={i} />)}

        {!loading && !error && filtered.length === 0 && (
          <div className="hm-empty">
            <Icon name="search" size={34} />
            <p className="hm-empty-title">Nothing matches that</p>
            <p className="hm-empty-sub">Try another sport, or clear your search.</p>
            <button className="btn-ghost" onClick={() => { setQuery(''); setSport('All') }}>
              Show everything
            </button>
          </div>
        )}

        {filtered.map(t => <TurfCard key={t._id} turf={t} />)}
      </div>
    </div>
  )
}