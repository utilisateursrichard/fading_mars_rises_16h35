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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
      <div 
        className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-modal border border-slate-200/80"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
              <Plus className="w-4 h-4" />
            </div>
            <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">Ajouter un devoir</h3>
          </div>
          <button
            onClick={() => setIsNewHomeworkModalOpen(false)}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3.5">
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Matière</label>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3 py-2 text-xs font-bold bg-slate-50/80 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              {subjectOptions.map(sub => (
                <option key={sub.code} value={sub.name}>{sub.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Titre / Intitulé *</label>
            <input
              type="text"
              required
              placeholder="Ex : Ex 45 p. 182, Réviser les suites..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 text-xs font-bold bg-slate-50/80 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Consignes ou détails</label>
            <textarea
              rows={2}
              placeholder="Détails du travail à faire..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 text-xs font-medium bg-slate-50/80 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Pour le</label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 text-xs font-bold bg-slate-50/80 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Temps estimé</label>
              <select
                value={estimatedMinutes}
                onChange={(e) => setEstimatedMinutes(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs font-bold bg-slate-50/80 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
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
            <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1.5">Niveau d'urgence</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'low', label: 'Normal' },
                { id: 'medium', label: 'Moyen' },
                { id: 'high', label: 'Urgent' }
              ].map(p => (
                <button
                  type="button"
                  key={p.id}
                  onClick={() => setPriority(p.id as any)}
                  className={`py-1.5 text-xs font-bold rounded-xl border transition-all ${
                    priority === p.id 
                      ? 'bg-slate-900 border-slate-900 text-white shadow-subtle'
                      : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsNewHomeworkModalOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-subtle"
            >
              Enregistrer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
