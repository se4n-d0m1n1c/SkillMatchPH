import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Building, BookOpen, UserPlus, LogOut, Menu, X, ClipboardList, ChartNoAxesCombined, MessagesSquare, UserCog, Bell } from 'lucide-react';
import useSWR from 'swr';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import AdminNotifications from './AdminNotifications';
import '../../styles/Admin.css';

const fetchOpenRequestCount = async () => {
  const { count, error } = await supabase
    .from('admin_contact_requests')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'open');

  if (error) return 0;
  return count ?? 0;
};

const fetchUnreadNotificationCount = async ([, userId, readRevision]) => {
  const lastReadAt = localStorage.getItem(`skillmatch-admin-notifications-read:${userId}`);
  let query = supabase
    .from('admin_notifications')
    .select('id', { count: 'exact', head: true });

  if (lastReadAt) query = query.gt('created_at', lastReadAt);
  const { count, error } = await query;
  if (error) return 0;
  void readRevision;
  return count ?? 0;
};

const AdminLayout = ({ children }) => {
  const { signOut, user } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationReadRevision, setNotificationReadRevision] = useState(0);
  const { data: openRequestCount = 0, mutate: refreshRequestCount } = useSWR(
    'admin-open-contact-request-count',
    fetchOpenRequestCount,
    { refreshInterval: 30_000 },
  );
  const { data: unreadNotificationCount = 0, mutate: refreshNotificationCount } = useSWR(
    user ? ['admin-unread-notification-count', user.id, notificationReadRevision] : null,
    fetchUnreadNotificationCount,
    { refreshInterval: 30_000 },
  );

  // Close sidebar when route changes on mobile
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const channel = supabase
      .channel('admin-sidebar-activity-counts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'admin_contact_requests' }, () => refreshRequestCount())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'admin_notifications' }, () => refreshNotificationCount())
      .subscribe();

    const refreshReadState = () => setNotificationReadRevision((current) => current + 1);
    window.addEventListener('admin-notifications-read', refreshReadState);
    window.addEventListener('storage', refreshReadState);

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener('admin-notifications-read', refreshReadState);
      window.removeEventListener('storage', refreshReadState);
    };
  }, [refreshRequestCount, refreshNotificationCount]);

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
    { icon: <ClipboardList size={20} />, label: 'Assessments', path: '/admin/assessments' },
    { icon: <ChartNoAxesCombined size={20} />, label: 'Reports', path: '/admin/reports' },
    { icon: <Bell size={20} />, label: 'Notifications', path: '/admin/notifications' },
    { icon: <MessagesSquare size={20} />, label: 'Contact Requests', path: '/admin/requests' },
    { icon: <UserPlus size={20} />, label: 'Admin Invites', path: '/admin/invites' },
    { icon: <UserCog size={20} />, label: 'My Profile', path: '/admin/profile' },
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
          <text className="brand-logo-text" x="110" y="60" fontFamily="Inter, -apple-system, sans-serif" fontSize="44" fontWeight="700" letterSpacing="-1">SkillMatch<tspan fill="var(--accent-teal)" fontSize="28" fontWeight="600" dy="-8" letterSpacing="0">PH</tspan></text>
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
              <text className="brand-logo-text" x="110" y="60" fontFamily="Inter, -apple-system, sans-serif" fontSize="44" fontWeight="700" letterSpacing="-1">SkillMatch<tspan fill="var(--accent-teal)" fontSize="28" fontWeight="600" dy="-8" letterSpacing="0">PH</tspan></text>
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
              {item.path === '/admin/notifications' && unreadNotificationCount > 0 ? (
                <span className="nav-request-badge nav-notification-badge" aria-label={`${unreadNotificationCount} unread notifications`}>
                  {unreadNotificationCount > 99 ? '99+' : unreadNotificationCount}
                </span>
              ) : item.path === '/admin/requests' && openRequestCount > 0 ? (
                <span className="nav-request-badge" aria-label={`${openRequestCount} open contact requests`}>
                  {openRequestCount > 99 ? '99+' : openRequestCount}
                </span>
              ) : null}
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
        <div className="admin-topbar">
          <AdminNotifications />
        </div>
        {children}
      </main>
    </div>
  );
};

export default AdminLayout;
