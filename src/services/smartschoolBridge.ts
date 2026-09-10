/**
 * Pont de communication Same-Origin avec Smartschool (via postMessage)
 * 
 * Lorsque BetterSchool est injecté par-dessus Smartschool via le Bookmarklet,
 * l'iframe envoie ses requêtes à la page parente (hôte Smartschool) qui les
 * exécute avec la session de l'élève sans aucun blocage CORS.
 */

export interface BridgeResponse {
  ok: boolean;
  status: number;
  body?: string;
  error?: string;
}

/**
 * Exécute un appel Same-Origin sur Smartschool depuis l'iframe
 * @param url Chemin relatif sur Smartschool (ex: '/agenda', '/api/results')
 * @param options Options de fetch (method, headers, body)
 */
export const fetchSmartschool = (url: string, options?: RequestInit): Promise<BridgeResponse> => {
  return new Promise((resolve) => {
    // Si on n'est pas dans l'iframe Smartschool
    if (typeof window === 'undefined' || window.parent === window) {
      resolve({
        ok: false,
        status: 0,
        error: 'BetterSchool n\'est pas exécuté dans le contexte d\'un bookmarklet Smartschool.'
      });
      return;
    }

    const id = 'bs_req_' + Math.random().toString(36).substring(2, 9);

    const timeout = setTimeout(() => {
      window.removeEventListener('message', handleResponse);
      resolve({
        ok: false,
        status: 408,
        error: 'Délai d\'attente de réponse Smartschool dépassé (15s).'
      });
    }, 15000);

    const handleResponse = (ev: MessageEvent) => {
      if (ev.data && ev.data.type === 'BETTERSCHOOL_RES' && ev.data.id === id) {
        clearTimeout(timeout);
        window.removeEventListener('message', handleResponse);
        resolve({
          ok: ev.data.ok,
          status: ev.data.status,
          body: ev.data.body,
          error: ev.data.error
        });
      }
    };

    window.addEventListener('message', handleResponse);

    window.parent.postMessage({
      type: 'BETTERSCHOOL',
      action: 'FETCH',
      id,
      url,
      options
    }, '*');
  });
};

export interface HostQuery {
  key: string;
  selector: string;
  attr: string; // 'text', 'src', 'href', etc.
}

export interface DomQueryResult {
  ok: boolean;
  results?: Record<string, string | null>;
  error?: string;
}

/**
 * Interroge le DOM de la page hôte de façon générique (ex: sélecteurs de titre, avatar, nom)
 */
export const queryHostDOM = (queries: HostQuery[]): Promise<DomQueryResult> => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || window.parent === window) {
      resolve({ ok: false, error: 'Pas dans le contexte d\'un bookmarklet hôte.' });
      return;
    }

    const id = 'bs_dom_' + Math.random().toString(36).substring(2, 9);

    const timeout = setTimeout(() => {
      window.removeEventListener('message', handleResponse);
      resolve({ ok: false, error: 'Délai dépassé pour la requête DOM hôte.' });
    }, 5000);

    const handleResponse = (ev: MessageEvent) => {
      if (ev.data && ev.data.type === 'BETTERSCHOOL_RES' && ev.data.id === id) {
        clearTimeout(timeout);
        window.removeEventListener('message', handleResponse);
        resolve({
          ok: ev.data.ok,
          results: ev.data.results,
          error: ev.data.error
        });
      }
    };

    window.addEventListener('message', handleResponse);

    window.parent.postMessage({
      type: 'BETTERSCHOOL',
      action: 'QUERY_DOM',
      id,
      queries
    }, '*');
  });
};

export interface HostPageInfo {
  ok: boolean;
  data?: {
    url: string;
    origin: string;
    title: string;
  };
  error?: string;
}

/**
 * Récupère les métadonnées de la page hôte (URL courante, titre, origine)
 */
export const getHostPageInfo = (): Promise<HostPageInfo> => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || window.parent === window) {
      resolve({ ok: false, error: 'Pas dans le contexte d\'un bookmarklet hôte.' });
      return;
    }

    const id = 'bs_info_' + Math.random().toString(36).substring(2, 9);

    const timeout = setTimeout(() => {
      window.removeEventListener('message', handleResponse);
      resolve({ ok: false, error: 'Délai dépassé pour la requête Host Info.' });
    }, 5000);

    const handleResponse = (ev: MessageEvent) => {
      if (ev.data && ev.data.type === 'BETTERSCHOOL_RES' && ev.data.id === id) {
        clearTimeout(timeout);
        window.removeEventListener('message', handleResponse);
        resolve({
          ok: ev.data.ok,
          data: ev.data.data,
          error: ev.data.error
        });
      }
    };

    window.addEventListener('message', handleResponse);

    window.parent.postMessage({
      type: 'BETTERSCHOOL',
      action: 'GET_PAGE_INFO',
      id
    }, '*');
  });
};

export interface HostEvalResult {
  ok: boolean;
  result?: any;
  error?: string;
}

/**
 * Évalue une expression JavaScript dans le contexte de la page hôte via la passerelle
 */
export const evalHostExpression = (expression: string): Promise<HostEvalResult> => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || window.parent === window) {
      resolve({ ok: false, error: 'Pas dans le contexte d\'un bookmarklet hôte.' });
      return;
    }

    const id = 'bs_eval_' + Math.random().toString(36).substring(2, 9);

    const timeout = setTimeout(() => {
      window.removeEventListener('message', handleResponse);
      resolve({ ok: false, error: 'Délai dépassé pour l\'évaluation hôte.' });
    }, 5000);

    const handleResponse = (ev: MessageEvent) => {
      if (ev.data && ev.data.type === 'BETTERSCHOOL_RES' && ev.data.id === id) {
        clearTimeout(timeout);
        window.removeEventListener('message', handleResponse);
        resolve({
          ok: ev.data.ok,
          result: ev.data.result,
          error: ev.data.error
        });
      }
    };

    window.addEventListener('message', handleResponse);

    window.parent.postMessage({
      type: 'BETTERSCHOOL',
      action: 'EVAL',
      id,
      expression
    }, '*');
  });
};

/**
 * Met à jour le titre de l'onglet hôte Smartschool depuis l'iframe
 */
export const setParentTabTitle = (title: string): void => {
  if (typeof window !== 'undefined' && window.parent !== window) {
    window.parent.postMessage({
      type: 'BETTERSCHOOL',
      action: 'SET_TITLE',
      title
    }, '*');
  }
};

/**
 * Demande la fermeture propre de l'overlay BetterSchool depuis l'iframe
 */
export const requestCloseOverlay = (): void => {
  if (typeof window !== 'undefined' && window.parent !== window) {
    window.parent.postMessage({
      type: 'BETTERSCHOOL',
      action: 'CLOSE'
    }, '*');
  }
};

export interface InitUserData {
  avatar?: string;
  fullName?: string;
  userId?: string;
  schoolName?: string;
}

/**
 * Écoute les données de profil et d'identification transmises dynamiquement par Smartschool
 */
export const listenForInitData = (onData: (data: InitUserData) => void): (() => void) => {
  const handleMsg = (ev: MessageEvent) => {
    if (ev.data && ev.data.type === 'BETTERSCHOOL_INIT' && ev.data.payload) {
      onData(ev.data.payload);
    }
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('message', handleMsg);

    // Demande proactive au parent en cas de chargement déjà effectué
    if (window.parent !== window) {
      window.parent.postMessage({
        type: 'BETTERSCHOOL',
        action: 'GET_INIT'
      }, '*');
    }
  }

  return () => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('message', handleMsg);
    }
  };
};

