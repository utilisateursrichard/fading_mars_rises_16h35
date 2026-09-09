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
    <div className="h-[calc(100vh-140px)] min-h-[580px] bg-white rounded-3xl border border-slate-200/70 shadow-subtle overflow-hidden flex flex-col md:flex-row max-w-6xl mx-auto">
      
      {/* LEFT: Conversations List */}
      <div className={`w-full md:w-80 lg:w-96 border-r border-slate-200/70 flex flex-col bg-slate-50/50 ${
        isMobileChatOpen ? 'hidden md:flex' : 'flex'
      }`}>
        <div className="p-4 border-b border-slate-100 bg-white">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-extrabold text-base text-slate-900 tracking-tight">Messagerie</h3>
            <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-slate-100 text-slate-600">
              {conversations.length} contacts
            </span>
          </div>

          {/* Filter Pills */}
          <div className="flex gap-1 p-1 bg-slate-100 rounded-xl text-[11px] font-bold">
            <button
              onClick={() => setCategoryFilter('all')}
              className={`flex-1 py-1.5 rounded-lg transition-all ${
                categoryFilter === 'all' ? 'bg-white text-slate-900 shadow-subtle' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Tous
            </button>
            <button
              onClick={() => setCategoryFilter('teachers')}
              className={`flex-1 py-1.5 rounded-lg transition-all ${
                categoryFilter === 'teachers' ? 'bg-white text-slate-900 shadow-subtle' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Profs
            </button>
            <button
              onClick={() => setCategoryFilter('admin')}
              className={`flex-1 py-1.5 rounded-lg transition-all ${
                categoryFilter === 'admin' ? 'bg-white text-slate-900 shadow-subtle' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Vie Scolaire
            </button>
            <button
              onClick={() => setCategoryFilter('groups')}
              className={`flex-1 py-1.5 rounded-lg transition-all ${
                categoryFilter === 'groups' ? 'bg-white text-slate-900 shadow-subtle' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Groupes
            </button>
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredConversations.map((conv) => {
            const isSelected = conv.id === activeConversationId;
            return (
              <div
                key={conv.id}
                onClick={() => selectConversation(conv.id)}
                className={`cursor-pointer p-3 rounded-2xl transition-all flex items-start gap-3 ${
                  isSelected 
                    ? 'bg-white shadow-subtle border border-slate-200/80' 
                    : 'hover:bg-white/80 border border-transparent'
                }`}
              >
                <div className="relative shrink-0">
                  <img
                    src={conv.avatar}
                    alt={conv.name}
                    className="w-10 h-10 rounded-full object-cover ring-1 ring-slate-200"
                  />
                  {conv.online && (
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-white" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <h4 className="text-xs font-extrabold text-slate-900 truncate">
                      {conv.name}
                    </h4>
                    <span className="text-[10px] text-slate-400 shrink-0 font-medium">
                      {conv.lastMessageTime}
                    </span>
                  </div>

                  <p className="text-[10px] text-slate-400 truncate mt-0.5">
                    {conv.role}
                  </p>

                  <div className="flex items-center justify-between gap-2 mt-1">
                    <p className={`text-xs truncate ${conv.unreadCount > 0 ? 'font-bold text-slate-900' : 'text-slate-500'}`}>
                      {conv.lastMessage}
                    </p>
                    {conv.unreadCount > 0 && (
                      <span className="px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-indigo-600 text-white shrink-0">
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
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white z-10">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsMobileChatOpen(false)}
                className="md:hidden p-2 -ml-2 text-slate-600 hover:text-slate-900 rounded-xl"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              <div className="relative">
                <img
                  src={activeConv.avatar}
                  alt={activeConv.name}
                  className="w-9 h-9 rounded-full object-cover ring-1 ring-slate-200"
                />
                {activeConv.online && (
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-white" />
                )}
              </div>

              <div>
                <h4 className="font-bold text-sm text-slate-900">{activeConv.name}</h4>
                <p className="text-xs text-slate-400 flex items-center gap-1.5">
                  <span>{activeConv.role}</span>
                  {activeConv.online && (
                    <>
                      <span>•</span>
                      <span className="text-emerald-600 font-semibold">En ligne</span>
                    </>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 text-slate-400">
              <button 
                onClick={() => alert(`Appel avec ${activeConv.name}`)}
                className="p-2 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
                title="Appel audio"
              >
                <Phone className="w-4 h-4" />
              </button>
              <button 
                onClick={() => alert(`Visioconférence avec ${activeConv.name}`)}
                className="p-2 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
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
            <span className="px-3 py-1 bg-slate-100 rounded-full text-[10px] font-semibold text-slate-500">
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
                    className="w-7 h-7 rounded-full object-cover shrink-0 mb-1 ring-1 ring-slate-200"
                  />
                )}

                <div className={`max-w-[80%] sm:max-w-[70%] rounded-2xl p-3.5 space-y-1 ${
                  isMe
                    ? 'bg-slate-900 text-white rounded-br-xs shadow-subtle'
                    : 'bg-white text-slate-800 border border-slate-200/70 rounded-bl-xs shadow-subtle'
                }`}>
                  {!isMe && (
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      {msg.senderName}
                    </p>
                  )}
                  <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">
                    {msg.content}
                  </p>
                  <div className={`flex items-center justify-end gap-1 text-[10px] ${
                    isMe ? 'text-slate-400' : 'text-slate-400'
                  }`}>
                    <span>{msg.timestamp}</span>
                    {isMe && <CheckCheck className="w-3 h-3 text-indigo-400" />}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Field */}
        <form onSubmit={handleSend} className="p-3 sm:p-4 bg-white border-t border-slate-100">
          <div className="flex items-center gap-2 bg-slate-100/90 rounded-full px-4 py-1.5 border border-slate-200/60 focus-within:border-indigo-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
            <button
              type="button"
              onClick={() => alert('Dépôt de pièce jointe.')}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full"
              title="Joindre un fichier"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            <input
              type="text"
              placeholder={`Écrire à ${activeConv?.name || 'votre contact'}...`}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 bg-transparent text-xs sm:text-sm text-slate-800 placeholder-slate-400 outline-none py-1"
            />

            <button
              type="submit"
              disabled={!inputText.trim()}
              className={`p-2 rounded-full transition-all ${
                inputText.trim()
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-subtle'
                  : 'text-slate-300 cursor-not-allowed'
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
