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
  Grade
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

// Clés de persistance locale
const STORAGE_KEYS = {
  HOMEWORKS: 'betterschool_homeworks',
  MESSAGES: 'betterschool_messages',
  CONVERSATIONS: 'betterschool_conversations',
  ASSIGNMENTS: 'betterschool_assignments',
  SIMULATED_GRADES: 'betterschool_simulated_grades'
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

class SchoolService {
  // Réinitialisation des caches factices vers les données mockData de référence
  resetMockData(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.HOMEWORKS);
      localStorage.removeItem(STORAGE_KEYS.MESSAGES);
      localStorage.removeItem(STORAGE_KEYS.CONVERSATIONS);
    } catch (e) {
      console.warn('localStorage non accessible', e);
    }
  }

  // 1. Informations de l'élève
  async getStudent(): Promise<Student> {
    // Simulation réseau (latence imperceptible pour un ressenti fluide)
    return Promise.resolve({ ...mockStudent });
  }

  // 2. Agenda & Emploi du temps
  async getAgendaEvents(): Promise<CourseEvent[]> {
    return Promise.resolve([...mockCourseEvents]);
  }

  async getTodayEvents(): Promise<CourseEvent[]> {
    const todayNum = new Date().getDay(); // 0 is Sunday, 1 is Monday...
    // Si dimanche ou samedi hors cours, on simule la journée de mardi ou jeudi pour avoir une vue démonstrative
    const targetDay = (todayNum >= 1 && todayNum <= 5) ? todayNum : 2;
    const events = mockCourseEvents.filter(evt => evt.dayOfWeek === targetDay);
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

  async getOverallAverage(): Promise<{ current: number; classAvg: number; previousTerm: number }> {
    const reports = await this.getSubjectReports();
    let totalWeighted = 0;
    let totalCoeffs = 0;
    let classWeighted = 0;

    reports.forEach(rep => {
      totalWeighted += rep.studentAverage * rep.coefficient;
      classWeighted += rep.classAverage * rep.coefficient;
      totalCoeffs += rep.coefficient;
    });

    const current = totalCoeffs > 0 ? Number((totalWeighted / totalCoeffs).toFixed(2)) : 0;
    const classAvg = totalCoeffs > 0 ? Number((classWeighted / totalCoeffs).toFixed(2)) : 0;

    return Promise.resolve({
      current,
      classAvg,
      previousTerm: 15.4 // Trimestre précédent pour calcul d'évolution
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
