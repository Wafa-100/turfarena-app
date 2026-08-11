import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchMyTurfs, fetchPlanStatus, selectPlanTurfs } from '../utils/api'
import Icon from '../components/Icon'

export default function SelectTurfs({ user }) {
  const navigate = useNavigate()
  const [turfs, setTurfs] = useState([])
  const [plan, setPlan] = useState(null)
  const [chosen, setChosen] = useState([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([fetchMyTurfs(user.id), fetchPlanStatus(user.id)])
      .then(([t, p]) => {
        setTurfs(t)
        setPlan(p)
        // pre-tick whatever was already selected, else the newest ones
        if (p.plan?.activeTurfs?.length) setChosen(p.plan.activeTurfs.map(String))
        else setChosen(t.slice(0, p.plan?.turfLimit || 0).map(x => x._id))
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="page"><p className="muted">Loading…</p></div>
  if (!plan?.hasPlan) {
    return (
      <div className="page center-page">
        <p className="muted">No active plan.</p>
        <button className="btn-primary" onClick={() => navigate('/plan')}>View plans</button>
      </div>
    )
  }

  const limit = plan.plan.turfLimit
  const full = chosen.length >= limit

  function toggle(id) {
    setChosen(c => {
      if (c.includes(id)) return c.filter(x => x !== id)
      if (c.length >= limit) return c
      return [...c, id]
    })
    setError('')
  }

  async function save() {
    if (chosen.length === 0) { setError('Select at least one ground'); return }
    setBusy(true)
    try {
      await selectPlanTurfs({ userId: user.id, planId: plan.plan._id, turfIds: chosen })
      navigate('/profile')
    } catch (e) { setError(e.message); setBusy(false) }
  }

  return (
    <div className="page st-page">
      <header className="page-head">
        <h1>Choose your live grounds</h1>
        <p className="muted">
          Your {plan.plan.planType} plan covers <b>{limit}</b> grounds and you have
          {' '}<b>{turfs.length}</b> listed. Pick which ones players can see.
        </p>
      </header>

      <div className="st-counter">
        <div className="st-counter-bar">
          <div className="st-counter-fill" style={{ width: `${(chosen.length / limit) * 100}%` }} />
        </div>
        <p className="st-counter-text">
          <b>{chosen.length}</b> of {limit} selected
        </p>
      </div>

      <div className="st-list">
        {turfs.map(t => {
          const on = chosen.includes(t._id)
          const locked = !on && full
          return (
            <button key={t._id}
              className={'st-item' + (on ? ' st-item-on' : '') + (locked ? ' st-item-locked' : '')}
              onClick={() => toggle(t._id)}>
              <span className={'hp-box' + (on ? ' hp-box-on' : '')}>
                {on && <Icon name="check" size={12} />}
              </span>
              <img src={t.photo || t.photos?.[0]} alt="" className="st-img"
                onError={e => { e.target.style.visibility = 'hidden' }} />
              <div className="st-mid">
                <p className="st-name">{t.name}</p>
                <p className="st-meta">{t.sport} · {t.city} · ₹{t.price}/hr</p>
              </div>
              {!on && !locked && <span className="st-hint">Tap to keep live</span>}
              {locked && <span className="st-hint st-hint-off">Limit reached</span>}
            </button>
          )
        })}
      </div>

      <p className="st-note">
        <Icon name="info" size={14} />
        Unselected grounds stay saved — nothing is deleted. Upgrade later and they
        come straight back.
      </p>

      {error && <p className="error">{error}</p>}

      <button className="btn-primary" disabled={busy || chosen.length === 0} onClick={save}>
        {busy ? 'Saving…' : `Keep these ${chosen.length} live`}
      </button>
    </div>
  )
}