import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, User, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const AuthForm = ({ isLogin, toggleForm }) => {
  const { signIn, signUp } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const { error } = await signIn(formData.email, formData.password);
        if (error) throw error;
      } else {
        const { error } = await signUp(formData.email, formData.password, formData.fullName);
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
      className="glass-card"
    >
      <div className="form-header">
        <h3>{isLogin ? 'Welcome Back' : 'Create Account'}</h3>
        <p>{isLogin ? 'Continue your career journey' : 'Start your path to success'}</p>
      </div>

      <form className="auth-form" onSubmit={handleSubmit}>
        {!isLogin && (
          <div className="input-group">
            <User className="input-icon" size={18} />
            <input
              type="text"
              placeholder="Full Name"
              required
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            />
          </div>
        )}
        <div className="input-group">
          <Mail className="input-icon" size={18} />
          <input
            type="email"
            placeholder="Email Address"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
        </div>
        <div className="input-group">
          <Lock className="input-icon" size={18} />
          <input
            type="password"
            placeholder="Password"
            required
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          />
        </div>

        {error && <p className="error-message">{error}</p>}

        {isLogin && (
          <div className="form-footer">
            <a href="#" className="forgot-password">Forgot Password?</a>
          </div>
        )}

        <button type="submit" className="submit-btn" disabled={loading}>
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
