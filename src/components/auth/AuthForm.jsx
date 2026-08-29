import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, ArrowRight, Loader2, Hash, GraduationCap, Briefcase, Eye, EyeOff, AtSign } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

// Hoisted to module level — not recreated on every render (rendering-hoist-jsx)
const STRANDS_MAP = {
  'Academic': ['STEM', 'ABM', 'HUMSS', 'GAS'],
};

const INITIAL_FORM = {
  identifier: '',
  email: '',
  username: '',
  password: '',
  firstName: '',
  lastName: '',
  studentNo: '',
  gradeLevel: '11',
  shsTrack: 'Academic',
  shsStrand: 'STEM',
};

const AuthForm = ({ isLogin, toggleForm, showAdminRegistration, showAdminContact }) => {
  const { signIn, signUp } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
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
        const { error } = await signIn(formData.identifier, formData.password);
        if (error) throw error;
      } else {
        const { error } = await signUp(formData.email, formData.password, {
          username: formData.username,
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
      const message = err.message || '';
      if (isLogin) {
        setError(message || 'Unable to authenticate. Please try again.');
      } else if (/duplicate key.*username/i.test(message)) {
        setError('That username is unavailable. Choose another username.');
      } else if (/duplicate key.*student|student_no/i.test(message)) {
        setError('That student number is already in use.');
      } else if (/duplicate key|unique constraint|Database error/i.test(message)) {
        setError('Sign-up failed. The email, username, or student number may already be in use. Please try different details.');
      } else {
        setError(message || 'Unable to create your account. Please try again.');
      }
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

              {isLogin ? (
                <div className="input-group">
                  <AtSign className="input-icon" size={18} />
                  <input
                    type="text"
                    placeholder="Username"
                    autoComplete="username"
                    required
                    value={formData.identifier}
                    onChange={handleChange('identifier')}
                  />
                </div>
              ) : (
                <>
                  <div className="input-group full-width">
                    <AtSign className="input-icon" size={18} />
                    <input
                      type="text"
                      placeholder="Username"
                      autoComplete="username"
                      minLength="3"
                      maxLength="30"
                      pattern="[A-Za-z0-9][A-Za-z0-9._-]{2,29}"
                      title="Use 3–30 letters, numbers, dots, underscores, or hyphens."
                      required
                      value={formData.username}
                      onChange={handleChange('username')}
                    />
                  </div>
                  <div className="input-group full-width">
                    <Mail className="input-icon" size={18} />
                    <input type="email" placeholder="Email Address" autoComplete="email" required value={formData.email} onChange={handleChange('email')} />
                  </div>
                </>
              )}
              <div className={`input-group has-password-toggle ${!isLogin ? 'full-width' : ''}`}>
                <Lock className="input-icon" size={18} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  required
                  value={formData.password}
                  onChange={handleChange('password')}
                />
                <button
                  type="button"
                  className="password-visibility-toggle"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {error ? <p className="error-message full-width">{error}</p> : null}
              {isLogin ? (
                <div className="form-footer">
                  <span className="password-help">
                    Need to change your password?{' '}
                    <button
                      type="button"
                      className="password-help-link"
                      onClick={showAdminContact}
                    >
                      Contact your school administrator
                    </button>
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
