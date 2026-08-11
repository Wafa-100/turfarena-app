/* 15 preset avatars — gradient + mark, no image files needed */
export const AVATARS = [
  { id: 'a1',  g: ['#00A651', '#046B36'], d: 'M32 14a18 18 0 100 36 18 18 0 000-36m0 8l7 5-2.7 8.3h-8.6L25 27z' },
  { id: 'a2',  g: ['#0072F5', '#0044A8'], d: 'M20 44L44 20M20 20l24 24' },
  { id: 'a3',  g: ['#7C3AED', '#4C1D95'], d: 'M32 16a16 16 0 100 32 16 16 0 000-32m0 9a7 7 0 110 14 7 7 0 010-14' },
  { id: 'a4',  g: ['#F5A524', '#B45309'], d: 'M18 40l14-22 14 22z' },
  { id: 'a5',  g: ['#E5484D', '#991B1B'], d: 'M22 22h20v20H22zM28 28h8v8h-8z' },
  { id: 'a6',  g: ['#06B6D4', '#0E7490'], d: 'M32 18v28M18 32h28' },
  { id: 'a7',  g: ['#EC4899', '#9D174D'], d: 'M32 18a14 14 0 000 28 14 14 0 010-28' },
  { id: 'a8',  g: ['#22C55E', '#15803D'], d: 'M20 32a12 12 0 0124 0 12 12 0 01-24 0M32 20v24' },
  { id: 'a9',  g: ['#8B5CF6', '#5B21B6'], d: 'M24 24h16v16H24zM32 18v6M32 40v6M18 32h6M40 32h6' },
  { id: 'a10', g: ['#F97316', '#9A3412'], d: 'M32 17l4.6 9.4 10.4 1.5-7.5 7.3 1.8 10.3L32 40.6l-9.3 4.9 1.8-10.3-7.5-7.3 10.4-1.5z' },
  { id: 'a11', g: ['#14B8A6', '#0F766E'], d: 'M20 40c0-6.6 5.4-12 12-12s12 5.4 12 12M32 16a6 6 0 100 12 6 6 0 000-12' },
  { id: 'a12', g: ['#6366F1', '#3730A3'], d: 'M22 42V26M32 42V20M42 42V30' },
  { id: 'a13', g: ['#EAB308', '#854D0E'], d: 'M32 18a14 14 0 100 28 14 14 0 000-28M26 30h12M26 36h8' },
  { id: 'a14', g: ['#F43F5E', '#9F1239'], d: 'M32 46s-14-9-14-18a7 7 0 0114-3 7 7 0 0114 3c0 9-14 18-14 18' },
  { id: 'a15', g: ['#64748B', '#334155'], d: 'M32 16l14 8v16l-14 8-14-8V24z' }
]

export function avatarById(id) {
  return AVATARS.find(a => a.id === id) || null
}

/* Renders either a preset avatar or the user's initials */
export default function Avatar({ id, name = '', size = 64, className = '' }) {
  const preset = avatarById(id)

  if (!preset) {
    const initials = name.trim().split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    return (
      <div className={'av-initials ' + className}
        style={{ width: size, height: size, fontSize: size * 0.36 }}>
        {initials || '?'}
      </div>
    )
  }

  const gid = 'avg-' + preset.id
  return (
    <svg className={'av-svg ' + className} width={size} height={size} viewBox="0 0 64 64">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={preset.g[0]} />
          <stop offset="100%" stopColor={preset.g[1]} />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="32" fill={`url(#${gid})`} />
      <path d={preset.d} fill="none" stroke="#fff" strokeWidth="2.6"
        strokeLinecap="round" strokeLinejoin="round" opacity="0.95" />
    </svg>
  )
}