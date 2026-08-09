import { useEffect, useState } from 'react'
import { getStoredTheme, applyTheme, resolveTheme, watchSystemTheme } from '../utils/theme'

const OPTIONS = [
  { id: 'light',  label: 'Light',  icon: '☀️', sub: 'Bright And Clean' },
  { id: 'dark',   label: 'Dark',   icon: '🌙', sub: 'Easier At Night' },
  { id: 'system', label: 'System', icon: '⚙️', sub: 'Match My Device' }
]

export default function ThemeToggle() {
  const [choice, setChoice] = useState(getStoredTheme)
  const [resolved, setResolved] = useState(() => resolveTheme(getStoredTheme()))

  useEffect(() => watchSystemTheme(setResolved), [])

  function pick(id) {
    setChoice(id)
    setResolved(applyTheme(id))
  }

  return (
    <div className="tt-wrap">
      <div className="tt-options">
        {OPTIONS.map(o => (
          <button
            key={o.id}
            className={'tt-option' + (choice === o.id ? ' tt-option-on' : '')}
            onClick={() => pick(o.id)}
          >
            <span className="tt-icon">{o.icon}</span>
            <span className="tt-label">{o.label}</span>
            <span className="tt-sub">{o.sub}</span>
            {choice === o.id && <span className="tt-check">✓</span>}
          </button>
        ))}
      </div>
      {choice === 'system' && (
        <p className="tt-note">
          Currently Showing <b>{resolved}</b>, Following Your Device Setting.
        </p>
      )}
    </div>
  )
}