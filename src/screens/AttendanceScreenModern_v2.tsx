import { motion } from 'motion/react';
import { useState } from 'react';
import { Users, CheckCircle2, XCircle, Clock, FileText, Filter } from 'lucide-react';
import HeaderElegante from '../components/HeaderElegante';
import ElegantCard from '../components/ElegantCard';

interface AttendanceRecord {
  id: string;
  studentName: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  permission?: {
    type: string;
    reason: string;
    requestedBy: string;
    approvedBy?: string;
    status: 'pending' | 'approved' | 'rejected';
  };
}

export default function AttendanceScreenModernV2() {
  const [selectedDate, setSelectedDate] = useState('2024-04-20');
  const [selectedSection, setSelectedSection] = useState('3ro-A');
  const [showPermissions, setShowPermissions] = useState(false);

  const sections = ['3ro A', '3ro B', '2do A', '2do B', '1ro A', '1ro B', '4to A', '4to B', '5to A', '5to B'];

  const attendanceData: AttendanceRecord[] = [
    {
      id: '1',
      studentName: 'Alejandra Mendoza García',
      date: '2024-04-20',
      status: 'present'
    },
    {
      id: '2',
      studentName: 'Andrés López Pérez',
      date: '2024-04-20',
      status: 'present'
    },
    {
      id: '3',
      studentName: 'Beatriz Fernández Rivera',
      date: '2024-04-20',
      status: 'late',
      permission: {
        type: 'Atraso',
        reason: 'Emergencia médica familiar',
        requestedBy: 'María García',
        approvedBy: 'Prof. Juan Pérez',
        status: 'approved'
      }
    },
    {
      id: '4',
      studentName: 'Carlos Rodríguez Sánchez',
      date: '2024-04-20',
      status: 'absent',
      permission: {
        type: 'Justificado',
        reason: 'Viaje con la familia',
        requestedBy: 'Pedro Rodríguez',
        approvedBy: 'Subdirección',
        status: 'approved'
      }
    },
    {
      id: '5',
      studentName: 'Diana Castro Morales',
      date: '2024-04-20',
      status: 'present'
    },
    {
      id: '6',
      studentName: 'Eduardo Vargas López',
      date: '2024-04-20',
      status: 'absent',
      permission: {
        type: 'En Trámite',
        reason: 'Permiso no especificado',
        requestedBy: 'Hugo Vargas',
        status: 'pending'
      }
    },
    {
      id: '7',
      studentName: 'Fernanda Gómez Torres',
      date: '2024-04-20',
      status: 'present'
    },
    {
      id: '8',
      studentName: 'Gabriel Martínez Silva',
      date: '2024-04-20',
      status: 'late'
    },
    {
      id: '9',
      studentName: 'Hilda Ramos Núñez',
      date: '2024-04-20',
      status: 'present'
    },
    {
      id: '10',
      studentName: 'Ignacio Flores Duarte',
      date: '2024-04-20',
      status: 'absent'
    }
  ];

  const filteredData = attendanceData.filter(record => record.date === selectedDate);

  // Estadísticas
  const stats = {
    total: filteredData.length,
    present: filteredData.filter(r => r.status === 'present').length,
    absent: filteredData.filter(r => r.status === 'absent').length,
    late: filteredData.filter(r => r.status === 'late').length,
    excused: filteredData.filter(r => r.status === 'excused' || r.permission?.status === 'approved').length
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'present':
        return { icon: CheckCircle2, bg: 'bg-green-500/20', text: 'text-green-300', label: 'Presente', border: 'border-green-500/30' };
      case 'absent':
        return { icon: XCircle, bg: 'bg-red-500/20', text: 'text-red-300', label: 'Ausente', border: 'border-red-500/30' };
      case 'late':
        return { icon: Clock, bg: 'bg-yellow-500/20', text: 'text-yellow-300', label: 'Atraso', border: 'border-yellow-500/30' };
      case 'excused':
        return { icon: FileText, bg: 'bg-blue-500/20', text: 'text-blue-300', label: 'Justificado', border: 'border-blue-500/30' };
      default:
        return { icon: CheckCircle2, bg: 'bg-slate-500/20', text: 'text-slate-300', label: 'N/A', border: 'border-slate-500/30' };
    }
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
          icon={Users}
          title="EDUGEST CONTROL DE ASISTENCIA"
          subtitle="Registro y justificación de asistencia estudiantil"
        />

        {/* Stats Overview */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8"
        >
          {[
            { label: 'Total', value: stats.total, color: 'indigo' },
            { label: 'Presentes', value: stats.present, color: 'green' },
            { label: 'Ausentes', value: stats.absent, color: 'red' },
            { label: 'Atrasos', value: stats.late, color: 'yellow' },
            { label: 'Justificados', value: stats.excused, color: 'blue' }
          ].map((stat, i) => (
            <ElegantCard key={i} index={i} variant="minimal">
              <div>
                <p className="text-xs font-medium text-slate-400 uppercase">{stat.label}</p>
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
              Filtros
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-slate-400 mb-2 block">Fecha</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-700/50 text-slate-100 rounded-lg border border-slate-600/30 focus:outline-none focus:border-indigo-500/50"
                />
              </div>
              <div>
                <label className="text-sm text-slate-400 mb-2 block">Sección</label>
                <select
                  value={selectedSection}
                  onChange={(e) => setSelectedSection(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-700/50 text-slate-100 rounded-lg border border-slate-600/30 focus:outline-none focus:border-indigo-500/50"
                >
                  {sections.map(section => (
                    <option key={section} value={section.replace(' ', '-').toLowerCase()}>
                      {section}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Show permissions toggle */}
            <div className="flex items-center gap-3 pt-4 border-t border-slate-700/30">
              <input
                type="checkbox"
                id="showPermissions"
                checked={showPermissions}
                onChange={(e) => setShowPermissions(e.target.checked)}
                className="w-5 h-5"
              />
              <label htmlFor="showPermissions" className="text-slate-300 cursor-pointer">
                Mostrar solo registros con permisos/justificaciones
              </label>
            </div>
          </div>
        </motion.div>

        {/* Attendance List */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="space-y-3"
        >
          {filteredData
            .filter(r => !showPermissions || r.permission)
            .map((record, i) => {
              const config = getStatusConfig(record.status);
              const StatusIcon = config.icon;

              return (
                <ElegantCard key={record.id} index={i} variant="minimal">
                  <div className="space-y-3">
                    {/* Student info and status */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h4 className="font-semibold text-slate-100">{record.studentName}</h4>
                        <p className="text-sm text-slate-400 mt-1">{record.date}</p>
                      </div>
                      <span
                        className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border ${config.bg} ${config.text} ${config.border}`}
                      >
                        <StatusIcon className="w-4 h-4" />
                        {config.label}
                      </span>
                    </div>

                    {/* Permission section */}
                    {record.permission && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="pt-3 border-t border-slate-700/30 space-y-2"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                          <div>
                            <p className="text-slate-400">Tipo de Permiso</p>
                            <p className="text-slate-100 font-semibold">{record.permission.type}</p>
                          </div>
                          <div>
                            <p className="text-slate-400">Razón</p>
                            <p className="text-slate-100 font-semibold">{record.permission.reason}</p>
                          </div>
                          <div>
                            <p className="text-slate-400">Solicitado por</p>
                            <p className="text-slate-100 font-semibold">{record.permission.requestedBy}</p>
                          </div>
                          <div>
                            <p className="text-slate-400">Estado</p>
                            <span
                              className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                                record.permission.status === 'approved'
                                  ? 'bg-green-500/20 text-green-300'
                                  : record.permission.status === 'pending'
                                  ? 'bg-yellow-500/20 text-yellow-300'
                                  : 'bg-red-500/20 text-red-300'
                              }`}
                            >
                              {record.permission.status === 'approved'
                                ? 'Aprobado'
                                : record.permission.status === 'pending'
                                ? 'Pendiente'
                                : 'Rechazado'}
                            </span>
                          </div>
                        </div>
                        {record.permission.approvedBy && (
                          <p className="text-xs text-slate-500">
                            Aprobado por: <span className="text-slate-300">{record.permission.approvedBy}</span>
                          </p>
                        )}
                      </motion.div>
                    )}
                  </div>
                </ElegantCard>
              );
            })}
        </motion.div>

        {/* Justificación rápida */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8 p-6 rounded-xl glass-card-elevated border border-indigo-500/20"
        >
          <h3 className="text-lg font-bold text-slate-100 mb-4">Justificar Inasistencia</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <select className="px-4 py-2 bg-slate-700/50 text-slate-100 rounded-lg border border-slate-600/30 focus:outline-none focus:border-indigo-500/50">
                <option>Seleccionar estudiante</option>
              </select>
              <select className="px-4 py-2 bg-slate-700/50 text-slate-100 rounded-lg border border-slate-600/30 focus:outline-none focus:border-indigo-500/50">
                <option>Tipo de permiso</option>
                <option>Justificado</option>
                <option>Atraso</option>
                <option>Excusa</option>
              </select>
            </div>
            <textarea
              placeholder="Razón de la inasistencia/atraso"
              className="w-full px-4 py-2 bg-slate-700/50 text-slate-100 rounded-lg border border-slate-600/30 focus:outline-none focus:border-indigo-500/50 resize-none"
              rows={3}
            />
            <div className="flex gap-3 justify-end">
              <button className="px-6 py-2 text-slate-400 hover:text-slate-300 transition-colors">
                Cancelar
              </button>
              <button className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg font-semibold transition-colors">
                Justificar
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
