import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { Mail, GraduationCap, BookOpen, Fingerprint, Activity, BookMarked } from 'lucide-react';

const StudentProfile = () => {
  const { user, profile } = useAuth();

  // Combine names safely using inline derivation (rerender-derived-state-no-effect)
  const firstName = user?.user_metadata?.first_name || '';
  const lastName = user?.user_metadata?.last_name || '';
  const fullName = `${firstName} ${lastName}`.trim() || 'Student';

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div style={{ padding: '2rem 0' }}>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: '3rem' }}
      >
        <h2 style={{ fontSize: '2.5rem', margin: 0, color: 'var(--text-primary)' }}>My Profile</h2>
        <p style={{ color: 'var(--text-secondary)' }}>View your personal information and academic details.</p>
      </motion.div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 2fr', gap: '2rem', alignItems: 'start' }}>
        
        {/* Profile Identity Card */}
        <motion.div className="glass-card" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '2rem 0' }}>
            <div style={{
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              background: 'var(--glass-bg)',
              border: '2px solid var(--accent-teal)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '3rem',
              color: 'var(--accent-teal)',
              marginBottom: '1.5rem',
              boxShadow: '0 0 20px rgba(0, 242, 254, 0.2)'
            }}>
              {firstName.charAt(0) || 'S'}
            </div>
            <h3 style={{ fontSize: '1.8rem', margin: '0 0 0.5rem 0' }}>{fullName}</h3>
            <span style={{ 
              background: 'rgba(0, 242, 254, 0.1)', 
              color: 'var(--accent-teal)', 
              padding: '0.25rem 1rem', 
              borderRadius: '999px',
              fontSize: '0.9rem',
              border: '1px solid rgba(0, 242, 254, 0.2)'
            }}>
              {profile?.role === 'student' ? 'Student Account' : 'Account'}
            </span>
          </div>
        </motion.div>

        {/* Details Grid */}
        <motion.div 
          className="glass-card" 
          variants={containerVariants} 
          initial="hidden" 
          animate="show"
        >
          <h4 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', color: 'var(--text-secondary)', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem' }}>
            Academic Information
          </h4>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
            
            <motion.div variants={itemVariants} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <div style={{ color: 'var(--accent-teal)', padding: '0.5rem', background: 'rgba(0,242,254,0.1)', borderRadius: '8px' }}>
                <Mail size={20} />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Email Address</p>
                <p style={{ margin: '0.25rem 0 0 0', fontWeight: 500 }}>{user?.email || 'N/A'}</p>
              </div>
            </motion.div>

            <motion.div variants={itemVariants} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <div style={{ color: 'var(--accent-teal)', padding: '0.5rem', background: 'rgba(0,242,254,0.1)', borderRadius: '8px' }}>
                <Fingerprint size={20} />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Student Number</p>
                <p style={{ margin: '0.25rem 0 0 0', fontWeight: 500 }}>{profile?.student_no || 'N/A'}</p>
              </div>
            </motion.div>

            <motion.div variants={itemVariants} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <div style={{ color: 'var(--accent-teal)', padding: '0.5rem', background: 'rgba(0,242,254,0.1)', borderRadius: '8px' }}>
                <GraduationCap size={20} />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Grade Level</p>
                <p style={{ margin: '0.25rem 0 0 0', fontWeight: 500 }}>{profile?.grade_level ? `Grade ${profile.grade_level}` : 'N/A'}</p>
              </div>
            </motion.div>

            <motion.div variants={itemVariants} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <div style={{ color: 'var(--accent-teal)', padding: '0.5rem', background: 'rgba(0,242,254,0.1)', borderRadius: '8px' }}>
                <BookOpen size={20} />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>SHS Track</p>
                <p style={{ margin: '0.25rem 0 0 0', fontWeight: 500 }}>{profile?.shs_track || 'N/A'}</p>
              </div>
            </motion.div>

            <motion.div variants={itemVariants} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <div style={{ color: 'var(--accent-teal)', padding: '0.5rem', background: 'rgba(0,242,254,0.1)', borderRadius: '8px' }}>
                <BookMarked size={20} />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>SHS Strand</p>
                <p style={{ margin: '0.25rem 0 0 0', fontWeight: 500 }}>{profile?.shs_strand || 'N/A'}</p>
              </div>
            </motion.div>

            <motion.div variants={itemVariants} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <div style={{ color: 'var(--accent-teal)', padding: '0.5rem', background: 'rgba(0,242,254,0.1)', borderRadius: '8px' }}>
                <Activity size={20} />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Account Status</p>
                <p style={{ margin: '0.25rem 0 0 0', fontWeight: 500, textTransform: 'capitalize' }}>
                  <span style={{
                    color: profile?.status === 'approved' ? '#4ade80' : 
                           profile?.status === 'rejected' ? '#ff4d4d' : '#fbbf24'
                  }}>
                    {profile?.status || 'Unknown'}
                  </span>
                </p>
              </div>
            </motion.div>

          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default StudentProfile;
