import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  updateProfile, fetchUserStats, saveUser,
  fetchMyTurfs, fetchPlanStatus, fetchWallet
} from '../utils/api'
import ThemeToggle from '../components/ThemeToggle'
import Icon from '../components/Icon'
import { checkEmail } from '../utils/emailCheck'
import Avatar, { AVATARS } from '../components/Avatar'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/

export default function Profile({ user, onUserUpdate, onLogout }) {
  const navigate = useNavigate()
  const [stats, setStats] = useState({ total: 0, confirmed: 0, spent: 0 })
  const [plan, setPlan] = useState(null)
  const [turfs, setTurfs] = useState([])
  const [balance, setBalance] = useState(0)

  const [editing, setEditing] = useState(false)
  const [f, setF] = useState({
    name: user.name,
    email: user.email,
    phone: (user.phone || '').replace(/\D/g, '').slice(-10)
  })
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [ok, setOk] = useState('')
  const [busy, setBusy] = useState(false)
  const [suggestion, setSuggestion] = useState(null)
  const [showAvatars, setShowAvatars] = useState(false)
  const [avatar, setAvatar] = useState(user.avatar || '')

  useEffect(() => {
    fetchUserStats(user.id).then(setStats).catch(() => {})
    fetchPlanStatus(user.id).then(setPlan).catch(() => {})
    fetchMyTurfs(user.id).then(setTurfs).catch(() => {})
    fetchWallet(user.id).then(r => setBalance(r.balance)).catch(() => {})
  }, [])

  function upd(key, value) {
    setF(p => ({ ...p, [key]: value }))
    if (errors[key]) setErrors(e => ({ ...e, [key]: '' }))
    setFormError('')
  }

  function updPhone(value) {
    upd('phone', value.replace(/\D/g, '').slice(0, 10))
  }

  /* Same rules as the register page */
  function validate() {
    const e = {}

    if (!f.name.trim()) e.name = 'Please enter your full name'
    else if (f.name.trim().length < 2) e.name = 'Name looks too short'

    const emailCheck = checkEmail(f.email)
    if (!emailCheck.valid) {
      e.email = emailCheck.error
      setSuggestion(emailCheck.suggestion)
    } else {
      setSuggestion(null)
    }

    if (!f.phone) e.phone = 'Phone number is required'
    else if (f.phone.length < 10) e.phone = `Too short — ${f.phone.length} of 10 digits`
    else if (f.phone.length > 10) e.phone = 'Too long — must be exactly 10 digits'

    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function save(ev) {
    ev.preventDefault()
    setFormError(''); setOk('')
    if (!validate()) return

    setBusy(true)
    try {
      const u = await updateProfile(user.id, {
        name: f.name, email: f.email, phone: f.phone
      })
      saveUser(u)
      onUserUpdate(u)
      setOk('Your details have been updated')
      setEditing(false)
      setErrors({})
    } catch (err) {
      if (err.field) setErrors(e => ({ ...e, [err.field]: err.message }))
      else setFormError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function pickAvatar(id) {
    setAvatar(id)
    setShowAvatars(false)
    try {
      const u = await updateProfile(user.id, {
        name: user.name, email: user.email, phone: user.phone, avatar: id
      })
      saveUser(u)
      onUserUpdate(u)
    } catch (e) { setFormError(e.message) }
  }

  function cancelEdit() {
    setEditing(false)
    setErrors({})
    setFormError('')
    setF({
      name: user.name,
      email: user.email,
      phone: (user.phone || '').replace(/\D/g, '').slice(-10)
    })
  }

  const initials = user.name.trim().split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
  const memberSince = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
    : null
  const expiry = plan?.plan
    ? new Date(plan.plan.expiryDate).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric'
      })
    : null

  return (
    <div className="page pf-page">

      <div className="pf-hero">
        <button className="pf-avatar-btn" onClick={() => setShowAvatars(true)}>
          <Avatar id={avatar} name={user.name} size={78} />
          <span className="pf-avatar-edit"><Icon name="edit" size={13} /></span>
        </button>
        <h1 className="pf-name">{user.name}</h1>
        <p className="pf-email">{user.email}</p>
        {memberSince && <p className="pf-since">Member since {memberSince}</p>}
        {showAvatars && (
        <div className="overlay" onClick={() => setShowAvatars(false)}>
          <div className="sheet sheet-short" onClick={e => e.stopPropagation()}>
            <div className="sheet-head">
              <h2>Choose an avatar</h2>
              <button className="sheet-close" onClick={() => setShowAvatars(false)}>
                <Icon name="close" size={14} />
              </button>
            </div>
            <div className="sheet-body">
              <div className="av-grid">
                <button className={'av-pick' + (!avatar ? ' av-pick-on' : '')}
                  onClick={() => pickAvatar('')}>
                  <Avatar id="" name={user.name} size={58} />
                  <span className="av-pick-label">Initials</span>
                </button>
                {AVATARS.map(a => (
                  <button key={a.id}
                    className={'av-pick' + (avatar === a.id ? ' av-pick-on' : '')}
                    onClick={() => pickAvatar(a.id)}>
                    <Avatar id={a.id} size={58} />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
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

      <p className="pf-section-label">Wallet</p>
      <button className="pf-wallet" onClick={() => navigate('/wallet')}>
        <span className="pf-wallet-icon"><Icon name="wallet" size={20} /></span>
        <div className="pf-wallet-mid">
          <p className="pf-wallet-label">TurfArena Wallet</p>
          <p className="pf-wallet-bal">₹{balance.toLocaleString('en-IN')}</p>
        </div>
        <span className="pf-wallet-cta">
          Add money <Icon name="chevron" size={15} />
        </span>
      </button>

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
              {user.phone ? `+91 ${user.phone}` : 'Not added'}
            </span>
          </div>
          <button className="pf-edit-btn" onClick={() => { setEditing(true); setOk(''); setFormError('') }}>
            <Icon name="edit" size={15} /> Edit details
          </button>
        </div>
      ) : (
        <form className="pf-form" onSubmit={save} noValidate>

          <div className="au-field">
            <label className="au-label">Full name</label>
            <input
              className={errors.name ? 'au-input-bad' : ''}
              value={f.name}
              onChange={e => upd('name', e.target.value)}
              placeholder="e.g. Rahul Sharma"
            />
            {errors.name && <p className="au-field-err">{errors.name}</p>}
          </div>

          <div className="au-field">
            <label className="au-label">Email address</label>
            <input
              className={errors.email ? 'au-input-bad' : ''}
              type="email"
              inputMode="email"
              value={f.email}
              onChange={e => upd('email', e.target.value)}
              placeholder="you@example.com"
            />
            {errors.email && <p className="au-field-err">{errors.email}</p>}
            {suggestion && (
              <button type="button" className="em-fix"
                onClick={() => {
                  upd('email', suggestion)
                  setSuggestion(null)
                  setErrors(x => ({ ...x, email: '' }))
                }}>
                Use {suggestion}
              </button>
            )}
          </div>

          <div className="au-field">
            <label className="au-label">Phone number</label>
            <div className="au-phone-wrap">
              <span className="au-phone-code">+91</span>
              <input
                className={'au-phone-input' + (errors.phone ? ' au-input-bad' : '')}
                type="tel"
                inputMode="numeric"
                value={f.phone}
                onChange={e => updPhone(e.target.value)}
                placeholder="9876543210"
                maxLength={10}
              />
              <span className={'au-phone-count' + (f.phone.length === 10 ? ' au-count-ok' : '')}>
                {f.phone.length}/10
              </span>
            </div>
            {errors.phone && <p className="au-field-err">{errors.phone}</p>}
          </div>

          {formError && <p className="au-error">{formError}</p>}

          <div className="pf-form-actions">
            <button className="pf-save" type="submit" disabled={busy}>
              {busy ? 'Saving…' : 'Save changes'}
            </button>
            <button className="pf-cancel" type="button" onClick={cancelEdit}>
              Cancel
            </button>
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