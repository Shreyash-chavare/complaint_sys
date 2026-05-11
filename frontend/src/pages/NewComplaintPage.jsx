import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import Select from 'react-select';

const SLA_MAP = { high: '1 day', medium: '3 days', low: '5 days' };
const SLA_COLOR = { high: 'var(--danger)', medium: 'var(--warning)', low: 'var(--success)' };

export default function NewComplaintPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '', description: '', category: 'Infrastructure',
    priority: 'low', isPrivate: false,
    assignedTeachers: [],
    building: '', floor: '', room: '',
  });
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [teachers, setTeachers] = useState([]);

  useEffect(() => {
    api.get("/complaints/teachers")
      .then(res => setTeachers(res.data))
      .catch(err => console.log(err));
  }, []);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('title', form.title);
      fd.append('description', form.description);
      fd.append('category', form.category);
      fd.append('priority', form.priority);
      fd.append('isPrivate', form.isPrivate);

      if (form.category === 'Academic' && form.assignedTeachers.length > 0) {
  fd.append("assignedTeachers", JSON.stringify(form.assignedTeachers));
}

      const location = { building: form.building, floor: form.floor, room: form.room };
      fd.append('location', JSON.stringify(location));

      files.forEach(f => fd.append('attachments', f));

      await api.post('/complaints', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      navigate('/complaints/my');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit complaint.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 720 }}>
        <div className="page-header">
          <h1>✏️ <span>New Complaint</span></h1>
          <p>Fill in the details below. All fields marked * are required.</p>
        </div>

        {error && <div className="alert alert-error" style={{ marginBottom: 24 }}>⚠️ {error}</div>}

        <form onSubmit={handleSubmit}>
          {/* Card 1: Basic Info */}
          <div className="glass slide-up" style={{ padding: 28, marginBottom: 20 }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 20, color: 'var(--text-muted)' }}>📝 Basic Information</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div className="form-group">
                <label className="form-label">Title *</label>
                <input id="c-title" type="text" className="form-input" placeholder="Brief summary of the issue"
                  value={form.title} onChange={e => set('title', e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Description *</label>
                <textarea id="c-desc" className="form-input" rows={4} placeholder="Describe the issue in detail…"
                  value={form.description} onChange={e => set('description', e.target.value)} required
                  style={{ resize: 'vertical', minHeight: 100 }} />
              </div>

              {/* Category */}
              <div className="form-group">
                <label className="form-label">Category *</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {['Academic', 'Infrastructure'].map(c => (
                    <button key={c} type="button" onClick={() => set('category', c)} style={{
                      padding: '14px', borderRadius: 10, fontWeight: 600, fontSize: '0.9rem',
                      border: `2px solid ${form.category === c ? 'var(--accent)' : 'var(--border)'}`,
                      background: form.category === c ? 'var(--accent-glow)' : 'var(--surface)',
                      color: form.category === c ? 'var(--accent)' : 'var(--text-muted)',
                      cursor: 'pointer', transition: 'all 0.15s', textAlign: 'center',
                    }}>
                      {c === 'Academic' ? '📚' : '🔧'} {c}
                    </button>
                  ))}
                </div>
              </div>

              {/* Priority */}
              <div className="form-group">
                <label className="form-label">Priority</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                  {['low', 'medium', 'high'].map(p => (
                    <button key={p} type="button" onClick={() => set('priority', p)} style={{
                      padding: '12px', borderRadius: 10, fontWeight: 600, fontSize: '0.85rem',
                      border: `2px solid ${form.priority === p ? SLA_COLOR[p] : 'var(--border)'}`,
                      background: form.priority === p ? `${SLA_COLOR[p]}15` : 'var(--surface)',
                      color: form.priority === p ? SLA_COLOR[p] : 'var(--text-muted)',
                      cursor: 'pointer', transition: 'all 0.15s', textAlign: 'center',
                    }}>
                      {p === 'high' ? '🔴' : p === 'medium' ? '🟡' : '🟢'} {p.charAt(0).toUpperCase() + p.slice(1)}
                    </button>
                  ))}
                </div>
                {/* SLA preview */}
                <div style={{
                  marginTop: 8, padding: '8px 14px', borderRadius: 8, fontSize: '0.82rem', fontWeight: 600,
                  background: `${SLA_COLOR[form.priority]}15`,
                  color: SLA_COLOR[form.priority],
                  border: `1px solid ${SLA_COLOR[form.priority]}30`,
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  ⏱️ SLA Deadline: <strong>{SLA_MAP[form.priority]}</strong> from submission
                </div>
              </div>

              {/* Private toggle */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '14px 16px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)'
              }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>🔒 Private Complaint</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2 }}>Only visible to you and assignees</div>
                </div>
                <div onClick={() => set('isPrivate', !form.isPrivate)} style={{
                  width: 44, height: 24, borderRadius: 100,
                  background: form.isPrivate ? 'var(--accent)' : 'rgba(255,255,255,0.1)',
                  cursor: 'pointer', position: 'relative', transition: 'background 0.2s',
                }}>
                  <div style={{
                    width: 18, height: 18, borderRadius: '50%', background: '#fff',
                    position: 'absolute', top: 3,
                    left: form.isPrivate ? 23 : 3,
                    transition: 'left 0.2s',
                  }} />
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Academic teachers */}
          {form.category === 'Academic' && (
            <div className="glass slide-up" style={{ padding: 28, marginBottom: 20 }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 20, color: 'var(--text-muted)' }}>👨‍🏫 Assign Teachers</h2>
              <div className="form-group">
                <label className="form-label">Teacher IDs * (comma-separated)</label>
                <Select
                  options={teachers.map(t => ({
                    value: t._id,
                    label: t.name
                  }))}

                  value={
                    teachers
                      .filter(t => form.assignedTeachers[0] === t._id)
                      .map(t => ({ value: t._id, label: t.name }))[0] || null
                  }

                  onChange={(selected) => {
                    set('assignedTeachers', selected ? [selected.value] : []);
                  }}

                  isClearable
                  menuPortalTarget={document.body}

                  styles={{
  control: (base, state) => ({
    ...base,
    backgroundColor: '#1e1e2e',   // 🔥 solid dark bg
    borderColor: state.isFocused ? 'var(--accent)' : 'var(--border)',
    boxShadow: state.isFocused ? '0 0 0 2px var(--accent-glow)' : 'none',
    borderRadius: 10,
    minHeight: 44,
    color: '#ffffff',
  }),

  menu: (base) => ({
    ...base,
    backgroundColor: '#1e1e2e',   // 🔥 solid dropdown
    border: '1px solid var(--border)',
    borderRadius: 10,
    opacity: 1,
    zIndex: 9999
  }),

  menuList: (base) => ({
    ...base,
    backgroundColor: '#1e1e2e',   // 🔥 ensures list is solid too
    padding: 0
  }),

  option: (base, state) => ({
    ...base,
    backgroundColor: state.isFocused
      ? '#2a2a3a'
      : state.isSelected
        ? '#33334a'
        : '#1e1e2e',
    color: '#ffffff',
    cursor: 'pointer'
  }),

  singleValue: (base) => ({
    ...base,
    color: '#ffffff'
  }),

  input: (base) => ({
    ...base,
    color: '#ffffff'
  }),

  placeholder: (base) => ({
    ...base,
    color: '#9ca3af'
  })
}}
                />
                <span style={{ fontSize: '0.78rem', color: 'var(--text-faint)', marginTop: 4 }}>
                  Academic complaints require at least one teacher ID
                </span>
              </div>
            </div>
          )}

          {/* Card 3: Location */}
          <div className="glass slide-up" style={{ padding: 28, marginBottom: 20, animationDelay: '0.05s' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 20, color: 'var(--text-muted)' }}>📍 Location (Optional)</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
              <div className="form-group">
                <label className="form-label">Building</label>
                <input id="c-building" type="text" className="form-input" placeholder="e.g. Block A"
                  value={form.building} onChange={e => set('building', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Floor</label>
                <input id="c-floor" type="text" className="form-input" placeholder="e.g. 2nd Floor"
                  value={form.floor} onChange={e => set('floor', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Room</label>
                <input id="c-room" type="text" className="form-input" placeholder="e.g. 204"
                  value={form.room} onChange={e => set('room', e.target.value)} />
              </div>
            </div>
          </div>

          {/* Card 4: Attachments */}
          <div className="glass slide-up" style={{ padding: 28, marginBottom: 28, animationDelay: '0.1s' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 20, color: 'var(--text-muted)' }}>📎 Attachments (Optional)</h2>
            <label style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              gap: 10, padding: '28px', borderRadius: 10, cursor: 'pointer', textAlign: 'center',
              border: '2px dashed var(--border)', background: 'rgba(255,255,255,0.02)',
              transition: 'border-color 0.2s',
            }}>
              <span style={{ fontSize: '2rem' }}>☁️</span>
              <span style={{ fontWeight: 600 }}>Click to upload files</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-faint)' }}>Images, videos · Max 10MB each</span>
              <input id="c-files" type="file" multiple accept="image/*,video/*"
                style={{ display: 'none' }}
                onChange={e => setFiles(Array.from(e.target.files))} />
            </label>
            {files.length > 0 && (
              <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {files.map((f, i) => (
                  <span key={i} style={{
                    padding: '4px 10px', borderRadius: 6, fontSize: '0.78rem', fontWeight: 600,
                    background: 'var(--accent-glow)', color: 'var(--accent)', border: '1px solid rgba(99,102,241,0.3)',
                  }}>📄 {f.name}</span>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)} style={{ flex: 1, justifyContent: 'center' }}>
              ← Cancel
            </button>
            <button id="c-submit" type="submit" className="btn btn-primary" disabled={loading} style={{ flex: 2, justifyContent: 'center' }}>
              {loading ? '⏳ Submitting…' : '🚀 Submit Complaint'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );


}

