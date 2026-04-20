import { motion } from 'motion/react';
import { FileText, Download, BarChart3, PieChart, Clock, CheckCircle, Filter, Zap } from 'lucide-react';
import FuturisticCard from '../components/FuturisticCard';
import HologramText from '../components/HologramText';
import DataGrid from '../components/DataGrid';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  schoolId: string;
}

interface ReportsScreenModernProps {
  user?: User;
}

export default function ReportsScreenModern({ user }: ReportsScreenModernProps) {
  const reports = [
    { id: '1', name: 'Informe de Asistencia', category: 'Académico', date: '2024-04-18', status: 'Disponible', pages: 12 },
    { id: '2', name: 'Desempeño por Área', category: 'Evaluación', date: '2024-04-17', status: 'Disponible', pages: 8 },
    { id: '3', name: 'Análisis de Comportamiento', category: 'Disciplina', date: '2024-04-16', status: 'Disponible', pages: 15 },
    { id: '4', name: 'Reporte Financiero Q2', category: 'Administración', date: '2024-04-15', status: 'Generando', pages: 0 },
    { id: '5', name: 'Evaluación de Docentes', category: 'RRHH', date: '2024-04-14', status: 'Disponible', pages: 10 },
  ];

  const reportStats = [
    { label: 'Reportes Generados', value: '127', color: 'cyan', icon: FileText },
    { label: 'Este Mes', value: '23', color: 'magenta', icon: BarChart3 },
    { label: 'Pendientes', value: '2', color: 'lime', icon: Clock },
    { label: 'Completados', value: '125', color: 'blue', icon: CheckCircle },
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
            <HologramText>Informes</HologramText>
          </h1>
          <p className="text-white/85 font-mono tracking-widest text-sm">GENERACIÓN Y ANÁLISIS DE REPORTES</p>
        </motion.div>

        {/* Report Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {reportStats.map((stat, i) => {
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

        {/* Generate New Report Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <FuturisticCard variant="lime" glow>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <Zap className="w-6 h-6 text-neon-lime" />
                <h3 className="text-white font-bold uppercase tracking-wider">Generar Nuevo Reporte</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: 'Asistencia', icon: '📊' },
                  { label: 'Desempeño', icon: '📈' },
                  { label: 'Disciplina', icon: '⚖️' },
                  { label: 'Financiero', icon: '💰' },
                ].map((type, i) => (
                  <motion.button
                    key={i}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="p-3 rounded-lg bg-white/10 hover:bg-white/20 transition-all border border-neon-lime/50 text-center"
                  >
                    <p className="text-2xl mb-1">{type.icon}</p>
                    <p className="text-xs text-white font-bold">{type.label}</p>
                  </motion.button>
                ))}
              </div>
            </div>
          </FuturisticCard>
        </motion.div>

        {/* Available Reports */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-2xl font-bold uppercase tracking-wider">
              <HologramText>Reportes Disponibles</HologramText>
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
            {reports.map((report, i) => (
              <motion.div
                key={report.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.05 }}
              >
                <FuturisticCard
                  variant={
                    report.status === 'Generando'
                      ? 'blue'
                      : report.category === 'Académico'
                        ? 'cyan'
                        : report.category === 'Evaluación'
                          ? 'magenta'
                          : 'lime'
                  }
                  glow
                  hover
                >
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                          <FileText className="w-5 h-5 text-neon-cyan" />
                        </div>
                        <div className="flex-1">
                          <p className="text-white font-bold uppercase tracking-wide text-sm">{report.name}</p>
                          <p className="text-xs text-white/85 mt-1">{report.category}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-white/90">{report.date}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span
                            className={`text-xs font-bold px-2 py-1 rounded ${
                              report.status === 'Disponible'
                                ? 'bg-neon-lime/20 text-neon-lime'
                                : 'bg-neon-blue/20 text-neon-blue animate-pulse'
                            }`}
                          >
                            {report.status}
                          </span>
                          {report.status === 'Disponible' && (
                            <motion.button
                              whileHover={{ scale: 1.15 }}
                              className="p-1 hover:bg-white/20 rounded transition-all"
                            >
                              <Download className="w-4 h-4 text-neon-lime" />
                            </motion.button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </FuturisticCard>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Report Templates */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="mb-4">
            <h3 className="text-2xl font-bold uppercase tracking-wider">
              <HologramText variant="secondary">Plantillas Disponibles</HologramText>
            </h3>
          </div>
          <DataGrid
            headers={['Plantilla', 'Descripción', 'Última Usada', 'Acción']}
            rows={[
              ['Informe Mensual', 'Resumen completo de actividades', '2024-04-18', '→ Usar'],
              ['Evaluación Docente', 'Evaluación de desempeño', '2024-04-16', '→ Usar'],
              ['Análisis Financiero', 'Desglose de presupuesto', '2024-04-14', '→ Usar'],
              ['Reporte de Seguridad', 'Auditoría del sistema', '2024-04-12', '→ Usar'],
            ]}
          />
        </motion.div>
      </div>
    </div>
  );
}
