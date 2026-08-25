import { useState } from 'react';
import { Check, Clipboard, Loader2, Plus, ShieldCheck, Trash2 } from 'lucide-react';
import useSWR from 'swr';
import { supabase } from '../../lib/supabase';

const fetchInvites = async () => {
  const { data, error } = await supabase.rpc('list_admin_invites');
  if (error) throw error;
  return data ?? [];
};

const getInviteStatus = (invite) => {
  if (invite.used_at) return { label: 'Used', className: 'used' };
  if (invite.revoked_at) return { label: 'Revoked', className: 'revoked' };
  if (new Date(invite.expires_at) <= new Date()) return { label: 'Expired', className: 'expired' };
  return { label: 'Active', className: 'active' };
};

const AdminInvites = () => {
  const { data: invites = [], error, isLoading, mutate } = useSWR('admin-invites', fetchInvites);
  const [creating, setCreating] = useState(false);
  const [actionError, setActionError] = useState('');
  const [newInvite, setNewInvite] = useState(null);
  const [copied, setCopied] = useState(false);

  const createInvite = async () => {
    setCreating(true);
    setActionError('');
    const { data, error: createError } = await supabase.rpc('generate_admin_invite', { valid_for_hours: 72 });
    setCreating(false);

    if (createError) {
      setActionError(createError.message);
      return;
    }

    setNewInvite(data?.[0] ?? null);
    setCopied(false);
    mutate();
  };

  const copyInvite = async () => {
    if (!newInvite?.invite_code) return;
    try {
      await navigator.clipboard.writeText(newInvite.invite_code);
      setCopied(true);
    } catch {
      setActionError('Could not copy automatically. Select and copy the code manually.');
    }
  };

  const revokeInvite = async (inviteId) => {
    setActionError('');
    const { error: revokeError } = await supabase.rpc('revoke_admin_invite', { target_invite_id: inviteId });
    if (revokeError) setActionError(revokeError.message);
    else mutate();
  };

  return (
    <div className="admin-page">
      <header className="page-header">
        <div>
          <h1 style={{ marginBottom: '0.5rem' }}>Admin Invitations</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Securely invite trusted staff to create administrator accounts.</p>
        </div>
        <button type="button" className="invite-create-btn" onClick={createInvite} disabled={creating}>
          {creating ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
          Generate invite
        </button>
      </header>

      {newInvite ? (
        <div className="invite-reveal glass-card">
          <ShieldCheck size={28} />
          <div>
            <strong>Invite created — copy it now</strong>
            <p>This code is shown only once and expires in 72 hours.</p>
            <code>{newInvite.invite_code}</code>
          </div>
          <button type="button" onClick={copyInvite}>
            {copied ? <Check size={17} /> : <Clipboard size={17} />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      ) : null}

      {actionError ? <p className="admin-action-error">{actionError}</p> : null}

      <div className="data-table-container invite-table">
        <table className="data-table">
          <thead><tr><th>Created</th><th>Created by</th><th>Expires</th><th>Status</th><th>Used by</th><th>Action</th></tr></thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan="6" className="table-state">Loading invitations…</td></tr>
            ) : error ? (
              <tr><td colSpan="6" className="table-state error">Run the admin_invites.sql migration to enable invitations.</td></tr>
            ) : invites.length === 0 ? (
              <tr><td colSpan="6" className="table-state">No invitations have been created.</td></tr>
            ) : invites.map((invite) => {
              const status = getInviteStatus(invite);
              return (
                <tr key={invite.id}>
                  <td>{new Date(invite.created_at).toLocaleDateString('en-PH')}</td>
                  <td>{invite.created_by_name || 'Administrator'}</td>
                  <td>{new Date(invite.expires_at).toLocaleString('en-PH')}</td>
                  <td><span className={`invite-status ${status.className}`}>{status.label}</span></td>
                  <td>{invite.used_by_name || '—'}</td>
                  <td>
                    {status.className === 'active' ? (
                      <button type="button" className="icon-btn delete" onClick={() => revokeInvite(invite.id)} aria-label="Revoke invitation">
                        <Trash2 size={16} />
                      </button>
                    ) : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminInvites;
