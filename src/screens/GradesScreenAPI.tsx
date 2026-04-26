import { useState, useEffect } from 'react';
import { BarChart3, Loader } from 'lucide-react';

export default function GradesScreenAPI() {
  const [grades, setGrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    cargarCalificaciones();
  }, []);

  const cargarCalificaciones = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const token = localStorage.getItem('token');

      if (!token || !user.id) {
        setError('No autenticado');
        setLoading(false);
        return;
      }

      const res = await fetch(`/api/grades/${user.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        setGrades(data);
      } else {
        setError('Error al cargar calificaciones');
      }
    } catch (err) {
      setError('Backend no disponible - usando localStorage');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="flex justify-center p-8"><Loader className="animate-spin" /></div>;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-2 mb-6">
        <BarChart3 className="w-6 h-6 text-cyan-400" />
        <h1 className="text-2xl font-bold text-white">Mis Calificaciones</h1>
      </div>

      {error && <div className="bg-red-500/20 border border-red-500 rounded-lg p-4 text-red-200">{error}</div>}

      {grades.length === 0 ? (
        <div className="bg-slate-800/50 rounded-lg p-8 text-center text-slate-400">
          No hay calificaciones registradas
        </div>
      ) : (
        grades.map(grade => (
          <div key={grade.id} className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg p-6 border border-cyan-500/20">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-bold text-white">{grade.subject}</h3>
                <p className="text-sm text-slate-400">{grade.period}</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-cyan-400">{grade.average}</p>
                <p className="text-xs text-slate-400">Promedio</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {Array.isArray(grade.competencies)
                ? grade.competencies.map((comp: any, i: number) => (
                    <div key={i} className="bg-slate-700/50 rounded p-3">
                      <p className="text-xs font-semibold text-cyan-300 mb-1">{comp.nombre}</p>
                      <p className="text-lg font-bold text-white">{comp.calificativo}</p>
                      <p className="text-xs text-slate-400">{comp.porcentaje}%</p>
                    </div>
                  ))
                : grade.competencies && typeof grade.competencies === 'object'
                ? Object.values(grade.competencies).filter(comp => comp !== null && comp !== undefined).map((comp: any, i: number) => (
                    <div key={i} className="bg-slate-700/50 rounded p-3">
                      <p className="text-xs font-semibold text-cyan-300 mb-1">{(comp as any).nombre}</p>
                      <p className="text-lg font-bold text-white">{(comp as any).calificativo}</p>
                      <p className="text-xs text-slate-400">{(comp as any).porcentaje}%</p>
                    </div>
                  ))
                : (
                    <div className="col-span-3 bg-slate-700/30 rounded p-3 text-center text-slate-400">
                      Sin competencias registradas
                    </div>
                  )
              }
            </div>
          </div>
        ))
      )}
    </div>
  );
}
