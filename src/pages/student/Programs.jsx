import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Code, Briefcase, Stethoscope, HeartHandshake, PenTool, BrainCircuit, HardHat, Building, Scale, Microscope, Loader2, Server, Cpu, Bot, Pill, Activity, Radiation, TestTube, Wrench, Zap, Radio, Factory, FlaskConical, Calculator, Coins, Megaphone, Lightbulb, Utensils, GraduationCap, BookOpen, Dna, Palette, X, MapPin, Globe, ExternalLink } from 'lucide-react';
import useSWR from 'swr';
import { supabase } from '../../lib/supabase';

// 1. Hoist static data outside component to avoid recreation (rendering-hoist-jsx)
const CATEGORIES = ['All', 'Technology', 'Business', 'Engineering', 'Health', 'Arts & Humanities', 'Sciences', 'Education'];

// 2. Map string identifiers from the database to actual React components
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
  BookOpen: <BookOpen size={24} />,
  Dna: <Dna size={24} />,
  Palette: <Palette size={24} />,
};

// 3. Define the SWR fetcher outside the component (data-n-plus-one: single relational request)
const fetchPrograms = async () => {
  const { data, error } = await supabase
    .from('programs')
    .select(`
      *,
      universities:program_universities(
        university:universities(*)
      )
    `)
    .order('category')
    .order('title');
    
  if (error) throw error;
  
  // Transform the nested structure into a flatter one for easier UI usage
  return data.map(program => ({
    ...program,
    universities: program.universities.map(u => u.university).filter(Boolean)
  }));
};

const CONTAINER_VARIANTS = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const CARD_VARIANTS = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

// ─── Program Details Modal Component ─────────────────────────────────────────
const ProgramDetailsModal = ({ program, onClose }) => {
  if (!program) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, padding: '1rem'
      }}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="glass-card"
        style={{
          width: '100%', maxWidth: '700px', maxHeight: '90vh',
          overflowY: 'auto', padding: '2.5rem', position: 'relative',
          border: '1px solid var(--accent-teal)'
        }}
      >
        <button
          onClick={onClose}
          aria-label="Close modal"
          style={{
            position: 'absolute', top: '1.5rem', right: '1.5rem',
            background: 'none', border: 'none', color: 'var(--text-secondary)',
            cursor: 'pointer', padding: '0.5rem'
          }}
        >
          <X size={24} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ 
            padding: '1rem', borderRadius: '16px', 
            background: 'rgba(0, 242, 254, 0.1)', color: 'var(--accent-teal)'
          }}>
            {ICON_MAP[program.icon_name] || <Code size={32} />}
          </div>
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--accent-teal)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {program.category}
            </span>
            <h2 style={{ fontSize: '2rem', margin: '0.2rem 0', color: 'var(--text-primary)' }}>{program.title}</h2>
          </div>
        </div>

        <p style={{ fontSize: '1.1rem', lineHeight: 1.6, color: 'var(--text-secondary)', marginBottom: '2.5rem' }}>
          {program.description}
        </p>

        <div>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <GraduationCap size={22} color="var(--accent-violet)" />
            Offered by these Universities
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {program.universities && program.universities.length > 0 ? (
              program.universities.map((uni) => (
                <motion.div
                  key={uni.id}
                  whileHover={{ x: 5, background: 'rgba(255,255,255,0.05)' }}
                  style={{
                    padding: '1.25rem', borderRadius: '12px',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid var(--glass-border)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ 
                      width: '48px', height: '48px', borderRadius: '8px',
                      background: 'rgba(112, 0, 255, 0.1)', display: 'flex',
                      alignItems: 'center', justifyContent: 'center', color: 'var(--accent-violet)'
                    }}>
                      {uni.logo_url ? <img src={uni.logo_url} alt={uni.name} style={{ width: '100%', height: '100%', borderRadius: '8px', objectFit: 'cover' }} /> : <Building size={24} />}
                    </div>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '1.1rem' }}>{uni.name}</h4>
                      <p style={{ margin: '0.2rem 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <MapPin size={12} /> {uni.location || 'Location not listed'}
                      </p>
                    </div>
                  </div>
                  {uni.website && (
                    <a 
                      href={uni.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={{ color: 'var(--accent-teal)', display: 'flex', alignItems: 'center', gap: '0.4rem', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600 }}
                    >
                      <Globe size={16} /> Website <ExternalLink size={14} />
                    </a>
                  )}
                </motion.div>
              ))
            ) : (
              <div style={{ padding: '2rem', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px dashed var(--glass-border)' }}>
                <p style={{ color: 'var(--text-secondary)', margin: 0 }}>No universities currently listed for this program.</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

const Programs = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [selectedProgram, setSelectedProgram] = useState(null);

  // 4. Client-side deduplication and caching using SWR (client-swr-dedup)
  const { data: programs, error, isLoading } = useSWR('programs_list', fetchPrograms, {
    revalidateOnFocus: false, // Prevents unnecessary refetches on tab switch
  });

  // 5. Use useMemo for expensive filtering (rerender-memo)
  const filteredPrograms = useMemo(() => {
    if (!programs) return [];
    
    // js-hoist-regexp: Hoist toLowerCase outside the loop to prevent recalculating N times
    const searchLower = searchQuery.toLowerCase();
    
    return programs.filter(program => {
      // js-early-exit: Check cheap category condition first
      const matchesCategory = activeCategory === 'All' || program.category === activeCategory;
      if (!matchesCategory) return false;
      
      // js-early-exit: If no search query, skip expensive string matching
      if (!searchLower) return true;

      return program.title.toLowerCase().includes(searchLower) || 
             program.description.toLowerCase().includes(searchLower);
    });
  }, [searchQuery, activeCategory, programs]);

  return (
    <div style={{ padding: '2rem 0' }}>
      
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: '3rem' }}
      >
        <h2 style={{ fontSize: 'clamp(2rem, 5vw, 2.5rem)', margin: 0, color: 'var(--text-primary)' }}>College Programs</h2>
        <p style={{ color: 'var(--text-secondary)' }}>Explore potential career paths and degree programs.</p>
      </motion.div>

      {/* Filter and Search Bar */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        style={{ marginBottom: '3rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
      >
        <div style={{ position: 'relative', maxWidth: '600px' }}>
          <Search size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          <input 
            id="program-search"
            type="text" 
            placeholder="Search programs..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search programs"
            style={{
              width: '100%',
              padding: '1rem 1rem 1rem 3rem',
              borderRadius: '12px',
              border: '1px solid var(--glass-border)',
              background: 'var(--glass-bg)',
              color: 'var(--text-primary)',
              fontSize: '1rem',
              outline: 'none',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
              boxSizing: 'border-box'
            }}
          />
        </div>

        {/* Category Pills */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {CATEGORIES.map(category => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '999px',
                border: `1px solid ${activeCategory === category ? 'var(--accent-teal)' : 'var(--glass-border)'}`,
                background: activeCategory === category ? 'rgba(0, 242, 254, 0.1)' : 'var(--glass-bg)',
                color: activeCategory === category ? 'var(--accent-teal)' : 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                fontSize: '0.9rem'
              }}
            >
              {category}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Programs Grid */}
      <motion.div 
        variants={CONTAINER_VARIANTS}
        initial="hidden"
        animate="show"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2rem' }}
      >
        <AnimatePresence mode="popLayout">
          {isLoading ? (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 0', color: 'var(--text-secondary)' }}
            >
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, ease: 'linear', duration: 1 }}>
                <Loader2 size={48} color="var(--accent-teal)" />
              </motion.div>
              <p style={{ marginTop: '1rem', fontSize: '1.2rem' }}>Loading programs...</p>
            </motion.div>
          ) : error ? (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem 0' }}
            >
              <p style={{ color: '#ff4d4d', fontSize: '1.2rem' }}>Failed to load programs. Please try again.</p>
            </motion.div>
          ) : filteredPrograms.length > 0 ? (
            filteredPrograms.map((program) => (
              <motion.div
                key={program.id}
                layout
                variants={CARD_VARIANTS}
                initial="hidden"
                animate="show"
                exit={{ opacity: 0, scale: 0.9 }}
                className="glass-card"
                whileHover={{ translateY: -5, borderColor: 'var(--accent-teal)' }}
                style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ 
                    padding: '0.75rem', 
                    borderRadius: '12px', 
                    background: 'rgba(0, 242, 254, 0.1)',
                    color: 'var(--accent-teal)'
                  }}>
                    {ICON_MAP[program.icon_name] || <Code size={24} />}
                  </div>
                  <span style={{ 
                    fontSize: '0.75rem', 
                    padding: '0.25rem 0.75rem', 
                    borderRadius: '999px',
                    background: 'var(--glass-border)',
                    color: 'var(--text-secondary)'
                  }}>
                    {program.category}
                  </span>
                </div>
                
                <div>
                  <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                    {program.title}
                  </h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.5, margin: 0 }}>
                    {program.description}
                  </p>
                </div>
                
                <div style={{ marginTop: 'auto', paddingTop: '1rem' }}>
                  <motion.button 
                    onClick={() => setSelectedProgram(program)}
                    whileHover={{ backgroundColor: 'var(--accent-violet)', color: '#fff' }}
                    aria-label={`View details for ${program.title}`}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: '8px',
                      border: '1px solid var(--accent-violet)',
                      background: 'transparent',
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s ease, color 0.2s ease',
                    }}
                  >
                    View Details
                  </motion.button>
                </div>
              </motion.div>
            ))
          ) : (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem 0' }}
            >
              <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem' }}>No programs found matching your criteria.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Program Details Modal */}
      <AnimatePresence>
        {selectedProgram && (
          <ProgramDetailsModal 
            program={selectedProgram} 
            onClose={() => setSelectedProgram(null)} 
          />
        )}
      </AnimatePresence>

    </div>
  );
};

export default Programs;
