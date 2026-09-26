import React, { useState } from 'react';
import { 
  Inbox, 
  Send, 
  FileEdit, 
  Trash2, 
  PlusCircle, 
  Menu, 
  X,
  ChevronDown
} from 'lucide-react';
import { useSchool } from '../../context/SchoolContext';
import { MailboxSidebar } from './messages/MailboxSidebar';
import { MessageListFeed } from './messages/MessageListFeed';
import { MessageDetailPane } from './messages/MessageDetailPane';
import { ComposeMessageModal } from '../modals/ComposeMessageModal';
import { SmartschoolBoxType } from '../../types/school';

export const MessagesView: React.FC = () => {
  const { 
    selectedMailId, 
    setSelectedMailId, 
    activeMailbox, 
    setActiveMailbox, 
    openComposeModal,
    mailCounters 
  } = useSchool();

  const [isMobileFolderMenuOpen, setIsMobileFolderMenuOpen] = useState(false);

  const folders: Array<{ id: SmartschoolBoxType; label: string; icon: React.ElementType; counter?: number }> = [
    { id: 'inbox', label: 'Boîte de réception', icon: Inbox, counter: mailCounters.inbox },
    { id: 'outbox', label: 'Messages envoyés', icon: Send, counter: mailCounters.outbox },
    { id: 'draft', label: 'Brouillons', icon: FileEdit, counter: mailCounters.draft },
    { id: 'trash', label: 'Corbeille', icon: Trash2, counter: mailCounters.trash }
  ];

  const currentFolder = folders.find(f => f.id === activeMailbox) || folders[0];
  const CurrentFolderIcon = currentFolder.icon;

  return (
    <div className="w-full max-w-7xl mx-auto space-y-4">
      {/* Conteneur Bento Majeur M3E Pro */}
      <div className="h-[calc(100vh-140px)] min-h-[640px] bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-bento border border-slate-200/85 dark:border-slate-800 shadow-card overflow-hidden flex flex-col lg:flex-row relative">
        
        {/* Colonne 1 : Navigation Dossiers (Desktop) */}
        <div className="hidden lg:flex p-5 border-r border-slate-200/80 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-950/20 shrink-0">
          <MailboxSidebar />
        </div>

        {/* Barre de navigation dossiers pour Mobile & Tablette (< lg) */}
        <div className="lg:hidden p-3.5 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/40 shrink-0">
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setIsMobileFolderMenuOpen(!isMobileFolderMenuOpen)}
              className="flex items-center gap-2 px-3 py-2 rounded-input bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-800 dark:text-slate-100 shadow-subtle m3-press active:scale-[0.97]"
            >
              <CurrentFolderIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>{currentFolder.label}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
            </button>

            <button
              type="button"
              onClick={() => openComposeModal()}
              className="flex items-center gap-1.5 px-3 py-2 rounded-input bg-indigo-600 text-white text-xs font-bold shadow-subtle m3-press active:scale-[0.97]"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Écrire</span>
            </button>
          </div>

          {/* Tiroir déroulant mobile des dossiers */}
          {isMobileFolderMenuOpen && (
            <div className="mt-2.5 p-1.5 rounded-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-modal space-y-1 animate-in zoom-in-95 duration-150">
              {folders.map(folder => {
                const Icon = folder.icon;
                const isActive = activeMailbox === folder.id;
                return (
                  <button
                    key={folder.id}
                    type="button"
                    onClick={() => {
                      setActiveMailbox(folder.id);
                      setIsMobileFolderMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-input text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                      <span>{folder.label}</span>
                    </div>
                    {typeof folder.counter === 'number' && folder.counter > 0 && (
                      <span className="text-[10px] px-2 py-0.5 rounded-pill font-bold bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {folder.counter}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Colonne 2 : Liste des Messages */}
        <div
          className={`w-full lg:w-80 xl:w-96 border-r border-slate-200/80 dark:border-slate-800 p-4 shrink-0 flex flex-col overflow-hidden ${
            selectedMailId ? 'hidden lg:flex' : 'flex'
          }`}
        >
          <MessageListFeed />
        </div>

        {/* Colonne 3 : Détail du Message & Réponse Rapide */}
        <div
          className={`flex-1 p-3 sm:p-5 shrink min-w-0 flex flex-col overflow-hidden ${
            selectedMailId ? 'flex' : 'hidden lg:flex'
          }`}
        >
          <MessageDetailPane onBackToList={() => setSelectedMailId(null)} />
        </div>
      </div>

      {/* Modale d'Écriture de Message M3E Pro */}
      <ComposeMessageModal />
    </div>
  );
};
