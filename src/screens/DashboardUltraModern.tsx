import { motion } from 'motion/react';
import { Zap, TrendingUp, Users, Target, Activity, Lock, Network } from 'lucide-react';
import FuturisticCard from '../components/FuturisticCard';
import HologramText from '../components/HologramText';
import DataGrid from '../components/DataGrid';

export default function DashboardUltraModern() {
  return (
    <div className="min-h-screen bg-dark-bg text-white overflow-hidden">
      {/* Fondo animado */}
      <div className="fixed inset-0 -z-50">
        <div className="absolute inset-0 bg-gradient-cyber opacity-60"></div>
        <motion.div
          animate={{ backgroundPosition: ['0% 0%', '100% 100%'] }}
          transition={{ duration: 20, repeat: Infinity, repeatType: 'reverse' }}
          className="absolute inset-0 bg-gradient-to-br from-neon-cyan/10 via-transparent to-neon-magenta/10 opacity-40"
        ></motion.div>
      </div>

      <div className="relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          className="border-b border-cyan-500/20 bg-gradient-to-b from-cyan-500/10 to-transparent backdrop-blur-2xl sticky top-0 z-40"
        >
          <div className="max-w-7xl mx-auto px-6 py-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-5xl font-black tracking-tighter mb-2">
                  <HologramText>EDUGEST</HologramText>
                  <span className="block text-2xl text-white/85 font-normal mt-2 tracking-widest">
                    SISTEMA DE GESTIÓN EDUCATIVA
                  </span>
                </h1>
              </div>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                className="w-16 h-16 rounded-full bg-gradient-hologram p-0.5 opacity-50"
              >
                <div className="w-full h-full rounded-full bg-dark-bg"></div>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Contenido Principal */}
        <div className="max-w-7xl mx-auto px-6 py-12 space-y-12">
          {/* Stats Grid */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {[
              { icon: Users, label: 'Estudiantes', value: '342', color: 'cyan' },
              { icon: Target, label: 'Promedio GPA', value: '3.8', color: 'magenta' },
              { icon: TrendingUp, label: 'Asistencia', value: '92.5%', color: 'lime' },
              { icon: Zap, label: 'Cursos Activos', value: '42', color: 'blue' },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
              >
                <FuturisticCard variant={stat.color as any} glow hover>
                  <div className="p-6 space-y-4">
                    <stat.icon className="w-8 h-8 text-neon-cyan animate-pulse-glow" />
                    <p className="text-sm uppercase tracking-widest text-white/85">{stat.label}</p>
                    <p className="text-4xl font-bold">
                      <HologramText variant="primary">{stat.value}</HologramText>
                    </p>
                  </div>
                </FuturisticCard>
              </motion.div>
            ))}
          </motion.div>

          {/* Charts Section */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            {/* Activity Chart */}
            <FuturisticCard variant="glass" glow hover>
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold uppercase tracking-wider">
                    <HologramText variant="secondary">Actividad Reciente</HologramText>
                  </h3>
                  <Activity className="w-5 h-5 text-neon-magenta animate-glow-pulse" />
                </div>

                <div className="space-y-4">
                  {[
                    { action: 'Calificación registrada', time: 'Hace 5 min', progress: 90 },
                    { action: 'Asistencia actualizada', time: 'Hace 15 min', progress: 75 },
                    { action: 'Nuevo mensaje enviado', time: 'Hace 2 horas', progress: 60 },
                  ].map((item, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + i * 0.1 }}
                      className="space-y-2"
                    >
                      <div className="flex justify-between text-sm">
                        <span className="text-white/80">{item.action}</span>
                        <span className="text-white/40 text-xs">{item.time}</span>
                      </div>
                      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${item.progress}%` }}
                          transition={{ delay: 0.6 + i * 0.1, duration: 1 }}
                          className="h-full bg-gradient-to-r from-neon-cyan to-neon-magenta"
                        ></motion.div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </FuturisticCard>

            {/* Performance Chart */}
            <FuturisticCard variant="magenta" glow hover>
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold uppercase tracking-wider">
                    <HologramText variant="primary">Desempeño</HologramText>
                  </h3>
                  <TrendingUp className="w-5 h-5 text-neon-lime animate-glow-pulse" />
                </div>

                <div className="space-y-6">
                  {[
                    { label: 'Matemáticas', value: 92 },
                    { label: 'Lenguaje', value: 88 },
                    { label: 'Ciencias', value: 95 },
                  ].map((metric, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 + i * 0.1 }}
                    >
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-semibold text-white/80">{metric.label}</span>
                        <span className="text-neon-lime font-bold">{metric.value}%</span>
                      </div>
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${metric.value}%` }}
                          transition={{ delay: 0.6 + i * 0.1, duration: 1.2 }}
                          className="h-full bg-gradient-to-r from-neon-lime to-neon-cyan"
                        ></motion.div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </FuturisticCard>
          </motion.div>

          {/* Data Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <div className="mb-4">
              <h3 className="text-2xl font-bold uppercase tracking-wider">
                <HologramText>Estudiantes Destacados</HologramText>
              </h3>
            </div>
            <DataGrid
              headers={['Nombre', 'Grado', 'Promedio', 'Asistencia']}
              rows={[
                ['Carlos Mendez', '3°A', '18.5', '98%'],
                ['María García', '3°A', '17.8', '95%'],
                ['Juan Pérez', '3°B', '19.2', '100%'],
                ['Laura Rodríguez', '3°B', '16.9', '92%'],
              ]}
            />
          </motion.div>

          {/* Security Info */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {[
              { icon: Lock, title: 'Encriptación', desc: 'Datos protegidos con AES-256' },
              { icon: Network, title: 'Conexión', desc: 'Sincronización en tiempo real' },
              { icon: Activity, title: 'Disponibilidad', desc: '99.9% SLA garantizado' },
            ].map((item, i) => (
              <FuturisticCard key={i} variant="blue" glow hover>
                <div className="p-6 space-y-3">
                  <item.icon className="w-6 h-6 text-neon-blue" />
                  <h4 className="font-bold text-white">{item.title}</h4>
                  <p className="text-xs text-white/85">{item.desc}</p>
                </div>
              </FuturisticCard>
            ))}
          </motion.div>
        </div>

        {/* Footer Decorativo */}
        <motion.div
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="fixed bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-neon-cyan/10 via-transparent to-transparent pointer-events-none"
        ></motion.div>
      </div>
    </div>
  );
}
