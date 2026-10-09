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
import MenuSelect from '../../components/common/MenuSelect';
import {
  getProgramWeights,
  PROGRAM_ASSESSMENT_MAP,
  CATEGORY_DEFAULT_MAP,
  RIASEC_ORDER,
  APTITUDE_ORDER,
  RIASEC_TRAITS,
  DOMAIN_METADATA
} from '../../data/assessmentData';

// ─── Constants & Fetchers (rendering-hoist-jsx & rerender-memo-with-default-value)
const CATEGORIES = ['Technology', 'Business', 'Engineering', 'Health', 'Criminal Justice', 'Arts & Humanities', 'Sciences', 'Education'];
const EMPTY_ARRAY = [];
const INITIAL_PROG_FORM = {
  title: '',
  category: CATEGORIES[0],
  description: '',
  icon_name: 'BookOpen'
};

const WEIGHT_SOURCE_LABELS = {
  published: 'the RIASEC College Program Weighting Guide',
  fallback: 'a Holland-code fallback (no guide row matched)',
  database: 'this program\'s stored weights',
};

// What the guide (or fallback) would score this program with, ignoring anything
// already stored on the row.
const resolveGuideProfile = (title, category) => {
  const code = PROGRAM_ASSESSMENT_MAP[title]?.code || CATEGORY_DEFAULT_MAP[category]?.code || 'IRC';
  return getProgramWeights(title, category, code);
};

const roundVector = (vector, order) => order.reduce((acc, key) => {
  acc[key] = Math.round((Number(vector[key]) || 0) * 100) / 100;
  return acc;
}, {});

const vectorTotal = (vector, order) => order.reduce((sum, key) => sum + (Number(vector?.[key]) || 0), 0);

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
  const [customWeights, setCustomWeights] = useState(() => Boolean(program?.riasec_weights && program?.aptitude_weights));
  const [weights, setWeights] = useState(() => {
    if (program?.riasec_weights && program?.aptitude_weights) {
      return { riasec: { ...program.riasec_weights }, aptitude: { ...program.aptitude_weights } };
    }
    const resolved = resolveGuideProfile(program?.title, program?.category);
    return { riasec: { ...resolved.riasec }, aptitude: { ...resolved.aptitude } };
  });

  const guideProfile = useMemo(
    () => resolveGuideProfile(formData.title, formData.category),
    [formData.title, formData.category]
  );

  const riasecTotal = vectorTotal(weights.riasec, RIASEC_ORDER);
  const aptitudeTotal = vectorTotal(weights.aptitude, APTITUDE_ORDER);
  const totalsBalanced = Math.abs(riasecTotal - 100) <= 0.5 && Math.abs(aptitudeTotal - 100) <= 0.5;

  const loadGuideProfile = () => {
    setWeights({ riasec: { ...guideProfile.riasec }, aptitude: { ...guideProfile.aptitude } });
    setError(null);
  };

  const setWeightValue = (group, key, raw) => {
    const value = raw === '' ? 0 : Math.min(100, Math.max(0, Number(raw)));
    setWeights(prev => ({ ...prev, [group]: { ...prev[group], [key]: Number.isFinite(value) ? value : 0 } }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    try {
      if (customWeights && !totalsBalanced) {
        throw new Error(`Weights must total 100. Interest is ${riasecTotal.toFixed(2)} and aptitude is ${aptitudeTotal.toFixed(2)}.`);
      }
      await onSave({
        ...formData,
        riasec_weights: customWeights ? roundVector(weights.riasec, RIASEC_ORDER) : null,
        aptitude_weights: customWeights ? roundVector(weights.aptitude, APTITUDE_ORDER) : null,
      });
      onClose();
    } catch (err) {
      setError(err.message);
      setIsSaving(false);
    }
  };

  const weightGrid = (group, order, labels) => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(96px, 1fr))', gap: '0.75rem' }}>
      {order.map((key) => (
        <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
          <label htmlFor={`weight-${group}-${key}`} style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            {labels[key]}
          </label>
          <input
            id={`weight-${group}-${key}`}
            type="number"
            min="0"
            max="100"
            step="0.01"
            inputMode="decimal"
            disabled={!customWeights}
            value={weights[group][key] ?? 0}
            onChange={(event) => setWeightValue(group, key, event.target.value)}
          />
        </div>
      ))}
    </div>
  );

  const totalBadge = (label, total) => {
    const balanced = Math.abs(total - 100) <= 0.5;
    return (
      <span style={{
        fontSize: '0.78rem',
        fontWeight: 600,
        color: !customWeights || balanced ? 'var(--text-secondary)' : '#ff4d4d',
      }}>
        {label} total: {total.toFixed(2)}{customWeights && !balanced ? ' — must be 100' : ''}
      </span>
    );
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
              <MenuSelect
                id="prog-category"
                label="Category"
                value={formData.category}
                onChange={category => setFormData(prev => ({ ...prev, category }))}
                options={CATEGORIES}
              />
            </div>
            <div className="form-group">
              <label htmlFor="prog-icon">Icon</label>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <MenuSelect
                    id="prog-icon"
                    label="Icon"
                    value={formData.icon_name}
                    onChange={icon_name => setFormData(prev => ({ ...prev, icon_name }))}
                    options={Object.keys(ICON_MAP)}
                  />
                </div>
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

          <fieldset style={{ border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <legend style={{ padding: '0 0.5rem', fontSize: '0.95rem', fontWeight: 600 }}>Scoring weights</legend>

            <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.9rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={customWeights}
                onChange={(e) => {
                  const next = e.target.checked;
                  setCustomWeights(next);
                  if (!next) loadGuideProfile();
                }}
              />
              Store weights on this program
            </label>

            <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {customWeights
                ? 'These values are saved on the program row and used instead of the guide.'
                : `Currently scoring with ${WEIGHT_SOURCE_LABELS[guideProfile.source]}${guideProfile.key ? ` (${guideProfile.key})` : ''}.`}
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
              <button type="button" className="cancel-btn" onClick={loadGuideProfile}>Load guide profile</button>
              {totalBadge('Interest', riasecTotal)}
              {totalBadge('Aptitude', aptitudeTotal)}
            </div>

            <div>
              <p style={{ margin: '0 0 0.5rem', fontSize: '0.82rem', fontWeight: 600 }}>Interests (R I A S E C)</p>
              {weightGrid('riasec', RIASEC_ORDER, RIASEC_ORDER.reduce((acc, k) => { acc[k] = `${k} · ${RIASEC_TRAITS[k].name}`; return acc; }, {}))}
            </div>

            <div>
              <p style={{ margin: '0 0 0.5rem', fontSize: '0.82rem', fontWeight: 600 }}>Aptitude (Verbal Spatial Numerical Logical)</p>
              {weightGrid('aptitude', APTITUDE_ORDER, APTITUDE_ORDER.reduce((acc, d) => { acc[d] = DOMAIN_METADATA[d].label.replace(' Reasoning', ''); return acc; }, {}))}
            </div>

            {!customWeights && guideProfile.source === 'fallback' && (
              <p style={{ margin: 0, fontSize: '0.82rem', color: '#fbbf24', lineHeight: 1.5 }}>
                No guide row matched this title or category, so a generic Holland-code profile is being used.
                Enabling stored weights and setting real values will score this program properly.
              </p>
            )}
          </fieldset>

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
