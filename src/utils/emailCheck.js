/* Common providers, and the typos people actually make */
const DOMAINS = [
  'gmail.com', 'yahoo.com', 'yahoo.in', 'outlook.com', 'hotmail.com',
  'live.com', 'icloud.com', 'rediffmail.com', 'protonmail.com',
  'zoho.com', 'aol.com', 'msn.com'
]

/* Straight lookups — faster and more reliable than distance alone */
const TYPOS = {
  'gmail.con': 'gmail.com',   'gmail.co': 'gmail.com',    'gmail.cm': 'gmail.com',
  'gmail.om': 'gmail.com',    'gmial.com': 'gmail.com',   'gmai.com': 'gmail.com',
  'gmail.comm': 'gmail.com',  'gnail.com': 'gmail.com',   'gmaill.com': 'gmail.com',
  'gmail.in': 'gmail.com',    'gmail.cin': 'gmail.com',   'gmail.cok': 'gmail.com',
  'yahoo.con': 'yahoo.com',   'yaho.com': 'yahoo.com',    'yahooo.com': 'yahoo.com',
  'hotmai.com': 'hotmail.com','hotmail.con': 'hotmail.com','hotmial.com': 'hotmail.com',
  'outlok.com': 'outlook.com','outlook.con': 'outlook.com','outllok.com': 'outlook.com',
  'iclould.com': 'icloud.com','icloud.con': 'icloud.com',
  'rediffmail.con': 'rediffmail.com', 'redifmail.com': 'rediffmail.com'
}

/* Valid top-level domains we accept */
const TLDS = [
  'com', 'in', 'org', 'net', 'co', 'edu', 'gov', 'io', 'me', 'info',
  'biz', 'ac', 'dev', 'app', 'xyz', 'online', 'store', 'tech'
]

const BASE_RE = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/

/* How many single-character edits apart are two strings? */
function distance(a, b) {
  const m = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)])
  for (let j = 0; j <= b.length; j++) m[0][j] = j
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      m[i][j] = a[i - 1] === b[j - 1]
        ? m[i - 1][j - 1]
        : 1 + Math.min(m[i - 1][j], m[i][j - 1], m[i - 1][j - 1])
    }
  }
  return m[a.length][b.length]
}

/*
  Returns { valid, error, suggestion }
    valid      — passes structural checks
    error      — message to show, or ''
    suggestion — full corrected email, or null
*/
export function checkEmail(raw) {
  const email = (raw || '').trim().toLowerCase()

  if (!email) return { valid: false, error: 'Email is required', suggestion: null }

  if (!email.includes('@'))
    return { valid: false, error: 'An email needs an @ — like you@gmail.com', suggestion: null }

  const parts = email.split('@')
  if (parts.length > 2)
    return { valid: false, error: 'An email can only have one @', suggestion: null }

  const [local, domain] = parts

  if (!local)
    return { valid: false, error: 'Add your name before the @', suggestion: null }
  if (!domain)
    return { valid: false, error: 'Add a domain after the @ — like gmail.com', suggestion: null }
  if (!domain.includes('.'))
    return { valid: false, error: 'The domain needs a dot — like gmail.com', suggestion: null }
  if (!BASE_RE.test(email))
    return { valid: false, error: 'That email does not look valid', suggestion: null }

  const tld = domain.split('.').pop()

  // Known typo — correct it confidently
  if (TYPOS[domain])
    return {
      valid: false,
      error: `Did you mean ${local}@${TYPOS[domain]}?`,
      suggestion: `${local}@${TYPOS[domain]}`
    }

  // Unrecognised ending
  if (!TLDS.includes(tld)) {
    const close = TLDS.find(t => distance(tld, t) === 1)
    if (close) {
      const fixed = domain.slice(0, -tld.length) + close
      return {
        valid: false,
        error: `Did you mean ${local}@${fixed}?`,
        suggestion: `${local}@${fixed}`
      }
    }
    return { valid: false, error: `".${tld}" is not a valid ending`, suggestion: null }
  }

  // Domain one edit away from a common provider
  const near = DOMAINS.find(d => d !== domain && distance(domain, d) <= 1)
  if (near)
    return {
      valid: false,
      error: `Did you mean ${local}@${near}?`,
      suggestion: `${local}@${near}`
    }

  return { valid: true, error: '', suggestion: null }
}