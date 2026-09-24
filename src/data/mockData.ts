import {
  Student,
  CourseEvent,
  Homework,
  Grade,
  SubjectReport,
  Conversation,
  Message,
  SubjectCourse
} from '../types/school';

// Informations de l'élève connecté
export const mockStudent: Student = {
  id: 'student-01',
  firstName: 'Richard',
  lastName: 'Le_',
  email: 'Richard.martin@gmail',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  studentClass: '4T1',
  schoolName: 'College arabe XXIII',
  academicYear: '2025 - 2026',
  ineNumber: '0812948271A',
  unreadNotifications: 3,
};

// Obtenir la date du lundi de la semaine courante
const getCurrentWeekDates = () => {
  const now = new Date();
  const currentDay = now.getDay(); // 0 is Sunday, 1 is Monday...
  const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay;
  const monday = new Date(now);
  monday.setDate(now.getDate() + distanceToMonday);

  const dates: { [key: number]: string } = {};
  for (let i = 1; i <= 6; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + (i - 1));
    dates[i] = d.toISOString().split('T')[0];
  }
  return dates;
};

const weekDates = getCurrentWeekDates();

// Devoirs factices
export const mockHomeworks: Homework[] = [
  {
    id: 'hw-1',
    subject: 'JSP',
    subjectCode: 'NSI',
    color: '#6366f1', // Indigo
    title: 'manger mes morts',
    description: 'XXX',
    dueDate: weekDates[3] || '2026-09-10',
    dueTime: '08:30',
    estimatedTimeMinutes: 45,
    isCompleted: false,
    priority: 'high',
    assignedDate: '2026-09-04',
    hasAttachment: true,
  },
  {
    id: 'hw-2',
    subject: 'Mathématiques',
    subjectCode: 'MATH',
    color: '#0284c7', // Sky blue
    title: 'faire la page 1 a la page 100',
    description: 'TIRAMISUUUUUUUU',
    dueDate: weekDates[2] || '2026-09-09',
    dueTime: '10:30',
    estimatedTimeMinutes: 30,
    isCompleted: true,
    priority: 'medium',
    assignedDate: '2026-09-02',
    hasAttachment: false,
  },
  {
    id: 'hw-3',
    subject: 'Kialuta',
    subjectCode: 'PHILO',
    color: '#d97706', // Amber
    title: 'Pourquoi j\'ai toujours raison?',
    description: 'XXXX',
    dueDate: weekDates[4] || '2026-09-11',
    dueTime: '14:00',
    estimatedTimeMinutes: 60,
    isCompleted: false,
    priority: 'high',
    assignedDate: '2026-09-01',
    hasAttachment: false,
  },
  {
    id: 'hw-4',
    subject: 'j\'ai pu d\'inspi :/',
    subjectCode: 'PC',
    color: '#059669', // Emerald
    title: 'XXX',
    description: 'XXX',
    dueDate: weekDates[5] || '2026-09-12',
    dueTime: '16:00',
    estimatedTimeMinutes: 40,
    isCompleted: false,
    priority: 'medium',
    assignedDate: '2026-09-05',
    hasAttachment: true,
  },
  {
    id: 'hw-5',
    subject: 'Anglais LV1',
    subjectCode: 'ANG',
    color: '#ec4899', // Pink
    title: 'Pourquoi être gay c\'est bien?',
    description: 'Write a 250-word synthesis .',
    dueDate: weekDates[5] || '2026-09-12',
    dueTime: '11:30',
    estimatedTimeMinutes: 30,
    isCompleted: false,
    priority: 'low',
    assignedDate: '2026-09-06',
    hasAttachment: false,
  }
];

// -------------------------------------------------------------
// CATALOGUE CENTRALISÉ DES MATIÈRES (Modifiable facilement pour de vraies données)
// -------------------------------------------------------------
export const SUBJECTS_CATALOG: Record<string, import('../types/school').SubjectDefinition> = {
  MATH: {
    code: 'MATH',
    name: 'Mathématiques',
    teacher: 'Imena',
    defaultRoom: 'Salle B204',
    color: '#0284c7',
    coefficient: 16,
    description: 'Analyse, limites, continuité, géométrie dans l’espace et probabilités.'
  },
  NSI: {
    code: 'NSI',
    name: 'JSP',
    teacher: 'nootends',
    defaultRoom: 'Labo Info 3',
    color: '#6366f1',
    coefficient: 16,
    description: 'Algorithmique, structures de données, arbres binaires et SQL.'
  },
  PHILO: {
    code: 'PHILO',
    name: 'Kialuta',
    teacher: 'Pape Kialuta',
    defaultRoom: 'Salle B108',
    color: '#d97706',
    coefficient: 8,
    description: 'Notion de Technique et Nature chez Aristote et Heidegger.'
  },
  PC: {
    code: 'PC',
    name: "j'ai pu d'inspi :/",
    teacher: 'Dury',
    defaultRoom: 'Labo Chimie 2',
    color: '#059669',
    coefficient: 6,
    description: 'Dosages spectrophotométriques, cinétique et transferts énergétiques.'
  },
  'HIST-GEO': {
    code: 'HIST-GEO',
    name: 'Histoire-Géographie',
    teacher: 'mere terresa nollet / derriderrr',
    defaultRoom: 'Salle A102',
    color: '#f97316',
    coefficient: 3,
    description: 'L’impact des crises économiques des années 1970 sur l’Europe.'
  },
  ANG: {
    code: 'ANG',
    name: 'Anglais LV1',
    teacher: 'Mr. le gay',
    defaultRoom: 'Salle C105',
    color: '#ec4899',
    coefficient: 3,
    description: 'Debate: Technology, ethics, and civic engagement.'
  },
  EPS: {
    code: 'EPS',
    name: 'Éducation Physique & Sportive',
    teacher: 'M. Bailleux qui baille bcp',
    defaultRoom: 'Gymnase',
    color: '#8b5cf6',
    coefficient: 2,
    description: 'Cycle de demi-fond et sports collectifs.'
  },
  'ENS-SCI': {
    code: 'ENS-SCI',
    name: 'Enseignement Scientifique',
    teacher: 'M. Durand',
    defaultRoom: 'Salle B201',
    color: '#10b981',
    coefficient: 2,
    description: 'Science, climat, données et évolution du monde contemporain.'
  }
};

// -------------------------------------------------------------
// CRÉNEAUX HEBDOMADAIRES LÉGERS (Zéro duplication, référence le code matière)
// -------------------------------------------------------------
export const WEEKLY_TIMETABLE_SLOTS: import('../types/school').TimetableSlotConfig[] = [
  // LUNDI
  {
    id: 'evt-mon-1',
    dayOfWeek: 1,
    startTime: '08:30',
    endTime: '10:30',
    subjectCode: 'MATH',
    type: 'cours',
    description: 'Chapitre 3 : Continuité et limites des fonctions composées.',
    materials: [
      { id: 'mat-1', title: 'Cours_Limites_Ch3.pdf', type: 'pdf', size: '1.4 Mo' }
    ]
  },
  {
    id: 'evt-mon-2',
    dayOfWeek: 1,
    startTime: '10:45',
    endTime: '12:45',
    subjectCode: 'HIST-GEO',
    type: 'cours'
  },
  {
    id: 'evt-mon-3',
    dayOfWeek: 1,
    startTime: '14:00',
    endTime: '16:00',
    subjectCode: 'NSI',
    type: 'tp',
    description: 'jsp.',
    materials: [
      { id: 'mat-2', title: 'tp_arbres_binaires.ipynb', type: 'code', size: '250 Ko' }
    ]
  },
  {
    id: 'evt-mon-4',
    dayOfWeek: 1,
    startTime: '16:15',
    endTime: '17:15',
    subjectCode: 'ANG',
    type: 'td'
  },

  // MARDI
  {
    id: 'evt-tue-1',
    dayOfWeek: 2,
    startTime: '08:30',
    endTime: '10:30',
    subjectCode: 'PC',
    type: 'tp',
    description: 'TP n°2 : Dosages spectrophotométriques.',
    materials: [
      { id: 'mat-3', title: 'Fiche_Securite_Chimie.pdf', type: 'pdf', size: '800 Ko' }
    ]
  },
  {
    id: 'evt-tue-2',
    dayOfWeek: 2,
    startTime: '10:45',
    endTime: '12:45',
    subjectCode: 'PHILO',
    type: 'cours'
  },
  {
    id: 'evt-tue-3',
    dayOfWeek: 2,
    startTime: '14:00',
    endTime: '16:00',
    subjectCode: 'EPS',
    type: 'cours'
  },

  // MERCREDI
  {
    id: 'evt-wed-1',
    dayOfWeek: 3,
    startTime: '08:30',
    endTime: '10:30',
    subjectCode: 'NSI',
    type: 'cours'
  },
  {
    id: 'evt-wed-2',
    dayOfWeek: 3,
    startTime: '10:45',
    endTime: '12:45',
    subjectCode: 'MATH',
    type: 'ds'
  },

  // JEUDI
  {
    id: 'evt-thu-1',
    dayOfWeek: 4,
    startTime: '08:30',
    endTime: '10:30',
    subjectCode: 'ENS-SCI',
    type: 'cours'
  },
  {
    id: 'evt-thu-2',
    dayOfWeek: 4,
    startTime: '10:45',
    endTime: '11:45',
    subjectCode: 'PHILO',
    type: 'td'
  },
  {
    id: 'evt-thu-3',
    dayOfWeek: 4,
    startTime: '13:30',
    endTime: '15:30',
    subjectCode: 'NSI',
    type: 'cours'
  },
  {
    id: 'evt-thu-4',
    dayOfWeek: 4,
    startTime: '15:45',
    endTime: '17:45',
    subjectCode: 'HIST-GEO',
    type: 'cours'
  },

  // VENDREDI
  {
    id: 'evt-fri-1',
    dayOfWeek: 5,
    startTime: '08:30',
    endTime: '10:30',
    subjectCode: 'MATH',
    type: 'cours'
  },
  {
    id: 'evt-fri-2',
    dayOfWeek: 5,
    startTime: '10:45',
    endTime: '11:45',
    subjectCode: 'ANG',
    type: 'oral'
  },
  {
    id: 'evt-fri-3',
    dayOfWeek: 5,
    startTime: '13:30',
    endTime: '15:30',
    subjectCode: 'PC',
    type: 'cours'
  }
];

// -------------------------------------------------------------
// COMPILATEUR UNIFIÉ : Transforme les créneaux en CourseEvent[] complets
// -------------------------------------------------------------
export const compileCourseEvents = (
  slots: import('../types/school').TimetableSlotConfig[],
  catalog: Record<string, import('../types/school').SubjectDefinition>,
  dates: { [key: number]: string },
  hws: Homework[]
): CourseEvent[] => {
  const currentDay = new Date().getDay(); // 0: Dimanche, 1: Lundi ...
  
  return slots.map(slot => {
    const subject = catalog[slot.subjectCode] || {
      code: slot.subjectCode,
      name: slot.subjectCode,
      teacher: slot.teacher || 'Enseignant titulaire',
      defaultRoom: 'Salle de cours',
      color: '#6366f1',
      coefficient: 1,
      description: 'Séance de cours.'
    };

    const date = dates[slot.dayOfWeek] || '2026-09-08';
    const homeworkDue = hws.filter(h => h.subjectCode === slot.subjectCode && h.dueDate === date);

    let status: CourseEvent['status'] = 'scheduled';
    if (slot.dayOfWeek < currentDay) {
      status = 'completed';
    } else if (slot.dayOfWeek === currentDay) {
      status = 'in_progress';
    }

    return {
      id: slot.id,
      subject: subject.name,
      subjectCode: slot.subjectCode,
      teacher: slot.teacher || subject.teacher,
      room: slot.room || subject.defaultRoom,
      startTime: slot.startTime,
      endTime: slot.endTime,
      dayOfWeek: slot.dayOfWeek,
      date,
      type: slot.type || 'cours',
      color: subject.color,
      description: slot.description || subject.description,
      status,
      homeworkDue: homeworkDue.length > 0 ? homeworkDue : undefined,
      materials: slot.materials
    };
  });
};

// Emploi du temps de la semaine généré dynamiquement
export const mockCourseEvents: CourseEvent[] = compileCourseEvents(
  WEEKLY_TIMETABLE_SLOTS,
  SUBJECTS_CATALOG,
  weekDates,
  mockHomeworks
);

// Notes & Résultats scolaires
export const mockSubjectReports: SubjectReport[] = [
  {
    subject: 'Numérique & Sc. Informatiques',
    subjectCode: 'NSI',
    color: '#6366f1',
    teacher: 'nootends',
    coefficient: 16,
    studentAverage: 17.6,
    classAverage: 14.1,
    minAverage: 9.8,
    maxAverage: 19.4,
    teacherAppreciation: 'Excellent trimestre. Richard fait preuve d’une remarquable rigueur algorithmique et d’une réelle curiosité technique.',
    grades: [
      {
        id: 'gr-1',
        subject: 'NSI',
        subjectCode: 'NSI',
        value: 18.5,
        maxValue: 20,
        coefficient: 2,
        title: 'DS 1 : Récursivité et Arbres Binaires',
        date: '2026-09-02',
        classAverage: 13.8,
        minGrade: 8,
        maxGrade: 19.5,
        teacherComment: 'Très bonne maîtrise de la récursivité, code propre et commenté.',
        period: 'T1',
        type: 'DS'
      },
      {
        id: 'gr-2',
        subject: 'NSI',
        subjectCode: 'NSI',
        value: 17.0,
        maxValue: 20,
        coefficient: 1,
        title: 'TP Noté : Modélisation SQL & Requêtes',
        date: '2026-08-28',
        classAverage: 14.5,
        minGrade: 10,
        maxGrade: 18,
        teacherComment: 'Toutes les requêtes jointes sont correctes.',
        period: 'T1',
        type: 'TP'
      },
      {
        id: 'gr-3',
        subject: 'NSI',
        subjectCode: 'NSI',
        value: 16.5,
        maxValue: 20,
        coefficient: 1,
        title: 'Interro rapide : Complexité algorithmique',
        date: '2026-08-22',
        classAverage: 13.2,
        minGrade: 7.5,
        maxGrade: 19,
        teacherComment: 'Notation Grand O bien assimilée.',
        period: 'T1',
        type: 'Interro'
      }
    ]
  },
  {
    subject: 'Mathématiques',
    subjectCode: 'MATH',
    color: '#0284c7',
    teacher: 'Imena',
    coefficient: 16,
    studentAverage: 16.4,
    classAverage: 12.8,
    minAverage: 7.4,
    maxAverage: 18.9,
    teacherAppreciation: 'Très bon niveau d’ensemble. Les raisonnements sont solides et bien rédigés. Poursuivez dans cette voie !',
    grades: [
      {
        id: 'gr-4',
        subject: 'Mathématiques',
        subjectCode: 'MATH',
        value: 16.0,
        maxValue: 20,
        coefficient: 3,
        title: 'DS 1 : Suites numériques et limites',
        date: '2026-09-01',
        classAverage: 12.1,
        minGrade: 6.5,
        maxGrade: 19,
        teacherComment: 'Démonstrations claires et soignées.',
        period: 'T1',
        type: 'DS'
      },
      {
        id: 'gr-5',
        subject: 'Mathématiques',
        subjectCode: 'MATH',
        value: 17.5,
        maxValue: 20,
        coefficient: 1,
        title: 'DM 1 : Étude de fonction exponentielle',
        date: '2026-08-25',
        classAverage: 14.2,
        minGrade: 9,
        maxGrade: 19,
        teacherComment: 'Très bon travail personnel.',
        period: 'T1',
        type: 'DM'
      }
    ]
  },
  {
    subject: "j'ai pu d'inspi :/",
    subjectCode: 'PC',
    color: '#059669',
    teacher: 'Dury',
    coefficient: 6,
    studentAverage: 15.2,
    classAverage: 13.0,
    minAverage: 8.5,
    maxAverage: 17.8,
    teacherAppreciation: 'Travail sérieux et régulier. Bonne participation expérimentale lors des séances de laboratoire.',
    grades: [
      {
        id: 'gr-6',
        subject: 'Physique-Chimie',
        subjectCode: 'PC',
        value: 15.5,
        maxValue: 20,
        coefficient: 2,
        title: 'Évaluation : Acido-basicité et pH-métrie',
        date: '2026-08-30',
        classAverage: 12.8,
        minGrade: 7.5,
        maxGrade: 18,
        teacherComment: 'Calculs justes, attention aux chiffres significatifs.',
        period: 'T1',
        type: 'DS'
      },
      {
        id: 'gr-7',
        subject: 'Physique-Chimie',
        subjectCode: 'PC',
        value: 14.5,
        maxValue: 20,
        coefficient: 1,
        title: 'Compte-rendu TP Spectroscopie UV-Visible',
        date: '2026-08-24',
        classAverage: 13.6,
        minGrade: 10,
        maxGrade: 17,
        period: 'T1',
        type: 'TP'
      }
    ]
  },
  {
    subject: 'Kialuta',
    subjectCode: 'PHILO',
    color: '#d97706',
    teacher: 'Pape Kialuta',
    coefficient: 8,
    studentAverage: 14.8,
    classAverage: 11.7,
    minAverage: 6.0,
    maxAverage: 16.5,
    teacherAppreciation: 'Une réflexion pertinente et une pensée bien structurée. Continuez à enrichir vos références philosophiques.',
    grades: [
      {
        id: 'gr-8',
        subject: 'Philosophie',
        subjectCode: 'PHILO',
        value: 15.0,
        maxValue: 20,
        coefficient: 2,
        title: 'Dissertation : Peut-on échapper aux illusions de la conscience ?',
        date: '2026-08-29',
        classAverage: 11.2,
        minGrade: 6,
        maxGrade: 16.5,
        teacherComment: 'Très belle problématisation. Exemples précis.',
        period: 'T1',
        type: 'DS'
      },
      {
        id: 'gr-9',
        subject: 'Philosophie',
        subjectCode: 'PHILO',
        value: 14.0,
        maxValue: 20,
        coefficient: 1,
        title: 'Explication de texte : Kant, Critique de la raison pure',
        date: '2026-08-21',
        classAverage: 12.3,
        minGrade: 8,
        maxGrade: 16,
        period: 'T1',
        type: 'DM'
      }
    ]
  },
  {
    subject: 'Histoire-Géographie',
    subjectCode: 'HIST-GEO',
    color: '#f97316',
    teacher: 'mere terresa nollet / derriderrr',
    coefficient: 6,
    studentAverage: 15.7,
    classAverage: 13.4,
    minAverage: 9.0,
    maxAverage: 18.0,
    teacherAppreciation: 'Ensemble très satisfaisant. Les connaissances historiques sont solides et les croquis cartographiques sont précis.',
    grades: [
      {
        id: 'gr-10',
        subject: 'Histoire-Géographie',
        subjectCode: 'HIST-GEO',
        value: 16.0,
        maxValue: 20,
        coefficient: 2,
        title: 'Composition d’Histoire : Les régimes totalitaires',
        date: '2026-09-03',
        classAverage: 13.1,
        minGrade: 8.5,
        maxGrade: 17.5,
        teacherComment: 'Analyse critique très fine.',
        period: 'T1',
        type: 'DS'
      }
    ]
  },
  {
    subject: 'Anglais LV1',
    subjectCode: 'ANG',
    color: '#ec4899',
    teacher: 'Mr. le gay',
    coefficient: 5,
    studentAverage: 16.8,
    classAverage: 13.9,
    minAverage: 9.5,
    maxAverage: 19.0,
    teacherAppreciation: 'Excellent oral participation and very rich vocabulary. Keep it up!',
    grades: [
      {
        id: 'gr-11',
        subject: 'Anglais LV1',
        subjectCode: 'ANG',
        value: 17.5,
        maxValue: 20,
        coefficient: 1,
        title: 'Oral presentation : Digital citizenship',
        date: '2026-08-26',
        classAverage: 14.0,
        minGrade: 10,
        maxGrade: 19,
        period: 'T1',
        type: 'Oral'
      },
      {
        id: 'gr-12',
        subject: 'Anglais LV1',
        subjectCode: 'ANG',
        value: 16.0,
        maxValue: 20,
        coefficient: 1,
        title: 'Reading comprehension & Writing',
        date: '2026-08-20',
        classAverage: 13.8,
        minGrade: 8,
        maxGrade: 18.5,
        period: 'T1',
        type: 'DS'
      }
    ]
  },
  {
    subject: 'Éducation Physique & Sportive',
    subjectCode: 'EPS',
    color: '#8b5cf6',
    teacher: 'M. Bailleux qui baille bcp',
    coefficient: 2,
    studentAverage: null,
    classAverage: null,
    minAverage: null,
    maxAverage: null,
    isFormativeOnly: true,
    teacherAppreciation: 'Très bon engagement dans les cycles sportifs. Travail sérieux et assidu.',
    grades: [
      {
        id: 'gr-eps-1',
        subject: 'EPS',
        subjectCode: 'EPS',
        value: 15,
        maxValue: 20,
        coefficient: 0,
        title: 'Évaluation formative : Test d’endurance',
        date: '2026-09-02',
        classAverage: 14.2,
        minGrade: 10,
        maxGrade: 18,
        teacherComment: 'Bonne gestion de l’effort.',
        period: 'T1',
        type: 'Formatif',
        isFormative: true
      },
      {
        id: 'gr-eps-2',
        subject: 'EPS',
        subjectCode: 'EPS',
        value: 16,
        maxValue: 20,
        coefficient: 0,
        title: 'Évaluation formative : Demi-fond & relais',
        date: '2026-09-07',
        classAverage: 13.8,
        minGrade: 9,
        maxGrade: 19,
        teacherComment: 'Très bon esprit d’équipe.',
        period: 'T1',
        type: 'Formatif',
        isFormative: true
      }
    ]
  }
];

// Conversations de messagerie
export const mockConversations: Conversation[] = [
  {
    id: 'conv-1',
    name: 'Imena',
    role: 'Professeur Principal & Mathématiques',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80',
    category: 'teachers',
    lastMessage: 'N’oubliez pas d’apporter votre calculatrice programmée pour le DS de mercredi.',
    lastMessageTime: '10:42',
    unreadCount: 1,
    online: true,
    subject: 'Mathématiques'
  },
  {
    id: 'conv-2',
    name: 'nootends',
    role: 'Enseignant NSI & Numérique',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
    category: 'teachers',
    lastMessage: 'Superbe travail sur ton implémentation en Python Richard !',
    lastMessageTime: 'Hier',
    unreadCount: 0,
    online: false,
    subject: 'NSI'
  },
  {
    id: 'conv-3',
    name: 'Vie Scolaire — College arabe XXIII',
    role: 'Administration & Surveillance',
    avatar: 'https://images.unsplash.com/photo-1577495508048-b635879837f1?w=120&auto=format&fit=crop&q=80',
    category: 'admin',
    lastMessage: 'Votre justificatif d’absence du 28 août a bien été validé par la direction.',
    lastMessageTime: 'Lun.',
    unreadCount: 0,
    online: true,
  },
  {
    id: 'conv-4',
    name: 'Groupe Projet NSI (Équipe Alpha)',
    role: 'Projet Grand Oral & NSI (4 élèves)',
    avatar: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=120&auto=format&fit=crop&q=80',
    category: 'groups',
    lastMessage: 'Léa: On se retrouve au CDI jeudi à 13h pour tester l’API ?',
    lastMessageTime: '11:15',
    unreadCount: 2,
    online: true,
  },
  {
    id: 'conv-5',
    name: 'Pape Kialuta',
    role: 'Enseignant Philosophie',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80',
    category: 'teachers',
    lastMessage: 'Vous pouvez consulter les lectures complémentaires déposées dans l’espace cours.',
    lastMessageTime: '03 Sept.',
    unreadCount: 0,
    online: false,
    subject: 'Philosophie'
  }
];

export const mockMessages: { [key: string]: Message[] } = {
  'conv-1': [
    {
      id: 'msg-101',
      conversationId: 'conv-1',
      senderId: 'teacher-1',
      senderName: 'Mme Sophie Laurent',
      senderRole: 'teacher',
      senderAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80',
      content: 'Bonjour Richard, j’ai corrigé ton devoir maison sur les suites récurrentes. Tu as une excellente approche sur la question 3.',
      timestamp: '09:15',
      read: true,
      isSelf: false,
    },
    {
      id: 'msg-102',
      conversationId: 'conv-1',
      senderId: 'student-01',
      senderName: 'Richard Martin',
      senderRole: 'student',
      senderAvatar: mockStudent.avatar,
      content: 'Merci Madame ! Est-ce que la démonstration par l’absurde au paragraphe 2 était suffisante ou fallait-il expliciter le théorème des valeurs intermédiaires ?',
      timestamp: '09:40',
      read: true,
      isSelf: true,
    },
    {
      id: 'msg-103',
      conversationId: 'conv-1',
      senderId: 'teacher-1',
      senderName: 'Mme Sophie Laurent',
      senderRole: 'teacher',
      senderAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80',
      content: 'C’était bien mené. Pour le baccalauréat, prends toujours l’habitude de préciser la stricte monotonie avant d’appliquer le corollaire du TVI. N’oubliez pas d’apporter votre calculatrice programmée pour le DS de mercredi.',
      timestamp: '10:42',
      read: false,
      isSelf: false,
    }
  ],
  'conv-2': [
    {
      id: 'msg-201',
      conversationId: 'conv-2',
      senderId: 'teacher-2',
      senderName: 'M. David Chen',
      senderRole: 'teacher',
      senderAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
      content: 'Superbe travail sur ton implémentation en Python Richard ! Ta complexité temporelle est optimale.',
      timestamp: 'Hier 16:20',
      read: true,
      isSelf: false,
    }
  ],
  'conv-3': [
    {
      id: 'msg-301',
      conversationId: 'conv-3',
      senderId: 'admin-1',
      senderName: 'Vie Scolaire',
      senderRole: 'admin',
      senderAvatar: 'https://images.unsplash.com/photo-1577495508048-b635879837f1?w=120&auto=format&fit=crop&q=80',
      content: 'Votre justificatif d’absence du 28 août a bien été validé par la direction.',
      timestamp: 'Lun. 14:00',
      read: true,
      isSelf: false,
    }
  ],
  'conv-4': [
    {
      id: 'msg-401',
      conversationId: 'conv-4',
      senderId: 'student-02',
      senderName: 'Léa Bernard',
      senderRole: 'student',
      senderAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80',
      content: 'Salut l’équipe ! Qui s’occupe de tester les requêtes SQL pour la base SQLite du projet ?',
      timestamp: '11:02',
      read: true,
      isSelf: false,
    },
    {
      id: 'msg-402',
      conversationId: 'conv-4',
      senderId: 'student-02',
      senderName: 'Léa Bernard',
      senderRole: 'student',
      senderAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80',
      content: 'On se retrouve au CDI jeudi à 13h pour tester l’API ?',
      timestamp: '11:15',
      read: false,
      isSelf: false,
    }
  ]
};

// Matières et Espace de cours complets
export const mockCourses: SubjectCourse[] = [
  {
    id: 'course-nsi',
    subject: 'JSP (Numérique & Informatique)',
    subjectCode: 'NSI',
    color: '#6366f1',
    teacher: 'nootends',
    teacherEmail: 'nootends@college-arabe.fr',
    room: 'Labo Info 3',
    hoursPerWeek: 6,
    progressPercent: 72,
    nextExam: 'DS n°2 — Réseaux & Protocoles (18 Sept)',
    chapters: [
      {
        id: 'chap-nsi-1',
        title: 'Chapitre 1 : Structures de Données Linéaires & Arbres Binaires',
        description: 'Piles, files, listes chaînées et arbres binaires de recherche. Algorithmes récursifs.',
        order: 1,
        status: 'completed',
        documents: [
          { id: 'doc-1', title: 'Cours_Arbres_Binaires.pdf', type: 'pdf', size: '2.3 Mo', uploadDate: '28 Août 2026' },
          { id: 'doc-2', title: 'Fiche_Revision_Parcours_Arbres.pdf', type: 'pdf', size: '890 Ko', uploadDate: '01 Sept 2026' },
          { id: 'doc-3', title: 'Notebook_Exercices_Arbres.ipynb', type: 'archive', size: '340 Ko', uploadDate: '02 Sept 2026' },
        ]
      },
      {
        id: 'chap-nsi-2',
        title: 'Chapitre 2 : Bases de Données & Modèle Relationnel',
        description: 'Schéma relationnel, clés primaires et étrangères, algèbre relationnelle et langage SQL.',
        order: 2,
        status: 'in_progress',
        documents: [
          { id: 'doc-4', title: 'Guide_Syntaxe_SQL_Jointures.pdf', type: 'pdf', size: '1.5 Mo', uploadDate: '04 Sept 2026' },
          { id: 'doc-5', title: 'Base_Exemple_Cinemas.sqlite', type: 'archive', size: '512 Ko', uploadDate: '05 Sept 2026' },
        ]
      },
      {
        id: 'chap-nsi-3',
        title: 'Chapitre 3 : Protocoles Réseau & Routage RIP/OSPF',
        description: 'Architecture des réseaux, algorithmes de Bellman-Ford et Dijkstra, simulation sous Filius.',
        order: 3,
        status: 'upcoming',
        documents: [
          { id: 'doc-6', title: 'Introduction_Routage_IP.pdf', type: 'pdf', size: '3.1 Mo', uploadDate: '07 Sept 2026' }
        ]
      }
    ],
    assignments: [
      {
        id: 'asg-1',
        title: 'Mini-Projet : Moteur de recherche local avec index inversé',
        subject: 'NSI',
        dueDate: '2026-09-25',
        points: 20,
        status: 'pending',
      },
      {
        id: 'asg-2',
        title: 'TP Noté : Requêtes SQL d’agrégation (GROUP BY / HAVING)',
        subject: 'NSI',
        dueDate: '2026-09-08',
        points: 20,
        status: 'submitted',
        submittedFileName: 'Martin_Richard_TP_SQL.py',
        submittedAt: '07 Sept 2026 à 18:22',
        obtainedGrade: 18.5,
        feedback: 'Excellente gestion des jointures externes.'
      }
    ]
  },
  {
    id: 'course-maths',
    subject: 'Mathématiques',
    subjectCode: 'MATH',
    color: '#0284c7',
    teacher: 'Imena',
    teacherEmail: 'imena@college-arabe.fr',
    room: 'Salle B204',
    hoursPerWeek: 6,
    progressPercent: 68,
    nextExam: 'DS n°1 — Suites & Dérivation (Mercredi)',
    chapters: [
      {
        id: 'chap-math-1',
        title: 'Chapitre 1 : Raisonnement par récurrence & Suites',
        description: 'Théorème de convergence monotone, limites infinies et formes indéterminées.',
        order: 1,
        status: 'completed',
        documents: [
          { id: 'doc-m1', title: 'Recurrence_Methodologie_Exemples.pdf', type: 'pdf', size: '1.8 Mo', uploadDate: '25 Août 2026' },
          { id: 'doc-m2', title: 'Exercices_Corriges_Suites.pdf', type: 'pdf', size: '2.1 Mo', uploadDate: '29 Août 2026' }
        ]
      },
      {
        id: 'chap-math-2',
        title: 'Chapitre 2 : Fonctions exponentielles et équations différentielles',
        description: 'Propriétés analytiques, résolution de y\' = ay + b et problèmes d’évolution.',
        order: 2,
        status: 'in_progress',
        documents: [
          { id: 'doc-m3', title: 'Cours_Equations_Differentielles.pdf', type: 'pdf', size: '2.6 Mo', uploadDate: '03 Sept 2026' }
        ]
      }
    ],
    assignments: [
      {
        id: 'asg-m1',
        title: 'Devoir Maison n°2 : Modèle de Verhulst',
        subject: 'Mathématiques',
        dueDate: '2026-09-18',
        points: 20,
        status: 'pending'
      }
    ]
  },
  {
    id: 'course-philo',
    subject: 'Kialuta (Philosophie)',
    subjectCode: 'PHILO',
    color: '#d97706',
    teacher: 'Pape Kialuta',
    teacherEmail: 'kialuta@college-arabe.fr',
    room: 'Salle B108',
    hoursPerWeek: 4,
    progressPercent: 55,
    nextExam: 'Dissertation Blanche (02 Oct)',
    chapters: [
      {
        id: 'chap-phil-1',
        title: 'Thème 1 : La Conscience et l’Inconscient',
        description: 'De l’illusion du libre arbitre au cogito cartésien et aux découvertes freudiennes.',
        order: 1,
        status: 'completed',
        documents: [
          { id: 'doc-p1', title: 'Anthologie_Textes_Conscience.pdf', type: 'pdf', size: '1.2 Mo', uploadDate: '26 Août 2026' }
        ]
      },
      {
        id: 'chap-phil-2',
        title: 'Thème 2 : La Technique et la Nature',
        description: 'La promesse prométhéenne, l’arraisonnement du monde et les enjeux éthiques modernes.',
        order: 2,
        status: 'in_progress',
        documents: [
          { id: 'doc-p2', title: 'Heidegger_Question_Technique.pdf', type: 'pdf', size: '940 Ko', uploadDate: '02 Sept 2026' }
        ]
      }
    ],
    assignments: [
      {
        id: 'asg-p1',
        title: 'Plan détaillé : La technique nous libère-t-elle ?',
        subject: 'Philosophie',
        dueDate: '2026-09-11',
        points: 20,
        status: 'pending'
      }
    ]
  },
  {
    id: 'course-pc',
    subject: "j'ai pu d'inspi :/ (Physique-Chimie)",
    subjectCode: 'PC',
    color: '#059669',
    teacher: 'Dury',
    teacherEmail: 'dury@college-arabe.fr',
    room: 'Labo Chimie 2',
    hoursPerWeek: 4,
    progressPercent: 62,
    nextExam: 'Évaluation TP n°3 (19 Sept)',
    chapters: [
      {
        id: 'chap-pc-1',
        title: 'Chapitre 1 : Détermination de quantités de matière en solution',
        description: 'Spectrophotométrie UV-Visible, loi de Beer-Lambert, conductimétrie.',
        order: 1,
        status: 'completed',
        documents: [
          { id: 'doc-pc1', title: 'Protocole_Beer_Lambert.pdf', type: 'pdf', size: '1.7 Mo', uploadDate: '27 Août 2026' }
        ]
      }
    ],
    assignments: [
      {
        id: 'asg-pc1',
        title: 'Compte-rendu de TP n°2',
        subject: 'Physique-Chimie',
        dueDate: '2026-09-12',
        points: 20,
        status: 'pending'
      }
    ]
  }
];

// Notifications factices
export const mockNotifications = [
  {
    id: 'notif-1',
    title: 'Nouvelle note en Mathématiques',
    description: 'DS 1 : 16/20 (Moyenne classe : 12.1)',
    time: 'Il y a 2h',
    read: false,
    type: 'grade' as const
  },
  {
    id: 'notif-2',
    title: 'Message de Mme Laurent',
    description: 'Rappel pour la calculatrice au DS de mercredi',
    time: 'Il y a 3h',
    read: false,
    type: 'message' as const
  },
  {
    id: 'notif-3',
    title: 'Nouveau cours déposé en NSI',
    description: 'M. Chen a ajouté le support "Routage RIP et OSPF"',
    time: 'Hier',
    read: true,
    type: 'info' as const
  }
];
