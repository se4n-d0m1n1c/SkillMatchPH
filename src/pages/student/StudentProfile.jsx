import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { Mail, GraduationCap, BookOpen, Fingerprint, Activity, BookMarked, Target, ChevronRight, MapPin, Crosshair, Pencil } from 'lucide-react';
import { getSavedPinnedLocation, savePinnedLocation } from '../../data/locationsData';
import GrabLocationPickerModal from '../../components/common/GrabLocationPickerModal';
import ProfileEditor from '../../components/student/ProfileEditor';
import '../../styles/Profile.css';

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
  const { user, profile, refreshProfile } = useAuth();
  const [assessmentData, setAssessmentData] = useState(null);
  const [pinnedLocation, setPinnedLocation] = useState(() => getSavedPinnedLocation(user?.id));
  const [showMapModal, setShowMapModal] = useState(false);
  const [showProfileEditor, setShowProfileEditor] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState('');

  useEffect(() => {
    let isCurrent = true;

    const loadAvatar = async () => {
      if (!profile?.avatar_path) {
        setAvatarUrl('');
        return;
      }

      const { data, error } = await supabase.storage
        .from('avatars')
        .createSignedUrl(profile.avatar_path, 60 * 60);
      if (isCurrent) setAvatarUrl(error ? '' : data.signedUrl);
    };

    loadAvatar();
    return () => { isCurrent = false; };
  }, [profile?.avatar_path, profile?.updated_at]);

  useEffect(() => {
    let isCurrent = true;
    setAssessmentData(null);

    const loadAssessment = async () => {
      if (user?.id) {
        const { data, error } = await supabase
          .from('assessment_attempts')
          .select('result, completed_at')
          .eq('user_id', user.id)
          .order('completed_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!error && data?.result?.code && isCurrent) {
          setAssessmentData({
            ...data.result,
            hollandCode: data.result.code,
            savedAt: data.completed_at
          });
          return;
        }
      }

      // Support assessments saved before database persistence was introduced.
      try {
        const raw = localStorage.getItem(`skillmatch_assessment_${user?.id || 'guest'}`);
        if (raw && isCurrent) setAssessmentData(JSON.parse(raw));
      } catch {
        // ignore
      }
    };

    loadAssessment();
    return () => { isCurrent = false; };
  }, [user?.id]);

  const handleSelectPinnedLocation = (newLocObj) => {
    setPinnedLocation(newLocObj);
    savePinnedLocation(user?.id, newLocObj);
  };

  // 3. Combine names safely using inline derivation, avoiding unnecessary useEffect (rerender-derived-state-no-effect)
  const firstName = profile?.first_name || user?.user_metadata?.first_name || '';
  const lastName = profile?.last_name || user?.user_metadata?.last_name || '';
  const fullName = `${firstName} ${lastName}`.trim() || 'Student';

  return (
    <div className="student-page" style={{ padding: '2rem 0' }}>
      <motion.div
        className="profile-page-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div>
          <h2 style={{ fontSize: '2.5rem', margin: 0, color: 'var(--text-primary)' }}>My Profile</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 0 }}>View and update your personal information and academic details.</p>
        </div>
        <button className="profile-edit-button" onClick={() => setShowProfileEditor(true)}><Pencil size={17} /> Edit profile</button>
      </motion.div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', alignItems: 'flex-start' }}>
        
        {/* Profile Identity Card */}
        <motion.div className="glass-card" style={{ flex: '1 1 300px' }} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '2rem 0' }}>
            <div className="profile-avatar">
              {avatarUrl
                ? <img src={avatarUrl} alt={`${fullName}'s profile`} />
                : firstName.charAt(0) || 'S'}
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

        {/* Details Grid & Career Assessment */}
        <div style={{ flex: '2 1 400px', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          <motion.div 
            className="glass-card" 
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
                            color: value === 'approved' ? 'var(--success)' :
                                   value === 'rejected' ? 'var(--danger-text)' : 'var(--warning)'
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

              {/* Pinned Location Field */}
              <motion.div variants={ITEM_VARIANTS} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', gridColumn: '1 / -1' }}>
                <div style={{ color: 'var(--accent-teal)', padding: '0.5rem', background: 'rgba(0,242,254,0.1)', borderRadius: '8px', flexShrink: 0 }}>
                  <MapPin size={20} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Pinned Location (Exact)</p>
                    <button
                      onClick={() => setShowMapModal(true)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        background: 'rgba(0, 245, 255, 0.1)',
                        border: '1px solid rgba(0, 245, 255, 0.3)',
                        color: 'var(--accent-teal)',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        padding: '0.25rem 0.65rem',
                        borderRadius: '8px'
                      }}
                    >
                      <Crosshair size={13} /> Change on Map
                    </button>
                  </div>
                  <p style={{ margin: '0.25rem 0 0 0', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                    {pinnedLocation.address || pinnedLocation.label}
                    <span style={{ fontSize: '0.72rem', padding: '0.1rem 0.5rem', borderRadius: '4px', background: 'rgba(74, 222, 128, 0.15)', color: 'var(--success)', fontWeight: 700 }}>
                      📍 GPS Pin Active
                    </span>
                  </p>
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* Career Assessment Card */}
          <motion.div
            className="glass-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ color: 'var(--accent-teal)', padding: '0.5rem', background: 'rgba(0,242,254,0.1)', borderRadius: '8px' }}>
                  <Target size={20} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-primary)' }}>
                    Career Assessment & Alignment
                  </h4>
                  <p style={{ margin: '0.2rem 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    Holland RIASEC & Scholastic Reasoning Evaluation
                  </p>
                </div>
              </div>

              {assessmentData?.hollandCode && (
                <div style={{
                  padding: '0.3rem 0.8rem',
                  borderRadius: '8px',
                  background: 'rgba(0, 245, 255, 0.15)',
                  border: '1px solid rgba(0, 245, 255, 0.3)',
                  color: 'var(--accent-teal)',
                  fontFamily: 'monospace',
                  fontWeight: 700,
                  fontSize: '0.9rem'
                }}>
                  Code: {assessmentData.hollandCode}
                </div>
              )}
            </div>

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.5, margin: '0 0 1.5rem 0' }}>
              {assessmentData?.hollandCode
                ? `You have completed the assessment. Your occupational profile is mapped to ${assessmentData.hollandCode}. View your certificate of rating and personalized program matches anytime.`
                : 'Take our 5-minute dual-engine assessment to discover your top Philippine college program matches based on your vocational interests and scholastic aptitude.'}
            </p>

            <Link
              to="/dashboard/assessment"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.65rem 1.25rem',
                borderRadius: '10px',
                background: 'var(--primary-action-bg)',
                color: '#fff',
                textDecoration: 'none',
                fontWeight: 600,
                fontSize: '0.9rem'
              }}
            >
              {assessmentData?.hollandCode ? 'View Assessment Results' : 'Take Career Assessment'}
              <ChevronRight size={16} />
            </Link>
          </motion.div>

        </div>
      </div>

      {/* Grab-Style Location Picker Modal */}
      <AnimatePresence>
        {showMapModal && (
          <GrabLocationPickerModal
            initialLocation={pinnedLocation}
            onSelectLocation={handleSelectPinnedLocation}
            onClose={() => setShowMapModal(false)}
          />
        )}
      </AnimatePresence>

      {showProfileEditor ? (
        <ProfileEditor
          user={user}
          profile={profile}
          avatarUrl={avatarUrl}
          onSaved={refreshProfile}
          onClose={() => setShowProfileEditor(false)}
        />
      ) : null}
    </div>
  );
};

export default StudentProfile;
