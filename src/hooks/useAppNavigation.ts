import React, { useMemo } from 'react';
import {
  LayoutDashboard,
  CalendarDays,
  MessageSquareText,
  Award,
  BookOpen,
  Bot,
  Bookmark,
  Users,
} from 'lucide-react';
import { useSchool, TabType } from '../context/SchoolContext';
import { isFeatureReadyInLive } from '../utils/featureFlags';

export interface NavItem {
  id: TabType;
  label: string;
  shortLabel: string;
  icon: React.ElementType;
  badge?: number;
}

/**
 * Shared navigation items, school name, page title, and utility actions across all UI shells.
 */
export function useAppNavigation() {
  const {
    activeTab,
    setActiveTab,
    unreadMessagesTotal,
    pendingHomeworksTotal,
    student,
    isSidebarCollapsed,
    toggleSidebar,
    isInsideSmartschoolPlatform,
    isDemoMode,
    isDemoAvailable,
    toggleDemoMode,
    setIsNewHomeworkModalOpen,
    notifications,
    unreadNotificationsCount,
    markNotificationsAsRead,
  } = useSchool();

  const schoolName = useMemo(() => {
    if (isDemoMode) {
      return student?.schoolName || 'Mon Lycée';
    }
    if (student?.schoolName && student.schoolName.trim() !== '') {
      return student.schoolName;
    }
    return 'Lycée : inconnu';
  }, [isDemoMode, student?.schoolName]);

  const navItems: NavItem[] = useMemo(() => {
    const allItems: NavItem[] = [
      { id: 'dashboard', label: 'Accueil', shortLabel: 'Accueil', icon: LayoutDashboard },
      {
        id: 'agenda',
        label: 'Agenda',
        shortLabel: 'Agenda',
        icon: CalendarDays,
        badge: pendingHomeworksTotal > 0 ? pendingHomeworksTotal : undefined,
      },
      {
        id: 'messages',
        label: 'Messagerie',
        shortLabel: 'Messages',
        icon: MessageSquareText,
        badge: unreadMessagesTotal > 0 ? unreadMessagesTotal : undefined,
      },
      { id: 'results', label: 'Notes & Résultats', shortLabel: 'Notes', icon: Award },
      { id: 'courses', label: 'Espace Cours', shortLabel: 'Cours', icon: BookOpen },
      { id: 'teachers', label: 'Professeurs', shortLabel: 'Profs', icon: Users },
      { id: 'tutor', label: 'Tuteur IA', shortLabel: 'Tuteur IA', icon: Bot },
      ...(!isInsideSmartschoolPlatform
        ? [{ id: 'book' as TabType, label: 'Bookmarklet', shortLabel: 'Favori', icon: Bookmark }]
        : []),
    ];

    return allItems.filter((item) => {
      if (isDemoMode) return true;
      return isFeatureReadyInLive(item.id) || item.id === 'dashboard';
    });
  }, [pendingHomeworksTotal, unreadMessagesTotal, isInsideSmartschoolPlatform, isDemoMode]);

  const pageTitle = useMemo(() => {
    switch (activeTab) {
      case 'dashboard':
        return "Vue d'ensemble";
      case 'agenda':
        return 'Agenda';
      case 'messages':
        return 'Messagerie';
      case 'results':
        return 'Notes & Résultats';
      case 'courses':
        return 'Espace Cours';
      case 'teachers':
        return 'Professeurs';
      case 'tutor':
        return 'Tuteur IA';
      case 'book':
        return 'Bookmarklet';
      default:
        return 'Accueil';
    }
  }, [activeTab]);

  return {
    navItems,
    schoolName,
    pageTitle,
    activeTab,
    setActiveTab,
    unreadMessagesTotal,
    pendingHomeworksTotal,
    student,
    isSidebarCollapsed,
    toggleSidebar,
    isInsideSmartschoolPlatform,
    isDemoMode,
    isDemoAvailable,
    toggleDemoMode,
    setIsNewHomeworkModalOpen,
    notifications,
    unreadNotificationsCount,
    markNotificationsAsRead,
  };
}
