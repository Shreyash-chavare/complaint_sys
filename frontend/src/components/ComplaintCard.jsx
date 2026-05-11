import { useState } from 'react';
import StatusBadge from './StatusBadge';
import PriorityBadge from './PriorityBadge';
import FeedbackForm from './FeedbackForm';
import { useAuth } from '../context/AuthContext';

export default function ComplaintCard({ complaint, mode = 'feed', onUpvote, onWithdraw, onReopen }) {
  const { _id, title, description, category, priority, status, upvotes = [], student, createdAt, location } = complaint;
  const { user } = useAuth();
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackDone, setFeedbackDone] = useState(false);

  const timeAgo = (date) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  const loc = location && (location.building || location.floor || location.room)
    ? [location.building, location.floor, location.room].filter(Boolean).join(', ')
    : null;

  const canLeaveFeedback = mode === 'my' && status === 'resolved' && user?.role === 'Student' && !feedbackDone;

  return (
    <div className="glass slide-up" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12, transition: 'all 0.2s' }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
            <span className="chip">{category}</span>
            <StatusBadge status={status} />
            <PriorityBadge priority={priority} />
          </div>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, lineHeight: 1.3, wordBreak: 'break-word' }}>{title}</h3>
        </div>
      </div>

      {/* Description */}
      <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.6,
        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
        {description}
      </p>

      {complaint.teacherRemark && (
  <div style={{
    marginTop: 10,
    padding: 10,
    borderRadius: 8,
    background: 'rgba(99,102,241,0.12)',
    border: '1px solid rgba(99,102,241,0.25)',
    fontSize: '0.85rem',
    lineHeight: 1.5
  }}>
    🧑‍🏫 <b>Teacher Remark:</b>
    <div style={{ marginTop: 4 }}>
      {complaint.teacherRemark}
    </div>
  </div>
)}

      {/* Location */}
      {loc && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: 'var(--text-faint)' }}>
          📍 {loc}
        </div>
      )}

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {mode === 'feed' && student && (
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              👤 {student.name}
              {student.department && <span style={{ color: 'var(--text-faint)' }}> · {student.department}</span>}
            </span>
          )}
          <span style={{ fontSize: '0.78rem', color: 'var(--text-faint)' }}>🕐 {timeAgo(createdAt)}</span>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {/* Upvote (feed mode) */}
          {mode === 'feed' && (
            <button className="btn btn-sm btn-secondary" onClick={() => onUpvote?.(_id)}
              style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              👍 <span>{upvotes.length}</span>
            </button>
          )}

          {/* My complaints actions */}
          {mode === 'my' && (
            <>
              {status === 'resolved' && !feedbackDone && (
                <button className="btn btn-sm btn-secondary"
                  onClick={() => setShowFeedback(f => !f)}
                  style={{ borderColor: showFeedback ? 'var(--accent)' : undefined, color: showFeedback ? 'var(--accent)' : undefined }}>
                  ⭐ Feedback
                </button>
              )}
              {status === 'resolved' && (
                <button className="btn btn-sm btn-success" onClick={() => onReopen?.(_id)}>
                  🔄 Reopen
                </button>
              )}
              {!['resolved', 'closed', 'withdrawn'].includes(status) && (
                <button className="btn btn-sm btn-danger" onClick={() => onWithdraw?.(_id)}>
                  🗑️ {status === 'open' ? 'Delete' : 'Withdraw'}
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Inline feedback form */}
      {showFeedback && canLeaveFeedback && (
        <FeedbackForm
          complaintId={_id}
          onSubmitted={() => { setFeedbackDone(true); setShowFeedback(false); }}
        />
      )}
      {feedbackDone && mode === 'my' && (
        <div style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(16,185,129,0.1)', color: 'var(--success)', fontSize: '0.82rem', fontWeight: 600 }}>
          ✅ Feedback submitted — thank you!
        </div>
      )}
    </div>
  );
}
