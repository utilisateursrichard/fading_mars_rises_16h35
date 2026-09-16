import React, { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';

interface TutorInputBarProps {
  onSend: (text: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

/**
 * Conteneur autonome de saisie pour le Tuteur IA.
 * Isoler son propre état `text` garantit que chaque touche tapée
 * ne déclenche aucun re-rendu de la liste des messages ou du moteur KaTeX (0 ms de latence).
 */
export const TutorInputBar: React.FC<TutorInputBarProps> = React.memo(({
  onSend,
  disabled = false,
  placeholder = "Pose une question sur tes cours, devoirs ou révisions..."
}) => {
  const [inputText, setInputText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Redonner le focus automatiquement lorsque le tuteur termine de répondre
  useEffect(() => {
    if (!disabled && inputRef.current) {
      inputRef.current.focus();
    }
  }, [disabled]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed || disabled) return;

    onSend(trimmed);
    setInputText('');
  };

  return (
    <form 
      onSubmit={handleSubmit}
      className="p-3 sm:p-4 bg-white border-t border-slate-100 flex items-center gap-2 sm:gap-3"
    >
      <input
        ref={inputRef}
        type="text"
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        disabled={disabled}
        placeholder={placeholder}
        className="flex-1 px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200/70 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white disabled:bg-slate-100 disabled:cursor-not-allowed transition-all font-medium"
      />

      <button
        type="submit"
        disabled={!inputText.trim() || disabled}
        className="m3-press p-3 rounded-2xl bg-slate-900 hover:bg-indigo-600 disabled:opacity-40 disabled:hover:bg-slate-900 text-white transition-colors shadow-subtle shrink-0"
        title="Envoyer"
      >
        <Send className="w-4 h-4" />
      </button>
    </form>
  );
});

