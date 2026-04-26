import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect, useMemo } from 'react';
import {
  CheckCircle, XCircle, Clock, TrendingUp, Calendar, AlertCircle,
  Download, Users, Trash2, Wifi, WifiOff, Search, X, ChevronDown,
  BookOpen, Zap, Eye, EyeOff
} from 'lucide-react';
import FuturisticCard from '../components/FuturisticCard';
import HologramText from '../components/HologramText';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { syncToTurso, isSyncedToCloud } from '../services/dataService';
import { getAlumnos } from '../utils/apiClient';

interface User {
  id: string; name: string; email: string; role: string; schoolId: string;
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
  modo: 'diaria' | 'refuerzo';
  estado: 'presente' | 'ausente' | 'tardanza';
  hora?: string;
}

const LS_ASISTENCIA = 'ie_asistencia';
const LS_REFUERZO_LISTA = 'ie_refuerzo_lista'; // lista de ids seleccionados para refuerzo

const GRADOS = ['1', '2', '3', '4', '5'];
const SECCIONES = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

function lsGet<T>(key: string, def: T): T {
  try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(def)); } catch { return def; }
}
function lsSet(key: string, val: any) { localStorage.setItem(key, JSON.stringify(val)); }

// Normaliza grado: "1", "1°", "Primero", "primero" → "1"
function normGrado(g: string | undefined): string {
  if (!g) return '';
  const s = String(g).trim();
  const map: Record<string, string> = {
    'primero': '1', 'primer': '1', '1°': '1', '1º': '1',
    'segundo': '2', 'segund': '2', '2°': '2', '2º': '2',
    'tercero': '3', 'tercer': '3', '3°': '3', '3º': '3',
    'cuarto': '4', '4°': '4', '4º': '4',
    'quinto': '5', '5°': '5', '5º': '5',
  };
  return map[s.toLowerCase()] || s.replace(/[°º]/g, '').trim();
}

// Normaliza sección: quita números al inicio y espacios
function normSeccion(s: string | undefined): string {
  if (!s) return '';
  return String(s).trim().replace(/^\d+/, '').replace(/[^A-Za-z]/g, '').toUpperCase();
}

function nombreAlumno(a: Alumno) {
  return a.apellidos_nombres || a.nombre || 'Sin nombre';
}

interface AttendanceScreenModernProps {
  user?: User;
}

export default function AttendanceScreenModern({ user }: AttendanceScreenModernProps) {
  const [modo, setModo] = useState<'diaria' | 'refuerzo'>('diaria');
  const [grado, setGrado] = useState<string>('1');
  const [seccion, setSeccion] = useState<string>('A');
  const [fechaActual, setFechaActual] = useState<string>(new Date().toISOString().split('T')[0]);
  const [alumnos, setAlumnos] = useState<Alumno[]>([]);
  const [asistencia, setAsistencia] = useState<RegistroAsistencia[]>([]);
  // Refuerzo: lista seleccionada de ids
  const [refuerzoIds, setRefuerzoIds] = useState<string[]>([]);
  const [showRefuerzoSelector, setShowRefuerzoSelector] = useState(false);
  const [busquedaRefuerzo, setBusquedaRefuerzo] = useState('');
  const [gradoBuscador, setGradoBuscador] = useState('');
  const [seccionBuscador, setSeccionBuscador] = useState('');

  // Cargar datos
  useEffect(() => {
    (async () => {
      let stored: Alumno[] = [];
      // 1) Intentar descargar desde Turso
      try {
        stored = await getAlumnos();
        localStorage.setItem('ie_alumnos', JSON.stringify(stored));
      } catch {
        // 2) Fallback a localStorage
        stored = lsGet<Alumno[]>('ie_alumnos', []);
      }
      setAlumnos(stored);
      setAsistencia(lsGet<RegistroAsistencia[]>(LS_ASISTENCIA, []));
      setRefuerzoIds(lsGet<string[]>(LS_REFUERZO_LISTA, []));
      // Auto-detectar primer grado disponible
      if (stored.length > 0) {
        const grados = [...new Set(stored.map(a => normGrado(a.grado)).filter(Boolean))].sort();
        if (grados.length > 0 && !grados.includes(grado)) setGrado(grados[0]);
      }
    })();
  }, []);

  // Alumnos del modo diario (grado + sección)
  const alumnosDiarios = useMemo(() =>
    alumnos
      .filter(a => normGrado(a.grado) === grado && normSeccion(a.seccion) === seccion)
      .sort((a, b) => nombreAlumno(a).localeCompare(nombreAlumno(b))),
    [alumnos, grado, seccion]
  );

  // Alumnos del modo refuerzo (solo los seleccionados)
  const alumnosRefuerzo = useMemo(() =>
    alumnos
      .filter(a => refuerzoIds.includes(a.id))
      .sort((a, b) => nombreAlumno(a).localeCompare(nombreAlumno(b))),
    [alumnos, refuerzoIds]
  );

  // Alumnos activos según modo
  const alumnosActivos = modo === 'diaria' ? alumnosDiarios : alumnosRefuerzo;

  // Grados únicos disponibles
  const gradosDisponibles = useMemo(() =>
    [...new Set(alumnos.map(a => normGrado(a.grado)).filter(Boolean))].sort(),
    [alumnos]
  );

  // Secciones del grado seleccionado
  const seccionesDisponibles = useMemo(() =>
    [...new Set(alumnos.filter(a => normGrado(a.grado) === grado).map(a => normSeccion(a.seccion)).filter(Boolean))].sort(),
    [alumnos, grado]
  );

  // Alumnos para el buscador del refuerzo
  const alumnosBuscador = useMemo(() =>
    alumnos
      .filter(a => {
        const matchNombre = !busquedaRefuerzo || nombreAlumno(a).toLowerCase().includes(busquedaRefuerzo.toLowerCase());
        const matchGrado = !gradoBuscador || normGrado(a.grado) === gradoBuscador;
        const matchSeccion = !seccionBuscador || normSeccion(a.seccion) === seccionBuscador;
        return matchNombre && matchGrado && matchSeccion;
      })
      .sort((a, b) => nombreAlumno(a).localeCompare(nombreAlumno(b))),
    [alumnos, busquedaRefuerzo, gradoBuscador, seccionBuscador]
  );

  // Guardar asistencia
  const guardarAsistencia = (updated: RegistroAsistencia[]) => {
    setAsistencia(updated);
    lsSet(LS_ASISTENCIA, updated);
    syncToTurso('asistencia', updated);
  };

  const marcarAsistencia = (alumnoId: string, estado: 'presente' | 'ausente' | 'tardanza') => {
    const filtrados = asistencia.filter(r => !(r.alumnoId === alumnoId && r.fecha === fechaActual && r.modo === modo));
    const nuevo: RegistroAsistencia = {
      id: `as-${Date.now()}-${alumnoId}`,
      alumnoId,
      fecha: fechaActual,
      modo,
      estado,
      hora: estado !== 'ausente' ? new Date().toTimeString().slice(0, 5) : undefined,
    };
    guardarAsistencia([...filtrados, nuevo]);
  };

  const marcarTodos = (estado: 'presente' | 'ausente' | 'tardanza') => {
    const hora = estado !== 'ausente' ? new Date().toTimeString().slice(0, 5) : undefined;
    const sinHoy = asistencia.filter(r => !(r.fecha === fechaActual && r.modo === modo && alumnosActivos.find(a => a.id === r.alumnoId)));
    const nuevos: RegistroAsistencia[] = alumnosActivos.map(alumno => ({
      id: `as-${Date.now()}-${alumno.id}`,
      alumnoId: alumno.id,
      fecha: fechaActual,
      modo,
      estado,
      hora,
    }));
    guardarAsistencia([...sinHoy, ...nuevos]);
  };

  const limpiarDia = () => {
    if (!confirm(`¿Borrar todos los registros del ${fechaActual} para ${modo === 'diaria' ? `${grado}° Sección ${seccion}` : 'refuerzo'}?`)) return;
    guardarAsistencia(asistencia.filter(r => !(r.fecha === fechaActual && r.modo === modo && alumnosActivos.find(a => a.id === r.alumnoId))));
  };

  const getEstado = (alumnoId: string): 'presente' | 'ausente' | 'tardanza' | null => {
    return asistencia.find(r => r.alumnoId === alumnoId && r.fecha === fechaActual && r.modo === modo)?.estado || null;
  };

  // Stats del día actual
  const stats = useMemo(() => {
    const hoy = asistencia.filter(r => r.fecha === fechaActual && r.modo === modo && alumnosActivos.find(a => a.id === r.alumnoId));
    const presentes = hoy.filter(r => r.estado === 'presente').length;
    const ausentes = hoy.filter(r => r.estado === 'ausente').length;
    const tardanzas = hoy.filter(r => r.estado === 'tardanza').length;
    const total = alumnosActivos.length || 1;
    return { presentes, ausentes, tardanzas, tasa: Math.round((presentes / total) * 100) };
  }, [asistencia, fechaActual, modo, alumnosActivos]);

  const exportarTxt = () => {
    let txt = `ASISTENCIA ${modo.toUpperCase()} — ${modo === 'diaria' ? `${grado}° Sección ${seccion}` : 'REFUERZO'} — ${fechaActual}\n`;
    txt += '='.repeat(55) + '\n\n';
    alumnosActivos.forEach((alumno, idx) => {
      const estado = getEstado(alumno.id) || 'SIN REGISTRAR';
      const fila = `${String(idx + 1).padStart(2, '0')}. ${nombreAlumno(alumno).padEnd(38)} ${estado.toUpperCase()}`;
      txt += fila + '\n';
    });
    txt += '\n' + '='.repeat(55) + '\n';
    txt += `Presentes: ${stats.presentes} | Ausentes: ${stats.ausentes} | Tardanzas: ${stats.tardanzas} | Tasa: ${stats.tasa}%\n`;
    const blob = new Blob([txt], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `asistencia_${modo}_${grado}${seccion}_${fechaActual}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Guardar lista de refuerzo
  const toggleRefuerzoId = (id: string) => {
    const nueva = refuerzoIds.includes(id) ? refuerzoIds.filter(x => x !== id) : [...refuerzoIds, id];
    setRefuerzoIds(nueva);
    lsSet(LS_REFUERZO_LISTA, nueva);
  };

  const limpiarRefuerzo = () => {
    if (!confirm('¿Limpiar la lista de alumnos de refuerzo?')) return;
    setRefuerzoIds([]);
    lsSet(LS_REFUERZO_LISTA, []);
  };

  const tendencia = [
    { date: 'Lun', p: 96 }, { date: 'Mar', p: 94 }, { date: 'Mié', p: 98 },
    { date: 'Jue', p: 95 }, { date: 'Vie', p: stats.tasa || 91 },
  ];

  return (
    <div className="min-h-screen bg-dark-bg text-white overflow-hidden p-6">
      <div className="fixed inset-0 -z-50">
        <div className="absolute inset-0 bg-gradient-cyber opacity-60" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto space-y-6">

        {/* ── HEADER ── */}
        <motion.div initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-5xl font-black tracking-tighter">
              Control de <HologramText>Asistencia</HologramText>
            </h1>
            <p className="text-white/60 font-mono tracking-widest text-sm mt-1">REGISTRO Y ANÁLISIS DE PRESENCIA</p>
          </div>
          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-bold mt-2 flex-shrink-0 ${isSyncedToCloud() ? 'border-neon-lime/50 bg-neon-lime/10 text-neon-lime' : 'border-neon-cyan/40 bg-neon-cyan/10 text-neon-cyan'}`}>
            {isSyncedToCloud() ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
            {isSyncedToCloud() ? 'TURSO CONECTADO' : 'MODO LOCAL'}
          </div>
        </motion.div>

        {/* ── TABS MODO ── */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }}
          className="flex gap-3 flex-wrap">
          <button onClick={() => setModo('diaria')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm border transition-all ${modo === 'diaria' ? 'bg-neon-cyan/20 border-neon-cyan text-neon-cyan shadow-[0_0_20px_rgba(0,217,255,0.3)]' : 'bg-white/5 border-white/20 text-white/60 hover:bg-white/10'}`}>
            <BookOpen className="w-4 h-4" /> Asistencia Diaria
          </button>
          <button onClick={() => setModo('refuerzo')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm border transition-all ${modo === 'refuerzo' ? 'bg-neon-magenta/20 border-neon-magenta text-neon-magenta shadow-[0_0_20px_rgba(255,0,200,0.3)]' : 'bg-white/5 border-white/20 text-white/60 hover:bg-white/10'}`}>
            <Zap className="w-4 h-4" /> Refuerzo / Recuperación
          </button>
        </motion.div>

        {/* ── FILTROS DIARIA ── */}
        {modo === 'diaria' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.07 }}>
            <FuturisticCard variant="cyan" glow>
              <div className="p-4 flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-neon-cyan" />
                  <label className="text-white/70 text-sm font-bold uppercase">Fecha:</label>
                  <input type="date" value={fechaActual} onChange={e => setFechaActual(e.target.value)}
                    className="bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-neon-cyan" />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-white/70 text-sm font-bold uppercase">Grado:</label>
                  <select value={grado} onChange={e => { setGrado(e.target.value); setSeccion('A'); }}
                    className="bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-neon-cyan">
                    {(gradosDisponibles.length > 0 ? gradosDisponibles : GRADOS).map(g => (
                      <option key={g} value={g} className="bg-slate-800">{g}°</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-white/70 text-sm font-bold uppercase">Sección:</label>
                  <select value={seccion} onChange={e => setSeccion(e.target.value)}
                    className="bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-neon-cyan">
                    {(seccionesDisponibles.length > 0 ? seccionesDisponibles : SECCIONES).map(s => (
                      <option key={s} value={s} className="bg-slate-800">Sección {s}</option>
                    ))}
                  </select>
                </div>
                <div className="ml-auto flex items-center gap-2 text-white/60 text-sm">
                  <Users className="w-4 h-4" />
                  {alumnosDiarios.length} estudiantes
                </div>
              </div>
            </FuturisticCard>
          </motion.div>
        )}

        {/* ── FILTROS REFUERZO ── */}
        {modo === 'refuerzo' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.07 }}>
            <FuturisticCard variant="magenta" glow>
              <div className="p-4 flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-neon-magenta" />
                  <label className="text-white/70 text-sm font-bold uppercase">Fecha:</label>
                  <input type="date" value={fechaActual} onChange={e => setFechaActual(e.target.value)}
                    className="bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-neon-magenta" />
                </div>
                <div className="flex items-center gap-2 ml-auto flex-wrap gap-y-2">
                  <div className="text-white/60 text-sm flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {alumnosRefuerzo.length} seleccionados
                  </div>
                  <button onClick={() => setShowRefuerzoSelector(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-neon-magenta/20 hover:bg-neon-magenta/30 border border-neon-magenta text-neon-magenta font-bold text-xs rounded-xl transition-all">
                    <Users className="w-4 h-4" /> Seleccionar Alumnos
                  </button>
                  {refuerzoIds.length > 0 && (
                    <button onClick={limpiarRefuerzo}
                      className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-400 font-bold text-xs rounded-xl transition-all">
                      <Trash2 className="w-4 h-4" /> Limpiar Lista
                    </button>
                  )}
                </div>
              </div>
              {/* Vista previa de la lista */}
              {alumnosRefuerzo.length > 0 && (
                <div className="px-4 pb-4">
                  <p className="text-white/50 text-xs uppercase mb-2">Lista de refuerzo:</p>
                  <div className="flex flex-wrap gap-2">
                    {alumnosRefuerzo.map(a => (
                      <div key={a.id} className="flex items-center gap-1 px-3 py-1 bg-white/10 rounded-full text-xs text-white">
                        <span>{nombreAlumno(a)}</span>
                        <span className="text-white/40">{normGrado(a.grado)}°{normSeccion(a.seccion)}</span>
                        <button onClick={() => toggleRefuerzoId(a.id)} className="ml-1 text-white/40 hover:text-red-400">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </FuturisticCard>
          </motion.div>
        )}

        {/* ── STATS ── */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Presentes', value: stats.presentes, color: 'lime', icon: CheckCircle },
            { label: 'Ausentes', value: stats.ausentes, color: 'blue', icon: XCircle },
            { label: 'Tardanzas', value: stats.tardanzas, color: 'magenta', icon: Clock },
            { label: 'Tasa', value: `${stats.tasa}%`, color: 'cyan', icon: TrendingUp },
          ].map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 + i * 0.05 }}>
              <FuturisticCard variant={s.color as any} glow>
                <div className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-white/60 text-xs uppercase">{s.label}</p>
                    <p className="text-3xl font-black text-white mt-1">{s.value}</p>
                  </div>
                  <s.icon className="w-8 h-8 text-white/20" />
                </div>
              </FuturisticCard>
            </motion.div>
          ))}
        </motion.div>

        {/* ── TABLA DE REGISTRO ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <FuturisticCard variant={modo === 'diaria' ? 'lime' : 'magenta'} glow>
            <div className="p-5">
              {/* Sub-header tabla */}
              <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                <h3 className="text-white font-bold uppercase tracking-wider flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-neon-lime" />
                  {modo === 'diaria'
                    ? `${grado}° Sección ${seccion} — ${fechaActual}`
                    : `Refuerzo — ${fechaActual}`}
                </h3>
                {/* Acciones masivas */}
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => marcarTodos('presente')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neon-lime/20 hover:bg-neon-lime/30 border border-neon-lime/50 text-neon-lime font-bold text-xs transition-all">
                    <Users className="w-3.5 h-3.5" /> Todos Presentes
                  </button>
                  <button onClick={() => marcarTodos('ausente')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neon-blue/20 hover:bg-neon-blue/30 border border-neon-blue/50 text-neon-blue font-bold text-xs transition-all">
                    <XCircle className="w-3.5 h-3.5" /> Todos Ausentes
                  </button>
                  <button onClick={exportarTxt}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neon-cyan/20 hover:bg-neon-cyan/30 border border-neon-cyan/50 text-neon-cyan font-bold text-xs transition-all">
                    <Download className="w-3.5 h-3.5" /> Exportar
                  </button>
                  <button onClick={limpiarDia}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-400 font-bold text-xs transition-all">
                    <Trash2 className="w-3.5 h-3.5" /> Limpiar Día
                  </button>
                </div>
              </div>

              {/* Sin alumnos */}
              {alumnosActivos.length === 0 && (
                <div className="text-center py-12">
                  <AlertCircle className="w-12 h-12 mx-auto mb-4 text-white/20" />
                  {modo === 'diaria' ? (
                    <>
                      <p className="text-white/60 font-medium">Sin alumnos en {grado}° sección {seccion}</p>
                      <p className="text-white/40 text-sm mt-2">
                        Verifica que los alumnos tengan grado <strong className="text-white/60">{grado}</strong> y sección <strong className="text-white/60">{seccion}</strong> en el módulo <strong className="text-white/60">Alumnos</strong>.
                      </p>
                      {alumnos.length === 0 && (
                        <p className="text-yellow-400/80 text-xs mt-3 bg-yellow-400/10 border border-yellow-400/20 rounded-xl px-4 py-2 inline-block">
                          ⚠️ No hay alumnos en el sistema. Ve a <strong>Gestión → Alumnos</strong> para importar o crear alumnos.
                        </p>
                      )}
                    </>
                  ) : (
                    <>
                      <p className="text-white/60 font-medium">Lista de refuerzo vacía</p>
                      <p className="text-white/40 text-sm mt-2">Usa "Seleccionar Alumnos" para agregar estudiantes a la sesión de refuerzo.</p>
                    </>
                  )}
                </div>
              )}

              {/* Tabla */}
              {alumnosActivos.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-white/50 text-xs uppercase border-b border-white/10">
                        <th className="px-3 py-2 text-left w-10">#</th>
                        <th className="px-3 py-2 text-left">Estudiante</th>
                        {modo === 'refuerzo' && <th className="px-3 py-2 text-center">Grado</th>}
                        <th className="px-3 py-2 text-center">Estado</th>
                        <th className="px-3 py-2 text-center">Marcar</th>
                      </tr>
                    </thead>
                    <tbody>
                      {alumnosActivos.map((alumno, idx) => {
                        const estado = getEstado(alumno.id);
                        return (
                          <tr key={alumno.id} className={`border-b border-white/5 transition-colors ${estado === 'presente' ? 'bg-neon-lime/5' : estado === 'ausente' ? 'bg-red-500/5' : estado === 'tardanza' ? 'bg-yellow-500/5' : 'hover:bg-white/5'}`}>
                            <td className="px-3 py-3 text-white/40 text-sm">{idx + 1}</td>
                            <td className="px-3 py-3 text-white font-medium text-sm">{nombreAlumno(alumno)}</td>
                            {modo === 'refuerzo' && (
                              <td className="px-3 py-3 text-center">
                                <span className="text-xs text-white/50">{normGrado(alumno.grado)}°{normSeccion(alumno.seccion)}</span>
                              </td>
                            )}
                            <td className="px-3 py-3 text-center">
                              {estado === 'presente' && <span className="px-2 py-1 rounded-full bg-neon-lime/20 text-neon-lime text-xs font-bold">Presente</span>}
                              {estado === 'ausente' && <span className="px-2 py-1 rounded-full bg-neon-blue/20 text-neon-blue text-xs font-bold">Ausente</span>}
                              {estado === 'tardanza' && <span className="px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-300 text-xs font-bold">Tardanza</span>}
                              {!estado && <span className="text-white/30 text-xs">—</span>}
                            </td>
                            <td className="px-3 py-3">
                              <div className="flex justify-center gap-2">
                                <button onClick={() => marcarAsistencia(alumno.id, 'presente')} title="Presente"
                                  className={`w-9 h-9 rounded-xl font-bold text-sm transition-all ${estado === 'presente' ? 'bg-neon-lime text-black shadow-[0_0_12px_#b0ff5e]' : 'bg-white/10 text-neon-lime hover:bg-neon-lime/20'}`}>
                                  ✓
                                </button>
                                <button onClick={() => marcarAsistencia(alumno.id, 'tardanza')} title="Tardanza"
                                  className={`w-9 h-9 rounded-xl font-bold text-sm transition-all ${estado === 'tardanza' ? 'bg-yellow-400 text-black shadow-[0_0_12px_#facc15]' : 'bg-white/10 text-yellow-400 hover:bg-yellow-400/20'}`}>
                                  ⏰
                                </button>
                                <button onClick={() => marcarAsistencia(alumno.id, 'ausente')} title="Ausente"
                                  className={`w-9 h-9 rounded-xl font-bold text-sm transition-all ${estado === 'ausente' ? 'bg-neon-blue text-white shadow-[0_0_12px_#3b82f6]' : 'bg-white/10 text-neon-blue hover:bg-neon-blue/20'}`}>
                                  ✗
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </FuturisticCard>
        </motion.div>

        {/* ── GRÁFICO TENDENCIA ── */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}>
          <FuturisticCard variant="cyan" glow>
            <div className="p-6">
              <h3 className="text-white font-bold uppercase tracking-wider mb-6 flex items-center gap-2 text-sm">
                <TrendingUp className="w-4 h-4 text-neon-cyan" />
                <HologramText variant="primary">Tendencia Semanal</HologramText>
              </h3>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={tendencia}>
                  <CartesianGrid stroke="rgba(0,217,255,0.08)" strokeDasharray="3 3" />
                  <XAxis dataKey="date" stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 12 }} />
                  <YAxis stroke="rgba(255,255,255,0.3)" domain={[80, 100]} tick={{ fontSize: 12 }} />
                  <Tooltip contentStyle={{ backgroundColor: 'rgba(13,22,38,0.95)', border: '1px solid rgba(0,217,255,0.4)', borderRadius: '8px', color: '#fff' }} />
                  <Line type="monotone" dataKey="p" name="Asistencia %" stroke="#00d9ff" strokeWidth={3} dot={{ fill: '#00d9ff', r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </FuturisticCard>
        </motion.div>

      </div>

      {/* ── MODAL SELECTOR REFUERZO ── */}
      <AnimatePresence>
        {showRefuerzoSelector && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
            onClick={() => setShowRefuerzoSelector(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-800 border border-neon-magenta/40 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col"
              onClick={e => e.stopPropagation()}>

              {/* Header modal */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 flex-shrink-0">
                <div>
                  <h3 className="text-white font-bold text-lg">Seleccionar Alumnos de Refuerzo</h3>
                  <p className="text-white/50 text-xs mt-0.5">{refuerzoIds.length} seleccionados de {alumnos.length} alumnos</p>
                </div>
                <button onClick={() => setShowRefuerzoSelector(false)}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-xl text-white/60 transition-all">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Filtros buscador */}
              <div className="px-6 py-3 border-b border-white/10 flex-shrink-0 flex flex-wrap gap-3">
                <div className="flex items-center gap-2 flex-1 min-w-[160px]">
                  <Search className="w-4 h-4 text-white/40 flex-shrink-0" />
                  <input value={busquedaRefuerzo} onChange={e => setBusquedaRefuerzo(e.target.value)}
                    placeholder="Buscar alumno..."
                    className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-neon-magenta placeholder-white/30" />
                </div>
                <select value={gradoBuscador} onChange={e => setGradoBuscador(e.target.value)}
                  className="bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-neon-magenta">
                  <option value="" className="bg-slate-800">Todos los grados</option>
                  {(gradosDisponibles.length > 0 ? gradosDisponibles : GRADOS).map(g => (
                    <option key={g} value={g} className="bg-slate-800">{g}°</option>
                  ))}
                </select>
                <select value={seccionBuscador} onChange={e => setSeccionBuscador(e.target.value)}
                  className="bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-neon-magenta">
                  <option value="" className="bg-slate-800">Todas las secciones</option>
                  {SECCIONES.map(s => (
                    <option key={s} value={s} className="bg-slate-800">Sección {s}</option>
                  ))}
                </select>
              </div>

              {/* Lista de alumnos */}
              <div className="flex-1 overflow-y-auto px-6 py-3 space-y-1">
                {/* Seleccionar/deseleccionar todos los filtrados */}
                {alumnosBuscador.length > 0 && (
                  <div className="flex gap-3 pb-2 mb-1 border-b border-white/10">
                    <button onClick={() => {
                      const ids = alumnosBuscador.map(a => a.id);
                      const nueva = [...new Set([...refuerzoIds, ...ids])];
                      setRefuerzoIds(nueva); lsSet(LS_REFUERZO_LISTA, nueva);
                    }} className="text-xs font-bold text-neon-lime hover:underline">
                      ✓ Seleccionar todos ({alumnosBuscador.length})
                    </button>
                    <button onClick={() => {
                      const ids = new Set(alumnosBuscador.map(a => a.id));
                      const nueva = refuerzoIds.filter(id => !ids.has(id));
                      setRefuerzoIds(nueva); lsSet(LS_REFUERZO_LISTA, nueva);
                    }} className="text-xs font-bold text-red-400 hover:underline">
                      ✗ Quitar todos ({alumnosBuscador.length})
                    </button>
                  </div>
                )}

                {alumnosBuscador.length === 0 && (
                  <p className="text-center text-white/40 py-8">Sin alumnos con ese filtro</p>
                )}

                {alumnosBuscador.map(alumno => {
                  const sel = refuerzoIds.includes(alumno.id);
                  return (
                    <button key={alumno.id} onClick={() => toggleRefuerzoId(alumno.id)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all text-left ${sel ? 'bg-neon-magenta/15 border border-neon-magenta/40' : 'bg-white/5 border border-transparent hover:bg-white/10'}`}>
                      <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all ${sel ? 'bg-neon-magenta border-neon-magenta text-black' : 'border-white/30'}`}>
                        {sel && <span className="text-xs font-black">✓</span>}
                      </div>
                      <span className="flex-1 text-white text-sm font-medium">{nombreAlumno(alumno)}</span>
                      <span className="text-white/40 text-xs">{normGrado(alumno.grado)}° {normSeccion(alumno.seccion)}</span>
                    </button>
                  );
                })}
              </div>

              {/* Footer modal */}
              <div className="px-6 py-4 border-t border-white/10 flex-shrink-0 flex justify-between items-center">
                <span className="text-white/60 text-sm">{refuerzoIds.length} alumno(s) seleccionado(s)</span>
                <button onClick={() => setShowRefuerzoSelector(false)}
                  className="px-6 py-2.5 bg-neon-magenta/20 hover:bg-neon-magenta/30 border border-neon-magenta text-neon-magenta font-bold rounded-xl text-sm transition-all">
                  Listo
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
