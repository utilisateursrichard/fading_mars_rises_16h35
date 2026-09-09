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
import { TutorView } from './components/views/TutorView';
import { BookmarkView } from './components/views/BookmarkView';
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
      case 'tutor':
        return <TutorView />;
      case 'book':
        return <BookmarkView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="relative flex min-h-screen bg-[#F8FAFC] text-slate-900 selection:bg-indigo-600 selection:text-white antialiased overflow-x-hidden">
      {/* Ambient background glows for M3E / Apple Glass refraction */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-32 right-1/4 w-96 h-96 bg-indigo-100/40 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -left-20 w-80 h-80 bg-blue-100/35 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-100/25 rounded-full blur-3xl" />
      </div>

      {/* Desktop Navigation Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="relative z-10 flex-1 flex flex-col min-w-0 pb-16 lg:pb-0">
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

