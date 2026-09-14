import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Bot, 
  Send, 
  Sparkles, 
  RotateCcw, 
  BookOpen, 
  Code2, 
  Calculator, 
  Feather, 
  Lightbulb,
  Layers,
  ChevronRight,
  ChevronDown,
  ShieldCheck,
  Zap,
  AlertTriangle,
  Clock
} from 'lucide-react';
import { useSchool } from '../../context/SchoolContext';
import { 
  AITutorService, 
  LLM_PROVIDERS_REGISTRY, 
  isProviderConfigured,
  isProviderAvailable,
  clearAllProviderFailures,
  getActiveCooldowns,
  StudentContextData,
  LLMTier
} from '../../services/aiTutorService';
import { MarkdownRenderer } from '../common/MarkdownRenderer';

interface TutorMessage {
  id: string;
  sender: 'user' | 'tutor';
  text: string;
  time: string;
  providerName?: string;
  modelUsed?: string;
  latencyMs?: number;
  tier?: LLMTier;
  isZeroDowntimeFallback?: boolean;
  fallbackChain?: Array<{ providerId: string; providerName: string; error: string }>;
}

const STORAGE_CHAT_KEY = 'betterschool_v3_tutor_messages';

export const TutorView: React.FC = () => {
  const { student, homeworks, courses } = useSchool();
  const [inputText, setInputText] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [activeProviderName, setActiveProviderName] = useState<string>('');
  const [expandedFallbackId, setExpandedFallbackId] = useState<string | null>(null);

  // Initialisation ou restauration de l'historique de discussion
  const [messages, setMessages] = useState<TutorMessage[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_CHAT_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // Ignorer erreur de parsing
    }
    return [
      {
        id: 'msg-init',
        sender: 'tutor',
        text: `Bonjour ${student?.firstName || 'élève'} ! Je suis ton tuteur IA de BetterSchool.\n\nJe suis là pour t'expliquer des notions de cours, t'aider à débloquer tes devoirs ou perfectionner ta méthode de révision. Pose-moi n'importe quelle question !`,
        time: 'À l’instant',
        providerName: 'BetterSchool AI Engine',
        modelUsed: 'Système Haute Disponibilité',
        tier: 'local',
        isZeroDowntimeFallback: false
      }
    ];
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sauvegarde automatique des messages
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_CHAT_KEY, JSON.stringify(messages));
    } catch {
      // Ignore
    }
  }, [messages]);

  // Défilement automatique vers le bas
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  // Contexte élève injecté dans le prompt système
  const studentContext: StudentContextData = useMemo(() => ({
    studentName: student?.firstName ? `${student.firstName} ${student.lastName || ''}`.trim() : undefined,
    studentClass: student?.studentClass,
    schoolName: student?.schoolName,
    currentCourses: courses?.map(c => c.subject) || [],
    pendingHomeworks: homeworks?.filter(h => !h.isCompleted).map(h => ({
      title: h.title,
      subject: h.subject,
      dueDate: h.dueDate
    }))
  }), [student, courses, homeworks]);

  // Suggestions dynamiques basées sur les devoirs réels et les matières
  const suggestions = useMemo(() => {
    const list = [];
    const pendingHw = homeworks?.find(h => !h.isCompleted);
    if (pendingHw) {
      list.push({
        label: `Devoir ${pendingHw.subject} : ${pendingHw.title.slice(0, 26)}...`,
        icon: Lightbulb,
        prompt: `Peux-tu m'expliquer la méthode pour aborder mon devoir de ${pendingHw.subject} : "${pendingHw.title}" ? Guide-moi pas à pas.`
      });
    }

    list.push(
      { label: 'Continuité & TVI (Maths)', icon: Calculator, prompt: 'Comment démontrer la stricte monotonie avec le TVI en Mathématiques ?' },
      { label: 'Démarche d\'investigation en Science', icon: Code2, prompt: 'Peux-tu m\'expliquer les étapes clés de la démarche d\'investigation en Science ?' },
      { label: 'La Technique & Nature (Heidegger)', icon: Feather, prompt: 'Quels sont les arguments principaux de Heidegger sur la technique et l\'arraisonnement ?' },
      { label: 'Planning de révision efficace DS', icon: BookOpen, prompt: 'Quel est le meilleur planning de travail sur 7 jours pour réussir un devoir surveillé important ?' }
    );

    return list.slice(0, 4);
  }, [homeworks]);

  // Premier provider actif dans la cascade (calculé de manière sécurisée)
  const topActiveProvider = useMemo(() => {
    return LLM_PROVIDERS_REGISTRY
      .filter(p => isProviderAvailable(p))
      .sort((a, b) => a.reputationRank - b.reputationRank)[0] || null;
  }, [messages, isThinking]);

  // Liste des providers ou modèles en pause de cooldown dans localStorage
  const activeCooldowns = useMemo(() => {
    return getActiveCooldowns();
  }, [messages, isThinking]);

  const handleClearCooldowns = () => {
    clearAllProviderFailures();
    setMessages(prev => [...prev]);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const content = (textToSend || inputText).trim();
    if (!content || isThinking) return;

    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const userMessage: TutorMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: content,
      time: timeNow
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsThinking(true);
    setActiveProviderName(topActiveProvider?.name || 'Moteur de repli');

    try {
      // Construction de l'historique complet pour le LLM
      const historyForLLM = [...messages, userMessage].map(m => ({
        role: (m.sender === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
        content: m.text
      }));

      // Appel au moteur d'orchestration avec cascade de fallback et circuit-breaker
      const response = await AITutorService.queryTutor(historyForLLM, studentContext);

      const tutorReply: TutorMessage = {
        id: `tutor-${Date.now()}`,
        sender: 'tutor',
        text: response.text,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        providerName: response.providerName,
        modelUsed: response.modelUsed,
        latencyMs: response.latencyMs,
        tier: response.tier,
        isZeroDowntimeFallback: response.isZeroDowntimeFallback,
        fallbackChain: response.fallbackChain
      };

      setMessages(prev => [...prev, tutorReply]);
    } catch (err: any) {
      // Secours ultime sans downtime
      const errorReply: TutorMessage = {
        id: `tutor-err-${Date.now()}`,
        sender: 'tutor',
        text: "Une coupure réseau est survenue. N'hésite pas à reposer ta question !",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        providerName: 'Secours Local',
        isZeroDowntimeFallback: true
      };
      setMessages(prev => [...prev, errorReply]);
    } finally {
      setIsThinking(false);
      setActiveProviderName('');
    }
  };

  const handleResetChat = () => {
    if (window.confirm('Voulez-vous réinitialiser l’historique de la conversation et réactiver tous les services en pause ?')) {
      clearAllProviderFailures();
      const resetMsg: TutorMessage = {
        id: `msg-${Date.now()}`,
        sender: 'tutor',
        text: `Bonjour ${student?.firstName || 'élève'} ! Conversation réinitialisée. En quoi puis-je t'aider aujourd'hui ?`,
        time: 'À l’instant',
        providerName: 'BetterSchool AI Engine',
        modelUsed: 'Système Haute Disponibilité',
        tier: 'local',
        isZeroDowntimeFallback: false
      };
      setMessages([resetMsg]);
      try {
        localStorage.setItem(STORAGE_CHAT_KEY, JSON.stringify([resetMsg]));
      } catch {
        // Ignore
      }
    }
  };

  return (
    <div className="flex-1 min-h-0 h-full bg-white rounded-2xl sm:rounded-3xl border border-slate-200/70 shadow-subtle overflow-hidden flex flex-col max-w-5xl mx-auto w-full">
      
      {/* Top Header */}
      <div className="p-3.5 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-white z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-subtle relative">
            <Bot className="w-5 h-5 text-indigo-400" />
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-base text-slate-900 tracking-tight">Tuteur IA</h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100/80 flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" />
                <span>Production</span>
              </span>
              <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100/80 items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                <span>Zéro Downtime</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              {topActiveProvider ? (
                <span>Connecté à <strong className="text-slate-600 font-semibold">{topActiveProvider.name}</strong> ({topActiveProvider.model})</span>
              ) : (
                <span>Moteur pédagogique de secours actif</span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Badge & action des providers en cooldown si applicable */}
          {activeCooldowns.length > 0 && (
            <button
              onClick={handleClearCooldowns}
              className="hidden sm:inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200/90 items-center gap-1.5 hover:bg-amber-100 transition-colors shadow-xs"
              title="Cliquer pour réactiver immédiatement les modèles ou providers en pause"
            >
              <Clock className="w-3 h-3 text-amber-600 animate-pulse" />
              <span>{activeCooldowns.length} suspendu{activeCooldowns.length > 1 ? 's' : ''}</span>
              <span className="underline font-semibold ml-0.5 text-amber-900">(Réactiver)</span>
            </button>
          )}

          {/* Bouton Réinitialiser la discussion */}
          <button
            onClick={handleResetChat}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
            title="Réinitialiser la discussion"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Chat Messages Body */}
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-4 bg-slate-50/40">
        
        {/* Info banner */}
        <div className="text-center my-1">
          <div className="inline-flex flex-wrap items-center justify-center gap-2 px-3.5 py-1.5 bg-white border border-slate-200/60 rounded-full text-[11px] font-medium text-slate-600 shadow-xs">
            <span className="inline-flex items-center gap-1 text-indigo-600 font-bold">
              <Zap className="w-3.5 h-3.5" />
              <span>Orchestrateur Résilient</span>
            </span>
            <span className="text-slate-300">•</span>
            <span>Cascade de réputation active</span>
            <span className="text-slate-300">•</span>
            <span className="text-emerald-600 font-semibold">Tolérance aux pannes 100%</span>
          </div>
        </div>

        {/* Message stream */}
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          const hasFallback = Boolean(msg.fallbackChain && msg.fallbackChain.length > 0);
          const isExpanded = expandedFallbackId === msg.id;

          return (
            <div
              key={msg.id}
              className={`flex items-end gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              {!isUser && (
                <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center shrink-0 mb-1 ring-2 ring-slate-100 shadow-subtle">
                  <Bot className="w-4 h-4 text-indigo-400" />
                </div>
              )}

              <div className={`max-w-[88%] sm:max-w-[76%] rounded-2xl p-4 space-y-2 ${
                isUser
                  ? 'bg-slate-900 text-white rounded-br-xs shadow-subtle font-medium text-xs sm:text-sm'
                  : 'bg-white text-slate-800 border border-slate-200/70 rounded-bl-xs shadow-subtle'
              }`}>
                {/* Contenu du message */}
                {isUser ? (
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                ) : (
                  <MarkdownRenderer content={msg.text} />
                )}

                {/* Métadonnées Tuteur (Fournisseur, modèle, latence) */}
                {!isUser && (
                  <div className="pt-2 mt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-1 text-[10px] text-slate-400 font-medium">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {msg.isZeroDowntimeFallback ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 font-bold">
                          <ShieldCheck className="w-3 h-3 text-amber-600" />
                          <span>Moteur Résilient BetterSchool (Zéro Downtime)</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold border border-slate-200">
                          <Sparkles className="w-2.5 h-2.5 text-indigo-500" />
                          <span>{msg.providerName || 'IA'}</span>
                          {msg.modelUsed && <span className="text-slate-400">({msg.modelUsed})</span>}
                          {msg.latencyMs && <span>• {msg.latencyMs}ms</span>}
                        </span>
                      )}

                      {/* Indicateur de repli transparent si un provider a dû être sauté */}
                      {hasFallback && (
                        <button
                          onClick={() => setExpandedFallbackId(isExpanded ? null : msg.id)}
                          className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-semibold border border-indigo-100 transition-colors cursor-pointer"
                          title="Voir la chaîne de repli"
                        >
                          <Layers className="w-2.5 h-2.5" />
                          <span>Repli ({msg.fallbackChain?.length})</span>
                          {isExpanded ? <ChevronDown className="w-2.5 h-2.5" /> : <ChevronRight className="w-2.5 h-2.5" />}
                        </button>
                      )}
                    </div>

                    <span>{msg.time}</span>
                  </div>
                )}

                {/* Détails déroulants de la cascade de repli */}
                {hasFallback && isExpanded && (
                  <div className="mt-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-600 space-y-1">
                    <div className="font-bold text-slate-800 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-amber-500" />
                      <span>Cascade de résilience appliquée :</span>
                    </div>
                    {msg.fallbackChain?.map((fb, fidx) => (
                      <div key={fidx} className="flex items-center justify-between text-slate-500 pl-3 border-l-2 border-amber-300 py-0.5">
                        <span className="font-semibold text-slate-700">{fb.providerName}</span>
                        <span className="text-[10px] text-red-500 bg-red-50 px-1.5 py-0.2 rounded font-mono truncate max-w-[180px]">
                          {fb.error}
                        </span>
                      </div>
                    ))}
                    <div className="text-[10px] text-emerald-700 font-semibold pl-3 border-l-2 border-emerald-400 pt-0.5">
                      ✓ Résolu par {msg.providerName} sans coupure pour l'élève.
                    </div>
                  </div>
                )}

                {isUser && (
                  <div className="text-[10px] flex items-center justify-end text-slate-400">
                    <span>{msg.time}</span>
                  </div>
                )}
              </div>

              {isUser && (
                <div className="shrink-0 mb-1">
                  {student?.avatar ? (
                    <img
                      src={student.avatar}
                      alt="Avatar"
                      className="w-8 h-8 rounded-full object-cover ring-2 ring-slate-200"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs ring-2 ring-slate-200">
                      {student?.firstName ? student.firstName.charAt(0).toUpperCase() : 'E'}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Thinking Indicator */}
        {isThinking && (
          <div className="flex items-end gap-2.5 justify-start">
            <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center shrink-0 mb-1 ring-2 ring-slate-100 shadow-subtle">
              <Bot className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="bg-white border border-slate-200/70 rounded-2xl rounded-bl-xs p-3.5 shadow-subtle flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span className="text-xs text-slate-500 font-medium">
                {activeProviderName ? `Consultation de ${activeProviderName}...` : 'Réflexion pédagogique...'}
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggestions Pills */}
      <div className="px-3 sm:px-4 py-2 bg-white border-t border-slate-100 flex items-center gap-2 overflow-x-auto no-scrollbar">
        <span className="text-[10px] font-extrabold uppercase text-slate-400 shrink-0">Idées :</span>
        {suggestions.map((item, idx) => {
          const Icon = item.icon;
          return (
            <button
              key={idx}
              onClick={() => handleSendMessage(item.prompt)}
              className="m3-press shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200/80 text-slate-600 text-xs font-semibold border border-slate-200/60 transition-colors"
            >
              <Icon className="w-3.5 h-3.5 text-slate-400" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Bottom Message Input Form */}
      <form 
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="p-3 sm:p-4 bg-white border-t border-slate-100 flex items-center gap-2 sm:gap-3"
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Pose une question sur tes cours, devoirs ou révisions..."
          className="flex-1 px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200/70 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all font-medium"
        />

        <button
          type="submit"
          disabled={!inputText.trim() || isThinking}
          className="m3-press p-3 rounded-2xl bg-slate-900 hover:bg-indigo-600 disabled:opacity-40 disabled:hover:bg-slate-900 text-white transition-colors shadow-subtle shrink-0"
          title="Envoyer"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

    </div>
  );
};
