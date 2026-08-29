import { useMemo, useState } from 'react';
import { AtSign, CheckCircle2, Eye, EyeOff, KeyRound, Loader2, Save, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const formatNextChange = (value) => value
  ? new Date(value).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })
  : null;

const UsernameEditor = ({ profile, onClose, onSaved }) => {
  const [username, setUsername] = useState(profile?.username || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const nextChangeAt = useMemo(() => profile?.username_changed_at
    ? new Date(profile.username_changed_at).getTime() + 30 * 24 * 60 * 60 * 1000
    : null, [profile?.username_changed_at]);
  const cooldownActive = nextChangeAt && nextChangeAt > Date.now();

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    const { data, error: functionError } = await supabase.functions.invoke('change-student-username', {
      body: { username, password },
    });
    setSaving(false);

    if (functionError) {
      let message = data?.error;
      if (!message && functionError.context) {
        try { message = (await functionError.context.json()).error; } catch { /* platform error */ }
      }
      setError(message || 'Unable to change your username.');
      return;
    }

    await onSaved();
    setPassword('');
    setSuccess(`Username changed to ${data.username}. You can change it again on ${formatNextChange(data.next_change_at)}.`);
  };

  return (
    <div className="profile-editor-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="profile-editor username-editor glass-card" role="dialog" aria-modal="true" aria-labelledby="username-editor-title">
        <header className="profile-editor-header">
          <div><span>Login security</span><h2 id="username-editor-title">Change username</h2></div>
          <button type="button" className="profile-icon-button" onClick={onClose} aria-label="Close username editor"><X size={20} /></button>
        </header>

        <form onSubmit={submit}>
          <p className="username-editor-note">For security, enter your current password. Your username can only be changed once every 30 days.</p>

          <label className="username-editor-field">
            <span>New username</span>
            <div><AtSign size={18} /><input required minLength="3" maxLength="30" pattern="[A-Za-z0-9][A-Za-z0-9._-]{2,29}" value={username} onChange={(event) => setUsername(event.target.value)} disabled={cooldownActive} /></div>
          </label>
          <label className="username-editor-field">
            <span>Current password</span>
            <div><KeyRound size={18} /><input required type={showPassword ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} disabled={cooldownActive} />
              <button type="button" onClick={() => setShowPassword((current) => !current)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button>
            </div>
          </label>

          {cooldownActive ? <p className="profile-form-message error">You can change your username again on {formatNextChange(nextChangeAt)}.</p> : null}
          {error ? <p className="profile-form-message error">{error}</p> : null}
          {success ? <p className="profile-form-message success"><CheckCircle2 size={17} /> {success}</p> : null}

          <footer className="profile-editor-actions">
            <button type="button" className="profile-secondary-button" onClick={onClose}>Close</button>
            <button type="submit" className="profile-save-button" disabled={saving || cooldownActive || username.trim().toLowerCase() === profile?.username}>
              {saving ? <Loader2 className="animate-spin" size={17} /> : <Save size={17} />} {saving ? 'Verifying…' : 'Change username'}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
};

export default UsernameEditor;
