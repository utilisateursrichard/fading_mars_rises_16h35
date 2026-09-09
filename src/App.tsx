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
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      {/* Desktop Navigation Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-16 lg:pb-0">
        {/* Top Header */}
        <Header onOpenMobileMenu={() => setIsMobileDrawerOpen(true)} />

        {/* View Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto animate-in fade-in duration-200">
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

