import { motion } from 'motion/react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { BarChart3, Download, Calendar, TrendingUp, Users, Award } from 'lucide-react';
import { User } from '../types';

interface ReportsScreenProps {
  user: User;
}

const performanceData = [
  { course: 'Matemáticas', q1: 7.5, q2: 7.8, q3: 8.2, q4: 8.5 },
  { course: 'Lenguaje', q1: 7.8, q2: 8.0, q3: 8.1, q4: 8.3 },
  { course: 'Ciencias', q1: 8.0, q2: 8.2, q3: 8.5, q4: 9.0 },
];

const attendanceData = [
  { month: 'Enero', rate: 92 },
  { month: 'Febrero', rate: 94 },
  { month: 'Marzo', rate: 91 },
  { month: 'Abril', rate: 95 },
];

export default function ReportsScreen({ user }: ReportsScreenProps) {
  return (
    <div className="min-h-screen p-6 space-y-8 pb-24">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-neon-magenta/20 rounded-lg neon-border-magenta">
            <BarChart3 className="w-8 h-8 text-neon-magenta" />
          </div>
          <div>
            <h1 className="text-4xl font-bold tracking-tighter uppercase">
              <span className="text-neon-magenta neon-text-magenta">Informes</span>
            </h1>
            <p className="text-xs text-white/75 font-mono tracking-widest">REPORTES Y ANÁLISIS</p>
          </div>
        </div>
      </motion.div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Promedio General', value: '8.3/20', icon: Award, color: 'neon-cyan' },
          { label: 'Asistencia Promedio', value: '93%', icon: Users, color: 'neon-lime' },
          { label: 'Tendencia', value: '↑ Positiva', icon: TrendingUp, color: 'neon-magenta' },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`glass-card p-4 neon-border-${stat.color}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/85 text-xs uppercase">{stat.label}</p>
                <p className="text-2xl font-bold text-white mt-2">{stat.value}</p>
              </div>
              <stat.icon className={`w-6 h-6 text-${stat.color}`} />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Performance Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card p-6 neon-border-cyan"
      >
        <h3 className="text-white font-bold uppercase tracking-wider mb-6">Desempeño por Período</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={performanceData}>
            <CartesianGrid stroke="rgba(6,182,212,0.1)" />
            <XAxis dataKey="course" stroke="rgba(255,255,255,0.3)" />
            <YAxis stroke="rgba(255,255,255,0.3)" />
            <Tooltip contentStyle={{ backgroundColor: 'rgba(13, 22, 38, 0.9)', border: '1px solid rgba(6, 182, 212, 0.5)' }} />
            <Line type="monotone" dataKey="q4" stroke="#06b6d4" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Attendance Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card p-6 neon-border-magenta"
      >
        <h3 className="text-white font-bold uppercase tracking-wider mb-6">Asistencia Mensual</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={attendanceData}>
            <CartesianGrid stroke="rgba(217,70,239,0.1)" />
            <XAxis dataKey="month" stroke="rgba(255,255,255,0.3)" />
            <YAxis stroke="rgba(255,255,255,0.3)" domain={[0, 100]} />
            <Tooltip contentStyle={{ backgroundColor: 'rgba(13, 22, 38, 0.9)', border: '1px solid rgba(217, 70, 239, 0.5)' }} />
            <Bar dataKey="rate" fill="#d946ef" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Export Options */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-card p-6 neon-border-lime"
      >
        <h3 className="text-white font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
          <Download className="w-5 h-5" />
          Descargar Reportes
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {['PDF', 'Excel', 'Impresión'].map((format) => (
            <button
              key={format}
              className="p-3 bg-neon-lime/20 border border-neon-lime text-neon-lime hover:bg-neon-lime/30 rounded-lg transition-all uppercase font-semibold text-sm"
            >
              {format}
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
