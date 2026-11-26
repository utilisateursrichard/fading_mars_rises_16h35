import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  Student,
  CourseEvent,
  Homework,
  SubjectReport,
  Conversation,
  Message,
  SubjectCourse,
  SkoreEvaluation,
  SmartschoolBoxType,
  SmartschoolFlagColor,
  SmartschoolMessageSummary,
  SmartschoolMessageDetail,
  SmartschoolAttachment,
  SmartschoolContact,
  SmartschoolMailCounters,
  Teacher
} from '../types/school';
import { isInsideSmartschool } from '../utils/platform';
import { 
  getActiveUserId,
  getCachedRealEvents, 
  getCachedRealHomeworks, 
  getCachedRealStudent, 
  getCachedRealEvaluations,
  getCachedRealTeachers,
  getCachedRealCourses,
  fetchRealTeachers,
  fetchRealCourses,
  syncAllSmartschoolData,
  toggleCachedRealHomework,
  resolveSmartschoolHomework,
  unresolveSmartschoolHomework
} from '../services/smartschoolApi';
import {
  fetchSmartschoolMessagesList,
  fetchSmartschoolMessageDetail,
  fetchLiveSmartschoolUnreadCount,
  sendSmartschoolMessage,
  sendSmartschoolQuickReply,
  markSmartschoolMessageRead,
  markSmartschoolMessageUnread,
  saveSmartschoolMessageLabel,
  deleteSmartschoolMessage,
  archiveSmartschoolMessages,
  searchSmartschoolRecipients,
  getCachedMailMessages,
  setCachedMailMessages,
  getCachedMailCounters,
  setCachedMailCounters
} from '../services/smartschoolMessages';
import { buildSubjectReportsFromEvaluations } from '../services/smartschoolParsers';
import { cleanStudentClass } from '../utils/student';

const IS_DEV_RUNTIME = import.meta.env.DEV;
let demoFixturesPromise: Promise<typeof import('../dev/demoFixtures')> | null = null;
const loadDemoFixtures = () => {
  if (!import.meta.env.DEV) return Promise.resolve(null);
  if (!demoFixturesPromise) {
    demoFixturesPromise = import('../dev/demoFixtures');
  }
  return demoFixturesPromise;
};

export type TabType = 'dashboard' | 'agenda' | 'messages' | 'results' | 'courses' | 'teachers' | 'tutor' | 'book';

export interface AppNotification {
  id: string;
  title: string;
  description: string;
  time: string;
  read: boolean;
  type: 'grade' | 'message' | 'homework' | 'info';
}

interface SchoolContextType {
  student: Student | null;
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  // Agenda
  events: CourseEvent[];
  todayEvents: CourseEvent[];
  selectedEventModal: CourseEvent | null;
  setSelectedEventModal: (event: CourseEvent | null) => void;
  // Devoirs
  homeworks: Homework[];
  toggleHomework: (id: string) => Promise<void>;
  addHomework: (hw: Omit<Homework, 'id'>) => Promise<void>;
  isNewHomeworkModalOpen: boolean;
  setIsNewHomeworkModalOpen: (open: boolean) => void;
  // Messagerie Smartschool M3E Pro
  activeMailbox: SmartschoolBoxType;
  setActiveMailbox: (box: SmartschoolBoxType) => void;
  mailMessages: SmartschoolMessageSummary[];
  selectedMailId: string | null;
  setSelectedMailId: (id: string | null) => void;
  selectedMailDetail: SmartschoolMessageDetail | null;
  isMailLoading: boolean;
  isMailDetailLoading: boolean;
  mailCounters: SmartschoolMailCounters;
  mailSearchQuery: string;
  setMailSearchQuery: (query: string) => void;
  selectedFlagFilter: SmartschoolFlagColor | 'all';
  setSelectedFlagFilter: (flag: SmartschoolFlagColor | 'all') => void;
  isComposeModalOpen: boolean;
  setIsComposeModalOpen: (open: boolean) => void;
  composeInitialRecipient: SmartschoolContact | null;
  composeInitialSubject: string;
  composeOrigMsgId: string | number | null;
  openComposeModal: (recipient?: SmartschoolContact | null, initialSubject?: string, origMsgId?: string | number | null) => void;
  closeComposeModal: () => void;
  refreshMailList: () => Promise<void>;
  syncLiveUnreadMessages: () => Promise<void>;
  loadMailDetail: (id: string) => Promise<SmartschoolMessageDetail | null>;
  sendSmartschoolMail: (payload: { recipientUserIds: (string | number)[]; subject: string; bodyHtml: string; origMsgId?: string | number }) => Promise<{ success: boolean; error?: string }>;
  replyToMail: (bodyHtml: string) => Promise<{ success: boolean; error?: string }>;
  toggleMailFlag: (id: string, color: SmartschoolFlagColor) => Promise<boolean>;
  setMailRead: (id: string) => Promise<boolean>;
  setMailUnread: (id: string) => Promise<boolean>;
  deleteMail: (id: string) => Promise<boolean>;
  archiveMail: (id: string) => Promise<boolean>;
  // Messagerie Legacy (compatibilité)
  conversations: Conversation[];
  activeConversationId: string;
  setActiveConversationId: (id: string) => void;
  activeMessages: Message[];
  sendMessage: (content: string) => Promise<void>;
  // Résultats & Skore
  subjectReports: SubjectReport[];
  overallStats: { current: number; classAvg: number; previousTerm: number; currentPct?: number; totalWeeklyHours?: number } | null;
  activePeriod: 'T1' | 'T2' | 'T3';
  setActivePeriod: (p: 'T1' | 'T2' | 'T3') => void;
  skoreEvaluations: SkoreEvaluation[];
  availablePeriods: string[];
  activePeriodName: string;
  setActivePeriodName: (p: string) => void;
  excludedGradeIds: Set<string>;
  toggleGradeExclusion: (gradeId: string) => void;
  // Cours
  courses: SubjectCourse[];
  coursesLoading: boolean;
  refreshCourses: () => Promise<void>;
  selectedCourseId: string | null;
  setSelectedCourseId: (id: string | null) => void;
  // Professeurs
  teachers: Teacher[];
  teachersLoading: boolean;
  refreshTeachers: () => Promise<void>;
  // Notifications & UI
  notifications: AppNotification[];
  markNotificationsAsRead: () => void;
  unreadNotificationsCount: number;
  unreadMessagesTotal: number;
  pendingHomeworksTotal: number;
  // Recherche globale
  globalSearch: string;
  setGlobalSearch: (s: string) => void;
  // Action de raccourci pour contacter un prof
  startDirectMessageWithTeacher: (teacherName: string) => void;
  // Synchronisation dynamique
  syncWeek: (date: Date) => Promise<void>;
  // Sidebar rétractable
  isSidebarCollapsed: boolean;
  toggleSidebar: () => void;
  isInsideSmartschoolPlatform: boolean;
  isDemoAvailable: boolean;
  isDemoMode: boolean;
  toggleDemoMode: () => void;
  setDemoMode: (enabled: boolean) => void;
}

const SchoolContext = createContext<SchoolContextType | undefined>(undefined);

export const SchoolProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [student, setStudent] = useState<Student | null>(null);
  const isInsideSmartschoolPlatform = useMemo(() => isInsideSmartschool(), []);

  const isBookPath = (path: string) => {
    if (isInsideSmartschoolPlatform) return false;
    const clean = path.replace(/\/+/g, '/');
    return clean === '/book' || clean.startsWith('/book/') || clean.startsWith('/book');
  };

  const getInitialTab = (): TabType => {
    if (typeof window !== 'undefined' && isBookPath(window.location.pathname)) {
      return 'book';
    }
    return 'dashboard';
  };
  const [activeTab, setActiveTabState] = useState<TabType>(getInitialTab);

  const setActiveTab = (tab: TabType) => {
    setActiveTabState(tab);
    if (typeof window !== 'undefined') {
      const targetPath = tab === 'book' ? '/book' : '/';
      if (window.location.pathname !== targetPath) {
        window.history.pushState(null, '', targetPath);
      }
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      if (typeof window !== 'undefined') {
        if (isBookPath(window.location.pathname)) {
          setActiveTabState('book');
        } else {
          setActiveTabState('dashboard');
        }
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);
  const [events, setEvents] = useState<CourseEvent[]>([]);
  const [todayEvents, setTodayEvents] = useState<CourseEvent[]>([]);
  const [selectedEventModal, setSelectedEventModal] = useState<CourseEvent | null>(null);
  const [isNewHomeworkModalOpen, setIsNewHomeworkModalOpen] = useState(false);

  const [homeworks, setHomeworks] = useState<Homework[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string>('conv-1');
  const [activeMessages, setActiveMessages] = useState<Message[]>([]);

  const [subjectReports, setSubjectReports] = useState<SubjectReport[]>([]);
  const [overallStats, setOverallStats] = useState<{ current: number; classAvg: number; previousTerm: number; currentPct?: number; totalWeeklyHours?: number } | null>(null);
  const [activePeriod, setActivePeriod] = useState<'T1' | 'T2' | 'T3'>('T1');

  // État du mode démo : disponible uniquement en développement (npm run dev)
  const [isDemoMode, setIsDemoMode] = useState<boolean>(() => {
    if (!import.meta.env.DEV) return false;
    try {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        if (params.get('demo') === 'true' || params.get('demo') === '1') return true;
        if (params.get('demo') === 'false' || params.get('demo') === '0') return false;
      }
      const stored = localStorage.getItem('betterschool_demo_mode_v2');
      if (stored !== null) return stored === 'true';
      return false; // Mode Réel par défaut
    } catch {
      return false;
    }
  });

  const toggleDemoMode = () => {
    if (!import.meta.env.DEV) return;
    setIsDemoMode(prev => {
      const next = !prev;
      try {
        localStorage.setItem('betterschool_demo_mode_v2', String(next));
        localStorage.setItem('betterschool_demo_mode', String(next));
      } catch {}
      return next;
    });
  };

  const setDemoMode = (enabled: boolean) => {
    if (!import.meta.env.DEV) return;
    setIsDemoMode(enabled);
    try {
      localStorage.setItem('betterschool_demo_mode_v2', String(enabled));
      localStorage.setItem('betterschool_demo_mode', String(enabled));
    } catch {}
  };

  // Messagerie Smartschool M3E Pro
  const [activeMailbox, setActiveMailboxState] = useState<SmartschoolBoxType>('inbox');
  const [mailMessages, setMailMessages] = useState<SmartschoolMessageSummary[]>([]);
  const [selectedMailId, setSelectedMailId] = useState<string | null>(null);
  const [selectedMailDetail, setSelectedMailDetail] = useState<SmartschoolMessageDetail | null>(null);
  const [isMailLoading, setIsMailLoading] = useState<boolean>(false);
  const [isMailDetailLoading, setIsMailDetailLoading] = useState<boolean>(false);
  const [mailCounters, setMailCounters] = useState<SmartschoolMailCounters>(() => ({ inbox: 0, outbox: 0, trash: 0, draft: 0, scheduled: 0 }));
  const [liveUnreadCount, setLiveUnreadCount] = useState<number | null>(null);
  const [mailSearchQuery, setMailSearchQuery] = useState<string>('');
  const [selectedFlagFilter, setSelectedFlagFilter] = useState<SmartschoolFlagColor | 'all'>('all');
  const [isComposeModalOpen, setIsComposeModalOpen] = useState<boolean>(false);
  const [composeInitialRecipient, setComposeInitialRecipient] = useState<SmartschoolContact | null>(null);
  const [composeInitialSubject, setComposeInitialSubject] = useState<string>('');
  const [composeOrigMsgId, setComposeOrigMsgId] = useState<string | number | null>(null);

  // Skore Réel
  const [skoreEvaluations, setSkoreEvaluations] = useState<SkoreEvaluation[]>(() => {
    return getCachedRealEvaluations();
  });
  const [availablePeriods, setAvailablePeriods] = useState<string[]>([]);
  const [activePeriodName, setActivePeriodName] = useState<string>('');
  const [excludedGradeIds, setExcludedGradeIds] = useState<Set<string>>(() => {
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('betterschool_v3_excluded_grades');
        if (stored) return new Set(JSON.parse(stored));
      }
    } catch {}
    return new Set();
  });

  const toggleGradeExclusion = (gradeId: string) => {
    setExcludedGradeIds(prev => {
      const next = new Set(prev);
      if (next.has(gradeId)) {
        next.delete(gradeId);
      } else {
        next.add(gradeId);
      }
      try {
        localStorage.setItem('betterschool_v3_excluded_grades', JSON.stringify(Array.from(next)));
      } catch {}
      return next;
    });
  };

  // Recalcul des rapports réels Skore lors des changements d'évaluations ou d'exclusions
  useEffect(() => {
    if (isDemoMode) return;

    if (skoreEvaluations && skoreEvaluations.length > 0) {
      const computed = buildSubjectReportsFromEvaluations(
        skoreEvaluations,
        excludedGradeIds,
        activePeriodName || undefined
      );

      setSubjectReports(computed.reports);
      setOverallStats({
        current: computed.overallAveragePct,
        currentPct: computed.overallAveragePct,
        classAvg: 0,
        previousTerm: 0,
        totalWeeklyHours: computed.totalWeeklyHours
      });

      if (computed.periods.length > 0) {
        setAvailablePeriods(computed.periods);
        if (!activePeriodName && computed.periods[0]) {
          setActivePeriodName(computed.periods[0]);
        }
      }

      // Synchronisation automatique de la moyenne générale vers la base SQLite du serveur BetterSchool
      const activeUserId = getActiveUserId() || student?.ineNumber || '';
      if (activeUserId && computed.overallAveragePct > 0) {
        const avgPayload = {
          userId: activeUserId,
          platformId: activeUserId.split('_')[0] || '4907',
          studentName: student ? `${student.firstName} ${student.lastName}`.trim() : '',
          studentClass: student?.studentClass || '',
          schoolName: student?.schoolName || '',
          activePeriod: activePeriodName || computed.periods[0] || '',
          overallAveragePct: computed.overallAveragePct,
          overallAverage20: computed.overallAverage20,
          totalWeeklyHours: computed.totalWeeklyHours
        };

        ['/api/user-average', 'https://betterschool.dino.icu/api/user-average'].forEach((endpoint) => {
          fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(avgPayload)
          }).catch(() => {});
        });
      }
    } else {
      setSubjectReports([]);
      setOverallStats(null);
    }
  }, [isDemoMode, skoreEvaluations, excludedGradeIds, activePeriodName]);

  const [courses, setCourses] = useState<SubjectCourse[]>([]);
  const [coursesLoading, setCoursesLoading] = useState<boolean>(false);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);

  const refreshCourses = async () => {
    setCoursesLoading(true);
    try {
      if (import.meta.env.DEV && isDemoMode) {
        const fixtures = await loadDemoFixtures();
        setCourses(fixtures ? fixtures.demoCourses : []);
      } else {
        const crss = await fetchRealCourses();
        setCourses(crss);
      }
    } catch (err) {
      console.warn('Erreur lors du rafraîchissement des cours:', err);
    } finally {
      setCoursesLoading(false);
    }
  };

  // Professeurs
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [teachersLoading, setTeachersLoading] = useState<boolean>(false);

  const refreshTeachers = async () => {
    setTeachersLoading(true);
    try {
      if (import.meta.env.DEV && isDemoMode) {
        const fixtures = await loadDemoFixtures();
        setTeachers(fixtures ? fixtures.demoTeachers : []);
      } else {
        const t = await fetchRealTeachers();
        setTeachers(t);
      }
    } catch (err) {
      console.warn('Erreur lors du rafraîchissement des professeurs:', err);
    } finally {
      setTeachersLoading(false);
    }
  };

  const [globalSearch, setGlobalSearch] = useState('');

  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const toggleSidebar = () => setIsSidebarCollapsed(prev => !prev);

  // Synchronisation dynamique d'une semaine spécifique via la passerelle
  const syncWeek = async (date: Date) => {
    if (isInsideSmartschoolPlatform) {
      const res = await syncAllSmartschoolData(date);
      if (res.success) {
        setEvents(res.events);
        setHomeworks(res.homeworks);
        const curDay = new Date().getDay();
        const day = (curDay === 0 ? 7 : curDay);
        const pad = (n: number) => n.toString().padStart(2, '0');
        const now = new Date();
        const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
        setTodayEvents(
          res.events
            .filter(e => e.date ? e.date === todayStr : e.dayOfWeek === day)
            .sort((a, b) => a.startTime.localeCompare(b.startTime))
        );
        if (res.student) {
          setStudent(prev => ({
            id: res.student?.id || prev?.id || 'real_student',
            firstName: res.student?.firstName || prev?.firstName || '',
            lastName: res.student?.lastName || prev?.lastName || '',
            email: res.student?.email || prev?.email || '',
            avatar: res.student?.avatar || prev?.avatar || '',
            studentClass: cleanStudentClass(res.student?.studentClass) || cleanStudentClass(prev?.studentClass) || '',
            schoolName: res.student?.schoolName || prev?.schoolName || '',
            academicYear: res.student?.academicYear || prev?.academicYear || '',
            ineNumber: res.student?.ineNumber || prev?.ineNumber || '',
            unreadNotifications: 0
          }));
        }
      }
    }
  };

  // Raccourci clavier Ctrl+B pour rétracter/déplier la barre latérale
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setIsSidebarCollapsed(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Initialisation des données en fonction du mode démo
  useEffect(() => {
    const initData = async () => {
      setSelectedCourseId(null);
      if (!isDemoMode) {
        // En mode Réel : chargement des données réelles Smartschool
        // En mode Réel : chargement du cache réel
        const realEvents = getCachedRealEvents();
        const realHomeworks = getCachedRealHomeworks();
        const realStudentData = getCachedRealStudent();
        const realEvals = getCachedRealEvaluations();
        const realTeachers = getCachedRealTeachers();
        const realCourses = getCachedRealCourses();
        setSkoreEvaluations(realEvals);
        setTeachers(realTeachers);
        setCourses(realCourses);

        if (realStudentData) {
          setStudent({
            id: realStudentData.id || 'real_student',
            firstName: realStudentData.firstName || '',
            lastName: realStudentData.lastName || '',
            email: realStudentData.email || '',
            avatar: realStudentData.avatar || '',
            studentClass: cleanStudentClass(realStudentData.studentClass) || '',
            schoolName: realStudentData.schoolName || '',
            academicYear: realStudentData.academicYear || '',
            ineNumber: realStudentData.ineNumber || '',
            unreadNotifications: 0
          });
        } else {
          setStudent(null);
        }

        setEvents(realEvents);
        
        // Cours du jour actif
        const todayNum = new Date().getDay();
        const targetDay = (todayNum === 0 ? 7 : todayNum);
        const pad = (n: number) => n.toString().padStart(2, '0');
        const now = new Date();
        const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
        setTodayEvents(
          realEvents
            .filter(e => e.date ? e.date === todayStr : e.dayOfWeek === targetDay)
            .sort((a, b) => a.startTime.localeCompare(b.startTime))
        );

        setHomeworks(realHomeworks);

        // Modules non encore branchés restent vierges en mode réel
        setConversations([]);
        setActiveMessages([]);
        setNotifications([]);

        // Si BetterSchool tourne au sein de Smartschool, synchroniser en direct
        if (isInsideSmartschoolPlatform) {
          syncAllSmartschoolData().then(res => {
            if (res.courses && res.courses.length > 0) {
              setCourses(res.courses);
            } else {
              const cachedCrs = getCachedRealCourses();
              if (cachedCrs.length > 0) setCourses(cachedCrs);
            }
            if (res.success) {
              setEvents(res.events);
              setHomeworks(res.homeworks);
              if (res.evaluations) {
                setSkoreEvaluations(res.evaluations);
              }
              if (res.teachers && res.teachers.length > 0) {
                setTeachers(res.teachers);
              } else {
                setTeachers(getCachedRealTeachers());
              }
              const curDay = new Date().getDay();
              const day = (curDay === 0 ? 7 : curDay);
              setTodayEvents(
                res.events
                  .filter(e => e.date ? e.date === todayStr : e.dayOfWeek === day)
                  .sort((a, b) => a.startTime.localeCompare(b.startTime))
              );
              if (res.student) {
                setStudent(prev => ({
                  id: res.student?.id || prev?.id || 'real_student',
                  firstName: res.student?.firstName || prev?.firstName || '',
                  lastName: res.student?.lastName || prev?.lastName || '',
                  email: res.student?.email || prev?.email || '',
                  avatar: res.student?.avatar || prev?.avatar || '',
                  studentClass: cleanStudentClass(res.student?.studentClass) || cleanStudentClass(prev?.studentClass) || '',
                  schoolName: res.student?.schoolName || prev?.schoolName || '',
                  academicYear: res.student?.academicYear || prev?.academicYear || '',
                  ineNumber: res.student?.ineNumber || prev?.ineNumber || '',
                  unreadNotifications: 0
                }));
              }
            }
          });
        } else if (realTeachers.length === 0) {
          fetchRealTeachers().then(t => {
            if (t && t.length > 0) setTeachers(t);
          });
        }
        return;
      }

      if (import.meta.env.DEV && isDemoMode) {
        const fixtures = await loadDemoFixtures();
        if (!fixtures) return;

        setStudent(fixtures.demoStudent);
        setEvents(fixtures.demoEvents);
        setTodayEvents(fixtures.demoTodayEvents);
        setHomeworks(fixtures.getDemoHomeworks());
        setConversations(fixtures.demoConversations);
        setSubjectReports(fixtures.demoSubjectReports);
        setOverallStats(fixtures.demoOverallStats);
        setCourses(fixtures.demoCourses);
        setTeachers(fixtures.demoTeachers);
        setNotifications(fixtures.demoNotifications);

        if (fixtures.demoConversations.length > 0) {
          setActiveMessages(fixtures.getDemoMessages(fixtures.demoConversations[0].id));
        }
      }
    };

    initData();
  }, [isDemoMode]);

  // Chargement des messages quand la conversation active change
  useEffect(() => {
    if (import.meta.env.DEV && isDemoMode && activeConversationId) {
      loadDemoFixtures().then(fixtures => {
        if (fixtures) {
          setActiveMessages(fixtures.getDemoMessages(activeConversationId));
        }
      });
    }
  }, [activeConversationId, isDemoMode]);

  // Actions
  const toggleHomework = async (id: string) => {
    // Retrouver le devoir dans l'état (ou dans les devoirs liés aux cours)
    let targetHw = homeworks.find(h => h.id === id);
    if (!targetHw) {
      for (const evt of events) {
        const found = evt.homeworkDue?.find(h => h.id === id);
        if (found) {
          targetHw = found;
          break;
        }
      }
    }

    const willBeCompleted = targetHw ? !targetHw.isCompleted : true;

    // Si le devoir est coché, envoyer la requête POST à Smartschool pour le marquer résolu
    if (willBeCompleted) {
      resolveSmartschoolHomework(targetHw || id).catch(err => {
        console.warn('Erreur lors de la résolution Smartschool:', err);
      });
    } else {
      unresolveSmartschoolHomework(targetHw || id).catch(() => {});
    }

    // Mettre à jour l'état local des devoirs
    setHomeworks(prev => prev.map(homework =>
      homework.id === id ? { ...homework, isCompleted: willBeCompleted } : homework
    ));

    // Mettre également à jour les devoirs attachés aux événements (modal cours / agenda)
    setEvents(prev => prev.map(evt => {
      if (!evt.homeworkDue || evt.homeworkDue.length === 0) return evt;
      const hasMatch = evt.homeworkDue.some(h => h.id === id);
      if (!hasMatch) return evt;
      return {
        ...evt,
        homeworkDue: evt.homeworkDue.map(h => h.id === id ? { ...h, isCompleted: willBeCompleted } : h)
      };
    }));

    if (!import.meta.env.DEV || !isDemoMode) {
      // En mode réel, ne jamais appeler les données de démo
      toggleCachedRealHomework(id);
      return;
    }

    const fixtures = await loadDemoFixtures();
    if (fixtures) {
      setHomeworks(fixtures.toggleDemoHomework(id));
    }
  };

  const addHomework = async (hw: Omit<Homework, 'id'>) => {
    if (import.meta.env.DEV && isDemoMode) {
      const fixtures = await loadDemoFixtures();
      if (fixtures) {
        const created = fixtures.addDemoHomework(hw);
        setHomeworks(prev => [created, ...prev]);
      }
      return;
    }
    const created: Homework = { ...hw, id: `local-hw-${Date.now()}` };
    setHomeworks(prev => [created, ...prev]);
  };

  const sendMessage = async (content: string) => {
    if (!content.trim() || !activeConversationId) return;
    if (!import.meta.env.DEV || !isDemoMode) return;

    const fixtures = await loadDemoFixtures();
    if (!fixtures) return;
    const userMsg = fixtures.sendDemoMessage(activeConversationId, content);
    setActiveMessages(prev => [...prev, userMsg]);

    // Mettre à jour la conversation dans la liste
    setConversations(prev => 
      prev.map(c => c.id === activeConversationId ? { ...c, lastMessage: content, lastMessageTime: 'À l’instant' } : c)
    );
  };

  // --- Gestion de la Messagerie Smartschool M3E Pro ---

  const syncLiveUnreadMessages = async () => {
    if (!isDemoMode) {
      try {
        const count = await fetchLiveSmartschoolUnreadCount();
        setLiveUnreadCount(count);
        setMailCounters(prev => ({ ...prev, inbox: count }));

        // Rapprochement avec le compte réel officiel de Smartschool :
        // Si Smartschool indique formellement 0 message non lu, aucun message de la boîte de réception
        // ne doit arborer de pastille / statut non lu.
        if (count === 0) {
          setMailMessages(prev => {
            const hasUnread = prev.some(m => m.unread || m.status === 'unread');
            if (!hasUnread) return prev;
            const updated = prev.map(m => ({ ...m, unread: false, status: 'read' as const }));
            setCachedMailMessages('inbox', updated);
            return updated;
          });
        }
      } catch (err) {
        console.warn('Erreur synchro non lus en direct:', err);
      }
    }
  };

  const loadMailbox = async (box: SmartschoolBoxType) => {
    setIsMailLoading(true);
    if (import.meta.env.DEV && isDemoMode) {
      const fixtures = await loadDemoFixtures();
      let demoList: SmartschoolMessageSummary[] = [];
      if (fixtures) {
        switch (box) {
          case 'inbox': demoList = fixtures.demoInboxSummaries; break;
          case 'outbox': demoList = fixtures.demoOutboxSummaries; break;
          case 'draft': demoList = fixtures.demoDraftSummaries; break;
          case 'trash': demoList = fixtures.demoTrashSummaries; break;
          default: demoList = []; break;
        }
        setMailCounters(fixtures.demoMailCounters);
      }
      setMailMessages(demoList);
      setIsMailLoading(false);
    } else {
      const cached = getCachedMailMessages(box);
      if (cached && cached.length > 0) {
        setMailMessages(cached);
      }
      try {
        const msgs = await fetchSmartschoolMessagesList(box);
        if (msgs) {
          setMailMessages(msgs);
          setCachedMailMessages(box, msgs);
        }
        // Interrogation directe des non-lus depuis Smartschool (sans passer par le cache)
        await syncLiveUnreadMessages();
      } catch (e) {
        console.warn('Erreur chargement messages Smartschool:', e);
      } finally {
        setIsMailLoading(false);
      }
    }
  };

  const setActiveMailbox = (box: SmartschoolBoxType) => {
    setActiveMailboxState(box);
    setSelectedMailId(null);
    setSelectedMailDetail(null);
  };

  useEffect(() => {
    loadMailbox(activeMailbox);
  }, [isDemoMode, activeMailbox]);

  const loadMailDetail = async (id: string): Promise<SmartschoolMessageDetail | null> => {
    setIsMailDetailLoading(true);
    try {
      if (import.meta.env.DEV && isDemoMode) {
        const fixtures = await loadDemoFixtures();
        const detail = fixtures?.demoMessageDetails[id] || null;
        if (detail) {
          setSelectedMailDetail(detail);
          setMailMessages(prev => prev.map(m => m.id === id ? { ...m, status: 'read', unread: false } : m));
          setMailCounters(prev => ({
            ...prev,
            inbox: Math.max(0, prev.inbox - 1)
          }));
          return detail;
        }
        return null;
      } else {
        const targetMsg = mailMessages.find(m => m.id === id);
        const wasUnread = targetMsg ? Boolean(targetMsg.unread || targetMsg.status === 'unread') : true;

        const detail = await fetchSmartschoolMessageDetail(id, activeMailbox, wasUnread);
        if (detail) {
          setSelectedMailDetail(detail);
          setMailMessages(prev => prev.map(m => m.id === id ? { ...m, status: 'read', unread: false } : m));
          
          if (wasUnread) {
            // Synchronisation immédiate avec le compte officiel non-lu de Smartschool
            await syncLiveUnreadMessages();
          }
          return detail;
        }
        return null;
      }
    } finally {
      setIsMailDetailLoading(false);
    }
  };

  useEffect(() => {
    if (selectedMailId) {
      loadMailDetail(selectedMailId);
    } else {
      setSelectedMailDetail(null);
    }
  }, [selectedMailId]);

  const openComposeModal = (
    recipient?: SmartschoolContact | null, 
    initialSubject?: string, 
    origMsgId?: string | number | null
  ) => {
    setComposeInitialRecipient(recipient || null);
    setComposeInitialSubject(initialSubject || '');
    setComposeOrigMsgId(origMsgId || null);
    setIsComposeModalOpen(true);
  };

  const closeComposeModal = () => {
    setIsComposeModalOpen(false);
    setComposeInitialRecipient(null);
    setComposeInitialSubject('');
    setComposeOrigMsgId(null);
  };

  const refreshMailList = async () => {
    await Promise.all([
      loadMailbox(activeMailbox),
      syncLiveUnreadMessages()
    ]);
  };

  useEffect(() => {
    if (activeTab === 'messages' && !isDemoMode) {
      syncLiveUnreadMessages();
    }
  }, [activeTab, isDemoMode]);

  const sendSmartschoolMail = async (payload: { 
    recipientUserIds: (string | number)[]; 
    subject: string; 
    bodyHtml: string; 
    origMsgId?: string | number 
  }): Promise<{ success: boolean; error?: string }> => {
    if (!isDemoMode) {
      const res = await sendSmartschoolMessage({
        userIDs: payload.recipientUserIds,
        subject: payload.subject,
        bodyHtml: payload.bodyHtml,
        origMsgId: payload.origMsgId ? Number(payload.origMsgId) : undefined
      });
      if (res.success) {
        // Rediriger vers la boîte des messages envoyés pour confirmer visuellement l'expédition
        setActiveMailbox('outbox');
        await Promise.all([
          loadMailbox('outbox'),
          syncLiveUnreadMessages()
        ]);
      }
      return res;
    } else {
      const newOutboxMsg: SmartschoolMessageSummary = {
        id: `msg-out-${Date.now()}`,
        from: 'Moi (Richard De Gandt)',
        fromImage: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
        subject: payload.subject,
        date: 'À l\'instant',
        status: 'read',
        unread: false,
        hasAttachment: false,
        attachmentCount: 0,
        label: 'none',
        deleted: false,
        allowReply: true,
        allowReplyEnabled: true,
        hasReply: false,
        hasForward: false,
        realBox: 'outbox',
        snippet: payload.bodyHtml.replace(/<[^>]*>/g, '').slice(0, 100)
      };
      setMailCounters(prev => ({ ...prev, outbox: prev.outbox + 1 }));
      setActiveMailbox('outbox');
      setMailMessages(prev => [newOutboxMsg, ...prev]);
      return { success: true };
    }
  };

  const replyToMail = async (bodyHtml: string): Promise<{ success: boolean; error?: string }> => {
    if (!selectedMailDetail) return { success: false, error: 'Aucun message sélectionné' };
    const replySubject = selectedMailDetail.subject.startsWith('Re:') 
      ? selectedMailDetail.subject 
      : `Re: ${selectedMailDetail.subject}`;

    if (!isDemoMode) {
      const res = await sendSmartschoolQuickReply({ msgId: selectedMailDetail.id, bodyHtml });
      if (res.success) {
        await Promise.all([loadMailbox(activeMailbox), syncLiveUnreadMessages()]);
      }
      return res;
    }

    // Tenter de retrouver le vrai userID du destinataire (sans valeur arbitraire hardcodée)
    let recipientUserIds: (string | number)[] = [];
    try {
      const cleanName = selectedMailDetail.from.split(' - ')[0].trim();
      const found = await searchSmartschoolRecipients(cleanName);
      if (found.length > 0 && found[0].userID) {
        recipientUserIds = [found[0].userID];
      }
    } catch {}

    return await sendSmartschoolMail({
      recipientUserIds,
      subject: replySubject,
      bodyHtml,
      origMsgId: selectedMailDetail.id
    });
  };

  const toggleMailFlag = async (id: string, color: SmartschoolFlagColor): Promise<boolean> => {
    setMailMessages(prev => prev.map(m => m.id === id ? { ...m, label: color } : m));
    if (selectedMailDetail && selectedMailDetail.id === id) {
      setSelectedMailDetail(prev => prev ? { ...prev, label: color } : null);
    }
    if (!isDemoMode) {
      return await saveSmartschoolMessageLabel(id, activeMailbox, color);
    }
    return true;
  };

  const setMailRead = async (id: string): Promise<boolean> => {
    setMailMessages(prev => {
      const updated = prev.map(m => m.id === id ? { ...m, status: 'read' as const, unread: false } : m);
      setCachedMailMessages(activeMailbox, updated);
      return updated;
    });
    setSelectedMailDetail(prev => prev && prev.id === id ? { ...prev, status: 'read' as const } : prev);

    if (!isDemoMode) {
      const ok = await markSmartschoolMessageRead(id, activeMailbox);
      await syncLiveUnreadMessages();
      return ok;
    }
    setMailCounters(prev => ({ ...prev, inbox: Math.max(0, prev.inbox - 1) }));
    return true;
  };

  const setMailUnread = async (id: string): Promise<boolean> => {
    setMailMessages(prev => {
      const updated = prev.map(m => m.id === id ? { ...m, status: 'unread' as const, unread: true } : m);
      setCachedMailMessages(activeMailbox, updated);
      return updated;
    });
    setSelectedMailDetail(prev => prev && prev.id === id ? { ...prev, status: 'unread' as const } : prev);

    if (!isDemoMode) {
      const ok = await markSmartschoolMessageUnread(id, activeMailbox);
      await syncLiveUnreadMessages();
      return ok;
    }
    setMailCounters(prev => ({ ...prev, inbox: prev.inbox + 1 }));
    return true;
  };

  const deleteMail = async (id: string): Promise<boolean> => {
    setMailMessages(prev => prev.filter(m => m.id !== id));
    if (selectedMailId === id) {
      setSelectedMailId(null);
      setSelectedMailDetail(null);
    }
    setMailCounters(prev => ({
      ...prev,
      [activeMailbox]: Math.max(0, (prev[activeMailbox] || 1) - 1),
      trash: prev.trash + 1
    }));
    if (!isDemoMode) {
      return await deleteSmartschoolMessage(id, activeMailbox);
    }
    return true;
  };

  const archiveMail = async (id: string): Promise<boolean> => {
    setMailMessages(prev => prev.filter(m => m.id !== id));
    if (selectedMailId === id) {
      setSelectedMailId(null);
      setSelectedMailDetail(null);
    }
    if (!isDemoMode) {
      return await archiveSmartschoolMessages([id]);
    }
    return true;
  };

  const markNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const startDirectMessageWithTeacher = async (teacherName: string) => {
    let contact: SmartschoolContact | undefined;
    if (import.meta.env.DEV && isDemoMode) {
      const fixtures = await loadDemoFixtures();
      contact = fixtures?.demoContacts.find(c =>
        c.name.toLowerCase().includes(teacherName.toLowerCase()) ||
        teacherName.toLowerCase().includes(c.name.toLowerCase())
      );
    }

    const resolvedContact: SmartschoolContact = contact || {
      userID: 0,
      name: teacherName,
      className: 'Professeur',
      avatar: ''
    };
    
    openComposeModal(resolvedContact, `Question concernant le cours`);
    setActiveTab('messages');
  };

  const unreadNotificationsCount = useMemo(() => {
    return notifications.filter(n => !n.read).length;
  }, [notifications]);

  const unreadMessagesTotal = useMemo(() => {
    if (!isDemoMode) {
      if (liveUnreadCount !== null) return liveUnreadCount;
      const liveInboxUnread = mailMessages.filter(m => m.realBox === 'inbox' && m.unread).length;
      return liveInboxUnread;
    }
    const inboxUnread = mailMessages.filter(m => m.realBox === 'inbox' && m.unread).length;
    return inboxUnread > 0 ? inboxUnread : (mailCounters.inbox || 0);
  }, [isDemoMode, liveUnreadCount, mailMessages, mailCounters.inbox]);

  const pendingHomeworksTotal = useMemo(() => {
    return homeworks.filter(h => !h.isCompleted).length;
  }, [homeworks]);

  return (
    <SchoolContext.Provider
      value={{
        student,
        activeTab,
        setActiveTab,
        events,
        todayEvents,
        selectedEventModal,
        setSelectedEventModal,
        homeworks,
        toggleHomework,
        addHomework,
        isNewHomeworkModalOpen,
        setIsNewHomeworkModalOpen,
        // Messagerie Smartschool M3E Pro
        activeMailbox,
        setActiveMailbox,
        mailMessages,
        selectedMailId,
        setSelectedMailId,
        selectedMailDetail,
        isMailLoading,
        isMailDetailLoading,
        mailCounters,
        mailSearchQuery,
        setMailSearchQuery,
        selectedFlagFilter,
        setSelectedFlagFilter,
        isComposeModalOpen,
        setIsComposeModalOpen,
        composeInitialRecipient,
        composeInitialSubject,
        composeOrigMsgId,
        openComposeModal,
        closeComposeModal,
        refreshMailList,
        syncLiveUnreadMessages,
        loadMailDetail,
        sendSmartschoolMail,
        replyToMail,
        toggleMailFlag,
        setMailRead,
        setMailUnread,
        deleteMail,
        archiveMail,
        // Messagerie Legacy (compatibilité)
        conversations,
        activeConversationId,
        setActiveConversationId,
        activeMessages,
        sendMessage,
        subjectReports,
        overallStats,
        activePeriod,
        setActivePeriod,
        skoreEvaluations,
        availablePeriods,
        activePeriodName,
        setActivePeriodName,
        excludedGradeIds,
        toggleGradeExclusion,
        courses,
        coursesLoading,
        refreshCourses,
        selectedCourseId,
        setSelectedCourseId,
        teachers,
        teachersLoading,
        refreshTeachers,
        notifications,
        markNotificationsAsRead,
        unreadNotificationsCount,
        unreadMessagesTotal,
        pendingHomeworksTotal,
        globalSearch,
        setGlobalSearch,
        startDirectMessageWithTeacher,
        syncWeek,
        isSidebarCollapsed,
        toggleSidebar,
        isInsideSmartschoolPlatform,
        isDemoAvailable: IS_DEV_RUNTIME,
        isDemoMode: IS_DEV_RUNTIME ? isDemoMode : false,
        toggleDemoMode,
        setDemoMode
      }}
    >
      {children}
    </SchoolContext.Provider>
  );
};

export const useSchool = () => {
  const context = useContext(SchoolContext);
  if (!context) {
    throw new Error('useSchool doit être utilisé à l’intérieur d’un SchoolProvider');
  }
  return context;
};
