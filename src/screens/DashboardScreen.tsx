import { motion } from 'motion/react';
import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Users, BookOpen, AlertCircle, Calendar, Clock, Award, BarChart3, Zap, Activity } from 'lucide-react';
import { User } from '../types';
import api from '../utils/api';

const defaultGradesData = [
  { period: 'Q1', average: 7.5, target: 8.0 },
  { period: 'Q2', average: 7.8, target: 8.0 },
  { period: 'Q3', average: 8.2, target: 8.0 },
  { period: 'Q4', average: 8.5, target: 8.5 },
];

const defaultAttendanceData = [
  { month: 'Ene', attendance: 92 },
  { month: 'Feb', attendance: 94 },
  { month: 'Mar', attendance: 91 },
  { month: 'Abr', attendance: 95 },
];

interface DashboardScreenProps {
  user: User;
}

export default function DashboardScreen({ user }: DashboardScreenProps) {
  const [studentCount, setStudentCount] = useState(0);
  const [coursesCount, setCoursesCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Obtener cantidad de estudiantes
        const studentsResponse = await api.getStudents();
        if (studentsResponse.data) {
          setStudentCount(studentsResponse.data.length);
        }

        // Obtener cantidad de cursos
        const coursesResponse = await api.getCourses();
        if (coursesResponse.data) {
          setCoursesCount(coursesResponse.data.length);
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError(err instanceof Error ? err.message : 'Error cargando datos');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);
  return (
    <div className="min-h-screen p-6 space-y-8 pb-24">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-neon-cyan/20 rounded-lg neon-border-cyan">
            <BarChart3 className="w-8 h-8 text-neon-cyan" />
          </div>
          <div>
            <h1 className="text-4xl font-bold tracking-tighter uppercase">
              EduGest <span className="text-neon-cyan neon-text-cyan">Dashboard</span>
            </h1>
            <p className="text-xs text-white/75 font-mono tracking-widest">SISTEMA INTEGRAL DE EDUCACIÓN</p>
          </div>
        </div>
      </motion.div>

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 text-red-200 text-sm"
        >
          ⚠️ {error}
        </motion.div>
      )}

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Promedio', value: '8.5', change: '↑ 0.3', icon: Award, color: 'neon-cyan' },
          { label: 'Asistencia', value: '95%', change: 'Mes actual', icon: Clock, color: 'neon-lime' },
          { label: 'Cursos Activos', value: coursesCount.toString(), change: '2024-II', icon: BookOpen, color: 'neon-magenta' },
          { label: 'Estudiantes', value: studentCount.toString(), change: loading ? 'Cargando...' : 'Sistema', icon: Users, color: 'neon-blue' },
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
                <p className="text-4xl font-bold text-white mt-2">{kpi.value}</p>
              </div>
              <kpi.icon className={`w-6 h-6 text-${kpi.color}`} />
            </div>
            <p className="text-xs text-white/40">{kpi.change}</p>
          </motion.div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Grades Trend */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-6 neon-border-cyan"
        >
          <h3 className="text-white font-bold uppercase tracking-wider mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-neon-cyan" />
            Tendencia de Calificaciones
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={defaultGradesData}>
              <CartesianGrid stroke="rgba(6,182,212,0.1)" strokeDasharray="3 3" />
              <XAxis dataKey="period" stroke="rgba(255,255,255,0.3)" />
              <YAxis stroke="rgba(255,255,255,0.3)" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(13, 22, 38, 0.9)',
                  border: '1px solid rgba(6, 182, 212, 0.5)',
                  borderRadius: '8px'
                }}
              />
              <Line type="monotone" dataKey="average" stroke="#06b6d4" strokeWidth={3} dot={{ fill: '#06b6d4', r: 4 }} />
              <Line type="monotone" dataKey="target" stroke="#d946ef" strokeWidth={2} strokeDasharray="5 5" />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Attendance */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-6 neon-border-magenta"
        >
          <h3 className="text-white font-bold uppercase tracking-wider mb-6 flex items-center gap-2">
            <Activity className="w-5 h-5 text-neon-magenta" />
            Asistencia Mensual
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={defaultAttendanceData}>
              <CartesianGrid stroke="rgba(6,182,212,0.1)" strokeDasharray="3 3" />
              <XAxis dataKey="month" stroke="rgba(255,255,255,0.3)" />
              <YAxis stroke="rgba(255,255,255,0.3)" domain={[85, 100]} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(13, 22, 38, 0.9)',
                  border: '1px solid rgba(217, 70, 239, 0.5)',
                  borderRadius: '8px'
                }}
              />
              <Bar dataKey="attendance" fill="#d946ef" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Announcements & Events */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Anuncios */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card p-6 neon-border-cyan"
        >
          <h3 className="text-white font-bold uppercase tracking-wider mb-6 flex items-center gap-2">
            <Zap className="w-5 h-5 text-neon-cyan" />
            Anuncios
          </h3>
          <div className="space-y-3">
            {[
              { title: 'Reunión de padres', date: 'Hoy', color: 'neon-cyan' },
              { title: 'Entrega de calificaciones Q4', date: 'Mañana', color: 'neon-magenta' },
              { title: 'Actividades extracurriculares', date: '15 Abr', color: 'neon-lime' }
            ].map((item, i) => (
              <div key={i} className="p-3 rounded-lg bg-white/5 border border-white/10 hover:border-white/20 transition-all cursor-pointer group">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-neon-cyan mt-2"></div>
                  <div>
                    <p className="text-white font-semibold text-sm">{item.title}</p>
                    <p className="text-white/40 text-xs">{item.date}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Eventos */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-card p-6 neon-border-magenta"
        >
          <h3 className="text-white font-bold uppercase tracking-wider mb-6 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-neon-magenta" />
            Próximos Eventos
          </h3>
          <div className="space-y-3">
            {[
              { title: 'Clase de Matemáticas', time: '09:00', room: 'Aula 3A' },
              { title: 'Reunión con Tutor', time: '14:00', room: 'Oficina' },
              { title: 'Laboratorio de Ciencias', time: '15:00', room: 'Lab 2' }
            ].map((item, i) => (
              <div key={i} className="p-3 rounded-lg bg-white/5 border border-white/10 hover:border-white/20 transition-all cursor-pointer">
                <p className="text-white font-semibold text-sm">{item.title}</p>
                <p className="text-white/40 text-xs">{item.time} • {item.room}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
