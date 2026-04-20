import { motion } from 'motion/react';
import { Users, CheckCircle, AlertTriangle, TrendingUp, Calendar, Clock } from 'lucide-react';
import { User } from '../types';

interface SubdirectorDashboardProps {
  user: User;
}

export default function SubdirectorDashboard({ user }: SubdirectorDashboardProps) {
  const stats = [
    { label: 'Estudiantes Activos', value: 250, icon: Users, color: 'neon-cyan' },
    { label: 'Clases Hoy', value: 24, icon: Calendar, color: 'neon-magenta' },
    { label: 'Asistencia Promedio', value: '94%', icon: CheckCircle, color: 'neon-lime' },
    { label: 'Incidentes', value: 2, icon: AlertTriangle, color: 'neon-blue' },
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
        {stats.map((stat, i) => (
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
