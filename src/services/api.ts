/**
 * BETTERSCHOOL — COUCHE D'ABSTRACTION DE SERVICES API
 * 
 * Ce module découple complètement l'interface utilisateur (UI) de la source de données.
 * Actuellement, il utilise les données factices (mockData) avec persistance dans localStorage.
 * 
 * 💡 POUR BASCULER VERS UNE VRAIE API (REST / GraphQL / Supabase / Django / FastAPI) :
 * 1. Modifiez les fonctions ci-dessous pour appeler `await fetch('/api/v1/...')`
 *    ou utilisez Axios.
 * 2. Les composants graphiques n'auront AUCUNE modification à subir car ils dépendent
 *    uniquement des types TypeScript et des signatures de méthodes ci-dessous.
 */

import {
  Student,
  CourseEvent,
  Homework,
  SubjectReport,
  Conversation,
  Message,
  SubjectCourse,
  Grade,
  EventStatus
} from '../types/school';

import {
  mockStudent,
  mockCourseEvents,
  mockHomeworks,
  mockSubjectReports,
  mockConversations,
  mockMessages,
  mockCourses
} from '../data/mockData';
import { calculateOverallAverage } from '../utils/grades';

// Clés de persistance locale (versionnées pour forcer les nouvelles données centralisées)
const STORAGE_KEYS = {
  HOMEWORKS: 'betterschool_v3_homeworks',
  MESSAGES: 'betterschool_v3_messages',
  CONVERSATIONS: 'betterschool_v3_conversations',
  ASSIGNMENTS: 'betterschool_v3_assignments',
  SIMULATED_GRADES: 'betterschool_v3_simulated_grades'
};

// Helpers de persistance sécurisée
const getStoredData = <T>(key: string, fallback: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
};

const setStoredData = <T>(key: string, data: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error(`Erreur de sauvegarde localStorage pour ${key}:`, err);
  }
};

// Synchronisation dynamique du statut des cours selon la date et l'heure actuelle
export const syncEventStatuses = (evts: CourseEvent[]): CourseEvent[] => {
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const nowMin = now.getHours() * 60 + now.getMinutes();

  return evts.map(evt => {
    let status: EventStatus = evt.status;
    if (evt.date < todayStr) {
      status = 'completed';
    } else if (evt.date > todayStr) {
      status = 'scheduled';
    } else {
      const parseMin = (str: string) => {
        const parts = str.split(':').map(p => parseInt(p, 10));
        return (parts[0] || 0) * 60 + (parts[1] || 0);
      };
      const s = parseMin(evt.startTime);
      const e = parseMin(evt.endTime);
      if (nowMin >= s && nowMin <= e) {
        status = 'in_progress';
      } else if (nowMin > e) {
        status = 'completed';
      } else {
        status = 'scheduled';
      }
    }
    return { ...evt, status };
  });
};

class SchoolService {
  // 1. Informations de l'élève
  async getStudent(): Promise<Student> {
    // Simulation réseau (latence imperceptible pour un ressenti fluide)
    return Promise.resolve({ ...mockStudent });
  }

  // 2. Agenda & Emploi du temps (à jour avec statuts dynamiques et Samedi inclus)
  async getAgendaEvents(): Promise<CourseEvent[]> {
    return Promise.resolve(syncEventStatuses(mockCourseEvents));
  }

  async getTodayEvents(): Promise<CourseEvent[]> {
    const todayNum = new Date().getDay(); // 0 is Sunday, 1 is Monday... 6 is Saturday
    // 1=Lundi ... 6=Samedi, 7=Dimanche
    const targetDay = todayNum === 0 ? 7 : todayNum;
    const events = syncEventStatuses(mockCourseEvents).filter(evt => evt.dayOfWeek === targetDay);
    return Promise.resolve(events);
  }

  // 3. Devoirs & Travail à faire
  async getHomeworks(): Promise<Homework[]> {
    const stored = getStoredData<Homework[]>(STORAGE_KEYS.HOMEWORKS, mockHomeworks);
    return Promise.resolve(stored);
  }

  async toggleHomework(homeworkId: string): Promise<Homework[]> {
    const current = await this.getHomeworks();
    const updated = current.map(hw => 
      hw.id === homeworkId ? { ...hw, isCompleted: !hw.isCompleted } : hw
    );
    setStoredData(STORAGE_KEYS.HOMEWORKS, updated);
    return Promise.resolve(updated);
  }

  async addHomework(newHomework: Omit<Homework, 'id'>): Promise<Homework> {
    const current = await this.getHomeworks();
    const created: Homework = {
      ...newHomework,
      id: `hw-${Date.now()}`
    };
    const updated = [created, ...current];
    setStoredData(STORAGE_KEYS.HOMEWORKS, updated);
    return Promise.resolve(created);
  }

  // 4. Résultats & Évaluations
  async getSubjectReports(): Promise<SubjectReport[]> {
    return Promise.resolve([...mockSubjectReports]);
  }

  async getOverallAverage(): Promise<{ current: number; classAvg: number; previousTerm: number; currentPct?: number }> {
    const reports = await this.getSubjectReports();
    const stats = calculateOverallAverage(reports);
    const currentPct = Number(((stats.current / 20) * 100).toFixed(1));
    const classAvgPct = Number(((stats.classAvg / 20) * 100).toFixed(1));

    return Promise.resolve({
      current: currentPct,
      classAvg: classAvgPct,
      previousTerm: 77.0,
      currentPct
    });
  }

  // 5. Messagerie instantanée
  async getConversations(): Promise<Conversation[]> {
    const stored = getStoredData<Conversation[]>(STORAGE_KEYS.CONVERSATIONS, mockConversations);
    return Promise.resolve(stored);
  }

  async getMessages(conversationId: string): Promise<Message[]> {
    const allMessages = getStoredData<{ [key: string]: Message[] }>(STORAGE_KEYS.MESSAGES, mockMessages);
    return Promise.resolve(allMessages[conversationId] || []);
  }

  async sendMessage(conversationId: string, content: string): Promise<{ userMsg: Message; replyMsg?: Message }> {
    const allMessages = getStoredData<{ [key: string]: Message[] }>(STORAGE_KEYS.MESSAGES, mockMessages);
    const conversations = await this.getConversations();

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      conversationId,
      senderId: mockStudent.id,
      senderName: `${mockStudent.firstName} ${mockStudent.lastName}`,
      senderRole: 'student',
      senderAvatar: mockStudent.avatar,
      content,
      timestamp: timeStr,
      read: true,
      isSelf: true
    };

    const convMessages = allMessages[conversationId] ? [...allMessages[conversationId], userMessage] : [userMessage];
    allMessages[conversationId] = convMessages;

    // Mise à jour de la liste des conversations (dernier message)
    const updatedConvs = conversations.map(c => 
      c.id === conversationId ? { ...c, lastMessage: content, lastMessageTime: timeStr } : c
    );

    setStoredData(STORAGE_KEYS.MESSAGES, allMessages);
    setStoredData(STORAGE_KEYS.CONVERSATIONS, updatedConvs);

    return { userMsg: userMessage };
  }

  // 6. Espace Cours & Ressources
  async getCourses(): Promise<SubjectCourse[]> {
    return Promise.resolve([...mockCourses]);
  }

  async submitAssignment(courseId: string, assignmentId: string, fileName: string): Promise<boolean> {
    console.log(`[API Mock] Dépôt pour ${courseId}/${assignmentId} : ${fileName}`);
    return Promise.resolve(true);
  }
}

export const schoolService = new SchoolService();
