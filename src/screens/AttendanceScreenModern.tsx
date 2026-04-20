import { motion } from 'motion/react';
import { CheckCircle, XCircle, Clock, TrendingUp, Calendar, AlertCircle, Download, Filter } from 'lucide-react';
import FuturisticCard from '../components/FuturisticCard';
import HologramText from '../components/HologramText';
import DataGrid from '../components/DataGrid';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  schoolId: string;
}

interface AttendanceScreenModernProps {
  user?: User;
}

export default function AttendanceScreenModern({ user }: AttendanceScreenModernProps) {
  const attendanceTrend = [
    { date: 'Lunes', percentage: 96 },
    { date: 'Martes', percentage: 94 },
    { date: 'Miércoles', percentage: 98 },
    { date: 'Jueves', percentage: 95 },
    { date: 'Viernes', percentage: 91 },
  ];

  const stats = [
    { label: 'Presentes Hoy', value: '442', color: 'lime', icon: CheckCircle },
    { label: 'Ausentes', value: '14', color: 'blue', icon: XCircle },
    { label: 'Tardanzas', value: '8', color: 'magenta', icon: Clock },
    { label: 'Tasa Semanal', value: '94.8%', color: 'cyan', icon: TrendingUp },
  ];

  const recentRecords = [
    { id: '1', student: 'Carlos Mendez', date: '2024-04-19', status: 'Presente', time: '08:02' },
    { id: '2', student: 'María García', date: '2024-04-19', status: 'Ausente', time: '-' },
    { id: '3', student: 'Juan Pérez', date: '2024-04-19', status: 'Presente', time: '08:00' },
    { id: '4', student: 'Ana López', date: '2024-04-19', status: 'Tardanza', time: '08:35' },
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
            Control de <HologramText>Asistencia</HologramText>
          </h1>
          <p className="text-white/85 font-mono tracking-widest text-sm">REGISTRO Y ANÁLISIS DE PRESENCIA</p>
        </motion.div>

        {/* Real-time Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
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
                      <Icon className="w-5 h-5 text-neon-cyan animate-pulse-glow" />
                    </div>
                    <p className="text-3xl font-bold text-white">{stat.value}</p>
                  </div>
                </FuturisticCard>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center justify-center gap-2 p-4 rounded-xl border-2 border-neon-lime/50 bg-gradient-to-br from-white/5 to-white/5 hover:from-white/10 hover:to-white/5 text-neon-lime font-bold uppercase text-sm transition-all"
          >
            <CheckCircle className="w-5 h-5" />
            Registrar Presencia
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center justify-center gap-2 p-4 rounded-xl border-2 border-neon-magenta/50 bg-gradient-to-br from-white/5 to-white/5 hover:from-white/10 hover:to-white/5 text-neon-magenta font-bold uppercase text-sm transition-all"
          >
            <XCircle className="w-5 h-5" />
            Registrar Ausencia
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center justify-center gap-2 p-4 rounded-xl border-2 border-neon-cyan/50 bg-gradient-to-br from-white/5 to-white/5 hover:from-white/10 hover:to-white/5 text-neon-cyan font-bold uppercase text-sm transition-all"
          >
            <Download className="w-5 h-5" />
            Descargar Reporte
          </motion.button>
        </motion.div>

        {/* Weekly Trend */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <FuturisticCard variant="cyan" glow>
            <div className="p-6">
              <h3 className="text-white font-bold uppercase tracking-wider mb-6 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-neon-cyan" />
                <HologramText variant="primary">Tendencia Semanal</HologramText>
              </h3>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={attendanceTrend}>
                  <CartesianGrid stroke="rgba(0,217,255,0.1)" strokeDasharray="3 3" />
                  <XAxis dataKey="date" stroke="rgba(255,255,255,0.3)" />
                  <YAxis stroke="rgba(255,255,255,0.3)" domain={[85, 100]} />
                  <Tooltip contentStyle={{ backgroundColor: 'rgba(13, 22, 38, 0.9)', border: '1px solid rgba(0, 217, 255, 0.5)', borderRadius: '8px', color: '#fff' }} />
                  <Line type="monotone" dataKey="percentage" stroke="#00d9ff" strokeWidth={3} dot={{ fill: '#00d9ff', r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </FuturisticCard>
        </motion.div>

        {/* Summary Cards */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          <FuturisticCard variant="magenta" glow hover>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-6 h-6 text-neon-magenta animate-pulse-glow" />
                <p className="font-bold text-white uppercase text-sm">Mes Actual</p>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-white/90">Asistencia Promedio:</span>
                  <span className="text-white font-bold">94.8%</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <motion.div className="h-full bg-gradient-to-r from-neon-magenta to-neon-cyan" style={{ width: '94.8%' }} />
                </div>
              </div>
            </div>
          </FuturisticCard>

          <FuturisticCard variant="lime" glow hover>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-6 h-6 text-neon-lime animate-pulse-glow" />
                <p className="font-bold text-white uppercase text-sm">Estudiantes a Monitorear</p>
              </div>
              <div className="space-y-2">
                <p className="text-white/90 text-sm">3 estudiantes con baja asistencia (&lt;85%)</p>
                <div className="flex gap-2">
                  {['Carlos M.', 'Ana L.', 'Juan P.'].map((name, i) => (
                    <div key={i} className="px-2 py-1 rounded bg-neon-lime/20 text-neon-lime text-xs font-bold">
                      {name}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </FuturisticCard>
        </motion.div>

        {/* Recent Records */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-2xl font-bold uppercase tracking-wider">
              <HologramText variant="secondary">Registros Recientes</HologramText>
            </h3>
            <motion.button
              whileHover={{ scale: 1.1 }}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all text-xs font-bold text-white"
            >
              <Filter className="w-4 h-4" />
              Filtrar
            </motion.button>
          </div>

          <div className="space-y-3">
            {recentRecords.map((record, i) => (
              <motion.div
                key={record.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + i * 0.05 }}
              >
                <FuturisticCard
                  variant={
                    record.status === 'Presente'
                      ? 'lime'
                      : record.status === 'Ausente'
                        ? 'blue'
                        : 'magenta'
                  }
                  glow
                  hover
                >
                  <div className="p-4 flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-white font-bold uppercase tracking-wide text-sm">{record.student}</p>
                      <p className="text-xs text-white/85 mt-1">{record.date}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-bold ${
                        record.status === 'Presente'
                          ? 'text-neon-lime'
                          : record.status === 'Ausente'
                            ? 'text-neon-blue'
                            : 'text-neon-magenta'
                      }`}>
                        {record.status}
                      </p>
                      <p className="text-xs text-white/85 mt-1">{record.time}</p>
                    </div>
                  </div>
                </FuturisticCard>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Monthly Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <div className="mb-4">
            <h3 className="text-2xl font-bold uppercase tracking-wider">
              <HologramText>Resumen del Mes</HologramText>
            </h3>
          </div>
          <DataGrid
            headers={['Grado', 'Total Estudiantes', 'Presentes', 'Ausentes', 'Tardanzas']}
            rows={[
              ['1º A', '45', '44', '1', '2'],
              ['2º B', '48', '46', '2', '3'],
              ['3º A', '42', '42', '0', '1'],
              ['4º B', '50', '48', '2', '4'],
              ['5º A', '51', '50', '1', '2'],
              ['6º B', '48', '47', '1', '2'],
            ]}
          />
        </motion.div>
      </div>
    </div>
  );
}
