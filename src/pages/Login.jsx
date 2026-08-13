import { useState } from 'react'
import { registerUser, loginUser, saveUser } from '../utils/api'
import { checkEmail } from '../utils/emailCheck'
import Logo from '../components/Logo'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/

export default function Login({ onLogin }) {
  const [mode, setMode] = useState('login')
  const [f, setF] = useState({ name: '', email: '', phone: '', password: '', confirm: '' })
  const [errors, setErrors] = useState({})
  const [showPw, setShowPw] = useState(false)
  const [showCp, setShowCp] = useState(false)
  const [busy, setBusy] = useState(false)
  const [formError, setFormError] = useState('')
  const [suggestion, setSuggestion] = useState(null)

  const isRegister = mode === 'register'

  function upd(key, value) {
    setF(p => ({ ...p, [key]: value }))
    // clear that field's error the moment they start correcting it
    if (errors[key]) setErrors(e => ({ ...e, [key]: '' }))
    setFormError('')
  }

  // phone: allow digits only, cap at 10
  function updPhone(value) {
    const digits = value.replace(/\D/g, '').slice(0, 10)
    upd('phone', digits)
  }

  function validate() {
    const e = {}

    if (isRegister) {
      if (!f.name.trim()) e.name = 'Please Enter Your Full Name'
      else if (f.name.trim().length < 2) e.name = 'Name Looks Too Short'
    }

   const emailCheck = checkEmail(f.email)
    if (!emailCheck.valid) {
      e.email = emailCheck.error
      setSuggestion(emailCheck.suggestion)
    } else {
      setSuggestion(null)
    }

    if (isRegister) {
      if (!f.phone) e.phone = 'Phone Number Is Required'
      else if (f.phone.length < 10) e.phone = `Too Short — ${f.phone.length} Of 10 Digits`
      else if (f.phone.length > 10) e.phone = 'Too Long — Must Be Exactly 10 Digits'
    }

    if (!f.password) e.password = 'Password Is Required'
    else if (isRegister && f.password.length < 6)
      e.password = 'Use At Least 6 Characters'

    if (isRegister) {
      if (!f.confirm) e.confirm = 'Please Re-enter Your Password'
      else if (f.confirm !== f.password) e.confirm = 'Passwords Do Not Match'
    }

    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function submit(ev) {
    ev.preventDefault()
    setFormError('')
    if (!validate()) return

    setBusy(true)
    try {
      const user = isRegister
        ? await registerUser({
            name: f.name, email: f.email, phone: f.phone, password: f.password
          })
        : await loginUser({ email: f.email, password: f.password })
      saveUser(user)
      onLogin(user)
    } catch (err) {
      // server may reply with { field, message } — show it on that field
      if (err.field) setErrors(e => ({ ...e, [err.field]: err.message }))
      else setFormError(err.message)
    } finally {
      setBusy(false)
    }
  }

  function switchMode() {
    setMode(isRegister ? 'login' : 'register')
    setErrors({})
    setFormError('')
  }

  // live match indicator under confirm password
  const confirmState =
    !isRegister || !f.confirm ? null
      : f.confirm === f.password ? 'match' : 'mismatch'

  return (
    <div className="au-page">
      <div className="au-brand">
        <div className="au-logo-wrap">
          <Logo size={62} animate />
        </div>
        <h1 className="au-app-name">TurfArena</h1>
        <p className="au-tagline">Book sports grounds near you</p>
      </div>

      <div className="au-card">
        <div className="au-card-head">
          <h2 className="au-title">{isRegister ? 'Create Your Account' : 'Welcome Back'}</h2>
          <p className="au-sub">
            {isRegister
              ? 'It Takes Less Than A Minute To Get Started'
              : 'Sign In To Continue Booking'}
          </p>
        </div>

        <form onSubmit={submit} noValidate>

          {isRegister && (
            <div className="au-field">
              <label className="au-label">Full Name</label>
              <input
                className={errors.name ? 'au-input-bad' : ''}
                value={f.name}
                onChange={e => upd('name', e.target.value)}
                placeholder="e.g. Rahul Sharma"
              />
              {errors.name && <p className="au-field-err">{errors.name}</p>}
            </div>
          )}

          <div className="au-field">
            <label className="au-label">Email Address</label>
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

          {isRegister && (
            <div className="au-field">
              <label className="au-label">Phone Number</label>
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
          )}

          <div className="au-field">
            <label className="au-label">Password</label>
            <div className="au-pw-wrap">
              <input
                className={errors.password ? 'au-input-bad' : ''}
                type={showPw ? 'text' : 'password'}
                value={f.password}
                onChange={e => upd('password', e.target.value)}
                placeholder={isRegister ? 'At Least 6 Characters' : 'Enter Your Password'}
              />
              <button type="button" className="au-pw-toggle" onClick={() => setShowPw(v => !v)}>
                {showPw ? 'Hide' : 'Show'}
              </button>
            </div>
            {errors.password && <p className="au-field-err">{errors.password}</p>}
          </div>

          {isRegister && (
            <div className="au-field">
              <label className="au-label">Confirm Password</label>
              <div className="au-pw-wrap">
                <input
                  className={errors.confirm ? 'au-input-bad'
                    : confirmState === 'match' ? 'au-input-good' : ''}
                  type={showCp ? 'text' : 'password'}
                  value={f.confirm}
                  onChange={e => upd('confirm', e.target.value)}
                  placeholder="Re-enter Your Password"
                />
                <button type="button" className="au-pw-toggle" onClick={() => setShowCp(v => !v)}>
                  {showCp ? 'Hide' : 'Show'}
                </button>
              </div>
              {errors.confirm && <p className="au-field-err">{errors.confirm}</p>}
              {!errors.confirm && confirmState === 'match' && (
                <p className="au-field-ok">✓ Passwords Match</p>
              )}
              {!errors.confirm && confirmState === 'mismatch' && (
                <p className="au-field-err">Passwords Do Not Match Yet</p>
              )}
            </div>
          )}

          {formError && <p className="au-error">{formError}</p>}

          <button className="au-submit" type="submit" disabled={busy}>
            {busy ? 'Please Wait…' : isRegister ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        {isRegister && (
          <p className="au-terms">
            By Creating An Account You Agree To Our Terms And Conditions Of Use And Privacy Policy.
          </p>
        )}

        <div className="au-divider"><span>Or</span></div>

        <button className="au-switch" onClick={switchMode}>
          {isRegister ? 'I Already Have An Account' : 'Create A New Account'}
        </button>
      </div>

      <div className="au-trust">
        <div className="au-trust-item"><span>🕐</span> Live Availability</div>
        <div className="au-trust-item"><span>💳</span> Multiple Payment Modes</div>
        <div className="au-trust-item"><span>↩️</span> Free Cancellation</div>
      </div>
    </div>
  )
}