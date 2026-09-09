import React from 'react';
import { 
  LayoutDashboard, 
  CalendarDays, 
  MessageSquareText, 
  Award, 
  BookOpen, 
  GraduationCap, 
  ChevronRight,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { useSchool, TabType } from '../../context/SchoolContext';

export const Sidebar: React.FC = () => {
  const { 
    activeTab, 
    setActiveTab, 
    unreadMessagesTotal, 
    pendingHomeworksTotal,
    student 
  } = useSchool();

  const navItems: { id: TabType; label: string; icon: React.ElementType; badge?: number; badgeColor?: string }[] = [
    { id: 'dashboard', label: 'Vue d’ensemble', icon: LayoutDashboard },
    { id: 'agenda', label: 'Emploi du temps', icon: CalendarDays, badge: pendingHomeworksTotal > 0 ? pendingHomeworksTotal : undefined, badgeColor: 'bg-amber-100 text-amber-800' },
    { id: 'messages', label: 'Messagerie', icon: MessageSquareText, badge: unreadMessagesTotal > 0 ? unreadMessagesTotal : undefined, badgeColor: 'bg-indigo-600 text-white' },
    { id: 'results', label: 'Notes & Résultats', icon: Award },
    { id: 'courses', label: 'Espace Cours', icon: BookOpen },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-slate-200/70 min-h-screen sticky top-0 z-30 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-100/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-sm">
            <GraduationCap className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base tracking-tight text-slate-900">Better<span className="text-indigo-600">School</span></span>
              <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 rounded">ENT</span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium truncate">{student?.schoolName || 'Mon Lycée'}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3.5 space-y-1">
        <div className="px-3 pt-2 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Menu Principal
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-[13px] font-semibold transition-all group ${
                isActive
                  ? 'bg-indigo-50/90 text-indigo-700 shadow-subtle'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50/80'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 transition-colors ${
                  isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'
                }`} />
                <span>{item.label}</span>
              </div>
              
              {item.badge !== undefined && (
                <span className={`px-2 py-0.5 text-[11px] font-bold rounded-full ${item.badgeColor || 'bg-slate-100 text-slate-700'}`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        {/* Feature Teaser */}
        <div className="pt-6">
          <div className="p-4 rounded-2xl bg-gradient-to-b from-indigo-50/60 to-slate-50/80 border border-indigo-100/60 text-left">
            <div className="flex items-center gap-1.5 text-indigo-900 font-bold text-xs mb-1">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Simulateur Bac</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed mb-3">
              Estime ta moyenne au contrôle continu en ajoutant tes futures notes.
            </p>
            <button
              onClick={() => setActiveTab('results')}
              className="w-full py-1.5 px-3 bg-white text-indigo-600 hover:bg-indigo-600 hover:text-white border border-indigo-200/80 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-subtle"
            >
              <span>Ouvrir le simulateur</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </nav>

      {/* User Footer */}
      <div className="p-3.5 border-t border-slate-100">
        <div className="p-2.5 rounded-2xl bg-slate-50/80 border border-slate-100 flex items-center gap-3">
          <div className="relative shrink-0">
            <img
              src={student?.avatar}
              alt="Avatar"
              className="w-9 h-9 rounded-xl object-cover ring-1 ring-slate-200"
            />
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-white" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-slate-900 truncate">
              {student?.firstName} {student?.lastName}
            </p>
            <p className="text-[11px] text-slate-400 truncate flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-600 shrink-0" />
              <span className="truncate">{student?.studentClass || 'Ma Classe'}</span>
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
};
