import { useState } from 'react'

const SLIDES = [
  {
    // ── SLIDE 1: The problem this app solves ──
    bg: 'linear-gradient(165deg, #062B16 0%, #0A5C34 55%, #00A651 100%)',
    image: 'https://picsum.photos/seed/turfpitch/800/600',
    tag: 'WELCOME TO TURF ARENA',
    title: 'Book A Ground\nWithout The Hassle',
    body: 'No More Calling Five Numbers To Find Out A Slot Is Already Taken. See What Is Actually Free, Right Now, And Lock It In.',
    highlights: [
      { icon: '🕐', text: 'Live Slot Availability' },
      { icon: '📍', text: 'Grounds Near You On The Map' }
    ],
    btn: 'Explore',
    btnStyle: { background: '#FFFFFF', color: '#0A5C34' },
    accent: '#34D67F'
  },
  {
    // ── SLIDE 2: What you actually get ──
    bg: 'linear-gradient(165deg, #0B1F3A 0%, #123A6B 55%, #1F6FD4 100%)',
    image: null,
    tag: 'EVERYTHING IN ONE ARENA',
    title: 'Compare, Book,\nAnd You Are Done',
    body: 'Every Ground Shows Its Real Price, Photos, Timings And Facilities Before You Commit. Pick Your Hour And Pay However You Like.',
    cards: [
      { icon: '🏟️', title: 'Full Turf Details', sub: 'Photos, Surface, Size, Floodlights, Parking' },
      { icon: '💳', title: 'Pay Your Way', sub: 'UPI, Card, Net Banking Or Wallet' },
      { icon: '📩', title: 'Instant Confirmation', sub: 'Booking ID And Receipt Sent To You' },
      { icon: '↩️', title: 'Free Cancellation', sub: 'Plans Change — Get Your Refund Back' }
    ],
    btn: 'Next',
    btnStyle: { background: '#FFFFFF', color: '#123A6B' },
    accent: '#5EA8FF'
  },
  {
    // ── SLIDE 3: Personal invitation ──
    bg: 'linear-gradient(165deg, #1A0B2E 0%, #3D1E6D 55%, #7C3AED 100%)',
    image: null,
    tag: 'READY WHEN YOU ARE',
    title: 'Your Next Game\nStarts Here',
    body: 'Create Your Account In Under A Minute. Browse Grounds Free — You Only Pay When You Book A Slot You Actually Want.',
    checklist: [
      'Free To Sign Up, No Card Needed',
      'Own A Turf? List It And Start Earning',
      'All Your Bookings Saved In One Place'
    ],
    btn: 'Get Started',
    btnStyle: { background: 'linear-gradient(135deg, #9F67FF, #7C3AED)', color: '#FFFFFF' },
    accent: '#C4A0FF'
  }
]

export default function Onboarding({ onFinish }) {
  const [i, setI] = useState(0)
  const s = SLIDES[i]
  const isLast = i === SLIDES.length - 1

  function next() {
    if (!isLast) setI(i + 1)
    else onFinish()
  }

  return (
    <div className="ob2" style={{ background: s.bg }}>

      {/* Soft glow decorations */}
      <div className="ob2-glow ob2-glow-a" style={{ background: s.accent }} />
      <div className="ob2-glow ob2-glow-b" style={{ background: s.accent }} />

      {/* Top bar: logo + skip */}
      <header className="ob2-top">
        <div className="ob2-logo">
          <span className="ob2-logo-mark">⚽</span>
          <span className="ob2-logo-text">TURF ARENA</span>
        </div>
        {!isLast && (
          <button className="ob2-skip" onClick={onFinish}>Skip</button>
        )}
      </header>

      {/* Body */}
      <div className="ob2-body" key={i}>

        {/* Slide 1 — real photo in a phone-like frame */}
        {s.image && (
          <div className="ob2-photo-frame">
            <img src={s.image} alt="Sports Turf" className="ob2-photo" />
            <div className="ob2-photo-overlay" />
            <div className="ob2-photo-chip">
              <span className="ob2-live-dot" />
              There Are Slots Free Today
            </div>
          </div>
        )}

        {/* Slide 2 — feature cards */}
        {s.cards && (
          <div className="ob2-cards">
            {s.cards.map((c, n) => (
              <div className="ob2-card" key={n} style={{ animationDelay: `${n * 70}ms` }}>
                <span className="ob2-card-icon">{c.icon}</span>
                <div className="ob2-card-text">
                  <p className="ob2-card-title">{c.title}</p>
                  <p className="ob2-card-sub">{c.sub}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Slide 3 — illustration */}
        {isLast && (
          <div className="ob2-final-art">
            <div className="ob2-ring ob2-ring-1" />
            <div className="ob2-ring ob2-ring-2" />
            <span className="ob2-final-emoji">🏆</span>
          </div>
        )}

        {/* Text block */}
        <div className="ob2-text">
          <p className="ob2-tag" style={{ color: s.accent }}>{s.tag}</p>
          <h1 className="ob2-title">{s.title}</h1>
          <p className="ob2-desc">{s.body}</p>
        </div>

        {/* Slide 1 highlights */}
        {s.highlights && (
          <div className="ob2-highlights">
            {s.highlights.map((h, n) => (
              <div className="ob2-highlight" key={n}>
                <span className="ob2-highlight-icon">{h.icon}</span>
                <span>{h.text}</span>
              </div>
            ))}
          </div>
        )}

        {/* Slide 3 checklist */}
        {s.checklist && (
          <div className="ob2-checklist">
            {s.checklist.map((c, n) => (
              <div className="ob2-check-row" key={n} style={{ animationDelay: `${n * 90}ms` }}>
                <span className="ob2-check-mark" style={{ background: s.accent }}>✓</span>
                <span>{c}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer: progress + button */}
      <footer className="ob2-footer">
        <div className="ob2-progress">
          {SLIDES.map((_, n) => (
            <button
              key={n}
              className={'ob2-bar' + (n === i ? ' ob2-bar-on' : '') + (n < i ? ' ob2-bar-done' : '')}
              onClick={() => setI(n)}
              aria-label={`Slide ${n + 1}`}
            />
          ))}
        </div>

        <button className="ob2-cta" style={s.btnStyle} onClick={next}>
          {s.btn}
          {!isLast && <span className="ob2-cta-arrow">→</span>}
        </button>

        {isLast && (
          <p className="ob2-footnote">By Continuing You Agree To Our Terms Of Use</p>
        )}
      </footer>
    </div>
  )
}