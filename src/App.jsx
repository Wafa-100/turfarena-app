import { useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { getCurrentUser, logoutUser } from './utils/api'
import TopBar from './components/TopBar'
import BottomNav from './components/BottomNav'
import Onboarding from './pages/Onboarding'
import Login from './pages/Login'
import Home from './pages/Home'
import TurfDetails from './pages/TurfDetails'
import Booking from './pages/Booking'
import BookingConfirmation from './pages/BookingConfirmation'
import MyBookings from './pages/MyBookings'
import AddTurf from './pages/AddTurf'
import EditTurf from './pages/EditTurf'
import ManageGround from './pages/ManageGround'
import PlanPurchase from './pages/PlanPurchase'
import Wallet from './pages/Wallet'
import Contact from './pages/Contact'
import Profile from './pages/Profile'
import AdminApp from './admin/AdminApp'
import SelectTurfs from './pages/SelectTurfs'
import Reviews from './pages/Reviews'

export default function App() {
  const [onboarded, setOnboarded] = useState(
    () => localStorage.getItem('te_onboarded') === 'yes'
  )
  const [user, setUser] = useState(getCurrentUser())

  function finishOnboarding() {
    localStorage.setItem('te_onboarded', 'yes')
    setOnboarded(true)
  }
  function handleLogout() { logoutUser(); setUser(null) }

  if (!onboarded) {
    return <div className="app-shell"><Onboarding onFinish={finishOnboarding} /></div>
  }
  if (!user) {
    return <div className="app-shell"><Login onLogin={setUser} /></div>
  }
  if (user.role === 'admin') {
    return <AdminApp user={user} onLogout={handleLogout} />
  }

  return (
    <div className="app-shell">
      <TopBar />
      <main className="screen">
        <Routes>
          <Route path="/"              element={<Home user={user} />} />
          <Route path="/turf/:id"      element={<TurfDetails user={user} />} />
          <Route path="/book/:id"      element={<Booking user={user} />} />
          <Route path="/confirmation"  element={<BookingConfirmation />} />
          <Route path="/bookings"      element={<MyBookings user={user} />} />
          <Route path="/add-turf"      element={<AddTurf user={user} />} />
          <Route path="/edit-turf/:id" element={<EditTurf user={user} />} />
          <Route path="/manage/:id"    element={<ManageGround user={user} />} />
          <Route path="/plan"          element={<PlanPurchase user={user} />} />
          <Route path="/wallet"        element={<Wallet user={user} />} />
          <Route path="/contact"       element={<Contact user={user} />} />
          <Route path="/profile"       element={<Profile user={user} onUserUpdate={setUser} onLogout={handleLogout} />} />
          <Route path="*"              element={<Navigate to="/" replace />} />
          <Route path="/select-grounds" element={<SelectTurfs user={user} />} />
          <Route path="/reviews" element={<Reviews user={user} />} />
        </Routes>
      </main>
      <BottomNav />
    </div>
  )
}