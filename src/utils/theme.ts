export interface SubjectTheme {
  code: string;
  accent: string;
  bgLight: string;
  text: string;
  border: string;
  badgeClass: string;
  pillClass: string;
  dotClass: string;
}

export const SUBJECT_THEMES: { [key: string]: SubjectTheme } = {
  'NSI': {
    code: 'NSI',
    accent: '#4f46e5',
    bgLight: '#eef2ff',
    text: '#3730a3',
    border: '#c7d2fe',
    badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200/80',
    pillClass: 'bg-indigo-50/70 text-indigo-700 hover:bg-indigo-100',
    dotClass: 'bg-indigo-600',
  },
  'MATH': {
    code: 'MATH',
    accent: '#2563eb',
    bgLight: '#eff6ff',
    text: '#1e40af',
    border: '#bfdbfe',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200/80',
    pillClass: 'bg-blue-50/70 text-blue-700 hover:bg-blue-100',
    dotClass: 'bg-blue-600',
  },
  'PC': {
    code: 'PC',
    accent: '#059669',
    bgLight: '#ecfdf5',
    text: '#065f46',
    border: '#a7f3d0',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    pillClass: 'bg-emerald-50/70 text-emerald-700 hover:bg-emerald-100',
    dotClass: 'bg-emerald-600',
  },
  'PHILO': {
    code: 'PHILO',
    accent: '#d97706',
    bgLight: '#fffbeb',
    text: '#92400e',
    border: '#fde68a',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200/80',
    pillClass: 'bg-amber-50/70 text-amber-800 hover:bg-amber-100',
    dotClass: 'bg-amber-600',
  },
  'HIST-GEO': {
    code: 'HIST-GEO',
    accent: '#ea580c',
    bgLight: '#fff7ed',
    text: '#9a3412',
    border: '#fed7aa',
    badgeClass: 'bg-orange-50 text-orange-700 border-orange-200/80',
    pillClass: 'bg-orange-50/70 text-orange-700 hover:bg-orange-100',
    dotClass: 'bg-orange-600',
  },
  'ANG': {
    code: 'ANG',
    accent: '#e11d48',
    bgLight: '#fff1f2',
    text: '#9f1239',
    border: '#fecdd3',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200/80',
    pillClass: 'bg-rose-50/70 text-rose-700 hover:bg-rose-100',
    dotClass: 'bg-rose-600',
  },
  'EPS': {
    code: 'EPS',
    accent: '#7c3aed',
    bgLight: '#f5f3ff',
    text: '#5b21b6',
    border: '#ddd6fe',
    badgeClass: 'bg-purple-50 text-purple-700 border-purple-200/80',
    pillClass: 'bg-purple-50/70 text-purple-700 hover:bg-purple-100',
    dotClass: 'bg-purple-600',
  },
  'ENS-SCI': {
    code: 'ENS-SCI',
    accent: '#0d9488',
    bgLight: '#f0fdfa',
    text: '#115e59',
    border: '#99f6e4',
    badgeClass: 'bg-teal-50 text-teal-700 border-teal-200/80',
    pillClass: 'bg-teal-50/70 text-teal-700 hover:bg-teal-100',
    dotClass: 'bg-teal-600',
  }
};

export const getSubjectTheme = (codeOrName: string): SubjectTheme => {
  const upper = codeOrName.toUpperCase();
  for (const key in SUBJECT_THEMES) {
    if (upper.includes(key) || key.includes(upper)) {
      return SUBJECT_THEMES[key];
    }
  }
  if (upper.includes('MATH')) return SUBJECT_THEMES['MATH'];
  if (upper.includes('INFO') || upper.includes('NUM')) return SUBJECT_THEMES['NSI'];
  if (upper.includes('CHIM') || upper.includes('PHYS')) return SUBJECT_THEMES['PC'];
  if (upper.includes('PHIL')) return SUBJECT_THEMES['PHILO'];
  if (upper.includes('HIST') || upper.includes('GEO')) return SUBJECT_THEMES['HIST-GEO'];
  if (upper.includes('ANGL')) return SUBJECT_THEMES['ANG'];

  return {
    code: 'GEN',
    accent: '#4f46e5',
    bgLight: '#eef2ff',
    text: '#3730a3',
    border: '#c7d2fe',
    badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    pillClass: 'bg-indigo-50 text-indigo-700',
    dotClass: 'bg-indigo-600',
  };
};

