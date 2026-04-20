import { useState, useEffect } from 'react';
import { Download, Filter, Search, BarChart3, Loader } from 'lucide-react';

interface Grade {
  id: string;
  student_id: string;
  period: string;
  subject: string;
  average: number;
  competencies?: any;
}

interface Student {
  id: string;
  name: string;
  code: string;
}

export default function CalificacionesProModerno() {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filteredGrades, setFilteredGrades] = useState<Grade[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(50);
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [periods, setPeriods] = useState<string[]>([]);

  useEffect(() => {
    cargarDatos();
  }, []);

  useEffect(() => {
    filtrarGrades();
  }, [search, selectedPeriod, grades, page]);

  const cargarDatos = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      // Cargar estudiantes
      const resStudents = await fetch(`/api/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (resStudents.ok) {
        const users = await resStudents.json();
        const estudiantes = users.filter((u: any) => u.role === 'student');
        setStudents(estudiantes);
      }

      // Cargar calificaciones
      const resGrades = await fetch(`/api/grades/all`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (resGrades.ok) {
        const data = await resGrades.json();
        setGrades(data);
        const uniquePeriods = [...new Set(data.map((g: Grade) => g.period))];
        setPeriods(uniquePeriods as string[]);
      }
    } catch (err) {
      console.error('Error cargando datos:', err);
    } finally {
      setLoading(false);
    }
  };

  const filtrarGrades = () => {
    let filtered = grades;

    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(g => {
        const student = students.find(s => s.id === g.student_id);
        return student?.name.toLowerCase().includes(searchLower) || 
               student?.code.toLowerCase().includes(searchLower);
      });
    }

    if (selectedPeriod) {
      filtered = filtered.filter(g => g.period === selectedPeriod);
    }

    const start = (page - 1) * pageSize;
    setFilteredGrades(filtered.slice(start, start + pageSize));
  };

  const getNombreEstudiante = (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    return student?.name || 'Desconocido';
  };

  const exportCSV = () => {
    const headers = ['Estudiante', 'Código', 'Período', 'Asignatura', 'Promedio'];
    const rows = filteredGrades.map(g => [
      getNombreEstudiante(g.student_id),
      students.find(s => s.id === g.student_id)?.code || '',
      g.period,
      g.subject,
      g.average
    ]);

    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'calificaciones.csv';
    a.click();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin mx-auto mb-4 text-cyan-400" />
          <p className="text-slate-400">Cargando calificaciones...</p>
        </div>
      </div>
    );
  }

  const totalPages = Math.ceil(
    grades.filter(g => {
      let match = true;
      if (search) {
        const searchLower = search.toLowerCase();
        const student = students.find(s => s.id === g.student_id);
        match = student?.name.toLowerCase().includes(searchLower) || 
                student?.code.toLowerCase().includes(searchLower);
      }
      if (selectedPeriod) match = match && g.period === selectedPeriod;
      return match;
    }).length / pageSize
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <BarChart3 className="w-8 h-8 text-cyan-400" />
            <h1 className="text-4xl font-bold text-white">Calificaciones</h1>
          </div>
          <p className="text-slate-400">{grades.length} registros totales</p>
        </div>

        {/* Controles */}
        <div className="bg-slate-800/50 border border-cyan-500/20 rounded-2xl p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {/* Búsqueda */}
            <div className="relative">
              <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-500" />
              <input
                type="text"
                placeholder="Buscar por nombre o código..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-12 pr-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
              />
            </div>

            {/* Filtro período */}
            <select
              value={selectedPeriod}
              onChange={(e) => {
                setSelectedPeriod(e.target.value);
                setPage(1);
              }}
              className="px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-cyan-400"
            >
              <option value="">Todos los períodos</option>
              {periods.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>

            {/* Export */}
            <button
              onClick={exportCSV}
              className="flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white rounded-lg font-semibold transition-all"
            >
              <Download className="w-5 h-5" />
              Descargar CSV
            </button>
          </div>
        </div>

        {/* Tabla */}
        <div className="bg-slate-800/50 border border-cyan-500/20 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-700/50 border-b border-cyan-500/20">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-cyan-300">Estudiante</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-cyan-300">Código</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-cyan-300">Período</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-cyan-300">Asignatura</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-cyan-300">Promedio</th>
                </tr>
              </thead>
              <tbody>
                {filteredGrades.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                      No hay calificaciones para mostrar
                    </td>
                  </tr>
                ) : (
                  filteredGrades.map(grade => (
                    <tr key={grade.id} className="border-b border-slate-700 hover:bg-slate-700/30 transition-colors">
                      <td className="px-6 py-4 text-white text-sm">{getNombreEstudiante(grade.student_id)}</td>
                      <td className="px-6 py-4 text-slate-300 text-sm">{students.find(s => s.id === grade.student_id)?.code}</td>
                      <td className="px-6 py-4 text-slate-300 text-sm">{grade.period}</td>
                      <td className="px-6 py-4 text-slate-300 text-sm">{grade.subject}</td>
                      <td className="px-6 py-4 text-right">
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          grade.average >= 18 ? 'bg-green-500/20 text-green-300' :
                          grade.average >= 14 ? 'bg-cyan-500/20 text-cyan-300' :
                          'bg-orange-500/20 text-orange-300'
                        }`}>
                          {grade.average.toFixed(1)}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          <div className="flex items-center justify-between px-6 py-4 bg-slate-700/30 border-t border-slate-700">
            <p className="text-slate-400 text-sm">
              Página {page} de {Math.max(1, totalPages)} | {filteredGrades.length} registros
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white rounded-lg transition-colors"
              >
                ← Anterior
              </button>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page >= totalPages}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white rounded-lg transition-colors"
              >
                Siguiente →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
