import React, { useMemo } from 'react';
import { 
  Search, 
  X, 
  Paperclip, 
  Mail, 
  Inbox, 
  CornerDownLeft,
  Tag
} from 'lucide-react';
import { useSchool } from '../../../context/SchoolContext';
import { SmartschoolFlagColor, SmartschoolMessageSummary } from '../../../types/school';

export const MessageListFeed: React.FC = () => {
  const {
    mailMessages,
    selectedMailId,
    setSelectedMailId,
    isMailLoading,
    mailSearchQuery,
    setMailSearchQuery,
    selectedFlagFilter,
    setSelectedFlagFilter,
    activeMailbox
  } = useSchool();

  const flagFilters: Array<{ id: SmartschoolFlagColor | 'all'; label: string; dotClass?: string }> = [
    { id: 'all', label: 'Tous' },
    { id: 'green', label: 'Vert', dotClass: 'bg-emerald-500' },
    { id: 'yellow', label: 'Jaune', dotClass: 'bg-amber-500' },
    { id: 'red', label: 'Rouge', dotClass: 'bg-rose-500' },
    { id: 'blue', label: 'Bleu', dotClass: 'bg-sky-500' }
  ];

  const filteredMessages = useMemo(() => {
    return mailMessages.filter(msg => {
      // Filtre drapeau
      if (selectedFlagFilter !== 'all' && msg.label !== selectedFlagFilter) {
        return false;
      }
      // Filtre recherche textuelle
      if (mailSearchQuery.trim()) {
        const query = mailSearchQuery.toLowerCase().trim();
        const matchesFrom = msg.from.toLowerCase().includes(query);
        const matchesSubject = msg.subject.toLowerCase().includes(query);
        const matchesSnippet = msg.snippet?.toLowerCase().includes(query) || false;
        if (!matchesFrom && !matchesSubject && !matchesSnippet) {
          return false;
        }
      }
      return true;
    });
  }, [mailMessages, selectedFlagFilter, mailSearchQuery]);

  const getFlagDotColor = (flag: SmartschoolFlagColor) => {
    switch (flag) {
      case 'green': return 'bg-emerald-500';
      case 'yellow': return 'bg-amber-500';
      case 'red': return 'bg-rose-500';
      case 'blue': return 'bg-sky-500';
      default: return null;
    }
  };

  const getFolderTitle = () => {
    switch (activeMailbox) {
      case 'inbox': return 'Boîte de réception';
      case 'outbox': return 'Messages envoyés';
      case 'draft': return 'Brouillons';
      case 'trash': return 'Corbeille';
      default: return 'Messages';
    }
  };

  return (
    <div className="flex flex-col h-full space-y-3">
      {/* Barre de Recherche */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={mailSearchQuery}
          onChange={(e) => setMailSearchQuery(e.target.value)}
          placeholder="Rechercher expéditeur, objet..."
          className="w-full bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-input pl-10 pr-9 py-2.5 text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all font-sans"
        />
        {mailSearchQuery && (
          <button
            type="button"
            onClick={() => setMailSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Rangée des Filtres drapeaux */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {flagFilters.map(filter => {
          const isActive = selectedFlagFilter === filter.id;
          return (
            <button
              key={filter.id}
              type="button"
              onClick={() => setSelectedFlagFilter(filter.id)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-pill text-[11px] font-bold tracking-tight transition-all shrink-0 m3-press active:scale-[0.97] ${
                isActive
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-subtle'
                  : 'bg-slate-100 dark:bg-slate-800/70 text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800'
              }`}
            >
              {filter.dotClass && <span className={`w-2 h-2 rounded-full ${filter.dotClass}`} />}
              <span>{filter.label}</span>
            </button>
          );
        })}
      </div>

      {/* En-tête de section & compteur */}
      <div className="flex items-center justify-between px-1 pt-1">
        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 font-display">
          {getFolderTitle()}
        </span>
        <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
          {filteredMessages.length} {filteredMessages.length > 1 ? 'messages' : 'message'}
        </span>
      </div>

      {/* Liste des Messages */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1 pb-4">
        {isMailLoading && mailMessages.length === 0 ? (
          // Shimmer Skeletons M3E Pro
          <div className="space-y-2.5 animate-pulse">
            {[1, 2, 3, 4].map(idx => (
              <div key={idx} className="p-3.5 rounded-card bg-slate-100 dark:bg-slate-800/60 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="h-3.5 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
                  <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-16" />
                </div>
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-full" />
              </div>
            ))}
          </div>
        ) : filteredMessages.length === 0 ? (
          // État vide
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center rounded-card border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
              <Inbox className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300 font-display">
              Aucun message trouvé
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 max-w-xs mt-1">
              {mailSearchQuery
                ? `Aucun résultat pour "${mailSearchQuery}". Essayez un autre mot-clé.`
                : 'Ce dossier ne contient aucun message pour l\'instant.'}
            </p>
          </div>
        ) : (
          filteredMessages.map(msg => {
            const isSelected = selectedMailId === msg.id;
            const flagColorClass = getFlagDotColor(msg.label);

            return (
              <article
                key={msg.id}
                onClick={() => setSelectedMailId(msg.id)}
                className={`p-3.5 rounded-card cursor-pointer transition-all duration-200 border text-left relative m3-press active:scale-[0.99] ${
                  isSelected
                    ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-800/80 shadow-subtle ring-1 ring-indigo-500/20'
                    : msg.unread
                    ? 'bg-white dark:bg-slate-900 border-indigo-200/60 dark:border-slate-700 shadow-subtle hover:border-indigo-300 dark:hover:border-slate-600'
                    : 'bg-white/70 dark:bg-slate-900/60 border-slate-200/70 dark:border-slate-800/70 hover:bg-white dark:hover:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                {/* En-tête : Expéditeur & Date */}
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2 min-w-0">
                    {msg.unread && (
                      <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0 ring-4 ring-indigo-100 dark:ring-indigo-950/60" />
                    )}
                    <span
                      className={`text-xs truncate font-display ${
                        msg.unread
                          ? 'font-extrabold text-slate-900 dark:text-white'
                          : 'font-semibold text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {msg.from}
                    </span>
                  </div>

                  <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium shrink-0">
                    {msg.date}
                  </span>
                </div>

                {/* Objet */}
                <h4
                  className={`text-xs line-clamp-1 mb-1 ${
                    msg.unread
                      ? 'font-bold text-slate-800 dark:text-slate-100'
                      : 'font-medium text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {msg.subject || '(Sans objet)'}
                </h4>

                {/* Extrait de texte */}
                {msg.snippet && (
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 line-clamp-2 leading-4">
                    {msg.snippet}
                  </p>
                )}

                {/* Métadonnées en pied de carte (Drapeau, Pièces jointes, Réponse) */}
                <div className="flex items-center gap-2 mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800/60 text-[11px] text-slate-400 dark:text-slate-500">
                  {flagColorClass && (
                    <span className="flex items-center gap-1 font-medium">
                      <span className={`w-2 h-2 rounded-full ${flagColorClass}`} />
                    </span>
                  )}

                  {msg.hasAttachment && (
                    <span className="flex items-center gap-1 font-medium text-slate-500 dark:text-slate-400">
                      <Paperclip className="w-3 h-3 text-slate-400" />
                      {msg.attachmentCount > 1 && <span>{msg.attachmentCount}</span>}
                    </span>
                  )}

                  {msg.hasReply && (
                    <span className="flex items-center gap-1 font-medium text-indigo-500" title="Vous avez répondu">
                      <CornerDownLeft className="w-3 h-3" />
                      <span>Répondu</span>
                    </span>
                  )}
                </div>
              </article>
            );
          })
        )}
      </div>
    </div>
  );
};
