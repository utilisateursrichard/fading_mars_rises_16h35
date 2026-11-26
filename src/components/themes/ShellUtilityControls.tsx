import React, { useState, useRef, useEffect } from 'react';
import { Bell, Plus, Watch, CheckCheck, ExternalLink, User } from 'lucide-react';
import { useAppNavigation } from '../../hooks/useAppNavigation';
import { WearPairingModal } from '../modals/WearPairingModal';

export type ShellVariant =
  | 'pulse'
  | 'google_m3e'
  | 'nova'
  | 'apple_pro'
  | 'horizon'
  | 'obsidian';

interface ShellUtilityControlsProps {
  variant: ShellVariant;
  showAvatar?: boolean;
  showAddHomework?: boolean;
}

const BUTTON_STYLES: Record<
  ShellVariant,
  {
    primary: string;
    secondary: string;
    icon: string;
    popover: string;
    badgeDot: string;
  }
> = {
  pulse: {
    primary:
      'px-3.5 py-1.5 rounded-full bg-[#121318] hover:bg-indigo-600 text-white text-xs font-semibold transition-colors shadow-xs',
    secondary:
      'px-3 py-1.5 rounded-full bg-white hover:bg-slate-50 text-slate-800 ring-1 ring-black/[0.08] text-xs font-medium transition-colors',
    icon: 'p-2 rounded-full text-slate-600 hover:text-slate-900 hover:bg-white/90 transition-colors',
    popover:
      'bg-white ring-1 ring-black/[0.08] text-slate-900 rounded-3xl shadow-[0_20px_48px_-12px_rgba(15,23,42,0.16)]',
    badgeDot: 'bg-rose-500',
  },
  google_m3e: {
    primary:
      'px-4 py-2 rounded-full bg-[#00639B] hover:bg-[#004D7A] text-white text-xs font-semibold transition-colors',
    secondary:
      'px-3.5 py-2 rounded-full bg-[#D3E4FF] hover:bg-[#BFD8FF] text-[#001C38] text-xs font-semibold transition-colors',
    icon: 'p-2 rounded-full text-[#42474E] hover:text-[#191C20] hover:bg-[#DCE3EE] transition-colors',
    popover: 'bg-[#EEF3FA] border border-[#C2C7CF]/70 text-[#191C20] rounded-[28px] shadow-xl',
    badgeDot: 'bg-[#BA1A1A]',
  },
  nova: {
    primary:
      'px-3.5 py-1.5 rounded-full bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-semibold transition-colors',
    secondary:
      'px-3 py-1.5 rounded-full bg-white/[0.06] hover:bg-white/[0.11] border border-white/10 text-slate-200 text-xs font-medium transition-colors',
    icon: 'p-2 rounded-full text-slate-300 hover:text-white hover:bg-white/[0.08] transition-colors',
    popover:
      'bg-[#141720]/95 backdrop-blur-2xl border border-white/15 text-slate-100 rounded-2xl shadow-2xl',
    badgeDot: 'bg-amber-400',
  },
  apple_pro: {
    primary:
      'px-3 py-1.5 rounded-lg bg-[#007AFF] hover:bg-[#0066D6] text-white text-xs font-medium transition-colors shadow-xs',
    secondary:
      'px-2.5 py-1.5 rounded-lg bg-black/[0.05] hover:bg-black/[0.09] text-slate-800 text-xs font-medium transition-colors',
    icon: 'p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-black/[0.06] transition-colors',
    popover:
      'bg-white/95 backdrop-blur-2xl border border-black/[0.08] text-slate-900 rounded-2xl shadow-[0_20px_48px_-12px_rgba(0,0,0,0.2)]',
    badgeDot: 'bg-[#FF3B30]',
  },
  obsidian: {
    primary:
      'px-3 py-1.5 rounded-lg bg-[#38BDF8] hover:bg-[#7DD3FC] text-[#081018] text-xs font-semibold transition-colors',
    secondary:
      'px-2.5 py-1.5 rounded-lg border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 text-xs font-medium transition-colors',
    icon: 'p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.07] transition-colors',
    popover: 'bg-[#151821] border border-white/15 text-slate-100 rounded-xl shadow-2xl',
    badgeDot: 'bg-[#38BDF8]',
  },
  horizon: {
    primary:
      'px-3.5 py-1.5 rounded-full bg-[#0A66FF] hover:bg-[#0052D9] text-white text-xs font-semibold shadow-sm transition-colors',
    secondary:
      'px-3 py-1.5 rounded-full bg-white/90 hover:bg-white text-slate-700 border border-slate-200/80 text-xs font-semibold shadow-xs transition-colors',
    icon: 'p-2 rounded-full text-slate-500 hover:text-slate-900 hover:bg-white/80 transition-colors',
    popover: 'bg-white border border-slate-200/80 text-slate-900 rounded-2xl shadow-xl',
    badgeDot: 'bg-[#0A66FF]',
  },
};

export const ShellUtilityControls: React.FC<ShellUtilityControlsProps> = ({
  variant,
  showAvatar = true,
  showAddHomework = true,
}) => {
  const {
    student,
    setActiveTab,
    notifications,
    unreadNotificationsCount,
    markNotificationsAsRead,
    setIsNewHomeworkModalOpen,
    isDemoAvailable,
    isDemoMode,
    toggleDemoMode,
  } = useAppNavigation();

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isWearModalOpen, setIsWearModalOpen] = useState(false);
  const [initialWearCode, setInitialWearCode] = useState('');
  const notifRef = useRef<HTMLDivElement>(null);
  const styles = BUTTON_STYLES[variant];
  const isDark = variant === 'obsidian' || variant === 'nova';

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const wearPair = params.get('wearPair');
      if (wearPair) {
        setInitialWearCode(wearPair);
        setIsWearModalOpen(true);
      }
    }
  }, []);

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
    <div className="flex items-center gap-2 shrink-0">
      {showAddHomework && (
        <button
          onClick={() => setIsNewHomeworkModalOpen(true)}
          className={`hidden sm:inline-flex items-center gap-1.5 ${styles.primary}`}
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Devoir</span>
        </button>
      )}

      {import.meta.env.DEV && isDemoAvailable && (
        <button
          onClick={toggleDemoMode}
          className={`inline-flex items-center gap-1.5 ${styles.secondary}`}
          title={isDemoMode ? 'Mode Démo (dev uniquement)' : 'Mode Réel'}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              isDemoMode ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'
            }`}
          />
          <span>{isDemoMode ? 'Démo' : 'Réel'}</span>
        </button>
      )}

      <button
        onClick={() => setIsWearModalOpen(true)}
        className={`inline-flex items-center gap-1.5 ${styles.secondary}`}
        title="Wear OS"
      >
        <Watch className="w-3.5 h-3.5" />
        <span className="hidden md:inline">Wear OS</span>
      </button>

      <div className="relative" ref={notifRef}>
        <button
          onClick={() => setIsNotifOpen((prev) => !prev)}
          className={`relative ${styles.icon}`}
          title="Notifications"
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4" />
          {unreadNotificationsCount > 0 && (
            <span className={`absolute top-1 right-1 w-2 h-2 rounded-full ${styles.badgeDot}`} />
          )}
        </button>

        {isNotifOpen && (
          <div className={`absolute right-0 mt-2 w-80 sm:w-96 p-4 z-50 ${styles.popover}`}>
            <div
              className={`flex items-center justify-between pb-2.5 mb-2 border-b ${
                isDark ? 'border-white/10' : 'border-slate-200/80'
              }`}
            >
              <span className="font-bold text-sm">Notifications</span>
              {unreadNotificationsCount > 0 && (
                <button
                  onClick={markNotificationsAsRead}
                  className="text-[11px] font-semibold opacity-80 hover:opacity-100 inline-flex items-center gap-1"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Tout marquer lu</span>
                </button>
              )}
            </div>

            <div className="space-y-1.5 max-h-64 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="text-xs opacity-60 py-6 text-center">Aucune notification.</p>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`p-2.5 rounded-xl text-xs ${
                      notif.read
                        ? 'opacity-75'
                        : isDark
                          ? 'bg-white/[0.05] border border-white/10'
                          : 'bg-black/[0.04]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold">{notif.title}</p>
                      <span className="text-[10px] opacity-60 whitespace-nowrap">{notif.time}</span>
                    </div>
                    <p className="text-[11px] opacity-75 mt-0.5">{notif.description}</p>
                  </div>
                ))
              )}
            </div>

            <div
              className={`pt-2.5 mt-2 border-t text-center ${
                isDark ? 'border-white/10' : 'border-slate-200/80'
              }`}
            >
              <button
                onClick={() => {
                  setIsNotifOpen(false);
                  setActiveTab('messages');
                }}
                className="text-xs font-semibold inline-flex items-center gap-1 opacity-85 hover:opacity-100"
              >
                <span>Ouvrir la messagerie</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}
      </div>

      {showAvatar && (
        <button onClick={() => setActiveTab('dashboard')} title="Mon profil" className="shrink-0">
          {student?.avatar ? (
            <img
              src={student.avatar}
              alt="Avatar"
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                isDark
                  ? 'bg-white/10 text-slate-200 border border-white/10'
                  : variant === 'google_m3e'
                    ? 'bg-[#D3E4FF] text-[#001C38]'
                    : 'bg-slate-200/80 text-slate-700'
              }`}
            >
              {student?.firstName ? (
                student.firstName.charAt(0).toUpperCase()
              ) : (
                <User className="w-3.5 h-3.5" />
              )}
            </div>
          )}
        </button>
      )}

      <WearPairingModal
        isOpen={isWearModalOpen}
        onClose={() => setIsWearModalOpen(false)}
        initialPairCode={initialWearCode}
      />
    </div>
  );
};
