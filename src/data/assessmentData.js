// RIASEC Interest Inventory Questions (12 items: 2 for each personality type)
export const RIASEC_QUESTIONS = [
  { id: 'r1', letter: 'R', text: 'I like taking things apart to see how they work, or building things with my hands.' },
  { id: 'r2', letter: 'R', text: 'I would rather work with tools, machines, or the outdoors than sit at a desk all day.' },
  { id: 'i1', letter: 'I', text: 'I enjoy figuring out why something happens, not just what happens.' },
  { id: 'i2', letter: 'I', text: 'I like solving puzzles, running experiments, or working through a hard problem step by step.' },
  { id: 'a1', letter: 'A', text: 'I like creating things — designs, writing, music, or visuals — that did not exist before.' },
  { id: 'a2', letter: 'A', text: 'I prefer open-ended tasks with room for my own style, over tasks with one correct answer.' },
  { id: 's1', letter: 'S', text: 'I like helping, teaching, or listening to people directly.' },
  { id: 's2', letter: 'S', text: 'I feel most useful when I am working through a problem with or for other people.' },
  { id: 'e1', letter: 'E', text: 'I like convincing people, leading a group, or pushing a plan forward.' },
  { id: 'e2', letter: 'E', text: 'I would rather start and run something than follow a process someone else made.' },
  { id: 'c1', letter: 'C', text: 'I like keeping things organized — records, schedules, numbers, or files.' },
  { id: 'c2', letter: 'C', text: 'I prefer clear instructions and a defined process over figuring it out as I go.' }
];

export const LIKERT_OPTIONS = [
  { v: 1, label: 'Not like me', shortLabel: '1' },
  { v: 2, label: 'A little', shortLabel: '2' },
  { v: 3, label: 'Somewhat', shortLabel: '3' },
  { v: 4, label: 'A lot', shortLabel: '4' },
  { v: 5, label: 'Very much like me', shortLabel: '5' }
];

// Aptitude Screening Questions (8 items across Verbal, Numerical, Logical, Spatial)
// Aligned with DepEd NCAE General Scholastic Aptitude domains
export const APTITUDE_QUESTIONS = [
  {
    id: 'v1',
    domain: 'verbal',
    text: 'Choose the word closest in meaning to "meticulous".',
    options: ['Careless', 'Careful and precise', 'Fast', 'Loud'],
    correct: 1
  },
  {
    id: 'v2',
    domain: 'verbal',
    text: '"Cause" is to "effect" as "question" is to ___.',
    options: ['Answer', 'Word', 'Sentence', 'Book'],
    correct: 0
  },
  {
    id: 'n1',
    domain: 'numerical',
    text: 'A jeepney fare starts at ₱13 for the first 4 km, plus ₱2 per additional km. What is the fare for 10 km?',
    options: ['₱25', '₱23', '₱27', '₱21'],
    correct: 1
  },
  {
    id: 'n2',
    domain: 'numerical',
    text: 'What number comes next: 2, 6, 18, 54, ___?',
    options: ['108', '162', '96', '216'],
    correct: 1
  },
  {
    id: 'l1',
    domain: 'logical',
    text: 'All engineers in the room wear glasses. Ana wears glasses. Which statement is logically true?',
    options: ['Ana is an engineer', 'Ana might not be an engineer', 'Ana is not an engineer', 'Not enough info about glasses'],
    correct: 1
  },
  {
    id: 'l2',
    domain: 'logical',
    text: 'If it rains, the game is cancelled. The game was not cancelled. What can you conclude?',
    options: ['It rained', 'It did not rain', 'It might have rained', 'No conclusion possible'],
    correct: 1
  },
  {
    id: 's1',
    domain: 'spatial',
    text: 'If you fold a flat paper square in half twice and cut a small triangle off one folded corner, how many holes appear when unfolded?',
    options: ['1 hole', '2 holes', '4 holes', '8 holes'],
    correct: 2
  },
  {
    id: 's2',
    domain: 'spatial',
    text: 'A solid cube is painted red on all sides, then cut into 27 identical smaller cubes. How many small cubes have paint on exactly 2 sides?',
    options: ['8', '12', '6', '24'],
    correct: 1
  }
];

export const DOMAIN_METADATA = {
  verbal: {
    label: 'Verbal Reasoning',
    desc: 'Reading comprehension, language structure, and vocabulary precision.'
  },
  numerical: {
    label: 'Numerical Reasoning',
    desc: 'Mathematical problem solving, arithmetic reasoning, and pattern recognition.'
  },
  logical: {
    label: 'Logical Reasoning',
    desc: 'Deductive reasoning, critical analysis, and conditional relationship evaluation.'
  },
  spatial: {
    label: 'Spatial Reasoning',
    desc: 'Mental rotation, 2D/3D visualization, and structural awareness.'
  }
};

export const RIASEC_TRAITS = {
  R: {
    name: 'Realistic',
    tagline: 'The Doers',
    color: '#38bdf8',
    description: 'Practical, hands-on, mechanical, physical, outdoor, and tool-oriented activities.'
  },
  I: {
    name: 'Investigative',
    tagline: 'The Thinkers',
    color: '#818cf8',
    description: 'Analytical, scientific, intellectual, inquisitive, and research-focused problem solving.'
  },
  A: {
    name: 'Artistic',
    tagline: 'The Creators',
    color: '#f472b6',
    description: 'Creative, intuitive, expressive, open-ended, design-driven, and innovative pursuits.'
  },
  S: {
    name: 'Social',
    tagline: 'The Helpers',
    color: '#4ade80',
    description: 'Empathetic, communicative, supportive, teaching, counseling, and people-centered roles.'
  },
  E: {
    name: 'Enterprising',
    tagline: 'The Persuaders',
    color: '#fbbf24',
    description: 'Leadership, strategic planning, initiative, communication, business, and driving outcomes.'
  },
  C: {
    name: 'Conventional',
    tagline: 'The Organizers',
    color: '#fb7185',
    description: 'Organized, systematic, detail-oriented, precise with data, records, processes, and standards.'
  }
};

// Full mapping of Philippine college programs to RIASEC codes, baseline aptitude requirements, and rationales
export const PROGRAM_ASSESSMENT_MAP = {
  'Accountancy': {
    code: 'CEI',
    domains: [{ d: 'numerical', min: 60 }],
    why: 'Conventional precision with numbers and financial records, enterprising exposure to business strategy, and investigative analysis of audit data.'
  },
  'Architecture': {
    code: 'AIR',
    domains: [{ d: 'spatial', min: 60 }],
    why: 'Artistic design sensibility paired with investigative structural planning and realistic hands-on building knowledge.'
  },
  'Biology': {
    code: 'IRE',
    domains: [{ d: 'logical', min: 50 }, { d: 'verbal', min: 45 }],
    why: 'Investigative scientific analysis of living systems, realistic laboratory/field exploration, and enterprising research applications.'
  },
  'Business Administration': {
    code: 'ECS',
    domains: [],
    why: 'Enterprising leadership and decision-making, conventional operations and planning, and a social component in managing teams and clients.'
  },
  'Chemical Engineering': {
    code: 'IRE',
    domains: [{ d: 'numerical', min: 60 }, { d: 'logical', min: 55 }],
    why: 'Investigative technical science applied to realistic industrial processing and an enterprising edge in systems engineering.'
  },
  'Civil Engineering': {
    code: 'RIC',
    domains: [{ d: 'numerical', min: 60 }, { d: 'spatial', min: 55 }],
    why: 'Realistic hands-on construction and design work, grounded in investigative technical calculations and conventional adherence to building codes.'
  },
  'Communication': {
    code: 'ASE',
    domains: [{ d: 'verbal', min: 55 }],
    why: 'Artistic creative storytelling and media production, social engagement with audiences, and enterprising public strategy.'
  },
  'Computer Science': {
    code: 'IRC',
    domains: [{ d: 'logical', min: 55 }, { d: 'numerical', min: 50 }],
    why: 'Investigative problem-solving (algorithms, data structures) with realistic software crafting and conventional precision in code.'
  },
  'Economics': {
    code: 'CIE',
    domains: [{ d: 'numerical', min: 55 }, { d: 'logical', min: 50 }],
    why: 'Conventional data modeling and metrics, investigative analytical theory, and enterprising policy and market applications.'
  },
  'Education': {
    code: 'SAE',
    domains: [{ d: 'verbal', min: 50 }],
    why: 'Social dedication to mentoring and teaching learners, with artistic lesson creativity and enterprising classroom leadership.'
  },
  'Electrical Engineering': {
    code: 'RIE',
    domains: [{ d: 'numerical', min: 60 }, { d: 'logical', min: 55 }],
    why: 'Realistic circuit and power systems work paired with investigative technical troubleshooting and enterprising innovation.'
  },
  'Industrial Engineering': {
    code: 'EIR',
    domains: [{ d: 'numerical', min: 55 }, { d: 'logical', min: 50 }],
    why: 'Enterprising optimization of organizational workflows, investigative statistical modeling, and realistic physical systems operations.'
  },
  'Information Technology': {
    code: 'RIC',
    domains: [{ d: 'logical', min: 50 }],
    why: 'Realistic hands-on networking, hardware, and infrastructure setup, investigative troubleshooting, and conventional system maintenance.'
  },
  'Mechanical Engineering': {
    code: 'RIE',
    domains: [{ d: 'numerical', min: 60 }, { d: 'spatial', min: 50 }],
    why: 'Realistic physical machines and thermodynamics, investigative engineering analytics, and enterprising manufacturing design.'
  },
  'Medical Technology': {
    code: 'IRS',
    domains: [{ d: 'logical', min: 50 }, { d: 'verbal', min: 45 }],
    why: 'Investigative clinical laboratory diagnostic science, realistic precision instrument handling, and social healthcare service.'
  },
  'Nursing': {
    code: 'SIA',
    domains: [{ d: 'verbal', min: 45 }],
    why: 'Social direct patient care, backed by investigative clinical diagnostic reasoning and an artistic empathy for patient needs.'
  },
  'Pharmacy': {
    code: 'IRS',
    domains: [{ d: 'logical', min: 50 }, { d: 'numerical', min: 50 }],
    why: 'Investigative pharmaceutical chemistry, realistic compounding processes, and social guidance on patient medication safety.'
  },
  'Political Science': {
    code: 'EAS',
    domains: [{ d: 'verbal', min: 55 }, { d: 'logical', min: 50 }],
    why: 'Enterprising policy leadership, artistic rhetorical and diplomatic formulation, and social advocacy for public welfare.'
  },
  'Psychology': {
    code: 'SIA',
    domains: [{ d: 'verbal', min: 55 }],
    why: 'Social focus on understanding and counseling individuals, combined with investigative research methods and artistic behavioral insight.'
  },
  'Tourism and Hospitality Management': {
    code: 'ESC',
    domains: [],
    why: 'Enterprising coordination and guest relations, social hospitality service, and conventional event and logistics scheduling.'
  }
};

// Fallback RIASEC codes by category for dynamically created custom programs
export const CATEGORY_DEFAULT_MAP = {
  'Technology': { code: 'IRC', domains: [{ d: 'logical', min: 50 }], why: 'Investigative digital logic, realistic development, and conventional structure.' },
  'Business': { code: 'ECS', domains: [], why: 'Enterprising leadership, conventional organizational processes, and social management.' },
  'Engineering': { code: 'RIE', domains: [{ d: 'numerical', min: 55 }, { d: 'logical', min: 50 }], why: 'Realistic hands-on systems, investigative design, and enterprising implementation.' },
  'Health': { code: 'SIA', domains: [{ d: 'verbal', min: 45 }], why: 'Social patient service, investigative clinical science, and artistic empathy.' },
  'Arts & Humanities': { code: 'ASE', domains: [{ d: 'verbal', min: 50 }], why: 'Artistic expression, social connection, and enterprising initiative.' },
  'Sciences': { code: 'IRE', domains: [{ d: 'logical', min: 50 }], why: 'Investigative scientific research, realistic laboratory work, and enterprising problem solving.' },
  'Education': { code: 'SAE', domains: [{ d: 'verbal', min: 50 }], why: 'Social instruction, artistic curriculum design, and enterprising classroom leadership.' }
};

/**
 * Compute normalized interest (0-100%) for each RIASEC letter and aptitude domain scores
 */
export function computeScores(interestAnswers, aptitudeAnswers) {
  const letters = ['R', 'I', 'A', 'S', 'E', 'C'];
  const interest = {};

  letters.forEach(l => {
    const qs = RIASEC_QUESTIONS.filter(q => q.letter === l);
    const sum = qs.reduce((acc, q) => acc + (interestAnswers[q.id] || 0), 0);
    interest[l] = Math.round(((sum - qs.length) / (qs.length * 4)) * 100);
  });

  const domains = ['verbal', 'numerical', 'logical', 'spatial'];
  const aptitude = {};

  domains.forEach(d => {
    const qs = APTITUDE_QUESTIONS.filter(q => q.domain === d);
    const correct = qs.filter(q => aptitudeAnswers[q.id] === q.correct).length;
    aptitude[d] = Math.round((correct / qs.length) * 100);
  });

  const sortedLetters = [...letters].sort((a, b) => interest[b] - interest[a]);
  const code = sortedLetters.slice(0, 3).join('');

  return { interest, aptitude, code, sortedLetters };
}

/**
 * Match programs against the student's interest profile and aptitude scores
 */
export function matchPrograms(interest, aptitude, catalogPrograms = []) {
  const weights = [3, 2, 1]; // First letter weighted highest

  const programList = catalogPrograms.length > 0
    ? catalogPrograms.map(p => {
        const assessmentInfo = PROGRAM_ASSESSMENT_MAP[p.title] || CATEGORY_DEFAULT_MAP[p.category] || {
          code: 'IRC',
          domains: [],
          why: p.description
        };
        return {
          id: p.id,
          name: p.title,
          category: p.category,
          description: p.description,
          icon_name: p.icon_name,
          universities: p.universities || [],
          code: assessmentInfo.code,
          domains: assessmentInfo.domains,
          why: assessmentInfo.why || p.description
        };
      })
    : Object.entries(PROGRAM_ASSESSMENT_MAP).map(([name, info]) => ({
        id: name,
        name,
        category: 'General',
        description: info.why,
        icon_name: 'GraduationCap',
        universities: [],
        code: info.code,
        domains: info.domains,
        why: info.why
      }));

  return programList.map(p => {
    const codeLetters = p.code.split('');
    let num = 0;
    let den = 0;

    codeLetters.forEach((l, i) => {
      const w = weights[i] || 1;
      num += w * (interest[l] || 0);
      den += w;
    });

    const match = Math.round(num / den);
    const flags = p.domains.filter(dm => (aptitude[dm.d] || 0) < dm.min);

    return {
      ...p,
      match,
      flags
    };
  }).sort((a, b) => b.match - a.match);
}
