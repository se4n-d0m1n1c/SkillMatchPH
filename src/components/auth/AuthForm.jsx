import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, ArrowRight, Loader2, Hash, GraduationCap, Briefcase } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const AuthForm = ({ isLogin, toggleForm }) => {
  const { signIn, signUp } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    studentNo: '',
    gradeLevel: '11',
    shsTrack: 'Academic',
    shsStrand: 'STEM',
  });

  const strandsMap = {
    'Academic': ['STEM', 'ABM', 'HUMSS', 'GAS'],
    'Technical-Vocational-Livelihood (TVL)': ['ICT', 'HE', 'IA', 'Agri-Fishery']
  };

  // Update strand when track changes
  useEffect(() => {
    if (!isLogin) {
      setFormData(prev => ({
        ...prev,
        shsStrand: strandsMap[prev.shsTrack][0]
      }));
    }
  }, [formData.shsTrack, isLogin]);

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
        setSuccess(true);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card success-card"
        style={{ maxWidth: '400px', margin: '0 auto' }}
      >
        <div className="form-header">
          <h3>Check your email</h3>
          <p>We've sent a verification link to <strong>{formData.email}</strong>.</p>
        </div>
        <button onClick={() => setSuccess(false)} className="submit-btn">
          Back to Login
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
      className={`glass-card ${!isLogin ? 'signup-wide' : ''}`}
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
                <input
                  type="text"
                  placeholder="First Name"
                  required
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                />
              </div>
              <div className="input-group">
                <User className="input-icon" size={18} />
                <input
                  type="text"
                  placeholder="Last Name"
                  required
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                />
              </div>
              <div className="input-group">
                <Hash className="input-icon" size={18} />
                <input
                  type="text"
                  placeholder="Student No."
                  required
                  value={formData.studentNo}
                  onChange={(e) => setFormData({ ...formData, studentNo: e.target.value })}
                />
              </div>
              <div className="input-group">
                <GraduationCap className="input-icon" size={18} />
                <select
                  required
                  value={formData.gradeLevel}
                  onChange={(e) => setFormData({ ...formData, gradeLevel: e.target.value })}
                  className="custom-select"
                >
                  <option value="11">Grade 11</option>
                  <option value="12">Grade 12</option>
                </select>
              </div>
              <div className="input-group">
                <Briefcase className="input-icon" size={18} />
                <select
                  required
                  value={formData.shsTrack}
                  onChange={(e) => setFormData({ ...formData, shsTrack: e.target.value })}
                  className="custom-select"
                >
                  <option value="Academic">Academic Track</option>
                  <option value="Technical-Vocational-Livelihood (TVL)">TVL Track</option>
                </select>
              </div>
              <div className="input-group">
                <GraduationCap className="input-icon" size={18} />
                <select
                  required
                  value={formData.shsStrand}
                  onChange={(e) => setFormData({ ...formData, shsStrand: e.target.value })}
                  className="custom-select"
                >
                  {strandsMap[formData.shsTrack].map(strand => (
                    <option key={strand} value={strand}>{strand}</option>
                  ))}
                </select>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <div className={`input-group ${!isLogin ? 'full-width' : ''}`}>
          <Mail className="input-icon" size={18} />
          <input
            type="email"
            placeholder="Email Address"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
        </div>
        <div className={`input-group ${!isLogin ? 'full-width' : ''}`}>
          <Lock className="input-icon" size={18} />
          <input
            type="password"
            placeholder="Password"
            required
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          />
        </div>

        {error && <p className="error-message full-width">{error}</p>}

        {isLogin && (
          <div className="form-footer">
            <a href="#" className="forgot-password">Forgot Password?</a>
          </div>
        )}

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
  );
};

export default AuthForm;
