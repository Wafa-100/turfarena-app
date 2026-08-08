import { useEffect, useState } from 'react'

export default function TopBar() {
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="topbar">
      <span className="topbar-date">
        {now.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
      </span>
      <span className="topbar-time">{now.toLocaleTimeString('en-IN')}</span>
    </div>
  )
}