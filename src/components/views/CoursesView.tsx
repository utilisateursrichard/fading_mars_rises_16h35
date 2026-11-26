import React, { useState, useMemo, useEffect } from 'react';
import {
  BookOpen,
  FileText,
  Download,
  UploadCloud,
  CheckCircle2,
  Clock,
  ArrowLeft,
  ChevronRight,
  Mail,
  MessageSquare,
  Search,
  RefreshCw,
  Star,
  LayoutGrid,
  List,
  Atom,
  Trophy,
  Landmark,
  Languages,
  Folder,
  Presentation,
  Sparkles,
  Calculator,
  Globe,
  MapPin,
  User,
  X,
  Info
} from 'lucide-react';
import { useSchool } from '../../context/SchoolContext';
import { useUITheme } from '../../context/UIThemeContext';
import { getThemeTokens } from '../../utils/themeTokens';
import { SubjectCourse, Homework } from '../../types/school';
import { getSubjectTheme, SubjectTheme } from '../../utils/theme';
import { getSmartschoolCourseIconUrl } from '../../services/smartschoolParsers';

const CATEGORY_LABELS: Record<string, string> = {
  own: 'Mes cours',
  titu: 'Titulariat',
  community: 'Communautés',
  virtual: 'Cours virtuels'
};

const getCourseIconComponent = (iconName?: string): React.ElementType => {
  const icon = (iconName || '').toLowerCase();
  if (icon === 'man_mage') return Sparkles;
  if (icon === 'schoolbord') return Presentation;
  if (icon === 'atom') return Atom;
  if (icon === 'trophy') return Trophy;
  if (icon === 'courthouse') return Landmark;
  if (icon === 'calculator') return Calculator;
  if (icon === 'globe') return Globe;
  if (icon.startsWith('alphabet_')) return Languages;
  if (icon.startsWith('folder')) return Folder;
  return BookOpen;
};

const normalizeMatch = (str: string): string =>
  (str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

interface CourseIconBadgeProps {
  course: SubjectCourse;
  theme: SubjectTheme;
  size?: 'sm' | 'md' | 'lg';
}

const CourseIconBadge: React.FC<CourseIconBadgeProps> = ({ course, theme, size = 'md' }) => {
  const svgUrl = course.iconUrl || getSmartschoolCourseIconUrl(course.icon);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [svgUrl]);

  const FallbackIcon = getCourseIconComponent(course.icon);
  const sizeStyles =
    size === 'lg'
      ? { box: 'w-14 h-14 rounded-2xl', img: 'w-7 h-7', icon: 'w-7 h-7' }
      : size === 'sm'
        ? { box: 'w-9 h-9 rounded-xl', img: 'w-5 h-5', icon: 'w-4 h-4' }
        : { box: 'w-10 h-10 rounded-2xl', img: 'w-6 h-6', icon: 'w-5 h-5' };

  return (
    <div
      className={`${sizeStyles.box} flex items-center justify-center border shrink-0 shadow-2xs overflow-hidden`}
      style={{
        backgroundColor: theme.bgLight,
        color: theme.text,
        borderColor: theme.border
      }}
    >
      {svgUrl && !imgError ? (
        <img
          src={svgUrl}
          alt={course.subject}
          className={`${sizeStyles.img} object-contain`}
          onError={() => setImgError(true)}
        />
      ) : (
        <FallbackIcon className={sizeStyles.icon} />
      )}
    </div>
  );
};

export const CoursesView: React.FC = () => {
  const {
    courses,
    coursesLoading,
    refreshCourses,
    selectedCourseId,
    setSelectedCourseId,
    startDirectMessageWithTeacher,
    globalSearch,
    homeworks,
    isDemoMode,
    isInsideSmartschoolPlatform
  } = useSchool();
  const { uiTheme } = useUITheme();
  const tk = getThemeTokens(uiTheme);

  const [activeCourseTab, setActiveCourseTab] = useState<'chapters' | 'assignments' | 'info'>('chapters');
  const [submittedAssignments, setSubmittedAssignments] = useState<{ [key: string]: boolean }>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [onlyFavourites, setOnlyFavourites] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const selectedCourse = useMemo(
    () => courses.find(c => c.id === selectedCourseId) || null,
    [courses, selectedCourseId]
  );

  const favouritesCount = useMemo(
    () => courses.filter(c => c.isFavourite).length,
    [courses]
  );

  const availableCategories = useMemo(() => {
    const cats = new Set<string>();
    for (const c of courses) {
      if (c.categoryType) cats.add(c.categoryType);
    }
    return Array.from(cats);
  }, [courses]);

  const effectiveQuery = (searchQuery || globalSearch).trim().toLowerCase();

  const filteredCourses = useMemo(() => {
    return courses.filter(c => {
      if (onlyFavourites && !c.isFavourite) return false;
      if (selectedCategory !== 'all' && c.categoryType !== selectedCategory) return false;

      if (effectiveQuery) {
        const matchSubject = c.subject.toLowerCase().includes(effectiveQuery);
        const matchDescr = (c.description || '').toLowerCase().includes(effectiveQuery);
        const matchTeacher = c.teacher.toLowerCase().includes(effectiveQuery);
        const matchTrigram = (c.teacherTrigram || '').toLowerCase().includes(effectiveQuery);
        const matchCode = c.subjectCode.toLowerCase().includes(effectiveQuery);
        if (!matchSubject && !matchDescr && !matchTeacher && !matchTrigram && !matchCode) {
          return false;
        }
      }

      return true;
    });
  }, [courses, onlyFavourites, selectedCategory, effectiveQuery]);

  // Devoirs associés à un cours (par correspondance de nom ou code matière)
  const getLinkedHomeworks = (course: SubjectCourse): Homework[] => {
    const cName = normalizeMatch(course.subject);
    const cCode = normalizeMatch(course.subjectCode);
    return homeworks.filter(hw => {
      const hSubj = normalizeMatch(hw.subject);
      const hCode = normalizeMatch(hw.subjectCode);
      if (hSubj && cName && (hSubj === cName || hSubj.includes(cName) || cName.includes(hSubj))) {
        return true;
      }
      return Boolean(cCode && hCode && cCode === hCode);
    });
  };

  const handleSimulateSubmit = (asgId: string) => {
    setSubmittedAssignments(prev => ({ ...prev, [asgId]: true }));
    alert('Fichier téléversé avec succès ! Votre enseignant recevra une notification.');
  };

  // Vue Détaillée d'un cours
  if (selectedCourse) {
    const theme = getSubjectTheme(selectedCourse.subjectCode || selectedCourse.subject);
    const hasLegacyContent =
      isDemoMode ||
      selectedCourse.chapters.length > 0 ||
      selectedCourse.assignments.length > 0;
    const linkedHomeworks = getLinkedHomeworks(selectedCourse);

    return (
      <div className="space-y-6 pb-12 max-w-6xl mx-auto animate-in fade-in duration-200">
        {/* Bouton Retour */}
        <button
          onClick={() => setSelectedCourseId(null)}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-subtle transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Tous les cours</span>
        </button>

        {/* Hero du cours */}
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4 min-w-0">
            <CourseIconBadge course={selectedCourse} theme={theme} size="lg" />

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-black border uppercase tracking-wider ${theme.badgeClass}`}>
                  {selectedCourse.subjectCode}
                </span>
                {selectedCourse.isFavourite && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200/70">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                    <span>Favori</span>
                  </span>
                )}
                {selectedCourse.hoursPerWeek > 0 && (
                  <span className="text-xs font-bold text-slate-400">
                    {selectedCourse.hoursPerWeek}h par semaine
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight break-words">
                {selectedCourse.subject}
              </h1>

              {selectedCourse.description && (
                <p className="text-sm text-slate-600 font-medium mt-1">
                  {selectedCourse.description}
                </p>
              )}

              <p className="text-xs sm:text-sm text-slate-500 font-medium mt-2 flex flex-wrap items-center gap-2.5">
                <span className="inline-flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>Enseignant : <strong className="text-slate-700">{selectedCourse.teacher}</strong></span>
                  {selectedCourse.teacherTrigram && (
                    <span className="px-1.5 py-0.5 rounded-md bg-slate-900 text-white text-[10px] font-black tracking-wider">
                      {selectedCourse.teacherTrigram}
                    </span>
                  )}
                </span>
                {selectedCourse.room && (
                  <>
                    <span className="text-slate-300">•</span>
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{selectedCourse.room}</span>
                    </span>
                  </>
                )}
                {selectedCourse.nextExam && (
                  <>
                    <span className="text-slate-300">•</span>
                    <span className="text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded-md">
                      {selectedCourse.nextExam}
                    </span>
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="shrink-0 flex items-center gap-2.5">
            <button
              onClick={() => startDirectMessageWithTeacher(selectedCourse.teacher)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-indigo-600 text-white text-xs font-bold transition-all shadow-subtle m3-press"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Contacter</span>
            </button>
          </div>
        </div>

        {hasLegacyContent ? (
          <>
            {/* Onglets Mode Démo / Contenu structuré */}
            <div className={`flex px-3 ${tk.card} ${tk.tabBar} overflow-x-auto`}>
              <button
                onClick={() => setActiveCourseTab('chapters')}
                className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 shrink-0 ${
                  activeCourseTab === 'chapters' ? tk.tabActive : tk.tabIdle
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>Chapitres & Documents ({selectedCourse.chapters.length})</span>
              </button>
              <button
                onClick={() => setActiveCourseTab('assignments')}
                className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 shrink-0 ${
                  activeCourseTab === 'assignments' ? tk.tabActive : tk.tabIdle
                }`}
              >
                <UploadCloud className="w-4 h-4" />
                <span>Devoirs & Rendu ({selectedCourse.assignments.length})</span>
              </button>
              <button
                onClick={() => setActiveCourseTab('info')}
                className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 shrink-0 ${
                  activeCourseTab === 'info' ? tk.tabActive : tk.tabIdle
                }`}
              >
                <Mail className="w-4 h-4" />
                <span>Contact Enseignant</span>
              </button>
            </div>

            {activeCourseTab === 'chapters' && (
              <div className="space-y-4">
                {selectedCourse.chapters.map((chap) => (
                  <div
                    key={chap.id}
                    className={`${tk.card} p-5 sm:p-6`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase ${
                        chap.status === 'completed'
                          ? tk.isDarkTheme ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-50 text-emerald-700'
                          : chap.status === 'in_progress'
                            ? tk.isDarkTheme ? 'bg-indigo-500/20 text-indigo-300' : 'bg-indigo-50 text-indigo-700'
                            : `${tk.subSurface} ${tk.textSecondary}`
                      }`}>
                        {chap.status === 'completed' ? 'Terminé' : chap.status === 'in_progress' ? 'En cours' : 'À venir'}
                      </span>
                      <h3 className={`font-extrabold text-sm sm:text-base ${tk.textPrimary}`}>{chap.title}</h3>
                    </div>
                    <p className={`text-xs ${tk.textMuted}`}>{chap.description}</p>

                    <div className={`mt-4 pt-4 border-t ${tk.borderSubtle} space-y-2`}>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {chap.documents.map((doc) => (
                          <div
                            key={doc.id}
                            className={`flex items-center justify-between p-3 ${tk.subSurface} border ${tk.borderSubtle} transition-colors`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <FileText className="w-4 h-4 text-indigo-500 shrink-0" />
                              <div className="min-w-0">
                                <p className={`text-xs font-bold truncate ${tk.textPrimary}`}>{doc.title}</p>
                                <p className={`text-[10px] ${tk.textMuted}`}>{doc.size} • Déposé le {doc.uploadDate}</p>
                              </div>
                            </div>
                            <button
                              onClick={() => alert(`Téléchargement de : ${doc.title}`)}
                              className={`p-1.5 ${tk.secondaryBtn} shrink-0 ml-2`}
                              title="Télécharger"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeCourseTab === 'assignments' && (
              <div className="space-y-4">
                {selectedCourse.assignments.map((asg) => {
                  const isLocalSubmitted = submittedAssignments[asg.id];
                  const isDone = asg.status === 'submitted' || asg.status === 'graded' || isLocalSubmitted;

                  return (
                    <div
                      key={asg.id}
                      className={`${tk.card} p-5 sm:p-6`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full ${
                              isDone
                                ? tk.isDarkTheme ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-50 text-emerald-700'
                                : tk.isDarkTheme ? 'bg-amber-500/20 text-amber-300' : 'bg-amber-50 text-amber-800'
                            }`}>
                              {isDone ? 'Devoir remis' : 'À rendre en ligne'}
                            </span>
                            <span className={`text-xs font-semibold ${tk.textMuted}`}>Barème : {asg.points} pts</span>
                          </div>
                          <h3 className={`font-extrabold text-base mt-1 ${tk.textPrimary}`}>{asg.title}</h3>
                          <p className={`text-xs mt-0.5 flex items-center gap-1.5 ${tk.textMuted}`}>
                            <Clock className="w-3.5 h-3.5 opacity-60" />
                            <span>Échéance : {asg.dueDate}</span>
                          </p>
                        </div>

                        <div>
                          {isDone ? (
                            <div className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border ${
                              tk.isDarkTheme ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' : 'bg-emerald-50 text-emerald-700 border-emerald-200/60'
                            }`}>
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Rendu validé</span>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleSimulateSubmit(asg.id)}
                              className={`flex items-center gap-2 px-4 py-2 text-xs ${tk.primaryBtn}`}
                            >
                              <UploadCloud className="w-4 h-4" />
                              <span>Déposer mon devoir</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {asg.status === 'graded' && asg.obtainedGrade && (
                        <div className={`mt-4 pt-4 border-t ${tk.borderSubtle} p-3 ${tk.subSurface} flex items-center justify-between`}>
                          <div>
                            <p className={`text-xs font-bold ${tk.textPrimary}`}>Note : {asg.obtainedGrade} / {asg.points}</p>
                            <p className={`text-[11px] mt-0.5 italic ${tk.textSecondary}`}>{asg.feedback}</p>
                          </div>
                          <CheckCircle2 className="w-5 h-5 text-indigo-500" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {activeCourseTab === 'info' && (
              <div className={`${tk.card} p-6 max-w-lg`}>
                <h3 className={`font-extrabold text-base mb-4 ${tk.textPrimary}`}>Contact Enseignant</h3>
                <div className="space-y-2.5 text-xs">
                  <div className={`flex items-center justify-between p-3 ${tk.subSurface}`}>
                    <span className={`font-medium ${tk.textMuted}`}>Professeur :</span>
                    <span className={`font-bold ${tk.textPrimary}`}>{selectedCourse.teacher}</span>
                  </div>
                  {selectedCourse.teacherEmail && (
                    <div className={`flex items-center justify-between p-3 ${tk.subSurface}`}>
                      <span className={`font-medium ${tk.textMuted}`}>Courriel :</span>
                      <span className="font-mono text-indigo-500 font-medium">{selectedCourse.teacherEmail}</span>
                    </div>
                  )}
                  {selectedCourse.room && (
                    <div className={`flex items-center justify-between p-3 ${tk.subSurface}`}>
                      <span className={`font-medium ${tk.textMuted}`}>Salle habituelle :</span>
                      <span className={`font-bold ${tk.textPrimary}`}>{selectedCourse.room}</span>
                    </div>
                  )}
                </div>

                <div className={`mt-5 pt-4 border-t ${tk.borderSubtle}`}>
                  <button
                    onClick={() => startDirectMessageWithTeacher(selectedCourse.teacher)}
                    className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 text-xs ${tk.primaryBtn}`}
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Écrire à {selectedCourse.teacher}</span>
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          /* Vue Mode Réel : Fiche complète du cours Smartschool & devoirs liés */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className={`${tk.card} p-6 space-y-4`}>
              <div className="flex items-center justify-between">
                <h3 className={`font-extrabold text-base ${tk.textPrimary}`}>Informations Smartschool</h3>
                {selectedCourse.courseId !== undefined && (
                  <span className={`px-2.5 py-0.5 rounded-lg ${tk.subSurface} ${tk.textSecondary} font-mono text-[11px] font-bold`}>
                    ID #{selectedCourse.courseId}
                  </span>
                )}
              </div>

              <div className="space-y-2.5 text-xs">
                <div className={`flex items-center justify-between p-3 ${tk.subSurface} gap-4`}>
                  <span className={`font-medium shrink-0 ${tk.textMuted}`}>Intitulé :</span>
                  <span className={`font-bold text-right ${tk.textPrimary}`}>{selectedCourse.subject}</span>
                </div>
                {selectedCourse.description && (
                  <div className={`flex items-center justify-between p-3 ${tk.subSurface} gap-4`}>
                    <span className={`font-medium shrink-0 ${tk.textMuted}`}>Description :</span>
                    <span className={`font-semibold text-right ${tk.textSecondary}`}>{selectedCourse.description}</span>
                  </div>
                )}
                <div className={`flex items-center justify-between p-3 ${tk.subSurface} gap-4`}>
                  <span className={`font-medium shrink-0 ${tk.textMuted}`}>Enseignant :</span>
                  <span className={`font-bold text-right ${tk.textPrimary}`}>
                    {selectedCourse.teacher}
                    {selectedCourse.teacherTrigram ? ` (${selectedCourse.teacherTrigram})` : ''}
                  </span>
                </div>
                {selectedCourse.room && (
                  <div className={`flex items-center justify-between p-3 ${tk.subSurface} gap-4`}>
                    <span className={`font-medium shrink-0 ${tk.textMuted}`}>Salle habituelle :</span>
                    <span className={`font-bold text-right ${tk.textPrimary}`}>{selectedCourse.room}</span>
                  </div>
                )}
                {selectedCourse.url && (
                  <div className={`flex items-center justify-between p-3 ${tk.subSurface} gap-4`}>
                    <span className={`font-medium shrink-0 ${tk.textMuted}`}>Route Smartschool :</span>
                    <span className="font-mono text-[11px] text-indigo-500 font-medium truncate">
                      {selectedCourse.url}
                    </span>
                  </div>
                )}
              </div>

              <div className={`p-3.5 ${tk.subSurface} border ${tk.borderSubtle} flex items-start gap-2.5 text-xs ${tk.textSecondary}`}>
                <Info className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                <p>
                  L’exploration des documents, dossiers et actualités internes de ce cours sera ajoutée dans les prochaines étapes.
                </p>
              </div>
            </div>

            <div className={`${tk.card} p-6 space-y-4`}>
              <div className="flex items-center justify-between">
                <h3 className={`font-extrabold text-base ${tk.textPrimary}`}>Devoirs liés à ce cours</h3>
                <span className={`px-2.5 py-0.5 rounded-full ${tk.subSurface} ${tk.textSecondary} text-xs font-bold`}>
                  {linkedHomeworks.length}
                </span>
              </div>

              {linkedHomeworks.length === 0 ? (
                <div className={`p-8 text-center ${tk.subSurface} border ${tk.borderSubtle} text-xs ${tk.textMuted}`}>
                  Aucun devoir à venir détecté dans l’agenda pour ce cours.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {linkedHomeworks.map(hw => (
                    <div
                      key={hw.id}
                      className={`p-3.5 ${tk.subSurface} border ${tk.borderSubtle} flex items-start justify-between gap-3`}
                    >
                      <div className="min-w-0">
                        <p className={`text-xs font-bold ${hw.isCompleted ? `line-through ${tk.textMuted}` : tk.textPrimary}`}>
                          {hw.title}
                        </p>
                        {hw.description && (
                          <p className={`text-[11px] mt-0.5 line-clamp-1 ${tk.textMuted}`}>{hw.description}</p>
                        )}
                      </div>
                      <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold shrink-0 ${
                        hw.isCompleted
                          ? tk.isDarkTheme ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                          : tk.isDarkTheme ? 'bg-amber-500/20 text-amber-300' : 'bg-amber-50 text-amber-800 border border-amber-200/60'
                      }`}>
                        {hw.isCompleted ? 'Fait' : hw.dueDate}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div className={`pt-2 border-t ${tk.borderSubtle}`}>
                <button
                  onClick={() => startDirectMessageWithTeacher(selectedCourse.teacher)}
                  className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 text-xs ${tk.primaryBtn}`}
                >
                  <Mail className="w-4 h-4" />
                  <span>Écrire à {selectedCourse.teacher}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Vue Liste Complète des Cours
  return (
    <div className="space-y-6 pb-16 max-w-7xl mx-auto animate-in fade-in duration-300">
      {/* Hero Header adapté au thème */}
      <div className={`p-6 sm:p-8 relative overflow-hidden transition-all ${tk.heroBanner}`}>
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex flex-wrap items-center gap-2.5 mb-2">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                  tk.isDarkHero
                    ? 'bg-white/10 text-white'
                    : 'bg-indigo-50 text-indigo-700 border border-indigo-200/60'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Espace Cours</span>
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-black ${tk.pillSwitchActive}`}>
                {courses.length} {courses.length > 1 ? 'cours' : 'cours'}
              </span>
              {favouritesCount > 0 && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200/60">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                  <span>{favouritesCount} {favouritesCount > 1 ? 'favoris' : 'favori'}</span>
                </span>
              )}
            </div>

            <h1 className={`text-2xl sm:text-3xl font-black tracking-tight ${tk.heroTitle}`}>
              Liste de vos cours
            </h1>
            <p className={`text-xs sm:text-sm font-medium mt-1 ${tk.heroSubtitle}`}>
              {isDemoMode
                ? 'Fiches de cours, chapitres, supports de révision et dépôts de devoirs'
                : 'Vos cours Smartschool synchronisés avec leurs enseignants et favoris.'}
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => refreshCourses()}
              disabled={coursesLoading}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold shadow-xs transition-all active:scale-95 disabled:opacity-50"
              title="Actualiser la liste des cours"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${coursesLoading ? 'animate-spin text-indigo-600' : ''}`} />
              <span className="hidden sm:inline">Actualiser</span>
            </button>

            <div className="inline-flex items-center p-1 bg-slate-100 rounded-2xl border border-slate-200/80">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-xl transition-all ${
                  viewMode === 'grid'
                    ? 'bg-white text-indigo-600 shadow-xs font-bold'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
                title="Vue en grille"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-xl transition-all ${
                  viewMode === 'list'
                    ? 'bg-white text-indigo-600 shadow-xs font-bold'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
                title="Vue en liste"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Barre de recherche & Filtres rapides */}
        <div className="mt-6 pt-6 border-t border-slate-100 flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Rechercher un cours, une description ou un professeur..."
              className="w-full pl-10 pr-9 py-2.5 rounded-2xl bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200/80 focus:border-indigo-500 text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-hidden transition-all shadow-2xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {favouritesCount > 0 && (
            <button
              onClick={() => setOnlyFavourites(prev => !prev)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl text-xs font-bold border transition-all active:scale-95 shrink-0 ${
                onlyFavourites
                  ? 'bg-amber-500 text-white border-amber-600 shadow-xs shadow-amber-500/20'
                  : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200'
              }`}
            >
              <Star className={`w-3.5 h-3.5 ${onlyFavourites ? 'fill-white' : 'text-amber-500'}`} />
              <span>Favoris ({favouritesCount})</span>
            </button>
          )}
        </div>

        {availableCategories.length > 1 && (
          <div className="mt-4 flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all shrink-0 ${
                selectedCategory === 'all'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              Tous ({courses.length})
            </button>
            {availableCategories.map(cat => {
              const count = courses.filter(c => c.categoryType === cat).length;
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(isSelected ? 'all' : cat)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all shrink-0 ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-xs shadow-indigo-600/20'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                  }`}
                >
                  {CATEGORY_LABELS[cat] || cat} <span className="text-[10px] opacity-75 font-normal">({count})</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Squelette de chargement */}
      {coursesLoading && courses.length === 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="bg-white rounded-3xl p-5 border border-slate-200/80 animate-pulse space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-slate-200" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-slate-200 rounded-md w-3/4" />
                  <div className="h-3 bg-slate-100 rounded-md w-1/2" />
                </div>
              </div>
              <div className="h-6 bg-slate-100 rounded-xl w-full" />
              <div className="h-8 bg-slate-100 rounded-2xl w-full" />
            </div>
          ))}
        </div>
      )}

      {/* État vide */}
      {!coursesLoading && filteredCourses.length === 0 && (
        <div className="bg-white/80 backdrop-blur-xl border border-slate-200/80 rounded-3xl p-12 text-center max-w-md mx-auto space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
            <BookOpen className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {effectiveQuery || onlyFavourites || selectedCategory !== 'all'
                ? 'Aucun cours trouvé'
                : 'Aucun cours synchronisé'}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {effectiveQuery || onlyFavourites || selectedCategory !== 'all'
                ? 'Aucun cours ne correspond à vos critères de recherche.'
                : isInsideSmartschoolPlatform
                  ? 'Cliquez sur Actualiser pour charger vos cours depuis Smartschool.'
                  : 'Ouvrez Smartschool et lancez le favori BetterSchool pour synchroniser vos cours.'}
            </p>
          </div>
          {(effectiveQuery || onlyFavourites || selectedCategory !== 'all') ? (
            <button
              onClick={() => {
                setSearchQuery('');
                setOnlyFavourites(false);
                setSelectedCategory('all');
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-indigo-600 text-white text-xs font-bold transition-all"
            >
              <span>Réinitialiser les filtres</span>
            </button>
          ) : isInsideSmartschoolPlatform ? (
            <button
              onClick={() => refreshCourses()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-indigo-600 text-white text-xs font-bold transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Actualiser les cours</span>
            </button>
          ) : null}
        </div>
      )}

      {/* Vue Grille */}
      {viewMode === 'grid' && filteredCourses.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {filteredCourses.map(c => {
            const theme = getSubjectTheme(c.subjectCode || c.subject);
            const linkedCount = getLinkedHomeworks(c).filter(h => !h.isCompleted).length;

            return (
              <div
                key={c.id}
                onClick={() => setSelectedCourseId(c.id)}
                className={`cursor-pointer group p-5 sm:p-6 flex flex-col justify-between relative overflow-hidden ${tk.interactiveCard}`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3.5">
                    <div className="flex items-center gap-2.5">
                      <CourseIconBadge course={c} theme={theme} size="md" />
                      <span className={`px-2.5 py-0.5 text-[10px] font-black rounded-lg border uppercase tracking-wider ${theme.badgeClass}`}>
                        {c.subjectCode}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {c.isFavourite && (
                        <span
                          className={`p-1.5 rounded-xl border ${
                            tk.isDarkTheme
                              ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                              : 'bg-amber-50 border-amber-200/60 text-amber-500'
                          }`}
                          title="Cours favori"
                        >
                          <Star className="w-3.5 h-3.5 fill-amber-400" />
                        </span>
                      )}
                      {c.hoursPerWeek > 0 && (
                        <span className={`text-[11px] font-semibold ${tk.textMuted}`}>
                          {c.hoursPerWeek}h/sem
                        </span>
                      )}
                    </div>
                  </div>

                  <h3 className={`text-base sm:text-lg font-extrabold transition-colors leading-snug ${tk.textPrimary}`}>
                    {c.subject}
                  </h3>

                  {c.description && (
                    <p className={`text-xs font-medium mt-1 line-clamp-2 ${tk.textMuted}`}>
                      {c.description}
                    </p>
                  )}

                  <div className={`mt-3 flex flex-wrap items-center gap-2 text-xs font-medium ${tk.textSecondary}`}>
                    <span className="inline-flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 opacity-60" />
                      <span>{c.teacher}</span>
                    </span>
                    {c.teacherTrigram && (
                      <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-black tracking-wider ${tk.subSurface} ${tk.textSecondary}`}>
                        {c.teacherTrigram}
                      </span>
                    )}
                    {c.room && (
                      <span className={`inline-flex items-center gap-1 text-[11px] ${tk.textMuted}`}>
                        <MapPin className="w-3 h-3 opacity-60" />
                        <span>{c.room}</span>
                      </span>
                    )}
                  </div>
                </div>

                <div className={`mt-5 pt-4 border-t ${tk.borderSubtle} flex items-center justify-between gap-2 text-xs font-bold ${tk.textSecondary}`}>
                  <span className={`text-[11px] font-semibold ${tk.textMuted}`}>
                    {c.chapters.length > 0 || c.assignments.length > 0
                      ? `${c.chapters.length} chapitres • ${c.assignments.length} devoirs`
                      : linkedCount > 0
                        ? `${linkedCount} devoir(s) à faire`
                        : (CATEGORY_LABELS[c.categoryType || ''] || 'Cours Smartschool')}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        startDirectMessageWithTeacher(c.teacher);
                      }}
                      className={`p-1.5 ${tk.secondaryBtn}`}
                      title={`Contacter ${c.teacher}`}
                    >
                      <Mail className="w-3.5 h-3.5" />
                    </button>
                    <div className="flex items-center gap-0.5 group-hover:translate-x-0.5 transition-all">
                      <span>Accéder</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Vue Liste */}
      {viewMode === 'list' && filteredCourses.length > 0 && (
        <div className={`${tk.card} overflow-hidden`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className={`${tk.tableHeader} text-[11px] font-black uppercase tracking-wider`}>
                  <th className="py-3.5 px-5">Cours</th>
                  <th className="py-3.5 px-4">Code</th>
                  <th className="py-3.5 px-4">Description</th>
                  <th className="py-3.5 px-4">Enseignant</th>
                  <th className="py-3.5 px-4 text-center">Favori</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${tk.divider} text-xs sm:text-sm font-medium`}>
                {filteredCourses.map(c => {
                  const theme = getSubjectTheme(c.subjectCode || c.subject);
                  return (
                    <tr
                      key={c.id}
                      onClick={() => setSelectedCourseId(c.id)}
                      className={`${tk.tableRowHover} transition-colors cursor-pointer group`}
                    >
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <CourseIconBadge course={c} theme={theme} size="sm" />
                          <span className={`font-bold transition-colors ${tk.textPrimary}`}>
                            {c.subject}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black border uppercase ${theme.badgeClass}`}>
                          {c.subjectCode}
                        </span>
                      </td>
                      <td className={`py-3.5 px-4 text-xs max-w-xs truncate ${tk.textMuted}`}>
                        {c.description || <span className="opacity-40">—</span>}
                      </td>
                      <td className={`py-3.5 px-4 text-xs ${tk.textSecondary}`}>
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold">{c.teacher}</span>
                          {c.teacherTrigram && (
                            <span className={`px-1.5 py-0.5 rounded ${tk.subSurface} font-mono text-[10px] font-bold`}>
                              {c.teacherTrigram}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {c.isFavourite ? (
                          <Star className="w-4 h-4 fill-amber-400 text-amber-500 inline-block" />
                        ) : (
                          <span className="opacity-40">—</span>
                        )}
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              startDirectMessageWithTeacher(c.teacher);
                            }}
                            className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-xs ${tk.secondaryBtn}`}
                            title={`Contacter ${c.teacher}`}
                          >
                            <Mail className="w-3.5 h-3.5" />
                            <span>Contacter</span>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedCourseId(c.id);
                            }}
                            className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-xs ${tk.primaryBtn}`}
                          >
                            <span>Ouvrir</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
