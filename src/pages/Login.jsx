import { useState } from 'react'
import { registerUser, loginUser, saveUser } from '../utils/api'

export default function Login({ onLogin }) {
  const [mode, setMode] = useState('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const isRegister = mode === 'register'

  async function submit(e) {
    e.preventDefault()
    setError(''); setBusy(true)
    try {
      const u = isRegister
        ? await registerUser({ name, email, phone, password })
        : await loginUser({ email, password })
      saveUser(u); onLogin(u)
    } catch (err) { setError(err.message) }
    finally { setBusy(false) }
  }

  function switchMode() {
    setMode(isRegister ? 'login' : 'register')
    setError('')
  }

  return (
    <div className="au-page">
      {/* Brand */}
      <div className="au-brand">
        <div className="au-logo">⚽</div>
        <h1 className="au-app-name">TURF ARENA</h1>
        <p className="au-tagline">Book Sports Ground</p>
      </div>

      {/* Card */}
      <div className="au-card">
        <div className="au-card-head">
          <h2 className="au-title">{isRegister ? 'Create Your Account' : 'Welcome Back'}</h2>
          <p className="au-sub">
            {isRegister
              ? 'It Takes Less Than A Minute To Get Started'
              : 'Sign In To Continue Booking'}
          </p>
        </div>

        <form onSubmit={submit}>
          {isRegister && (
            <div className="au-field">
              <label className="au-label">Full Name</label>
              <input value={name} onChange={e => setName(e.target.value)}
                placeholder="e.g. Rahul Sharma" required />
            </div>
          )}

          <div className="au-field">
            <label className="au-label">Email Address</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com" required />
          </div>

          {isRegister && (
            <div className="au-field">
              <label className="au-label">
                Phone Number <span className="au-optional">Optional</span>
              </label>
              <input value={phone} onChange={e => setPhone(e.target.value)}
                placeholder="+91 98765 43210" />
            </div>
          )}

          <div className="au-field">
            <label className="au-label">Password</label>
            <div className="au-pw-wrap">
              <input type={showPw ? 'text' : 'password'} value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder={isRegister ? 'At Least 4 Characters' : 'Enter Your Password'} required />
              <button type="button" className="au-pw-toggle" onClick={() => setShowPw(v => !v)}>
                {showPw ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          {error && <p className="au-error">{error}</p>}

          <button className="au-submit" type="submit" disabled={busy}>
            {busy ? 'Please Wait…' : isRegister ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        {isRegister && (
          <p className="au-terms">
            By Creating An Account You Agree To Our Terms Of Use And Privacy Policy.
          </p>
        )}

        <div className="au-divider"><span>or</span></div>

        <button className="au-switch" onClick={switchMode}>
          {isRegister ? 'I Already Have An Account' : 'Create A New Account'}
        </button>
      </div>

      {/* Trust row */}
      <div className="au-trust">
        <div className="au-trust-item"><span>🕐</span> Live Availability</div>
        <div className="au-trust-item"><span>💳</span> Multiple Payment Modes</div>
        <div className="au-trust-item"><span>↩️</span> Free cancellation</div>
      </div>
    </div>
  )
}