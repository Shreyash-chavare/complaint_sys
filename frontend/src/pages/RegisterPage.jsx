import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';

const ROLES = ['Student', 'Teacher', 'Technician', 'DeptAdmin'];
const DEPTS = ['IT Support', 'Electrical', 'Maintenance', 'Facilities'];
const YEARS = [1, 2, 3, 4];

export default function RegisterPage() {
  const navigate = useNavigate();
  const [role, setRole] = useState('Student');
  const [form, setForm] = useState({ name: '', email: '', password: '', rollNumber: '', department: '', year: '', employeeId: '', specialization: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    setLoading(true);
    try {
      const payload = { name: form.name, email: form.email, password: form.password, role };
      if (role === 'Student')    Object.assign(payload, { rollNumber: form.rollNumber, department: form.department, year: Number(form.year) });
      if (role === 'Teacher')    Object.assign(payload, { employeeId: form.employeeId, department: form.department });
      if (role === 'Technician') Object.assign(payload, { employeeId: form.employeeId, department: form.department, specialization: form.specialization });
      if (role === 'DeptAdmin')  Object.assign(payload, { employeeId: form.employeeId, department: form.department });

      const { data } = await api.post('/auth/registration', payload);
      setSuccess(`${data.role} registered successfully! Redirecting to login…`);
      setTimeout(() => navigate('/login'), 1800);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24,
      background: 'radial-gradient(ellipse 70% 60% at 50% 0%, rgba(139,92,246,0.1) 0%, transparent 70%)',
    }}>
      <div className="glass scale-in" style={{ width: '100%', maxWidth: 500, padding: '40px 36px' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 52, height: 52, background: 'var(--gradient)', borderRadius: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 26, margin: '0 auto 16px',
          }}>📝</div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.02em' }}>Create Account</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: 6 }}>Join the complaint management system</p>
        </div>

        {error   && <div className="alert alert-error"   style={{ marginBottom: 20 }}>⚠️ {error}</div>}
        {success && <div className="alert alert-success" style={{ marginBottom: 20 }}>✅ {success}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Role */}
          <div className="form-group">
            <label className="form-label">I am a…</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
              {ROLES.map(r => (
                <button key={r} type="button" onClick={() => setRole(r)} style={{
                  padding: '10px 8px', borderRadius: 8, fontSize: '0.85rem', fontWeight: 600,
                  border: `1px solid ${role === r ? 'var(--accent)' : 'var(--border)'}`,
                  background: role === r ? 'var(--accent-glow)' : 'var(--surface)',
                  color: role === r ? 'var(--accent)' : 'var(--text-muted)',
                  cursor: 'pointer', transition: 'all 0.15s',
                }}>{r}</button>
              ))}
            </div>
          </div>

          {/* Common fields */}
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input id="reg-name" type="text" className="form-input" placeholder="Your full name"
              value={form.name} onChange={e => set('name', e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input id="reg-email" type="email" className="form-input" placeholder="you@institute.edu"
              value={form.email} onChange={e => set('email', e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input id="reg-password" type="password" className="form-input" placeholder="Min 6 characters"
              value={form.password} onChange={e => set('password', e.target.value)} required minLength={6} />
          </div>

          {/* Student extras */}
          {role === 'Student' && <>
            <div className="form-group">
              <label className="form-label">Roll Number</label>
              <input id="reg-roll" type="text" className="form-input" placeholder="e.g. CS2021001"
                value={form.rollNumber} onChange={e => set('rollNumber', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Department</label>
              <input id="reg-dept-student" type="text" className="form-input" placeholder="e.g. Computer Science"
                value={form.department} onChange={e => set('department', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Year</label>
              <select id="reg-year" className="form-input" value={form.year} onChange={e => set('year', e.target.value)}>
                <option value="">Select year</option>
                {YEARS.map(y => <option key={y} value={y}>Year {y}</option>)}
              </select>
            </div>
          </>}

          {/* Teacher extras */}
          {role === 'Teacher' && <>
            <div className="form-group">
              <label className="form-label">Employee ID</label>
              <input id="reg-empid-teacher" type="text" className="form-input" placeholder="e.g. TCH001"
                value={form.employeeId} onChange={e => set('employeeId', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Department</label>
              <input id="reg-dept-teacher" type="text" className="form-input" placeholder="e.g. Mathematics"
                value={form.department} onChange={e => set('department', e.target.value)} />
            </div>
          </>}

          {/* Technician extras */}
          {role === 'Technician' && <>
            <div className="form-group">
              <label className="form-label">Employee ID</label>
              <input id="reg-empid-tech" type="text" className="form-input" placeholder="e.g. TEC001"
                value={form.employeeId} onChange={e => set('employeeId', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Department</label>
              <select id="reg-dept-tech" className="form-input" value={form.department} onChange={e => set('department', e.target.value)}>
                <option value="">Select department</option>
                {DEPTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Specialization</label>
              <input id="reg-spec" type="text" className="form-input" placeholder="e.g. Network Setup"
                value={form.specialization} onChange={e => set('specialization', e.target.value)} />
            </div>
          </>}

          {/* DeptAdmin extras */}
          {role === 'DeptAdmin' && <>
            <div className="form-group">
              <label className="form-label">Employee ID</label>
              <input id="reg-empid-admin" type="text" className="form-input" placeholder="e.g. ADM001"
                value={form.employeeId} onChange={e => set('employeeId', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Department to Manage</label>
              <select id="reg-dept-admin" className="form-input" value={form.department} onChange={e => set('department', e.target.value)} required>
                <option value="">Select department</option>
                {DEPTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </>}

          <button id="reg-submit" type="submit" className="btn btn-primary" disabled={loading}
            style={{ width: '100%', justifyContent: 'center', marginTop: 4, padding: '13px' }}>
            {loading ? 'Creating account…' : 'Create Account →'}
          </button>
        </form>

        <div className="divider" />
        <p style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 600 }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
