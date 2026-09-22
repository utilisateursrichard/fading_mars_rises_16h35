/**
 * BETTERSCHOOL — GESTION DU MODE DÉMO & FEATURE FLAGS
 * 
 * Cette architecture permet de basculer entre le Mode Démo (maquette complète avec
 * fausses données) et le Mode Réel (données connectées à Smartschool).
 * 
 * 💡 RÈGLE D'OR (Anti-code mort) :
 * La propriété `isReadyInLive?: boolean` est FACULTATIVE.
 * - Si absente ou false : la fonctionnalité reste en mode démo ou affiche l'état vide en mode réel.
 * - Dès qu'un module réel est connecté à Smartschool, il suffit de passer `isReadyInLive: true`.
 * - Une fois le projet 100% terminé, il suffira de désactiver le mode démo sans casser l'UI.
 */

export type FeatureKey = 
  | 'dashboard'
  | 'agenda'
  | 'messages'
  | 'results'
  | 'courses'
  | 'tutor'
  | 'book';

export interface FeatureConfig {
  id: FeatureKey;
  label: string;
  description: string;
  /**
   * Optionnel : Indique si ce module est déjà fonctionnel en Mode Réel.
   * False ou non renseigné = uniquement disponible en Mode Démo pour le moment.
   */
  isReadyInLive?: boolean;
}

export const FEATURES_REGISTRY: Record<FeatureKey, FeatureConfig> = {
  dashboard: {
    id: 'dashboard',
    label: "Vue d'ensemble",
    description: "Tableau de bord principal, prochain cours et devoirs urgents",
    isReadyInLive: true,
  },
  agenda: {
    id: 'agenda',
    label: "Agenda",
    description: "Planning dynamique, cours et devoirs",
    isReadyInLive: true,
  },
  messages: {
    id: 'messages',
    label: "Messagerie",
    description: "Boîte de réception et fils de discussion",
    isReadyInLive: false,
  },
  results: {
    id: 'results',
    label: "Notes & Résultats",
    description: "Bulletins, moyennes et simulateur de notes",
    isReadyInLive: true,
  },
  courses: {
    id: 'courses',
    label: "Espace Cours",
    description: "Supports pédagogiques et documents partagés",
    isReadyInLive: false,
  },
  tutor: {
    id: 'tutor',
    label: "Tuteur IA",
    description: "Assistant d'apprentissage contextuel et méthodologique",
    isReadyInLive: true,
  },
  book: {
    id: 'book',
    label: "Bookmarklet",
    description: "Page d'installation du favori Chrome",
    isReadyInLive: true, // Le bookmarklet est déjà fonctionnel
  }
};

/**
 * Vérifie si une fonctionnalité est prête à être affichée en mode réel.
 */
export const isFeatureReadyInLive = (featureKey: string): boolean => {
  const feature = FEATURES_REGISTRY[featureKey as FeatureKey];
  return Boolean(feature?.isReadyInLive);
};

