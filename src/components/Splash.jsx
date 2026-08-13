import Logo from './Logo'

export default function Splash({ message = '' }) {
  return (
    <div className="splash">
      <Logo size={88} loop />
      <p className="splash-name">TurfArena</p>
      {message && <p className="splash-msg">{message}</p>}
    </div>
  )
}