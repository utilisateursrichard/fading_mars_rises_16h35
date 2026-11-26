import React, { useState } from 'react';
import {
  Inbox,
  Send,
  FileEdit,
  Trash2,
  PlusCircle,
  ChevronDown,
  RotateCw,
} from 'lucide-react';
import { useSchool } from '../../context/SchoolContext';
import { useUITheme } from '../../context/UIThemeContext';
import { MailboxSidebar } from './messages/MailboxSidebar';
import { MessageListFeed } from './messages/MessageListFeed';
import { MessageDetailPane } from './messages/MessageDetailPane';
import { ComposeMessageModal } from '../modals/ComposeMessageModal';
import { SmartschoolBoxType } from '../../types/school';

export const MessagesView: React.FC = () => {
  const {
    selectedMailId,
    activeMailbox,
    setActiveMailbox,
    openComposeModal,
    mailCounters,
    isMailLoading,
    refreshMailList,
  } = useSchool();
  const { uiTheme } = useUITheme();

  const [isMobileFolderMenuOpen, setIsMobileFolderMenuOpen] = useState(false);

  const folders: Array<{
    id: SmartschoolBoxType;
    label: string;
    icon: React.ElementType;
    counter?: number;
  }> = [
    { id: 'inbox', label: 'Boîte de réception', icon: Inbox, counter: mailCounters.inbox },
    { id: 'outbox', label: 'Messages envoyés', icon: Send, counter: mailCounters.outbox },
    { id: 'draft', label: 'Brouillons', icon: FileEdit, counter: mailCounters.draft },
    { id: 'trash', label: 'Corbeille', icon: Trash2, counter: mailCounters.trash },
  ];

  const currentFolder = folders.find((f) => f.id === activeMailbox) || folders[0];
  const CurrentFolderIcon = currentFolder.icon;

  // Themes using a horizontal top folder ribbon + detached 2-pane split (no left folder column)
  const usesTopFolderRibbon =
    uiTheme === 'pulse' || uiTheme === 'nova' || uiTheme === 'horizon';

  // Google M3E uses detached tonal containers with gaps; Apple Pro & Obsidian use unified 3-pane window
  const usesDetachedM3EPanes = uiTheme === 'google_m3e';

  if (usesTopFolderRibbon) {
    const isNova = uiTheme === 'nova';
    const isHorizon = uiTheme === 'horizon';

    return (
      <div className="w-full max-w-7xl mx-auto space-y-4">
        {/* Top Horizontal Folder Ribbon */}
        <div
          className={`flex flex-wrap items-center justify-between gap-3 p-2.5 ${
            isNova
              ? 'rounded-2xl bg-[#131620] border border-white/[0.08]'
              : isHorizon
                ? 'rounded-3xl bg-white/95 border border-white shadow-xs'
                : 'rounded-2xl bg-white ring-1 ring-black/[0.06] shadow-xs'
          }`}
        >
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {folders.map((folder) => {
              const Icon = folder.icon;
              const isActive = activeMailbox === folder.id;
              return (
                <button
                  key={folder.id}
                  type="button"
                  onClick={() => setActiveMailbox(folder.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                    isActive
                      ? isNova
                        ? 'bg-amber-400 text-slate-950 font-bold'
                        : isHorizon
                          ? 'bg-[#0A66FF] text-white'
                          : 'bg-[#121318] text-white'
                      : isNova
                        ? 'text-slate-400 hover:text-white hover:bg-white/[0.06]'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{folder.label}</span>
                  {typeof folder.counter === 'number' && folder.counter > 0 && (
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                        isActive
                          ? isNova
                            ? 'bg-slate-950/20 text-slate-950'
                            : 'bg-white/20 text-white'
                          : isNova
                            ? 'bg-white/10 text-slate-200'
                            : 'bg-slate-200/80 text-slate-700'
                      }`}
                    >
                      {folder.counter}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={refreshMailList}
              disabled={isMailLoading}
              title="Rafraîchir"
              className={`p-2 rounded-full transition-colors ${
                isNova
                  ? 'bg-white/[0.06] text-slate-300 hover:text-white'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900'
              }`}
            >
              <RotateCw className={`w-3.5 h-3.5 ${isMailLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              type="button"
              onClick={() => openComposeModal()}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-colors ${
                isNova
                  ? 'bg-amber-400 hover:bg-amber-300 text-slate-950'
                  : isHorizon
                    ? 'bg-[#0A66FF] hover:bg-[#0052D9] text-white'
                    : 'bg-[#121318] hover:bg-indigo-600 text-white'
              }`}
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Nouveau message</span>
            </button>
          </div>
        </div>

        {/* Detached 2-Column Split */}
        <div className="h-[calc(100vh-210px)] min-h-[560px] grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div
            className={`lg:col-span-5 p-4 flex flex-col overflow-hidden ${
              isNova
                ? 'rounded-3xl bg-[#131620] border border-white/[0.08]'
                : isHorizon
                  ? 'rounded-3xl bg-white border border-white shadow-xs'
                  : 'rounded-[24px] bg-white ring-1 ring-black/[0.06] shadow-xs'
            } ${selectedMailId ? 'hidden lg:flex' : 'flex'}`}
          >
            <MessageListFeed />
          </div>

          <div
            className={`lg:col-span-7 p-4 sm:p-5 flex flex-col overflow-hidden ${
              isNova
                ? 'rounded-3xl bg-[#131620] border border-white/[0.08]'
                : isHorizon
                  ? 'rounded-3xl bg-white border border-white shadow-xs'
                  : 'rounded-[24px] bg-white ring-1 ring-black/[0.06] shadow-xs'
            } ${!selectedMailId ? 'hidden lg:flex' : 'flex'}`}
          >
            <MessageDetailPane />
          </div>
        </div>

        <ComposeMessageModal />
      </div>
    );
  }

  if (usesDetachedM3EPanes) {
    return (
      <div className="w-full max-w-7xl mx-auto space-y-4">
        <div className="h-[calc(100vh-140px)] min-h-[620px] flex flex-col lg:flex-row gap-3">
          {/* Tonal Pixel Folder Rail */}
          <div className="hidden lg:flex p-4 rounded-[28px] bg-[#E6EEF8] shrink-0">
            <MailboxSidebar />
          </div>

          {/* Mobile Folder Bar */}
          <div className="lg:hidden p-3.5 rounded-[24px] bg-[#E6EEF8] shrink-0">
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setIsMobileFolderMenuOpen(!isMobileFolderMenuOpen)}
                className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-white text-xs font-bold text-[#191C20]"
              >
                <CurrentFolderIcon className="w-4 h-4 text-[#00639B]" />
                <span>{currentFolder.label}</span>
                <ChevronDown className="w-3.5 h-3.5 text-[#42474E] ml-1" />
              </button>

              <button
                type="button"
                onClick={() => openComposeModal()}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#00639B] text-white text-xs font-bold"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Écrire</span>
              </button>
            </div>

            {isMobileFolderMenuOpen && (
              <div className="mt-2.5 p-1.5 rounded-[22px] bg-white space-y-1">
                {folders.map((folder) => {
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
                      className={`w-full flex items-center justify-between px-3.5 py-2 rounded-full text-xs font-semibold ${
                        isActive ? 'bg-[#D3E4FF] text-[#001C38] font-bold' : 'text-[#42474E]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="w-4 h-4" />
                        <span>{folder.label}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Detached M3E Message List */}
          <div
            className={`w-full lg:w-80 xl:w-96 rounded-[28px] bg-white p-4 shrink-0 flex flex-col overflow-hidden ${
              selectedMailId ? 'hidden lg:flex' : 'flex'
            }`}
          >
            <MessageListFeed />
          </div>

          {/* Detached M3E Detail Reader */}
          <div
            className={`flex-1 rounded-[28px] bg-white p-4 sm:p-6 shrink min-w-0 flex flex-col overflow-hidden ${
              !selectedMailId ? 'hidden lg:flex' : 'flex'
            }`}
          >
            <MessageDetailPane />
          </div>
        </div>

        <ComposeMessageModal />
      </div>
    );
  }

  // Apple Pro & Obsidian: Unified 3-pane vibrancy / razor-thin studio window
  return (
    <div className="w-full max-w-7xl mx-auto space-y-4">
      <div
        className={`h-[calc(100vh-140px)] min-h-[640px] overflow-hidden flex flex-col lg:flex-row relative ${
          uiTheme === 'obsidian'
            ? 'bg-[#111319] rounded-xl border border-white/[0.08]'
            : 'bg-white/95 backdrop-blur-xl rounded-[18px] border border-black/[0.08] shadow-[0_4px_20px_rgba(0,0,0,0.05)]'
        }`}
      >
        <div
          className={`hidden lg:flex p-5 border-r shrink-0 ${
            uiTheme === 'obsidian'
              ? 'border-white/[0.08] bg-[#0D0F15]'
              : 'border-black/[0.06] bg-[#ECECEF]/70'
          }`}
        >
          <MailboxSidebar />
        </div>

        <div className="lg:hidden p-3.5 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/40 shrink-0">
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setIsMobileFolderMenuOpen(!isMobileFolderMenuOpen)}
              className="flex items-center gap-2 px-3 py-2 rounded-input bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-800 dark:text-slate-100 shadow-subtle"
            >
              <CurrentFolderIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>{currentFolder.label}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
            </button>

            <button
              type="button"
              onClick={() => openComposeModal()}
              className="flex items-center gap-1.5 px-3 py-2 rounded-input bg-indigo-600 text-white text-xs font-bold shadow-subtle"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Écrire</span>
            </button>
          </div>

          {isMobileFolderMenuOpen && (
            <div className="mt-2.5 p-1.5 rounded-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-modal space-y-1">
              {folders.map((folder) => {
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
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-input text-xs font-semibold ${
                      isActive
                        ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4" />
                      <span>{folder.label}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div
          className={`w-full lg:w-80 xl:w-96 border-r p-4 shrink-0 flex flex-col overflow-hidden ${
            uiTheme === 'obsidian' ? 'border-white/[0.08]' : 'border-black/[0.06]'
          } ${selectedMailId ? 'hidden lg:flex' : 'flex'}`}
        >
          <MessageListFeed />
        </div>

        <div
          className={`flex-1 p-3 sm:p-5 shrink min-w-0 flex flex-col overflow-hidden ${
            !selectedMailId ? 'hidden lg:flex' : 'flex'
          }`}
        >
          <MessageDetailPane />
        </div>
      </div>

      <ComposeMessageModal />
    </div>
  );
};
