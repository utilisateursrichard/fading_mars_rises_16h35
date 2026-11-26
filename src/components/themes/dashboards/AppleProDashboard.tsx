import React from 'react';
import { Check, ChevronRight, Flag, Plus } from 'lucide-react';
import { useDashboardData } from '../../../hooks/useDashboardData';
import { cleanStudentClass } from '../../../utils/student';

/**
 * Authentic macOS / iPadOS Pro dashboard with Apple Widgets, SVG Activity Ring,
 * and Inset Grouped Lists.
 */
export const AppleProDashboard: React.FC = () => {
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

  const now = new Date();
  const monthShort = new Intl.DateTimeFormat('fr-FR', { month: 'short' })
    .format(now)
    .toUpperCase();
  const dayNum = now.getDate();

  const ringRadius = 32;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringProgress = overallAveragePct !== null ? Math.min(100, Math.max(0, overallAveragePct)) : 0;
  const ringOffset = ringCircumference - (ringProgress / 100) * ringCircumference;

  return (
    <div className="space-y-6 text-[#1D1D1F]">
      {!isDemoMode && events.length === 0 && !isInsideSmartschoolPlatform && (
        <div className="px-4 py-3 rounded-2xl bg-white shadow-xs border border-black/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-xs text-[#3A3A3C]">
            <strong className="text-[#007AFF]">Mode Réel :</strong> Synchronisez vos cours depuis Smartschool avec le favori BetterSchool.
          </p>
          <button
            onClick={() => setActiveTab('book')}
            className="px-3 py-1.5 rounded-lg bg-[#007AFF] text-white text-xs font-medium self-start sm:self-auto"
          >
            Voir le favori
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1D1D1F]">
            {student?.firstName ? `${greeting}, ${student.firstName}` : greeting}
          </h1>
          <p className="text-xs text-[#6E6E73] capitalize mt-0.5">
            {todayFormatted}
            {cleanStudentClass(student?.studentClass)
              ? ` · ${cleanStudentClass(student?.studentClass)}`
              : ''}
          </p>
        </div>

        <button
          onClick={() => setIsNewHomeworkModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#007AFF] hover:bg-[#0066D6] text-white text-xs font-medium shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Nouveau rappel</span>
        </button>
      </div>

      {/* Apple Widget Row */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Widget 1: Apple Calendar + Up Next */}
        <button
          onClick={() => nextClassSpotlight && setSelectedEventModal(nextClassSpotlight.event)}
          className="md:col-span-7 text-left rounded-[20px] bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.05)] border border-black/[0.05] hover:shadow-[0_6px_20px_rgba(0,0,0,0.08)] transition-all flex items-center gap-5 group"
        >
          {/* Apple Calendar Mini Icon Card */}
          <div className="w-16 h-16 rounded-2xl overflow-hidden border border-black/[0.08] shadow-xs shrink-0 flex flex-col">
            <div className="bg-[#FF3B30] text-white text-[10px] font-bold text-center py-0.5 tracking-wider">
              {monthShort}
            </div>
            <div className="flex-1 bg-white flex items-center justify-center text-2xl font-bold text-[#1D1D1F]">
              {dayNum}
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold text-[#007AFF]">
              {nextClassSpotlight ? nextClassSpotlight.badgeText : 'Emploi du temps'}
            </p>
            {nextClassSpotlight ? (
              <>
                <h2 className="text-lg font-bold text-[#1D1D1F] truncate mt-0.5">
                  {nextClassSpotlight.event.subject}
                </h2>
                <p className="text-xs text-[#6E6E73] mt-0.5 truncate">
                  {nextClassSpotlight.timeLabel} · {nextClassSpotlight.event.room} ·{' '}
                  {nextClassSpotlight.event.teacher}
                </p>
              </>
            ) : (
              <p className="text-sm font-medium text-[#6E6E73] mt-0.5">
                Plus de cours aujourd&apos;hui
              </p>
            )}
          </div>

          <ChevronRight className="w-4 h-4 text-[#C7C7CC] group-hover:text-[#007AFF] shrink-0" />
        </button>

        {/* Widget 2: Academic Progress Ring + Summary */}
        <div className="md:col-span-5 grid grid-cols-2 gap-4">
          <button
            onClick={() => setActiveTab('results')}
            className="text-left rounded-[20px] bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.05)] border border-black/[0.05] hover:shadow-[0_6px_20px_rgba(0,0,0,0.08)] transition-all flex flex-col items-center justify-center"
          >
            <div className="relative w-20 h-20 flex items-center justify-center">
              <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                <circle
                  cx="40"
                  cy="40"
                  r={ringRadius}
                  fill="none"
                  stroke="#E5E5EA"
                  strokeWidth="7"
                />
                <circle
                  cx="40"
                  cy="40"
                  r={ringRadius}
                  fill="none"
                  stroke="#34C759"
                  strokeWidth="7"
                  strokeLinecap="round"
                  strokeDasharray={ringCircumference}
                  strokeDashoffset={ringOffset}
                />
              </svg>
              <span className="absolute text-sm font-bold text-[#1D1D1F]">
                {overallAveragePct !== null ? `${overallAveragePct}%` : '--'}
              </span>
            </div>
            <span className="text-[11px] font-medium text-[#6E6E73] mt-1">Moyenne</span>
          </button>

          <button
            onClick={() => setHomeworkFilter('pending')}
            className="text-left rounded-[20px] bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.05)] border border-black/[0.05] hover:shadow-[0_6px_20px_rgba(0,0,0,0.08)] transition-all flex flex-col justify-between"
          >
            <span className="text-[11px] font-semibold text-[#6E6E73]">Rappels</span>
            <div>
              <span className="text-3xl font-bold text-[#1D1D1F] block">
                {pendingHomeworksCount}
              </span>
              <span className="text-[11px] font-medium text-[#FF3B30]">
                {urgentHomeworksCount > 0
                  ? `${urgentHomeworksCount} signalé(s)`
                  : `${sortedTodayEvents.length} cours`}
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* iOS / macOS Inset Grouped Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Left Grouped List: Schedule */}
        <div>
          <div className="flex items-center justify-between px-3 mb-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#6E6E73]">
              Aujourd&apos;hui
            </h3>
            <button
              onClick={() => setActiveTab('agenda')}
              className="text-xs font-medium text-[#007AFF] hover:underline"
            >
              Calendrier
            </button>
          </div>

          <div className="rounded-[16px] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.04)] border border-black/[0.05] divide-y divide-black/[0.06] overflow-hidden">
            {sortedTodayEvents.length === 0 ? (
              <p className="py-10 text-center text-xs text-[#86868B]">Aucun cours prévu.</p>
            ) : (
              sortedTodayEvents.map((evt) => (
                <button
                  key={evt.id}
                  onClick={() => setSelectedEventModal(evt)}
                  className="w-full px-4 py-3 text-left hover:bg-[#F5F5F7]/70 transition-colors flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-1 h-8 rounded-full bg-[#007AFF] shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold text-[#1D1D1F] truncate">
                        {evt.subject}
                      </p>
                      <p className="text-[11px] text-[#6E6E73] truncate">
                        {evt.room} · {evt.teacher}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-medium text-[#1D1D1F] block">
                      {evt.startTime}
                    </span>
                    <span className="text-[10px] text-[#86868B]">{evt.endTime}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right Grouped List: Apple Reminders Style */}
        <div>
          <div className="flex items-center justify-between px-3 mb-2 gap-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#6E6E73]">
              Devoirs
            </h3>

            {/* Apple Segmented Control */}
            <div className="inline-flex p-0.5 rounded-lg bg-black/[0.06] text-[11px] font-medium">
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
                  className={`px-2.5 py-0.5 rounded-md transition-all ${
                    homeworkFilter === key
                      ? 'bg-white text-[#1D1D1F] shadow-xs'
                      : 'text-[#6E6E73] hover:text-[#1D1D1F]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-[16px] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.04)] border border-black/[0.05] divide-y divide-black/[0.06] max-h-[410px] overflow-y-auto">
            {filteredHomeworks.length === 0 ? (
              <p className="py-10 text-center text-xs text-[#86868B]">Aucun devoir ici.</p>
            ) : (
              filteredHomeworks.map(({ homework: hw, importance }) => {
                const isUrgent = importance >= 5;
                return (
                  <div
                    key={hw.id}
                    className={`px-4 py-3 flex items-start gap-3 ${
                      hw.isCompleted ? 'opacity-50' : ''
                    }`}
                  >
                    <button
                      onClick={() => toggleHomework(hw.id)}
                      className={`mt-0.5 w-5 h-5 rounded-full border-[1.5px] flex items-center justify-center shrink-0 transition-colors ${
                        hw.isCompleted
                          ? 'bg-[#007AFF] border-[#007AFF] text-white'
                          : isUrgent
                            ? 'border-[#FF3B30] hover:bg-[#FF3B30]/10'
                            : 'border-[#C7C7CC] hover:border-[#007AFF]'
                      }`}
                    >
                      {hw.isCompleted && <Check className="w-3 h-3" />}
                    </button>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-semibold text-[#6E6E73]">
                          {hw.subjectCode} ·{' '}
                          {new Date(hw.dueDate).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'short',
                          })}
                        </span>
                        {isUrgent && !hw.isCompleted && (
                          <Flag className="w-3 h-3 text-[#FF9500] fill-[#FF9500] shrink-0" />
                        )}
                      </div>
                      <p
                        className={`text-[13px] font-medium mt-0.5 ${
                          hw.isCompleted ? 'line-through text-[#86868B]' : 'text-[#1D1D1F]'
                        }`}
                      >
                        {hw.title}
                      </p>
                      {hw.description && (
                        <p className="text-[11px] text-[#86868B] line-clamp-1 mt-0.5">
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
