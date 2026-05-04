import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AuthForm from '../components/auth/AuthForm';
import '../styles/Auth.css';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="auth-page">
      <div className={`auth-container ${!isLogin ? 'signup-mode' : ''}`}>
        {/* Branding Side (Left) */}
        <div className="branding-section">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="branding-content"
          >
            <div className="logo-wrapper" style={{ marginBottom: '3rem' }}>
              <svg viewBox="0 0 440 90" width="280" height="57" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="gd_auth" x1="0" y1="1" x2="1" y2="0">
                    <stop offset="0%" stop-color="#7C3AED"/>
                    <stop offset="100%" stop-color="#06B6D4"/>
                  </linearGradient>
                </defs>
                <rect x="0" y="0" width="90" height="90" rx="20" fill="url(#gd_auth)"/>
                <path d="M22,70 C30,40 60,56 68,22" stroke="white" stroke-width="2.5" fill="none" opacity="0.3" stroke-linecap="round"/>
                <circle cx="22" cy="70" r="7.5" fill="white"/>
                <circle cx="45" cy="49" r="5.5" fill="white" opacity="0.65"/>
                <circle cx="68" cy="22" r="10" fill="white"/>
                <circle cx="68" cy="22" r="16" stroke="white" stroke-width="1.5" fill="none" opacity="0.18"/>
                <text x="110" y="56" font-family="Inter, -apple-system, sans-serif" font-size="46" font-weight="700" fill="white" letter-spacing="-1">SkillMatch<tspan fill="#06B6D4" font-size="30" font-weight="600" dy="-8" letter-spacing="0">PH</tspan></text>
                <text x="111" y="76" font-family="Inter, -apple-system, sans-serif" font-size="13" fill="rgba(255,255,255,0.36)" letter-spacing="0.2">Career Pathing for Senior High</text>
              </svg>
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
          <div className="form-wrapper">
            <AnimatePresence mode="wait">
              <AuthForm 
                key={isLogin ? 'login' : 'register'}
                isLogin={isLogin} 
                toggleForm={() => setIsLogin(!isLogin)} 
              />
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
