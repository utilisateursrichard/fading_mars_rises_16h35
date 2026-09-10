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
  extractMetadataFromPlanner,
  isGenericImagePlaceholder,
  cleanProfileName,
  splitFullName
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
          function isJunk(s) {
            if (!s || typeof s !== 'string') return true;
            var t = s.trim().toLowerCase();
            return !t || t === 'image de profil' || t === 'image de profile' || t === 'photo de profil' ||
                   t === 'photo de profile' || t === 'image' || t === 'de profil' || t === 'de profile' ||
                   t === 'avatar' || t === 'profielfoto' || t === 'profile picture' || t === 'utilisateur' ||
                   t === 'user' || t === 'profil' || t === 'profile' || t === 'inconnu';
          }

          function cleanName(s) {
            if (!s || typeof s !== 'string') return '';
            var c = s.trim()
              .replace(/^(image|photo|picture|avatar|profielfoto)\\s*(de\\s*profil\\s*(de\\s*l['’]utilisateur|d['’]|de)?|van|of)?\\s*:?\\s*/i, '')
              .replace(/^(utilisateur\\s*:?|user\\s*:?)\\s*/i, '')
              .trim();
            return isJunk(c) ? '' : c;
          }

          // 1. Objets globaux Smartschool
          var u = (window.smsc && (
            window.smsc.user || 
            window.smsc.currentUser || 
            window.smsc.current_user || 
            window.smsc.account || 
            window.smsc.profile ||
            (window.smsc.data && window.smsc.data.user) ||
            (window.smsc.session && window.smsc.session.user)
          )) || (window.smscAppConfig && (window.smscAppConfig.user || window.smscAppConfig.currentUser)) || window.currentUser || null;

          var firstName = u ? (u.firstname || u.voornaam || u.first_name || u.firstName || u.givenName) : null;
          var lastName = u ? (u.lastname || u.achternaam || u.last_name || u.lastName || u.familyName || u.surname) : null;
          var fullName = u ? (u.name || u.fullName || u.official_name || u.formatted_name || u.displayName) : null;
          var avatar = u ? (u.pictureUrl || u.avatar || u.photo || u.picture || u.userimage) : null;

          if (isJunk(firstName)) firstName = null;
          if (isJunk(lastName)) lastName = null;
          if (fullName) {
            fullName = cleanName(fullName);
            if (!fullName) fullName = null;
          }

          // 2. Recherche dans le DOM de Smartschool
          if (!fullName) {
            var userBtns = document.querySelectorAll('.topnav__btn--user, button.topnav__btn--user, a.topnav__btn--user, .topnav__btn--account, .topnav__user, .js-btn-avatar, .smsc-topbar__user, a[href*="/user/profile"], a[href*="/user/"]');
            for (var i = 0; i < userBtns.length; i++) {
              var btn = userBtns[i];
              if (!fullName) {
                var t = cleanName(btn.getAttribute('title') || btn.getAttribute('aria-label'));
                if (t) fullName = t;
              }
              if (!fullName) {
                var lbl = btn.querySelector('.topnav__btn__title, .topnav__btn__label, .topnav__user-name, .user-name, .js-user-name, span');
                if (lbl) {
                  var lt = cleanName(lbl.innerText || lbl.textContent);
                  if (lt) fullName = lt;
                }
              }
              if (!fullName) {
                var clone = btn.cloneNode(true);
                var subImgs = clone.querySelectorAll('img, svg, i');
                for (var j = 0; j < subImgs.length; j++) subImgs[j].remove();
                var dt = cleanName(clone.innerText || clone.textContent);
                if (dt) fullName = dt;
              }
            }
          }

          if (!fullName) {
            var nameSelectors = ['.js-user-name', '.topnav__user-name', '.user-name', '[data-user-name]', '[data-username]', '.profile-name', '.header__user-name', '.c-user-nav__name'];
            for (var k = 0; k < nameSelectors.length; k++) {
              var el = document.querySelector(nameSelectors[k]);
              if (el) {
                var nt = cleanName(el.innerText || el.textContent);
                if (nt) { fullName = nt; break; }
              }
            }
          }

          var avatarEl = document.querySelector('img[src*="userpicture"], img[src*="Userimage"], .topnav__btn--user img, .js-btn-avatar img, .topnav__user img, .js-avatar');
          if (!avatar && avatarEl) {
            avatar = avatarEl.src;
          }

          if (!fullName && avatarEl) {
            var at = cleanName(avatarEl.getAttribute('title') || avatarEl.getAttribute('alt'));
            if (at) fullName = at;
          }

          return { 
            firstName: firstName || null, 
            lastName: lastName || null, 
            fullName: fullName || null, 
            avatar: avatar || null 
          };
        } catch(e) { return null; }
      })()
    `);

    if (evalRes.ok && evalRes.result) {
      const res = evalRes.result;
      let firstName = cleanProfileName(res.firstName);
      let lastName = cleanProfileName(res.lastName);
      const avatar = res.avatar || '';

      if (!firstName && res.fullName) {
        const splitted = splitFullName(res.fullName);
        firstName = splitted.firstName;
        lastName = splitted.lastName;
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
      { key: 'btnTitle', selector: '.topnav__btn--user, button.topnav__btn--user, a.topnav__btn--user', attr: 'title' },
      { key: 'btnAria', selector: '.topnav__btn--user, button.topnav__btn--user, a.topnav__btn--user', attr: 'aria-label' },
      { key: 'btnLabel', selector: '.topnav__btn--user .topnav__btn__title, .topnav__btn--user .topnav__btn__label, .topnav__btn--user span', attr: 'text' },
      { key: 'userName', selector: '.js-user-name, .topnav__user-name, .user-name, [data-user-name]', attr: 'text' },
      { key: 'avatarTitle', selector: 'img[src*="userpicture"], img[src*="Userimage"]', attr: 'title' },
      { key: 'avatarAlt', selector: 'img[src*="userpicture"], img[src*="Userimage"]', attr: 'alt' }
    ]);

    if (domRes.ok && domRes.results) {
      let firstName = cleanProfileName(cached?.firstName);
      let lastName = cleanProfileName(cached?.lastName);

      const candidates = [
        domRes.results.userName,
        domRes.results.btnLabel,
        domRes.results.btnTitle,
        domRes.results.btnAria,
        domRes.results.avatarTitle,
        domRes.results.avatarAlt
      ];

      let detectedFullName = '';
      for (const cand of candidates) {
        const cleaned = cleanProfileName(cand);
        if (cleaned) {
          detectedFullName = cleaned;
          break;
        }
      }

      if (detectedFullName) {
        const splitted = splitFullName(detectedFullName);
        firstName = splitted.firstName;
        lastName = splitted.lastName;
      }

      const avatar = domRes.results.avatar || cached?.avatar || '';

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
  const inlineHomeworks: Homework[] = [];
  for (const item of items) {
    const evt = parseSmartschoolCourse(item);
    if (evt) {
      parsed.push(evt);
    } else {
      const hw = parseSmartschoolHomework(item);
      if (hw) inlineHomeworks.push(hw);
    }
  }

  // Si des devoirs ou évaluations sont présents dans le flux de planning, les fusionner au cache devoirs
  if (inlineHomeworks.length > 0 && typeof window !== 'undefined') {
    const existing = getCachedRealHomeworks();
    const map = new Map<string, Homework>();
    for (const h of existing) map.set(h.id, h);
    for (const h of inlineHomeworks) map.set(h.id, h);
    localStorage.setItem(REAL_STORAGE_KEYS.HOMEWORKS, JSON.stringify(Array.from(map.values())));
  }

  // Extraction et sauvegarde immédiate des métadonnées établissement, classe & profil élève
  const metadata = extractMetadataFromPlanner(items, effectiveUserId);
  if (metadata.schoolName || metadata.studentClass || metadata.firstName || metadata.avatar) {
    const existingStudent = getCachedRealStudent() || {};
    const updatedStudent: Partial<Student> = {
      ...existingStudent,
      ...(metadata.schoolName ? { schoolName: metadata.schoolName } : {}),
      ...(metadata.studentClass ? { studentClass: metadata.studentClass } : {}),
      ...(metadata.firstName ? { firstName: metadata.firstName } : {}),
      ...(metadata.lastName ? { lastName: metadata.lastName } : {}),
      ...(metadata.avatar ? { avatar: metadata.avatar } : {})
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
    if (!stored) return null;
    const parsed = JSON.parse(stored);

    // Purger les valeurs polluées par d'anciens parsings défectueux ("Image de profil", etc.)
    let modified = false;
    if (isGenericImagePlaceholder(parsed.firstName)) {
      delete parsed.firstName;
      modified = true;
    }
    if (isGenericImagePlaceholder(parsed.lastName)) {
      delete parsed.lastName;
      modified = true;
    }
    if (isGenericImagePlaceholder(`${parsed.firstName || ''} ${parsed.lastName || ''}`.trim())) {
      delete parsed.firstName;
      delete parsed.lastName;
      modified = true;
    }

    if (modified) {
      localStorage.setItem(REAL_STORAGE_KEYS.STUDENT, JSON.stringify(parsed));
    }

    return parsed;
  } catch {
    return null;
  }
};
