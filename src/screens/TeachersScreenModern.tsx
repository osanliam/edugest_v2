import { motion } from 'motion/react';
import { Users, Star, Award, TrendingUp, Clock, BookOpen, Plus, Mail } from 'lucide-react';
import FuturisticCard from '../components/FuturisticCard';
import HologramText from '../components/HologramText';
import DataGrid from '../components/DataGrid';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  schoolId: string;
}

interface TeachersScreenModernProps {
  user?: User;
}

export default function TeachersScreenModern({ user }: TeachersScreenModernProps) {
  const performanceData = [
    { name: 'Prof. García', rating: 4.8 },
    { name: 'Prof. López', rating: 4.6 },
    { name: 'Prof. Rodríguez', rating: 4.9 },
    { name: 'Prof. Martínez', rating: 4.7 },
    { name: 'Prof. Silva', rating: 4.5 },
    { name: 'Prof. Núñez', rating: 4.8 },
  ];

  const stats = [
    { label: 'Total Docentes', value: '24', color: 'cyan' },
    { label: 'Tiempo Completo', value: '18', color: 'magenta' },
    { label: 'Especializados', value: '16', color: 'lime' },
    { label: 'En Capacitación', value: '5', color: 'blue' },
  ];

  const teachers = [
    { id: '1', name: 'Dr. García López', subject: 'Matemáticas', rating: 4.8, students: 128, status: 'Activo' },
    { id: '2', name: 'Mg. López Pérez', subject: 'Lenguaje', rating: 4.6, students: 135, status: 'Activo' },
    { id: '3', name: 'Ing. Rodríguez Silva', subject: 'Ciencias', rating: 4.9, students: 120, status: 'Activo' },
    { id: '4', name: 'Prof. Martínez Díaz', subject: 'Historia', rating: 4.7, students: 130, status: 'Activo' },
  ];

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
            <HologramText>Docentes</HologramText>
          </h1>
          <p className="text-white/85 font-mono tracking-widest text-sm">GESTIÓN DE PERSONAL ACADÉMICO</p>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.1 }}
            >
              <FuturisticCard variant={stat.color as any} glow hover>
                <div className="p-4 space-y-3">
                  <p className="text-white/85 text-xs uppercase">{stat.label}</p>
                  <p className="text-3xl font-bold text-white">{stat.value}</p>
                </div>
              </FuturisticCard>
            </motion.div>
          ))}
        </motion.div>

        {/* Add Teacher Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-full flex items-center justify-center gap-2 p-4 rounded-xl border-2 border-neon-lime/50 bg-gradient-to-br from-white/5 to-white/5 hover:from-white/10 hover:to-white/5 text-neon-lime font-bold uppercase text-sm transition-all"
          >
            <Plus className="w-5 h-5" />
            Registrar Nuevo Docente
          </motion.button>
        </motion.div>

        {/* Performance Chart */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <FuturisticCard variant="cyan" glow>
            <div className="p-6">
              <h3 className="text-white font-bold uppercase tracking-wider mb-6 flex items-center gap-2">
                <Star className="w-5 h-5 text-neon-cyan" />
                <HologramText variant="primary">Calificación de Desempeño</HologramText>
              </h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={performanceData}>
                  <CartesianGrid stroke="rgba(0,217,255,0.1)" strokeDasharray="3 3" />
                  <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" angle={-45} textAnchor="end" height={80} />
                  <YAxis stroke="rgba(255,255,255,0.3)" domain={[0, 5]} />
                  <Tooltip contentStyle={{ backgroundColor: 'rgba(13, 22, 38, 0.9)', border: '1px solid rgba(0, 217, 255, 0.5)', borderRadius: '8px', color: '#fff' }} />
                  <Bar dataKey="rating" fill="#00d9ff" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </FuturisticCard>
        </motion.div>

        {/* Key Metrics */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <FuturisticCard variant="magenta" glow hover>
            <div className="p-6 space-y-3">
              <div className="flex items-center gap-2">
                <Award className="w-6 h-6 text-neon-magenta animate-pulse-glow" />
                <p className="font-bold text-white text-sm uppercase">Excelencia</p>
              </div>
              <p className="text-3xl font-bold text-white">8</p>
              <p className="text-xs text-white/85">Calificación ≥ 4.7</p>
            </div>
          </FuturisticCard>

          <FuturisticCard variant="lime" glow hover>
            <div className="p-6 space-y-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-6 h-6 text-neon-lime animate-pulse-glow" />
                <p className="font-bold text-white text-sm uppercase">Estudiantes Totales</p>
              </div>
              <p className="text-3xl font-bold text-white">3108</p>
              <p className="text-xs text-white/85">Bajo supervisión docente</p>
            </div>
          </FuturisticCard>

          <FuturisticCard variant="blue" glow hover>
            <div className="p-6 space-y-3">
              <div className="flex items-center gap-2">
                <Clock className="w-6 h-6 text-neon-blue animate-pulse-glow" />
                <p className="font-bold text-white text-sm uppercase">Promedio Horas</p>
              </div>
              <p className="text-3xl font-bold text-white">32h</p>
              <p className="text-xs text-white/85">Semanal por docente</p>
            </div>
          </FuturisticCard>
        </motion.div>

        {/* Teachers List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="mb-4">
            <h3 className="text-2xl font-bold uppercase tracking-wider">
              <HologramText variant="secondary">Plana Docente</HologramText>
            </h3>
          </div>

          <div className="space-y-3">
            {teachers.map((teacher, i) => (
              <motion.div
                key={teacher.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + i * 0.1 }}
              >
                <FuturisticCard variant={i % 2 === 0 ? 'cyan' : 'magenta'} glow hover>
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                          <Users className="w-5 h-5 text-neon-cyan" />
                        </div>
                        <div className="flex-1">
                          <p className="text-white font-bold uppercase tracking-wide text-sm">{teacher.name}</p>
                          <p className="text-xs text-white/85 mt-1">{teacher.subject}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-neon-yellow" />
                          <span className="text-sm font-bold text-white">{teacher.rating}</span>
                        </div>
                        <p className="text-xs text-white/85 mt-1">{teacher.students} estudiantes</p>
                      </div>
                    </div>
                    <p className="text-xs text-white/75">{teacher.status}</p>
                  </div>
                </FuturisticCard>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Training Schedule */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <div className="mb-4">
            <h3 className="text-2xl font-bold uppercase tracking-wider">
              <HologramText>Capacitaciones Programadas</HologramText>
            </h3>
          </div>
          <DataGrid
            headers={['Capacitación', 'Docentes', 'Fecha', 'Duración']}
            rows={[
              ['Metodología Activa', '12', '2024-05-10', '4 horas'],
              ['Tecnología Educativa', '18', '2024-05-15', '6 horas'],
              ['Evaluación por Competencias', '10', '2024-05-20', '5 horas'],
              ['Liderazgo Pedagógico', '8', '2024-05-25', '3 horas'],
            ]}
          />
        </motion.div>
      </div>
    </div>
  );
}
