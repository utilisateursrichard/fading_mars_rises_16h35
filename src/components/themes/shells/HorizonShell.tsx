import React from 'react';
import { Compass, Menu } from 'lucide-react';
import { useAppNavigation } from '../../../hooks/useAppNavigation';
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
 * Airy spatial focus canvas with minimal top bar and floating bottom-center dock.
 */
export const HorizonShell: React.FC<ShellProps> = ({
  isTutor,
  isMobileDrawerOpen,
  onOpenMobileMenu,
  onCloseMobileDrawer,
  children,
}) => {
  const { navItems, schoolName, pageTitle, activeTab, setActiveTab } = useAppNavigation();

  return (
    <div
      className={`bs-shell-horizon flex flex-col bg-[#ECEFF4] text-slate-900 antialiased ${
        isTutor ? 'h-screen max-h-screen overflow-hidden' : 'min-h-screen'
      }`}
      style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      {/* Minimal Top Utility Strip */}
      <header className="sticky top-0 z-20 h-14 bg-[#ECEFF4]/85 backdrop-blur-xl px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            onClick={onOpenMobileMenu}
            className="lg:hidden p-2 rounded-full bg-white/80 text-slate-600 hover:text-slate-900"
            aria-label="Ouvrir le menu"
          >
            <Menu className="w-4 h-4" />
          </button>
          <button
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center gap-2 min-w-0"
          >
            <span className="w-8 h-8 rounded-full bg-[#0A66FF] text-white flex items-center justify-center shadow-sm shrink-0">
              <Compass className="w-4 h-4" />
            </span>
            <span className="font-bold text-sm tracking-tight text-slate-900 hidden sm:inline">
              BetterSchool
            </span>
          </button>
          <span className="hidden md:inline text-xs text-slate-400 truncate max-w-[180px]">
            · {schoolName}
          </span>
        </div>

        <div className="hidden sm:flex items-center px-3.5 py-1 rounded-full bg-white/80 border border-white text-xs font-semibold text-slate-700 shadow-xs">
          {pageTitle}
        </div>

        <ShellUtilityControls variant="horizon" />
      </header>

      {/* Main Content */}
      <main
        className={`flex-1 max-w-5xl w-full mx-auto ${
          isTutor
            ? 'p-2 sm:p-3 lg:pb-24 overflow-hidden flex flex-col min-h-0'
            : 'p-4 sm:p-6 pb-24 lg:pb-28'
        }`}
      >
        {children}
      </main>

      {/* Floating Bottom-Center Dock (Desktop) */}
      <nav
        aria-label="Navigation principale"
        className="hidden lg:flex fixed bottom-4 left-1/2 -translate-x-1/2 z-40 items-center gap-1.5 p-1.5 rounded-2xl bg-white/85 backdrop-blur-2xl border border-white shadow-[0_12px_36px_-8px_rgba(15,23,42,0.18)]"
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              title={item.label}
              className={`group relative flex flex-col items-center justify-center px-3 py-2 rounded-xl transition-all ${
                isActive
                  ? 'bg-[#0A66FF] text-white shadow-sm -translate-y-0.5'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/80'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="text-[10px] font-semibold mt-0.5 leading-none">
                {item.shortLabel}
              </span>
              {item.badge !== undefined && (
                <span
                  className={`absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full text-[9px] font-bold flex items-center justify-center ring-2 ring-white ${
                    isActive ? 'bg-slate-900 text-white' : 'bg-[#0A66FF] text-white'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <MobileNav isDrawerOpen={isMobileDrawerOpen} onCloseDrawer={onCloseMobileDrawer} />
    </div>
  );
};
