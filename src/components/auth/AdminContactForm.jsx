import { useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2, Mail } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabase';

const AdminContactForm = ({ onBack }) => {
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    setSending(true);
    setError('');
    setSuccess('');

    const { error: requestError } = await supabase.rpc('request_admin_contact', {
      submitted_email: email.trim(),
    });
    setSending(false);

    if (requestError) {
      setError(requestError.message || 'Unable to send your request. Please try again.');
      return;
    }

    setSuccess('If an account matches that email, a school administrator has been notified.');
  };

  return (
    <motion.div
      className="glass-card admin-contact-card"
      initial={{ opacity: 0, x: 35 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -35 }}
      transition={{ duration: 0.35 }}
    >
      <div className="form-header">
        <h3>Contact your administrator</h3>
        <p>Enter your email so your school administrator can help recover your username.</p>
      </div>

      <form className="auth-form" onSubmit={submit}>
        <div className="input-group">
          <Mail className="input-icon" size={18} />
          <input
            type="email"
            autoComplete="email"
            placeholder="Enter your email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>

        {error ? <p className="error-message">{error}</p> : null}
        {success ? <p className="contact-success-message"><CheckCircle2 size={17} /> {success}</p> : null}

        <button className="submit-btn" type="submit" disabled={sending}>
          {sending ? <Loader2 className="animate-spin" size={18} /> : <>Send request <ArrowRight size={18} /></>}
        </button>
      </form>

      <button type="button" className="admin-register-back admin-register-back-button" onClick={onBack}>
        <ArrowLeft size={15} /> Back to sign in
      </button>
    </motion.div>
  );
};

export default AdminContactForm;
