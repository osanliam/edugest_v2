import { motion } from 'motion/react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { BookMarked, TrendingUp, Award, Target, Zap, AlertCircle } from 'lucide-react';
import FuturisticCard from '../components/FuturisticCard';
import HologramText from '../components/HologramText';
import DataGrid from '../components/DataGrid';

export default function GradesScreenModern() {
  const gradesData = [
    { course: 'Matemáticas', score: 18, max_score: 20 },
    { course: 'Lenguaje', score: 17, max_score: 20 },
    { course: 'Ciencias', score: 19, max_score: 20 },
    { course: 'Historia', score: 16.5, max_score: 20 },
    { course: 'Inglés', score: 18, max_score: 20 },
    { course: 'Física', score: 17.5, max_score: 20 },
  ];

  const trendData = [
    { period: 'Q1', average: 15.8 },
    { period: 'Q2', average: 16.5 },
    { period: 'Q3', average: 17.2 },
    { period: 'Q4', average: 17.75 },
  ];

  const averageGrade = (gradesData.reduce((sum, g) => sum + g.score, 0) / gradesData.length).toFixed(2);

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
            Mis <HologramText>Calificaciones</HologramText>
          </h1>
          <p className="text-white/85 font-mono tracking-widest text-sm">REGISTRO Y SEGUIMIENTO DE NOTAS</p>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {[
            { label: 'Promedio General', value: averageGrade, unit: '/20', icon: Award, color: 'cyan' },
            { label: 'Calificación Máxima', value: '19', unit: '/20', icon: TrendingUp, color: 'lime' },
            { label: 'Calificación Mínima', value: '16.5', unit: '/20', icon: AlertCircle, color: 'blue' },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.1 }}
            >
              <FuturisticCard variant={stat.color as any} glow hover>
                <div className="p-6 space-y-4">
                  <stat.icon className="w-8 h-8 text-neon-cyan animate-pulse-glow" />
                  <p className="text-xs uppercase tracking-widest text-white/85">{stat.label}</p>
                  <p className="text-4xl font-bold text-white">
                    {stat.value}<span className="text-lg text-white/85">{stat.unit}</span>
                  </p>
                </div>
              </FuturisticCard>
            </motion.div>
          ))}
        </motion.div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Trend Chart */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <FuturisticCard variant="magenta" glow>
              <div className="p-6">
                <h3 className="text-white font-bold uppercase tracking-wider mb-6 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-neon-magenta" />
                  <HologramText variant="primary">Tendencia Académica</HologramText>
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
              </div>
            </FuturisticCard>
          </motion.div>

          {/* Distribution Chart */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <FuturisticCard variant="lime" glow>
              <div className="p-6">
                <h3 className="text-white font-bold uppercase tracking-wider mb-6 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-neon-lime" />
                  <HologramText variant="secondary">Distribución</HologramText>
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
              </div>
            </FuturisticCard>
          </motion.div>
        </div>

        {/* Grades Detail */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="mb-4">
            <h3 className="text-2xl font-bold uppercase tracking-wider">
              <HologramText>Detalle por Curso</HologramText>
            </h3>
          </div>
          <DataGrid
            headers={['Curso', 'Calificación', 'Porcentaje', 'Estado']}
            rows={gradesData.map(g => [
              g.course,
              `${g.score}/${g.max_score}`,
              `${((g.score / g.max_score) * 100).toFixed(1)}%`,
              g.score >= 18 ? '✓ Excelente' : g.score >= 15 ? '✓ Bueno' : '⚠ Regular'
            ])}
          />
        </motion.div>

        {/* Academic Goal */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <FuturisticCard variant="cyan" glow>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <Target className="w-6 h-6 text-neon-cyan" />
                <div>
                  <p className="font-bold text-white">Meta Académica</p>
                  <p className="text-sm text-white/90">Mantén un promedio superior a 18.0 para excelencia académica</p>
                </div>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(parseFloat(averageGrade) / 20) * 100}%` }}
                  transition={{ duration: 1.5 }}
                  className="h-full bg-gradient-to-r from-neon-cyan to-neon-magenta"
                ></motion.div>
              </div>
              <p className="text-sm text-neon-cyan font-bold">{parseFloat(averageGrade).toFixed(2)}/20.00</p>
            </div>
          </FuturisticCard>
        </motion.div>
      </div>
    </div>
  );
}
