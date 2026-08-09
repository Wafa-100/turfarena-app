const KEY = 'ta_theme'

export function getStoredTheme() {
  try { return localStorage.getItem(KEY) || 'system' } catch { return 'system' }
}

export function systemPrefersDark() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

export function resolveTheme(choice) {
  if (choice === 'dark') return 'dark'
  if (choice === 'light') return 'light'
  return systemPrefersDark() ? 'dark' : 'light'
}

export function applyTheme(choice) {
  const resolved = resolveTheme(choice)
  document.documentElement.setAttribute('data-theme', resolved)

  // keep the mobile browser chrome in sync
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', resolved === 'dark' ? '#0B120E' : '#F4F7F5')

  try { localStorage.setItem(KEY, choice) } catch {}
  return resolved
}

// Re-apply when the OS theme changes, but only while on "system"
export function watchSystemTheme(onChange) {
  const mq = window.matchMedia('(prefers-color-scheme: dark)')
  const handler = () => {
    if (getStoredTheme() === 'system') onChange(applyTheme('system'))
  }
  mq.addEventListener('change', handler)
  return () => mq.removeEventListener('change', handler)
}