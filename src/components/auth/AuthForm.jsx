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

const AuthForm = ({ isLogin, toggleForm }) => {
  const { signIn, signUp, verifyOtp } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showOtp, setShowOtp] = useState(false);
  const [otp, setOtp] = useState('');
  const [formData, setFormData] = useState(INITIAL_FORM);

  // Derived state — no useEffect needed (rerender-derived-state-no-effect)
  const availableStrands = STRANDS_MAP[formData.shsTrack];

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
        setShowOtp(true);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { error } = await verifyOtp(formData.email, otp);
      if (error) throw error;
      // The onAuthStateChange listener in AuthContext will handle the session
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
      className={`glass-card ${!isLogin && !showOtp ? 'signup-wide' : ''}`}
      style={showOtp ? { maxWidth: '420px', margin: '0 auto', textAlign: 'center' } : {}}
    >
      <AnimatePresence mode='wait'>
        {showOtp ? (
          <motion.div
            key="otp-view"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
          >
            <div className="form-header" style={{ marginBottom: '2rem' }}>
              <h3>Verify your email</h3>
              <p>We've sent a verification code to<br /><strong>{formData.email}</strong></p>
            </div>

            <form onSubmit={handleVerify} className="auth-form">
              <div className="input-group">
                <Hash className="input-icon" size={18} />
                <input
                  type="text"
                  placeholder="Enter verification code"
                  required
                  maxLength={8}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  style={{ textAlign: 'center', letterSpacing: '0.4rem', fontSize: '1.25rem' }}
                />
              </div>

              {error ? <p className="error-message">{error}</p> : null}

              <button type="submit" className="submit-btn full-width" disabled={loading || otp.length < 6}>
                {loading ? <Loader2 className="animate-spin" size={18} /> : (
                  <>
                    Verify Account
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>

            <div className="toggle-auth" style={{ marginTop: '2rem' }}>
              Didn't receive a code?{' '}
              <button
                onClick={() => setShowOtp(false)}
                className="toggle-link"
                style={{ fontSize: '0.875rem' }}
              >
                Back to Sign Up
              </button>
            </div>
          </motion.div>
        ) : (
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
                  <a href="#" className="forgot-password">Forgot Password?</a>
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
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default AuthForm;
