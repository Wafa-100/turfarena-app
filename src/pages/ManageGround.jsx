import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  fetchTurf, setTurfStatus, setTurfPricing, setTurfPaymentMode,
  fetchBlocks, createBlocks, removeBlock, fetchBookedSlots
} from '../utils/api'
import { generateSlots, getNext7Days, prettyDate, isPastSlot } from '../utils/slots'
import { priceForSlot, BAND_PRESETS } from '../utils/pricing'
import BankFields, { validateBank } from '../components/BankFields'
import TimeSelect from '../components/TimeSelect'
import Icon from '../components/Icon'

const REASONS = ['Offline booking', 'Phone booking', 'Maintenance', 'Private event', 'Other']

export default function ManageGround({ user }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const days = getNext7Days()

  const [turf, setTurf] = useState(null)
  const [tab, setTab] = useState('slots')
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')
  const [busy, setBusy] = useState(false)

  // slots
  const [date, setDate] = useState(days[0].iso)
  const [blocks, setBlocks] = useState([])
  const [booked, setBooked] = useState([])
  const [picked, setPicked] = useState([])
  const [reason, setReason] = useState(REASONS[0])
  const [note, setNote] = useState('')

  // status
  const [closedNote, setClosedNote] = useState('')

  // pricing
  const [mode, setMode] = useState('flat')
  const [flatPrice, setFlatPrice] = useState('')
  const [bands, setBands] = useState([])

  // payout
  const [payMode, setPayMode] = useState('venue')
  const [payout, setPayout] = useState({ businessType: 'individual' })
  const [payoutErrs, setPayoutErrs] = useState({})

  useEffect(() => {
    fetchTurf(id).then(t => {
      if (!t.owner || String(t.owner) !== String(user.id)) { navigate('/'); return }
      setTurf(t)
      setClosedNote(t.closedNote || '')
      setMode(t.pricingMode || 'flat')
      setFlatPrice(String(t.price || ''))
      setBands(t.priceBands?.length
        ? t.priceBands
        : BAND_PRESETS.map(b => ({ ...b, price: t.price })))
      setPayMode(t.paymentMode || 'venue')
      if (t.payout) setPayout({ businessType: 'individual', ...t.payout })
    }).catch(e => setError(e.message))
  }, [id])

  function loadDay() {
    fetchBlocks(id, date).then(setBlocks).catch(() => setBlocks([]))
    fetchBookedSlots(id, date)
      .then(r => setBooked(Array.isArray(r) ? r : r.booked || []))
      .catch(() => setBooked([]))
  }
  useEffect(() => { if (turf) { loadDay(); setPicked([]) } }, [turf, date])

  if (error && !turf) return <div className="page"><p className="error">{error}</p></div>
  if (!turf) return <div className="page"><p className="muted">Loading…</p></div>

  const slots = generateSlots(turf.openTime, turf.closeTime)
  const blockedMap = Object.fromEntries(blocks.map(b => [b.slot, b]))
  const freeSlots = slots.filter(s =>
    !booked.includes(s) && !blockedMap[s] && !isPastSlot(date, s)
  )

  function flash(msg) { setOk(msg); setTimeout(() => setOk(''), 2600) }

  /* ── slots ── */
  function toggle(slot) {
    if (booked.includes(slot)) return
    setPicked(p => p.includes(slot) ? p.filter(s => s !== slot) : [...p, slot])
  }

  async function blockPicked() {
    setBusy(true); setError('')
    try {
      await createBlocks({ turfId: id, userId: user.id, date, slots: picked, reason, note })
      setPicked([]); setNote(''); loadDay()
      flash(`${picked.length} slot${picked.length > 1 ? 's' : ''} blocked`)
    } catch (e) { setError(e.message) }
    finally { setBusy(false) }
  }

  async function unblock(blockId) {
    try { await removeBlock(blockId, user.id); loadDay(); flash('Slot released') }
    catch (e) { setError(e.message) }
  }

  async function blockWholeDay() {
    if (!freeSlots.length) { setError('No bookable hours left on this day'); return }
    setBusy(true); setError('')
    try {
      await createBlocks({
        turfId: id, userId: user.id, date,
        slots: freeSlots, reason: 'Maintenance', note
      })
      loadDay()
      flash(`${freeSlots.length} hour${freeSlots.length > 1 ? 's' : ''} blocked`)
    } catch (e) { setError(e.message) }
    finally { setBusy(false) }
  }

  /* ── status ── */
  async function toggleOpen(open) {
    setBusy(true); setError('')
    try {
      const r = await setTurfStatus(id, { userId: user.id, isOpen: open, closedNote })
      setTurf(t => ({ ...t, isOpen: r.isOpen, closedNote: r.closedNote }))
      flash(open ? 'Ground is now open' : 'Ground closed — no new bookings')
    } catch (e) { setError(e.message) }
    finally { setBusy(false) }
  }

  /* ── pricing ── */
  function updBand(i, key, val) {
    setBands(b => b.map((x, n) => n === i ? { ...x, [key]: val } : x))
  }
  function addBand() {
    setBands(b => [...b, { label: '', from: '06:00', to: '12:00', price: turf.price }])
  }
  function removeBand(i) { setBands(b => b.filter((_, n) => n !== i)) }

  async function savePricing() {
    setBusy(true); setError('')
    try {
      const updated = await setTurfPricing(id, {
        userId: user.id, pricingMode: mode,
        price: flatPrice, priceBands: bands
      })
      setTurf(updated)
      flash('Pricing updated')
    } catch (e) { setError(e.message) }
    finally { setBusy(false) }
  }

  /* ── payout ── */
  async function savePayout() {
    setBusy(true); setError('')
    try {
      if (payMode === 'online') {
        const e = validateBank({ ...payout, confirmNumber: payout.accountNumber }, 'full')
        setPayoutErrs(e)
        if (Object.keys(e).length) {
          setError('Please fix the highlighted fields')
          setBusy(false)
          return
        }
      }
      const updated = await setTurfPaymentMode(id, {
        userId: user.id,
        paymentMode: payMode,
        payout: payMode === 'online' ? payout : undefined
      })
      setTurf(updated)
      setPayoutErrs({})
      flash(payMode === 'online' ? 'Online payments enabled' : 'Switched to pay at ground')
    } catch (e) { setError(e.message) }
    finally { setBusy(false) }
  }

  const TABS = [
    { id: 'slots',   label: 'Slots',   icon: 'calendar' },
    { id: 'status',  label: 'Status',  icon: 'bolt' },
    { id: 'pricing', label: 'Pricing', icon: 'rupee' },
    { id: 'payout',  label: 'Payout',  icon: 'card' }
  ]

  return (
    <div className="page mg-page">

      <header className="mg-head">
        <button className="mg-back" onClick={() => navigate('/profile')}>
          <Icon name="chevron" size={18} className="mg-back-icon" />
        </button>
        <div>
          <p className="mg-eyebrow">Manage ground</p>
          <h1 className="mg-title">{turf.name}</h1>
        </div>
        <span className={'mg-status-pill' + (turf.isOpen === false ? ' mg-closed' : '')}>
          <span className="mg-status-dot" />
          {turf.isOpen === false ? 'Closed' : 'Open'}
        </span>
      </header>

      <div className="mg-tabs">
        {TABS.map(t => (
          <button key={t.id}
            className={'mg-tab' + (tab === t.id ? ' mg-tab-on' : '')}
            onClick={() => { setTab(t.id); setError('') }}>
            <Icon name={t.icon} size={16} />
            {t.label}
          </button>
        ))}
      </div>

      {ok && <p className="mg-ok"><Icon name="check" size={14} /> {ok}</p>}
      {error && <p className="error">{error}</p>}

      {/* ══ SLOTS ══ */}
      {tab === 'slots' && (
        <>
          <p className="mg-hint">
            Block hours that were booked in person, by phone, or when the ground
            is unavailable. Blocked hours disappear from the app immediately.
          </p>

          <div className="bk-date-row" style={{ marginBottom: 18 }}>
            {days.map(d => {
              const on = date === d.iso
              const [wd, dd] = d.label.split(', ')
              return (
                <button key={d.iso} className={'bk-date' + (on ? ' bk-date-on' : '')}
                  onClick={() => setDate(d.iso)}>
                  <span className="bk-date-wd">{d.isToday ? 'TODAY' : wd.toUpperCase()}</span>
                  <span className="bk-date-dd">{dd ? dd.split(' ')[0] : ''}</span>
                  <span className="bk-date-mo">{dd ? dd.split(' ')[1] : ''}</span>
                </button>
              )
            })}
          </div>

          <div className="mg-legend">
            <span><i className="mg-key mg-key-free" /> Free</span>
            <span><i className="mg-key mg-key-sel" /> Selected</span>
            <span><i className="mg-key mg-key-block" /> Blocked</span>
            <span><i className="mg-key mg-key-paid" /> Player booked</span>
          </div>

          <div className="mg-slots">
            {slots.map(s => {
              const isPaid = booked.includes(s)
              const block = blockedMap[s]
              const past = isPastSlot(date, s)
              const on = picked.includes(s)

              return (
                <button key={s}
                  className={'mg-slot'
                    + (isPaid ? ' mg-slot-paid' : '')
                    + (block ? ' mg-slot-block' : '')
                    + (on ? ' mg-slot-on' : '')
                    + (past && !isPaid && !block ? ' mg-slot-past' : '')}
                  onClick={() => block ? unblock(block._id) : toggle(s)}
                  disabled={isPaid}>
                  <span className="mg-slot-time">{s}</span>
                  <span className="mg-slot-price">₹{priceForSlot(turf, s)}</span>
                  {isPaid && <span className="mg-slot-tag">Booked</span>}
                  {block && <span className="mg-slot-tag">{block.reason}</span>}
                  {!isPaid && !block && past && <span className="mg-slot-tag">Time passed</span>}
                  {block && <span className="mg-slot-x"><Icon name="close" size={11} /></span>}
                </button>
              )
            })}
          </div>

          <button className="mg-day-btn" onClick={blockWholeDay}
            disabled={busy || freeSlots.length === 0}>
            {freeSlots.length === 0
              ? 'No bookable hours left today'
              : `Block all ${freeSlots.length} remaining hour${freeSlots.length > 1 ? 's' : ''}`}
          </button>

          {picked.length > 0 && (
            <div className="mg-drawer">
              <div className="mg-drawer-inner">
                <p className="mg-drawer-count">
                  {picked.length} hour{picked.length > 1 ? 's' : ''} selected
                </p>
                <p className="mg-drawer-slots">{[...picked].sort().join(' · ')}</p>

                <label className="mg-label">Why?</label>
                <select value={reason} onChange={e => setReason(e.target.value)}>
                  {REASONS.map(r => <option key={r}>{r}</option>)}
                </select>

                <label className="mg-label">Note (optional)</label>
                <input value={note} onChange={e => setNote(e.target.value)}
                  placeholder="e.g. Rahul, paid cash, 98765 43210" />

                <div className="mg-drawer-actions">
                  <button className="mg-cancel" onClick={() => setPicked([])}>Clear</button>
                  <button className="mg-confirm" onClick={blockPicked} disabled={busy}>
                    {busy ? 'Blocking…' : 'Block these hours'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ══ STATUS ══ */}
      {tab === 'status' && (
        <>
          <div className={'mg-status-card' + (turf.isOpen === false ? ' mg-status-card-closed' : '')}>
            <div className="mg-status-icon">
              <Icon name={turf.isOpen === false ? 'lock' : 'check'} size={26} />
            </div>
            <h2 className="mg-status-title">
              {turf.isOpen === false ? 'Ground is closed' : 'Ground is open'}
            </h2>
            <p className="mg-status-sub">
              {turf.isOpen === false
                ? 'Players can see your ground but cannot book any hours.'
                : 'Players can browse and book available hours.'}
            </p>
            {turf.isOpen === false && turf.closedNote && (
              <p className="mg-status-note">"{turf.closedNote}"</p>
            )}
          </div>

          {turf.isOpen !== false ? (
            <>
              <label className="mg-label">Message for players (optional)</label>
              <input value={closedNote} onChange={e => setClosedNote(e.target.value)}
                placeholder="e.g. Closed for resurfacing until Monday" />
              <p className="mg-hint" style={{ marginTop: 0 }}>
                Existing bookings are not cancelled — closing only stops new ones.
              </p>
              <button className="mg-close-btn" disabled={busy} onClick={() => toggleOpen(false)}>
                Close this ground
              </button>
            </>
          ) : (
            <button className="btn-primary" disabled={busy} onClick={() => toggleOpen(true)}>
              Reopen ground
            </button>
          )}
        </>
      )}

      {/* ══ PRICING ══ */}
      {tab === 'pricing' && (
        <>
          <div className="mg-mode">
            <button className={'mg-mode-btn' + (mode === 'flat' ? ' mg-mode-on' : '')}
              onClick={() => setMode('flat')}>
              <p className="mg-mode-title">One rate</p>
              <p className="mg-mode-sub">Same price all day</p>
            </button>
            <button className={'mg-mode-btn' + (mode === 'bands' ? ' mg-mode-on' : '')}
              onClick={() => setMode('bands')}>
              <p className="mg-mode-title">By time</p>
              <p className="mg-mode-sub">Charge more at peak hours</p>
            </button>
          </div>

          {mode === 'flat' ? (
            <>
              <label className="mg-label">Price per hour (₹)</label>
              <input type="number" value={flatPrice}
                onChange={e => setFlatPrice(e.target.value)} />
            </>
          ) : (
            <>
              <p className="mg-hint">
                Evening hours usually sell for more. Any hour outside your bands
                falls back to ₹{turf.price}.
              </p>

              {bands.map((b, i) => (
                <div className="mg-band" key={i}>
                  <div className="mg-band-head">
                    <input className="mg-band-label" value={b.label}
                      onChange={e => updBand(i, 'label', e.target.value)}
                      placeholder="Label, e.g. Evening" />
                    <button className="mg-band-del" onClick={() => removeBand(i)}>
                      <Icon name="trash" size={15} />
                    </button>
                  </div>
                  <div className="mg-band-row">
                    <div>
                      <label className="mg-mini-label">From</label>
                      <TimeSelect value={b.from} onChange={v => updBand(i, 'from', v)} />
                    </div>
                    <div>
                      <label className="mg-mini-label">To</label>
                      <TimeSelect value={b.to} onChange={v => updBand(i, 'to', v)} />
                    </div>
                    <div>
                      <label className="mg-mini-label">₹ / hour</label>
                      <input type="number" value={b.price}
                        onChange={e => updBand(i, 'price', e.target.value)} />
                    </div>
                  </div>
                </div>
              ))}

              <button className="mg-add-band" onClick={addBand}>
                <Icon name="plus" size={16} /> Add another band
              </button>

              <div className="mg-preview">
                <p className="mg-preview-label">How players will see it</p>
                <div className="mg-preview-grid">
                  {slots.map(s => (
                    <div key={s} className="mg-preview-cell">
                      <span>{s.split(' - ')[0]}</span>
                      <b>₹{priceForSlot(
                        { ...turf, pricingMode: 'bands', priceBands: bands }, s
                      )}</b>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          <button className="btn-primary" disabled={busy} onClick={savePricing}>
            {busy ? 'Saving…' : 'Save pricing'}
          </button>
        </>
      )}

      {/* ══ PAYOUT ══ */}
      {tab === 'payout' && (
        <>
          <p className="mg-hint">
            Choose how players pay for this ground. You can switch at any time —
            existing bookings keep their original terms.
          </p>

          {turf.paymentMode === 'online' && turf.payout?.accountNumber && (
            <div className="mg-payout-live">
              <Icon name="check" size={16} />
              <div>
                <p className="mg-payout-live-title">Payouts set up</p>
                <p className="mg-payout-live-sub">
                  {turf.payout.bankName || 'Bank'} · ••••{turf.payout.accountNumber.slice(-4)}
                </p>
              </div>
            </div>
          )}

          <button className={'pm-card' + (payMode === 'venue' ? ' pm-card-on' : '')}
            onClick={() => setPayMode('venue')}>
            <div className="pm-card-head">
              <span className="pm-icon"><Icon name="wallet" size={22} /></span>
              <div>
                <p className="pm-title">Pay at the ground</p>
                <p className="pm-sub">Players reserve free, then pay you in person</p>
              </div>
              <span className={'rf-radio' + (payMode === 'venue' ? ' rf-radio-on' : '')} />
            </div>
            <ul className="pm-points">
              <li><Icon name="check" size={12} /> No bank details needed</li>
              <li><Icon name="check" size={12} /> You keep 100% — no commission</li>
              <li className="pm-minus"><Icon name="alert" size={12} /> More no-shows</li>
            </ul>
          </button>

          <button className={'pm-card' + (payMode === 'online' ? ' pm-card-on' : '')}
            onClick={() => setPayMode('online')}>
            <div className="pm-card-head">
              <span className="pm-icon pm-icon-alt"><Icon name="card" size={22} /></span>
              <div>
                <p className="pm-title">Online payment</p>
                <p className="pm-sub">Players pay in the app, money reaches your bank</p>
              </div>
              <span className={'rf-radio' + (payMode === 'online' ? ' rf-radio-on' : '')} />
            </div>
            <ul className="pm-points">
              <li><Icon name="check" size={12} /> Paid before they arrive</li>
              <li><Icon name="check" size={12} /> Settled automatically</li>
              <li className="pm-minus"><Icon name="info" size={12} /> 10% platform commission</li>
            </ul>
          </button>

          {payMode === 'online' && (
            <div className="pm-bank">
              <p className="pm-bank-title">Payout details</p>
              <p className="pm-bank-sub">
                Razorpay needs these to send money to your account.
              </p>
              <BankFields
                value={payout}
                onChange={setPayout}
                errors={payoutErrs}
                mode="full"
              />
            </div>
          )}

          <button className="btn-primary" disabled={busy} onClick={savePayout}>
            {busy ? 'Saving…' : 'Save payment settings'}
          </button>
        </>
      )}
    </div>
  )
}