import { useState } from 'react';
import { ArrowLeft, ArrowRight, AtSign, Eye, EyeOff, KeyRound, Loader2, Lock, Mail, User } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import AuthBranding from '../components/auth/AuthBranding';
import '../styles/Auth.css';

const AdminRegistration = ({ embedded = false, onBack }) => {
  const { user, role, verifySignupCode, resendVerificationEmail } = useAuth();
  const [form, setForm] = useState({ firstName: '', lastName: '', username: '', email: '', password: '', inviteCode: '' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationStatus, setVerificationStatus] = useState('');

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
          username: form.username.trim().toLowerCase(),
          first_name: form.firstName.trim(),
          last_name: form.lastName.trim(),
          admin_invite_code: form.inviteCode.trim().toUpperCase(),
        },
      },
    });

    setLoading(false);
    if (signUpError) {
      const message = signUpError.message || '';
      setError(message.includes('duplicate key')
        ? 'That username is unavailable. Choose another username.'
        : message.includes('Database error')
          ? 'The username is unavailable, or the invite code is invalid, expired, or already used.'
          : message);
      return;
    }

    if (!data.session) setSubmitted(true);
  };

  const verifyCode = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setVerificationStatus('');
    const { error: verifyError } = await verifySignupCode(form.email, verificationCode);
    if (verifyError) {
      setError(verifyError.message || 'Invalid or expired verification code.');
      setLoading(false);
    }
    // Successful verification creates a session. AuthContext resolves the
    // invite-created profile and routes administrators to /admin.
  };

  const resendCode = async () => {
    setLoading(true);
    setError('');
    setVerificationStatus('');
    const { error: resendError } = await resendVerificationEmail(form.email);
    setVerificationStatus(resendError
      ? resendError.message || 'Unable to resend verification code.'
      : 'A new verification code was sent. Check your inbox and spam folder.');
    setLoading(false);
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
              <div className="email-verification-icon"><Mail size={30} /></div>
              <h1>Enter verification code</h1>
              <p>We sent an eight-digit code to <strong>{form.email.trim().toLowerCase()}</strong>.</p>
              <form className="admin-verification-form" onSubmit={verifyCode}>
                <label className="verification-code-label" htmlFor="admin-verification-code">Verification code</label>
                <input
                  id="admin-verification-code"
                  className="verification-code-input"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="[0-9]{8}"
                  maxLength="8"
                  required
                  autoFocus
                  value={verificationCode}
                  onChange={(event) => setVerificationCode(event.target.value.replace(/\D/g, '').slice(0, 8))}
                  placeholder="00000000"
                />
                {error ? <p className="error-message" role="alert">{error}</p> : null}
                {verificationStatus ? <p className="email-verification-status" role="status">{verificationStatus}</p> : null}
                <button type="submit" className="submit-btn" disabled={loading || verificationCode.length !== 8}>
                  {loading ? <Loader2 className="animate-spin" size={18} /> : <ArrowRight size={18} />}
                  Verify administrator email
                </button>
              </form>
              <button type="button" className="verification-resend-link" onClick={resendCode} disabled={loading}>Resend code</button>
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
                <div className="input-group">
                  <AtSign className="input-icon" size={18} />
                  <input
                    required
                    minLength="3"
                    maxLength="30"
                    pattern="[A-Za-z0-9][A-Za-z0-9._-]{2,29}"
                    title="Use 3–30 letters, numbers, dots, underscores, or hyphens."
                    autoComplete="username"
                    placeholder="Username"
                    value={form.username}
                    onChange={update('username')}
                  />
                </div>
                <div className="input-group"><Mail className="input-icon" size={18} /><input required type="email" autoComplete="email" placeholder="Work email" value={form.email} onChange={update('email')} /></div>
                <div className="input-group has-password-toggle">
                  <Lock className="input-icon" size={18} />
                  <input
                    required
                    minLength="8"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Password (at least 8 characters)"
                    value={form.password}
                    onChange={update('password')}
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
