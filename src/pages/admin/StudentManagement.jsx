import { useCallback, useEffect, useRef, useState, useDeferredValue, memo, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import { Search, Edit, Trash2, RefreshCw, X, Save, Loader } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import useSWR from 'swr';

// ─── Module-level constants (rendering-hoist-jsx) ────────────────────────────
const EDIT_FIELDS = [
  { key: 'first_name', label: 'First Name', type: 'text' },
  { key: 'last_name', label: 'Last Name', type: 'text' },
  { key: 'student_no', label: 'Student No.', type: 'text' },
  { key: 'grade_level', label: 'Grade Level', type: 'number' },
  { key: 'shs_track', label: 'SHS Track', type: 'text' },
  { key: 'shs_strand', label: 'SHS Strand', type: 'text' },
  {
    key: 'status',
    label: 'Status',
    type: 'select',
    options: ['pending', 'approved', 'rejected'],
  },
];

const MODAL_OVERLAY_STYLE = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.6)',
  backdropFilter: 'blur(8px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 2000,
  padding: '1rem',
};

// ─── Fetcher (client-swr-dedup) ──────────────────────────────────────────────
const fetchStudents = async () => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'student')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

// ─── Sub-components (rerender-no-inline-components) ──────────────────────────

const EditModal = memo(({ student, onClose, onSave }) => {
  const [form, setForm] = useState(() =>
    EDIT_FIELDS.reduce((acc, { key }) => {
      acc[key] = student[key] ?? '';
      return acc;
    }, {})
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const firstInputRef = useRef(null);

  useEffect(() => { firstInputRef.current?.focus(); }, []);

  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const handleChange = useCallback((key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const { error: dbError } = await supabase
        .from('profiles')
        .update(form)
        .eq('id', student.id);

      if (dbError) throw dbError;
      onSave({ ...student, ...form });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={MODAL_OVERLAY_STYLE} onClick={onClose} role="dialog" aria-modal="true" aria-label="Edit student">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--bg-deep, #0d0d14)',
          border: '1px solid var(--glass-border, rgba(255,255,255,0.1))',
          borderRadius: '24px',
          padding: '2.5rem',
          width: '100%',
          maxWidth: '520px',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 700 }}>Edit Student</h2>
            <p style={{ margin: '0.4rem 0 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Update profile for {student.first_name} {student.last_name}
            </p>
          </div>
          <button type="button" onClick={onClose} className="icon-btn" aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
          {EDIT_FIELDS.map(({ key, label, type, options }, idx) => (
            <div key={key} style={{ gridColumn: type === 'select' ? '1 / -1' : 'auto' }} className="form-group">
              <label htmlFor={`edit-${key}`}>{label}</label>
              {type === 'select' ? (
                <select
                  id={`edit-${key}`}
                  value={form[key]}
                  onChange={(e) => handleChange(key, e.target.value)}
                  style={{ width: '100%', cursor: 'pointer' }}
                >
                  {options.map((opt) => (
                    <option key={opt} value={opt} style={{ background: '#0a0f1e' }}>
                      {opt.charAt(0).toUpperCase() + opt.slice(1)}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  ref={idx === 0 ? firstInputRef : null}
                  id={`edit-${key}`}
                  type={type}
                  value={form[key]}
                  onChange={(e) => handleChange(key, e.target.value)}
                  style={{ width: '100%' }}
                />
              )}
            </div>
          ))}

          {error && (
            <p style={{ gridColumn: '1 / -1', margin: 0, color: '#ff4d4d', fontSize: '0.85rem', background: 'rgba(255, 77, 77, 0.1)', padding: '0.75rem', borderRadius: '8px' }}>
              {error}
            </p>
          )}

          <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
            <button type="button" onClick={onClose} className="icon-btn" style={{ height: '45px', width: 'auto', padding: '0 1.5rem', borderRadius: '12px' }}>
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="submit-btn"
              style={{ flex: 1, marginTop: 0 }}
            >
              {saving ? <Loader size={18} className="animate-spin" /> : <Save size={18} />}
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
});

const DeleteConfirmationModal = memo(({ student, onClose, onConfirm, isDeleting }) => {
  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <div style={MODAL_OVERLAY_STYLE} onClick={onClose} role="dialog" aria-modal="true" aria-label="Confirm deletion">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--bg-deep, #0d0d14)',
          border: '1px solid var(--glass-border, rgba(255,255,255,0.1))',
          borderRadius: '24px',
          padding: '2.5rem',
          width: '100%',
          maxWidth: '420px',
          textAlign: 'center',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
        }}
      >
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          background: 'rgba(255, 77, 77, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.5rem',
          color: '#ff4d4d',
          boxShadow: '0 0 20px rgba(255, 77, 77, 0.1)'
        }}>
          <Trash2 size={32} />
        </div>

        <h2 style={{ margin: '0 0 0.75rem', fontSize: '1.5rem', fontWeight: 700 }}>Delete Student?</h2>
        <p style={{ margin: '0 0 2.5rem', fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          Are you sure you want to delete <strong>{student.first_name} {student.last_name}</strong>?<br/>
          This action will permanently remove their account and cannot be undone.
        </p>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            type="button"
            onClick={onClose}
            className="icon-btn"
            disabled={isDeleting}
            style={{ flex: 1, height: '48px', width: 'auto', borderRadius: '12px' }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="icon-btn delete"
            style={{
              flex: 1,
              height: '48px',
              width: 'auto',
              borderRadius: '12px',
              background: 'rgba(255, 77, 77, 0.1)',
              color: '#ff4d4d',
              fontWeight: 600,
              gap: '0.5rem'
            }}
          >
            {isDeleting ? <Loader size={18} className="animate-spin" /> : <Trash2 size={18} />}
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </motion.div>
    </div>
  );
});

const SearchBar = memo(({ value, onChange, inputRef, isLoading }) => {
  return (
    <div className="glass-card" style={{ padding: '0.5rem', borderRadius: '16px', display: 'flex', alignItems: 'center', width: '350px' }}>
      <div style={{ position: 'relative', flex: 1 }}>
        <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', opacity: value ? 1 : 0.5 }} />
        <input
          ref={inputRef}
          type="text"
          placeholder="Search students..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            width: '100%',
            padding: '0.75rem 2.5rem 0.75rem 2.8rem',
            background: 'rgba(0,0,0,0.2)',
            border: '1px solid var(--glass-border)',
            borderRadius: '12px',
            fontSize: '0.9rem',
            color: '#fff',
            outline: 'none'
          }}
        />
        {value && (
          <button
            onClick={() => onChange('')}
            style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex' }}
          >
            <X size={16} />
          </button>
        )}
      </div>
    </div>
  );
});

// ─── Main Component ───────────────────────────────────────────────────────────

const StudentManagement = () => {
  const { data: students = [], error: swrError, isLoading, mutate } = useSWR('admin-students', fetchStudents);
  const [searchTerm, setSearchTerm] = useState('');
  const deferredSearchTerm = useDeferredValue(searchTerm);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const searchInputRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleApprove = useCallback(async (id) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status: 'approved' })
        .eq('id', id);

      if (error) throw error;
      mutate(prev => prev.map(s => (s.id === id ? { ...s, status: 'approved' } : s)), false);
    } catch (err) {
      alert('Error approving student: ' + err.message);
    }
  }, [mutate]);

  const handleReject = useCallback(async (id) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status: 'rejected' })
        .eq('id', id);

      if (error) throw error;
      mutate(prev => prev.map(s => (s.id === id ? { ...s, status: 'rejected' } : s)), false);
    } catch (err) {
      alert('Error rejecting student: ' + err.message);
    } [mutate];
  }, [mutate]);

  const handleEditSave = useCallback((updated) => {
    mutate(prev => prev.map(s => (s.id === updated.id ? updated : s)), false);
    setEditTarget(null);
  }, [mutate]);

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const { error } = await supabase.rpc('delete_student', { target_user_id: deleteTarget.id });
      if (error) throw error;
      mutate(prev => prev.filter(s => s.id !== deleteTarget.id), false);
      setDeleteTarget(null);
    } catch (err) {
      alert('Error deleting student: ' + err.message);
    } finally {
      setIsDeleting(false);
    }
  }, [deleteTarget, mutate]);

  const filteredStudents = useMemo(() => {
    const lowerQuery = deferredSearchTerm.toLowerCase();
    if (!lowerQuery) return students;
    return students.filter((student) => {
      const fullName = `${student.first_name ?? ''} ${student.last_name ?? ''}`.toLowerCase();
      return fullName.includes(lowerQuery) || student.id.toLowerCase().includes(lowerQuery);
    });
  }, [students, deferredSearchTerm]);

  return (
    <div className="admin-page">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '4rem' }}>
        <div>
          <h1 style={{ fontSize: '3rem', margin: 0, lineHeight: 1 }}>Student Management</h1>
          <p style={{ color: 'var(--text-secondary)', margin: '1rem 0 0', fontSize: '1.1rem' }}>
            View and manage student profiles.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button onClick={() => mutate()} className="refresh-btn" title="Refresh list">
            <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
          </button>
          <SearchBar value={searchTerm} onChange={setSearchTerm} inputRef={searchInputRef} />
        </div>
      </header>

      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>User ID</th>
              <th>Joined Date</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence mode="popLayout">
              {filteredStudents.map((student, i) => (
                <motion.tr
                  key={student.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2, delay: i * 0.02 }}
                >
                  <td style={{ fontWeight: 600 }}>{student.first_name} {student.last_name}</td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontFamily: 'monospace' }}>{student.id.slice(0, 8)}...</td>
                  <td>{new Date(student.created_at).toLocaleDateString()}</td>
                  <td>
                    <span className={`status-badge ${student.status}`}>
                      {student.status || 'Pending'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'flex-end' }}>
                      {student.status === 'pending' && (
                        <>
                          <button onClick={() => handleApprove(student.id)} className="icon-btn" style={{ color: 'var(--accent-teal)', fontSize: '0.75rem', fontWeight: 600, width: 'auto', padding: '0 0.75rem' }}>Approve</button>
                          <button onClick={() => handleReject(student.id)} className="icon-btn" style={{ color: '#ff4d4d', fontSize: '0.75rem', fontWeight: 600, width: 'auto', padding: '0 0.75rem' }}>Reject</button>
                        </>
                      )}
                      <button onClick={() => setEditTarget(student)} className="icon-btn"><Edit size={16} /></button>
                      <button onClick={() => setDeleteTarget(student)} className="icon-btn delete"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
            {!isLoading && filteredStudents.length === 0 && (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '10rem', color: 'var(--text-secondary)' }}>
                  <Search size={40} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                  <p>No students found matching your search.</p>
                </td>
              </tr>
            )}
            {isLoading && students.length === 0 && (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '10rem' }}>
                  <Loader className="animate-spin" size={32} color="var(--accent-teal)" />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {editTarget && <EditModal student={editTarget} onClose={() => setEditTarget(null)} onSave={handleEditSave} />}
        {deleteTarget && <DeleteConfirmationModal student={deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} isDeleting={isDeleting} />}
      </AnimatePresence>

      <style>{`
        .status-badge {
          padding: 0.35rem 0.85rem;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: capitalize;
          display: inline-block;
        }
        .status-badge.approved { background: rgba(74, 222, 128, 0.1); color: #4ade80; }
        .status-badge.rejected { background: rgba(255, 77, 77, 0.1); color: #ff4d4d; }
        .status-badge.pending { background: rgba(251, 191, 36, 0.1); color: #fbbf24; }
      `}</style>
    </div>
  );
};

export default StudentManagement;
