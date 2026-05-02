import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { XCircle, LogOut, Mail } from 'lucide-react';

const RejectedPage = () => {
  const { signOut, user } = useAuth();

  // Bug fix: was using full_name — now uses split fields
  const firstName = user?.user_metadata?.first_name;
  const lastName = user?.user_metadata?.last_name;
  const displayName = firstName ? `${firstName} ${lastName || ''}` : 'Student';

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
            background: 'rgba(255, 77, 77, 0.1)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto',
            color: '#ff4d4d'
          }}>
            <XCircle size={40} />
          </div>
        </motion.div>

        <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Account Rejected</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', lineHeight: '1.6' }}>
          Hello, <strong style={{ color: '#fff' }}>{displayName}</strong>.<br />
          We regret to inform you that your account application has been declined.
        </p>

        <div className="glass-card" style={{ background: 'rgba(255, 77, 77, 0.05)', border: '1px solid rgba(255, 77, 77, 0.1)', padding: '1.5rem', marginBottom: '2rem', textAlign: 'left' }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <Mail style={{ color: '#ff4d4d' }} size={24} />
            <div>
              <h4 style={{ margin: 0, fontSize: '0.9rem' }}>Contact Administrator</h4>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Please reach out to your school admin for details.</p>
            </div>
          </div>
        </div>

        <button
          onClick={signOut}
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

export default RejectedPage;
