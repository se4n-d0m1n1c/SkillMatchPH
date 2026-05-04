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
        <span className="mobile-brand">SkillMatch Admin</span>
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
            <h2 style={{ color: 'var(--accent-teal)', margin: 0 }}>SkillMatch Admin</h2>
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
