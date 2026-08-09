import { useState } from 'react'
import Icon from '../components/Icon'

/* Swap these for your own photos in public/onboarding/ */
const PHOTOS = [
  '/onboarding/turf-1.jpg',
  '/onboarding/turf-2.jpg',
  '/onboarding/turf-3.jpg'
]
const FALLBACK = [
  'https://picsum.photos/seed/turfnight/1000/1400',
  'https://picsum.photos/seed/turfplay/1000/1400',
  'https://picsum.photos/seed/turfwide/1000/1400'
]

const SLIDES = [
  {
    tint: '#062B16',
    eyebrow: 'TurfArena',
    title: 'Every ground\nin your city',
    body: 'Stop calling five numbers to find one free slot. See what is actually available, right now, and lock it in.',
    chip: { icon: 'bolt', text: 'Live availability' },
    cta: 'Explore'
  },
  {
    tint: '#0B1F3A',
    eyebrow: 'How it works',
    title: 'Pick your hours,\npay, and play',
    body: 'Real prices, real photos, real facilities — all before you commit a rupee.',
    points: [
      { icon: 'clock',  title: 'Book by the hour', sub: 'Select as many slots as you need' },
      { icon: 'card',   title: 'Pay your way',     sub: 'UPI, card, net banking or wallet' },
      { icon: 'refresh',title: 'Free cancellation',sub: 'Plans change — get your money back' }
    ],
    cta: 'Next'
  },
  {
    tint: '#12100A',
    eyebrow: 'Ready when you are',
    title: 'Your next game\nstarts here',
    body: 'Create an account in under a minute. Browsing is free — you only pay for the hours you book.',
    checks: [
      'Free to join, no card needed',
      'Own a ground? List it and start earning',
      'Every booking saved in one place'
    ],
    cta: 'Get started'
  }
]

export default function Onboarding({ onFinish }) {
  const [i, setI] = useState(0)
  const [broken, setBroken] = useState({})
  const s = SLIDES[i]
  const last = i === SLIDES.length - 1
  const src = broken[i] ? FALLBACK[i] : PHOTOS[i]

  return (
    <div className="ob3">

      {/* ── Photo layer ── */}
      <div className="ob3-media">
        <img
          key={i}
          src={src}
          alt=""
          className="ob3-photo"
          onError={() => setBroken(b => ({ ...b, [i]: true }))}
        />
        <div className="ob3-tint" style={{ background: s.tint }} />
        <div className="ob3-scrim" />
      </div>

      {/* ── Top bar ── */}
      <header className="ob3-top">
        <span className="ob3-brand">TurfArena</span>
        {!last && <button className="ob3-skip" onClick={onFinish}>Skip</button>}
      </header>

      {/* ── Content ── */}
      <div className="ob3-content" key={i}>

        {s.chip && (
          <span className="ob3-chip">
            <span className="ob3-chip-dot" />
            <Icon name={s.chip.icon} size={13} />
            {s.chip.text}
          </span>
        )}

        <p className="ob3-eyebrow">{s.eyebrow}</p>
        <h1 className="ob3-title">{s.title}</h1>
        <p className="ob3-body">{s.body}</p>

        {s.points && (
          <div className="ob3-points">
            {s.points.map((p, n) => (
              <div className="ob3-point" key={p.title} style={{ animationDelay: `${n * 80}ms` }}>
                <span className="ob3-point-icon"><Icon name={p.icon} size={17} /></span>
                <div>
                  <p className="ob3-point-title">{p.title}</p>
                  <p className="ob3-point-sub">{p.sub}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {s.checks && (
          <div className="ob3-checks">
            {s.checks.map((c, n) => (
              <div className="ob3-check" key={c} style={{ animationDelay: `${n * 90}ms` }}>
                <span className="ob3-check-mark"><Icon name="check" size={12} /></span>
                {c}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      <footer className="ob3-foot">
        <div className="ob3-bars">
          {SLIDES.map((_, n) => (
            <button key={n}
              className={'ob3-bar' + (n === i ? ' ob3-bar-on' : n < i ? ' ob3-bar-done' : '')}
              onClick={() => setI(n)}
              aria-label={`Slide ${n + 1}`} />
          ))}
        </div>

        <button className="ob3-cta" onClick={() => last ? onFinish() : setI(i + 1)}>
          {s.cta}
          {!last && <Icon name="arrow" size={18} />}
        </button>

        {last && <p className="ob3-terms">By continuing you agree to our terms of use</p>}
      </footer>
    </div>
  )
}