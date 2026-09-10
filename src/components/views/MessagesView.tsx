import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Paperclip, 
  ArrowLeft, 
  CheckCheck,
  Phone,
  Video
} from 'lucide-react';
import { useSchool } from '../../context/SchoolContext';

export const MessagesView: React.FC = () => {
  const { 
    conversations, 
    activeConversationId, 
    setActiveConversationId, 
    activeMessages, 
    sendMessage,
    globalSearch
  } = useSchool();

  const [inputText, setInputText] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'teachers' | 'admin' | 'groups'>('all');
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeMessages]);

  const activeConv = conversations.find(c => c.id === activeConversationId) || conversations[0];

  const filteredConversations = conversations.filter(c => {
    if (globalSearch) {
      const matchSearch = c.name.toLowerCase().includes(globalSearch.toLowerCase()) ||
                          c.lastMessage.toLowerCase().includes(globalSearch.toLowerCase());
      if (!matchSearch) return false;
    }
    if (categoryFilter !== 'all' && c.category !== categoryFilter) return false;
    return true;
  });

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const textToSend = inputText;
    setInputText('');
    await sendMessage(textToSend);
  };

  const selectConversation = (id: string) => {
    setActiveConversationId(id);
    setIsMobileChatOpen(true);
  };

  return (
    <div className="h-[calc(100vh-140px)] min-h-[580px] bg-white rounded-[32px] border border-indigo-100/80 shadow-xs overflow-hidden flex flex-col md:flex-row max-w-6xl mx-auto">
      
      {/* LEFT: Conversations List */}
      <div className={`w-full md:w-80 lg:w-96 border-r border-indigo-100/70 flex flex-col bg-slate-50/50 ${
        isMobileChatOpen ? 'hidden md:flex' : 'flex'
      }`}>
        <div className="p-4 sm:p-5 border-b border-indigo-50 bg-white">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-black text-lg text-slate-950 tracking-tight">Messagerie</h3>
            <span className="px-3 py-1 text-[11px] font-black rounded-full bg-indigo-100 text-indigo-900 border border-indigo-200/70 tabular-nums">
              {conversations.length} contacts
            </span>
          </div>

          {/* Filter Pills - M3E Segmented */}
          <div className="flex gap-1 p-1 bg-slate-100/90 rounded-full text-xs font-semibold border border-slate-200/50">
            <button
              onClick={() => setCategoryFilter('all')}
              className={`flex-1 py-1.5 rounded-full transition-all text-center m3-press ${
                categoryFilter === 'all' 
                  ? 'bg-white text-slate-950 font-black shadow-xs' 
                  : 'text-slate-500 hover:text-slate-950'
              }`}
            >
              Tous
            </button>
            <button
              onClick={() => setCategoryFilter('teachers')}
              className={`flex-1 py-1.5 rounded-full transition-all text-center m3-press ${
                categoryFilter === 'teachers' 
                  ? 'bg-white text-slate-950 font-black shadow-xs' 
                  : 'text-slate-500 hover:text-slate-950'
              }`}
            >
              Profs
            </button>
            <button
              onClick={() => setCategoryFilter('admin')}
              className={`flex-1 py-1.5 rounded-full transition-all text-center m3-press ${
                categoryFilter === 'admin' 
                  ? 'bg-white text-slate-950 font-black shadow-xs' 
                  : 'text-slate-500 hover:text-slate-950'
              }`}
            >
              Vie Scolaire
            </button>
            <button
              onClick={() => setCategoryFilter('groups')}
              className={`flex-1 py-1.5 rounded-full transition-all text-center m3-press ${
                categoryFilter === 'groups' 
                  ? 'bg-white text-slate-950 font-black shadow-xs' 
                  : 'text-slate-500 hover:text-slate-950'
              }`}
            >
              Groupes
            </button>
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5">
          {filteredConversations.map((conv) => {
            const isSelected = conv.id === activeConversationId;
            return (
              <div
                key={conv.id}
                onClick={() => selectConversation(conv.id)}
                className={`cursor-pointer p-3.5 rounded-[20px] transition-all flex items-start gap-3 m3-press ${
                  isSelected 
                    ? 'bg-white shadow-xs border border-indigo-200 ring-2 ring-indigo-50' 
                    : 'hover:bg-white/80 border border-transparent'
                }`}
              >
                <div className="relative shrink-0">
                  <img
                    src={conv.avatar}
                    alt={conv.name}
                    className="w-11 h-11 rounded-full object-cover ring-2 ring-indigo-100"
                  />
                  {conv.online && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full ring-2 ring-white" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <h4 className="text-xs font-black text-slate-950 truncate">
                      {conv.name}
                    </h4>
                    <span className="text-[10px] text-slate-400 shrink-0 font-bold tabular-nums">
                      {conv.lastMessageTime}
                    </span>
                  </div>

                  <p className="text-[10px] text-slate-400 font-semibold truncate mt-0.5">
                    {conv.role}
                  </p>

                  <div className="flex items-center justify-between gap-2 mt-1">
                    <p className={`text-xs truncate ${conv.unreadCount > 0 ? 'font-black text-slate-950' : 'text-slate-500 font-medium'}`}>
                      {conv.lastMessage}
                    </p>
                    {conv.unreadCount > 0 && (
                      <span className="px-2 py-0.5 text-[10px] font-black rounded-full bg-indigo-600 text-white shrink-0 tabular-nums shadow-xs">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* RIGHT: Chat Discussion */}
      <div className={`flex-1 flex flex-col bg-white ${
        !isMobileChatOpen ? 'hidden md:flex' : 'flex'
      }`}>
        {activeConv && (
          <div className="p-4 sm:p-5 border-b border-indigo-50 flex items-center justify-between bg-white z-10">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsMobileChatOpen(false)}
                className="md:hidden p-2 -ml-2 text-slate-600 hover:text-slate-950 rounded-full hover:bg-slate-100 m3-press"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              <div className="relative">
                <img
                  src={activeConv.avatar}
                  alt={activeConv.name}
                  className="w-10 h-10 rounded-full object-cover ring-2 ring-indigo-100"
                />
                {activeConv.online && (
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full ring-2 ring-white" />
                )}
              </div>

              <div>
                <h4 className="font-black text-sm sm:text-base text-slate-950">{activeConv.name}</h4>
                <p className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
                  <span>{activeConv.role}</span>
                  {activeConv.online && (
                    <>
                      <span>•</span>
                      <span className="text-emerald-600 font-bold">En ligne</span>
                    </>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 text-slate-400">
              <button 
                onClick={() => alert(`Appel avec ${activeConv.name}`)}
                className="p-2.5 hover:text-slate-700 hover:bg-indigo-50 rounded-full transition-colors m3-press"
                title="Appel audio"
              >
                <Phone className="w-4 h-4" />
              </button>
              <button 
                onClick={() => alert(`Visioconférence avec ${activeConv.name}`)}
                className="p-2.5 hover:text-slate-700 hover:bg-indigo-50 rounded-full transition-colors m3-press"
                title="Visioconférence"
              >
                <Video className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3.5 bg-slate-50/40">
          <div className="text-center my-1">
            <span className="px-4 py-1 bg-indigo-50/80 rounded-full text-[10px] font-bold text-indigo-800 tracking-wide border border-indigo-100/70">
              Canal sécurisé ENT • Année 2025-2026
            </span>
          </div>

          {activeMessages.map((msg) => {
            const isMe = msg.isSelf;
            return (
              <div
                key={msg.id}
                className={`flex items-end gap-2.5 ${isMe ? 'justify-end' : 'justify-start'}`}
              >
                {!isMe && (
                  <img
                    src={msg.senderAvatar}
                    alt={msg.senderName}
                    className="w-8 h-8 rounded-full object-cover shrink-0 mb-1 ring-2 ring-slate-200"
                  />
                )}

                <div className={`max-w-[80%] sm:max-w-[70%] rounded-[22px] p-4 space-y-1 ${
                  isMe
                    ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-br-[4px] shadow-sm'
                    : 'bg-white text-slate-950 border border-slate-200/80 rounded-bl-[4px] shadow-2xs'
                }`}>
                  {!isMe && (
                    <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">
                      {msg.senderName}
                    </p>
                  )}
                  <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap font-medium">
                    {msg.content}
                  </p>
                  <div className={`flex items-center justify-end gap-1 text-[10px] ${
                    isMe ? 'text-indigo-200' : 'text-slate-400'
                  }`}>
                    <span className="tabular-nums font-bold">{msg.timestamp}</span>
                    {isMe && <CheckCheck className="w-3.5 h-3.5 text-white" />}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Field - M3E Floating Pill Bar */}
        <form onSubmit={handleSend} className="p-3 sm:p-4 bg-white border-t border-indigo-50">
          <div className="flex items-center gap-2 bg-slate-50 rounded-full px-4 py-2 border border-slate-200/80 focus-within:border-indigo-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-indigo-100/50 transition-all shadow-xs">
            <button
              type="button"
              onClick={() => alert('Dépôt de pièce jointe.')}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors m3-press"
              title="Joindre un fichier"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            <input
              type="text"
              placeholder={`Écrire à ${activeConv?.name || 'votre contact'}...`}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 bg-transparent text-xs sm:text-sm text-slate-900 placeholder-slate-400 outline-none py-1 font-semibold"
            />

            <button
              type="submit"
              disabled={!inputText.trim()}
              className={`p-2.5 rounded-full transition-all m3-press ${
                inputText.trim()
                  ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/30'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>

    </div>
  );
};
