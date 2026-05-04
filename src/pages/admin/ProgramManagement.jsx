import React, { useState, useMemo, useCallback, useDeferredValue, memo, forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, Plus, Search, Edit2, Trash2, X,
  AlertCircle, Loader2, Code, BrainCircuit, Briefcase,
  Building, HardHat, Stethoscope, Microscope, PenTool,
  HeartHandshake, Scale, Server, Cpu, Bot, Pill,
  Activity, Radiation, TestTube, Wrench, Zap, Radio,
  Factory, FlaskConical, Calculator, Coins, Megaphone,
  Lightbulb, Utensils, GraduationCap, Dna, Palette
} from 'lucide-react';
import useSWR from 'swr';
import { supabase } from '../../lib/supabase';

// ─── Constants & Fetchers (rendering-hoist-jsx & rerender-memo-with-default-value)
const CATEGORIES = ['Technology', 'Business', 'Engineering', 'Health', 'Arts & Humanities', 'Sciences', 'Education'];
const EMPTY_ARRAY = [];
const INITIAL_PROG_FORM = {
  title: '',
  category: CATEGORIES[0],
  description: '',
  icon_name: 'BookOpen'
};

const ICON_MAP = {
  Code: <Code size={24} />,
  BrainCircuit: <BrainCircuit size={24} />,
  Briefcase: <Briefcase size={24} />,
  Building: <Building size={24} />,
  HardHat: <HardHat size={24} />,
  Stethoscope: <Stethoscope size={24} />,
  Microscope: <Microscope size={24} />,
  PenTool: <PenTool size={24} />,
  HeartHandshake: <HeartHandshake size={24} />,
  Scale: <Scale size={24} />,
  Server: <Server size={24} />,
  Cpu: <Cpu size={24} />,
  Bot: <Bot size={24} />,
  Pill: <Pill size={24} />,
  Activity: <Activity size={24} />,
  Radiation: <Radiation size={24} />,
  TestTube: <TestTube size={24} />,
  Wrench: <Wrench size={24} />,
  Zap: <Zap size={24} />,
  Radio: <Radio size={24} />,
  Factory: <Factory size={24} />,
  FlaskConical: <FlaskConical size={24} />,
  Calculator: <Calculator size={24} />,
  Coins: <Coins size={24} />,
  Megaphone: <Megaphone size={24} />,
  Lightbulb: <Lightbulb size={24} />,
  Utensils: <Utensils size={24} />,
  GraduationCap: <GraduationCap size={24} />,
  Dna: <Dna size={24} />,
  Palette: <Palette size={24} />,
};

const fetchPrograms = async () => {
  const { data, error } = await supabase
    .from('programs')
    .select('*')
    .order('title');

  if (error) throw error;
  return data || EMPTY_ARRAY;
};

// ─── Sub-components (rerender-no-inline-components) ──────────────────────────

const ProgramCard = memo(forwardRef(({ program, onEdit, onDelete, index }, ref) => {
  return (
    <motion.div
      ref={ref}
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="glass-card"
      style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', borderRadius: '24px' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{
          width: '56px', height: '56px', borderRadius: '16px',
          background: 'rgba(0, 242, 254, 0.1)', color: 'var(--accent-teal)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 8px 16px rgba(0, 242, 254, 0.05)'
        }}>
          {ICON_MAP[program.icon_name] || <BookOpen size={28} />}
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={() => onEdit(program)} className="icon-btn" title="Edit"><Edit2 size={18} /></button>
          <button onClick={() => onDelete(program.id)} className="icon-btn delete" title="Delete"><Trash2 size={18} /></button>
        </div>
      </div>

      <div>
        <div style={{ fontSize: '0.75rem', color: 'var(--accent-teal)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.4rem', letterSpacing: '0.02em' }}>
          {program.category}
        </div>
        <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.4rem', fontWeight: 700 }}>{program.title}</h3>
        <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {program.description}
        </p>
      </div>
    </motion.div>
  );
}));

const ProgramModal = memo(forwardRef(({ program, onClose, onSave }, ref) => {
  const [formData, setFormData] = useState(() => program || INITIAL_PROG_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

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
      ref={ref}
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
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.75rem' }}>{program ? 'Edit Program' : 'Add Program'}</h2>
          <button onClick={onClose} className="icon-btn" aria-label="Close modal"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="form-group">
            <label htmlFor="prog-title">Program Title</label>
            <input
              id="prog-title"
              required
              value={formData.title}
              onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="e.g. Bachelor of Science in Information Technology"
            />
          </div>

          <div className="modal-form-grid">
            <div className="form-group">
              <label htmlFor="prog-category">Category</label>
              <select
                id="prog-category"
                value={formData.category}
                onChange={e => setFormData(prev => ({ ...prev, category: e.target.value }))}
              >
                {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="prog-icon">Icon</label>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <select
                  id="prog-icon"
                  value={formData.icon_name}
                  onChange={e => setFormData(prev => ({ ...prev, icon_name: e.target.value }))}
                  style={{ flex: 1 }}
                >
                  {Object.keys(ICON_MAP).map(icon => <option key={icon} value={icon}>{icon}</option>)}
                </select>
                <div style={{ width: '45px', height: '45px', borderRadius: '10px', background: 'rgba(0,242,254,0.1)', color: 'var(--accent-teal)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {ICON_MAP[formData.icon_name]}
                </div>
              </div>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="prog-desc">Description</label>
            <textarea
              id="prog-desc"
              required
              rows={4}
              value={formData.description}
              onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Provide a brief overview of the program..."
            />
          </div>

          {error ? (
            <div role="alert" style={{ color: '#ff4d4d', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255, 77, 77, 0.1)', padding: '0.75rem', borderRadius: '8px' }}>
              <AlertCircle size={16} /> {error}
            </div>
          ) : null}

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="cancel-btn">Cancel</button>
            <button type="submit" disabled={isSaving} className="submit-btn">
              {isSaving ? <Loader2 className="animate-spin" /> : (program ? 'Save Changes' : 'Create Program')}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}));

// ─── Main Component ──────────────────────────────────────────────────────────

const ProgramManagement = () => {
  const { data: programs, error, isLoading, mutate } = useSWR('admin-programs', fetchPrograms);
  const [searchQuery, setSearchQuery] = useState('');
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const [modalMode, setModalMode] = useState(null); // 'add' | 'edit' | null
  const [selectedProg, setSelectedProg] = useState(null);

  // 1. Search Filtering
  const filteredPrograms = useMemo(() => {
    const lowerQuery = deferredSearchQuery.toLowerCase();
    const allProgs = programs || EMPTY_ARRAY;
    if (!lowerQuery) return allProgs;
    return allProgs.filter(p =>
      p.title.toLowerCase().includes(lowerQuery) ||
      p.category.toLowerCase().includes(lowerQuery)
    );
  }, [programs, deferredSearchQuery]);

  // 2. CRUD Operations
  const handleSave = useCallback(async (formData) => {
    try {
      if (modalMode === 'add') {
        const { error: err } = await supabase.from('programs').insert([formData]);
        if (err) throw err;
      } else {
        const { error: err } = await supabase.from('programs').update(formData).eq('id', selectedProg.id);
        if (err) throw err;
      }
      mutate();
    } catch (err) {
      alert('Error saving program: ' + err.message);
      throw err;
    }
  }, [modalMode, selectedProg, mutate]);

  const handleDelete = useCallback(async (id) => {
    if (!window.confirm('Are you sure you want to delete this program? It will be removed from all university listings.')) return;
    try {
      const { error: err } = await supabase.from('programs').delete().eq('id', id);
      if (err) throw err;
      mutate();
    } catch (err) {
      alert('Error deleting program: ' + err.message);
    }
  }, [mutate]);

  const handleEdit = useCallback((prog) => {
    setSelectedProg(prog);
    setModalMode('edit');
  }, []);

  return (
    <div className="admin-page">
      <header className="page-header">
        <div>
          <h1 style={{ margin: 0 }}>Program Management</h1>
          <p style={{ color: 'var(--text-secondary)', margin: '1rem 0 0', fontSize: '1.1rem' }}>
            Manage the catalog of academic programs and career paths.
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02, translateY: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => { setSelectedProg(null); setModalMode('add'); }}
          className="submit-btn"
          style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: 0, padding: '0.8rem 1.5rem' }}
        >
          <Plus size={20} /> Add Program
        </motion.button>
      </header>

      {/* Toolbar */}
      <div className="search-container" style={{ marginBottom: '3rem' }}>
        <div className="glass-card" style={{ padding: '1.25rem 1.5rem', display: 'flex', gap: '1rem', borderRadius: '20px', maxWidth: '500px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={20} style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input
              id="prog-search"
              type="text"
              placeholder="Search programs..."
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
      </div>

      {/* List */}
      <div className="admin-grid">
        <AnimatePresence mode="popLayout">
          {isLoading ? (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '10rem' }}>
              <Loader2 className="animate-spin" size={48} color="var(--accent-teal)" />
            </div>
          ) : filteredPrograms.length === 0 ? (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '10rem', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.02)', borderRadius: '24px', border: '1px dashed var(--glass-border)' }}>
              <BookOpen size={40} style={{ opacity: 0.2, marginBottom: '1rem' }} />
              <p>No programs found matching your search.</p>
            </div>
          ) : (
            filteredPrograms.map((prog, i) => (
              <ProgramCard key={prog.id} program={prog} onEdit={handleEdit} onDelete={handleDelete} index={i} />
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {modalMode ? (
          <ProgramModal
            program={selectedProg}
            onClose={() => setModalMode(null)}
            onSave={handleSave}
          />
        ) : null}
      </AnimatePresence>
    </div>
  );
};

export default ProgramManagement;
