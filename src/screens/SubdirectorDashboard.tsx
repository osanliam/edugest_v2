import { motion } from 'motion/react';
import { useState, useEffect } from 'react';
import { Users, CheckCircle, AlertTriangle, TrendingUp, Calendar, Clock, BookOpen } from 'lucide-react';
import { User } from '../types';

interface SubdirectorDashboardProps {
  user: User;
}

const LS_ALUMNOS = 'ie_alumnos';
const LS_DOCENTES = 'ie_docentes';
const LS_CALIFICATIVOS = 'ie_calificativos_v2';
const LS_ASISTENCIA = 'ie_asistencia';

function lsGet<T>(key: string, def: T): T {
  try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(def)); } catch { return def; }
}

export default function SubdirectorDashboard({ user }: SubdirectorDashboardProps) {
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

  const statsCards = [
    { label: 'Estudiantes', value: stats.estudiantes.toString(), icon: Users, color: 'neon-cyan' },
    { label: 'Docentes', value: stats.docentes.toString(), icon: BookOpen, color: 'neon-magenta' },
    { label: 'Asistencia Hoy', value: `${stats.asistencia}%`, icon: CheckCircle, color: 'neon-lime' },
    { label: 'Secciones', value: stats.secciones.length.toString(), icon: Calendar, color: 'neon-blue' },
  ];

  return (
    <div className="min-h-screen p-6 space-y-8 pb-24">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-neon-magenta/20 rounded-lg neon-border-magenta">
            <Users className="w-8 h-8 text-neon-magenta" />
          </div>
          <div>
            <h1 className="text-4xl font-bold tracking-tighter uppercase">
              Panel <span className="text-neon-lime neon-text-lime">Subdirector</span>
            </h1>
            <p className="text-xs text-white/75 font-mono tracking-widest">SUPERVISIÓN ACADÉMICA</p>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat, i) => (
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
            <p className="text-2xl font-bold text-white">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Activity Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card p-6 neon-border-cyan"
      >
        <h3 className="text-white font-bold uppercase tracking-wider mb-4">Actividad Reciente</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-white/10">
              <tr className="text-white/85 text-xs uppercase">
                <th className="text-left py-3 px-4">Hora</th>
                <th className="text-left py-3 px-4">Evento</th>
                <th className="text-left py-3 px-4">Responsable</th>
                <th className="text-left py-3 px-4">Estado</th>
              </tr>
            </thead>
            <tbody>
              {[
                { time: '08:00', event: 'Inicio de clases', responsible: 'Sistema', status: '✓ Completado' },
                { time: '10:30', event: 'Descanso', responsible: 'Sistema', status: '✓ Activo' },
                { time: '13:00', event: 'Almuerzo', responsible: 'Servicio', status: '✓ Completado' },
              ].map((row, i) => (
                <tr key={i} className="border-b border-white/5 hover:bg-white/5">
                  <td className="py-3 px-4 text-white">{row.time}</td>
                  <td className="py-3 px-4 text-white/90">{row.event}</td>
                  <td className="py-3 px-4 text-white/90">{row.responsible}</td>
                  <td className="py-3 px-4 text-neon-lime text-xs">{row.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
