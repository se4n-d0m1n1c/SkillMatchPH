import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2, Mail } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const AdminContactForm = ({ onBack }) => {
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const inFlight = useRef(false);
  const heading = useRef(null);

  useEffect(() => {
    heading.current?.focus();
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    if (inFlight.current) return;
    inFlight.current = true;
    setSending(true);
    setError('');
    setSuccess('');
    try {
      const { error: requestError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/recover-account`,
      });
      if (requestError) throw requestError;
      setSuccess('If an account matches that email, you will receive a recovery link. Check your inbox and spam folder.');
    } catch {
      setError('Unable to request a recovery link. Please try again later.');
    } finally {
      inFlight.current = false;
      setSending(false);
    }
  };

  return (
    <section className="glass-card admin-contact-card recovery-card" aria-labelledby="recovery-request-title">
      <div className="form-header">
        <h3 id="recovery-request-title" ref={heading} tabIndex={-1}>Recover account</h3>
        <p>Get an email link to change your password or username. Each link can be used once.</p>
      </div>
      <form className="auth-form" onSubmit={submit} aria-busy={sending}>
        <div>
          <label className="recovery-field-label" htmlFor="recovery-email">Account email</label>
          <div className="input-group">
            <Mail className="input-icon" size={18} aria-hidden="true" />
            <input id="recovery-email" type="email" autoComplete="email" required value={email}
              disabled={sending} onChange={(event) => setEmail(event.target.value)} />
          </div>
        </div>
        {error ? <p className="error-message" role="alert">{error}</p> : null}
        {success ? <p className="contact-success-message" role="status"><CheckCircle2 size={17} aria-hidden="true" /> {success}</p> : null}
        <button className="submit-btn" type="submit" disabled={sending}>
          {sending ? <><Loader2 className="animate-spin" size={18} aria-hidden="true" /> Sending link…</> : <>Recover account <ArrowRight size={18} aria-hidden="true" /></>}
        </button>
      </form>
      <button type="button" className="admin-register-back admin-register-back-button" onClick={onBack}>
        <ArrowLeft size={15} aria-hidden="true" /> Back to sign in
      </button>
    </section>
  );
};

export default AdminContactForm;
