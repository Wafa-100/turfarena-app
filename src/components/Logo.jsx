/*
  TurfArena mark — a pitch from above with a time arc.

  <Logo size={44} />                    static
  <Logo size={64} animate />            draws itself once
  <Logo size={80} animate loop />       keeps sweeping
  <Logo size={40} withText />           mark plus wordmark
  <Logo size={40} mono />               single colour, follows currentColor
*/

export default function Logo({
  size = 48,
  animate = false,
  loop = false,
  withText = false,
  mono = false,
  className = ''
}) {
  const uid = 'lg' + Math.random().toString(36).slice(2, 7)

  const mark = (
    <svg
      width={size} height={size} viewBox="0 0 64 64"
      className={'logo-svg' + (animate ? ' logo-anim' : '') + (loop ? ' logo-loop' : '')}
      fill="none" xmlns="http://www.w3.org/2000/svg"
      aria-label="TurfArena"
    >
      <defs>
        <linearGradient id={uid + 'g'} x1="8" y1="8" x2="56" y2="56"
          gradientUnits="userSpaceOnUse">
          <stop offset="0%"  stopColor="var(--brand-bright, #2FD37E)" />
          <stop offset="55%" stopColor="var(--brand, #00A651)" />
          <stop offset="100%" stopColor="var(--brand-dim, #007D3C)" />
        </linearGradient>

        <linearGradient id={uid + 'a'} x1="14" y1="50" x2="50" y2="14"
          gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="var(--gold, #B8912A)" stopOpacity="0" />
          <stop offset="35%"  stopColor="var(--gold, #B8912A)" />
          <stop offset="100%" stopColor="var(--brand-bright, #2FD37E)" />
        </linearGradient>
      </defs>

      {/* The ground */}
      <rect
        className="lg-pitch"
        x="6" y="12" width="52" height="40" rx="9"
        stroke={mono ? 'currentColor' : `url(#${uid}g)`}
        strokeWidth="3.4"
      />

      {/* Halfway line */}
      <path
        className="lg-line"
        d="M32 12v40"
        stroke={mono ? 'currentColor' : `url(#${uid}g)`}
        strokeWidth="2.4"
        strokeLinecap="round"
        opacity="0.5"
      />

      {/* Centre circle */}
      <circle
        className="lg-circle"
        cx="32" cy="32" r="8.5"
        stroke={mono ? 'currentColor' : `url(#${uid}g)`}
        strokeWidth="2.4"
        opacity="0.5"
      />

      {/* The hour — an arc sweeping from the centre */}
      <path
        className="lg-arc"
        d="M32 32 L32 15.5 A16.5 16.5 0 0 1 46.3 40.2"
        stroke={mono ? 'currentColor' : `url(#${uid}a)`}
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Centre spot */}
      <circle
        className="lg-dot"
        cx="32" cy="32" r="3.2"
        fill={mono ? 'currentColor' : `url(#${uid}g)`}
      />
    </svg>
  )

  if (!withText) return <span className={'logo ' + className}>{mark}</span>

  return (
    <span className={'logo logo-row ' + className}>
      {mark}
      <span className="logo-text" style={{ fontSize: size * 0.52 }}>
        Turf<span className="logo-text-2">Arena</span>
      </span>
    </span>
  )
}