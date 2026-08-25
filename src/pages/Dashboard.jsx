import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
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
  const [hollandCode, setHollandCode] = useState(null);

  useEffect(() => {
    let isCurrent = true;
    setHollandCode(null);

    const loadAssessmentStatus = async () => {
      if (user?.id) {
        const { data, error } = await supabase
          .from('assessment_attempts')
          .select('result')
          .eq('user_id', user.id)
          .order('completed_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!error && data?.result?.code && isCurrent) {
          setHollandCode(data.result.code);
          return;
        }
      }

      // Support assessment results saved before database persistence was introduced.
      try {
        const raw = localStorage.getItem(`skillmatch_assessment_${user?.id || 'guest'}`);
        const parsed = raw ? JSON.parse(raw) : null;
        if (parsed?.hollandCode && isCurrent) setHollandCode(parsed.hollandCode);
      } catch {
        // ignore
      }
    };

    loadAssessmentStatus();
    return () => { isCurrent = false; };
  }, [user?.id]);

  // Derive name safely from split fields (bug fix: was using full_name)
  const firstName = user?.user_metadata?.first_name;
  const displayName = firstName || 'Student';

  const handleCardClick = (title) => {
    if (title === 'Profile') {
      navigate('/dashboard/profile');
    } else if (title === 'Programs') {
      navigate('/dashboard/programs');
    } else if (title === 'Career Assessment') {
      navigate('/dashboard/assessment');
    }
  };

  return (
    <div className="student-page dashboard-container">

      <main>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{ marginBottom: '4rem' }}
        >
          <h2 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 700, marginBottom: '1rem', wordBreak: 'break-word' }}>
            Hello, <span style={{ color: 'var(--accent-teal)' }}>{displayName}</span>!
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.25rem' }}>
            Ready to discover your career path today?
          </p>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem' }}>
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
              {card.title === 'Career Assessment' && hollandCode && (
                <div style={{ marginTop: '1rem' }}>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.25rem 0.65rem',
                    borderRadius: '6px',
                    background: 'rgba(0, 245, 255, 0.15)',
                    border: '1px solid rgba(0, 245, 255, 0.3)',
                    color: 'var(--accent-teal)',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    fontFamily: 'monospace'
                  }}>
                    Code: {hollandCode} • Completed
                  </span>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
