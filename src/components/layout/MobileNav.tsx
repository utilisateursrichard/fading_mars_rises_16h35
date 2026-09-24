import React from 'react';
import { 
  LayoutDashboard, 
  CalendarDays, 
  MessageSquareText, 
  Award, 
  BookOpen, 
  X, 
  GraduationCap, 
  Plus, 
  Sparkles,
  Info,
  ShieldCheck,
  LogOut,
  Bot,
  Bookmark,
  User
} from 'lucide-react';
import { useSchool, TabType } from '../../context/SchoolContext';
import { isFeatureReadyInLive } from '../../utils/featureFlags';
import { cleanStudentClass } from '../../utils/student';

interface MobileNavProps {
  isDrawerOpen: boolean;
  onCloseDrawer: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ isDrawerOpen, onCloseDrawer }) => {
  const { 
    activeTab, 
    setActiveTab, 
    unreadMessagesTotal, 
    pendingHomeworksTotal,
    student,
    setIsNewHomeworkModalOpen,
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
    { id: 'messages', label: 'Messages', icon: MessageSquareText, badge: unreadMessagesTotal > 0 ? unreadMessagesTotal : undefined },
    { id: 'results', label: 'Notes', icon: Award },
    { id: 'courses', label: 'Cours', icon: BookOpen },
    { id: 'tutor', label: 'Tuteur IA', icon: Bot },
  ];

  // En Mode Réel : les modules non faits (ex: Tuteur IA) sont invisibles dans le menu
  const navItems = allNavItems.filter(item => {
    if (isDemoMode) return true;
    return isFeatureReadyInLive(item.id) || item.id === 'dashboard';
  });

  const handleSelectTab = (tab: TabType) => {
    setActiveTab(tab);
    onCloseDrawer();
  };

  return (
    <>
      {/* Slide-over Drawer Menu for Mobile */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
            onClick={onCloseDrawer}
          />

          {/* Drawer panel */}
          <div className="fixed inset-y-0 left-0 max-w-xs w-full bg-white shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200">
            {/* Drawer Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/20">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-bold text-base text-slate-900">Better<span className="text-indigo-600">School</span></span>
                  <p className="text-[11px] text-slate-400 font-medium truncate">{getDisplaySchoolName()}</p>
                </div>
              </div>
              <button
                onClick={onCloseDrawer}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Student card in drawer */}
            <div className="p-4 bg-slate-50/90 border-b border-slate-100">
              <div className="flex items-center gap-3">
                {student?.avatar ? (
                  <img
                    src={student.avatar}
                    alt="Avatar"
                    className="w-12 h-12 rounded-full object-cover ring-2 ring-indigo-200"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-sm ring-2 ring-indigo-200">
                    {student?.firstName ? student.firstName.charAt(0).toUpperCase() : <User className="w-5 h-5" />}
                  </div>
                )}
                <div>
                  <h4 className="font-bold text-sm text-slate-900">
                    {student ? `${student.firstName} ${student.lastName}`.trim() || 'Élève' : 'Élève'}
                  </h4>
                  <p className="text-xs text-slate-500">{cleanStudentClass(student?.studentClass) || (isDemoMode ? 'Classe' : 'Non connecté')}</p>
                  {student?.ineNumber ? (
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">ID: {student.ineNumber}</p>
                  ) : null}
                </div>
              </div>
            </div>

            {/* Nav list */}
            <div className="flex-1 p-3 space-y-1 overflow-y-auto">
              <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Menu
              </div>
              {navItems.map(item => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelectTab(item.id)}
                    className={`m3-press w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-bold transition-all ${
                      isActive 
                        ? 'bg-indigo-50 text-indigo-700 font-black border border-indigo-200/80 shadow-sm'
                        : 'text-slate-600 hover:bg-slate-100/80'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600 stroke-[2.5]' : 'text-slate-400'}`} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge !== undefined && (
                      <span className="px-2 py-0.5 text-[10px] font-black rounded-full bg-indigo-600 text-white">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}

              <div className="pt-4 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400">
                Actions rapides
              </div>
              <button
                onClick={() => {
                  onCloseDrawer();
                  setIsNewHomeworkModalOpen(true);
                }}
                className="m3-press w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl text-xs font-bold text-slate-700 hover:bg-slate-100/80 bg-slate-50 border border-slate-200/60"
              >
                <Plus className="w-4 h-4 text-indigo-600 stroke-[2.5]" />
                <span>Ajouter un devoir</span>
              </button>
              <button
                onClick={() => handleSelectTab('results')}
                className="m3-press w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl text-xs font-bold text-slate-700 hover:bg-slate-100/80 bg-slate-50 border border-slate-200/60 mt-1.5"
              >
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Simulateur de moyenne</span>
              </button>
              {!isInsideSmartschoolPlatform && (
                <button
                  onClick={() => handleSelectTab('book')}
                  className="m3-press w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl text-xs font-bold text-slate-700 hover:bg-slate-100/80 bg-slate-50 border border-slate-200/60 mt-1.5"
                >
                  <Bookmark className="w-4 h-4 text-indigo-600" />
                  <span>Bookmark Smartschool</span>
                </button>
              )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Session sécurisée</span>
              </span>
              <span className="text-[10px] text-slate-400">v1.0.0</span>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Fixed Bottom Navigation Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-2 py-1.5 shadow-[0_-4px_16px_rgba(0,0,0,0.04)]">
        <div className="flex items-center justify-around">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`relative flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
                  isActive ? 'text-indigo-600 font-semibold' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <div className="relative">
                  <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
                  {item.badge !== undefined && (
                    <span className="absolute -top-1.5 -right-2 min-w-4 h-4 px-1 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className="text-[11px] mt-1">{item.label}</span>
                {isActive && (
                  <span className="w-1 h-1 bg-indigo-600 rounded-full mt-0.5" />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};

