import React from 'react';
import { Menu, PanelLeft, Sparkles, User } from 'lucide-react';
import { useAppNavigation } from '../../../hooks/useAppNavigation';
import { ShellUtilityControls } from '../ShellUtilityControls';
import { MobileNav } from '../../layout/MobileNav';
import { cleanStudentClass } from '../../../utils/student';

interface ShellProps {
  isTutor: boolean;
  isMobileDrawerOpen: boolean;
  onOpenMobileMenu: () => void;
  onCloseMobileDrawer: () => void;
  children: React.ReactNode;
}

/**
 * Dark studio command workspace inspired by Linear / Raycast with recessed inner panel.
 */
export const ObsidianShell: React.FC<ShellProps> = ({
  isTutor,
  isMobileDrawerOpen,
  onOpenMobileMenu,
  onCloseMobileDrawer,
  children,
}) => {
  const {
    navItems,
    schoolName,
    pageTitle,
    activeTab,
    setActiveTab,
    student,
    isSidebarCollapsed,
    toggleSidebar,
  } = useAppNavigation();

  const studentLabel = student
    ? `${student.firstName} ${student.lastName}`.trim() || 'Élève'
    : 'Élève';
  const studentClass = cleanStudentClass(student?.studentClass) || 'Non connecté';

  return (
    <div
      className={`bs-shell-obsidian flex bg-[#0B0C10] text-slate-100 antialiased ${
        isTutor ? 'h-screen max-h-screen overflow-hidden' : 'min-h-screen'
      }`}
      style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      {/* Slim Dark Studio Sidebar */}
      <aside
        className={`hidden lg:flex flex-col justify-between shrink-0 select-none transition-all duration-200 ${
          isSidebarCollapsed ? 'w-16 px-2 py-3' : 'w-56 px-3 py-3'
        }`}
      >
        <div className="space-y-4">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-white/[0.04] transition-colors ${
              isSidebarCollapsed ? 'justify-center' : ''
            }`}
          >
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-sky-400 to-indigo-500 flex items-center justify-center text-slate-950 shrink-0 shadow-sm">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            {!isSidebarCollapsed && (
              <div className="min-w-0 text-left">
                <span className="text-xs font-semibold text-white tracking-tight block truncate">
                  BetterSchool
                </span>
                <span className="text-[10px] text-slate-500 block truncate">{schoolName}</span>
              </div>
            )}
          </button>

          <nav className="space-y-0.5">
            {navItems.map((item, idx) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  title={isSidebarCollapsed ? item.label : undefined}
                  className={`w-full flex items-center rounded-lg transition-colors text-xs ${
                    isSidebarCollapsed
                      ? 'justify-center h-9'
                      : 'justify-between px-2.5 py-2'
                  } ${
                    isActive
                      ? 'bg-white/[0.09] text-white font-medium border border-white/[0.08]'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        isActive ? 'text-sky-400' : 'text-slate-500'
                      }`}
                    />
                    {!isSidebarCollapsed && <span className="truncate">{item.label}</span>}
                  </div>

                  {!isSidebarCollapsed && (
                    <div className="flex items-center gap-1.5 shrink-0">
                      {item.badge !== undefined && (
                        <span className="px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 font-mono text-[10px] font-semibold">
                          {item.badge}
                        </span>
                      )}
                      <span className="font-mono text-[10px] text-slate-600">{idx + 1}</span>
                    </div>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Profile Pill */}
        <div
          onClick={() => setActiveTab('dashboard')}
          className={`cursor-pointer rounded-lg border border-white/[0.07] bg-white/[0.03] hover:bg-white/[0.06] transition-colors flex items-center gap-2.5 ${
            isSidebarCollapsed ? 'p-1.5 justify-center' : 'p-2'
          }`}
        >
          {student?.avatar ? (
            <img src={student.avatar} alt="Avatar" className="w-7 h-7 rounded-md object-cover shrink-0" />
          ) : (
            <div className="w-7 h-7 rounded-md bg-white/10 text-slate-300 flex items-center justify-center text-xs font-semibold shrink-0">
              {student?.firstName ? student.firstName.charAt(0).toUpperCase() : <User className="w-3.5 h-3.5" />}
            </div>
          )}
          {!isSidebarCollapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-slate-200 truncate">{studentLabel}</p>
              <p className="text-[10px] text-slate-500 truncate">{studentClass}</p>
            </div>
          )}
        </div>
      </aside>

      {/* Recessed Inner App Window */}
      <div
        className={`flex-1 flex flex-col min-w-0 bg-[#111319] lg:my-2 lg:mr-2 lg:rounded-xl border border-white/[0.08] overflow-hidden ${
          isTutor ? 'h-screen lg:h-[calc(100vh-16px)] pb-16 lg:pb-0' : 'pb-16 lg:pb-0'
        }`}
      >
        <header className="sticky top-0 z-20 h-12 bg-[#111319]/90 backdrop-blur-md border-b border-white/[0.07] px-4 sm:px-5 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              onClick={onOpenMobileMenu}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06]"
              aria-label="Ouvrir le menu"
            >
              <Menu className="w-4 h-4" />
            </button>
            <button
              onClick={toggleSidebar}
              className="hidden lg:flex p-1.5 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-white/[0.06] transition-colors"
              title="Basculer la barre (Ctrl+B)"
            >
              <PanelLeft className="w-4 h-4" />
            </button>
            <span className="hidden sm:inline text-slate-700">/</span>
            <h1 className="text-xs sm:text-sm font-semibold text-slate-100 truncate">
              {pageTitle}
            </h1>
          </div>

          <ShellUtilityControls variant="obsidian" />
        </header>

        <main
          className={`flex-1 max-w-6xl w-full mx-auto ${
            isTutor
              ? 'p-2 sm:p-3 lg:p-4 overflow-hidden flex flex-col min-h-0'
              : 'p-4 sm:p-6 lg:p-7 overflow-y-auto'
          }`}
        >
          {children}
        </main>
      </div>

      <MobileNav isDrawerOpen={isMobileDrawerOpen} onCloseDrawer={onCloseMobileDrawer} />
    </div>
  );
};
