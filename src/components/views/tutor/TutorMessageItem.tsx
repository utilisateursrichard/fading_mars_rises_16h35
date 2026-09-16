import React from 'react';
import { 
  Bot, 
  Sparkles, 
  ShieldCheck, 
  Layers, 
  ChevronRight, 
  ChevronDown, 
  AlertTriangle 
} from 'lucide-react';
import { MarkdownRenderer } from '../../common/MarkdownRenderer';
import { LLMTier } from '../../../services/aiTutorService';

export interface TutorMessage {
  id: string;
  sender: 'user' | 'tutor';
  text: string;
  time: string;
  providerName?: string;
  modelUsed?: string;
  latencyMs?: number;
  tier?: LLMTier;
  isZeroDowntimeFallback?: boolean;
  fallbackChain?: Array<{ providerId: string; providerName: string; error: string }>;
  isStreaming?: boolean;
}

interface TutorMessageItemProps {
  msg: TutorMessage;
  studentAvatar?: string;
  studentFirstName?: string;
  isExpanded: boolean;
  onToggleExpand: (id: string) => void;
}

export const TutorMessageItem: React.FC<TutorMessageItemProps> = React.memo(({
  msg,
  studentAvatar,
  studentFirstName,
  isExpanded,
  onToggleExpand
}) => {
  const isUser = msg.sender === 'user';
  const hasFallback = Boolean(msg.fallbackChain && msg.fallbackChain.length > 0);

  return (
    <div className={`flex items-end gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center shrink-0 mb-1 ring-2 ring-slate-100 shadow-subtle">
          <Bot className="w-4 h-4 text-indigo-400" />
        </div>
      )}

      <div className={`max-w-[88%] sm:max-w-[76%] rounded-2xl p-4 space-y-2 ${
        isUser
          ? 'bg-slate-900 text-white rounded-br-xs shadow-subtle font-medium text-xs sm:text-sm'
          : 'bg-white text-slate-800 border border-slate-200/70 rounded-bl-xs shadow-subtle'
      }`}>
        {/* Contenu du message */}
        {isUser ? (
          <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
        ) : (
          <div>
            <MarkdownRenderer content={msg.text} />
            {msg.isStreaming && (
              <span className="inline-block w-1.5 h-3.5 ml-1 bg-indigo-500 animate-pulse rounded-xs align-middle" />
            )}
          </div>
        )}

        {/* Métadonnées Tuteur (Fournisseur, modèle, latence) */}
        {!isUser && (
          <div className="pt-2 mt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-1 text-[10px] text-slate-400 font-medium">
            <div className="flex items-center gap-1.5 flex-wrap">
              {msg.isZeroDowntimeFallback ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 font-bold">
                  <ShieldCheck className="w-3 h-3 text-amber-600" />
                  <span>Moteur Résilient BetterSchool (Zéro Downtime)</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold border border-slate-200">
                  <Sparkles className="w-2.5 h-2.5 text-indigo-500" />
                  <span>{msg.providerName || 'IA'}</span>
                  {msg.modelUsed && <span className="text-slate-400">({msg.modelUsed})</span>}
                  {msg.latencyMs && <span>• {msg.latencyMs}ms</span>}
                </span>
              )}

              {/* Indicateur de repli transparent si un provider a dû être sauté */}
              {hasFallback && (
                <button
                  type="button"
                  onClick={() => onToggleExpand(msg.id)}
                  className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-semibold border border-indigo-100 transition-colors cursor-pointer"
                  title="Voir la chaîne de repli"
                >
                  <Layers className="w-2.5 h-2.5" />
                  <span>Repli ({msg.fallbackChain?.length})</span>
                  {isExpanded ? <ChevronDown className="w-2.5 h-2.5" /> : <ChevronRight className="w-2.5 h-2.5" />}
                </button>
              )}
            </div>

            <span>{msg.time}</span>
          </div>
        )}

        {/* Détails déroulants de la cascade de repli */}
        {hasFallback && isExpanded && (
          <div className="mt-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-600 space-y-1">
            <div className="font-bold text-slate-800 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3 text-amber-500" />
              <span>Cascade de résilience appliquée :</span>
            </div>
            {msg.fallbackChain?.map((fb, fidx) => (
              <div key={fidx} className="flex items-center justify-between text-slate-500 pl-3 border-l-2 border-amber-300 py-0.5">
                <span className="font-semibold text-slate-700">{fb.providerName}</span>
                <span className="text-[10px] text-red-500 bg-red-50 px-1.5 py-0.2 rounded font-mono truncate max-w-[180px]">
                  {fb.error}
                </span>
              </div>
            ))}
            <div className="text-[10px] text-emerald-700 font-semibold pl-3 border-l-2 border-emerald-400 pt-0.5">
              ✓ Résolu par {msg.providerName} sans coupure pour l'élève.
            </div>
          </div>
        )}

        {isUser && (
          <div className="text-[10px] flex items-center justify-end text-slate-400">
            <span>{msg.time}</span>
          </div>
        )}
      </div>

      {isUser && (
        <div className="shrink-0 mb-1">
          {studentAvatar ? (
            <img
              src={studentAvatar}
              alt="Avatar"
              className="w-8 h-8 rounded-full object-cover ring-2 ring-slate-200"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs ring-2 ring-slate-200">
              {studentFirstName ? studentFirstName.charAt(0).toUpperCase() : 'E'}
            </div>
          )}
        </div>
      )}
    </div>
  );
});

