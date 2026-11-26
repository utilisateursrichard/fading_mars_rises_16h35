import { useState, useMemo, useEffect } from 'react';
import { useSchool } from '../context/SchoolContext';
import { calculateHomeworkImportance } from '../utils/homeworkImportance';

export const parseMinutes = (timeStr: string): number => {
  if (!timeStr) return 0;
  const parts = timeStr.split(':');
  if (parts.length < 2) return 0;
  const h = parseInt(parts[0], 10) || 0;
  const m = parseInt(parts[1], 10) || 0;
  return h * 60 + m;
};

/**
 * Shared dashboard data and computed state consumed by all UI theme dashboards.
 */
export function useDashboardData() {
  const {
    student,
    todayEvents,
    homeworks,
    toggleHomework,
    overallStats,
    subjectReports,
    unreadMessagesTotal,
    setActiveTab,
    setSelectedEventModal,
    setIsNewHomeworkModalOpen,
    globalSearch,
    isDemoMode,
    isInsideSmartschoolPlatform,
    events,
  } = useSchool();

  const [homeworkFilter, setHomeworkFilter] = useState<'pending' | 'urgent' | 'all' | 'completed'>('pending');
  const [nowMinutes, setNowMinutes] = useState<number>(() => {
    const d = new Date();
    return d.getHours() * 60 + d.getMinutes();
  });

  useEffect(() => {
    const updateClock = () => {
      const d = new Date();
      setNowMinutes(d.getHours() * 60 + d.getMinutes());
    };
    const timer = window.setInterval(updateClock, 30000);
    return () => window.clearInterval(timer);
  }, []);

  const currentTimeLabel = useMemo(() => {
    const h = Math.floor(nowMinutes / 60)
      .toString()
      .padStart(2, '0');
    const m = (nowMinutes % 60).toString().padStart(2, '0');
    return `${h}:${m}`;
  }, [nowMinutes]);

  const greeting = useMemo(() => {
    const hour = Math.floor(nowMinutes / 60);
    if (hour < 12) return 'Bonjour';
    if (hour < 18) return 'Bon après-midi';
    return 'Bonsoir';
  }, [nowMinutes]);

  const todayFormatted = useMemo(() => {
    return new Intl.DateTimeFormat('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }).format(new Date());
  }, []);

  const todayDateStr = useMemo(() => {
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  }, []);

  const filteredHomeworks = useMemo(() => {
    const visibleHomeworks = homeworks.filter((hw) => {
      if (hw.dueDate && hw.dueDate < todayDateStr) return false;

      if (globalSearch) {
        const match =
          hw.title.toLowerCase().includes(globalSearch.toLowerCase()) ||
          hw.subject.toLowerCase().includes(globalSearch.toLowerCase());
        if (!match) return false;
      }
      if (homeworkFilter === 'pending') return !hw.isCompleted;
      if (homeworkFilter === 'completed') return hw.isCompleted;
      if (homeworkFilter === 'urgent') {
        return !hw.isCompleted && calculateHomeworkImportance(hw.dueDate, hw.description, hw.isCompleted) >= 5;
      }
      return true;
    });

    return visibleHomeworks
      .map((homework) => ({
        homework,
        importance: calculateHomeworkImportance(
          homework.dueDate,
          homework.description,
          homework.isCompleted
        ),
      }))
      .sort((first, second) => {
        return (
          second.importance - first.importance ||
          first.homework.dueDate.localeCompare(second.homework.dueDate)
        );
      });
  }, [homeworks, homeworkFilter, globalSearch, todayDateStr]);

  const sortedTodayEvents = useMemo(() => {
    return [...todayEvents].sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [todayEvents]);

  const dayProgressPct = useMemo(() => {
    const startMin =
      sortedTodayEvents.length > 0 ? parseMinutes(sortedTodayEvents[0].startTime) : 8 * 60;
    const endMin =
      sortedTodayEvents.length > 0
        ? parseMinutes(sortedTodayEvents[sortedTodayEvents.length - 1].endTime)
        : 17 * 60 + 30;
    const span = Math.max(1, endMin - startMin);
    return Math.round(Math.min(100, Math.max(0, ((nowMinutes - startMin) / span) * 100)));
  }, [sortedTodayEvents, nowMinutes]);

  const nextClassSpotlight = useMemo(() => {
    const currentJsDay = new Date().getDay();

    const inProgress = sortedTodayEvents.find((e) => {
      const s = parseMinutes(e.startTime);
      const end = parseMinutes(e.endTime);
      return e.status === 'in_progress' || (nowMinutes >= s && nowMinutes <= end);
    });
    if (inProgress) {
      return {
        event: inProgress,
        badgeText: '● En cours',
        badgeClass: 'text-emerald-600 bg-emerald-50 border-emerald-200/60',
        timeLabel: `En cours (jusqu'à ${inProgress.endTime})`,
        dayHeader: "Aujourd'hui",
        isLive: true,
      };
    }

    const upcomingToday = sortedTodayEvents.find((e) => parseMinutes(e.startTime) > nowMinutes);
    if (upcomingToday) {
      const diffMin = parseMinutes(upcomingToday.startTime) - nowMinutes;
      const countdown = diffMin < 60 ? `dans ${diffMin} min` : `à ${upcomingToday.startTime}`;
      return {
        event: upcomingToday,
        badgeText: "Aujourd'hui",
        badgeClass: 'text-indigo-600 bg-indigo-50 border-indigo-200/60',
        timeLabel: `${upcomingToday.startTime} (${countdown})`,
        dayHeader: "Aujourd'hui",
        isLive: false,
      };
    }

    const allEvents = events.length > 0 ? events : sortedTodayEvents;
    const dayNames: Record<number, string> = {
      1: 'Lundi',
      2: 'Mardi',
      3: 'Mercredi',
      4: 'Jeudi',
      5: 'Vendredi',
      6: 'Samedi',
      7: 'Dimanche',
    };

    for (let offset = 1; offset <= 7; offset++) {
      const nextJsDow = (currentJsDay + offset) % 7;
      const nextDow = nextJsDow === 0 ? 7 : nextJsDow;
      const dayEvts = allEvents
        .filter((e) => e.dayOfWeek === nextDow)
        .sort((a, b) => a.startTime.localeCompare(b.startTime));

      if (dayEvts.length > 0) {
        const nextEvt = dayEvts[0];
        const dayName = offset === 1 ? 'Demain' : dayNames[nextDow] || 'Prochain jour';
        return {
          event: nextEvt,
          badgeText: `Prochain cours • ${dayName}`,
          badgeClass: 'text-indigo-600 bg-indigo-50 border-indigo-200/60',
          timeLabel: `${dayName} à ${nextEvt.startTime}`,
          dayHeader: dayName,
          isLive: false,
        };
      }
    }

    return null;
  }, [sortedTodayEvents, events, nowMinutes]);

  const pendingHomeworksCount = useMemo(() => {
    return homeworks.filter((h) => !h.isCompleted && (!h.dueDate || h.dueDate >= todayDateStr)).length;
  }, [homeworks, todayDateStr]);

  const urgentHomeworksCount = useMemo(() => {
    return homeworks.filter(
      (h) =>
        (!h.dueDate || h.dueDate >= todayDateStr) &&
        calculateHomeworkImportance(h.dueDate, h.description, h.isCompleted) >= 5
    ).length;
  }, [homeworks, todayDateStr]);

  const completedHomeworksCount = useMemo(() => {
    return homeworks.filter((h) => h.isCompleted && (!h.dueDate || h.dueDate >= todayDateStr)).length;
  }, [homeworks, todayDateStr]);

  const overallAveragePct = useMemo(() => {
    if (!overallStats) return null;
    return overallStats.current > 20
      ? overallStats.current
      : Number(((overallStats.current / 20) * 100).toFixed(1));
  }, [overallStats]);

  return {
    student,
    greeting,
    todayFormatted,
    todayDateStr,
    nowMinutes,
    currentTimeLabel,
    dayProgressPct,
    filteredHomeworks,
    homeworkFilter,
    setHomeworkFilter,
    sortedTodayEvents,
    nextClassSpotlight,
    pendingHomeworksCount,
    urgentHomeworksCount,
    completedHomeworksCount,
    overallStats,
    overallAveragePct,
    subjectReports,
    unreadMessagesTotal,
    toggleHomework,
    setActiveTab,
    setSelectedEventModal,
    setIsNewHomeworkModalOpen,
    isDemoMode,
    isInsideSmartschoolPlatform,
    events,
  };
}
