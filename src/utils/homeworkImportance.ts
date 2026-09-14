/**
 * Mesure l'importance actuelle d'un devoir sur une échelle de 0 à 10.
 * L'échéance compte pour 0 à 6 points, un contrôle pour 2 points et un
 * examen pour 4 points. La durée estimée n'entre pas dans le calcul.
 */
export const calculateHomeworkImportance = (
  dueDateStr: string,
  assignmentTypeName = '',
  isCompleted = false
): number => {
  if (isCompleted) return 0;

  const [year, month, day] = dueDateStr.split('-').map(Number);
  if (!year || !month || !day) return 3;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dueDate = new Date(year, month - 1, day);
  const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / 86_400_000);

  if (daysUntilDue < 0) return 0;

  const deadlinePoints =
    daysUntilDue === 0 ? 6 :
    daysUntilDue === 1 ? 5 :
    daysUntilDue === 2 ? 4 :
    daysUntilDue <= 4 ? 3 :
    daysUntilDue <= 7 ? 2 :
    daysUntilDue <= 14 ? 1 : 0;
  const isExam = /examen|exam/i.test(assignmentTypeName);
  const isAssessment = /interro|contr[ôo]le|ds|test|[ée]val/i.test(assignmentTypeName);
  const assessmentPoints = isExam ? 4 : isAssessment ? 2 : 0;

  return Math.min(10, deadlinePoints + assessmentPoints);
};

export const getHomeworkPriority = (importance: number): 'high' | 'medium' | 'low' => {
  if (importance >= 5) return 'high';
  if (importance > 0) return 'medium';
  return 'low';
};
