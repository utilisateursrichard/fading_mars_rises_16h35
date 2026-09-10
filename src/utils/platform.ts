
/**
 * Utilitaire pour détecter l'environnement d'exécution de BetterSchool.
 */

export const isInsideSmartschool = (): boolean => {
  if (typeof window === 'undefined') return false;

  try {
    // 1. Est-ce que nous sommes directement sur le domaine smartschool (ex: injection DOM) ?
    if (window.location.hostname.includes('smartschool')) {
      return true;
    }

    // 2. Est-ce que BetterSchool est affiché dans une iframe (l'overlay du bookmarklet) ?
    if (window.self !== window.top) {
      return true;
    }

    // 3. Est-ce que le referrer provient de Smartschool ?
    if (document.referrer && document.referrer.toLowerCase().includes('smartschool')) {
      return true;
    }

    // 4. Paramètre d'URL explicite (ex: ?source=smartschool)
    const params = new URLSearchParams(window.location.search);
    if (params.get('source') === 'smartschool' || params.get('embed') === 'true') {
      return true;
    }

    return false;
  } catch {
    // En cas d'erreur de sécurité cross-origin sur window.top, cela signifie qu'on est dans une iframe
    return true;
  }
};

