import { useState } from 'react'

/* Half-filled stars via a clipped overlay — a 4.3 shows as 4.3, not 4 */
function Star({ fill = 1, size = 18 }) {
  const d = 'm12 2.5 2.9 6.1 6.6.9-4.8 4.7 1.1 6.7L12 17.7 6.2 20.9l1.1-6.7L2.5 9.5l6.6-.9z'
  return (
    <span className="sr-star" style={{ width: size, height: size }}>
      <svg viewBox="0 0 24 24" width={size} height={size} className="sr-bg">
        <path d={d} />
      </svg>
      {fill > 0 && (
        <span className="sr-clip" style={{ width: `${Math.min(1, fill) * 100}%` }}>
          <svg viewBox="0 0 24 24" width={size} height={size} className="sr-fg">
            <path d={d} />
          </svg>
        </span>
      )}
    </span>
  )
}

/* Read-only display */
export function Stars({ value = 0, size = 16, className = '' }) {
  return (
    <span className={'sr ' + className}>
      {[1, 2, 3, 4, 5].map(n => (
        <Star key={n} size={size} fill={Math.max(0, Math.min(1, value - n + 1))} />
      ))}
    </span>
  )
}

const LABELS = ['', 'Poor', 'Not great', 'Okay', 'Good', 'Excellent']

/* Interactive picker */
export default function StarRating({ value, onChange, size = 40, showLabel = true }) {
  const [hover, setHover] = useState(0)
  const shown = hover || value

  return (
    <div className="sr-pick-wrap">
      <div className="sr-pick" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map(n => (
          <button key={n} type="button"
            className={'sr-pick-btn' + (n <= shown ? ' sr-pick-on' : '')}
            onMouseEnter={() => setHover(n)}
            onClick={() => onChange(n)}
            aria-label={`${n} star${n > 1 ? 's' : ''}`}>
            <Star size={size} fill={n <= shown ? 1 : 0} />
          </button>
        ))}
      </div>
      {showLabel && (
        <p className={'sr-label' + (shown ? ' sr-label-on' : '')}>
          {shown ? LABELS[shown] : 'Tap to rate'}
        </p>
      )}
    </div>
  )
}