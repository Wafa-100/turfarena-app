const NAV = [
  { id: 'dashboard', label: 'Dashboard',    icon: '📊' },
  { id: 'users',     label: 'Users',        icon: '👥' },
  { id: 'turfs',     label: 'Turfs',        icon: '🏟️' },
  { id: 'bookings',  label: 'Bookings',     icon: '📅' },
  { id: 'payments',  label: 'Payments',     icon: '💳' },
  { id: 'refunds',   label: 'Refunds',      icon: '↩️' },
  { id: 'plans',     label: 'Owner Plans',  icon: '⭐' },
  { id: 'messages',  label: 'Messages',     icon: '✉️' },
  { id: 'emails',    label: 'Email Logs',   icon: '📧' }
]

export default function AdminSidebar({ current, onNav, onLogout, user }) {
  return (
    <aside className="admin-sidebar">
      <div className="admin-brand">
        <span className="admin-brand-icon">⚽</span>
        <div>
          <p className="admin-brand-name">Turf Arena</p>
          <p className="admin-brand-sub">Admin Panel</p>
        </div>
      </div>

      <div className="admin-admin-info">
        <div className="admin-avatar">{user.name.charAt(0)}</div>
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
            <span className="admin-nav-icon">{n.icon}</span>
            <span>{n.label}</span>
          </button>
        ))}
      </nav>

      <button className="admin-logout" onClick={onLogout}>🚪 Log Out</button>
    </aside>
  )
}