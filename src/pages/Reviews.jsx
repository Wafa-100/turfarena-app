import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  fetchMyReviews, createReview, updateReview, deleteReview, fetchTurf
} from '../utils/api'
import StarRating, { Stars } from '../components/StarRating'
import Icon from '../components/Icon'

const TAGS = [
  'Great surface', 'Well lit', 'Clean facilities', 'Easy parking',
  'Good value', 'Friendly staff', 'Well maintained', 'Easy to find'
]

export default function Reviews({ user }) {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const preTurf = params.get('turf')

  const [written, setWritten] = useState([])
  const [pending, setPending] = useState([])
  const [tab, setTab] = useState('pending')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [writing, setWriting] = useState(null)   // { turf, bookingId }
  const [editing, setEditing] = useState(null)
  const [rating, setRating] = useState(0)
  const [title, setTitle] = useState('')
  const [comment, setComment] = useState('')
  const [tags, setTags] = useState([])
  const [busy, setBusy] = useState(false)

  function load() {
    setLoading(true)
    fetchMyReviews(user.id)
      .then(r => {
        setWritten(r.written)
        setPending(r.pending)
        if (r.pending.length === 0 && r.written.length > 0) setTab('written')
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }
  useEffect(load, [])

  // Opened from a turf page with ?turf=<id>
  useEffect(() => {
    if (!preTurf || loading) return
    const match = pending.find(p => String(p.turf._id) === preTurf)
    if (match) startWrite(match)
  }, [preTurf, loading, pending])

  function startWrite(p) {
    setWriting(p)
    setEditing(null)
    setRating(0); setTitle(''); setComment(''); setTags([])
    setError('')
  }

  function startEdit(r) {
    setEditing(r)
    setWriting(null)
    setRating(r.rating)
    setTitle(r.title || '')
    setComment(r.comment || '')
    setTags(r.tags || [])
    setError('')
  }

  function close() { setWriting(null); setEditing(null); setError('') }

  function toggleTag(t) {
    setTags(x => x.includes(t) ? x.filter(y => y !== t) : [...x, t])
  }

  async function submit() {
    if (!rating) { setError('Choose a star rating'); return }
    setBusy(true); setError('')
    try {
      if (editing) {
        await updateReview(editing._id, { userId: user.id, rating, title, comment, tags })
      } else {
        await createReview({
          turfId: writing.turf._id, userId: user.id,
          bookingId: writing.bookingId, rating, title, comment, tags
        })
      }
      close()
      load()
    } catch (e) { setError(e.message) }
    finally { setBusy(false) }
  }

  async function remove(r) {
    setBusy(true)
    try { await deleteReview(r._id, user.id); close(); load() }
    catch (e) { setError(e.message) }
    finally { setBusy(false) }
  }

  const TABS = [
    { id: 'pending', label: 'To review', count: pending.length },
    { id: 'written', label: 'My reviews', count: written.length }
  ]

  return (
    <div className="page rvp-page">
      <header className="page-head">
        <h1>Reviews</h1>
        <p className="muted">Tell other players what a ground is really like</p>
      </header>

      <div className="mb-tabs">
        {TABS.map(t => (
          <button key={t.id}
            className={'mb-tab' + (tab === t.id ? ' mb-tab-on' : '')}
            onClick={() => setTab(t.id)}>
            {t.label}
            {t.count > 0 && <span className="mb-tab-count">{t.count}</span>}
          </button>
        ))}
      </div>

      {loading && <p className="muted">Loading…</p>}
      {error && !writing && !editing && <p className="error">{error}</p>}

      {/* ── To review ── */}
      {tab === 'pending' && !loading && (
        pending.length === 0 ? (
          <div className="mb-empty">
            <div className="mb-empty-icon"><Icon name="star" size={34} /></div>
            <p className="mb-empty-title">Nothing to review yet</p>
            <p className="mb-empty-sub">
              After you play at a ground, you can rate it here.
            </p>
            <button className="btn-primary" onClick={() => navigate('/')}>
              Browse grounds
            </button>
          </div>
        ) : (
          <div className="rvp-list">
            {pending.map(p => (
              <div key={p.turf._id} className="rvp-item">
                <img src={p.turf.photo || p.turf.photos?.[0]} alt=""
                  className="rvp-img"
                  onError={e => { e.target.style.visibility = 'hidden' }} />
                <div className="rvp-mid">
                  <p className="rvp-name">{p.turf.name}</p>
                  <p className="rvp-meta">
                    {p.turf.city} · played {new Date(p.playedAt)
                      .toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </p>
                </div>
                <button className="rvp-write" onClick={() => startWrite(p)}>
                  Rate
                </button>
              </div>
            ))}
          </div>
        )
      )}

      {/* ── My reviews ── */}
      {tab === 'written' && !loading && (
        written.length === 0 ? (
          <div className="mb-empty">
            <div className="mb-empty-icon"><Icon name="chat" size={34} /></div>
            <p className="mb-empty-title">No reviews yet</p>
            <p className="mb-empty-sub">Your reviews will appear here once you write one.</p>
          </div>
        ) : (
          <div className="rvp-list">
            {written.map(r => (
              <div key={r._id} className="rvp-written">
                <div className="rvp-written-head">
                  <img src={r.turf?.photo || r.turf?.photos?.[0]} alt=""
                    className="rvp-img"
                    onError={e => { e.target.style.visibility = 'hidden' }} />
                  <div className="rvp-mid">
                    <p className="rvp-name">{r.turf?.name}</p>
                    <Stars value={r.rating} size={13} />
                  </div>
                  <button className="rvp-edit" onClick={() => startEdit(r)}>
                    <Icon name="edit" size={15} />
                  </button>
                </div>
                {r.title && <p className="rvp-w-title">{r.title}</p>}
                {r.comment && <p className="rvp-w-comment">{r.comment}</p>}
                {r.ownerReply && (
                  <div className="rv-reply">
                    <div className="rv-reply-head">
                      <Icon name="building" size={13} />
                      <span>Response from the ground</span>
                    </div>
                    <p className="rv-reply-text">{r.ownerReply}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      )}

      {/* ══ WRITE / EDIT SHEET ══ */}
      {(writing || editing) && (
        <div className="overlay" onClick={() => !busy && close()}>
          <div className="sheet sheet-short" onClick={e => e.stopPropagation()}>
            <div className="sheet-head">
              <h2>{editing ? 'Edit review' : 'Rate this ground'}</h2>
              <button className="sheet-close" disabled={busy} onClick={close}>
                <Icon name="close" size={14} />
              </button>
            </div>

            <div className="sheet-body">
              <p className="rvf-turf">
                {editing ? editing.turf?.name : writing.turf.name}
              </p>

              <StarRating value={rating} onChange={setRating} />

              <label className="rvf-label">Add a headline <span>optional</span></label>
              <input value={title} onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Great surface, well lit" maxLength={80} />

              <label className="rvf-label">Your review <span>optional</span></label>
              <textarea rows={4} value={comment}
                onChange={e => setComment(e.target.value)}
                placeholder="What was the pitch like? Facilities? Would you go back?"
                maxLength={1000} />
              <p className="rvf-count">{comment.length}/1000</p>

              <label className="rvf-label">What stood out? <span>optional</span></label>
              <div className="rvf-tags">
                {TAGS.map(t => (
                  <button key={t} type="button"
                    className={'rvf-tag' + (tags.includes(t) ? ' rvf-tag-on' : '')}
                    onClick={() => toggleTag(t)}>
                    {t}
                  </button>
                ))}
              </div>

              {error && <p className="error">{error}</p>}

              <button className="btn-primary" disabled={busy || !rating} onClick={submit}>
                {busy ? 'Saving…' : editing ? 'Update review' : 'Post review'}
              </button>

              {editing && (
                <button className="rvf-delete" disabled={busy} onClick={() => remove(editing)}>
                  <Icon name="trash" size={15} /> Delete review
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}