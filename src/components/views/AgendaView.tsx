import React, { useState, useMemo } from 'react';
import { 
  Filter, 
  Clock, 
  MapPin, 
  User, 
  Plus, 
  CheckCircle2, 
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import { useSchool } from '../../context/SchoolContext';
import { CourseEvent, DayOfWeek } from '../../types/school';
import { getSubjectTheme } from '../../utils/theme';

export const AgendaView: React.FC = () => {
  const { 
    events, 
    setSelectedEventModal, 
    setIsNewHomeworkModalOpen, 
    startDirectMessageWithTeacher,
    globalSearch,
    syncWeek
  } = useSchool();

  const [viewMode, setViewMode] = useState<'week' | 'day'>('week');
  const [weekOffset, setWeekOffset] = useState<number>(0);

  // Jour actuel réel (1=Lundi ... 5=Vendredi)
  const currentRealDayNum = useMemo(() => {
    const jsDay = new Date().getDay();
    return (jsDay >= 1 && jsDay <= 5) ? (jsDay as DayOfWeek) : 1;
  }, []);

  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(currentRealDayNum);
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  // Date cible de la semaine active
  const targetDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + weekOffset * 7);
    return d;
  }, [weekOffset]);

  // Calcul dynamique des dates de la semaine (Lundi -> Vendredi)
  const weekDates = useMemo(() => {
    const d = new Date(targetDate);
    const day = d.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;
    const monday = new Date(d);
    monday.setDate(d.getDate() + diffToMonday);

    return [1, 2, 3, 4, 5].map((dow, idx) => {
      const cur = new Date(monday);
      cur.setDate(monday.getDate() + idx);
      const pad = (n: number) => n.toString().padStart(2, '0');
      return {
        dayOfWeek: dow as DayOfWeek,
        dateNum: pad(cur.getDate()),
        fullDate: `${cur.getFullYear()}-${pad(cur.getMonth() + 1)}-${pad(cur.getDate())}`
      };
    });
  }, [targetDate]);

  const daysConfig = useMemo(() => {
    const dayNames = [
      { name: 'Lundi', short: 'LUN' },
      { name: 'Mardi', short: 'MAR' },
      { name: 'Mercredi', short: 'MER' },
      { name: 'Jeudi', short: 'JEU' },
      { name: 'Vendredi', short: 'VEN' }
    ];
    const isCurrentWeek = weekOffset === 0;
    return weekDates.map((wd, i) => ({
      dayOfWeek: wd.dayOfWeek,
      name: dayNames[i].name,
      short: dayNames[i].short,
      dateNum: wd.dateNum,
      fullDate: wd.fullDate,
      isToday: isCurrentWeek && wd.dayOfWeek === currentRealDayNum
    }));
  }, [weekDates, weekOffset, currentRealDayNum]);

  // Libellé de la semaine (ex: "21 - 25 sept.")
  const weekLabel = useMemo(() => {
    if (weekDates.length < 5) return 'Semaine';
    const startDay = weekDates[0].dateNum;
    const endDay = weekDates[4].dateNum;
    const monthNames = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
    const month = monthNames[new Date(weekDates[0].fullDate).getMonth()];
    return `${startDay} - ${endDay} ${month}`;
  }, [weekDates]);

  const handlePrevWeek = () => {
    const nextOffset = weekOffset - 1;
    setWeekOffset(nextOffset);
    const d = new Date();
    d.setDate(d.getDate() + nextOffset * 7);
    syncWeek(d);
  };

  const handleNextWeek = () => {
    const nextOffset = weekOffset + 1;
    setWeekOffset(nextOffset);
    const d = new Date();
    d.setDate(d.getDate() + nextOffset * 7);
    syncWeek(d);
  };

  const handleResetToday = () => {
    setWeekOffset(0);
    syncWeek(new Date());
  };

  const uniqueSubjects = useMemo(() => {
    const subs = new Set<string>();
    events.forEach(e => subs.add(e.subject));
    return Array.from(subs);
  }, [events]);

  const filteredEvents = useMemo(() => {
    return events.filter(evt => {
      if (globalSearch) {
        const matchesQuery = evt.subject.toLowerCase().includes(globalSearch.toLowerCase()) ||
                             evt.teacher.toLowerCase().includes(globalSearch.toLowerCase()) ||
                             evt.room.toLowerCase().includes(globalSearch.toLowerCase());
        if (!matchesQuery) return false;
      }
      if (subjectFilter !== 'all' && evt.subject !== subjectFilter) return false;
      return true;
    });
  }, [events, subjectFilter, globalSearch]);

  const eventsByDay = useMemo(() => {
    const map: { [key: number]: CourseEvent[] } = { 1: [], 2: [], 3: [], 4: [], 5: [] };
    filteredEvents.forEach(evt => {
      if (map[evt.dayOfWeek]) {
        map[evt.dayOfWeek].push(evt);
      }
    });
    Object.keys(map).forEach(key => {
      map[Number(key)].sort((a, b) => a.startTime.localeCompare(b.startTime));
    });
    return map;
  }, [filteredEvents]);

  return (
    <div className="space-y-6 pb-12 max-w-6xl mx-auto">
      
      {/* Top Bar */}
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200/70 shadow-subtle">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Agenda</h2>
              <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-slate-100 text-slate-700">
                Semaine A
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Séances de cours, horaires, salles et devoirs associés
            </p>
          </div>

          {/* Navigation Semaine Dynamique */}
          <div className="flex items-center gap-1.5 bg-slate-100/90 p-1 rounded-2xl border border-slate-200/50">
            <button
              onClick={handlePrevWeek}
              className="p-1.5 rounded-xl hover:bg-white text-slate-500 hover:text-slate-900 transition-all shadow-none hover:shadow-subtle"
              title="Semaine précédente"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="px-2.5 text-xs font-bold text-slate-700 select-none">
              {weekLabel}
            </span>

            <button
              onClick={handleNextWeek}
              className="p-1.5 rounded-xl hover:bg-white text-slate-500 hover:text-slate-900 transition-all shadow-none hover:shadow-subtle"
              title="Semaine suivante"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {weekOffset !== 0 && (
            <button
              onClick={handleResetToday}
              className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-all border border-indigo-200/50"
            >
              Aujourd'hui
            </button>
          )}
        </div>

        <div className="flex items-center gap-2.5">
          {/* Toggle View Mode */}
          <div className="flex items-center p-1 bg-slate-100/90 rounded-xl text-xs font-bold border border-slate-200/50">
            <button
              onClick={() => setViewMode('week')}
              className={`px-3.5 py-1.5 rounded-lg transition-all ${
                viewMode === 'week' ? 'bg-white text-slate-900 shadow-subtle' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Semaine
            </button>
            <button
              onClick={() => setViewMode('day')}
              className={`px-3.5 py-1.5 rounded-lg transition-all ${
                viewMode === 'day' ? 'bg-white text-slate-900 shadow-subtle' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Jour
            </button>
          </div>

          <button
            onClick={() => setIsNewHomeworkModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-subtle transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Ajouter devoir</span>
          </button>
        </div>
      </div>

      {/* Date & Filter Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/70 shadow-subtle">
        {/* Day Pills with clean numbers */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
          {daysConfig.map((d) => {
            const isSelected = selectedDay === d.dayOfWeek;
            const count = eventsByDay[d.dayOfWeek]?.length || 0;
            return (
              <button
                key={d.dayOfWeek}
                onClick={() => setSelectedDay(d.dayOfWeek)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                  isSelected
                    ? 'bg-slate-900 text-white shadow-subtle'
                    : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200/70'
                }`}
              >
                <span>{d.name} <span className="opacity-70 font-semibold">{d.dateNum}</span></span>
                <span className={`px-1.5 py-0.2 text-[10px] rounded-md font-extrabold ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-slate-200/80 text-slate-700'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 text-slate-400 font-semibold">
            <Filter className="w-3.5 h-3.5" />
            <span>Filtrer par matière :</span>
          </div>

          <select
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-100/80 rounded-xl text-slate-700 font-semibold border border-slate-200/60 text-xs focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="all">Toutes les matières</option>
            {uniqueSubjects.map(sub => (
              <option key={sub} value={sub}>{sub}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Week Grid */}
      {viewMode === 'week' ? (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {daysConfig.map((day) => {
            const dayEvents = eventsByDay[day.dayOfWeek] || [];
            const isToday = day.isToday;

            return (
              <div 
                key={day.dayOfWeek}
                className={`bg-white rounded-3xl p-4 border transition-all flex flex-col ${
                  isToday 
                    ? 'border-indigo-200 shadow-card' 
                    : 'border-slate-200/70 shadow-subtle'
                }`}
              >
                {/* Column Day Header */}
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className={`font-extrabold text-sm ${isToday ? 'text-indigo-600' : 'text-slate-800'}`}>
                      {day.name} <span className="text-xs opacity-70 font-semibold">{day.dateNum}</span>
                    </span>
                    {isToday && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="Aujourd'hui" />
                    )}
                  </div>
                  <span className="text-[11px] font-semibold text-slate-400">
                    {dayEvents.length} cours
                  </span>
                </div>

                {/* Events list */}
                <div className="space-y-3 flex-1">
                  {dayEvents.length > 0 ? (
                    dayEvents.map((evt) => {
                      const theme = getSubjectTheme(evt.subjectCode);
                      return (
                        <div
                          key={evt.id}
                          onClick={() => setSelectedEventModal(evt)}
                          className="cursor-pointer group p-3.5 rounded-2xl border border-slate-100/90 hover:border-indigo-200 hover:bg-slate-50/70 hover:shadow-subtle transition-all bg-white"
                        >
                          <div className="flex items-center justify-between gap-1 mb-1.5">
                            <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-lg border ${theme.badgeClass}`}>
                              {evt.subjectCode}
                            </span>
                            {evt.status === 'in_progress' && (
                              <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                En cours
                              </span>
                            )}
                          </div>

                          <h4 className="font-bold text-xs text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                            {evt.subject}
                          </h4>

                          <div className="mt-2 text-[11px] text-slate-500 space-y-1">
                            <div className="flex items-center gap-1.5 font-bold text-slate-700">
                              <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                              <span>{evt.startTime} - {evt.endTime}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-slate-500">
                              <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate">{evt.room}</span>
                            </div>
                          </div>

                          {/* Devoirs attachés sous le cours (sans case séparée) */}
                          {evt.homeworkDue && evt.homeworkDue.length > 0 && (
                            <div className="mt-2.5 pt-2 border-t border-slate-100 space-y-1.5">
                              {evt.homeworkDue.map((hw) => {
                                const isUrgent = hw.priority === 'high';
                                return (
                                  <div
                                    key={hw.id}
                                    className={`flex items-start gap-1.5 px-2 py-1 rounded-xl text-[10px] leading-tight transition-colors ${
                                      hw.isCompleted
                                        ? 'bg-slate-50 text-slate-400 line-through'
                                        : isUrgent
                                          ? 'bg-rose-50/90 text-rose-800 border border-rose-100 font-semibold'
                                          : 'bg-amber-50/80 text-amber-800 border border-amber-100 font-medium'
                                    }`}
                                    title={hw.description || hw.title}
                                  >
                                    <span
                                      className={`w-1.5 h-1.5 rounded-full shrink-0 mt-1 ${
                                        hw.isCompleted
                                          ? 'bg-slate-300'
                                          : isUrgent
                                            ? 'bg-rose-500'
                                            : 'bg-amber-500'
                                      }`}
                                    />
                                    <span className="truncate flex-1 font-semibold">{hw.title}</span>
                                    {isUrgent && !hw.isCompleted && (
                                      <span className="text-[9px] uppercase tracking-wider font-extrabold text-rose-600 bg-rose-100/90 px-1 py-0.2 rounded shrink-0">
                                        Urgent
                                      </span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="flex-1 flex items-center justify-center py-12 text-center text-slate-400 text-xs italic">
                      Aucun cours
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Day View */
        <div className="bg-white rounded-3xl p-6 border border-slate-200/70 shadow-subtle max-w-3xl mx-auto">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                {daysConfig.find(d => d.dayOfWeek === selectedDay)?.name}
              </h3>
              <p className="text-xs text-slate-400 font-medium">
                {eventsByDay[selectedDay]?.length || 0} séances
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {eventsByDay[selectedDay]?.map((evt) => {
              const theme = getSubjectTheme(evt.subjectCode);
              return (
                <div
                  key={evt.id}
                  onClick={() => setSelectedEventModal(evt)}
                  className="cursor-pointer group flex flex-col p-4 rounded-2xl border border-slate-100 hover:border-indigo-200 hover:bg-slate-50/70 hover:shadow-subtle transition-all gap-3 bg-white"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start sm:items-center gap-4">
                      <span className={`px-3 py-2 rounded-2xl text-xs font-black border uppercase tracking-wider shrink-0 ${theme.badgeClass}`}>
                        {evt.subjectCode}
                      </span>

                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-slate-900 group-hover:text-indigo-600 transition-colors">
                            {evt.subject}
                          </h4>
                          {evt.status === 'in_progress' && (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              En cours
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-3">
                          <span className="font-bold text-slate-700 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {evt.startTime} - {evt.endTime}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            {evt.room}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3 text-slate-400" />
                            {evt.teacher}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          startDirectMessageWithTeacher(evt.teacher);
                        }}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                      >
                        Écrire au prof
                      </button>
                      <button
                        onClick={() => setSelectedEventModal(evt)}
                        className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-indigo-600 text-white transition-colors"
                      >
                        Détails
                      </button>
                    </div>
                  </div>

                  {/* Devoirs attachés en Day View */}
                  {evt.homeworkDue && evt.homeworkDue.length > 0 && (
                    <div className="pt-2.5 border-t border-slate-100 flex flex-wrap gap-2">
                      {evt.homeworkDue.map((hw) => {
                        const isUrgent = hw.priority === 'high';
                        return (
                          <div
                            key={hw.id}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs ${
                              hw.isCompleted
                                ? 'bg-slate-50 text-slate-400 line-through'
                                : isUrgent
                                  ? 'bg-rose-50 text-rose-800 border border-rose-200/80 font-semibold'
                                  : 'bg-amber-50 text-amber-800 border border-amber-200/80 font-medium'
                            }`}
                          >
                            <span className={`w-2 h-2 rounded-full shrink-0 ${
                              hw.isCompleted ? 'bg-slate-300' : isUrgent ? 'bg-rose-500' : 'bg-amber-500'
                            }`} />
                            <span>{hw.title}</span>
                            {isUrgent && !hw.isCompleted && (
                              <span className="text-[10px] uppercase font-bold text-rose-600 bg-rose-100 px-1.5 py-0.5 rounded">
                                Urgent
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
