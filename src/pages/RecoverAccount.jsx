import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import AdminContactForm from '../components/auth/AdminContactForm';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import '../styles/Auth.css';

const FAILURE = 'Unable to complete recovery. This link may have expired or already been used. Request a new link before trying again.';
const USERNAME_PATTERN = /^[a-z0-9][a-z0-9._-]{2,29}$/;

const RecoverAccount = () => {
  const { recoveryLinkState, recoveryError, endRecovery, user } = useAuth();

  // 'pending'    - the link carried an unconsumed token_hash we verify on submit
  // 'exchanged'  - Supabase already traded the link for a session
  // 'expired'    - Supabase rejected the link
  const [linkState, setLinkState] = useState(recoveryLinkState);
  const [tokenHash, setTokenHash] = useState(() => new URLSearchParams(window.location.hash.slice(1)).get('token_hash') || '');
  const [action, setAction] = useState('password');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [username, setUsername] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(recoveryError || '');
  const [success, setSuccess] = useState('');
  const [requestLink, setRequestLink] = useState(false);
  const inFlight = useRef(false);
  const heading = useRef(null);
  const confirmInput = useRef(null);
  const feedback = useRef(null);

  // A token_hash link must stay unverified until the visitor submits, so only
  // the fragment is cleared here. An exchanged link already has a session.
  useEffect(() => {
    if (linkState === 'pending') {
      window.history.replaceState(window.history.state, '', window.location.pathname);
    }
    heading.current?.focus();
  }, [linkState]);

  useEffect(() => {
    if (error || success) feedback.current?.focus();
  }, [error, success]);

  const submitViaToken = async () => {
    const submittedToken = tokenHash;
    // A failed request may already have consumed the token, so never reuse it.
    setTokenHash('');
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/complete-account-recovery`, {
      method: 'POST',
      credentials: 'omit',
      headers: { 'Content-Type': 'application/json', apikey: import.meta.env.VITE_SUPABASE_ANON_KEY },
      body: JSON.stringify({
        token_hash: submittedToken,
        action,
        ...(action === 'password' ? { password } : { username: username.trim() })
      }),
    });
    const result = await response.json();
    if (!response.ok || result?.success !== true) throw new Error('Recovery failed');
    setLinkState('done');
    setSuccess(action === 'password'
      ? 'Your password has been changed. Sign in with your new password.'
      : 'Your username has been changed. Sign in with your new username.');
  };

  const submitViaSession = async () => {
    if (action === 'password') {
      // The recovery session is proof of email ownership, so Supabase accepts
      // the new password directly.
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      setSuccess('Your password has been changed. You can keep browsing or sign in again.');
      return;
    }

    // Changing a login name still requires the account password as a second
    // factor on this path.
    const { error: invokeError } = await supabase.functions.invoke('change-student-username', {
      body: { username: username.trim().toLowerCase(), password: currentPassword }
    });
    if (invokeError) throw invokeError;
    setSuccess('Your username has been changed.');
  };

  const submit = async (event) => {
    event.preventDefault();
    if (inFlight.current) return;
    if (linkState === 'pending' && !tokenHash) return;
    if (!event.currentTarget.reportValidity()) return;

    const normalizedUsername = username.trim().toLowerCase();
    if (action === 'password' && (password.length < 8 || password.length > 128)) {
      setError('Use a password between 8 and 128 characters.');
      return;
    }
    if (action === 'username' && !USERNAME_PATTERN.test(normalizedUsername)) {
      setError('Use a username of 3–30 characters, starting with a letter or number, with only letters, numbers, dots, underscores, or hyphens.');
      return;
    }
    if (linkState === 'exchanged' && action === 'username' && currentPassword.length === 0) {
      setError('Enter your current password to change your username.');
      return;
    }

    inFlight.current = true;
    setSending(true);
    setError('');
    setSuccess('');

    try {
      if (linkState === 'pending') {
        await submitViaToken();
      } else {
        await submitViaSession();
      }
      setPassword('');
      setConfirmation('');
      setCurrentPassword('');
    } catch {
      setError(FAILURE);
      inFlight.current = false;
      setSending(false);
      return;
    }

    inFlight.current = false;
    setSending(false);
  };

  const showForm = linkState === 'pending' || linkState === 'exchanged';
  const canSubmit = linkState !== 'pending' || Boolean(tokenHash);

  return (
    <main className="auth-page recovery-page">
      <div className="recovery-wrapper">
        {requestLink ? <AdminContactForm onBack={() => setRequestLink(false)} /> : (
          <section className="glass-card recovery-card" aria-labelledby="recovery-title">
            <div className="form-header">
              <h1 id="recovery-title" ref={heading} tabIndex={-1}>Recover account</h1>
              <p>
                {linkState === 'exchanged'
                  ? 'This link signed you in for recovery only. Nothing here changes your account until you save.'
                  : 'This changes the account linked to your email, not any account currently signed in here.'}
              </p>
            </div>

            {success ? (
              <p className="contact-success-message" role="status" tabIndex={-1} ref={feedback}>{success}</p>
            ) : (
              <>
                {linkState === 'pending' ? (
                  <p id="recovery-note" className="recovery-note">
                    Choose one change per link. Your one-use link is consumed when you submit. If it expires or a request fails, request a new link. Reloading this page also requires a new link.
                  </p>
                ) : linkState === 'exchanged' ? (
                  <p id="recovery-note" className="recovery-note">
                    Signed in as {user?.email || 'your recovery account'}. Changing your password only needs a new password. Changing your username also needs your current password.
                  </p>
                ) : null}

                {error ? <p className="error-message" role="alert" tabIndex={-1} ref={feedback}>{error}</p> : null}

                {!showForm && !success ? (
                  <p className="recovery-note" role="status">
                    {linkState === 'expired'
                      ? 'This recovery link is invalid or has expired. Request a new link below.'
                      : 'Open the recovery link from your email, or request a new link below.'}
                  </p>
                ) : null}

                {showForm ? (
                  <form className="auth-form" onSubmit={submit} aria-busy={sending} aria-describedby="recovery-note">
                    <fieldset className="recovery-choice" disabled={sending}>
                      <legend>What would you like to change?</legend>
                      {['password', 'username'].map((option) => (
                        <label key={option} className={action === option ? 'active' : ''}>
                          <input
                            type="radio"
                            name="recovery-action"
                            value={option}
                            checked={action === option}
                            onChange={() => {
                              setAction(option);
                              setPassword('');
                              setConfirmation('');
                              setCurrentPassword('');
                              setError('');
                            }}
                          />
                          <span>{option === 'password' ? 'Password' : 'Username'}</span>
                        </label>
                      ))}
                    </fieldset>

                    {action === 'password' ? (
                      <>
                        <div>
                          <label className="recovery-field-label" htmlFor="new-password">New password</label>
                          <div className="input-group recovery-input">
                            <input
                              id="new-password"
                              type="password"
                              autoComplete="new-password"
                              minLength={8}
                              maxLength={128}
                              required
                              disabled={sending}
                              value={password}
                              onChange={(event) => { setPassword(event.target.value); confirmInput.current?.setCustomValidity(''); }}
                              aria-describedby="password-hint"
                            />
                          </div>
                          <small id="password-hint" className="recovery-note">Use 8–128 characters.</small>
                        </div>
                        <div>
                          <label className="recovery-field-label" htmlFor="confirm-password">Confirm new password</label>
                          <div className="input-group recovery-input">
                            <input
                              id="confirm-password"
                              ref={confirmInput}
                              type="password"
                              autoComplete="new-password"
                              required
                              disabled={sending}
                              value={confirmation}
                              onChange={(event) => { setConfirmation(event.target.value); event.target.setCustomValidity(''); }}
                            />
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <label className="recovery-field-label" htmlFor="new-username">New username</label>
                          <div className="input-group recovery-input">
                            <input
                              id="new-username"
                              autoComplete="username"
                              autoCapitalize="none"
                              spellCheck={false}
                              required
                              minLength={3}
                              maxLength={30}
                              pattern="[a-zA-Z0-9][a-zA-Z0-9._\-]{2,29}"
                              aria-describedby="username-hint"
                              disabled={sending}
                              value={username}
                              onChange={(event) => setUsername(event.target.value)}
                            />
                          </div>
                          <small id="username-hint" className="recovery-note">Use 3–30 characters. Start with a letter or number; letters, numbers, dots, underscores, and hyphens only. Saved in lowercase.</small>
                        </div>
                        {linkState === 'exchanged' ? (
                          <div>
                            <label className="recovery-field-label" htmlFor="current-password">Current password</label>
                            <div className="input-group recovery-input">
                              <input
                                id="current-password"
                                type="password"
                                autoComplete="current-password"
                                required
                                disabled={sending}
                                value={currentPassword}
                                onChange={(event) => setCurrentPassword(event.target.value)}
                                aria-describedby="current-password-hint"
                              />
                            </div>
                            <small id="current-password-hint" className="recovery-note">Confirmed before your login name changes.</small>
                          </div>
                        ) : null}
                      </>
                    )}

                    <button className="submit-btn" disabled={sending || !canSubmit} type="submit">
                      {sending
                        ? <><Loader2 className="animate-spin" size={18} aria-hidden="true" /> Saving change…</>
                        : `Change ${action}`}
                    </button>
                  </form>
                ) : null}

                {!sending ? (
                  <button className="verification-resend-link" type="button" onClick={() => { setTokenHash(''); setError(''); setRequestLink(true); }}>
                    Request a new recovery link
                  </button>
                ) : null}
              </>
            )}

            <Link
              className="admin-register-back"
              to="/"
              onClick={() => { endRecovery(); }}
            >
              {linkState === 'exchanged' ? 'Finish and sign out' : 'Back to sign in'}
            </Link>
          </section>
        )}
      </div>
    </main>
  );
};

export default RecoverAccount;
