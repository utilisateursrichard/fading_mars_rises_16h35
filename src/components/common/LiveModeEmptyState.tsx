import React from 'react';
import { 
  Sparkles, 
  Construction, 
  ArrowRight,
  DatabaseZap,
  CheckCircle2
} from 'lucide-react';
import { useSchool } from '../../context/SchoolContext';
import { FEATURES_REGISTRY, FeatureKey } from '../../utils/featureFlags';

interface LiveModeEmptyStateProps {
  featureKey: string;
}

export const LiveModeEmptyState: React.FC<LiveModeEmptyStateProps> = ({ featureKey }) => {
  const { toggleDemoMode } = useSchool();
  const feature = FEATURES_REGISTRY[featureKey as FeatureKey];

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center max-w-xl mx-auto space-y-6 animate-in fade-in duration-200">
      
      {/* Icon Badge */}
      <div className="relative">
        <div className="w-16 h-16 rounded-3xl bg-slate-100 border border-slate-200/80 flex items-center justify-center text-slate-700 shadow-sm">
          <Construction className="w-8 h-8 text-indigo-600" />
        </div>
        <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-white text-[10px] font-bold shadow">
          !
        </span>
      </div>

      {/* Main Message */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-slate-100 text-slate-700 border border-slate-200">
          <DatabaseZap className="w-3.5 h-3.5 text-indigo-600" />
          <span>Mode Réel • Aucune fausse donnée</span>
        </div>

        <h2 className="text-2xl font-black text-slate-900 tracking-tight font-display">
          {feature?.label || 'Module'} non connecté
        </h2>

        <p className="text-sm text-slate-500 max-w-md leading-relaxed">
          {feature?.description ? (
            <>Le module <strong>{feature.label}</strong> est masqué car il n'est pas encore relié aux vraies données Smartschool.</>
          ) : (
            "Ce module sera disponible dès qu'il sera connecté aux données réelles de Smartschool."
          )}
        </p>
      </div>

      {/* Info Card */}
      <div className="w-full bg-white rounded-2xl border border-slate-200/80 p-4 text-left space-y-2.5 shadow-sm">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Pourquoi rien ne s'affiche ici ?</span>
        </div>
        <p className="text-xs text-slate-500 leading-relaxed pl-6">
          Vous êtes en <strong>Mode Réel</strong> : seules les fonctionnalités réellement branchées sur votre compte s'affichent pour éviter toute confusion. Au fur et à mesure du développement, chaque module connecté sera débloqué ici.
        </p>
      </div>

      {/* Button to toggle Demo Mode back on */}
      <div className="pt-2">
        <button
          onClick={toggleDemoMode}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white text-xs font-extrabold shadow-md shadow-indigo-600/20 transition-all m3-press"
        >
          <Sparkles className="w-4 h-4 text-indigo-200" />
          <span>Activer le Mode Démo pour prévisualiser</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

    </div>
  );
};

