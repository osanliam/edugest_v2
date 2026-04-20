import { motion } from 'motion/react';
import { Users2, MessageCircle, Heart, Share2, Calendar, Zap } from 'lucide-react';
import { User } from '../types';

interface CommunityScreenProps {
  user: User;
}

interface Post {
  id: string;
  author: string;
  role: string;
  content: string;
  timestamp: string;
  likes: number;
  comments: number;
  avatar: string;
}

const posts: Post[] = [
  {
    id: '1',
    author: 'Prof. García',
    role: 'Docente',
    content: 'Felicidades a todos por los excelentes resultados en el último examen. ¡Sigan así!',
    timestamp: 'hace 2 horas',
    likes: 45,
    comments: 12,
    avatar: 'G',
  },
  {
    id: '2',
    author: 'Dirección',
    role: 'Administración',
    content: 'Recordatorio: Próximo evento deportivo el viernes 22 de abril. ¡No falten!',
    timestamp: 'hace 4 horas',
    likes: 28,
    comments: 8,
    avatar: 'D',
  },
  {
    id: '3',
    author: 'Grupo 3°A',
    role: 'Comunidad',
    content: 'Organizando torneo de fútbol para el próximo mes. ¿Quiénes se animan?',
    timestamp: 'hace 6 horas',
    likes: 67,
    comments: 23,
    avatar: '👥',
  },
];

export default function CommunityScreen({ user }: CommunityScreenProps) {
  return (
    <div className="min-h-screen p-6 space-y-8 pb-24">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-neon-lime/20 rounded-lg neon-border-lime">
            <Users2 className="w-8 h-8 text-neon-lime" />
          </div>
          <div>
            <h1 className="text-4xl font-bold tracking-tighter uppercase">
              <span className="text-neon-lime neon-text-lime">Comunidad</span>
            </h1>
            <p className="text-xs text-white/75 font-mono tracking-widest">ESPACIO COMPARTIDO</p>
          </div>
        </div>
      </motion.div>

      {/* New Post */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card p-4 neon-border-cyan"
      >
        <div className="flex gap-3">
          <div className="w-10 h-10 rounded-full bg-neon-cyan/20 flex items-center justify-center flex-shrink-0">
            {user.name.charAt(0)}
          </div>
          <input
            type="text"
            placeholder="¿Qué quieres compartir con la comunidad?"
            className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-white/40"
          />
        </div>
      </motion.div>

      {/* Posts Feed */}
      <div className="space-y-4">
        {posts.map((post, i) => (
          <motion.div
            key={post.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: (i + 1) * 0.1 }}
            className="glass-card p-6 neon-border-magenta"
          >
            <div className="flex items-start gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-neon-magenta/20 flex items-center justify-center text-white font-bold flex-shrink-0">
                {post.avatar}
              </div>
              <div className="flex-1">
                <p className="text-white font-semibold">{post.author}</p>
                <p className="text-xs text-white/85">{post.role} • {post.timestamp}</p>
              </div>
            </div>

            <p className="text-white/90 mb-4">{post.content}</p>

            <div className="flex items-center gap-4 text-sm text-white/85 border-t border-white/10 pt-3">
              <button className="flex items-center gap-2 hover:text-neon-lime transition-colors">
                <Heart className="w-4 h-4" />
                <span>{post.likes}</span>
              </button>
              <button className="flex items-center gap-2 hover:text-neon-cyan transition-colors">
                <MessageCircle className="w-4 h-4" />
                <span>{post.comments}</span>
              </button>
              <button className="flex items-center gap-2 hover:text-neon-magenta transition-colors ml-auto">
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
