import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import ComplaintCard from '../components/ComplaintCard';
import Loader from '../components/Loader';
import { Link } from 'react-router-dom';

const STATUSES  = ['', 'open', 'assigned', 'in_progress', 'resolved', 'closed', 'reopened', 'withdrawn'];
const CATEGORIES = ['', 'Academic', 'Infrastructure'];
const PRIORITIES = ['', 'low', 'medium', 'high'];

export default function MyComplaintsPage() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [toast, setToast]     = useState('');
  const [filters, setFilters] = useState({ status: '', category: '', priority: '' });
  const [page, setPage]       = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal]     = useState(0);

  const setF = (k, v) => { setFilters(p => ({ ...p, [k]: v })); setPage(1); };

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const fetchComplaints = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const params = { page, limit: 8 };
      if (filters.status)   params.status   = filters.status;
      if (filters.category) params.category = filters.category;
      if (filters.priority) params.priority = filters.priority;
      const { data } = await api.get('/complaints/my', { params });
      setComplaints(data.complaints);
      setTotalPages(data.totalPages);
      setTotal(data.total);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load complaints.');
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => { fetchComplaints(); }, [fetchComplaints]);

  const handleWithdraw = async (id) => {
    if (!window.confirm('Delete or withdraw this complaint?')) return;
    try {
      const { data } = await api.delete(`/complaints/${id}`);
      showToast(`✅ ${data.message}`);
      fetchComplaints();
    } catch (err) {
      showToast(`❌ ${err.response?.data?.message || 'Action failed.'}`);
    }
  };

  const handleReopen = async (id) => {
    try {
      await api.patch(`/complaints/${id}/reopen`);
      showToast('✅ Complaint reopened successfully!');
      fetchComplaints();
    } catch (err) {
      showToast(`❌ ${err.response?.data?.message || 'Reopen failed.'}`);
    }
  };

  return (
    <div className="page">
      <div className="container">
        {/* Header */}
        <div className="page-header fade-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1>📋 <span>My Complaints</span></h1>
            <p>{total} complaint{total !== 1 ? 's' : ''} found</p>
          </div>
          <Link to="/complaints/new" className="btn btn-primary">✏️ New Complaint</Link>
        </div>

        {/* Toast */}
        {toast && (
          <div className="alert" style={{
            marginBottom: 20, background: toast.startsWith('✅') ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
            color: toast.startsWith('✅') ? 'var(--success)' : 'var(--danger)',
            border: `1px solid ${toast.startsWith('✅') ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
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

        {/* List */}
        {loading && <Loader count={4} />}
        {error   && <div className="alert alert-error">{error}</div>}

        {!loading && !error && complaints.length === 0 && (
          <div className="glass" style={{ padding: 60, textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: 16 }}>📭</div>
            <h3 style={{ fontWeight: 700, marginBottom: 8 }}>No complaints found</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>Try adjusting your filters or submit a new complaint.</p>
            <Link to="/complaints/new" className="btn btn-primary">✏️ New Complaint</Link>
          </div>
        )}

        {!loading && complaints.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {complaints.map(c => (
              <ComplaintCard key={c._id} complaint={c} mode="my"
                onWithdraw={handleWithdraw} onReopen={handleReopen} />
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
