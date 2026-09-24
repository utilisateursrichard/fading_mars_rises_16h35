import { Grade, SubjectReport } from '../types/school';

/**
 * Normalise une note sur 20
 */
export const normalizeGradeTo20 = (value: number, maxValue: number = 20): number => {
  if (typeof value !== 'number' || isNaN(value)) return 0;
  if (!maxValue || maxValue <= 0) return value;
  return (value / maxValue) * 20;
};

/**
 * Détermine si une note est formative (ne compte pas dans la moyenne)
 */
export const isGradeFormative = (grade?: Grade | null): boolean => {
  if (!grade) return false;
  if (grade.isFormative === true) return true;
  if (grade.coefficient === 0) return true;
  const type = String(grade.type || '').toLowerCase();
  const title = String(grade.title || '').toLowerCase();
  return type.includes('formativ') || title.includes('formativ');
};

/**
 * Détermine si une matière n'a QUE des notes formatives (ou aucune note sommative)
 */
export const isSubjectFormativeOnly = (report?: SubjectReport | null): boolean => {
  if (!report) return true;
  if (report.isFormativeOnly === true) return true;
  if (!report.grades || report.grades.length === 0) {
    return report.studentAverage === null || report.studentAverage === undefined || isNaN(report.studentAverage);
  }
  // S'il n'y a aucune note sommative avec un coefficient > 0
  return report.grades.every(g => isGradeFormative(g));
};

/**
 * Calcule la moyenne pondérée des évaluations sommatives (sur 20)
 * Renvoie null si la matière n'a que des notes formatives ou aucune note sommative.
 */
export const calculateGradesAverage = (grades?: Grade[] | null, fallback: number | null = null): number | null => {
  if (!grades || grades.length === 0) return fallback;

  const summativeGrades = grades.filter(g => !isGradeFormative(g) && (g.coefficient ?? 1) > 0);
  if (summativeGrades.length === 0) {
    return null; // Exclusivement des notes formatives -> N/A
  }

  let totalWeighted = 0;
  let totalCoeffs = 0;

  for (const g of summativeGrades) {
    const val20 = normalizeGradeTo20(g.value, g.maxValue);
    const coef = g.coefficient > 0 ? g.coefficient : 1;
    totalWeighted += val20 * coef;
    totalCoeffs += coef;
  }

  return totalCoeffs > 0 ? Number((totalWeighted / totalCoeffs).toFixed(2)) : null;
};

/**
 * Calcule la moyenne générale pondérée par les coefficients officiels des matières (sur 20)
 * Ignore complètement les matières formatives ou sans note pour ne pas fausser la moyenne générale.
 */
export const calculateOverallAverage = (
  reports: SubjectReport[]
): { current: number; classAvg: number; minAvg: number; maxAvg: number } => {
  if (!reports || reports.length === 0) {
    return { current: 0, classAvg: 0, minAvg: 0, maxAvg: 0 };
  }

  let totalStudentWeighted = 0;
  let totalClassWeighted = 0;
  let totalMinWeighted = 0;
  let totalMaxWeighted = 0;
  let totalCoeffs = 0;

  for (const rep of reports) {
    if (isSubjectFormativeOnly(rep)) {
      // Ignorer les matières uniquement formatives dans le calcul de la moyenne générale
      continue;
    }

    const studentAvg = rep.grades && rep.grades.length > 0
      ? calculateGradesAverage(rep.grades, rep.studentAverage)
      : rep.studentAverage;

    if (studentAvg === null || studentAvg === undefined || isNaN(studentAvg)) {
      continue;
    }

    const coeff = rep.coefficient > 0 ? rep.coefficient : 1;
    totalStudentWeighted += studentAvg * coeff;
    
    if (rep.classAverage !== null && rep.classAverage !== undefined) {
      totalClassWeighted += rep.classAverage * coeff;
    } else {
      totalClassWeighted += studentAvg * coeff;
    }

    if (rep.minAverage !== null && rep.minAverage !== undefined) {
      totalMinWeighted += rep.minAverage * coeff;
    }
    if (rep.maxAverage !== null && rep.maxAverage !== undefined) {
      totalMaxWeighted += rep.maxAverage * coeff;
    }

    totalCoeffs += coeff;
  }

  return {
    current: totalCoeffs > 0 ? Number((totalStudentWeighted / totalCoeffs).toFixed(2)) : 0,
    classAvg: totalCoeffs > 0 ? Number((totalClassWeighted / totalCoeffs).toFixed(2)) : 0,
    minAvg: totalCoeffs > 0 ? Number((totalMinWeighted / totalCoeffs).toFixed(2)) : 0,
    maxAvg: totalCoeffs > 0 ? Number((totalMaxWeighted / totalCoeffs).toFixed(2)) : 0
  };
};

/**
 * Résultat de simulation d'une note
 */
export interface SimulationResult {
  subjectName: string;
  subjectCode: string;
  currentSubjectAvg: number | null; // null si matière sans note sommative / formative
  newSubjectAvg: number;
  subjectDiff: number | null; // null si première note sommative
  currentOverall: number;
  newOverall: number;
  overallDiff: number;
  isInitialFormativeOnly: boolean;
}

/**
 * Simule l'impact d'une note hypothétique sur la matière et sur la moyenne générale
 */
export const simulateNewGrade = (
  reports: SubjectReport[],
  simSubjectCode: string,
  simGradeValue: number,
  simCoefficient: number,
  currentOverallOverride?: number
): SimulationResult | null => {
  if (!reports || reports.length === 0) return null;

  const targetReport = reports.find(r => r.subjectCode === simSubjectCode);
  if (!targetReport) return null;

  const isInitialFormative = isSubjectFormativeOnly(targetReport);

  // 1. Calcul de la moyenne de la matière actuelle (null si formative uniquement)
  const currentSubjectAvg = isInitialFormative
    ? null
    : (targetReport.grades && targetReport.grades.length > 0
        ? calculateGradesAverage(targetReport.grades, targetReport.studentAverage)
        : targetReport.studentAverage);

  // 2. Calcul de la nouvelle moyenne de la matière
  let newSubjectAvg: number;
  const summativeGrades = targetReport.grades ? targetReport.grades.filter(g => !isGradeFormative(g) && g.coefficient > 0) : [];
  
  if (summativeGrades.length > 0) {
    let currentWeight = 0;
    let currentCoeffs = 0;
    for (const g of summativeGrades) {
      currentWeight += normalizeGradeTo20(g.value, g.maxValue) * g.coefficient;
      currentCoeffs += g.coefficient;
    }
    const newWeight = currentWeight + (simGradeValue * simCoefficient);
    const newCoeffs = currentCoeffs + simCoefficient;
    newSubjectAvg = newCoeffs > 0 ? Number((newWeight / newCoeffs).toFixed(2)) : simGradeValue;
  } else {
    // Aucune note sommative précédente : la nouvelle note devient la seule note sommative
    newSubjectAvg = simGradeValue;
  }

  const subjectDiff = currentSubjectAvg !== null ? Number((newSubjectAvg - currentSubjectAvg).toFixed(2)) : null;

  // 3. Calcul de la moyenne générale avant et après simulation
  const currentOverallStats = calculateOverallAverage(reports);
  const currentOverall = currentOverallOverride !== undefined ? currentOverallOverride : currentOverallStats.current;

  let totalStudentWeighted = 0;
  let totalCoeffs = 0;

  for (const rep of reports) {
    const coeff = rep.coefficient > 0 ? rep.coefficient : 1;
    if (rep.subjectCode === simSubjectCode) {
      // Intègre maintenant la matière avec sa nouvelle moyenne sommative
      totalStudentWeighted += newSubjectAvg * coeff;
      totalCoeffs += coeff;
    } else {
      if (isSubjectFormativeOnly(rep)) {
        continue;
      }
      const sAvg = rep.grades && rep.grades.length > 0
        ? calculateGradesAverage(rep.grades, rep.studentAverage)
        : rep.studentAverage;
      if (sAvg !== null && sAvg !== undefined && !isNaN(sAvg)) {
        totalStudentWeighted += sAvg * coeff;
        totalCoeffs += coeff;
      }
    }
  }

  const newOverall = totalCoeffs > 0 ? Number((totalStudentWeighted / totalCoeffs).toFixed(2)) : currentOverall;
  const overallDiff = Number((newOverall - currentOverall).toFixed(2));

  return {
    subjectName: targetReport.subject,
    subjectCode: targetReport.subjectCode,
    currentSubjectAvg,
    newSubjectAvg,
    subjectDiff,
    currentOverall,
    newOverall,
    overallDiff,
    isInitialFormativeOnly: isInitialFormative
  };
};
