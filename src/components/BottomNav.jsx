import { NavLink } from 'react-router-dom'
import Icon from './Icon'

const TABS = [
  { to: '/',         label: 'Explore',  icon: 'home' },
  { to: '/bookings', label: 'Bookings', icon: 'calendar' },
  { to: '/add-turf', label: 'List',     icon: 'plus' },
  { to: '/contact',  label: 'Help',     icon: 'mail' },
  { to: '/profile',  label: 'Account',  icon: 'user' }
]

export default function BottomNav() {
  return (
    <nav className="bnav">
      {TABS.map(t => (
        <NavLink
          key={t.to}
          to={t.to}
          end={t.to === '/'}
          className={({ isActive }) => 'bnav-item' + (isActive ? ' bnav-on' : '')}
        >
          {({ isActive }) => (
            <>
              <span className="bnav-icon-wrap">
                <Icon name={t.icon} size={21} filled={isActive} />
              </span>
              <span className="bnav-label">{t.label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}