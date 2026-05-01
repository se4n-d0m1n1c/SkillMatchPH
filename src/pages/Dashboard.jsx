import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { LogOut, BookOpen, Target, Sparkles } from 'lucide-react';

const Dashboard = () => {
  const { user, signOut } = useAuth();

  return (
    <div className="dashboard-container" style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4rem' }}>
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <h1 style={{ fontSize: '2rem', margin: 0 }}>SkillMatchPH</h1>
        </motion.div>
        
        <button 
          onClick={() => signOut()}
          className="social-btn" 
          style={{ gap: '0.5rem', padding: '0.5rem 1rem' }}
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </header>

      <main>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{ marginBottom: '4rem' }}
        >
          <h2 style={{ fontSize: '3rem', fontWeight: 700, marginBottom: '1rem' }}>
            Hello, <span style={{ color: 'var(--accent-teal)' }}>{user?.user_metadata?.full_name || 'Student'}</span>!
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.25rem' }}>
            Ready to discover your career path today?
          </p>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
          {[
            { icon: <Target />, title: 'Career Assessment', desc: 'Take a quick test to find your ideal career paths.' },
            { icon: <BookOpen />, title: 'Skill Roadmap', desc: 'See what skills you need for your dream job.' },
            { icon: <Sparkles />, title: 'AI Recommendations', desc: 'Personalized suggestions based on your profile.' },
          ].map((card, i) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.1 }}
              className="glass-card"
              style={{ textAlign: 'left', cursor: 'pointer' }}
              whileHover={{ translateY: -10, borderColor: 'var(--accent-teal)' }}
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
