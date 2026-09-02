import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import useSWR from 'swr';
import {
  AlertCircle, BarChart3, CheckCircle2, ClipboardList, Edit2,
  Eye, EyeOff, Layers3, Loader2, Plus, Search, Trash2, X
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { DOMAIN_METADATA, RIASEC_TRAITS } from '../../data/assessmentData';

const EMPTY = [];
const SECTION_LABELS = { interest: 'Interest', aptitude: 'Aptitude' };

const fetchAssessmentAdminData = async () => {
  const [versionsResult, questionsResult, attemptsResult] = await Promise.all([
    supabase.from('assessment_versions').select('*').order('created_at', { ascending: false }),
    supabase.from('assessment_questions').select('*').order('section').order('sequence'),
    supabase.from('assessment_attempts').select('id, assessment_version_id, result, completed_at').order('completed_at', { ascending: false }),
  ]);
  if (versionsResult.error) throw versionsResult.error;
  if (questionsResult.error) throw questionsResult.error;
  if (attemptsResult.error) throw attemptsResult.error;
  return {
    versions: versionsResult.data || EMPTY,
    questions: questionsResult.data || EMPTY,
    attempts: attemptsResult.data || EMPTY,
  };
};

const questionCategory = (question) => question.riasec_letter || question.aptitude_domain;

const QuestionModal = ({ question, activeVersionId, questions, onClose, onSaved }) => {
  const [form, setForm] = useState(() => ({
    section: question?.section || 'interest',
    prompt: question?.prompt || '',
    category: questionCategory(question || {}) || 'R',
    options: question?.options?.length ? question.options : ['', '', '', ''],
    correctOptionIndex: question?.correct_option_index ?? 0,
  }));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const setSection = (section) => setForm((current) => ({
    ...current,
    section,
    category: section === 'interest' ? 'R' : 'verbal',
    options: section === 'aptitude' ? (current.options.length ? current.options : ['', '', '', '']) : [],
    correctOptionIndex: 0,
  }));

  const submit = async (event) => {
    event.preventDefault();
    if (!activeVersionId) return setError('There is no active assessment version.');
    if (form.section === 'aptitude' && form.options.some((option) => !option.trim())) {
      return setError('Complete every answer option.');
    }
    setSaving(true);
    setError('');
    const sectionQuestions = questions.filter((item) =>
      item.assessment_version_id === activeVersionId && item.section === form.section
    );
    const payload = {
      assessment_version_id: activeVersionId,
      section: form.section,
      prompt: form.prompt.trim(),
      riasec_letter: form.section === 'interest' ? form.category : null,
      aptitude_domain: form.section === 'aptitude' ? form.category : null,
      options: form.section === 'aptitude' ? form.options.map((option) => option.trim()) : [],
      correct_option_index: form.section === 'aptitude' ? Number(form.correctOptionIndex) : null,
      is_active: question?.is_active ?? true,
    };
    if (!question) payload.sequence = Math.max(0, ...sectionQuestions.map((item) => item.sequence)) + 1;

    const query = question
      ? supabase.from('assessment_questions').update(payload).eq('id', question.id)
      : supabase.from('assessment_questions').insert(payload);
    const { error: saveError } = await query;
    if (saveError) {
      setError(saveError.message);
      setSaving(false);
      return;
    }
    await onSaved();
    onClose();
  };

  return (
    <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div className="glass-card modal-content assessment-modal" initial={{ y: 20, scale: 0.97 }} animate={{ y: 0, scale: 1 }} onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true">
        <div className="assessment-modal-header">
          <div><h2>{question ? 'Edit question' : 'Add question'}</h2><p>Changes apply to the active assessment.</p></div>
          <button className="icon-btn" onClick={onClose} aria-label="Close"><X size={20} /></button>
        </div>
        <form onSubmit={submit} className="assessment-form">
          <div className="modal-form-grid">
            <div className="form-group"><label htmlFor="question-section">Question type</label><select id="question-section" value={form.section} onChange={(e) => setSection(e.target.value)} disabled={Boolean(question)}><option value="interest">Interest</option><option value="aptitude">Aptitude</option></select></div>
            <div className="form-group"><label htmlFor="question-category">Category</label><select id="question-category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>{form.section === 'interest' ? Object.entries(RIASEC_TRAITS).map(([key, value]) => <option key={key} value={key}>{key} — {value.name}</option>) : Object.entries(DOMAIN_METADATA).map(([key, value]) => <option key={key} value={key}>{value.label}</option>)}</select></div>
          </div>
          <div className="form-group"><label htmlFor="question-prompt">Question</label><textarea id="question-prompt" rows="3" required value={form.prompt} onChange={(e) => setForm({ ...form, prompt: e.target.value })} placeholder="Enter the question shown to students" /></div>
          {form.section === 'aptitude' ? <div className="assessment-options"><label>Answer options</label>{form.options.map((option, index) => <div className="assessment-option-row" key={index}><input type="radio" name="correct-answer" checked={Number(form.correctOptionIndex) === index} onChange={() => setForm({ ...form, correctOptionIndex: index })} aria-label={`Mark option ${index + 1} correct`} /><input required value={option} onChange={(e) => setForm({ ...form, options: form.options.map((item, itemIndex) => itemIndex === index ? e.target.value : item) })} placeholder={`Option ${index + 1}`} /></div>)}<small>Select the radio button beside the correct answer.</small></div> : null}
          {error ? <div className="assessment-error" role="alert"><AlertCircle size={16} /> {error}</div> : null}
          <div className="modal-footer"><button type="button" className="cancel-btn" onClick={onClose}>Cancel</button><button className="submit-btn" disabled={saving}>{saving ? <Loader2 className="animate-spin" size={18} /> : null}{question ? 'Save changes' : 'Add question'}</button></div>
        </form>
      </motion.div>
    </motion.div>
  );
};

const DeleteQuestionModal = ({ question, onClose, onDeleted }) => {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const confirmDelete = async () => {
    setDeleting(true);
    setError('');
    try {
      await onDeleted(question);
      onClose();
    } catch (deleteError) {
      setError(deleteError.message || 'Unable to delete this question.');
      setDeleting(false);
    }
  };

  return (
    <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={deleting ? undefined : onClose}>
      <motion.div className="glass-card assessment-delete-modal" initial={{ y: 20, scale: 0.97 }} animate={{ y: 0, scale: 1 }} exit={{ y: 12, scale: 0.98 }} onClick={(event) => event.stopPropagation()} role="alertdialog" aria-modal="true" aria-labelledby="delete-question-title" aria-describedby="delete-question-description">
        <div className="assessment-delete-icon"><Trash2 size={25} /></div>
        <h2 id="delete-question-title">Delete assessment question?</h2>
        <p id="delete-question-description">This permanently removes the question from the active assessment. Historical attempts keep their scores, but detailed reports may no longer show this question's prompt.</p>
        <blockquote>{question.prompt}</blockquote>
        {error ? <div className="assessment-error" role="alert"><AlertCircle size={16} /> {error}</div> : null}
        <div className="modal-footer">
          <button type="button" className="cancel-btn" onClick={onClose} disabled={deleting}>Cancel</button>
          <button type="button" className="assessment-delete-confirm" onClick={confirmDelete} disabled={deleting}>
            {deleting ? <Loader2 className="animate-spin" size={18} /> : <Trash2 size={18} />}
            {deleting ? 'Deleting…' : 'Delete question'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

const Analytics = ({ attempts }) => {
  const stats = useMemo(() => {
    const codes = {};
    const domains = { verbal: 0, numerical: 0, logical: 0, spatial: 0 };
    attempts.forEach(({ result }) => {
      if (result?.code) codes[result.code] = (codes[result.code] || 0) + 1;
      Object.keys(domains).forEach((domain) => { domains[domain] += Number(result?.aptitude?.[domain] || 0); });
    });
    const count = attempts.length || 1;
    return { codes: Object.entries(codes).sort((a, b) => b[1] - a[1]).slice(0, 5), domains: Object.entries(domains).map(([key, total]) => [key, Math.round(total / count)]) };
  }, [attempts]);
  return <div className="assessment-analytics-grid"><div className="glass-card"><h3>Average aptitude scores</h3><p className="assessment-muted">Across {attempts.length} completed assessment{attempts.length === 1 ? '' : 's'}</p>{stats.domains.map(([domain, score]) => <div className="analytics-row" key={domain}><span>{DOMAIN_METADATA[domain].label}</span><div><i style={{ width: `${score}%` }} /></div><strong>{score}%</strong></div>)}</div><div className="glass-card"><h3>Most common interest codes</h3><p className="assessment-muted">Top Holland codes from completed results</p>{stats.codes.length ? stats.codes.map(([code, count]) => <div className="code-row" key={code}><span>{code}</span><strong>{count}</strong></div>) : <div className="assessment-empty">No assessment results yet.</div>}</div></div>;
};

export default function AssessmentManagement() {
  const { data, error, isLoading, mutate } = useSWR('admin-assessment-management', fetchAssessmentAdminData);
  const [tab, setTab] = useState('questions');
  const [search, setSearch] = useState('');
  const [section, setSectionFilter] = useState('all');
  const [editing, setEditing] = useState(undefined);
  const [deleting, setDeleting] = useState(undefined);
  const [feedback, setFeedback] = useState('');
  const activeVersion = data?.versions.find((version) => version.is_active);
  const questions = (data?.questions || EMPTY).filter((question) => question.assessment_version_id === activeVersion?.id);
  const visibleQuestions = questions.filter((question) => (section === 'all' || question.section === section) && question.prompt.toLowerCase().includes(search.toLowerCase()));

  const toggleQuestion = async (question) => {
    setFeedback('');
    const { error: updateError } = await supabase.from('assessment_questions').update({ is_active: !question.is_active }).eq('id', question.id);
    if (!updateError) mutate();
  };

  const deleteQuestion = async (question) => {
    setFeedback('');
    const { data: deletedQuestion, error: deleteError } = await supabase
      .from('assessment_questions')
      .delete()
      .eq('id', question.id)
      .select('id')
      .maybeSingle();
    if (deleteError) throw deleteError;
    if (!deletedQuestion) throw new Error('Question was not deleted. Check administrator permissions and try again.');

    // Keep displayed and delivered question numbering contiguous after deletion.
    const laterQuestions = questions
      .filter((item) => item.section === question.section && item.sequence > question.sequence)
      .sort((a, b) => a.sequence - b.sequence);
    for (const item of laterQuestions) {
      const { error: sequenceError } = await supabase
        .from('assessment_questions')
        .update({ sequence: item.sequence - 1 })
        .eq('id', item.id);
      if (sequenceError) {
        await mutate();
        throw new Error(`Question deleted, but renumbering failed: ${sequenceError.message}`);
      }
    }

    await mutate();
    setFeedback('Assessment question deleted successfully.');
  };

  const openAdd = () => setEditing(null);
  const closeModal = () => setEditing(undefined);

  const categoryCards = [
    ...Object.entries(RIASEC_TRAITS).map(([key, value]) => ({ key, type: 'Interest', name: value.name, description: value.description, color: value.color })),
    ...Object.entries(DOMAIN_METADATA).map(([key, value]) => ({ key, type: 'Aptitude', name: value.label, description: value.desc, color: 'var(--accent-teal)' })),
  ];

  return <div className="admin-page assessment-page">
    <header className="page-header"><div><h1>Manage Assessments</h1><p>Maintain questions, categories, and review result analytics.</p></div>{tab === 'questions' ? <button className="submit-btn assessment-add-btn" onClick={openAdd} disabled={!activeVersion}><Plus size={18} /> Add question</button> : null}</header>
    <div className="assessment-version"><CheckCircle2 size={16} /><span>Active version:</span><strong>{activeVersion?.name || 'None configured'}</strong><span>· {questions.filter((q) => q.is_active).length} active questions</span></div>
    {feedback ? <div className="assessment-success" role="status"><CheckCircle2 size={17} /> {feedback}</div> : null}
    <div className="assessment-tabs" role="tablist">{[['questions', ClipboardList, 'Questions'], ['categories', Layers3, 'Categories'], ['analytics', BarChart3, 'Result analytics']].map(([key, Icon, label]) => <button key={key} className={tab === key ? 'active' : ''} onClick={() => setTab(key)}><Icon size={17} />{label}</button>)}</div>
    {error ? <div className="assessment-error glass-card"><AlertCircle size={18} /> Could not load assessment data: {error.message}</div> : isLoading ? <div className="assessment-loading"><Loader2 className="animate-spin" /> Loading assessment…</div> : tab === 'questions' ? <>
      <div className="assessment-toolbar glass-card"><div className="search-wrapper"><Search size={18} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search questions…" /></div><select value={section} onChange={(e) => setSectionFilter(e.target.value)}><option value="all">All question types</option><option value="interest">Interest</option><option value="aptitude">Aptitude</option></select></div>
      <div className="assessment-question-list">{visibleQuestions.map((question) => <motion.article layout className={`glass-card assessment-question ${question.is_active ? '' : 'inactive'}`} key={question.id}><div className="question-sequence">{question.sequence}</div><div className="question-copy"><div className="question-badges"><span>{SECTION_LABELS[question.section]}</span><span>{question.section === 'interest' ? `${question.riasec_letter} · ${RIASEC_TRAITS[question.riasec_letter]?.name}` : DOMAIN_METADATA[question.aptitude_domain]?.label}</span>{!question.is_active ? <span className="disabled">Disabled</span> : null}</div><h3>{question.prompt}</h3>{question.section === 'aptitude' ? <p>{question.options.length} choices · Correct answer: {question.options[question.correct_option_index]}</p> : <p>Students answer using the 5-point agreement scale.</p>}</div><div className="question-actions"><button className="icon-btn" onClick={() => setEditing(question)} title="Edit question" aria-label={`Edit question ${question.sequence}`}><Edit2 size={17} /></button><button className="icon-btn" onClick={() => toggleQuestion(question)} title={question.is_active ? 'Disable question' : 'Enable question'} aria-label={`${question.is_active ? 'Disable' : 'Enable'} question ${question.sequence}`}>{question.is_active ? <EyeOff size={17} /> : <Eye size={17} />}</button><button className="icon-btn question-delete-btn" onClick={() => setDeleting(question)} title="Delete question" aria-label={`Delete question ${question.sequence}`}><Trash2 size={17} /></button></div></motion.article>)}{visibleQuestions.length === 0 ? <div className="assessment-empty glass-card">No questions match this view.</div> : null}</div>
    </> : tab === 'categories' ? <div className="assessment-category-grid">{categoryCards.map((category) => { const count = questions.filter((question) => questionCategory(question) === category.key).length; return <div className="glass-card assessment-category" key={`${category.type}-${category.key}`}><div className="category-icon" style={{ color: category.color, background: `color-mix(in srgb, ${category.color} 12%, transparent)` }}>{category.key.toUpperCase().slice(0, 2)}</div><span>{category.type}</span><h3>{category.name}</h3><p>{category.description}</p><strong>{count} question{count === 1 ? '' : 's'}</strong><button onClick={() => { setSectionFilter(category.type === 'Interest' ? 'interest' : 'aptitude'); setSearch(''); setTab('questions'); }}>Manage questions</button></div>; })}</div> : <Analytics attempts={(data?.attempts || EMPTY).filter((attempt) => attempt.assessment_version_id === activeVersion?.id)} />}
    <AnimatePresence>{editing !== undefined ? <QuestionModal question={editing} activeVersionId={activeVersion?.id} questions={questions} onClose={closeModal} onSaved={mutate} /> : null}</AnimatePresence>
    <AnimatePresence>{deleting !== undefined ? <DeleteQuestionModal question={deleting} onClose={() => setDeleting(undefined)} onDeleted={deleteQuestion} /> : null}</AnimatePresence>
  </div>;
}
