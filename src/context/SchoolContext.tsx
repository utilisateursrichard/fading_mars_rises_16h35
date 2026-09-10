import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  Student,
  CourseEvent,
  Homework,
  SubjectReport,
  Conversation,
  Message,
  SubjectCourse
} from '../types/school';
import { schoolService } from '../services/api';
import { mockNotifications } from '../data/mockData';
import { isInsideSmartschool } from '../utils/platform';
import { 
  getCachedRealEvents, 
  getCachedRealHomeworks, 
  getCachedRealStudent, 
  syncAllSmartschoolData 
} from '../services/smartschoolApi';

export type TabType = 'dashboard' | 'agenda' | 'messages' | 'results' | 'courses' | 'tutor' | 'book';

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
  // Messagerie
  conversations: Conversation[];
  activeConversationId: string;
  setActiveConversationId: (id: string) => void;
  activeMessages: Message[];
  sendMessage: (content: string) => Promise<void>;
  // Résultats
  subjectReports: SubjectReport[];
  overallStats: { current: number; classAvg: number; previousTerm: number } | null;
  activePeriod: 'T1' | 'T2' | 'T3';
  setActivePeriod: (p: 'T1' | 'T2' | 'T3') => void;
  // Cours
  courses: SubjectCourse[];
  selectedCourseId: string | null;
  setSelectedCourseId: (id: string | null) => void;
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
  const [overallStats, setOverallStats] = useState<{ current: number; classAvg: number; previousTerm: number } | null>(null);
  const [activePeriod, setActivePeriod] = useState<'T1' | 'T2' | 'T3'>('T1');

  const [courses, setCourses] = useState<SubjectCourse[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);

  const [globalSearch, setGlobalSearch] = useState('');

  const [notifications, setNotifications] = useState<AppNotification[]>(mockNotifications);

  // État du mode démo : Mode Réel par défaut (isDemoMode = false)
  const [isDemoMode, setIsDemoMode] = useState<boolean>(() => {
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
    setIsDemoMode(enabled);
    try {
      localStorage.setItem('betterschool_demo_mode_v2', String(enabled));
      localStorage.setItem('betterschool_demo_mode', String(enabled));
    } catch {}
  };

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
        const day = (curDay >= 1 && curDay <= 5) ? curDay : 1;
        setTodayEvents(res.events.filter(e => e.dayOfWeek === day));
        if (res.student) {
          setStudent(prev => ({
            id: res.student?.id || prev?.id || 'real_student',
            firstName: res.student?.firstName || prev?.firstName || '',
            lastName: res.student?.lastName || prev?.lastName || '',
            email: res.student?.email || prev?.email || '',
            avatar: res.student?.avatar || prev?.avatar || '',
            studentClass: res.student?.studentClass || prev?.studentClass || '',
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
      if (!isDemoMode) {
        // En mode Réel : chargement des données réelles Smartschool
        // En mode Réel : chargement du cache réel
        const realEvents = getCachedRealEvents();
        const realHomeworks = getCachedRealHomeworks();
        const realStudentData = getCachedRealStudent();

        if (realStudentData) {
          setStudent({
            id: realStudentData.id || 'real_student',
            firstName: realStudentData.firstName || '',
            lastName: realStudentData.lastName || '',
            email: realStudentData.email || '',
            avatar: realStudentData.avatar || '',
            studentClass: realStudentData.studentClass || '',
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
        const targetDay = (todayNum >= 1 && todayNum <= 5) ? todayNum : 1;
        setTodayEvents(realEvents.filter(e => e.dayOfWeek === targetDay));

        setHomeworks(realHomeworks);

        // Modules non encore branchés restent vierges en mode réel
        setConversations([]);
        setActiveMessages([]);
        setSubjectReports([]);
        setCourses([]);
        setNotifications([]);
        setOverallStats(null); // Mode Réel : aucune note fictive

        // Si BetterSchool tourne au sein de Smartschool, synchroniser en direct
        if (isInsideSmartschoolPlatform) {
          syncAllSmartschoolData().then(res => {
            if (res.success) {
              setEvents(res.events);
              setHomeworks(res.homeworks);
              const curDay = new Date().getDay();
              const day = (curDay >= 1 && curDay <= 5) ? curDay : 1;
              setTodayEvents(res.events.filter(e => e.dayOfWeek === day));
              if (res.student) {
                setStudent(prev => ({
                  id: res.student?.id || prev?.id || 'real_student',
                  firstName: res.student?.firstName || prev?.firstName || '',
                  lastName: res.student?.lastName || prev?.lastName || '',
                  email: res.student?.email || prev?.email || '',
                  avatar: res.student?.avatar || prev?.avatar || '',
                  studentClass: res.student?.studentClass || prev?.studentClass || '',
                  schoolName: res.student?.schoolName || prev?.schoolName || '',
                  academicYear: res.student?.academicYear || prev?.academicYear || '',
                  ineNumber: res.student?.ineNumber || prev?.ineNumber || '',
                  unreadNotifications: 0
                }));
              }
            }
          });
        }
        return;
      }

      // En mode Démo : chargement de la maquette avec fausses données
      const [stu, evts, tEvents, hws, convs, reports, stats, crss] = await Promise.all([
        schoolService.getStudent(),
        schoolService.getAgendaEvents(),
        schoolService.getTodayEvents(),
        schoolService.getHomeworks(),
        schoolService.getConversations(),
        schoolService.getSubjectReports(),
        schoolService.getOverallAverage(),
        schoolService.getCourses()
      ]);

      setStudent(stu);
      setEvents(evts);
      setTodayEvents(tEvents);
      setHomeworks(hws);
      setConversations(convs);
      setSubjectReports(reports);
      setOverallStats(stats);
      setCourses(crss);
      setNotifications(mockNotifications);

      if (convs.length > 0) {
        const msgs = await schoolService.getMessages(convs[0].id);
        setActiveMessages(msgs);
      }
    };

    initData();
  }, [isDemoMode]);

  // Chargement des messages quand la conversation active change
  useEffect(() => {
    if (activeConversationId) {
      schoolService.getMessages(activeConversationId).then(msgs => {
        setActiveMessages(msgs);
      });
    }
  }, [activeConversationId]);

  // Actions
  const toggleHomework = async (id: string) => {
    const updated = await schoolService.toggleHomework(id);
    setHomeworks(updated);
  };

  const addHomework = async (hw: Omit<Homework, 'id'>) => {
    const created = await schoolService.addHomework(hw);
    setHomeworks(prev => [created, ...prev]);
  };

  const sendMessage = async (content: string) => {
    if (!content.trim() || !activeConversationId) return;

    const { userMsg } = await schoolService.sendMessage(activeConversationId, content);
    setActiveMessages(prev => [...prev, userMsg]);

    // Mettre à jour la conversation dans la liste
    setConversations(prev => 
      prev.map(c => c.id === activeConversationId ? { ...c, lastMessage: content, lastMessageTime: 'À l’instant' } : c)
    );

    // Simulation d'une réponse de professeur ou camarade après 1.5 seconde
    setTimeout(() => {
      const conv = conversations.find(c => c.id === activeConversationId);
      const autoReplyText = `message placeholder ${Math.floor(Math.random() * 900 + 100)}`;

      const replyMsg: Message = {
        id: `reply-${Date.now()}`,
        conversationId: activeConversationId,
        senderId: conv?.id || 'other',
        senderName: conv?.name || 'Interlocuteur',
        senderRole: conv?.category === 'teachers' ? 'teacher' : 'student',
        senderAvatar: conv?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
        content: autoReplyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        read: true,
        isSelf: false
      };

      setActiveMessages(prev => [...prev, replyMsg]);
      setConversations(prev => 
        prev.map(c => c.id === activeConversationId ? { ...c, lastMessage: autoReplyText, lastMessageTime: 'À l’instant' } : c)
      );
    }, 1500);
  };

  const markNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const startDirectMessageWithTeacher = (teacherName: string) => {
    const conv = conversations.find(c => c.name.toLowerCase().includes(teacherName.toLowerCase()) || teacherName.toLowerCase().includes(c.name.toLowerCase()));
    if (conv) {
      setActiveConversationId(conv.id);
    }
    setActiveTab('messages');
  };

  const unreadNotificationsCount = useMemo(() => {
    return notifications.filter(n => !n.read).length;
  }, [notifications]);

  const unreadMessagesTotal = useMemo(() => {
    return conversations.reduce((acc, c) => acc + c.unreadCount, 0);
  }, [conversations]);

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
        conversations,
        activeConversationId,
        setActiveConversationId,
        activeMessages,
        sendMessage,
        subjectReports,
        overallStats,
        activePeriod,
        setActivePeriod,
        courses,
        selectedCourseId,
        setSelectedCourseId,
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
        isDemoMode,
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

