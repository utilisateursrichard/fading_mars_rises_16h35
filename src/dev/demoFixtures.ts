import type {
  Student,
  CourseEvent,
  Homework,
  SubjectReport,
  Conversation,
  Message,
  SubjectCourse,
  Teacher,
  SmartschoolMailCounters,
  SmartschoolContact,
  SmartschoolMessageSummary,
  SmartschoolMessageDetail,
  DayOfWeek,
} from '../types/school';

const pad = (n: number) => n.toString().padStart(2, '0');
const formatDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const addDays = (offset: number) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return formatDate(d);
};

const todayDate = addDays(0);
const jsDow = new Date().getDay();
const todayDow: DayOfWeek = (jsDow === 0 ? 7 : jsDow) as DayOfWeek;

export const demoStudent: Student = {
  id: 'demo-student-1',
  firstName: 'Camille',
  lastName: 'Laurent',
  email: 'camille.laurent@lycee-demo.be',
  avatar: '',
  studentClass: '5e Sci-Math A',
  schoolName: 'Athénée Royal Demo',
  academicYear: '2026-2027',
  ineNumber: 'DEMO-4907-102',
  unreadNotifications: 2,
};

export const demoEvents: CourseEvent[] = [
  {
    id: 'demo-evt-1',
    subject: 'Mathématiques avancées',
    subjectCode: 'MATH',
    teacher: 'M. Van Der Berg',
    room: 'B204',
    startTime: '08:25',
    endTime: '09:15',
    date: todayDate,
    dayOfWeek: todayDow,
    type: 'cours',
    color: 'sky',
    status: 'scheduled',
  },
  {
    id: 'demo-evt-2',
    subject: 'Physique-Chimie',
    subjectCode: 'PHYS',
    teacher: 'Mme De Smet',
    room: 'Labo 3',
    startTime: '09:30',
    endTime: '11:10',
    date: todayDate,
    dayOfWeek: todayDow,
    type: 'tp',
    color: 'emerald',
    status: 'scheduled',
  },
  {
    id: 'demo-evt-3',
    subject: 'Français & Littérature',
    subjectCode: 'FR',
    teacher: 'Mme Moreau',
    room: 'A108',
    startTime: '13:15',
    endTime: '14:05',
    date: todayDate,
    dayOfWeek: todayDow,
    type: 'cours',
    color: 'amber',
    status: 'scheduled',
  },
  {
    id: 'demo-evt-4',
    subject: 'Sciences informatiques',
    subjectCode: 'NSI',
    teacher: 'M. Peeters',
    room: 'Info 1',
    startTime: '14:20',
    endTime: '16:00',
    date: todayDate,
    dayOfWeek: todayDow,
    type: 'td',
    color: 'indigo',
    status: 'scheduled',
  },
  {
    id: 'demo-evt-5',
    subject: 'Anglais B2',
    subjectCode: 'ANG',
    teacher: 'Ms. Clarke',
    room: 'C302',
    startTime: '10:20',
    endTime: '11:10',
    date: addDays(1),
    dayOfWeek: ((todayDow % 5) + 1) as DayOfWeek,
    type: 'oral',
    color: 'rose',
    status: 'scheduled',
  },
];

export const demoTodayEvents: CourseEvent[] = demoEvents.filter(
  (e) => e.date === todayDate && e.dayOfWeek === todayDow
);

let mutableDemoHomeworks: Homework[] = [
  {
    id: 'demo-hw-1',
    subject: 'Mathématiques avancées',
    subjectCode: 'MATH',
    color: 'sky',
    title: 'Interrogation écrite : Dérivées et limites',
    description: 'Revoir les chapitres 3 et 4 + exercices 12 à 18 p. 94',
    dueDate: addDays(1),
    estimatedTimeMinutes: 60,
    isCompleted: false,
    priority: 'high',
    assignedDate: addDays(-2),
  },
  {
    id: 'demo-hw-2',
    subject: 'Physique-Chimie',
    subjectCode: 'PHYS',
    color: 'emerald',
    title: 'Compte-rendu TP Optique géométrique',
    description: 'Compléter les schémas de réfraction et calculer les incertitudes',
    dueDate: addDays(2),
    estimatedTimeMinutes: 45,
    isCompleted: false,
    priority: 'medium',
    assignedDate: addDays(-1),
  },
  {
    id: 'demo-hw-3',
    subject: 'Français & Littérature',
    subjectCode: 'FR',
    color: 'amber',
    title: 'Dissertation : Le théâtre classique',
    description: 'Plan détaillé et introduction rédigée (1 page)',
    dueDate: addDays(4),
    estimatedTimeMinutes: 50,
    isCompleted: false,
    priority: 'medium',
    assignedDate: addDays(-3),
  },
  {
    id: 'demo-hw-4',
    subject: 'Anglais B2',
    subjectCode: 'ANG',
    color: 'rose',
    title: 'Vocabulaire Unit 5 — Environnement',
    description: 'Fiches de révision terminées',
    dueDate: addDays(3),
    estimatedTimeMinutes: 20,
    isCompleted: true,
    priority: 'low',
    assignedDate: addDays(-4),
  },
];

export const getDemoHomeworks = (): Homework[] => [...mutableDemoHomeworks];

export const toggleDemoHomework = (id: string): Homework[] => {
  mutableDemoHomeworks = mutableDemoHomeworks.map((h) =>
    h.id === id ? { ...h, isCompleted: !h.isCompleted } : h
  );
  return [...mutableDemoHomeworks];
};

export const addDemoHomework = (hw: Omit<Homework, 'id'>): Homework => {
  const created: Homework = { ...hw, id: `demo-hw-${Date.now()}` };
  mutableDemoHomeworks = [created, ...mutableDemoHomeworks];
  return created;
};

export const demoSubjectReports: SubjectReport[] = [
  {
    subject: 'Mathématiques avancées',
    subjectCode: 'MATH',
    color: 'sky',
    teacher: 'M. Van Der Berg',
    coefficient: 6,
    studentAverage: 16.4,
    classAverage: 13.1,
    hoursPerWeek: 6,
    grades: [
      {
        id: 'dg-1',
        subject: 'Mathématiques avancées',
        subjectCode: 'MATH',
        value: 17,
        maxValue: 20,
        coefficient: 2,
        title: 'DS Fonctions & Limites',
        date: addDays(-8),
        period: 'T1',
        type: 'DS',
      },
      {
        id: 'dg-2',
        subject: 'Mathématiques avancées',
        subjectCode: 'MATH',
        value: 15.5,
        maxValue: 20,
        coefficient: 1,
        title: 'Interro Trigonométrie',
        date: addDays(-18),
        period: 'T1',
        type: 'Interro',
      },
    ],
  },
  {
    subject: 'Physique-Chimie',
    subjectCode: 'PHYS',
    color: 'emerald',
    teacher: 'Mme De Smet',
    coefficient: 4,
    studentAverage: 15.2,
    classAverage: 12.8,
    hoursPerWeek: 4,
    grades: [
      {
        id: 'dg-3',
        subject: 'Physique-Chimie',
        subjectCode: 'PHYS',
        value: 15.2,
        maxValue: 20,
        coefficient: 1,
        title: 'TP Spectrométrie',
        date: addDays(-5),
        period: 'T1',
        type: 'TP',
      },
    ],
  },
  {
    subject: 'Français & Littérature',
    subjectCode: 'FR',
    color: 'amber',
    teacher: 'Mme Moreau',
    coefficient: 4,
    studentAverage: 14.5,
    classAverage: 12.9,
    hoursPerWeek: 4,
    grades: [
      {
        id: 'dg-4',
        subject: 'Français & Littérature',
        subjectCode: 'FR',
        value: 14.5,
        maxValue: 20,
        coefficient: 2,
        title: 'Commentaire composé',
        date: addDays(-12),
        period: 'T1',
        type: 'DS',
      },
    ],
  },
];

export const demoOverallStats = {
  current: 15.5,
  classAvg: 12.9,
  previousTerm: 14.8,
  currentPct: 77.5,
  totalWeeklyHours: 28,
};

export const demoCourses: SubjectCourse[] = [
  {
    id: 'demo-crs-1',
    subject: 'Mathématiques avancées',
    subjectCode: 'MATH',
    color: 'sky',
    teacher: 'M. Van Der Berg',
    teacherEmail: 'vanderberg@lycee-demo.be',
    room: 'B204',
    hoursPerWeek: 6,
    progressPercent: 68,
    chapters: [],
    assignments: [],
  },
  {
    id: 'demo-crs-2',
    subject: 'Physique-Chimie',
    subjectCode: 'PHYS',
    color: 'emerald',
    teacher: 'Mme De Smet',
    teacherEmail: 'desmet@lycee-demo.be',
    room: 'Labo 3',
    hoursPerWeek: 4,
    progressPercent: 54,
    chapters: [],
    assignments: [],
  },
  {
    id: 'demo-crs-3',
    subject: 'Sciences informatiques',
    subjectCode: 'NSI',
    color: 'indigo',
    teacher: 'M. Peeters',
    teacherEmail: 'peeters@lycee-demo.be',
    room: 'Info 1',
    hoursPerWeek: 4,
    progressPercent: 72,
    chapters: [],
    assignments: [],
  },
];

export const demoTeachers: Teacher[] = [
  {
    id: 'demo-t-1',
    firstName: 'Luc',
    lastName: 'Van Der Berg',
    fullName: 'Luc Van Der Berg',
    trigram: 'VDB',
    subjects: ['Mathématiques avancées'],
    subjectCodes: ['MATH'],
    rooms: ['B204'],
    email: 'vanderberg@lycee-demo.be',
    isTitulaire: true,
  },
  {
    id: 'demo-t-2',
    firstName: 'Sophie',
    lastName: 'De Smet',
    fullName: 'Sophie De Smet',
    trigram: 'DSM',
    subjects: ['Physique-Chimie'],
    subjectCodes: ['PHYS'],
    rooms: ['Labo 3'],
    email: 'desmet@lycee-demo.be',
  },
  {
    id: 'demo-t-3',
    firstName: 'Claire',
    lastName: 'Moreau',
    fullName: 'Claire Moreau',
    trigram: 'MOR',
    subjects: ['Français & Littérature'],
    subjectCodes: ['FR'],
    rooms: ['A108'],
    email: 'moreau@lycee-demo.be',
  },
];

export const demoNotifications = [
  {
    id: 'dn-1',
    title: 'Nouvelle évaluation en Mathématiques',
    description: '17/20 au DS Fonctions & Limites (coef. 2)',
    time: 'Il y a 2h',
    read: false,
    type: 'grade' as const,
  },
  {
    id: 'dn-2',
    title: 'Message de Mme De Smet',
    description: 'Rappel pour le compte-rendu de TP Optique.',
    time: 'Hier',
    read: false,
    type: 'message' as const,
  },
];

export const demoMailCounters: SmartschoolMailCounters = {
  inbox: 1,
  outbox: 1,
  trash: 0,
  draft: 0,
  scheduled: 0,
};

export const demoContacts: SmartschoolContact[] = [
  { userID: 101, name: 'M. Van Der Berg', className: 'Mathématiques', avatar: '' },
  { userID: 102, name: 'Mme De Smet', className: 'Physique-Chimie', avatar: '' },
  { userID: 103, name: 'Mme Moreau', className: 'Français', avatar: '' },
];

export const demoInboxSummaries: SmartschoolMessageSummary[] = [
  {
    id: 'demo-mail-1',
    from: 'Mme De Smet',
    fromImage: '',
    subject: 'Consignes TP Optique géométrique',
    date: "Aujourd'hui, 09:12",
    status: 'unread',
    hasAttachment: false,
    attachmentCount: 0,
    unread: true,
    label: 'blue',
    deleted: false,
    allowReply: true,
    allowReplyEnabled: true,
    hasReply: false,
    hasForward: true,
    realBox: 'inbox',
    snippet: 'Pensez à apporter votre calculatrice graphique pour la séance de laboratoire.',
  },
];

export const demoOutboxSummaries: SmartschoolMessageSummary[] = [
  {
    id: 'demo-mail-2',
    from: 'Camille Laurent',
    fromImage: '',
    subject: 'Question exercice 14 p. 94',
    date: 'Hier, 17:40',
    status: 'read',
    hasAttachment: false,
    attachmentCount: 0,
    unread: false,
    label: 'none',
    deleted: false,
    allowReply: true,
    allowReplyEnabled: true,
    hasReply: false,
    hasForward: false,
    realBox: 'outbox',
    snippet: 'Bonjour Monsieur, faut-il justifier la dérivabilité sur tout l’intervalle ?',
  },
];

export const demoDraftSummaries: SmartschoolMessageSummary[] = [];
export const demoTrashSummaries: SmartschoolMessageSummary[] = [];

export const demoMessageDetails: Record<string, SmartschoolMessageDetail> = {
  'demo-mail-1': {
    id: 'demo-mail-1',
    from: 'Mme De Smet',
    to: 'Camille Laurent',
    subject: 'Consignes TP Optique géométrique',
    date: "Aujourd'hui, 09:12",
    bodyHtml:
      '<p>Bonjour,</p><p>Pensez à apporter votre calculatrice graphique ainsi que le fascicule d’optique pour la séance de demain en Labo 3.</p><p>Bien à vous,<br/>Mme De Smet</p>',
    status: 'unread',
    hasAttachment: false,
    label: 'blue',
    receivers: [{ name: 'Camille Laurent', unread: true }],
    ccReceivers: [],
    bccReceivers: [],
    userPictureHash: '',
    fromOauth: false,
    allowReply: true,
    hasReply: false,
    hasForward: true,
    attachments: [],
  },
  'demo-mail-2': {
    id: 'demo-mail-2',
    from: 'Camille Laurent',
    to: 'M. Van Der Berg',
    subject: 'Question exercice 14 p. 94',
    date: 'Hier, 17:40',
    bodyHtml: '<p>Bonjour Monsieur, faut-il justifier la dérivabilité sur tout l’intervalle ?</p>',
    status: 'read',
    hasAttachment: false,
    label: 'none',
    receivers: [{ name: 'M. Van Der Berg' }],
    ccReceivers: [],
    bccReceivers: [],
    userPictureHash: '',
    fromOauth: false,
    allowReply: true,
    hasReply: false,
    hasForward: false,
    attachments: [],
  },
};

export const demoConversations: Conversation[] = [
  {
    id: 'conv-1',
    name: 'M. Van Der Berg',
    role: 'Professeur de Mathématiques',
    avatar: '',
    category: 'teachers',
    lastMessage: 'N’hésitez pas si vous avez une question sur le chapitre 4.',
    lastMessageTime: '10:15',
    unreadCount: 0,
    online: true,
    subject: 'Mathématiques',
  },
];

const demoMessagesByConv: Record<string, Message[]> = {
  'conv-1': [
    {
      id: 'dmsg-1',
      conversationId: 'conv-1',
      senderId: 'teacher-1',
      senderName: 'M. Van Der Berg',
      senderRole: 'teacher',
      senderAvatar: '',
      content: 'N’hésitez pas si vous avez une question sur le chapitre 4.',
      timestamp: '10:15',
      read: true,
      isSelf: false,
    },
  ],
};

export const getDemoMessages = (conversationId: string): Message[] => [
  ...(demoMessagesByConv[conversationId] || []),
];

export const sendDemoMessage = (conversationId: string, content: string): Message => {
  const userMsg: Message = {
    id: `dmsg-${Date.now()}`,
    conversationId,
    senderId: 'self',
    senderName: 'Camille Laurent',
    senderRole: 'student',
    senderAvatar: '',
    content,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    read: true,
    isSelf: true,
  };
  demoMessagesByConv[conversationId] = [...(demoMessagesByConv[conversationId] || []), userMsg];
  return userMsg;
};
