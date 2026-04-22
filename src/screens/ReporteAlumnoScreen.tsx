import { motion } from 'motion/react';
import { useState, useEffect } from 'react';
import { User, UserCheck, FileText, Calendar, Clock, TrendingUp, Award, BookOpen, AlertCircle, CheckCircle, XCircle, Search } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface ReporteAlumnoProps {
  user: User;
}

interface Alumno {
  id: string;
  apellidos_nombres?: string;
  nombre?: string;
  dni?: string;
  grado?: string;
  seccion?: string;
  sexo?: string;
  fechaNac?: string;
  direccion?: string;
  apelidosPadre?: string;
  nombreMadre?: string;
  telefono?: string;
  email?: string;
}

const LS_ALUMNOS = 'ie_alumnos';
const LS_CALIFICATIVOS = 'ie_calificativos_v2';
const LS_ASISTENCIA = 'ie_asistencia';
const LS_COLUMNAS = 'cal_columnas';

const COMPETENCIAS = [
  { id: 'comp1', label: 'C1', nombre: 'Se comunica oralmente' },
  { id: 'comp2', label: 'C2', nombre: 'Lee diversos tipos de textos' },
  { id: 'comp3', label: 'C3', nombre: 'Escribe diversos tipos de textos' },
];

function lsGet<T>(key: string, def: T): T {
  try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(def)); } catch { return def; }
}

const CAL_BG: Record<string, string> = {
  C: 'bg-red-500/25 text-red-300 border-red-500/50',
  B: 'bg-yellow-500/25 text-yellow-200 border-yellow-500/50',
  A: 'bg-green-500/25 text-green-300 border-green-500/50',
  AD: 'bg-blue-500/25 text-blue-300 border-blue-400/60',
};

const CAL_LABEL: Record<string, string> = {
  C: 'En Inicio', B: 'En Proceso', A: 'Logro Esperado', AD: 'Logro Destacado',
};

export default function ReporteAlumnoScreen({ user }: ReporteAlumnoProps) {
  const [alumnos, setAlumnos] = useState<Alumno[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [alumnoSelec, setAlumnoSelec] = useState<Alumno | null>(null);
  const [calificaciones, setCalificaciones] = useState<any[]>([]);
  const [asistencia, setAsistencia] = useState<any[]>([]);
  const [columnas, setColumnas] = useState<any[]>([]);

  useEffect(() => {
    setAlumnos(lsGet<Alumno[]>(LS_ALUMNOS, []));
    setCalificaciones(lsGet<any[]>(LS_CALIFICATIVOS, []));
    setAsistencia(lsGet<any[]>(LS_ASISTENCIA, []));
    setColumnas(lsGet<any[]>('cal_columnas', []));
  }, []);

  const buscarAlumno = () => {
    if (!busqueda.trim()) return [];
    const b = busqueda.toLowerCase();
    return alumnos.filter(a => 
      (a.apellidos_nombres || a.nombre || '').toLowerCase().includes(b) ||
      (a.dni || '').includes(b)
    ).slice(0, 5);
  };

  const resultados = buscarAlumno();

  const getCalPorAlumno = (alumnoId: string) => {
    return calificaciones.filter(c => c.alumnoId === alumnoId);
  };

  const getPromedioCompetencia = (alumnoId: string, compId: string) => {
    const compCols = columnas.filter(c => c.competenciaId === compId && c.promediar);
    if (compCols.length === 0) return null;
    const califs = getCalPorAlumno(alumnoId).filter(c => 
      compCols.some(cc => cc.id === c.columnaId)
    );
    if (califs.length === 0) return null;
    
    const VALOR: Record<string, number> = { C: 1, B: 2, A: 3, AD: 4 };
    const suma = califs.reduce((acc, c) => acc + (VALOR[c.calificativo] || 0), 0);
    const prom = Math.round(suma / califs.length);
    const labels = ['', 'C', 'B', 'A', 'AD'];
    return labels[Math.min(4, Math.max(1, prom))];
  };

  const getAsistenciaAlumno = (alumnoId: string) => {
    const regs = asistencia.filter(a => a.alumnoId === alumnoId);
    const presentes = regs.filter(r => r.estado === 'presente').length;
    const total = regs.length || 1;
    return Math.round((presentes / total) * 100);
  };

  const stats = alumnoSelec ? {
    calificaciones: getCalPorAlumno(alumnoSelec.id).length,
    asistencia: getAsistenciaAlumno(alumnoSelec.id),
    promedioC1: getPromedioCompetencia(alumnoSelec.id, 'comp1'),
    promedioC2: getPromedioCompetencia(alumnoSelec.id, 'comp2'),
    promedioC3: getPromedioCompetencia(alumnoSelec.id, 'comp3'),
  } : null;

  const tendanceData = [
    { mes: 'C1', nota: stats?.promedioC1 === 'A' ? 3 : stats?.promedioC1 === 'B' ? 2 : stats?.promedioC1 === 'C' ? 1 : 0 },
    { mes: 'C2', nota: stats?.promedioC2 === 'A' ? 3 : stats?.promedioC2 === 'B' ? 2 : stats?.promedioC2 === 'C' ? 1 : 0 },
    { mes: 'C3', nota: stats?.promedioC3 === 'A' ? 3 : stats?.promedioC3 === 'B' ? 2 : stats?.promedioC3 === 'C' ? 1 : 0 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-purple-500/20 rounded-lg border border-purple-500/30">
            <FileText className="w-8 h-8 text-purple-400" />
          </div>
          <div>
            <h1 className="text-4xl font-black tracking-tighter uppercase text-white">
              Informe de <span className="text-purple-400">Alumno</span>
            </h1>
            <p className="text-xs text-purple-400/70 font-mono tracking-widest">CONSULTA DE BITÁCORA ACADÉMICA</p>
          </div>
        </div>
      </motion.div>

      {/* Buscador */}
      {!alumnoSelec && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800/50 border border-purple-500/20 rounded-2xl p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <Search className="w-5 h-5 text-purple-400" />
            <h2 className="text-white font-bold">Buscar Alumno</h2>
          </div>
          <input
            type="text"
            placeholder="Ingrese nombre o DNI del alumno..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
          />
          
          {resultados.length > 0 && (
            <div className="mt-4 space-y-2">
              {resultados.map((alumno) => (
                <button
                  key={alumno.id}
                  onClick={() => setAlumnoSelec(alumno)}
                  className="w-full p-3 rounded-lg bg-slate-700/50 hover:bg-purple-500/20 border border-slate-600 hover:border-purple-500/30 flex items-center justify-between transition-all"
                >
                  <div className="text-left">
                    <p className="text-white font-semibold">{alumno.apellidos_nombres || alumno.nombre}</p>
                    <p className="text-slate-400 text-sm">DNI: {alumno.dni || 'Sin DNI'} · {alumno.grado}º "{alumno.seccion}"</p>
                  </div>
                  <UserCheck className="w-5 h-5 text-purple-400" />
                </button>
              ))}
            </div>
          )}

          {busqueda && resultados.length === 0 && (
            <p className="mt-4 text-slate-400 text-center">No se encontraron resultados</p>
          )}
        </motion.div>
      )}

      {/* Datos del Alumno */}
      {alumnoSelec && stats && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Info del alumno */}
          <div className="bg-slate-800/50 border border-purple-500/20 rounded-2xl p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-bold text-2xl">
                  {(alumnoSelec.sexo === 'Femenino' ? 'A' : 'M')}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">{alumnoSelec.apellidos_nombres || alumnoSelec.nombre}</h2>
                  <p className="text-purple-400">{alumnoSelec.grado}º Sección "{alumnoSelec.seccion}"</p>
                  <p className="text-slate-400 text-sm">DNI: {alumnoSelec.dni || 'Sin registrado'}</p>
                </div>
              </div>
              <button
                onClick={() => setAlumnoSelec(null)}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm"
              >
                Cambiar
              </button>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-slate-800/50 border border-purple-500/20 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Award className="w-5 h-5 text-purple-400" />
                <p className="text-slate-400 text-sm uppercase">Promedio General</p>
              </div>
              <p className="text-3xl font-bold text-white">
                {stats.promedioC1 && stats.promedioC2 && stats.promedioC3 
                  ? (['C','B','A','AD'].indexOf(stats.promedioC1) + ['C','B','A','AD'].indexOf(stats.promedioC2) + ['C','B','A','AD'].indexOf(stats.promedioC3)) / 3
                  : '—'}
              </p>
            </div>
            <div className="bg-slate-800/50 border border-green-500/20 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-green-400" />
                <p className="text-slate-400 text-sm uppercase">Asistencia</p>
              </div>
              <p className="text-3xl font-bold text-white">{stats.asistencia}%</p>
            </div>
            <div className="bg-slate-800/50 border border-cyan-500/20 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="w-5 h-5 text-cyan-400" />
                <p className="text-slate-400 text-sm uppercase">C1</p>
              </div>
              <p className={`text-3xl font-bold border-2 rounded-lg inline-block px-3 ${CAL_BG[stats.promedioC1 || 'C']}`}>
                {stats.promedioC1 || '—'}
              </p>
            </div>
            <div className="bg-slate-800/50 border border-cyan-500/20 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-cyan-400" />
                <p className="text-slate-400 text-sm uppercase">C2</p>
              </div>
              <p className={`text-3xl font-bold border-2 rounded-lg inline-block px-3 ${CAL_BG[stats.promedioC2 || 'C']}`}>
                {stats.promedioC2 || '—'}
              </p>
            </div>
          </div>

          {/* Detalle por competencias */}
          <div className="bg-slate-800/50 border border-purple-500/20 rounded-2xl p-6">
            <h3 className="text-white font-bold uppercase tracking-wider mb-6 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-purple-400" />
              Competencias
            </h3>
            <div className="space-y-4">
              {COMPETENCIAS.map(comp => {
                const prom = getPromedioCompetencia(alumnoSelec.id, comp.id);
                const cols = columnas.filter(c => c.competenciaId === comp.id);
                const califsAlumno = getCalPorAlumno(alumnoSelec.id).filter(c =>
                  cols.some(cc => cc.id === c.columnaId)
                );
                return (
                  <div key={comp.id} className="p-4 rounded-xl bg-slate-700/30 border border-slate-600">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-white font-bold">{comp.label}</p>
                        <p className="text-slate-400 text-sm">{comp.nombre}</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-2xl font-bold border-2 rounded-lg px-3 ${CAL_BG[prom || 'C']}`}>
                          {prom || '—'}
                        </p>
                        <p className="text-slate-500 text-xs">{califsAlumno.length}/{cols.length} evaluaciones</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Historial de evaluaciones */}
          <div className="bg-slate-800/50 border border-purple-500/20 rounded-2xl p-6">
            <h3 className="text-white font-bold uppercase tracking-wider mb-6 flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-400" />
              Evaluaciones Registradas
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-600 text-slate-400">
                    <th className="text-left py-2">Fecha</th>
                    <th className="text-left py-2">Evaluación</th>
                    <th className="text-center py-2">Tipo</th>
                    <th className="text-center py-2">Calificación</th>
                  </tr>
                </thead>
                <tbody>
                  {getCalPorAlumno(alumnoSelec.id).length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-500">
                        No hay evaluaciones registradas
                      </td>
                    </tr>
                  ) : (
                    getCalPorAlumno(alumnoSelec.id).slice(0, 10).map((cal, i) => {
                      const col = columnas.find(c => c.id === cal.columnaId);
                      return (
                        <tr key={i} className="border-b border-slate-700/40">
                          <td className="py-3 text-slate-400">{cal.fecha}</td>
                          <td className="py-3 text-white">{col?.nombre || '—'}</td>
                          <td className="py-3 text-center text-slate-400">{col?.tipo || '—'}</td>
                          <td className="py-3 text-center">
                            <span className={`px-2 py-1 rounded border ${CAL_BG[cal.calificativo]}`}>
                              {cal.calificativo}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Observaciones */}
          <div className="bg-slate-800/50 border border-yellow-500/20 rounded-2xl p-6">
            <h3 className="text-white font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-400" />
              Observaciones
            </h3>
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                <p className="text-yellow-300 text-sm font-medium">Comunicación familiar</p>
                <p className="text-slate-400 text-sm">Apoderado: {alumnoSelec.apelidosPadre || 'No registrado'}</p>
                <p className="text-slate-400 text-sm">Teléfono: {alumnoSelec.telefono || 'No registrado'}</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-700/30 border border-slate-600">
                <p className="text-slate-400 text-sm">Para visualizar las normas de convivencia, ingrese al módulo correspondiente en la plataforma.</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}