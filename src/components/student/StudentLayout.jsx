import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LayoutDashboard, User, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

// Hoisted navigation map to avoid recreating on each render (rendering-hoist-jsx)
const NAV_LINKS = [
  { path: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
  { path: '/dashboard/profile', label: 'Profile', icon: <User size={18} /> },
];

const StudentLayout = ({ children }) => {
  const { signOut } = useAuth();
  const location = useLocation();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Navigation Bar */}
      <header className="glass-card" style={{ 
        margin: '1rem', 
        padding: '1rem 2rem', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        position: 'sticky',
        top: '1rem',
        zIndex: 50,
        borderRadius: '16px'
      }}>
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h1 style={{ fontSize: '1.5rem', margin: 0, color: 'var(--accent-teal)' }}>SkillMatchPH</h1>
        </motion.div>

        <nav style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '1rem' }}>
            {NAV_LINKS.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 1rem',
                    borderRadius: '8px',
                    color: isActive ? '#fff' : 'var(--text-secondary)',
                    background: isActive ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                    textDecoration: 'none',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <span style={{ color: isActive ? 'var(--accent-teal)' : 'inherit' }}>
                    {link.icon}
                  </span>
                  {link.label}
                </Link>
              );
            })}
          </div>

          <div style={{ width: '1px', height: '24px', background: 'var(--glass-border)' }} />

          <button onClick={signOut} className="signout-btn" style={{ padding: '0.5rem 1rem' }}>
            <LogOut size={16} />
            Sign Out
          </button>
        </nav>
      </header>

      {/* Main Content Area */}
      <main style={{ flex: 1, padding: '1rem', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
        {children}
      </main>
    </div>
  );
};

export default StudentLayout;
