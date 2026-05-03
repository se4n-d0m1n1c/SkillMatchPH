import { motion } from 'framer-motion';
import { Users, GraduationCap, BookOpen, AlertCircle, CheckCircle, Clock, RefreshCw } from 'lucide-react';
import useSWR from 'swr';
import { supabase } from '../../lib/supabase';

// ─── Module-level fetcher (stable reference, async-parallel) ─────────────────
// Fires both queries in parallel with Promise.all so they don't waterfall.
const fetchDashboardData = async () => {
  const [profilesResult, programsResult] = await Promise.all([
    supabase.from('profiles').select('*').eq('role', 'student'),
    supabase.from('programs').select('id', { count: 'exact', head: true }),
  ]);

  if (profilesResult.error) throw profilesResult.error;
  if (programsResult.error) throw programsResult.error;

  const students = profilesResult.data ?? [];
  const totalPrograms = programsResult.count ?? 0;

  // Derive all counts in a single pass (js-combine-iterations)
  let pending = 0, approved = 0;
  for (const s of students) {
    if (s.status === 'pending')  pending++;
    if (s.status === 'approved') approved++;
  }

  // Recent signups: sort descending by created_at, take 5 (js-tosorted-immutable)
  const recentSignups = students
    .toSorted((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 5);

  return { total: students.length, pending, approved, totalPrograms, recentSignups };
};

// ─── Hoisted static config (rendering-hoist-jsx) ─────────────────────────────
// Never recreated on re-render.

const STAT_CONFIG = [
  { key: 'total',         label: 'Total Students',    icon: Users,         color: 'var(--accent-teal)'   },
  { key: 'approved',      label: 'Approved Students', icon: CheckCircle,   color: '#4ade80'               },
  { key: 'pending',       label: 'Pending Reviews',   icon: AlertCircle,   color: '#fbbf24'               },
  { key: 'totalPrograms', label: 'Total Programs',    icon: BookOpen,      color: 'var(--accent-violet)'  },
];

const STATUS_COLORS = {
  pending:  '#fbbf24',
  approved: '#4ade80',
  rejected: '#ff4d4d',
};

// ─── Sub-components defined at module scope (rerender-no-inline-components) ──

const StatCard = ({ label, value, Icon, color, index, loading }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.08 }}
    className="stat-card"
    style={{ position: 'relative', overflow: 'hidden' }}
  >
    {/* Accent glow */}
    <div style={{
      position: 'absolute', top: '-20px', right: '-20px',
      width: '80px', height: '80px', borderRadius: '50%',
      background: color, opacity: 0.06, filter: 'blur(20px)',
      pointerEvents: 'none',
    }} />

    <div style={{ color, marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <Icon size={22} />
    </div>
    <div className="stat-label">{label}</div>
    <div className="stat-value" style={{ color, fontSize: '2.2rem' }}>
      {loading ? (
        <span style={{ fontSize: '1.2rem', color: 'var(--text-secondary)' }}>—</span>
      ) : (
        value ?? 0
      )}
    </div>
  </motion.div>
);

const RecentSignupRow = ({ student, index }) => {
  const fullName = [student.first_name, student.last_name].filter(Boolean).join(' ') || 'Unknown';
  const initials = fullName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
  const statusColor = STATUS_COLORS[student.status] ?? '#fbbf24';
  const joinedDate  = student.created_at
    ? new Date(student.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
    : 'N/A';

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.06 }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        padding: '0.85rem 0',
        borderBottom: '1px solid var(--glass-border)',
      }}
    >
      {/* Avatar */}
      <div style={{
        width: '38px', height: '38px', borderRadius: '50%', flexShrink: 0,
        background: 'rgba(0,242,254,0.1)', border: '1px solid rgba(0,242,254,0.2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-teal)',
      }}>
        {initials}
      </div>

      {/* Name + date */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontWeight: 600, fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {fullName}
        </p>
        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          <Clock size={11} /> {joinedDate}
        </p>
      </div>

      {/* Status badge */}
      <span style={{
        padding: '0.2rem 0.65rem', borderRadius: '99px', fontSize: '0.7rem',
        textTransform: 'capitalize', fontWeight: 600,
        background: `${statusColor}18`, color: statusColor,
      }}>
        {student.status ?? 'pending'}
      </span>
    </motion.div>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────

const AdminDashboard = () => {
  const { data, error, isLoading, mutate } = useSWR('admin-dashboard', fetchDashboardData, {
    // Revalidate every 60s so the dashboard stays reasonably fresh without hammering Supabase.
    refreshInterval: 60_000,
  });

  const stats = STAT_CONFIG.map(({ key, label, icon: Icon, color }, i) => ({
    label, Icon, color, index: i,
    value: data ? data[key] : null,
  }));

  return (
    <div className="admin-dashboard">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '3rem' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Dashboard Overview</h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            {error
              ? 'Failed to load data — check your connection.'
              : 'Welcome back, Administrator.'}
          </p>
        </div>

        <button
          onClick={() => mutate()}
          className="refresh-btn"
          title="Refresh dashboard"
          aria-label="Refresh dashboard data"
        >
          <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
        </button>
      </header>

      {/* ── Stat cards ── */}
      <div className="stats-grid">
        {stats.map(({ label, Icon, color, index, value }) => (
          <StatCard
            key={label}
            label={label}
            value={value}
            Icon={Icon}
            color={color}
            index={index}
            loading={isLoading}
          />
        ))}
      </div>

      {/* ── Lower section ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>

        {/* Recent signups */}
        <div className="glass-card">
          <h3 style={{ marginTop: 0, marginBottom: '0.5rem', fontSize: '1.1rem' }}>Recent Student Signups</h3>
          <p style={{ margin: '0 0 1rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Last 5 registrations</p>

          {/* Use ternary, not && (rendering-conditional-render) */}
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Loading…
            </div>
          ) : error ? (
            <div style={{ textAlign: 'center', padding: '3rem 0', color: '#ff4d4d', fontSize: '0.9rem' }}>
              Could not load recent signups.
            </div>
          ) : data?.recentSignups.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              No students registered yet.
            </div>
          ) : (
            <div>
              {data.recentSignups.map((student, i) => (
                <RecentSignupRow key={student.id} student={student} index={i} />
              ))}
            </div>
          )}
        </div>

        {/* Status breakdown */}
        <div className="glass-card">
          <h3 style={{ marginTop: 0, marginBottom: '1.5rem', fontSize: '1.1rem' }}>Status Breakdown</h3>

          {isLoading ? (
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Loading…</div>
          ) : (
            <>
              {[
                { label: 'Approved', count: data?.approved ?? 0, color: '#4ade80' },
                { label: 'Pending',  count: data?.pending  ?? 0, color: '#fbbf24' },
                {
                  label: 'Rejected',
                  count: (data?.total ?? 0) - (data?.approved ?? 0) - (data?.pending ?? 0),
                  color: '#ff4d4d',
                },
              ].map(({ label, count, color }) => {
                const pct = data?.total ? Math.round((count / data.total) * 100) : 0;
                return (
                  <div key={label} style={{ marginBottom: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.85rem' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
                      <span style={{ fontWeight: 600, color }}>{count} <span style={{ color: 'var(--text-secondary)', fontWeight: 400 }}>({pct}%)</span></span>
                    </div>
                    {/* Progress bar */}
                    <div style={{ height: '6px', borderRadius: '99px', background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        style={{ height: '100%', borderRadius: '99px', background: color }}
                      />
                    </div>
                  </div>
                );
              })}

              <div style={{
                marginTop: '2rem', paddingTop: '1rem',
                borderTop: '1px solid var(--glass-border)',
                fontSize: '0.8rem', color: 'var(--text-secondary)',
                display: 'flex', alignItems: 'center', gap: '0.4rem',
              }}>
                <GraduationCap size={14} />
                {data?.totalPrograms ?? 0} available programs
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
