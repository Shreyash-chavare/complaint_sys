import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import Loader from '../components/Loader';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';

const STATUSES = ['', 'assigned', 'in_progress', 'resolved'];
const PRIORITIES = ['', 'low', 'medium', 'high'];

const STATUS_TRANSITIONS = {
  assigned: ['in_progress'],
  in_progress: ['resolved'],
  reopened: ['in_progress'],
};

function timeAgo(d) {
  const h = Math.floor((Date.now() - new Date(d)) / 3600000);
  if (h < 1) return `${Math.floor((Date.now() - new Date(d)) / 60000)}m ago`;
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function TeacherCard({ complaint, onStatusUpdate, updating }) {
  const { _id, title, description, category, priority, status, student, location, createdAt } = complaint;
  const nextStatuses = STATUS_TRANSITIONS[status] || [];
  const loc = location && [location.building, location.floor, location.room].filter(Boolean).join(', ');
  const [localRemark, setLocalRemark] = useState('');
  const { teacherRemark } = complaint;

  return (
    <div className="glass slide-up" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 2 }}>
        <span className="chip">{category}</span>
        <StatusBadge status={status} />
        <PriorityBadge priority={priority} />
      </div>
      <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>{title}</h3>
      <p style={{
        fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.6,
        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'
      }}>
        {description}
      </p>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: '0.8rem', color: 'var(--text-faint)' }}>
        {student && <span>👤 {student.name} · {student.department}</span>}
        {loc && <span>📍 {loc}</span>}
        <span>🕐 {timeAgo(createdAt)}</span>
      </div>
      {nextStatuses.length > 0 && (
        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          {nextStatuses.map(s => (
            <button key={s} className={`btn btn-sm ${s === 'resolved' ? 'btn-success' : 'btn-primary'}`}
              onClick={() => onStatusUpdate(_id, s)} disabled={updating}>
              {updating ? '⏳' : s === 'in_progress' ? '🎓 Start Review' : '✅ Mark Resolved'}
            </button>
          ))}
        </div>
      )}
      {teacherRemark && (
        <div style={{
          marginTop: 10,
          padding: 10,
          borderRadius: 8,
          background: 'rgba(99,102,241,0.1)',
          color: '#c7d2fe',
          fontSize: '0.85rem'
        }}>
          📝 <b>Teacher Remark:</b> {teacherRemark}
        </div>
      )}

      <div style={{ marginTop: 10, display: 'flex', gap: 8, alignItems: 'center' }}>

        <input
          type="text"
          placeholder="Write teacher remark..."
          value={localRemark}
          onChange={(e) => setLocalRemark(e.target.value)}
          style={{
            flex: 1,
            padding: '8px',
            borderRadius: 6,
            border: '1px solid var(--border)',
            background: 'var(--surface)',
            color: 'white'
          }}
        />

        <button
          className="btn btn-sm btn-secondary"
          onClick={async () => {
            try {
              await api.patch(`/complaints/${_id}/remark`, {
                teacherRemark: localRemark
              });

              setLocalRemark('');
            } catch (err) {
              console.log(err);
            }
          }}
        >
          Send
        </button>

      </div>
    </div>
  );
}

export default function TeacherDashboard() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [filters, setFilters] = useState({ status: '', priority: '' });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [updatingId, setUpdatingId] = useState(null);


  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };
  const setF = (k, v) => { setFilters(p => ({ ...p, [k]: v })); setPage(1); };

  const fetchComplaints = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const params = { page, limit: 10 };
      if (filters.status) params.status = filters.status;
      if (filters.priority) params.priority = filters.priority;
      const { data } = await api.get('/complaints/assigned', { params });
      setComplaints(data.complaints);
      setTotalPages(data.totalPages);
      setTotal(data.total);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load complaints.');
    } finally { setLoading(false); }
  }, [page, filters]);

  useEffect(() => { fetchComplaints(); }, [fetchComplaints]);

  const handleStatusUpdate = async (id, newStatus) => {
    setUpdatingId(id);
    try {
      await api.patch(`/complaints/${id}/status`, { status: newStatus });
      showToast(`✅ Status updated to ${newStatus.replace('_', ' ')}`);
      fetchComplaints();
    } catch (err) {
      showToast(`❌ ${err.response?.data?.message || 'Update failed.'}`);
    } finally { setUpdatingId(null); }
  };

  return (
    <div className="page">
      <div className="container">
        <div className="page-header fade-in">
          <h1>👨‍🏫 <span>Teacher Dashboard</span></h1>
          <p>Academic complaints assigned to you — {total} total</p>
        </div>

        {/* Stats */}
        <div className="grid-3 slide-up" style={{ marginBottom: 32 }}>
          {[
            { label: 'Total Assigned', val: total, color: '#10b981', icon: '📚' },
            { label: 'Pending Review', val: complaints.filter(c => c.status === 'assigned').length, color: '#f59e0b', icon: '⏳' },
            { label: 'In Progress', val: complaints.filter(c => c.status === 'in_progress').length, color: '#6366f1', icon: '🎓' },
          ].map(s => (
            <div key={s.label} className="glass" style={{ padding: 20, textAlign: 'center' }}>
              <div style={{ fontSize: '1.8rem', marginBottom: 6 }}>{s.icon}</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: s.color }}>{s.val}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {toast && (
          <div className="alert" style={{
            marginBottom: 20,
            background: toast.startsWith('✅') ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
            color: toast.startsWith('✅') ? 'var(--success)' : 'var(--danger)',
            border: `1px solid ${toast.startsWith('✅') ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
          }}>{toast}</div>
        )}

        <div className="glass fade-in" style={{ padding: '14px 20px', marginBottom: 24, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Filter:</span>
          <select className="form-input" style={{ width: 'auto', minWidth: 130 }}
            value={filters.status} onChange={e => setF('status', e.target.value)}>
            <option value="">All Statuses</option>
            {STATUSES.filter(Boolean).map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
          </select>
          <select className="form-input" style={{ width: 'auto', minWidth: 130 }}
            value={filters.priority} onChange={e => setF('priority', e.target.value)}>
            <option value="">All Priorities</option>
            {PRIORITIES.filter(Boolean).map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          {(filters.status || filters.priority) && (
            <button className="btn btn-sm btn-secondary"
              onClick={() => { setFilters({ status: '', priority: '' }); setPage(1); }}>✕ Clear</button>
          )}
        </div>

        {loading && <Loader count={4} />}
        {error && <div className="alert alert-error">{error}</div>}

        {!loading && !error && complaints.length === 0 && (
          <div className="glass" style={{ padding: 60, textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: 16 }}>📚</div>
            <h3 style={{ fontWeight: 700 }}>No complaints assigned</h3>
            <p style={{ color: 'var(--text-muted)', marginTop: 8 }}>You have no academic complaints to review.</p>
          </div>
        )}

        {!loading && complaints.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {complaints.map(c => (
              <TeacherCard key={c._id} complaint={c}
                onStatusUpdate={handleStatusUpdate} updating={updatingId === c._id} />
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginTop: 32, alignItems: 'center' }}>
            <button className="btn btn-sm btn-secondary" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
            <span style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>Page {page} of {totalPages}</span>
            <button className="btn btn-sm btn-secondary" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
          </div>
        )}
      </div>
    </div>
  );
}
