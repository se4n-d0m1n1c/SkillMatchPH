import { useEffect, useRef, useState } from 'react';
import { Camera, CheckCircle2, Loader2, Save, Upload, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const STRANDS = {
  Academic: ['STEM', 'ABM', 'HUMSS', 'GAS'],
  'Technical-Vocational-Livelihood (TVL)': ['ICT', 'HE', 'IA', 'Agri-Fishery'],
};

const makeForm = (profile) => ({
  first_name: profile?.first_name || '',
  last_name: profile?.last_name || '',
  student_no: profile?.student_no || '',
  grade_level: String(profile?.grade_level || 11),
  shs_track: profile?.shs_track || 'Academic',
  shs_strand: profile?.shs_strand || 'STEM',
});

const ProfileEditor = ({ user, profile, avatarUrl, onClose, onSaved }) => {
  const [form, setForm] = useState(() => makeForm(profile));
  const [avatarFile, setAvatarFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(avatarUrl || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const fileInput = useRef(null);

  useEffect(() => () => {
    if (previewUrl?.startsWith('blob:')) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const updateField = (field) => (event) => {
    const value = event.target.value;
    setForm((current) => {
      const next = { ...current, [field]: value };
      if (field === 'shs_track') next.shs_strand = STRANDS[value][0];
      return next;
    });
  };

  const selectAvatar = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Choose a JPG, PNG, or WebP image.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('Profile pictures must be 2 MB or smaller.');
      return;
    }
    if (previewUrl?.startsWith('blob:')) URL.revokeObjectURL(previewUrl);
    setAvatarFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setError('');
  };

  const uploadAvatar = async () => {
    if (!avatarFile) return profile?.avatar_path || null;
    const extension = avatarFile.type.split('/')[1].replace('jpeg', 'jpg');
    const path = `${user.id}/avatar.${extension}`;
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, avatarFile, { upsert: true, contentType: avatarFile.type });
    if (uploadError) {
      throw new Error(`Profile picture upload failed: ${uploadError.message}`);
    }

    return path;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setSuccess(false);
    setError('');

    try {
      const avatarPath = await uploadAvatar();
      const updates = {
        ...form,
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        student_no: form.student_no.trim(),
        grade_level: Number(form.grade_level),
        avatar_path: avatarPath,
      };
      const { error: updateError } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);
      if (updateError) {
        const wrappedError = new Error(`Profile information update failed: ${updateError.message}`);
        wrappedError.code = updateError.code;
        throw wrappedError;
      }

      const { error: metadataError } = await supabase.auth.updateUser({
        data: { first_name: updates.first_name, last_name: updates.last_name },
      });
      if (metadataError) throw new Error(`Account name sync failed: ${metadataError.message}`);

      await onSaved();
      setSuccess(true);
      setTimeout(onClose, 700);
    } catch (saveError) {
      setError(saveError.code === '23505'
        ? 'That student number is already in use.'
        : saveError.message || 'Unable to update your profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="profile-editor-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="profile-editor glass-card" role="dialog" aria-modal="true" aria-labelledby="profile-editor-title">
        <header className="profile-editor-header">
          <div><span>Student account</span><h2 id="profile-editor-title">Edit profile</h2></div>
          <button type="button" className="profile-icon-button" onClick={onClose} aria-label="Close profile editor"><X size={20} /></button>
        </header>

        <form onSubmit={handleSubmit}>
          <div className="avatar-editor">
            <div className="avatar-editor-preview">
              {previewUrl ? <img src={previewUrl} alt="Profile preview" /> : <span>{form.first_name.charAt(0) || 'S'}</span>}
              <Camera size={18} />
            </div>
            <div><strong>Profile picture</strong><p>JPG, PNG, or WebP. Maximum 2 MB.</p>
              <button type="button" className="profile-secondary-button" onClick={() => fileInput.current?.click()}><Upload size={16} /> Choose image</button>
              <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp" onChange={selectAvatar} hidden />
            </div>
          </div>

          <div className="profile-form-grid">
            <label><span>First name</span><input required maxLength="80" value={form.first_name} onChange={updateField('first_name')} /></label>
            <label><span>Last name</span><input required maxLength="80" value={form.last_name} onChange={updateField('last_name')} /></label>
            <label><span>Student number</span><input required maxLength="50" value={form.student_no} onChange={updateField('student_no')} /></label>
            <label><span>Grade level</span><select value={form.grade_level} onChange={updateField('grade_level')}><option value="11">Grade 11</option><option value="12">Grade 12</option></select></label>
            <label><span>SHS track</span><select value={form.shs_track} onChange={updateField('shs_track')}>{Object.keys(STRANDS).map((track) => <option key={track}>{track}</option>)}</select></label>
            <label><span>SHS strand</span><select value={form.shs_strand} onChange={updateField('shs_strand')}>{(STRANDS[form.shs_track] || []).map((strand) => <option key={strand}>{strand}</option>)}</select></label>
          </div>

          {error ? <p className="profile-form-message error">{error}</p> : null}
          {success ? <p className="profile-form-message success"><CheckCircle2 size={17} /> Profile updated</p> : null}
          <footer className="profile-editor-actions">
            <button type="button" className="profile-secondary-button" onClick={onClose}>Cancel</button>
            <button type="submit" className="profile-save-button" disabled={saving}>{saving ? <Loader2 className="animate-spin" size={17} /> : <Save size={17} />} {saving ? 'Saving…' : 'Save changes'}</button>
          </footer>
        </form>
      </section>
    </div>
  );
};

export default ProfileEditor;
