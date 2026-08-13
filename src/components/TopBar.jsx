import { useEffect, useState } from 'react'
import Logo from './Logo'

export default function TopBar() {
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="topbar">
      <span className="topbar-date">
        {now.toLocaleDateString('en-IN', {
          weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
        })}
      </span>

      <span className="tb-brand">
        <Logo size={22} />
      </span>

      <span className="topbar-time">
        {now.toLocaleTimeString('en-IN', {
          hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
        })}
      </span>
    </div>
  )
}