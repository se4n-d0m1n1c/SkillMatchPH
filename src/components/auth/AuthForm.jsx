import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, ArrowRight, Loader2, Hash, GraduationCap, Briefcase } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

// Hoisted to module level — not recreated on every render (rendering-hoist-jsx)
const STRANDS_MAP = {
  'Academic': ['STEM', 'ABM', 'HUMSS', 'GAS'],
  'Technical-Vocational-Livelihood (TVL)': ['ICT', 'HE', 'IA', 'Agri-Fishery'],
};

const INITIAL_FORM = {
  email: '',
  password: '',
  firstName: '',
  lastName: '',
  studentNo: '',
  gradeLevel: '11',
  shsTrack: 'Academic',
  shsStrand: 'STEM',
};

const AuthForm = ({ isLogin, toggleForm, showAdminRegistration }) => {
  const { signIn, signUp } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM);

  // Derived state — no useEffect needed (rerender-derived-state-no-effect)
  const availableStrands = STRANDS_MAP[formData.shsTrack];
  const adminContactEmail = import.meta.env.VITE_ADMIN_CONTACT_EMAIL;

  // Use functional setState to avoid stale closures (rerender-functional-setstate)
  const handleChange = (field) => (e) => {
    const value = e.target.value;
    setFormData(prev => {
      const next = { ...prev, [field]: value };
      // When track changes, reset strand to first available (derived, no effect needed)
      if (field === 'shsTrack') {
        next.shsStrand = STRANDS_MAP[value][0];
      }
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const { error } = await signIn(formData.email, formData.password);
        if (error) throw error;
      } else {
        const { error } = await signUp(formData.email, formData.password, {
          firstName: formData.firstName,
          lastName: formData.lastName,
          studentNo: formData.studentNo,
          gradeLevel: formData.gradeLevel,
          shsTrack: formData.shsTrack,
          shsStrand: formData.shsStrand,
        });
        if (error) throw error;
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
      className={`glass-card ${!isLogin ? 'signup-wide' : ''}`}
    >
      <AnimatePresence mode='wait'>
        <motion.div
            key="auth-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="form-header">
              <h3>{isLogin ? 'Welcome Back' : 'Create Account'}</h3>
              <p>{isLogin ? 'Continue your career journey' : 'Start your path to success'}</p>
            </div>

            <form className="auth-form" onSubmit={handleSubmit}>
              <AnimatePresence mode='wait'>
                {!isLogin ? (
                  <motion.div
                    key="signup-fields"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="form-grid"
                  >
                    <div className="input-group">
                      <User className="input-icon" size={18} />
                      <input type="text" placeholder="First Name" required value={formData.firstName} onChange={handleChange('firstName')} />
                    </div>
                    <div className="input-group">
                      <User className="input-icon" size={18} />
                      <input type="text" placeholder="Last Name" required value={formData.lastName} onChange={handleChange('lastName')} />
                    </div>
                    <div className="input-group">
                      <Hash className="input-icon" size={18} />
                      <input type="text" placeholder="Student No." required value={formData.studentNo} onChange={handleChange('studentNo')} />
                    </div>
                    <div className="input-group">
                      <GraduationCap className="input-icon" size={18} />
                      <select required value={formData.gradeLevel} onChange={handleChange('gradeLevel')} className="custom-select">
                        <option value="11">Grade 11</option>
                        <option value="12">Grade 12</option>
                      </select>
                    </div>
                    <div className="input-group">
                      <Briefcase className="input-icon" size={18} />
                      <select required value={formData.shsTrack} onChange={handleChange('shsTrack')} className="custom-select">
                        <option value="Academic">Academic Track</option>
                        <option value="Technical-Vocational-Livelihood (TVL)">TVL Track</option>
                      </select>
                    </div>
                    <div className="input-group">
                      <GraduationCap className="input-icon" size={18} />
                      <select required value={formData.shsStrand} onChange={handleChange('shsStrand')} className="custom-select">
                        {availableStrands.map(strand => (
                          <option key={strand} value={strand}>{strand}</option>
                        ))}
                      </select>
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>

              <div className={`input-group ${!isLogin ? 'full-width' : ''}`}>
                <Mail className="input-icon" size={18} />
                <input type="email" placeholder="Email Address" required value={formData.email} onChange={handleChange('email')} />
              </div>
              <div className={`input-group ${!isLogin ? 'full-width' : ''}`}>
                <Lock className="input-icon" size={18} />
                <input type="password" placeholder="Password" required value={formData.password} onChange={handleChange('password')} />
              </div>

              {error ? <p className="error-message full-width">{error}</p> : null}

              {isLogin ? (
                <div className="form-footer">
                  <span className="password-help">
                    Need to change your password?{' '}
                    {adminContactEmail ? (
                      <a href={`mailto:${adminContactEmail}`}>Contact your administrator</a>
                    ) : (
                      'Contact your school administrator.'
                    )}
                  </span>
                </div>
              ) : null}

              <button type="submit" className="submit-btn full-width" disabled={loading}>
                {loading ? <Loader2 className="animate-spin" size={18} /> : (
                  <>
                    {isLogin ? 'Log In' : 'Sign Up'}
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>
            <div className="toggle-auth">
              {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
              <button onClick={toggleForm} className="toggle-link" disabled={loading}>
                {isLogin ? 'Sign Up' : 'Log In'}
              </button>
              {isLogin ? (
                <div className="admin-invite-link">
                  Have an administrator invite? <button type="button" onClick={showAdminRegistration}>Register here</button>
                </div>
              ) : null}
            </div>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
};

export default AuthForm;
