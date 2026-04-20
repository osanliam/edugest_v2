import { motion } from 'motion/react';
import { BookOpen, Play, FileText, MessageSquare, Users, Clock, Zap, Award } from 'lucide-react';
import FuturisticCard from '../components/FuturisticCard';
import HologramText from '../components/HologramText';
import DataGrid from '../components/DataGrid';

export default function VirtualClassroomScreenModern() {
  const classResources = [
    { id: '1', title: 'Introducción a Álgebra', course: 'Matemáticas', type: 'video', instructor: 'Prof. García', date: '2024-04-18', students: 25 },
    { id: '2', title: 'Análisis de Textos Literarios', course: 'Lenguaje', type: 'document', instructor: 'Prof. López', date: '2024-04-17', students: 28 },
    { id: '3', title: 'Tabla Periódica - Ejercicios', course: 'Ciencias', type: 'exercise', instructor: 'Prof. Rodríguez', date: '2024-04-16', students: 26 },
    { id: '4', title: 'Foro: Revolución Francesa', course: 'Historia', type: 'discussion', instructor: 'Prof. Martínez', date: '2024-04-15', students: 30 },
    { id: '5', title: 'Speaking Practice - Video', course: 'Inglés', type: 'video', instructor: 'Prof. Silva', date: '2024-04-14', students: 24 },
  ];

  const resourceCounts = {
    videos: classResources.filter(r => r.type === 'video').length,
    documents: classResources.filter(r => r.type === 'document').length,
    exercises: classResources.filter(r => r.type === 'exercise').length,
    discussions: classResources.filter(r => r.type === 'discussion').length,
  };

  return (
    <div className="min-h-screen bg-dark-bg text-white overflow-hidden p-6">
      {/* Fondo animado */}
      <div className="fixed inset-0 -z-50">
        <div className="absolute inset-0 bg-gradient-cyber opacity-60"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          <h1 className="text-5xl font-black tracking-tighter">
            Aula <HologramText>Virtual</HologramText>
          </h1>
          <p className="text-white/85 font-mono tracking-widest text-sm">GESTIÓN DE CLASES Y RECURSOS</p>
        </motion.div>

        {/* Resource Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {[
            { label: 'Videos', count: resourceCounts.videos, icon: Play, color: 'magenta' },
            { label: 'Documentos', count: resourceCounts.documents, icon: FileText, color: 'cyan' },
            { label: 'Ejercicios', count: resourceCounts.exercises, icon: Zap, color: 'lime' },
            { label: 'Discusiones', count: resourceCounts.discussions, icon: MessageSquare, color: 'blue' },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.1 }}
            >
              <FuturisticCard variant={stat.color as any} glow hover>
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-white/85 text-xs uppercase">{stat.label}</p>
                    <stat.icon className="w-5 h-5 text-neon-cyan animate-pulse-glow" />
                  </div>
                  <p className="text-3xl font-bold text-white">{stat.count}</p>
                </div>
              </FuturisticCard>
            </motion.div>
          ))}
        </motion.div>

        {/* Resources Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="mb-4">
            <h3 className="text-2xl font-bold uppercase tracking-wider">
              <HologramText>Recursos Recientes</HologramText>
            </h3>
          </div>

          <div className="space-y-3">
            {classResources.map((resource, i) => (
              <motion.div
                key={resource.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.05 }}
              >
                <FuturisticCard
                  variant={
                    resource.type === 'video'
                      ? 'magenta'
                      : resource.type === 'document'
                        ? 'cyan'
                        : resource.type === 'exercise'
                          ? 'lime'
                          : 'blue'
                  }
                  glow
                  hover
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                          {resource.type === 'video' && <Play className="w-5 h-5 text-neon-magenta" />}
                          {resource.type === 'document' && <FileText className="w-5 h-5 text-neon-cyan" />}
                          {resource.type === 'exercise' && <Zap className="w-5 h-5 text-neon-lime" />}
                          {resource.type === 'discussion' && <MessageSquare className="w-5 h-5 text-neon-blue" />}
                        </div>
                        <div className="flex-1">
                          <p className="text-white font-bold uppercase tracking-wide text-sm">{resource.title}</p>
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
                    <p className="text-xs text-white/75">{resource.instructor}</p>
                  </div>
                </FuturisticCard>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          <FuturisticCard variant="lime" glow hover>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <Award className="w-6 h-6 text-neon-lime animate-pulse-glow" />
                <p className="text-white font-bold uppercase tracking-wider">Participación</p>
              </div>
              <p className="text-white/90 text-sm">8 actividades completadas esta semana</p>
              <motion.div
                animate={{ width: '100%' }}
                transition={{ duration: 2, repeat: Infinity, repeatType: 'reverse' }}
                className="mt-4 h-2 bg-neon-lime rounded-full"
              ></motion.div>
            </div>
          </FuturisticCard>

          <FuturisticCard variant="magenta" glow hover>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <Clock className="w-6 h-6 text-neon-magenta animate-pulse-glow" />
                <p className="text-white font-bold uppercase tracking-wider">Próxima Clase</p>
              </div>
              <p className="text-white/90 text-sm">Matemáticas - Mañana a las 08:00</p>
              <div className="mt-4 flex items-center gap-2">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-2 h-2 bg-neon-magenta rounded-full"
                ></motion.div>
                <span className="text-xs text-neon-magenta font-bold">EN VIVO</span>
              </div>
            </div>
          </FuturisticCard>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="mb-4">
            <h3 className="text-2xl font-bold uppercase tracking-wider">
              <HologramText variant="secondary">Actividad Reciente</HologramText>
            </h3>
          </div>
          <DataGrid
            headers={['Actividad', 'Recurso', 'Fecha', 'Estado']}
            rows={[
              ['Video visto', 'Introducción a Álgebra', '2024-04-18', '✓ Completado'],
              ['Documento descargado', 'Análisis de Textos', '2024-04-17', '✓ Completado'],
              ['Ejercicio resuelto', 'Tabla Periódica', '2024-04-16', '✓ Completado'],
              ['Mensaje en foro', 'Revolución Francesa', '2024-04-15', '✓ Publicado'],
            ]}
          />
        </motion.div>
      </div>
    </div>
  );
}
