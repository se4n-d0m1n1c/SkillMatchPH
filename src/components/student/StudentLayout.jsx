import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { GraduationCap, Menu, X, LayoutDashboard, User, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

// Hoisted navigation map to avoid recreating on each render (rendering-hoist-jsx)
const NAV_LINKS = [
  { path: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
  { path: '/dashboard/programs', label: 'Programs', icon: <GraduationCap size={18} /> },
  { path: '/dashboard/profile', label: 'Profile', icon: <User size={18} /> },
];

const StudentLayout = ({ children }) => {
  const { signOut } = useAuth();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const renderNavLinks = (isMobile = false) => (
    <>
      <div style={{ display: 'flex', gap: '0.5rem', flexDirection: isMobile ? 'column' : 'row', width: isMobile ? '100%' : 'auto' }}>
        {NAV_LINKS.map((link) => {
          const isActive = location.pathname === link.path;
          return (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => isMobile && setIsMenuOpen(false)}
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

      <button 
        onClick={() => {
          if (isMobile) setIsMenuOpen(false);
          signOut();
        }} 
        className="signout-btn" 
        style={{ padding: '0.5rem 1rem', width: isMobile ? '100%' : 'auto', justifyContent: isMobile ? 'flex-start' : 'center' }}
      >
        <LogOut size={16} />
        Sign Out
      </button>
    </>
  );

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Navigation Bar */}
      <header className="glass-card" style={{ 
        margin: '1rem', 
        padding: '1rem', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        flexWrap: 'wrap',
        position: 'sticky',
        top: '1rem',
        zIndex: 50,
        borderRadius: '16px',
        boxSizing: 'border-box'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <Link to="/dashboard" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
              <svg viewBox="0 0 440 90" width="180" height="37" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="gd_nav" x1="0" y1="1" x2="1" y2="0">
                    <stop offset="0%" stop-color="#7C3AED"/>
                    <stop offset="100%" stop-color="#06B6D4"/>
                  </linearGradient>
                </defs>
                <rect x="0" y="0" width="90" height="90" rx="20" fill="url(#gd_nav)"/>
                <path d="M22,70 C30,40 60,56 68,22" stroke="white" stroke-width="2.5" fill="none" opacity="0.3" stroke-linecap="round"/>
                <circle cx="22" cy="70" r="7.5" fill="white"/>
                <circle cx="45" cy="49" r="5.5" fill="white" opacity="0.65"/>
                <circle cx="68" cy="22" r="10" fill="white"/>
                <circle cx="68" cy="22" r="16" stroke="white" stroke-width="1.5" fill="none" opacity="0.18"/>
                <text x="110" y="60" font-family="Inter, -apple-system, sans-serif" font-size="44" font-weight="700" fill="white" letter-spacing="-1">SkillMatch<tspan fill="#06B6D4" font-size="28" font-weight="600" dy="-8" letter-spacing="0">PH</tspan></text>
              </svg>
            </Link>
          </motion.div>

          {/* Hamburger Button (Mobile Only) */}
          <button className="mobile-menu-btn" onClick={toggleMenu}>
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          {/* Desktop Nav */}
          <nav className="desktop-nav">
            {renderNavLinks()}
          </nav>
        </div>

        {/* Mobile Nav Dropdown */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.nav 
              initial={{ height: 0, opacity: 0, overflow: 'hidden' }}
              animate={{ height: 'auto', opacity: 1, overflow: 'hidden' }}
              exit={{ height: 0, opacity: 0, overflow: 'hidden' }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="mobile-nav-menu open"
            >
              {renderNavLinks(true)}
            </motion.nav>
          )}
        </AnimatePresence>
      </header>

      {/* Main Content Area */}
      <main style={{ flex: 1, padding: '1rem', maxWidth: '1200px', margin: '0 auto', width: '100%', boxSizing: 'border-box', overflowX: 'hidden' }}>
        {children}
      </main>
    </div>
  );
};

export default StudentLayout;
