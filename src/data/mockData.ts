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

// -------------------------------------------------------------
// CENTRALISATION DES PROFESSEURS & MATIÈRES
// -------------------------------------------------------------
export interface TeacherProfile {
  id: string;
  name: string;
  subject: string;
  subjectCode: string;
  role: string;
  email: string;
  avatar: string;
  room: string;
}

export const TEACHERS: Record<string, TeacherProfile> = {
  MATH: {
    id: 'teacher-math',
    name: 'Imena',
    subject: 'Mathématiques',
    subjectCode: 'MATH',
    role: 'Enseignant Mathématiques',
    email: 'imena@betterschool.fr',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80',
    room: 'Salle B204',
  },
  HIST_GEO: {
    id: 'teacher-hist-geo',
    name: 'mere terresa nollet / derriderrr',
    subject: 'Histoire-Géographie',
    subjectCode: 'HIST-GEO',
    role: 'Enseignant Histoire-Géographie',
    email: 'nollet@betterschool.fr',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
    room: 'Salle A102',
  },
  NSI: {
    id: 'teacher-nsi',
    name: 'nootends',
    subject: 'Science',
    subjectCode: 'SCI',
    role: 'Enseignant Science',
    email: 'nootends@betterschool.fr',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    room: 'Labo Science',
  },
  ANG: {
    id: 'teacher-ang',
    name: 'Mr. le gay',
    subject: 'Anglais LV1',
    subjectCode: 'ANG',
    role: 'Enseignant Anglais LV1',
    email: 'mr.legay@betterschool.fr',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80',
    room: 'Salle C105',
  },
  PC: {
    id: 'teacher-pc',
    name: 'Dury',
    subject: 'Physique-Chimie',
    subjectCode: 'PC',
    role: 'Enseignant Physique-Chimie',
    email: 'dury@betterschool.fr',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80',
    room: 'Labo Chimie 2',
  },
  PHILO: {
    id: 'teacher-philo',
    name: 'Pape Kialuta',
    subject: 'Kialuta',
    subjectCode: 'PHILO',
    role: 'Enseignant Philosophie',
    email: 'pape.kialuta@betterschool.fr',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80',
    room: 'Salle B108',
  },
  EPS: {
    id: 'teacher-eps',
    name: 'M. Bailleux qui baille bcp',
    subject: 'Éducation Physique & Sportive',
    subjectCode: 'EPS',
    role: 'Enseignant EPS',
    email: 'bailleux@betterschool.fr',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&auto=format&fit=crop&q=80',
    room: 'Gymnase',
  }
};

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
    subjectCode: 'SCI',
    color: '#6366f1',
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
    color: '#0284c7',
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
    color: '#d97706',
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
    color: '#059669',
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
    color: '#ec4899',
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

// Emploi du temps de la semaine
export const mockCourseEvents: CourseEvent[] = [
  // LUNDI (dayOfWeek: 1)
  {
    id: 'evt-mon-1',
    subject: 'Mathématiques',
    subjectCode: 'MATH',
    teacher: TEACHERS.MATH.name,
    room: TEACHERS.MATH.room,
    startTime: '08:30',
    endTime: '10:30',
    dayOfWeek: 1,
    date: weekDates[1],
    type: 'cours',
    color: '#0284c7',
    description: 'Chapitre 3 : Continuité et limites des fonctions composées.',
    status: 'completed',
    materials: [
      { id: 'mat-1', title: 'Cours_Limites_Ch3.pdf', type: 'pdf', size: '1.4 Mo' }
    ]
  },
  {
    id: 'evt-mon-2',
    subject: 'Histoire-Géographie',
    subjectCode: 'HIST-GEO',
    teacher: TEACHERS.HIST_GEO.name,
    room: TEACHERS.HIST_GEO.room,
    startTime: '10:45',
    endTime: '12:45',
    dayOfWeek: 1,
    date: weekDates[1],
    type: 'cours',
    color: '#f97316',
    description: 'L’impact des crises économiques des années 1970 sur l’Europe.',
    status: 'completed',
  },
  {
    id: 'evt-mon-3',
    subject: TEACHERS.NSI.subject,
    subjectCode: TEACHERS.NSI.subjectCode,
    teacher: TEACHERS.NSI.name,
    room: TEACHERS.NSI.room,
    startTime: '14:00',
    endTime: '16:00',
    dayOfWeek: 1,
    date: weekDates[1],
    type: 'tp',
    color: '#6366f1',
    description: 'jsp.',
    status: 'completed',
    materials: [
      { id: 'mat-2', title: 'tp_science.pdf', type: 'pdf', size: '250 Ko' }
    ]
  },
  {
    id: 'evt-mon-4',
    subject: 'Anglais LV1',
    subjectCode: 'ANG',
    teacher: TEACHERS.ANG.name,
    room: TEACHERS.ANG.room,
    startTime: '16:15',
    endTime: '17:15',
    dayOfWeek: 1,
    date: weekDates[1],
    type: 'td',
    color: '#ec4899',
    description: 'Debate: Technology and civic engagement.',
    status: 'completed',
  },

  // MARDI (dayOfWeek: 2)
  {
    id: 'evt-tue-1',
    subject: 'Physique-Chimie',
    subjectCode: 'PC',
    teacher: TEACHERS.PC.name,
    room: TEACHERS.PC.room,
    startTime: '08:30',
    endTime: '10:30',
    dayOfWeek: 2,
    date: weekDates[2],
    type: 'tp',
    color: '#059669',
    description: 'TP n°2 : Dosages spectrophotométriques.',
    status: 'in_progress',
    homeworkDue: [mockHomeworks[1]],
    materials: [
      { id: 'mat-3', title: 'Fiche_Securite_Chimie.pdf', type: 'pdf', size: '800 Ko' }
    ]
  },
  {
    id: 'evt-tue-2',
    subject: 'Kialuta',
    subjectCode: 'PHILO',
    teacher: TEACHERS.PHILO.name,
    room: TEACHERS.PHILO.room,
    startTime: '10:45',
    endTime: '12:45',
    dayOfWeek: 2,
    date: weekDates[2],
    type: 'cours',
    color: '#d97706',
    description: 'Introduction à la notion de Technique et Nature chez Aristote et Heidegger.',
    status: 'scheduled',
  },
  {
    id: 'evt-tue-3',
    subject: 'Éducation Physique & Sportive',
    subjectCode: 'EPS',
    teacher: TEACHERS.EPS.name,
    room: TEACHERS.EPS.room,
    startTime: '14:00',
    endTime: '16:00',
    dayOfWeek: 2,
    date: weekDates[2],
    type: 'cours',
    color: '#8b5cf6',
    description: 'XXX',
    status: 'scheduled',
  },

  // MERCREDI (dayOfWeek: 3)
  {
    id: 'evt-wed-1',
    subject: TEACHERS.NSI.subject,
    subjectCode: TEACHERS.NSI.subjectCode,
    teacher: TEACHERS.NSI.name,
    room: TEACHERS.NSI.room,
    startTime: '08:30',
    endTime: '10:30',
    dayOfWeek: 3,
    date: weekDates[3],
    type: 'cours',
    color: '#6366f1',
    description: 'Travail sur la démarche scientifique.',
    status: 'scheduled',
    homeworkDue: [mockHomeworks[0]],
  },
  {
    id: 'evt-wed-2',
    subject: 'Mathématiques',
    subjectCode: 'MATH',
    teacher: TEACHERS.MATH.name,
    room: TEACHERS.MATH.room,
    startTime: '10:45',
    endTime: '12:45',
    dayOfWeek: 3,
    date: weekDates[3],
    type: 'ds',
    color: '#0284c7',
    description: 'Contrôle sur les suites numériques et la démonstration par récurrence.',
    status: 'scheduled',
  },

  // JEUDI (dayOfWeek: 4)
  {
    id: 'evt-thu-1',
    subject: 'Physique-Chimie',
    subjectCode: 'PC',
    teacher: TEACHERS.PC.name,
    room: TEACHERS.PC.room,
    startTime: '08:30',
    endTime: '10:30',
    dayOfWeek: 4,
    date: weekDates[4],
    type: 'cours',
    color: '#059669',
    description: 'Étude des enjeux énergétiques et des transformations de la matière.',
    status: 'scheduled',
  },
  {
    id: 'evt-thu-2',
    subject: 'Kialuta',
    subjectCode: 'PHILO',
    teacher: TEACHERS.PHILO.name,
    room: TEACHERS.PHILO.room,
    startTime: '10:45',
    endTime: '11:45',
    dayOfWeek: 4,
    date: weekDates[4],
    type: 'td',
    color: '#d97706',
    description: 'Séminaire : liberté, technique et responsabilités individuelles.',
    status: 'scheduled',
    homeworkDue: [mockHomeworks[2]],
  },
  {
    id: 'evt-thu-3',
    subject: TEACHERS.NSI.subject,
    subjectCode: TEACHERS.NSI.subjectCode,
    teacher: TEACHERS.NSI.name,
    room: TEACHERS.NSI.room,
    startTime: '13:30',
    endTime: '15:30',
    dayOfWeek: 4,
    date: weekDates[4],
    type: 'cours',
    color: '#6366f1',
    description: 'Approfondissement des notions scientifiques.',
    status: 'scheduled',
  },
  {
    id: 'evt-thu-4',
    subject: 'Histoire-Géographie',
    subjectCode: 'HIST-GEO',
    teacher: TEACHERS.HIST_GEO.name,
    room: TEACHERS.HIST_GEO.room,
    startTime: '15:45',
    endTime: '17:45',
    dayOfWeek: 4,
    date: weekDates[4],
    type: 'cours',
    color: '#f97316',
    description: 'Les grandes mutations économiques et sociales au XXe siècle.',
    status: 'scheduled',
  },

  // VENDREDI (dayOfWeek: 5)
  {
    id: 'evt-fri-1',
    subject: 'Mathématiques',
    subjectCode: 'MATH',
    teacher: TEACHERS.MATH.name,
    room: TEACHERS.MATH.room,
    startTime: '08:30',
    endTime: '10:30',
    dayOfWeek: 5,
    date: weekDates[5],
    type: 'cours',
    color: '#0284c7',
    description: 'Rappels sur les fonctions et la résolution d’équations complexes.',
    status: 'scheduled',
  },
  {
    id: 'evt-fri-2',
    subject: 'Anglais LV1',
    subjectCode: 'ANG',
    teacher: TEACHERS.ANG.name,
    room: TEACHERS.ANG.room,
    startTime: '10:45',
    endTime: '11:45',
    dayOfWeek: 5,
    date: weekDates[5],
    type: 'oral',
    color: '#ec4899',
    description: 'Présentation orale sur la citoyenneté numérique et les usages responsables du web.',
    status: 'scheduled',
    homeworkDue: [mockHomeworks[4]],
  },
  {
    id: 'evt-fri-3',
    subject: 'Physique-Chimie',
    subjectCode: 'PC',
    teacher: TEACHERS.PC.name,
    room: TEACHERS.PC.room,
    startTime: '13:30',
    endTime: '15:30',
    dayOfWeek: 5,
    date: weekDates[5],
    type: 'cours',
    color: '#059669',
    description: 'Manipulation et analyse de spectres, avec exploitation de la loi de Beer-Lambert.',
    status: 'scheduled',
    homeworkDue: [mockHomeworks[3]],
  }
];

// Notes & Résultats scolaires
export const mockSubjectReports: SubjectReport[] = [
  {
    subject: TEACHERS.NSI.subject,
    subjectCode: TEACHERS.NSI.subjectCode,
    color: '#6366f1',
    teacher: TEACHERS.NSI.name,
    coefficient: 16,
    studentAverage: 17.6,
    classAverage: 14.1,
    minAverage: 9.8,
    maxAverage: 19.4,
    teacherAppreciation: 'Excellent trimestre. Richard fait preuve d’une remarquable rigueur et d’une réelle curiosité scientifique.',
    grades: [
      {
        id: 'gr-1',
        subject: TEACHERS.NSI.subject,
        subjectCode: TEACHERS.NSI.subjectCode,
        value: 18.5,
        maxValue: 20,
        coefficient: 2,
        title: 'DS 1 : Démarche et modélisation scientifique',
        date: '2026-09-02',
        classAverage: 13.8,
        minGrade: 8,
        maxGrade: 19.5,
        teacherComment: 'Très bonne maîtrise de la démarche scientifique.',
        period: 'T1',
        type: 'DS'
      },
      {
        id: 'gr-2',
        subject: TEACHERS.NSI.subject,
        subjectCode: TEACHERS.NSI.subjectCode,
        value: 17.0,
        maxValue: 20,
        coefficient: 1,
        title: 'TP Noté : Mesures et analyse expérimentale',
        date: '2026-08-28',
        classAverage: 14.5,
        minGrade: 10,
        maxGrade: 18,
        teacherComment: 'Toutes les mesures sont rigoureuses.',
        period: 'T1',
        type: 'TP'
      },
      {
        id: 'gr-3',
        subject: TEACHERS.NSI.subject,
        subjectCode: TEACHERS.NSI.subjectCode,
        value: 16.5,
        maxValue: 20,
        coefficient: 1,
        title: 'Interro rapide : Notions scientifiques clés',
        date: '2026-08-22',
        classAverage: 13.2,
        minGrade: 7.5,
        maxGrade: 19,
        teacherComment: 'Notions fondamentales bien assimilées.',
        period: 'T1',
        type: 'Interro'
      }
    ]
  },
  {
    subject: 'Mathématiques',
    subjectCode: 'MATH',
    color: '#0284c7',
    teacher: TEACHERS.MATH.name,
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
    subject: 'Physique-Chimie',
    subjectCode: 'PC',
    color: '#059669',
    teacher: TEACHERS.PC.name,
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
    teacher: TEACHERS.PHILO.name,
    coefficient: 8,
    studentAverage: 14.8,
    classAverage: 11.7,
    minAverage: 6.0,
    maxAverage: 16.5,
    teacherAppreciation: 'Une réflexion pertinente et une pensée bien structurée. Continuez à enrichir vos références philosophiques.',
    grades: [
      {
        id: 'gr-8',
        subject: 'Kialuta',
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
        subject: 'Kialuta',
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
    teacher: TEACHERS.HIST_GEO.name,
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
    teacher: TEACHERS.ANG.name,
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
  }
];

// Conversations de messagerie (Centralisées avec les vrais profs et placeholders)
export const mockConversations: Conversation[] = [
  {
    id: 'conv-1',
    name: TEACHERS.MATH.name,
    role: TEACHERS.MATH.role,
    avatar: TEACHERS.MATH.avatar,
    category: 'teachers',
    lastMessage: 'message placeholder 412',
    lastMessageTime: '10:42',
    unreadCount: 1,
    online: true,
    subject: TEACHERS.MATH.subject
  },
  {
    id: 'conv-2',
    name: TEACHERS.NSI.name,
    role: TEACHERS.NSI.role,
    avatar: TEACHERS.NSI.avatar,
    category: 'teachers',
    lastMessage: 'message placeholder 873',
    lastMessageTime: 'Hier',
    unreadCount: 0,
    online: false,
    subject: TEACHERS.NSI.subject
  },
  {
    id: 'conv-3',
    name: 'Bot/ No reply — college jean arabe XXIII',
    role: 'Administration & Surveillance',
    avatar: 'https://images.unsplash.com/photo-1577495508048-b635879837f1?w=120&auto=format&fit=crop&q=80',
    category: 'admin',
    lastMessage: 'message placeholder 205',
    lastMessageTime: 'Lun.',
    unreadCount: 0,
    online: true,
  },
  {
    id: 'conv-4',
    name: 'Groupe Projet Science (Équipe Alpha)',
    role: 'Projet Science (4 élèves)',
    avatar: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=120&auto=format&fit=crop&q=80',
    category: 'groups',
    lastMessage: 'message placeholder 649',
    lastMessageTime: '11:15',
    unreadCount: 2,
    online: true,
  },
  {
    id: 'conv-5',
    name: TEACHERS.PHILO.name,
    role: TEACHERS.PHILO.role,
    avatar: TEACHERS.PHILO.avatar,
    category: 'teachers',
    lastMessage: 'message placeholder 318',
    lastMessageTime: '03 Sept.',
    unreadCount: 0,
    online: false,
    subject: TEACHERS.PHILO.subject
  },
  {
    id: 'conv-6',
    name: TEACHERS.PC.name,
    role: TEACHERS.PC.role,
    avatar: TEACHERS.PC.avatar,
    category: 'teachers',
    lastMessage: 'message placeholder 591',
    lastMessageTime: '01 Sept.',
    unreadCount: 0,
    online: true,
    subject: TEACHERS.PC.subject
  },
  {
    id: 'conv-7',
    name: TEACHERS.ANG.name,
    role: TEACHERS.ANG.role,
    avatar: TEACHERS.ANG.avatar,
    category: 'teachers',
    lastMessage: 'message placeholder 147',
    lastMessageTime: '28 Août',
    unreadCount: 0,
    online: false,
    subject: TEACHERS.ANG.subject
  },
  {
    id: 'conv-8',
    name: TEACHERS.HIST_GEO.name,
    role: TEACHERS.HIST_GEO.role,
    avatar: TEACHERS.HIST_GEO.avatar,
    category: 'teachers',
    lastMessage: 'message placeholder 733',
    lastMessageTime: '25 Août',
    unreadCount: 0,
    online: true,
    subject: TEACHERS.HIST_GEO.subject
  }
];

// Messages individuels : tous remplacés par "message placeholder XXX"
export const mockMessages: { [key: string]: Message[] } = {
  'conv-1': [
    {
      id: 'msg-101',
      conversationId: 'conv-1',
      senderId: TEACHERS.MATH.id,
      senderName: TEACHERS.MATH.name,
      senderRole: 'teacher',
      senderAvatar: TEACHERS.MATH.avatar,
      content: 'message placeholder 104',
      timestamp: '09:15',
      read: true,
      isSelf: false,
    },
    {
      id: 'msg-102',
      conversationId: 'conv-1',
      senderId: 'student-01',
      senderName: 'Richard Le_',
      senderRole: 'student',
      senderAvatar: mockStudent.avatar,
      content: 'message placeholder 382',
      timestamp: '09:40',
      read: true,
      isSelf: true,
    },
    {
      id: 'msg-103',
      conversationId: 'conv-1',
      senderId: TEACHERS.MATH.id,
      senderName: TEACHERS.MATH.name,
      senderRole: 'teacher',
      senderAvatar: TEACHERS.MATH.avatar,
      content: 'message placeholder 412',
      timestamp: '10:42',
      read: false,
      isSelf: false,
    }
  ],
  'conv-2': [
    {
      id: 'msg-201',
      conversationId: 'conv-2',
      senderId: TEACHERS.NSI.id,
      senderName: TEACHERS.NSI.name,
      senderRole: 'teacher',
      senderAvatar: TEACHERS.NSI.avatar,
      content: 'message placeholder 873',
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
      senderName: 'Bot/ No reply',
      senderRole: 'admin',
      senderAvatar: 'https://images.unsplash.com/photo-1577495508048-b635879837f1?w=120&auto=format&fit=crop&q=80',
      content: 'message placeholder 205',
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
      content: 'message placeholder 514',
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
      content: 'message placeholder 649',
      timestamp: '11:15',
      read: false,
      isSelf: false,
    }
  ],
  'conv-5': [
    {
      id: 'msg-501',
      conversationId: 'conv-5',
      senderId: TEACHERS.PHILO.id,
      senderName: TEACHERS.PHILO.name,
      senderRole: 'teacher',
      senderAvatar: TEACHERS.PHILO.avatar,
      content: 'message placeholder 318',
      timestamp: '03 Sept.',
      read: true,
      isSelf: false,
    }
  ],
  'conv-6': [
    {
      id: 'msg-601',
      conversationId: 'conv-6',
      senderId: TEACHERS.PC.id,
      senderName: TEACHERS.PC.name,
      senderRole: 'teacher',
      senderAvatar: TEACHERS.PC.avatar,
      content: 'message placeholder 591',
      timestamp: '01 Sept.',
      read: true,
      isSelf: false,
    }
  ],
  'conv-7': [
    {
      id: 'msg-701',
      conversationId: 'conv-7',
      senderId: TEACHERS.ANG.id,
      senderName: TEACHERS.ANG.name,
      senderRole: 'teacher',
      senderAvatar: TEACHERS.ANG.avatar,
      content: 'message placeholder 147',
      timestamp: '28 Août',
      read: true,
      isSelf: false,
    }
  ],
  'conv-8': [
    {
      id: 'msg-801',
      conversationId: 'conv-8',
      senderId: TEACHERS.HIST_GEO.id,
      senderName: TEACHERS.HIST_GEO.name,
      senderRole: 'teacher',
      senderAvatar: TEACHERS.HIST_GEO.avatar,
      content: 'message placeholder 733',
      timestamp: '25 Août',
      read: true,
      isSelf: false,
    }
  ]
};

// Matières et Espace de cours complets
export const mockCourses: SubjectCourse[] = [
  {
    id: 'course-sci',
    subject: TEACHERS.NSI.subject,
    subjectCode: TEACHERS.NSI.subjectCode,
    color: '#6366f1',
    teacher: TEACHERS.NSI.name,
    teacherEmail: TEACHERS.NSI.email,
    room: TEACHERS.NSI.room,
    hoursPerWeek: 6,
    progressPercent: 72,
    nextExam: 'DS n°2 — Science (18 Sept)',
    chapters: [
      {
        id: 'chap-sci-1',
        title: 'Chapitre 1 : Méthodes et Démarche Scientifique',
        description: 'Observation, protocoles de mesure et analyse expérimentale.',
        order: 1,
        status: 'completed',
        documents: [
          { id: 'doc-1', title: 'Cours_Demarche_Scientifique.pdf', type: 'pdf', size: '2.3 Mo', uploadDate: '28 Août 2026' },
          { id: 'doc-2', title: 'Fiche_Revision_Mesures.pdf', type: 'pdf', size: '890 Ko', uploadDate: '01 Sept 2026' },
        ]
      },
      {
        id: 'chap-sci-2',
        title: 'Chapitre 2 : Modélisation et Systèmes Expérimentaux',
        description: 'Systèmes de données, représentations graphiques et analyse critique.',
        order: 2,
        status: 'in_progress',
        documents: [
          { id: 'doc-4', title: 'Guide_Donnees_Graphiques.pdf', type: 'pdf', size: '1.5 Mo', uploadDate: '04 Sept 2026' },
        ]
      }
    ],
    assignments: [
      {
        id: 'asg-1',
        title: 'Mini-Projet : Synthèse d’investigation scientifique',
        subject: 'Science',
        dueDate: '2026-09-25',
        points: 20,
        status: 'pending',
      }
    ]
  },
  {
    id: 'course-maths',
    subject: 'Mathématiques Spécialité',
    subjectCode: 'MATH',
    color: '#0284c7',
    teacher: TEACHERS.MATH.name,
    teacherEmail: TEACHERS.MATH.email,
    room: TEACHERS.MATH.room,
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
    subject: 'Kialuta',
    subjectCode: 'PHILO',
    color: '#d97706',
    teacher: TEACHERS.PHILO.name,
    teacherEmail: TEACHERS.PHILO.email,
    room: TEACHERS.PHILO.room,
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
      }
    ],
    assignments: [
      {
        id: 'asg-p1',
        title: 'Plan détaillé : La technique nous libère-t-elle ?',
        subject: 'Kialuta',
        dueDate: '2026-09-11',
        points: 20,
        status: 'pending'
      }
    ]
  },
  {
    id: 'course-pc',
    subject: 'Physique-Chimie',
    subjectCode: 'PC',
    color: '#059669',
    teacher: TEACHERS.PC.name,
    teacherEmail: TEACHERS.PC.email,
    room: TEACHERS.PC.room,
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
        title: 'Jsp',
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
    title: 'Notification 1',
    description: 'description',
    time: 'Il y a 2h',
    read: false,
    type: 'grade' as const
  },
  {
    id: 'notif-2',
    title: 'Notification 2',
    description: 'description',
    time: 'Il y a 3h',
    read: false,
    type: 'message' as const
  },
  {
    id: 'notif-3',
    title: 'Notification 3 ',
    description: 'Description',
    time: 'Hier',
    read: true,
    type: 'info' as const
  }
];
