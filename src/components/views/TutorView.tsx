import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  Send, 
  Sparkles, 
  RotateCcw, 
  HelpCircle, 
  BookOpen, 
  Code2, 
  Calculator, 
  Feather,
  Lightbulb
} from 'lucide-react';
import { useSchool } from '../../context/SchoolContext';

interface TutorMessage {
  id: string;
  sender: 'user' | 'tutor';
  text: string;
  time: string;
}

const SUGGESTIONS = [
  { label: 'Démarche d\'investigation en Science', icon: Code2, prompt: 'Peux-tu m\'expliquer la démarche d\'investigation en Science ?' },
  { label: 'Continuité & TVI en Maths', icon: Calculator, prompt: 'Comment démontrer la stricte monotonie avec le TVI ?' },
  { label: 'Thème Technique & Nature (Kialuta)', icon: Feather, prompt: 'Quels arguments retenir sur Heidegger et la technique ?' },
  { label: 'Méthode de révision efficace', icon: Lightbulb, prompt: 'Quel est le meilleur planning pour préparer mes DS de la semaine ?' }
];

export const TutorView: React.FC = () => {
  const { student } = useSchool();
  const [inputText, setInputText] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [messages, setMessages] = useState<TutorMessage[]>([
    {
      id: 'msg-init',
      sender: 'tutor',
      text: `Bonjour ${student?.firstName || 'Richard'} ! Je suis ton tuteur IA. Pose-moi une question sur tes cours, un devoir à préparer ou une méthode de révision.`,
      time: 'À l’instant'
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  const handleSendMessage = (textToSend?: string) => {
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

    // Simulation de réponse placeholder du tuteur IA
    setTimeout(() => {
      const placeholderId = Math.floor(Math.random() * 900 + 100);
      const tutorReply: TutorMessage = {
        id: `tutor-${Date.now()}`,
        sender: 'tutor',
        text: `message placeholder ${placeholderId}`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, tutorReply]);
      setIsThinking(false);
    }, 700);
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: `msg-${Date.now()}`,
        sender: 'tutor',
        text: `Bonjour ${student?.firstName || 'Richard'} ! Conversation réinitialisée. En quoi puis-je t'aider ?`,
        time: 'À l’instant'
      }
    ]);
  };

  return (
    <div className="h-[calc(100vh-140px)] min-h-[580px] bg-white rounded-3xl border border-slate-200/70 shadow-subtle overflow-hidden flex flex-col max-w-5xl mx-auto">
      
      {/* Top Header */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-white z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-subtle">
            <Bot className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-base text-slate-900 tracking-tight">Tuteur IA</h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100/80">
                Assistant Virtuel
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Accompagnement méthodologique et révision de cours
            </p>
          </div>
        </div>

        <button
          onClick={handleResetChat}
          className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
          title="Réinitialiser la discussion"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Chat Messages Body */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50/40">
        
        {/* Info banner */}
        <div className="text-center my-1">
          <span className="px-3.5 py-1.5 bg-white border border-slate-200/60 rounded-full text-[11px] font-medium text-slate-500 shadow-xs inline-flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-indigo-500" />
            <span>Tuteur IA connecté à tes matières • Réponses en mode placeholder</span>
          </span>
        </div>

        {/* Message stream */}
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          return (
            <div
              key={msg.id}
              className={`flex items-end gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              {!isUser && (
                <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center shrink-0 mb-1 ring-2 ring-slate-100">
                  <Bot className="w-4 h-4 text-indigo-400" />
                </div>
              )}

              <div className={`max-w-[80%] sm:max-w-[70%] rounded-2xl p-4 space-y-1.5 ${
                isUser
                  ? 'bg-slate-900 text-white rounded-br-xs shadow-subtle'
                  : 'bg-white text-slate-800 border border-slate-200/70 rounded-bl-xs shadow-subtle'
              }`}>
                <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap font-medium">
                  {msg.text}
                </p>
                <div className={`text-[10px] flex items-center ${isUser ? 'justify-end text-slate-400' : 'text-slate-400'}`}>
                  <span>{msg.time}</span>
                </div>
              </div>

              {isUser && (
                <img
                  src={student?.avatar}
                  alt="Avatar"
                  className="w-8 h-8 rounded-full object-cover shrink-0 mb-1 ring-2 ring-slate-200"
                />
              )}
            </div>
          );
        })}

        {/* Thinking Indicator */}
        {isThinking && (
          <div className="flex items-end gap-2.5 justify-start">
            <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center shrink-0 mb-1 ring-2 ring-slate-100">
              <Bot className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="bg-white border border-slate-200/70 rounded-2xl rounded-bl-xs p-3.5 shadow-subtle flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggestions Pills */}
      <div className="px-4 py-2.5 bg-white border-t border-slate-100 flex items-center gap-2 overflow-x-auto no-scrollbar">
        <span className="text-[10px] font-bold uppercase text-slate-400 shrink-0">Suggestions :</span>
        {SUGGESTIONS.map((item, idx) => {
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
          placeholder="Pose une question à ton Tuteur IA..."
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

