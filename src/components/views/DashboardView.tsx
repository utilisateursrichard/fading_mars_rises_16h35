import React, { useState, useMemo } from 'react';
import { 
  Clock, 
  MapPin, 
  CheckCircle2, 
  Circle, 
  TrendingUp, 
  Calendar, 
  ChevronRight, 
  BookOpen, 
  Plus, 
  User
} from 'lucide-react';
import { useSchool } from '../../context/SchoolContext';
import { getSubjectTheme } from '../../utils/theme';
import { calculateHomeworkImportance } from '../../utils/homeworkImportance';

const importanceClasses = [
  'bg-white border-slate-200/70 hover:border-slate-300',
  'bg-red-50/30 border-red-100 hover:bg-red-50/50',
  'bg-red-50/50 border-red-100 hover:bg-red-50/70',
  'bg-red-50/80 border-red-200 hover:bg-red-100/70',
  'bg-red-100/70 border-red-200 hover:bg-red-100',
  'bg-red-100 border-red-300 hover:bg-red-200/80',
  'bg-red-200/70 border-red-300 hover:bg-red-200',
  'bg-red-200 border-red-400 hover:bg-red-300/80',
  'bg-red-300/70 border-red-400 hover:bg-red-300',
  'bg-red-300 border-red-500 hover:bg-red-400/80',
  'bg-red-400/80 border-red-500 hover:bg-red-400'
];

const parseMinutes = (timeStr: string): number => {
  if (!timeStr) return 0;
  const parts = timeStr.split(':');
  if (parts.length < 2) return 0;
  const h = parseInt(parts[0], 10) || 0;
  const m = parseInt(parts[1], 10) || 0;
  return h * 60 + m;
};

export const DashboardView: React.FC = () => {
  const { 
    student, 
    todayEvents, 
    homeworks, 
    toggleHomework, 
    overallStats, 
    setActiveTab,
    setSelectedEventModal,
    setIsNewHomeworkModalOpen,
    globalSearch,
    isDemoMode,
    isInsideSmartschoolPlatform,
    events
  } = useSchool();

  const [homeworkFilter, setHomeworkFilter] = useState<'pending' | 'all' | 'completed'>('pending');

  // Greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bonjour';
    if (hour < 18) return 'Bon après-midi';
    return 'Bonsoir';
  }, []);

  const todayFormatted = useMemo(() => {
    return new Intl.DateTimeFormat('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    }).format(new Date());
  }, []);

  // Date d'aujourd'hui (YYYY-MM-DD)
  const todayDateStr = useMemo(() => {
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  }, []);

  // Filtered homeworks (les devoirs passés / en retard sont supprimés et invisibles)
  const filteredHomeworks = useMemo(() => {
    const visibleHomeworks = homeworks
      .filter(hw => {
        // Ignorer tout devoir dans le passé
        if (hw.dueDate && hw.dueDate < todayDateStr) return false;

        if (globalSearch) {
          const match = hw.title.toLowerCase().includes(globalSearch.toLowerCase()) ||
                        hw.subject.toLowerCase().includes(globalSearch.toLowerCase());
          if (!match) return false;
        }
        if (homeworkFilter === 'pending') return !hw.isCompleted;
        if (homeworkFilter === 'completed') return hw.isCompleted;
        return true;
      });

    // Le même score sert au tri et à l'affichage : impossible d'afficher 10/10
    // derrière un devoir moins important à cause de deux calculs différents.
    return visibleHomeworks
      .map(homework => ({
        homework,
        importance: calculateHomeworkImportance(
          homework.dueDate,
          homework.description,
          homework.isCompleted
        )
      }))
      .sort((first, second) => {
        // Les tâches les plus importantes d'abord, puis l'échéance la plus proche.
        return second.importance - first.importance ||
          first.homework.dueDate.localeCompare(second.homework.dueDate);
      });
  }, [homeworks, homeworkFilter, globalSearch, todayDateStr]);

  // Tri chronologique strict des cours du jour par heure de début
  const sortedTodayEvents = useMemo(() => {
    return [...todayEvents].sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [todayEvents]);

  // Détermination intelligente du cours en cours ou du prochain cours :
  // 1. Cours en cours actuellement
  // 2. Prochain cours plus tard aujourd'hui
  // 3. Prochain cours du prochain jour de cours (ex: lundi si fin de journée ou week-end)
  const nextClassSpotlight = useMemo(() => {
    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const currentJsDay = now.getDay(); // 0=Dimanche, 1=Lundi ... 6=Samedi

    // 1. Cours en cours aujourd'hui
    const inProgress = sortedTodayEvents.find(e => {
      const s = parseMinutes(e.startTime);
      const end = parseMinutes(e.endTime);
      return (e.status === 'in_progress') || (nowMinutes >= s && nowMinutes <= end);
    });
    if (inProgress) {
      return {
        event: inProgress,
        badgeText: '● En cours',
        badgeClass: 'text-emerald-600 bg-emerald-50 border-emerald-200/60',
        timeLabel: `En cours (jusqu'à ${inProgress.endTime})`,
        dayHeader: "Aujourd'hui"
      };
    }

    // 2. Prochain cours plus tard aujourd'hui
    const upcomingToday = sortedTodayEvents.find(e => {
      const s = parseMinutes(e.startTime);
      return s > nowMinutes;
    });
    if (upcomingToday) {
      const diffMin = parseMinutes(upcomingToday.startTime) - nowMinutes;
      const countdown = diffMin < 60 ? `dans ${diffMin} min` : `à ${upcomingToday.startTime}`;
      return {
        event: upcomingToday,
        badgeText: "Aujourd'hui",
        badgeClass: 'text-indigo-600 bg-indigo-50 border-indigo-200/60',
        timeLabel: `${upcomingToday.startTime} (${countdown})`,
        dayHeader: "Aujourd'hui"
      };
    }

    // 3. Tous les cours d'aujourd'hui sont terminés ou journée sans cours (ex: samedi après-midi / dimanche) :
    // On cherche le tout prochain cours sur les jours suivants de la semaine
    const allEvents = events.length > 0 ? events : sortedTodayEvents;
    const dayNames: Record<number, string> = {
      1: 'Lundi',
      2: 'Mardi',
      3: 'Mercredi',
      4: 'Jeudi',
      5: 'Vendredi',
      6: 'Samedi',
      7: 'Dimanche'
    };

    for (let offset = 1; offset <= 7; offset++) {
      const nextJsDow = ((currentJsDay + offset) % 7);
      const nextDow = nextJsDow === 0 ? 7 : nextJsDow;
      
      const dayEvts = allEvents
        .filter(e => e.dayOfWeek === nextDow)
        .sort((a, b) => a.startTime.localeCompare(b.startTime));

      if (dayEvts.length > 0) {
        const nextEvt = dayEvts[0];
        const dayName = offset === 1 ? 'Demain' : (dayNames[nextDow] || 'Prochain jour');
        return {
          event: nextEvt,
          badgeText: `Prochain cours • ${dayName}`,
          badgeClass: 'text-indigo-600 bg-indigo-50 border-indigo-200/60',
          timeLabel: `${dayName} à ${nextEvt.startTime}`,
          dayHeader: dayName
        };
      }
    }

    return null;
  }, [sortedTodayEvents, events]);

  const pendingHomeworksCount = useMemo(() => {
    return homeworks.filter(h => !h.isCompleted && (!h.dueDate || h.dueDate >= todayDateStr)).length;
  }, [homeworks, todayDateStr]);

  const urgentHomeworksCount = useMemo(() => {
    return homeworks.filter(h =>
      calculateHomeworkImportance(h.dueDate, h.description, h.isCompleted) >= 5
    ).length;
  }, [homeworks, todayDateStr]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      
      {/* Bannière d'information si en Mode Réel autonome hors Smartschool */}
      {!isDemoMode && events.length === 0 && !isInsideSmartschoolPlatform && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
            <p className="text-xs font-medium text-amber-800">
              <strong>Mode Réel actif :</strong> Aucune donnée en cache. Ouvrez Smartschool et cliquez sur le favori <strong>BetterSchool</strong> pour synchroniser vos cours en direct.
            </p>
          </div>
          <button
            onClick={() => setActiveTab('book')}
            className="shrink-0 px-3 py-1.5 bg-amber-200/70 hover:bg-amber-300/80 text-amber-900 text-xs font-bold rounded-xl transition-all self-start sm:self-auto"
          >
            Voir le favori
          </button>
        </div>
      )}

      {/* 1. Header Minimaliste & Accueillant */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            {student?.firstName ? `${greeting}, ${student.firstName}` : greeting}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5 capitalize">
            {todayFormatted} {student?.studentClass ? (
              <>• <span className="text-indigo-600 font-semibold">{student.studentClass}</span></>
            ) : null}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('agenda')}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold border border-slate-200/80 shadow-subtle transition-all flex items-center gap-1.5"
          >
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>Agenda</span>
          </button>

          <button
            onClick={() => setIsNewHomeworkModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-indigo-600 text-white text-xs font-bold shadow-subtle transition-all flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Devoir</span>
          </button>
        </div>
      </div>

      {/* 2. Spotlight Prochain Cours — Carte Épurée Apple/M3 */}
      {nextClassSpotlight ? (
        <div
          onClick={() => setSelectedEventModal(nextClassSpotlight.event)}
          className="cursor-pointer group relative bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-subtle hover:shadow-card hover:border-indigo-200 transition-all duration-200"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-14 h-14 rounded-2xl bg-slate-900 text-white flex flex-col items-center justify-center shrink-0">
                <span className="text-[9px] uppercase font-bold text-slate-400">
                  {nextClassSpotlight.dayHeader === "Aujourd'hui" ? 'Début' : nextClassSpotlight.dayHeader}
                </span>
                <span className="text-sm font-black">{nextClassSpotlight.event.startTime}</span>
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold border ${getSubjectTheme(nextClassSpotlight.event.subjectCode)?.badgeClass || 'bg-slate-100'}`}>
                    {nextClassSpotlight.event.subjectCode}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${nextClassSpotlight.badgeClass}`}>
                    {nextClassSpotlight.badgeText}
                  </span>
                </div>

                <h2 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                  {nextClassSpotlight.event.subject}
                </h2>

                <p className="text-xs text-slate-500 font-medium flex items-center gap-2 mt-0.5">
                  <span className="flex items-center gap-1 font-semibold text-slate-700">
                    <Clock className="w-3 h-3 text-slate-400" />
                    {nextClassSpotlight.timeLabel}
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="flex items-center gap-1 font-semibold text-slate-700">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    {nextClassSpotlight.event.room}
                  </span>
                  <span className="text-slate-300">•</span>
                  <span>{nextClassSpotlight.event.teacher}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 text-xs font-bold text-indigo-600 shrink-0">
              <span>Voir les détails</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-subtle flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center shrink-0 font-bold">
            ✓
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Tous les cours sont terminés</h3>
            <p className="text-xs text-slate-400 font-medium">Aucun autre cours programmé pour le moment.</p>
          </div>
        </div>
      )}

      {/* 3. Les 3 Métriques Essentielles (Sans surcharge) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        
        {/* Moyenne */}
        <div 
          onClick={() => setActiveTab('results')}
          className="p-4 sm:p-5 bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-subtle hover:shadow-card cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500">Moyenne générale</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          {overallStats ? (
            <>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-black text-slate-900">{overallStats.current}</span>
                <span className="text-xs text-slate-400 font-semibold">/ 100</span>
              </div>
              {(() => {
                const diffPrev = Number((overallStats.current - overallStats.previousTerm).toFixed(1));
                return (
                  <p className={`text-[11px] font-bold mt-1 ${diffPrev >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {diffPrev >= 0 ? `+${diffPrev}` : diffPrev} pts{' '}
                    <span className="text-slate-400 font-normal">vs classe ({overallStats.classAvg}/100)</span>
                  </p>
                );
              })()}
            </>
          ) : (
            <div className="space-y-1">
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-black text-slate-300">--</span>
                <span className="text-xs text-slate-400 font-semibold">/ 100</span>
              </div>
              <p className="text-[11px] text-amber-600 font-bold mt-1">
                En attente du module Skore
              </p>
            </div>
          )}
        </div>

        {/* Devoirs */}
        <div 
          onClick={() => setHomeworkFilter('pending')}
          className="p-4 sm:p-5 bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-subtle hover:shadow-card cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500">Devoirs à faire</span>
            <BookOpen className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">{pendingHomeworksCount}</span>
            <span className="text-xs text-slate-400 font-semibold">en attente</span>
          </div>
          <p className="text-[11px] text-slate-400 font-medium mt-1">
            {urgentHomeworksCount > 0 ? (
              <span className="text-rose-600 font-bold">{urgentHomeworksCount} urgent(s)</span>
            ) : (
              'Aucune urgence'
            )}
          </p>
        </div>

        {/* Programme du jour */}
        <div 
          onClick={() => setActiveTab('agenda')}
          className="p-4 sm:p-5 bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-subtle hover:shadow-card cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500">Séances du jour</span>
            <Calendar className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">{sortedTodayEvents.length}</span>
            <span className="text-xs text-slate-400 font-semibold">cours prévus</span>
          </div>
          <p className="text-[11px] text-slate-400 font-medium mt-1">
            Fin à {sortedTodayEvents[sortedTodayEvents.length - 1]?.endTime || '17:30'}
          </p>
        </div>

      </div>

      {/* 4. Deux Colonnes Claires : Programme & Devoirs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 lg:items-stretch gap-6">
        
        {/* Colonne Gauche : Programme du jour trié chronologiquement */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-subtle">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-extrabold text-base text-slate-900">Agenda du jour</h3>
            <button
              onClick={() => setActiveTab('agenda')}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
            >
              Semaine complète →
            </button>
          </div>

          <div className="space-y-2">
            {sortedTodayEvents.length === 0 ? (
              <div className="p-8 text-center text-xs font-medium text-slate-400">
                Aucun cours prévu aujourd'hui.
              </div>
            ) : (
              sortedTodayEvents.map((evt) => {
                const theme = getSubjectTheme(evt.subjectCode);
                return (
                  <div
                    key={evt.id}
                    onClick={() => setSelectedEventModal(evt)}
                    className="cursor-pointer group flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 border border-transparent hover:border-slate-200/70 transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`px-2 py-1 rounded-xl text-xs font-extrabold border shrink-0 ${theme.badgeClass}`}>
                        {evt.subjectCode}
                      </span>

                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                          {evt.subject}
                        </p>
                        <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                          {evt.room} • {evt.teacher}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-bold text-slate-700">{evt.startTime} - {evt.endTime}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Colonne Droite : Devoirs */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-subtle flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-extrabold text-base text-slate-900">Devoirs & Travail</h3>
            
            {/* Filter Pills */}
            <div className="flex gap-1 p-0.5 bg-slate-100 rounded-xl text-xs font-bold">
              <button
                onClick={() => setHomeworkFilter('pending')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  homeworkFilter === 'pending' ? 'bg-white text-slate-900 shadow-subtle' : 'text-slate-500'
                }`}
              >
                À faire
              </button>
              <button
                onClick={() => setHomeworkFilter('all')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  homeworkFilter === 'all' ? 'bg-white text-slate-900 shadow-subtle' : 'text-slate-500'
                }`}
              >
                Tous
              </button>
              <button
                onClick={() => setHomeworkFilter('completed')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  homeworkFilter === 'completed' ? 'bg-white text-slate-900 shadow-subtle' : 'text-slate-500'
                }`}
              >
                Faits
              </button>
            </div>
          </div>

          {/* List */}
          <div className="space-y-2 flex-1 min-h-0 overflow-y-auto pr-1">
            {filteredHomeworks.length === 0 ? (
              <div className="p-8 text-center text-xs font-medium text-slate-400">
                Aucun devoir dans cette vue.
              </div>
            ) : (
              filteredHomeworks.map(({ homework: hw, importance }) => {
                const isUrgent = importance >= 5;
                return (
                  <div
                    key={hw.id}
                    className={`p-3 rounded-2xl border transition-all flex items-start gap-3 ${
                      hw.isCompleted
                        ? 'bg-slate-50/50 border-slate-100 opacity-60'
                        : importanceClasses[importance]
                    }`}
                  >
                    <button
                      onClick={() => toggleHomework(hw.id)}
                      className={`mt-0.5 transition-colors shrink-0 ${
                        hw.isCompleted
                          ? 'text-slate-300 hover:text-indigo-600'
                          : isUrgent ? 'text-red-500 hover:text-red-800' : 'text-slate-300 hover:text-indigo-600'
                      }`}
                    >
                      {hw.isCompleted ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Circle className="w-4 h-4" />
                      )}
                    </button>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className={`text-[10px] font-bold uppercase ${hw.isCompleted ? 'text-slate-500' : isUrgent ? 'text-red-800' : 'text-slate-700'}`}>
                          {hw.subjectCode}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[10px] font-bold ${hw.isCompleted ? 'text-slate-400' : isUrgent ? 'text-red-800' : 'text-slate-400'}`}>
                            {new Date(hw.dueDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                          </span>
                          <span
                            title={`Importance : ${importance} sur 10`}
                            className={`min-w-5 px-1 py-0.5 rounded-md text-center text-[10px] font-black ${
                              importance >= 7 ? 'bg-red-600 text-white' : importance >= 4 ? 'bg-red-200 text-red-800' : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {importance}/10
                          </span>
                        </div>
                      </div>

                      <p className={`text-xs font-bold mt-0.5 ${hw.isCompleted ? 'line-through text-slate-400' : isUrgent ? 'text-red-950' : 'text-slate-900'}`}>
                        {hw.title}
                      </p>
                      
                      {hw.description && (
                        <p className={`text-[11px] mt-0.5 line-clamp-1 ${hw.isCompleted ? 'text-slate-500' : isUrgent ? 'text-red-900' : 'text-slate-500'}`}>
                          {hw.description}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
