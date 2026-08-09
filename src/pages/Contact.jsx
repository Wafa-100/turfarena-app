import { useState } from 'react'
import { sendContact } from '../utils/api'
import Icon from '../components/Icon'

const TOPICS = [
  { id: 'booking', icon: 'calendar', label: 'Booking Issue', sub: 'Slot, Cancellation Or Refund' },
  { id: 'payment', icon: 'card', label: 'Payment Problem', sub: 'Failed Or Duplicate Payment' },
  { id: 'listing', icon: 'building', label: 'List My Ground', sub: 'Plans And Registration' },
  { id: 'other', icon: 'chat', label: 'Something Else', sub: 'Feedback Or General Query' }
]

const FAQS = [
  { q: 'How do I cancel a booking?', a: 'Open My Bookings, tap the booking, then choose Cancel booking and get refund. You pick where the refund goes, and the slot is released immediately.' },
  { q: 'Can I book more than one hour?', a: 'Yes. On the booking screen, tap as many time slots as you need. The total updates as you go and everything is paid together.' },
  { q: 'How do I list my own ground?', a: 'Buy an owner plan from your Profile, then use the List tab to publish. Monthly covers 3 grounds, yearly covers 6.' },
  { q: 'Is my payment information safe?', a: 'This is a demonstration app, so no real card details are ever stored or charged. Every payment is simulated.' },
  { q: 'What if the ground is closed when I arrive?', a: 'Call the owner using the number on the ground page. If that does not resolve it, message us and we will arrange a full refund.' }
]

const IG_PATH = 'M12 2.2c3.2 0 3.6 0 4.9.07 1.2.05 1.8.25 2.2.42.6.22 1 .48 1.4.9.4.4.7.8.9 1.4.2.4.4 1 .4 2.2.1 1.3.1 1.7.1 4.9s0 3.6-.1 4.9c0 1.2-.2 1.8-.4 2.2-.2.6-.5 1-.9 1.4-.4.4-.8.7-1.4.9-.4.2-1 .4-2.2.4-1.3.1-1.7.1-4.9.1s-3.6 0-4.9-.1c-1.2 0-1.8-.2-2.2-.4-.6-.2-1-.5-1.4-.9-.4-.4-.7-.8-.9-1.4-.2-.4-.4-1-.4-2.2C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.9c0-1.2.2-1.8.4-2.2.2-.6.5-1 .9-1.4.4-.4.8-.7 1.4-.9.4-.2 1-.4 2.2-.4C8.4 2.2 8.8 2.2 12 2.2zm0 3.2a6.6 6.6 0 100 13.2 6.6 6.6 0 000-13.2zm0 10.9a4.3 4.3 0 110-8.6 4.3 4.3 0 010 8.6zm8.4-11.2a1.55 1.55 0 11-3.1 0 1.55 1.55 0 013.1 0z'
const FB_PATH = 'M22 12a10 10 0 10-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.3c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.4 2.9h-2.4v7A10 10 0 0022 12z'
const X_PATH = 'M18.9 2H22l-7.1 8.1L23.2 22h-6.6l-5.1-6.7L5.6 22H2.5l7.6-8.7L1.2 2h6.7l4.6 6.1L18.9 2zm-1.1 18h1.8L7.3 3.9H5.4L17.8 20z'
const YT_PATH = 'M23 12s0-3.2-.4-4.7a2.5 2.5 0 00-1.7-1.8C19.2 5 12 5 12 5s-7.2 0-8.9.5a2.5 2.5 0 00-1.7 1.8C1 8.8 1 12 1 12s0 3.2.4 4.7c.2.9.9 1.6 1.7 1.8 1.7.5 8.9.5 8.9.5s7.2 0 8.9-.5a2.5 2.5 0 001.7-1.8c.4-1.5.4-4.7.4-4.7zM9.8 15.3V8.7l6 3.3-6 3.3z'
const WA_PATH = 'M17.5 14.4c-.3-.1-1.8-.9-2-1-.3-.1-.5-.1-.7.1-.2.3-.7 1-.9 1.2-.2.2-.3.2-.6.1-1.7-.9-2.9-1.6-4-3.6-.3-.5.3-.5.9-1.6.1-.2 0-.4 0-.5 0-.2-.7-1.6-.9-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.2 5.1 4.5 1.9.8 2.6.9 3.5.7.6-.1 1.8-.7 2-1.4.3-.7.3-1.3.2-1.4-.1-.2-.3-.3-.6-.4zM12 2a10 10 0 00-8.6 15L2 22l5.1-1.3A10 10 0 1012 2zm0 18.2a8.2 8.2 0 01-4.2-1.1l-.3-.2-3.1.8.8-3-.2-.3A8.2 8.2 0 1112 20.2z'

const SOCIALS = [
  { name: 'Instagram', url: 'https://www.instagram.com', color: '#E4405F', path: IG_PATH },
  { name: 'Facebook', url: 'https://www.facebook.com', color: '#1877F2', path: FB_PATH },
  { name: 'X', url: 'https://x.com', color: 'currentColor', path: X_PATH },
  { name: 'YouTube', url: 'https://www.youtube.com', color: '#FF0000', path: YT_PATH },
  { name: 'WhatsApp', url: 'https://wa.me/919000012345', color: '#25D366', path: WA_PATH }
]

export default function Contact({ user }) {
  const [topic, setTopic] = useState('booking')
  const [msg, setMsg] = useState('')
  const [openFaq, setOpenFaq] = useState(null)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const label = TOPICS.find(t => t.id === topic)?.label || 'Query'

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await sendContact({
        userId: user.id,
        name: user.name,
        email: user.email,
        message: '[' + label + '] ' + msg
      })
      setSent(true)
      setMsg('')
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="page ct-page">
      <header className="page-head">
        <h1>Help And Support</h1>
        <p className="muted">We Usually Reply Within A Few Hours</p>
      </header>

      <div className="ct-quick">
        <a className="ct-quick-item" href="tel:+919000012345">
          <span className="ct-quick-icon ct-icon-green">
            <Icon name="phone" size={17} />
          </span>
          <div>
            <p className="ct-quick-title">Call Us</p>
            <p className="ct-quick-sub">+91 90000 12345</p>
          </div>
        </a>
        <a className="ct-quick-item" href="mailto:support@turfarena.in">
          <span className="ct-quick-icon ct-icon-blue">
            <Icon name="mail" size={17} />
          </span>
          <div>
            <p className="ct-quick-title">Email Us</p>
            <p className="ct-quick-sub">support@turfarena.in</p>
          </div>
        </a>
      </div>

      <div className="ct-status">
        <div className="ct-status-row">
          <span className="ct-status-dot" />
          <div>
            <p className="ct-status-title">Support Is Online</p>
            <p className="ct-status-sub">Every Day, 6:00 AM to 5:59:00 AM IST</p>
          </div>
          <span className="ct-status-badge">~24 hrs</span>
        </div>
      </div>

      <h2 className="ct-heading">Common Questions</h2>
      <div className="ct-faqs">
        {FAQS.map((f, i) => (
          <div key={i} className={'ct-faq' + (openFaq === i ? ' ct-faq-open' : '')}>
            <button className="ct-faq-q" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
              <span>{f.q}</span>
              <span className="ct-faq-caret">
                <Icon name={openFaq === i ? 'close' : 'plus'} size={17} />
              </span>
            </button>
            {openFaq === i && <p className="ct-faq-a">{f.a}</p>}
          </div>
        ))}
      </div>

      <h2 className="ct-heading">Send Us A Message</h2>
      {sent ? (
        <div className="ct-sent">
          <span className="ct-sent-tick">
            <Icon name="check" size={24} />
          </span>
          <p className="ct-sent-title">Message Received</p>
          <p className="ct-sent-sub">
            We Have Your Message And Will Reply To <b>{user.email}</b> Shortly.
          </p>
          <button className="btn-ghost" onClick={() => setSent(false)}>Send Another</button>
        </div>
      ) : (
        <form className="ct-form" onSubmit={submit}>
          <p className="ct-form-label">What Is This About?</p>
          <div className="ct-topics">
            {TOPICS.map(t => (
              <button
                key={t.id}
                type="button"
                className={'ct-topic' + (topic === t.id ? ' ct-topic-on' : '')}
                onClick={() => setTopic(t.id)}
              >
                <span className="ct-topic-icon">
                  <Icon name={t.icon} size={19} />
                </span>
                <span className="ct-topic-label">{t.label}</span>
                <span className="ct-topic-sub">{t.sub}</span>
              </button>
            ))}
          </div>

          <p className="ct-form-label">Your Message</p>
          <textarea
            rows={4}
            value={msg}
            onChange={e => setMsg(e.target.value)}
            placeholder="Tell Us What Happened, And Include A Booking ID If You Have One"
            required
          />

          <p className="ct-form-note">
            Replying To <b>{user.email}</b> — Update It In Your Profile If That Is Wrong.
          </p>

          {error && <p className="error">{error}</p>}

          <button className="btn-primary" type="submit" disabled={busy}>
            {busy ? 'Sending…' : 'Send Message'}
          </button>
        </form>
      )}

      <h2 className="ct-heading">Follow Turf Arena</h2>
      <p className="ct-social-sub">Ground Openings, Offers And Match Highlights</p>
      <div className="ct-socials">
        {SOCIALS.map(s => (
          <a key={s.name} href={s.url} target="_blank" rel="noreferrer" className="ct-social" title={s.name}>
            <svg viewBox="0 0 24 24" width="21" height="21" fill={s.color}>
              <path d={s.path} />
            </svg>
            <span className="ct-social-name">{s.name}</span>
          </a>
        ))}
      </div>

      <div className="ct-office">
        <p className="ct-office-title">Turf Arena Support Centre</p>
        <p className="ct-office-line">
          <Icon name="pin" size={14} /> 2nd Floor, Sports Hub Complex, MG Road
        </p>
        <p className="ct-office-line">
          <Icon name="building" size={14} /> Bengaluru 560001, Karnataka
        </p>
        <p className="ct-office-line">
          <Icon name="clock" size={14} /> Mon to Sun, 9 AM to 9 PM
        </p>
      </div>

      <p className="ct-version">TurfArena · Version 1.0</p>
    </div>
  )
}