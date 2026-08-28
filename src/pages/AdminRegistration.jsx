import { useState } from 'react';
import { ArrowLeft, ArrowRight, KeyRound, Loader2, Lock, Mail, User } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import AuthBranding from '../components/auth/AuthBranding';
import '../styles/Auth.css';

const AdminRegistration = ({ embedded = false, onBack }) => {
  const { user, role } = useAuth();
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', inviteCode: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (user) return <Navigate to={role === 'admin' ? '/admin' : '/'} replace />;

  const update = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: form.email.trim(),
      password: form.password,
      options: {
        data: {
          first_name: form.firstName.trim(),
          last_name: form.lastName.trim(),
          admin_invite_code: form.inviteCode.trim().toUpperCase(),
        },
      },
    });

    setLoading(false);
    if (signUpError) {
      setError(signUpError.message.includes('Database error')
        ? 'The invite code is invalid, expired, or has already been used.'
        : signUpError.message);
      return;
    }

    if (!data.session) setSubmitted(true);
  };

  const registrationCard = (
    <motion.div
      className="admin-register-card glass-card signup-wide"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
    >
        <AnimatePresence mode="wait">
          {submitted ? (
            <motion.div
              key="admin-register-success"
              className="admin-register-success"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
            >
              <h1>Check your email</h1>
              <p>Your administrator account was created. Confirm your email, then sign in.</p>
              {embedded ? (
                <button type="button" onClick={onBack} className="submit-btn">Go to sign in <ArrowRight size={18} /></button>
              ) : (
                <Link to="/" className="submit-btn">Go to sign in <ArrowRight size={18} /></Link>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="admin-register-form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
            >
              <div className="form-header">
                <h1>Create admin account</h1>
                <p>A valid one-time invitation is required.</p>
              </div>
              <form className="auth-form" onSubmit={submit}>
                <div className="form-grid">
                  <div className="input-group"><User className="input-icon" size={18} /><input required placeholder="First name" value={form.firstName} onChange={update('firstName')} /></div>
                  <div className="input-group"><User className="input-icon" size={18} /><input required placeholder="Last name" value={form.lastName} onChange={update('lastName')} /></div>
                </div>
                <div className="input-group"><Mail className="input-icon" size={18} /><input required type="email" placeholder="Work email" value={form.email} onChange={update('email')} /></div>
                <div className="input-group"><Lock className="input-icon" size={18} /><input required minLength="8" type="password" placeholder="Password (at least 8 characters)" value={form.password} onChange={update('password')} /></div>
                <div className="input-group"><KeyRound className="input-icon" size={18} /><input required autoCapitalize="characters" placeholder="SMPH-XXXXXXXXXXXX" value={form.inviteCode} onChange={update('inviteCode')} /></div>
                {error ? <p className="error-message">{error}</p> : null}
                <button className="submit-btn" type="submit" disabled={loading}>
                  {loading ? <Loader2 className="animate-spin" size={18} /> : <>Create admin account <ArrowRight size={18} /></>}
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      {embedded ? (
        <button type="button" onClick={onBack} className="admin-register-back admin-register-back-button">
          <ArrowLeft size={15} /> Back to sign in
        </button>
      ) : (
        <Link to="/" className="admin-register-back"><ArrowLeft size={15} /> Back to sign in</Link>
      )}
    </motion.div>
  );

  if (embedded) return registrationCard;

  return (
    <main className="auth-page">
      <div className="auth-container signup-mode admin-signup-mode">
        <AuthBranding />
        <div className="form-section">
          <div className="form-wrapper">
            {registrationCard}
          </div>
        </div>
      </div>
    </main>
  );
};

export default AdminRegistration;
