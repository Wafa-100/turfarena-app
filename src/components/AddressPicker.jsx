import { useState, useEffect, useRef } from 'react'
import {
  geocodeAddress, reverseGeocode, parseMapsUrl, expandMapsUrl, buildMapUrl
} from '../utils/geocode'
import Icon from './Icon'

const TABS = [
  { id: 'link',   label: 'Paste link', icon: 'pin',    best: true },
  { id: 'search', label: 'Search',     icon: 'search' },
  { id: 'here',   label: 'I am here',  icon: 'bolt' }
]

export default function AddressPicker({ value, onChange }) {
  const [tab, setTab] = useState('link')
  const [link, setLink] = useState('')
  const [query, setQuery] = useState(value?.address || '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [pos, setPos] = useState(
    value?.lat ? { lat: value.lat, lng: value.lng } : null
  )
  const [label, setLabel] = useState(value?.formattedAddress || '')

  /* Whenever the pin moves, look up what's there and tell the parent */
  async function setLocation(lat, lng, knownLabel) {
    setPos({ lat, lng })
    setError('')

    let addr = knownLabel || ''
    let city = ''
    if (!knownLabel) {
      try {
        const r = await reverseGeocode(lat, lng)
        addr = r.formatted
        city = r.city
        setLabel(r.formatted)
      } catch { setLabel(`${lat.toFixed(5)}, ${lng.toFixed(5)}`) }
    } else {
      setLabel(knownLabel)
    }

    onChange({
      address: query || addr,
      lat, lng,
      city,
      formattedAddress: addr,
      mapPrecision: 'CONFIRMED'
    })
  }

  /* ── Paste a Google Maps link ── */
  async function useLink() {
    if (!link.trim()) { setError('Paste a Google Maps link first'); return }
    setBusy(true); setError('')

    // Full links contain the coordinates already
    const direct = parseMapsUrl(link)
    if (direct) {
      await setLocation(direct.lat, direct.lng)
      setBusy(false)
      return
    }

    // Short links need the server to follow the redirect
    try {
      const r = await expandMapsUrl(link)
      await setLocation(r.lat, r.lng)
    } catch (e) {
      setError(e.message)
    } finally { setBusy(false) }
  }

  /* ── Search an address ── */
  async function search() {
    if (query.trim().length < 5) {
      setError('Type a fuller address — street and area at least'); return
    }
    setBusy(true); setError('')
    try {
      const r = await geocodeAddress(query)
      await setLocation(r.lat, r.lng, r.formatted)
      if (!r.exact)
        setError('Approximate — drag the pin, or paste a Google Maps link for exact')
    } catch (e) { setError(e.message) }
    finally { setBusy(false) }
  }

  /* ── Use my current location ── */
  function useHere() {
    if (!navigator.geolocation) { setError('Your browser cannot share location'); return }
    setBusy(true); setError('')
    navigator.geolocation.getCurrentPosition(
      async p => { await setLocation(p.coords.latitude, p.coords.longitude); setBusy(false) },
      () => { setError('Could not get your location — check browser permissions'); setBusy(false) },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  /* ── Nudge the pin ── */
  function nudge(dLat, dLng) {
    if (!pos) return
    setLocation(
      +(pos.lat + dLat).toFixed(6),
      +(pos.lng + dLng).toFixed(6)
    )
  }

  return (
    <div className="ap">
      <div className="ap-tabs">
        {TABS.map(t => (
          <button key={t.id} type="button"
            className={'ap-tab' + (tab === t.id ? ' ap-tab-on' : '')}
            onClick={() => { setTab(t.id); setError('') }}>
            <Icon name={t.icon} size={15} />
            {t.label}
            {t.best && <span className="ap-best">Best</span>}
          </button>
        ))}
      </div>

      {/* ── Paste link ── */}
      {tab === 'link' && (
        <>
          <div className="ap-how">
            <p className="ap-how-title">Most accurate — takes 20 seconds</p>
            <ol className="ap-how-steps">
              <li>Open <b>Google Maps</b> and find your ground</li>
              <li>Long-press the exact spot to drop a pin</li>
              <li>Tap <b>Share</b> → <b>Copy link</b></li>
              <li>Paste it below</li>
            </ol>
          </div>

          <div className="ap-search">
            <Icon name="pin" size={17} className="ap-icon" />
            <input
              value={link}
              onChange={e => setLink(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), useLink())}
              placeholder="https://maps.app.goo.gl/…"
            />
          </div>
          <button type="button" className="ap-find" disabled={busy} onClick={useLink}
            style={{ width: '100%', marginTop: 10 }}>
            {busy ? 'Reading link…' : <><Icon name="check" size={15} /> Use this location</>}
          </button>
        </>
      )}

      {/* ── Search ── */}
      {tab === 'search' && (
        <>
          <div className="ap-search">
            <Icon name="search" size={17} className="ap-icon" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), search())}
              placeholder="e.g. MG Road, Kasaragod, Kerala"
            />
          </div>
          <button type="button" className="ap-find" disabled={busy} onClick={search}
            style={{ width: '100%', marginTop: 10 }}>
            {busy ? 'Searching…' : <><Icon name="search" size={15} /> Find on map</>}
          </button>
          <p className="ap-note">
            Free search is approximate — drag the pin afterwards, or use a Google Maps link.
          </p>
        </>
      )}

      {/* ── Here ── */}
      {tab === 'here' && (
        <>
          <div className="ap-how">
            <p className="ap-how-title">Standing at the ground?</p>
            <p className="ap-how-sub">
              This uses your phone's GPS, which is accurate to a few metres.
            </p>
          </div>
          <button type="button" className="ap-find" disabled={busy} onClick={useHere}
            style={{ width: '100%' }}>
            {busy ? 'Locating…' : <><Icon name="bolt" size={15} /> Use my current location</>}
          </button>
        </>
      )}

      {error && <p className="au-field-err">{error}</p>}

      {/* ── Result ── */}
      {pos && (
        <div className="ap-result">
          <iframe
            key={`${pos.lat},${pos.lng}`}
            title="Ground location"
            className="ap-map"
            loading="lazy"
            src={buildMapUrl(pos.lat, pos.lng)}
          />

          <div className="ap-nudge">
            <p className="ap-nudge-label">Pin slightly off? Nudge it</p>
            <div className="ap-pad">
              <button type="button" onClick={() => nudge(0.0002, 0)} className="ap-pad-up">↑</button>
              <button type="button" onClick={() => nudge(0, -0.0002)} className="ap-pad-left">←</button>
              <span className="ap-pad-mid"><Icon name="pin" size={14} /></span>
              <button type="button" onClick={() => nudge(0, 0.0002)} className="ap-pad-right">→</button>
              <button type="button" onClick={() => nudge(-0.0002, 0)} className="ap-pad-down">↓</button>
            </div>
            <p className="ap-coords">{pos.lat.toFixed(6)}, {pos.lng.toFixed(6)}</p>
          </div>

          <div className="ap-found">
            <Icon name="check" size={15} />
            <div>
              <p className="ap-found-address">{label || 'Location set'}</p>
              <p className="ap-precision ap-precision-ok">
                Tap the map to check it looks right
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}