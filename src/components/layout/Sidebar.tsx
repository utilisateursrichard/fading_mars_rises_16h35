import React from 'react';
import { 
  LayoutDashboard, 
  CalendarDays, 
  MessageSquareText, 
  Award, 
  BookOpen, 
  GraduationCap,
  Bot,
  Bookmark,
  User
} from 'lucide-react';
import { useSchool, TabType } from '../../context/SchoolContext';
import { isFeatureReadyInLive } from '../../utils/featureFlags';

export const Sidebar: React.FC = () => {
  const { 
    activeTab, 
    setActiveTab, 
    unreadMessagesTotal, 
    pendingHomeworksTotal,
    student,
    isSidebarCollapsed,
    toggleSidebar,
    isInsideSmartschoolPlatform,
    isDemoMode
  } = useSchool();
  /**
   * Nom de l'établissement dynamique :
   * 
   * 💡 GESTION DU NOM DU LYCÉE :
   * - En Mode Démo : affiche les données factices (ex: student?.schoolName || 'Mon Lycée').
   * - En Mode Réel :
   *   - Si l'établissement n'est pas encore connu : affiche "Lycée : inconnu".
   *   - Dès que le lycée sera extrait de Smartschool (ex: "Lycée Henri IV") :
   *     afficher directement {student.schoolName} SANS le préfixe "Lycée : ".
   */
  const getDisplaySchoolName = () => {
    if (isDemoMode) {
      return student?.schoolName || 'Mon Lycée';
    }
    // Mode Réel
    if (student?.schoolName && student.schoolName.trim() !== '') {
      return student.schoolName; // Quand c'est connu : directement le nom (sans "Lycée : ")
    }
    return 'Lycée : inconnu'; // Quand c'est inconnu
  };

  const allNavItems: { id: TabType; label: string; icon: React.ElementType; badge?: number }[] = [
    { id: 'dashboard', label: 'Accueil', icon: LayoutDashboard },
    { id: 'agenda', label: 'Agenda', icon: CalendarDays, badge: pendingHomeworksTotal > 0 ? pendingHomeworksTotal : undefined },
    { id: 'messages', label: 'Messagerie', icon: MessageSquareText, badge: unreadMessagesTotal > 0 ? unreadMessagesTotal : undefined },
    { id: 'results', label: 'Notes & Résultats', icon: Award },
    { id: 'courses', label: 'Espace Cours', icon: BookOpen },
    { id: 'tutor', label: 'Tuteur IA', icon: Bot },
    ...(!isInsideSmartschoolPlatform ? [{ id: 'book' as TabType, label: 'Bookmarklet', icon: Bookmark }] : []),
  ];

  // En Mode Réel : les modules non faits (ex: Tuteur IA) sont invisibles à gauche dans le menu
  const navItems = allNavItems.filter(item => {
    if (isDemoMode) return true;
    return isFeatureReadyInLive(item.id) || item.id === 'dashboard';
  });

  return (
    <aside 
      className={`hidden lg:flex flex-col bg-white/80 backdrop-blur-2xl border-r border-slate-200/70 min-h-screen sticky top-0 z-30 select-none justify-between transition-all duration-200 ease-in-out ${
        isSidebarCollapsed ? 'w-20 p-3 items-center' : 'w-64 p-4'
      }`}
    >
      
      {/* Top: Logo & Navigation */}
      <div className={`space-y-6 w-full ${isSidebarCollapsed ? 'flex flex-col items-center' : ''}`}>
        
        {/* Header with Brand & Collapse Button */}
        <div className={`flex items-center ${isSidebarCollapsed ? 'flex-col gap-2 py-1' : 'justify-between px-2 py-1'}`}>
          <div className="flex items-center gap-2.5 min-w-0">
            <div 
              onClick={isSidebarCollapsed ? toggleSidebar : undefined}
              className={`w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-sm shrink-0 ${
                isSidebarCollapsed ? 'cursor-pointer hover:bg-indigo-600 transition-colors' : ''
              }`}
              title={isSidebarCollapsed ? "Déplier la barre" : undefined}
            >
              <GraduationCap className="w-5 h-5 text-indigo-400" />
            </div>

            {!isSidebarCollapsed && (
              <div className="min-w-0">
                <span className="font-extrabold text-base tracking-tight text-slate-900 truncate block">
                  Better<span className="text-indigo-600">School</span>
                </span>
                <p className="text-[11px] text-slate-400 font-medium truncate max-w-[130px]">
                  {getDisplaySchoolName()}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Nav Links */}
        <nav className={`space-y-1.5 w-full ${isSidebarCollapsed ? 'flex flex-col items-center' : ''}`}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                title={isSidebarCollapsed ? item.label : undefined}
                className={`m3-press flex items-center rounded-2xl transition-all relative ${
                  isSidebarCollapsed 
                    ? `w-12 h-12 justify-center ${
                        isActive 
                          ? 'bg-slate-900 text-white shadow-sm' 
                          : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/80'
                      }`
                    : `w-full justify-between px-3.5 py-2.5 text-[13px] font-bold ${
                        isActive 
                          ? 'bg-slate-900 text-white shadow-sm' 
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                      }`
                }`}
              >
                <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'}`}>
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  {!isSidebarCollapsed && <span>{item.label}</span>}
                </div>
                
                {item.badge !== undefined && (
                  isSidebarCollapsed ? (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-500 rounded-full ring-2 ring-white" />
                  ) : (
                    <span className={`px-2 py-0.5 text-[10px] font-extrabold rounded-full ${
                      isActive ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {item.badge}
                    </span>
                  )
                )}
              </button>
            );
          })}
        </nav>

      </div>

      {/* Bottom: User Profile */}
      <div 
        onClick={() => setActiveTab('dashboard')}
        className={`m3-press cursor-pointer rounded-2xl bg-slate-50/80 hover:bg-slate-100 border border-slate-200/60 transition-colors ${
          isSidebarCollapsed ? 'p-2 flex justify-center' : 'p-2.5 flex items-center gap-3 w-full'
        }`}
        title={isSidebarCollapsed ? `${student?.firstName} ${student?.lastName}` : undefined}
      >
        <div className="relative shrink-0">
          {student?.avatar ? (
            <img
              src={student.avatar}
              alt="Avatar"
              className="w-9 h-9 rounded-xl object-cover"
            />
          ) : (
            <div className="w-9 h-9 rounded-xl bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-xs">
              {student?.firstName ? student.firstName.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
            </div>
          )}
          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-white" />
        </div>

        {!isSidebarCollapsed && (
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-slate-900 truncate">
              {student ? `${student.firstName} ${student.lastName}`.trim() || 'Élève' : 'Élève'}
            </p>
            <p className="text-[11px] text-slate-400 truncate">
              {student?.studentClass || (isDemoMode ? 'Classe' : 'Non connecté')}
            </p>
          </div>
        )}
      </div>

    </aside>
  );
};
