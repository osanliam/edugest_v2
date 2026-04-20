import { motion } from 'motion/react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { BookMarked, TrendingUp, Award, Target, Zap, AlertCircle } from 'lucide-react';
import { User } from '../types';

interface GradesScreenProps {
  user: User;
}

interface Grade {
  id: string;
  course: string;
  score: number;
  maxScore: number;
  period: string;
  teacher: string;
  weight: number;
}

const gradesData: Grade[] = [
  { id: '1', course: 'Matemáticas', score: 18, maxScore: 20, period: 'Q4', teacher: 'Prof. García', weight: 15 },
  { id: '2', course: 'Lenguaje', score: 17, maxScore: 20, period: 'Q4', teacher: 'Prof. López', weight: 15 },
  { id: '3', course: 'Ciencias', score: 19, maxScore: 20, period: 'Q4', teacher: 'Prof. Rodríguez', weight: 15 },
  { id: '4', course: 'Historia', score: 16.5, maxScore: 20, period: 'Q4', teacher: 'Prof. Martínez', weight: 12 },
  { id: '5', course: 'Inglés', score: 18, maxScore: 20, period: 'Q4', teacher: 'Prof. Silva', weight: 12 },
  { id: '6', course: 'Física', score: 17.5, maxScore: 20, period: 'Q4', teacher: 'Prof. Sánchez', weight: 12 },
];

const trendData = [
  { period: 'Q1', average: 15.8 },
  { period: 'Q2', average: 16.5 },
  { period: 'Q3', average: 17.2 },
  { period: 'Q4', average: 17.75 },
];

const getGradeColor = (score: number): string => {
  if (score >= 18) return 'text-neon-lime border-neon-lime/50 bg-neon-lime/10';
  if (score >= 15) return 'text-neon-cyan border-neon-cyan/50 bg-neon-cyan/10';
  if (score >= 12) return 'text-yellow-500 border-yellow-500/50 bg-yellow-500/10';
  return 'text-red-500 border-red-500/50 bg-red-500/10';
};

export default function GradesScreen({ user }: GradesScreenProps) {
  const averageGrade = (gradesData.reduce((sum, g) => sum + g.score, 0) / gradesData.length).toFixed(2);
  const highestGrade = Math.max(...gradesData.map(g => g.score));
  const lowestGrade = Math.min(...gradesData.map(g => g.score));

  return (
    <div className="min-h-screen p-6 space-y-8 pb-24">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-neon-cyan/20 rounded-lg neon-border-cyan">
            <BookMarked className="w-8 h-8 text-neon-cyan" />
          </div>
          <div>
            <h1 className="text-4xl font-bold tracking-tighter uppercase">
              Mis <span className="text-neon-magenta neon-text-magenta">Calificaciones</span>
            </h1>
            <p className="text-xs text-white/75 font-mono tracking-widest">REGISTRO Y SEGUIMIENTO DE NOTAS</p>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Promedio General', value: averageGrade, unit: '/20', icon: Award, color: 'neon-cyan' },
          { label: 'Calificación Máxima', value: highestGrade, unit: '/20', icon: TrendingUp, color: 'neon-lime' },
          { label: 'Calificación Mínima', value: lowestGrade, unit: '/20', icon: AlertCircle, color: 'neon-blue' },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`glass-card p-6 neon-border-${stat.color} hover:neon-border-magenta transition-all`}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-white/85 text-sm uppercase tracking-wider">{stat.label}</p>
                <p className="text-4xl font-bold text-white mt-2">
                  {stat.value}<span className="text-lg text-white/85">{stat.unit}</span>
                </p>
              </div>
              <stat.icon className={`w-6 h-6 text-${stat.color}`} />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Trend Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card p-6 neon-border-magenta"
      >
        <h3 className="text-white font-bold uppercase tracking-wider mb-6 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-neon-magenta" />
          Tendencia Académica
        </h3>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={trendData}>
            <CartesianGrid stroke="rgba(217,70,239,0.1)" strokeDasharray="3 3" />
            <XAxis dataKey="period" stroke="rgba(255,255,255,0.3)" />
            <YAxis stroke="rgba(255,255,255,0.3)" domain={[14, 20]} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(13, 22, 38, 0.9)',
                border: '1px solid rgba(217, 70, 239, 0.5)',
                borderRadius: '8px',
                color: '#fff'
              }}
            />
            <Line type="monotone" dataKey="average" stroke="#d946ef" strokeWidth={3} dot={{ fill: '#d946ef', r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Grades Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-card p-6 neon-border-cyan"
      >
        <h3 className="text-white font-bold uppercase tracking-wider mb-6 flex items-center gap-2">
          <BookMarked className="w-5 h-5 text-neon-cyan" />
          Detalle por Curso
        </h3>
        <div className="space-y-4">
          {gradesData.map((grade, i) => (
            <motion.div
              key={grade.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <p className="text-white font-bold uppercase tracking-wider">{grade.course}</p>
                  <p className="text-xs text-white/85 mt-1">{grade.teacher}</p>
                </div>
                <div className={`px-4 py-2 rounded-lg border font-bold text-lg ${getGradeColor(grade.score)}`}>
                  {grade.score}
                </div>
              </div>
              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-neon-cyan to-neon-magenta"
                  style={{ width: `${(grade.score / grade.maxScore) * 100}%` }}
                ></div>
              </div>
              <div className="flex items-center justify-between mt-3 text-xs text-white/85">
                <span>{grade.period}</span>
                <span>{((grade.score / grade.maxScore) * 100).toFixed(1)}%</span>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Grade Distribution Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="glass-card p-6 neon-border-lime"
      >
        <h3 className="text-white font-bold uppercase tracking-wider mb-6 flex items-center gap-2">
          <Zap className="w-5 h-5 text-neon-lime" />
          Distribución de Calificaciones
        </h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={gradesData}>
            <CartesianGrid stroke="rgba(132,204,22,0.1)" strokeDasharray="3 3" />
            <XAxis dataKey="course" stroke="rgba(255,255,255,0.3)" />
            <YAxis stroke="rgba(255,255,255,0.3)" domain={[0, 20]} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(13, 22, 38, 0.9)',
                border: '1px solid rgba(132, 204, 22, 0.5)',
                borderRadius: '8px',
                color: '#fff'
              }}
            />
            <Bar dataKey="score" fill="#84cc16" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Info Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="glass-card p-4 neon-border-magenta border-l-4"
      >
        <div className="flex items-start gap-3">
          <Target className="w-5 h-5 text-neon-magenta flex-shrink-0 mt-1" />
          <div>
            <p className="text-white font-semibold">Meta Académica</p>
            <p className="text-white/90 text-sm mt-1">Mantén un promedio superior a 18.0 para excelencia académica. Continúa con tu esfuerzo.</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
