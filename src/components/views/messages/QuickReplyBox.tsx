import React, { useState } from 'react';
import { Send, Maximize2, Loader2 } from 'lucide-react';
import { useSchool } from '../../../context/SchoolContext';

interface QuickReplyBoxProps {
  onOpenFullComposer?: () => void;
}

export const QuickReplyBox: React.FC<QuickReplyBoxProps> = ({ onOpenFullComposer }) => {
  const { replyToMail, selectedMailDetail } = useSchool();
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!selectedMailDetail || !selectedMailDetail.allowReply) {
    return (
      <div className="p-4 rounded-card bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 text-center text-xs text-slate-400 font-medium">
        Ce message ne permet pas de réponse directe (expéditeur restreint ou notification système).
      </div>
    );
  }

  const handleSend = async () => {
    if (!content.trim() || isSubmitting) return;
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      const formattedHtml = `<p>${content.trim().replace(/\n/g, '<br/>')}</p>`;
      const res = await replyToMail(formattedHtml);
      if (res.success) {
        setContent('');
      } else {
        setErrorMsg(res.error || 'Impossible d\'expédier la réponse.');
      }
    } catch {
      setErrorMsg('Erreur de transmission réseau.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="p-4 rounded-card bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-subtle space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
          <span>Répondre à <span className="text-indigo-600 dark:text-indigo-400">{selectedMailDetail.from}</span></span>
        </label>
        
        {onOpenFullComposer && (
          <button
            type="button"
            onClick={onOpenFullComposer}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors m3-press active:scale-[0.97]"
            title="Ouvrir dans l'éditeur complet"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Plein écran</span>
          </button>
        )}
      </div>

      <div className="relative">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Rédigez votre réponse ici... (Ctrl + Entrée pour envoyer)"
          rows={3}
          disabled={isSubmitting}
          className="w-full bg-slate-50 dark:bg-slate-950/60 border border-slate-200/90 dark:border-slate-800 rounded-input p-3 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all resize-none font-sans"
        />
      </div>

      {errorMsg && (
        <p className="text-xs font-semibold text-rose-600 dark:text-rose-400 animate-in fade-in">
          {errorMsg}
        </p>
      )}

      <div className="flex items-center justify-between pt-1">
        <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium hidden sm:inline">
          Raccourci : <kbd className="px-1.5 py-0.5 rounded-sub bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-mono text-[10px]">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 rounded-sub bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-mono text-[10px]">Entrée</kbd>
        </span>

        <button
          type="button"
          onClick={handleSend}
          disabled={!content.trim() || isSubmitting}
          className="ml-auto flex items-center gap-2 px-4 py-2 rounded-input bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold shadow-subtle m3-press active:scale-[0.97] transition-all"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Envoi en cours...</span>
            </>
          ) : (
            <>
              <Send className="w-3.5 h-3.5" />
              <span>Envoyer la réponse</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
