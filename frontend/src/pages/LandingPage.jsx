import { Link } from 'react-router-dom';

const features = [
  { icon: '👥', title: 'Multi-Role System',    desc: '4 hierarchical roles with fine-grained access control' },
  { icon: '🔀', title: 'Dept. Routing',        desc: 'Auto-route complaints to Electrical / IT / Maintenance' },
  { icon: '⏱️', title: 'SLA Tracking',          desc: 'Priority-based deadlines: High 1d · Medium 3d · Low 5d' },
  { icon: '🔔', title: 'Notifications',         desc: 'Real-time alerts on submit, status change & escalation' },
  { icon: '📊', title: 'Analytics Dashboard',  desc: 'Charts, KPIs, avg resolution time per department' },
  { icon: '🗺️', title: 'Complaint Heatmap',    desc: 'Visual map of complaint frequency by campus location' },
  { icon: '📋', title: 'Audit Log',             desc: 'Every action timestamped for full transparency' },
  { icon: '🔐', title: 'Auth & Authorization', desc: 'JWT-based auth with role-scoped data visibility' },
  { icon: '🤖', title: 'Smart Auto-Assign',    desc: 'Staff assigned by dept + workload availability' },
  { icon: '🔄', title: 'Real-World Features',  desc: 'Photo upload · Location picker · Feedback · Reopen' },
];

const stats = [
  { value: '10', label: 'Core Features' },
  { value: '4',  label: 'User Roles' },
  { value: '3',  label: 'Departments' },
  { value: '3',  label: 'Priority Levels' },
  { value: '∞',  label: 'Audit Trail' },
];

export default function LandingPage() {
  return (
    <div>
      {/* Hero */}
      <section style={{
        minHeight: '92vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        textAlign: 'center', padding: '80px 24px',
        background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(99,102,241,0.12) 0%, transparent 70%)',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Background orbs */}
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
          <div style={{ position: 'absolute', top: '10%', left: '10%', width: 400, height: 400,
            background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)', borderRadius: '50%' }} />
          <div style={{ position: 'absolute', bottom: '10%', right: '10%', width: 300, height: 300,
            background: 'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)', borderRadius: '50%' }} />
        </div>

        <div className="fade-in" style={{ maxWidth: 760, position: 'relative', zIndex: 1 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)',
            borderRadius: 100, padding: '6px 16px', fontSize: '0.8rem', fontWeight: 600,
            color: 'var(--accent)', marginBottom: 28,
          }}>
            🏫 Institute Complaint Management System v1.0
          </div>

          <h1 style={{ fontSize: 'clamp(2.4rem, 6vw, 4rem)', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.03em', marginBottom: 24 }}>
            Resolve Complaints{' '}
            <span style={{ background: 'var(--gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Faster & Smarter
            </span>
          </h1>

          <p style={{ fontSize: '1.15rem', color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: 40, maxWidth: 560, margin: '0 auto 40px' }}>
            A full-stack complaint management platform with role-based access, SLA tracking, department auto-routing, and real-time notifications.
          </p>

          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/register" className="btn btn-primary btn-lg">Get Started →</Link>
            <Link to="/login"    className="btn btn-secondary btn-lg">Sign In</Link>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section style={{ borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '28px 0', background: 'rgba(255,255,255,0.02)' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: 16 }}>
          {stats.map(s => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 800, background: 'var(--gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{s.value}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: '80px 0' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 12 }}>
              Everything you need, <span style={{ color: 'var(--accent)' }}>built in</span>
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>10 core features across a full-stack architecture</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20 }}>
            {features.map((f, i) => (
              <div key={i} className="glass slide-up" style={{ padding: 24, animationDelay: `${i * 0.05}s` }}>
                <div style={{ fontSize: '2rem', marginBottom: 12 }}>{f.icon}</div>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: 6 }}>{f.title}</h3>
                <p style={{ fontSize: '0.83rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '80px 0', textAlign: 'center' }}>
        <div className="container">
          <div className="glass" style={{ padding: '56px 40px', maxWidth: 640, margin: '0 auto',
            background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.08))',
            borderColor: 'rgba(99,102,241,0.2)' }}>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: 16 }}>Ready to get started?</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: 32 }}>Join your institute's complaint management system today.</p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/register" className="btn btn-primary btn-lg">Create Account</Link>
              <Link to="/login"    className="btn btn-secondary btn-lg">Sign In</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--border)', padding: '24px 0', textAlign: 'center' }}>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-faint)' }}>
          © 2026 Institute Complaint Management System · Full-Stack Architecture · Role-Based Access Control
        </p>
      </footer>
    </div>
  );
}
