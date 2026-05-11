import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import Loader from '../components/Loader';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';

const STATUSES   = ['', 'open', 'assigned', 'in_progress', 'resolved', 'closed', 'reopened'];
const PRIORITIES = ['', 'low', 'medium', 'high'];

function timeAgo(d) {
  const h = Math.floor((Date.now() - new Date(d)) / 3600000);
  if (h < 1) return `${Math.floor((Date.now()-new Date(d))/60000)}m ago`;
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h/24)}d ago`;
}

// ── Assign modal ──────────────────────────────────────────────────────────────
function AssignModal({ complaint, technicians, onAssign, onClose }) {
  const [selectedTech, setSelectedTech] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!selectedTech) return;
    setLoading(true);
    await onAssign(complaint._id, selectedTech);
    setLoading(false);
    onClose();
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }} onClick={onClose}>
      <div className="glass" style={{ width: '100%', maxWidth: 480, padding: 32 }} onClick={e => e.stopPropagation()}>
        <h2 style={{ fontWeight: 700, marginBottom: 6 }}>🔧 Assign Technician</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: 24 }}>
          Complaint: <strong>"{complaint.title}"</strong>
        </p>

        {technicians.length === 0 ? (
          <div className="alert alert-error">No technicians available in this department.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
            {technicians.map(t => (
              <div key={t._id} onClick={() => setSelectedTech(t._id)} style={{
                padding: '12px 16px', borderRadius: 10, cursor: 'pointer', transition: 'all 0.15s',
                border: `2px solid ${selectedTech === t._id ? 'var(--accent)' : 'var(--border)'}`,
                background: selectedTech === t._id ? 'var(--accent-glow)' : 'var(--surface)',
              }}>
                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{t.name}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2 }}>
                  {t.specialization || 'General'} · {t.activeComplaints} active complaint{t.activeComplaints !== 1 ? 's' : ''}
                </div>
                {/* Workload bar */}
                <div style={{ marginTop: 8, background: 'rgba(255,255,255,0.06)', borderRadius: 100, height: 4 }}>
                  <div style={{
                    height: '100%', borderRadius: 100,
                    width: `${Math.min(100, t.activeComplaints * 20)}%`,
                    background: t.activeComplaints > 3 ? 'var(--danger)' : t.activeComplaints > 1 ? 'var(--warning)' : 'var(--success)',
                  }} />
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary" onClick={onClose} style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
          <button className="btn btn-primary" onClick={submit} disabled={!selectedTech || loading}
            style={{ flex: 2, justifyContent: 'center' }}>
            {loading ? '⏳ Assigning…' : '✅ Assign Technician'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Admin complaint card ──────────────────────────────────────────────────────
function AdminComplaintCard({ complaint, onAssign, onStatusUpdate, updating }) {
  const { _id, title, description, category, priority, status, student, assignedTo, location, slaDeadline, createdAt } = complaint;
  const isOverdue = slaDeadline && new Date(slaDeadline) < new Date() && !['resolved','closed','withdrawn'].includes(status);
  const loc = location && [location.building, location.floor, location.room].filter(Boolean).join(', ');

  const canAssign  = category === 'Infrastructure' && ['open','reopened'].includes(status);
  const canClose   = status === 'resolved';
  const canInProg  = status === 'assigned';

  return (
    <div className="glass slide-up" style={{
      padding: 20, display: 'flex', flexDirection: 'column', gap: 12,
      borderLeft: isOverdue ? '3px solid var(--danger)' : '3px solid transparent',
    }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 2 }}>
        <span className="chip">{category}</span>
        <StatusBadge status={status} />
        <PriorityBadge priority={priority} />
        {isOverdue && <span className="badge" style={{ background:'rgba(239,68,68,0.15)', color:'#f87171', border:'1px solid rgba(239,68,68,0.3)' }}>🚨 SLA Breach</span>}
      </div>
      <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>{title}</h3>
      <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.6,
        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
        {description}
      </p>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: '0.8rem', color: 'var(--text-faint)' }}>
        {student   && <span>👤 {student.name}</span>}
        {assignedTo && <span>🔧 {assignedTo.name}</span>}
        {loc        && <span>📍 {loc}</span>}
        <span>🕐 {timeAgo(createdAt)}</span>
        {slaDeadline && (
          <span style={{ color: isOverdue ? 'var(--danger)' : 'var(--text-faint)' }}>
            ⏱️ SLA: {isOverdue
              ? `${Math.abs(Math.round((new Date(slaDeadline)-new Date())/3600000))}h overdue`
              : `${Math.round((new Date(slaDeadline)-new Date())/3600000)}h left`}
          </span>
        )}
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {canAssign  && <button className="btn btn-sm btn-primary"   onClick={() => onAssign(complaint)} disabled={updating}>👤 Assign</button>}
        {canInProg  && <button className="btn btn-sm btn-secondary" onClick={() => onStatusUpdate(_id, 'in_progress')} disabled={updating}>⚙️ Mark In Progress</button>}
        {canClose   && <button className="btn btn-sm btn-success"   onClick={() => onStatusUpdate(_id, 'closed')} disabled={updating}>🔒 Close</button>}
      </div>
    </div>
  );
}

// ── Analytics mini panel ──────────────────────────────────────────────────────
function AnalyticsPanel() {
  const [data, setData]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/analytics').then(r => setData(r.data)).catch(()=>{}).finally(()=>setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: 20, color: 'var(--text-muted)', fontSize: '0.85rem' }}>Loading analytics…</div>;
  if (!data) return null;

  const stats = [
    { label: 'Total',       val: data.totalComplaints,    icon: '📊', color: '#6366f1' },
    { label: 'Resolution %',val: `${data.resolutionRate}%`,icon: '✅', color: '#10b981' },
    { label: 'Avg Time',    val: `${data.avgResolutionHours}h`, icon: '⏱️', color: '#f59e0b' },
    { label: 'SLA Breaches',val: data.sla?.breached || 0, icon: '🚨', color: '#ef4444' },
  ];

  return (
    <div style={{ marginBottom: 32 }}>
      <h2 style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: 16 }}>📊 Analytics Overview</h2>
      <div className="grid-4" style={{ marginBottom: 20 }}>
        {stats.map(s => (
          <div key={s.label} className="glass" style={{ padding: 18, textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: 4 }}>{s.icon}</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: s.color }}>{s.val}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>
      {/* By priority */}
      <div className="glass" style={{ padding: 20 }}>
        <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: 14 }}>Complaints by Priority</div>
        {[
          { label: 'High',   val: data.byPriority?.high,   color: '#ef4444' },
          { label: 'Medium', val: data.byPriority?.medium, color: '#f59e0b' },
          { label: 'Low',    val: data.byPriority?.low,    color: '#10b981' },
        ].map(p => {
          const pct = data.totalComplaints > 0 ? Math.round((p.val / data.totalComplaints) * 100) : 0;
          return (
            <div key={p.label} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: '0.82rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>{p.label}</span>
                <span style={{ fontWeight: 600 }}>{p.val} ({pct}%)</span>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 100, height: 5 }}>
                <div style={{ height: '100%', width: `${pct}%`, background: p.color, borderRadius: 100, transition: 'width 0.8s ease' }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main DeptAdmin Dashboard ──────────────────────────────────────────────────
export default function DeptAdminDashboard() {
  const [complaints, setComplaints]     = useState([]);
  const [technicians, setTechnicians]   = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState('');
  const [toast, setToast]               = useState('');
  const [filters, setFilters]           = useState({ status: '', priority: '' });
  const [page, setPage]                 = useState(1);
  const [totalPages, setTotalPages]     = useState(1);
  const [total, setTotal]               = useState(0);
  const [assignTarget, setAssignTarget] = useState(null);  // complaint to assign
  const [updatingId, setUpdatingId]     = useState(null);
  const [activeTab, setActiveTab]       = useState('complaints'); // complaints | analytics

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };
  const setF = (k, v) => { setFilters(p => ({ ...p, [k]: v })); setPage(1); };

  const fetchComplaints = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const params = { page, limit: 10 };
      if (filters.status)   params.status   = filters.status;
      if (filters.priority) params.priority = filters.priority;
      const { data } = await api.get('/complaints/department', { params });
      setComplaints(data.complaints);
      setTotalPages(data.totalPages);
      setTotal(data.total);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load complaints.');
    } finally { setLoading(false); }
  }, [page, filters]);

  const fetchTechnicians = useCallback(async () => {
    try {
      const { data } = await api.get('/complaints/technicians');
      setTechnicians(data.technicians);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { fetchComplaints(); fetchTechnicians(); }, [fetchComplaints, fetchTechnicians]);

  const handleAssign = async (complaintId, technicianId) => {
    try {
      await api.patch(`/complaints/${complaintId}/assign`, { technicianId });
      showToast('✅ Technician assigned successfully!');
      fetchComplaints();
    } catch (err) {
      showToast(`❌ ${err.response?.data?.message || 'Assignment failed.'}`);
    }
  };

  const handleStatusUpdate = async (id, newStatus) => {
    setUpdatingId(id);
    try {
      await api.patch(`/complaints/${id}/status`, { status: newStatus });
      showToast(`✅ Status updated to ${newStatus.replace('_',' ')}`);
      fetchComplaints();
    } catch (err) {
      showToast(`❌ ${err.response?.data?.message || 'Update failed.'}`);
    } finally { setUpdatingId(null); }
  };

  return (
    <div className="page">
      <div className="container">
        <div className="page-header fade-in">
          <h1>🏢 <span>Department Admin Dashboard</span></h1>
          <p>{total} complaints in your department</p>
        </div>

        {/* Tab switcher */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 28 }}>
          {['complaints','analytics'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className="btn btn-sm"
              style={{
                background: activeTab === tab ? 'var(--accent-glow)' : 'var(--surface)',
                border: `1px solid ${activeTab === tab ? 'var(--accent)' : 'var(--border)'}`,
                color: activeTab === tab ? 'var(--accent)' : 'var(--text-muted)',
              }}>
              {tab === 'complaints' ? '📋 Complaints' : '📊 Analytics'}
            </button>
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

        {/* Analytics tab */}
        {activeTab === 'analytics' && <AnalyticsPanel />}

        {/* Complaints tab */}
        {activeTab === 'complaints' && (
          <>
            <div className="glass fade-in" style={{ padding: '14px 20px', marginBottom: 24, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Filter:</span>
              <select className="form-input" style={{ width:'auto', minWidth:130 }}
                value={filters.status} onChange={e => setF('status', e.target.value)}>
                <option value="">All Statuses</option>
                {STATUSES.filter(Boolean).map(s => <option key={s} value={s}>{s.replace('_',' ')}</option>)}
              </select>
              <select className="form-input" style={{ width:'auto', minWidth:130 }}
                value={filters.priority} onChange={e => setF('priority', e.target.value)}>
                <option value="">All Priorities</option>
                {PRIORITIES.filter(Boolean).map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              {(filters.status || filters.priority) && (
                <button className="btn btn-sm btn-secondary"
                  onClick={() => { setFilters({ status:'', priority:'' }); setPage(1); }}>✕ Clear</button>
              )}
            </div>

            {loading && <Loader count={4} />}
            {error   && <div className="alert alert-error">{error}</div>}

            {!loading && !error && complaints.length === 0 && (
              <div className="glass" style={{ padding:60, textAlign:'center' }}>
                <div style={{ fontSize:'3rem', marginBottom:16 }}>📭</div>
                <h3 style={{ fontWeight:700 }}>No complaints found</h3>
                <p style={{ color:'var(--text-muted)', marginTop:8 }}>Your department is all clear!</p>
              </div>
            )}

            {!loading && complaints.length > 0 && (
              <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
                {complaints.map(c => (
                  <AdminComplaintCard key={c._id} complaint={c}
                    onAssign={setAssignTarget}
                    onStatusUpdate={handleStatusUpdate}
                    updating={updatingId === c._id} />
                ))}
              </div>
            )}

            {totalPages > 1 && (
              <div style={{ display:'flex', justifyContent:'center', gap:10, marginTop:32, alignItems:'center' }}>
                <button className="btn btn-sm btn-secondary" disabled={page===1} onClick={() => setPage(p=>p-1)}>← Prev</button>
                <span style={{ fontSize:'0.88rem', color:'var(--text-muted)' }}>Page {page} of {totalPages}</span>
                <button className="btn btn-sm btn-secondary" disabled={page===totalPages} onClick={() => setPage(p=>p+1)}>Next →</button>
              </div>
            )}
          </>
        )}

        {/* Assign modal */}
        {assignTarget && (
          <AssignModal
            complaint={assignTarget}
            technicians={technicians}
            onAssign={handleAssign}
            onClose={() => setAssignTarget(null)}
          />
        )}
      </div>
    </div>
  );
}
