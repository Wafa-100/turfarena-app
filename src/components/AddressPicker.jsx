import { useState } from 'react'
import { geocodeAddress, reverseGeocode, buildMapUrl } from '../utils/geocode'
import Icon from '../components/Icon'

/*
  Type an address → Google finds it → a map confirms it's right.
  The precision badge matters: ROOFTOP means Google found the exact
  building, APPROXIMATE means it guessed the neighbourhood — and an
  owner needs to know which they've got before publishing.
*/
export default function AddressPicker({ value, onChange }) {
  const [query, setQuery] = useState(value?.address || '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(
    value?.lat ? { lat: value.lat, lng: value.lng, formatted: value.formattedAddress } : null
  )

  async function find() {
    if (query.trim().length < 5) {
      setError('Type a fuller address — street and area at least')
      return
    }
    setBusy(true); setError('')
    try {
      const r = await geocodeAddress(query)
      setResult(r)
      onChange({
        address: query,
        lat: r.lat,
        lng: r.lng,
        city: r.city,
        placeId: r.placeId,
        formattedAddress: r.formatted,
        mapPrecision: r.precision
      })
    } catch (e) {
      setError(e.message)
      setResult(null)
    } finally { setBusy(false) }
  }

  function useMyLocation() {
    if (!navigator.geolocation) {
      setError('Your browser cannot share location')
      return
    }
    setBusy(true); setError('')
    navigator.geolocation.getCurrentPosition(
      async pos => {
        try {
          const { latitude, longitude } = pos.coords
          const r = await reverseGeocode(latitude, longitude)
          setQuery(r.formatted)
          setResult({ lat: latitude, lng: longitude, formatted: r.formatted })
          onChange({
            address: r.formatted,
            lat: latitude,
            lng: longitude,
            city: r.city,
            formattedAddress: r.formatted,
            mapPrecision: 'ROOFTOP'
          })
        } catch (e) { setError(e.message) }
        finally { setBusy(false) }
      },
      () => { setError('Could not get your location — check browser permissions'); setBusy(false) },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  const exact = result?.precision === 'ROOFTOP'

  return (
    <div className="ap">
      <label className="at-label">Where is your ground?</label>
      <div className="ap-search">
        <Icon name="pin" size={17} className="ap-icon" />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), find())}
          placeholder="e.g. MG Road, Kasaragod, Kerala"
        />
      </div>

      <div className="ap-actions">
        <button type="button" className="ap-find" disabled={busy} onClick={find}>
          {busy ? 'Searching…' : <><Icon name="search" size={15} /> Find on map</>}
        </button>
        <button type="button" className="ap-here" disabled={busy} onClick={useMyLocation}>
          <Icon name="pin" size={15} /> Use my location
        </button>
      </div>

      {error && <p className="au-field-err">{error}</p>}

      {result && (
        <div className="ap-result">
          <iframe
            title="Ground location"
            className="ap-map"
            loading="lazy"
            src={buildMapUrl(result.lat, result.lng, result.placeId)}
          />
          <div className="ap-found">
            <Icon name="check" size={15} />
            <div>
              <p className="ap-found-address">{result.formatted}</p>
              <p className={'ap-precision' + (exact ? ' ap-precision-ok' : '')}>
                {exact
                  ? 'Exact location found'
                  : 'Approximate — drag to refine, or add a landmark and search again'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}