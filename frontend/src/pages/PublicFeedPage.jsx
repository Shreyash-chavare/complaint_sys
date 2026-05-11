import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import ComplaintCard from '../components/ComplaintCard';
import Loader from '../components/Loader';

const STATUSES   = ['', 'open', 'assigned', 'in_progress', 'resolved', 'closed', 'reopened'];
const CATEGORIES = ['', 'Academic', 'Infrastructure'];
const PRIORITIES = ['', 'low', 'medium', 'high'];

export default function PublicFeedPage() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [toast, setToast]       = useState('');
  const [filters, setFilters]   = useState({ status: '', category: '', priority: '' });
  const [page, setPage]         = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal]       = useState(0);

  const setF = (k, v) => { setFilters(p => ({ ...p, [k]: v })); setPage(1); };
  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2500); };

  const fetchFeed = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const params = { page, limit: 10 };
      if (filters.status)   params.status   = filters.status;
      if (filters.category) params.category = filters.category;
      if (filters.priority) params.priority = filters.priority;
      const { data } = await api.get('/complaints/feed', { params });
      setComplaints(data.complaints);
      setTotalPages(data.totalPages);
      setTotal(data.total);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load feed.');
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => { fetchFeed(); }, [fetchFeed]);

  const handleUpvote = async (id) => {
    try {
      const { data } = await api.patch(`/complaints/${id}/upvote`);
      showToast(`👍 ${data.message} · ${data.upvoteCount} upvote${data.upvoteCount !== 1 ? 's' : ''}`);
      setComplaints(prev => prev.map(c =>
        c._id === id
          ? { ...c, upvotes: Array.from({ length: data.upvoteCount }) }
          : c
      ));
    } catch (err) {
      showToast(`❌ ${err.response?.data?.message || 'Upvote failed.'}`);
    }
  };

  return (
    <div className="page">
      <div className="container">
        {/* Header */}
        <div className="page-header fade-in">
          <h1>🌐 <span>Public Feed</span></h1>
          <p>{total} public complaint{total !== 1 ? 's' : ''} · Upvote to highlight common issues</p>
        </div>

        {/* Toast */}
        {toast && (
          <div className="alert" style={{
            marginBottom: 20,
            background: toast.startsWith('❌') ? 'rgba(239,68,68,0.1)' : 'rgba(99,102,241,0.1)',
            color:  toast.startsWith('❌') ? 'var(--danger)' : 'var(--accent)',
            border: `1px solid ${toast.startsWith('❌') ? 'rgba(239,68,68,0.3)' : 'rgba(99,102,241,0.3)'}`,
          }}>{toast}</div>
        )}

        {/* Filters */}
        <div className="glass fade-in" style={{ padding: '16px 20px', marginBottom: 24, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Filter:</span>
          {[
            { key: 'status',   opts: STATUSES,   label: 'Status' },
            { key: 'category', opts: CATEGORIES, label: 'Category' },
            { key: 'priority', opts: PRIORITIES, label: 'Priority' },
          ].map(f => (
            <select key={f.key} className="form-input" style={{ width: 'auto', minWidth: 130 }}
              value={filters[f.key]} onChange={e => setF(f.key, e.target.value)}>
              <option value="">All {f.label}s</option>
              {f.opts.filter(Boolean).map(o => <option key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1)}</option>)}
            </select>
          ))}
          {(filters.status || filters.category || filters.priority) && (
            <button className="btn btn-sm btn-secondary"
              onClick={() => { setFilters({ status: '', category: '', priority: '' }); setPage(1); }}>
              ✕ Clear
            </button>
          )}
        </div>

        {/* Feed */}
        {loading && <Loader count={5} />}
        {error   && <div className="alert alert-error">{error}</div>}

        {!loading && !error && complaints.length === 0 && (
          <div className="glass" style={{ padding: 60, textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: 16 }}>📭</div>
            <h3 style={{ fontWeight: 700, marginBottom: 8 }}>No public complaints yet</h3>
            <p style={{ color: 'var(--text-muted)' }}>Try changing filters or check back later.</p>
          </div>
        )}

        {!loading && complaints.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {complaints.map(c => (
              <ComplaintCard key={c._id} complaint={c} mode="feed" onUpvote={handleUpvote} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginTop: 32, alignItems: 'center' }}>
            <button className="btn btn-sm btn-secondary" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
            <span style={{ fontSize: '0.88rem', color: 'var(--text-muted)', padding: '0 8px' }}>
              Page {page} of {totalPages}
            </span>
            <button className="btn btn-sm btn-secondary" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
          </div>
        )}
      </div>
    </div>
  );
}
