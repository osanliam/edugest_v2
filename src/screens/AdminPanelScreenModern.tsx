import { motion } from 'motion/react';
import { Users, BarChart3, TrendingUp, AlertCircle, Lock, Zap, Activity, Database } from 'lucide-react';
import FuturisticCard from '../components/FuturisticCard';
import HologramText from '../components/HologramText';
import DataGrid from '../components/DataGrid';

export default function AdminPanelScreenModern() {
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
            <HologramText>PANEL ADMINISTRATIVO</HologramText>
          </h1>
          <p className="text-white/85 font-mono tracking-widest text-sm">GESTIÓN COMPLETA DEL SISTEMA</p>
        </motion.div>

        {/* KPI Cards */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {[
            { icon: Users, label: 'Usuarios Activos', value: '342', color: 'cyan', delta: '+12%' },
            { icon: Database, label: 'Almacenamiento', value: '2.4 GB', color: 'magenta', delta: '+5%' },
            { icon: Activity, label: 'Uptime', value: '99.9%', color: 'lime', delta: 'Excelente' },
            { icon: AlertCircle, label: 'Alertas', value: '3', color: 'blue', delta: 'Críticas' },
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
                  <p className="text-3xl font-bold text-white">{stat.value}</p>
                  <p className="text-xs text-neon-lime">{stat.delta}</p>
                </div>
              </FuturisticCard>
            </motion.div>
          ))}
        </motion.div>

        {/* Main Grids */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sistema Status */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <FuturisticCard variant="glass" glow hover>
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold uppercase tracking-wider">
                    <HologramText variant="secondary">Estado del Sistema</HologramText>
                  </h3>
                  <Zap className="w-5 h-5 text-neon-magenta animate-glow-pulse" />
                </div>

                <div className="space-y-4">
                  {[
                    { service: 'Base de Datos MySQL', status: 'online', uptime: '99.95%' },
                    { service: 'API Backend', status: 'online', uptime: '99.98%' },
                    { service: 'Frontend React', status: 'online', uptime: '100%' },
                    { service: 'Cache Redis', status: 'online', uptime: '99.87%' },
                  ].map((item, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + i * 0.1 }}
                      className="flex items-center justify-between p-3 border border-cyan-500/20 rounded-lg bg-cyan-500/5"
                    >
                      <div>
                        <p className="text-sm font-semibold text-white">{item.service}</p>
                        <p className="text-xs text-white/40">{item.uptime}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-neon-lime rounded-full animate-pulse"></div>
                        <span className="text-xs text-neon-lime font-bold uppercase">{item.status}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </FuturisticCard>
          </motion.div>

          {/* Security Audit */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <FuturisticCard variant="magenta" glow hover>
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold uppercase tracking-wider">
                    <HologramText variant="primary">Auditoría de Seguridad</HologramText>
                  </h3>
                  <Lock className="w-5 h-5 text-neon-lime animate-glow-pulse" />
                </div>

                <div className="space-y-3">
                  {[
                    { check: 'Cifrado SSL/TLS', status: 'Activo' },
                    { check: 'Autenticación 2FA', status: 'Disponible' },
                    { check: 'Validación de Permisos', status: 'OK' },
                    { check: 'Auditoría de Logs', status: 'Habilitado' },
                  ].map((audit, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 + i * 0.1 }}
                      className="flex items-center justify-between p-3 border border-magenta-500/20 rounded-lg bg-magenta-500/5"
                    >
                      <span className="text-sm text-white/80">{audit.check}</span>
                      <span className="text-xs font-bold text-neon-cyan bg-cyan-500/20 px-2 py-1 rounded">
                        {audit.status}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </FuturisticCard>
          </motion.div>
        </div>

        {/* User Management */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="mb-4">
            <h3 className="text-2xl font-bold uppercase tracking-wider">
              <HologramText>Gestión de Usuarios</HologramText>
            </h3>
          </div>
          <DataGrid
            headers={['Usuario', 'Rol', 'Estado', 'Último Acceso']}
            rows={[
              ['Dr. Fernando López', 'Director', 'Activo', 'Hace 5 min'],
              ['Mg. María García', 'Subdirector', 'Activo', 'Hace 30 min'],
              ['Lic. Juan Pérez', 'Profesor', 'Activo', 'Hace 2 horas'],
              ['Carlos Mendez', 'Estudiante', 'Activo', 'Hace 1 hora'],
              ['Pedro Mendez', 'Apoderado', 'Inactivo', 'Hace 3 días'],
            ]}
          />
        </motion.div>

        {/* System Performance */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        >
          {[
            { icon: TrendingUp, title: 'Rendimiento', metric: '95%', detail: 'Velocidad óptima' },
            { icon: BarChart3, title: 'Tráfico', metric: '1.2K req/s', detail: 'Promedio por segundo' },
            { icon: AlertCircle, title: 'Errores', metric: '0.1%', detail: 'Tasa de error muy baja' },
          ].map((perf, i) => (
            <FuturisticCard key={i} variant="blue" glow hover>
              <div className="p-6 space-y-3">
                <perf.icon className="w-6 h-6 text-neon-blue animate-pulse-glow" />
                <h4 className="font-bold text-white uppercase">{perf.title}</h4>
                <p className="text-2xl font-bold text-neon-cyan">{perf.metric}</p>
                <p className="text-xs text-white/85">{perf.detail}</p>
              </div>
            </FuturisticCard>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
