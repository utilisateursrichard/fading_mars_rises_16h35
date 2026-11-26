import React from 'react';
import {
  ArrowUpRight,
  Award,
  BookOpen,
  Bot,
  CalendarDays,
  Check,
  MessageSquareText,
  Plus,
} from 'lucide-react';
import { useDashboardData } from '../../../hooks/useDashboardData';
import { cleanStudentClass } from '../../../utils/student';

/**
 * BetterSchool Signature "Nova" dark dashboard:
 * Warm amber & emerald accents, live day-progress bar, interactive schedule tiles,
 * tactile homework deck, and per-subject performance bars.
 */
export const NovaDashboard: React.FC = () => {
  const {
    student,
    greeting,
    todayFormatted,
    dayProgressPct,
    filteredHomeworks,
    homeworkFilter,
    setHomeworkFilter,
    sortedTodayEvents,
    pendingHomeworksCount,
    urgentHomeworksCount,
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

  return (
    <div className="space-y-6 text-slate-100">
      {!isDemoMode && events.length === 0 && !isInsideSmartschoolPlatform && (
        <div className="px-4 py-3 rounded-2xl bg-amber-500/10 border border-amber-400/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-xs text-amber-200">
            <strong>Mode Réel :</strong> Lancez le favori BetterSchool depuis Smartschool pour importer vos cours.
          </p>
          <button
            onClick={() => setActiveTab('book')}
            className="px-3.5 py-1.5 rounded-full bg-amber-400 text-slate-950 text-xs font-bold self-start sm:self-auto"
          >
            Ouvrir le favori
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-amber-400 capitalize">
            {todayFormatted}
            {cleanStudentClass(student?.studentClass)
              ? ` · ${cleanStudentClass(student?.studentClass)}`
              : ''}
          </p>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mt-0.5">
            {student?.firstName ? `${greeting}, ${student.firstName}` : greeting}
          </h1>
        </div>

        <button
          onClick={() => setIsNewHomeworkModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold transition-colors self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Nouveau devoir</span>
        </button>
      </div>

      {/* Asymmetric Dark Tactile Bento Deck */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left 8 Cols: Live Day Progress + Interactive Class Cards + Tactile Homework Deck */}
        <div className="lg:col-span-8 space-y-5">
          {/* Live Day Progress & Schedule Strip */}
          <section className="rounded-3xl bg-[#131620] border border-white/[0.08] p-5">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2.5">
                <h2 className="text-sm font-bold text-white">Programme du jour</h2>
                <span className="px-2 py-0.5 rounded-full bg-white/[0.06] font-mono text-[10px] text-amber-300">
                  {dayProgressPct}% écoulé
                </span>
              </div>
              <button
                onClick={() => setActiveTab('agenda')}
                className="text-xs font-semibold text-amber-400 hover:text-amber-300 inline-flex items-center gap-0.5"
              >
                <span>Semaine</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden mb-4">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-400 via-orange-400 to-emerald-400"
                style={{ width: `${dayProgressPct}%` }}
              />
            </div>

            {sortedTodayEvents.length === 0 ? (
              <p className="py-6 text-center text-xs text-slate-500">
                Aucun cours programmé aujourd&apos;hui.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {sortedTodayEvents.map((evt) => (
                  <button
                    key={evt.id}
                    onClick={() => setSelectedEventModal(evt)}
                    className="text-left p-3.5 rounded-2xl bg-[#1A1E2B] hover:bg-[#222738] border border-white/[0.06] hover:border-amber-400/40 transition-all flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <span className="font-mono text-[10px] font-bold text-emerald-400">
                        {evt.startTime}–{evt.endTime}
                      </span>
                      <p className="text-xs font-bold text-white truncate mt-0.5">
                        {evt.subject}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate">
                        {evt.room} · {evt.teacher}
                      </p>
                    </div>
                    <span className="px-2 py-0.5 rounded-lg bg-white/[0.06] font-mono text-[10px] font-bold text-amber-300 shrink-0">
                      {evt.subjectCode}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </section>

          {/* Tactile Homework Focus Deck */}
          <section className="rounded-3xl bg-[#131620] border border-white/[0.08] p-5">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white">Devoirs à traiter</h2>
                <span className="px-2 py-0.5 rounded-full bg-amber-400/15 text-amber-300 font-mono text-[10px] font-bold">
                  {pendingHomeworksCount}
                </span>
              </div>

              <div className="flex gap-1 bg-white/[0.04] p-0.5 rounded-full text-[11px]">
                {(
                  [
                    ['pending', 'À faire'],
                    ['urgent', `Urgents (${urgentHomeworksCount})`],
                    ['all', 'Tous'],
                    ['completed', 'Faits'],
                  ] as const
                ).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setHomeworkFilter(key)}
                    className={`px-2.5 py-1 rounded-full transition-colors ${
                      homeworkFilter === key
                        ? 'bg-white text-slate-950 font-semibold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2 max-h-[390px] overflow-y-auto pr-1">
              {filteredHomeworks.length === 0 ? (
                <p className="py-10 text-center text-xs text-slate-500">Aucun devoir ici.</p>
              ) : (
                filteredHomeworks.map(({ homework: hw, importance }) => {
                  const isUrgent = importance >= 5;
                  return (
                    <div
                      key={hw.id}
                      className={`p-3.5 rounded-2xl bg-[#191D29] border border-white/[0.06] flex items-start gap-3 ${
                        hw.isCompleted ? 'opacity-45' : ''
                      }`}
                    >
                      <button
                        onClick={() => toggleHomework(hw.id)}
                        className={`mt-0.5 w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                          hw.isCompleted
                            ? 'bg-emerald-400 border-emerald-400 text-slate-950'
                            : isUrgent
                              ? 'border-rose-400 hover:bg-rose-400/15'
                              : 'border-slate-500 hover:border-amber-400'
                        }`}
                      >
                        {hw.isCompleted && <Check className="w-3 h-3" />}
                      </button>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-[10px] font-bold uppercase text-amber-300">
                            {hw.subjectCode}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              isUrgent && !hw.isCompleted
                                ? 'bg-rose-500/20 text-rose-300'
                                : 'bg-white/[0.06] text-slate-400'
                            }`}
                          >
                            {new Date(hw.dueDate).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'short',
                            })}{' '}
                            · {importance}/10
                          </span>
                        </div>
                        <p
                          className={`text-xs font-semibold mt-1 ${
                            hw.isCompleted ? 'line-through text-slate-500' : 'text-white'
                          }`}
                        >
                          {hw.title}
                        </p>
                        {hw.description && (
                          <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
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
        </div>

        {/* Right 4 Cols: Luminous Academic Scorecard + 2x2 Compact Launchpad */}
        <div className="lg:col-span-4 space-y-4">
          <button
            onClick={() => setActiveTab('results')}
            className="w-full text-left rounded-3xl bg-gradient-to-br from-[#191D2A] to-[#12151F] border border-white/10 hover:border-amber-400/40 p-5 transition-colors group"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
                  Moyenne générale
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-4xl font-black text-white tabular-nums">
                    {overallAveragePct !== null ? `${overallAveragePct}%` : '--'}
                  </span>
                  {overallStats?.totalWeeklyHours ? (
                    <span className="text-xs text-slate-400">
                      · {overallStats.totalWeeklyHours}h
                    </span>
                  ) : null}
                </div>
              </div>
              <Award className="w-5 h-5 text-amber-400" />
            </div>

            {subjectReports.length > 0 ? (
              <div className="mt-4 pt-3 border-t border-white/[0.08] space-y-2.5">
                {subjectReports
                  .filter((r) => r.studentAverage !== null)
                  .slice(0, 4)
                  .map((rep) => {
                    const avg = rep.studentAverage ?? 0;
                    const pct = avg > 20 ? avg : (avg / 20) * 100;
                    return (
                      <div key={rep.subjectCode + rep.subject} className="space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-300 truncate max-w-[160px]">
                            {rep.subject}
                          </span>
                          <span className="font-mono font-bold text-emerald-400">
                            {pct.toFixed(0)}%
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-white/[0.08] overflow-hidden">
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
              <p className="text-xs text-slate-400 mt-3 pt-3 border-t border-white/[0.08]">
                Ouvrir les notes & simulateur →
              </p>
            )}
          </button>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setActiveTab('messages')}
              className="p-4 rounded-2xl bg-[#131620] border border-white/[0.08] hover:border-amber-400/40 text-left transition-colors"
            >
              <div className="flex items-center justify-between">
                <MessageSquareText className="w-4 h-4 text-amber-400" />
                {unreadMessagesTotal > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-bold">
                    {unreadMessagesTotal}
                  </span>
                )}
              </div>
              <p className="text-xs font-bold text-white mt-2.5">Messagerie</p>
              <p className="text-[11px] text-slate-400">
                {unreadMessagesTotal > 0 ? `${unreadMessagesTotal} non lu(s)` : 'À jour'}
              </p>
            </button>

            <button
              onClick={() => setActiveTab('agenda')}
              className="p-4 rounded-2xl bg-[#131620] border border-white/[0.08] hover:border-emerald-400/40 text-left transition-colors"
            >
              <CalendarDays className="w-4 h-4 text-emerald-400" />
              <p className="text-xs font-bold text-white mt-2.5">Agenda</p>
              <p className="text-[11px] text-slate-400">{sortedTodayEvents.length} cours auj.</p>
            </button>

            <button
              onClick={() => setActiveTab('courses')}
              className="p-4 rounded-2xl bg-[#131620] border border-white/[0.08] hover:border-sky-400/40 text-left transition-colors"
            >
              <BookOpen className="w-4 h-4 text-sky-400" />
              <p className="text-xs font-bold text-white mt-2.5">Cours</p>
              <p className="text-[11px] text-slate-400">Supports & dépôts</p>
            </button>

            <button
              onClick={() => setActiveTab('tutor')}
              className="p-4 rounded-2xl bg-[#131620] border border-white/[0.08] hover:border-violet-400/40 text-left transition-colors"
            >
              <Bot className="w-4 h-4 text-violet-400" />
              <p className="text-xs font-bold text-white mt-2.5">Tuteur IA</p>
              <p className="text-[11px] text-slate-400">Aide aux devoirs</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
