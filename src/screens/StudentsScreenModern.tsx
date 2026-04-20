import { motion } from 'motion/react';
import { Users, Search, Plus, TrendingUp, Award, AlertCircle, BookOpen, Mail } from 'lucide-react';
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

interface StudentsScreenModernProps {
  user?: User;
}

export default function StudentsScreenModern({ user }: StudentsScreenModernProps) {
  const gradeDistribution = [
    { grade: '1º', students: 45, color: '#00d9ff' },
    { grade: '2º', students: 48, color: '#d946ef' },
    { grade: '3º', students: 42, color: '#84cc16' },
    { grade: '4º', students: 50, color: '#0ea5e9' },
    { grade: '5º', students: 51, color: '#00d9ff' },
    { grade: '6º', students: 48, color: '#d946ef' },
  ];

  const stats = [
    { label: 'Total de Estudiantes', value: '456', color: 'cyan' },
    { label: 'Nuevos Inscritos', value: '23', color: 'magenta' },
    { label: 'Tasa de Retención', value: '98.2%', color: 'lime' },
    { label: 'Promedio General', value: '17.3/20', color: 'blue' },
  ];

  const recentStudents = [
    { id: '1', name: 'Carlos Mendez', grade: '4º A', status: 'Activo', avgGrade: '18.5' },
    { id: '2', name: 'María García', grade: '3º B', status: 'Activo', avgGrade: '17.2' },
    { id: '3', name: 'Juan Pérez', grade: '5º A', status: 'Activo', avgGrade: '19.1' },
    { id: '4', name: 'Ana López', grade: '2º B', status: 'Activo', avgGrade: '16.8' },
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
            <HologramText>Estudiantes</HologramText>
          </h1>
          <p className="text-white/85 font-mono tracking-widest text-sm">GESTIÓN Y SEGUIMIENTO ACADÉMICO</p>
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

        {/* Search & Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <FuturisticCard variant="cyan" glow>
            <div className="p-4 flex items-center gap-3">
              <Search className="w-5 h-5 text-neon-cyan" />
              <input
                type="text"
                placeholder="Buscar estudiante..."
                className="bg-transparent text-white placeholder-white/40 outline-none flex-1 text-sm"
              />
            </div>
          </FuturisticCard>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center justify-center gap-2 p-4 rounded-xl border-2 border-neon-lime/50 bg-gradient-to-br from-white/5 to-white/5 hover:from-white/10 hover:to-white/5 text-neon-lime font-bold uppercase text-sm transition-all"
          >
            <Plus className="w-5 h-5" />
            Registrar Estudiante
          </motion.button>
        </motion.div>

        {/* Grade Distribution */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <FuturisticCard variant="magenta" glow>
            <div className="p-6">
              <h3 className="text-white font-bold uppercase tracking-wider mb-6 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-neon-magenta" />
                <HologramText variant="primary">Distribución por Grado</HologramText>
              </h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={gradeDistribution}>
                  <CartesianGrid stroke="rgba(217,70,239,0.1)" strokeDasharray="3 3" />
                  <XAxis dataKey="grade" stroke="rgba(255,255,255,0.3)" />
                  <YAxis stroke="rgba(255,255,255,0.3)" />
                  <Tooltip contentStyle={{ backgroundColor: 'rgba(13, 22, 38, 0.9)', border: '1px solid rgba(217, 70, 239, 0.5)', borderRadius: '8px', color: '#fff' }} />
                  <Bar dataKey="students" fill="#d946ef" radius={[8, 8, 0, 0]} />
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
          <FuturisticCard variant="lime" glow hover>
            <div className="p-6 space-y-3">
              <div className="flex items-center gap-2">
                <Award className="w-6 h-6 text-neon-lime animate-pulse-glow" />
                <p className="font-bold text-white text-sm uppercase">Excelencia</p>
              </div>
              <p className="text-3xl font-bold text-white">67</p>
              <p className="text-xs text-white/85">Promedio ≥ 18</p>
            </div>
          </FuturisticCard>

          <FuturisticCard variant="cyan" glow hover>
            <div className="p-6 space-y-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-neon-cyan animate-pulse-glow" />
                <p className="font-bold text-white text-sm uppercase">En Progreso</p>
              </div>
              <p className="text-3xl font-bold text-white">312</p>
              <p className="text-xs text-white/85">Promedio 15-17.9</p>
            </div>
          </FuturisticCard>

          <FuturisticCard variant="blue" glow hover>
            <div className="p-6 space-y-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-6 h-6 text-neon-blue animate-pulse-glow" />
                <p className="font-bold text-white text-sm uppercase">Requieren Apoyo</p>
              </div>
              <p className="text-3xl font-bold text-white">77</p>
              <p className="text-xs text-white/85">Promedio &lt; 15</p>
            </div>
          </FuturisticCard>
        </motion.div>

        {/* Recent Students */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="mb-4">
            <h3 className="text-2xl font-bold uppercase tracking-wider">
              <HologramText variant="secondary">Estudiantes Destacados</HologramText>
            </h3>
          </div>

          <div className="space-y-3">
            {recentStudents.map((student, i) => (
              <motion.div
                key={student.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + i * 0.1 }}
              >
                <FuturisticCard variant={i % 2 === 0 ? 'cyan' : 'magenta'} glow hover>
                  <div className="p-4 flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-white font-bold uppercase tracking-wide text-sm">{student.name}</p>
                      <p className="text-xs text-white/85 mt-1">{student.grade}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-neon-lime">{student.avgGrade}/20</p>
                      <p className="text-xs text-white/85">{student.status}</p>
                    </div>
                  </div>
                </FuturisticCard>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Enrollment Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <div className="mb-4">
            <h3 className="text-2xl font-bold uppercase tracking-wider">
              <HologramText>Resumen de Matrícula</HologramText>
            </h3>
          </div>
          <DataGrid
            headers={['Grado', 'Sección', 'Inscritos', 'Activos', 'Promedio']}
            rows={[
              ['1º', 'A', '45', '45', '17.2'],
              ['2º', 'A', '48', '47', '16.8'],
              ['3º', 'B', '42', '42', '17.5'],
              ['4º', 'A', '50', '49', '17.9'],
              ['5º', 'A', '51', '51', '18.1'],
              ['6º', 'B', '48', '48', '17.3'],
            ]}
          />
        </motion.div>
      </div>
    </div>
  );
}
