import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Send, 
  Loader2, 
  Search, 
  UserCheck, 
  AlertCircle,
  Paperclip
} from 'lucide-react';
import { useSchool } from '../../context/SchoolContext';
import { SmartschoolContact } from '../../types/school';
import { searchSmartschoolRecipients } from '../../services/smartschoolMessages';
import { mockContacts } from '../../data/mockMessages';

export const ComposeMessageModal: React.FC = () => {
  const { 
    isComposeModalOpen, 
    closeComposeModal, 
    composeInitialRecipient, 
    composeInitialSubject,
    sendSmartschoolMail,
    isDemoMode
  } = useSchool();

  const [selectedContacts, setSelectedContacts] = useState<SmartschoolContact[]>([]);
  const [recipientQuery, setRecipientQuery] = useState('');
  const [recipientResults, setRecipientResults] = useState<SmartschoolContact[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Initialisation à l'ouverture de la modale
  useEffect(() => {
    if (isComposeModalOpen) {
      if (composeInitialRecipient) {
        setSelectedContacts([composeInitialRecipient]);
      } else {
        setSelectedContacts([]);
      }
      setSubject(composeInitialSubject || '');
      setBody('');
      setRecipientQuery('');
      setRecipientResults([]);
      setErrorMessage(null);
    }
  }, [isComposeModalOpen, composeInitialRecipient, composeInitialSubject]);

  // Fermeture par touche Echap
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isComposeModalOpen) {
        closeComposeModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isComposeModalOpen, closeComposeModal]);

  // Recherche autocomplétée des destinataires
  useEffect(() => {
    if (!recipientQuery.trim() || recipientQuery.trim().length < 2) {
      setRecipientResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        if (!isDemoMode) {
          const results = await searchSmartschoolRecipients(recipientQuery.trim());
          setRecipientResults(results);
        } else {
          const q = recipientQuery.toLowerCase().trim();
          const filtered = mockContacts.filter(c => 
            c.name.toLowerCase().includes(q) || c.className.toLowerCase().includes(q)
          );
          setRecipientResults(filtered);
        }
      } catch {
        setRecipientResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [recipientQuery, isDemoMode]);

  // Clic à l'extérieur pour fermer le dropdown de recherche
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setRecipientResults([]);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isComposeModalOpen) return null;

  const handleAddRecipient = (contact: SmartschoolContact) => {
    if (!selectedContacts.some(c => c.userID === contact.userID)) {
      setSelectedContacts(prev => [...prev, contact]);
    }
    setRecipientQuery('');
    setRecipientResults([]);
  };

  const handleRemoveRecipient = (userId: number) => {
    setSelectedContacts(prev => prev.filter(c => c.userID !== userId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedContacts.length === 0) {
      setErrorMessage('Veuillez ajouter au moins un destinataire.');
      return;
    }
    if (!subject.trim()) {
      setErrorMessage('L\'objet du message ne peut pas être vide.');
      return;
    }
    if (!body.trim()) {
      setErrorMessage('Le corps du message ne peut pas être vide.');
      return;
    }

    setIsSending(true);
    setErrorMessage(null);

    try {
      const formattedHtml = `<p>${body.trim().replace(/\n/g, '<br/>')}</p>`;
      const res = await sendSmartschoolMail({
        recipientUserIds: selectedContacts.map(c => c.userID),
        subject: subject.trim(),
        bodyHtml: formattedHtml
      });

      if (res.success) {
        closeComposeModal();
      } else {
        setErrorMessage(res.error || 'Erreur lors de l\'envoi du message.');
      }
    } catch {
      setErrorMessage('Erreur réseau lors de la communication avec le serveur.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-bento border border-slate-200/90 dark:border-slate-800 shadow-modal max-w-2xl w-full p-6 sm:p-8 animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        {/* En-tête Modale */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <h2 className="font-display font-black text-xl text-slate-900 dark:text-white tracking-tight">
            Nouveau message
          </h2>
          <button
            type="button"
            onClick={closeComposeModal}
            className="p-1.5 rounded-input text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors m3-press active:scale-[0.97]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
          {errorMessage && (
            <div className="p-3 rounded-card bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 flex items-center gap-2.5 text-xs text-rose-800 dark:text-rose-300 font-semibold animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Champ Destinataires */}
          <div className="space-y-1.5" ref={searchContainerRef}>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Destinataires
            </label>

            <div className="p-2 bg-slate-50 dark:bg-slate-950/60 border border-slate-200/90 dark:border-slate-800 rounded-input flex flex-wrap items-center gap-1.5 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-600 transition-all relative">
              {/* Chips des destinataires choisis */}
              {selectedContacts.map(c => (
                <span
                  key={c.userID}
                  className="inline-flex items-center gap-1.5 py-1 pl-2.5 pr-1.5 rounded-pill bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/80 dark:border-indigo-800/60 text-xs font-bold text-indigo-700 dark:text-indigo-300 shadow-subtle animate-in zoom-in-95"
                >
                  <span className="truncate max-w-[180px]">{c.name}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveRecipient(c.userID)}
                    className="p-0.5 rounded-full hover:bg-indigo-200/60 dark:hover:bg-indigo-900 text-indigo-600 dark:text-indigo-400 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}

              <input
                type="text"
                value={recipientQuery}
                onChange={(e) => setRecipientQuery(e.target.value)}
                placeholder={selectedContacts.length === 0 ? "Rechercher un professeur, élève ou groupe..." : "Ajouter un autre destinataire..."}
                className="flex-1 min-w-[200px] bg-transparent text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none py-1 px-1 font-sans"
              />

              {isSearching && (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400 mr-2" />
              )}

              {/* Dropdown autocomplétion */}
              {recipientResults.length > 0 && (
                <div className="absolute left-0 top-full mt-1.5 w-full rounded-card bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-modal z-30 max-h-56 overflow-y-auto py-1">
                  {recipientResults.map(contact => (
                    <button
                      key={contact.userID}
                      type="button"
                      onClick={() => handleAddRecipient(contact)}
                      className="w-full flex items-center justify-between px-3.5 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold text-xs flex items-center justify-center shrink-0">
                          {contact.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-100">
                            {contact.name}
                          </p>
                          <p className="text-[11px] text-slate-400 dark:text-slate-500">
                            {contact.className}
                          </p>
                        </div>
                      </div>
                      <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Champ Objet */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Objet
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Ex: Demande de renseignement pour le cours de mathématiques"
              className="w-full bg-slate-50 dark:bg-slate-950/60 border border-slate-200/90 dark:border-slate-800 rounded-input px-3.5 py-2.5 text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all font-sans"
            />
          </div>

          {/* Champ Message */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Message
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Rédigez votre message ici..."
              rows={8}
              className="w-full bg-slate-50 dark:bg-slate-950/60 border border-slate-200/90 dark:border-slate-800 rounded-input p-3.5 text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all resize-none font-sans"
            />
          </div>
        </form>

        {/* Pied de Modale */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
            Format HTML & synchronisation Smartschool
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={closeComposeModal}
              disabled={isSending}
              className="px-4 py-2 rounded-input text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors m3-press active:scale-[0.97]"
            >
              Annuler
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSending}
              className="flex items-center gap-2 px-5 py-2 rounded-input bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-subtle hover:shadow-card disabled:opacity-50 disabled:cursor-not-allowed m3-press active:scale-[0.97] transition-all"
            >
              {isSending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Envoi en cours...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Envoyer</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
