/**
 * Service d'intégration Smartschool (Client-side)
 * 
 * Communique avec les endpoints réels découverts (/planner/api/v1/...) via le pont postMessage
 * et stocke les données réelles de l'élève en cache local.
 */

import { CourseEvent, Homework, Student } from '../types/school';
import { fetchSmartschool } from './smartschoolBridge';
import { 
  parseSmartschoolCourse, 
  parseSmartschoolHomework, 
  extractMetadataFromPlanner 
} from './smartschoolParsers';

const REAL_STORAGE_KEYS = {
  USER_ID: 'betterschool_real_user_id',
  EVENTS: 'betterschool_real_events',
  HOMEWORKS: 'betterschool_real_homeworks',
  STUDENT: 'betterschool_real_student',
  LAST_SYNC: 'betterschool_real_last_sync'
};

// ID par défaut extrait de la session de test (utilisé si aucun ID n'est détecté)
const FALLBACK_USER_ID = '4907_5748_0';

/**
 * Récupère l'identifiant de l'élève actif
 */
export const getActiveUserId = (): string => {
  if (typeof window === 'undefined') return FALLBACK_USER_ID;
  return localStorage.getItem(REAL_STORAGE_KEYS.USER_ID) || FALLBACK_USER_ID;
};

/**
 * Enregistre l'identifiant de l'élève actif
 */
export const setActiveUserId = (userId: string): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(REAL_STORAGE_KEYS.USER_ID, userId);
  }
};

/**
 * Formate une date en chaîne ISO avec timezone (+02:00 / +01:00)
 */
const formatISODateTime = (d: Date): string => {
  const pad = (n: number) => n.toString().padStart(2, '0');
  const YYYY = d.getFullYear();
  const MM = pad(d.getMonth() + 1);
  const DD = pad(d.getDate());
  const HH = pad(d.getHours());
  const mm = pad(d.getMinutes());
  const ss = pad(d.getSeconds());
  
  // Timezone offset
  const offset = -d.getTimezoneOffset();
  const sign = offset >= 0 ? '+' : '-';
  const offsetHours = pad(Math.floor(Math.abs(offset) / 60));
  const offsetMinutes = pad(Math.abs(offset) % 60);

  return `${YYYY}-${MM}-${DD}T${HH}:${mm}:${ss}${sign}${offsetHours}:${offsetMinutes}`;
};

/**
 * Calcule la plage de dates d'une semaine (Lundi 00:00 -> Dimanche 23:59)
 */
export const getWeekRange = (baseDate: Date = new Date()) => {
  const d = new Date(baseDate);
  const day = d.getDay();
  // Lundi = 1, Dimanche = 0 -> diff pour aller à lundi
  const diffToMonday = day === 0 ? -6 : 1 - day;
  
  const monday = new Date(d);
  monday.setDate(d.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  return {
    fromISO: formatISODateTime(monday),
    toISO: formatISODateTime(sunday)
  };
};

/**
 * Calcule la plage de dates d'un mois (pour les devoirs)
 */
export const getMonthRange = (baseDate: Date = new Date()) => {
  const start = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1, 0, 0, 0);
  const end = new Date(baseDate.getFullYear(), baseDate.getMonth() + 2, 0, 23, 59, 59);

  return {
    fromISO: formatISODateTime(start),
    toISO: formatISODateTime(end)
  };
};

export interface SyncResult {
  success: boolean;
  events: CourseEvent[];
  homeworks: Homework[];
  student: Partial<Student> | null;
  error?: string;
}

/**
 * Récupère les données d'agenda réelles depuis Smartschool via le bridge
 */
export const fetchRealAgenda = async (userId: string = getActiveUserId()): Promise<CourseEvent[]> => {
  const { fromISO, toISO } = getWeekRange();
  const url = `/planner/api/v1/planned-elements/user/${userId}?from=${encodeURIComponent(fromISO)}&to=${encodeURIComponent(toISO)}&includes=icon,courses,locations,upload-folders`;

  const res = await fetchSmartschool(url);
  if (!res.ok || !res.body) {
    throw new Error(res.error || `Échec de la requête agenda (Status ${res.status})`);
  }

  const raw = JSON.parse(res.body);
  if (!Array.isArray(raw)) return [];

  const parsed: CourseEvent[] = [];
  for (const item of raw) {
    const evt = parseSmartschoolCourse(item);
    if (evt) parsed.push(evt);
  }

  // Extraction et sauvegarde immédiate des métadonnées établissement & classe
  const metadata = extractMetadataFromPlanner(raw);
  if (metadata.schoolName || metadata.studentClass) {
    const existingStudent = getCachedRealStudent() || {};
    const updatedStudent: Partial<Student> = {
      ...existingStudent,
      ...(metadata.schoolName ? { schoolName: metadata.schoolName } : {}),
      ...(metadata.studentClass ? { studentClass: metadata.studentClass } : {})
    };
    if (typeof window !== 'undefined') {
      localStorage.setItem(REAL_STORAGE_KEYS.STUDENT, JSON.stringify(updatedStudent));
    }
  }

  // Sauvegarder en cache
  if (typeof window !== 'undefined') {
    localStorage.setItem(REAL_STORAGE_KEYS.EVENTS, JSON.stringify(parsed));
  }

  return parsed;
};

/**
 * Récupère les devoirs réels depuis Smartschool via le bridge
 */
export const fetchRealHomeworks = async (userId: string = getActiveUserId()): Promise<Homework[]> => {
  const { fromISO, toISO } = getMonthRange();
  const types = 'planned-to-dos,planned-lesson-cluster-assignments,planned-assignments';
  const url = `/planner/api/v1/planned-elements/user/${userId}?from=${encodeURIComponent(fromISO)}&to=${encodeURIComponent(toISO)}&includes=icon,courses,locations,upload-folders&types=${encodeURIComponent(types)}`;

  const res = await fetchSmartschool(url);
  if (!res.ok || !res.body) {
    throw new Error(res.error || `Échec de la requête devoirs (Status ${res.status})`);
  }

  const raw = JSON.parse(res.body);
  if (!Array.isArray(raw)) return [];

  const parsed: Homework[] = [];
  for (const item of raw) {
    const hw = parseSmartschoolHomework(item);
    if (hw) parsed.push(hw);
  }

  // Sauvegarder en cache
  if (typeof window !== 'undefined') {
    localStorage.setItem(REAL_STORAGE_KEYS.HOMEWORKS, JSON.stringify(parsed));
  }

  return parsed;
};

/**
 * Synchronise l'ensemble des données réelles de l'élève
 */
export const syncAllSmartschoolData = async (userId: string = getActiveUserId()): Promise<SyncResult> => {
  try {
    const [events, homeworks] = await Promise.all([
      fetchRealAgenda(userId),
      fetchRealHomeworks(userId)
    ]);

    const partialStudent = getCachedRealStudent();

    return {
      success: true,
      events,
      homeworks,
      student: partialStudent
    };
  } catch (err: any) {
    return {
      success: false,
      events: getCachedRealEvents(),
      homeworks: getCachedRealHomeworks(),
      student: getCachedRealStudent(),
      error: err.message || 'Erreur de synchronisation'
    };
  }
};

// Données initiales réelles extraites de l'API Smartschool (utilisées si pas encore synchronisé)
const INITIAL_REAL_STUDENT: Partial<Student> = {
  schoolName: 'Collège Jean XXIII',
  studentClass: '4T1',
  ineNumber: '4907_5748_0',
  firstName: 'Élève',
  lastName: 'Jean XXIII',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'
};

const INITIAL_REAL_EVENTS: CourseEvent[] = [
  {
    id: '025ba09b-40a9-519f-8857-305f9601e73c',
    subject: 'Anglais',
    subjectCode: 'ANG2',
    teacher: 'VL Verheylewegen',
    room: 'D21',
    startTime: '15:30',
    endTime: '16:20',
    date: '2026-09-28',
    dayOfWeek: 1,
    type: 'cours',
    color: 'cyan',
    status: 'scheduled'
  },
  {
    id: '0463353e-fd7a-576d-a940-4ff6e7ba8aee',
    subject: 'Mathématique',
    subjectCode: 'MAT4',
    teacher: 'DI Didion',
    room: 'D22',
    startTime: '13:50',
    endTime: '14:40',
    date: '2026-09-28',
    dayOfWeek: 1,
    type: 'cours',
    color: 'rose',
    status: 'scheduled'
  },
  {
    id: '0483b4f5-9dfd-5e80-9160-39610d8da6e7',
    subject: 'Français',
    subjectCode: 'FRA4',
    teacher: 'RO Rouard',
    room: 'D21',
    startTime: '10:10',
    endTime: '11:00',
    date: '2026-09-30',
    dayOfWeek: 3,
    type: 'cours',
    color: 'cyan',
    status: 'scheduled'
  },
  {
    id: '085c62eb-fb0a-549c-aecf-fe4d43b41701',
    subject: 'Religion',
    subjectCode: 'REL',
    teacher: 'KD Kialuta',
    room: 'D21',
    startTime: '13:50',
    endTime: '14:40',
    date: '2026-10-02',
    dayOfWeek: 5,
    type: 'cours',
    color: 'indigo',
    status: 'scheduled'
  }
];

const INITIAL_REAL_HOMEWORKS: Homework[] = [
  {
    id: '81c03373-9411-4a93-8ede-bdc23665af7d',
    subject: 'Sciences Naturelles',
    subjectCode: 'SCI3',
    color: 'emerald',
    title: 'Interro de calorimétrie',
    description: 'Interrogation — Salle A52',
    dueDate: '2026-10-08',
    dueTime: '14:40',
    estimatedTimeMinutes: 45,
    isCompleted: false,
    priority: 'high',
    assignedDate: '2026-09-28'
  }
];

/**
 * Récupère les données réelles mises en cache dans le localStorage (avec fallback réel initial)
 */
export const getCachedRealEvents = (): CourseEvent[] => {
  if (typeof window === 'undefined') return INITIAL_REAL_EVENTS;
  try {
    const stored = localStorage.getItem(REAL_STORAGE_KEYS.EVENTS);
    return stored ? JSON.parse(stored) : INITIAL_REAL_EVENTS;
  } catch {
    return INITIAL_REAL_EVENTS;
  }
};

export const getCachedRealHomeworks = (): Homework[] => {
  if (typeof window === 'undefined') return INITIAL_REAL_HOMEWORKS;
  try {
    const stored = localStorage.getItem(REAL_STORAGE_KEYS.HOMEWORKS);
    return stored ? JSON.parse(stored) : INITIAL_REAL_HOMEWORKS;
  } catch {
    return INITIAL_REAL_HOMEWORKS;
  }
};

export const getCachedRealStudent = (): Partial<Student> | null => {
  if (typeof window === 'undefined') return INITIAL_REAL_STUDENT;
  try {
    const stored = localStorage.getItem(REAL_STORAGE_KEYS.STUDENT);
    return stored ? JSON.parse(stored) : INITIAL_REAL_STUDENT;
  } catch {
    return INITIAL_REAL_STUDENT;
  }
};
