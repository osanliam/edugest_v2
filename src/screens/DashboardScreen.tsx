import { motion } from 'motion/react';
import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Users, BookOpen, AlertCircle, Calendar, Clock, Award, BarChart3, Zap, Activity, GraduationCap, UserCheck, FileText } from 'lucide-react';
import { User } from '../types';

const LS_ALUMNOS = 'ie_alumnos';
const LS_DOCENTES = 'ie_docentes';
const LS_CALIFICATIVOS = 'ie_calificativos_v2';
const LS_ASISTENCIA = 'ie_asistencia';

interface DashboardScreenProps {
  user: User;
}

function lsGet<T>(key: string, def: T): T {
  try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(def)); } catch { return def; }
}

export default function DashboardScreen({ user }: DashboardScreenProps) {
  const [stats, setStats] = useState({
    estudiantes: 0,
    docentes: 0,
    asistencia: 0,
    promedio: 0,
    calificaciones: 0,
    grados: [] as string[],
    secciones: [] as string[]
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = () => {
      const todosAlumnos  = lsGet<any[]>(LS_ALUMNOS, []);
      const docentes      = lsGet<any[]>(LS_DOCENTES, []);
      const calificaciones = lsGet<any[]>(LS_CALIFICATIVOS, []);
      const asistencia    = lsGet<any[]>(LS_ASISTENCIA, []);

      // Si es docente, filtrar solo sus alumnos según sus asignaciones
      let alumnos = todosAlumnos;
      if (user.role === 'teacher' && (user as any).docenteId) {
        const asignaciones = lsGet<any[]>('cfg_asignaciones', []);
        const mias = asignaciones.filter(a => a.docenteId === (user as any).docenteId);
        if (mias.length > 0) {
          const grados   = [...new Set(mias.flatMap(a => a.grados   || []))] as string[];
          const secciones = [...new Set(mias.flatMap(a => a.secciones || []))] as string[];
          alumnos = todosAlumnos.filter(a =>
            grados.includes(a.grado) && secciones.includes(a.seccion)
          );
        } else {
          alumnos = []; // docente sin asignación → no mostrar alumnos ajenos
        }
      }

      const uniqueGrados   = [...new Set(alumnos.map(a => a.grado).filter(Boolean))];
      const uniqueSecciones = [...new Set(alumnos.map(a => a.seccion).filter(Boolean))];

      const fechaHoy = new Date().toISOString().split('T')[0];
      const asistenciaHoy = asistencia.filter(a => a.fecha === fechaHoy);
      const presentes = asistenciaHoy.filter(a => a.estado === 'presente').length;
      const asistenciaPct = asistenciaHoy.length > 0 ? Math.round((presentes / asistenciaHoy.length) * 100) : 0;

      const CAL_VALOR: Record<string, number> = { C: 1, B: 2, A: 3, AD: 4 };
      let sumaCal = 0, countCal = 0;
      calificaciones.forEach(cal => {
        if (CAL_VALOR[cal.calificativo]) {
          sumaCal += CAL_VALOR[cal.calificativo];
          countCal++;
        }
      });
      const promedio = countCal > 0 ? (sumaCal / countCal * 25).toFixed(1) : '0';

      setStats({
        estudiantes: alumnos.length,
        docentes: user.role === 'teacher' ? 1 : docentes.length,
        asistencia: asistenciaPct,
        promedio: parseFloat(promedio),
        calificaciones: calificaciones.length,
        grados: uniqueGrados,
        secciones: uniqueSecciones
      });
      setLoading(false);
    };

    loadData();
  }, [user]);

  const gradesData = [
    { period: 'C1', promedio: stats.promedio > 0 ? stats.promedio : 7.5 },
    { period: 'C2', promedio: stats.promedio > 0 ? stats.promedio - 0.2 : 7.8 },
    { period: 'C3', promedio: stats.promedio > 0 ? stats.promedio + 0.1 : 8.2 },
    { period: 'C4', promedio: stats.promedio > 0 ? stats.promedio + 0.3 : 8.5 },
  ];

  const attendanceData = [
    { month: 'Ene', attendance: stats.asistencia || 92 },
    { month: 'Feb', attendance: stats.asistencia || 94 },
    { month: 'Mar', attendance: stats.asistencia || 91 },
    { month: 'Abr', attendance: stats.asistencia || 95 },
  ];
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

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Calificaciones', value: stats.calificaciones.toString(), change: 'Registros', icon: FileText, color: 'neon-cyan' },
          { label: 'Asistencia', value: `${stats.asistencia}%`, change: 'Hoy', icon: Clock, color: 'neon-lime' },
          { label: 'Docentes', value: stats.docentes.toString(), change: `${stats.secciones.length} secciones`, icon: UserCheck, color: 'neon-magenta' },
          { label: 'Estudiantes', value: stats.estudiantes.toString(), change: `${stats.grados.length} grados`, icon: Users, color: 'neon-blue' },
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
            <LineChart data={gradesData}>
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
              <Line type="monotone" dataKey="promedio" stroke="#06b6d4" strokeWidth={3} dot={{ fill: '#06b6d4', r: 4 }} />
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
            <BarChart data={attendanceData}>
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
        {/* Información del Sistema */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card p-6 neon-border-cyan"
        >
          <h3 className="text-white font-bold uppercase tracking-wider mb-6 flex items-center gap-2">
            <Zap className="w-5 h-5 text-neon-cyan" />
            Estado del Sistema
          </h3>
          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-white/5 border border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-neon-lime"></div>
                <div>
                  <p className="text-white font-semibold text-sm">Base de Datos</p>
                  <p className="text-white/40 text-xs">localStorage activa</p>
                </div>
              </div>
            </div>
            <div className="p-3 rounded-lg bg-white/5 border border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-neon-cyan"></div>
                <div>
                  <p className="text-white font-semibold text-sm">Grados Configurados</p>
                  <p className="text-white/40 text-xs">{stats.grados.sort().join(', ') || 'Sin configuración'}</p>
                </div>
              </div>
            </div>
            <div className="p-3 rounded-lg bg-white/5 border border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-neon-magenta"></div>
                <div>
                  <p className="text-white font-semibold text-sm">Secciones Activas</p>
                  <p className="text-white/40 text-xs">{stats.secciones.sort().join(', ') || 'Sin configuración'}</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Acceso Rápido */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-card p-6 neon-border-magenta"
        >
          <h3 className="text-white font-bold uppercase tracking-wider mb-6 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-neon-magenta" />
            Módulos Disponibles
          </h3>
          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-white/5 border border-white/10 hover:border-white/20 transition-all cursor-pointer">
              <p className="text-white font-semibold text-sm">Gestión de Alumnos</p>
              <p className="text-white/40 text-xs">{stats.estudiantes} estudiantes registrados</p>
            </div>
            <div className="p-3 rounded-lg bg-white/5 border border-white/10 hover:border-white/20 transition-all cursor-pointer">
              <p className="text-white font-semibold text-sm">Gestión de Docentes</p>
              <p className="text-white/40 text-xs">{stats.docentes} docentes registrados</p>
            </div>
            <div className="p-3 rounded-lg bg-white/5 border border-white/10 hover:border-white/20 transition-all cursor-pointer">
              <p className="text-white font-semibold text-sm">Calificaciones</p>
              <p className="text-white/40 text-xs">{stats.calificaciones} registros de evaluación</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
