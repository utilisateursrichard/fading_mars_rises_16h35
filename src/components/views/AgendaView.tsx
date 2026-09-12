import React, { useState, useMemo, useEffect } from 'react';
import { 
  Filter, 
  Clock, 
  MapPin, 
  User, 
  Plus, 
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import { useSchool } from '../../context/SchoolContext';
import { CourseEvent, DayOfWeek } from '../../types/school';
import { getSubjectTheme } from '../../utils/theme';

const HOUR_HEIGHT = 80;

const parseMinutes = (timeStr: string): number => {
  if (!timeStr) return 0;
  const parts = timeStr.split(':');
  if (parts.length < 2) return 0;
  const h = parseInt(parts[0], 10) || 0;
  const m = parseInt(parts[1], 10) || 0;
  return h * 60 + m;
};

interface PositionedEvent {
  event: CourseEvent;
  startMin: number;
  endMin: number;
  top: number;
  height: number;
  leftPercent: number;
  widthPercent: number;
}

/**
 * Calcule la disposition géométrique précise des cours d'une journée:
 * - Hauteur proportionnelle à la durée réelle (ex: 2h = 2x plus haut qu'1h)
 * - Position verticale calée sur l'heure exacte (top)
 * - En cas de cours simultanés ou qui se chevauchent: division en colonnes (gauche / droite)
 */
const computeDayLayout = (
  dayEvents: CourseEvent[],
  minHour: number,
  hourHeight: number
): PositionedEvent[] => {
  if (!dayEvents || dayEvents.length === 0) return [];

  const parsed = dayEvents.map(evt => {
    let s = parseMinutes(evt.startTime);
    let e = parseMinutes(evt.endTime);
    if (s <= 0) s = minHour * 60;
    if (e <= s) e = s + 50;
    return {
      event: evt,
      startMin: s,
      endMin: e
    };
  });

  // Tri par heure de début croissante, puis par durée décroissante
  parsed.sort((a, b) => {
    if (a.startMin !== b.startMin) return a.startMin - b.startMin;
    return (b.endMin - b.startMin) - (a.endMin - a.startMin);
  });

  // Regroupement en clusters de chevauchement
  const clusters: { items: typeof parsed }[] = [];
  let currentCluster: typeof parsed = [];
  let currentClusterEnd = 0;

  parsed.forEach(item => {
    if (currentCluster.length === 0) {
      currentCluster.push(item);
      currentClusterEnd = item.endMin;
    } else if (item.startMin < currentClusterEnd) {
      // Chevauchement avec le cluster actuel
      currentCluster.push(item);
      currentClusterEnd = Math.max(currentClusterEnd, item.endMin);
    } else {
      clusters.push({ items: currentCluster });
      currentCluster = [item];
      currentClusterEnd = item.endMin;
    }
  });
  if (currentCluster.length > 0) {
    clusters.push({ items: currentCluster });
  }

  const result: PositionedEvent[] = [];

  // Attribution de pistes (sous-colonnes) sans superposition
  clusters.forEach(cluster => {
    const trackEndTimes: number[] = [];
    const assignments: { item: (typeof cluster.items)[0]; track: number }[] = [];

    cluster.items.forEach(item => {
      let placedTrack = -1;
      for (let t = 0; t < trackEndTimes.length; t++) {
        if (trackEndTimes[t] <= item.startMin) {
          placedTrack = t;
          trackEndTimes[t] = item.endMin;
          break;
        }
      }
      if (placedTrack === -1) {
        placedTrack = trackEndTimes.length;
        trackEndTimes.push(item.endMin);
      }
      assignments.push({ item, track: placedTrack });
    });

    const totalTracks = Math.max(1, trackEndTimes.length);
    const widthPercent = 100 / totalTracks;

    assignments.forEach(({ item, track }) => {
      const top = ((item.startMin - minHour * 60) / 60) * hourHeight;
      const durationMin = item.endMin - item.startMin;
      // Hauteur minimum de 42px pour assurer lisibilité et cliquabilité
      const height = Math.max((durationMin / 60) * hourHeight, 42);
      const leftPercent = track * widthPercent;

      result.push({
        event: item.event,
        startMin: item.startMin,
        endMin: item.endMin,
        top,
        height,
        leftPercent,
        widthPercent
      });
    });
  });

  return result;
};

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

  // Jour actuel réel (1=Lundi ... 6=Samedi, si Dimanche -> 1 pour préparer la semaine à venir)
  const currentRealDayNum = useMemo(() => {
    const jsDay = new Date().getDay();
    return (jsDay >= 1 && jsDay <= 6) ? (jsDay as DayOfWeek) : (1 as DayOfWeek);
  }, []);

  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(currentRealDayNum);
  const [subjectFilter, setSubjectFilter] = useState<string>('all');

  // Date cible de la semaine active
  // Le dimanche par convention pour les agendas scolaires, on bascule par défaut sur la semaine de demain (lundi)
  const targetDate = useMemo(() => {
    const d = new Date();
    if (d.getDay() === 0 && weekOffset === 0) {
      d.setDate(d.getDate() + 1);
    } else {
      d.setDate(d.getDate() + weekOffset * 7);
    }
    return d;
  }, [weekOffset]);

  // Configuration des jours de la semaine (Lundi -> Samedi)
  const DAY_NAMES = useMemo(() => [
    { dow: 1 as DayOfWeek, name: 'Lundi', short: 'LUN' },
    { dow: 2 as DayOfWeek, name: 'Mardi', short: 'MAR' },
    { dow: 3 as DayOfWeek, name: 'Mercredi', short: 'MER' },
    { dow: 4 as DayOfWeek, name: 'Jeudi', short: 'JEU' },
    { dow: 5 as DayOfWeek, name: 'Vendredi', short: 'VEN' },
    { dow: 6 as DayOfWeek, name: 'Samedi', short: 'SAM' }
  ], []);

  // Calcul dynamique des dates de la semaine (Lundi -> Samedi)
  const weekDates = useMemo(() => {
    const d = new Date(targetDate);
    const day = d.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;
    const monday = new Date(d);
    monday.setDate(d.getDate() + diffToMonday);

    const pad = (n: number) => n.toString().padStart(2, '0');

    return DAY_NAMES.map((item, idx) => {
      const cur = new Date(monday);
      cur.setDate(monday.getDate() + idx);
      return {
        dayOfWeek: item.dow,
        name: item.name,
        short: item.short,
        dateNum: pad(cur.getDate()),
        fullDate: `${cur.getFullYear()}-${pad(cur.getMonth() + 1)}-${pad(cur.getDate())}`
      };
    });
  }, [targetDate, DAY_NAMES]);

  // Suivi de l'heure courante (actualisé chaque 30 secondes pour une précision parfaite de la barre)
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 30000);
    return () => clearInterval(interval);
  }, []);

  // Date du jour actuel (YYYY-MM-DD)
  const todayDateStr = useMemo(() => {
    const now = currentTime;
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  }, [currentTime]);

  const daysConfig = useMemo(() => {
    return weekDates.map((wd) => ({
      dayOfWeek: wd.dayOfWeek,
      name: wd.name,
      short: wd.short,
      dateNum: wd.dateNum,
      fullDate: wd.fullDate,
      isToday: wd.fullDate === todayDateStr
    }));
  }, [weekDates, todayDateStr]);

  // Libellé de la semaine (ex: "07 - 12 sept.")
  const weekLabel = useMemo(() => {
    if (weekDates.length === 0) return 'Semaine';
    const startDay = weekDates[0].dateNum;
    const endDay = weekDates[weekDates.length - 1].dateNum;
    const monthNames = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
    const month = monthNames[new Date(weekDates[0].fullDate).getMonth()];
    return `${startDay} - ${endDay} ${month}`;
  }, [weekDates]);

  // Type de semaine A ou B
  const weekType = useMemo(() => {
    const d = new Date(Date.UTC(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return weekNo % 2 === 0 ? 'Semaine B' : 'Semaine A';
  }, [targetDate]);

  // Synchronisation automatique des données de la semaine
  useEffect(() => {
    syncWeek(targetDate);
  }, [targetDate]);

  const handlePrevWeek = () => {
    setWeekOffset(prev => prev - 1);
  };

  const handleNextWeek = () => {
    setWeekOffset(prev => prev + 1);
  };

  const handleResetToday = () => {
    setWeekOffset(0);
    const now = new Date();
    const jsDay = now.getDay();
    const day = (jsDay >= 1 && jsDay <= 6) ? (jsDay as DayOfWeek) : (1 as DayOfWeek);
    setSelectedDay(day);
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
    const map: { [key: number]: CourseEvent[] } = { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
    filteredEvents.forEach(evt => {
      if (!map[evt.dayOfWeek]) {
        map[evt.dayOfWeek] = [];
      }
      map[evt.dayOfWeek].push(evt);
    });
    Object.keys(map).forEach(key => {
      map[Number(key)].sort((a, b) => a.startTime.localeCompare(b.startTime));
    });
    return map;
  }, [filteredEvents]);

  // Calcul dynamique des bornes horaires de la semaine (minHour et maxHour)
  const { minHour, maxHour, totalHours } = useMemo(() => {
    let minH = 8;
    let maxH = 17;
    filteredEvents.forEach(evt => {
      const s = parseMinutes(evt.startTime);
      const e = parseMinutes(evt.endTime);
      if (s > 0) minH = Math.min(minH, Math.floor(s / 60));
      if (e > 0) maxH = Math.max(maxH, Math.ceil(e / 60));
    });
    // Si la semaine affichée contient aujourd'hui, s'assurer que l'heure courante est incluse dans la grille
    const hasToday = daysConfig.some(d => d.isToday);
    if (hasToday) {
      const currentHour = currentTime.getHours();
      if (currentHour >= 7 && currentHour <= 20) {
        minH = Math.min(minH, currentHour);
        maxH = Math.max(maxH, currentHour + 1);
      }
    }
    minH = Math.max(7, Math.min(minH, 8));
    maxH = Math.max(17, Math.min(maxH, 20));
    return { minHour: minH, maxHour: maxH, totalHours: maxH - minH };
  }, [filteredEvents, daysConfig, currentTime]);

  const hoursList = useMemo(() => {
    const list: number[] = [];
    for (let h = minHour; h <= maxHour; h++) {
      list.push(h);
    }
    return list;
  }, [minHour, maxHour]);

  const totalGridHeight = totalHours * HOUR_HEIGHT;

  // Ligne de l'heure courante (top en px)
  const currentTimeTop = useMemo(() => {
    const nowMin = currentTime.getHours() * 60 + currentTime.getMinutes();
    if (nowMin < minHour * 60 || nowMin > maxHour * 60) return null;
    return ((nowMin - minHour * 60) / 60) * HOUR_HEIGHT;
  }, [currentTime, minHour, maxHour]);

  // Disposition calculée par jour avec gestion des chevauchements (gauche/droite)
  const layoutByDay = useMemo(() => {
    const result: { [key: number]: PositionedEvent[] } = { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
    [1, 2, 3, 4, 5, 6].forEach(dayNum => {
      const dayEvts = eventsByDay[dayNum] || [];
      result[dayNum] = computeDayLayout(dayEvts, minHour, HOUR_HEIGHT);
    });
    return result;
  }, [eventsByDay, minHour]);

  return (
    <div className="space-y-6 pb-12 max-w-6xl mx-auto">
      
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200/70 shadow-subtle">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Agenda</h2>
              <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                {weekType}
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

      {/* Week Grid (Tableau de temps proportionnel) */}
      {viewMode === 'week' ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-subtle overflow-hidden">
          <div className="overflow-x-auto">
            <div className="min-w-[860px]">
              {/* Header Row: Heure + 6 jours (Lundi à Samedi) */}
              <div className="grid grid-cols-[55px_repeat(6,1fr)] border-b border-slate-200/80 bg-slate-50/70 sticky top-0 z-20">
                <div className="py-3 px-2 text-center text-[11px] font-bold text-slate-400 border-r border-slate-200/60 flex items-center justify-center">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                </div>
                {daysConfig.map((day) => (
                  <div
                    key={day.dayOfWeek}
                    onClick={() => setSelectedDay(day.dayOfWeek)}
                    className={`py-3 px-2 text-center border-r last:border-r-0 border-slate-200/60 cursor-pointer transition-colors ${
                      day.isToday ? 'bg-indigo-50/50' : 'hover:bg-slate-100/60'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-1.5">
                      <span className={`text-xs font-black uppercase tracking-wider ${
                        day.isToday ? 'text-indigo-600' : 'text-slate-800'
                      }`}>
                        {day.name}
                      </span>
                      <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
                        day.isToday ? 'bg-indigo-600 text-white' : 'text-slate-500'
                      }`}>
                        {day.dateNum}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-medium mt-0.5">
                      {eventsByDay[day.dayOfWeek]?.length || 0} cours
                    </div>
                  </div>
                ))}
              </div>

              {/* Timetable Body */}
              <div className="grid grid-cols-[55px_repeat(6,1fr)] relative" style={{ height: `${totalGridHeight}px` }}>
                {/* Colonne des heures */}
                <div className="relative border-r border-slate-200/60 select-none bg-slate-50/40">
                  {hoursList.map((h, i) => {
                    if (i === hoursList.length - 1) return null;
                    return (
                      <div
                        key={h}
                        className="absolute right-2 text-[10px] font-bold text-slate-400 -translate-y-1/2"
                        style={{ top: `${i * HOUR_HEIGHT}px` }}
                      >
                        {String(h).padStart(2, '0')}:00
                      </div>
                    );
                  })}

                  {/* Badge heure courante dans l'axe horaire */}
                  {daysConfig.some(d => d.isToday) && currentTimeTop !== null && (
                    <div
                      className="absolute right-1 z-30 -translate-y-1/2 px-1.5 py-0.5 rounded-md bg-rose-500 text-white text-[9px] font-black shadow-sm tracking-tight"
                      style={{ top: `${currentTimeTop}px` }}
                    >
                      {String(currentTime.getHours()).padStart(2, '0')}:{String(currentTime.getMinutes()).padStart(2, '0')}
                    </div>
                  )}
                </div>

                {/* 6 Colonnes de jours */}
                {daysConfig.map((day) => {
                  const dayLayout = layoutByDay[day.dayOfWeek] || [];
                  return (
                    <div
                      key={day.dayOfWeek}
                      className={`relative border-r last:border-r-0 border-slate-200/60 ${
                        day.isToday ? 'bg-indigo-50/15' : ''
                      }`}
                    >
                      {/* Lignes d'heures horizontales */}
                      {hoursList.map((h, i) => (
                        <div
                          key={h}
                          className="absolute left-0 right-0 border-t border-slate-100 pointer-events-none"
                          style={{ top: `${i * HOUR_HEIGHT}px` }}
                        />
                      ))}

                      {/* Lignes de demi-heures pointillées */}
                      {hoursList.map((h, i) => {
                        if (i === hoursList.length - 1) return null;
                        return (
                          <div
                            key={`half-${h}`}
                            className="absolute left-0 right-0 border-t border-slate-50/90 border-dashed pointer-events-none"
                            style={{ top: `${i * HOUR_HEIGHT + HOUR_HEIGHT / 2}px` }}
                          />
                        );
                      })}

                      {/* Indicateur de l'heure courante si aujourd'hui */}
                      {day.isToday && currentTimeTop !== null && (
                        <div
                          className="absolute left-0 right-0 z-20 flex items-center pointer-events-none"
                          style={{ top: `${currentTimeTop}px` }}
                        >
                          <div className="w-2.5 h-2.5 rounded-full bg-rose-500 -ml-1.5 shadow-sm ring-2 ring-white" />
                          <div className="h-[2px] w-full bg-rose-500 shadow-sm" />
                        </div>
                      )}

                      {/* Cours positionnés avec précision temporelle et gestion des chevauchements (gauche/droite) */}
                      {dayLayout.map(({ event: evt, top, height, leftPercent, widthPercent }) => {
                        const theme = getSubjectTheme(evt.subjectCode);
                        const isTwoHours = height >= 120;
                        const hasHomework = evt.homeworkDue && evt.homeworkDue.length > 0;

                        return (
                          <div
                            key={evt.id}
                            onClick={() => setSelectedEventModal(evt)}
                            style={{
                              top: `${top}px`,
                              height: `${height}px`,
                              left: `calc(${leftPercent}% + 2px)`,
                              width: `calc(${widthPercent}% - 4px)`
                            }}
                            className={`absolute rounded-xl border p-2 cursor-pointer transition-all hover:z-30 hover:shadow-md hover:ring-2 hover:ring-indigo-400/50 flex flex-col justify-between overflow-hidden group bg-white ${
                              evt.status === 'in_progress' ? 'ring-2 ring-emerald-500 shadow-sm' : 'border-slate-200/80 shadow-xs'
                            }`}
                          >
                            <div>
                              <div className="flex items-center justify-between gap-1 mb-1">
                                <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded border leading-none ${theme.badgeClass}`}>
                                  {evt.subjectCode}
                                </span>
                                {evt.status === 'in_progress' && (
                                  <span className="flex items-center gap-1 text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1 py-0.2 rounded">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                  </span>
                                )}
                              </div>

                              <h4 className="font-bold text-[11px] text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1 leading-tight">
                                {evt.subject}
                              </h4>

                              <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-slate-500">
                                <span className="font-semibold text-slate-700 flex items-center gap-0.5">
                                  <Clock className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                                  {evt.startTime}-{evt.endTime}
                                </span>
                                {evt.room && (
                                  <span className="flex items-center gap-0.5 truncate">
                                    <MapPin className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                                    {evt.room}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Devoirs attachés sous le cours (sans bloc séparé) */}
                            {hasHomework && (
                              <div className="mt-1 pt-1 border-t border-slate-100 overflow-hidden">
                                {isTwoHours ? (
                                  <div className="space-y-1">
                                    {evt.homeworkDue!.slice(0, 2).map(hw => {
                                      const isUrgent = hw.priority === 'high';
                                      return (
                                        <div
                                          key={hw.id}
                                          className={`flex items-center gap-1 px-1 py-0.5 rounded text-[9px] truncate ${
                                            hw.isCompleted
                                              ? 'bg-slate-50 text-slate-400 line-through'
                                              : isUrgent
                                                ? 'bg-rose-50 text-rose-800 font-bold border border-rose-100'
                                                : 'bg-amber-50 text-amber-800 font-medium border border-amber-100'
                                          }`}
                                          title={hw.description || hw.title}
                                        >
                                          <span className={`w-1 h-1 rounded-full shrink-0 ${
                                            hw.isCompleted ? 'bg-slate-300' : isUrgent ? 'bg-rose-500' : 'bg-amber-500'
                                          }`} />
                                          <span className="truncate">{hw.title}</span>
                                        </div>
                                      );
                                    })}
                                    {evt.homeworkDue!.length > 2 && (
                                      <div className="text-[9px] text-slate-400 font-semibold pl-0.5">
                                        +{evt.homeworkDue!.length - 2} autre(s)
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1 px-1 py-0.2 rounded text-[9px] font-bold bg-amber-50 text-amber-800 border border-amber-200/50 truncate w-fit">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                                    <span className="truncate">{evt.homeworkDue!.length} devoir{evt.homeworkDue!.length > 1 ? 's' : ''}</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Day View (Tableau de temps proportionnel 1 jour) */
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-subtle overflow-hidden max-w-4xl mx-auto">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                {daysConfig.find(d => d.dayOfWeek === selectedDay)?.name} <span className="opacity-70 font-semibold">{daysConfig.find(d => d.dayOfWeek === selectedDay)?.dateNum}</span>
              </h3>
              <p className="text-xs text-slate-400 font-medium">
                {eventsByDay[selectedDay]?.length || 0} séances prévues
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[600px]">
              <div className="grid grid-cols-[60px_1fr] relative" style={{ height: `${totalGridHeight}px` }}>
                {/* Colonne des heures */}
                <div className="relative border-r border-slate-200/60 select-none bg-slate-50/40">
                  {hoursList.map((h, i) => {
                    if (i === hoursList.length - 1) return null;
                    return (
                      <div
                        key={h}
                        className="absolute right-2.5 text-[10px] font-bold text-slate-400 -translate-y-1/2"
                        style={{ top: `${i * HOUR_HEIGHT}px` }}
                      >
                        {String(h).padStart(2, '0')}:00
                      </div>
                    );
                  })}

                  {/* Badge heure courante dans l'axe horaire de la vue jour */}
                  {daysConfig.find(d => d.dayOfWeek === selectedDay)?.isToday && currentTimeTop !== null && (
                    <div
                      className="absolute right-1 z-30 -translate-y-1/2 px-1.5 py-0.5 rounded-md bg-rose-500 text-white text-[9px] font-black shadow-sm tracking-tight"
                      style={{ top: `${currentTimeTop}px` }}
                    >
                      {String(currentTime.getHours()).padStart(2, '0')}:{String(currentTime.getMinutes()).padStart(2, '0')}
                    </div>
                  )}
                </div>

                {/* Colonne du jour unique */}
                <div className={`relative ${daysConfig.find(d => d.dayOfWeek === selectedDay)?.isToday ? 'bg-indigo-50/15' : ''}`}>
                  {/* Lignes d'heures horizontales */}
                  {hoursList.map((h, i) => (
                    <div
                      key={h}
                      className="absolute left-0 right-0 border-t border-slate-100 pointer-events-none"
                      style={{ top: `${i * HOUR_HEIGHT}px` }}
                    />
                  ))}

                  {/* Lignes demi-heures */}
                  {hoursList.map((h, i) => {
                    if (i === hoursList.length - 1) return null;
                    return (
                      <div
                        key={`day-half-${h}`}
                        className="absolute left-0 right-0 border-t border-slate-50/90 border-dashed pointer-events-none"
                        style={{ top: `${i * HOUR_HEIGHT + HOUR_HEIGHT / 2}px` }}
                      />
                    );
                  })}

                  {/* Indicateur de l'heure courante si aujourd'hui */}
                  {daysConfig.find(d => d.dayOfWeek === selectedDay)?.isToday && currentTimeTop !== null && (
                    <div
                      className="absolute left-0 right-0 z-20 flex items-center pointer-events-none"
                      style={{ top: `${currentTimeTop}px` }}
                    >
                      <div className="w-2.5 h-2.5 rounded-full bg-rose-500 -ml-1.5 shadow-sm ring-2 ring-white" />
                      <div className="h-[2px] w-full bg-rose-500 shadow-sm" />
                    </div>
                  )}

                  {/* Cours positionnés (avec gestion gauche/droite si simultanés) */}
                  {(layoutByDay[selectedDay] || []).length > 0 ? (
                    (layoutByDay[selectedDay] || []).map(({ event: evt, top, height, leftPercent, widthPercent }) => {
                      const theme = getSubjectTheme(evt.subjectCode);
                      const hasHomework = evt.homeworkDue && evt.homeworkDue.length > 0;

                      return (
                        <div
                          key={evt.id}
                          onClick={() => setSelectedEventModal(evt)}
                          style={{
                            top: `${top}px`,
                            height: `${height}px`,
                            left: `calc(${leftPercent}% + 4px)`,
                            width: `calc(${widthPercent}% - 8px)`
                          }}
                          className={`absolute rounded-2xl border p-3.5 cursor-pointer transition-all hover:z-30 hover:shadow-lg hover:ring-2 hover:ring-indigo-400/50 flex flex-col justify-between overflow-hidden group bg-white ${
                            evt.status === 'in_progress' ? 'ring-2 ring-emerald-500 shadow-md' : 'border-slate-200/80 shadow-sm'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2 mb-1.5">
                              <div className="flex items-center gap-2">
                                <span className={`px-2.5 py-1 rounded-xl text-xs font-black border uppercase tracking-wider ${theme.badgeClass}`}>
                                  {evt.subjectCode}
                                </span>
                                <h4 className="font-extrabold text-sm text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                                  {evt.subject}
                                </h4>
                                {evt.status === 'in_progress' && (
                                  <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    En cours
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                                <button
                                  onClick={() => startDirectMessageWithTeacher(evt.teacher)}
                                  className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                                >
                                  Prof
                                </button>
                                <button
                                  onClick={() => setSelectedEventModal(evt)}
                                  className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-900 hover:bg-indigo-600 text-white transition-colors"
                                >
                                  Détails
                                </button>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                              <span className="font-bold text-slate-700 flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5 text-slate-400" />
                                {evt.startTime} - {evt.endTime}
                              </span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                {evt.room}
                              </span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <User className="w-3.5 h-3.5 text-slate-400" />
                                {evt.teacher}
                              </span>
                            </div>
                          </div>

                          {/* Devoirs attachés */}
                          {hasHomework && (
                            <div className="mt-2 pt-2 border-t border-slate-100 flex flex-wrap gap-2">
                              {evt.homeworkDue!.map((hw) => {
                                const isUrgent = hw.priority === 'high';
                                return (
                                  <div
                                    key={hw.id}
                                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs leading-none ${
                                      hw.isCompleted
                                        ? 'bg-slate-50 text-slate-400 line-through'
                                        : isUrgent
                                          ? 'bg-rose-50 text-rose-800 border border-rose-200 font-bold'
                                          : 'bg-amber-50 text-amber-800 border border-amber-200 font-semibold'
                                    }`}
                                  >
                                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                      hw.isCompleted ? 'bg-slate-300' : isUrgent ? 'bg-rose-500' : 'bg-amber-500'
                                    }`} />
                                    <span className="truncate">{hw.title}</span>
                                    {isUrgent && !hw.isCompleted && (
                                      <span className="text-[9px] uppercase tracking-wider font-extrabold text-rose-600 bg-rose-100 px-1 py-0.2 rounded">
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
                    <div className="flex items-center justify-center h-full text-slate-400 text-xs italic">
                      Aucun cours prévu pour ce jour
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
