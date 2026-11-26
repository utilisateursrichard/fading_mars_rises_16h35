import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Search, 
  Mail, 
  MapPin, 
  BookOpen, 
  Sparkles, 
  RefreshCw, 
  LayoutGrid, 
  List, 
  UserCheck, 
  GraduationCap,
  ChevronRight,
  Filter,
  X
} from 'lucide-react';
import { useSchool } from '../../context/SchoolContext';
import { useUITheme } from '../../context/UIThemeContext';
import { getThemeTokens } from '../../utils/themeTokens';
import { Teacher } from '../../types/school';
import { getSubjectTheme } from '../../utils/theme';

export const TeachersView: React.FC = () => {
  const { 
    teachers, 
    teachersLoading, 
    refreshTeachers, 
    startDirectMessageWithTeacher,
    isDemoMode 
  } = useSchool();
  const { uiTheme } = useUITheme();
  const tk = getThemeTokens(uiTheme);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [onlyTitulaire, setOnlyTitulaire] = useState<boolean>(false);

  // Extraire la liste unique des matières enseignées
  const allSubjects = useMemo(() => {
    const set = new Set<string>();
    for (const t of teachers) {
      for (const s of t.subjects) {
        if (s.trim()) set.add(s.trim());
      }
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'fr'));
  }, [teachers]);

  // Nombre de titulaires
  const titulaireCount = useMemo(() => {
    return teachers.filter(t => t.isTitulaire).length;
  }, [teachers]);

  // Filtrage combiné (recherche texte + filtre matière + filtre titulaire)
  const filteredTeachers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return teachers.filter(t => {
      // Filtre titulaire
      if (onlyTitulaire && !t.isTitulaire) {
        return false;
      }

      // Filtre par matière
      if (selectedSubjectFilter !== 'all') {
        const matchesSubject = t.subjects.some(
          s => s.toLowerCase() === selectedSubjectFilter.toLowerCase()
        );
        if (!matchesSubject) return false;
      }

      // Recherche textuelle multi-champs (Nom, Prénom, Trigramme, Matières, Salles, Sort)
      if (q) {
        const matchLast = t.lastName.toLowerCase().includes(q);
        const matchFirst = t.firstName.toLowerCase().includes(q);
        const matchFull = t.fullName.toLowerCase().includes(q);
        const matchTrigram = t.trigram?.toLowerCase().includes(q);
        const matchSort = t.sort?.toLowerCase().includes(q);
        const matchSubjects = t.subjects.some(s => s.toLowerCase().includes(q));
        const matchRooms = t.rooms.some(r => r.toLowerCase().includes(q));

        if (!matchLast && !matchFirst && !matchFull && !matchTrigram && !matchSort && !matchSubjects && !matchRooms) {
          return false;
        }
      }

      return true;
    });
  }, [teachers, searchQuery, selectedSubjectFilter, onlyTitulaire]);

  // Génération d'initiales pour l'avatar par défaut
  const getInitials = (teacher: Teacher): string => {
    if (teacher.trigram && teacher.trigram.length <= 3) {
      return teacher.trigram;
    }
    const firstI = teacher.firstName ? teacher.firstName[0].toUpperCase() : '';
    const lastI = teacher.lastName ? teacher.lastName[0].toUpperCase() : '';
    return `${lastI}${firstI}` || 'P';
  };

  // Palette de gradients de secours pour les avatars sans photo
  const getAvatarGradient = (id: string): string => {
    const gradients = [
      'from-indigo-500 to-purple-600',
      'from-blue-500 to-cyan-600',
      'from-emerald-500 to-teal-600',
      'from-rose-500 to-pink-600',
      'from-amber-500 to-orange-600',
      'from-violet-500 to-indigo-600',
    ];
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = (hash << 5) - hash + id.charCodeAt(i);
    }
    return gradients[Math.abs(hash) % gradients.length];
  };

  return (
    <div className="space-y-6 pb-16 max-w-7xl mx-auto animate-in fade-in duration-300">
      
      {/* Hero Header adapté au thème */}
      <div className={`p-6 sm:p-8 relative overflow-hidden transition-all ${tk.heroBanner}`}>
        {/* Glow décoratif */}
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                  tk.isDarkHero
                    ? 'bg-white/10 text-white'
                    : 'bg-indigo-50 text-indigo-700 border border-indigo-200/60'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Annuaire Enseignants</span>
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-black ${tk.pillSwitchActive}`}>
                {teachers.length} {teachers.length > 1 ? 'professeurs' : 'professeur'}
              </span>
              {titulaireCount > 0 && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200/60">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  <span>{titulaireCount} {titulaireCount > 1 ? 'titulaires' : 'titulaire'}</span>
                </span>
              )}
            </div>

            <h1 className={`text-2xl sm:text-3xl font-black tracking-tight ${tk.heroTitle}`}>
              Liste de professeurs
            </h1>
            <p className={`text-xs sm:text-sm font-medium mt-1 ${tk.heroSubtitle}`}>
              Liste complète des professeurs déduite de votre agenda Smartschool avec nom, prénom et contact direct.
            </p>
          </div>

          {/* Boutons d'action : Actualiser & Changement de vue */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => refreshTeachers()}
              disabled={teachersLoading}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold shadow-xs transition-all active:scale-95 disabled:opacity-50"
              title="Rafraîchir depuis l'agenda"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${teachersLoading ? 'animate-spin text-indigo-600' : ''}`} />
              <span className="hidden sm:inline">Actualiser</span>
            </button>

            {/* Sélecteur de vue Grille / Liste */}
            <div className={`inline-flex items-center ${tk.pillSwitchTrack}`}>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 transition-all ${
                  viewMode === 'grid' ? tk.pillSwitchActive : tk.pillSwitchIdle
                }`}
                title="Vue en grille"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 transition-all ${
                  viewMode === 'list' ? tk.pillSwitchActive : tk.pillSwitchIdle
                }`}
                title="Vue en liste"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Barre de recherche & Filtres rapides */}
        <div className={`mt-6 pt-6 border-t ${tk.isDarkHero ? 'border-white/10' : tk.borderSubtle} flex flex-col md:flex-row gap-3`}>
          {/* Champ de recherche */}
          <div className="relative flex-1">
            <Search className={`w-4 h-4 ${tk.textMuted} absolute left-3.5 top-1/2 -translate-y-1/2`} />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Rechercher par nom, prénom, matière, trigramme (ex: DR) ou salle..."
              className={`w-full pl-10 pr-9 py-2.5 text-xs sm:text-sm font-medium focus:outline-hidden transition-all ${tk.inputField}`}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className={`absolute right-3 top-1/2 -translate-y-1/2 ${tk.textMuted} p-0.5 rounded-full`}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filtre Titulaire rapide */}
          {titulaireCount > 0 && (
            <button
              onClick={() => setOnlyTitulaire(prev => !prev)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-bold transition-all active:scale-95 shrink-0 ${
                onlyTitulaire
                  ? 'bg-amber-500 text-white rounded-full shadow-xs shadow-amber-500/20'
                  : tk.secondaryBtn
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Titulaires ({titulaireCount})</span>
            </button>
          )}
        </div>

        {/* Pilules de filtres par matière */}
        {allSubjects.length > 0 && (
          <div className="mt-4 flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            <span className={`text-[11px] font-bold uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1 ${tk.isDarkHero ? 'text-white/60' : tk.textMuted}`}>
              <Filter className="w-3 h-3" />
              <span>Matière :</span>
            </span>

            <button
              onClick={() => setSelectedSubjectFilter('all')}
              className={`px-3 py-1 text-xs font-bold transition-all shrink-0 ${
                selectedSubjectFilter === 'all' ? tk.primaryBtn : tk.secondaryBtn
              }`}
            >
              Toutes ({teachers.length})
            </button>

            {allSubjects.map(sub => {
              const count = teachers.filter(t => t.subjects.includes(sub)).length;
              const isSelected = selectedSubjectFilter === sub;
              return (
                <button
                  key={sub}
                  onClick={() => setSelectedSubjectFilter(isSelected ? 'all' : sub)}
                  className={`px-3 py-1 text-xs font-bold transition-all shrink-0 ${
                    isSelected ? tk.primaryBtn : tk.secondaryBtn
                  }`}
                >
                  {sub} <span className="text-[10px] opacity-75 font-normal">({count})</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Squelette de chargement */}
      {teachersLoading && teachers.length === 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="bg-white rounded-3xl p-5 border border-slate-200/80 animate-pulse space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-200" />
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

      {/* État vide : Aucun professeur correspondant au filtre */}
      {!teachersLoading && filteredTeachers.length === 0 && (
        <div className="bg-white/80 backdrop-blur-xl border border-slate-200/80 rounded-3xl p-12 text-center max-w-md mx-auto space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
            <Users className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Aucun professeur trouvé</h3>
            <p className="text-xs text-slate-500 mt-1">
              {searchQuery || selectedSubjectFilter !== 'all' || onlyTitulaire
                ? "Aucun enseignant ne correspond à vos filtres de recherche."
                : "Les professeurs seront automatiquement extraits de votre agenda Smartschool lors de la synchronisation."}
            </p>
          </div>
          {(searchQuery || selectedSubjectFilter !== 'all' || onlyTitulaire) && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedSubjectFilter('all');
                setOnlyTitulaire(false);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-indigo-600 text-white text-xs font-bold transition-all"
            >
              <span>Réinitialiser les filtres</span>
            </button>
          )}
        </div>
      )}

      {/* VUE 1 : GRILLE DE CARTES (Default) */}
      {viewMode === 'grid' && filteredTeachers.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {filteredTeachers.map(teacher => {
            const initials = getInitials(teacher);
            const gradient = getAvatarGradient(teacher.id);

            return (
              <div
                key={teacher.id}
                className={`group p-5 flex flex-col justify-between relative overflow-hidden ${tk.interactiveCard}`}
              >
                {/* Lueur d'accentuation discrète */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-indigo-500/5 to-transparent rounded-bl-full pointer-events-none group-hover:from-indigo-500/10 transition-colors" />

                <div>
                  {/* Top Bar : Avatar, Noms, Trigramme */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3.5 min-w-0">
                      {/* Photo ou Avatar Stylé */}
                      {teacher.pictureUrl ? (
                        <img
                          src={teacher.pictureUrl}
                          alt={teacher.fullName}
                          className="w-13 h-13 rounded-2xl object-cover ring-2 ring-slate-100 shadow-2xs shrink-0 group-hover:ring-indigo-200 transition-all"
                          onError={(e) => {
                            // En cas d'erreur de chargement de l'image externe, fallback sur les initiales
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className={`w-13 h-13 rounded-2xl bg-gradient-to-br ${gradient} text-white flex items-center justify-center font-black text-sm tracking-wider shadow-2xs shrink-0 ring-2 ring-white`}>
                          {initials}
                        </div>
                      )}

                      <div className="min-w-0">
                        {/* Nom + Prénom */}
                        <div className="flex flex-wrap items-baseline gap-x-1.5">
                          <span className="text-base font-black text-slate-900 uppercase tracking-tight group-hover:text-indigo-600 transition-colors">
                            {teacher.lastName}
                          </span>
                          <span className="text-sm font-semibold text-slate-600 capitalize">
                            {teacher.firstName}
                          </span>
                        </div>

                        {/* Identifiant sort Smartschool (ex: deridder-andre) */}
                        {teacher.sort && (
                          <p className={`text-[11px] font-mono mt-0.5 truncate ${tk.textMuted}`}>
                            @{teacher.sort}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Trigramme / Code prof Smartschool (ex: DR) */}
                    {teacher.trigram && (
                      <span 
                        className={`px-2.5 py-1 rounded-xl text-[11px] font-black tracking-widest uppercase shrink-0 ${tk.subSurface} ${tk.textPrimary}`}
                        title={`Trigramme officiel : ${teacher.trigram}`}
                      >
                        {teacher.trigram}
                      </span>
                    )}
                  </div>

                  {/* Badge Titulaire */}
                  {teacher.isTitulaire && (
                    <div className="mt-3">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                        tk.isDarkTheme
                          ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                          : 'bg-amber-50 text-amber-700 border-amber-200/70'
                      }`}>
                        <Sparkles className="w-3 h-3 text-amber-500" />
                        <span>Professeur Titulaire</span>
                      </span>
                    </div>
                  )}

                  {/* Matières enseignées */}
                  {teacher.subjects.length > 0 && (
                    <div className="mt-3.5 space-y-1.5">
                      <div className="flex flex-wrap gap-1.5">
                        {teacher.subjects.map(sub => {
                          const theme = getSubjectTheme(sub);
                          return (
                            <span
                              key={sub}
                              className={`px-2.5 py-1 rounded-xl text-xs font-bold border ${theme.badgeClass}`}
                            >
                              {sub}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Salles de classe associées */}
                  {teacher.rooms.length > 0 && (
                    <div className="mt-3 flex items-center gap-1.5 flex-wrap">
                      <span className={`text-[11px] font-bold ${tk.textMuted}`}>Salles :</span>
                      {teacher.rooms.map(room => (
                        <span
                          key={room}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold border ${tk.subSurface} ${tk.textSecondary} ${tk.borderSubtle}`}
                        >
                          <MapPin className="w-3 h-3 opacity-60" />
                          <span>{room}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer de la carte : Action Contacter */}
                <div className={`mt-5 pt-4 border-t ${tk.borderSubtle} flex items-center justify-between gap-2`}>
                  <span className={`text-[11px] font-medium ${tk.textMuted}`}>
                    {teacher.rooms.length > 0 ? teacher.rooms.join(', ') : 'Emploi du temps'}
                  </span>

                  <button
                    onClick={() => startDirectMessageWithTeacher(teacher.fullName || `${teacher.lastName} ${teacher.firstName}`)}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs active:scale-95 group/btn ${tk.primaryBtn}`}
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Contacter</span>
                    <ChevronRight className="w-3.5 h-3.5 opacity-60 group-hover/btn:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VUE 2 : LISTE COMPACTE DÉTAILLÉE */}
      {viewMode === 'list' && filteredTeachers.length > 0 && (
        <div className={`${tk.card} overflow-hidden`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className={`${tk.tableHeader} text-[11px] font-black uppercase tracking-wider`}>
                  <th className="py-3.5 px-5">Enseignant</th>
                  <th className="py-3.5 px-4">Trigramme</th>
                  <th className="py-3.5 px-4">Matières</th>
                  <th className="py-3.5 px-4">Salles</th>
                  <th className="py-3.5 px-4">Rôle</th>
                  <th className="py-3.5 px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${tk.divider} text-xs sm:text-sm font-medium`}>
                {filteredTeachers.map(teacher => {
                  const initials = getInitials(teacher);
                  const gradient = getAvatarGradient(teacher.id);

                  return (
                    <tr key={teacher.id} className={`${tk.tableRowHover} transition-colors group`}>
                      {/* Nom + Prénom + Avatar */}
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          {teacher.pictureUrl ? (
                            <img
                              src={teacher.pictureUrl}
                              alt={teacher.fullName}
                              className="w-10 h-10 rounded-xl object-cover ring-1 ring-black/10 shrink-0"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} text-white flex items-center justify-center font-bold text-xs shrink-0`}>
                              {initials}
                            </div>
                          )}

                          <div>
                            <div className="flex items-baseline gap-1.5">
                              <span className={`font-black uppercase ${tk.textPrimary}`}>
                                {teacher.lastName}
                              </span>
                              <span className={`font-semibold capitalize ${tk.textSecondary}`}>
                                {teacher.firstName}
                              </span>
                            </div>
                            {teacher.sort && (
                              <p className={`text-[11px] font-mono ${tk.textMuted}`}>
                                @{teacher.sort}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Trigramme */}
                      <td className="py-3.5 px-4">
                        {teacher.trigram ? (
                          <span className={`px-2 py-0.5 rounded-lg font-mono text-xs font-black ${tk.subSurface} ${tk.textPrimary}`}>
                            {teacher.trigram}
                          </span>
                        ) : (
                          <span className="opacity-40">—</span>
                        )}
                      </td>

                      {/* Matières */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {teacher.subjects.map(sub => {
                            const theme = getSubjectTheme(sub);
                            return (
                              <span
                                key={sub}
                                className={`px-2 py-0.5 rounded-md text-[11px] font-bold border ${theme.badgeClass}`}
                              >
                                {sub}
                              </span>
                            );
                          })}
                        </div>
                      </td>

                      {/* Salles */}
                      <td className={`py-3.5 px-4 ${tk.textSecondary}`}>
                        {teacher.rooms.length > 0 ? (
                          <div className="flex items-center gap-1 text-xs">
                            <MapPin className="w-3.5 h-3.5 opacity-60" />
                            <span>{teacher.rooms.join(', ')}</span>
                          </div>
                        ) : (
                          <span className="opacity-40">—</span>
                        )}
                      </td>

                      {/* Rôle / Titulaire */}
                      <td className="py-3.5 px-4">
                        {teacher.isTitulaire ? (
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                            tk.isDarkTheme
                              ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                              : 'bg-amber-50 text-amber-700 border-amber-200/70'
                          }`}>
                            <Sparkles className="w-3 h-3 text-amber-500" />
                            <span>Titulaire</span>
                          </span>
                        ) : (
                          <span className={`text-xs font-medium ${tk.textMuted}`}>Enseignant</span>
                        )}
                      </td>

                      {/* Action Contacter */}
                      <td className="py-3.5 px-5 text-right">
                        <button
                          onClick={() => startDirectMessageWithTeacher(teacher.fullName || `${teacher.lastName} ${teacher.firstName}`)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs active:scale-95 ${tk.secondaryBtn}`}
                        >
                          <Mail className="w-3.5 h-3.5" />
                          <span>Contacter</span>
                        </button>
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
