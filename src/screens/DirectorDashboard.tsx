import { motion } from 'motion/react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Building2, Users, TrendingUp, AlertCircle, BookOpen, Award } from 'lucide-react';
import { User } from '../types';

interface DirectorDashboardProps {
  user: User;
}

const schoolStats = [
  { period: 'Q1', students: 250, teachers: 45, courses: 28 },
  { period: 'Q2', students: 252, teachers: 45, courses: 28 },
  { period: 'Q3', students: 248, teachers: 46, courses: 29 },
  { period: 'Q4', students: 255, teachers: 46, courses: 30 },
];

export default function DirectorDashboard({ user }: DirectorDashboardProps) {
  return (
    <div className="min-h-screen p-6 space-y-8 pb-24">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-neon-blue/20 rounded-lg neon-border-blue">
            <Building2 className="w-8 h-8 text-neon-blue" />
          </div>
          <div>
            <h1 className="text-4xl font-bold tracking-tighter uppercase">
              Panel <span className="text-neon-cyan neon-text-cyan">Director</span>
            </h1>
            <p className="text-xs text-white/75 font-mono tracking-widest">SUPERVISIÓN INSTITUCIONAL</p>
          </div>
        </div>
      </motion.div>

      {/* Main Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Estudiantes', value: 255, icon: Users, color: 'neon-cyan' },
          { label: 'Docentes', value: 46, icon: BookOpen, color: 'neon-magenta' },
          { label: 'Cursos', value: 30, icon: Award, color: 'neon-lime' },
          { label: 'Promedio Inst.', value: '8.2', icon: TrendingUp, color: 'neon-blue' },
        ].map((metric, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`glass-card p-4 neon-border-${metric.color}`}
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-white/85 text-xs uppercase">{metric.label}</p>
              <metric.icon className={`w-5 h-5 text-${metric.color}`} />
            </div>
            <p className="text-2xl font-bold text-white">{metric.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Trends */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card p-6 neon-border-cyan"
      >
        <h3 className="text-white font-bold uppercase tracking-wider mb-6">Evolución Institucional</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={schoolStats}>
            <CartesianGrid stroke="rgba(6,182,212,0.1)" />
            <XAxis dataKey="period" stroke="rgba(255,255,255,0.3)" />
            <YAxis stroke="rgba(255,255,255,0.3)" />
            <Tooltip contentStyle={{ backgroundColor: 'rgba(13, 22, 38, 0.9)', border: '1px solid rgba(6, 182, 212, 0.5)' }} />
            <Line type="monotone" dataKey="students" stroke="#06b6d4" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Alerts */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card p-4 neon-border-magenta border-l-4"
      >
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-neon-magenta flex-shrink-0 mt-1" />
          <div>
            <p className="text-white font-bold">Puntos de Atención</p>
            <ul className="text-white/90 text-sm mt-2 space-y-1">
              <li>• 3 estudiantes con bajo desempeño en Matemáticas</li>
              <li>• 2 padres pendientes de reunión</li>
            </ul>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
