import { useEffect, useState } from 'react'

/* Turns milliseconds into 2d 04:15:32 / 04:15:32 / 15:32 */
function format(ms) {
  if (ms <= 0) return null
  const total = Math.floor(ms / 1000)
  const days = Math.floor(total / 86400)
  const hrs  = Math.floor((total % 86400) / 3600)
  const mins = Math.floor((total % 3600) / 60)
  const secs = total % 60
  const pad = n => String(n).padStart(2, '0')

  if (days > 0) return `${days}d ${pad(hrs)}:${pad(mins)}:${pad(secs)}`
  if (hrs > 0)  return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`
  return `${pad(mins)}:${pad(secs)}`
}

/*
  <Countdown to={date} label="Starts in" />

  Re-renders once a second. Turns amber under an hour and red under
  ten minutes, so urgency is visible without reading the numbers.
*/
export default function Countdown({
  to, label = '', icon = null, onDone, className = '', compact = false
}) {
  const target = new Date(to).getTime()
  const [left, setLeft] = useState(() => target - Date.now())

  useEffect(() => {
    setLeft(target - Date.now())
    const timer = setInterval(() => {
      const ms = target - Date.now()
      setLeft(ms)
      if (ms <= 0) { clearInterval(timer); onDone?.() }
    }, 1000)
    return () => clearInterval(timer)
  }, [target])

  const text = format(left)
  if (!text) return null

  const mins = left / 60000
  const urgency = mins < 10 ? ' cd-red' : mins < 60 ? ' cd-amber' : ''

  return (
    <span className={'cd' + urgency + (compact ? ' cd-compact' : '') + ' ' + className}>
      {icon}
      {label && <span className="cd-label">{label}</span>}
      <span className="cd-time">{text}</span>
    </span>
  )
}