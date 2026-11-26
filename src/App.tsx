import React, { useState, useEffect, useRef } from 'react';
import { SchoolProvider, useSchool } from './context/SchoolContext';
import { UIThemeProvider, useUITheme } from './context/UIThemeContext';
import { AgendaView } from './components/views/AgendaView';
import { MessagesView } from './components/views/MessagesView';
import { ResultsView } from './components/views/ResultsView';
import { CoursesView } from './components/views/CoursesView';
import { TeachersView } from './components/views/TeachersView';
import { TutorView } from './components/views/TutorView';
import { BookmarkView } from './components/views/BookmarkView';
import { isFeatureReadyInLive } from './utils/featureFlags';
import { CourseDetailModal } from './components/modals/CourseDetailModal';
import { NewHomeworkModal } from './components/modals/NewHomeworkModal';
import { PolytrackOverlay } from './components/common/PolytrackOverlay';
import { UIThemeSwitcher } from './components/themes/UIThemeSwitcher';
import { PulseShell } from './components/themes/shells/PulseShell';
import { GoogleM3EShell } from './components/themes/shells/GoogleM3EShell';
import { NovaShell } from './components/themes/shells/NovaShell';
import { AppleProShell } from './components/themes/shells/AppleProShell';
import { HorizonShell } from './components/themes/shells/HorizonShell';
import { ObsidianShell } from './components/themes/shells/ObsidianShell';
import { M3EProShell } from './components/themes/shells/M3EProShell';
import { PulseDashboard } from './components/themes/dashboards/PulseDashboard';
import { GoogleM3EDashboard } from './components/themes/dashboards/GoogleM3EDashboard';
import { NovaDashboard } from './components/themes/dashboards/NovaDashboard';
import { AppleProDashboard } from './components/themes/dashboards/AppleProDashboard';
import { HorizonDashboard } from './components/themes/dashboards/HorizonDashboard';
import { ObsidianDashboard } from './components/themes/dashboards/ObsidianDashboard';
import { DashboardView } from './components/views/DashboardView';
import {
  isEnterPolytrackShortcut,
  isExitPolytrackShortcut,
} from './utils/polytrackShortcuts';

const MainLayout: React.FC = () => {
  const { activeTab, isDemoMode } = useSchool();
  const { uiTheme } = useUITheme();
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  const renderDashboard = () => {
    switch (uiTheme) {
      case 'pulse':
        return <PulseDashboard />;
      case 'google_m3e':
        return <GoogleM3EDashboard />;
      case 'nova':
        return <NovaDashboard />;
      case 'apple_pro':
        return <AppleProDashboard />;
      case 'horizon':
        return <HorizonDashboard />;
      case 'obsidian':
        return <ObsidianDashboard />;
      case 'm3e_pro':
        return <DashboardView />;
      default:
        return <PulseDashboard />;
    }
  };

  const renderActiveView = () => {
    if (!isDemoMode && activeTab !== 'book' && !isFeatureReadyInLive(activeTab)) {
      return renderDashboard();
    }

    switch (activeTab) {
      case 'dashboard':
        return renderDashboard();
      case 'agenda':
        return <AgendaView />;
      case 'messages':
        return <MessagesView />;
      case 'results':
        return <ResultsView />;
      case 'courses':
        return <CoursesView />;
      case 'teachers':
        return <TeachersView />;
      case 'tutor':
        return <TutorView />;
      case 'book':
        return <BookmarkView />;
      default:
        return renderDashboard();
    }
  };

  const isTutor = activeTab === 'tutor';

  // Verrouillage absolu du scroll au niveau document/window lorsque le mode Tuteur IA est actif
  useEffect(() => {
    if (isTutor) {
      window.scrollTo(0, 0);
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
    } else {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    }
    return () => {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    };
  }, [isTutor]);

  const activeView = renderActiveView();

  const renderThemedShell = () => {
    const shellProps = {
      isTutor,
      isMobileDrawerOpen,
      onOpenMobileMenu: () => setIsMobileDrawerOpen(true),
      onCloseMobileDrawer: () => setIsMobileDrawerOpen(false),
      children: activeView,
    };

    switch (uiTheme) {
      case 'pulse':
        return <PulseShell {...shellProps} />;
      case 'google_m3e':
        return <GoogleM3EShell {...shellProps} />;
      case 'nova':
        return <NovaShell {...shellProps} />;
      case 'apple_pro':
        return <AppleProShell {...shellProps} />;
      case 'horizon':
        return <HorizonShell {...shellProps} />;
      case 'obsidian':
        return <ObsidianShell {...shellProps} />;
      case 'm3e_pro':
        return <M3EProShell {...shellProps} />;
      default:
        return <PulseShell {...shellProps} />;
    }
  };

  return (
    <>
      {renderThemedShell()}
      <CourseDetailModal />
      <NewHomeworkModal />
      <UIThemeSwitcher />
    </>
  );
};

export function App() {
  const [hasMountedPolytrack, setHasMountedPolytrack] = useState(false);
  const [isPolytrackActive, setIsPolytrackActive] = useState(false);
  const isPolytrackActiveRef = useRef(isPolytrackActive);
  isPolytrackActiveRef.current = isPolytrackActive;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isPolytrackActiveRef.current && isEnterPolytrackShortcut(e)) {
        e.preventDefault();
        e.stopImmediatePropagation();
        setHasMountedPolytrack(true);
        setIsPolytrackActive(true);
      } else if (isPolytrackActiveRef.current && isExitPolytrackShortcut(e)) {
        e.preventDefault();
        e.stopImmediatePropagation();
        setIsPolytrackActive(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, []);

  return (
    <UIThemeProvider>
      <div
        aria-hidden={isPolytrackActive}
        className={isPolytrackActive ? 'pointer-events-none select-none' : undefined}
      >
        <SchoolProvider>
          <MainLayout />
        </SchoolProvider>
      </div>
      {hasMountedPolytrack && (
        <PolytrackOverlay
          isActive={isPolytrackActive}
          onExit={() => setIsPolytrackActive(false)}
        />
      )}
    </UIThemeProvider>
  );
}

export default App;
