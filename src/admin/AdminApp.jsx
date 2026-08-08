import { useState } from 'react'
import AdminSidebar from './AdminSidebar'
import Dashboard from './Dashboard'
import ManageUsers from './ManageUsers'
import ManageTurfs from './ManageTurfs'
import ManageBookings from './ManageBookings'
import ManagePayments from './ManagePayments'
import ManageRefunds from './ManageRefunds'
import ManageMessages from './ManageMessages'
import ManageEmails from './ManageEmails'
import ManagePlans from './ManagePlans'

export default function AdminApp({ user, onLogout }) {
  const [page, setPage] = useState('dashboard')

  return (
    <div className="admin-wrapper">
      <AdminSidebar current={page} onNav={setPage} onLogout={onLogout} user={user} />
      <main className="admin-main">
        {page === 'dashboard' && <Dashboard />}
        {page === 'users'     && <ManageUsers />}
        {page === 'turfs'     && <ManageTurfs />}
        {page === 'bookings'  && <ManageBookings />}
        {page === 'payments'  && <ManagePayments />}
        {page === 'refunds'   && <ManageRefunds />}
        {page === 'plans'     && <ManagePlans />}
        {page === 'messages'  && <ManageMessages />}
        {page === 'emails'    && <ManageEmails />}
      </main>
    </div>
  )
}