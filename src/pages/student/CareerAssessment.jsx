import { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import useSWR from 'swr';
import { 
  Target, 
  Sparkles, 
  GraduationCap, 
  Compass, 
  BrainCircuit, 
  Building, 
  Globe, 
  ExternalLink, 
  X, 
  MapPin, 
  AlertTriangle,
  RotateCcw,
  ChevronRight,
  ChevronLeft,
  ArrowRight,
  School,
  CheckCircle2,
  Navigation,
  Crosshair,
  Car
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { 
  LIKERT_OPTIONS, 
  DOMAIN_METADATA, 
  RIASEC_TRAITS, 
  matchPrograms 
} from '../../data/assessmentData';
import { 
  calculateLocationProximity, 
  getSavedPinnedLocation, 
  savePinnedLocation 
} from '../../data/locationsData';
import GrabLocationPickerModal from '../../components/common/GrabLocationPickerModal';

const fetchProgramsCatalog = async () => {
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

  return data.map(program => ({
    ...program,
    universities: program.universities ? program.universities.map(u => u.university).filter(Boolean) : []
  }));
};

const fetchAssessmentQuestions = async () => {
  const { data, error } = await supabase.rpc('get_active_assessment_questions');
  if (error) throw error;

  return data.map(question => ({
    id: question.question_id,
    versionId: question.version_id,
    section: question.section,
    sequence: question.sequence,
    text: question.prompt,
    letter: question.riasec_letter,
    domain: question.aptitude_domain,
    options: question.options
  }));
};

const fetchLatestAssessmentAttempt = async () => {
  const { data, error } = await supabase
    .from('assessment_attempts')
    .select('interest_answers, aptitude_answers, result, completed_at')
    .order('completed_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
};

const CONTAINER_ANIM = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  exit: { opacity: 0, y: -15, transition: { duration: 0.2 } }
};

export default function CareerAssessment() {
  const { user } = useAuth();
  const storageKey = `skillmatch_assessment_${user?.id || 'guest'}`;

  const [phase, setPhase] = useState('intro'); // 'intro' | 'interest' | 'aptitude' | 'results'
  const [qIndex, setQIndex] = useState(0);
  const [aIndex, setAIndex] = useState(0);
  const [interestAnswers, setInterestAnswers] = useState({});
  const [aptitudeAnswers, setAptitudeAnswers] = useState({});
  const [scoreResults, setScoreResults] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [resultsTab, setResultsTab] = useState('programs'); // 'programs' | 'universities'
  const [pinnedLocation, setPinnedLocation] = useState(() => getSavedPinnedLocation(user?.id));
  const [onlyNearby, setOnlyNearby] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  const hasRestoredAttempt = useRef(false);

  // Load programs catalog with SWR
  const { data: catalogPrograms } = useSWR('programs_list', fetchProgramsCatalog, {
    revalidateOnFocus: false
  });
  const { data: assessmentQuestions, error: assessmentQuestionsError, isLoading: isLoadingAssessment } = useSWR(
    'active_assessment_questions',
    fetchAssessmentQuestions,
    { revalidateOnFocus: false }
  );
  const { data: latestAssessmentAttempt } = useSWR(
    user?.id ? ['latest_assessment_attempt', user.id] : null,
    fetchLatestAssessmentAttempt,
    { revalidateOnFocus: false }
  );
  const interestQuestions = useMemo(
    () => (assessmentQuestions || []).filter(question => question.section === 'interest'),
    [assessmentQuestions]
  );
  const aptitudeQuestions = useMemo(
    () => (assessmentQuestions || []).filter(question => question.section === 'aptitude'),
    [assessmentQuestions]
  );
  const assessmentVersionId = assessmentQuestions?.[0]?.versionId;

  // Restore saved assessment results on mount if available
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.interestAnswers && parsed.aptitudeAnswers && parsed.scoreResults) {
          setInterestAnswers(parsed.interestAnswers);
          setAptitudeAnswers(parsed.aptitudeAnswers);
          setScoreResults(parsed.scoreResults);
          setPhase('results');
          hasRestoredAttempt.current = true;
        }
      }
    } catch {
      // Ignore parse errors
    }
  }, [storageKey]);

  // Database persistence is the fallback when local storage is unavailable or was cleared.
  useEffect(() => {
    if (!latestAssessmentAttempt || hasRestoredAttempt.current || phase !== 'intro') return;

    setInterestAnswers(latestAssessmentAttempt.interest_answers);
    setAptitudeAnswers(latestAssessmentAttempt.aptitude_answers);
    setScoreResults(latestAssessmentAttempt.result);
    setPhase('results');
    hasRestoredAttempt.current = true;
  }, [latestAssessmentAttempt, phase]);

  // Handle location selection from Grab-style map modal
  const handleSelectPinnedLocation = (newLocObj) => {
    setPinnedLocation(newLocObj);
    savePinnedLocation(user?.id, newLocObj);
  };

  // Derived ranked program recommendations with exact distance
  const rankedPrograms = useMemo(() => {
    if (!scoreResults) return [];
    const baseRanked = matchPrograms(scoreResults.interest, scoreResults.aptitude, catalogPrograms || []);

    return baseRanked.map(prog => {
      const nearbyUnis = (prog.universities || []).map(u => {
        const prox = calculateLocationProximity(pinnedLocation, u.location, u.name);
        return { ...u, proximity: prox };
      }).filter(u => u.proximity.isNearby);

      // Closest university distance
      const minDistance = nearbyUnis.length > 0
        ? Math.min(...nearbyUnis.map(u => u.proximity.distanceKm || 999))
        : null;

      const hasNearbyOffering = nearbyUnis.length > 0;
      const locationBoost = hasNearbyOffering ? 5 : 0;
      const adjustedMatch = Math.min(100, prog.match + locationBoost);

      return {
        ...prog,
        nearbyUnis,
        hasNearbyOffering,
        minDistance,
        adjustedMatch
      };
    });
  }, [scoreResults, catalogPrograms, pinnedLocation]);

  // Filtered programs
  const displayedPrograms = useMemo(() => {
    let list = [...rankedPrograms];
    if (onlyNearby) {
      list = list.filter(p => p.hasNearbyOffering);
    }
    return list.sort((a, b) => b.adjustedMatch - a.adjustedMatch);
  }, [rankedPrograms, onlyNearby]);

  // Derived recommended universities with real-time Haversine distance
  const recommendedUniversities = useMemo(() => {
    if (!rankedPrograms || rankedPrograms.length === 0) return [];
    const uniMap = new Map();

    rankedPrograms.slice(0, 8).forEach(program => {
      (program.universities || []).forEach(uni => {
        if (!uniMap.has(uni.name)) {
          const prox = calculateLocationProximity(pinnedLocation, uni.location, uni.name);
          uniMap.set(uni.name, {
            id: uni.id,
            name: uni.name,
            location: uni.location,
            website: uni.website,
            logo_url: uni.logo_url,
            proximity: prox,
            distanceKm: prox.distanceKm,
            matchedPrograms: []
          });
        }
        uniMap.get(uni.name).matchedPrograms.push({
          id: program.id,
          name: program.name,
          match: program.match,
          code: program.code,
          category: program.category
        });
      });
    });

    const uniList = Array.from(uniMap.values()).map(uni => {
      const avgMatch = Math.round(
        uni.matchedPrograms.reduce((sum, p) => sum + p.match, 0) / uni.matchedPrograms.length
      );
      return { ...uni, avgMatch };
    });

    // Sort by exact distance in km (closest first), then by match
    return uniList.sort((a, b) => {
      if (a.distanceKm !== null && b.distanceKm !== null) {
        return a.distanceKm - b.distanceKm;
      }
      return (b.proximity.score || 0) - (a.proximity.score || 0) || b.matchedPrograms.length - a.matchedPrograms.length;
    });
  }, [rankedPrograms, pinnedLocation]);

  const displayedUniversities = useMemo(() => {
    if (onlyNearby) {
      return recommendedUniversities.filter(u => u.proximity.isNearby);
    }
    return recommendedUniversities;
  }, [recommendedUniversities, onlyNearby]);

  const handleStartTest = () => {
    if (isLoadingAssessment || !assessmentVersionId || interestQuestions.length === 0 || aptitudeQuestions.length === 0) {
      setErrorMessage(assessmentQuestionsError
        ? 'We could not load the assessment. Please refresh the page and try again.'
        : 'The assessment is not available yet. Please try again shortly.');
      return;
    }
    hasRestoredAttempt.current = true;
    setInterestAnswers({});
    setAptitudeAnswers({});
    setScoreResults(null);
    setQIndex(0);
    setAIndex(0);
    setErrorMessage('');
    setPhase('interest');
  };

  const handleSelectInterest = (value) => {
    const currentQ = interestQuestions[qIndex];
    setInterestAnswers(prev => ({ ...prev, [currentQ.id]: value }));
    setErrorMessage('');
  };

  const handleNextInterest = () => {
    const currentQ = interestQuestions[qIndex];
    if (interestAnswers[currentQ.id] === undefined) {
      setErrorMessage('Please select an option to continue.');
      return;
    }
    setErrorMessage('');
    if (qIndex < interestQuestions.length - 1) {
      setQIndex(prev => prev + 1);
    } else {
      setPhase('aptitude');
      setAIndex(0);
    }
  };

  const handlePrevInterest = () => {
    setErrorMessage('');
    if (qIndex > 0) {
      setQIndex(prev => prev - 1);
    } else {
      setPhase('intro');
    }
  };

  const handleSelectAptitude = (optIndex) => {
    const currentQ = aptitudeQuestions[aIndex];
    setAptitudeAnswers(prev => ({ ...prev, [currentQ.id]: optIndex }));
    setErrorMessage('');
  };

  const handleNextAptitude = async () => {
    const currentQ = aptitudeQuestions[aIndex];
    if (aptitudeAnswers[currentQ.id] === undefined) {
      setErrorMessage('Please select an answer to continue.');
      return;
    }
    setErrorMessage('');
    if (aIndex < aptitudeQuestions.length - 1) {
      setAIndex(prev => prev + 1);
    } else {
      setIsSubmitting(true);
      try {
        const finalAptitudeAnswers = { ...aptitudeAnswers, [currentQ.id]: aptitudeAnswers[currentQ.id] };
        const { data: result, error } = await supabase.rpc('submit_assessment_attempt', {
          p_version_id: assessmentVersionId,
          p_interest_answers: interestAnswers,
          p_aptitude_answers: finalAptitudeAnswers
        });
        if (error) throw error;
        setScoreResults(result);
        setPhase('results');
        try {
          localStorage.setItem(storageKey, JSON.stringify({
            interestAnswers,
            aptitudeAnswers: finalAptitudeAnswers,
            scoreResults: result,
            savedAt: new Date().toISOString(),
            hollandCode: result.code
          }));
        } catch {
          // The database attempt has already been saved; local storage is optional.
        }
      } catch (error) {
        setErrorMessage(error.message || 'We could not score your assessment. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handlePrevAptitude = () => {
    setErrorMessage('');
    if (aIndex > 0) {
      setAIndex(prev => prev - 1);
    } else {
      setPhase('interest');
      setQIndex(interestQuestions.length - 1);
    }
  };

  const handleRetake = () => {
    try {
      localStorage.removeItem(storageKey);
    } catch {
      // ignore
    }
    hasRestoredAttempt.current = true;
    setInterestAnswers({});
    setAptitudeAnswers({});
    setScoreResults(null);
    setQIndex(0);
    setAIndex(0);
    setErrorMessage('');
    setPhase('intro');
  };

  return (
    <div className="student-page" style={{ padding: '2rem 0', maxWidth: '1080px', margin: '0 auto' }}>
      
      {/* Top Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: '2.5rem' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <div style={{
            padding: '0.5rem',
            borderRadius: '10px',
            background: 'rgba(0, 245, 255, 0.1)',
            color: 'var(--accent-teal)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Target size={24} />
          </div>
          <span style={{ 
            fontFamily: 'monospace', 
            fontSize: '0.85rem', 
            color: 'var(--accent-teal)', 
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            fontWeight: 600
          }}>
            SkillMatchPH Assessment & Map Pinning
          </span>
        </div>
        <h1 style={{ fontSize: 'clamp(2rem, 4vw, 2.75rem)', margin: 0, color: 'var(--text-primary)' }}>
          Career & University Match
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', margin: '0.5rem 0 0 0' }}>
          Assess your vocational interests, cognitive aptitude, and pin your location to calculate exact commute distances to Philippine universities.
        </p>
      </motion.div>

      {/* Main Container */}
      <AnimatePresence mode="wait">
        
        {/* ─── INTRO SCREEN ──────────────────────────────────────────────────────── */}
        {phase === 'intro' && (
          <motion.div
            key="intro"
            variants={CONTAINER_ANIM}
            initial="hidden"
            animate="show"
            exit="exit"
            className="glass-card"
            style={{ padding: '2.5rem' }}
          >
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.75rem', 
              paddingBottom: '1.5rem',
              borderBottom: '1px solid var(--glass-border)',
              marginBottom: '2rem'
            }}>
              <Sparkles size={24} color="var(--accent-teal)" />
              <div>
                <h2 style={{ fontSize: '1.5rem', margin: 0, color: 'var(--text-primary)' }}>How it Works</h2>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  A dual-engine assessment with location pinning to find the closest programs.
                </p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
              
              <div style={{ 
                background: 'rgba(255, 255, 255, 0.02)', 
                border: '1px solid var(--glass-border)', 
                borderRadius: '16px', 
                padding: '1.5rem' 
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(0, 245, 255, 0.15)', color: 'var(--accent-teal)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.9rem' }}>
                    01
                  </div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem' }}>Part 1: Interest Inventory</h3>
                </div>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                  <strong>30 activity-preference statements</strong> assessing your interests across Realistic, Investigative, Artistic, Social, Enterprising, and Conventional archetypes.
                </p>
              </div>

              <div style={{ 
                background: 'rgba(255, 255, 255, 0.02)', 
                border: '1px solid var(--glass-border)', 
                borderRadius: '16px', 
                padding: '1.5rem' 
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(112, 0, 255, 0.2)', color: 'var(--accent-violet)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.9rem' }}>
                    02
                  </div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem' }}>Part 2: Aptitude Screen</h3>
                </div>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                  <strong>8 reasoning questions</strong> covering Verbal, Numerical, Logical, and Spatial domains to evaluate scholastic readiness.
                </p>
              </div>

              <div style={{ 
                background: 'rgba(255, 255, 255, 0.02)', 
                border: '1px solid var(--glass-border)', 
                borderRadius: '16px', 
                padding: '1.5rem' 
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(74, 222, 128, 0.15)', color: '#4ade80', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.9rem' }}>
                    03
                  </div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem' }}>Part 3: Map Pinning & Distances</h3>
                </div>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                  Drop a pin on your city to calculate <strong>exact kilometer distances</strong> to Philippine universities offering your top programs.
                </p>
              </div>

            </div>

            {/* Action */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                Takes approximately <strong>6 – 8 minutes</strong>
              </div>
              <motion.button
                onClick={handleStartTest}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={{
                  padding: '0.9rem 2.2rem',
                  background: 'linear-gradient(135deg, var(--accent-teal), var(--accent-violet))',
                  border: 'none',
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: '1.05rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 4px 20px rgba(0, 245, 255, 0.3)'
                }}
              >
                Start Assessment <ArrowRight size={18} />
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* ─── SECTION 1: RIASEC INTEREST INVENTORY ──────────────────────────────── */}
        {phase === 'interest' && (
          <motion.div
            key={`interest-${qIndex}`}
            variants={CONTAINER_ANIM}
            initial="hidden"
            animate="show"
            exit="exit"
            className="glass-card"
            style={{ padding: '2.5rem' }}
          >
            {/* Progress Header */}
            <div style={{ marginBottom: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{ 
                  fontFamily: 'monospace', 
                  fontSize: '0.8rem', 
                  color: 'var(--accent-teal)', 
                  fontWeight: 600, 
                  textTransform: 'uppercase' 
                }}>
                  Section 1 of 2 — Interest Inventory
                </span>
                <span style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Question {qIndex + 1} of {interestQuestions.length}
                </span>
              </div>
              {/* Progress Bar */}
              <div style={{ width: '100%', height: '8px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '999px', overflow: 'hidden' }}>
                <div 
                  style={{ 
                    height: '100%', 
                    width: `${((qIndex + 1) / interestQuestions.length) * 100}%`,
                    background: 'linear-gradient(90deg, var(--accent-teal), var(--accent-violet))',
                    transition: 'width 0.3s ease'
                  }} 
                />
              </div>
            </div>

            {/* Question Card */}
            <div style={{ margin: '2.5rem 0' }}>
              <div style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '0.5rem', 
                padding: '0.3rem 0.8rem', 
                borderRadius: '8px', 
                background: 'rgba(255, 255, 255, 0.05)', 
                color: 'var(--text-secondary)',
                fontSize: '0.85rem',
                marginBottom: '1rem'
              }}>
                <Compass size={16} color="var(--accent-teal)" />
                <span>How much is this like you?</span>
              </div>

              <h2 style={{ fontSize: 'clamp(1.25rem, 3vw, 1.6rem)', fontWeight: 600, lineHeight: 1.4, margin: '0 0 2.5rem 0', color: 'var(--text-primary)' }}>
                "{interestQuestions[qIndex]?.text}"
              </h2>

              {/* Interactive Bubbles */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(5, 1fr)', 
                gap: '0.75rem', 
                margin: '2rem 0',
                textAlign: 'center'
              }}>
                {LIKERT_OPTIONS.map((opt) => {
                  const isSelected = interestAnswers[interestQuestions[qIndex]?.id] === opt.v;
                  return (
                    <motion.div
                      key={opt.v}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleSelectInterest(opt.v)}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '0.75rem',
                        cursor: 'pointer',
                        padding: '1rem 0.5rem',
                        borderRadius: '16px',
                        background: isSelected ? 'rgba(0, 245, 255, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                        border: `1.5px solid ${isSelected ? 'var(--accent-teal)' : 'var(--glass-border)'}`,
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '50%',
                        border: `2px solid ${isSelected ? 'var(--accent-teal)' : 'rgba(255, 255, 255, 0.3)'}`,
                        background: isSelected ? 'var(--accent-teal)' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: isSelected ? '#0a0f1e' : 'var(--text-primary)',
                        fontWeight: 700,
                        fontSize: '1rem',
                        boxShadow: isSelected ? '0 0 16px rgba(0, 245, 255, 0.4)' : 'none',
                        transition: 'all 0.2s ease'
                      }}>
                        {opt.v}
                      </div>
                      <span style={{ 
                        fontSize: '0.8rem', 
                        color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                        fontWeight: isSelected ? 600 : 400,
                        lineHeight: 1.2
                      }}>
                        {opt.label}
                      </span>
                    </motion.div>
                  );
                })}
              </div>

              {errorMessage && (
                <motion.div 
                  initial={{ opacity: 0, y: -5 }} 
                  animate={{ opacity: 1, y: 0 }}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ff4d4d', fontSize: '0.9rem', marginTop: '1rem' }}
                >
                  <AlertTriangle size={16} />
                  {errorMessage}
                </motion.div>
              )}
            </div>

            {/* Navigation Buttons */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1.5rem', borderTop: '1px solid var(--glass-border)' }}>
              <button
                onClick={handlePrevInterest}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.65rem 1.25rem',
                  borderRadius: '10px',
                  border: '1px solid var(--glass-border)',
                  background: 'transparent',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: '0.95rem'
                }}
              >
                <ChevronLeft size={18} /> Back
              </button>

              <motion.button
                onClick={handleNextInterest}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.75rem 1.75rem',
                  borderRadius: '10px',
                  border: 'none',
                  background: 'linear-gradient(135deg, var(--accent-teal), var(--accent-violet))',
                  color: '#fff',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.95rem'
                }}
              >
                {qIndex === interestQuestions.length - 1 ? 'Proceed to Aptitude Screen' : 'Next Question'}
                <ChevronRight size={18} />
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* ─── SECTION 2: APTITUDE SCREEN ────────────────────────────────────────── */}
        {phase === 'aptitude' && (
          <motion.div
            key={`aptitude-${aIndex}`}
            variants={CONTAINER_ANIM}
            initial="hidden"
            animate="show"
            exit="exit"
            className="glass-card"
            style={{ padding: '2.5rem' }}
          >
            {/* Progress Header */}
            <div style={{ marginBottom: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{ 
                  fontFamily: 'monospace', 
                  fontSize: '0.8rem', 
                  color: 'var(--accent-violet)', 
                  fontWeight: 600, 
                  textTransform: 'uppercase' 
                }}>
                  Section 2 of 2 — Cognitive Reasoning Screen
                </span>
                <span style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Question {aIndex + 1} of {aptitudeQuestions.length}
                </span>
              </div>
              {/* Progress Bar */}
              <div style={{ width: '100%', height: '8px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '999px', overflow: 'hidden' }}>
                <div 
                  style={{ 
                    height: '100%', 
                    width: `${((aIndex + 1) / aptitudeQuestions.length) * 100}%`,
                    background: 'linear-gradient(90deg, var(--accent-violet), var(--accent-teal))',
                    transition: 'width 0.3s ease'
                  }} 
                />
              </div>
            </div>

            {/* Question Card */}
            <div style={{ margin: '2.5rem 0' }}>
              <div style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '0.5rem', 
                padding: '0.3rem 0.8rem', 
                borderRadius: '8px', 
                background: 'rgba(112, 0, 255, 0.15)', 
                color: 'var(--accent-teal)',
                fontSize: '0.85rem',
                marginBottom: '1rem'
              }}>
                <BrainCircuit size={16} />
                <span>{DOMAIN_METADATA[aptitudeQuestions[aIndex]?.domain]?.label}</span>
              </div>

              <h2 style={{ fontSize: 'clamp(1.25rem, 3vw, 1.6rem)', fontWeight: 600, lineHeight: 1.4, margin: '0 0 2rem 0', color: 'var(--text-primary)' }}>
                {aptitudeQuestions[aIndex]?.text}
              </h2>

              {/* Multiple Choice Options */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', margin: '2rem 0' }}>
                {(aptitudeQuestions[aIndex]?.options || []).map((opt, i) => {
                  const isSelected = aptitudeAnswers[aptitudeQuestions[aIndex]?.id] === i;
                  return (
                    <motion.div
                      key={i}
                      whileHover={{ x: 4 }}
                      onClick={() => handleSelectAptitude(i)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        padding: '1.1rem 1.25rem',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        background: isSelected ? 'rgba(112, 0, 255, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                        border: `1.5px solid ${isSelected ? 'var(--accent-teal)' : 'var(--glass-border)'}`,
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        border: `2px solid ${isSelected ? 'var(--accent-teal)' : 'rgba(255, 255, 255, 0.3)'}`,
                        background: isSelected ? 'var(--accent-teal)' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        {isSelected && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#0a0f1e' }} />}
                      </div>
                      <span style={{ fontSize: '1rem', color: isSelected ? 'var(--text-primary)' : 'rgba(255, 255, 255, 0.85)', fontWeight: isSelected ? 600 : 400 }}>
                        {opt}
                      </span>
                    </motion.div>
                  );
                })}
              </div>

              {errorMessage && (
                <motion.div 
                  initial={{ opacity: 0, y: -5 }} 
                  animate={{ opacity: 1, y: 0 }}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ff4d4d', fontSize: '0.9rem', marginTop: '1rem' }}
                >
                  <AlertTriangle size={16} />
                  {errorMessage}
                </motion.div>
              )}
            </div>

            {/* Navigation Buttons */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1.5rem', borderTop: '1px solid var(--glass-border)' }}>
              <button
                onClick={handlePrevAptitude}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.65rem 1.25rem',
                  borderRadius: '10px',
                  border: '1px solid var(--glass-border)',
                  background: 'transparent',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: '0.95rem'
                }}
              >
                <ChevronLeft size={18} /> Back
              </button>

              <motion.button
                onClick={handleNextAptitude}
                disabled={isSubmitting}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.75rem 1.75rem',
                  borderRadius: '10px',
                  border: 'none',
                  background: 'linear-gradient(135deg, var(--accent-teal), var(--accent-violet))',
                  color: '#fff',
                  cursor: isSubmitting ? 'wait' : 'pointer',
                  opacity: isSubmitting ? 0.7 : 1,
                  fontWeight: 600,
                  fontSize: '0.95rem'
                }}
              >
                {isSubmitting ? 'Scoring assessment…' : aIndex === aptitudeQuestions.length - 1 ? 'View Your Results & Matches' : 'Next Question'}
                <ChevronRight size={18} />
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* ─── MODERN RESULTS VIEW: RESULTS & RECOMMENDED UNIVERSITIES ───────────── */}
        {phase === 'results' && scoreResults && (
          <motion.div
            key="results"
            variants={CONTAINER_ANIM}
            initial="hidden"
            animate="show"
            exit="exit"
            style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}
          >
            
            {/* 1. Results Summary Hero Card */}
            <div className="glass-card" style={{ padding: '2.5rem', position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '2rem' }}>
                <div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-teal)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.3rem' }}>
                    <CheckCircle2 size={16} /> Assessment Complete
                  </div>
                  <h2 style={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.3rem)', margin: 0, color: 'var(--text-primary)' }}>
                    Your Career Profile & Results
                  </h2>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', margin: '0.3rem 0 0' }}>
                    Based on your RIASEC occupational interests and reasoning aptitude screen.
                  </p>
                </div>

                {/* Primary Holland Code Badge */}
                <div style={{
                  padding: '0.8rem 1.75rem',
                  borderRadius: '16px',
                  background: 'linear-gradient(135deg, rgba(0, 245, 255, 0.15), rgba(112, 0, 255, 0.2))',
                  border: '1.5px solid var(--accent-teal)',
                  textAlign: 'center',
                  boxShadow: '0 4px 20px rgba(0, 245, 255, 0.15)'
                }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
                    Primary Holland Code
                  </span>
                  <span style={{ fontSize: '2.2rem', fontWeight: 800, letterSpacing: '0.15em', color: 'var(--accent-teal)', fontFamily: 'monospace' }}>
                    {scoreResults.code}
                  </span>
                </div>
              </div>

              {/* Dual Breakdown: RIASEC Profile & Aptitude Domains */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                
                {/* RIASEC Profile Card */}
                <div style={{
                  background: 'var(--subtle-surface)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: '16px',
                  padding: '1.5rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                    <Compass size={18} color="var(--accent-teal)" />
                    <h3 style={{ margin: 0, fontSize: '1.15rem' }}>Vocational Interests</h3>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                    {scoreResults.sortedLetters.map((l) => {
                      const score = scoreResults.interest[l] || 0;
                      const trait = RIASEC_TRAITS[l];
                      return (
                        <div key={l}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                              {trait.name} ({l})
                            </span>
                            <span style={{ fontFamily: 'monospace', color: 'var(--accent-teal)', fontWeight: 600 }}>
                              {score}%
                            </span>
                          </div>
                          <div style={{ height: '8px', background: 'var(--progress-track)', borderRadius: '4px', overflow: 'hidden' }}>
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${score}%` }}
                              transition={{ duration: 0.8, ease: 'easeOut' }}
                              style={{
                                height: '100%',
                                background: trait.color,
                                borderRadius: '4px'
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Aptitude Screen Breakdown */}
                <div style={{
                  background: 'var(--subtle-surface)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: '16px',
                  padding: '1.5rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                    <BrainCircuit size={18} color="var(--accent-violet)" />
                    <h3 style={{ margin: 0, fontSize: '1.15rem' }}>Scholastic Reasoning Readiness</h3>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {Object.entries(DOMAIN_METADATA).map(([key, meta]) => {
                      const score = scoreResults.aptitude[key] || 0;
                      const isPrepared = score >= 50;
                      return (
                        <div key={key}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                              {meta.label}
                            </span>
                            <span style={{ 
                              fontFamily: 'monospace', 
                              color: isPrepared ? 'var(--success)' : 'var(--warning)',
                              fontWeight: 600 
                            }}>
                              {score}% {isPrepared ? '• Prepared' : '• Developing'}
                            </span>
                          </div>
                          <div style={{ height: '8px', background: 'var(--progress-track)', borderRadius: '4px', overflow: 'hidden' }}>
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${score}%` }}
                              transition={{ duration: 0.8, ease: 'easeOut' }}
                              style={{
                                height: '100%',
                                background: isPrepared
                                  ? 'var(--success-gradient)'
                                  : 'var(--warning-gradient)',
                                borderRadius: '4px'
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            </div>

            {/* 2. Grab-Style Interactive Location Pinned Bar */}
            <div className="glass-card" style={{ 
              padding: '1.5rem 1.75rem', 
              borderRadius: '20px', 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              flexWrap: 'wrap', 
              gap: '1.25rem', 
              border: '1.5px solid var(--accent-teal)',
              background: 'linear-gradient(135deg, rgba(0, 245, 255, 0.06), rgba(112, 0, 255, 0.04))',
              boxShadow: '0 8px 30px rgba(0, 245, 255, 0.1)'
            }}>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: '1 1 300px' }}>
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  background: 'rgba(0, 245, 255, 0.15)',
                  color: 'var(--accent-teal)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <MapPin size={24} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--accent-teal)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
                      Pinned Exact Location
                    </span>
                    <span style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem', borderRadius: '4px', background: 'rgba(74, 222, 128, 0.2)', color: 'var(--success)', fontWeight: 700 }}>
                      Live GPS Pin
                    </span>
                  </div>
                  <h3 style={{ margin: '0.15rem 0 0', fontSize: '1.15rem', color: 'var(--text-primary)' }}>
                    {pinnedLocation.address || pinnedLocation.label}
                  </h3>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button
                  onClick={() => setShowMapModal(true)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.65rem 1.25rem',
                    borderRadius: '12px',
                    border: 'none',
                    background: 'var(--accent-teal)',
                    color: 'var(--on-accent)',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    boxShadow: '0 2px 10px rgba(0, 245, 255, 0.3)'
                  }}
                >
                  <Crosshair size={16} /> Pin / Change on Map
                </button>

                <button
                  onClick={() => setOnlyNearby(!onlyNearby)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.65rem 1.1rem',
                    borderRadius: '12px',
                    border: `1px solid ${onlyNearby ? 'var(--accent-teal)' : 'var(--glass-border)'}`,
                    background: onlyNearby ? 'rgba(0, 245, 255, 0.15)' : 'var(--field-bg)',
                    color: onlyNearby ? 'var(--accent-teal)' : 'var(--text-secondary)',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <Navigation size={15} />
                  {onlyNearby ? 'Showing Nearby Campuses' : 'Filter Nearby Only'}
                </button>
              </div>

            </div>

            {/* 3. Toggle Navigation: Programs vs Universities */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h2 style={{ fontSize: '1.6rem', margin: 0, color: 'var(--text-primary)' }}>
                  {resultsTab === 'programs' ? 'Recommended Degree Programs' : 'Recommended Universities You Can Go To'}
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: '0.2rem 0 0' }}>
                  {resultsTab === 'programs' 
                    ? `Showing ${displayedPrograms.length} college programs tailored to your profile and commute range.`
                    : `Showing ${displayedUniversities.length} universities sorted by exact distance from your pin.`}
                </p>
              </div>

              {/* View Switcher Tabs */}
              <div style={{
                display: 'flex',
                background: 'var(--field-bg)',
                border: '1px solid var(--glass-border)',
                borderRadius: '12px',
                padding: '4px'
              }}>
                <button
                  onClick={() => setResultsTab('programs')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.5rem 1.1rem',
                    borderRadius: '8px',
                    border: 'none',
                    background: resultsTab === 'programs' ? 'var(--accent-teal)' : 'transparent',
                    color: resultsTab === 'programs' ? 'var(--on-accent)' : 'var(--text-secondary)',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <GraduationCap size={16} /> By Program ({displayedPrograms.length})
                </button>
                <button
                  onClick={() => setResultsTab('universities')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.5rem 1.1rem',
                    borderRadius: '8px',
                    border: 'none',
                    background: resultsTab === 'universities' ? 'var(--accent-teal)' : 'transparent',
                    color: resultsTab === 'universities' ? 'var(--on-accent)' : 'var(--text-secondary)',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <Building size={16} /> Nearest Universities ({displayedUniversities.length})
                </button>
              </div>
            </div>

            {/* 4A. TAB: RECOMMENDED DEGREE PROGRAMS */}
            {resultsTab === 'programs' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {displayedPrograms.slice(0, 8).map((prog, idx) => (
                  <motion.div
                    key={prog.id || prog.name}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="glass-card"
                    style={{
                      padding: '1.75rem',
                      borderRadius: '16px',
                      background: idx === 0 ? 'var(--result-card-highlight)' : 'var(--result-card-bg)',
                      border: `1px solid ${idx === 0 ? 'var(--accent-teal)' : 'var(--glass-border)'}`
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                      <div style={{ flex: 1, minWidth: '260px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                          <h3 style={{ fontSize: '1.3rem', margin: 0, color: 'var(--text-primary)' }}>
                            {prog.name}
                          </h3>
                          <span style={{
                            fontFamily: 'monospace',
                            fontSize: '0.75rem',
                            padding: '0.2rem 0.6rem',
                            borderRadius: '6px',
                            background: 'var(--chip-bg)',
                            color: 'var(--text-secondary)'
                          }}>
                            Holland Code: {prog.code}
                          </span>
                          {idx === 0 && (
                            <span style={{
                              fontSize: '0.75rem',
                              padding: '0.2rem 0.6rem',
                              borderRadius: '6px',
                              background: 'rgba(0, 245, 255, 0.2)',
                              color: 'var(--accent-teal)',
                              fontWeight: 700
                            }}>
                              ★ Top Match
                            </span>
                          )}
                          {prog.hasNearbyOffering && prog.minDistance !== null && (
                            <span style={{
                              fontSize: '0.75rem',
                              padding: '0.2rem 0.6rem',
                              borderRadius: '6px',
                              background: 'rgba(74, 222, 128, 0.15)',
                              color: 'var(--success)',
                              fontWeight: 600,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem'
                            }}>
                              <Car size={12} /> {prog.minDistance} km from pin
                            </span>
                          )}
                        </div>
                        <p style={{ margin: '0.6rem 0 0', fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                          {prog.why}
                        </p>
                      </div>

                      <div style={{ textAlign: 'right', minWidth: '100px' }}>
                        <span style={{ 
                          fontSize: '1.8rem', 
                          fontWeight: 800, 
                          color: prog.match >= 75 ? 'var(--success)' : prog.match >= 60 ? 'var(--accent-teal)' : 'var(--warning)',
                          fontFamily: 'monospace' 
                        }}>
                          {prog.match}%
                        </span>
                        <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          Match Score
                        </span>
                      </div>
                    </div>

                    {/* Aptitude Gap Flag / Growth Advisory */}
                    {prog.flags && prog.flags.length > 0 && (
                      <div style={{
                        marginTop: '1rem',
                        padding: '0.75rem 1rem',
                        borderRadius: '10px',
                        background: 'var(--danger-bg)',
                        border: '1px solid var(--danger-border)',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '0.6rem',
                        fontSize: '0.85rem',
                        color: 'var(--danger-text)',
                        lineHeight: 1.4
                      }}>
                        <AlertTriangle size={16} color="var(--danger-text)" style={{ flexShrink: 0, marginTop: '2px' }} />
                        <div>
                          <strong>Preparation Note:</strong> This program emphasizes{' '}
                          {prog.flags.map(f => DOMAIN_METADATA[f.d]?.label.toLowerCase()).join(' and ')}. Developing these competencies early in Senior High will boost your confidence.
                        </div>
                      </div>
                    )}

                    {/* Direct University Offerings on the Card with Calculated Distances */}
                    <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid var(--glass-border)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.75rem', fontWeight: 600 }}>
                        <Building size={15} color="var(--accent-teal)" />
                        Offering Universities with Distance from Your Pin ({prog.universities?.length || 0}):
                      </div>

                      {prog.universities && prog.universities.length > 0 ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.75rem' }}>
                          {prog.universities.map((uni) => {
                            const prox = calculateLocationProximity(pinnedLocation, uni.location, uni.name);
                            return (
                              <div
                                key={uni.id || uni.name}
                                style={{
                                  padding: '0.75rem 1rem',
                                  borderRadius: '10px',
                                  background: prox.isNearby ? 'rgba(0, 245, 255, 0.04)' : 'rgba(255, 255, 255, 0.02)',
                                  border: `1px solid ${prox.isNearby ? 'rgba(0, 245, 255, 0.3)' : 'var(--glass-border)'}`,
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  gap: '0.5rem'
                                }}
                              >
                                <div style={{ overflow: 'hidden' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    <h4 style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                      {uni.name}
                                    </h4>
                                    {prox.distanceKm !== null && (
                                      <span style={{
                                        fontSize: '0.65rem',
                                        padding: '0.1rem 0.35rem',
                                        borderRadius: '4px',
                                        background: prox.distanceKm <= 10 ? 'rgba(74, 222, 128, 0.2)' : 'rgba(0, 245, 255, 0.2)',
                                        color: prox.distanceKm <= 10 ? 'var(--success)' : 'var(--accent-teal)',
                                        fontWeight: 700
                                      }}>
                                        {prox.distanceKm} km
                                      </span>
                                    )}
                                  </div>
                                  <p style={{ margin: '0.15rem 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                    <MapPin size={11} /> {uni.location || 'Metro Manila / Philippines'}
                                  </p>
                                </div>
                                {uni.website && (
                                  <a
                                    href={uni.website}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                      color: 'var(--accent-teal)',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '0.2rem',
                                      textDecoration: 'none',
                                      fontSize: '0.8rem',
                                      fontWeight: 600,
                                      flexShrink: 0
                                    }}
                                  >
                                    Website <ExternalLink size={12} />
                                  </a>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
                          Offered across CHED accredited regional institutions in the Philippines.
                        </p>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* 4B. TAB: RECOMMENDED UNIVERSITIES (SORTED BY EXACT DISTANCE) */}
            {resultsTab === 'universities' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
                {displayedUniversities.map((uni, idx) => (
                  <motion.div
                    key={uni.id || uni.name}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="glass-card"
                    style={{
                      padding: '1.75rem',
                      borderRadius: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      border: uni.proximity.isNearby ? '1.5px solid var(--accent-teal)' : '1px solid var(--glass-border)',
                      background: uni.proximity.isNearby ? 'rgba(0, 245, 255, 0.03)' : 'var(--glass-bg)'
                    }}
                  >
                    <div>
                      {/* University Header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', marginBottom: '1rem' }}>
                        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                          <div style={{
                            width: '44px',
                            height: '44px',
                            borderRadius: '12px',
                            background: uni.proximity.isNearby ? 'rgba(0, 245, 255, 0.15)' : 'rgba(112, 0, 255, 0.15)',
                            color: uni.proximity.isNearby ? 'var(--accent-teal)' : 'var(--accent-violet)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}>
                            {uni.logo_url ? (
                              <img src={uni.logo_url} alt={uni.name} style={{ width: '100%', height: '100%', borderRadius: '10px', objectFit: 'cover' }} />
                            ) : (
                              <School size={24} />
                            )}
                          </div>
                          <div>
                            <h3 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--text-primary)' }}>
                              {uni.name}
                            </h3>
                            <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                              <MapPin size={12} /> {uni.location || 'Metro Manila / Philippines'}
                            </p>
                          </div>
                        </div>

                        {/* Distance Badge */}
                        {uni.distanceKm !== null && (
                          <div style={{ textAlign: 'right' }}>
                            <span style={{
                              fontSize: '0.85rem',
                              padding: '0.25rem 0.65rem',
                              borderRadius: '8px',
                              background: uni.distanceKm <= 10 ? 'rgba(74, 222, 128, 0.2)' : 'rgba(0, 245, 255, 0.2)',
                              color: uni.distanceKm <= 10 ? 'var(--success)' : 'var(--accent-teal)',
                              fontWeight: 800,
                              whiteSpace: 'nowrap',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              fontFamily: 'monospace'
                            }}>
                              <Car size={13} /> {uni.distanceKm} km
                            </span>
                            <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                              {uni.proximity.commuteEstimate || 'Straight-line'}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Matching Programs Offered */}
                      <div style={{ margin: '1.25rem 0 0.5rem 0' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>
                          Matching Programs Offered ({uni.matchedPrograms.length}):
                        </span>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                          {uni.matchedPrograms.map((p) => (
                            <span
                              key={p.name}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.3rem',
                                padding: '0.3rem 0.6rem',
                                borderRadius: '6px',
                                background: 'rgba(255, 255, 255, 0.04)',
                                border: '1px solid var(--glass-border)',
                                fontSize: '0.8rem',
                                color: 'var(--text-primary)'
                              }}
                            >
                              <GraduationCap size={12} color="var(--accent-teal)" />
                              {p.name}
                              <strong style={{ color: p.match >= 75 ? 'var(--success)' : 'var(--accent-teal)', marginLeft: '2px' }}>
                                {p.match}%
                              </strong>
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* University Website Button & Proximity Footer */}
                    <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        Avg Program Fit: <strong style={{ color: 'var(--accent-teal)' }}>{uni.avgMatch}%</strong>
                      </span>
                      {uni.website && (
                        <a
                          href={uni.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            padding: '0.4rem 0.85rem',
                            borderRadius: '8px',
                            background: 'rgba(0, 245, 255, 0.1)',
                            border: '1px solid rgba(0, 245, 255, 0.2)',
                            color: 'var(--accent-teal)',
                            fontSize: '0.85rem',
                            fontWeight: 600,
                            textDecoration: 'none'
                          }}
                        >
                          <Globe size={14} /> Official Website <ExternalLink size={12} />
                        </a>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Bottom Actions */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap', marginTop: '1rem' }}>
              <button
                onClick={handleRetake}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.8rem 1.8rem',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--glass-border)',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: '0.95rem',
                  fontWeight: 600
                }}
              >
                <RotateCcw size={16} /> Retake Assessment
              </button>

              <Link
                to="/dashboard/programs"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.8rem 1.8rem',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, var(--accent-teal), var(--accent-violet))',
                  border: 'none',
                  color: '#fff',
                  textDecoration: 'none',
                  fontSize: '0.95rem',
                  fontWeight: 700
                }}
              >
                Explore Full Program Catalog <ArrowRight size={16} />
              </Link>
            </div>

          </motion.div>
        )}

      </AnimatePresence>

      {/* Grab-Style Location Picker Modal */}
      <AnimatePresence>
        {showMapModal && (
          <GrabLocationPickerModal
            initialLocation={pinnedLocation}
            onSelectLocation={handleSelectPinnedLocation}
            onClose={() => setShowMapModal(false)}
          />
        )}
      </AnimatePresence>

    </div>
  );
}
