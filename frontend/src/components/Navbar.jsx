import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';

const NAV_LINKS = {
  Student    : [
    { to: '/dashboard',        label: 'Dashboard' },
    { to: '/complaints/new',   label: '+ New' },
    { to: '/complaints/my',    label: 'My Complaints' },
    { to: '/complaints/feed',  label: 'Public Feed' },
  ],
  Technician : [
    { to: '/dashboard',   label: 'Dashboard' },
    { to: '/technician',  label: 'My Assignments' },
    { to: '/complaints/feed', label: 'Public Feed' },
  ],
  Teacher    : [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/teacher',   label: 'My Assignments' },
    { to: '/complaints/feed', label: 'Public Feed' },
  ],
  DeptAdmin  : [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/admin',     label: 'Dept Complaints' },
    { to: '/complaints/feed', label: 'Public Feed' },
  ],
};

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate         = useNavigate();
  const location         = useLocation();

  const handleLogout = () => { logout(); navigate('/login'); };
  const isActive = (path) => location.pathname === path;
  const links = NAV_LINKS[user?.role] || [];

  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 100,
      background: 'rgba(10,14,26,0.85)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid var(--border)',
    }}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
        {/* Logo */}
        <Link to={user ? '/dashboard' : '/'} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 34, height: 34, background: 'var(--gradient)', borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
          }}>🏫</div>
          <span style={{ fontWeight: 800, fontSize: '1.05rem', letterSpacing: '-0.01em' }}>
            Complaint<span style={{ color: 'var(--accent)' }}>MS</span>
          </span>
        </Link>

        {/* Nav links */}
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {links.map(l => (
              <Link key={l.to} to={l.to} className="btn btn-sm btn-secondary" style={{
                background   : isActive(l.to) ? 'var(--accent-glow)' : 'transparent',
                borderColor  : isActive(l.to) ? 'var(--accent)' : 'transparent',
                color        : isActive(l.to) ? 'var(--accent)' : 'var(--text-muted)',
              }}>{l.label}</Link>
            ))}
          </div>
        )}

        {/* Right: notification bell + user chip + logout */}
        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <NotificationBell />

            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 8, padding: '6px 12px',
            }}>
              <div style={{
                width: 28, height: 28, background: 'var(--gradient)', borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 700,
              }}>
                {user.name?.charAt(0).toUpperCase()}
              </div>
              <div style={{ lineHeight: 1.2 }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>{user.name}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--accent)' }}>{user.role}</div>
              </div>
            </div>

            <button className="btn btn-sm btn-secondary" onClick={handleLogout}>Logout</button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 8 }}>
            <Link to="/login"    className="btn btn-sm btn-secondary">Login</Link>
            <Link to="/register" className="btn btn-sm btn-primary">Register</Link>
          </div>
        )}
      </div>
    </nav>
  );
}
