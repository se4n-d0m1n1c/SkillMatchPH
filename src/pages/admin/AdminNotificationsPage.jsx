import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AtSign, Bell, CheckCheck, Loader2, MessageCircleQuestion, UserPen, UserPlus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import '../../styles/Admin.css';

const PAGE_SIZE = 25;

const FILTERS = [
  { key: 'all', label: 'All', icon: <Bell size={16} /> },
  { key: 'student_registration', label: 'Registrations', icon: <UserPlus size={16} /> },
  { key: 'student_profile_updated', label: 'Profile Updates', icon: <UserPen size={16} /> },
  { key: 'student_username_changed', label: 'Username Changes', icon: <AtSign size={16} /> },
  { key: 'admin_contact_requested', label: 'Contact Requests', icon: <MessageCircleQuestion size={16} /> },
];

const formatChangedFields = (fields = []) => {
  if (fields.length === 0) return 'their profile information';
  if (fields.length === 1) return `their ${fields[0]}`;
  if (fields.length === 2) return `their ${fields[0]} and ${fields[1]}`;
  return `their ${fields.slice(0, -1).join(', ')}, and ${fields.at(-1)}`;
};

const formatTime = (date, full = false) => {
  if (!date) return '';
  const created = new Date(date);
  if (full) {
    return new Intl.DateTimeFormat('en-PH', {
      year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
    }).format(created);
  }
  const seconds = Math.floor((Date.now() - created.getTime()) / 1000);
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return created.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
};

const itemMeta = (item) => {
  const name = [item.student?.first_name, item.student?.last_name].filter(Boolean).join(' ') || 'A student';
  const isRegistration = item.type === 'student_registration';
  const isContactRequest = item.type === 'admin_contact_requested';
  const isUsernameChange = item.type === 'student_username_changed';

  let icon = <UserPen size={18} />;
  let title = 'Student profile updated';
  let detail = `${name} changed ${formatChangedFields(item.changed_fields)}.`;
  let destination = `/admin/students?student=${encodeURIComponent(item.student_id)}`;
  let state = { highlightStudentId: item.student_id };

  if (isContactRequest) {
    icon = <MessageCircleQuestion size={18} />;
    title = 'Administrator contact requested';
    detail = `${name} requested password assistance.`;
    destination = `/admin/requests?student=${encodeURIComponent(item.student_id)}`;
    state = { highlightRequestStudentId: item.student_id };
  } else if (isRegistration) {
    icon = <UserPlus size={18} />;
    title = 'New student registration';
    detail = `${name} submitted an account for review.`;
  } else if (isUsernameChange) {
    icon = <AtSign size={18} />;
    title = 'Student username changed';
    detail = `${name} changed their login username.`;
  }

  return { name, icon, title, detail, destination, state };
};

const AdminNotificationsPage = () => {
  const { user } = useAuth();
  const storageKey = `skillmatch-admin-notifications-read:${user?.id ?? 'admin'}`;
  const [lastReadAt, setLastReadAt] = useState(() => localStorage.getItem(storageKey));
  const [filter, setFilter] = useState('all');
  const [items, setItems] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const listRef = useRef(null);

  useEffect(() => {
    setLastReadAt(localStorage.getItem(storageKey));
  }, [storageKey]);

  const loadPage = async (reset) => {
    const current = reset ? [] : items;
    const startIndex = reset ? 0 : current.length;
    const endIndex = startIndex + PAGE_SIZE - 1;

    let query = supabase
      .from('admin_notifications')
      .select('id, type, student_id, changed_fields, created_at, student:profiles!student_id(first_name, last_name)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(startIndex, endIndex);

    if (filter !== 'all') query = query.eq('type', filter);

    const { data, count, error: loadError } = await query;

    if (loadError) {
      setError('Could not load notifications.');
      setLoading(false);
      setLoadingMore(false);
      return;
    }

    const next = reset ? (data ?? []) : [...current, ...(data ?? [])];
    setItems(next);
    setHasMore((data?.length ?? 0) === PAGE_SIZE && (count ?? next.length) > next.length);
    setError('');
    setLoading(false);
    setLoadingMore(false);
  };

  useEffect(() => {
    setLoading(true);
    loadPage(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  useEffect(() => {
    const channel = supabase
      .channel(`admin-notifications-page-${user?.id ?? 'anonymous'}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'admin_notifications' },
        () => loadPage(false),
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, items.length]);

  const unreadCount = useMemo(() => {
    if (!lastReadAt) return items.length;
    const readTime = new Date(lastReadAt).getTime();
    return items.filter((item) => new Date(item.created_at).getTime() > readTime).length;
  }, [lastReadAt, items]);

  const markAllRead = () => {
    const now = new Date().toISOString();
    localStorage.setItem(storageKey, now);
    setLastReadAt(now);
  };

  return (
    <div className="admin-page">
      <header className="page-header">
        <div>
          <h1 style={{ margin: 0 }}>Notifications</h1>
          <p style={{ color: 'var(--text-secondary)', margin: '1rem 0 0', fontSize: '1.1rem' }}>
            Monitor account and profile activity across the platform.
          </p>
        </div>
        {unreadCount > 0 ? (
          <button type="button" className="refresh-btn mark-read-btn" onClick={markAllRead}>
            <CheckCheck size={18} /> Mark all read
          </button>
        ) : null}
      </header>

      <div className="notification-filters" role="tablist" aria-label="Filter notifications">
        {FILTERS.map(({ key, label, icon }) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={filter === key}
            className={`notification-filter ${filter === key ? 'active' : ''}`}
            onClick={() => setFilter(key)}
          >
            {icon} {label}
          </button>
        ))}
      </div>

      <div className="notification-feed" ref={listRef}>
        {loading ? (
          <div className="notification-state loading-state"><Loader2 className="animate-spin" size={22} /> Loading activity…</div>
        ) : error ? (
          <div className="notification-state error">{error}</div>
        ) : items.length === 0 ? (
          <div className="notification-state">No activity here yet.</div>
        ) : (
          <ul className="notification-feed-list">
            {items.map((item) => {
              const meta = itemMeta(item);
              const isUnread = !lastReadAt || new Date(item.created_at) > new Date(lastReadAt);
              return (
                <li key={item.id}>
                  <Link
                    to={meta.destination}
                    state={meta.state}
                    className={`notification-item ${isUnread ? 'unread' : ''}`}
                  >
                    <span className="notification-icon">{meta.icon}</span>
                    <span className="notification-copy">
                      <strong>{meta.title}</strong>
                      <span>{meta.detail}</span>
                      <time dateTime={item.created_at} title={formatTime(item.created_at, true)}>
                        {formatTime(item.created_at)}
                      </time>
                    </span>
                    {isUnread ? <span className="unread-dot" aria-label="Unread" /> : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}

        {hasMore && !loading ? (
          <button
            type="button"
            className="refresh-btn load-more-btn"
            onClick={() => { setLoadingMore(true); loadPage(false); }}
            disabled={loadingMore}
          >
            {loadingMore ? <Loader2 className="animate-spin" size={18} /> : <Bell size={18} />}
            {loadingMore ? 'Loading…' : 'Load more'}
          </button>
        ) : null}
      </div>
    </div>
  );
};

export default AdminNotificationsPage;
