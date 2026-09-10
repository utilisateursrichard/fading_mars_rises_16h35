import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { useSchool } from '../../context/SchoolContext';
import { getSubjectTheme } from '../../utils/theme';

export const NewHomeworkModal: React.FC = () => {
  const { isNewHomeworkModalOpen, setIsNewHomeworkModalOpen, addHomework } = useSchool();

  const [subject, setSubject] = useState('Numérique & Sc. Informatiques');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().split('T')[0];
  });
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [estimatedMinutes, setEstimatedMinutes] = useState(30);

  if (!isNewHomeworkModalOpen) return null;

  const subjectOptions = [
    { name: 'Numérique & Sc. Informatiques', code: 'NSI' },
    { name: 'Mathématiques', code: 'MATH' },
    { name: 'Philosophie', code: 'PHILO' },
    { name: 'Physique-Chimie', code: 'PC' },
    { name: 'Histoire-Géographie', code: 'HIST-GEO' },
    { name: 'Anglais LV1', code: 'ANG' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const opt = subjectOptions.find(s => s.name === subject) || { code: 'NSI' };
    const theme = getSubjectTheme(opt.code);

    await addHomework({
      subject,
      subjectCode: opt.code,
      color: theme.accent,
      title: title.trim(),
      description: description.trim() || 'Devoir personnel ajouté par l’élève.',
      dueDate,
      dueTime: '08:30',
      estimatedTimeMinutes: estimatedMinutes,
      isCompleted: false,
      priority,
      assignedDate: new Date().toISOString().split('T')[0],
      hasAttachment: false
    });

    setTitle('');
    setDescription('');
    setIsNewHomeworkModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-[32px] max-w-md w-full overflow-hidden shadow-2xl border border-indigo-100/80 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-black">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-slate-950 text-base">Ajouter un devoir</h3>
              <p className="text-[11px] text-slate-400 font-bold">Synchronisation automatique de l'agenda</p>
            </div>
          </div>
          <button
            onClick={() => setIsNewHomeworkModalOpen(false)}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors m3-press"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Matière</label>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3.5 py-2 text-xs font-semibold bg-slate-50 border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all text-slate-800"
            >
              {subjectOptions.map(sub => (
                <option key={sub.code} value={sub.name}>{sub.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Titre / Intitulé *</label>
            <input
              type="text"
              required
              placeholder="Ex : Ex 45 p. 182, Réviser les suites..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2 text-xs font-semibold bg-slate-50 border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all text-slate-800 placeholder-slate-400"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Consignes ou détails</label>
            <textarea
              rows={2}
              placeholder="Détails du travail à préparer..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 text-xs font-normal bg-slate-50 border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all text-slate-800 placeholder-slate-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Pour le</label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3.5 py-2 text-xs font-semibold bg-slate-50 border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all text-slate-800"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Temps estimé</label>
              <select
                value={estimatedMinutes}
                onChange={(e) => setEstimatedMinutes(Number(e.target.value))}
                className="w-full px-3.5 py-2 text-xs font-semibold bg-slate-50 border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all text-slate-800"
              >
                <option value={15}>15 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={45}>45 minutes</option>
                <option value={60}>1 heure</option>
                <option value={90}>1h30</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Niveau d'urgence</label>
            {/* M3E Segmented Priority Pills */}
            <div className="flex gap-1.5 p-1.5 bg-slate-100/90 rounded-full border border-slate-200/50">
              {[
                { id: 'low', label: 'Normal' },
                { id: 'medium', label: 'Moyen' },
                { id: 'high', label: 'Urgent' }
              ].map(p => (
                <button
                  type="button"
                  key={p.id}
                  onClick={() => setPriority(p.id as any)}
                  className={`flex-1 py-2 text-xs font-black rounded-full transition-all text-center m3-press ${
                    priority === p.id 
                      ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/25' 
                      : 'text-slate-600 hover:text-slate-950 hover:bg-white/70'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setIsNewHomeworkModalOpen(false)}
              className="px-5 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors m3-press"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 text-xs font-black text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 rounded-full transition-all shadow-md shadow-indigo-500/25 m3-press"
            >
              Enregistrer le devoir
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
