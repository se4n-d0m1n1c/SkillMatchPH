import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Code, Briefcase, Stethoscope, HeartHandshake, PenTool, BrainCircuit, HardHat, Building, Scale, Microscope } from 'lucide-react';

// 1. Hoist static data outside component to avoid recreation (rendering-hoist-jsx)
const CATEGORIES = ['All', 'Technology', 'Business', 'Engineering', 'Health', 'Arts & Humanities', 'Sciences'];

const PROGRAMS_DATA = [
  { id: 1, title: 'BS Computer Science', category: 'Technology', icon: <Code size={24} />, desc: 'Focuses on computing theory, algorithms, and software design.' },
  { id: 2, title: 'BS Information Technology', category: 'Technology', icon: <BrainCircuit size={24} />, desc: 'Application of tech to solve business problems, networking, and systems.' },
  { id: 3, title: 'BS Accountancy', category: 'Business', icon: <Briefcase size={24} />, desc: 'Deep dive into financial accounting, auditing, and taxation laws.' },
  { id: 4, title: 'BS Business Administration', category: 'Business', icon: <Building size={24} />, desc: 'Core management, marketing, and business operations principles.' },
  { id: 5, title: 'BS Civil Engineering', category: 'Engineering', icon: <HardHat size={24} />, desc: 'Design, construction, and maintenance of the physical and naturally built environment.' },
  { id: 6, title: 'BS Nursing', category: 'Health', icon: <Stethoscope size={24} />, desc: 'Clinical skills, patient care, and healthcare management.' },
  { id: 7, title: 'BS Medical Technology', category: 'Health', icon: <Microscope size={24} />, desc: 'Laboratory diagnostics and biological sciences.' },
  { id: 8, title: 'BA Communication', category: 'Arts & Humanities', icon: <PenTool size={24} />, desc: 'Media studies, broadcasting, journalism, and public relations.' },
  { id: 9, title: 'BS Psychology', category: 'Sciences', icon: <HeartHandshake size={24} />, desc: 'Scientific study of human behavior, mind, and mental processes.' },
  { id: 10, title: 'BA Political Science', category: 'Arts & Humanities', icon: <Scale size={24} />, desc: 'Study of systems of governance, political behavior, and law.' }
];

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

const Programs = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  // 2. Use useMemo for expensive filtering (rerender-memo)
  const filteredPrograms = useMemo(() => {
    return PROGRAMS_DATA.filter(program => {
      const matchesSearch = program.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            program.desc.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = activeCategory === 'All' || program.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, activeCategory]);

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
            type="text" 
            placeholder="Search programs..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
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
          {filteredPrograms.length > 0 ? (
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
                    {program.icon}
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
                    {program.desc}
                  </p>
                </div>
                
                <div style={{ marginTop: 'auto', paddingTop: '1rem' }}>
                  <button style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: '1px solid var(--accent-violet)',
                    background: 'transparent',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = 'var(--accent-violet)';
                    e.currentTarget.style.color = '#fff';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = 'var(--text-primary)';
                  }}
                  >
                    View Details
                  </button>
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

    </div>
  );
};

export default Programs;
