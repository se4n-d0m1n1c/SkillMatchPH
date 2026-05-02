import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GraduationCap, Target, User } from 'lucide-react';

// Hoisted to module level — not recreated on every render (rendering-hoist-jsx)
const DASHBOARD_CARDS = [
  { icon: <Target />, title: 'Career Assessment', desc: 'Take a quick test to find your ideal career paths.' },
  { icon: <GraduationCap />, title: 'Programs', desc: 'Explore general information about different college programs.' },
  { icon: <User />, title: 'Profile', desc: 'View and manage your personal information and progress.' },
];

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Derive name safely from split fields (bug fix: was using full_name)
  const firstName = user?.user_metadata?.first_name;
  const displayName = firstName || 'Student';

  const handleCardClick = (title) => {
    if (title === 'Profile') {
      navigate('/dashboard/profile');
    }
  };

  return (
    <div className="dashboard-container">

      <main>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{ marginBottom: '4rem' }}
        >
          <h2 style={{ fontSize: '3rem', fontWeight: 700, marginBottom: '1rem' }}>
            Hello, <span style={{ color: 'var(--accent-teal)' }}>{displayName}</span>!
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.25rem' }}>
            Ready to discover your career path today?
          </p>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
          {DASHBOARD_CARDS.map((card, i) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.1 }}
              className="glass-card"
              style={{ textAlign: 'left', cursor: 'pointer' }}
              whileHover={{ translateY: -10, borderColor: 'var(--accent-teal)' }}
              onClick={() => handleCardClick(card.title)}
            >
              <div style={{ color: 'var(--accent-teal)', marginBottom: '1rem' }}>{card.icon}</div>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{card.title}</h3>
              <p style={{ color: 'var(--text-secondary)' }}>{card.desc}</p>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
