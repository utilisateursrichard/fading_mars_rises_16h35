import React from 'react';
import { Sidebar } from '../../layout/Sidebar';
import { Header } from '../../layout/Header';
import { MobileNav } from '../../layout/MobileNav';

interface M3EProShellProps {
  isTutor: boolean;
  isMobileDrawerOpen: boolean;
  onOpenMobileMenu: () => void;
  onCloseMobileDrawer: () => void;
  children: React.ReactNode;
}

/**
 * Original M3E Pro shell (Sidebar + Header + MobileNav).
 */
export const M3EProShell: React.FC<M3EProShellProps> = ({
  isTutor,
  isMobileDrawerOpen,
  onOpenMobileMenu,
  onCloseMobileDrawer,
  children,
}) => {
  return (
    <div
      className={`${
        isTutor ? 'h-screen overflow-hidden' : 'min-h-screen'
      } flex bg-[#F8FAFC] text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900 overflow-x-clip`}
    >
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <Header onOpenMobileMenu={onOpenMobileMenu} />

        <main
          className={`flex-1 p-4 sm:p-6 lg:p-8 ${
            isTutor
              ? 'overflow-hidden pb-4 sm:pb-6 lg:pb-8 flex flex-col'
              : 'overflow-y-auto pb-24 lg:pb-12'
          }`}
        >
          <div className={isTutor ? 'w-full flex-1 min-h-0 flex flex-col' : 'max-w-[1440px] mx-auto w-full'}>
            {children}
          </div>
        </main>
      </div>

      <MobileNav
        isDrawerOpen={isMobileDrawerOpen}
        onCloseDrawer={onCloseMobileDrawer}
      />
    </div>
  );
};
