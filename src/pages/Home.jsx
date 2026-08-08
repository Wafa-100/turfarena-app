import { useEffect, useState } from 'react'
import { fetchTurfs } from '../utils/api'
import TurfCard from '../components/TurfCard'

const SPORTS = ['All', 'Football', 'Cricket', 'Badminton', 'Tennis', 'Multi-Sport']

export default function Home({ user }) {
  const [turfs, setTurfs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [sport, setSport] = useState('All')

  useEffect(() => {
    fetchTurfs()
      .then(setTurfs)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const filtered = turfs.filter((t) => {
    const matchesSport = sport === 'All' || t.sport === sport
    const q = query.toLowerCase()
    return matchesSport &&
      (t.name.toLowerCase().includes(q) || t.city.toLowerCase().includes(q))
  })

  return (
    <div className="page">
      <header className="page-head">
        <h1>Hi {user.name.split(' ')[0]} 👋</h1>
        <p className="muted">{turfs.length} Turfs Available — Pick One And Play</p>
      </header>

      <input className="search" placeholder="Search By Turf Name Or City…"
        value={query} onChange={(e) => setQuery(e.target.value)} />

      <div className="chips">
        {SPORTS.map((s) => (
          <button key={s} className={'chip' + (sport === s ? ' chip-active' : '')}
            onClick={() => setSport(s)}>{s}</button>
        ))}
      </div>

      <div className="card-list">
        {loading && <p className="muted">Loading Turfs From India</p>}
        {error && <p className="error">{error}</p>}
        {!loading && !error && filtered.length === 0 && (
          <p className="muted">No Turf Match Your Search.</p>
        )}
        {filtered.map((t) => <TurfCard key={t._id} turf={t} />)}
      </div>
    </div>
  )
}