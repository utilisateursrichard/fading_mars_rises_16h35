import React from 'react';
import { GraduationCap, Menu, PanelLeft, User } from 'lucide-react';
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
 * Authentic macOS Sequoia / iPadOS Pro shell with vibrancy source-list sidebar and toolbar.
 */
export const AppleProShell: React.FC<ShellProps> = ({
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

  const primaryTabs = navItems.filter((i) => i.id !== 'book' && i.id !== 'tutor');
  const toolTabs = navItems.filter((i) => i.id === 'book' || i.id === 'tutor');

  const studentLabel = student
    ? `${student.firstName} ${student.lastName}`.trim() || 'Élève'
    : 'Élève';
  const studentClass = cleanStudentClass(student?.studentClass) || 'Non connecté';

  return (
    <div
      className={`bs-shell-apple flex bg-[#F5F5F7] text-[#1D1D1F] antialiased ${
        isTutor ? 'h-screen max-h-screen overflow-hidden' : 'min-h-screen'
      }`}
      style={{
        fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Inter', system-ui, sans-serif",
      }}
    >
      {/* macOS Vibrancy Source-List Sidebar */}
      <aside
        className={`hidden lg:flex flex-col justify-between shrink-0 bg-[#ECECEF]/85 backdrop-blur-2xl border-r border-black/[0.08] select-none transition-all duration-200 ${
          isSidebarCollapsed ? 'w-16 px-2 py-3 items-center' : 'w-60 px-3 py-3.5'
        }`}
      >
        <div className="space-y-5 w-full">
          {/* App Header */}
          <div className={`flex items-center gap-2.5 ${isSidebarCollapsed ? 'justify-center' : 'px-2'}`}>
            <button
              onClick={() => setActiveTab('dashboard')}
              className="w-7 h-7 rounded-lg bg-gradient-to-b from-[#0A84FF] to-[#0066D6] text-white flex items-center justify-center shadow-xs shrink-0"
            >
              <GraduationCap className="w-4 h-4" />
            </button>
            {!isSidebarCollapsed && (
              <div className="min-w-0">
                <span className="font-semibold text-[13px] tracking-tight text-[#1D1D1F] block truncate">
                  BetterSchool
                </span>
                <span className="text-[11px] text-[#6E6E73] block truncate">{schoolName}</span>
              </div>
            )}
          </div>

          {/* Section 1: Scolarité */}
          <div className="space-y-1">
            {!isSidebarCollapsed && (
              <p className="px-2.5 text-[11px] font-semibold text-[#86868B]">Scolarité</p>
            )}
            <nav className="space-y-0.5">
              {primaryTabs.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    title={isSidebarCollapsed ? item.label : undefined}
                    className={`w-full flex items-center rounded-lg transition-colors text-[13px] ${
                      isSidebarCollapsed ? 'justify-center h-9' : 'justify-between px-2.5 py-1.5'
                    } ${
                      isActive
                        ? 'bg-[#007AFF] text-white font-medium shadow-xs'
                        : 'text-[#1D1D1F] hover:bg-black/[0.05]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon
                        className={`w-4 h-4 shrink-0 ${
                          isActive ? 'text-white' : 'text-[#007AFF]'
                        }`}
                      />
                      {!isSidebarCollapsed && <span className="truncate">{item.label}</span>}
                    </div>
                    {!isSidebarCollapsed && item.badge !== undefined && (
                      <span
                        className={`px-1.5 py-0.2 rounded-full text-[11px] font-semibold ${
                          isActive
                            ? 'bg-white/25 text-white'
                            : 'bg-black/[0.08] text-[#1D1D1F]'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Section 2: Outils */}
          {toolTabs.length > 0 && (
            <div className="space-y-1">
              {!isSidebarCollapsed && (
                <p className="px-2.5 text-[11px] font-semibold text-[#86868B]">Outils</p>
              )}
              <nav className="space-y-0.5">
                {toolTabs.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      title={isSidebarCollapsed ? item.label : undefined}
                      className={`w-full flex items-center rounded-lg transition-colors text-[13px] ${
                        isSidebarCollapsed
                          ? 'justify-center h-9'
                          : 'justify-between px-2.5 py-1.5'
                      } ${
                        isActive
                          ? 'bg-[#007AFF] text-white font-medium shadow-xs'
                          : 'text-[#1D1D1F] hover:bg-black/[0.05]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon
                          className={`w-4 h-4 shrink-0 ${
                            isActive ? 'text-white' : 'text-[#6E6E73]'
                          }`}
                        />
                        {!isSidebarCollapsed && <span className="truncate">{item.label}</span>}
                      </div>
                    </button>
                  );
                })}
              </nav>
            </div>
          )}
        </div>

        {/* Account Footer */}
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`w-full rounded-xl bg-white/75 hover:bg-white border border-black/[0.06] transition-colors flex items-center gap-2.5 text-left ${
            isSidebarCollapsed ? 'p-1.5 justify-center' : 'p-2'
          }`}
        >
          {student?.avatar ? (
            <img src={student.avatar} alt="Avatar" className="w-8 h-8 rounded-full object-cover shrink-0" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-[#E5E5EA] text-[#3A3A3C] flex items-center justify-center text-xs font-semibold shrink-0">
              {student?.firstName ? student.firstName.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
            </div>
          )}
          {!isSidebarCollapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-[#1D1D1F] truncate">{studentLabel}</p>
              <p className="text-[11px] text-[#6E6E73] truncate">{studentClass}</p>
            </div>
          )}
        </button>
      </aside>

      {/* Main Content */}
      <div
        className={`flex-1 flex flex-col min-w-0 ${
          isTutor ? 'h-screen max-h-screen overflow-hidden pb-16 lg:pb-0' : 'pb-16 lg:pb-0'
        }`}
      >
        <header className="sticky top-0 z-20 h-13 py-2 bg-[#F5F5F7]/85 backdrop-blur-xl border-b border-black/[0.06] px-4 sm:px-6 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              onClick={onOpenMobileMenu}
              className="lg:hidden p-1.5 rounded-lg text-[#1D1D1F] hover:bg-black/[0.06]"
              aria-label="Ouvrir le menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <button
              onClick={toggleSidebar}
              className="hidden lg:flex p-1.5 rounded-lg text-[#6E6E73] hover:text-[#1D1D1F] hover:bg-black/[0.05] transition-colors"
              title="Basculer la barre latérale (Ctrl+B)"
            >
              <PanelLeft className="w-4 h-4" />
            </button>
            <h1 className="text-[15px] font-semibold tracking-tight text-[#1D1D1F] truncate">
              {pageTitle}
            </h1>
          </div>

          <ShellUtilityControls variant="apple_pro" />
        </header>

        <main
          className={`flex-1 max-w-6xl w-full mx-auto ${
            isTutor
              ? 'p-2 sm:p-3 lg:p-4 overflow-hidden flex flex-col min-h-0'
              : 'p-4 sm:p-6 lg:p-7'
          }`}
        >
          {children}
        </main>
      </div>

      <MobileNav isDrawerOpen={isMobileDrawerOpen} onCloseDrawer={onCloseMobileDrawer} />
    </div>
  );
};
