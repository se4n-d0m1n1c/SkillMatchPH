import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Clock, LogOut, ShieldCheck } from 'lucide-react';

const PendingPage = () => {
  const { signOut, user } = useAuth();

  return (
    <div className="auth-page">
      <div className="glass-card" style={{ maxWidth: '500px', textAlign: 'center', padding: '3rem' }}>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          style={{ marginBottom: '2rem' }}
        >
          <div style={{
            width: '80px',
            height: '80px',
            background: 'rgba(251, 191, 36, 0.1)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto',
            color: '#fbbf24',
            position: 'relative'
          }}>
            <Clock size={40} />
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              style={{ position: 'absolute', width: '100%', height: '100%', border: '2px dashed #fbbf24', borderRadius: '50%', opacity: 0.3 }}
            />
          </div>
        </motion.div>

        <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Account Under Review</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', lineHeight: '1.6' }}>
          Hello, <strong style={{ color: '#fff' }}>{user?.user_metadata?.first_name + ' ' + user?.user_metadata?.last_name || 'Student'}</strong>!<br />
          Your account is currently pending approval by our administrators. We want to ensure everyone on SkillMatchPH is a verified student.
        </p>

        <div className="glass-card" style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', marginBottom: '2rem', textAlign: 'left' }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <ShieldCheck style={{ color: 'var(--accent-teal)' }} size={24} />
            <div>
              <h4 style={{ margin: 0, fontSize: '0.9rem' }}>Verification in progress</h4>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Usually takes less than 24 hours.</p>
            </div>
          </div>
        </div>

        <button
          onClick={() => signOut()}
          className="signout-btn"
          style={{ width: '100%', justifyContent: 'center' }}
        >
          <LogOut size={20} />
          Sign Out & Return Home
        </button>
      </div>
    </div>
  );
};

export default PendingPage;
