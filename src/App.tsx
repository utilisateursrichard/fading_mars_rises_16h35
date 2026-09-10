import React, { useState } from 'react';
import { SchoolProvider, useSchool } from './context/SchoolContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { MobileNav } from './components/layout/MobileNav';
import { DashboardView } from './components/views/DashboardView';
import { AgendaView } from './components/views/AgendaView';
import { MessagesView } from './components/views/MessagesView';
import { ResultsView } from './components/views/ResultsView';
import { CoursesView } from './components/views/CoursesView';
import { CourseDetailModal } from './components/modals/CourseDetailModal';
import { NewHomeworkModal } from './components/modals/NewHomeworkModal';

const MainLayout: React.FC = () => {
  const { activeTab } = useSchool();
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView />;
      case 'agenda':
        return <AgendaView />;
      case 'messages':
        return <MessagesView />;
      case 'results':
        return <ResultsView />;
      case 'courses':
        return <CoursesView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="flex min-h-screen m3e-canvas text-slate-900 selection:bg-indigo-600 selection:text-white relative">
      {/* Desktop Navigation Sidebar - Floating Island Dock */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 lg:pb-8 lg:pl-72">
        {/* Top Header */}
        <div className="px-3 sm:px-6 pt-3">
          <Header onOpenMobileMenu={() => setIsMobileDrawerOpen(true)} />
        </div>

        {/* View Content */}
        <main className="flex-1 px-3 sm:px-6 py-2 max-w-7xl w-full mx-auto animate-in fade-in duration-200">
          {renderActiveView()}
        </main>
      </div>

      {/* Mobile Bottom Bar & Drawer */}
      <MobileNav
        isDrawerOpen={isMobileDrawerOpen}
        onCloseDrawer={() => setIsMobileDrawerOpen(false)}
      />

      {/* Global Interactive Modals */}
      <CourseDetailModal />
      <NewHomeworkModal />
    </div>
  );
};

export function App() {
  return (
    <SchoolProvider>
      <MainLayout />
    </SchoolProvider>
  );
}

export default App;

