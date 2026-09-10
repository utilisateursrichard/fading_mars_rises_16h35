import React from 'react';
import { 
  X, 
  Clock, 
  MapPin, 
  User, 
  FileText, 
  Download, 
  CheckCircle2, 
  MessageSquare
} from 'lucide-react';
import { useSchool } from '../../context/SchoolContext';
import { getSubjectTheme } from '../../utils/theme';

export const CourseDetailModal: React.FC = () => {
  const { 
    selectedEventModal, 
    setSelectedEventModal, 
    startDirectMessageWithTeacher,
    toggleHomework
  } = useSchool();

  if (!selectedEventModal) return null;

  const event = selectedEventModal;
  const theme = getSubjectTheme(event.subjectCode);

  const getEventTypeLabel = (type: string) => {
    switch (type) {
      case 'cours': return 'Cours magistral';
      case 'tp': return 'Travaux Pratiques (TP)';
      case 'td': return 'Travaux Dirigés (TD)';
      case 'ds': return 'Devoir Surveillé (DS)';
      case 'oral': return 'Épreuve Orale';
      default: return 'Séance de cours';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'in_progress':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-amber-50 text-amber-700">En cours</span>;
      case 'completed':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-slate-100 text-slate-500">Terminé</span>;
      case 'cancelled':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-rose-50 text-rose-700">Annulé</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-50 text-emerald-700">Planifié</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-[32px] max-w-lg w-full overflow-hidden shadow-2xl border border-indigo-100/80 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Clean Header */}
        <div className="p-6 sm:p-7 border-b border-slate-100 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className={`px-3 py-1 text-xs font-black rounded-full border uppercase tracking-wider ${theme.badgeClass}`}>
                {event.subjectCode}
              </span>
              <span className="text-xs font-bold text-slate-500">
                {getEventTypeLabel(event.type)}
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">{event.subject}</h3>
          </div>

          <button
            onClick={() => setSelectedEventModal(null)}
            className="p-2.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors m3-press"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Key metadata strip */}
          <div className="grid grid-cols-3 gap-2.5 p-3.5 rounded-xl bg-slate-50/90 border border-slate-100 text-xs">
            <div className="space-y-0.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Horaire</p>
              <p className="font-semibold text-slate-800 flex items-center gap-1.5 tabular-nums">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>{event.startTime} - {event.endTime}</span>
              </p>
            </div>
            <div className="space-y-0.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Salle</p>
              <p className="font-semibold text-slate-800 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>{event.room}</span>
              </p>
            </div>
            <div className="space-y-0.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Statut</p>
              <div>{getStatusBadge(event.status)}</div>
            </div>
          </div>

          {/* Teacher */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50/70 border border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-slate-200/80 text-slate-700 flex items-center justify-center font-bold text-xs ring-1 ring-slate-300/60">
                {event.teacher.split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">{event.teacher}</p>
                <p className="text-[11px] text-slate-400">Enseignant titulaire</p>
              </div>
            </div>
            <button
              onClick={() => {
                setSelectedEventModal(null);
                startDirectMessageWithTeacher(event.teacher);
              }}
              className="px-4 py-2 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-all flex items-center gap-1.5 m3-press"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Contacter</span>
            </button>
          </div>

          {/* Description */}
          {event.description && (
            <div>
              <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                Programme de la séance
              </h4>
              <p className="text-xs text-slate-700 bg-slate-50/80 p-4 rounded-[20px] border border-slate-200/70 leading-relaxed font-normal">
                {event.description}
              </p>
            </div>
          )}

          {/* Homeworks */}
          <div>
            <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-400 mb-2 flex items-center justify-between">
              <span>Devoirs à préparer</span>
              <span className="text-indigo-600 font-black tabular-nums">{event.homeworkDue?.length || 0} devoir(s)</span>
            </h4>
            
            {event.homeworkDue && event.homeworkDue.length > 0 ? (
              <div className="space-y-2">
                {event.homeworkDue.map((hw) => (
                  <div 
                    key={hw.id}
                    className={`p-3.5 rounded-[20px] border transition-all flex items-start justify-between gap-3 ${
                      hw.isCompleted ? 'bg-slate-50/50 border-slate-100 opacity-60' : 'bg-white border-slate-200/80 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <button
                        onClick={() => toggleHomework(hw.id)}
                        className={`mt-0.5 transition-colors m3-press ${
                          hw.isCompleted ? 'text-emerald-600' : 'text-slate-300 hover:text-slate-500'
                        }`}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                      <div>
                        <p className={`text-xs font-black ${hw.isCompleted ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                          {hw.title}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">{hw.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-[20px] bg-slate-50 text-slate-400 text-xs text-center border border-dashed border-slate-200 font-medium">
                Aucun devoir particulier pour ce cours.
              </div>
            )}
          </div>

          {/* Materials */}
          {event.materials && event.materials.length > 0 && (
            <div>
              <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-400 mb-2">
                Supports de cours ({event.materials.length})
              </h4>
              <div className="space-y-2">
                {event.materials.map((mat) => (
                  <div 
                    key={mat.id}
                    className="flex items-center justify-between p-3.5 rounded-[20px] bg-slate-50 border border-slate-200/60 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                        <FileText className="w-4 h-4 shrink-0" />
                      </div>
                      <span className="font-bold text-slate-800 truncate">{mat.title}</span>
                    </div>
                    <button 
                      onClick={() => alert(`Téléchargement de : ${mat.title}`)}
                      className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-full transition-colors m3-press"
                      title="Télécharger"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-end">
          <button
            onClick={() => setSelectedEventModal(null)}
            className="py-2.5 px-6 rounded-full text-xs font-black bg-slate-950 hover:bg-slate-800 text-white shadow-md transition-all m3-press"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
