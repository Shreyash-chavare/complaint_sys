import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { Link } from 'react-router-dom';

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount]     = useState(0);
  const [open, setOpen]                   = useState(false);
  const [loading, setLoading]             = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/notifications?limit=10');
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch {
      // silently fail — notifications are non-critical
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    // Poll every 30s
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const markAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch { /* ignore */ }
  };

  const markOneRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(prev =>
        prev.map(n => n._id === id ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch { /* ignore */ }
  };

  const typeIcon = (type) => {
    const icons = {
      complaint_created  : '📝',
      complaint_assigned : '👤',
      status_change      : '🔄',
      sla_warning        : '⚠️',
      sla_breach         : '🚨',
      complaint_resolved : '✅',
      complaint_reopened : '🔓',
      feedback_received  : '⭐',
    };
    return icons[type] || '🔔';
  };

  const timeAgo = (date) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1)  return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24)  return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div style={{ position: 'relative' }}>
      {/* Bell button */}
      <button
        id="notif-bell"
        onClick={() => { setOpen(o => !o); if (!open) fetchNotifications(); }}
        style={{
          position: 'relative', background: 'var(--surface)',
          border: '1px solid var(--border)', borderRadius: 8,
          padding: '6px 10px', cursor: 'pointer', color: 'var(--text)',
          display: 'flex', alignItems: 'center', fontSize: '1.1rem',
          transition: 'border-color 0.2s',
        }}
        onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
        onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
      >
        🔔
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: -4, right: -4,
            background: 'var(--danger)', color: '#fff',
            borderRadius: '50%', width: 18, height: 18,
            fontSize: '0.65rem', fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '2px solid var(--bg)',
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <>
          {/* Backdrop */}
          <div onClick={() => setOpen(false)} style={{
            position: 'fixed', inset: 0, zIndex: 99,
          }} />

          <div style={{
            position: 'absolute', right: 0, top: 'calc(100% + 8px)',
            width: 340, maxHeight: 440, overflowY: 'auto',
            background: '#111827', border: '1px solid var(--border)',
            borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            zIndex: 100,
          }}>
            {/* Header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px 16px', borderBottom: '1px solid var(--border)',
              position: 'sticky', top: 0, background: '#111827', zIndex: 1,
            }}>
              <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>🔔 Notifications</span>
              {unreadCount > 0 && (
                <button onClick={markAllRead} style={{
                  fontSize: '0.75rem', color: 'var(--accent)', background: 'none',
                  border: 'none', cursor: 'pointer', fontWeight: 600,
                }}>
                  Mark all read
                </button>
              )}
            </div>

            {/* List */}
            {loading && notifications.length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Loading…
              </div>
            ) : notifications.length === 0 ? (
              <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>
                <div style={{ fontSize: '2rem', marginBottom: 8 }}>🔕</div>
                <div style={{ fontSize: '0.85rem' }}>No notifications yet</div>
              </div>
            ) : (
              notifications.map(n => (
                <div
                  key={n._id}
                  onClick={() => !n.read && markOneRead(n._id)}
                  style={{
                    padding: '12px 16px', borderBottom: '1px solid var(--border)',
                    cursor: n.read ? 'default' : 'pointer',
                    background: n.read ? 'transparent' : 'rgba(99,102,241,0.05)',
                    transition: 'background 0.15s',
                    display: 'flex', gap: 10, alignItems: 'flex-start',
                  }}
                  onMouseEnter={e => !n.read && (e.currentTarget.style.background = 'rgba(99,102,241,0.1)')}
                  onMouseLeave={e => !n.read && (e.currentTarget.style.background = 'rgba(99,102,241,0.05)')}
                >
                  <div style={{ fontSize: '1.2rem', flexShrink: 0, marginTop: 2 }}>
                    {typeIcon(n.type)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: '0.82rem', lineHeight: 1.4,
                      color: n.read ? 'var(--text-muted)' : 'var(--text)',
                    }}>
                      {n.message}
                    </div>
                    <div style={{ fontSize: '0.73rem', color: 'var(--text-faint)', marginTop: 3 }}>
                      {timeAgo(n.createdAt)}
                    </div>
                  </div>
                  {!n.read && (
                    <div style={{
                      width: 7, height: 7, borderRadius: '50%',
                      background: 'var(--accent)', flexShrink: 0, marginTop: 5,
                    }} />
                  )}
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
