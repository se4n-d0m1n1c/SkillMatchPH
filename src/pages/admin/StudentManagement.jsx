import { useCallback, useEffect, useRef, useState, useDeferredValue, memo } from 'react';
import { supabase } from '../../lib/supabase';
import { Search, Edit, Trash2, RefreshCw, X, Save, Loader } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';

// ─── Module-level constants (rendering-hoist-jsx) ────────────────────────────
// Hoisted outside the component so they are never recreated on re-render.

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
  backdropFilter: 'blur(6px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 2000,
  padding: '1rem',
};

// ─── EditModal component (rerender-no-inline-components) ─────────────────────
// Defined at module scope — not inside StudentManagement — so React never
// unmounts/remounts the modal tree on parent re-renders.

const EditModal = ({ student, onClose, onSave }) => {
  // Initialise form directly from prop (rerender-derived-state-no-effect).
  const [form, setForm] = useState(() =>
    EDIT_FIELDS.reduce((acc, { key }) => {
      acc[key] = student[key] ?? '';
      return acc;
    }, {})
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const firstInputRef = useRef(null);

  // Focus the first field when the modal opens.
  useEffect(() => { firstInputRef.current?.focus(); }, []);

  // Close on Escape key.
  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  // Generic field change handler — stable reference across renders
  // (rerender-functional-setstate: uses functional update form).
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
          borderRadius: '20px',
          padding: '2rem',
          width: '100%',
          maxWidth: '520px',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.4rem' }}>Edit Student</h2>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              {student.first_name} {student.last_name}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="action-btn"
            aria-label="Close edit modal"
            style={{ padding: '0.5rem' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          {EDIT_FIELDS.map(({ key, label, type, options }, idx) => (
            <div key={key} style={{ gridColumn: type === 'select' ? '1 / -1' : 'auto' }}>
              <label
                htmlFor={`edit-${key}`}
                style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}
              >
                {label}
              </label>

              {type === 'select' ? (
                <select
                  id={`edit-${key}`}
                  value={form[key]}
                  onChange={(e) => handleChange(key, e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 1rem',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid var(--glass-border, rgba(255,255,255,0.1))',
                    borderRadius: '10px',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                  }}
                >
                  {options.map((opt) => (
                    <option key={opt} value={opt} style={{ background: '#1a1a2e' }}>
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
                  style={{
                    width: '100%',
                    padding: '0.65rem 1rem',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid var(--glass-border, rgba(255,255,255,0.1))',
                    borderRadius: '10px',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem',
                    boxSizing: 'border-box',
                  }}
                />
              )}
            </div>
          ))}

          {/* Error */}
          {error ? (
            <p style={{ gridColumn: '1 / -1', margin: 0, color: '#ff4d4d', fontSize: '0.85rem' }}>{error}</p>
          ) : null}

          {/* Actions */}
          <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button type="button" onClick={onClose} className="action-btn" style={{ padding: '0.65rem 1.25rem', fontSize: '0.9rem' }}>
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="action-btn"
              style={{
                padding: '0.65rem 1.25rem',
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                background: saving ? 'rgba(0,242,254,0.1)' : 'rgba(0,242,254,0.15)',
                color: 'var(--accent-teal)',
                border: '1px solid rgba(0,242,254,0.3)',
              }}
            >
              {saving ? <Loader size={16} className="animate-spin" /> : <Save size={16} />}
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

// ─── DeleteConfirmationModal component (rerender-no-inline-components) ──────
const DeleteConfirmationModal = ({ student, onClose, onConfirm, isDeleting }) => {
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
          borderRadius: '20px',
          padding: '2rem',
          width: '100%',
          maxWidth: '400px',
          textAlign: 'center'
        }}
      >
        <div style={{
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: 'rgba(255, 77, 77, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.5rem',
          color: '#ff4d4d'
        }}>
          <Trash2 size={30} />
        </div>

        <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.4rem' }}>Delete Student?</h2>
        <p style={{ margin: '0 0 2rem', fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          Are you sure you want to delete <strong>{student.first_name} {student.last_name}</strong>?
          This action cannot be undone.
        </p>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            type="button"
            onClick={onClose}
            className="action-btn"
            disabled={isDeleting}
            style={{ flex: 1, padding: '0.75rem', fontSize: '0.9rem' }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="action-btn"
            style={{
              flex: 1,
              padding: '0.75rem',
              fontSize: '0.9rem',
              background: '#ff4d4d20',
              color: '#ff4d4d',
              border: '1px solid #ff4d4d40',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}
          >
            {isDeleting ? <Loader size={16} className="animate-spin" /> : <Trash2 size={16} />}
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// ─── SearchBar component (rerender-memo) ──────────────────────────────────────
const SearchBar = memo(({ value, onChange, inputRef, isLoading }) => {
  return (
    <div style={{ position: 'relative', width: '320px', flexShrink: 0 }}>
      <div style={{
        position: 'absolute',
        left: '1.25rem',
        top: '50%',
        transform: 'translateY(-50%)',
        color: 'var(--text-secondary)',
        pointerEvents: 'none',
        display: 'flex',
        alignItems: 'center',
        zIndex: 1
      }}>
        <Search size={18} style={{ opacity: value ? 1 : 0.4, transition: 'opacity 0.2s' }} />
      </div>

      <input
        ref={inputRef}
        type="text"
        placeholder="Search students..."
        className="search-input-field"
        style={{
          paddingLeft: '3.2rem',
          paddingRight: '3rem',
          width: '68%',
          height: '46px',
          cursor: 'text',
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid var(--glass-border)',
          borderRadius: '14px',
          fontSize: '0.95rem',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
        onFocus={(e) => {
          e.target.style.borderColor = 'var(--accent-teal)';
          e.target.style.background = 'rgba(255, 255, 255, 0.05)';
          e.target.style.boxShadow = '0 0 0 4px rgba(0, 242, 254, 0.05)';
        }}
        onBlur={(e) => {
          e.target.style.borderColor = 'var(--glass-border)';
          e.target.style.background = 'rgba(255, 255, 255, 0.03)';
          e.target.style.boxShadow = 'none';
        }}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />

      {/* Shortcut Hint or Clear Button */}
      <div style={{
        position: 'absolute',
        right: '1rem',
        top: '50%',
        transform: 'translateY(-50%)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
      }}>
        {value ? (
          <button
            onClick={() => onChange('')}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              borderRadius: '50%',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
            title="Clear search"
          >
            <X size={14} />
          </button>
        ) : (
          <div style={{
            padding: '2px 8px',
            borderRadius: '6px',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid var(--glass-border)',
            fontSize: '0.75rem',
            color: 'var(--text-secondary)',
            pointerEvents: 'none',
            fontFamily: 'monospace',
            opacity: 0.6
          }}>
            /
          </div>
        )}
      </div>
    </div>
  );
});

// ─── StudentTable component (rerender-memo) ───────────────────────────────────
const StudentTable = memo(({ students, loading, error, onApprove, onReject, onEdit, onDelete }) => {
  const getStatusStyle = (status) => ({
    padding: '0.35rem 0.85rem',
    borderRadius: '20px',
    background:
      status === 'approved' ? 'rgba(74, 222, 128, 0.1)' :
        status === 'rejected' ? 'rgba(255, 77, 77, 0.1)' :
          'rgba(251, 191, 36, 0.1)',
    color:
      status === 'approved' ? '#4ade80' :
        status === 'rejected' ? '#ff4d4d' :
          '#fbbf24',
    fontSize: '0.75rem',
    fontWeight: 600,
    textTransform: 'capitalize',
    display: 'inline-block'
  });

  if (loading && students.length === 0) {
    return (
      <div style={{ padding: '6rem 2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
        <Loader className="animate-spin" style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
        <p>Fetching student profiles...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '6rem 2rem', textAlign: 'center', color: '#ff4d4d' }}>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <table className="data-table" style={{ opacity: loading ? 0.6 : 1, transition: 'opacity 0.2s' }}>
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
          {students.map((student, i) => (
            <motion.tr
              key={student.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2, delay: i * 0.03 }}
            >
              <td style={{ fontWeight: 600 }}>
                {student.first_name ? `${student.first_name} ${student.last_name ?? ''}` : 'N/A'}
              </td>
              <td style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontFamily: 'monospace' }}>
                {student.id.slice(0, 8)}...
              </td>
              <td>{new Date(student.created_at || Date.now()).toLocaleDateString()}</td>
              <td>
                <span style={getStatusStyle(student.status)}>
                  {student.status || 'Pending'}
                </span>
              </td>
              <td>
                <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'flex-end' }}>
                  {student.status === 'pending' ? (
                    <>
                      <button
                        onClick={() => onApprove(student.id)}
                        className="action-btn accent"
                        style={{ color: 'var(--accent-teal)', fontSize: '0.75rem', fontWeight: 600 }}
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => onReject(student.id)}
                        className="action-btn danger"
                        style={{ color: '#ff4d4d', fontSize: '0.75rem', fontWeight: 600 }}
                      >
                        Reject
                      </button>
                    </>
                  ) : null}

                  <button
                    className="action-btn"
                    onClick={() => onEdit(student)}
                    title="Edit student"
                    aria-label={`Edit ${student.first_name ?? 'student'}`}
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    className="action-btn delete"
                    title="Delete student"
                    onClick={() => onDelete(student)}
                    aria-label={`Delete ${student.first_name ?? 'student'}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </td>
            </motion.tr>
          ))}
        </AnimatePresence>
        {students.length === 0 ? (
          <tr>
            <td colSpan="5" style={{ textAlign: 'center', padding: '6rem 2rem', color: 'var(--text-secondary)' }}>
              <div style={{ marginBottom: '1rem', opacity: 0.2 }}>
                <Search size={48} style={{ margin: '0 auto' }} />
              </div>
              <p>No students found matching your search.</p>
            </td>
          </tr>
        ) : null}
      </tbody>
    </table>
  );
});

// ─── Main component ───────────────────────────────────────────────────────────

const StudentManagement = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const deferredSearchTerm = useDeferredValue(searchTerm); // Keep input responsive (rerender-use-deferred-value)
  const [editTarget, setEditTarget] = useState(null); // student being edited
  const [deleteTarget, setDeleteTarget] = useState(null); // student being deleted
  const [isDeleting, setIsDeleting] = useState(false);

  useAuth();

  const searchInputRef = useRef(null);

  useEffect(() => {
    fetchStudents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Focus search on '/' key press if no other input is focused
      if (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: dbError } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'student');

      if (dbError) throw dbError;
      setStudents(data || []);
    } catch (err) {
      setError('Unable to load students. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleApprove = useCallback(async (id) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status: 'approved' })
        .eq('id', id);

      if (error) throw error;
      // Functional setState for stable, optimistic update (rerender-functional-setstate).
      setStudents((prev) => prev.map((s) => (s.id === id ? { ...s, status: 'approved' } : s)));
    } catch (err) {
      alert('Error approving student: ' + err.message);
    }
  }, []);

  const handleReject = useCallback(async (id) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status: 'rejected' })
        .eq('id', id);

      if (error) throw error;
      setStudents((prev) => prev.map((s) => (s.id === id ? { ...s, status: 'rejected' } : s)));
    } catch (err) {
      alert('Error rejecting student: ' + err.message);
    }
  }, []);

  // Called by EditModal when the DB write succeeds.
  const handleEditSave = useCallback((updated) => {
    setStudents((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    setEditTarget(null);
  }, []);

  const handleEditClose = useCallback(() => setEditTarget(null), []);

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    try {
      // Call the RPC function to delete both Auth and Profile
      const { error } = await supabase.rpc('delete_student', {
        target_user_id: deleteTarget.id
      });

      if (error) throw error;

      // Functional setState for stable update (rerender-functional-setstate).
      setStudents((prev) => prev.filter((s) => s.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      console.error('Delete error:', err);
      alert('Error deleting student: ' + err.message);
    } finally {
      setIsDeleting(false);
    }
  }, [deleteTarget]);

  const handleDeleteClose = useCallback(() => setDeleteTarget(null), []);

  // Derived filter using deferred value — keeps UI responsive during heavy filtering (rerender-derived-state-no-effect).
  const filteredStudents = students.filter((student) => {
    const fullName = `${student.first_name ?? ''} ${student.last_name ?? ''}`.toLowerCase();
    // Search both name and ID
    return fullName.includes(deferredSearchTerm.toLowerCase()) ||
      student.id.toLowerCase().includes(deferredSearchTerm.toLowerCase());
  });


  return (
    <>
      <div className="student-management">
        <header style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '3rem',
          gap: '2rem',
          width: '100%',
          boxSizing: 'border-box'
        }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <h1 style={{
              fontSize: '2.8rem',
              fontWeight: 800,
              letterSpacing: '-0.02em',
              marginBottom: '0.5rem',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              background: 'linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.7) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              Student Management
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
              View and manage student profiles.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <button
              onClick={fetchStudents}
              className="refresh-btn"
              title="Refresh list"
            >
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            </button>

            <SearchBar
              value={searchTerm}
              onChange={setSearchTerm}
              inputRef={searchInputRef}
              isLoading={loading}
            />
          </div>
        </header>

        <div className="data-table-container" style={{
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid var(--glass-border)',
          borderRadius: '24px',
          overflow: 'hidden',
          backdropFilter: 'blur(10px)'
        }}>
          <StudentTable
            students={filteredStudents}
            loading={loading}
            error={error}
            onApprove={handleApprove}
            onReject={handleReject}
            onEdit={setEditTarget}
            onDelete={setDeleteTarget}
          />
        </div>
      </div>

      {/* AnimatePresence handles mount/unmount animations for the modal */}
      <AnimatePresence>
        {editTarget ? (
          <EditModal
            key={editTarget.id}
            student={editTarget}
            onClose={handleEditClose}
            onSave={handleEditSave}
          />
        ) : null}

        {deleteTarget ? (
          <DeleteConfirmationModal
            key={`delete-${deleteTarget.id}`}
            student={deleteTarget}
            onClose={handleDeleteClose}
            onConfirm={handleDelete}
            isDeleting={isDeleting}
          />
        ) : null}
      </AnimatePresence>
    </>
  );
};

export default StudentManagement;
