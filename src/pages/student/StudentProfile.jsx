import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { Mail, GraduationCap, BookOpen, Fingerprint, Activity, BookMarked } from 'lucide-react';

// 1. Hoist static animation variants to module scope to prevent recreation on re-render (rendering-hoist-jsx)
const CONTAINER_VARIANTS = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const ITEM_VARIANTS = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

// 2. Hoist static mapping configuration for rendering to reduce JSX bloat inside the component (rendering-hoist-jsx)
const PROFILE_FIELDS = [
  { id: 'email', icon: <Mail size={20} />, label: 'Email Address', getValue: (user, _) => user?.email, isEmail: true },
  { id: 'studentNo', icon: <Fingerprint size={20} />, label: 'Student Number', getValue: (_, profile) => profile?.student_no },
  { id: 'grade', icon: <GraduationCap size={20} />, label: 'Grade Level', getValue: (_, profile) => profile?.grade_level ? `Grade ${profile.grade_level}` : null },
  { id: 'track', icon: <BookOpen size={20} />, label: 'SHS Track', getValue: (_, profile) => profile?.shs_track },
  { id: 'strand', icon: <BookMarked size={20} />, label: 'SHS Strand', getValue: (_, profile) => profile?.shs_strand },
  { id: 'status', icon: <Activity size={20} />, label: 'Account Status', getValue: (_, profile) => profile?.status, isStatus: true },
];

const StudentProfile = () => {
  const { user, profile } = useAuth();

  // 3. Combine names safely using inline derivation, avoiding unnecessary useEffect (rerender-derived-state-no-effect)
  const firstName = user?.user_metadata?.first_name || '';
  const lastName = user?.user_metadata?.last_name || '';
  const fullName = `${firstName} ${lastName}`.trim() || 'Student';

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

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', alignItems: 'flex-start' }}>
        
        {/* Profile Identity Card */}
        <motion.div className="glass-card" style={{ flex: '1 1 300px' }} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
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
          style={{ flex: '2 1 400px' }}
          variants={CONTAINER_VARIANTS} 
          initial="hidden" 
          animate="show"
        >
          <h4 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', color: 'var(--text-secondary)', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem' }}>
            Academic Information
          </h4>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
            {PROFILE_FIELDS.map((field) => {
              const value = field.getValue(user, profile);
              return (
                <motion.div key={field.id} variants={ITEM_VARIANTS} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <div style={{ color: 'var(--accent-teal)', padding: '0.5rem', background: 'rgba(0,242,254,0.1)', borderRadius: '8px' }}>
                    {field.icon}
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{field.label}</p>
                    {field.isStatus ? (
                      <p style={{ margin: '0.25rem 0 0 0', fontWeight: 500, textTransform: 'capitalize' }}>
                        <span style={{
                          color: value === 'approved' ? '#4ade80' : 
                                 value === 'rejected' ? '#ff4d4d' : '#fbbf24'
                        }}>
                          {value || 'Unknown'}
                        </span>
                      </p>
                    ) : (
                      <p style={{ 
                        margin: '0.25rem 0 0 0', 
                        fontWeight: 500, 
                        wordBreak: field.isEmail ? 'break-all' : 'normal' 
                      }}>
                        {value || 'N/A'}
                      </p>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default StudentProfile;
