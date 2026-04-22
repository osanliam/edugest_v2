import { motion } from 'motion/react';
import { useState, useEffect } from 'react';
import { Users, TrendingUp, AlertCircle, BarChart3, Clock, CheckCircle, XCircle, PieChart, BookOpen, GraduationCap } from 'lucide-react';
import FuturisticCard from '../components/FuturisticCard';
import HologramText from '../components/HologramText';
import DataGrid from '../components/DataGrid';
import { LineChart, Line, BarChart, Bar, PieChart as Rechartspie, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  schoolId: string;
}

interface DirectorDashboardModernProps {
  user?: User;
}

const LS_ALUMNOS = 'ie_alumnos';
const LS_DOCENTES = 'ie_docentes';
const LS_CALIFICATIVOS = 'ie_calificativos_v2';
const LS_ASISTENCIA = 'ie_asistencia';

function lsGet<T>(key: string, def: T): T {
  try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(def)); } catch { return def; }
}

export default function DirectorDashboardModern({ user }: DirectorDashboardModernProps) {
  const [stats, setStats] = useState({
    estudiantes: 0,
    docentes: 0,
    asistencia: 0,
    calificaciones: 0,
    grados: [] as string[],
    secciones: [] as string[],
  });

  useEffect(() => {
    const loadData = () => {
      const alumnos = lsGet<any[]>(LS_ALUMNOS, []);
      const docentes = lsGet<any[]>(LS_DOCENTES, []);
      const calificaciones = lsGet<any[]>(LS_CALIFICATIVOS, []);
      const asistencia = lsGet<any[]>(LS_ASISTENCIA, []);

      const uniqueGrados = [...new Set(alumnos.map(a => a.grado).filter(Boolean))];
      const uniqueSecciones = [...new Set(alumnos.map(a => a.seccion).filter(Boolean))];

      const fechaHoy = new Date().toISOString().split('T')[0];
      const asistenciaHoy = asistencia.filter(a => a.fecha === fechaHoy);
      const presentes = asistenciaHoy.filter(a => a.estado === 'presente').length;
      const asistenciaPct = asistenciaHoy.length > 0 ? Math.round((presentes / asistenciaHoy.length) * 100) : 0;

      setStats({
        estudiantes: alumnos.length,
        docentes: docentes.length,
        asistencia: asistenciaPct,
        calificaciones: calificaciones.length,
        grados: uniqueGrados,
        secciones: uniqueSecciones,
      });
    };
    loadData();
  }, []);

  const performanceData = [
    { month: 'C1', asistencia: stats.asistencia || 85, rendimiento: 80 },
    { month: 'C2', asistencia: (stats.asistencia || 85) - 2, rendimiento: 82 },
    { month: 'C3', asistencia: (stats.asistencia || 85) + 3, rendimiento: 78 },
    { month: 'C4', asistencia: (stats.asistencia || 85), rendimiento: 85 },
  ];

  const departmentData = [
    { name: 'C1', value: Math.round(stats.calificaciones * 0.3) || 10, fill: '#00d9ff' },
    { name: 'C2', value: Math.round(stats.calificaciones * 0.3) || 10, fill: '#d946ef' },
    { name: 'C3', value: Math.round(stats.calificaciones * 0.4) || 15, fill: '#84cc16' },
  ];

  const staffStats = [
    { label: 'Docentes', value: stats.docentes.toString(), color: 'cyan' },
    { label: 'Estudiantes', value: stats.estudiantes.toString(), color: 'lime' },
    { label: 'Asistencia Hoy', value: `${stats.asistencia}%`, color: 'blue' },
    { label: 'Grados', value: stats.grados.length.toString(), color: 'magenta' },
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
            Panel <HologramText>Director</HologramText>
          </h1>
          <p className="text-white/85 font-mono tracking-widest text-sm">GESTIÓN INSTITUCIONAL Y DESEMPEÑO</p>
        </motion.div>

        {/* KPI Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {staffStats.map((stat, i) => (
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

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Attendance & Performance Trend */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <FuturisticCard variant="cyan" glow>
              <div className="p-6">
                <h3 className="text-white font-bold uppercase tracking-wider mb-6 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-neon-cyan" />
                  <HologramText variant="primary">Tendencia Trimestral</HologramText>
                </h3>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={performanceData}>
                    <CartesianGrid stroke="rgba(0,217,255,0.1)" strokeDasharray="3 3" />
                    <XAxis dataKey="month" stroke="rgba(255,255,255,0.3)" />
                    <YAxis stroke="rgba(255,255,255,0.3)" domain={[70, 100]} />
                    <Tooltip contentStyle={{ backgroundColor: 'rgba(13, 22, 38, 0.9)', border: '1px solid rgba(0, 217, 255, 0.5)', borderRadius: '8px', color: '#fff' }} />
                    <Line type="monotone" dataKey="attendance" stroke="#00d9ff" strokeWidth={3} dot={{ fill: '#00d9ff', r: 4 }} name="Asistencia %" />
                    <Line type="monotone" dataKey="performance" stroke="#d946ef" strokeWidth={3} dot={{ fill: '#d946ef', r: 4 }} name="Desempeño %" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </FuturisticCard>
          </motion.div>

          {/* Department Distribution */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <FuturisticCard variant="magenta" glow>
              <div className="p-6">
                <h3 className="text-white font-bold uppercase tracking-wider mb-6 flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-neon-magenta" />
                  <HologramText variant="secondary">Distribución por Área</HologramText>
                </h3>
                <ResponsiveContainer width="100%" height={280}>
                  <Rechartspie data={departmentData}>
                    <Pie dataKey="value" cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5}>
                      {departmentData.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: 'rgba(13, 22, 38, 0.9)', border: '1px solid rgba(217, 70, 239, 0.5)', borderRadius: '8px', color: '#fff' }} />
                  </Rechartspie>
                </ResponsiveContainer>
              </div>
            </FuturisticCard>
          </motion.div>
        </div>

        {/* Key Indicators */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <FuturisticCard variant="lime" glow hover>
            <div className="p-6 space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-6 h-6 text-neon-lime animate-pulse-glow" />
                <p className="font-bold text-white text-sm uppercase">Instituciones Sanas</p>
              </div>
              <p className="text-3xl font-bold text-white">94%</p>
              <p className="text-xs text-white/85">Cumplimiento de estándares</p>
            </div>
          </FuturisticCard>

          <FuturisticCard variant="blue" glow hover>
            <div className="p-6 space-y-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-6 h-6 text-neon-blue animate-pulse-glow" />
                <p className="font-bold text-white text-sm uppercase">Alertas Pendientes</p>
              </div>
              <p className="text-3xl font-bold text-white">3</p>
              <p className="text-xs text-white/85">Requieren atención</p>
            </div>
          </FuturisticCard>

          <FuturisticCard variant="cyan" glow hover>
            <div className="p-6 space-y-3">
              <div className="flex items-center gap-2">
                <Clock className="w-6 h-6 text-neon-cyan animate-pulse-glow" />
                <p className="font-bold text-white text-sm uppercase">Actualizado</p>
              </div>
              <p className="text-3xl font-bold text-neon-cyan">Ahora</p>
              <p className="text-xs text-white/85">Sincronización en tiempo real</p>
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
              <HologramText>Actividad Reciente</HologramText>
            </h3>
          </div>
          <DataGrid
            headers={['Evento', 'Detalle', 'Fecha', 'Estado']}
            rows={[
              ['Reporte Generado', 'Análisis de Asistencia Q2', '2024-04-19', '✓ Completado'],
              ['Usuario Agregado', 'Nuevo Docente - Prof. Núñez', '2024-04-18', '✓ Activo'],
              ['Alerta de Sistema', 'Base de datos > 85% capacidad', '2024-04-17', '⚠ Crítico'],
              ['Evaluación Completada', 'Desempeño Docente Trimestral', '2024-04-16', '✓ Archivado'],
            ]}
          />
        </motion.div>
      </div>
    </div>
  );
}
