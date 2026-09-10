/**
 * Service d'intégration Smartschool (Client-side)
 * 
 * Communique avec les endpoints réels découverts (/planner/api/v1/...) via le pont postMessage
 * et stocke les données réelles de l'élève en cache local.
 */

import { CourseEvent, Homework, Student } from '../types/school';
import { fetchSmartschool, queryHostDOM, getHostPageInfo, evalHostExpression } from './smartschoolBridge';
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
 * Récupère l'identifiant de l'élève actif (stocké lors de l'initialisation Smartschool)
 */
export const getActiveUserId = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(REAL_STORAGE_KEYS.USER_ID);
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
 * Découvre dynamiquement l'identifiant de l'élève (userId) sans aucun hardcoding :
 * 1. En vérifiant le cache local.
 * 2. En évaluant les variables globales de session hôte (window.smsc, window.currentUser).
 * 3. En interrogeant l'URL / titre de la page hôte via la passerelle.
 * 4. En inspectant la réponse HTML de /planner via le bridge Same-Origin.
 */
export const discoverUserId = async (): Promise<string | null> => {
  const cached = getActiveUserId();
  if (cached) return cached;

  // 1. Essai d'évaluation globale sur l'hôte (window.smsc, window.currentUser, cookies, DOM)
  try {
    const evalRes = await evalHostExpression(`
      (function() {
        try {
          var u = (window.smsc && (window.smsc.user || window.smsc.currentUser || window.smsc.current_user || window.smsc.account || window.smsc.profile)) || window.currentUser || null;
          if (u && (u.id || u.user_id || u.userId)) return String(u.id || u.user_id || u.userId);

          // Attributs DOM data-user-id
          var elWithId = document.querySelector('[data-user-id], [data-userid], meta[name="user-id"]');
          if (elWithId) {
            var val = elWithId.getAttribute('data-user-id') || elWithId.getAttribute('data-userid') || elWithId.getAttribute('content');
            if (val && /^[0-9]+_[0-9]+_[0-9]+$/.test(val)) return val;
          }

          // Cookie pid (identifiant Smartschool)
          var cookieMatch = document.cookie.match(/(?:^|;\\s*)pid=([0-9]+_[0-9]+_[0-9]+)/);
          if (cookieMatch && cookieMatch[1]) return cookieMatch[1];

          // Recherche regex dans le HTML
          var m = (document.body && document.body.innerHTML) ? 
                  (document.body.innerHTML.match(/planned-elements\\/user\\/([0-9]+_[0-9]+_[0-9]+)/) ||
                   document.body.innerHTML.match(/["']([0-9]{3,5}_[0-9]{2,7}_[0-9]{1,3})["']/)) : null;
          if (m && m[1]) return m[1];
          return null;
        } catch(e) { return null; }
      })()
    `);
    if (evalRes.ok && evalRes.result && typeof evalRes.result === 'string') {
      setActiveUserId(evalRes.result);
      return evalRes.result;
    }
  } catch {}

  // 2. Essai depuis l'URL de la page hôte
  try {
    const pageInfo = await getHostPageInfo();
    if (pageInfo.ok && pageInfo.data?.url) {
      const urlMatch = pageInfo.data.url.match(/user\/([0-9]+_[0-9]+_[0-9]+)/);
      if (urlMatch && urlMatch[1]) {
        setActiveUserId(urlMatch[1]);
        return urlMatch[1];
      }
    }
  } catch {
    // Non bloquant
  }

  // 3. Essai depuis la page /planner via le bridge Same-Origin
  try {
    const plannerRes = await fetchSmartschool('/planner', {
      headers: { 'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8' }
    });
    if (plannerRes.ok && plannerRes.body) {
      const match = plannerRes.body.match(/planned-elements\/user\/([0-9]+_[0-9]+_[0-9]+)/) ||
                    plannerRes.body.match(/user\/([0-9]+_[0-9]+_[0-9]+)/) ||
                    plannerRes.body.match(/["']([0-9]{3,5}_[0-9]{2,7}_[0-9]{1,3})["']/);
      if (match && match[1]) {
        setActiveUserId(match[1]);
        return match[1];
      }
    }
  } catch (e) {
    console.warn('Découverte userId via /planner échouée:', e);
  }

  // 4. Repli vers l'endpoint pinned (qui ne requiert pas de userId)
  try {
    const pinnedRes = await fetchSmartschool('/planner/api/v1/planned-elements/pinned?includes=icon,courses,locations,upload-folders', {
      headers: { 'Accept': 'application/json, text/plain, */*', 'X-Requested-With': 'XMLHttpRequest' }
    });
    if (pinnedRes.ok && pinnedRes.body) {
      const match = pinnedRes.body.match(/([0-9]{3,5}_[0-9]{2,7}_[0-9]{1,3})/);
      if (match && match[1]) {
        setActiveUserId(match[1]);
        return match[1];
      }
    }
  } catch {}

  return null;
};

/**
 * Découvre dynamiquement le profil de l'élève (nom, prénom, avatar CDN) depuis Smartschool
 */
export const discoverStudentProfile = async (): Promise<Partial<Student> | null> => {
  const cached = getCachedRealStudent();

  // 1. Essai d'extraction directe via eval sur la page hôte (smsc.user + DOM)
  try {
    const evalRes = await evalHostExpression(`
      (function() {
        try {
          var u = (window.smsc && (window.smsc.user || window.smsc.currentUser || window.smsc.current_user)) || window.currentUser || null;
          var firstName = u ? (u.first_name || u.firstName || u.givenName) : null;
          var lastName = u ? (u.last_name || u.lastName || u.familyName) : null;
          var fullName = u ? (u.name || u.fullName) : null;
          var avatar = u ? (u.pictureUrl || u.avatar || u.photo || u.picture) : null;

          // Si nom ou avatar non trouvés dans l'objet global, inspecter le DOM hôte
          var avatarEl = document.querySelector('img[src*="userpicture"], img[src*="Userimage"], .js-btn-avatar img, .topnav__btn--user img, .js-avatar');
          if (!avatar && avatarEl) {
            avatar = avatarEl.src;
          }

          var nameEl = document.querySelector('.js-user-name, .topnav__user-name, .user-name, [data-user-name], .js-btn-avatar span');
          if (!fullName && nameEl) {
            fullName = (nameEl.innerText || nameEl.textContent || '').trim();
          }

          if (!fullName && avatarEl) {
            fullName = (avatarEl.getAttribute('title') || avatarEl.getAttribute('alt') || '').trim();
          }

          return { firstName: firstName, lastName: lastName, fullName: fullName, avatar: avatar };
        } catch(e) { return null; }
      })()
    `);

    if (evalRes.ok && evalRes.result) {
      const res = evalRes.result;
      let firstName = res.firstName || '';
      let lastName = res.lastName || '';
      const avatar = res.avatar || '';

      if (!firstName && res.fullName) {
        const cleanName = res.fullName.replace(/^(photo de profil de|utilisateur\s*:?)\s*/i, '').trim();
        const parts = cleanName.split(/\s+/);
        if (parts.length >= 2) {
          firstName = parts[0];
          lastName = parts.slice(1).join(' ');
        } else if (parts.length === 1) {
          firstName = parts[0];
        }
      }

      if (firstName || avatar) {
        const updated: Partial<Student> = {
          ...(cached || {}),
          ...(firstName ? { firstName } : {}),
          ...(lastName ? { lastName } : {}),
          ...(avatar ? { avatar } : {})
        };
        if (typeof window !== 'undefined') {
          localStorage.setItem(REAL_STORAGE_KEYS.STUDENT, JSON.stringify(updated));
        }
        return updated;
      }
    }
  } catch {}

  // 2. Repli vers queryHostDOM
  try {
    const domRes = await queryHostDOM([
      { key: 'avatar', selector: 'img[src*="userpicture"], img[src*="Userimage"], .js-btn-avatar img, .topnav__user img, .topnav__btn--user img', attr: 'src' },
      { key: 'avatarAlt', selector: 'img[src*="userpicture"], img[src*="Userimage"], .js-btn-avatar img', attr: 'alt' },
      { key: 'avatarTitle', selector: 'img[src*="userpicture"], img[src*="Userimage"], .js-btn-avatar img', attr: 'title' },
      { key: 'fullName', selector: '.js-user-name, .topnav__user, .user-name, [data-user-name], .js-btn-avatar span', attr: 'text' }
    ]);

    if (domRes.ok && domRes.results) {
      let firstName = cached?.firstName || '';
      let lastName = cached?.lastName || '';

      const rawFullName = domRes.results.fullName || domRes.results.avatarTitle || domRes.results.avatarAlt || '';
      if (rawFullName) {
        const clean = rawFullName.replace(/^(photo de profil de|utilisateur\s*:?)\s*/i, '').trim();
        const parts = clean.split(/\s+/);
        if (parts.length >= 2) {
          firstName = parts[0];
          lastName = parts.slice(1).join(' ');
        } else if (parts.length === 1) {
          firstName = parts[0];
        }
      }

      const avatar = domRes.results.avatar || cached?.avatar || '';

      const updated: Partial<Student> = {
        ...(cached || {}),
        ...(firstName ? { firstName } : {}),
        ...(lastName ? { lastName } : {}),
        ...(avatar ? { avatar } : {})
      };

      if (typeof window !== 'undefined') {
        localStorage.setItem(REAL_STORAGE_KEYS.STUDENT, JSON.stringify(updated));
      }

      return updated;
    }
  } catch (e) {
    console.warn('Erreur lors de la découverte du profil depuis le DOM hôte:', e);
  }

  return cached;
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
export const fetchRealAgenda = async (userId?: string | null, targetDate?: Date): Promise<CourseEvent[]> => {
  const effectiveUserId = userId || getActiveUserId();
  if (!effectiveUserId) return [];

  const { fromISO, toISO } = getWeekRange(targetDate || new Date());
  const url = `/planner/api/v1/planned-elements/user/${effectiveUserId}?from=${encodeURIComponent(fromISO)}&to=${encodeURIComponent(toISO)}&includes=icon,courses,locations,upload-folders`;

  const res = await fetchSmartschool(url, {
    headers: {
      'Accept': 'application/json, text/plain, */*',
      'X-Requested-With': 'XMLHttpRequest'
    }
  });
  if (!res.ok || !res.body) {
    throw new Error(res.error || `Échec de la requête agenda (Status ${res.status})`);
  }

  let raw: any;
  try {
    raw = JSON.parse(res.body);
  } catch {
    throw new Error('Réponse agenda invalide (format JSON attendu)');
  }

  const items: any[] = Array.isArray(raw) ? raw : (raw?.items || raw?.elements || raw?.plannedElements || raw?.data || []);

  const parsed: CourseEvent[] = [];
  for (const item of items) {
    const evt = parseSmartschoolCourse(item);
    if (evt) parsed.push(evt);
  }

  // Extraction et sauvegarde immédiate des métadonnées établissement & classe
  const metadata = extractMetadataFromPlanner(items);
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
export const fetchRealHomeworks = async (userId?: string | null, targetDate?: Date): Promise<Homework[]> => {
  const effectiveUserId = userId || getActiveUserId();
  if (!effectiveUserId) return [];

  const { fromISO, toISO } = getMonthRange(targetDate || new Date());
  const types = 'planned-to-dos,planned-lesson-cluster-assignments,planned-assignments';
  const url = `/planner/api/v1/planned-elements/user/${effectiveUserId}?from=${encodeURIComponent(fromISO)}&to=${encodeURIComponent(toISO)}&includes=icon,courses,locations,upload-folders&types=${encodeURIComponent(types)}`;

  const res = await fetchSmartschool(url, {
    headers: {
      'Accept': 'application/json, text/plain, */*',
      'X-Requested-With': 'XMLHttpRequest'
    }
  });
  if (!res.ok || !res.body) {
    throw new Error(res.error || `Échec de la requête devoirs (Status ${res.status})`);
  }

  let raw: any;
  try {
    raw = JSON.parse(res.body);
  } catch {
    throw new Error('Réponse devoirs invalide (format JSON attendu)');
  }

  const items: any[] = Array.isArray(raw) ? raw : (raw?.items || raw?.elements || raw?.plannedElements || raw?.data || []);

  const parsed: Homework[] = [];
  for (const item of items) {
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
export const syncAllSmartschoolData = async (targetDate?: Date, userId?: string | null): Promise<SyncResult> => {
  let effectiveUserId = userId || getActiveUserId();
  if (!effectiveUserId) {
    effectiveUserId = await discoverUserId();
  }

  // Découverte préalable du profil (nom, avatar)
  let partialStudent = getCachedRealStudent();
  try {
    const discovered = await discoverStudentProfile();
    if (discovered) {
      partialStudent = discovered;
    }
  } catch (e) {
    console.warn('Erreur lors de la découverte du profil:', e);
  }

  if (!effectiveUserId) {
    return {
      success: false,
      events: getCachedRealEvents(),
      homeworks: getCachedRealHomeworks(),
      student: partialStudent,
      error: 'Identifiant élève non trouvé'
    };
  }

  try {
    const [rawEvents, homeworks] = await Promise.all([
      fetchRealAgenda(effectiveUserId, targetDate),
      fetchRealHomeworks(effectiveUserId, targetDate)
    ]);

    // Associer les devoirs aux cours correspondants
    const events = rawEvents.map(evt => {
      const hwForEvent = homeworks.filter(h => 
        (h.courseEventId && h.courseEventId === evt.id) ||
        (h.dueDate === evt.date && (h.subjectCode === evt.subjectCode || h.subject === evt.subject))
      );
      return hwForEvent.length > 0 ? { ...evt, homeworkDue: hwForEvent } : evt;
    });

    // Re-lire le profil enrichi par fetchRealAgenda (schoolName, studentClass)
    const finalStudent = getCachedRealStudent() || partialStudent;

    return {
      success: true,
      events,
      homeworks,
      student: finalStudent
    };
  } catch (err: any) {
    return {
      success: false,
      events: getCachedRealEvents(),
      homeworks: getCachedRealHomeworks(),
      student: getCachedRealStudent() || partialStudent,
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
