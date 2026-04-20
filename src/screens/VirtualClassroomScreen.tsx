import { motion } from 'motion/react';
import { BookOpen, Play, FileText, MessageSquare, Users, Clock, Zap, Award } from 'lucide-react';
import { User } from '../types';

interface VirtualClassroomScreenProps {
  user: User;
}

interface ClassResource {
  id: string;
  title: string;
  course: string;
  type: 'video' | 'document' | 'exercise' | 'discussion';
  instructor: string;
  date: string;
  students: number;
}

const classResources: ClassResource[] = [
  { id: '1', title: 'Introducción a Álgebra', course: 'Matemáticas', type: 'video', instructor: 'Prof. García', date: '2024-04-18', students: 25 },
  { id: '2', title: 'Análisis de Textos Literarios', course: 'Lenguaje', type: 'document', instructor: 'Prof. López', date: '2024-04-17', students: 28 },
  { id: '3', title: 'Tabla Periódica - Ejercicios', course: 'Ciencias', type: 'exercise', instructor: 'Prof. Rodríguez', date: '2024-04-16', students: 26 },
  { id: '4', title: 'Foro: Revolución Francesa', course: 'Historia', type: 'discussion', instructor: 'Prof. Martínez', date: '2024-04-15', students: 30 },
  { id: '5', title: 'Speaking Practice - Video', course: 'Inglés', type: 'video', instructor: 'Prof. Silva', date: '2024-04-14', students: 24 },
];

const getResourceIcon = (type: string) => {
  switch (type) {
    case 'video': return <Play className="w-5 h-5" />;
    case 'document': return <FileText className="w-5 h-5" />;
    case 'exercise': return <Zap className="w-5 h-5" />;
    case 'discussion': return <MessageSquare className="w-5 h-5" />;
    default: return <BookOpen className="w-5 h-5" />;
  }
};

const getResourceColor = (type: string): string => {
  switch (type) {
    case 'video': return 'neon-magenta';
    case 'document': return 'neon-cyan';
    case 'exercise': return 'neon-lime';
    case 'discussion': return 'neon-blue';
    default: return 'neon-cyan';
  }
};

export default function VirtualClassroomScreen({ user }: VirtualClassroomScreenProps) {
  const resourceCounts = {
    videos: classResources.filter(r => r.type === 'video').length,
    documents: classResources.filter(r => r.type === 'document').length,
    exercises: classResources.filter(r => r.type === 'exercise').length,
    discussions: classResources.filter(r => r.type === 'discussion').length,
  };

  return (
    <div className="min-h-screen p-6 space-y-8 pb-24">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-neon-magenta/20 rounded-lg neon-border-magenta">
            <BookOpen className="w-8 h-8 text-neon-magenta" />
          </div>
          <div>
            <h1 className="text-4xl font-bold tracking-tighter uppercase">
              Aula <span className="text-neon-cyan neon-text-cyan">Virtual</span>
            </h1>
            <p className="text-xs text-white/75 font-mono tracking-widest">GESTIÓN DE CLASES Y RECURSOS</p>
          </div>
        </div>
      </motion.div>

      {/* Resource Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Videos', count: resourceCounts.videos, icon: Play, color: 'neon-magenta' },
          { label: 'Documentos', count: resourceCounts.documents, icon: FileText, color: 'neon-cyan' },
          { label: 'Ejercicios', count: resourceCounts.exercises, icon: Zap, color: 'neon-lime' },
          { label: 'Discusiones', count: resourceCounts.discussions, icon: MessageSquare, color: 'neon-blue' },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`glass-card p-4 neon-border-${stat.color}`}
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-white/85 text-xs uppercase">{stat.label}</p>
              <stat.icon className={`w-5 h-5 text-${stat.color}`} />
            </div>
            <p className="text-2xl font-bold text-white">{stat.count}</p>
          </motion.div>
        ))}
      </div>

      {/* Resources Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card p-6 neon-border-cyan"
      >
        <h3 className="text-white font-bold uppercase tracking-wider mb-6 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-neon-cyan" />
          Recursos Recientes
        </h3>
        <div className="space-y-4">
          {classResources.map((resource, i) => (
            <motion.div
              key={resource.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`border-l-4 border-${getResourceColor(resource.type)} bg-${getResourceColor(resource.type)}/5 p-4 rounded-lg hover:bg-white/5 transition-all cursor-pointer`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-start gap-3 flex-1">
                  <div className={`p-2 bg-${getResourceColor(resource.type)}/20 rounded-lg`}>
                    {getResourceIcon(resource.type)}
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-bold uppercase tracking-wide">{resource.title}</p>
                    <p className="text-xs text-white/85 mt-1">{resource.course}</p>
                  </div>
                </div>
                <div className="text-right text-xs">
                  <p className="text-white/90">{resource.date}</p>
                  <div className="flex items-center gap-1 text-white/85 mt-1">
                    <Users className="w-3 h-3" />
                    <span>{resource.students}</span>
                  </div>
                </div>
              </div>
              <p className="text-xs text-white/85">{resource.instructor}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        <div className="glass-card p-4 neon-border-lime">
          <div className="flex items-center gap-3 mb-2">
            <Award className="w-5 h-5 text-neon-lime" />
            <p className="text-white font-bold uppercase tracking-wider">Participación</p>
          </div>
          <p className="text-white/90 text-sm">8 actividades completadas esta semana</p>
        </div>
        <div className="glass-card p-4 neon-border-magenta">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="w-5 h-5 text-neon-magenta" />
            <p className="text-white font-bold uppercase tracking-wider">Próxima Clase</p>
          </div>
          <p className="text-white/90 text-sm">Matemáticas - Mañana a las 08:00</p>
        </div>
      </motion.div>
    </div>
  );
}
