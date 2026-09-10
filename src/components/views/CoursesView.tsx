import React, { useState } from 'react';
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
  MessageSquare
} from 'lucide-react';
import { useSchool } from '../../context/SchoolContext';
import { getSubjectTheme } from '../../utils/theme';

export const CoursesView: React.FC = () => {
  const { 
    courses, 
    selectedCourseId, 
    setSelectedCourseId, 
    startDirectMessageWithTeacher,
    globalSearch 
  } = useSchool();

  const [activeCourseTab, setActiveCourseTab] = useState<'chapters' | 'assignments' | 'info'>('chapters');
  const [submittedAssignments, setSubmittedAssignments] = useState<{ [key: string]: boolean }>({});

  const selectedCourse = courses.find(c => c.id === selectedCourseId);

  const filteredCourses = courses.filter(c => {
    if (!globalSearch) return true;
    return c.subject.toLowerCase().includes(globalSearch.toLowerCase()) ||
           c.teacher.toLowerCase().includes(globalSearch.toLowerCase()) ||
           c.subjectCode.toLowerCase().includes(globalSearch.toLowerCase());
  });

  const handleSimulateSubmit = (asgId: string) => {
    setSubmittedAssignments(prev => ({ ...prev, [asgId]: true }));
    alert('Fichier téléversé avec succès ! Votre enseignant recevra une notification.');
  };

  return (
    <div className="space-y-6 pb-12 max-w-6xl mx-auto">
      
      {selectedCourse ? (
        /* Detailed Course View */
        <div className="space-y-6">
          {/* Back button */}
          <button
            onClick={() => setSelectedCourseId(null)}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white px-4 py-2 rounded-full border border-slate-200/80 shadow-subtle transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Toutes les matières</span>
          </button>

          {/* Clean Course Hero */}
          {(() => {
            const theme = getSubjectTheme(selectedCourse.subjectCode);
            return (
              <div className="bg-gradient-to-br from-white via-white to-indigo-50/20 rounded-[32px] p-6 sm:p-8 border border-indigo-100/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-2.5">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border uppercase tracking-wider ${theme.badgeClass}`}>
                      <span className={`w-2 h-2 rounded-full ${theme.dotClass}`} />
                      {selectedCourse.subjectCode}
                    </span>
                    <span className="text-xs font-bold text-slate-400 tabular-nums">
                      {selectedCourse.hoursPerWeek}h par semaine
                    </span>
                  </div>

                  <h1 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
                    {selectedCourse.subject}
                  </h1>

                  <p className="text-xs sm:text-sm text-slate-500 font-semibold mt-2 flex flex-wrap items-center gap-2.5">
                    <span>Enseignant : <strong className="text-slate-800 font-black">{selectedCourse.teacher}</strong></span>
                    <span>•</span>
                    <span className="font-bold text-slate-700">{selectedCourse.room}</span>
                    {selectedCourse.nextExam && (
                      <>
                        <span>•</span>
                        <span className="text-amber-900 font-black bg-amber-50 px-2.5 py-0.5 rounded-full text-xs border border-amber-200/80">
                          {selectedCourse.nextExam}
                        </span>
                      </>
                    )}
                  </p>
                </div>

                {/* Progress bar card */}
                <div className="bg-slate-50/90 p-5 rounded-[24px] border border-slate-200/70 min-w-[220px]">
                  <div className="flex items-center justify-between text-xs font-black mb-2">
                    <span className="text-slate-500">Progression</span>
                    <span className="text-slate-950 tabular-nums font-black">{selectedCourse.progressPercent}%</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-200/70 rounded-full overflow-hidden p-0.5">
                    <div 
                      className="h-full bg-gradient-to-r from-indigo-600 to-violet-600 rounded-full transition-all"
                      style={{ width: `${selectedCourse.progressPercent}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })()}

          {/* M3E Segmented Pills Tabs */}
          <div className="flex p-1.5 bg-white/90 backdrop-blur-md rounded-full w-fit max-w-full overflow-x-auto text-xs font-bold gap-1 border border-indigo-100/80 shadow-xs">
            <button
              onClick={() => setActiveCourseTab('chapters')}
              className={`py-2 px-4 rounded-full transition-all flex items-center gap-2 shrink-0 m3-press ${
                activeCourseTab === 'chapters'
                  ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-black shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Chapitres & Documents ({selectedCourse.chapters.length})</span>
            </button>
            <button
              onClick={() => setActiveCourseTab('assignments')}
              className={`py-2 px-4 rounded-full transition-all flex items-center gap-2 shrink-0 m3-press ${
                activeCourseTab === 'assignments'
                  ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-black shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <UploadCloud className="w-4 h-4" />
              <span>Devoirs & Dépôts ({selectedCourse.assignments.length})</span>
            </button>
            <button
              onClick={() => setActiveCourseTab('info')}
              className={`py-2 px-4 rounded-full transition-all flex items-center gap-2 shrink-0 m3-press ${
                activeCourseTab === 'info'
                  ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-black shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Mail className="w-4 h-4" />
              <span>Contact Enseignant</span>
            </button>
          </div>

          {/* Tab 1: Chapitres */}
          {activeCourseTab === 'chapters' && (
            <div className="space-y-3.5">
              {selectedCourse.chapters.map((chap) => (
                <div 
                  key={chap.id}
                  className="bg-white rounded-[28px] p-6 sm:p-7 border border-indigo-100/80 shadow-xs hover:border-indigo-200 transition-all"
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={`px-3 py-1 text-xs font-black rounded-full uppercase ${
                      chap.status === 'completed' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/80' :
                      chap.status === 'in_progress' ? 'bg-indigo-50 text-indigo-800 border border-indigo-200/80' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {chap.status === 'completed' ? 'Terminé' : chap.status === 'in_progress' ? 'En cours' : 'À venir'}
                    </span>
                    <h3 className="font-black text-base text-slate-950">{chap.title}</h3>
                  </div>
                  <p className="text-xs text-slate-500 font-medium mt-1">{chap.description}</p>

                  <div className="mt-5 pt-4 border-t border-slate-100 space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {chap.documents.map((doc) => (
                        <div
                          key={doc.id}
                          className="flex items-center justify-between p-3.5 rounded-[20px] bg-slate-50/80 hover:bg-indigo-50/40 border border-slate-200/70 transition-colors group"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">{doc.title}</p>
                              <p className="text-[10px] font-medium text-slate-400 tabular-nums">{doc.size} • Déposé le {doc.uploadDate}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => alert(`Téléchargement de : ${doc.title}`)}
                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-full transition-colors shrink-0 ml-2 m3-press"
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

          {/* Tab 2: Devoirs */}
          {activeCourseTab === 'assignments' && (
            <div className="space-y-3.5">
              {selectedCourse.assignments.map((asg) => {
                const isLocalSubmitted = submittedAssignments[asg.id];
                const isDone = asg.status === 'submitted' || asg.status === 'graded' || isLocalSubmitted;

                return (
                  <div
                    key={asg.id}
                    className="bg-white rounded-[28px] p-6 sm:p-7 border border-indigo-100/80 shadow-xs"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`px-3 py-1 text-xs font-black rounded-full border ${
                            isDone ? 'bg-emerald-50 text-emerald-800 border-emerald-200/80' : 'bg-amber-50 text-amber-900 border-amber-200/80'
                          }`}>
                            {isDone ? 'Devoir remis' : 'À rendre en ligne'}
                          </span>
                          <span className="text-xs font-bold text-slate-400 tabular-nums">Barème : {asg.points} pts</span>
                        </div>
                        <h3 className="font-black text-base sm:text-lg text-slate-950 mt-1.5">{asg.title}</h3>
                        <p className="text-xs text-slate-500 font-semibold mt-1 flex items-center gap-1.5 tabular-nums">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>Échéance : {asg.dueDate}</span>
                        </p>
                      </div>

                      <div>
                        {isDone ? (
                          <div className="flex items-center gap-1.5 px-4 py-2 bg-emerald-50 text-emerald-800 rounded-full text-xs font-black border border-emerald-200/80 shadow-xs">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>Rendu validé</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleSimulateSubmit(asg.id)}
                            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-full text-xs font-black transition-all shadow-md shadow-indigo-500/25 m3-press"
                          >
                            <UploadCloud className="w-4 h-4" />
                            <span>Déposer mon devoir</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {asg.status === 'graded' && asg.obtainedGrade && (
                      <div className="mt-4 pt-3.5 border-t border-slate-100 p-4 bg-indigo-50/60 rounded-[20px] border border-indigo-100 flex items-center justify-between">
                        <div>
                          <p className="text-xs font-black text-indigo-950 tabular-nums">Note : {asg.obtainedGrade} / {asg.points}</p>
                          <p className="text-xs text-indigo-800 font-medium mt-0.5 italic">{asg.feedback}</p>
                        </div>
                        <CheckCircle2 className="w-5 h-5 text-indigo-600" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Tab 3: Enseignant */}
          {activeCourseTab === 'info' && (
            <div className="bg-white rounded-[28px] p-6 sm:p-7 border border-indigo-100/80 shadow-xs max-w-lg">
              <h3 className="font-black text-base text-slate-950 mb-4">Contact Enseignant</h3>
              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between p-3.5 bg-slate-50/80 rounded-[18px] border border-slate-200/70">
                  <span className="text-slate-400 font-bold">Professeur :</span>
                  <span className="font-black text-slate-900">{selectedCourse.teacher}</span>
                </div>
                <div className="flex items-center justify-between p-3.5 bg-slate-50/80 rounded-[18px] border border-slate-200/70">
                  <span className="text-slate-400 font-bold">Courriel :</span>
                  <span className="font-mono text-indigo-600 font-bold">{selectedCourse.teacherEmail}</span>
                </div>
                <div className="flex items-center justify-between p-3.5 bg-slate-50/80 rounded-[18px] border border-slate-200/70">
                  <span className="text-slate-400 font-bold">Salle habituelle :</span>
                  <span className="font-black text-slate-900">{selectedCourse.room}</span>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100">
                <button
                  onClick={() => startDirectMessageWithTeacher(selectedCourse.teacher)}
                  className="w-full flex items-center justify-center gap-2 py-3 px-5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white rounded-full text-xs font-black shadow-md shadow-indigo-500/25 transition-all m3-press"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Écrire à {selectedCourse.teacher}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* All Courses Grid */
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 sm:p-7 rounded-[32px] border border-indigo-100/80 shadow-xs">
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">Espace Cours</h2>
                <span className="px-3.5 py-1 text-xs font-black rounded-full bg-indigo-100 text-indigo-900 border border-indigo-200/80">
                  {courses.length} matières
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium mt-1">
                Fiches de cours, chapitres, supports de révision et dépôts de devoirs
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredCourses.map((c) => {
              const theme = getSubjectTheme(c.subjectCode);
              return (
                <div
                  key={c.id}
                  onClick={() => setSelectedCourseId(c.id)}
                  className="cursor-pointer group bg-white rounded-[30px] p-6 sm:p-7 border border-indigo-100/80 hover:border-indigo-300 shadow-xs hover:shadow-card hover:-translate-y-1 transition-all flex flex-col justify-between m3-press"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-black rounded-full border uppercase tracking-wider ${theme.badgeClass}`}>
                        <span className={`w-2 h-2 rounded-full ${theme.dotClass}`} />
                        {c.subjectCode}
                      </span>
                      <span className="text-xs font-bold text-slate-400 tabular-nums">
                        {c.hoursPerWeek}h / semaine
                      </span>
                    </div>

                    <h3 className="text-lg sm:text-xl font-black text-slate-950 group-hover:text-indigo-600 transition-colors">
                      {c.subject}
                    </h3>
                    <p className="text-xs text-slate-500 font-semibold mt-1">
                      {c.teacher} • <span className="text-slate-800 font-black">{c.room}</span>
                    </p>

                    {/* Progress bar */}
                    <div className="mt-6">
                      <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                        <span className="text-slate-400">Progression du programme</span>
                        <span className="text-slate-950 font-black tabular-nums">{c.progressPercent}%</span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/50">
                        <div 
                          className="h-full bg-gradient-to-r from-indigo-600 to-violet-600 rounded-full transition-all"
                          style={{ width: `${c.progressPercent}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-black text-slate-600 group-hover:text-indigo-600 transition-colors">
                    <span>{c.chapters.length} chapitres • {c.assignments.length} devoirs</span>
                    <div className="flex items-center gap-1 group-hover:translate-x-1 transition-transform font-bold text-indigo-600">
                      <span>Accéder</span>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
