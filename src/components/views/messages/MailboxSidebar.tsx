import React from 'react';
import { 
  Inbox, 
  Send, 
  FileEdit, 
  Trash2, 
  PlusCircle, 
  RotateCw, 
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { useSchool } from '../../../context/SchoolContext';
import { SmartschoolBoxType } from '../../../types/school';

export const MailboxSidebar: React.FC = () => {
  const { 
    activeMailbox, 
    setActiveMailbox, 
    mailCounters, 
    isMailLoading, 
    refreshMailList, 
    openComposeModal,
    isDemoMode,
    isInsideSmartschoolPlatform
  } = useSchool();

  const folders: Array<{
    id: SmartschoolBoxType;
    label: string;
    icon: React.ElementType;
    counter?: number;
    highlightCounter?: boolean;
  }> = [
    { 
      id: 'inbox', 
      label: 'Boîte de réception', 
      icon: Inbox, 
      counter: mailCounters.inbox, 
      highlightCounter: (mailCounters.inbox || 0) > 0 
    },
    { 
      id: 'outbox', 
      label: 'Messages envoyés', 
      icon: Send, 
      counter: mailCounters.outbox 
    },
    { 
      id: 'draft', 
      label: 'Brouillons', 
      icon: FileEdit, 
      counter: mailCounters.draft 
    },
    { 
      id: 'trash', 
      label: 'Corbeille', 
      icon: Trash2, 
      counter: mailCounters.trash 
    }
  ];

  return (
    <aside className="w-full lg:w-64 flex flex-col gap-5 shrink-0">
      {/* Bouton Nouveau Message CTA */}
      <button
        type="button"
        onClick={() => openComposeModal()}
        className="w-full flex items-center justify-center gap-2.5 py-3 px-4 rounded-input bg-indigo-600 hover:bg-indigo-700 text-white font-display font-bold text-sm shadow-subtle hover:shadow-card m3-press active:scale-[0.97] transition-all"
      >
        <PlusCircle className="w-4 h-4" />
        <span>Nouveau message</span>
      </button>

      {/* Navigation des Dossiers */}
      <nav className="space-y-1">
        <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 font-sans mb-2">
          Dossiers
        </p>

        {folders.map(folder => {
          const Icon = folder.icon;
          const isActive = activeMailbox === folder.id;

          return (
            <button
              key={folder.id}
              type="button"
              onClick={() => setActiveMailbox(folder.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-input text-sm font-medium transition-all m3-press active:scale-[0.98] ${
                isActive
                  ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-200/80 dark:border-indigo-800/60 shadow-subtle'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/70 dark:hover:bg-slate-800/50 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`} />
                <span className="truncate">{folder.label}</span>
              </div>

              {typeof folder.counter === 'number' && folder.counter > 0 && (
                <span
                  className={`text-[11px] px-2 py-0.5 rounded-pill font-bold ${
                    folder.highlightCounter
                      ? 'bg-indigo-600 text-white shadow-subtle'
                      : 'bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {folder.counter}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Barre d'état & synchronisation Smartschool */}
      <div className="mt-auto p-3.5 rounded-card bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isDemoMode ? (
              <span className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
                <Sparkles className="w-3.5 h-3.5" />
                Mode Démo
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {isInsideSmartschoolPlatform ? 'Smartschool Direct' : 'Serveur Connecté'}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={refreshMailList}
            disabled={isMailLoading}
            title="Rafraîchir les messages"
            className="p-1.5 rounded-input text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-slate-700/60 transition-all m3-press active:scale-[0.97]"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isMailLoading ? 'animate-spin text-indigo-600' : ''}`} />
          </button>
        </div>

        <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-4">
          Synchronisation Smartschool XML RPC instantanée.
        </p>
      </div>
    </aside>
  );
};
