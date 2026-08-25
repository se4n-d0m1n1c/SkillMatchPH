import { useEffect, useMemo, useRef, useState } from 'react';
import { Bell, CheckCheck, UserPlus } from 'lucide-react';
import { Link } from 'react-router-dom';
import useSWR from 'swr';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

const fetchNotifications = async () => {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, status, created_at')
    .eq('role', 'student')
    .order('created_at', { ascending: false })
    .limit(15);

  if (error) throw error;
  return data ?? [];
};

const formatTime = (date) => {
  if (!date) return '';

  const created = new Date(date);
  const seconds = Math.floor((Date.now() - created.getTime()) / 1000);
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return created.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
};

const AdminNotifications = () => {
  const { user } = useAuth();
  const panelRef = useRef(null);
  const [open, setOpen] = useState(false);
  const storageKey = `skillmatch-admin-notifications-read:${user?.id ?? 'admin'}`;
  const [lastReadAt, setLastReadAt] = useState(() => localStorage.getItem(storageKey));
  const { data: notifications = [], error, isLoading, mutate } = useSWR(
    user ? ['admin-notifications', user.id] : null,
    fetchNotifications,
    { refreshInterval: 30_000 },
  );

  useEffect(() => {
    setLastReadAt(localStorage.getItem(storageKey));
  }, [storageKey]);

  useEffect(() => {
    const channel = supabase
      .channel(`admin-notifications-${user?.id ?? 'anonymous'}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'profiles', filter: 'role=eq.student' },
        () => mutate(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [mutate, user?.id]);

  useEffect(() => {
    const closePanel = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) setOpen(false);
    };
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', closePanel);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('mousedown', closePanel);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, []);

  const unreadCount = useMemo(() => {
    if (!lastReadAt) return notifications.length;
    const readTime = new Date(lastReadAt).getTime();
    return notifications.filter((item) => new Date(item.created_at).getTime() > readTime).length;
  }, [lastReadAt, notifications]);

  const markAllRead = () => {
    const now = new Date().toISOString();
    localStorage.setItem(storageKey, now);
    setLastReadAt(now);
  };

  const togglePanel = () => {
    setOpen((current) => !current);
  };

  return (
    <div className="admin-notifications" ref={panelRef}>
      <button
        type="button"
        className="notification-bell"
        onClick={togglePanel}
        aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}
        aria-expanded={open}
      >
        <Bell size={20} />
        {unreadCount > 0 ? (
          <span className="notification-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
        ) : null}
      </button>

      {open ? (
        <section className="notification-panel" aria-label="Admin notifications">
          <div className="notification-panel-header">
            <div>
              <h2>Notifications</h2>
              <p>{unreadCount ? `${unreadCount} unread` : 'You’re all caught up'}</p>
            </div>
            {unreadCount > 0 ? (
              <button type="button" className="mark-read-btn" onClick={markAllRead}>
                <CheckCheck size={15} /> Mark all read
              </button>
            ) : null}
          </div>

          <div className="notification-list">
            {isLoading ? (
              <p className="notification-state">Loading notifications…</p>
            ) : error ? (
              <p className="notification-state error">Could not load notifications.</p>
            ) : notifications.length === 0 ? (
              <p className="notification-state">No notifications yet.</p>
            ) : (
              notifications.map((item) => {
                const name = [item.first_name, item.last_name].filter(Boolean).join(' ') || 'A student';
                const isUnread = !lastReadAt || new Date(item.created_at) > new Date(lastReadAt);

                return (
                  <Link
                    key={item.id}
                    to="/admin/students"
                    className={`notification-item ${isUnread ? 'unread' : ''}`}
                    onClick={() => {
                      markAllRead();
                      setOpen(false);
                    }}
                  >
                    <span className="notification-icon"><UserPlus size={18} /></span>
                    <span className="notification-copy">
                      <strong>New student registration</strong>
                      <span>{name} submitted an account for review.</span>
                      <time dateTime={item.created_at}>{formatTime(item.created_at)}</time>
                    </span>
                    {isUnread ? <span className="unread-dot" aria-label="Unread" /> : null}
                  </Link>
                );
              })
            )}
          </div>

          <Link to="/admin/students" className="notification-footer" onClick={() => setOpen(false)}>
            View student applications
          </Link>
        </section>
      ) : null}
    </div>
  );
};

export default AdminNotifications;
