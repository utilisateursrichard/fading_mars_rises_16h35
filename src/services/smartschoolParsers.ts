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
  'purple-500': 'violet'
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

    const course = raw.courses?.[0];
    const rawName = raw.name || raw.title || raw.courseCluster?.name;
    const subject = course?.name || rawName || 'Cours';
    
    // Code matière court (ex: "MATH", "ANG2")
    const subjectCode = course?.scheduleCodes?.[0] || 
      (course?.name ? course.name.substring(0, 4).toUpperCase() : 
      (rawName ? rawName.substring(0, 4).toUpperCase() : subject.substring(0, 4).toUpperCase()));
    
    // Organisateur / Enseignant
    const teacherUser = raw.organisers?.users?.[0];
    const teacher = teacherUser?.name?.startingWithFirstName || 
                    teacherUser?.name?.startingWithLastName || 
                    teacherUser?.name?.formatted || 
                    raw.organisers?.groups?.[0]?.name || 
                    'Professeur';
    
    // Salle de classe
    const location = raw.locations?.[0];
    const room = location?.title || location?.name || 'Salle indéterminée';
    
    // Période et horaires
    const fromStr = raw.period?.dateTimeFrom;
    const toStr = raw.period?.dateTimeTo;
    if (!fromStr) return null;

    const fromDate = new Date(fromStr);
    const toDate = toStr ? new Date(toStr) : new Date(fromDate.getTime() + 50 * 60 * 1000);
    
    if (isNaN(fromDate.getTime())) return null;

    const pad = (n: number) => n.toString().padStart(2, '0');
    const startTime = `${pad(fromDate.getHours())}:${pad(fromDate.getMinutes())}`;
    const endTime = `${pad(toDate.getHours())}:${pad(toDate.getMinutes())}`;
    const date = `${fromDate.getFullYear()}-${pad(fromDate.getMonth() + 1)}-${pad(fromDate.getDate())}`;
    
    // JS Date.getDay(): 0=Dimanche, 1=Lundi ... 6=Samedi
    const jsDay = fromDate.getDay();
    const dayOfWeek = (jsDay === 0 ? 1 : jsDay) as DayOfWeek;

    // Statut dynamique par rapport à l'heure actuelle
    const now = new Date();
    let status: EventStatus = 'scheduled';
    if (now >= fromDate && now <= toDate) {
      status = 'in_progress';
    } else if (now > toDate) {
      status = 'completed';
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
      status
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

    const dueDateObj = new Date(dateStr);
    if (isNaN(dueDateObj.getTime())) return null;

    const pad = (n: number) => n.toString().padStart(2, '0');
    const dueDate = `${dueDateObj.getFullYear()}-${pad(dueDateObj.getMonth() + 1)}-${pad(dueDateObj.getDate())}`;
    const dueTime = `${pad(dueDateObj.getHours())}:${pad(dueDateObj.getMinutes())}`;

    // Les devoirs dans le passé (retard) sont supprimés / invisibles
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const targetDate = new Date(dueDateObj.getFullYear(), dueDateObj.getMonth(), dueDateObj.getDate());
    if (targetDate.getTime() < today.getTime()) {
      return null;
    }
    
    const typeName = raw.assignmentType?.name || raw.description || '';
    const isCompleted = raw.resolvedStatus === 'resolved';
    const estimatedTimeMinutes = Number(raw.estimatedTimeMinutes || raw.estimatedDuration || 30);

    const priority = calculateHomeworkUrgency(dueDate, typeName, isCompleted);

    return {
      id: raw.id || `hw_${dueDate}_${Math.random().toString(36).substring(2, 7)}`,
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
