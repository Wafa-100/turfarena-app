import { NavLink } from 'react-router-dom'

const tabs = [
  { to: '/', label: 'Home', icon: '🏠' },
  { to: '/bookings', label: 'Bookings', icon: '📅' },
  { to: '/add-turf', label: 'Add Turf', icon: '➕' },
  { to: '/contact', label: 'Contact', icon: '✉️' },
  { to: '/profile', label: 'Profile', icon: '👤' }
]

export default function BottomNav() {
  return (
    <nav className="bottom-nav">
      {tabs.map((t) => (
        <NavLink key={t.to} to={t.to} end={t.to === '/'}
          className={({ isActive }) => 'nav-item' + (isActive ? ' active' : '')}>
          <span className="nav-icon">{t.icon}</span>
          <span className="nav-label">{t.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}