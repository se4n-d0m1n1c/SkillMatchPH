import { motion } from 'framer-motion';
import { Mail, Lock, User, ArrowRight, Code, Globe } from 'lucide-react';

const AuthForm = ({ isLogin, toggleForm }) => {
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

      <form className="auth-form" onSubmit={(e) => e.preventDefault()}>
        {!isLogin && (
          <div className="input-group">
            <User className="input-icon" size={18} />
            <input type="text" placeholder="Full Name" required />
          </div>
        )}
        <div className="input-group">
          <Mail className="input-icon" size={18} />
          <input type="email" placeholder="Email Address" required />
        </div>
        <div className="input-group">
          <Lock className="input-icon" size={18} />
          <input type="password" placeholder="Password" required />
        </div>

        {isLogin && (
          <div className="form-footer">
            <a href="#" className="forgot-password">Forgot Password?</a>
          </div>
        )}

        <button type="submit" className="submit-btn">
          {isLogin ? 'Log In' : 'Sign Up'}
          <ArrowRight size={18} />
        </button>
      </form>

      <div className="divider">
        <span>Or continue with</span>
      </div>

      <div className="social-login">
        <button className="social-btn">
          <Globe size={20} />
          <span>Google</span>
        </button>
        <button className="social-btn">
          <Code size={20} />
          <span>GitHub</span>
        </button>
      </div>

      <div className="toggle-auth">
        {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
        <button onClick={toggleForm} className="toggle-link">
          {isLogin ? 'Sign Up' : 'Log In'}
        </button>
      </div>
    </motion.div>
  );
};

export default AuthForm;
