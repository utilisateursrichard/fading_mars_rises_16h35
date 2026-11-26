import React from 'react';
import { ArrowRight, Check, Clock, MapPin, Plus } from 'lucide-react';
import { useDashboardData } from '../../../hooks/useDashboardData';
import { cleanStudentClass } from '../../../utils/student';

/**
 * Generates an authentic Material 3 Expressive 12-petal scalloped Soft-Burst SVG path.
 */
function buildScallopedBadgePath(
  cx: number,
  cy: number,
  outerR: number,
  innerR: number,
  petals = 12
): string {
  const points: string[] = [];
  const totalSteps = petals * 2;
  for (let i = 0; i < totalSteps; i++) {
    const angle = (i * Math.PI) / petals - Math.PI / 2;
    const nextAngle = ((i + 1) * Math.PI) / petals - Math.PI / 2;
    const midAngle = (angle + nextAngle) / 2;
    const r = i % 2 === 0 ? outerR : innerR;
    const nextR = (i + 1) % 2 === 0 ? outerR : innerR;
    const x1 = cx + r * Math.cos(angle);
    const y1 = cy + r * Math.sin(angle);
    const x2 = cx + nextR * Math.cos(nextAngle);
    const y2 = cy + nextR * Math.sin(nextAngle);
    const ctrlR = outerR * 1.03;
    const cxCtrl = cx + ctrlR * Math.cos(midAngle);
    const cyCtrl = cy + ctrlR * Math.sin(midAngle);
    if (i === 0) {
      points.push(`M ${x1.toFixed(2)} ${y1.toFixed(2)}`);
    }
    points.push(`Q ${cxCtrl.toFixed(2)} ${cyCtrl.toFixed(2)} ${x2.toFixed(2)} ${y2.toFixed(2)}`);
  }
  points.push('Z');
  return points.join(' ');
}

const SCALLOPED_PATH = buildScallopedBadgePath(60, 60, 56, 48, 12);

/**
 * Authentic Android 16/17 Google Material 3 Expressive dashboard:
 * - Dynamic Pixel Color containers
 * - 12-petal scalloped Soft-Burst SVG grade badge
 * - Android 16/17 wavy SVG progress bar
 * - Horizontal expressive class pill strip
 * - Authentic stacked segmented list cards with 3px gaps and morphing checkboxes
 */
export const GoogleM3EDashboard: React.FC = () => {
  const {
    student,
    greeting,
    todayFormatted,
    dayProgressPct,
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
    <div className="space-y-6 text-[#191C20]">
      {!isDemoMode && events.length === 0 && !isInsideSmartschoolPlatform && (
        <div className="p-4 rounded-[26px] bg-[#FFDAD6] text-[#410002] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-xs font-semibold">
            <strong>Mode Réel actif :</strong> Ouvrez Smartschool et cliquez sur le favori BetterSchool pour synchroniser vos cours.
          </p>
          <button
            onClick={() => setActiveTab('book')}
            className="px-4 py-1.5 rounded-full bg-[#410002] text-white text-xs font-bold self-start sm:self-auto"
          >
            Voir le favori
          </button>
        </div>
      )}

      {/* Oversized Expressive Display Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-[#00639B] capitalize">
            {todayFormatted}
            {cleanStudentClass(student?.studentClass)
              ? ` · ${cleanStudentClass(student?.studentClass)}`
              : ''}
          </p>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[#191C20] mt-1">
            {student?.firstName ? `${greeting}, ${student.firstName}` : greeting}
          </h1>
        </div>

        <button
          onClick={() => setIsNewHomeworkModalOpen(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[18px] hover:rounded-full bg-[#00639B] hover:bg-[#004D7A] text-white text-xs font-bold transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Nouveau devoir</span>
        </button>
      </div>

      {/* Expressive Asymmetric Hero: Primary Container + Wavy Progress | 12-Petal Soft-Burst Grade Badge */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        {/* Left 8 Cols: Primary Container + Android 16/17 Wavy SVG Progress Bar */}
        <button
          onClick={() => nextClassSpotlight && setSelectedEventModal(nextClassSpotlight.event)}
          className="lg:col-span-8 text-left group rounded-[32px] bg-[#D3E4FF] hover:bg-[#C6DCFF] p-6 transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] flex flex-col justify-between gap-5"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-16 h-16 rounded-full bg-[#00639B] text-white flex flex-col items-center justify-center shrink-0">
                <span className="text-[10px] font-bold opacity-80">
                  {nextClassSpotlight ? nextClassSpotlight.event.subjectCode : 'LIBRE'}
                </span>
                <span className="text-base font-black">
                  {nextClassSpotlight ? nextClassSpotlight.event.startTime : '--:--'}
                </span>
              </div>

              <div className="min-w-0">
                <span className="inline-block px-3 py-0.5 rounded-full bg-white/75 text-[#001C38] text-[11px] font-bold mb-1">
                  {nextClassSpotlight ? nextClassSpotlight.badgeText : 'Journée terminée'}
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-[#001C38] truncate">
                  {nextClassSpotlight
                    ? nextClassSpotlight.event.subject
                    : 'Aucun cours à venir'}
                </h2>
                {nextClassSpotlight && (
                  <p className="text-xs font-semibold text-[#1E3A5F] flex flex-wrap items-center gap-3 mt-1">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {nextClassSpotlight.timeLabel}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {nextClassSpotlight.event.room}
                    </span>
                    <span>{nextClassSpotlight.event.teacher}</span>
                  </p>
                )}
              </div>
            </div>

            <span className="w-11 h-11 rounded-[16px] group-hover:rounded-full bg-white/80 text-[#001C38] flex items-center justify-center shrink-0 transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]">
              <ArrowRight className="w-4 h-4" />
            </span>
          </div>

          {/* Android 16/17 Wavy Progress Indicator */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-bold text-[#001C38]/80">
              <span>Progression de la journée</span>
              <span>{dayProgressPct}%</span>
            </div>
            <div className="relative h-5 w-full flex items-center">
              <svg viewBox="0 0 300 18" preserveAspectRatio="none" className="w-full h-4">
                <defs>
                  <clipPath id="m3e-wave-progress-clip">
                    <rect x="0" y="0" width={Math.max(8, (dayProgressPct / 100) * 300)} height="18" />
                  </clipPath>
                </defs>
                {/* Track */}
                <line
                  x1="4"
                  y1="9"
                  x2="296"
                  y2="9"
                  stroke="#9AB8E0"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
                {/* Wavy Active Indicator */}
                <path
                  d="M 4 9 Q 12 2 20 9 T 36 9 T 52 9 T 68 9 T 84 9 T 100 9 T 116 9 T 132 9 T 148 9 T 164 9 T 180 9 T 196 9 T 212 9 T 228 9 T 244 9 T 260 9 T 276 9 T 292 9"
                  fill="none"
                  stroke="#00639B"
                  strokeWidth="4.2"
                  strokeLinecap="round"
                  clipPath="url(#m3e-wave-progress-clip)"
                />
              </svg>
            </div>
          </div>
        </button>

        {/* Right 4 Cols: 12-Petal Scalloped Soft-Burst SVG Grade Badge + Coral Urgent Pill */}
        <div className="lg:col-span-4 rounded-[32px] bg-[#E6EEF8] p-5 flex flex-row lg:flex-col items-center justify-between gap-4">
          <button
            onClick={() => setActiveTab('results')}
            className="flex items-center gap-4 group text-left"
          >
            <div className="relative w-24 h-24 shrink-0 transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:rotate-6 group-hover:scale-105">
              <svg viewBox="0 0 120 120" className="w-full h-full">
                <path d={SCALLOPED_PATH} fill="#C6E7CE" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-black text-[#0B3B1E] leading-none">
                  {overallAveragePct !== null ? `${overallAveragePct}%` : '--'}
                </span>
                <span className="text-[10px] font-bold text-[#1B5E33] mt-0.5">Moyenne</span>
              </div>
            </div>
            <div>
              <p className="text-sm font-extrabold text-[#191C20]">Résultats</p>
              <p className="text-xs text-[#42474E]">Voir les bulletins →</p>
            </div>
          </button>

          <button
            onClick={() => setHomeworkFilter(urgentHomeworksCount > 0 ? 'urgent' : 'pending')}
            className="w-auto lg:w-full px-4 py-3 rounded-[22px] bg-[#FFDAD9] hover:bg-[#FFCECC] text-[#410002] flex items-center justify-between gap-3 transition-colors"
          >
            <span className="text-xs font-bold">
              {urgentHomeworksCount > 0 ? 'Prioritaires' : 'Devoirs à faire'}
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-[#9C4146] text-white text-xs font-black">
              {urgentHomeworksCount > 0 ? urgentHomeworksCount : pendingHomeworksCount}
            </span>
          </button>
        </div>
      </div>

      {/* Horizontal Expressive Class Pill Strip (replaces vertical card list) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-extrabold text-[#191C20]">Séances d&apos;aujourd&apos;hui</h3>
          <button
            onClick={() => setActiveTab('agenda')}
            className="px-3.5 py-1 rounded-full bg-[#E6EEF8] hover:bg-[#D3E4FF] text-xs font-bold text-[#001C38] transition-colors"
          >
            Agenda complet →
          </button>
        </div>

        {sortedTodayEvents.length === 0 ? (
          <div className="rounded-[24px] bg-[#E6EEF8] p-5 text-center text-xs font-medium text-[#42474E]">
            Aucun cours aujourd&apos;hui.
          </div>
        ) : (
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
            {sortedTodayEvents.map((evt) => (
              <button
                key={evt.id}
                onClick={() => setSelectedEventModal(evt)}
                className="shrink-0 min-w-[205px] max-w-[235px] text-left p-4 rounded-[26px] bg-white hover:bg-[#E6EEF8] transition-all duration-200 flex flex-col justify-between gap-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-[#D3E4FF] text-[#001C38] text-[10px] font-extrabold">
                    {evt.subjectCode}
                  </span>
                  <span className="text-xs font-bold text-[#00639B]">{evt.startTime}</span>
                </div>
                <div>
                  <p className="text-sm font-bold text-[#191C20] truncate">{evt.subject}</p>
                  <p className="text-[11px] font-medium text-[#42474E] truncate mt-0.5">
                    {evt.room} · {evt.teacher}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Authentic Android 16/17 Stacked Segmented Homework List */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 px-1">
          <h3 className="text-sm font-extrabold text-[#191C20]">Devoirs & Échéances</h3>

          {/* M3 Segmented Pill Button Group */}
          <div className="inline-flex rounded-full bg-[#E6EEF8] p-1">
            {(
              [
                ['pending', 'À faire'],
                ['urgent', 'Urgents'],
                ['all', 'Tous'],
                ['completed', 'Faits'],
              ] as const
            ).map(([key, label]) => {
              const active = homeworkFilter === key;
              return (
                <button
                  key={key}
                  onClick={() => setHomeworkFilter(key)}
                  className={`px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1 transition-colors ${
                    active
                      ? 'bg-[#00639B] text-white'
                      : 'text-[#42474E] hover:text-[#191C20]'
                  }`}
                >
                  {active && <Check className="w-3 h-3" />}
                  <span>{label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {filteredHomeworks.length === 0 ? (
          <div className="rounded-[26px] bg-white p-8 text-center text-xs font-medium text-[#42474E]">
            Aucun devoir dans cette catégorie.
          </div>
        ) : (
          <div className="flex flex-col gap-[3px]">
            {filteredHomeworks.map(({ homework: hw, importance }, index) => {
              const isFirst = index === 0;
              const isLast = index === filteredHomeworks.length - 1;
              const radiusClass =
                isFirst && isLast
                  ? 'rounded-[26px]'
                  : isFirst
                    ? 'rounded-t-[26px] rounded-b-[8px]'
                    : isLast
                      ? 'rounded-t-[8px] rounded-b-[26px]'
                      : 'rounded-[8px]';
              const isUrgent = importance >= 5;

              return (
                <div
                  key={hw.id}
                  className={`${radiusClass} px-4 py-3.5 flex items-start gap-3.5 transition-all ${
                    hw.isCompleted
                      ? 'bg-[#E6EEF8]/65 opacity-60'
                      : isUrgent
                        ? 'bg-[#FFF0F0]'
                        : 'bg-white'
                  }`}
                >
                  <button
                    onClick={() => toggleHomework(hw.id)}
                    className={`mt-0.5 w-5 h-5 flex items-center justify-center shrink-0 transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
                      hw.isCompleted
                        ? 'rounded-full bg-[#00639B] text-white'
                        : isUrgent
                          ? 'rounded-[7px] border-2 border-[#BA1A1A] hover:rounded-full'
                          : 'rounded-[7px] border-2 border-[#72777F] hover:border-[#00639B] hover:rounded-full'
                    }`}
                  >
                    {hw.isCompleted && <Check className="w-3 h-3" />}
                  </button>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-extrabold uppercase text-[#00639B]">
                        {hw.subjectCode}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          isUrgent && !hw.isCompleted
                            ? 'bg-[#FFDAD9] text-[#410002]'
                            : 'bg-[#E6EEF8] text-[#42474E]'
                        }`}
                      >
                        {new Date(hw.dueDate).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </span>
                    </div>
                    <p
                      className={`text-sm font-bold mt-0.5 ${
                        hw.isCompleted ? 'line-through text-[#42474E]' : 'text-[#191C20]'
                      }`}
                    >
                      {hw.title}
                    </p>
                    {hw.description && (
                      <p className="text-xs text-[#42474E] line-clamp-1 mt-0.5">
                        {hw.description}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
