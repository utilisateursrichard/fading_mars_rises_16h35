import React from 'react';
import { Menu, User } from 'lucide-react';
import { useAppNavigation } from '../../../hooks/useAppNavigation';
import { useDashboardData } from '../../../hooks/useDashboardData';
import { ShellUtilityControls } from '../ShellUtilityControls';
import { MobileNav } from '../../layout/MobileNav';

interface ShellProps {
  isTutor: boolean;
  isMobileDrawerOpen: boolean;
  onOpenMobileMenu: () => void;
  onCloseMobileDrawer: () => void;
  children: React.ReactNode;
}

/**
 * BetterSchool Signature "Pulse" shell: detached floating icon island on left,
 * subtle dot-grid platinum canvas, and frameless live-clock header.
 */
export const PulseShell: React.FC<ShellProps> = ({
  isTutor,
  isMobileDrawerOpen,
  onOpenMobileMenu,
  onCloseMobileDrawer,
  children,
}) => {
  const { navItems, schoolName, pageTitle, activeTab, setActiveTab, student } =
    useAppNavigation();
  const { currentTimeLabel } = useDashboardData();

  return (
    <div
      className={`bs-shell-pulse relative flex flex-col bg-[#F7F6F2] text-[#121318] antialiased ${
        isTutor ? 'h-screen max-h-screen overflow-hidden' : 'min-h-screen'
      }`}
      style={{
        fontFamily: "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif",
        backgroundImage: 'radial-gradient(rgba(18, 19, 24, 0.055) 1px, transparent 1px)',
        backgroundSize: '20px 20px',
      }}
    >
      {/* Detached Floating Left Icon Island (Desktop) */}
      <aside className="hidden lg:flex fixed left-4 top-1/2 -translate-y-1/2 z-30 flex-col items-center gap-1.5 p-2 rounded-[26px] bg-white/95 backdrop-blur-xl shadow-[0_14px_40px_-10px_rgba(18,19,24,0.16)] ring-1 ring-black/[0.06] select-none">
        <nav className="flex flex-col items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                title={item.label}
                className={`group relative w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${
                  isActive
                    ? 'bg-[#121318] text-white shadow-sm scale-[1.03]'
                    : 'text-slate-500 hover:text-[#121318] hover:bg-slate-100'
                }`}
              >
                <Icon className="w-[18px] h-[18px]" />
                {item.badge !== undefined && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
                )}
                <span className="pointer-events-none opacity-0 group-hover:opacity-100 translate-x-1 group-hover:translate-x-0 transition-all absolute left-14 px-2.5 py-1 rounded-lg bg-[#121318] text-white text-[11px] font-semibold whitespace-nowrap shadow-lg">
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>

        <div className="w-6 h-px bg-black/[0.07] my-0.5" />

        <button
          onClick={() => setActiveTab('dashboard')}
          title={student ? `${student.firstName} ${student.lastName}`.trim() : 'Profil'}
          className="w-9 h-9 rounded-full overflow-hidden bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-700 hover:ring-2 hover:ring-indigo-500 transition-all"
        >
          {student?.avatar ? (
            <img src={student.avatar} alt="Avatar" className="w-full h-full object-cover" />
          ) : student?.firstName ? (
            student.firstName.charAt(0).toUpperCase()
          ) : (
            <User className="w-4 h-4" />
          )}
        </button>
      </aside>

      {/* Frameless Top Header */}
      <header className="sticky top-0 z-20 h-16 px-4 sm:px-6 lg:pl-24 lg:pr-8 flex items-center justify-between gap-4 bg-[#F7F6F2]/85 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onOpenMobileMenu}
            className="lg:hidden p-2 rounded-full bg-white ring-1 ring-black/[0.06] text-slate-700"
            aria-label="Ouvrir le menu"
          >
            <Menu className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2.5 min-w-0">
            <span className="font-extrabold text-base tracking-tight text-[#121318]">
              Better<span className="text-indigo-600">School</span>
            </span>
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white ring-1 ring-black/[0.06] font-mono text-[11px] font-semibold text-slate-700">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {currentTimeLabel}
            </span>
            <span className="hidden md:inline text-xs text-slate-400 truncate max-w-[180px]">
              {activeTab === 'dashboard' ? schoolName : pageTitle}
            </span>
          </div>
        </div>

        <ShellUtilityControls variant="pulse" showAvatar={false} />
      </header>

      {/* Main Workspace with Island Clearance */}
      <main
        className={`flex-1 w-full max-w-6xl mx-auto lg:pl-20 ${
          isTutor
            ? 'p-2 sm:p-3 lg:py-4 lg:pr-6 overflow-hidden flex flex-col min-h-0 pb-16 lg:pb-4'
            : 'p-4 sm:p-6 lg:py-5 lg:pr-8 pb-20 lg:pb-10'
        }`}
      >
        {children}
      </main>

      <MobileNav isDrawerOpen={isMobileDrawerOpen} onCloseDrawer={onCloseMobileDrawer} />
    </div>
  );
};
