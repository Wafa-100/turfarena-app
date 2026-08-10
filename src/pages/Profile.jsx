import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { updateProfile, fetchUserStats, saveUser, fetchMyTurfs, fetchPlanStatus } from '../utils/api'
import ThemeToggle from '../components/ThemeToggle'
import Icon from '../components/Icon'

export default function Profile({ user, onUserUpdate, onLogout }) {
  const navigate = useNavigate()
  const [stats, setStats] = useState({ total: 0, confirmed: 0, spent: 0 })
  const [plan, setPlan] = useState(null)
  const [turfs, setTurfs] = useState([])
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(user.name)
  const [email, setEmail] = useState(user.email)
  const [phone, setPhone] = useState(user.phone || '')
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    fetchUserStats(user.id).then(setStats).catch(() => {})
    fetchPlanStatus(user.id).then(setPlan).catch(() => {})
    fetchMyTurfs(user.id).then(setTurfs).catch(() => {})
  }, [])

  async function save(e) {
    e.preventDefault()
    setError(''); setOk(''); setBusy(true)
    try {
      const u = await updateProfile(user.id, { name, email, phone })
      saveUser(u); onUserUpdate(u)
      setOk('Your details have been updated')
      setEditing(false)
    } catch (err) { setError(err.message) }
    finally { setBusy(false) }
  }

  const initials = user.name.trim().split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
  const memberSince = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
    : null
  const expiry = plan?.plan
    ? new Date(plan.plan.expiryDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : null

  return (
    <div className="page pf-page">

      <div className="pf-hero">
        <div className="pf-avatar">{initials}</div>
        <h1 className="pf-name">{user.name}</h1>
        <p className="pf-email">{user.email}</p>
        {memberSince && <p className="pf-since">Member since {memberSince}</p>}
      </div>

      <p className="pf-section-label">Your activity</p>
      <div className="pf-stats">
        <div className="pf-stat">
          <p className="pf-stat-num">{stats.total}</p>
          <p className="pf-stat-lbl">Bookings</p>
        </div>
        <div className="pf-stat-div" />
        <div className="pf-stat">
          <p className="pf-stat-num">{stats.confirmed}</p>
          <p className="pf-stat-lbl">Active</p>
        </div>
        <div className="pf-stat-div" />
        <div className="pf-stat">
          <p className="pf-stat-num pf-stat-money">₹{stats.spent.toLocaleString('en-IN')}</p>
          <p className="pf-stat-lbl">Spent</p>
        </div>
      </div>

      <p className="pf-section-label">Account details</p>
      {!editing ? (
        <div className="pf-rows">
          <div className="pf-row">
            <span className="pf-row-lbl">Full name</span>
            <span className="pf-row-val">{user.name}</span>
          </div>
          <div className="pf-row">
            <span className="pf-row-lbl">Email</span>
            <span className="pf-row-val">{user.email}</span>
          </div>
          <div className="pf-row">
            <span className="pf-row-lbl">Phone</span>
            <span className={'pf-row-val' + (user.phone ? '' : ' pf-row-empty')}>
              {user.phone || 'Not added'}
            </span>
          </div>
          <button className="pf-edit-btn" onClick={() => { setEditing(true); setOk(''); setError('') }}>
            <Icon name="edit" size={15} /> Edit details
          </button>
        </div>
      ) : (
        <form className="pf-form" onSubmit={save}>
          <label className="pf-field-lbl">Full name</label>
          <input value={name} onChange={e => setName(e.target.value)} required />
          <label className="pf-field-lbl">Email address</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          <label className="pf-field-lbl">Phone number</label>
          <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="9876543210" />
          {error && <p className="error">{error}</p>}
          <div className="pf-form-actions">
            <button className="pf-save" type="submit" disabled={busy}>
              {busy ? 'Saving…' : 'Save changes'}
            </button>
            <button className="pf-cancel" type="button" onClick={() => {
              setEditing(false); setName(user.name); setEmail(user.email); setPhone(user.phone || '')
            }}>Cancel</button>
          </div>
        </form>
      )}
      {ok && <p className="pf-ok">{ok}</p>}

      <p className="pf-section-label">Appearance</p>
      <ThemeToggle />

      <p className="pf-section-label">Ground owner</p>
      {plan?.hasPlan ? (
        <div className="pf-plan pf-plan-active">
          <div className="pf-plan-top">
            <div>
              <p className="pf-plan-name">
                {plan.plan.planType === 'yearly' ? 'Yearly plan' : 'Monthly plan'}
              </p>
              <p className="pf-plan-exp">Valid until {expiry}</p>
            </div>
            <span className="pf-plan-badge">{plan.daysLeft}d left</span>
          </div>
          <div className="pf-plan-meter">
            <div className="pf-plan-fill"
              style={{ width: `${Math.min(100, (plan.turfsUsed / plan.plan.turfLimit) * 100)}%` }} />
          </div>
          <p className="pf-plan-usage">
            {plan.turfsUsed} of {plan.plan.turfLimit} grounds listed
          </p>
          <button className="pf-plan-btn" onClick={() => navigate('/add-turf')}>
            Add another ground
          </button>
        </div>
      ) : (
        <div className="pf-plan pf-plan-empty">
          <p className="pf-plan-name">List your ground on TurfArena</p>
          <p className="pf-plan-desc">
            Reach players in your city and manage bookings from one place.
            Plans start at ₹2,500 per month.
          </p>
          <button className="pf-plan-btn" onClick={() => navigate('/plan')}>
            View plans
          </button>
        </div>
      )}

      {turfs.length > 0 && (
        <>
          <p className="pf-section-label">My grounds ({turfs.length})</p>
          <div className="pf-turfs">
            {turfs.map(t => (
              <div key={t._id} className="pf-turf">
                <img src={t.photo || t.photos?.[0]} alt="" className="pf-turf-img"
                  onError={e => { e.target.style.visibility = 'hidden' }} />
                <div className="pf-turf-mid">
                  <p className="pf-turf-name">{t.name}</p>
                  <p className="pf-turf-meta">
                    <span className={'pf-dot' + (t.isOpen === false ? ' pf-dot-closed' : '')} />
                    {t.isOpen === false ? 'Closed' : 'Open'} · {t.city} · ₹{t.price}/hr
                  </p>
                </div>
                <div className="pf-turf-actions">
                  <button className="pf-turf-manage" onClick={() => navigate(`/manage/${t._id}`)}>
                    Manage
                  </button>
                  <button className="pf-turf-edit" onClick={() => navigate(`/edit-turf/${t._id}`)}>
                    Edit
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <p className="pf-section-label">More</p>
      <div className="pf-rows">
        <button className="pf-link" onClick={() => navigate('/bookings')}>
          <span>My bookings</span>
          <Icon name="chevron" size={17} className="pf-link-arrow" />
        </button>
        <button className="pf-link" onClick={() => navigate('/contact')}>
          <span>Help & support</span>
          <Icon name="chevron" size={17} className="pf-link-arrow" />
        </button>
      </div>

      <button className="pf-logout" onClick={onLogout}>
        <Icon name="logout" size={16} /> Log out
      </button>
      <p className="pf-version">TurfArena · Version 1.0</p>
    </div>
  )
}