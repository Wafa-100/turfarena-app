/* 00:00 through 24:00, each labelled with its 12-hour equivalent */
export const HOURS = Array.from({ length: 25 }, (_, h) => {
  const value = String(h).padStart(2, '0') + ':00'
  let label
  if (h === 0) label = '12:00 AM (midnight)'
  else if (h === 12) label = '12:00 PM (noon)'
  else if (h === 24) label = '12:00 AM (midnight)'
  else if (h < 12) label = `${h}:00 AM`
  else label = `${h - 12}:00 PM`
  return { value, label, hour: h }
})

export function timeLabel(value) {
  const h = parseInt(value, 10)
  if (isNaN(h)) return value
  if (h === 0 || h === 24) return '12 AM'
  if (h === 12) return '12 PM'
  return h < 12 ? `${h} AM` : `${h - 12} PM`
}

export default function TimeSelect({ value, onChange, className = '', from = 0, to = 24 }) {
  const options = HOURS.filter(h => h.hour >= from && h.hour <= to)
  return (
    <select
      className={'ts ' + className}
      value={value || ''}
      onChange={e => onChange(e.target.value)}
    >
      <option value="">Select time</option>
      {options.map(h => (
        <option key={h.value} value={h.value}>{h.label}</option>
      ))}
    </select>
  )
}