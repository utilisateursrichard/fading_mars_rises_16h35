import React from 'react';
import { GraduationCap, Menu, Plus, Sparkles, User } from 'lucide-react';
import { useAppNavigation } from '../../../hooks/useAppNavigation';
import { useDashboardData } from '../../../hooks/useDashboardData';
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
 * Authentic Android 16/17 Google Material 3 Expressive shell:
 * Pixel Dynamic Color tonal system, detached rounded rail, morphing squircle FAB,
 * and Pixel "At a Glance" conversational header.
 */
export const GoogleM3EShell: React.FC<ShellProps> = ({
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
    setIsNewHomeworkModalOpen,
  } = useAppNavigation();

  const { nextClassSpotlight, pendingHomeworksCount, setSelectedEventModal } = useDashboardData();

  const studentLabel = student
    ? `${student.firstName} ${student.lastName}`.trim() || 'Élève'
    : 'Élève';
  const studentClass = cleanStudentClass(student?.studentClass) || 'Non connecté';

  return (
    <div
      className={`bs-shell-m3e flex bg-[#F2F6FC] text-[#191C20] antialiased ${
        isTutor ? 'h-screen max-h-screen overflow-hidden' : 'min-h-screen'
      }`}
      style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif" }}
    >
      {/* Detached Expressive Tonal Rail */}
      <aside
        className={`hidden lg:flex flex-col justify-between shrink-0 bg-[#E6EEF8] rounded-[32px] my-3 ml-3 select-none transition-all duration-300 ${
          isSidebarCollapsed ? 'w-[88px] px-2.5 py-4 items-center' : 'w-64 px-3.5 py-4'
        }`}
      >
        <div className="space-y-5 w-full">
          <div className={`flex items-center gap-3 ${isSidebarCollapsed ? 'justify-center' : 'px-2'}`}>
            <button
              onClick={toggleSidebar}
              title="Basculer le rail (Ctrl+B)"
              className="w-11 h-11 rounded-[18px] hover:rounded-full bg-[#00639B] text-white flex items-center justify-center shrink-0 transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
            >
              <GraduationCap className="w-5 h-5" />
            </button>
            {!isSidebarCollapsed && (
              <div className="min-w-0">
                <span className="font-extrabold text-base tracking-tight text-[#191C20] block truncate">
                  BetterSchool
                </span>
                <span className="text-[11px] font-medium text-[#42474E] block truncate">
                  {schoolName}
                </span>
              </div>
            )}
          </div>

          {/* Android 16/17 Morphing Expressive FAB */}
          <div className={isSidebarCollapsed ? 'flex justify-center' : ''}>
            <button
              onClick={() => setIsNewHomeworkModalOpen(true)}
              title="Nouveau devoir"
              className={`flex items-center justify-center gap-2.5 bg-[#D3E4FF] hover:bg-[#BFD8FF] text-[#001C38] font-bold transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] active:scale-95 ${
                isSidebarCollapsed
                  ? 'w-14 h-14 rounded-[20px] hover:rounded-full'
                  : 'w-full py-3.5 px-4 rounded-[20px] hover:rounded-full text-[13px]'
              }`}
            >
              <Plus className="w-5 h-5 stroke-[2.5]" />
              {!isSidebarCollapsed && <span>Nouveau devoir</span>}
            </button>
          </div>

          {/* Tonal Stadium Navigation */}
          <nav className="space-y-1.5 w-full">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  title={isSidebarCollapsed ? item.label : undefined}
                  className={`w-full flex transition-all duration-200 ${
                    isSidebarCollapsed
                      ? 'flex-col items-center gap-1 py-1'
                      : 'items-center justify-between px-4 py-3 rounded-full text-[13px]'
                  } ${
                    !isSidebarCollapsed && isActive
                      ? 'bg-[#00639B] text-white font-bold shadow-xs'
                      : !isSidebarCollapsed
                        ? 'text-[#42474E] hover:bg-[#DCE5F2] font-semibold'
                        : ''
                  }`}
                >
                  {isSidebarCollapsed ? (
                    <>
                      <div
                        className={`relative w-14 h-8 rounded-full flex items-center justify-center transition-all ${
                          isActive
                            ? 'bg-[#00639B] text-white'
                            : 'text-[#42474E] hover:bg-[#DCE5F2]'
                        }`}
                      >
                        <Icon className="w-[18px] h-[18px]" />
                        {item.badge !== undefined && (
                          <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-[#BA1A1A]" />
                        )}
                      </div>
                      <span
                        className={`text-[10px] leading-tight truncate max-w-full ${
                          isActive ? 'font-bold text-[#001C38]' : 'font-medium text-[#42474E]'
                        }`}
                      >
                        {item.shortLabel}
                      </span>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-3 min-w-0">
                        <Icon className="w-[18px] h-[18px] shrink-0" />
                        <span className="truncate">{item.label}</span>
                      </div>
                      {item.badge !== undefined && (
                        <span
                          className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                            isActive
                              ? 'bg-white/25 text-white'
                              : 'bg-[#D3E4FF] text-[#001C38]'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Expressive Tonal Profile Pill */}
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`w-full rounded-[24px] bg-[#F2F6FC] hover:bg-white transition-colors flex items-center gap-3 text-left ${
            isSidebarCollapsed ? 'p-2 justify-center' : 'p-2.5'
          }`}
        >
          {student?.avatar ? (
            <img src={student.avatar} alt="Avatar" className="w-9 h-9 rounded-full object-cover shrink-0" />
          ) : (
            <div className="w-9 h-9 rounded-full bg-[#D3E4FF] text-[#001C38] flex items-center justify-center font-bold text-xs shrink-0">
              {student?.firstName ? student.firstName.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
            </div>
          )}
          {!isSidebarCollapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-[#191C20] truncate">{studentLabel}</p>
              <p className="text-[11px] text-[#42474E] truncate">{studentClass}</p>
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
        <header className="sticky top-0 z-20 h-16 bg-[#F2F6FC]/90 backdrop-blur-xl px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={onOpenMobileMenu}
              className="lg:hidden p-2 rounded-full text-[#42474E] hover:bg-[#DCE3EE]"
              aria-label="Ouvrir le menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 min-w-0">
              <h1 className="text-lg sm:text-xl font-extrabold tracking-tight text-[#191C20] truncate">
                {pageTitle}
              </h1>

              {/* Pixel "At a Glance" Live Conversational Chip */}
              {nextClassSpotlight ? (
                <button
                  onClick={() => setSelectedEventModal(nextClassSpotlight.event)}
                  className="hidden md:inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#E6EEF8] hover:bg-[#D3E4FF] text-xs font-semibold text-[#001C38] transition-colors truncate max-w-[340px]"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#00639B] shrink-0" />
                  <span className="truncate">
                    {nextClassSpotlight.event.subject} · {nextClassSpotlight.event.startTime} (
                    {nextClassSpotlight.event.room})
                  </span>
                </button>
              ) : (
                <span className="hidden md:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E6EEF8] text-xs font-medium text-[#42474E]">
                  {pendingHomeworksCount} devoir(s) à faire
                </span>
              )}
            </div>
          </div>

          <ShellUtilityControls variant="google_m3e" showAddHomework={false} />
        </header>

        <main
          className={`flex-1 max-w-6xl w-full mx-auto ${
            isTutor
              ? 'p-2 sm:p-3 lg:p-4 overflow-hidden flex flex-col min-h-0'
              : 'p-4 sm:p-6 lg:px-8 lg:py-5'
          }`}
        >
          {children}
        </main>
      </div>

      <MobileNav isDrawerOpen={isMobileDrawerOpen} onCloseDrawer={onCloseMobileDrawer} />
    </div>
  );
};
