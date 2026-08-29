import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import AuthForm from '../components/auth/AuthForm';
import AuthBranding from '../components/auth/AuthBranding';
import AdminRegistration from './AdminRegistration';
import AdminContactForm from '../components/auth/AdminContactForm';
import '../styles/Auth.css';

const AuthPage = () => {
  const [authMode, setAuthMode] = useState('login');
  const isLogin = authMode === 'login';
  const isWide = authMode !== 'login';

  return (
    <div className="auth-page">
      <div className={`auth-container ${isWide ? 'signup-mode' : ''}`}>
        <AuthBranding />

        {/* Form Side (Right) */}
        <div className="form-section">
          <div className="form-wrapper">
            <AnimatePresence mode="wait">
              {authMode === 'admin' ? (
                <AdminRegistration key="admin-register" embedded onBack={() => setAuthMode('login')} />
              ) : authMode === 'contact' ? (
                <AdminContactForm key="admin-contact" onBack={() => setAuthMode('login')} />
              ) : (
                <AuthForm
                  key={isLogin ? 'login' : 'register'}
                  isLogin={isLogin}
                  toggleForm={() => setAuthMode(isLogin ? 'signup' : 'login')}
                  showAdminRegistration={() => setAuthMode('admin')}
                  showAdminContact={() => setAuthMode('contact')}
                />
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
