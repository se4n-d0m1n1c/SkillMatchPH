import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Building, BookOpen, Settings, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import '../../styles/Admin.css';

const AdminLayout = ({ children }) => {
  const { signOut } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close sidebar when route changes on mobile
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Prevent scroll when sidebar is open on mobile
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [sidebarOpen]);

  const menuItems = [
    { icon: <LayoutDashboard size={20} />, label: 'Overview', path: '/admin' },
    { icon: <Users size={20} />, label: 'Students', path: '/admin/students' },
    { icon: <Building size={20} />, label: 'Universities', path: '/admin/universities' },
    { icon: <BookOpen size={20} />, label: 'Programs', path: '/admin/programs' },
    { icon: <Settings size={20} />, label: 'Settings', path: '/admin/settings' },
  ];

  return (
    <div className="admin-layout">
      {/* Mobile Header */}
      <header className="mobile-header">
        <button 
          className="menu-toggle" 
          onClick={() => setSidebarOpen(true)}
          aria-label="Open menu"
        >
          <Menu size={24} />
        </button>
        <svg viewBox="0 0 440 90" width="150" height="31" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="gd_admin_mobile" x1="0" y1="1" x2="1" y2="0">
              <stop offset="0%" stop-color="#7C3AED"/>
              <stop offset="100%" stop-color="#06B6D4"/>
            </linearGradient>
          </defs>
          <rect x="0" y="0" width="90" height="90" rx="20" fill="url(#gd_admin_mobile)"/>
          <path d="M22,70 C30,40 60,56 68,22" stroke="white" stroke-width="2.5" fill="none" opacity="0.3" stroke-linecap="round"/>
          <circle cx="22" cy="70" r="7.5" fill="white"/>
          <circle cx="45" cy="49" r="5.5" fill="white" opacity="0.65"/>
          <circle cx="68" cy="22" r="10" fill="white"/>
          <circle cx="68" cy="22" r="16" stroke="white" stroke-width="1.5" fill="none" opacity="0.18"/>
          <text x="110" y="60" font-family="Inter, -apple-system, sans-serif" font-size="44" font-weight="700" fill="white" letter-spacing="-1">SkillMatch<tspan fill="#06B6D4" font-size="28" font-weight="600" dy="-8" letter-spacing="0">PH</tspan></text>
        </svg>
      </header>

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="sidebar-overlay" 
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="admin-logo">
            <svg viewBox="0 0 440 90" width="200" height="41" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="gd_admin_sidebar" x1="0" y1="1" x2="1" y2="0">
                  <stop offset="0%" stop-color="#7C3AED"/>
                  <stop offset="100%" stop-color="#06B6D4"/>
                </linearGradient>
              </defs>
              <rect x="0" y="0" width="90" height="90" rx="20" fill="url(#gd_admin_sidebar)"/>
              <path d="M22,70 C30,40 60,56 68,22" stroke="white" stroke-width="2.5" fill="none" opacity="0.3" stroke-linecap="round"/>
              <circle cx="22" cy="70" r="7.5" fill="white"/>
              <circle cx="45" cy="49" r="5.5" fill="white" opacity="0.65"/>
              <circle cx="68" cy="22" r="10" fill="white"/>
              <circle cx="68" cy="22" r="16" stroke="white" stroke-width="1.5" fill="none" opacity="0.18"/>
              <text x="110" y="60" font-family="Inter, -apple-system, sans-serif" font-size="44" font-weight="700" fill="white" letter-spacing="-1">SkillMatch<tspan fill="#06B6D4" font-size="28" font-weight="600" dy="-8" letter-spacing="0">PH</tspan></text>
            </svg>
          </div>
          <button 
            className="sidebar-close" 
            onClick={() => setSidebarOpen(false)}
            aria-label="Close menu"
          >
            <X size={24} />
          </button>
        </div>
        
        <nav className="nav-links">
          {menuItems.map((item) => (
            <Link 
              key={item.path} 
              to={item.path} 
              className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button 
            onClick={async () => {
              await signOut();
            }} 
            className="signout-btn" 
          >
            <LogOut size={20} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      <main className="admin-main">
        {children}
      </main>
    </div>
  );
};

export default AdminLayout;
