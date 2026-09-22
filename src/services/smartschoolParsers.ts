/**
 * Convertisseurs et Parsers pour les données Smartschool REST API v1
 * 
 * Transforme les payloads bruts renvoyés par Smartschool (/planner/api/v1/...)
 * en structures de données BetterSchool strictement typées (CourseEvent, Homework, Student).
 */

import { CourseEvent, Homework, DayOfWeek, EventType, EventStatus } from '../types/school';
import { calculateHomeworkImportance, getHomeworkPriority } from '../utils/homeworkImportance';

// Palette de correspondance des couleurs Smartschool vers BetterSchool
const COLOR_MAP: Record<string, string> = {
  'aqua-200': 'cyan',
  'aqua-500': 'cyan',
  'watermelon-500': 'rose',
  'green-500': 'emerald',
  'yellow-500': 'amber',
  'blue-500': 'indigo',
  'purple-500': 'violet',
  'mint-200': 'emerald',
  'mint-500': 'emerald',
  'mint-700': 'emerald'
};

const mapColor = (smartschoolColor?: string): string => {
  if (!smartschoolColor) return 'indigo';
  return COLOR_MAP[smartschoolColor] || 'indigo';
};

/**
 * Traduit le score d'importance cumulatif en niveau compatible avec les
 * composants existants : élevé à partir de 5/10, moyen au-dessus de 0.
 */
export const calculateHomeworkUrgency = (
  dueDateStr: string,
  assignmentTypeName?: string,
  isCompleted: boolean = false
): 'high' | 'medium' | 'low' => {
  return getHomeworkPriority(
    calculateHomeworkImportance(dueDateStr, assignmentTypeName, isCompleted)
  );
};

/**
 * Convertit un élément de planning brut Smartschool en CourseEvent BetterSchool.
 * Retourne NULL pour tout devoir, interrogation, évaluation ou tâche afin
 * de ne jamais créer une case de cours inutile dans la grille de l'agenda.
 */
export const parseSmartschoolCourse = (raw: any): CourseEvent | null => {
  try {
    // 1. Exclure formellement tout ce qui est devoir, évaluation, interro ou tâche personnelle
    if (
      raw.assignmentType || 
      raw.plannedElementType === 'planned-assignments' || 
      raw.plannedElementType === 'planned-to-dos' ||
      raw.plannedElementType === 'planned-lesson-cluster-assignments' ||
      raw.type === 'planned-assignments' ||
      raw.type === 'planned-to-dos' ||
      raw.period?.deadline === true ||
      raw.resolvedStatus !== undefined
    ) {
      return null;
    }

    const isLessonFree = raw.plannedElementType === 'planned-lesson-free-days' || raw.period?.wholeDay === true;
    const course = raw.courses?.[0];
    const rawName = raw.name || raw.title || raw.courseCluster?.name;
    const subject = course?.name || rawName || (isLessonFree ? 'Jour sans cours' : 'Cours');
    
    // Code matière court (ex: "MATH", "ANG2", "FÊTE")
    const subjectCode = course?.scheduleCodes?.[0] || 
      (course?.name ? course.name.substring(0, 4).toUpperCase() : 
      (rawName ? (rawName.length > 4 ? rawName.substring(0, 4).toUpperCase() : rawName.toUpperCase()) : (isLessonFree ? 'CONGÉ' : subject.substring(0, 4).toUpperCase())));
    
    // Organisateur / Enseignant
    const teacherUser = raw.organisers?.users?.[0];
    const teacher = teacherUser?.name?.startingWithFirstName || 
                    teacherUser?.name?.startingWithLastName || 
                    teacherUser?.name?.formatted || 
                    raw.organisers?.groups?.[0]?.name || 
                    (isLessonFree ? '' : 'Professeur');
    
    // Salle de classe
    const location = raw.locations?.[0];
    const room = location?.title || location?.name || (isLessonFree ? '' : 'Salle indéterminée');
    
    // Période et horaires
    const fromStr = raw.period?.dateTimeFrom;
    const toStr = raw.period?.dateTimeTo;
    if (!fromStr) return null;

    const pad = (n: number) => n.toString().padStart(2, '0');

    // Extraction directe sans distorsion de fuseau horaire (ex: "2026-09-27T08:00:00+02:00")
    let date = '';
    let startTime = '08:00';
    let endTime = '08:50';
    let year = 0;
    let month = 0;
    let day = 0;

    const fromMatch = fromStr.match(/^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/);
    if (fromMatch) {
      year = parseInt(fromMatch[1], 10);
      month = parseInt(fromMatch[2], 10);
      day = parseInt(fromMatch[3], 10);
      date = `${fromMatch[1]}-${fromMatch[2]}-${fromMatch[3]}`;
      if (fromMatch[4] && fromMatch[5]) {
        startTime = `${fromMatch[4]}:${fromMatch[5]}`;
      }
    } else {
      const fromDate = new Date(fromStr);
      if (isNaN(fromDate.getTime())) return null;
      year = fromDate.getFullYear();
      month = fromDate.getMonth() + 1;
      day = fromDate.getDate();
      date = `${year}-${pad(month)}-${pad(day)}`;
      startTime = `${pad(fromDate.getHours())}:${pad(fromDate.getMinutes())}`;
    }

    if (toStr) {
      const toMatch = toStr.match(/T(\d{2}):(\d{2})/);
      if (toMatch) {
        endTime = `${toMatch[1]}:${toMatch[2]}`;
      } else {
        const toDate = new Date(toStr);
        if (!isNaN(toDate.getTime())) {
          endTime = `${pad(toDate.getHours())}:${pad(toDate.getMinutes())}`;
        }
      }
    }

    // Calcul garanti du jour de la semaine (1=Lundi, ..., 6=Samedi, 7=Dimanche)
    const calDate = new Date(year, month - 1, day);
    const jsDay = calDate.getDay(); // 0=Dimanche, 1=Lundi ... 6=Samedi
    const dayOfWeek = (jsDay === 0 ? 7 : jsDay) as DayOfWeek;

    // Statut dynamique par rapport à l'heure actuelle
    const now = new Date();
    const fromDate = new Date(fromStr);
    const toDate = toStr ? new Date(toStr) : new Date(fromDate.getTime() + 50 * 60 * 1000);
    let status: EventStatus = 'scheduled';
    if (!isNaN(fromDate.getTime()) && !isNaN(toDate.getTime())) {
      if (now >= fromDate && now <= toDate) {
        status = 'in_progress';
      } else if (now > toDate) {
        status = 'completed';
      }
    }

    return {
      id: raw.id || `${date}_${startTime}_${subjectCode}`,
      subject,
      subjectCode,
      teacher,
      room,
      startTime,
      endTime,
      date,
      dayOfWeek,
      type: 'cours',
      color: mapColor(raw.color),
      status,
      wholeDay: raw.period?.wholeDay === true,
      plannedElementType: raw.plannedElementType
    };
  } catch (err) {
    console.error('Erreur lors du parsing d\'un cours Smartschool:', err, raw);
    return null;
  }
};

/**
 * Convertit un élément d'évaluation ou devoir Smartschool en Homework BetterSchool
 */
export const parseSmartschoolHomework = (raw: any): Homework | null => {
  try {
    const title = raw.name || raw.title || 'Devoir';
    const course = raw.courses?.[0];
    const subject = course?.name || raw.courseCluster?.name || 'Matière';
    const subjectCode = course?.scheduleCodes?.[0] || subject.substring(0, 4).toUpperCase();
    
    const dateStr = raw.period?.dateTimeTo || raw.period?.dateTimeFrom;
    if (!dateStr) return null;

    const pad = (n: number) => n.toString().padStart(2, '0');

    // Extraction directe de la date d'échéance sans décalage de timezone
    let dueDate = '';
    let dueTime = '23:59';
    let targetYear = 0;
    let targetMonth = 0;
    let targetDay = 0;

    const hwMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/);
    if (hwMatch) {
      targetYear = parseInt(hwMatch[1], 10);
      targetMonth = parseInt(hwMatch[2], 10);
      targetDay = parseInt(hwMatch[3], 10);
      dueDate = `${hwMatch[1]}-${hwMatch[2]}-${hwMatch[3]}`;
      if (hwMatch[4] && hwMatch[5]) {
        dueTime = `${hwMatch[4]}:${hwMatch[5]}`;
      }
    } else {
      const dueDateObj = new Date(dateStr);
      if (isNaN(dueDateObj.getTime())) return null;
      targetYear = dueDateObj.getFullYear();
      targetMonth = dueDateObj.getMonth() + 1;
      targetDay = dueDateObj.getDate();
      dueDate = `${targetYear}-${pad(targetMonth)}-${pad(targetDay)}`;
      dueTime = `${pad(dueDateObj.getHours())}:${pad(dueDateObj.getMinutes())}`;
    }

    // Les devoirs dans le passé (retard) sont supprimés / invisibles
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const targetDate = new Date(targetYear, targetMonth - 1, targetDay);
    if (targetDate.getTime() < today.getTime()) {
      return null;
    }
    
    const typeName = raw.assignmentType?.name || raw.description || '';
    const isCompleted = raw.resolvedStatus === 'resolved';
    const estimatedTimeMinutes = Number(raw.estimatedTimeMinutes || raw.estimatedDuration || 30);

    const priority = calculateHomeworkUrgency(dueDate, typeName, isCompleted);

    // Extraction de la plateforme et de l'UUID du devoir
    let platformId: string | undefined;
    let assignmentId: string | undefined;

    if (typeof raw.id === 'string') {
      const pathMatch = raw.id.match(/planned-assignments\/([0-9]+)\/([0-9a-fA-F-]+)/i);
      if (pathMatch) {
        platformId = pathMatch[1];
        assignmentId = pathMatch[2];
      } else {
        const uuidMatch = raw.id.match(/([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})/i);
        if (uuidMatch) {
          assignmentId = uuidMatch[1];
        }
      }
    }

    if (!platformId) {
      if (raw.platformId) {
        platformId = String(raw.platformId);
      } else if (raw.organisers?.users?.[0]?.id) {
        const pMatch = String(raw.organisers.users[0].id).match(/^([0-9]+)_/);
        if (pMatch) platformId = pMatch[1];
      }
    }

    if (!assignmentId) {
      const altId = raw.assignmentId || raw.plannedAssignmentId || raw.assignment?.id;
      if (altId && typeof altId === 'string') {
        const altMatch = altId.match(/([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})/i);
        if (altMatch) assignmentId = altMatch[1];
      }
    }

    return {
      id: raw.id || (assignmentId ? (platformId ? `planned-assignments/${platformId}/${assignmentId}/` : assignmentId) : `hw_${dueDate}_${Math.random().toString(36).substring(2, 7)}`),
      platformId: platformId || '4907',
      assignmentId: assignmentId || (typeof raw.id === 'string' && /^[0-9a-fA-F-]/.test(raw.id) ? raw.id : undefined),
      plannedElementType: raw.plannedElementType || 'planned-assignments',
      subject,
      subjectCode,
      color: mapColor(raw.color),
      title,
      description: raw.assignmentType?.name || raw.description || 'Travail à réaliser',
      dueDate,
      dueTime,
      estimatedTimeMinutes,
      isCompleted,
      priority,
      assignedDate: dueDate
    };
  } catch (err) {
    console.error('Erreur lors du parsing d\'un devoir Smartschool:', err, raw);
    return null;
  }
};

/**
 * Découpe un nom complet en prénom et nom de famille
 */
export const splitFullName = (fullName: string): { firstName: string; lastName: string } => {
  if (!fullName) return { firstName: '', lastName: '' };
  const clean = fullName.trim();
  if (!clean) return { firstName: '', lastName: '' };

  const parts = clean.split(/\s+/);
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: '' };
  }

  // Détection si le format est "NOM Prénom" (ex: "DUPONT Jean" où le nom est en majuscules)
  if (parts.length === 2) {
    const isFirstUpper = parts[0] === parts[0].toUpperCase() && parts[0].length >= 2;
    const isSecondMixed = parts[1] !== parts[1].toUpperCase();
    if (isFirstUpper && isSecondMixed) {
      return { firstName: parts[1], lastName: parts[0] };
    }
  }

  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(' ')
  };
};

export interface PlannerMetadata {
  schoolName?: string;
  studentClass?: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
}

/**
 * Extrait les métadonnées de l'élève et de l'école depuis un payload de planning
 */
export const extractMetadataFromPlanner = (
  rawItems: any[], 
  effectiveUserId?: string | null
): PlannerMetadata => {
  let schoolName: string | undefined;
  let studentClass: string | undefined;
  let firstName: string | undefined;
  let lastName: string | undefined;
  let avatar: string | undefined;

  for (const item of rawItems) {
    if (!schoolName && item.locations?.[0]?.platformName) {
      schoolName = item.locations[0].platformName;
    }
    if (!studentClass && item.participants?.groups?.[0]?.name) {
      studentClass = item.participants.groups[0].name;
    }

    // 1. Recherche directe de l'élève par son userId dans les participants ou organisateurs
    if ((!firstName || !avatar) && effectiveUserId) {
      const allUsers = [
        ...(item.participants?.users || []),
        ...(item.organisers?.users || [])
      ];
      const match = allUsers.find((u: any) => u && String(u.id) === String(effectiveUserId));
      if (match) {
        if (!avatar && match.pictureUrl) {
          avatar = match.pictureUrl;
        }
        if (!firstName && match.name) {
          if (match.name.firstName) {
            firstName = match.name.firstName;
          }
          if (match.name.lastName) {
            lastName = match.name.lastName;
          }
          if (!firstName && match.name.startingWithFirstName) {
            const splitted = splitFullName(match.name.startingWithFirstName);
            if (splitted.firstName) {
              firstName = splitted.firstName;
              lastName = splitted.lastName;
            }
          }
        }
      }
    }

    // 2. Si c'est un to-do ou devoir personnel, l'organisateur est l'élève lui-même
    if ((!firstName || !avatar) && (item.plannedElementType === 'planned-to-dos' || item.type === 'planned-to-dos')) {
      const organiser = item.organisers?.users?.[0];
      if (organiser) {
        if (!avatar && organiser.pictureUrl) {
          avatar = organiser.pictureUrl;
        }
        if (!firstName && organiser.name) {
          if (organiser.name.firstName) {
            firstName = organiser.name.firstName;
          }
          if (organiser.name.lastName) {
            lastName = organiser.name.lastName;
          }
          if (!firstName && organiser.name.startingWithFirstName) {
            const splitted = splitFullName(organiser.name.startingWithFirstName);
            if (splitted.firstName) {
              firstName = splitted.firstName;
              lastName = splitted.lastName;
            }
          }
        }
      }
    }

    if (schoolName && studentClass && firstName && avatar) break;
  }

  return { schoolName, studentClass, firstName, lastName, avatar };
};
