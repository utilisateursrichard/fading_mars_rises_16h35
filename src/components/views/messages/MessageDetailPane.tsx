import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Reply, 
  Mail, 
  Archive, 
  Trash2, 
  Tag, 
  Paperclip, 
  ChevronDown, 
  ChevronUp, 
  Clock, 
  User, 
  Check, 
  MessageSquare
} from 'lucide-react';
import { useSchool } from '../../../context/SchoolContext';
import { AttachmentCard } from './AttachmentCard';
import { QuickReplyBox } from './QuickReplyBox';
import { SmartschoolFlagColor } from '../../../types/school';

interface MessageDetailPaneProps {
  onBackToList?: () => void;
}

export const MessageDetailPane: React.FC<MessageDetailPaneProps> = ({ onBackToList }) => {
  const {
    selectedMailId,
    selectedMailDetail,
    isMailDetailLoading,
    setSelectedMailId,
    toggleMailFlag,
    setMailUnread,
    deleteMail,
    archiveMail,
    openComposeModal
  } = useSchool();

  const [showAllRecipients, setShowAllRecipients] = useState(false);
  const [showFlagMenu, setShowFlagMenu] = useState(false);

  if (!selectedMailId) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-white/40 dark:bg-slate-900/30 rounded-card border border-dashed border-slate-200 dark:border-slate-800">
        <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800/80 flex items-center justify-center text-slate-400 mb-4 shadow-subtle">
          <MessageSquare className="w-8 h-8 stroke-[1.5]" />
        </div>
        <h3 className="font-display text-lg font-bold text-slate-700 dark:text-slate-200">
          Aucun message sélectionné
        </h3>
        <p className="text-xs text-slate-400 dark:text-slate-500 max-w-sm mt-1 leading-5">
          Choisissez un message dans la liste de gauche pour afficher son contenu complet, ses pièces jointes et y répondre.
        </p>
      </div>
    );
  }

  if (isMailDetailLoading || !selectedMailDetail) {
    return (
      <div className="h-full p-6 space-y-6 animate-pulse bg-white dark:bg-slate-900 rounded-card border border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-28" />
          <div className="flex gap-2">
            <div className="h-8 w-20 bg-slate-200 dark:bg-slate-700 rounded-input" />
            <div className="h-8 w-8 bg-slate-200 dark:bg-slate-700 rounded-input" />
          </div>
        </div>
        <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 shrink-0" />
          <div className="space-y-1.5 w-48">
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full" />
            <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-2/3" />
          </div>
        </div>
        <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full" />
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-5/6" />
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-4/6" />
        </div>
      </div>
    );
  }

  const flags: Array<{ id: SmartschoolFlagColor; label: string; dotClass: string }> = [
    { id: 'none', label: 'Aucun drapeau', dotClass: 'bg-slate-300 dark:bg-slate-600' },
    { id: 'green', label: 'Vert (Important)', dotClass: 'bg-emerald-500' },
    { id: 'yellow', label: 'Jaune (À suivre)', dotClass: 'bg-amber-500' },
    { id: 'red', label: 'Rouge (Urgent)', dotClass: 'bg-rose-500' },
    { id: 'blue', label: 'Bleu (Information)', dotClass: 'bg-sky-500' }
  ];

  const handleFlagSelect = (color: SmartschoolFlagColor) => {
    toggleMailFlag(selectedMailDetail.id, color);
    setShowFlagMenu(false);
  };

  const handleReplyClick = () => {
    openComposeModal(
      {
        userID: 0,
        name: selectedMailDetail.from,
        className: 'Destinataire',
        avatar: ''
      },
      selectedMailDetail.subject.startsWith('Re:')
        ? selectedMailDetail.subject
        : `Re: ${selectedMailDetail.subject}`
    );
  };

  const currentFlagDot = () => {
    switch (selectedMailDetail.label) {
      case 'green': return 'bg-emerald-500';
      case 'yellow': return 'bg-amber-500';
      case 'red': return 'bg-rose-500';
      case 'blue': return 'bg-sky-500';
      default: return 'bg-slate-300 dark:bg-slate-600';
    }
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-slate-900 rounded-card border border-slate-200/90 dark:border-slate-800 shadow-subtle overflow-hidden">
      {/* Barre d'actions supérieure */}
      <div className="p-3 sm:p-4 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-2 shrink-0 bg-slate-50/60 dark:bg-slate-900/60">
        <div className="flex items-center gap-1.5">
          {onBackToList && (
            <button
              type="button"
              onClick={onBackToList}
              className="lg:hidden p-2 rounded-input text-slate-500 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors m3-press active:scale-[0.97]"
              title="Retour à la liste"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}

          {selectedMailDetail.allowReply && (
            <button
              type="button"
              onClick={handleReplyClick}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-input bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-subtle m3-press active:scale-[0.97] transition-all"
            >
              <Reply className="w-3.5 h-3.5" />
              <span>Répondre</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setMailUnread(selectedMailDetail.id)}
            title="Marquer comme non lu"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-input text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-xs font-semibold m3-press active:scale-[0.97] transition-all"
          >
            <Mail className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Non lu</span>
          </button>
        </div>

        <div className="flex items-center gap-1.5 relative">
          {/* Menu Drapeaux */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowFlagMenu(!showFlagMenu)}
              title="Changer le drapeau"
              className="flex items-center gap-1.5 p-2 rounded-input text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-xs font-semibold m3-press active:scale-[0.97] transition-all"
            >
              <span className={`w-2.5 h-2.5 rounded-full ${currentFlagDot()}`} />
              <Tag className="w-3.5 h-3.5 text-slate-500" />
            </button>

            {showFlagMenu && (
              <div className="absolute right-0 top-full mt-1.5 w-44 rounded-card bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-modal z-20 py-1.5 animate-in zoom-in-95 duration-150">
                {flags.map(f => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => handleFlagSelect(f.id)}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${f.dotClass}`} />
                      <span>{f.label}</span>
                    </div>
                    {selectedMailDetail.label === f.id && (
                      <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => archiveMail(selectedMailDetail.id)}
            title="Archiver"
            className="p-2 rounded-input text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700 transition-all m3-press active:scale-[0.97]"
          >
            <Archive className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => deleteMail(selectedMailDetail.id)}
            title="Supprimer"
            className="p-2 rounded-input text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-white dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700 transition-all m3-press active:scale-[0.97]"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Contenu déroulant du message */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        {/* Titre Objet Majeur */}
        <h2 className="font-display text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-snug">
          {selectedMailDetail.subject || '(Sans objet)'}
        </h2>

        {/* Bloc Expéditeur & Destinataires */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 p-4 rounded-card bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800/80">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-11 h-11 rounded-input bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 font-display font-extrabold text-sm flex items-center justify-center shrink-0 border border-indigo-200/70 dark:border-indigo-800/60 shadow-subtle">
              {selectedMailDetail.from.charAt(0).toUpperCase()}
            </div>

            <div className="min-w-0">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate font-display">
                {selectedMailDetail.from}
              </h3>

              {/* Destinataires et détails */}
              <div className="mt-1 flex items-center gap-1.5 flex-wrap text-xs text-slate-500 dark:text-slate-400">
                <span>À :</span>
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {selectedMailDetail.to || 'Moi'}
                </span>

                {selectedMailDetail.receivers && selectedMailDetail.receivers.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setShowAllRecipients(!showAllRecipients)}
                    className="inline-flex items-center gap-0.5 text-indigo-600 dark:text-indigo-400 font-semibold hover:underline ml-1"
                  >
                    <span>+{selectedMailDetail.receivers.length - 1} autre(s)</span>
                    {showAllRecipients ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                )}
              </div>

              {showAllRecipients && selectedMailDetail.receivers && (
                <div className="mt-2 p-2 rounded-input bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 space-y-1">
                  <p className="font-bold text-slate-700 dark:text-slate-300">Tous les destinataires :</p>
                  <ul className="list-disc list-inside space-y-0.5">
                    {selectedMailDetail.receivers.map((r, i) => (
                      <li key={i}>{r.name}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 font-medium shrink-0 sm:pt-1">
            <Clock className="w-3.5 h-3.5" />
            <span>{selectedMailDetail.date}</span>
          </div>
        </div>

        {/* Corps HTML du Message */}
        <div
          className="prose dark:prose-invert max-w-none text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-sans"
          dangerouslySetInnerHTML={{ __html: selectedMailDetail.bodyHtml }}
        />

        {/* Section Pièces Jointes */}
        {selectedMailDetail.attachments && selectedMailDetail.attachments.length > 0 && (
          <div className="pt-4 border-t border-slate-200/80 dark:border-slate-800 space-y-3">
            <div className="flex items-center gap-2">
              <Paperclip className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-sans">
                Pièces jointes ({selectedMailDetail.attachments.length})
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {selectedMailDetail.attachments.map(att => (
                <AttachmentCard key={att.fileID} attachment={att} />
              ))}
            </div>
          </div>
        )}

        {/* Boîte de Réponse Rapide */}
        <div className="pt-4 border-t border-slate-200/80 dark:border-slate-800">
          <QuickReplyBox onOpenFullComposer={handleReplyClick} />
        </div>
      </div>
    </div>
  );
};
