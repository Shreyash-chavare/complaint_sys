import { useState } from 'react';
import api from '../api/axios';

export default function FeedbackForm({ complaintId, onSubmitted }) {
  const [rating, setRating]   = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [done, setDone]       = useState(false);

  const submit = async () => {
    if (!rating) return setError('Please select a rating.');
    setError(''); setLoading(true);
    try {
      await api.post(`/feedback/${complaintId}`, { rating, comment });
      setDone(true);
      onSubmitted?.();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit feedback.');
    } finally { setLoading(false); }
  };

  if (done) {
    return (
      <div className="glass" style={{ padding: 20, textAlign: 'center' }}>
        <div style={{ fontSize: '2rem', marginBottom: 8 }}>🎉</div>
        <div style={{ fontWeight: 700, marginBottom: 4 }}>Thank you for your feedback!</div>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Your rating helps us improve.</div>
      </div>
    );
  }

  const labels = ['', 'Very Poor', 'Poor', 'Okay', 'Good', 'Excellent'];

  return (
    <div className="glass" style={{ padding: 20, marginTop: 12 }}>
      <div style={{ fontWeight: 700, marginBottom: 14, fontSize: '0.95rem' }}>⭐ Rate Resolution</div>

      {error && <div className="alert alert-error" style={{ marginBottom: 12 }}>{error}</div>}

      {/* Star selector */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
        {[1,2,3,4,5].map(n => (
          <button key={n} type="button"
            onMouseEnter={() => setHovered(n)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => setRating(n)}
            style={{
              fontSize: '1.6rem', background: 'none', border: 'none', cursor: 'pointer',
              transform: (hovered || rating) >= n ? 'scale(1.2)' : 'scale(1)',
              transition: 'transform 0.15s',
              filter: (hovered || rating) >= n ? 'none' : 'grayscale(1) opacity(0.4)',
            }}>
            ⭐
          </button>
        ))}
      </div>
      {(hovered || rating) > 0 && (
        <div style={{ fontSize: '0.82rem', color: 'var(--accent)', fontWeight: 600, marginBottom: 12 }}>
          {labels[hovered || rating]}
        </div>
      )}

      <textarea
        className="form-input"
        rows={3}
        placeholder="Optional: describe your experience…"
        value={comment}
        onChange={e => setComment(e.target.value)}
        style={{ resize: 'vertical', minHeight: 72, marginBottom: 12 }}
      />

      <button className="btn btn-primary btn-sm" onClick={submit} disabled={loading || !rating}
        style={{ width: '100%', justifyContent: 'center' }}>
        {loading ? '⏳ Submitting…' : '📨 Submit Feedback'}
      </button>
    </div>
  );
}
