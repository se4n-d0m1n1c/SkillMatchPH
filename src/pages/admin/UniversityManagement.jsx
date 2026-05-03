import React, { useState, useMemo, useCallback, useDeferredValue, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building, Plus, Search, Edit2, Trash2, X,
  ExternalLink, MapPin, Globe, Check, AlertCircle,
  Loader2, GraduationCap
} from 'lucide-react';
import useSWR, { useSWRConfig } from 'swr';
import { supabase } from '../../lib/supabase';

// ─── Constants & Fetchers (async-parallel & rerender-memo-with-default-value) ─
const EMPTY_ARRAY = [];
const INITIAL_UNI_FORM = {
  name: '',
  location: '',
  website: '',
  logo_url: '',
  program_ids: []
};

const fetchManagementData = async () => {
  const [uniResult, progResult] = await Promise.all([
    supabase.from('universities').select('*, program_universities(program_id)').order('name'),
    supabase.from('programs').select('id, title').order('title')
  ]);

  if (uniResult.error) throw uniResult.error;
  if (progResult.error) throw progResult.error;

  return {
    universities: uniResult.data.map(u => ({
      ...u,
      program_ids: u.program_universities.map(pu => pu.program_id)
    })),
    programs: progResult.data
  };
};

// ─── Sub-components (rerender-no-inline-components) ──────────────────────────

const UniversityCard = memo(({ university, onEdit, onDelete, index }) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="glass-card"
      style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', borderRadius: '24px' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{
          width: '60px', height: '60px', borderRadius: '16px',
          background: 'rgba(0, 242, 254, 0.1)', color: 'var(--accent-teal)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 8px 16px rgba(0, 242, 254, 0.05)'
        }}>
          <Building size={28} />
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={() => onEdit(university)} className="icon-btn" title="Edit"><Edit2 size={18} /></button>
          <button onClick={() => onDelete(university.id)} className="icon-btn delete" title="Delete"><Trash2 size={18} /></button>
        </div>
      </div>

      <div>
        <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.4rem', fontWeight: 700 }}>{university.name}</h3>
        <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <MapPin size={16} /> {university.location || 'No location set'}
        </p>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', marginTop: 'auto' }}>
        <div style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem', borderRadius: '8px', background: 'rgba(112, 0, 255, 0.1)', color: 'var(--accent-violet)', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}>
          <GraduationCap size={14} /> {university.program_ids.length} Programs
        </div>
        {university.website ? (
          <a href={university.website} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: 'var(--accent-teal)', display: 'flex', alignItems: 'center', gap: '0.4rem', textDecoration: 'none', transition: 'all 0.2s', border: '1px solid transparent' }} className="hover-border">
            <Globe size={14} /> Website <ExternalLink size={12} />
          </a>
        ) : null}
      </div>
    </motion.div>
  );
});

const UniversityModal = memo(({ university, programs, onClose, onSave }) => {
  // Use lazy state initialization to prevent object recreation on every modal render (rerender-lazy-state-init)
  const [formData, setFormData] = useState(() => university || INITIAL_UNI_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  const toggleProgram = useCallback((id) => {
    setFormData(prev => ({
      ...prev,
      program_ids: prev.program_ids.includes(id)
        ? prev.program_ids.filter(pid => pid !== id)
        : [...prev.program_ids, id]
    }));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    try {
      await onSave(formData);
      onClose();
    } catch (err) {
      setError(err.message);
      setIsSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        className="glass-card modal-content"
        onClick={e => e.stopPropagation()}
        style={{ padding: '2.5rem' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.75rem' }}>{university ? 'Edit University' : 'Add University'}</h2>
          <button onClick={onClose} className="icon-btn" aria-label="Close modal"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="form-group">
            <label htmlFor="uni-name">University Name</label>
            <input
              id="uni-name"
              required
              value={formData.name}
              onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g. Taguig City University"
            />
          </div>

          <div className="form-group">
            <label htmlFor="uni-location">Location</label>
            <input
              id="uni-location"
              value={formData.location}
              onChange={e => setFormData(prev => ({ ...prev, location: e.target.value }))}
              placeholder="e.g. Taguig City"
            />
          </div>

          <div className="form-group">
            <label htmlFor="uni-website">Website URL</label>
            <input
              id="uni-website"
              type="url"
              value={formData.website}
              onChange={e => setFormData(prev => ({ ...prev, website: e.target.value }))}
              placeholder="https://..."
            />
          </div>

          <div className="form-group">
            <label style={{ marginBottom: '0.25rem', display: 'block' }}>Linked Programs</label>
            <div
              role="group"
              aria-label="Assign programs"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                gap: '0.75rem',
                maxHeight: '250px',
                overflowY: 'auto',
                padding: '1.25rem',
                background: 'rgba(0,0,0,0.3)',
                borderRadius: '16px',
                border: '1px solid var(--glass-border)'
              }}
            >
              {programs.map(prog => (
                <label
                  key={prog.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    padding: '0.6rem 0.8rem',
                    borderRadius: '10px',
                    transition: 'all 0.2s',
                    background: formData.program_ids.includes(prog.id) ? 'rgba(0, 242, 254, 0.1)' : 'rgba(255,255,255,0.02)',
                    border: '1px solid',
                    borderColor: formData.program_ids.includes(prog.id) ? 'rgba(0, 242, 254, 0.3)' : 'transparent'
                  }}
                >
                  <input
                    type="checkbox"
                    checked={formData.program_ids.includes(prog.id)}
                    onChange={() => toggleProgram(prog.id)}
                    style={{ cursor: 'pointer', accentColor: 'var(--accent-teal)', width: '16px', height: '16px' }}
                  />
                  <span style={{ color: formData.program_ids.includes(prog.id) ? 'var(--accent-teal)' : 'var(--text-secondary)' }}>
                    {prog.title}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {error ? (
            <div role="alert" style={{ color: '#ff4d4d', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255, 77, 77, 0.1)', padding: '0.75rem', borderRadius: '8px' }}>
              <AlertCircle size={16} /> {error}
            </div>
          ) : null}

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button type="button" onClick={onClose} className="icon-btn" style={{ flex: 1, height: '45px', borderRadius: '12px', width: 'auto' }}>Cancel</button>
            <button type="submit" disabled={isSaving} className="submit-btn" style={{ flex: 2, marginTop: 0 }}>
              {isSaving ? <Loader2 className="animate-spin" /> : (university ? 'Save Changes' : 'Create University')}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
});

// ─── Main Component ──────────────────────────────────────────────────────────

const UniversityManagement = () => {
  const { data, error, isLoading, mutate } = useSWR('admin-universities', fetchManagementData);
  const [searchQuery, setSearchQuery] = useState('');
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const [modalMode, setModalMode] = useState(null); // 'add' | 'edit' | null
  const [selectedUni, setSelectedUni] = useState(null);

  // 1. Search Filtering
  const filteredUniversities = useMemo(() => {
    const lowerQuery = deferredSearchQuery.toLowerCase();
    const unis = data?.universities || EMPTY_ARRAY;
    if (!lowerQuery) return unis;
    return unis.filter(u =>
      u.name.toLowerCase().includes(lowerQuery) ||
      u.location?.toLowerCase().includes(lowerQuery)
    );
  }, [data?.universities, deferredSearchQuery]);

  // 2. CRUD Operations
  const handleSave = useCallback(async (formData) => {
    const { program_ids, program_universities, ...uniData } = formData;
    let universityId = selectedUni?.id;

    try {
      if (modalMode === 'add') {
        const { data: newUni, error: uniErr } = await supabase.from('universities').insert([uniData]).select().single();
        if (uniErr) throw uniErr;
        universityId = newUni.id;
      } else {
        const { error: uniErr } = await supabase.from('universities').update(uniData).eq('id', universityId);
        if (uniErr) throw uniErr;
      }

      // Optimize linking logic using Set for O(1) lookups (js-set-map-lookups)
      const currentProgramIds = selectedUni?.program_ids || EMPTY_ARRAY;
      const currentSet = new Set(currentProgramIds);
      const newSet = new Set(program_ids);

      const toAdd = program_ids.filter(id => !currentSet.has(id));
      const toRemove = currentProgramIds.filter(id => !newSet.has(id));

      if (toRemove.length > 0) {
        await supabase.from('program_universities').delete().eq('university_id', universityId).in('program_id', toRemove);
      }
      if (toAdd.length > 0) {
        const links = toAdd.map(pid => ({ university_id: universityId, program_id: pid }));
        await supabase.from('program_universities').insert(links);
      }
      mutate();
    } catch (err) {
      alert('Error saving university: ' + err.message);
    }
  }, [modalMode, selectedUni, mutate]);

  const handleDelete = useCallback(async (id) => {
    if (!window.confirm('Are you sure you want to delete this university? All program links will be removed.')) return;
    try {
      const { error } = await supabase.from('universities').delete().eq('id', id);
      if (error) throw error;
      mutate();
    } catch (err) {
      alert('Error deleting university: ' + err.message);
    }
  }, [mutate]);

  const handleEdit = useCallback((uni) => {
    setSelectedUni(uni);
    setModalMode('edit');
  }, []);

  return (
    <div className="admin-page">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '4rem' }}>
        <div>
          <h1 style={{ fontSize: '3rem', margin: 0, lineHeight: 1 }}>University Management</h1>
          <p style={{ color: 'var(--text-secondary)', margin: '1rem 0 0', fontSize: '1.1rem' }}>
            Manage partner institutions and their program offerings.
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02, translateY: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => { setSelectedUni(null); setModalMode('add'); }}
          className="submit-btn"
          style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: 0, padding: '0.8rem 1.5rem' }}
        >
          <Plus size={20} /> Add University
        </motion.button>
      </header>

      {/* Toolbar */}
      <div className="glass-card" style={{ marginBottom: '3rem', padding: '1.25rem 1.5rem', display: 'flex', gap: '1rem', borderRadius: '20px', maxWidth: '500px' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={20} style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          <input
            id="uni-search"
            type="text"
            placeholder="Search universities..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '0.85rem 1rem 0.85rem 3.5rem',
              background: 'rgba(0,0,0,0.2)',
              border: '1px solid var(--glass-border)',
              borderRadius: '12px',
              color: '#fff',
              fontSize: '0.95rem',
              outline: 'none'
            }}
          />
        </div>
      </div>

      {/* List */}
      <div className="admin-grid">
        <AnimatePresence mode="popLayout">
          {isLoading ? (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '10rem' }}>
              <Loader2 className="animate-spin" size={48} color="var(--accent-teal)" />
            </div>
          ) : filteredUniversities.length === 0 ? (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '10rem', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.02)', borderRadius: '24px', border: '1px dashed var(--glass-border)' }}>
              <Building size={40} style={{ opacity: 0.2, marginBottom: '1rem' }} />
              <p>No universities found matching your search.</p>
            </div>
          ) : (
            filteredUniversities.map((uni, i) => (
              <UniversityCard key={uni.id} university={uni} onEdit={handleEdit} onDelete={handleDelete} index={i} />
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {modalMode ? (
          <UniversityModal
            university={selectedUni}
            programs={data?.programs || EMPTY_ARRAY}
            onClose={() => setModalMode(null)}
            onSave={handleSave}
          />
        ) : null}
      </AnimatePresence>
    </div>
  );
};

export default UniversityManagement;
