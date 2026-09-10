import React, { useState, useRef, useEffect } from 'react';
import { 
  Bell, 
  Search, 
  Menu, 
  X, 
  Calendar as CalendarIcon, 
  CheckCheck, 
  Plus, 
  ExternalLink,
  MessageSquare
} from 'lucide-react';
import { useSchool } from '../../context/SchoolContext';

interface HeaderProps {
  onOpenMobileMenu: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenMobileMenu }) => {
  const { 
    student, 
    notifications, 
    unreadNotificationsCount, 
    markNotificationsAsRead,
    globalSearch,
    setGlobalSearch,
    setIsNewHomeworkModalOpen,
    setActiveTab
  } = useSchool();

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const todayFormatted = new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  }).format(new Date());

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-3 z-20 m3-glass border border-indigo-100/80 rounded-full shadow-[0_8px_30px_-6px_rgba(79,70,229,0.07)] px-3 sm:px-6 py-2 transition-all mb-4">
      <div className="flex items-center justify-between gap-3 max-w-7xl mx-auto">
        
        {/* Left: Mobile trigger & Date pill */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenMobileMenu}
            className="lg:hidden p-2 rounded-full text-slate-600 hover:text-slate-950 hover:bg-indigo-50 transition-colors m3-press"
            aria-label="Ouvrir le menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="hidden sm:flex items-center gap-2.5 px-4 py-1.5 bg-indigo-50/80 rounded-full text-xs font-bold text-indigo-950 border border-indigo-100/80">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="capitalize">{todayFormatted}</span>
            <span className="text-indigo-300">•</span>
            <span className="text-indigo-700 text-[11px] font-extrabold uppercase tracking-wider">Semaine A</span>
          </div>
        </div>

        {/* Center: Floating M3E Pill Search */}
        <div className="flex-1 max-w-md mx-2">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Rechercher un cours, un prof, un devoir..."
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              className="w-full pl-9 pr-14 py-2 bg-slate-100/80 hover:bg-slate-100/90 focus:bg-white text-xs font-semibold text-slate-800 placeholder-slate-400 rounded-full border border-slate-200/70 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100/70 outline-none transition-all"
            />
            {globalSearch ? (
              <button
                onClick={() => setGlobalSearch('')}
                className="absolute right-3 p-1 text-slate-400 hover:text-slate-700 rounded-full"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : (
              <span className="hidden sm:flex absolute right-3 items-center px-1.5 py-0.5 text-[10px] font-extrabold text-slate-400 bg-white border border-slate-200/80 rounded-md">
                ⌘K
              </span>
            )}
          </div>
        </div>

        {/* Right: Actions, Notifications & Profile */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Quick add homework button - M3E Pill FAB */}
          <button
            onClick={() => setIsNewHomeworkModalOpen(true)}
            className="hidden md:flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-indigo-600 via-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-full text-xs font-bold shadow-md shadow-indigo-500/25 transition-all m3-press"
          >
            <Plus className="w-4 h-4" />
            <span>Devoir</span>
          </button>

          {/* Notifications Dropdown */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              className="relative p-2.5 rounded-full text-slate-600 hover:text-slate-950 hover:bg-indigo-50/80 transition-colors m3-press"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white animate-pulse" />
              )}
            </button>

            {isNotifOpen && (
              <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white rounded-[24px] shadow-modal border border-indigo-100/90 p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm text-slate-900">Notifications</span>
                    {unreadNotificationsCount > 0 && (
                      <span className="px-2 py-0.5 text-[10px] font-black bg-indigo-100 text-indigo-900 rounded-full">
                        {unreadNotificationsCount}
                      </span>
                    )}
                  </div>
                  {unreadNotificationsCount > 0 && (
                    <button
                      onClick={markNotificationsAsRead}
                      className="text-[11px] text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      <span>Tout lire</span>
                    </button>
                  )}
                </div>

                <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                  {notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`p-3 rounded-2xl transition-colors ${
                        notif.read ? 'bg-white hover:bg-slate-50' : 'bg-indigo-50/60 hover:bg-indigo-50/90 border-l-3 border-indigo-600'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-bold text-slate-900">
                          {notif.title}
                        </p>
                        <span className="text-[10px] text-slate-400 tabular-nums whitespace-nowrap font-semibold">
                          {notif.time}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
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

          {/* Quick Chat Shortcut Icon */}
          <button
            onClick={() => setActiveTab('messages')}
            className="p-2.5 rounded-full text-slate-600 hover:text-slate-950 hover:bg-indigo-50/80 transition-colors m3-press"
            title="Messagerie"
          >
            <MessageSquare className="w-4 h-4" />
          </button>

          {/* Profile mini */}
          <div 
            onClick={() => setActiveTab('dashboard')}
            className="cursor-pointer pl-1 m3-press"
          >
            <img
              src={student?.avatar}
              alt="Avatar"
              className="w-9 h-9 rounded-full object-cover ring-2 ring-indigo-200 hover:ring-indigo-600 transition-all"
            />
          </div>
        </div>

      </div>
    </header>
  );
};
