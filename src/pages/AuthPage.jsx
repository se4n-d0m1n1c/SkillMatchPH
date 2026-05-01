import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AuthForm from '../components/auth/AuthForm';
import '../styles/Auth.css';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="auth-page">
      <div className="auth-container">
        {/* Branding Side (Left) */}
        <div className="branding-section">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="branding-content"
          >
            <div className="logo-wrapper">
              <span className="logo-icon">🚀</span>
              <h1 className="brand-name">SkillMatchPH</h1>
            </div>
            <h2 className="tagline">Find your path.<br />Define your future.</h2>
            <p className="description">
              The premier career pathing tool designed specifically for senior high students in the Philippines.
            </p>
            
            {/* Animated Path Illustration Mockup */}
            <div className="path-illustration">
              <svg width="100%" height="200" viewBox="0 0 400 200">
                <motion.path
                  d="M10 150 Q 100 150, 150 100 T 300 50"
                  fill="none"
                  stroke="url(#grad1)"
                  strokeWidth="4"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
                />
                <defs>
                  <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" style={{ stopColor: 'var(--accent-violet)', stopOpacity: 1 }} />
                    <stop offset="100%" style={{ stopColor: 'var(--accent-teal)', stopOpacity: 1 }} />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </motion.div>
        </div>

        {/* Form Side (Right) */}
        <div className="form-section">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="form-wrapper"
          >
            <AnimatePresence mode="wait">
              <AuthForm 
                key={isLogin ? 'login' : 'register'}
                isLogin={isLogin} 
                toggleForm={() => setIsLogin(!isLogin)} 
              />
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
