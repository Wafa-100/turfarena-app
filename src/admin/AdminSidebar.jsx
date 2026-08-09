import Icon from '../components/Icon'

const NAV = [
  { id: 'dashboard', label: 'Dashboard',   icon: 'chart' },
  { id: 'users',     label: 'Users',       icon: 'users' },
  { id: 'turfs',     label: 'Grounds',     icon: 'building' },
  { id: 'bookings',  label: 'Bookings',    icon: 'calendar' },
  { id: 'payments',  label: 'Payments',    icon: 'card' },
  { id: 'refunds',   label: 'Refunds',     icon: 'undo' },
  { id: 'plans',     label: 'Owner Plans', icon: 'star' },
  { id: 'messages',  label: 'Messages',    icon: 'chat' },
  { id: 'emails',    label: 'Email Logs',  icon: 'inbox' }
]

export default function AdminSidebar({ current, onNav, onLogout, user }) {
  return (
    <aside className="admin-sidebar">
      <div className="admin-brand">
        <span className="admin-brand-icon"><Icon name="ball" size={26} /></span>
        <div>
          <p className="admin-brand-name">TurfArena</p>
          <p className="admin-brand-sub">Admin Panel</p>
        </div>
      </div>

      <div className="admin-admin-info">
        <div className="admin-avatar">{user.name.charAt(0).toUpperCase()}</div>
        <div>
          <p className="admin-admin-name">{user.name}</p>
          <p className="admin-admin-role">Administrator</p>
        </div>
      </div>

      <nav className="admin-nav">
        {NAV.map(n => (
          <button key={n.id}
            className={'admin-nav-item' + (current === n.id ? ' admin-nav-active' : '')}
            onClick={() => onNav(n.id)}>
            <span className="admin-nav-icon">
              <Icon name={n.icon} size={18} filled={current === n.id && n.icon === 'star'} />
            </span>
            <span>{n.label}</span>
          </button>
        ))}
      </nav>

      <button className="admin-logout" onClick={onLogout}>
        <Icon name="logout" size={16} /> Log Out
      </button>
    </aside>
  )
}