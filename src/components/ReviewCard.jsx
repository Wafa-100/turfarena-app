import { useState } from 'react'
import { Stars } from './StarRating'
import Avatar from './Avatar'
import Icon from './Icon'
import { markHelpful, replyToReview } from '../utils/api'

function timeAgo(date) {
  const days = Math.floor((Date.now() - new Date(date)) / 864e5)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 30) return `${days} days ago`
  if (days < 365) return `${Math.floor(days / 30)} month${days >= 60 ? 's' : ''} ago`
  return `${Math.floor(days / 365)} year${days >= 730 ? 's' : ''} ago`
}

export default function ReviewCard({ review, user, isOwner, onChange }) {
  const [helpful, setHelpful] = useState(review.helpful || 0)
  const [marked, setMarked] = useState(
    (review.helpfulBy || []).some(u => String(u) === String(user?.id))
  )
  const [replying, setReplying] = useState(false)
  const [replyText, setReplyText] = useState(review.ownerReply || '')
  const [busy, setBusy] = useState(false)

  const mine = String(review.user?._id || review.user) === String(user?.id)

  async function toggleHelpful() {
    if (mine) return
    try {
      const r = await markHelpful(review._id, user.id)
      setHelpful(r.helpful)
      setMarked(r.marked)
    } catch {}
  }

  async function saveReply() {
    setBusy(true)
    try {
      await replyToReview(review._id, { userId: user.id, reply: replyText })
      setReplying(false)
      onChange?.()
    } catch {} finally { setBusy(false) }
  }

  return (
    <div className="rv-card">
      <div className="rv-head">
        <Avatar id={review.user?.avatar} name={review.user?.name || 'U'} size={38} />
        <div className="rv-who">
          <p className="rv-name">
            {review.user?.name || 'Player'}
            {mine && <span className="rv-you">You</span>}
          </p>
          <p className="rv-when">{timeAgo(review.createdAt)}</p>
        </div>
        <Stars value={review.rating} size={14} className="rv-stars" />
      </div>

      {review.title && <p className="rv-title">{review.title}</p>}
      {review.comment && <p className="rv-comment">{review.comment}</p>}

      {review.tags?.length > 0 && (
        <div className="rv-tags">
          {review.tags.map(t => <span key={t} className="rv-tag">{t}</span>)}
        </div>
      )}

      {review.ownerReply && !replying && (
        <div className="rv-reply">
          <div className="rv-reply-head">
            <Icon name="building" size={13} />
            <span>Response from the ground</span>
          </div>
          <p className="rv-reply-text">{review.ownerReply}</p>
        </div>
      )}

      <div className="rv-foot">
        {!mine && user && (
          <button className={'rv-helpful' + (marked ? ' rv-helpful-on' : '')}
            onClick={toggleHelpful}>
            <Icon name="check" size={13} />
            Helpful{helpful > 0 && ` · ${helpful}`}
          </button>
        )}
        {isOwner && !replying && (
          <button className="rv-reply-btn" onClick={() => setReplying(true)}>
            <Icon name="chat" size={13} />
            {review.ownerReply ? 'Edit reply' : 'Reply'}
          </button>
        )}
      </div>

      {replying && (
        <div className="rv-reply-form">
          <textarea rows={3} value={replyText}
            onChange={e => setReplyText(e.target.value)}
            placeholder="Thanks for the feedback…" />
          <div className="rv-reply-actions">
            <button className="mg-cancel" onClick={() => setReplying(false)}>Cancel</button>
            <button className="mg-confirm" disabled={busy} onClick={saveReply}>
              {busy ? 'Posting…' : 'Post reply'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}