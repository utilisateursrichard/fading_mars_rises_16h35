/**
 * Convertisseurs et Parsers pour les données Smartschool REST API v1
 * 
 * Transforme les payloads bruts renvoyés par Smartschool (/planner/api/v1/...)
 * en structures de données BetterSchool strictement typées (CourseEvent, Homework, Student).
 */

import { CourseEvent, Homework, DayOfWeek, EventType, EventStatus } from '../types/school';

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
 * Calcule l'urgence d'un devoir ou d'une évaluation :
 * 1. Déjà terminé -> 'low' (plus urgent du tout)
 * 2. Échéance imminente (passée, aujourd'hui, demain <= 1 jour restant) -> URGENT ('high')
 * 3. Épreuve programmée (interro, examen, contrôle, DS) sous 3 jours -> URGENT ('high')
 * 4. Poids / coefficient important (weight >= 2) sous 4 jours -> URGENT ('high')
 * 5. Échéance sous 4 jours ou examen plus lointain -> MOYEN ('medium')
 * 6. Au-delà de 4 jours -> NORMAL ('low')
 */
export const calculateHomeworkUrgency = (
  dueDateStr: string,
  assignmentTypeName?: string,
  weight: number = 1,
  isCompleted: boolean = false
): 'high' | 'medium' | 'low' => {
  if (isCompleted) return 'low';

  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const [y, m, d] = dueDateStr.split('-').map(Number);
    if (!y || !m || !d) return weight >= 2 ? 'high' : 'medium';
    
    const target = new Date(y, m - 1, d);
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const isTestOrExam = assignmentTypeName ? 
      /interro|examen|contr[ôo]le|ds|test|[ée]val/i.test(assignmentTypeName) : false;

    // 1. Passé ou à rendre aujourd'hui / demain -> Urgent !
    if (diffDays <= 1) {
      return 'high';
    }

    // 2. Évaluation / examen sous 3 jours -> Urgent !
    if (isTestOrExam && diffDays <= 3) {
      return 'high';
    }

    // 3. Coefficient >= 2 sous 4 jours -> Urgent !
    if (weight >= 2 && diffDays <= 4) {
      return 'high';
    }

    // 4. Échéance sous 4 jours ou examen plus lointain -> Medium
    if (diffDays <= 4 || isTestOrExam) {
      return 'medium';
    }

    return 'low';
  } catch {
    return weight >= 2 ? 'high' : 'medium';
  }
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
    
    const weight = raw.assignmentType?.weight || 1;
    const typeName = raw.assignmentType?.name || raw.description || '';
    const isCompleted = raw.resolvedStatus === 'resolved';

    // Calcul précis de l'urgence en fonction de la date et de la nature du travail
    const priority = calculateHomeworkUrgency(dueDate, typeName, weight, isCompleted);

    return {
      id: raw.id || `hw_${dueDate}_${Math.random().toString(36).substring(2, 7)}`,
      subject,
      subjectCode,
      color: mapColor(raw.color),
      title,
      description: raw.assignmentType?.name || raw.description || 'Travail à réaliser',
      dueDate,
      dueTime,
      estimatedTimeMinutes: 30,
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
 * Vérifie si une chaîne est un texte générique d'image (ex: "Image de profil", "Photo de profil")
 */
export const isGenericImagePlaceholder = (str?: string | null): boolean => {
  if (!str) return true;
  const clean = str.trim().toLowerCase();
  
  const blockedTerms = [
    'image de profil',
    'image de profile',
    'photo de profil',
    'photo de profile',
    'image',
    'de profil',
    'de profile',
    'avatar',
    'profielfoto',
    'profile picture',
    'profil',
    'profile',
    'utilisateur',
    'user',
    'inconnu',
    'undefined',
    'null',
    'photo',
    'picture',
    'image de profil de l\'utilisateur',
    'photo de profil de l\'utilisateur',
    'profielfoto van de gebruiker'
  ];

  if (blockedTerms.includes(clean)) return true;
  if (/^(image|photo|picture|avatar|profielfoto)\s*(de\s*profi?le?|van)?$/i.test(clean)) return true;
  if (/^image\s*de\s*profi?le?\s*(de\s*l['’]utilisateur)?$/i.test(clean)) return true;
  return false;
};

/**
 * Nettoie une chaîne de nom en enlevant les préfixes de balises alt / title
 */
export const cleanProfileName = (rawName?: string | null): string => {
  if (!rawName) return '';
  let clean = rawName.trim();
  
  // Retirer les préfixes courants (ex: "Photo de profil de Lucas Dupont", "Image de profil : Lucas Dupont")
  clean = clean.replace(/^(image|photo|picture|avatar|profielfoto)\s*(de\s*profil\s*(de\s*l['’]utilisateur|d['’]|de)?|van|of)?\s*:?\s*/i, '').trim();
  clean = clean.replace(/^(utilisateur\s*:?|user\s*:?)\s*/i, '').trim();

  if (isGenericImagePlaceholder(clean)) return '';
  return clean;
};

/**
 * Découpe un nom complet en prénom et nom de famille
 */
export const splitFullName = (fullName: string): { firstName: string; lastName: string } => {
  const clean = cleanProfileName(fullName);
  if (!clean) return { firstName: '', lastName: '' };

  const parts = clean.split(/\s+/);
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: '' };
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
          if (match.name.firstName && !isGenericImagePlaceholder(match.name.firstName)) {
            firstName = match.name.firstName;
          }
          if (match.name.lastName && !isGenericImagePlaceholder(match.name.lastName)) {
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
          if (organiser.name.firstName && !isGenericImagePlaceholder(organiser.name.firstName)) {
            firstName = organiser.name.firstName;
          }
          if (organiser.name.lastName && !isGenericImagePlaceholder(organiser.name.lastName)) {
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

  // Filtrage final anti-placeholder
  if (isGenericImagePlaceholder(firstName)) firstName = undefined;
  if (isGenericImagePlaceholder(lastName)) lastName = undefined;

  return { schoolName, studentClass, firstName, lastName, avatar };
};
