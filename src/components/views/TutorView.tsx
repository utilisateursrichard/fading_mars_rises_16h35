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
  Cpu,
  Layers,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  X,
  Key,
  ShieldCheck,
  Zap,
  Info,
  Ban
} from 'lucide-react';
import { useSchool } from '../../context/SchoolContext';
import { 
  AITutorService, 
  LLM_PROVIDERS_REGISTRY, 
  LLMProviderConfig, 
  isProviderConfigured,
  getProviderApiKey,
  StudentContextData,
  LLMTier
} from '../../services/aiTutorService';

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
  const [isProvidersModalOpen, setIsProvidersModalOpen] = useState(false);
  const [customKeyInputs, setCustomKeyInputs] = useState<Record<string, string>>({});
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

  // Suggestions dynamiques basées sur les vrais devoirs et matières
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

  // Statistiques sur les providers
  const configuredProvidersCount = useMemo(() => {
    return LLM_PROVIDERS_REGISTRY.filter(p => isProviderConfigured(p)).length;
  }, [isProvidersModalOpen, customKeyInputs]);

  // Premier provider actif dans la cascade
  const topActiveProvider = useMemo(() => {
    return LLM_PROVIDERS_REGISTRY
      .filter(p => isProviderConfigured(p))
      .sort((a, b) => a.reputationRank - b.reputationRank)[0] || null;
  }, [isProvidersModalOpen, customKeyInputs]);

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
      // Construction de la chaîne de messages pour le LLM
      const historyForLLM = [...messages, userMessage].map(m => ({
        role: (m.sender === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
        content: m.text
      }));

      // Appel au moteur d'orchestration avec cascade de fallback
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
      // Filet de sécurité absolu (ne devrait jamais survenir grâce au fallback local)
      const errorReply: TutorMessage = {
        id: `tutor-err-${Date.now()}`,
        sender: 'tutor',
        text: "Une erreur temporaire est survenue lors de l'accès au réseau. N'hésite pas à reposer ta question !",
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
    if (window.confirm('Voulez-vous réinitialiser l’historique de la conversation ?')) {
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

  // Formateur de texte Markdown simplifié pour les messages du Tuteur
  const renderFormattedContent = (text: string) => {
    const lines = text.split('\n');

    return (
      <div className="space-y-2 text-xs sm:text-sm leading-relaxed font-normal">
        {lines.map((line, idx) => {
          const trimmed = line.trim();

          // Titre niveau 3 ###
          if (trimmed.startsWith('### ')) {
            return (
              <h4 key={idx} className="text-sm sm:text-base font-bold text-slate-900 mt-3 mb-1 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 inline-block" />
                {trimmed.replace('### ', '')}
              </h4>
            );
          }

          // Titre niveau 2 ##
          if (trimmed.startsWith('## ')) {
            return (
              <h3 key={idx} className="text-base sm:text-lg font-extrabold text-slate-900 mt-3.5 mb-1.5 pb-1 border-b border-slate-100">
                {trimmed.replace('## ', '')}
              </h3>
            );
          }

          // Puces listes à tirets
          if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
            const rawContent = trimmed.slice(2);
            return (
              <div key={idx} className="flex items-start gap-2 pl-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0 mt-1.5" />
                <span>{renderInlineFormatting(rawContent)}</span>
              </div>
            );
          }

          // Liste numérotée (ex: 1. 2.)
          const numMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
          if (numMatch) {
            return (
              <div key={idx} className="flex items-start gap-2.5 pl-2">
                <span className="px-1.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-bold text-[10px] shrink-0 mt-0.5 border border-indigo-100">
                  {numMatch[1]}
                </span>
                <span>{renderInlineFormatting(numMatch[2])}</span>
              </div>
            );
          }

          // Ligne vide (paragraphe)
          if (!trimmed) {
            return <div key={idx} className="h-1.5" />;
          }

          // Paragraphe normal avec inline bold / italic / code
          return (
            <p key={idx}>
              {renderInlineFormatting(line)}
            </p>
          );
        })}
      </div>
    );
  };

  // Helper pour formater gras, code inline et italique
  const renderInlineFormatting = (content: string) => {
    // Découpage simple pour **gras** et `code`
    const parts = content.split(/(\*\*.*?\*\*|`.*?`)/g);

    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-bold text-slate-900">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code key={i} className="px-1.5 py-0.5 rounded bg-slate-100 text-indigo-700 font-mono text-[11px] border border-slate-200/80">
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
  };

  return (
    <div className="h-[calc(100vh-140px)] min-h-[600px] bg-white rounded-3xl border border-slate-200/70 shadow-subtle overflow-hidden flex flex-col max-w-5xl mx-auto">
      
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
                <span>Moteur résilient actif • 31 providers configurables</span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Bouton Fournisseurs & Fallback */}
          <button
            onClick={() => setIsProvidersModalOpen(true)}
            className="m3-press inline-flex items-center gap-1.5 px-3 py-1.5 sm:py-2 rounded-xl bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 border border-slate-200/70 text-slate-700 text-xs font-semibold transition-colors"
            title="Consulter les 31 API et l'état du fallback"
          >
            <Cpu className="w-3.5 h-3.5 text-indigo-600" />
            <span className="hidden sm:inline">Fournisseurs</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-white text-slate-600 border border-slate-200">
              {configuredProvidersCount}/31
            </span>
          </button>

          {/* Bouton Réinitialiser */}
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
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50/40">
        
        {/* Info banner */}
        <div className="text-center my-1">
          <div className="inline-flex flex-wrap items-center justify-center gap-2 px-3.5 py-1.5 bg-white border border-slate-200/60 rounded-full text-[11px] font-medium text-slate-600 shadow-xs">
            <span className="inline-flex items-center gap-1 text-indigo-600 font-bold">
              <Zap className="w-3.5 h-3.5" />
              <span>Orchestrateur Multi-Providers</span>
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
                {/* Contenu message */}
                {isUser ? (
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                ) : (
                  renderFormattedContent(msg.text)
                )}

                {/* Métadonnées Tuteur (Provider, Latence, Repli) */}
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

                      {/* Indicateur de repli si la requête a dû sauter un provider tombé en panne */}
                      {hasFallback && (
                        <button
                          onClick={() => setExpandedFallbackId(isExpanded ? null : msg.id)}
                          className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-semibold border border-indigo-100 transition-colors cursor-pointer"
                          title="Voir la chaîne de fallback"
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

      {/* MODALE FOURNISSEURS & ÉTAT DE FALLBACK */}
      {isProvidersModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            
            {/* Header Modale */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-subtle">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">
                    Annuaire des 31 Fournisseurs LLM
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Ordre de réputation et statut du système de repli zéro-downtime
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsProvidersModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Corps Modale */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
              
              {/* Notice explicative .env.api */}
              <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-100 text-xs text-indigo-950 space-y-1.5">
                <div className="font-bold flex items-center gap-1.5 text-indigo-900">
                  <Info className="w-4 h-4 text-indigo-600" />
                  <span>Configuration centralisée via `.env.api`</span>
                </div>
                <p className="leading-relaxed text-indigo-900/80">
                  Votre fichier <code className="px-1 py-0.5 bg-white rounded font-mono font-bold text-indigo-700">.env.api</code> à la racine contient l'ensemble des 31 clés. Il vous suffit de renseigner vos clés API gratuites pour les activer.
                  Vous pouvez également saisir ou écraser une clé directement ci-dessous pour tester dans le navigateur.
                </p>
              </div>

              {/* Liste des Providers par Tiers */}
              <div className="space-y-3">
                <div className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                  Chaîne de Fallback Pédagogique (Classée par Réputation)
                </div>

                <div className="space-y-2">
                  {LLM_PROVIDERS_REGISTRY.map((provider) => {
                    const isConfigured = isProviderConfigured(provider);
                    const apiKey = getProviderApiKey(provider);
                    const rawEnv = ((import.meta as any).env || {})[provider.envKeyName];
                    const isExplicitlyDisabled = 
                      (typeof rawEnv === 'string' && rawEnv.trim().toUpperCase() === 'FALSE') ||
                      (customKeyInputs[provider.id]?.trim().toUpperCase() === 'FALSE');

                    return (
                      <div 
                        key={provider.id}
                        className={`p-3 rounded-2xl border transition-all ${
                          isConfigured 
                            ? 'bg-emerald-50/40 border-emerald-200/80' 
                            : isExplicitlyDisabled
                              ? 'bg-slate-50/80 border-slate-200 opacity-60'
                              : 'bg-white border-slate-200/70'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-extrabold flex items-center justify-center shrink-0">
                              {provider.reputationRank}
                            </span>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className={`font-bold text-xs sm:text-sm truncate ${isExplicitlyDisabled ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                                  {provider.name}
                                </span>
                                <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-extrabold uppercase ${
                                  provider.tier === 1 ? 'bg-indigo-100 text-indigo-800' :
                                  provider.tier === 2 ? 'bg-blue-100 text-blue-800' :
                                  provider.tier === 3 ? 'bg-slate-100 text-slate-700' :
                                  'bg-emerald-100 text-emerald-800'
                                }`}>
                                  Tier {provider.tier}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-400 font-mono truncate">
                                Modèle : {provider.model} • {provider.rateLimit}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {isConfigured ? (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span className="hidden sm:inline">Actif</span>
                              </span>
                            ) : isExplicitlyDisabled ? (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-rose-50 text-rose-700 text-[11px] font-bold border border-rose-200/70">
                                <Ban className="w-3 h-3 text-rose-500" />
                                <span>Skipped (FALSE)</span>
                              </span>
                            ) : (
                              <a
                                href={provider.websiteUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold transition-colors"
                              >
                                <span>Clé gratuite</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            )}
                          </div>
                        </div>

                        {/* Champ de test direct de clé API */}
                        <div className="mt-2 pt-2 border-t border-slate-100/80 flex items-center gap-2">
                          <Key className="w-3 h-3 text-slate-400 shrink-0" />
                          <input
                            type="password"
                            placeholder={isConfigured ? 'Clé configurée (masquée) — saisir pour remplacer' : `Clé ${provider.envKeyName}...`}
                            value={customKeyInputs[provider.id] ?? (apiKey ? '••••••••••••••••' : '')}
                            onFocus={() => {
                              if (customKeyInputs[provider.id] === undefined && apiKey) {
                                setCustomKeyInputs(prev => ({ ...prev, [provider.id]: '' }));
                              }
                            }}
                            onChange={(e) => {
                              const val = e.target.value;
                              setCustomKeyInputs(prev => ({ ...prev, [provider.id]: val }));
                              AITutorService.saveCustomKey(provider.id, val);
                            }}
                            className="flex-1 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs font-mono text-slate-700 placeholder-slate-400 focus:outline-none focus:bg-white"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* Footer Modale */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <div className="text-xs text-slate-500 font-medium">
                {configuredProvidersCount > 0 ? (
                  <span className="text-emerald-700 font-bold">✓ {configuredProvidersCount} fournisseur(s) prêt(s) à répondre</span>
                ) : (
                  <span className="text-amber-700 font-semibold">ℹ️ Mode secours local actif (zéro interruption)</span>
                )}
              </div>
              <button
                onClick={() => setIsProvidersModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-indigo-600 text-white text-xs font-bold transition-colors shadow-subtle"
              >
                Fermer
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
