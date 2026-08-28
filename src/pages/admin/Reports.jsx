import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import useSWR from 'swr';
import {
  Activity, AlertCircle, BarChart3, BookOpen, BrainCircuit,
  CalendarDays, CheckCircle2, ClipboardCheck, Eye, Loader2, RefreshCw, Search, Users, X
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { DOMAIN_METADATA, LIKERT_OPTIONS, matchPrograms, RIASEC_TRAITS } from '../../data/assessmentData';

const EMPTY = [];

const fetchReports = async () => {
  const [profilesResult, attemptsResult, programsResult, questionsResult] = await Promise.all([
    supabase.from('profiles').select('id, first_name, last_name, student_no, status, created_at, updated_at').eq('role', 'student').order('created_at', { ascending: false }),
    supabase.from('assessment_attempts').select('id, user_id, assessment_version_id, interest_answers, aptitude_answers, result, completed_at').order('completed_at', { ascending: false }),
    supabase.from('programs').select('*').order('title'),
    supabase.from('assessment_questions').select('id, assessment_version_id, section, sequence, prompt, riasec_letter, aptitude_domain, options, correct_option_index').order('section').order('sequence'),
  ]);
  if (profilesResult.error) throw profilesResult.error;
  if (attemptsResult.error) throw attemptsResult.error;
  if (programsResult.error) throw programsResult.error;
  if (questionsResult.error) throw questionsResult.error;
  return { profiles: profilesResult.data || EMPTY, attempts: attemptsResult.data || EMPTY, programs: programsResult.data || EMPTY, questions: questionsResult.data || EMPTY };
};

const formatDate = (date) => new Intl.DateTimeFormat('en-PH', {
  month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit'
}).format(new Date(date));

const StatCard = ({ Icon, label, value, note, color, index }) => <motion.div className="stat-card report-stat" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.06 }}><div className="report-stat-icon" style={{ color, background: `color-mix(in srgb, ${color} 12%, transparent)` }}><Icon size={20} /></div><span>{label}</span><strong style={{ color }}>{value}</strong><small>{note}</small></motion.div>;

const ProgressRow = ({ label, value, total, color = 'var(--accent-teal)', suffix = '' }) => {
  const percent = total ? Math.min(100, Math.round((value / total) * 100)) : 0;
  return <div className="report-progress-row"><div><span>{label}</span><strong>{value}{suffix}</strong></div><div className="report-progress-track"><i style={{ width: `${suffix ? value : percent}%`, background: color }} /></div>{!suffix ? <small>{percent}%</small> : null}</div>;
};

const UserActivity = ({ profiles, registrationProfiles = profiles, attempts }) => {
  const profileMap = new Map(profiles.map((profile) => [profile.id, profile]));
  const events = [
    ...registrationProfiles.map((profile) => ({ id: `joined-${profile.id}`, date: profile.created_at, type: 'Registration', Icon: Users, profile })),
    ...attempts.map((attempt) => ({ id: `attempt-${attempt.id}`, date: attempt.completed_at, type: 'Assessment completed', Icon: ClipboardCheck, profile: profileMap.get(attempt.user_id), code: attempt.result?.code })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 20);
  return <div className="glass-card report-panel"><div className="report-panel-header"><div><h2>Recent user activity</h2><p>Latest registrations and assessment completions.</p></div><Activity size={20} /></div><div className="report-activity-list">{events.length ? events.map((event) => { const name = event.profile ? [event.profile.first_name, event.profile.last_name].filter(Boolean).join(' ') : 'Unknown student'; return <div className="report-activity-row" key={event.id}><div className="report-event-icon"><event.Icon size={17} /></div><div><strong>{name || 'Unnamed student'}</strong><span>{event.type}{event.code ? ` · Holland code ${event.code}` : ''}</span></div><time>{formatDate(event.date)}</time></div>; }) : <div className="report-empty">No user activity has been recorded.</div>}</div></div>;
};

const AssessmentSummary = ({ attempts, profiles, onViewAttempt }) => {
  const [studentSearch, setStudentSearch] = useState('');
  const latestByUser = new Map();
  attempts.forEach((attempt) => { if (!latestByUser.has(attempt.user_id)) latestByUser.set(attempt.user_id, attempt); });
  const latest = [...latestByUser.values()];
  const codes = {};
  const traits = Object.fromEntries(Object.keys(RIASEC_TRAITS).map((key) => [key, 0]));
  const aptitude = Object.fromEntries(Object.keys(DOMAIN_METADATA).map((key) => [key, 0]));
  latest.forEach(({ result }) => {
    if (result?.code) codes[result.code] = (codes[result.code] || 0) + 1;
    Object.keys(traits).forEach((key) => { traits[key] += Number(result?.interest?.[key] || 0); });
    Object.keys(aptitude).forEach((key) => { aptitude[key] += Number(result?.aptitude?.[key] || 0); });
  });
  const divisor = latest.length || 1;
  const completion = profiles.length ? Math.round((latestByUser.size / profiles.length) * 100) : 0;
  const profileMap = new Map(profiles.map((profile) => [profile.id, profile]));
  const normalizedSearch = studentSearch.trim().toLowerCase();
  const filteredLatest = latest.filter((attempt) => {
    const profile = profileMap.get(attempt.user_id);
    const searchable = [profile?.first_name, profile?.last_name, profile?.student_no, attempt.result?.code].filter(Boolean).join(' ').toLowerCase();
    return !normalizedSearch || searchable.includes(normalizedSearch);
  });
  return <><div className="report-two-column"><div className="glass-card report-panel"><div className="report-panel-header"><div><h2>Assessment results summary</h2><p>Latest result per student to avoid duplicate weighting.</p></div><BrainCircuit size={20} /></div><div className="report-highlight"><strong>{completion}%</strong><span>completion rate</span><small>{latestByUser.size} of {profiles.length} students</small></div><h3>Average aptitude scores</h3>{Object.entries(aptitude).map(([key, total]) => <ProgressRow key={key} label={DOMAIN_METADATA[key].label} value={Math.round(total / divisor)} total={100} suffix="%" />)}</div><div className="glass-card report-panel"><div className="report-panel-header"><div><h2>Interest profile</h2><p>Average RIASEC scores and common Holland codes.</p></div><BarChart3 size={20} /></div><h3>Average interest scores</h3>{Object.entries(traits).map(([key, total]) => <ProgressRow key={key} label={`${key} · ${RIASEC_TRAITS[key].name}`} value={Math.round(total / divisor)} total={100} suffix="%" color={RIASEC_TRAITS[key].color} />)}<h3 className="report-subheading">Most common codes</h3><div className="report-code-list">{Object.entries(codes).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([code, count]) => <span key={code}><b>{code}</b>{count} student{count === 1 ? '' : 's'}</span>)}{Object.keys(codes).length === 0 ? <div className="report-empty">No completed results yet.</div> : null}</div></div></div><div className="glass-card report-panel report-student-results"><div className="report-panel-header"><div><h2>Student results</h2><p>Open a student’s latest assessment to review their summary and exact answers.</p></div><Users size={20} /></div>{latest.length ? <><div className="student-result-search"><Search size={18} /><input type="search" value={studentSearch} onChange={(event) => setStudentSearch(event.target.value)} placeholder="Search by name, student number, or Holland code…" aria-label="Search student assessment results" /></div>{filteredLatest.length ? <div className="student-result-table"><div className="student-result-head"><span>Student</span><span>Holland code</span><span>Completed</span><span></span></div>{filteredLatest.map((attempt) => { const profile = profileMap.get(attempt.user_id); const name = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || 'Unknown student'; return <div className="student-result-row" key={attempt.id}><div><strong>{name}</strong><span>{profile?.student_no || 'No student number'}</span></div><b>{attempt.result?.code || '—'}</b><time>{formatDate(attempt.completed_at)}</time><button onClick={() => onViewAttempt({ attempt, profile })}><Eye size={16} /> View details</button></div>; })}</div> : <div className="report-empty">No student results match “{studentSearch}”.</div>}</> : <div className="report-empty">No completed assessments in this period.</div>}</div></>;
};

const StudentAssessmentModal = ({ selection, questions, onClose }) => {
  const { attempt, profile } = selection;
  const versionQuestions = questions.filter((question) => question.assessment_version_id === attempt.assessment_version_id);
  const interestQuestions = versionQuestions.filter((question) => question.section === 'interest');
  const aptitudeQuestions = versionQuestions.filter((question) => question.section === 'aptitude');
  const name = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || 'Unknown student';
  return <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}><motion.div className="glass-card report-detail-modal" initial={{ y: 20, scale: 0.97 }} animate={{ y: 0, scale: 1 }} exit={{ y: 20, scale: 0.97 }} onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-label={`${name} assessment details`}><div className="report-detail-header"><div><span>Student assessment</span><h2>{name}</h2><p>{profile?.student_no || 'No student number'} · Completed {formatDate(attempt.completed_at)}</p></div><button className="icon-btn" onClick={onClose} aria-label="Close assessment details"><X size={20} /></button></div><div className="report-detail-summary"><div><span>Holland code</span><strong>{attempt.result?.code || '—'}</strong></div>{Object.entries(attempt.result?.aptitude || {}).map(([domain, score]) => <div key={domain}><span>{DOMAIN_METADATA[domain]?.label || domain}</span><strong>{score}%</strong></div>)}</div><section className="answer-section"><h3>Interest answers</h3><p>Responses use the five-point agreement scale.</p><div className="answer-list">{interestQuestions.map((question) => { const value = Number(attempt.interest_answers?.[question.id]); const answer = LIKERT_OPTIONS.find((option) => option.v === value); return <div className="answer-row" key={question.id}><span>{question.sequence}</span><div><strong>{question.prompt}</strong><small>{question.riasec_letter} · {RIASEC_TRAITS[question.riasec_letter]?.name}</small></div><b>{value || '—'} · {answer?.label || 'No answer'}</b></div>; })}</div></section><section className="answer-section"><h3>Aptitude answers</h3><p>The selected option is compared with the stored answer key.</p><div className="answer-list">{aptitudeQuestions.map((question) => { const selectedIndex = Number(attempt.aptitude_answers?.[question.id]); const hasAnswer = Number.isInteger(selectedIndex) && selectedIndex >= 0; const correct = hasAnswer && selectedIndex === question.correct_option_index; return <div className={`answer-row aptitude-answer ${correct ? 'correct' : 'incorrect'}`} key={question.id}><span>{question.sequence}</span><div><strong>{question.prompt}</strong><small>{DOMAIN_METADATA[question.aptitude_domain]?.label || question.aptitude_domain}</small><p>Selected: {hasAnswer ? question.options?.[selectedIndex] : 'No answer'}</p>{!correct ? <p>Correct: {question.options?.[question.correct_option_index]}</p> : null}</div><b>{correct ? 'Correct' : 'Incorrect'}</b></div>; })}</div></section></motion.div></motion.div>;
};

const ProgramPopularity = ({ attempts, programs }) => {
  const ranking = useMemo(() => {
    const counts = new Map(programs.map((program) => [program.id, { ...program, count: 0, totalMatch: 0 }]));
    const latestByStudent = new Map();
    attempts.forEach((attempt) => {
      if (!latestByStudent.has(attempt.user_id)) latestByStudent.set(attempt.user_id, attempt);
    });
    latestByStudent.forEach(({ result }) => {
      if (!result?.interest || !result?.aptitude) return;
      const topMatches = matchPrograms(result.interest, result.aptitude, programs).slice(0, 3);
      topMatches.forEach((match) => { const item = counts.get(match.id); if (item) { item.count += 1; item.totalMatch += match.match; } });
    });
    return [...counts.values()].filter((item) => item.count > 0).map((item) => ({ ...item, averageMatch: Math.round(item.totalMatch / item.count) })).sort((a, b) => b.count - a.count || b.averageMatch - a.averageMatch);
  }, [attempts, programs]);
  const maximum = ranking[0]?.count || 0;
  return <div className="glass-card report-panel"><div className="report-panel-header"><div><h2>Program popularity</h2><p>Programs ranked by appearances in students’ top three assessment matches.</p></div><BookOpen size={20} /></div>{ranking.length ? <div className="report-program-table"><div className="report-program-head"><span>Rank</span><span>Program</span><span>Top matches</span><span>Avg. match</span></div>{ranking.map((program, index) => <div className="report-program-row" key={program.id}><b>#{index + 1}</b><div><strong>{program.title}</strong><span>{program.category}</span><i><em style={{ width: `${(program.count / maximum) * 100}%` }} /></i></div><strong>{program.count}</strong><strong>{program.averageMatch}%</strong></div>)}</div> : <div className="report-empty">Complete assessment results are needed to rank programs.</div>}</div>;
};

export default function Reports() {
  const { data, error, isLoading, mutate } = useSWR('admin-reports', fetchReports);
  const [tab, setTab] = useState('activity');
  const [period, setPeriod] = useState('all');
  const [selectedAttempt, setSelectedAttempt] = useState(null);
  const cutoff = period === 'all' ? null : Date.now() - Number(period) * 86400000;
  const allProfiles = data?.profiles || EMPTY;
  const profiles = allProfiles.filter((profile) => !cutoff || new Date(profile.created_at).getTime() >= cutoff);
  const attempts = (data?.attempts || EMPTY).filter((attempt) => !cutoff || new Date(attempt.completed_at).getTime() >= cutoff);
  const uniqueCompleted = new Set(attempts.map((attempt) => attempt.user_id)).size;
  const approved = profiles.filter((profile) => profile.status === 'approved').length;
  const stats = [
    { Icon: Users, label: 'Student registrations', value: profiles.length, note: period === 'all' ? 'All recorded students' : `Within the last ${period} days`, color: 'var(--accent-teal)' },
    { Icon: CheckCircle2, label: 'Approved students', value: approved, note: `${profiles.length ? Math.round((approved / profiles.length) * 100) : 0}% of registrations`, color: 'var(--success)' },
    { Icon: ClipboardCheck, label: 'Assessment takers', value: uniqueCompleted, note: `${attempts.length} total completions`, color: 'var(--accent-violet)' },
  ];
  return <div className="admin-page reports-page"><header className="page-header"><div><h1>Reports</h1><p>Monitor platform activity, assessment outcomes, and program demand.</p></div><button className="refresh-btn" onClick={() => mutate()} aria-label="Refresh reports"><RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} /></button></header><div className="reports-controls"><div className="assessment-tabs" role="tablist">{[['activity', Activity, 'User activity'], ['assessment', BrainCircuit, 'Assessment summary'], ['programs', BookOpen, 'Program popularity']].map(([key, Icon, label]) => <button key={key} className={tab === key ? 'active' : ''} onClick={() => setTab(key)}><Icon size={17} />{label}</button>)}</div><label><CalendarDays size={16} /><select value={period} onChange={(event) => setPeriod(event.target.value)}><option value="all">All time</option><option value="7">Last 7 days</option><option value="30">Last 30 days</option><option value="90">Last 90 days</option></select></label></div>{error ? <div className="assessment-error glass-card"><AlertCircle size={18} /> Could not load reports: {error.message}</div> : isLoading ? <div className="assessment-loading"><Loader2 className="animate-spin" /> Loading reports…</div> : <><div className="reports-stats">{stats.map((stat, index) => <StatCard key={stat.label} {...stat} index={index} />)}</div>{tab === 'activity' ? <UserActivity profiles={allProfiles} registrationProfiles={profiles} attempts={attempts} /> : tab === 'assessment' ? <AssessmentSummary profiles={allProfiles} attempts={attempts} onViewAttempt={setSelectedAttempt} /> : <ProgramPopularity programs={data?.programs || EMPTY} attempts={attempts} />}</>}<AnimatePresence>{selectedAttempt ? <StudentAssessmentModal selection={selectedAttempt} questions={data?.questions || EMPTY} onClose={() => setSelectedAttempt(null)} /> : null}</AnimatePresence></div>;
}
