/*
  Stroke icons — inherit currentColor, so they follow the theme.
  <Icon name="home" />          outline
  <Icon name="star" filled />   solid
  <Icon name="pin" size={14} /> custom size
*/

const PATHS = {
  /* nav */
  home:     'M3 10.2 12 3l9 7.2V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
  calendar: 'M8 2v3M16 2v3M3.5 9h17M5 5.5h14a1.5 1.5 0 0 1 1.5 1.5v13a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 20V7A1.5 1.5 0 0 1 5 5.5',
  plus:     'M12 8v8M8 12h8M12 3.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17',
  mail:     'M3.5 7.5 12 13l8.5-5.5M4.5 5.5h15a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1h-15a1 1 0 0 1-1-1v-11a1 1 0 0 1 1-1',
  user:     'M12 12.5a4.25 4.25 0 1 0 0-8.5 4.25 4.25 0 0 0 0 8.5M4.5 20.5c0-3.6 3.4-5.5 7.5-5.5s7.5 1.9 7.5 5.5',

  /* general */
  search:   'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14M20.5 20.5 16 16',
  pin:      'M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11M12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5',
  star:     'm12 3.5 2.6 5.5 5.9.8-4.3 4.2 1 6-5.2-2.8-5.2 2.8 1-6L3.5 9.8l5.9-.8z',
  clock:    'M12 7v5.2l3.2 1.9M12 3.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17',
  chevron:  'm9 5 7 7-7 7',
  check:    'm4.5 12.5 5 5 10-11',
  arrow:    'M4 12h15M13 6l6 6-6 6',
  close:    'M6 6l12 12M18 6 6 18',
  bolt:     'M13 2.5 4.5 13.5H11l-.5 8L19 10.5h-6.5z',
  shield:   'M12 3 5 6v6c0 4.2 3 7.6 7 9 4-1.4 7-4.8 7-9V6z',
  refresh:  'M20 12a8 8 0 1 1-2.4-5.7M20 3.5V9h-5.5',
  ball:     'M12 3.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17M12 8l3.8 2.8-1.5 4.6H9.7l-1.5-4.6z',

  /* payment */
  card:     'M2.5 9.5h19M4.5 5.5h15a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1h-15a1 1 0 0 1-1-1v-11a1 1 0 0 1 1-1',
  phone:    'M9 5.5h6M9 18.5h6M8 2.5h8a1.5 1.5 0 0 1 1.5 1.5v16a1.5 1.5 0 0 1-1.5 1.5H8a1.5 1.5 0 0 1-1.5-1.5V4A1.5 1.5 0 0 1 8 2.5',
  bank:     'M3.5 9.5h17M12 3l8.5 4.5h-17zM6 10v7M10 10v7M14 10v7M18 10v7M3.5 20.5h17',
  wallet:   'M3.5 7.5v11a1.5 1.5 0 0 0 1.5 1.5h14a1 1 0 0 0 1-1v-9a1 1 0 0 0-1-1H5a1.5 1.5 0 0 1 0-3h12M17 14h.01',
  rupee:    'M7 4h10M7 8.5h10M7 20l7-7.5c2-2.2.6-4.5-2.2-4.5H7',
  receipt:  'M6 2.5h12a.5.5 0 0 1 .5.5v18l-2.5-1.6L13.5 21 11 19.4 8.5 21 6 19.4 5.5 21V3a.5.5 0 0 1 .5-.5M9 8h6M9 12h6',
  undo:     'M4 9h11a5 5 0 0 1 0 10h-6M4 9l4-4M4 9l4 4',

  /* actions */
  edit:     'M4 20h4L19 9a2.1 2.1 0 0 0-3-3L5 17v3M14.5 6.5l3 3',
  trash:    'M4 6.5h16M9.5 6.5V4.5h5v2M6.5 6.5 7.5 20a1 1 0 0 0 1 1h7a1 1 0 0 0 1-1l1-13.5M10 10.5v6M14 10.5v6',
  camera:   'M12 17a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7M4 6.5h3l1.5-2h7L17 6.5h3a1 1 0 0 1 1 1V19a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7.5a1 1 0 0 1 1-1',
  logout:   'M9.5 20.5H5a1.5 1.5 0 0 1-1.5-1.5V5A1.5 1.5 0 0 1 5 3.5h4.5M16 8l4 4-4 4M20 12H9',
  lock:     'M7 10.5V7a5 5 0 0 1 10 0v3.5M6 10.5h12a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-8.5a1 1 0 0 1 1-1M12 14.5v3',
  chat:     'M8 10h8M8 13.5h5M4.5 4.5h15a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H9l-4.5 4v-4a1 1 0 0 1 0-13',
  info:     'M12 11v5.5M12 7.6h.01M12 3.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17',
  alert:    'M12 8.5v5M12 17.2h.01M10.7 3.6 2.6 17.5A1.5 1.5 0 0 0 3.9 20h16.2a1.5 1.5 0 0 0 1.3-2.5L13.3 3.6a1.5 1.5 0 0 0-2.6 0',

  /* admin */
  chart:    'M4 20.5V13M9.3 20.5V6M14.7 20.5v-9M20 20.5V3.5',
  users:    'M9 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8M2.5 20.5c0-3.4 3-5.5 6.5-5.5s6.5 2.1 6.5 5.5M16 4.5a4 4 0 0 1 0 7.6M17.5 15.4c2.5.6 4 2.3 4 5.1',
  inbox:    'M3.5 13.5h5l1 3h5l1-3h5M5.4 4.5h13.2a1 1 0 0 1 1 .7l2 8.3v5a1 1 0 0 1-1 1H3.4a1 1 0 0 1-1-1v-5l2-8.3a1 1 0 0 1 1-.7',
  building: 'M3.5 21h17M5 21V4a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v17M15 21V9h3a1 1 0 0 1 1 1v11M8 7h4M8 11h4M8 15h4',

  /* theme */
  sun:      'M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4',
  moon:     'M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a8.5 8.5 0 1 0 11 11',
  monitor:  'M8 21h8M12 17v4M4 4.5h16a1 1 0 0 1 1 1V16a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5.5a1 1 0 0 1 1-1'
}

export default function Icon({ name, size = 20, filled = false, className = '', strokeWidth = 1.7 }) {
  const d = PATHS[name]
  if (!d) {
    if (import.meta.env.DEV) console.warn(`Icon "${name}" not found`)
    return null
  }
  return (
    <svg
      className={'icn ' + className}
      width={size} height={size} viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={filled ? 0 : strokeWidth}
      strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={d} />
    </svg>
  )
}