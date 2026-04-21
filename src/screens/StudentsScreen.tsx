import { motion } from 'motion/react';
import { Users2, Search, Award, CheckCircle, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { User } from '../types';

interface StudentsScreenProps {
  user: User;
}

interface Student {
  id: string;
  name: string;
  grade: string;
  email: string;
  average: number;
  attendance: number;
  status: 'active' | 'inactive';
}

const students: Student[] = [
  { id: '1', name: 'María García', grade: '3°A', email: 'maria@escuela.edu', average: 8.5, attendance: 95, status: 'active' },
  { id: '2', name: 'Juan López', grade: '3°A', email: 'juan@manuelfidencio.edu.pe', average: 7.8, attendance: 90, status: 'active' },
  { id: '3', name: 'Carlos Rodríguez', grade: '3°B', email: 'carlos@escuela.edu', average: 8.2, attendance: 92, status: 'active' },
  { id: '4', name: 'Ana Martínez', grade: '3°B', email: 'ana@escuela.edu', average: 9.0, attendance: 98, status: 'active' },
  { id: '5', name: 'Pedro Silva', grade: '3°C', email: 'pedro@escuela.edu', average: 7.1, attendance: 85, status: 'active' },
];

export default function StudentsScreen({ user }: StudentsScreenProps) {
  const [searchText, setSearchText] = useState('');

  const filteredStudents = students.filter(s =>
    s.name.toLowerCase().includes(searchText.toLowerCase()) ||
    s.grade.toLowerCase().includes(searchText.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    return status === 'active' ? 'bg-neon-lime/20 text-neon-lime' : 'bg-red-500/20 text-red-200';
  };

  const getAverageColor = (avg: number) => {
    if (avg >= 8.5) return 'text-neon-lime';
    if (avg >= 7.5) return 'text-neon-cyan';
    if (avg >= 6.5) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className="min-h-screen p-6 space-y-8 pb-24">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-neon-magenta/20 rounded-lg neon-border-magenta">
            <Users2 className="w-8 h-8 text-neon-magenta" />
          </div>
          <div>
            <h1 className="text-4xl font-bold tracking-tighter uppercase">
              <span className="text-neon-magenta neon-text-magenta">Estudiantes</span>
            </h1>
            <p className="text-xs text-white/75 font-mono tracking-widest">GESTIÓN DE ALUMNOS</p>
          </div>
        </div>
      </motion.div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card p-4 neon-border-cyan"
      >
        <div className="relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-white/40" />
          <input
            type="text"
            placeholder="Buscar por nombre o grado..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-white/40"
          />
        </div>
      </motion.div>

      {/* Students Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card p-6 neon-border-lime"
      >
        <h3 className="text-white font-bold uppercase tracking-wider mb-4">Estudiantes Matriculados</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-white/10">
              <tr className="text-white/85 text-xs uppercase">
                <th className="text-left py-3 px-4">Nombre</th>
                <th className="text-left py-3 px-4">Grado</th>
                <th className="text-left py-3 px-4">Promedio</th>
                <th className="text-left py-3 px-4">Asistencia</th>
                <th className="text-left py-3 px-4">Estado</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student, i) => (
                <motion.tr
                  key={student.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="border-b border-white/5 hover:bg-white/5 transition-colors"
                >
                  <td className="py-3 px-4 text-white font-medium">{student.name}</td>
                  <td className="py-3 px-4 text-white/90">{student.grade}</td>
                  <td className={`py-3 px-4 font-bold ${getAverageColor(student.average)}`}>
                    {student.average.toFixed(1)}
                  </td>
                  <td className="py-3 px-4 text-white/90">{student.attendance}%</td>
                  <td className="py-3 px-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(student.status)}`}>
                      {student.status === 'active' ? '✓ Activo' : '✗ Inactivo'}
                    </span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredStudents.length === 0 && (
          <div className="text-center py-8 text-white/75">
            <AlertCircle className="w-8 h-8 mx-auto mb-2" />
            <p>No hay estudiantes que coincidan con la búsqueda</p>
          </div>
        )}
      </motion.div>

      {/* Summary Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        <div className="glass-card p-4 neon-border-cyan">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/85 text-xs uppercase">Total Estudiantes</p>
              <p className="text-2xl font-bold text-white mt-1">{students.length}</p>
            </div>
            <Users2 className="w-6 h-6 text-neon-cyan" />
          </div>
        </div>
        <div className="glass-card p-4 neon-border-magenta">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/85 text-xs uppercase">Promedio Gral.</p>
              <p className="text-2xl font-bold text-white mt-1">
                {(students.reduce((sum, s) => sum + s.average, 0) / students.length).toFixed(1)}
              </p>
            </div>
            <Award className="w-6 h-6 text-neon-magenta" />
          </div>
        </div>
        <div className="glass-card p-4 neon-border-lime">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/85 text-xs uppercase">Activos</p>
              <p className="text-2xl font-bold text-white mt-1">{students.filter(s => s.status === 'active').length}</p>
            </div>
            <CheckCircle className="w-6 h-6 text-neon-lime" />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
