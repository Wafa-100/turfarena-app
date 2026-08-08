import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { updateProfile, fetchUserStats, saveUser, fetchMyTurfs, fetchPlanStatus } from '../utils/api'

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
      setOk('Your Details Have Been Updated')
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

      {/* Header card */}
      <div className="pf-hero">
        <div className="pf-avatar">{initials}</div>
        <h1 className="pf-name">{user.name}</h1>
        <p className="pf-email">{user.email}</p>
        {memberSince && <p className="pf-since">Member Since {memberSince}</p>}
      </div>

      {/* Activity */}
      <p className="pf-section-label">Your Activity</p>
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

      {/* Account details */}
      <p className="pf-section-label">Account Details</p>
      {!editing ? (
        <div className="pf-rows">
          <div className="pf-row">
            <span className="pf-row-lbl">Full Name</span>
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
            Edit Details
          </button>
        </div>
      ) : (
        <form className="pf-form" onSubmit={save}>
          <label className="pf-field-lbl">Full Name</label>
          <input value={name} onChange={e => setName(e.target.value)} required />
          <label className="pf-field-lbl">Email Address</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          <label className="pf-field-lbl">Phone Number</label>
          <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 98765 43210" />
          {error && <p className="error">{error}</p>}
          <div className="pf-form-actions">
            <button className="pf-save" type="submit" disabled={busy}>
              {busy ? 'Saving…' : 'Save Changes'}
            </button>
            <button className="pf-cancel" type="button" onClick={() => {
              setEditing(false); setName(user.name); setEmail(user.email); setPhone(user.phone || '')
            }}>Cancel</button>
          </div>
        </form>
      )}
      {ok && <p className="pf-ok">{ok}</p>}

      {/* Turf owner section */}
      <p className="pf-section-label">Turf Owner</p>
      {plan?.hasPlan ? (
        <div className="pf-plan pf-plan-active">
          <div className="pf-plan-top">
            <div>
              <p className="pf-plan-name">
                {plan.plan.planType === 'yearly' ? 'Yearly Plan' : 'Monthly Plan'}
              </p>
              <p className="pf-plan-exp">Valid Until {expiry}</p>
            </div>
            <span className="pf-plan-badge">{plan.daysLeft}d Left</span>
          </div>
          <div className="pf-plan-meter">
            <div className="pf-plan-fill"
              style={{ width: `${Math.min(100, (plan.turfsUsed / plan.plan.turfLimit) * 100)}%` }} />
          </div>
          <p className="pf-plan-usage">
            {plan.turfsUsed} Of {plan.plan.turfLimit} Turfs Listed
          </p>
          <button className="pf-plan-btn" onClick={() => navigate('/add-turf')}>
            Add Another Turf
          </button>
        </div>
      ) : (
        <div className="pf-plan pf-plan-empty">
          <p className="pf-plan-name">List Your Ground On Turf Arena</p>
          <p className="pf-plan-desc">
            Reach Players In Your City And Manage Bookings From One Place.
            Plans Start At ₹500 Per Month.
          </p>
          <button className="pf-plan-btn" onClick={() => navigate('/plan')}>
            View Plans
          </button>
        </div>
      )}

      {/* My turfs */}
      {turfs.length > 0 && (
        <>
          <p className="pf-section-label">My Turfs ({turfs.length})</p>
          <div className="pf-turfs">
            {turfs.map(t => (
              <div key={t._id} className="pf-turf">
                <img src={t.photo || t.photos?.[0]} alt="" className="pf-turf-img"
                  onError={e => { e.target.style.visibility = 'hidden' }} />
                <div className="pf-turf-mid">
                  <p className="pf-turf-name">{t.name}</p>
                  <p className="pf-turf-meta">{t.sport} · {t.city} · ₹{t.price}/hr</p>
                </div>
                <button className="pf-turf-edit" onClick={() => navigate(`/edit-turf/${t._id}`)}>
                  Edit
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Footer actions */}
      <p className="pf-section-label">More</p>
      <div className="pf-rows">
        <button className="pf-link" onClick={() => navigate('/bookings')}>
          <span>My Bookings</span><span className="pf-link-arrow">›</span>
        </button>
        <button className="pf-link" onClick={() => navigate('/contact')}>
          <span>Help & Support</span><span className="pf-link-arrow">›</span>
        </button>
      </div>

      <button className="pf-logout" onClick={onLogout}>Log out</button>
      <p className="pf-version">Turf Arena · Version 1.0</p>
    </div>
  )
}