import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const ROLES = ['Student', 'Teacher', 'Technician', 'DeptAdmin'];

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '', role: 'Student' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', form);
      login(data);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24,
      background: 'radial-gradient(ellipse 70% 60% at 50% 0%, rgba(99,102,241,0.1) 0%, transparent 70%)',
    }}>
      <div className="glass scale-in" style={{ width: '100%', maxWidth: 440, padding: '40px 36px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{
            width: 52, height: 52, background: 'var(--gradient)', borderRadius: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 26, margin: '0 auto 16px',
          }}>🏫</div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.02em' }}>Welcome back</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: 6 }}>Sign in to your account</p>
        </div>

        {error && <div className="alert alert-error" style={{ marginBottom: 20 }}>⚠️ {error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Role selector */}
          <div className="form-group">
            <label className="form-label">Role</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
              {ROLES.map(r => (
                <button key={r} type="button"
                  onClick={() => set('role', r)}
                  style={{
                    padding: '10px 8px', borderRadius: 8, fontSize: '0.85rem', fontWeight: 600,
                    border: `1px solid ${form.role === r ? 'var(--accent)' : 'var(--border)'}`,
                    background: form.role === r ? 'var(--accent-glow)' : 'var(--surface)',
                    color: form.role === r ? 'var(--accent)' : 'var(--text-muted)',
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}>
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Email</label>
            <input id="login-email" type="email" className="form-input" placeholder="you@institute.edu"
              value={form.email} onChange={e => set('email', e.target.value)} required />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input id="login-password" type="password" className="form-input" placeholder="••••••••"
              value={form.password} onChange={e => set('password', e.target.value)} required />
          </div>

          <button id="login-submit" type="submit" className="btn btn-primary" disabled={loading}
            style={{ width: '100%', justifyContent: 'center', marginTop: 4, padding: '13px' }}>
            {loading ? 'Signing in…' : 'Sign In →'}
          </button>
        </form>

        <div className="divider" />
        <p style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          No account?{' '}
          <Link to="/register" style={{ color: 'var(--accent)', fontWeight: 600 }}>Register here</Link>
        </p>
      </div>
    </div>
  );
}
