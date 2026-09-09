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

export type TabType = 'dashboard' | 'agenda' | 'messages' | 'results' | 'courses';

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
  overallStats: { current: number; classAvg: number; previousTerm: number };
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
}

const SchoolContext = createContext<SchoolContextType | undefined>(undefined);

export const SchoolProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [student, setStudent] = useState<Student | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [events, setEvents] = useState<CourseEvent[]>([]);
  const [todayEvents, setTodayEvents] = useState<CourseEvent[]>([]);
  const [selectedEventModal, setSelectedEventModal] = useState<CourseEvent | null>(null);
  const [isNewHomeworkModalOpen, setIsNewHomeworkModalOpen] = useState(false);

  const [homeworks, setHomeworks] = useState<Homework[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string>('conv-1');
  const [activeMessages, setActiveMessages] = useState<Message[]>([]);

  const [subjectReports, setSubjectReports] = useState<SubjectReport[]>([]);
  const [overallStats, setOverallStats] = useState({ current: 16.3, classAvg: 13.2, previousTerm: 15.4 });
  const [activePeriod, setActivePeriod] = useState<'T1' | 'T2' | 'T3'>('T1');

  const [courses, setCourses] = useState<SubjectCourse[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);

  const [globalSearch, setGlobalSearch] = useState('');

  const [notifications, setNotifications] = useState<AppNotification[]>(mockNotifications);

  // Initialisation des données
  useEffect(() => {
    const initData = async () => {
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

      if (convs.length > 0) {
        const msgs = await schoolService.getMessages(convs[0].id);
        setActiveMessages(msgs);
      }
    };

    initData();
  }, []);

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
      const autoReplyText = conv?.category === 'teachers'
        ? `Bien reçu Alexandre, nous en rediscuterons lors de la prochaine séance.`
        : `Parfait Alexandre ! Je note ça.`;

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
        startDirectMessageWithTeacher
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

