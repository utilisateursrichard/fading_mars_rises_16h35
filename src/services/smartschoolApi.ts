/**
 * Service d'intégration Smartschool (Client-side)
 * 
 * Communique avec les endpoints réels découverts (/planner/api/v1/...) via la passerelle postMessage
 * et synchronise dynamiquement les données réelles de l'élève sans rien hardcoder.
 */

import { CourseEvent, Homework, Student } from '../types/school';
import { fetchSmartschool, queryHostDOM, getHostPageInfo } from './smartschoolBridge';
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

/**
 * Récupère l'identifiant de l'élève actif stocké en cache (ou null si inconnu)
 */
export const getActiveUserId = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(REAL_STORAGE_KEYS.USER_ID) || null;
};

/**
 * Enregistre l'identifiant de l'élève actif
 */
export const setActiveUserId = (userId: string): void => {
  if (typeof window !== 'undefined' && userId) {
    localStorage.setItem(REAL_STORAGE_KEYS.USER_ID, userId);
  }
};

/**
 * Découvre dynamiquement l'identifiant de l'élève connecté sur Smartschool
 * sans aucune valeur en dur.
 */
export const discoverUserId = async (): Promise<string | null> => {
  const stored = getActiveUserId();
  if (stored) return stored;

  try {
    const hostInfo = await getHostPageInfo();
    if (hostInfo.ok && hostInfo.data) {
      const fromUrl = hostInfo.data.url?.match(/user\/([0-9]+_[0-9]+_[0-9]+)/);
      if (fromUrl && fromUrl[1]) {
        setActiveUserId(fromUrl[1]);
        return fromUrl[1];
      }
      const fromHtml = hostInfo.data.html?.match(/\/planned-elements\/user\/([0-9]+_[0-9]+_[0-9]+)/) ||
                       hostInfo.data.html?.match(/"userId"\s*:\s*"([0-9]+_[0-9]+_[0-9]+)"/);
      if (fromHtml && fromHtml[1]) {
        setActiveUserId(fromHtml[1]);
        return fromHtml[1];
      }
    }
  } catch {}

  try {
    const plannerRes = await fetchSmartschool('/planner');
    if (plannerRes.ok && plannerRes.body) {
      const match = plannerRes.body.match(/\/planned-elements\/user\/([0-9]+_[0-9]+_[0-9]+)/) ||
                    plannerRes.body.match(/"userId"\s*:\s*"([0-9]+_[0-9]+_[0-9]+)"/) ||
                    plannerRes.body.match(/user\/([0-9]+_[0-9]+_[0-9]+)/);
      if (match && match[1]) {
        setActiveUserId(match[1]);
        return match[1];
      }
    }
  } catch {}

  return null;
};

/**
 * Découvre dynamiquement le profil de l'élève (avatar, nom, prénom) depuis le DOM de Smartschool
 */
export const discoverStudentProfile = async (): Promise<Partial<Student> | null> => {
  try {
    const domRes = await queryHostDOM([
      { key: 'avatar', selector: 'img[src*="userpicture"], img[src*="Userimage"], .js-btn-avatar img, .topnav__user img', attr: 'src' },
      { key: 'fullName', selector: '.js-user-name, .topnav__user-name, [data-user-name], .user-name', attr: 'text' }
    ]);

    if (domRes.ok && domRes.results) {
      const avatar = domRes.results.avatar || undefined;
      const fullName = domRes.results.fullName || '';
      
      let firstName = '';
      let lastName = '';
      if (fullName) {
        const parts = fullName.trim().split(/\s+/);
        firstName = parts[0] || '';
        lastName = parts.slice(1).join(' ') || '';
      }

      const existing = getCachedRealStudent() || {};
      const updated: Partial<Student> = {
        ...existing,
        ...(avatar ? { avatar } : {}),
        ...(firstName ? { firstName } : {}),
        ...(lastName ? { lastName } : {})
      };

      if (typeof window !== 'undefined' && (avatar || firstName)) {
        localStorage.setItem(REAL_STORAGE_KEYS.STUDENT, JSON.stringify(updated));
      }
      return updated;
    }
  } catch {}

  return getCachedRealStudent();
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
 * Récupère les données d'agenda réelles depuis Smartschool via la passerelle
 */
export const fetchRealAgenda = async (userId?: string, targetDate: Date = new Date()): Promise<CourseEvent[]> => {
  const activeId = userId || await discoverUserId();
  if (!activeId) {
    throw new Error('Identifiant élève introuvable pour récupérer l\'agenda.');
  }

  const { fromISO, toISO } = getWeekRange(targetDate);
  const url = `/planner/api/v1/planned-elements/user/${activeId}?from=${encodeURIComponent(fromISO)}&to=${encodeURIComponent(toISO)}&includes=icon,courses,locations,upload-folders`;

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

  // Extraction et sauvegarde immédiate des métadonnées réelles établissement & classe
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

  // Sauvegarder en cache réel
  if (typeof window !== 'undefined') {
    localStorage.setItem(REAL_STORAGE_KEYS.EVENTS, JSON.stringify(parsed));
  }

  return parsed;
};

/**
 * Récupère les devoirs réels depuis Smartschool via la passerelle
 */
export const fetchRealHomeworks = async (userId?: string, targetDate: Date = new Date()): Promise<Homework[]> => {
  const activeId = userId || await discoverUserId();
  if (!activeId) {
    throw new Error('Identifiant élève introuvable pour récupérer les devoirs.');
  }

  const { fromISO, toISO } = getMonthRange(targetDate);
  const types = 'planned-to-dos,planned-lesson-cluster-assignments,planned-assignments';
  const url = `/planner/api/v1/planned-elements/user/${activeId}?from=${encodeURIComponent(fromISO)}&to=${encodeURIComponent(toISO)}&includes=icon,courses,locations,upload-folders&types=${encodeURIComponent(types)}`;

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

  // Sauvegarder en cache réel
  if (typeof window !== 'undefined') {
    localStorage.setItem(REAL_STORAGE_KEYS.HOMEWORKS, JSON.stringify(parsed));
  }

  return parsed;
};

/**
 * Synchronise l'ensemble des données réelles de l'élève sans aucun élément hardcodé
 */
export const syncAllSmartschoolData = async (targetDate: Date = new Date()): Promise<SyncResult> => {
  try {
    const userId = await discoverUserId();
    const studentProfile = await discoverStudentProfile();

    if (!userId) {
      return {
        success: false,
        events: getCachedRealEvents(),
        homeworks: getCachedRealHomeworks(),
        student: studentProfile || getCachedRealStudent(),
        error: 'Impossible de détecter l\'identifiant élève sur Smartschool.'
      };
    }

    const [events, homeworks] = await Promise.all([
      fetchRealAgenda(userId, targetDate),
      fetchRealHomeworks(userId, targetDate)
    ]);

    const updatedStudent = getCachedRealStudent();

    if (typeof window !== 'undefined') {
      localStorage.setItem(REAL_STORAGE_KEYS.LAST_SYNC, new Date().toISOString());
    }

    return {
      success: true,
      events,
      homeworks,
      student: updatedStudent
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

/**
 * Récupère les données réelles mises en cache dans le localStorage (renvoie un tableau vide ou null si non synchronisé)
 */
export const getCachedRealEvents = (): CourseEvent[] => {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(REAL_STORAGE_KEYS.EVENTS);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

export const getCachedRealHomeworks = (): Homework[] => {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(REAL_STORAGE_KEYS.HOMEWORKS);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

export const getCachedRealStudent = (): Partial<Student> | null => {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(REAL_STORAGE_KEYS.STUDENT);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};
