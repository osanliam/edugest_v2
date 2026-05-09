import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, Send, Search, X, Plus, Megaphone, CheckCheck, Trash2, ChevronLeft, Users, ArrowLeft } from 'lucide-react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { User as UserType } from '../types';
import { Message } from '../types';
import { getConversaciones, enviarMensaje, marcarMensajesLeidos, eliminarMensaje } from '../utils/apiClient';
import { getMensajes, guardarMensajes, getUsuarios, getMaestros, getEstudiantes } from '../services/dataService';
import HeaderElegante from '../components/HeaderElegante';

interface MessagingScreenProps {
  user: UserType;
}

interface Contact {
  id: string;
  name: string;
  role: string;
  avatar: string;
}

type ViewMode = 'lista' | 'nuevo-mensaje' | 'nuevo-anuncio' | 'chat';

const PRIORITY_COLORS: Record<string, string> = {
  baja: 'bg-white/10 text-white/60',
  normal: 'bg-white/10 text-white/80',
  alta: 'bg-yellow-500/20 text-yellow-400',
  urgente: 'bg-red-500/20 text-red-400',
};

const CATEGORY_LABELS: Record<string, string> = {
  academico: 'Academico',
  administrativo: 'Administrativo',
  general: 'General',
  urgente: 'Urgente',
};

const ROLE_ORDER: Record<string, number> = {
  admin: 0, director: 1, subdirector: 2, teacher: 3, parent: 4, student: 5,
};

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrador', director: 'Director', subdirector: 'Subdirector',
  teacher: 'Docente', student: 'Estudiante', parent: 'Apoderado',
};

const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-red-500/20 text-red-400 border-red-500/30',
  director: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  subdirector: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  teacher: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  student: 'bg-green-500/20 text-green-400 border-green-500/30',
  parent: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
};

function buildContacts(users: any[], teachers: any[], students: any[], currentUserId: string): Contact[] {
  const contacts: Contact[] = [];
  const seen = new Set<string>();

  for (const u of users) {
    if (u.id && u.id !== currentUserId && !seen.has(u.id)) {
      seen.add(u.id);
      const name = u.nombre || u.name || u.email || 'Sin nombre';
      contacts.push({
        id: u.id,
        name,
        role: u.rol || u.role || 'usuario',
        avatar: name.charAt(0).toUpperCase(),
      });
    }
  }

  for (const t of teachers) {
    const tid = t.id || t.docenteId;
    if (tid && !seen.has(tid)) {
      seen.add(tid);
      const name = t.apellidos_nombres || t.nombre || 'Docente';
      contacts.push({ id: tid, name, role: 'teacher', avatar: name.charAt(0).toUpperCase() });
    }
  }

  for (const s of students) {
    const sid = s.id || s.alumnoId;
    if (sid && !seen.has(sid)) {
      seen.add(sid);
      const name = s.apellidos_nombres || s.nombre || 'Estudiante';
      contacts.push({ id: sid, name, role: 'student', avatar: name.charAt(0).toUpperCase() });
    }
  }

  return contacts.sort((a, b) => (ROLE_ORDER[a.role] ?? 9) - (ROLE_ORDER[b.role] ?? 9) || a.name.localeCompare(b.name));
}

function buildConversations(messages: Message[], currentUserId: string, contacts: Contact[]): Map<string, { otherUser: Contact; lastMessage: Message; unreadCount: number }> {
  const convMap = new Map<string, { otherUser: Contact; lastMessage: Message; unreadCount: number }>();

  for (const m of messages) {
    if (m.isBroadcast) continue;
    const otherId = m.senderId === currentUserId ? m.receiverId : m.senderId;
    if (!otherId) continue;

    const existing = convMap.get(otherId);
    const isUnread = m.receiverId === currentUserId && !m.read;

    const contactInfo = contacts.find(c => c.id === otherId);
    const otherName = m.senderId === currentUserId
      ? (m.receiverId ? (contactInfo?.name || m.receiverId) : 'Desconocido')
      : m.senderName || contactInfo?.name || otherId;

    if (!existing || new Date(m.date) > new Date(existing.lastMessage.date)) {
      convMap.set(otherId, {
        otherUser: { id: otherId, name: otherName, role: contactInfo?.role || '', avatar: otherName.charAt(0).toUpperCase() },
        lastMessage: m,
        unreadCount: (existing?.unreadCount || 0) + (isUnread ? 1 : 0),
      });
    } else if (isUnread) {
      existing.unreadCount++;
    }
  }

  return convMap;
}

export default function MessagingScreen({ user }: MessagingScreenProps) {
  const [allMessages, setAllMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [selectedIsBroadcast, setSelectedIsBroadcast] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [searchText, setSearchText] = useState('');
  const [contactSearch, setContactSearch] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('lista');
  const [activeTab, setActiveTab] = useState<'conversaciones' | 'broadcasts'>('conversaciones');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [sending, setSending] = useState(false);
  const [newMsgForm, setNewMsgForm] = useState({ receiverId: '', subject: '', text: '', priority: 'normal' as const, category: 'general' as const });
  const [broadcastForm, setBroadcastForm] = useState({ subject: '', text: '', priority: 'normal' as const, category: 'general' as const });
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentUserId = user?.id || user?.docenteId || 'anonymous';
  const currentUserName = user?.name || 'Usuario';
  const isAdmin = user?.role === 'admin' || user?.role === 'director' || user?.role === 'subdirector';

  const loadMessages = useCallback(async () => {
    setLoading(true);
    try {
      const apiMessages = await getConversaciones();
      if (apiMessages && apiMessages.length > 0) {
        const parsed: Message[] = apiMessages.map((m: any) => ({
          id: m.id, senderId: m.senderId || '', senderName: m.senderName || '',
          receiverId: m.receiverId || '', subject: m.subject || '',
          text: m.text || m.body || '', date: m.date || m.sentDate || '',
          read: !!(m.read === 1 || m.read === true), isBroadcast: !!(m.isBroadcast === 1 || m.isBroadcast === true),
          priority: m.priority || 'normal', category: m.category || 'general',
        }));
        setAllMessages(parsed);
        guardarMensajes(parsed);
      } else {
        const localMessages = getMensajes();
        if (localMessages.length > 0) {
          const parsed: Message[] = localMessages.map((m: any) => ({
            id: m.id, senderId: m.senderId || '', senderName: m.senderName || '',
            receiverId: m.receiverId || '', subject: m.subject || '',
            text: m.text || m.body || '', date: m.date || m.sentDate || '',
            read: !!(m.read === 1 || m.read === true || m.isRead),
            isBroadcast: !!(m.isBroadcast === 1 || m.isBroadcast === true),
            priority: m.priority || 'normal', category: m.category || 'general',
          }));
          setAllMessages(parsed);
        }
      }
    } catch {
      const localMessages = getMensajes();
      if (localMessages.length > 0) {
        const parsed: Message[] = localMessages.map((m: any) => ({
          id: m.id, senderId: m.senderId || '', senderName: m.senderName || '',
          receiverId: m.receiverId || '', subject: m.subject || '',
          text: m.text || m.body || '', date: m.date || m.sentDate || '',
          read: !!(m.read === 1 || m.read === true || m.isRead),
          isBroadcast: !!(m.isBroadcast === 1 || m.isBroadcast === true),
          priority: m.priority || 'normal', category: m.category || 'general',
        }));
        setAllMessages(parsed);
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadMessages();
    const users = getUsuarios();
    const teachers = getMaestros();
    const students = getEstudiantes();
    setContacts(buildContacts(users, teachers, students, currentUserId));
  }, [loadMessages, currentUserId]);

  const conversations = buildConversations(allMessages, currentUserId, contacts);
  const broadcastMessages = allMessages.filter(m => m.isBroadcast).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const convArray = Array.from(conversations.values()).sort((a, b) =>
    new Date(b.lastMessage.date).getTime() - new Date(a.lastMessage.date).getTime()
  );

  const filteredConversations = convArray.filter(c =>
    c.otherUser.name.toLowerCase().includes(searchText.toLowerCase()) ||
    c.lastMessage.text.toLowerCase().includes(searchText.toLowerCase())
  );

  const filteredBroadcasts = broadcastMessages.filter(m =>
    (m.subject || '').toLowerCase().includes(searchText.toLowerCase()) ||
    m.text.toLowerCase().includes(searchText.toLowerCase())
  );

  const filteredContacts = contacts.filter(c =>
    c.name.toLowerCase().includes(contactSearch.toLowerCase()) ||
    ROLE_LABELS[c.role]?.toLowerCase().includes(contactSearch.toLowerCase())
  );

  const groupedContacts = filteredContacts.reduce((acc, c) => {
    const role = c.role || 'other';
    if (!acc[role]) acc[role] = [];
    acc[role].push(c);
    return acc;
  }, {} as Record<string, Contact[]>);

  const currentConversationMessages = selectedContact
    ? allMessages
        .filter(m => !m.isBroadcast && ((m.senderId === currentUserId && m.receiverId === selectedContact.id) || (m.senderId === selectedContact.id && m.receiverId === currentUserId)))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    : selectedIsBroadcast
    ? broadcastMessages
    : [];

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [currentConversationMessages]);

  useEffect(() => { if (msg) { const t = setTimeout(() => setMsg(null), 3000); return () => clearTimeout(t); } }, [msg]);

  const handleSelectConversation = async (contact: Contact) => {
    setSelectedContact(contact);
    setSelectedIsBroadcast(false);
    setViewMode('chat');
    const unreadIds = allMessages.filter(m => m.senderId === contact.id && m.receiverId === currentUserId && !m.read).map(m => m.id);
    if (unreadIds.length > 0) {
      setAllMessages(prev => prev.map(m => unreadIds.includes(m.id) ? { ...m, read: true } : m));
      try { await marcarMensajesLeidos({ otherUserId: contact.id }); } catch {}
    }
  };

  const handleSelectBroadcast = () => {
    setSelectedContact(null);
    setSelectedIsBroadcast(true);
    setViewMode('chat');
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedContact) return;
    setSending(true);
    try {
      await enviarMensaje({ senderId: currentUserId, senderName: currentUserName, receiverId: selectedContact.id, text: messageText.trim(), priority: 'normal', category: 'general' });
      setMessageText('');
      await loadMessages();
      setMsg({ type: 'success', text: 'Mensaje enviado' });
    } catch { setMsg({ type: 'error', text: 'Error al enviar mensaje' }); }
    setSending(false);
  };

  const handleSendNewMessage = async () => {
    if (!newMsgForm.receiverId || !newMsgForm.text.trim()) {
      setMsg({ type: 'error', text: 'Selecciona destinatario y escribe el mensaje' });
      return;
    }
    setSending(true);
    try {
      await enviarMensaje({
        senderId: currentUserId, senderName: currentUserName,
        receiverId: newMsgForm.receiverId, subject: newMsgForm.subject,
        text: newMsgForm.text.trim(), priority: newMsgForm.priority, category: newMsgForm.category,
      });
      const recipient = contacts.find(c => c.id === newMsgForm.receiverId);
      setNewMsgForm({ receiverId: '', subject: '', text: '', priority: 'normal', category: 'general' });
      await loadMessages();
      if (recipient) {
        handleSelectConversation(recipient);
      } else {
        setViewMode('lista');
      }
      setMsg({ type: 'success', text: 'Mensaje enviado' });
    } catch { setMsg({ type: 'error', text: 'Error al enviar mensaje' }); }
    setSending(false);
  };

  const handleSendBroadcast = async () => {
    if (!broadcastForm.text.trim()) {
      setMsg({ type: 'error', text: 'Escribe el contenido del anuncio' });
      return;
    }
    setSending(true);
    try {
      await enviarMensaje({
        senderId: currentUserId, senderName: currentUserName,
        receiverId: '', subject: broadcastForm.subject, text: broadcastForm.text.trim(),
        isBroadcast: true, priority: broadcastForm.priority, category: broadcastForm.category,
      });
      setBroadcastForm({ subject: '', text: '', priority: 'normal', category: 'general' });
      handleSelectBroadcast();
      await loadMessages();
      setMsg({ type: 'success', text: 'Anuncio publicado' });
    } catch { setMsg({ type: 'error', text: 'Error al publicar anuncio' }); }
    setSending(false);
  };

  const handleDeleteMessage = async (id: string) => {
    try {
      await eliminarMensaje(id);
      setAllMessages(prev => prev.filter(m => m.id !== id));
      setDeleteConfirm(null);
      setMsg({ type: 'success', text: 'Mensaje eliminado' });
    } catch { setMsg({ type: 'error', text: 'Error al eliminar' }); }
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - d.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);
      if (diffMins < 1) return 'Ahora';
      if (diffMins < 60) return `Hace ${diffMins}m`;
      if (diffHours < 24) return `Hace ${diffHours}h`;
      if (diffDays < 7) return `Hace ${diffDays}d`;
      return d.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' });
    } catch { return dateStr; }
  };

  const totalUnread = allMessages.filter(m => m.receiverId === currentUserId && !m.read && !m.isBroadcast).length;

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER: Nuevo Mensaje (buscar contactos)
  // ─────────────────────────────────────────────────────────────────────────
  if (viewMode === 'nuevo-mensaje') {
    return (
      <div className="min-h-screen p-4 md:p-6 pb-24">
        <HeaderElegante icon={Plus} title="NUEVO MENSAJE" subtitle="Busca y selecciona un contacto para conversar" />

        {msg && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className={`mb-4 p-3 rounded-lg border text-sm ${msg.type === 'success' ? 'bg-neon-lime/10 border-neon-lime/30 text-neon-lime' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
            {msg.text}
          </motion.div>
        )}

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card neon-border-cyan p-4 mt-4">
          {/* Back button */}
          <button onClick={() => setViewMode('lista')} className="flex items-center gap-2 text-white/60 hover:text-white mb-4 text-sm">
            <ArrowLeft className="w-4 h-4" /> Volver a mensajes
          </button>

          {/* Search contacts */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-3 w-4 h-4 text-white/40" />
            <input
              type="text"
              placeholder="Buscar por nombre o rol..."
              value={contactSearch}
              onChange={(e) => setContactSearch(e.target.value)}
              className="w-full pl-10 pr-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder:text-white/30 focus:border-neon-cyan focus:outline-none"
              autoFocus
            />
          </div>

          {/* Contact list grouped by role */}
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            {Object.entries(groupedContacts).length === 0 && (
              <div className="text-center py-8 text-white/30">
                <Users className="w-10 h-10 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No se encontraron contactos</p>
              </div>
            )}
            {Object.entries(groupedContacts).map(([role, roleContacts]) => (
              <div key={role}>
                <p className="text-xs font-bold text-white/40 uppercase tracking-wider mb-2 px-1">
                  {ROLE_LABELS[role] || role} ({roleContacts.length})
                </p>
                <div className="space-y-1">
                  {roleContacts.map(contact => (
                    <motion.button
                      key={contact.id}
                      onClick={() => {
                        if (conversations.has(contact.id)) {
                          handleSelectConversation(contact);
                        } else {
                          setNewMsgForm(prev => ({ ...prev, receiverId: contact.id }));
                          setViewMode('chat');
                          setSelectedContact(contact);
                          setSelectedIsBroadcast(false);
                        }
                      }}
                      className={`w-full text-left p-3 rounded-lg transition-all hover:bg-white/5 border border-transparent hover:border-white/10`}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm border ${ROLE_COLORS[contact.role] || 'bg-white/10 border-white/20'}`}>
                          {contact.avatar}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-semibold text-sm truncate">{contact.name}</p>
                          <span className="text-[10px] text-white/40 px-1.5 py-0.5 bg-white/5 rounded">
                            {ROLE_LABELS[contact.role] || contact.role}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {conversations.has(contact.id) && (
                            <span className="text-[10px] text-neon-cyan/70 bg-neon-cyan/10 px-2 py-0.5 rounded">
                              Conversar
                            </span>
                          )}
                          <Plus className="w-4 h-4 text-white/30" />
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER: Nuevo Anuncio (solo admin/director/subdirector)
  // ─────────────────────────────────────────────────────────────────────────
  if (viewMode === 'nuevo-anuncio') {
    return (
      <div className="min-h-screen p-4 md:p-6 pb-24">
        <HeaderElegante icon={Megaphone} title="NUEVO ANUNCIO" subtitle="Publicar un anuncio para todos los usuarios" />

        {msg && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className={`mb-4 p-3 rounded-lg border text-sm ${msg.type === 'success' ? 'bg-neon-lime/10 border-neon-lime/30 text-neon-lime' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
            {msg.text}
          </motion.div>
        )}

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card neon-border-magenta p-6 mt-4 max-w-2xl mx-auto">
          <button onClick={() => setViewMode('lista')} className="flex items-center gap-2 text-white/60 hover:text-white mb-6 text-sm">
            <ArrowLeft className="w-4 h-4" /> Volver a mensajes
          </button>

          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-full bg-neon-magenta/20 flex items-center justify-center border border-neon-magenta/30">
              <Megaphone className="w-6 h-6 text-neon-magenta" />
            </div>
            <div>
              <h3 className="text-white font-bold">Crear Anuncio</h3>
              <p className="text-xs text-white/50">Los anuncios son visibles para todos los usuarios</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm text-white/60 mb-1.5 block font-medium">Asunto</label>
              <input
                type="text"
                value={broadcastForm.subject}
                onChange={(e) => setBroadcastForm(prev => ({ ...prev, subject: e.target.value }))}
                placeholder="Titulo del anuncio..."
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder:text-white/25 focus:border-neon-magenta focus:outline-none"
              />
            </div>
            <div>
              <label className="text-sm text-white/60 mb-1.5 block font-medium">Contenido del anuncio</label>
              <textarea
                value={broadcastForm.text}
                onChange={(e) => setBroadcastForm(prev => ({ ...prev, text: e.target.value }))}
                placeholder="Escribe el contenido del anuncio que veran todos los usuarios..."
                rows={5}
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder:text-white/25 focus:border-neon-magenta focus:outline-none resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-white/60 mb-1.5 block font-medium">Prioridad</label>
                <select
                  value={broadcastForm.priority}
                  onChange={(e) => setBroadcastForm(prev => ({ ...prev, priority: e.target.value as any }))}
                  className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:border-neon-magenta focus:outline-none"
                >
                  <option value="baja" className="bg-slate-800">Baja</option>
                  <option value="normal" className="bg-slate-800">Normal</option>
                  <option value="alta" className="bg-slate-800">Alta</option>
                  <option value="urgente" className="bg-slate-800">Urgente</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-white/60 mb-1.5 block font-medium">Categoria</label>
                <select
                  value={broadcastForm.category}
                  onChange={(e) => setBroadcastForm(prev => ({ ...prev, category: e.target.value as any }))}
                  className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:border-neon-magenta focus:outline-none"
                >
                  <option value="general" className="bg-slate-800">General</option>
                  <option value="academico" className="bg-slate-800">Academico</option>
                  <option value="administrativo" className="bg-slate-800">Administrativo</option>
                  <option value="urgente" className="bg-slate-800">Urgente</option>
                </select>
              </div>
            </div>

            {broadcastForm.text.trim() && (
              <div className="p-3 bg-white/5 border border-white/10 rounded-lg">
                <p className="text-xs text-white/40 mb-1">Vista previa:</p>
                <div className="p-3 bg-neon-magenta/10 border border-neon-magenta/20 rounded-lg">
                  <p className="text-white font-semibold text-sm">{broadcastForm.subject || 'Sin asunto'}</p>
                  <p className="text-white/70 text-sm mt-1">{broadcastForm.text}</p>
                  <div className="flex gap-1 mt-2">
                    {broadcastForm.priority !== 'normal' && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${PRIORITY_COLORS[broadcastForm.priority]}`}>
                        {broadcastForm.priority}
                      </span>
                    )}
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-white/40">
                      {CATEGORY_LABELS[broadcastForm.category] || broadcastForm.category}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={handleSendBroadcast}
              disabled={sending || !broadcastForm.text.trim()}
              className="w-full px-4 py-3 bg-neon-magenta/20 border border-neon-magenta text-neon-magenta hover:bg-neon-magenta/30 rounded-lg transition-all disabled:opacity-40 flex items-center justify-center gap-2 text-sm font-medium"
            >
              <Megaphone className="w-4 h-4" />
              {sending ? 'Publicando...' : 'Publicar Anuncio'}
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER: Chat view (conversaciones + mensajes)
  // ─────────────────────────────────────────────────────────────────────────
  const renderListPanel = () => (
    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="glass-card neon-border-magenta p-4 flex flex-col h-full">
      {/* Tabs */}
      <div className="flex gap-1 mb-3">
        <button
          onClick={() => setActiveTab('conversaciones')}
          className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-all ${
            activeTab === 'conversaciones' ? 'bg-neon-cyan/20 border border-neon-cyan text-neon-cyan' : 'bg-white/5 border border-transparent text-white/60 hover:text-white/80'
          }`}
        >
          Conversaciones
        </button>
        <button
          onClick={() => setActiveTab('broadcasts')}
          className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-all ${
            activeTab === 'broadcasts' ? 'bg-neon-magenta/20 border border-neon-magenta text-neon-magenta' : 'bg-white/5 border border-transparent text-white/60 hover:text-white/80'
          }`}
        >
          Anuncios {broadcastMessages.length > 0 && <span className="ml-1 bg-neon-magenta text-black text-[10px] px-1.5 py-0.5 rounded-full">{broadcastMessages.length}</span>}
        </button>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 mb-3">
        <button
          onClick={() => setViewMode('nuevo-mensaje')}
          className="flex-1 px-3 py-2 bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan hover:bg-neon-cyan/20 rounded-lg transition-all text-xs font-medium flex items-center justify-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" /> Nuevo Mensaje
        </button>
        {isAdmin && (
          <button
            onClick={() => setViewMode('nuevo-anuncio')}
            className="flex-1 px-3 py-2 bg-neon-magenta/10 border border-neon-magenta/30 text-neon-magenta hover:bg-neon-magenta/20 rounded-lg transition-all text-xs font-medium flex items-center justify-center gap-1.5"
          >
            <Megaphone className="w-3.5 h-3.5" /> Nuevo Anuncio
          </button>
        )}
      </div>

      {/* Search */}
      <div className="mb-3 relative">
        <Search className="absolute left-3 top-3 w-4 h-4 text-white/40" />
        <input
          type="text"
          placeholder="Buscar..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="w-full pl-10 pr-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder:text-white/30 focus:border-neon-cyan focus:outline-none"
        />
      </div>

      {/* Content based on tab */}
      <div className="flex-1 overflow-y-auto space-y-1 min-h-0">
        {activeTab === 'conversaciones' && (
          <>
            {filteredConversations.length === 0 ? (
              <div className="text-center py-8 text-white/30">
                <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No hay conversaciones</p>
                <p className="text-xs text-white/20 mt-1">Presiona "Nuevo Mensaje" para comenzar</p>
              </div>
            ) : (
              filteredConversations.map(conv => (
                <motion.button
                  key={conv.otherUser.id}
                  onClick={() => handleSelectConversation(conv.otherUser)}
                  className={`w-full text-left p-3 rounded-lg transition-all ${
                    selectedContact?.id === conv.otherUser.id ? 'bg-neon-cyan/15 border border-neon-cyan/30' : 'hover:bg-white/5 border border-transparent'
                  }`}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-sm border ${ROLE_COLORS[conv.otherUser.role] || 'bg-neon-magenta/20 border-white/10'}`}>
                      {conv.otherUser.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-white font-semibold text-sm truncate">{conv.otherUser.name}</p>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {conv.unreadCount > 0 && (
                            <span className="bg-neon-magenta text-black text-xs font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center">
                              {conv.unreadCount}
                            </span>
                          )}
                          <span className="text-xs text-white/30">{formatDate(conv.lastMessage.date)}</span>
                        </div>
                      </div>
                      <p className="text-xs text-white/50 truncate mt-0.5">
                        {conv.lastMessage.senderId === currentUserId ? 'Tu: ' : ''}{conv.lastMessage.text}
                      </p>
                      <span className="inline-block text-[10px] text-white/30 mt-1 px-1.5 py-0.5 bg-white/5 rounded">
                        {ROLE_LABELS[conv.otherUser.role] || conv.otherUser.role}
                      </span>
                    </div>
                  </div>
                </motion.button>
              ))
            )}
          </>
        )}

        {activeTab === 'broadcasts' && (
          <>
            {filteredBroadcasts.length === 0 ? (
              <div className="text-center py-8 text-white/30">
                <Megaphone className="w-10 h-10 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No hay anuncios</p>
                {isAdmin && (
                  <button onClick={() => setViewMode('nuevo-anuncio')} className="mt-2 text-xs text-neon-magenta hover:underline flex items-center gap-1 mx-auto">
                    <Plus className="w-3 h-3" /> Crear un anuncio
                  </button>
                )}
              </div>
            ) : (
              filteredBroadcasts.map(bMsg => (
                <motion.button
                  key={bMsg.id}
                  onClick={handleSelectBroadcast}
                  className={`w-full text-left p-3 rounded-lg transition-all ${
                    selectedIsBroadcast ? 'bg-neon-magenta/15 border border-neon-magenta/30' : 'hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Megaphone className="w-4 h-4 text-neon-magenta flex-shrink-0" />
                      <p className="text-white font-semibold text-sm truncate">{bMsg.subject || 'Sin asunto'}</p>
                    </div>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded flex-shrink-0 ${PRIORITY_COLORS[bMsg.priority] || PRIORITY_COLORS.normal}`}>
                      {bMsg.priority}
                    </span>
                  </div>
                  <p className="text-xs text-white/50 truncate mt-1 ml-6">{bMsg.text}</p>
                  <div className="flex items-center justify-between mt-1 ml-6">
                    <span className="text-[10px] text-white/30">{bMsg.senderName}</span>
                    <span className="text-[10px] text-white/30">{formatDate(bMsg.date)}</span>
                  </div>
                </motion.button>
              ))
            )}
          </>
        )}
      </div>
    </motion.div>
  );

  const renderChatPanel = () => (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="lg:col-span-2 glass-card neon-border-cyan p-4 flex flex-col relative h-full">
      {/* Chat Header */}
      <div className="border-b border-white/10 pb-3 mb-3">
        {selectedContact ? (
          <div className="flex items-center gap-3">
            <button onClick={() => { setSelectedContact(null); setSelectedIsBroadcast(false); }} className="lg:hidden p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/60">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm border ${ROLE_COLORS[selectedContact.role] || 'bg-neon-cyan/20 border-neon-cyan/30'}`}>
              {selectedContact.avatar}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-sm truncate">{selectedContact.name}</p>
              <p className="text-xs text-white/50">{ROLE_LABELS[selectedContact.role] || selectedContact.role}</p>
            </div>
            <span className="text-[10px] px-2 py-1 rounded bg-white/5 text-white/40">
              {currentConversationMessages.length} mensajes
            </span>
          </div>
        ) : selectedIsBroadcast ? (
          <div className="flex items-center gap-3">
            <button onClick={() => setSelectedIsBroadcast(false)} className="lg:hidden p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/60">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="w-10 h-10 rounded-full bg-neon-magenta/20 flex items-center justify-center text-neon-magenta border border-neon-magenta/30">
              <Megaphone className="w-5 h-5" />
            </div>
            <div>
              <p className="text-white font-bold text-sm">Anuncios Generales</p>
              <p className="text-xs text-white/50">{broadcastMessages.length} anuncios</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center py-6 text-white/30">
            <div className="text-center">
              <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Selecciona una conversacion</p>
              <p className="text-xs text-white/20 mt-1">o crea un nuevo mensaje</p>
              <button onClick={() => setViewMode('nuevo-mensaje')} className="mt-3 px-4 py-2 bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan rounded-lg text-xs hover:bg-neon-cyan/20 transition-all flex items-center gap-1.5 mx-auto">
                <Plus className="w-3.5 h-3.5" /> Nuevo Mensaje
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 min-h-0">
        {loading ? (
          <div className="flex items-center justify-center py-12 text-white/30">
            <div className="w-6 h-6 rounded-full border-2 border-neon-cyan border-t-transparent animate-spin mr-3"></div>
            Cargando mensajes...
          </div>
        ) : currentConversationMessages.length === 0 ? (
          <div className="flex items-center justify-center py-12 text-white/30">
            <div className="text-center">
              <p className="text-sm mb-2">No hay mensajes</p>
              {selectedContact && (
                <p className="text-xs text-white/20">Escribe algo para iniciar la conversacion</p>
              )}
            </div>
          </div>
        ) : (
          currentConversationMessages.map((msgItem) => {
            const isSelf = msgItem.senderId === currentUserId;
            return (
              <motion.div key={msgItem.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex gap-2 group ${isSelf ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${
                  isSelf ? 'bg-neon-cyan/20 border border-neon-cyan/30' : 'bg-neon-magenta/20 border border-neon-magenta/30'
                }`}>
                  {isSelf ? currentUserName.charAt(0).toUpperCase() : msgItem.senderName?.charAt(0).toUpperCase() || '?'}
                </div>
                <div className={`max-w-[75%] ${isSelf ? 'text-right' : ''}`}>
                  {!isSelf && <p className="text-xs text-neon-magenta/70 mb-0.5">{msgItem.senderName}</p>}
                  <div className={`px-4 py-2.5 rounded-2xl ${
                    isSelf ? 'bg-neon-cyan/15 border border-neon-cyan/20 text-white rounded-br-md' : 'bg-white/5 border border-white/10 text-white/90 rounded-bl-md'
                  }`}>
                    {selectedIsBroadcast && msgItem.subject && (
                      <p className="text-xs font-semibold text-neon-magenta/80 mb-1">{msgItem.subject}</p>
                    )}
                    {!selectedIsBroadcast && msgItem.subject && (
                      <p className="text-xs font-semibold text-neon-cyan/80 mb-1">{msgItem.subject}</p>
                    )}
                    <p className="text-sm whitespace-pre-wrap break-words">{msgItem.text}</p>
                    {(msgItem.priority !== 'normal' || msgItem.category !== 'general') && (
                      <div className="flex gap-1 mt-1.5">
                        {msgItem.priority !== 'normal' && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded ${PRIORITY_COLORS[msgItem.priority] || PRIORITY_COLORS.normal}`}>{msgItem.priority}</span>
                        )}
                        {msgItem.category !== 'general' && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-white/40">{CATEGORY_LABELS[msgItem.category] || msgItem.category}</span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className={`flex items-center gap-2 mt-1 ${isSelf ? 'justify-end' : ''}`}>
                    <span className="text-[10px] text-white/30">{formatDate(msgItem.date)}</span>
                    {isSelf && msgItem.read && <CheckCheck className="w-3 h-3 text-neon-lime" />}
                    {isSelf && !msgItem.read && <CheckCheck className="w-3 h-3 text-white/30" />}
                  </div>
                </div>
                {isSelf && (
                  <button onClick={() => setDeleteConfirm(msgItem.id)} className="opacity-0 group-hover:opacity-100 p-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all self-center" title="Eliminar">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </motion.div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Delete confirmation */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/50 flex items-center justify-center z-50 rounded-xl">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="bg-slate-800 border border-white/10 rounded-xl p-6 text-center max-w-xs mx-4">
              <Trash2 className="w-8 h-8 text-red-400 mx-auto mb-3" />
              <p className="text-white text-sm mb-4">Eliminar este mensaje?</p>
              <div className="flex gap-3 justify-center">
                <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white/70 text-sm hover:bg-white/10">Cancelar</button>
                <button onClick={() => handleDeleteMessage(deleteConfirm)} className="px-4 py-2 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 text-sm hover:bg-red-500/30">Eliminar</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Message Input */}
      {selectedContact && !selectedIsBroadcast && (
        <div className="border-t border-white/10 pt-3 mt-2">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Escribe un mensaje..."
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && messageText.trim()) { e.preventDefault(); handleSendMessage(); } }}
              className="flex-1 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-white/30 focus:border-neon-cyan focus:outline-none"
            />
            <button
              onClick={handleSendMessage}
              disabled={sending || !messageText.trim()}
              className="px-4 py-2.5 bg-neon-cyan/20 border border-neon-cyan text-neon-cyan hover:bg-neon-cyan/30 rounded-xl transition-all disabled:opacity-40"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );

  return (
    <div className="min-h-screen p-4 md:p-6 pb-24">
      <HeaderElegante
        icon={MessageSquare}
        title="EDUGEST MENSAJES"
        subtitle={`${totalUnread > 0 ? `${totalUnread} sin leer` : 'Sin mensajes nuevos'} · ${conversations.size} conversaciones`}
      />

      {msg && (
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className={`mb-4 p-3 rounded-lg border text-sm ${msg.type === 'success' ? 'bg-neon-lime/10 border-neon-lime/30 text-neon-lime' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
          {msg.text}
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 h-[calc(100vh-200px)]">
        {(selectedContact || selectedIsBroadcast) ? (
          <>
            <div className="hidden lg:block">{renderListPanel()}</div>
            {renderChatPanel()}
          </>
        ) : (
          <>
            {renderListPanel()}
            <div className="hidden lg:block">{renderChatPanel()}</div>
          </>
        )}
      </div>
    </div>
  );
}