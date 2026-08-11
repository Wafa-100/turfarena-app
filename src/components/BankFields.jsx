const IFSC_RE  = /^[A-Z]{4}0[A-Z0-9]{6}$/
const PAN_RE   = /^[A-Z]{5}[0-9]{4}[A-Z]$/
const GST_RE   = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][0-9][A-Z][0-9A-Z]$/
const PIN_RE   = /^[1-9][0-9]{5}$/

export const BUSINESS_TYPES = [
  { id: 'individual',      label: 'Individual',           sub: 'You own the ground personally' },
  { id: 'proprietorship',  label: 'Sole proprietorship',  sub: 'Registered business, one owner' },
  { id: 'partnership',     label: 'Partnership',          sub: 'Two or more partners' },
  { id: 'private_limited', label: 'Private limited',      sub: 'Pvt Ltd company' },
  { id: 'llp',             label: 'LLP',                  sub: 'Limited liability partnership' }
]

export const STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa',
  'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala',
  'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland',
  'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Delhi', 'Jammu and Kashmir',
  'Ladakh', 'Puducherry', 'Chandigarh', 'Andaman and Nicobar Islands',
  'Dadra and Nagar Haveli and Daman and Diu', 'Lakshadweep'
]

export const BANKS = [
  'State Bank of India', 'HDFC Bank', 'ICICI Bank', 'Axis Bank',
  'Kotak Mahindra Bank', 'Punjab National Bank', 'Bank of Baroda',
  'Canara Bank', 'Union Bank of India', 'IndusInd Bank', 'Federal Bank',
  'Yes Bank', 'IDFC First Bank', 'Bank of India', 'Other'
]

/* Refund forms only need the bank block — pass mode="bank" */
export function validateBank(b, mode = 'full') {
  const e = {}

  if (mode === 'full') {
    if (!b.businessName?.trim()) e.businessName = 'Business or trading name is required'
    else if (b.businessName.trim().length < 4) e.businessName = 'Needs at least 4 characters'

    const pan = (b.pan || '').toUpperCase()
    if (!pan) e.pan = 'PAN is required — Razorpay cannot pay out without it'
    else if (!PAN_RE.test(pan)) e.pan = 'Format is 5 letters, 4 digits, 1 letter — e.g. ABCDE1234F'

    if (b.gst && !GST_RE.test(b.gst.toUpperCase()))
      e.gst = 'That GST number does not look valid'

    if (!b.street?.trim()) e.street = 'Street address is required'
    if (!b.city?.trim()) e.city = 'City is required'
    if (!b.state) e.state = 'Select your state'
    if (!b.postalCode) e.postalCode = 'PIN code is required'
    else if (!PIN_RE.test(b.postalCode)) e.postalCode = 'PIN codes are 6 digits'
  }

  if (!b.accountName?.trim()) e.accountName = 'Account holder name is required'
  const num = (b.accountNumber || '').replace(/\s/g, '')
  if (!num) e.accountNumber = 'Account number is required'
  else if (num.length < 9 || num.length > 18) e.accountNumber = 'Account numbers are 9 to 18 digits'

  if (b.confirmNumber !== undefined && b.confirmNumber !== b.accountNumber)
    e.confirmNumber = 'Account numbers do not match'

  const ifsc = (b.ifsc || '').toUpperCase()
  if (!ifsc) e.ifsc = 'IFSC code is required'
  else if (!IFSC_RE.test(ifsc)) e.ifsc = 'Format is 4 letters, a zero, then 6 characters'

  if (mode === 'full' && !b.bankName) e.bankName = 'Select your bank'

  return e
}

export default function BankFields({
  value, onChange, errors = {}, showConfirm = false, mode = 'full'
}) {
  const v = value || {}
  const set = (k, val) => onChange({ ...v, [k]: val })

  const ifscOk = v.ifsc && IFSC_RE.test(v.ifsc.toUpperCase())
  const panOk  = v.pan && PAN_RE.test(v.pan.toUpperCase())

  return (
    <div className="bf">

      {mode === 'full' && (
        <>
          {/* ── Business ── */}
          <p className="bf-group">Your business</p>

          <label className="bf-label">Business type</label>
          <div className="bf-types">
            {BUSINESS_TYPES.map(t => (
              <button key={t.id} type="button"
                className={'bf-type' + (v.businessType === t.id ? ' bf-type-on' : '')}
                onClick={() => set('businessType', t.id)}>
                <span className="bf-type-label">{t.label}</span>
                <span className="bf-type-sub">{t.sub}</span>
              </button>
            ))}
          </div>

          <label className="bf-label">Business or trading name</label>
          <input
            className={errors.businessName ? 'au-input-bad' : ''}
            value={v.businessName || ''}
            onChange={e => set('businessName', e.target.value)}
            placeholder="e.g. Green Field Sports"
          />
          {errors.businessName && <p className="au-field-err">{errors.businessName}</p>}

          <label className="bf-label">
            PAN <span className="bf-req">required by Razorpay</span>
          </label>
          <input
            className={'bf-upper' + (errors.pan ? ' au-input-bad' : panOk ? ' au-input-good' : '')}
            value={v.pan || ''}
            onChange={e => set('pan', e.target.value.toUpperCase().slice(0, 10))}
            placeholder="ABCDE1234F"
            maxLength={10}
          />
          {errors.pan && <p className="au-field-err">{errors.pan}</p>}
          {!errors.pan && !panOk && (
            <p className="bf-hint">
              {v.businessType === 'individual'
                ? 'Your personal PAN'
                : 'The PAN registered to your business'}
            </p>
          )}

          <label className="bf-label">
            GST number <span className="bf-optional">optional</span>
          </label>
          <input
            className={'bf-upper' + (errors.gst ? ' au-input-bad' : '')}
            value={v.gst || ''}
            onChange={e => set('gst', e.target.value.toUpperCase().slice(0, 15))}
            placeholder="29ABCDE1234F1Z5"
            maxLength={15}
          />
          {errors.gst && <p className="au-field-err">{errors.gst}</p>}

          {/* ── Address ── */}
          <p className="bf-group">Registered address</p>

          <label className="bf-label">Street address</label>
          <input
            className={errors.street ? 'au-input-bad' : ''}
            value={v.street || ''}
            onChange={e => set('street', e.target.value)}
            placeholder="Building, street, area"
          />
          {errors.street && <p className="au-field-err">{errors.street}</p>}

          <div className="two-col">
            <div>
              <label className="bf-label">City</label>
              <input
                className={errors.city ? 'au-input-bad' : ''}
                value={v.city || ''}
                onChange={e => set('city', e.target.value)}
              />
              {errors.city && <p className="au-field-err">{errors.city}</p>}
            </div>
            <div>
              <label className="bf-label">PIN code</label>
              <input
                className={errors.postalCode ? 'au-input-bad' : ''}
                inputMode="numeric"
                value={v.postalCode || ''}
                onChange={e => set('postalCode', e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="560001"
                maxLength={6}
              />
              {errors.postalCode && <p className="au-field-err">{errors.postalCode}</p>}
            </div>
          </div>

          <label className="bf-label">State</label>
          <select
            className={errors.state ? 'au-input-bad' : ''}
            value={v.state || ''}
            onChange={e => set('state', e.target.value)}
          >
            <option value="">Select your state</option>
            {STATES.map(s => <option key={s}>{s}</option>)}
          </select>
          {errors.state && <p className="au-field-err">{errors.state}</p>}
        </>
      )}

      {/* ── Bank ── */}
      {mode === 'full' && <p className="bf-group">Settlement account</p>}

      <label className="bf-label">Account holder name</label>
      <input
        className={errors.accountName ? 'au-input-bad' : ''}
        value={v.accountName || ''}
        onChange={e => set('accountName', e.target.value)}
        placeholder="Exactly as it appears on your passbook"
      />
      {errors.accountName && <p className="au-field-err">{errors.accountName}</p>}
      {mode === 'full' && !errors.accountName && (
        <p className="bf-hint">
          This must match your PAN name — mismatches are the top cause of payout failures
        </p>
      )}

      <label className="bf-label">Account number</label>
      <input
        className={errors.accountNumber ? 'au-input-bad' : ''}
        inputMode="numeric"
        value={v.accountNumber || ''}
        onChange={e => set('accountNumber', e.target.value.replace(/\D/g, '').slice(0, 18))}
        placeholder="9 to 18 digits"
      />
      {errors.accountNumber && <p className="au-field-err">{errors.accountNumber}</p>}

      {showConfirm && (
        <>
          <label className="bf-label">Confirm account number</label>
          <input
            className={errors.confirmNumber ? 'au-input-bad'
              : (v.confirmNumber && v.confirmNumber === v.accountNumber) ? 'au-input-good' : ''}
            inputMode="numeric"
            value={v.confirmNumber || ''}
            onChange={e => set('confirmNumber', e.target.value.replace(/\D/g, '').slice(0, 18))}
            placeholder="Type it again"
          />
          {errors.confirmNumber && <p className="au-field-err">{errors.confirmNumber}</p>}
          {!errors.confirmNumber && v.confirmNumber && v.confirmNumber === v.accountNumber && (
            <p className="au-field-ok">✓ Numbers match</p>
          )}
        </>
      )}

      <label className="bf-label">IFSC code</label>
      <div className="bf-ifsc-wrap">
        <input
          className={'bf-upper bf-ifsc'
            + (errors.ifsc ? ' au-input-bad' : ifscOk ? ' au-input-good' : '')}
          value={v.ifsc || ''}
          onChange={e => set('ifsc', e.target.value.toUpperCase().slice(0, 11))}
          placeholder="SBIN0001234"
          maxLength={11}
        />
        <span className={'bf-ifsc-count' + (ifscOk ? ' bf-count-ok' : '')}>
          {(v.ifsc || '').length}/11
        </span>
      </div>
      {errors.ifsc && <p className="au-field-err">{errors.ifsc}</p>}
      {!errors.ifsc && !ifscOk && (
        <p className="bf-hint">Printed on your cheque book, or in your bank app</p>
      )}

      <label className="bf-label">Bank name</label>
      <select
        className={errors.bankName ? 'au-input-bad' : ''}
        value={v.bankName || ''}
        onChange={e => set('bankName', e.target.value)}
      >
        <option value="">Select your bank</option>
        {BANKS.map(b => <option key={b}>{b}</option>)}
      </select>
      {errors.bankName && <p className="au-field-err">{errors.bankName}</p>}
    </div>
  )
}