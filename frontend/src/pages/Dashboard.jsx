import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const studentCards = [
  { to: '/complaints/new',  icon: '✏️', title: 'New Complaint',  desc: 'Submit a new Academic or Infrastructure complaint', color: '#6366f1' },
  { to: '/complaints/my',   icon: '📋', title: 'My Complaints',  desc: 'Track and manage all your submitted complaints',    color: '#8b5cf6' },
  { to: '/complaints/feed', icon: '🌐', title: 'Public Feed',    desc: 'Browse and upvote public complaints from peers',    color: '#3b82f6' },
];

const roleInfo = {
  Teacher:    { icon: '👨‍🏫', desc: 'View academic complaints assigned to you', color: '#10b981' },
  Technician: { icon: '🔧', desc: 'View infrastructure complaints assigned to you', color: '#f59e0b' },
  DeptAdmin:  { icon: '🏢', desc: 'Manage department complaints and assign staff', color: '#ef4444' },
};

const slaData = [
  { priority: 'High',   deadline: '1 day',  color: '#ef4444', pct: 85 },
  { priority: 'Medium', deadline: '3 days', color: '#f59e0b', pct: 55 },
  { priority: 'Low',    deadline: '5 days', color: '#10b981', pct: 25 },
];

export default function Dashboard() {
  const { user } = useAuth();
  const isStudent = user?.role === 'Student';
  const info = roleInfo[user?.role];

  return (
    <div className="page">
      <div className="container">
        {/* Welcome */}
        <div className="page-header fade-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1>Welcome back, <span>{user?.name}</span> 👋</h1>
            <p>You're signed in as <strong style={{ color: 'var(--accent)' }}>{user?.role}</strong> · {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
          {isStudent && (
            <Link to="/complaints/new" className="btn btn-primary">✏️ New Complaint</Link>
          )}
        </div>

        {/* Student quick-action cards */}
        {isStudent && (
          <div className="grid-3 slide-up" style={{ marginBottom: 40 }}>
            {studentCards.map(c => (
              <Link key={c.to} to={c.to} style={{ textDecoration: 'none' }}>
                <div className="glass" style={{ padding: 28, height: '100%', cursor: 'pointer', position: 'relative', overflow: 'hidden', transition: 'transform 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                  <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80,
                    background: `radial-gradient(circle, ${c.color}22 0%, transparent 70%)`, borderRadius: '50%' }} />
                  <div style={{ fontSize: '2.2rem', marginBottom: 14 }}>{c.icon}</div>
                  <h3 style={{ fontWeight: 700, marginBottom: 8, fontSize: '1.05rem' }}>{c.title}</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>{c.desc}</p>
                  <div style={{ marginTop: 16, fontSize: '0.8rem', color: c.color, fontWeight: 600 }}>Go → </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Non-student role panel */}
        {!isStudent && info && (
          <div className="glass slide-up" style={{ padding: 36, marginBottom: 40, display: 'flex', alignItems: 'center', gap: 24,
            background: `linear-gradient(135deg, ${info.color}0f, transparent)`, borderColor: `${info.color}30` }}>
            <div style={{ fontSize: '3.5rem' }}>{info.icon}</div>
            <div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: 8 }}>{user?.role} Portal</h2>
              <p style={{ color: 'var(--text-muted)', marginBottom: 16 }}>{info.desc}</p>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)',
                borderRadius: 8, padding: '8px 16px', fontSize: '0.85rem', color: 'var(--text-muted)',
              }}>
                🚧 Role-specific dashboards coming soon — backend routes in progress
              </div>
            </div>
          </div>
        )}

        {/* SLA Widget */}
        <div className="slide-up" style={{ animationDelay: '0.1s' }}>
          <h2 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: 20 }}>📊 SLA Overview</h2>
          <div className="grid-3">
            {slaData.map(s => (
              <div key={s.priority} className="glass" style={{ padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{s.priority} Priority</span>
                  <span className={`badge badge-${s.priority.toLowerCase()}`}>{s.deadline} SLA</span>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 100, height: 6, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${s.pct}%`, background: s.color, borderRadius: 100, transition: 'width 1s ease' }} />
                </div>
                <div style={{ marginTop: 6, fontSize: '0.75rem', color: 'var(--text-faint)' }}>
                  {s.pct}% avg utilization
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Info cards */}
        <div className="grid-4 slide-up" style={{ marginTop: 32, animationDelay: '0.15s' }}>
          {[
            { icon: '🏫', label: 'Academic', val: 'Teacher handles' },
            { icon: '🔌', label: 'Infrastructure', val: 'Technician handles' },
            { icon: '🔒', label: 'Private Mode', val: 'Only you can see' },
            { icon: '👍', label: 'Upvotes', val: 'Show common issues' },
          ].map(c => (
            <div key={c.label} className="glass" style={{ padding: 18, textAlign: 'center' }}>
              <div style={{ fontSize: '1.8rem', marginBottom: 8 }}>{c.icon}</div>
              <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: 4 }}>{c.label}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{c.val}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
