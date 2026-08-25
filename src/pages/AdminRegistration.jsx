import { useState } from 'react';
import { ArrowLeft, ArrowRight, KeyRound, Loader2, Lock, Mail, ShieldCheck, User } from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import '../styles/Auth.css';

const AdminRegistration = () => {
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

  return (
    <main className="admin-register-page">
      <div className="admin-register-card glass-card">
        <div className="admin-register-mark"><ShieldCheck size={28} /></div>
        {submitted ? (
          <div className="admin-register-success">
            <h1>Check your email</h1>
            <p>Your administrator account was created. Confirm your email, then sign in.</p>
            <Link to="/" className="submit-btn">Go to sign in <ArrowRight size={18} /></Link>
          </div>
        ) : (
          <>
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
          </>
        )}
        <Link to="/" className="admin-register-back"><ArrowLeft size={15} /> Back to sign in</Link>
      </div>
    </main>
  );
};

export default AdminRegistration;
