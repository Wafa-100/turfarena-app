import { useRef, useState } from 'react'
import { uploadPhoto } from '../utils/upload'
import Icon from './Icon'

/*
  Tap a tile → phone gallery opens → photo uploads → thumbnail appears.
  The first photo is the cover shown on Home and in search results.
*/
export default function PhotoUpload({ photos, onChange, max = 5 }) {
  const inputRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')

  async function handleFiles(e) {
    const files = [...e.target.files].slice(0, max - photos.length)
    if (!files.length) return

    setUploading(true)
    setError('')
    const added = []

    for (let i = 0; i < files.length; i++) {
      try {
        setProgress(0)
        const r = await uploadPhoto(files[i], setProgress)
        added.push(r.url)
        onChange([...photos, ...added])
      } catch (err) {
        setError(err.message)
        break
      }
    }

    setUploading(false)
    setProgress(0)
    e.target.value = ''
  }

  function remove(i) {
    onChange(photos.filter((_, n) => n !== i))
  }

  function makeCover(i) {
    if (i === 0) return
    const next = [...photos]
    const [moved] = next.splice(i, 1)
    onChange([moved, ...next])
  }

  return (
    <div className="pu">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFiles}
        style={{ display: 'none' }}
      />

      <div className="pu-grid">
        {photos.map((url, i) => (
          <div key={url + i} className={'pu-tile' + (i === 0 ? ' pu-cover' : '')}>
            <img src={url} alt={`Photo ${i + 1}`} />
            {i === 0 && <span className="pu-cover-tag">Cover</span>}
            <button type="button" className="pu-remove" onClick={() => remove(i)}>
              <Icon name="close" size={13} />
            </button>
            {i !== 0 && (
              <button type="button" className="pu-star" onClick={() => makeCover(i)}
                title="Make this the cover photo">
                <Icon name="star" size={12} />
              </button>
            )}
          </div>
        ))}

        {photos.length < max && (
          <button type="button" className="pu-add" disabled={uploading}
            onClick={() => inputRef.current?.click()}>
            {uploading ? (
              <>
                <div className="pu-ring">
                  <svg viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="15" className="pu-ring-bg" />
                    <circle cx="18" cy="18" r="15" className="pu-ring-fg"
                      style={{ strokeDashoffset: 94 - (94 * progress) / 100 }} />
                  </svg>
                  <span>{progress}%</span>
                </div>
                <span className="pu-add-label">Uploading</span>
              </>
            ) : (
              <>
                <Icon name="camera" size={22} />
                <span className="pu-add-label">
                  {photos.length === 0 ? 'Add photos' : 'Add more'}
                </span>
              </>
            )}
          </button>
        )}
      </div>

      <p className="pu-hint">
        {photos.length}/{max} photos · the first is your cover
      </p>
      {error && <p className="au-field-err">{error}</p>}
    </div>
  )
}