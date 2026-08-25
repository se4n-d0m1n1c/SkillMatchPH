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
