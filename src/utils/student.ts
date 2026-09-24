/**
 * Utilitaires pour le profil élève et la validation de la classe.
 * Évite les faux positifs Smartschool tels que le groupe global "Tout le monde" ou "Iedereen".
 */

export const isInvalidClassCandidate = (val?: string | null): boolean => {
  if (!val || typeof val !== 'string') return true;
  const cleaned = val.trim().toLowerCase();
  if (cleaned.length === 0 || cleaned.length > 35) return true;

  if (
    cleaned.includes('tout le monde') ||
    cleaned.includes('iedereen') ||
    cleaned.includes('tous les') ||
    cleaned.includes('alle leerlingen') ||
    cleaned.includes('alle gebruikers')
  ) {
    return true;
  }

  const exactBlacklist = [
    'élèves', 'élève', 'eleves', 'eleve', 'leerlingen', 'leerling', 'students', 'student',
    'utilisateurs', 'utilisateur', 'gebruikers', 'gebruiker', 'users', 'user',
    'tous', 'all', 'leerkrachten', 'enseignants', 'enseignant', 'professeurs', 'professeur', 'teachers', 'teacher',
    'parents', 'parent', 'ouders', 'ouder',
    'personnel', 'personeel', 'staff', 'direction', 'administration',
    'classe', 'class', 'group', 'groupe', 'default', 'général', 'general',
    'non connecté', 'not connected', 'n/a', 'null', 'undefined', '--'
  ];

  return exactBlacklist.includes(cleaned);
};

export const cleanStudentClass = (val?: string | null): string => {
  if (!val || isInvalidClassCandidate(val)) return '';
  return val.trim();
};
