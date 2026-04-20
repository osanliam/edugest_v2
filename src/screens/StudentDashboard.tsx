import { motion } from 'motion/react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Award, Clock, AlertCircle, Target, Activity, Zap, BookOpen } from 'lucide-react';
import { User } from '../types';

interface StudentDashboardProps {
  user: User;
}

const performanceData = [
  { period: 'Q1', score: 7.5, target: 8.0 },
  { period: 'Q2', score: 7.8, target: 8.0 },
  { period: 'Q3', score: 8.2, target: 8.0 },
  { period: 'Q4', score: 8.5, target: 8.5 },
];

const gradeDistribution = [
  { course: 'Matemáticas', score: 18.5 },
  { course: 'Lenguaje', score: 17.0 },
  { course: 'Ciencias', score: 19.0 },
  { course: 'Historia', score: 16.5 },
  { course: 'Inglés', score: 18.0 },
];

export default function StudentDashboard({ user }: StudentDashboardProps) {
  const stats = {
    averageGrade: 8.3,
    attendanceRate: 95,
    pendingTasks: 3,
    coursesEnrolled: 5,
  };

  return (
    <div className="min-h-screen p-6 space-y-8 pb-24">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-neon-cyan/20 rounded-lg neon-border-cyan">
            <Award className="w-8 h-8 text-neon-cyan" />
          </div>
          <div>
            <h1 className="text-4xl font-bold tracking-tighter uppercase">
              Mi <span className="text-neon-magenta neon-text-magenta">Desempeño</span>
            </h1>
            <p className="text-xs text-white/75 font-mono tracking-widest">SEGUIMIENTO ACADÉMICO</p>
          </div>
        </div>
      </motion.div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Promedio General', value: stats.averageGrade.toFixed(1), unit: '/20', icon: Award, color: 'neon-cyan' },
          { label: 'Asistencia', value: stats.attendanceRate, unit: '%', icon: Clock, color: 'neon-lime' },
          { label: 'Cursos Inscritos', value: stats.coursesEnrolled, unit: '', icon: BookOpen, color: 'neon-magenta' },
          { label: 'Tareas Pendientes', value: stats.pendingTasks, unit: '', icon: AlertCircle, color: 'neon-blue' },
        ].map((kpi, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-card p-6 neon-border-cyan hover:neon-border-magenta transition-all group cursor-pointer"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-white/85 text-sm uppercase tracking-wider">{kpi.label}</p>
                <p className="text-4xl font-bold text-white mt-2">
                  {kpi.value}<span className="text-lg text-white/85">{kpi.unit}</span>
                </p>
              </div>
              <kpi.icon className={`w-6 h-6 text-${kpi.color}`} />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tendencia de Desempeño */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-6 neon-border-cyan"
        >
          <h3 className="text-white font-bold uppercase tracking-wider mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-neon-cyan" />
            Tendencia de Desempeño
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={performanceData}>
              <CartesianGrid stroke="rgba(6,182,212,0.1)" strokeDasharray="3 3" />
              <XAxis dataKey="period" stroke="rgba(255,255,255,0.3)" />
              <YAxis stroke="rgba(255,255,255,0.3)" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(13, 22, 38, 0.9)',
                  border: '1px solid rgba(6, 182, 212, 0.5)',
                  borderRadius: '8px',
                  color: '#fff'
                }}
              />
              <Line type="monotone" dataKey="score" stroke="#06b6d4" strokeWidth={3} dot={{ fill: '#06b6d4', r: 4 }} />
              <Line type="monotone" dataKey="target" stroke="#d946ef" strokeWidth={2} strokeDasharray="5 5" />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Calificaciones por Curso */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-6 neon-border-magenta"
        >
          <h3 className="text-white font-bold uppercase tracking-wider mb-6 flex items-center gap-2">
            <Activity className="w-5 h-5 text-neon-magenta" />
            Calificaciones por Curso
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={gradeDistribution}>
              <CartesianGrid stroke="rgba(6,182,212,0.1)" strokeDasharray="3 3" />
              <XAxis dataKey="course" stroke="rgba(255,255,255,0.3)" />
              <YAxis stroke="rgba(255,255,255,0.3)" domain={[0, 20]} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(13, 22, 38, 0.9)',
                  border: '1px solid rgba(217, 70, 239, 0.5)',
                  borderRadius: '8px',
                  color: '#fff'
                }}
              />
              <Bar dataKey="score" fill="#d946ef" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Información Personal */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="glass-card p-6 neon-border-lime"
      >
        <h3 className="text-white font-bold uppercase tracking-wider mb-6 flex items-center gap-2">
          <Zap className="w-5 h-5 text-neon-lime" />
          Mi Información
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <p className="text-white/85 text-sm uppercase">Nombre</p>
              <p className="text-white text-lg font-semibold">{user.name}</p>
            </div>
            <div>
              <p className="text-white/85 text-sm uppercase">Email</p>
              <p className="text-white text-lg font-semibold">{user.email}</p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-white/85 text-sm uppercase">Institución</p>
              <p className="text-white text-lg font-semibold">IE Manuel Fidencio Hidalgo Flores</p>
            </div>
            <div>
              <p className="text-white/85 text-sm uppercase">Estado</p>
              <p className="text-green-400 text-lg font-semibold">✓ Activo</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Goals */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="glass-card p-6 neon-border-cyan"
      >
        <h3 className="text-white font-bold uppercase tracking-wider mb-6 flex items-center gap-2">
          <Target className="w-5 h-5 text-neon-cyan" />
          Mis Metas
        </h3>
        <div className="space-y-3">
          {[
            { goal: 'Mantener promedio arriba de 8.0', progress: 85 },
            { goal: '100% de asistencia este mes', progress: 95 },
            { goal: 'Entregar todas las tareas a tiempo', progress: 70 },
            { goal: 'Mejorar en Matemáticas', progress: 60 },
          ].map((item, i) => (
            <div key={i} className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-white text-sm">{item.goal}</p>
                <span className="text-neon-lime text-xs font-semibold">{item.progress}%</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-neon-cyan to-neon-magenta transition-all duration-500"
                  style={{ width: `${item.progress}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
