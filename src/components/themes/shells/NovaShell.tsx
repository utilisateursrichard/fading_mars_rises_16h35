import React from 'react';
import { Flame, Menu, MapPin } from 'lucide-react';
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
 * BetterSchool Signature "Nova" dark shell with a top Dynamic Island live class pill
 * and sleek centered pill navigation.
 */
export const NovaShell: React.FC<ShellProps> = ({
  isTutor,
  isMobileDrawerOpen,
  onOpenMobileMenu,
  onCloseMobileDrawer,
  children,
}) => {
  const { navItems, activeTab, setActiveTab } = useAppNavigation();
  const { nextClassSpotlight, setSelectedEventModal, currentTimeLabel } = useDashboardData();

  return (
    <div
      className={`bs-shell-nova relative flex flex-col bg-[#0C0E14] text-slate-100 antialiased ${
        isTutor ? 'h-screen max-h-screen overflow-hidden' : 'min-h-screen'
      }`}
      style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif" }}
    >
      {/* Subtle Warm Amber & Emerald Ambient Depth */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-36 left-1/4 w-[480px] h-[480px] rounded-full bg-amber-500/[0.08] blur-[130px]" />
        <div className="absolute bottom-0 right-1/4 w-[440px] h-[440px] rounded-full bg-emerald-500/[0.07] blur-[130px]" />
      </div>

      {/* Top Bar with Interactive Dynamic Island */}
      <header className="sticky top-0 z-30 bg-[#0C0E14]/85 backdrop-blur-xl border-b border-white/[0.06] shrink-0">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-2.5 pb-2 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={onOpenMobileMenu}
              className="lg:hidden p-2 rounded-full bg-white/[0.06] text-slate-200"
              aria-label="Ouvrir le menu"
            >
              <Menu className="w-4 h-4" />
            </button>

            <button
              onClick={() => setActiveTab('dashboard')}
              className="flex items-center gap-2"
            >
              <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-slate-950 flex items-center justify-center shadow-sm">
                <Flame className="w-4 h-4 fill-slate-950" />
              </span>
              <span className="font-extrabold text-sm tracking-tight text-white hidden sm:inline">
                BetterSchool
              </span>
            </button>
          </div>

          {/* Center Dynamic Island Live Class Pill */}
          {nextClassSpotlight ? (
            <button
              onClick={() => setSelectedEventModal(nextClassSpotlight.event)}
              className="hidden md:flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-[#161A26] hover:bg-[#1D2232] border border-white/10 shadow-[0_8px_24px_rgba(0,0,0,0.45)] transition-all max-w-md group"
            >
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${
                  nextClassSpotlight.isLive
                    ? 'bg-emerald-400 animate-pulse'
                    : 'bg-amber-400'
                }`}
              />
              <span className="text-xs font-semibold text-white group-hover:text-amber-300 truncate transition-colors">
                {nextClassSpotlight.event.subject}
              </span>
              <span className="text-[11px] font-mono text-slate-400 shrink-0">
                {nextClassSpotlight.event.startTime}
              </span>
              <span className="inline-flex items-center gap-0.5 text-[11px] text-amber-300/90 shrink-0">
                <MapPin className="w-3 h-3" />
                {nextClassSpotlight.event.room}
              </span>
            </button>
          ) : (
            <div className="hidden md:flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#161A26] border border-white/10 font-mono text-xs text-slate-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>{currentTimeLabel} · Journée libre</span>
            </div>
          )}

          <ShellUtilityControls variant="nova" />
        </div>

        {/* Sleek Horizontal Pill Navigation */}
        <nav className="hidden lg:flex max-w-6xl mx-auto px-6 pb-2.5 items-center gap-1 overflow-x-auto no-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-white text-slate-950 font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.06]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
                {item.badge !== undefined && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      isActive ? 'bg-slate-900 text-white' : 'bg-amber-400/20 text-amber-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </header>

      {/* Main Workspace */}
      <main
        className={`relative z-10 flex-1 max-w-6xl w-full mx-auto ${
          isTutor
            ? 'p-2 sm:p-3 lg:p-4 overflow-hidden flex flex-col min-h-0 pb-16 lg:pb-4'
            : 'p-4 sm:p-6 lg:py-6 pb-20 lg:pb-10'
        }`}
      >
        {children}
      </main>

      <MobileNav isDrawerOpen={isMobileDrawerOpen} onCloseDrawer={onCloseMobileDrawer} />
    </div>
  );
};
