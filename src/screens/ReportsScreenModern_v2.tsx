import { motion } from 'motion/react';
import { useState } from 'react';
import { FileText, BarChart3, PieChart, TrendingUp, Download, Filter, Calendar } from 'lucide-react';
import HeaderElegante from '../components/HeaderElegante';
import ElegantCard from '../components/ElegantCard';

interface Report {
  id: string;
  name: string;
  type: 'academic' | 'attendance' | 'conduct' | 'progress';
  date: string;
  period: string;
  students: number;
  status: 'draft' | 'ready' | 'sent';
}

export default function ReportsScreenModernV2() {
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('q2');

  const reportTypes = [
    { id: 'all', label: 'Todos', color: 'indigo' },
    { id: 'academic', label: 'Académicos', color: 'blue' },
    { id: 'attendance', label: 'Asistencia', color: 'green' },
    { id: 'conduct', label: 'Conducta', color: 'purple' },
    { id: 'progress', label: 'Progreso', color: 'pink' }
  ];

  const reports: Report[] = [
    {
      id: '1',
      name: 'Reporte Académico - Segundo Trimestre',
      type: 'academic',
      date: '2024-04-20',
      period: 'Q2 2024',
      students: 32,
      status: 'ready'
    },
    {
      id: '2',
      name: 'Informe de Asistencia por Sección',
      type: 'attendance',
      date: '2024-04-19',
      period: 'Abril 2024',
      students: 285,
      status: 'ready'
    },
    {
      id: '3',
      name: 'Reporte de Conducta y Comportamiento',
      type: 'conduct',
      date: '2024-04-15',
      period: 'Q2 2024',
      students: 32,
      status: 'sent'
    },
    {
      id: '4',
      name: 'Análisis de Progreso Académico',
      type: 'progress',
      date: '2024-04-10',
      period: 'Cumulative',
      students: 250,
      status: 'draft'
    },
    {
      id: '5',
      name: 'Reporte de Calificaciones por Competencia',
      type: 'academic',
      date: '2024-04-08',
      period: 'Q2 2024',
      students: 32,
      status: 'ready'
    },
    {
      id: '6',
      name: 'Comparativa de Desempeño Trimestral',
      type: 'progress',
      date: '2024-04-05',
      period: 'Q1 vs Q2',
      students: 285,
      status: 'sent'
    }
  ];

  const typeConfig = {
    academic: { bg: 'bg-blue-500/20', border: 'border-blue-500/30', text: 'text-blue-300', icon: BarChart3 },
    attendance: { bg: 'bg-green-500/20', border: 'border-green-500/30', text: 'text-green-300', icon: Calendar },
    conduct: { bg: 'bg-purple-500/20', border: 'border-purple-500/30', text: 'text-purple-300', icon: TrendingUp },
    progress: { bg: 'bg-pink-500/20', border: 'border-pink-500/30', text: 'text-pink-300', icon: PieChart }
  };

  const statusConfig = {
    draft: { label: 'Borrador', color: 'slate' },
    ready: { label: 'Listo', color: 'green' },
    sent: { label: 'Enviado', color: 'blue' }
  };

  const filteredReports = reports.filter(r =>
    selectedType === 'all' ? true : r.type === selectedType
  );

  // Estadísticas
  const stats = {
    total: reports.length,
    ready: reports.filter(r => r.status === 'ready').length,
    sent: reports.filter(r => r.status === 'sent').length,
    draft: reports.filter(r => r.status === 'draft').length
  };

  return (
    <div className="min-h-screen bg-slate-900/50 overflow-hidden">
      {/* Background decorativo */}
      <div className="fixed inset-0 -z-50">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/5 via-transparent to-purple-600/5" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <HeaderElegante
          icon={FileText}
          title="EDUGEST INFORMES Y REPORTES"
          subtitle="Generación y descarga de reportes académicos, asistencia y conducta"
        />

        {/* Stats Overview */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        >
          {[
            { label: 'Total Reportes', value: stats.total, color: 'indigo' },
            { label: 'Listos para Descargar', value: stats.ready, color: 'green' },
            { label: 'Enviados', value: stats.sent, color: 'blue' },
            { label: 'En Borrador', value: stats.draft, color: 'purple' }
          ].map((stat, i) => (
            <ElegantCard key={i} index={i} variant="minimal">
              <div>
                <p className="text-sm font-medium text-slate-400">{stat.label}</p>
                <p className={`text-2xl font-bold mt-2 text-${stat.color}-300`}>{stat.value}</p>
              </div>
            </ElegantCard>
          ))}
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 p-6 rounded-xl glass-card"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-slate-300 font-semibold mb-3">
              <Filter className="w-5 h-5" />
              Filtrar Reportes
            </div>

            <div>
              <p className="text-sm text-slate-400 mb-3">Tipo de Reporte:</p>
              <div className="flex flex-wrap gap-2">
                {reportTypes.map(type => (
                  <button
                    key={type.id}
                    onClick={() => setSelectedType(type.id)}
                    className={`px-4 py-2 rounded-lg transition-all ${
                      selectedType === type.id
                        ? `bg-${type.color}-600 text-white`
                        : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50'
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm text-slate-400 mb-3">Período:</p>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="px-4 py-2 bg-slate-700/50 text-slate-100 rounded-lg border border-slate-600/30 focus:outline-none focus:border-indigo-500/50"
              >
                <option value="q1">Q1 2024</option>
                <option value="q2">Q2 2024</option>
                <option value="q3">Q3 2024</option>
                <option value="q4">Q4 2024</option>
                <option value="annual">Anual</option>
              </select>
            </div>
          </div>
        </motion.div>

        {/* Reports List */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          {filteredReports.length > 0 ? (
            filteredReports.map((report, i) => {
              const typeConfig_ = typeConfig[report.type];
              const statusConfig_ = statusConfig[report.status];
              const TypeIcon = typeConfig_.icon;

              return (
                <ElegantCard key={report.id} index={i} className="hover:ring-indigo-500/50">
                  <div className="flex items-start justify-between gap-4">
                    {/* Left side - Icon and info */}
                    <div className="flex items-start gap-4 flex-1">
                      <div className={`p-3 rounded-lg ${typeConfig_.bg} ${typeConfig_.text}`}>
                        <TypeIcon className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-slate-100">{report.name}</h4>
                        <div className="flex flex-wrap gap-3 mt-2 text-sm text-slate-400">
                          <span>{report.date}</span>
                          <span>•</span>
                          <span>{report.period}</span>
                          <span>•</span>
                          <span>{report.students} registros</span>
                        </div>
                      </div>
                    </div>

                    {/* Right side - Status and actions */}
                    <div className="flex flex-col items-end gap-3">
                      <span className={`text-xs font-semibold px-3 py-1 rounded-full bg-${statusConfig_.color}-500/20 text-${statusConfig_.color}-300 border border-${statusConfig_.color}-500/30`}>
                        {statusConfig_.label}
                      </span>
                      {report.status === 'ready' || report.status === 'sent' ? (
                        <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors">
                          <Download className="w-4 h-4" />
                          PDF
                        </button>
                      ) : (
                        <button className="px-4 py-2 bg-slate-700/50 text-slate-300 rounded-lg text-sm font-medium cursor-not-allowed opacity-50">
                          Generando...
                        </button>
                      )}
                    </div>
                  </div>
                </ElegantCard>
              );
            })
          ) : (
            <div className="text-center py-12 text-slate-400">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No hay reportes disponibles con los filtros seleccionados</p>
            </div>
          )}
        </motion.div>

        {/* Generador de reportes rápidos */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8 p-6 rounded-xl glass-card border border-indigo-500/20"
        >
          <h3 className="text-lg font-bold text-slate-100 mb-4">Generar Reporte Personalizado</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <select className="px-4 py-2 bg-slate-700/50 text-slate-100 rounded-lg border border-slate-600/30 focus:outline-none focus:border-indigo-500/50">
              <option>Seleccionar Tipo</option>
              <option>Académico</option>
              <option>Asistencia</option>
              <option>Conducta</option>
              <option>Progreso</option>
            </select>
            <select className="px-4 py-2 bg-slate-700/50 text-slate-100 rounded-lg border border-slate-600/30 focus:outline-none focus:border-indigo-500/50">
              <option>Todas las Secciones</option>
              <option>Sección A</option>
              <option>Sección B</option>
              <option>Sección C</option>
            </select>
            <button className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg font-semibold transition-colors">
              Generar Ahora
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
