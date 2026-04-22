import { motion } from 'motion/react';
import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, TrendingUp, Calendar, AlertCircle, Download, Filter, ChevronDown, Save } from 'lucide-react';
import FuturisticCard from '../components/FuturisticCard';
import HologramText from '../components/HologramText';
import DataGrid from '../components/DataGrid';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { syncToTurso } from '../services/dataService';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  schoolId: string;
}

interface Alumno {
  id: string;
  apellidos_nombres?: string;
  nombre?: string;
  grado?: string;
  seccion?: string;
}

interface RegistroAsistencia {
  id: string;
  alumnoId: string;
  fecha: string;
  estado: 'presente' | 'ausente' | 'tardanza';
  hora?: string;
}

const SECCIONES = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
const GRADOS = ['1', '2', '3', '4', '5'];
const LS_ASISTENCIA = 'ie_asistencia';

function lsGet<T>(key: string, def: T): T {
  try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(def)); } catch { return def; }
}
function lsSet(key: string, val: any) { localStorage.setItem(key, JSON.stringify(val)); }

interface AttendanceScreenModernProps {
  user?: User;
}

export default function AttendanceScreenModern({ user }: AttendanceScreenModernProps) {
  const [grado, setGrado] = useState<string>('1');
  const [seccion, setSeccion] = useState<string>('A');
  const [alumnos, setAlumnos] = useState<Alumno[]>([]);
  const [asistencia, setAsistencia] = useState<RegistroAsistencia[]>([]);
  const [fechaActual, setFechaActual] = useState<string>(new Date().toISOString().split('T')[0]);
  const [showFilters, setShowFilters] = useState(true);

  useEffect(() => {
    const storedAlumnos = lsGet<Alumno[]>('ie_alumnos', []);
    setAlumnos(storedAlumnos);
    const storedAsistencia = lsGet<RegistroAsistencia[]>(LS_ASISTENCIA, []);
    setAsistencia(storedAsistencia);
  }, []);

  const filteredAlumnos = alumnos
    .filter(a => a.grado === grado && a.seccion === seccion)
    .sort((a, b) => {
      const nameA = (a.apellidos_nombres || a.nombre || '').toLowerCase();
      const nameB = (b.apellidos_nombres || b.nombre || '').toLowerCase();
      return nameA.localeCompare(nameB);
    });

  const getEstadoAsistencia = (alumnoId: string): 'presente' | 'ausente' | 'tardanza' | null => {
    const reg = asistencia.find(r => r.alumnoId === alumnoId && r.fecha === fechaActual);
    return reg?.estado || null;
  };

const marcarAsistencia = (alumnoId: string, estado: 'presente' | 'ausente' | 'tardanza') => {
    const newAsistencia = asistencia.filter(r => !(r.alumnoId === alumnoId && r.fecha === fechaActual));
    const nuevoRegistro: RegistroAsistencia = {
      id: `as-${Date.now()}-${alumnoId}`,
      alumnoId,
      fecha: fechaActual,
      estado,
      hora: estado !== 'ausente' ? new Date().toTimeString().slice(0, 5) : undefined
    };
    const updated = [...newAsistencia, nuevoRegistro];
    setAsistencia(updated);
    lsSet(LS_ASISTENCIA, updated);
    syncToTurso('asistencia', updated);
  };

  const stats = (() => {
    const hoy = asistencia.filter(r => r.fecha === fechaActual);
    const presentes = hoy.filter(r => r.estado === 'presente').length;
    const ausentes = hoy.filter(r => r.estado === 'ausente').length;
    const tardanzas = hoy.filter(r => r.estado === 'tardanza').length;
    const total = filteredAlumnos.length || 1;
    const tasa = Math.round((presentes / total) * 100);
    return [
      { label: 'Presentes Hoy', value: String(presentes), color: 'lime', icon: CheckCircle },
      { label: 'Ausentes', value: String(ausentes), color: 'blue', icon: XCircle },
      { label: 'Tardanzas', value: String(tardanzas), color: 'magenta', icon: Clock },
      { label: 'Tasa Asistencia', value: `${tasa}%`, color: 'cyan', icon: TrendingUp },
    ];
  })();

  const attendanceTrend = [
    { date: 'Lunes', percentage: 96 },
    { date: 'Martes', percentage: 94 },
    { date: 'Miércoles', percentage: 98 },
    { date: 'Jueves', percentage: 95 },
    { date: 'Viernes', percentage: 91 },
  ];

  const recentRecords = filteredAlumnos.slice(0, 8).map((alumno, i) => {
    const estado = getEstadoAsistencia(alumno.id);
    return {
      id: String(i + 1),
      student: alumno.apellidos_nombres || alumno.nombre || 'Sin nombre',
      date: fechaActual,
      status: estado === 'presente' ? 'Presente' : estado === 'ausente' ? 'Ausente' : estado === 'tardanza' ? 'Tardanza' : 'Sin registrar',
      time: '-'
    };
  });

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
            Control de <HologramText>Asistencia</HologramText>
          </h1>
          <p className="text-white/85 font-mono tracking-widest text-sm">REGISTRO Y ANÁLISIS DE PRESENCIA</p>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <FuturisticCard variant="cyan" glow>
            <div className="p-4 flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-neon-cyan" />
                <label className="text-white/85 text-sm font-bold uppercase">Fecha:</label>
                <input
                  type="date"
                  value={fechaActual}
                  onChange={(e) => setFechaActual(e.target.value)}
                  className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-neon-cyan"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-white/85 text-sm font-bold uppercase">Grado:</label>
                <select
                  value={grado}
                  onChange={(e) => setGrado(e.target.value)}
                  className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-neon-cyan"
                >
                  {GRADOS.map(g => (
                    <option key={g} value={g} className="bg-slate-800">{g}º</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-white/85 text-sm font-bold uppercase">Sección:</label>
                <select
                  value={seccion}
                  onChange={(e) => setSeccion(e.target.value)}
                  className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-neon-cyan"
                >
                  {SECCIONES.map(s => (
                    <option key={s} value={s} className="bg-slate-800">Sección {s}</option>
                  ))}
                </select>
              </div>
              <div className="ml-auto text-white/70 text-sm">
                {filteredAlumnos.length} estudiantes
              </div>
            </div>
          </FuturisticCard>
        </motion.div>

        {/* Attendance List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
        >
          <FuturisticCard variant="lime" glow>
            <div className="p-4">
              <h3 className="text-white font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-neon-lime" />
                Registrar Asistencia - {grado}º Sección {seccion}
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-white/70 text-sm uppercase border-b border-white/20">
                      <th className="px-3 py-2 text-left w-12">#</th>
                      <th className="px-3 py-2 text-left">Estudiante</th>
                      <th className="px-3 py-2 text-center">Estado</th>
                      <th className="px-3 py-2 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAlumnos.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-3 py-8 text-center text-white/50">
                          No hay estudiantes registrados para {grado}º sección {seccion}
                        </td>
                      </tr>
                    ) : (
                      filteredAlumnos.map((alumno, idx) => {
                        const estado = getEstadoAsistencia(alumno.id);
                        return (
                          <tr key={alumno.id} className="border-b border-white/10 hover:bg-white/5">
                            <td className="px-3 py-3 text-white/70">{idx + 1}</td>
                            <td className="px-3 py-3 text-white font-medium">
                              {alumno.apellidos_nombres || alumno.nombre || 'Sin nombre'}
                            </td>
                            <td className="px-3 py-3 text-center">
                              {estado === 'presente' && (
                                <span className="px-2 py-1 rounded bg-neon-lime/20 text-neon-lime text-xs font-bold">Presente</span>
                              )}
                              {estado === 'ausente' && (
                                <span className="px-2 py-1 rounded bg-neon-blue/20 text-neon-blue text-xs font-bold">Ausente</span>
                              )}
                              {estado === 'tardanza' && (
                                <span className="px-2 py-1 rounded bg-neon-magenta/20 text-neon-magenta text-xs font-bold">Tardanza</span>
                              )}
                              {!estado && (
                                <span className="px-2 py-1 rounded bg-white/10 text-white/50 text-xs">Sin registrar</span>
                              )}
                            </td>
                            <td className="px-3 py-3">
                              <div className="flex justify-center gap-2">
                                <button
                                  onClick={() => marcarAsistencia(alumno.id, 'presente')}
                                  className={`p-2 rounded-lg transition-all ${estado === 'presente' ? 'bg-neon-lime text-black' : 'bg-white/10 text-neon-lime hover:bg-neon-lime/20'}`}
                                  title="Presente"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => marcarAsistencia(alumno.id, 'tardanza')}
                                  className={`p-2 rounded-lg transition-all ${estado === 'tardanza' ? 'bg-neon-magenta text-black' : 'bg-white/10 text-neon-magenta hover:bg-neon-magenta/20'}`}
                                  title="Tardanza"
                                >
                                  <Clock className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => marcarAsistencia(alumno.id, 'ausente')}
                                  className={`p-2 rounded-lg transition-all ${estado === 'ausente' ? 'bg-neon-blue text-black' : 'bg-white/10 text-neon-blue hover:bg-neon-blue/20'}`}
                                  title="Ausente"
                                >
                                  <XCircle className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </FuturisticCard>
        </motion.div>

        {/* Real-time Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {stats.map((stat, i) => {
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

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center justify-center gap-2 p-4 rounded-xl border-2 border-neon-lime/50 bg-gradient-to-br from-white/5 to-white/5 hover:from-white/10 hover:to-white/5 text-neon-lime font-bold uppercase text-sm transition-all"
          >
            <CheckCircle className="w-5 h-5" />
            Registrar Presencia
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center justify-center gap-2 p-4 rounded-xl border-2 border-neon-magenta/50 bg-gradient-to-br from-white/5 to-white/5 hover:from-white/10 hover:to-white/5 text-neon-magenta font-bold uppercase text-sm transition-all"
          >
            <XCircle className="w-5 h-5" />
            Registrar Ausencia
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center justify-center gap-2 p-4 rounded-xl border-2 border-neon-cyan/50 bg-gradient-to-br from-white/5 to-white/5 hover:from-white/10 hover:to-white/5 text-neon-cyan font-bold uppercase text-sm transition-all"
          >
            <Download className="w-5 h-5" />
            Descargar Reporte
          </motion.button>
        </motion.div>

        {/* Weekly Trend */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <FuturisticCard variant="cyan" glow>
            <div className="p-6">
              <h3 className="text-white font-bold uppercase tracking-wider mb-6 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-neon-cyan" />
                <HologramText variant="primary">Tendencia Semanal</HologramText>
              </h3>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={attendanceTrend}>
                  <CartesianGrid stroke="rgba(0,217,255,0.1)" strokeDasharray="3 3" />
                  <XAxis dataKey="date" stroke="rgba(255,255,255,0.3)" />
                  <YAxis stroke="rgba(255,255,255,0.3)" domain={[85, 100]} />
                  <Tooltip contentStyle={{ backgroundColor: 'rgba(13, 22, 38, 0.9)', border: '1px solid rgba(0, 217, 255, 0.5)', borderRadius: '8px', color: '#fff' }} />
                  <Line type="monotone" dataKey="percentage" stroke="#00d9ff" strokeWidth={3} dot={{ fill: '#00d9ff', r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </FuturisticCard>
        </motion.div>

        {/* Summary Cards */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          <FuturisticCard variant="magenta" glow hover>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-6 h-6 text-neon-magenta animate-pulse-glow" />
                <p className="font-bold text-white uppercase text-sm">Mes Actual</p>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-white/90">Asistencia Promedio:</span>
                  <span className="text-white font-bold">94.8%</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <motion.div className="h-full bg-gradient-to-r from-neon-magenta to-neon-cyan" style={{ width: '94.8%' }} />
                </div>
              </div>
            </div>
          </FuturisticCard>

          <FuturisticCard variant="lime" glow hover>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-6 h-6 text-neon-lime animate-pulse-glow" />
                <p className="font-bold text-white uppercase text-sm">Estudiantes a Monitorear</p>
              </div>
              <div className="space-y-2">
                <p className="text-white/90 text-sm">3 estudiantes con baja asistencia (&lt;85%)</p>
                <div className="flex gap-2">
                  {['Carlos M.', 'Ana L.', 'Juan P.'].map((name, i) => (
                    <div key={i} className="px-2 py-1 rounded bg-neon-lime/20 text-neon-lime text-xs font-bold">
                      {name}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </FuturisticCard>
        </motion.div>

        {/* Recent Records */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-2xl font-bold uppercase tracking-wider">
              <HologramText variant="secondary">Registros Recientes</HologramText>
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
            {recentRecords.map((record, i) => (
              <motion.div
                key={record.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + i * 0.05 }}
              >
                <FuturisticCard
                  variant={
                    record.status === 'Presente'
                      ? 'lime'
                      : record.status === 'Ausente'
                        ? 'blue'
                        : 'magenta'
                  }
                  glow
                  hover
                >
                  <div className="p-4 flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-white font-bold uppercase tracking-wide text-sm">{record.student}</p>
                      <p className="text-xs text-white/85 mt-1">{record.date}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-bold ${
                        record.status === 'Presente'
                          ? 'text-neon-lime'
                          : record.status === 'Ausente'
                            ? 'text-neon-blue'
                            : 'text-neon-magenta'
                      }`}>
                        {record.status}
                      </p>
                      <p className="text-xs text-white/85 mt-1">{record.time}</p>
                    </div>
                  </div>
                </FuturisticCard>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Monthly Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <div className="mb-4">
            <h3 className="text-2xl font-bold uppercase tracking-wider">
              <HologramText>Resumen del Mes</HologramText>
            </h3>
          </div>
          <DataGrid
            headers={['Grado', 'Total Estudiantes', 'Presentes', 'Ausentes', 'Tardanzas']}
            rows={[
              ['1º A', '45', '44', '1', '2'],
              ['2º B', '48', '46', '2', '3'],
              ['3º A', '42', '42', '0', '1'],
              ['4º B', '50', '48', '2', '4'],
              ['5º A', '51', '50', '1', '2'],
              ['6º B', '48', '47', '1', '2'],
            ]}
          />
        </motion.div>
      </div>
    </div>
  );
}
