import React, { useState, useRef, useEffect } from 'react';
import { 
  Bell, 
  Menu, 
  Plus, 
  CheckCheck, 
  MessageSquare, 
  ExternalLink, 
  PanelLeft,
  User
} from 'lucide-react';
import { useSchool } from '../../context/SchoolContext';

interface HeaderProps {
  onOpenMobileMenu: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenMobileMenu }) => {
  const { 
    student, 
    activeTab,
    setActiveTab,
    notifications, 
    unreadNotificationsCount, 
    unreadMessagesTotal,
    markNotificationsAsRead,
    setIsNewHomeworkModalOpen,
    isSidebarCollapsed,
    toggleSidebar,
    isDemoMode,
    toggleDemoMode
  } = useSchool();

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  // Close notifications popover on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getPageTitle = () => {
    switch (activeTab) {
      case 'dashboard': return "Vue d'ensemble";
      case 'agenda': return 'Agenda';
      case 'messages': return 'Messagerie';
      case 'results': return 'Notes & Résultats';
      case 'courses': return 'Espace Cours';
      case 'tutor': return 'Tuteur IA';
      default: return 'Accueil';
    }
  };

  return (
    <header className="sticky top-0 z-20 h-14 sm:h-16 bg-white/75 backdrop-blur-xl border-b border-slate-200/70 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4 transition-all shrink-0">
      
      {/* Left: Sidebar Toggle & Breadcrumb Title */}
      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
        
        {/* Mobile menu trigger */}
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          aria-label="Ouvrir le menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Desktop Sidebar Toggle */}
        <button
          onClick={toggleSidebar}
          className="hidden lg:flex p-2 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          title={isSidebarCollapsed ? "Déplier le menu (Ctrl+B)" : "Rétracter le menu (Ctrl+B)"}
        >
          <PanelLeft className="w-4 h-4" />
        </button>

        <span className="hidden sm:inline text-slate-300">/</span>

        {/* Page title & context badge */}
        <div className="flex items-center gap-2 min-w-0">
          <h1 className="text-sm sm:text-base font-extrabold text-slate-900 truncate">
            {getPageTitle()}
          </h1>

          <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100/80">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Semaine A</span>
          </span>
        </div>

      </div>

      {/* Right: Quick Shortcuts & Notification Center */}
      <div className="flex items-center gap-2 sm:gap-3">
        
        {/* Quick Add Homework Button */}
        <button
          onClick={() => setIsNewHomeworkModalOpen(true)}
          className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-indigo-600 text-white text-xs font-bold transition-all shadow-subtle m3-press"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Devoir</span>
        </button>

        {/* Demo / Live Mode Toggle Button */}
        <button
          onClick={toggleDemoMode}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border m3-press ${
            isDemoMode
              ? 'bg-amber-50 hover:bg-amber-100/80 text-amber-800 border-amber-300/80 shadow-sm'
              : 'bg-emerald-50 hover:bg-emerald-100/80 text-emerald-800 border-emerald-300/80 shadow-sm'
          }`}
          title={isDemoMode ? "Mode Démo actif (fausses données). Cliquez pour passer en Mode Réel." : "Mode Réel actif (sans fausses données). Cliquez pour activer le Mode Démo."}
        >
          <span className={`w-2 h-2 rounded-full ${isDemoMode ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
          <span>{isDemoMode ? 'Mode Démo' : 'Mode Réel'}</span>
        </button>

        {/* Direct Messages Shortcut */}
        <button
          onClick={() => setActiveTab('messages')}
          className="relative p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          title="Messagerie"
        >
          <MessageSquare className="w-4 h-4" />
          {unreadMessagesTotal > 0 && (
            <span className="absolute top-1.5 right-1.5 min-w-4 h-4 px-1 rounded-full bg-indigo-600 text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-white">
              {unreadMessagesTotal}
            </span>
          )}
        </button>

        {/* Notifications Popover */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="relative p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            title="Notifications"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white" />
            )}
          </button>

          {isNotifOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-3xl shadow-card-hover border border-slate-200/80 p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-sm text-slate-900">Notifications</span>
                  {unreadNotificationsCount > 0 && (
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-indigo-50 text-indigo-700 rounded-full">
                      {unreadNotificationsCount} non lues
                    </span>
                  )}
                </div>
                {unreadNotificationsCount > 0 && (
                  <button
                    onClick={markNotificationsAsRead}
                    className="text-[11px] text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span>Tout marquer lu</span>
                  </button>
                )}
              </div>

              <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`p-3 rounded-2xl transition-all ${
                      notif.read ? 'bg-white hover:bg-slate-50' : 'bg-indigo-50/50 hover:bg-indigo-50/80 border-l-2 border-indigo-600'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-bold text-slate-900">
                        {notif.title}
                      </p>
                      <span className="text-[10px] text-slate-400 whitespace-nowrap">
                        {notif.time}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                      {notif.description}
                    </p>
                  </div>
                ))}
              </div>

              <div className="pt-2 mt-2 border-t border-slate-100 text-center">
                <button 
                  onClick={() => {
                    setIsNotifOpen(false);
                    setActiveTab('messages');
                  }}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors inline-flex items-center gap-1"
                >
                  <span>Ouvrir la messagerie</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Mini Avatar */}
        <div 
          onClick={() => setActiveTab('dashboard')}
          className="cursor-pointer pl-1"
          title="Mon profil"
        >
          {student?.avatar ? (
            <img
              src={student.avatar}
              alt="Avatar"
              className="w-8 h-8 rounded-full object-cover ring-2 ring-slate-200/80 hover:ring-indigo-400 transition-all"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs ring-2 ring-slate-200/80 hover:ring-indigo-400 transition-all">
              {student?.firstName ? student.firstName.charAt(0).toUpperCase() : <User className="w-3.5 h-3.5" />}
            </div>
          )}
        </div>

      </div>

    </header>
  );
};
