import { useEffect, useState } from 'react';
import { AtSign, CheckCircle2, Loader2, Save, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

const AdminProfile = () => {
  const { user, profile, refreshProfile } = useAuth();
  const [username, setUsername] = useState(profile?.username || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    setUsername(profile?.username || '');
  }, [profile?.username]);

  const saveUsername = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    const { data, error: updateError } = await supabase.rpc('update_own_admin_username', {
      requested_username: username,
    });
    setSaving(false);

    if (updateError) {
      setError(updateError.message || 'Unable to update your username.');
      return;
    }

    setUsername(data);
    await refreshProfile();
    setSuccess('Username updated. Use it the next time you sign in.');
  };

  const fullName = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || 'Administrator';

  return (
    <div className="admin-page admin-profile-page">
      <header className="page-header">
        <div>
          <h1 style={{ marginBottom: '0.5rem' }}>Admin Profile</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Manage your administrator identity and login username.</p>
        </div>
      </header>

      <section className="admin-profile-card glass-card">
        <div className="admin-profile-identity">
          <span className="admin-profile-avatar"><ShieldCheck size={28} /></span>
          <div>
            <h2>{fullName}</h2>
            <p>{user?.email || 'Administrator account'}</p>
          </div>
        </div>

        <form onSubmit={saveUsername} className="admin-profile-form">
          <label htmlFor="admin-profile-username">Login username</label>
          <div className="admin-profile-input">
            <AtSign size={18} />
            <input
              id="admin-profile-username"
              required
              minLength="3"
              maxLength="30"
              pattern="[A-Za-z0-9][A-Za-z0-9._-]{2,29}"
              title="Use 3–30 letters, numbers, dots, underscores, or hyphens."
              autoComplete="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
            />
          </div>
          <small>3–30 characters. Letters, numbers, dots, underscores, and hyphens are allowed.</small>

          {error ? <p className="admin-action-error">{error}</p> : null}
          {success ? <p className="admin-profile-success"><CheckCircle2 size={17} /> {success}</p> : null}

          <button type="submit" className="invite-create-btn" disabled={saving || username.trim().toLowerCase() === profile?.username}>
            {saving ? <Loader2 className="animate-spin" size={17} /> : <Save size={17} />}
            {saving ? 'Saving…' : 'Save username'}
          </button>
        </form>
      </section>
    </div>
  );
};

export default AdminProfile;
