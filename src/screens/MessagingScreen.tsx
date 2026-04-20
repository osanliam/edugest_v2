import { motion } from 'motion/react';
import { MessageSquare, Send, Search, User, Clock, CheckCheck, X } from 'lucide-react';
import { useState } from 'react';
import { User as UserType } from '../types';

interface MessagingScreenProps {
  user: UserType;
}

interface Message {
  id: string;
  sender: string;
  avatar: string;
  content: string;
  timestamp: string;
  read: boolean;
  senderRole: string;
}

interface Conversation {
  id: string;
  name: string;
  avatar: string;
  role: string;
  lastMessage: string;
  timestamp: string;
  unread: number;
}

const conversations: Conversation[] = [
  { id: '1', name: 'Prof. García', avatar: 'G', role: 'Docente', lastMessage: 'Recuerda la tarea para mañana', timestamp: '10:30', unread: 2 },
  { id: '2', name: 'Prof. López', avatar: 'L', role: 'Docente', lastMessage: 'Excelente participación hoy', timestamp: '14:20', unread: 0 },
  { id: '3', name: 'Grupo 3°A', avatar: '👥', role: 'Grupo', lastMessage: 'ej 3 hay duda sobre...', timestamp: '16:45', unread: 5 },
  { id: '4', name: 'María Pérez', avatar: 'M', role: 'Estudiante', lastMessage: 'Pasame los apuntes plis', timestamp: '18:00', unread: 1 },
  { id: '5', name: 'Director', avatar: 'D', role: 'Administrador', lastMessage: 'Recordatorio: evento viernes', timestamp: '09:15', unread: 0 },
];

const messages: Message[] = [
  { id: '1', sender: 'Prof. García', avatar: 'G', content: 'Hola, ¿cómo va con la tarea?', timestamp: '10:20', read: true, senderRole: 'teacher' },
  { id: '2', sender: 'Tú', avatar: 'TU', content: 'Buenos días profesor, casi termino', timestamp: '10:25', read: true, senderRole: 'self' },
  { id: '3', sender: 'Prof. García', avatar: 'G', content: 'Perfecto, recuerda la tarea para mañana', timestamp: '10:30', read: false, senderRole: 'teacher' },
  { id: '4', sender: 'Tú', avatar: 'TU', content: 'Claro, la entrego antes del mediodía', timestamp: '10:35', read: true, senderRole: 'self' },
];

export default function MessagingScreen({ user }: MessagingScreenProps) {
  const [selectedConversation, setSelectedConversation] = useState(conversations[0].id);
  const [messageText, setMessageText] = useState('');
  const [searchText, setSearchText] = useState('');

  const filteredConversations = conversations.filter(c =>
    c.name.toLowerCase().includes(searchText.toLowerCase())
  );

  const selectedConv = conversations.find(c => c.id === selectedConversation);

  return (
    <div className="min-h-screen p-6 pb-24">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-neon-cyan/20 rounded-lg neon-border-cyan">
            <MessageSquare className="w-8 h-8 text-neon-cyan" />
          </div>
          <div>
            <h1 className="text-4xl font-bold tracking-tighter uppercase">
              <span className="text-neon-cyan neon-text-cyan">Mensajes</span>
            </h1>
            <p className="text-xs text-white/75 font-mono tracking-widest">COMUNICACIÓN DIRECTA</p>
          </div>
        </div>
      </motion.div>

      {/* Main Container */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-180px)]">
        {/* Conversations List */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card neon-border-magenta p-4 flex flex-col"
        >
          {/* Search */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-white/40" />
              <input
                type="text"
                placeholder="Buscar..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="w-full pl-10 pr-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-white/40"
              />
            </div>
          </div>

          {/* Conversations */}
          <div className="flex-1 overflow-y-auto space-y-2">
            {filteredConversations.map((conv) => (
              <motion.button
                key={conv.id}
                onClick={() => setSelectedConversation(conv.id)}
                className={`w-full text-left p-3 rounded-lg transition-all ${
                  selectedConversation === conv.id
                    ? 'bg-neon-cyan/20 border border-neon-cyan'
                    : 'hover:bg-white/5 border border-transparent'
                }`}
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-neon-magenta/20 flex items-center justify-center flex-shrink-0 text-white font-bold">
                    {conv.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-white font-semibold text-sm truncate">{conv.name}</p>
                      {conv.unread > 0 && (
                        <span className="bg-neon-magenta text-black text-xs font-bold px-2 py-0.5 rounded-full">
                          {conv.unread}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-white/85 truncate">{conv.lastMessage}</p>
                    <p className="text-xs text-white/40 mt-1">{conv.timestamp}</p>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Chat Area */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 glass-card neon-border-cyan p-4 flex flex-col"
        >
          {/* Chat Header */}
          <div className="border-b border-white/10 pb-4 mb-4">
            {selectedConv && (
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-neon-cyan/20 flex items-center justify-center text-white font-bold">
                  {selectedConv.avatar}
                </div>
                <div>
                  <p className="text-white font-bold">{selectedConv.name}</p>
                  <p className="text-xs text-white/85">{selectedConv.role}</p>
                </div>
              </div>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto space-y-4 mb-4">
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-3 ${msg.senderRole === 'self' ? 'flex-row-reverse' : ''}`}
              >
                <div className="w-8 h-8 rounded-full bg-neon-lime/20 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {msg.avatar.charAt(0)}
                </div>
                <div className={`max-w-xs ${msg.senderRole === 'self' ? 'text-right' : ''}`}>
                  <div
                    className={`px-4 py-2 rounded-lg ${
                      msg.senderRole === 'self'
                        ? 'bg-neon-cyan/20 border border-neon-cyan text-white'
                        : 'bg-white/10 border border-white/20 text-white'
                    }`}
                  >
                    {msg.content}
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-1">
                    <p className="text-xs text-white/40">{msg.timestamp}</p>
                    {msg.senderRole === 'self' && msg.read && (
                      <CheckCheck className="w-3 h-3 text-neon-lime" />
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Message Input */}
          <div className="border-t border-white/10 pt-4">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Escribe un mensaje..."
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-white/40"
              />
              <button
                onClick={() => setMessageText('')}
                className="px-4 py-2 bg-neon-cyan/20 border border-neon-cyan text-neon-cyan hover:bg-neon-cyan/30 rounded-lg transition-all"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
