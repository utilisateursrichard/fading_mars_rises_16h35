import React from 'react';
import {
  ArrowUpRight,
  Award,
  BookOpen,
  Bot,
  CalendarDays,
  Check,
  Clock,
  MapPin,
  MessageSquareText,
  Plus,
} from 'lucide-react';
import { useDashboardData, parseMinutes } from '../../../hooks/useDashboardData';
import { cleanStudentClass } from '../../../utils/student';
import { getSubjectTheme } from '../../../utils/theme';

function formatRelativeDue(dueDate: string, todayDateStr: string): string {
  if (!dueDate) return '';
  if (dueDate === todayDateStr) return "Aujourd'hui";
  const todayMs = new Date(todayDateStr + 'T00:00:00').getTime();
  const dueMs = new Date(dueDate + 'T00:00:00').getTime();
  const diffDays = Math.round((dueMs - todayMs) / 86400000);
  if (diffDays === 1) return 'Demain';
  if (diffDays > 1 && diffDays <= 7) return `Dans ${diffDays}j`;
  return new Date(dueDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

/**
 * BetterSchool Signature "Pulse" dashboard:
 * Horizontal proportional live day-timeline ribbon + mission-control homework queue +
 * dark-ink subject performance card + 2x2 quick launchpad.
 */
export const PulseDashboard: React.FC = () => {
  const {
    student,
    greeting,
    todayFormatted,
    todayDateStr,
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
  } = useDashboardData();

  const timelineStart =
    sortedTodayEvents.length > 0 ? parseMinutes(sortedTodayEvents[0].startTime) : 8 * 60;
  const timelineEnd =
    sortedTodayEvents.length > 0
      ? parseMinutes(sortedTodayEvents[sortedTodayEvents.length - 1].endTime)
      : 17 * 60 + 30;
  const timelineSpan = Math.max(60, timelineEnd - timelineStart);

  return (
    <div className="space-y-6 text-[#121318]">
      {!isDemoMode && events.length === 0 && !isInsideSmartschoolPlatform && (
        <div className="px-4 py-3 rounded-2xl bg-amber-50 ring-1 ring-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-xs font-medium text-amber-900">
            <strong>Mode Réel :</strong> Ouvrez Smartschool et cliquez sur le favori BetterSchool pour synchroniser vos cours.
          </p>
          <button
            onClick={() => setActiveTab('book')}
            className="px-3.5 py-1.5 rounded-full bg-[#121318] text-white text-xs font-semibold self-start sm:self-auto"
          >
            Voir le favori
          </button>
        </div>
      )}

      {/* Hero Greeting + Live Next Class Strip */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-indigo-600 capitalize">
            {todayFormatted}
            {cleanStudentClass(student?.studentClass)
              ? ` · ${cleanStudentClass(student?.studentClass)}`
              : ''}
          </p>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#121318] mt-0.5">
            {student?.firstName ? `${greeting}, ${student.firstName}` : greeting}
          </h1>
        </div>

        {nextClassSpotlight && (
          <button
            onClick={() => setSelectedEventModal(nextClassSpotlight.event)}
            className="group text-left px-4 py-2.5 rounded-2xl bg-white ring-1 ring-black/[0.07] hover:ring-indigo-500/40 shadow-xs transition-all flex items-center gap-3.5 max-w-md"
          >
            <span
              className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                nextClassSpotlight.isLive ? 'bg-emerald-500 animate-pulse' : 'bg-indigo-600'
              }`}
            />
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {nextClassSpotlight.badgeText}
              </p>
              <p className="text-xs font-bold text-[#121318] truncate group-hover:text-indigo-600 transition-colors">
                {nextClassSpotlight.event.subject} · {nextClassSpotlight.event.startTime}
              </p>
            </div>
            <span className="px-2 py-0.5 rounded-lg bg-slate-100 font-mono text-[11px] font-bold text-slate-700 shrink-0">
              {nextClassSpotlight.event.room}
            </span>
          </button>
        )}
      </div>

      {/* Interactive Live Day-Timeline Ribbon */}
      <section className="rounded-[24px] bg-white p-4 sm:p-5 ring-1 ring-black/[0.06] shadow-[0_8px_28px_-12px_rgba(18,19,24,0.08)]">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Fil du jour
            </span>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 font-mono text-[11px] font-semibold text-slate-700">
              {sortedTodayEvents.length} séance(s)
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="font-mono text-[11px] text-slate-500">
              Avancement {dayProgressPct}%
            </span>
            <button
              onClick={() => setActiveTab('agenda')}
              className="font-bold text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-0.5"
            >
              <span>Semaine</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {sortedTodayEvents.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-400 bg-[#F7F6F2] rounded-2xl">
            Aucun cours programmé aujourd&apos;hui — profitez-en pour avancer sur vos devoirs.
          </div>
        ) : (
          <div className="space-y-3">
            {/* Proportional Horizontal Bar with Live Time Needle */}
            <div className="relative h-12 rounded-2xl bg-[#F3F2ED] overflow-hidden p-1">
              {sortedTodayEvents.map((evt) => {
                const start = parseMinutes(evt.startTime);
                const end = parseMinutes(evt.endTime);
                const leftPct = Math.max(0, ((start - timelineStart) / timelineSpan) * 100);
                const widthPct = Math.max(6, ((end - start) / timelineSpan) * 100);
                const theme = getSubjectTheme(evt.subjectCode);
                return (
                  <button
                    key={evt.id}
                    onClick={() => setSelectedEventModal(evt)}
                    style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                    title={`${evt.subject} (${evt.startTime}–${evt.endTime}) · ${evt.room}`}
                    className={`absolute top-1 bottom-1 rounded-xl border px-2 flex items-center justify-center overflow-hidden transition-transform hover:scale-[1.02] hover:z-10 ${theme.badgeClass}`}
                  >
                    <span className="text-[11px] font-extrabold truncate">{evt.subjectCode}</span>
                  </button>
                );
              })}

              {/* Live Time Needle */}
              <div
                style={{ left: `${dayProgressPct}%` }}
                className="absolute top-0 bottom-0 w-0.5 bg-rose-500 z-20 pointer-events-none"
              >
                <span className="absolute -top-0.5 -left-1 w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-white" />
              </div>
            </div>

            {/* Scrollable Interactive Class Chips */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-0.5">
              {sortedTodayEvents.map((evt) => {
                const theme = getSubjectTheme(evt.subjectCode);
                return (
                  <button
                    key={evt.id}
                    onClick={() => setSelectedEventModal(evt)}
                    className="shrink-0 px-3 py-2 rounded-xl bg-[#F7F6F2] hover:bg-slate-100 transition-colors flex items-center gap-2.5 text-left"
                  >
                    <span className={`w-2 h-2 rounded-full ${theme.dotClass || 'bg-indigo-500'}`} />
                    <div>
                      <p className="text-xs font-bold text-[#121318] leading-tight">
                        {evt.subject}
                      </p>
                      <p className="text-[10px] font-mono text-slate-500 mt-0.5 inline-flex items-center gap-1.5">
                        <span>
                          {evt.startTime}–{evt.endTime}
                        </span>
                        <span>·</span>
                        <span className="inline-flex items-center gap-0.5">
                          <MapPin className="w-2.5 h-2.5" />
                          {evt.room}
                        </span>
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* 12-Col Student Command Desk */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left 7 Cols: Mission-Control Homework Queue */}
        <section className="lg:col-span-7 rounded-[24px] bg-white p-5 ring-1 ring-black/[0.06] shadow-[0_8px_28px_-12px_rgba(18,19,24,0.08)]">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold text-[#121318]">File des devoirs</h2>
              <button
                onClick={() => setIsNewHomeworkModalOpen(true)}
                className="w-6 h-6 rounded-full bg-slate-100 hover:bg-[#121318] hover:text-white text-slate-700 flex items-center justify-center transition-colors"
                title="Ajouter un devoir"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex flex-wrap gap-1 bg-[#F3F2ED] p-1 rounded-full text-[11px] font-bold">
              {(
                [
                  ['pending', `À faire (${pendingHomeworksCount})`],
                  ['urgent', `Urgents (${urgentHomeworksCount})`],
                  ['all', 'Tous'],
                  ['completed', `Faits (${completedHomeworksCount})`],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setHomeworkFilter(key)}
                  className={`px-2.5 py-1 rounded-full transition-colors ${
                    homeworkFilter === key
                      ? 'bg-[#121318] text-white shadow-xs'
                      : 'text-slate-600 hover:text-[#121318]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2 max-h-[430px] overflow-y-auto pr-1">
            {filteredHomeworks.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                Aucun devoir dans cette vue ({currentTimeLabel}).
              </div>
            ) : (
              filteredHomeworks.map(({ homework: hw, importance }) => {
                const isUrgent = importance >= 5;
                return (
                  <div
                    key={hw.id}
                    className={`relative overflow-hidden p-3.5 rounded-2xl bg-[#F8F7F4] hover:bg-[#F2F0EA] transition-all flex items-start gap-3 ${
                      hw.isCompleted ? 'opacity-50' : ''
                    }`}
                  >
                    {/* Left Urgency Heat-Strip */}
                    <span
                      className={`absolute left-0 top-2 bottom-2 w-1 rounded-r-full ${
                        hw.isCompleted
                          ? 'bg-emerald-500'
                          : isUrgent
                            ? 'bg-rose-500'
                            : 'bg-indigo-400'
                      }`}
                    />

                    <button
                      onClick={() => toggleHomework(hw.id)}
                      className={`ml-1 mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                        hw.isCompleted
                          ? 'bg-emerald-500 border-emerald-500 text-white'
                          : isUrgent
                            ? 'border-rose-500 hover:bg-rose-50'
                            : 'border-slate-300 hover:border-[#121318]'
                      }`}
                    >
                      {hw.isCompleted && <Check className="w-3 h-3" />}
                    </button>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded-md bg-white text-[10px] font-extrabold uppercase text-slate-700 ring-1 ring-black/[0.05]">
                            {hw.subjectCode}
                          </span>
                          {hw.estimatedTimeMinutes > 0 && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-mono text-slate-500">
                              <Clock className="w-2.5 h-2.5" />
                              {hw.estimatedTimeMinutes}m
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span
                            className={`text-[11px] font-bold ${
                              isUrgent && !hw.isCompleted ? 'text-rose-600' : 'text-slate-500'
                            }`}
                          >
                            {formatRelativeDue(hw.dueDate, todayDateStr)}
                          </span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                              importance >= 7
                                ? 'bg-rose-600 text-white'
                                : isUrgent
                                  ? 'bg-rose-100 text-rose-700'
                                  : 'bg-slate-200/70 text-slate-600'
                            }`}
                          >
                            {importance}/10
                          </span>
                        </div>
                      </div>

                      <p
                        className={`text-sm font-bold mt-1 ${
                          hw.isCompleted ? 'line-through text-slate-400' : 'text-[#121318]'
                        }`}
                      >
                        {hw.title}
                      </p>
                      {hw.description && (
                        <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                          {hw.description}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Right 5 Cols: Dark Ink Performance Card + 2x2 Quick Launchpad */}
        <div className="lg:col-span-5 space-y-4">
          <button
            onClick={() => setActiveTab('results')}
            className="w-full text-left rounded-[24px] bg-[#121318] hover:bg-[#181A22] text-white p-5 shadow-lg transition-colors group"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
                  Performance globale
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-4xl font-black tracking-tight tabular-nums">
                    {overallAveragePct !== null ? `${overallAveragePct}%` : '--'}
                  </span>
                  {overallStats?.totalWeeklyHours ? (
                    <span className="text-xs text-slate-400">
                      · {overallStats.totalWeeklyHours}h/sem
                    </span>
                  ) : null}
                </div>
              </div>
              <span className="w-8 h-8 rounded-full bg-white/10 group-hover:bg-amber-400 group-hover:text-slate-950 flex items-center justify-center transition-colors">
                <Award className="w-4 h-4" />
              </span>
            </div>

            {/* Subject Averages Mini Bar-Chart */}
            {subjectReports.length > 0 ? (
              <div className="mt-4 space-y-2 pt-3 border-t border-white/10">
                {subjectReports
                  .filter((r) => r.studentAverage !== null)
                  .slice(0, 4)
                  .map((rep) => {
                    const avg = rep.studentAverage ?? 0;
                    const pct = avg > 20 ? avg : (avg / 20) * 100;
                    return (
                      <div key={rep.subjectCode + rep.subject} className="space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-300 truncate max-w-[170px]">
                            {rep.subject}
                          </span>
                          <span className="font-mono font-bold text-amber-300">
                            {pct.toFixed(0)}%
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-amber-400 to-emerald-400"
                            style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <p className="text-xs text-slate-400 mt-3 pt-3 border-t border-white/10">
                Ouvrir les résultats et le simulateur →
              </p>
            )}
          </button>

          {/* 2x2 Quick Launchpad */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setActiveTab('messages')}
              className="p-4 rounded-2xl bg-white ring-1 ring-black/[0.06] hover:ring-indigo-500/40 text-left transition-all"
            >
              <div className="flex items-center justify-between">
                <MessageSquareText className="w-4 h-4 text-indigo-600" />
                {unreadMessagesTotal > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-indigo-600 text-white text-[10px] font-bold">
                    {unreadMessagesTotal}
                  </span>
                )}
              </div>
              <p className="text-xs font-bold text-[#121318] mt-2.5">Messagerie</p>
              <p className="text-[11px] text-slate-500">
                {unreadMessagesTotal > 0 ? `${unreadMessagesTotal} non lu(s)` : 'Boîte à jour'}
              </p>
            </button>

            <button
              onClick={() => setActiveTab('agenda')}
              className="p-4 rounded-2xl bg-white ring-1 ring-black/[0.06] hover:ring-indigo-500/40 text-left transition-all"
            >
              <CalendarDays className="w-4 h-4 text-emerald-600" />
              <p className="text-xs font-bold text-[#121318] mt-2.5">Agenda</p>
              <p className="text-[11px] text-slate-500">{sortedTodayEvents.length} cours auj.</p>
            </button>

            <button
              onClick={() => setActiveTab('courses')}
              className="p-4 rounded-2xl bg-white ring-1 ring-black/[0.06] hover:ring-indigo-500/40 text-left transition-all"
            >
              <BookOpen className="w-4 h-4 text-amber-600" />
              <p className="text-xs font-bold text-[#121318] mt-2.5">Espace Cours</p>
              <p className="text-[11px] text-slate-500">Ressources & dépôts</p>
            </button>

            <button
              onClick={() => setActiveTab('tutor')}
              className="p-4 rounded-2xl bg-white ring-1 ring-black/[0.06] hover:ring-indigo-500/40 text-left transition-all"
            >
              <Bot className="w-4 h-4 text-violet-600" />
              <p className="text-xs font-bold text-[#121318] mt-2.5">Tuteur IA</p>
              <p className="text-[11px] text-slate-500">Assistant révisions</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
