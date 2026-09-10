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
 * Convertit un élément de planning brut Smartschool en CourseEvent BetterSchool
 */
export const parseSmartschoolCourse = (raw: any): CourseEvent | null => {
  try {
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

    // Type d'événement
    let type: EventType = 'cours';
    if (raw.assignmentType || raw.plannedElementType === 'planned-assignments' || raw.period?.deadline) {
      type = 'ds';
    } else if (subject.toLowerCase().includes('tp') || subjectCode.includes('TP')) {
      type = 'tp';
    } else if (subject.toLowerCase().includes('td') || subjectCode.includes('TD')) {
      type = 'td';
    }

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
      type,
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
    
    // Poids ou type pour la priorité
    const weight = raw.assignmentType?.weight || 1;
    const priority = weight >= 2 ? 'high' : 'medium';
    
    // Statut résolu
    const isCompleted = raw.resolvedStatus === 'resolved';

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
 * Extrait les métadonnées de l'élève et de l'école depuis un payload de planning
 */
export const extractMetadataFromPlanner = (rawItems: any[]): { schoolName?: string; studentClass?: string } => {
  let schoolName: string | undefined;
  let studentClass: string | undefined;

  for (const item of rawItems) {
    if (!schoolName && item.locations?.[0]?.platformName) {
      schoolName = item.locations[0].platformName;
    }
    if (!studentClass && item.participants?.groups?.[0]?.name) {
      studentClass = item.participants.groups[0].name;
    }
    if (schoolName && studentClass) break;
  }

  return { schoolName, studentClass };
};
