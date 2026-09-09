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
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-subtle transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Toutes les matières</span>
          </button>

          {/* Clean Course Hero */}
          {(() => {
            const theme = getSubjectTheme(selectedCourse.subjectCode);
            return (
              <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/70 shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <div className="flex items-center gap-2.5 mb-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-black border uppercase tracking-wider ${theme.badgeClass}`}>
                      {selectedCourse.subjectCode}
                    </span>
                    <span className="text-xs font-bold text-slate-400">
                      {selectedCourse.hoursPerWeek}h par semaine
                    </span>
                  </div>

                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                    {selectedCourse.subject}
                  </h1>

                  <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1.5 flex flex-wrap items-center gap-3">
                    <span>Enseignant : <strong className="text-slate-700">{selectedCourse.teacher}</strong></span>
                    <span>•</span>
                    <span>{selectedCourse.room}</span>
                    {selectedCourse.nextExam && (
                      <>
                        <span>•</span>
                        <span className="text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded-md">
                          {selectedCourse.nextExam}
                        </span>
                      </>
                    )}
                  </p>
                </div>

                {/* Action shortcut */}
                <div className="shrink-0 flex items-center">
                  <button
                    onClick={() => startDirectMessageWithTeacher(selectedCourse.teacher)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-indigo-600 text-white text-xs font-bold transition-all shadow-subtle m3-press"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Contacter</span>
                  </button>
                </div>
              </div>
            );
          })()}

          {/* Clean Segmented Tabs */}
          <div className="flex border-b border-slate-200 bg-white px-3 rounded-2xl shadow-subtle overflow-x-auto">
            <button
              onClick={() => setActiveCourseTab('chapters')}
              className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 shrink-0 ${
                activeCourseTab === 'chapters'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Chapitres & Documents ({selectedCourse.chapters.length})</span>
            </button>
            <button
              onClick={() => setActiveCourseTab('assignments')}
              className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 shrink-0 ${
                activeCourseTab === 'assignments'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <UploadCloud className="w-4 h-4" />
              <span>Devoirs & Rendu ({selectedCourse.assignments.length})</span>
            </button>
            <button
              onClick={() => setActiveCourseTab('info')}
              className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 shrink-0 ${
                activeCourseTab === 'info'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Mail className="w-4 h-4" />
              <span>Contact Enseignant</span>
            </button>
          </div>

          {/* Tab 1: Chapitres */}
          {activeCourseTab === 'chapters' && (
            <div className="space-y-4">
              {selectedCourse.chapters.map((chap) => (
                <div 
                  key={chap.id}
                  className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/70 shadow-subtle"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase ${
                      chap.status === 'completed' ? 'bg-emerald-50 text-emerald-700' :
                      chap.status === 'in_progress' ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {chap.status === 'completed' ? 'Terminé' : chap.status === 'in_progress' ? 'En cours' : 'À venir'}
                    </span>
                    <h3 className="font-extrabold text-sm sm:text-base text-slate-900">{chap.title}</h3>
                  </div>
                  <p className="text-xs text-slate-500">{chap.description}</p>

                  <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {chap.documents.map((doc) => (
                        <div
                          key={doc.id}
                          className="flex items-center justify-between p-3 rounded-2xl bg-slate-50/80 hover:bg-slate-100 border border-slate-200/60 transition-colors"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-800 truncate">{doc.title}</p>
                              <p className="text-[10px] text-slate-400">{doc.size} • Déposé le {doc.uploadDate}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => alert(`Téléchargement de : ${doc.title}`)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-white rounded-xl transition-colors shrink-0 ml-2"
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
            <div className="space-y-4">
              {selectedCourse.assignments.map((asg) => {
                const isLocalSubmitted = submittedAssignments[asg.id];
                const isDone = asg.status === 'submitted' || asg.status === 'graded' || isLocalSubmitted;

                return (
                  <div
                    key={asg.id}
                    className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/70 shadow-subtle"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full ${
                            isDone ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-800'
                          }`}>
                            {isDone ? 'Devoir remis' : 'À rendre en ligne'}
                          </span>
                          <span className="text-xs font-semibold text-slate-400">Barème : {asg.points} pts</span>
                        </div>
                        <h3 className="font-extrabold text-base text-slate-900 mt-1">{asg.title}</h3>
                        <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>Échéance : {asg.dueDate}</span>
                        </p>
                      </div>

                      <div>
                        {isDone ? (
                          <div className="flex items-center gap-2 px-3.5 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-bold border border-emerald-200/60">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Rendu validé</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleSimulateSubmit(asg.id)}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold transition-all shadow-subtle"
                          >
                            <UploadCloud className="w-4 h-4" />
                            <span>Déposer mon devoir</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {asg.status === 'graded' && asg.obtainedGrade && (
                      <div className="mt-4 pt-4 border-t border-slate-100 p-3 bg-indigo-50/50 rounded-2xl flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-indigo-950">Note : {asg.obtainedGrade} / {asg.points}</p>
                          <p className="text-[11px] text-indigo-700 mt-0.5 italic">{asg.feedback}</p>
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
            <div className="bg-white rounded-3xl p-6 border border-slate-200/70 shadow-subtle max-w-lg">
              <h3 className="font-extrabold text-base text-slate-900 mb-4">Contact Enseignant</h3>
              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between p-3 bg-slate-50/80 rounded-2xl">
                  <span className="text-slate-400 font-medium">Professeur :</span>
                  <span className="font-bold text-slate-800">{selectedCourse.teacher}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50/80 rounded-2xl">
                  <span className="text-slate-400 font-medium">Courriel :</span>
                  <span className="font-mono text-indigo-600 font-medium">{selectedCourse.teacherEmail}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50/80 rounded-2xl">
                  <span className="text-slate-400 font-medium">Salle habituelle :</span>
                  <span className="font-bold text-slate-800">{selectedCourse.room}</span>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100">
                <button
                  onClick={() => startDirectMessageWithTeacher(selectedCourse.teacher)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-900 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold transition-all shadow-subtle"
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200/70 shadow-subtle">
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Espace Cours</h2>
                <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-slate-100 text-slate-700">
                  {courses.length} matières
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                Fiches de cours, chapitres, supports de révision et dépôts de devoirs
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
            {filteredCourses.map((c) => {
              const theme = getSubjectTheme(c.subjectCode);
              return (
                <div
                  key={c.id}
                  onClick={() => setSelectedCourseId(c.id)}
                  className="cursor-pointer group bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/70 hover:border-indigo-200 shadow-subtle hover:shadow-card transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`px-2.5 py-0.5 text-[10px] font-black rounded-lg border uppercase tracking-wider ${theme.badgeClass}`}>
                        {c.subjectCode}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-400">
                        {c.hoursPerWeek}h / semaine
                      </span>
                    </div>

                    <h3 className="text-base sm:text-lg font-extrabold text-slate-900 group-hover:text-indigo-600 transition-colors">
                      {c.subject}
                    </h3>
                    <p className="text-xs text-slate-400 font-medium mt-0.5">
                      {c.teacher} • <span className="text-slate-600">{c.room}</span>
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-600 group-hover:text-indigo-600 transition-colors">
                    <span>{c.chapters.length} chapitres • {c.assignments.length} devoirs</span>
                    <div className="flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                      <span>Accéder</span>
                      <ChevronRight className="w-3.5 h-3.5" />
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
