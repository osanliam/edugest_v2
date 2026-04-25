import { motion } from 'motion/react';
import { useState } from 'react';
import { CheckCircle, XCircle, Clock, Calendar, BarChart3, TrendingUp, AlertCircle } from 'lucide-react';
import { User as UserType } from '../types';

interface AttendanceScreenProps {
  user: UserType;
}

interface AttendanceRecord {
  id: string;
  date: string;
  course: string;
  status: 'present' | 'absent' | 'late';
  time: string;
  instructor: string;
}

const attendanceData: AttendanceRecord[] = [
  { id: '1', date: '2024-04-15', course: 'Matemáticas', status: 'present', time: '08:05', instructor: 'Prof. García' },
  { id: '2', date: '2024-04-15', course: 'Lenguaje', status: 'present', time: '09:00', instructor: 'Prof. López' },
  { id: '3', date: '2024-04-15', course: 'Ciencias', status: 'late', time: '10:45', instructor: 'Prof. Rodríguez' },
  { id: '4', date: '2024-04-16', course: 'Historia', status: 'present', time: '08:00', instructor: 'Prof. Martínez' },
  { id: '5', date: '2024-04-16', course: 'Inglés', status: 'present', time: '09:05', instructor: 'Prof. Silva' },
  { id: '6', date: '2024-04-16', course: 'Matemáticas', status: 'absent', time: '-', instructor: 'Prof. García' },
  { id: '7', date: '2024-04-17', course: 'Física', status: 'present', time: '08:00', instructor: 'Prof. Sánchez' },
  { id: '8', date: '2024-04-17', course: 'Lenguaje', status: 'present', time: '09:00', instructor: 'Prof. López' },
  { id: '9', date: '2024-04-17', course: 'Educación Física', status: 'present', time: '10:30', instructor: 'Prof. Torres' },
  { id: '10', date: '2024-04-18', course: 'Matemáticas', status: 'present', time: '08:00', instructor: 'Prof. García' },
];

const getStatusIcon = (status: 'present' | 'absent' | 'late') => {
  switch (status) {
    case 'present':
      return <CheckCircle className="w-5 h-5 text-neon-lime" />;
    case 'absent':
      return <XCircle className="w-5 h-5 text-red-500" />;
    case 'late':
      return <Clock className="w-5 h-5 text-yellow-500" />;
  }
};

const getStatusColor = (status: 'present' | 'absent' | 'late') => {
  switch (status) {
    case 'present':
      return 'bg-neon-lime/20 text-neon-lime border-neon-lime/50';
    case 'absent':
      return 'bg-red-500/20 text-red-200 border-red-500/50';
    case 'late':
      return 'bg-yellow-500/20 text-yellow-200 border-yellow-500/50';
  }
};

const getStatusLabel = (status: 'present' | 'absent' | 'late') => {
  switch (status) {
    case 'present':
      return 'Presente';
    case 'absent':
      return 'Ausente';
    case 'late':
      return 'Retrasado';
  }
};

export default function AttendanceScreen({ user }: AttendanceScreenProps) {
  const [filterCourse, setFilterCourse] = useState<string>('all');

  const filteredAttendance = filterCourse === 'all' 
    ? attendanceData 
    : attendanceData.filter(a => a.course === filterCourse);

  const stats = {
    total: attendanceData.length,
    present: attendanceData.filter(a => a.status === 'present').length,
    absent: attendanceData.filter(a => a.status === 'absent').length,
    late: attendanceData.filter(a => a.status === 'late').length,
  };

  const attendanceRate = ((stats.present / stats.total) * 100).toFixed(1);

  const courses = [...new Set(attendanceData.map(a => a.course))];

  return (
    <div className="min-h-screen p-6 space-y-8 pb-24">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-neon-lime/20 rounded-lg neon-border-lime">
            <Calendar className="w-8 h-8 text-neon-lime" />
          </div>
          <div>
            <h1 className="text-4xl font-bold tracking-tighter uppercase">
              Mi <span className="text-neon-magenta neon-text-magenta">Asistencia</span>
            </h1>
            <p className="text-xs text-white/75 font-mono tracking-widest">CONTROL DE ASISTENCIA</p>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Porcentaje Asistencia', value: `${attendanceRate}%`, icon: TrendingUp, color: 'neon-lime' },
          { label: 'Presente', value: stats.present, icon: CheckCircle, color: 'neon-lime' },
          { label: 'Ausente', value: stats.absent, icon: XCircle, color: 'red-500' },
          { label: 'Retrasado', value: stats.late, icon: Clock, color: 'yellow-500' },
        ].map((kpi, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`glass-card p-4 neon-border-${kpi.color} hover:neon-border-magenta transition-all`}
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-white/85 text-xs uppercase">{kpi.label}</p>
              <kpi.icon className={`w-5 h-5 text-${kpi.color}`} />
            </div>
            <p className={`text-2xl font-bold text-${kpi.color}`}>{kpi.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Chart-like visualization */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card p-6 neon-border-cyan"
      >
        <h3 className="text-white font-bold uppercase tracking-wider mb-6 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-neon-cyan" />
          Resumen de Asistencia
        </h3>
        <div className="space-y-4">
          {[
            { label: 'Presente', value: stats.present, max: stats.total, color: 'from-neon-lime to-neon-cyan' },
            { label: 'Retrasado', value: stats.late, max: stats.total, color: 'from-yellow-500 to-orange-500' },
            { label: 'Ausente', value: stats.absent, max: stats.total, color: 'from-red-500 to-pink-500' },
          ].map((item) => (
            <div key={item.label}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-white text-sm uppercase tracking-wider font-semibold">{item.label}</p>
                <span className="text-neon-cyan text-sm font-bold">{item.value}/{item.max}</span>
              </div>
              <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                <div
                  className={`h-full bg-gradient-to-r ${item.color} transition-all duration-500`}
                  style={{ width: `${(item.value / item.max) * 100}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Filter and Records */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card p-6 neon-border-magenta"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-white font-bold uppercase tracking-wider flex items-center gap-2">
            <Calendar className="w-5 h-5 text-neon-magenta" />
            Historial de Asistencia
          </h3>
        </div>

        {/* Filter */}
        <div className="mb-6">
          <p className="text-white/85 text-sm uppercase tracking-wider mb-3">Filtrar por Curso</p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilterCourse('all')}
              className={`px-4 py-2 rounded-lg font-semibold text-sm uppercase tracking-wider transition-all ${
                filterCourse === 'all'
                  ? 'bg-neon-cyan text-black'
                  : 'bg-white/10 border border-white/20 text-white hover:bg-white/20'
              }`}
            >
              Todos
            </button>
            {courses.map((course) => (
              <button
                key={course}
                onClick={() => setFilterCourse(course)}
                className={`px-4 py-2 rounded-lg font-semibold text-sm uppercase tracking-wider transition-all ${
                  filterCourse === course
                    ? 'bg-neon-magenta text-black'
                    : 'bg-white/10 border border-white/20 text-white hover:bg-white/20'
                }`}
              >
                {course}
              </button>
            ))}
          </div>
        </div>

        {/* Records Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-white/10">
              <tr className="text-white/85 text-xs uppercase">
                <th className="text-left py-3 px-4">Fecha</th>
                <th className="text-left py-3 px-4">Curso</th>
                <th className="text-left py-3 px-4">Instructor</th>
                <th className="text-left py-3 px-4">Estado</th>
                <th className="text-left py-3 px-4">Hora</th>
              </tr>
            </thead>
            <tbody>
              {filteredAttendance.map((record, i) => (
                <motion.tr
                  key={record.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="border-b border-white/5 hover:bg-white/5 transition-colors"
                >
                  <td className="py-3 px-4 text-white font-medium">{record.date}</td>
                  <td className="py-3 px-4 text-white/90">{record.course}</td>
                  <td className="py-3 px-4 text-white/90">{record.instructor}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(record.status)}
                      <span className={`px-3 py-1 rounded-full border text-xs font-medium ${getStatusColor(record.status)}`}>
                        {getStatusLabel(record.status)}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-white/90">{record.time}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredAttendance.length === 0 && (
          <div className="text-center py-8 text-white/75">
            <AlertCircle className="w-8 h-8 mx-auto mb-2" />
            <p>No hay registros de asistencia</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
