/**
 * Convertisseurs et Parsers pour les données Smartschool REST API v1
 * 
 * Transforme les payloads bruts renvoyés par Smartschool (/planner/api/v1/...)
 * en structures de données BetterSchool strictement typées (CourseEvent, Homework, Student).
 */

import { 
  CourseEvent, 
  Homework, 
  DayOfWeek, 
  EventType, 
  EventStatus,
  Grade,
  GradeGoal,
  SubjectReport,
  SkoreEvaluation
} from '../types/school';
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

// ==========================================
// 📊 MODULE SKORE — RÉSULTATS & ÉVALUATIONS
// ==========================================

/**
 * Extrait les points obtenus et le dénominateur depuis une description textuelle.
 * Gère "35,5/40", "8/10", "3/5", etc.
 */
export const parseScoreDescription = (
  desc?: string | null
): { obtained: number; total: number } | null => {
  if (!desc || typeof desc !== 'string') return null;
  const cleaned = desc.trim();
  const match = cleaned.match(/^([\d,.]+)\s*\/\s*([\d,.]+)$/);
  if (!match) return null;

  const obtained = parseFloat(match[1].replace(',', '.'));
  const total = parseFloat(match[2].replace(',', '.'));

  if (isNaN(obtained) || isNaN(total) || total <= 0) return null;
  return { obtained, total };
};

/**
 * Détecte formellement un travail formatif (exercice d'entraînement qui ne compte pas au bulletin).
 */
export const isFormativeEvaluation = (ev: SkoreEvaluation): boolean => {
  if (ev.component?.abbreviation?.toUpperCase() === 'F') return true;
  if (/formatif/i.test(ev.component?.name || '')) return true;
  if (/\bformatif\b/i.test(ev.name || '')) return true;
  return false;
};

/**
 * Extrait le score chiffré complet d'une évaluation (normale ou projet LPD).
 */
export const extractScoreFromEvaluation = (
  ev: SkoreEvaluation
): {
  obtained: number;
  total: number;
  rawText: string;
  percentage: number;
  goals?: GradeGoal[];
} | null => {
  // Cas 1 : Évaluation de type "project" avec objectifs d'apprentissage (LPD)
  if (ev.type === 'project' && ev.details?.projectGoals && ev.details.projectGoals.length > 0) {
    const goals: GradeGoal[] = [];
    let sumObtained = 0;
    let sumTotal = 0;

    for (const g of ev.details.projectGoals) {
      const parsed = parseScoreDescription(g.graphic?.description);
      if (parsed) {
        sumObtained += parsed.obtained;
        sumTotal += parsed.total;
        const pct = typeof g.graphic?.value === 'number'
          ? g.graphic.value
          : Math.round((parsed.obtained / parsed.total) * 100);

        goals.push({
          title: g.goal?.leerplanKey || 'Objectif',
          scoreText: g.graphic?.description || `${parsed.obtained}/${parsed.total}`,
          obtained: parsed.obtained,
          total: parsed.total,
          percentage: pct,
          color: g.graphic?.color
        });
      }
    }

    if (sumTotal > 0) {
      const percentage = Math.round((sumObtained / sumTotal) * 100);
      return {
        obtained: sumObtained,
        total: sumTotal,
        rawText: `${sumObtained}/${sumTotal}`,
        percentage,
        goals
      };
    }
  }

  // Cas 2 : Description directe X/Y (ex: "35,5/40")
  if (ev.graphic?.description) {
    const parsed = parseScoreDescription(ev.graphic.description);
    if (parsed) {
      const pct = typeof ev.graphic.value === 'number'
        ? ev.graphic.value
        : Math.round((parsed.obtained / parsed.total) * 100);

      return {
        obtained: parsed.obtained,
        total: parsed.total,
        rawText: ev.graphic.description,
        percentage: pct
      };
    }
  }

  // Cas 3 : Pourcentage brut (ex: value: 89)
  if (typeof ev.graphic?.value === 'number' && ev.graphic.value >= 0) {
    return {
      obtained: ev.graphic.value,
      total: 100,
      rawText: `${ev.graphic.value}%`,
      percentage: ev.graphic.value
    };
  }

  return null;
};

/**
 * Prédicat robuste déterminant si un devoir doit être comptabilisé dans la moyenne.
 */
export const doesEvaluationCountInAverage = (
  ev: SkoreEvaluation,
  isManuallyExcluded: boolean = false
): boolean => {
  if (isManuallyExcluded) return false;
  if (ev.doesCount === false) return false;
  if (ev.isPublished === false) return false;
  if (isFormativeEvaluation(ev)) return false;

  const score = extractScoreFromEvaluation(ev);
  if (!score || score.total <= 0) return false;

  return true;
};

/**
 * Extrait le volume horaire hebdomadaire d'un cours (ex: "Math. Imm. (5h)" -> 5).
 * Renvoie 1 par défaut si aucun chiffre d'heure n'est mentionné.
 */
export const extractHoursFromCourseName = (courseName?: string): number => {
  if (!courseName) return 1;
  const match = courseName.match(/\((\d+)\s*h\)/i);
  if (match && match[1]) {
    const parsed = parseInt(match[1], 10);
    if (!isNaN(parsed) && parsed > 0) return parsed;
  }
  return 1;
};

/**
 * Convertit une SkoreEvaluation en objet Grade BetterSchool.
 */
export const parseSkoreEvaluationToGrade = (
  ev: SkoreEvaluation,
  isManuallyExcluded: boolean = false
): Grade => {
  const score = extractScoreFromEvaluation(ev);
  const course = ev.courses?.[0];
  const subjectName = course?.name || 'Matière';
  const teacherObj = ev.gradebookOwner || course?.teachers?.[0];

  const teacherName = teacherObj?.name?.startingWithFirstName || 
                      teacherObj?.name?.startingWithLastName || 
                      'Enseignant';

  const teacherPhoto = teacherObj?.pictureUrl || '';
  const isSommatif = !isFormativeEvaluation(ev);

  // Note ramenée sur 20 pour compatibilité d'affichage
  const noteSur20 = score && score.total > 0
    ? Number(((score.obtained / score.total) * 20).toFixed(2))
    : 0;

  // Extraction propre des feedbacks textuels s'ils existent
  const feedbacksList: string[] = [];
  const rawFeedbacks = [...(ev.feedbacks || []), ...(ev.feedback || [])];
  for (const f of rawFeedbacks) {
    if (typeof f === 'string' && f.trim()) {
      feedbacksList.push(f.trim());
    } else if (f && typeof f === 'object') {
      const txt = f.text || f.comment || f.message || f.body;
      if (txt && typeof txt === 'string' && txt.trim()) {
        feedbacksList.push(txt.trim());
      }
    }
  }

  return {
    id: ev.identifier,
    subject: subjectName,
    subjectCode: subjectName.substring(0, 4).toUpperCase(),
    value: noteSur20,
    maxValue: 20,
    coefficient: score?.total || 1,
    title: ev.name,
    date: ev.date ? ev.date.substring(0, 10) : '',
    period: ev.period?.name || 'Septembre - Décembre',
    type: isSommatif ? 'Sommatif' : 'Formatif',
    obtainedPoints: score?.obtained,
    totalPoints: score?.total,
    rawScoreText: score?.rawText || ev.graphic?.description || '—',
    isSommatif,
    isManuallyExcluded,
    color: ev.graphic?.color || 'indigo',
    teacherName,
    teacherPhoto,
    availabilityDate: ev.availabilityDate,
    feedbacks: feedbacksList.length > 0 ? feedbacksList : undefined,
    goals: score?.goals,
    evaluationType: ev.type === 'project' ? 'project' : 'normal'
  };
};

/**
 * Construit l'ensemble des SubjectReports et les statistiques globales
 * à partir de la liste des évaluations réelles Smartschool.
 */
export const buildSubjectReportsFromEvaluations = (
  evaluations: SkoreEvaluation[],
  excludedGradeIds: Set<string> = new Set(),
  targetPeriod?: string
): {
  reports: SubjectReport[];
  overallAveragePct: number;
  overallAverage20: number;
  totalWeeklyHours: number;
  periods: string[];
} => {
  // 1. Extraire la liste des périodes uniques
  const periodSet = new Set<string>();
  evaluations.forEach(ev => {
    if (ev.period?.name) periodSet.add(ev.period.name);
  });
  const periods = Array.from(periodSet);

  // 2. Filtrer par période cible si spécifiée
  const filteredEvals = targetPeriod
    ? evaluations.filter(ev => ev.period?.name === targetPeriod)
    : evaluations;

  // 3. Regrouper par matière
  const courseMap = new Map<string, {
    courseName: string;
    teacherName: string;
    hours: number;
    evals: SkoreEvaluation[];
  }>();

  for (const ev of filteredEvals) {
    const course = ev.courses?.[0];
    const courseName = course?.name || 'Autre matière';
    const teacherName = ev.gradebookOwner?.name?.startingWithFirstName || 
                        ev.gradebookOwner?.name?.startingWithLastName || 
                        'Enseignant';

    if (!courseMap.has(courseName)) {
      courseMap.set(courseName, {
        courseName,
        teacherName,
        hours: extractHoursFromCourseName(courseName),
        evals: []
      });
    }
    courseMap.get(courseName)!.evals.push(ev);
  }

  // 4. Calculer la moyenne de chaque matière
  const reports: SubjectReport[] = [];
  let totalWeightedPercentage = 0;
  let totalActiveHours = 0;

  for (const [courseName, data] of courseMap.entries()) {
    const grades: Grade[] = [];
    let sumObtained = 0;
    let sumTotal = 0;

    for (const ev of data.evals) {
      const isExcluded = excludedGradeIds.has(ev.identifier);
      const grade = parseSkoreEvaluationToGrade(ev, isExcluded);
      grades.push(grade);

      // Vérifier si le devoir compte dans la moyenne
      if (doesEvaluationCountInAverage(ev, isExcluded)) {
        const score = extractScoreFromEvaluation(ev);
        if (score && score.total > 0) {
          sumObtained += score.obtained;
          sumTotal += score.total;
        }
      }
    }

    // Calcul de la moyenne du cours
    const hasGrades = sumTotal > 0;
    const coursePct = hasGrades ? Number(((sumObtained / sumTotal) * 100).toFixed(1)) : 0;
    const courseSur20 = Number(((coursePct / 100) * 20).toFixed(2));

    if (hasGrades) {
      totalWeightedPercentage += coursePct * data.hours;
      totalActiveHours += data.hours;
    }

    reports.push({
      subject: courseName,
      subjectCode: courseName.substring(0, 4).toUpperCase(),
      color: '#6366f1',
      teacher: data.teacherName,
      coefficient: data.hours,
      studentAverage: coursePct, // Moyenne du cours sur 100
      grades,
      hoursPerWeek: data.hours,
      totalObtained: sumObtained,
      totalPossible: sumTotal
    });
  }

  // Tri par ordre alphabétique des matières
  reports.sort((a, b) => a.subject.localeCompare(b.subject));

  // 5. Calcul de la moyenne générale pondérée par le volume horaire
  const overallAveragePct = totalActiveHours > 0
    ? Number((totalWeightedPercentage / totalActiveHours).toFixed(1))
    : 0;

  const overallAverage20 = Number(((overallAveragePct / 100) * 20).toFixed(2));

  return {
    reports,
    overallAveragePct,
    overallAverage20,
    totalWeeklyHours: totalActiveHours,
    periods
  };
};

