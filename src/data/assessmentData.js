export const LIKERT_OPTIONS = [
  { v: 1, label: 'Not like me', shortLabel: '1' },
  { v: 2, label: 'A little', shortLabel: '2' },
  { v: 3, label: 'Somewhat', shortLabel: '3' },
  { v: 4, label: 'A lot', shortLabel: '4' },
  { v: 5, label: 'Very much like me', shortLabel: '5' }
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

// Order used for every RIASEC vector in this module.
export const RIASEC_ORDER = ['R', 'I', 'A', 'S', 'E', 'C'];

// Order used for every aptitude vector in this module.
export const APTITUDE_ORDER = ['verbal', 'spatial', 'numerical', 'logical'];

// Composite weighting: RIASEC profile similarity dominates, aptitude refines the ranking.
export const RIASEC_WEIGHT = 0.70;
export const APTITUDE_WEIGHT = 0.30;

// Maximum theoretical sum of absolute differences between two vectors that each
// total 100 percentage points. Used to convert a distance into a match score.
const MAX_VECTOR_DISTANCE = 200;

// A program aptitude weight at or above this value is treated as a defining
// expectation for that program when producing growth advisories.
const MATERIAL_APTITUDE_WEIGHT = 25;

/**
 * System-defined RIASEC distribution matrix.
 *
 * Percent weights per program, each row totalling 100. Source: SkillMatch PH
 * RIASEC College Program Weighting Guide. These are proposed system-defined
 * weights for the recommendation algorithm, not official Holland percentages.
 */
export const PROGRAM_RIASEC_WEIGHTS = {
  'BS Information Technology': { R: 20, I: 35, A: 10, S: 5, E: 10, C: 20 },
  'BS Computer Science': { R: 10, I: 50, A: 10, S: 5, E: 5, C: 20 },
  'BS Information Systems': { R: 10, I: 25, A: 5, S: 10, E: 25, C: 25 },
  'BS Cybersecurity': { R: 25, I: 40, A: 5, S: 5, E: 5, C: 20 },
  'BS Data Science': { R: 5, I: 55, A: 5, S: 5, E: 10, C: 20 },
  'BS Software Engineering': { R: 10, I: 45, A: 10, S: 5, E: 10, C: 20 },
  'BS Computer Engineering': { R: 35, I: 40, A: 5, S: 5, E: 5, C: 10 },
  'BS Civil Engineering': { R: 40, I: 30, A: 5, S: 5, E: 10, C: 10 },
  'BS Mechanical Engineering': { R: 45, I: 30, A: 5, S: 5, E: 5, C: 10 },
  'BS Electrical Engineering': { R: 35, I: 40, A: 5, S: 5, E: 5, C: 10 },
  'BS Electronics Engineering': { R: 30, I: 40, A: 10, S: 5, E: 5, C: 10 },
  'BS Industrial Engineering': { R: 20, I: 25, A: 5, S: 10, E: 20, C: 20 },
  'BS Architecture': { R: 20, I: 15, A: 40, S: 5, E: 10, C: 10 },
  'BS Interior Design': { R: 10, I: 10, A: 55, S: 5, E: 10, C: 10 },
  'BS Multimedia Arts': { R: 5, I: 5, A: 60, S: 10, E: 15, C: 5 },
  'BA Communication': { R: 5, I: 10, A: 25, S: 20, E: 30, C: 10 },
  'BA Journalism': { R: 5, I: 25, A: 25, S: 15, E: 15, C: 15 },
  'BS Psychology': { R: 5, I: 30, A: 10, S: 35, E: 10, C: 10 },
  'BS Biology': { R: 10, I: 55, A: 5, S: 15, E: 5, C: 10 },
  'BS Chemistry': { R: 15, I: 55, A: 5, S: 5, E: 5, C: 15 },
  'BS Physics': { R: 20, I: 60, A: 5, S: 5, E: 5, C: 5 },
  'BS Mathematics': { R: 5, I: 60, A: 5, S: 5, E: 10, C: 15 },
  'BS Statistics': { R: 5, I: 55, A: 5, S: 5, E: 15, C: 15 },
  'BS Nursing': { R: 5, I: 20, A: 5, S: 50, E: 10, C: 10 },
  'BS Medical Technology': { R: 15, I: 45, A: 5, S: 20, E: 5, C: 10 },
  'BS Pharmacy': { R: 10, I: 45, A: 5, S: 20, E: 5, C: 15 },
  'BS Physical Therapy': { R: 15, I: 25, A: 5, S: 40, E: 10, C: 10 },
  'BS Occupational Therapy': { R: 10, I: 20, A: 10, S: 45, E: 10, C: 5 },
  'BS Business Administration': { R: 10, I: 10, A: 5, S: 15, E: 40, C: 20 },
  'BS Marketing Management': { R: 5, I: 10, A: 20, S: 15, E: 45, C: 5 },
  'BS Entrepreneurship': { R: 10, I: 10, A: 10, S: 10, E: 50, C: 10 },
  'BS Financial Management': { R: 5, I: 20, A: 5, S: 5, E: 35, C: 30 },
  'BS Accountancy': { R: 5, I: 20, A: 5, S: 5, E: 20, C: 45 },
  'BS Human Resource Management': { R: 5, I: 10, A: 5, S: 30, E: 35, C: 15 },
  'BS Hospitality Management': { R: 5, I: 5, A: 15, S: 25, E: 40, C: 10 },
  'BS Tourism Management': { R: 5, I: 5, A: 15, S: 25, E: 40, C: 10 },
  'BS Culinary Management': { R: 25, I: 5, A: 35, S: 10, E: 20, C: 5 },
  'BS Agriculture': { R: 40, I: 25, A: 5, S: 10, E: 10, C: 10 },
  'BS Environmental Science': { R: 25, I: 45, A: 5, S: 10, E: 5, C: 10 },
  'BS Fisheries': { R: 40, I: 30, A: 5, S: 10, E: 5, C: 10 },
  'BS Forestry': { R: 45, I: 30, A: 5, S: 5, E: 5, C: 10 },
  'BS Sports Science': { R: 30, I: 20, A: 5, S: 30, E: 10, C: 5 },
  'BS Criminology': { R: 25, I: 25, A: 5, S: 15, E: 20, C: 10 },
  'BA Political Science': { R: 5, I: 15, A: 10, S: 20, E: 40, C: 10 },
  'BA Economics': { R: 5, I: 35, A: 5, S: 5, E: 30, C: 20 },
  'BA International Studies': { R: 5, I: 15, A: 15, S: 25, E: 30, C: 10 },
  'Bachelor of Elementary Education': { R: 5, I: 10, A: 10, S: 50, E: 15, C: 10 },
  'Bachelor of Secondary Education': { R: 5, I: 15, A: 10, S: 45, E: 15, C: 10 },
  'BA Fine Arts': { R: 5, I: 5, A: 65, S: 10, E: 10, C: 5 },
  'BA Music': { R: 5, I: 5, A: 70, S: 10, E: 5, C: 5 },
  'BA Film': { R: 5, I: 10, A: 50, S: 10, E: 20, C: 5 }
};

/**
 * Program aptitude requirement matrix. Percent weights, each row totalling 100.
 *
 * Explicit rows below are the values published in the SkillMatch PH RIASEC
 * College Program Weighting Guide for the computing programs. Programs without a
 * published row use deriveAptitudeWeights(), which projects the program's own
 * RIASEC weights onto the four aptitude domains and normalizes to 100.
 */
export const PROGRAM_APTITUDE_WEIGHTS = {
  'BS Computer Science': { verbal: 15, spatial: 10, numerical: 35, logical: 40 },
  'BS Information Technology': { verbal: 15, spatial: 20, numerical: 30, logical: 35 },
  'BS Information Systems': { verbal: 25, spatial: 10, numerical: 30, logical: 35 },
  'BS Cybersecurity': { verbal: 10, spatial: 20, numerical: 30, logical: 40 },
  'BS Data Science': { verbal: 10, spatial: 5, numerical: 40, logical: 45 },
  'BS Software Engineering': { verbal: 15, spatial: 10, numerical: 35, logical: 40 }
};

/**
 * Published rows normalized so every program is scored on the same 0-100 scale.
 *
 * The published guide contains one row that does not total 100: BS Physical
 * Therapy prints 15/25/5/40/10/10 (105). The verbatim numbers are retained in
 * PROGRAM_RIASEC_WEIGHTS above for audit; this normalization keeps program
 * comparisons consistent with a student vector that totals 100.
 */
const NORMALIZED_RIASEC_WEIGHTS = (() => {
  const normalized = {};
  Object.entries(PROGRAM_RIASEC_WEIGHTS).forEach(([key, row]) => {
    const total = RIASEC_ORDER.reduce((sum, letter) => sum + (row[letter] || 0), 0);
    const divisor = total > 0 ? total : 1;
    normalized[key] = RIASEC_ORDER.reduce((acc, letter) => {
      acc[letter] = ((row[letter] || 0) / divisor) * 100;
      return acc;
    }, {});
  });
  return normalized;
})();

const NORMALIZED_APTITUDE_WEIGHTS = (() => {
  const normalized = {};
  Object.entries(PROGRAM_APTITUDE_WEIGHTS).forEach(([key, row]) => {
    const total = APTITUDE_ORDER.reduce((sum, domain) => sum + (row[domain] || 0), 0);
    const divisor = total > 0 ? total : 1;
    normalized[key] = APTITUDE_ORDER.reduce((acc, domain) => {
      acc[domain] = ((row[domain] || 0) / divisor) * 100;
      return acc;
    }, {});
  });
  return normalized;
})();

// Maps catalog program titles onto the weighting-guide program names.
const PROGRAM_ALIASES = {
  'accountancy': 'BS Accountancy',
  'architecture': 'BS Architecture',
  'biology': 'BS Biology',
  'business administration': 'BS Business Administration',
  'chemical engineering': 'BS Chemistry',
  'civil engineering': 'BS Civil Engineering',
  'communication': 'BA Communication',
  'computer science': 'BS Computer Science',
  'criminal justice': 'BS Criminology',
  'criminology': 'BS Criminology',
  'economics': 'BA Economics',
  'education': 'Bachelor of Secondary Education',
  'electrical engineering': 'BS Electrical Engineering',
  'industrial engineering': 'BS Industrial Engineering',
  'information technology': 'BS Information Technology',
  'mechanical engineering': 'BS Mechanical Engineering',
  'medical technology': 'BS Medical Technology',
  'nursing': 'BS Nursing',
  'pharmacy': 'BS Pharmacy',
  'political science': 'BA Political Science',
  'psychology': 'BS Psychology',
  'tourism and hospitality management': 'BS Tourism Management'
};

// Lookup from a normalized program title to its weighting-guide key.
const WEIGHT_LOOKUP = (() => {
  const lookup = new Map();
  const normalize = (value) => String(value || '')
    .toLowerCase()
    .replace(/^(bs|ba|bachelor of science in|bachelor of arts in|bachelor of)\s+/, '')
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  Object.keys(PROGRAM_RIASEC_WEIGHTS).forEach((key) => {
    lookup.set(normalize(key), key);
  });
  Object.entries(PROGRAM_ALIASES).forEach(([title, key]) => {
    lookup.set(normalize(title), key);
  });
  return lookup;
})();

export function resolveProgramProfileKey(title, category) {
  const normalize = (value) => String(value || '')
    .toLowerCase()
    .replace(/^(bs|ba|bachelor of science in|bachelor of arts in|bachelor of)\s+/, '')
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const direct = WEIGHT_LOOKUP.get(normalize(title));
  if (direct) return direct;
  return WEIGHT_LOOKUP.get(normalize(category)) || null;
}

/**
 * Projects RIASEC percent weights onto the four aptitude domains and normalizes
 * the result to 100. Used for programs without a published aptitude row.
 */
export function deriveAptitudeWeights(riasecWeights) {
  const w = riasecWeights || {};
  const raw = {
    verbal: 0.45 * (w.S || 0) + 0.30 * (w.A || 0) + 0.25 * (w.E || 0),
    numerical: 0.55 * (w.I || 0) + 0.45 * (w.C || 0),
    logical: 0.55 * (w.I || 0) + 0.45 * (w.R || 0),
    spatial: 0.55 * (w.R || 0) + 0.45 * (w.A || 0)
  };
  const total = APTITUDE_ORDER.reduce((sum, key) => sum + raw[key], 0);
  if (total <= 0) {
    return { verbal: 25, spatial: 25, numerical: 25, logical: 25 };
  }
  return APTITUDE_ORDER.reduce((acc, key) => {
    acc[key] = (raw[key] / total) * 100;
    return acc;
  }, {});
}

// Converts a three-letter Holland code into a normalized six-part RIASEC vector.
function weightsFromHollandCode(code) {
  const letters = String(code || 'IRC').toUpperCase().split('');
  const letterWeights = [40, 35, 25];
  const vector = RIASEC_ORDER.reduce((acc, letter) => {
    acc[letter] = 0;
    return acc;
  }, {});
  letters.slice(0, 3).forEach((letter, index) => {
    if (vector[letter] === undefined) return;
    vector[letter] = (vector[letter] || 0) + (letterWeights[index] || 0);
  });
  const total = RIASEC_ORDER.reduce((sum, letter) => sum + vector[letter], 0);
  if (total <= 0) return weightsFromHollandCode('IRC');
  return RIASEC_ORDER.reduce((acc, letter) => {
    acc[letter] = (vector[letter] / total) * 100;
    return acc;
  }, {});
}

export function getProgramWeights(title, category, fallbackCode) {
  const key = resolveProgramProfileKey(title, category);
  if (key && NORMALIZED_RIASEC_WEIGHTS[key]) {
    const riasec = NORMALIZED_RIASEC_WEIGHTS[key];
    const aptitude = NORMALIZED_APTITUDE_WEIGHTS[key] || deriveAptitudeWeights(riasec);
    return { key, riasec, aptitude };
  }
  const riasec = weightsFromHollandCode(fallbackCode);
  return { key: null, riasec, aptitude: deriveAptitudeWeights(riasec) };
}

// Normalizes any percentage vector so its parts total 100.
function normalizeVector(values, order) {
  const total = order.reduce((sum, key) => sum + (Number(values?.[key]) || 0), 0);
  if (total <= 0) {
    const even = 100 / order.length;
    return order.reduce((acc, key) => {
      acc[key] = even;
      return acc;
    }, {});
  }
  return order.reduce((acc, key) => {
    acc[key] = ((Number(values?.[key]) || 0) / total) * 100;
    return acc;
  }, {});
}

function sumAbsoluteDifference(studentVector, programVector, order) {
  return order.reduce(
    (sum, key) => sum + Math.abs((studentVector[key] || 0) - (programVector[key] || 0)),
    0
  );
}

// Converts an absolute-difference total into a 0-100 match percentage.
function distanceToMatch(distance) {
  const bounded = Math.min(Math.max(distance, 0), MAX_VECTOR_DISTANCE);
  return 100 * (1 - bounded / MAX_VECTOR_DISTANCE);
}

/**
 * Curated program descriptions plus Holland code, retained for display and for
 * the category fallback used by dynamically created custom programs.
 */
export const PROGRAM_ASSESSMENT_MAP = {
  'Accountancy': {
    code: 'CEI',
    domains: [],
    why: 'Conventional precision with numbers and financial records, enterprising exposure to business strategy, and investigative analysis of audit data.'
  },
  'Architecture': {
    code: 'AIR',
    domains: [],
    why: 'Artistic design sensibility paired with investigative structural planning and realistic hands-on building knowledge.'
  },
  'Biology': {
    code: 'IRE',
    domains: [],
    why: 'Investigative scientific analysis of living systems, realistic laboratory and field exploration, and enterprising research applications.'
  },
  'Business Administration': {
    code: 'ECS',
    domains: [],
    why: 'Enterprising leadership and decision-making, conventional operations and planning, and a social component in managing teams and clients.'
  },
  'Chemical Engineering': {
    code: 'IRE',
    domains: [],
    why: 'Investigative technical science applied to realistic industrial processing and an enterprising edge in systems engineering.'
  },
  'Civil Engineering': {
    code: 'RIC',
    domains: [],
    why: 'Realistic hands-on construction and design work, grounded in investigative technical calculations and conventional adherence to building codes.'
  },
  'Communication': {
    code: 'ASE',
    domains: [],
    why: 'Artistic creative storytelling and media production, social engagement with audiences, and enterprising public strategy.'
  },
  'Criminal Justice': {
    code: 'ICR',
    domains: [],
    why: 'Investigative analysis of evidence and criminal behavior, conventional application of laws and procedures, and realistic field-based public-safety work.'
  },
  'Criminology': {
    code: 'ICR',
    domains: [],
    why: 'Investigative study of crime and evidence, conventional legal documentation and procedure, and realistic preparation for field enforcement and public safety.'
  },
  'Computer Science': {
    code: 'IRC',
    domains: [],
    why: 'Investigative problem-solving (algorithms, data structures) with realistic software crafting and conventional precision in code.'
  },
  'Economics': {
    code: 'CIE',
    domains: [],
    why: 'Conventional data modeling and metrics, investigative analytical theory, and enterprising policy and market applications.'
  },
  'Education': {
    code: 'SAE',
    domains: [],
    why: 'Social dedication to mentoring and teaching learners, with artistic lesson creativity and enterprising classroom leadership.'
  },
  'Electrical Engineering': {
    code: 'RIE',
    domains: [],
    why: 'Realistic circuit and power systems work paired with investigative technical troubleshooting and enterprising innovation.'
  },
  'Industrial Engineering': {
    code: 'EIR',
    domains: [],
    why: 'Enterprising optimization of organizational workflows, investigative statistical modeling, and realistic physical systems operations.'
  },
  'Information Technology': {
    code: 'RIC',
    domains: [],
    why: 'Realistic hands-on networking, hardware, and infrastructure setup, investigative troubleshooting, and conventional system maintenance.'
  },
  'Mechanical Engineering': {
    code: 'RIE',
    domains: [],
    why: 'Realistic physical machines and thermodynamics, investigative engineering analytics, and enterprising manufacturing design.'
  },
  'Medical Technology': {
    code: 'IRS',
    domains: [],
    why: 'Investigative clinical laboratory diagnostic science, realistic precision instrument handling, and social healthcare service.'
  },
  'Nursing': {
    code: 'SIA',
    domains: [],
    why: 'Social direct patient care, backed by investigative clinical diagnostic reasoning and an artistic empathy for patient needs.'
  },
  'Pharmacy': {
    code: 'IRS',
    domains: [],
    why: 'Investigative pharmaceutical chemistry, realistic compounding processes, and social guidance on patient medication safety.'
  },
  'Political Science': {
    code: 'EAS',
    domains: [],
    why: 'Enterprising policy leadership, artistic rhetorical and diplomatic formulation, and social advocacy for public welfare.'
  },
  'Psychology': {
    code: 'SIA',
    domains: [],
    why: 'Social focus on understanding and counseling individuals, combined with investigative research methods and artistic behavioral insight.'
  },
  'Tourism and Hospitality Management': {
    code: 'ESC',
    domains: [],
    why: 'Enterprising coordination and guest relations, social hospitality service, and conventional event and logistics scheduling.'
  }
};

// Fallback Holland codes by category for dynamically created custom programs.
export const CATEGORY_DEFAULT_MAP = {
  'Technology': { code: 'IRC', domains: [], why: 'Investigative digital logic, realistic development, and conventional structure.' },
  'Business': { code: 'ECS', domains: [], why: 'Enterprising leadership, conventional organizational processes, and social management.' },
  'Engineering': { code: 'RIE', domains: [], why: 'Realistic hands-on systems, investigative design, and enterprising implementation.' },
  'Health': { code: 'SIA', domains: [], why: 'Social patient service, investigative clinical science, and artistic empathy.' },
  'Criminal Justice': { code: 'ICR', domains: [], why: 'Investigative evidence analysis, conventional legal procedure and documentation, and realistic field-based public-safety work.' },
  'Arts & Humanities': { code: 'ASE', domains: [], why: 'Artistic expression, social connection, and enterprising initiative.' },
  'Sciences': { code: 'IRE', domains: [], why: 'Investigative scientific research, realistic laboratory work, and enterprising problem solving.' },
  'Education': { code: 'SAE', domains: [], why: 'Social instruction, artistic curriculum design, and enterprising classroom leadership.' }
};

// Renders a two-letter-or-better summary of a program's strongest interests.
function describeProfile(riasecWeights) {
  const ranked = RIASEC_ORDER
    .map((letter) => ({ letter, weight: riasecWeights[letter] || 0 }))
    .sort((a, b) => b.weight - a.weight || a.letter.localeCompare(b.letter));
  const [first, second] = ranked;
  return `${RIASEC_TRAITS[first.letter]?.name} (${Math.round(first.weight)}%) and ${RIASEC_TRAITS[second.letter]?.name} (${Math.round(second.weight)}%)`;
}

function describeAptitude(aptitudeWeights) {
  const ranked = APTITUDE_ORDER
    .map((domain) => ({ domain, weight: aptitudeWeights[domain] || 0 }))
    .sort((a, b) => b.weight - a.weight || a.domain.localeCompare(b.domain));
  const [first, second] = ranked;
  return `${DOMAIN_METADATA[first.domain]?.label || first.domain} (${Math.round(first.weight)}%) and ${DOMAIN_METADATA[second.domain]?.label || second.domain} (${Math.round(second.weight)}%)`;
}

/**
 * Matches programs against a student's interest and aptitude profile.
 *
 * Method (SkillMatch PH RIASEC College Program Weighting Guide):
 *   1. Normalize the student's RIASEC percentages so they total 100.
 *   2. Sum the absolute difference against the program's RIASEC weight row.
 *   3. RIASEC match = 100 x (1 - difference / 200).
 *   4. Repeat steps 1-3 for the four aptitude domains.
 *   5. Final match = 70% RIASEC match + 30% aptitude match.
 *   6. Rank every program by final match, descending.
 *
 * The whole profile is compared, so no single letter can dominate the result.
 */
export function matchPrograms(interest, aptitude, catalogPrograms = []) {
  const studentRiasec = normalizeVector(interest, RIASEC_ORDER);
  const studentAptitude = normalizeVector(aptitude, APTITUDE_ORDER);

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
        why: info.why
      }));

  return programList.map(p => {
    const programWeights = getProgramWeights(p.name, p.category, p.code);

    const riasecDistance = sumAbsoluteDifference(studentRiasec, programWeights.riasec, RIASEC_ORDER);
    const aptitudeDistance = sumAbsoluteDifference(studentAptitude, programWeights.aptitude, APTITUDE_ORDER);

    const riasecMatch = distanceToMatch(riasecDistance);
    const aptitudeMatch = distanceToMatch(aptitudeDistance);
    const matchScore = riasecMatch * RIASEC_WEIGHT + aptitudeMatch * APTITUDE_WEIGHT;

    // A growth advisory is raised when a program materially emphasizes an
    // aptitude domain where the student's normalized profile falls short.
    const flags = APTITUDE_ORDER
      .filter((domain) => (programWeights.aptitude[domain] || 0) >= MATERIAL_APTITUDE_WEIGHT)
      .filter((domain) => studentAptitude[domain] < programWeights.aptitude[domain])
      .map((domain) => ({
        d: domain,
        required: Math.round(programWeights.aptitude[domain]),
        actual: Math.round(studentAptitude[domain])
      }));

    const profileSentence = `Strongest emphasis on ${describeProfile(programWeights.riasec)} interests, with aptitude expectations centered on ${describeAptitude(programWeights.aptitude)}.`;

    return {
      id: p.id,
      name: p.name,
      category: p.category,
      description: p.description,
      icon_name: p.icon_name,
      universities: p.universities,
      code: p.code,
      profileKey: programWeights.key,
      why: p.why ? `${profileSentence} ${p.why}` : profileSentence,
      // `match` is the whole-percent figure shown to students. `matchScore` keeps
      // the full precision so programs that round to the same percent are still
      // ordered by their true fit instead of by name.
      match: Math.round(matchScore),
      matchScore: Math.round(matchScore * 100) / 100,
      riasecMatch: Math.round(riasecMatch * 100) / 100,
      aptitudeMatch: Math.round(aptitudeMatch * 100) / 100,
      riasecWeights: programWeights.riasec,
      aptitudeWeights: programWeights.aptitude,
      flags
    };
  }).sort((a, b) => b.matchScore - a.matchScore || a.name.localeCompare(b.name));
}
