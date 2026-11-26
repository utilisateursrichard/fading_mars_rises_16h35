import React from 'react';
import { Check, ChevronRight, Clock, MapPin, Plus } from 'lucide-react';
import { useDashboardData } from '../../../hooks/useDashboardData';
import { cleanStudentClass } from '../../../utils/student';

/**
 * Dark studio command cockpit inspired by Linear / Raycast.
 */
export const ObsidianDashboard: React.FC = () => {
  const {
    student,
    greeting,
    todayFormatted,
    filteredHomeworks,
    homeworkFilter,
    setHomeworkFilter,
    sortedTodayEvents,
    nextClassSpotlight,
    pendingHomeworksCount,
    urgentHomeworksCount,
    overallAveragePct,
    toggleHomework,
    setActiveTab,
    setSelectedEventModal,
    setIsNewHomeworkModalOpen,
    isDemoMode,
    isInsideSmartschoolPlatform,
    events,
  } = useDashboardData();

  return (
    <div className="space-y-5 text-slate-100">
      {!isDemoMode && events.length === 0 && !isInsideSmartschoolPlatform && (
        <div className="px-4 py-3 rounded-lg border border-amber-500/30 bg-amber-500/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-xs text-amber-200">
            <strong>Mode Réel :</strong> Aucune donnée locale. Synchronisez depuis Smartschool via le favori.
          </p>
          <button
            onClick={() => setActiveTab('book')}
            className="px-3 py-1 rounded-md bg-amber-400/20 hover:bg-amber-400/30 text-amber-200 text-xs font-medium self-start sm:self-auto"
          >
            Ouvrir le favori
          </button>
        </div>
      )}

      {/* Cockpit Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-white">
            {student?.firstName ? `${greeting}, ${student.firstName}` : greeting}
          </h1>
          <p className="text-xs text-slate-400 mt-0.5 capitalize">
            {todayFormatted}
            {cleanStudentClass(student?.studentClass) ? (
              <span className="text-sky-400 font-medium">
                {' '}
                · {cleanStudentClass(student?.studentClass)}
              </span>
            ) : null}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('agenda')}
            className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/[0.03] hover:bg-white/[0.07] text-xs font-medium text-slate-200 transition-colors"
          >
            Agenda
          </button>
          <button
            onClick={() => setIsNewHomeworkModalOpen(true)}
            className="px-3 py-1.5 rounded-lg bg-sky-400 hover:bg-sky-300 text-slate-950 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nouveau devoir</span>
          </button>
        </div>
      </div>

      {/* Live Spotlight Strip */}
      {nextClassSpotlight ? (
        <button
          onClick={() => setSelectedEventModal(nextClassSpotlight.event)}
          className="w-full text-left group rounded-xl border border-white/[0.09] bg-[#161923] hover:border-sky-400/40 px-4 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <span
              className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                nextClassSpotlight.isLive
                  ? 'bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.7)]'
                  : 'bg-sky-400 shadow-[0_0_12px_rgba(56,189,248,0.6)]'
              }`}
            />
            <span className="font-mono text-sm font-semibold text-white shrink-0">
              {nextClassSpotlight.event.startTime}
            </span>
            <span className="px-2 py-0.5 rounded bg-white/[0.06] font-mono text-[10px] text-sky-300 shrink-0">
              {nextClassSpotlight.event.subjectCode}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium text-white group-hover:text-sky-300 transition-colors truncate">
                {nextClassSpotlight.event.subject}
              </p>
              <p className="text-xs text-slate-400 flex items-center gap-2 truncate">
                <span className="inline-flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {nextClassSpotlight.timeLabel}
                </span>
                <span>·</span>
                <span className="inline-flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {nextClassSpotlight.event.room}
                </span>
                <span>·</span>
                <span>{nextClassSpotlight.event.teacher}</span>
              </p>
            </div>
          </div>

          <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-sky-400 shrink-0 self-end sm:self-center" />
        </button>
      ) : (
        <div className="rounded-xl border border-white/[0.08] bg-[#161923] px-4 py-3 text-xs text-slate-400">
          Aucun autre cours programmé pour le moment.
        </div>
      )}

      {/* Inline Telemetry Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          onClick={() => setActiveTab('results')}
          className="text-left rounded-xl border border-white/[0.08] bg-[#151822] hover:border-white/20 p-4 transition-colors"
        >
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Moyenne générale</span>
            <span className="font-mono text-emerald-400">
              {overallAveragePct !== null ? `${overallAveragePct}%` : '--'}
            </span>
          </div>
          <div className="mt-3 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-sky-400 to-emerald-400"
              style={{ width: `${Math.min(100, Math.max(0, overallAveragePct ?? 0))}%` }}
            />
          </div>
        </button>

        <button
          onClick={() => setHomeworkFilter('pending')}
          className="text-left rounded-xl border border-white/[0.08] bg-[#151822] hover:border-white/20 p-4 transition-colors flex items-center justify-between"
        >
          <div>
            <span className="text-xs text-slate-400 block">Devoirs en attente</span>
            <span className="text-xl font-semibold text-white font-mono mt-0.5 block">
              {pendingHomeworksCount}
            </span>
          </div>
          {urgentHomeworksCount > 0 && (
            <span className="px-2 py-0.5 rounded bg-rose-500/15 text-rose-300 border border-rose-500/25 font-mono text-[11px]">
              {urgentHomeworksCount} urgent(s)
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('agenda')}
          className="text-left rounded-xl border border-white/[0.08] bg-[#151822] hover:border-white/20 p-4 transition-colors flex items-center justify-between"
        >
          <div>
            <span className="text-xs text-slate-400 block">Séances du jour</span>
            <span className="text-xl font-semibold text-white font-mono mt-0.5 block">
              {sortedTodayEvents.length}
            </span>
          </div>
          <span className="font-mono text-xs text-slate-400">
            Fin {sortedTodayEvents[sortedTodayEvents.length - 1]?.endTime || '--:--'}
          </span>
        </button>
      </div>

      {/* Split Workspace: Vertical Timeline Rail + Linear Issue List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left 5 Cols: Timeline Rail */}
        <section className="lg:col-span-5 rounded-xl border border-white/[0.08] bg-[#151822] p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Chronologie du jour
            </h2>
            <button
              onClick={() => setActiveTab('agenda')}
              className="text-xs text-sky-400 hover:text-sky-300"
            >
              Semaine →
            </button>
          </div>

          {sortedTodayEvents.length === 0 ? (
            <p className="py-8 text-center text-xs text-slate-500">Aucun cours aujourd&apos;hui.</p>
          ) : (
            <div className="relative pl-5 space-y-3 before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-px before:bg-white/10">
              {sortedTodayEvents.map((evt) => (
                <button
                  key={evt.id}
                  onClick={() => setSelectedEventModal(evt)}
                  className="relative w-full text-left group rounded-lg p-2.5 hover:bg-white/[0.04] transition-colors"
                >
                  <span className="absolute -left-[18px] top-4 w-2 h-2 rounded-full bg-slate-600 group-hover:bg-sky-400 ring-4 ring-[#151822] transition-colors" />
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[11px] text-sky-400">
                      {evt.startTime} – {evt.endTime}
                    </span>
                    <span className="font-mono text-[10px] text-slate-400 px-1.5 py-0.5 rounded bg-white/[0.05]">
                      {evt.room}
                    </span>
                  </div>
                  <p className="text-xs font-medium text-slate-100 group-hover:text-white mt-0.5 truncate">
                    {evt.subject}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate">{evt.teacher}</p>
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Right 7 Cols: Linear Issue-Style Homework Queue */}
        <section className="lg:col-span-7 rounded-xl border border-white/[0.08] bg-[#151822] overflow-hidden">
          <div className="px-4 py-3 border-b border-white/[0.07] flex items-center justify-between gap-2">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Tâches & Devoirs
            </h2>

            <div className="flex gap-1 bg-white/[0.04] p-0.5 rounded-lg text-[11px]">
              {(
                [
                  ['pending', 'À faire'],
                  ['all', 'Tous'],
                  ['completed', 'Faits'],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setHomeworkFilter(key)}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    homeworkFilter === key
                      ? 'bg-white/15 text-white font-medium'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="divide-y divide-white/[0.06] max-h-[440px] overflow-y-auto">
            {filteredHomeworks.length === 0 ? (
              <p className="py-10 text-center text-xs text-slate-500">
                Aucun devoir dans cette vue.
              </p>
            ) : (
              filteredHomeworks.map(({ homework: hw, importance }) => {
                const isUrgent = importance >= 5;
                return (
                  <div
                    key={hw.id}
                    className={`px-4 py-3 flex items-center gap-3 hover:bg-white/[0.025] transition-colors ${
                      hw.isCompleted ? 'opacity-45' : ''
                    }`}
                  >
                    <button
                      onClick={() => toggleHomework(hw.id)}
                      className={`w-4 h-4 rounded flex items-center justify-center border shrink-0 transition-colors ${
                        hw.isCompleted
                          ? 'bg-emerald-500 border-emerald-500 text-slate-950'
                          : isUrgent
                            ? 'border-rose-400/70 hover:border-rose-400'
                            : 'border-slate-600 hover:border-sky-400'
                      }`}
                    >
                      {hw.isCompleted && <Check className="w-3 h-3" />}
                    </button>

                    <span className="font-mono text-[10px] text-slate-400 w-14 shrink-0 truncate">
                      {hw.subjectCode}
                    </span>

                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-xs font-medium truncate ${
                          hw.isCompleted ? 'line-through text-slate-500' : 'text-slate-100'
                        }`}
                      >
                        {hw.title}
                      </p>
                      {hw.description && (
                        <p className="text-[11px] text-slate-500 truncate">{hw.description}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`px-1.5 py-0.5 rounded font-mono text-[10px] ${
                          isUrgent && !hw.isCompleted
                            ? 'bg-rose-500/15 text-rose-300'
                            : 'bg-white/[0.05] text-slate-400'
                        }`}
                      >
                        {importance}/10
                      </span>
                      <span className="font-mono text-[11px] text-slate-500">
                        {new Date(hw.dueDate).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
