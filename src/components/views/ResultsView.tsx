import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  ChevronDown, 
  ChevronUp, 
  Calculator, 
  Sparkles,
  Award,
  Calendar,
  Clock,
  CheckCircle2,
  Eye,
  EyeOff,
  LayoutGrid,
  ListFilter,
  MessageSquare,
  Target,
  BookOpen,
  Check
} from 'lucide-react';
import { useSchool } from '../../context/SchoolContext';
import { useUITheme } from '../../context/UIThemeContext';
import { getThemeTokens } from '../../utils/themeTokens';
import { getSubjectTheme } from '../../utils/theme';
import { Grade } from '../../types/school';
import { isSubjectFormativeOnly, isGradeFormative } from '../../utils/grades';

export const ResultsView: React.FC = () => {
  const { 
    subjectReports, 
    overallStats, 
    activePeriod, 
    setActivePeriod,
    availablePeriods,
    activePeriodName,
    setActivePeriodName,
    excludedGradeIds,
    toggleGradeExclusion,
    globalSearch,
    isDemoMode
  } = useSchool();
  const { uiTheme } = useUITheme();
  const tk = getThemeTokens(uiTheme);

  // Mode d'affichage : 'bulletin' (vue par matière) ou 'feed' (flux chronologique)
  const [viewMode, setViewMode] = useState<'bulletin' | 'feed'>('bulletin');

  // Matières dépliées dans l'accordéon du bulletin
  const [expandedSubjects, setExpandedSubjects] = useState<{ [key: string]: boolean }>({
    'SCI': true,
    'MATH': true,
    'NÉER': true
  });

  // États du simulateur de moyenne
  const [simSubject, setSimSubject] = useState<string>('');
  const [simObtained, setSimObtained] = useState<number>(16);
  const [simTotal, setSimTotal] = useState<number>(20);
  const [hasSimulated, setHasSimulated] = useState(false);

  const toggleSubject = (code: string) => {
    setExpandedSubjects(prev => ({
      ...prev,
      [code]: !prev[code]
    }));
  };

  // Filtrage par recherche globale
  const filteredReports = useMemo(() => {
    if (!globalSearch) return subjectReports;
    const q = globalSearch.toLowerCase();
    return subjectReports.filter(r => 
      r.subject.toLowerCase().includes(q) ||
      r.subjectCode.toLowerCase().includes(q) ||
      r.teacher.toLowerCase().includes(q) ||
      r.grades.some(g => g.title.toLowerCase().includes(q))
    );
  }, [subjectReports, globalSearch]);

  // Initialisation du sujet simulé dès que des matières sont disponibles
  const activeSimSubject = useMemo(() => {
    if (simSubject && filteredReports.some(r => r.subjectCode === simSubject)) {
      return simSubject;
    }
    return filteredReports[0]?.subjectCode || '';
  }, [simSubject, filteredReports]);

  // Simulation réactive de moyenne avec barème libre
  const simulatedStats = useMemo(() => {
    if (!hasSimulated || !activeSimSubject || filteredReports.length === 0) return null;

    const targetRep = filteredReports.find(r => r.subjectCode === activeSimSubject);
    const isTargetInitialFormative = targetRep ? isSubjectFormativeOnly(targetRep) : false;

    let totalWeightedPct = 0;
    let totalWeeklyHours = 0;
    let targetSubjectOldPct: number | null = null;
    let targetSubjectNewPct = 0;

    filteredReports.forEach(rep => {
      const isTarget = rep.subjectCode === activeSimSubject;
      const hours = rep.hoursPerWeek || rep.coefficient || 1;
      const isFormative = isSubjectFormativeOnly(rep);

      if (isFormative && !isTarget) {
        // Ignorer les matières uniquement formatives dans le calcul global
        return;
      }

      let subjectPct = rep.totalPossible && rep.totalPossible > 0
        ? ((rep.totalObtained || 0) / rep.totalPossible) * 100
        : (rep.studentAverage !== null && rep.studentAverage !== undefined
            ? (rep.studentAverage > 20 ? rep.studentAverage : (rep.studentAverage / 20) * 100)
            : 0);

      if (isTarget) {
        targetSubjectOldPct = isTargetInitialFormative ? null : subjectPct;
        const currentObt = isTargetInitialFormative ? 0 : (rep.totalObtained ?? (rep.studentAverage ? (rep.studentAverage > 20 ? rep.studentAverage : (rep.studentAverage / 20) * 100) : 0));
        const currentTot = isTargetInitialFormative ? 0 : (rep.totalPossible ?? (rep.studentAverage ? 100 : 0));

        const newObt = currentObt + simObtained;
        const newTot = currentTot + simTotal;

        if (newTot > 0) {
          subjectPct = (newObt / newTot) * 100;
          targetSubjectNewPct = subjectPct;
        }
      }

      totalWeightedPct += subjectPct * hours;
      totalWeeklyHours += hours;
    });

    const newOverallPct = totalWeeklyHours > 0 ? totalWeightedPct / totalWeeklyHours : 0;
    const currentOverallPct = overallStats?.currentPct ?? (overallStats?.current ? (overallStats.current > 20 ? overallStats.current : (overallStats.current / 20) * 100) : 0);
    const diffPct = Number((newOverallPct - currentOverallPct).toFixed(1));

    const targetSubjectOld20 = targetSubjectOldPct !== null ? Number(((targetSubjectOldPct / 100) * 20).toFixed(2)) : null;
    const targetSubjectNew20 = Number(((targetSubjectNewPct / 100) * 20).toFixed(2));
    const targetSubjectDiff20 = targetSubjectOld20 !== null ? Number((targetSubjectNew20 - targetSubjectOld20).toFixed(2)) : null;

    const currentOverall20 = Number(((currentOverallPct / 100) * 20).toFixed(2));
    const newOverall20 = Number(((newOverallPct / 100) * 20).toFixed(2));
    const diffOverall20 = Number((newOverall20 - currentOverall20).toFixed(2));

    return {
      targetSubjectName: targetRep?.subject || activeSimSubject,
      targetSubjectOldPct,
      targetSubjectOld20,
      targetSubjectNewPct: Number(targetSubjectNewPct.toFixed(1)),
      targetSubjectNew20,
      targetSubjectDiff: targetSubjectOldPct !== null ? Number((targetSubjectNewPct - targetSubjectOldPct).toFixed(1)) : null,
      targetSubjectDiff20,
      isTargetInitialFormative,
      currentOverallPct: Number(currentOverallPct.toFixed(1)),
      newOverallPct: Number(newOverallPct.toFixed(1)),
      newOverall20,
      diffPct,
      diffOverall20,
      currentOverall20
    };
  }, [hasSimulated, activeSimSubject, simObtained, simTotal, filteredReports, overallStats]);

  // Liste plate chronologique de toutes les évaluations pour la vue "Flux"
  const allChronologicalGrades = useMemo(() => {
    const list: (Grade & { hoursPerWeek?: number })[] = [];
    filteredReports.forEach(rep => {
      rep.grades.forEach(g => {
        list.push({ ...g, hoursPerWeek: rep.hoursPerWeek || rep.coefficient });
      });
    });

    // Tri par date décroissante
    return list.sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      return dateB - dateA;
    });
  }, [filteredReports]);

  // Statut visuel du score
  const getScoreColorBadge = (percentage?: number) => {
    if (percentage === undefined || percentage === null) return 'bg-slate-100 text-slate-700 border-slate-200';
    if (percentage >= 75) return 'bg-emerald-50 text-emerald-700 border-emerald-200/70';
    if (percentage >= 50) return 'bg-amber-50 text-amber-700 border-amber-200/70';
    return 'bg-rose-50 text-rose-700 border-rose-200/70';
  };

  return (
    <div className="space-y-6 pb-12 max-w-6xl mx-auto">
      
      {/* Header avec Navigation de Vue & Période */}
      <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 ${tk.card}`}>
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className={`text-xl font-extrabold tracking-tight ${tk.textPrimary}`}>Résultats & Notes</h2>
            <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full ${tk.subSurface} ${tk.textSecondary}`}>
              Module Skore
            </span>
          </div>
          <p className={`text-xs font-medium mt-0.5 ${tk.textMuted}`}>
            Pondération par points bruts cumulés et volume horaire hebdomadaire
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Segmented Control : Bulletin vs Flux chronologique */}
          <div className={`flex items-center p-1 text-xs font-bold ${tk.subSurface}`}>
            <button
              onClick={() => setViewMode('bulletin')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 transition-all ${
                viewMode === 'bulletin' ? tk.primaryBtn : tk.textMuted
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Bulletin par matière</span>
            </button>
            <button
              onClick={() => setViewMode('feed')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 transition-all ${
                viewMode === 'feed' ? tk.primaryBtn : tk.textMuted
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Flux chronologique</span>
            </button>
          </div>

          {/* Sélecteur de Période (Dynamique en Réel ou T1/T2/T3 en Démo) */}
          {availablePeriods.length > 0 ? (
            <div className={`flex items-center p-1 text-xs font-bold ${tk.subSurface}`}>
              {availablePeriods.map(p => (
                <button
                  key={p}
                  onClick={() => setActivePeriodName(p)}
                  className={`px-3 py-1.5 transition-all ${
                    activePeriodName === p ? tk.primaryBtn : tk.textMuted
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          ) : (
            <div className={`flex items-center p-1 text-xs font-bold ${tk.subSurface}`}>
              {(['T1', 'T2', 'T3'] as const).map(period => (
                <button
                  key={period}
                  onClick={() => setActivePeriod(period)}
                  className={`px-3.5 py-1.5 transition-all ${
                    activePeriod === period ? tk.primaryBtn : tk.textMuted
                  }`}
                >
                  {period === 'T1' ? '1er Trimestre' : period === 'T2' ? '2ème Trimestre' : '3ème Trimestre'}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Grille Synthèse Globale & Simulateur */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* KPI Moyenne Générale adapté au thème actif */}
        <div
          className={`lg:col-span-2 p-6 sm:p-7 flex flex-col justify-between transition-all ${
            uiTheme === 'pulse'
              ? 'bg-[#121318] text-white rounded-[24px] shadow-lg'
              : uiTheme === 'google_m3e'
                ? 'bg-[#D3E4FF] text-[#001C38] rounded-[32px]'
                : uiTheme === 'nova'
                  ? 'bg-gradient-to-br from-[#191D2A] to-[#12151F] text-white rounded-3xl border border-white/10'
                  : uiTheme === 'horizon'
                    ? 'bg-gradient-to-br from-[#0F172A] to-[#1E3A8A] text-white rounded-3xl shadow-md'
                    : uiTheme === 'obsidian'
                      ? 'bg-[#151822] text-slate-100 rounded-xl border border-white/[0.08]'
                      : 'bg-white text-[#1D1D1F] rounded-[20px] border border-black/[0.06] shadow-xs'
          }`}
        >
          <div>
            <div className="flex items-center justify-between gap-2">
              <span
                className={`text-xs font-bold uppercase tracking-wider ${
                  uiTheme === 'pulse' || uiTheme === 'nova' || uiTheme === 'horizon'
                    ? 'text-white/60'
                    : uiTheme === 'google_m3e'
                      ? 'text-[#001C38]/70'
                      : 'text-slate-400'
                }`}
              >
                Moyenne Générale Pondérée • {activePeriodName || activePeriod}
              </span>
              {overallStats && (
                <span
                  className={`px-2.5 py-1 text-xs font-bold rounded-full ${
                    uiTheme === 'google_m3e'
                      ? 'bg-[#C6E7CE] text-[#0B3B1E]'
                      : uiTheme === 'pulse' || uiTheme === 'nova' || uiTheme === 'horizon'
                        ? 'bg-white/15 text-white'
                        : 'bg-emerald-50 text-emerald-700'
                  }`}
                >
                  {overallStats.current >= 80
                    ? 'Mention Très Bien'
                    : overallStats.current >= 70
                      ? 'Mention Bien'
                      : overallStats.current >= 60
                        ? 'Mention Assez Bien'
                        : 'En bonne voie'}
                </span>
              )}
            </div>

            {overallStats ? (
              <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div className="space-y-3">
                  <div className="flex items-baseline gap-2">
                    <span
                      className={`text-4xl sm:text-5xl font-black tracking-tight ${
                        uiTheme === 'pulse' || uiTheme === 'nova' || uiTheme === 'horizon'
                          ? 'text-white'
                          : uiTheme === 'google_m3e'
                            ? 'text-[#001C38]'
                            : 'text-slate-900'
                      }`}
                    >
                      {overallStats.current}
                    </span>
                    <span
                      className={`text-lg font-bold ${
                        uiTheme === 'pulse' || uiTheme === 'nova' || uiTheme === 'horizon'
                          ? 'text-white/50'
                          : uiTheme === 'google_m3e'
                            ? 'text-[#001C38]/60'
                            : 'text-slate-400'
                      }`}
                    >
                      / 100
                    </span>
                  </div>

                  {overallStats.totalWeeklyHours ? (
                    <div
                      className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full w-fit ${
                        uiTheme === 'pulse' || uiTheme === 'nova' || uiTheme === 'horizon'
                          ? 'bg-white/10 text-white/90'
                          : uiTheme === 'google_m3e'
                            ? 'bg-white/75 text-[#001C38]'
                            : 'bg-slate-50 text-slate-600 border border-slate-200/60'
                      }`}
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>{overallStats.totalWeeklyHours}h de cours hebdomadaires</span>
                    </div>
                  ) : null}
                </div>

                {/* Apple Pro Activity Ring OR Pulse/Nova Subject Mini-Bars */}
                {uiTheme === 'apple_pro' && (
                  <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
                    <svg className="w-24 h-24 -rotate-90" viewBox="0 0 96 96">
                      <circle cx="48" cy="48" r="38" fill="none" stroke="#E5E5EA" strokeWidth="8" />
                      <circle
                        cx="48"
                        cy="48"
                        r="38"
                        fill="none"
                        stroke="#34C759"
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={2 * Math.PI * 38}
                        strokeDashoffset={
                          2 * Math.PI * 38 * (1 - Math.min(100, Math.max(0, overallStats.current)) / 100)
                        }
                      />
                    </svg>
                    <span className="absolute text-sm font-bold text-[#1D1D1F]">
                      {Math.round(overallStats.current)}%
                    </span>
                  </div>
                )}

                {(uiTheme === 'pulse' || uiTheme === 'nova') && filteredReports.length > 0 && (
                  <div className="w-full sm:w-56 space-y-2">
                    {filteredReports
                      .filter((r) => r.studentAverage !== null)
                      .slice(0, 3)
                      .map((rep) => {
                        const avg = rep.studentAverage ?? 0;
                        const pct = avg > 20 ? avg : (avg / 20) * 100;
                        return (
                          <div key={rep.subjectCode} className="space-y-1">
                            <div className="flex justify-between text-[10px] font-bold">
                              <span className="text-white/75 truncate max-w-[130px]">
                                {rep.subject}
                              </span>
                              <span className="text-amber-300 font-mono">{pct.toFixed(0)}%</span>
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
                )}
              </div>
            ) : (
              <div className="py-8 text-center text-xs opacity-60">
                Aucune note enregistrée pour cette période.
              </div>
            )}
          </div>

          <div
            className={`mt-6 pt-5 border-t flex items-center justify-between text-xs ${
              uiTheme === 'pulse' || uiTheme === 'nova' || uiTheme === 'horizon'
                ? 'border-white/10 text-white/60'
                : uiTheme === 'google_m3e'
                  ? 'border-[#001C38]/10 text-[#001C38]/70'
                  : 'border-slate-100 text-slate-400'
            }`}
          >
            <span>Règle officielle : points bruts sommatifs cumulés</span>
            <span className="font-semibold">
              {allChronologicalGrades.filter(g => g.isSommatif && !g.isManuallyExcluded).length} évaluations comptabilisées
            </span>
          </div>
        </div>

        {/* Simulateur de Moyenne Interactif */}
        <div className={`${tk.card} p-6 sm:p-7 flex flex-col justify-between`}>
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Calculator className="w-4 h-4 text-indigo-500" />
                <h3 className={`font-bold text-sm ${tk.textPrimary}`}>Simulateur de note</h3>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${tk.subSurface} ${tk.textSecondary}`}>
                Impact direct
              </span>
            </div>

            {filteredReports.length > 0 ? (
              <div className="space-y-3">
                <div>
                  <label className={`block text-[11px] font-bold uppercase mb-1 ${tk.textMuted}`}>Matière</label>
                  <select
                    value={activeSimSubject}
                    onChange={(e) => {
                      setSimSubject(e.target.value);
                      setHasSimulated(true);
                    }}
                    className={`w-full px-3 py-2 text-xs font-bold focus:outline-none ${tk.inputField}`}
                  >
                    {filteredReports.map(rep => (
                      <option key={rep.subjectCode} value={rep.subjectCode}>
                        {rep.subject} ({rep.hoursPerWeek || rep.coefficient}h)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={`block text-[11px] font-bold uppercase mb-1 ${tk.textMuted}`}>
                      Note espérée {simTotal > 0 && <span className="text-indigo-500 font-extrabold ml-1">({Number(((simObtained / simTotal) * 100).toFixed(0))}%)</span>}
                    </label>
                    <input
                      type="number"
                      min="0"
                      max={simTotal}
                      step="0.5"
                      value={simObtained}
                      onChange={(e) => {
                        setSimObtained(Number(e.target.value));
                        setHasSimulated(true);
                      }}
                      className={`w-full px-3 py-2 text-xs font-black focus:outline-none ${tk.inputField}`}
                    />
                  </div>
                  <div>
                    <label className={`block text-[11px] font-bold uppercase mb-1 ${tk.textMuted}`}>Sur total (/)</label>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={simTotal}
                      onChange={(e) => {
                        setSimTotal(Number(e.target.value));
                        setHasSimulated(true);
                      }}
                      className={`w-full px-3 py-2 text-xs font-black focus:outline-none ${tk.inputField}`}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className={`py-6 text-center text-xs font-medium ${tk.textMuted}`}>
                Le simulateur sera disponible dès la publication des premières notes.
              </div>
            )}
          </div>

          <div className={`mt-4 pt-4 border-t ${tk.borderSubtle}`}>
            {hasSimulated && simulatedStats ? (
              <div className="space-y-2.5">
                {/* 1. Impact sur la matière sélectionnée */}
                <div className={`p-3 ${tk.subSurface} border ${tk.borderSubtle} flex items-center justify-between`}>
                  <div className="min-w-0 pr-2">
                    <p className={`text-[10px] font-bold uppercase tracking-wider truncate ${tk.textSecondary}`}>
                      Moyenne en {simulatedStats.targetSubjectName}
                    </p>
                    <div className="flex items-baseline gap-1.5 mt-0.5">
                      <span className={`text-xs line-through font-semibold ${tk.textMuted}`}>
                        {simulatedStats.targetSubjectOldPct !== null
                          ? `${simulatedStats.targetSubjectOldPct}%`
                          : 'N/A'}
                      </span>
                      <span className={`font-bold text-xs ${tk.textMuted}`}>→</span>
                      <span className={`text-base sm:text-lg font-black ${tk.textPrimary}`}>
                        {simulatedStats.targetSubjectNewPct}%
                      </span>
                      <span className={`text-[10px] font-semibold ml-1 ${tk.textMuted}`}>({simulatedStats.targetSubjectNew20}/20)</span>
                    </div>
                  </div>
                  <div className={`px-2.5 py-1 rounded-xl text-xs font-extrabold shrink-0 ${
                    simulatedStats.targetSubjectDiff === null
                      ? 'bg-indigo-500/15 text-indigo-500'
                      : simulatedStats.targetSubjectDiff >= 0
                        ? 'bg-emerald-500/15 text-emerald-500'
                        : 'bg-rose-500/15 text-rose-500'
                  }`}>
                    {simulatedStats.targetSubjectDiff === null
                      ? '1ère note'
                      : simulatedStats.targetSubjectDiff >= 0
                        ? `+${simulatedStats.targetSubjectDiff}%`
                        : `${simulatedStats.targetSubjectDiff}%`}
                  </div>
                </div>

                {/* 2. Impact sur la moyenne générale */}
                <div className={`p-3 flex items-center justify-between ${tk.heroBanner}`}>
                  <div className="min-w-0 pr-2">
                    <p className={`text-[10px] font-bold uppercase tracking-wider ${tk.heroSubtitle}`}>
                      Moyenne Générale
                    </p>
                    <div className="flex items-baseline gap-1.5 mt-0.5">
                      <span className={`text-xs line-through font-semibold ${tk.heroSubtitle}`}>
                        {simulatedStats.currentOverallPct}%
                      </span>
                      <span className={`font-bold text-xs ${tk.heroSubtitle}`}>→</span>
                      <span className={`text-base sm:text-lg font-black ${tk.heroTitle}`}>
                        {simulatedStats.newOverallPct}%
                      </span>
                      <span className={`text-xs font-medium ml-1 ${tk.heroSubtitle}`}>({simulatedStats.newOverall20}/20)</span>
                    </div>
                  </div>
                  <div className={`px-2.5 py-1 rounded-xl text-xs font-extrabold shrink-0 ${
                    simulatedStats.diffPct >= 0 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  }`}>
                    {simulatedStats.diffPct >= 0 ? `+${simulatedStats.diffPct}%` : `${simulatedStats.diffPct}%`}
                  </div>
                </div>

                <button
                  onClick={() => setHasSimulated(false)}
                  className={`w-full py-1 text-center text-[11px] font-semibold transition-colors ${tk.textMuted}`}
                >
                  Réinitialiser la simulation
                </button>
              </div>
            ) : (
              <button
                onClick={() => setHasSimulated(true)}
                disabled={filteredReports.length === 0}
                className={`w-full py-2.5 text-xs disabled:opacity-40 ${tk.primaryBtn}`}
              >
                Calculer l'impact
              </button>
            )}
          </div>
        </div>

      </div>

      {/* CONTENU PRINCIPAL SELON LE MODE SÉLECTIONNÉ */}

      {viewMode === 'bulletin' ? (
        /* VUE A : BULLETIN PAR MATIÈRE */
        <div className="space-y-3.5">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-base text-slate-900">Matières & Évaluations détaillées</h3>
            <span className="text-xs text-slate-400 font-medium">{filteredReports.length} matières</span>
          </div>

          {filteredReports.length === 0 && (
            <div className="bg-white p-8 rounded-3xl border border-slate-200/70 text-center space-y-1.5 shadow-subtle">
              <p className="text-sm font-bold text-slate-700">Aucun résultat disponible pour cette période</p>
              <p className="text-xs text-slate-400">Les évaluations Smartschool apparaîtront automatiquement dès leur publication.</p>
            </div>
          )}

          <div className={uiTheme === 'google_m3e' ? 'flex flex-col gap-[3px]' : 'space-y-3.5'}>
          {filteredReports.map((report, reportIndex) => {
            const isExpanded = !!expandedSubjects[report.subjectCode];
            const theme = getSubjectTheme(report.subjectCode);
            const coursePct = report.totalPossible && report.totalPossible > 0
              ? Math.round(((report.totalObtained || 0) / report.totalPossible) * 100)
              : (report.studentAverage !== null && report.studentAverage !== undefined
                  ? Math.round(report.studentAverage > 20 ? report.studentAverage : (report.studentAverage / 20) * 100)
                  : 0);

            const isFirst = reportIndex === 0;
            const isLast = reportIndex === filteredReports.length - 1;
            const cardRadius =
              uiTheme === 'google_m3e'
                ? isFirst && isLast
                  ? 'rounded-[28px]'
                  : isFirst
                    ? 'rounded-t-[28px] rounded-b-[8px]'
                    : isLast
                      ? 'rounded-t-[8px] rounded-b-[28px]'
                      : 'rounded-[8px]'
                : uiTheme === 'apple_pro'
                  ? 'rounded-[16px]'
                  : uiTheme === 'obsidian'
                    ? 'rounded-xl'
                    : 'rounded-3xl';

            return (
              <div
                key={report.subjectCode}
                className={`bg-white ${cardRadius} border border-slate-200/70 shadow-subtle overflow-hidden transition-all`}
              >
                {/* En-tête de Matière */}
                <div
                  onClick={() => toggleSubject(report.subjectCode)}
                  className="cursor-pointer p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors"
                >
                  <div className="flex items-start sm:items-center gap-3.5">
                    <span className={`px-3 py-2 rounded-2xl text-xs font-black border uppercase tracking-wider shrink-0 ${theme.badgeClass}`}>
                      {report.subjectCode}
                    </span>

                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm sm:text-base text-slate-900">{report.subject}</h4>
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-[10px] font-bold text-slate-600">
                          {report.hoursPerWeek || report.coefficient}h / sem.
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 font-medium mt-0.5">{report.teacher}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-6 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <div className="text-right">
                      {isSubjectFormativeOnly(report) ? (
                        <div className="flex items-baseline gap-1 justify-end">
                          <span className="text-2xl font-black text-slate-400">N/A</span>
                        </div>
                      ) : (
                        <div className="flex items-baseline gap-1 justify-end">
                          <span className="text-2xl font-black text-slate-900">{coursePct}</span>
                          <span className="text-xs text-slate-400 font-semibold">/ 100</span>
                        </div>
                      )}
                      {report.totalPossible ? (
                        <p className="text-[11px] text-slate-400">
                          Cumul : {report.totalObtained} / {report.totalPossible} pts
                        </p>
                      ) : isSubjectFormativeOnly(report) ? (
                        <p className="text-[11px] text-amber-600 font-semibold">
                          Formatif uniquement
                        </p>
                      ) : null}
                    </div>

                    <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>
                </div>

                {/* Contenu Dépliable */}
                {isExpanded && (
                  <div className="px-5 pb-6 pt-2 border-t border-slate-100 bg-slate-50/40 space-y-4">
                    
                    {/* Appréciation si présente */}
                    {report.teacherAppreciation && (
                      <div className="p-3.5 rounded-2xl bg-amber-50/50 border border-amber-200/50 text-xs">
                        <span className="font-bold uppercase tracking-wider text-[10px] text-amber-800 block mb-1">
                          Appréciation de l'enseignant
                        </span>
                        <p className="text-slate-700 italic">
                          « {report.teacherAppreciation} »
                        </p>
                      </div>
                    )}

                    {/* Liste des Évaluations */}
                    <div>
                      <h5 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                        Évaluations de la période ({report.grades.length})
                      </h5>

                      <div className="space-y-2">
                        {report.grades.map((grade) => {
                          const isExcluded = excludedGradeIds.has(grade.id);
                          const isSommatif = grade.isSommatif ?? true;

                          return (
                            <div
                              key={grade.id}
                              className={`p-3.5 rounded-2xl border transition-all shadow-subtle ${
                                isExcluded
                                  ? 'bg-slate-100/60 border-slate-200/50 opacity-60'
                                  : 'bg-white border-slate-200/70'
                              }`}
                            >
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md uppercase ${
                                      isSommatif
                                        ? 'bg-purple-100 text-purple-700'
                                        : 'bg-slate-200 text-slate-600'
                                    }`}>
                                      {isSommatif ? 'Sommatif' : 'Formatif'}
                                    </span>
                                    {isExcluded && (
                                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-rose-100 text-rose-700">
                                        Exclu du calcul
                                      </span>
                                    )}
                                    <span className="text-xs font-bold text-slate-900">{grade.title}</span>
                                  </div>

                                  <div className="text-[11px] text-slate-400 flex items-center gap-2">
                                    <span className="flex items-center gap-1">
                                      <Calendar className="w-3 h-3" />
                                      {grade.date ? new Date(grade.date).toLocaleDateString('fr-FR') : 'Date non définie'}
                                    </span>
                                    {grade.evaluationType === 'project' && (
                                      <>
                                        <span>•</span>
                                        <span className="flex items-center gap-1 text-indigo-600 font-semibold">
                                          <Target className="w-3 h-3" /> Compétences LPD
                                        </span>
                                      </>
                                    )}
                                  </div>
                                </div>

                                <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                                  <div className="text-right">
                                    <div className="flex items-baseline gap-1 justify-end">
                                      <span className="text-lg font-black text-slate-900">
                                        {grade.rawScoreText || `${grade.value}/20`}
                                      </span>
                                    </div>
                                    <span className="text-[10px] text-slate-400">
                                      {isSommatif ? (isExcluded ? 'Non compté' : 'Compte dans la moyenne') : 'Entraînement'}
                                    </span>
                                  </div>

                                  {/* Bouton d'exclusion manuelle de l'élève (sommatifs uniquement) */}
                                  {isSommatif && (
                                    <button
                                      onClick={() => toggleGradeExclusion(grade.id)}
                                      title={isExcluded ? 'Réinclure dans la moyenne' : 'Exclure du calcul (simulation)'}
                                      className={`px-2.5 py-1.5 rounded-xl border transition-all flex items-center gap-1.5 text-xs font-semibold ${
                                        isExcluded
                                          ? 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100'
                                          : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                                      }`}
                                    >
                                      {isExcluded ? (
                                        <>
                                          <EyeOff className="w-3.5 h-3.5 text-rose-500" />
                                          <span className="text-[11px]">Exclu</span>
                                        </>
                                      ) : (
                                        <>
                                          <Eye className="w-3.5 h-3.5 text-slate-400" />
                                          <span className="text-[11px]">Inclus</span>
                                        </>
                                      )}
                                    </button>
                                  )}
                                </div>
                              </div>

                              {/* Détail des objectifs LPD si évaluation par projet (filtrer les clés techniques internes comme mini-db-skore) */}
                              {grade.goals && grade.goals.filter(g => g.title && g.title !== 'mini-db-skore' && !g.title.includes('mini-db')).length > 0 && (
                                <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap gap-2">
                                  {grade.goals
                                    .filter(g => g.title && g.title !== 'mini-db-skore' && !g.title.includes('mini-db'))
                                    .map((goal, idx) => (
                                      <span
                                        key={idx}
                                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50/60 border border-indigo-100 text-[11px] font-medium text-indigo-900"
                                      >
                                        <Target className="w-3 h-3 text-indigo-500" />
                                        <span>{goal.title} :</span>
                                        <span className="font-extrabold text-indigo-700">{goal.scoreText}</span>
                                      </span>
                                  ))}
                                </div>
                              )}

                              {/* Feedbacks de l'enseignant si présents */}
                              {grade.feedbacks && grade.feedbacks.length > 0 && (
                                <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-1.5">
                                  {grade.feedbacks.map((fb, idx) => (
                                    <div key={idx} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/50 flex items-start gap-2 text-xs text-slate-700">
                                      <MessageSquare className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
                                      <p className="italic">« {fb} »</p>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                  </div>
                )}
              </div>
            );
          })}
          </div>
        </div>
      ) : (
        /* VUE B : FLUX CHRONOLOGIQUE DES ÉVALUATIONS */
        <div className="space-y-3.5">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-base text-slate-900">Dernières évaluations publiées</h3>
            <span className="text-xs text-slate-400 font-medium">
              {allChronologicalGrades.length} évaluations
            </span>
          </div>

          {allChronologicalGrades.length === 0 && (
            <div className="bg-white p-8 rounded-3xl border border-slate-200/70 text-center space-y-1.5 shadow-subtle">
              <p className="text-sm font-bold text-slate-700">Aucune évaluation dans le flux</p>
              <p className="text-xs text-slate-400">Toutes vos notes apparaîtront ici chronologiquement au fur et à mesure.</p>
            </div>
          )}

          <div className={uiTheme === 'google_m3e' ? 'space-y-1.5' : 'space-y-3'}>
            {allChronologicalGrades.map((grade, index) => {
              const isExcluded = excludedGradeIds.has(grade.id);
              const theme = getSubjectTheme(grade.subjectCode);
              const isSommatif = grade.isSommatif ?? true;
              const m3eRadius =
                uiTheme === 'google_m3e'
                  ? index === 0
                    ? 'rounded-t-[28px] rounded-b-[10px]'
                    : index === allChronologicalGrades.length - 1
                      ? 'rounded-t-[10px] rounded-b-[28px]'
                      : 'rounded-[10px]'
                  : '';

              return (
                <div
                  key={grade.id}
                  className={`${tk.card} ${m3eRadius} p-5 transition-all ${
                    isExcluded ? 'opacity-60' : ''
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    {/* Colonne Gauche : Matière, Enseignant, Titre */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className={`px-2.5 py-1 rounded-xl text-xs font-black border uppercase tracking-wider ${theme.badgeClass}`}>
                          {grade.subjectCode}
                        </span>
                        <span className={`font-extrabold text-sm ${tk.textPrimary}`}>{grade.subject}</span>
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md uppercase ${
                          isSommatif
                            ? tk.isDarkTheme ? 'bg-purple-500/20 text-purple-300' : 'bg-purple-100 text-purple-700'
                            : `${tk.subSurface} ${tk.textSecondary}`
                        }`}>
                          {isSommatif ? 'Sommatif' : 'Formatif'}
                        </span>
                        {isExcluded && (
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-rose-500/15 text-rose-500">
                            Exclu
                          </span>
                        )}
                      </div>

                      <h4 className={`font-bold text-base ${tk.textPrimary}`}>{grade.title}</h4>

                      <div className={`flex flex-wrap items-center gap-4 text-xs ${tk.textMuted}`}>
                        {grade.teacherName && (
                          <div className={`flex items-center gap-1.5 font-medium ${tk.textSecondary}`}>
                            {grade.teacherPhoto ? (
                              <img src={grade.teacherPhoto} alt="" className="w-4 h-4 rounded-full object-cover" />
                            ) : null}
                            <span>{grade.teacherName}</span>
                          </div>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {grade.date ? new Date(grade.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Date inconnue'}
                        </span>
                        {grade.availabilityDate && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            Publié le {new Date(grade.availabilityDate).toLocaleDateString('fr-FR')}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Colonne Droite : Note proéminente & Action */}
                    <div className={`flex items-center justify-between sm:justify-end gap-4 pt-3 sm:pt-0 border-t sm:border-t-0 ${tk.borderSubtle}`}>
                      <div className="text-right">
                        <div className={`px-4 py-2 border ${tk.borderSubtle} ${tk.subSurface} flex items-baseline gap-1.5`}>
                          <span className={`text-2xl font-black ${tk.textPrimary}`}>
                            {grade.rawScoreText || `${grade.value}/20`}
                          </span>
                        </div>
                        <span className={`text-[10px] font-medium block mt-1 ${tk.textMuted}`}>
                          {isSommatif ? 'Pondération sommatif' : 'Formatif (indicatif)'}
                        </span>
                      </div>

                      {isSommatif && (
                        <button
                          onClick={() => toggleGradeExclusion(grade.id)}
                          title={isExcluded ? 'Réinclure dans la moyenne' : 'Exclure du calcul (simulation)'}
                          className={`px-3 py-1.5 rounded-2xl border transition-all flex items-center gap-1.5 text-xs font-semibold ${
                            isExcluded
                              ? 'bg-rose-500/15 border-rose-500/30 text-rose-500'
                              : `${tk.subSurface} ${tk.borderSubtle} ${tk.textSecondary}`
                          }`}
                        >
                          {isExcluded ? (
                            <>
                              <EyeOff className="w-3.5 h-3.5 text-rose-500" />
                              <span className="text-[11px]">Exclu</span>
                            </>
                          ) : (
                            <>
                              <Eye className="w-3.5 h-3.5 opacity-60" />
                              <span className="text-[11px]">Inclus</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Objectifs LPD si disponibles (filtrer les clés techniques internes comme mini-db-skore) */}
                  {grade.goals && grade.goals.filter(g => g.title && g.title !== 'mini-db-skore' && !g.title.includes('mini-db')).length > 0 && (
                    <div className={`mt-3.5 pt-3 border-t ${tk.borderSubtle} flex flex-wrap gap-2`}>
                      {grade.goals
                        .filter(g => g.title && g.title !== 'mini-db-skore' && !g.title.includes('mini-db'))
                        .map((goal, idx) => (
                          <div
                            key={idx}
                            className={`flex items-center gap-1.5 px-3 py-1 ${tk.subSurface} border ${tk.borderSubtle} text-xs font-medium ${tk.textSecondary}`}
                          >
                            <Target className="w-3.5 h-3.5 text-indigo-500" />
                            <span>{goal.title} :</span>
                            <span className={`font-black ${tk.textPrimary}`}>{goal.scoreText}</span>
                          </div>
                      ))}
                    </div>
                  )}

                  {/* Feedbacks de l'enseignant */}
                  {grade.feedbacks && grade.feedbacks.length > 0 && (
                    <div className={`mt-3.5 pt-3 border-t ${tk.borderSubtle} space-y-1.5`}>
                      {grade.feedbacks.map((fb, idx) => (
                        <div key={idx} className={`p-3 ${tk.subSurface} border ${tk.borderSubtle} flex items-start gap-2.5 text-xs ${tk.textSecondary}`}>
                          <MessageSquare className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                          <p className="italic">« {fb} »</p>
                        </div>
                      ))}
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
