import React, { useState } from 'react';
import { 
  Clock, 
  MapPin, 
  CheckCircle2, 
  Circle, 
  TrendingUp, 
  Sparkles, 
  Calendar, 
  ChevronRight,
  BookOpen,
  UserCheck,
  Plus,
  ArrowRight,
  User
} from 'lucide-react';
import { useSchool } from '../../context/SchoolContext';
import { getSubjectTheme } from '../../utils/theme';

export const DashboardView: React.FC = () => {
  const { 
    student, 
    todayEvents, 
    homeworks, 
    toggleHomework, 
    overallStats, 
    subjectReports, 
    setActiveTab,
    setSelectedEventModal,
    setIsNewHomeworkModalOpen,
    startDirectMessageWithTeacher,
    globalSearch
  } = useSchool();

  const [homeworkFilter, setHomeworkFilter] = useState<'pending' | 'all' | 'completed'>('pending');

  const filteredHomeworks = homeworks.filter(hw => {
    if (globalSearch) {
      const matchQuery = hw.title.toLowerCase().includes(globalSearch.toLowerCase()) ||
                         hw.subject.toLowerCase().includes(globalSearch.toLowerCase());
      if (!matchQuery) return false;
    }
    if (homeworkFilter === 'pending') return !hw.isCompleted;
    if (homeworkFilter === 'completed') return hw.isCompleted;
    return true;
  });

  const nextEvent = todayEvents.find(e => e.status === 'in_progress' || e.status === 'scheduled') || todayEvents[0];

  const recentGrades = subjectReports
    .flatMap(r => r.grades.map(g => ({ ...g, color: r.color })))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3);

  return (
    <div className="space-y-6 pb-12 max-w-6xl mx-auto">
      
      {/* Top Greeting & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Bonjour, {student?.firstName} 👋
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1 flex items-center gap-2">
            <span>{student?.studentClass}</span>
            <span className="text-slate-300">•</span>
            <span>{student?.academicYear || 'Année Scolaire'}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('agenda')}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 transition-all shadow-subtle flex items-center gap-1.5"
          >
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span>Mon emploi du temps</span>
          </button>
          <button
            onClick={() => setIsNewHomeworkModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-sm shadow-indigo-600/20 flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nouveau devoir</span>
          </button>
        </div>
      </div>

      {/* Hero Spotlight: Prochain cours */}
      {nextEvent && (
        <div 
          onClick={() => setSelectedEventModal(nextEvent)}
          className="cursor-pointer group relative overflow-hidden bg-white rounded-3xl p-5 sm:p-6 border border-indigo-100 shadow-card hover:shadow-card-hover transition-all"
        >
          <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-indigo-50/50 to-transparent pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex flex-col items-center justify-center font-extrabold shrink-0 shadow-sm shadow-indigo-600/30">
                <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-200">Début</span>
                <span className="text-base font-black">{nextEvent.startTime}</span>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 uppercase tracking-wider">
                    {nextEvent.status === 'in_progress' ? '🟢 En cours maintenant' : '⏱️ Prochain cours'}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">Fin à {nextEvent.endTime}</span>
                </div>

                <h2 className="text-lg sm:text-xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors">
                  {nextEvent.subject}
                </h2>

                <p className="text-xs text-slate-500 font-medium mt-1 flex items-center gap-3">
                  <span className="flex items-center gap-1 font-semibold text-slate-700">
                    <MapPin className="w-3.5 h-3.5 text-indigo-500" />
                    {nextEvent.room}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    {nextEvent.teacher}
                  </span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
              <span className="text-xs font-bold text-indigo-600 group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                <span>Voir le cours & documents</span>
                <ChevronRight className="w-4 h-4" />
              </span>
            </div>
          </div>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Moyenne Générale */}
        <div 
          onClick={() => setActiveTab('results')}
          className="cursor-pointer p-4 sm:p-5 bg-white rounded-3xl border border-slate-200/70 shadow-subtle hover:shadow-card transition-all"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Moyenne Générale</span>
            <div className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">{overallStats.current}</span>
            <span className="text-xs text-slate-400 font-semibold">/ 20</span>
          </div>
          <p className="text-[11px] text-emerald-600 font-bold mt-1.5 flex items-center gap-1">
            <span>+0.9 pt</span>
            <span className="text-slate-400 font-normal">(classe : {overallStats.classAvg})</span>
          </p>
        </div>

        {/* Devoirs à faire */}
        <div 
          onClick={() => setActiveTab('agenda')}
          className="cursor-pointer p-4 sm:p-5 bg-white rounded-3xl border border-slate-200/70 shadow-subtle hover:shadow-card transition-all"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Devoirs</span>
            <div className="w-7 h-7 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Calendar className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">
              {homeworks.filter(h => !h.isCompleted).length}
            </span>
            <span className="text-xs text-slate-400 font-semibold">en attente</span>
          </div>
          <p className="text-[11px] text-amber-600 font-bold mt-1.5">
            {homeworks.filter(h => !h.isCompleted && h.priority === 'high').length} urgent(s) cette semaine
          </p>
        </div>

        {/* Cours du jour */}
        <div 
          onClick={() => setActiveTab('agenda')}
          className="cursor-pointer p-4 sm:p-5 bg-white rounded-3xl border border-slate-200/70 shadow-subtle hover:shadow-card transition-all"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Séances du jour</span>
            <div className="w-7 h-7 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <BookOpen className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">{todayEvents.length}</span>
            <span className="text-xs text-slate-400 font-semibold">cours</span>
          </div>
          <p className="text-[11px] text-slate-500 font-medium mt-1.5">
            Fin des cours à {todayEvents[todayEvents.length - 1]?.endTime || '17:15'}
          </p>
        </div>

        {/* Assiduité */}
        <div 
          className="p-4 sm:p-5 bg-white rounded-3xl border border-slate-200/70 shadow-subtle transition-all"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Assiduité</span>
            <div className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <UserCheck className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-emerald-600">100%</span>
            <span className="text-xs text-slate-400 font-semibold">présence</span>
          </div>
          <p className="text-[11px] text-slate-400 font-medium mt-1.5">
            0 retard • 1 absence justifiée
          </p>
        </div>
      </div>

      {/* Main Layout: Schedule & Homeworks */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Columns: Today's Schedule & Recent Grades */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Today's Timeline */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/70 shadow-subtle">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">Programme d'aujourd'hui</h3>
                <p className="text-xs text-slate-400 font-medium">Clique sur une séance pour consulter les documents</p>
              </div>
              <button
                onClick={() => setActiveTab('agenda')}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                <span>Semaine complète</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5">
              {todayEvents.map((evt) => {
                const theme = getSubjectTheme(evt.subjectCode);
                return (
                  <div
                    key={evt.id}
                    onClick={() => setSelectedEventModal(evt)}
                    className="cursor-pointer group flex items-center justify-between p-3.5 rounded-2xl border border-slate-100 hover:border-indigo-150 hover:bg-slate-50/70 transition-all gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Subject Pastel Badge */}
                      <span className={`px-2.5 py-1 rounded-xl text-xs font-extrabold border shrink-0 ${theme.badgeClass}`}>
                        {evt.subjectCode}
                      </span>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-slate-900 truncate group-hover:text-indigo-600 transition-colors">
                            {evt.subject}
                          </h4>
                          <span className="text-[10px] font-semibold uppercase text-slate-400">
                            {evt.type}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 font-medium flex items-center gap-2 mt-0.5">
                          <span>{evt.teacher}</span>
                          <span>•</span>
                          <span className="text-slate-600 font-semibold">{evt.room}</span>
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-xs font-bold text-slate-800 flex items-center gap-1 justify-end">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{evt.startTime} - {evt.endTime}</span>
                      </p>
                      <span className={`text-[10px] font-bold ${
                        evt.status === 'in_progress' ? 'text-amber-600' :
                        evt.status === 'completed' ? 'text-slate-400' : 'text-emerald-600'
                      }`}>
                        {evt.status === 'in_progress' ? 'En cours' :
                         evt.status === 'completed' ? 'Terminé' : 'À venir'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Grades Section */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/70 shadow-subtle">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">Dernières notes reçues</h3>
                <p className="text-xs text-slate-400 font-medium">Contrôle continu du trimestre</p>
              </div>
              <button
                onClick={() => setActiveTab('results')}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                <span>Toutes les notes</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {recentGrades.map((grade) => {
                const theme = getSubjectTheme(grade.subjectCode);
                return (
                  <div 
                    key={grade.id}
                    className="p-4 rounded-2xl bg-slate-50/60 border border-slate-100 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border ${theme.badgeClass}`}>
                          {grade.subjectCode}
                        </span>
                        <span className="text-slate-400 text-[10px] font-medium">Coef. {grade.coefficient}</span>
                      </div>
                      <p className="text-xs font-bold text-slate-800 line-clamp-1">{grade.title}</p>
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-200/50 flex items-baseline justify-between">
                      <div>
                        <span className="text-2xl font-black text-slate-900">{grade.value}</span>
                        <span className="text-xs text-slate-400 font-medium"> / {grade.maxValue}</span>
                      </div>
                      <span className="text-[11px] text-slate-400">Moy. {grade.classAverage}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Homeworks & Quick Contact */}
        <div className="space-y-6">
          
          {/* Homeworks Card */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/70 shadow-subtle">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-slate-900 text-base">Devoirs & Travail</h3>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-slate-100 text-slate-700">
                  {homeworks.filter(h => !h.isCompleted).length}
                </span>
              </div>
              <button
                onClick={() => setIsNewHomeworkModalOpen(true)}
                className="p-1.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                title="Ajouter un devoir"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Filter Pills */}
            <div className="flex gap-1 p-1 bg-slate-100 rounded-xl text-xs font-semibold mb-4">
              <button
                onClick={() => setHomeworkFilter('pending')}
                className={`flex-1 py-1.5 rounded-lg transition-all ${
                  homeworkFilter === 'pending' ? 'bg-white text-slate-900 shadow-subtle' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                À faire
              </button>
              <button
                onClick={() => setHomeworkFilter('all')}
                className={`flex-1 py-1.5 rounded-lg transition-all ${
                  homeworkFilter === 'all' ? 'bg-white text-slate-900 shadow-subtle' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Tous
              </button>
              <button
                onClick={() => setHomeworkFilter('completed')}
                className={`flex-1 py-1.5 rounded-lg transition-all ${
                  homeworkFilter === 'completed' ? 'bg-white text-slate-900 shadow-subtle' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Faits
              </button>
            </div>

            {/* List */}
            <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1">
              {filteredHomeworks.map((hw) => {
                const theme = getSubjectTheme(hw.subjectCode);
                return (
                  <div
                    key={hw.id}
                    className={`p-3 rounded-2xl border transition-all flex items-start gap-3 ${
                      hw.isCompleted
                        ? 'bg-slate-50/40 border-slate-100 opacity-60'
                        : 'bg-white border-slate-200/80 shadow-subtle hover:border-indigo-200'
                    }`}
                  >
                    <button
                      onClick={() => toggleHomework(hw.id)}
                      className="mt-0.5 text-slate-300 hover:text-indigo-600 transition-colors shrink-0"
                    >
                      {hw.isCompleted ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      ) : (
                        <Circle className="w-5 h-5" />
                      )}
                    </button>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className={`text-[10px] font-bold uppercase ${theme.text}`}>
                          {hw.subjectCode}
                        </span>
                        <span className={`text-[10px] font-bold ${
                          hw.priority === 'high' ? 'text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded' : 'text-slate-400'
                        }`}>
                          {new Date(hw.dueDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                      <p className={`text-xs font-bold mt-0.5 ${hw.isCompleted ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                        {hw.title}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                        {hw.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick contact card */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/70 shadow-subtle">
            <h3 className="font-extrabold text-slate-900 text-base mb-1">Enseignants & Équipe</h3>
            <p className="text-xs text-slate-400 font-medium mb-3">Poser une question en messagerie</p>

            <div className="space-y-2">
              {[
                { name: 'Mme Sophie Laurent', role: 'Mathématiques • Prof. Principal' },
                { name: 'M. David Chen', role: 'NSI • Spécialité' },
                { name: 'Mme Hélène Dubois', role: 'Philosophie' }
              ].map((t) => (
                <button
                  key={t.name}
                  onClick={() => startDirectMessageWithTeacher(t.name)}
                  className="w-full flex items-center justify-between p-3 rounded-2xl bg-slate-50/70 hover:bg-indigo-50/70 border border-slate-100 hover:border-indigo-150 transition-all text-left group"
                >
                  <div>
                    <p className="text-xs font-bold text-slate-900 group-hover:text-indigo-700">{t.name}</p>
                    <p className="text-[10px] text-slate-400">{t.role}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
                </button>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
