import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  ChevronDown, 
  ChevronUp, 
  Calculator, 
  Sparkles,
  Award
} from 'lucide-react';
import { useSchool } from '../../context/SchoolContext';
import { getSubjectTheme } from '../../utils/theme';

export const ResultsView: React.FC = () => {
  const { 
    subjectReports, 
    overallStats, 
    activePeriod, 
    setActivePeriod,
    globalSearch 
  } = useSchool();

  const [expandedSubjects, setExpandedSubjects] = useState<{ [key: string]: boolean }>({
    'NSI': true,
    'MATH': true
  });

  const [simSubject, setSimSubject] = useState('MATH');
  const [simGradeValue, setSimGradeValue] = useState<number>(18);
  const [simCoefficient, setSimCoefficient] = useState<number>(2);
  const [hasSimulated, setHasSimulated] = useState(false);

  const toggleSubject = (code: string) => {
    setExpandedSubjects(prev => ({
      ...prev,
      [code]: !prev[code]
    }));
  };

  const filteredReports = useMemo(() => {
    if (!globalSearch) return subjectReports;
    return subjectReports.filter(r => 
      r.subject.toLowerCase().includes(globalSearch.toLowerCase()) ||
      r.subjectCode.toLowerCase().includes(globalSearch.toLowerCase()) ||
      r.teacher.toLowerCase().includes(globalSearch.toLowerCase())
    );
  }, [subjectReports, globalSearch]);

  const simulatedStats = useMemo(() => {
    if (!hasSimulated) return null;

    let totalWeighted = 0;
    let totalCoeffs = 0;

    filteredReports.forEach(rep => {
      let subjectAvg = rep.studentAverage;
      if (rep.subjectCode === simSubject) {
        const currentGradesWeight = rep.grades.reduce((acc, g) => acc + (g.value * g.coefficient), 0);
        const currentCoeffs = rep.grades.reduce((acc, g) => acc + g.coefficient, 0);
        const newTotalWeight = currentGradesWeight + (simGradeValue * simCoefficient);
        const newTotalCoeffs = currentCoeffs + simCoefficient;
        subjectAvg = newTotalCoeffs > 0 ? (newTotalWeight / newTotalCoeffs) : rep.studentAverage;
      }

      totalWeighted += subjectAvg * rep.coefficient;
      totalCoeffs += rep.coefficient;
    });

    const newOverall20 = totalCoeffs > 0 ? (totalWeighted / totalCoeffs) : (overallStats.current / 5);
    const newOverall = Number((newOverall20 * 5).toFixed(1));
    const diff = Number((newOverall - overallStats.current).toFixed(1));

    return {
      newOverall,
      diff
    };
  }, [hasSimulated, simSubject, simGradeValue, simCoefficient, filteredReports, overallStats.current]);

  return (
    <div className="space-y-6 pb-12 max-w-6xl mx-auto">
      
      {/* Header with Term Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200/70 shadow-subtle">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Résultats & Notes</h2>
            <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-emerald-50 text-emerald-700">
              Contrôle Continu
            </span>
          </div>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            Moyennes pondérées par les coefficients officiels du Baccalauréat
          </p>
        </div>

        {/* Trimestre Selector */}
        <div className="flex items-center p-1 bg-slate-100 rounded-xl text-xs font-bold">
          {(['T1', 'T2', 'T3'] as const).map(period => (
            <button
              key={period}
              onClick={() => setActivePeriod(period)}
              className={`px-3.5 py-1.5 rounded-lg transition-all ${
                activePeriod === period ? 'bg-white text-slate-900 shadow-subtle' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {period === 'T1' ? '1er Trimestre' : period === 'T2' ? '2ème Trimestre' : '3ème Trimestre'}
            </button>
          ))}
        </div>
      </div>

      {/* Overview & Simulator Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Clean Light Summary Card */}
        <div className="lg:col-span-2 bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/70 shadow-subtle flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Moyenne Générale Pondérée • {activePeriod}
              </span>
              <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-50 text-emerald-700">
                Mention Très Bien estimée
              </span>
            </div>

            <div className="mt-4 flex flex-col sm:flex-row sm:items-baseline gap-4">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900">{overallStats.current}</span>
                <span className="text-slate-400 text-base font-semibold">/ 100</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 w-fit">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>
                  {overallStats.current >= overallStats.previousTerm ? '+' : ''}
                  {Number((overallStats.current - overallStats.previousTerm).toFixed(1))} pts par rapport au trimestre précédent
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-5 border-t border-slate-100 grid grid-cols-3 gap-4">
            <div className="p-3 bg-slate-50/70 rounded-2xl">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Classe</p>
              <p className="text-base font-extrabold text-slate-800 mt-0.5">{overallStats.classAvg} <span className="text-xs font-normal text-slate-400">/ 100</span></p>
            </div>
            <div className="p-3 bg-slate-50/70 rounded-2xl">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Plus basse</p>
              <p className="text-base font-extrabold text-slate-800 mt-0.5">37.0 <span className="text-xs font-normal text-slate-400">/ 100</span></p>
            </div>
            <div className="p-3 bg-slate-50/70 rounded-2xl">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Plus haute</p>
              <p className="text-base font-extrabold text-slate-800 mt-0.5">97.0 <span className="text-xs font-normal text-slate-400">/ 100</span></p>
            </div>
          </div>
        </div>

        {/* Interactive Grade Simulator Card */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/70 shadow-subtle flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Calculator className="w-4 h-4" />
              </div>
              <h3 className="font-extrabold text-slate-900 text-sm">Simulateur de note</h3>
            </div>
            <p className="text-xs text-slate-400 font-medium mb-4">
              Prévois l’impact d’un prochain devoir sur ta moyenne.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">Matière</label>
                <select
                  value={simSubject}
                  onChange={(e) => {
                    setSimSubject(e.target.value);
                    setHasSimulated(true);
                  }}
                  className="w-full px-3 py-2 text-xs font-bold bg-slate-50/80 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  {subjectReports.map(rep => (
                    <option key={rep.subjectCode} value={rep.subjectCode}>
                      {rep.subject} (Coef {rep.coefficient})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">Note espérée (/20)</label>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    step="0.5"
                    value={simGradeValue}
                    onChange={(e) => {
                      setSimGradeValue(Number(e.target.value));
                      setHasSimulated(true);
                    }}
                    className="w-full px-3 py-2 text-xs font-black text-indigo-600 bg-slate-50/80 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">Coefficient</label>
                  <select
                    value={simCoefficient}
                    onChange={(e) => {
                      setSimCoefficient(Number(e.target.value));
                      setHasSimulated(true);
                    }}
                    className="w-full px-3 py-2 text-xs font-bold bg-slate-50/80 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value={1}>Coef. 1</option>
                    <option value={2}>Coef. 2</option>
                    <option value={3}>Coef. 3</option>
                    <option value={4}>Coef. 4</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100">
            {hasSimulated && simulatedStats ? (
              <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold text-indigo-900">Nouvelle moyenne :</p>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-xl font-black text-indigo-700">{simulatedStats.newOverall}</span>
                    <span className="text-xs text-indigo-400">/ 100</span>
                  </div>
                </div>
                <div className={`px-2.5 py-1 rounded-xl text-xs font-extrabold ${
                  simulatedStats.diff >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                }`}>
                  {simulatedStats.diff >= 0 ? `+${simulatedStats.diff}` : `${simulatedStats.diff}`} pts
                </div>
              </div>
            ) : (
              <button
                onClick={() => setHasSimulated(true)}
                className="w-full py-2 bg-slate-900 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold transition-all shadow-subtle"
              >
                Calculer l'impact
              </button>
            )}
          </div>
        </div>

      </div>

      {/* Subjects Detailed Accordion List */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-base text-slate-900">Matières & Détail des évaluations</h3>
          <span className="text-xs text-slate-400 font-medium">{filteredReports.length} matières</span>
        </div>

        {filteredReports.map((report) => {
          const isExpanded = !!expandedSubjects[report.subjectCode];
          const theme = getSubjectTheme(report.subjectCode);

          return (
            <div
              key={report.subjectCode}
              className="bg-white rounded-3xl border border-slate-200/70 shadow-subtle overflow-hidden transition-all"
            >
              {/* Subject Bar */}
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
                        Coef. {report.coefficient}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 font-medium mt-0.5">{report.teacher}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-6 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  <div className="text-right">
                    <div className="flex items-baseline gap-1 justify-end">
                      <span className="text-2xl font-black text-slate-900">{report.studentAverage}</span>
                      <span className="text-xs text-slate-400 font-semibold">/ 20</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Classe : {report.classAverage}
                    </p>
                  </div>

                  <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </div>
              </div>

              {/* Collapsible Content */}
              {isExpanded && (
                <div className="px-5 pb-6 pt-2 border-t border-slate-100 bg-slate-50/40 space-y-4">
                  
                  {/* Appreciation */}
                  <div className="p-3.5 rounded-2xl bg-amber-50/50 border border-amber-200/50 text-xs">
                    <span className="font-bold uppercase tracking-wider text-[10px] text-amber-800 block mb-1">
                      Appréciation de l'enseignant
                    </span>
                    <p className="text-slate-700 italic">
                      « {report.teacherAppreciation} »
                    </p>
                  </div>

                  {/* Grades */}
                  <div>
                    <h5 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                      Évaluations ({report.grades.length})
                    </h5>

                    <div className="space-y-2">
                      {report.grades.map((grade) => (
                        <div
                          key={grade.id}
                          className="bg-white p-3 rounded-2xl border border-slate-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-subtle"
                        >
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-slate-100 text-slate-700 uppercase">
                                {grade.type}
                              </span>
                              <span className="text-xs font-bold text-slate-900">{grade.title}</span>
                            </div>
                            <p className="text-[11px] text-slate-400 flex items-center gap-2">
                              <span>{new Date(grade.date).toLocaleDateString('fr-FR')}</span>
                              <span>•</span>
                              <span>Coef. {grade.coefficient}</span>
                            </p>
                            {grade.teacherComment && (
                              <p className="text-[11px] text-slate-600 mt-1 italic">
                                Remarque : {grade.teacherComment}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                            <div className="text-right">
                              <span className="text-lg font-black text-slate-900">{grade.value}</span>
                              <span className="text-xs text-slate-400 font-semibold"> / {grade.maxValue}</span>
                            </div>
                            <div className="text-[10px] text-slate-400 text-right">
                              <p>Moy. {grade.classAverage}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
