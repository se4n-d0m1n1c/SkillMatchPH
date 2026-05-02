import { motion } from 'framer-motion';
import { Users, GraduationCap, TrendingUp, AlertCircle } from 'lucide-react';

const ADMIN_STATS = [
  { label: 'Total Students', value: '1,284', icon: <Users />, color: 'var(--accent-teal)' },
  { label: 'Completed Assessments', value: '856', icon: <GraduationCap />, color: 'var(--accent-violet)' },
  { label: 'Active Sessions', value: '42', icon: <TrendingUp />, color: '#4ade80' },
  { label: 'Pending Reviews', value: '12', icon: <AlertCircle />, color: '#fbbf24' },
];

const AdminDashboard = () => {

  return (
    <div className="admin-dashboard">
      <header style={{ marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Dashboard Overview</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Welcome back, Administrator.</p>
      </header>

      <div className="stats-grid">
        {ADMIN_STATS.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="stat-card"
          >
            <div style={{ color: stat.color, marginBottom: '1rem' }}>{stat.icon}</div>
            <div className="stat-label">{stat.label}</div>
            <div className="stat-value">{stat.value}</div>
          </motion.div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
        <div className="glass-card" style={{ height: '300px' }}>
          <h3>Recent Activity</h3>
          {/* Placeholder for chart or activity list */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)' }}>
            Activity chart coming soon...
          </div>
        </div>
        <div className="glass-card" style={{ height: '300px' }}>
          <h3>System Status</h3>
          <div style={{ marginTop: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <span>Database</span>
              <span style={{ color: '#4ade80' }}>Online</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <span>Auth Service</span>
              <span style={{ color: '#4ade80' }}>Online</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>AI Engine</span>
              <span style={{ color: '#4ade80' }}>Online</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
