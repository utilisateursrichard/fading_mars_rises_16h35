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
import { useUITheme } from '../../../context/UIThemeContext';
import { getThemeTokens } from '../../../utils/themeTokens';
import { SmartschoolFlagColor, SmartschoolMessageSummary } from '../../../types/school';

export const MessageListFeed: React.FC = () => {
  const { uiTheme } = useUITheme();
  const tk = getThemeTokens(uiTheme);
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
        <Search className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 ${tk.textMuted}`} />
        <input
          type="text"
          value={mailSearchQuery}
          onChange={(e) => setMailSearchQuery(e.target.value)}
          placeholder="Rechercher expéditeur, objet..."
          className={`w-full pl-10 pr-9 py-2.5 text-xs focus:outline-none transition-all font-sans ${tk.inputField}`}
        />
        {mailSearchQuery && (
          <button
            type="button"
            onClick={() => setMailSearchQuery('')}
            className={`absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full ${tk.textMuted} transition-colors`}
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
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-tight transition-all shrink-0 active:scale-[0.97] ${
                isActive ? tk.primaryBtn : tk.secondaryBtn
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
        <span className={`text-xs font-bold font-display ${tk.textPrimary}`}>
          {getFolderTitle()}
        </span>
        <span className={`text-[11px] font-medium ${tk.textMuted}`}>
          {filteredMessages.length} {filteredMessages.length > 1 ? 'messages' : 'message'}
        </span>
      </div>

      {/* Liste des Messages */}
      <div className={`flex-1 overflow-y-auto ${uiTheme === 'google_m3e' ? 'space-y-1.5' : 'space-y-2'} pr-1 pb-4`}>
        {isMailLoading && mailMessages.length === 0 ? (
          <div className="space-y-2.5 animate-pulse">
            {[1, 2, 3, 4].map(idx => (
              <div key={idx} className={`p-3.5 ${tk.subSurface} space-y-2`}>
                <div className="flex items-center justify-between">
                  <div className="h-3.5 bg-slate-400/20 rounded w-1/3" />
                  <div className="h-3 bg-slate-400/20 rounded w-16" />
                </div>
                <div className="h-4 bg-slate-400/20 rounded w-3/4" />
                <div className="h-3 bg-slate-400/20 rounded w-full" />
              </div>
            ))}
          </div>
        ) : filteredMessages.length === 0 ? (
          // État vide
          <div className={`flex flex-col items-center justify-center py-12 px-4 text-center border border-dashed ${tk.borderSubtle} ${tk.subSurface}`}>
            <div className={`w-12 h-12 rounded-full ${tk.card} flex items-center justify-center ${tk.textMuted} mb-3`}>
              <Inbox className="w-6 h-6" />
            </div>
            <p className={`text-sm font-bold font-display ${tk.textPrimary}`}>
              Aucun message trouvé
            </p>
            <p className={`text-xs max-w-xs mt-1 ${tk.textMuted}`}>
              {mailSearchQuery
                ? `Aucun résultat pour "${mailSearchQuery}". Essayez un autre mot-clé.`
                : 'Ce dossier ne contient aucun message pour l\'instant.'}
            </p>
          </div>
        ) : (
          filteredMessages.map((msg, index) => {
            const isSelected = selectedMailId === msg.id;
            const flagColorClass = getFlagDotColor(msg.label);
            const isUnread = Boolean(activeMailbox === 'inbox' && (msg.unread || msg.status === 'unread'));
            const m3eRadius =
              uiTheme === 'google_m3e'
                ? index === 0
                  ? 'rounded-t-[24px] rounded-b-[10px]'
                  : index === filteredMessages.length - 1
                    ? 'rounded-t-[10px] rounded-b-[24px]'
                    : 'rounded-[10px]'
                : '';

            return (
              <article
                key={msg.id}
                onClick={() => setSelectedMailId(msg.id)}
                className={`p-3.5 cursor-pointer transition-all duration-200 text-left relative active:scale-[0.99] ${m3eRadius} ${
                  isSelected
                    ? uiTheme === 'google_m3e'
                      ? 'bg-[#D3E4FF] text-[#001C38]'
                      : uiTheme === 'nova'
                        ? 'bg-amber-400/10 border border-amber-400/40 rounded-2xl'
                        : uiTheme === 'obsidian'
                          ? 'bg-sky-400/10 border border-sky-400/40 rounded-xl'
                          : uiTheme === 'apple_pro'
                            ? 'bg-[#007AFF]/[0.08] border border-[#007AFF]/35 rounded-2xl'
                            : 'bg-indigo-50/80 border border-indigo-300 rounded-2xl'
                    : `${tk.interactiveCard}`
                }`}
              >
                {/* En-tête : Expéditeur & Date */}
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2 min-w-0">
                    {isUnread && (
                      <span className={`w-2 h-2 rounded-full shrink-0 ${
                        uiTheme === 'nova' ? 'bg-amber-400' : uiTheme === 'obsidian' ? 'bg-sky-400' : 'bg-indigo-600'
                      }`} />
                    )}
                    <span
                      className={`text-xs truncate font-display ${
                        isUnread ? `font-extrabold ${tk.textPrimary}` : `font-semibold ${tk.textSecondary}`
                      }`}
                    >
                      {msg.from}
                    </span>
                  </div>

                  <span className={`text-[11px] font-medium shrink-0 ${tk.textMuted}`}>
                    {msg.date}
                  </span>
                </div>

                {/* Objet */}
                <h4
                  className={`text-xs line-clamp-1 mb-1 ${
                    isUnread ? `font-bold ${tk.textPrimary}` : `font-medium ${tk.textSecondary}`
                  }`}
                >
                  {msg.subject || '(Sans objet)'}
                </h4>

                {/* Extrait de texte */}
                {msg.snippet && (
                  <p className={`text-[11px] line-clamp-2 leading-4 ${tk.textMuted}`}>
                    {msg.snippet}
                  </p>
                )}

                {/* Métadonnées en pied de carte (Drapeau, Pièces jointes, Réponse) */}
                <div className={`flex items-center gap-2 mt-2 pt-1.5 border-t ${tk.borderSubtle} text-[11px] ${tk.textMuted}`}>
                  {flagColorClass && (
                    <span className="flex items-center gap-1 font-medium">
                      <span className={`w-2 h-2 rounded-full ${flagColorClass}`} />
                    </span>
                  )}

                  {msg.hasAttachment && (
                    <span className={`flex items-center gap-1 font-medium ${tk.textSecondary}`}>
                      <Paperclip className="w-3 h-3 opacity-60" />
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
