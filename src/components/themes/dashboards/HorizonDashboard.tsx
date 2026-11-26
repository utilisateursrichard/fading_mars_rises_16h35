import React from 'react';
import { Check, Clock, MapPin, Plus, ArrowRight } from 'lucide-react';
import { useDashboardData } from '../../../hooks/useDashboardData';
import { cleanStudentClass } from '../../../utils/student';

/**
 * Airy centered focus-canvas dashboard with split cobalt hero and Things-3 checklist.
 */
export const HorizonDashboard: React.FC = () => {
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
    <div className="space-y-6 max-w-4xl mx-auto text-slate-900">
      {!isDemoMode && events.length === 0 && !isInsideSmartschoolPlatform && (
        <div className="px-4 py-3 rounded-2xl bg-white border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <p className="text-xs text-slate-700">
            <strong className="text-amber-700">Mode Réel :</strong> Synchronisez vos données depuis Smartschool avec le favori BetterSchool.
          </p>
          <button
            onClick={() => setActiveTab('book')}
            className="px-3 py-1.5 rounded-full bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-semibold self-start sm:self-auto"
          >
            Voir le favori
          </button>
        </div>
      )}

      {/* Centered Clean Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 px-1">
        <div>
          <p className="text-xs font-semibold text-[#0A66FF] capitalize">
            {todayFormatted}
            {cleanStudentClass(student?.studentClass)
              ? ` · ${cleanStudentClass(student?.studentClass)}`
              : ''}
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mt-0.5">
            {student?.firstName ? `${greeting}, ${student.firstName}` : greeting}
          </h1>
        </div>

        <button
          onClick={() => setIsNewHomeworkModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#0A66FF] hover:bg-[#0052D9] text-white text-xs font-semibold shadow-sm transition-colors self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Ajouter un devoir</span>
        </button>
      </div>

      {/* Split Hero Card: Dark Cobalt Focus + Alabaster Glance */}
      <div className="grid grid-cols-1 md:grid-cols-12 rounded-3xl overflow-hidden shadow-[0_12px_36px_-12px_rgba(15,23,42,0.14)] bg-white border border-white">
        <button
          onClick={() => nextClassSpotlight && setSelectedEventModal(nextClassSpotlight.event)}
          className="md:col-span-7 p-6 bg-gradient-to-br from-[#0F172A] to-[#1E3A8A] text-white text-left flex flex-col justify-between gap-6 group"
        >
          <div className="flex items-center justify-between">
            <span className="px-2.5 py-1 rounded-full bg-white/15 text-[11px] font-semibold">
              {nextClassSpotlight ? nextClassSpotlight.badgeText : 'Programme'}
            </span>
            <ArrowRight className="w-4 h-4 text-white/70 group-hover:translate-x-1 transition-transform" />
          </div>

          {nextClassSpotlight ? (
            <div>
              <p className="text-xs text-blue-200 font-medium">
                {nextClassSpotlight.event.subjectCode} · {nextClassSpotlight.timeLabel}
              </p>
              <h2 className="text-2xl font-bold tracking-tight mt-1">
                {nextClassSpotlight.event.subject}
              </h2>
              <div className="flex items-center gap-3 text-xs text-blue-100/80 mt-3">
                <span className="inline-flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {nextClassSpotlight.event.startTime}–{nextClassSpotlight.event.endTime}
                </span>
                <span className="inline-flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {nextClassSpotlight.event.room}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-lg font-semibold text-blue-100">
              Tous les cours sont terminés.
            </p>
          )}
        </button>

        {/* Right Glance Stack */}
        <div className="md:col-span-5 p-5 grid grid-cols-2 md:grid-cols-1 gap-3 bg-white">
          <button
            onClick={() => setActiveTab('results')}
            className="p-3.5 rounded-2xl bg-[#F5F7FA] hover:bg-[#EBF0F7] text-left transition-colors flex items-center justify-between"
          >
            <div>
              <span className="text-[11px] font-semibold text-slate-500 block">Moyenne</span>
              <span className="text-2xl font-bold text-slate-900">
                {overallAveragePct !== null ? `${overallAveragePct}%` : '--'}
              </span>
            </div>
            <span className="text-xs font-semibold text-[#0A66FF]">Notes →</span>
          </button>

          <button
            onClick={() => setHomeworkFilter('pending')}
            className="p-3.5 rounded-2xl bg-[#F5F7FA] hover:bg-[#EBF0F7] text-left transition-colors flex items-center justify-between"
          >
            <div>
              <span className="text-[11px] font-semibold text-slate-500 block">À faire</span>
              <span className="text-2xl font-bold text-slate-900">{pendingHomeworksCount}</span>
            </div>
            <span className="text-xs font-semibold text-rose-600">
              {urgentHomeworksCount > 0 ? `${urgentHomeworksCount} urgent(s)` : `${sortedTodayEvents.length} cours`}
            </span>
          </button>
        </div>
      </div>

      {/* Clean Dual Flow: Today Schedule + Things-3 Checklist */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <section className="bg-white rounded-3xl p-5 shadow-xs border border-white">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900">Aujourd&apos;hui</h3>
            <button
              onClick={() => setActiveTab('agenda')}
              className="text-xs font-semibold text-[#0A66FF] hover:underline"
            >
              Semaine complète
            </button>
          </div>

          {sortedTodayEvents.length === 0 ? (
            <p className="py-8 text-center text-xs text-slate-400">Aucun cours prévu.</p>
          ) : (
            <div className="space-y-2">
              {sortedTodayEvents.map((evt) => (
                <button
                  key={evt.id}
                  onClick={() => setSelectedEventModal(evt)}
                  className="w-full text-left p-3 rounded-2xl bg-[#F7F9FC] hover:bg-[#EEF3FB] transition-colors flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">{evt.subject}</p>
                    <p className="text-[11px] text-slate-500 truncate">
                      {evt.room} · {evt.teacher}
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-[#0A66FF] shrink-0">
                    {evt.startTime}
                  </span>
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="bg-white rounded-3xl p-5 shadow-xs border border-white flex flex-col">
          <div className="flex items-center justify-between mb-4 gap-2">
            <h3 className="text-sm font-bold text-slate-900">Devoirs</h3>
            <div className="flex gap-1 bg-[#F2F4F8] p-0.5 rounded-full text-[11px] font-semibold">
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
                  className={`px-2.5 py-1 rounded-full transition-colors ${
                    homeworkFilter === key
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
            {filteredHomeworks.length === 0 ? (
              <p className="py-8 text-center text-xs text-slate-400">Aucun devoir ici.</p>
            ) : (
              filteredHomeworks.map(({ homework: hw, importance }) => {
                const isUrgent = importance >= 5;
                return (
                  <div
                    key={hw.id}
                    className={`p-3 rounded-2xl bg-[#F7F9FC] flex items-start gap-3 transition-opacity ${
                      hw.isCompleted ? 'opacity-50' : ''
                    }`}
                  >
                    <button
                      onClick={() => toggleHomework(hw.id)}
                      className={`mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                        hw.isCompleted
                          ? 'bg-[#0A66FF] border-[#0A66FF] text-white'
                          : isUrgent
                            ? 'border-rose-500 hover:bg-rose-50'
                            : 'border-slate-300 hover:border-[#0A66FF]'
                      }`}
                    >
                      {hw.isCompleted && <Check className="w-2.5 h-2.5" />}
                    </button>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-bold uppercase text-slate-500">
                          {hw.subjectCode}
                        </span>
                        <span
                          className={`text-[10px] font-semibold ${
                            isUrgent && !hw.isCompleted ? 'text-rose-600' : 'text-slate-400'
                          }`}
                        >
                          {new Date(hw.dueDate).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'short',
                          })}
                        </span>
                      </div>
                      <p
                        className={`text-xs font-semibold mt-0.5 ${
                          hw.isCompleted ? 'line-through text-slate-400' : 'text-slate-900'
                        }`}
                      >
                        {hw.title}
                      </p>
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
