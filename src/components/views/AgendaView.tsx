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
  const [typeFilter, setTypeFilter] = useState<string>('all');

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
      if (typeFilter !== 'all' && evt.type !== typeFilter) return false;
      return true;
    });
  }, [events, subjectFilter, typeFilter, globalSearch]);

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200/70 shadow-subtle">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Emploi du temps</h2>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Séances de cours, salles, devoirs et évaluations programmées
            </p>
          </div>

          {/* Navigation Semaine Dynamique */}
          <div className="flex items-center gap-1.5 ml-0 sm:ml-4 bg-slate-100 p-1 rounded-2xl">
            <button
              onClick={handlePrevWeek}
              className="p-1.5 rounded-xl hover:bg-white text-slate-500 hover:text-slate-900 transition-all shadow-none hover:shadow-subtle"
              title="Semaine précédente"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="px-2 text-xs font-bold text-slate-700 select-none">
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
              className="px-2.5 py-1 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-all"
            >
              Aujourd'hui
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Toggle View Mode */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl text-xs font-bold">
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'week' ? 'bg-white text-slate-900 shadow-subtle' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Semaine
            </button>
            <button
              onClick={() => setViewMode('day')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
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
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/70 shadow-subtle">
        {/* Day Pills with clean numbers */}
        <div className="flex items-center gap-2 overflow-x-auto py-1">
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
                <span>{d.name}</span>
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
            <span>Filtrer :</span>
          </div>

          <select
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-100/80 rounded-xl text-slate-700 font-semibold border-0 text-xs focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="all">Toutes matières</option>
            {uniqueSubjects.map(sub => (
              <option key={sub} value={sub}>{sub}</option>
            ))}
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-100/80 rounded-xl text-slate-700 font-semibold border-0 text-xs focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="all">Tous types</option>
            <option value="cours">Cours magistraux</option>
            <option value="ds">Devoirs Surveillés (DS)</option>
            <option value="tp">Travaux Pratiques (TP)</option>
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
                <div className="space-y-2.5 flex-1">
                  {dayEvents.length > 0 ? (
                    dayEvents.map((evt) => {
                      const theme = getSubjectTheme(evt.subjectCode);
                      return (
                        <div
                          key={evt.id}
                          onClick={() => setSelectedEventModal(evt)}
                          className="cursor-pointer group p-3.5 rounded-2xl border border-slate-100/90 hover:border-indigo-200 hover:bg-slate-50/70 hover:shadow-subtle transition-all"
                        >
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-lg border ${theme.badgeClass}`}>
                              {evt.subjectCode}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase">
                              {evt.type}
                            </span>
                          </div>

                          <h4 className="font-bold text-xs text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1 mt-1">
                            {evt.subject}
                          </h4>

                          <div className="mt-2 text-[11px] text-slate-500 space-y-0.5">
                            <div className="flex items-center gap-1 font-bold text-slate-700">
                              <Clock className="w-3 h-3 text-slate-400" />
                              <span>{evt.startTime} - {evt.endTime}</span>
                            </div>
                            <div className="flex items-center gap-1 text-slate-400">
                              <MapPin className="w-3 h-3" />
                              <span>{evt.room}</span>
                            </div>
                          </div>

                          {/* Homework indicator */}
                          {evt.homeworkDue && evt.homeworkDue.length > 0 && (
                            <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] font-bold text-amber-700 bg-amber-50/80 -mx-1 px-2 py-1 rounded-lg">
                              <span className="flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-amber-600" />
                                <span>{evt.homeworkDue.length} devoir</span>
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="py-12 text-center text-slate-400 text-xs italic">
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
                  className="cursor-pointer group flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border border-slate-100 hover:border-indigo-200 hover:bg-slate-50/70 hover:shadow-subtle transition-all gap-4"
                >
                  <div className="flex items-start sm:items-center gap-4">
                    <span className={`px-3 py-2 rounded-2xl text-xs font-black border uppercase tracking-wider shrink-0 ${theme.badgeClass}`}>
                      {evt.subjectCode}
                    </span>

                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-slate-900 group-hover:text-indigo-600 transition-colors">
                          {evt.subject}
                        </h4>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 uppercase">
                          {evt.type}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-3">
                        <span className="font-bold text-slate-700">{evt.startTime} - {evt.endTime}</span>
                        <span>•</span>
                        <span>{evt.room}</span>
                        <span>•</span>
                        <span>{evt.teacher}</span>
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
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
