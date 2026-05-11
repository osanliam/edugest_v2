import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect, useMemo } from 'react';
import { Clock, CheckSquare, Square, CheckCircle2, XCircle } from 'lucide-react';
import HeaderElegante from '../components/HeaderElegante';
import { cargarTodo, guardarAsistencia } from '../utils/apiClient';

type EstadoAsistencia = 'asistio' | 'falto' | 'retrasado' | 'justifico' | 'permiso';
type EstadoRefuerzo = 'asistio' | 'tardanza' | 'falta' | 'permiso';

interface Alumno {
  id: string;
  apellidos_nombres: string;
  grado: string;
  seccion: string;
}

interface RegistroAsistencia {
  id?: string;
  alumnoId: string;
  fecha: string;
  estado: EstadoAsistencia;
  bimestre: number;
  horaRegistro?: string;
}

interface RegistroRefuerzo {
  id?: string;
  alumnoId: string;
  fecha: string;
  estado: EstadoRefuerzo;
  bimestre: number;
  horaRegistro?: string;
  seleccionado: boolean;
}

function lsGet<T>(key: string, def: T): T {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : def; } catch { return def; }
}
function lsSet(key: string, val: any) {
  localStorage.setItem(key, JSON.stringify(val));
}

const LS_ALUMNOS = 'ie_alumnos';
const LS_ASISTENCIA_REGISTRO = 'ie_asistencia';
const LS_REFUERZO_REGISTRO = 'ie_refuerzo';
const LS_SELECCION_REFUERZO = 'ie_seleccion_refuerzo';

const CURSOS = ['Comunicación', 'Matemática', 'Ciencia y Tecnología', 'Historia', 'Inglés', 'Educación Física', 'Arte', 'Tutoría'];

export default function AttendanceScreen() {
  const [seccion, setSeccion] = useState<'asistencia' | 'refuerzo'>('asistencia');
  const [alumnos, setAlumnos] = useState<Alumno[]>([]);
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [registrosAsistencia, setRegistrosAsistencia] = useState<RegistroAsistencia[]>([]);
  const [registrosRefuerzo, setRegistrosRefuerzo] = useState<RegistroRefuerzo[]>([]);
  const [seleccionRefuerzo, setSeleccionRefuerzo] = useState<Set<string>>(() => new Set(lsGet<string[]>(LS_SELECCION_REFUERZO, [])));

  const [filtroGrado, setFiltroGrado] = useState('');
  const [filtroSeccion, setFiltroSeccion] = useState('');
  const [filtroBimestre, setFiltroBimestre] = useState('1');
  const [filtroCurso, setFiltroCurso] = useState('');
  const [guardado, setGuardado] = useState(false);
  const [sincronizando, setSincronizando] = useState(false);

  const grados = useMemo(() => [...new Set(alumnos.map(a => a.grado))].sort(), [alumnos]);
  const secciones = useMemo(() => filtroGrado ? [...new Set(alumnos.filter(a => a.grado === filtroGrado).map(a => a.seccion))].sort() : [], [alumnos, filtroGrado]);
  const alumnosFiltrados = useMemo(() => alumnos.filter(a =>
    (!filtroGrado || a.grado === filtroGrado) &&
    (!filtroSeccion || a.seccion === filtroSeccion)
  ), [alumnos, filtroGrado, filtroSeccion]);

  const alumnosSeleccionadosRefuerzo = useMemo(() => alumnosFiltrados.filter(a => seleccionRefuerzo.has(a.id)), [alumnosFiltrados, seleccionRefuerzo]);

  const guardarSeleccionRefuerzo = (sel: Set<string>) => {
    lsSet(LS_SELECCION_REFUERZO, Array.from(sel));
  };

  const toggleSeleccionRefuerzo = (id: string) => {
    const nueva = new Set(seleccionRefuerzo);
    if (nueva.has(id)) nueva.delete(id); else nueva.add(id);
    setSeleccionRefuerzo(nueva);
    guardarSeleccionRefuerzo(nueva);
  };

  const seleccionarTodosRefuerzo = () => {
    const nueva = new Set(alumnosFiltrados.map(a => a.id));
    setSeleccionRefuerzo(nueva);
    guardarSeleccionRefuerzo(nueva);
  };

  const deseleccionarTodosRefuerzo = () => {
    setSeleccionRefuerzo(new Set());
    guardarSeleccionRefuerzo(new Set());
  };

  useEffect(() => {
    const cargarDatos = async () => {
      const lista = lsGet<Alumno[]>(LS_ALUMNOS, []);
      if (lista.length > 0) {
        setAlumnos(lista);
        setFiltroGrado(lista[0].grado);
      }
      try {
        const datos = await cargarTodo('alumnos,asistencia');
        if (datos.alumnos && datos.alumnos.length > 0) {
          const alumnosMapeados: Alumno[] = datos.alumnos.map((a: any) => ({
            id: a.id,
            apellidos_nombres: a.apellidos_nombres || a.nombre || '',
            grado: a.grado || '',
            seccion: a.seccion || '',
          }));
          lsSet(LS_ALUMNOS, alumnosMapeados);
          setAlumnos(alumnosMapeados);
          if (alumnosMapeados.length > 0 && !filtroGrado) {
            setFiltroGrado(alumnosMapeados[0].grado);
          }
        }
        if (datos.asistencia && datos.asistencia.length > 0) {
          const asistenciaMapeada: RegistroAsistencia[] = datos.asistencia.map((a: any) => ({
            id: a.id,
            alumnoId: a.alumnoId,
            fecha: a.fecha,
            estado: a.estado as EstadoAsistencia,
            bimestre: parseInt(a.modo) || parseInt(a.bimestre) || 1,
            horaRegistro: a.hora || a.horaRegistro || '',
          }));
          lsSet(LS_ASISTENCIA_REGISTRO, asistenciaMapeada);
          const bim = parseInt(filtroBimestre);
          setRegistrosAsistencia(asistenciaMapeada.filter(r => r.fecha === fecha && r.bimestre === bim));
        }
      } catch (e) {
        console.warn('No se pudo cargar datos de la nube, usando localStorage:', e);
      }
    };
    cargarDatos();
  }, []);

  useEffect(() => {
    const asistencia = lsGet<RegistroAsistencia[]>(LS_ASISTENCIA_REGISTRO, []);
    const refuerzo = lsGet<RegistroRefuerzo[]>(LS_REFUERZO_REGISTRO, []);
    const bim = parseInt(filtroBimestre);
    setRegistrosAsistencia(asistencia.filter(r => r.fecha === fecha && r.bimestre === bim));
    setRegistrosRefuerzo(refuerzo.filter(r => r.fecha === fecha && r.bimestre === bim));
  }, [fecha, filtroBimestre]);

  const mostrarGuardado = () => {
    setGuardado(true);
    setTimeout(() => setGuardado(false), 2500);
  };

  const marcarAsistencia = (alumnoId: string, estado: EstadoAsistencia) => {
    const todos = lsGet<RegistroAsistencia[]>(LS_ASISTENCIA_REGISTRO, []);
    const idx = todos.findIndex(r => r.alumnoId === alumnoId && r.fecha === fecha && r.bimestre === parseInt(filtroBimestre));
    if (idx >= 0) {
      todos[idx].estado = estado;
    } else {
      todos.push({
        alumnoId,
        fecha,
        estado,
        bimestre: parseInt(filtroBimestre),
        horaRegistro: new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })
      });
    }
    lsSet(LS_ASISTENCIA_REGISTRO, todos);
    const bim = parseInt(filtroBimestre);
    setRegistrosAsistencia(todos.filter(r => r.fecha === fecha && r.bimestre === bim));
    mostrarGuardado();
    sincronizarAsistencia(todos);
  };

  const eliminarAsistencia = (alumnoId: string) => {
    const todos = lsGet<RegistroAsistencia[]>(LS_ASISTENCIA_REGISTRO, []);
    const filtrados = todos.filter(r => !(r.alumnoId === alumnoId && r.fecha === fecha && r.bimestre === parseInt(filtroBimestre)));
    lsSet(LS_ASISTENCIA_REGISTRO, filtrados);
    const bim = parseInt(filtroBimestre);
    setRegistrosAsistencia(filtrados.filter(r => r.fecha === fecha && r.bimestre === bim));
    mostrarGuardado();
    sincronizarAsistencia(filtrados);
  };

  const marcarRefuerzo = (alumnoId: string, estado: EstadoRefuerzo) => {
    const todos = lsGet<RegistroRefuerzo[]>(LS_REFUERZO_REGISTRO, []);
    const idx = todos.findIndex(r => r.alumnoId === alumnoId && r.fecha === fecha && r.bimestre === parseInt(filtroBimestre));
    if (idx >= 0) {
      todos[idx].estado = estado;
      todos[idx].horaRegistro = new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
    } else {
      todos.push({
        alumnoId,
        fecha,
        estado,
        bimestre: parseInt(filtroBimestre),
        horaRegistro: new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }),
        seleccionado: true,
      });
    }
    lsSet(LS_REFUERZO_REGISTRO, todos);
    const bim = parseInt(filtroBimestre);
    setRegistrosRefuerzo(todos.filter(r => r.fecha === fecha && r.bimestre === bim));
    mostrarGuardado();
  };

  const eliminarRefuerzo = (alumnoId: string) => {
    const todos = lsGet<RegistroRefuerzo[]>(LS_REFUERZO_REGISTRO, []);
    const filtrados = todos.filter(r => !(r.alumnoId === alumnoId && r.fecha === fecha && r.bimestre === parseInt(filtroBimestre)));
    lsSet(LS_REFUERZO_REGISTRO, filtrados);
    const bim = parseInt(filtroBimestre);
    setRegistrosRefuerzo(filtrados.filter(r => r.fecha === fecha && r.bimestre === bim));
    mostrarGuardado();
  };

  const sincronizarAsistencia = async (registros: RegistroAsistencia[]) => {
    setSincronizando(true);
    try {
      const datosMapeados = registros.map(r => ({
        id: r.id || `ast-${r.alumnoId}-${r.fecha}-${r.bimestre}`,
        alumnoId: r.alumnoId,
        fecha: r.fecha,
        estado: r.estado,
        modo: String(r.bimestre),
        hora: r.horaRegistro || null,
      }));
      await guardarAsistencia(datosMapeados);
    } catch (e) {
      console.warn('No se pudo sincronizar asistencia con la nube:', e);
    } finally {
      setSincronizando(false);
    }
  };

  const getAsistencia = (alumnoId: string) => registrosAsistencia.find(r => r.alumnoId === alumnoId);
  const getRefuerzo = (alumnoId: string) => registrosRefuerzo.find(r => r.alumnoId === alumnoId);

  const estadoConfig: Record<EstadoAsistencia, { label: string; color: string; textColor: string; icon: string }> = {
    asistio: { label: 'Asistió', color: 'bg-emerald-600 hover:bg-emerald-700', textColor: 'text-emerald-100', icon: '✓' },
    falto: { label: 'Faltó', color: 'bg-red-600 hover:bg-red-700', textColor: 'text-red-100', icon: '✗' },
    retrasado: { label: 'Retrasado', color: 'bg-amber-600 hover:bg-amber-700', textColor: 'text-amber-100', icon: '⏰' },
    justifico: { label: 'Justificó', color: 'bg-blue-600 hover:bg-blue-700', textColor: 'text-blue-100', icon: '📄' },
    permiso: { label: 'Permiso', color: 'bg-violet-600 hover:bg-violet-700', textColor: 'text-violet-100', icon: '🔐' },
  };

  const refuerzoEstadoConfig: Record<EstadoRefuerzo, { label: string; color: string; textColor: string; icon: string }> = {
    asistio: { label: 'Asistió', color: 'bg-emerald-600 hover:bg-emerald-700', textColor: 'text-emerald-100', icon: '✓' },
    tardanza: { label: 'Tardanza', color: 'bg-amber-600 hover:bg-amber-700', textColor: 'text-amber-100', icon: '⏰' },
    falta: { label: 'Falta', color: 'bg-red-600 hover:bg-red-700', textColor: 'text-red-100', icon: '✗' },
    permiso: { label: 'Permiso', color: 'bg-violet-600 hover:bg-violet-700', textColor: 'text-violet-100', icon: '🔐' },
  };

  const statsAsistencia = useMemo(() => ({
    asistio: registrosAsistencia.filter(r => r.estado === 'asistio').length,
    falto: registrosAsistencia.filter(r => r.estado === 'falto').length,
    retrasado: registrosAsistencia.filter(r => r.estado === 'retrasado').length,
    justifico: registrosAsistencia.filter(r => r.estado === 'justifico').length,
    permiso: registrosAsistencia.filter(r => r.estado === 'permiso').length,
  }), [registrosAsistencia]);

  const statsRefuerzo = useMemo(() => ({
    asistio: registrosRefuerzo.filter(r => r.estado === 'asistio').length,
    tardanza: registrosRefuerzo.filter(r => r.estado === 'tardanza').length,
    falta: registrosRefuerzo.filter(r => r.estado === 'falta').length,
    permiso: registrosRefuerzo.filter(r => r.estado === 'permiso').length,
  }), [registrosRefuerzo]);

  const cursoLabel = filtroCurso || 'Todos los cursos';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6">
      <div className="fixed inset-0 -z-50">
        <div className="absolute inset-0 bg-gradient-cyber opacity-60"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto space-y-6">
        <HeaderElegante icon={Clock} title="EDUGEST REGISTRO DE ASISTENCIA" subtitle="Control diario y registro de refuerzo" />

        {/* Pestañas */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3">
          {[
            { id: 'asistencia', label: '📋 Registro de Asistencia' },
            { id: 'refuerzo', label: '🎯 Registro de Refuerzo' }
          ].map(tab => (
            <motion.button
              key={tab.id}
              onClick={() => setSeccion(tab.id as any)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
                seccion === tab.id
                  ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-500/50'
                  : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50'
              }`}
            >
              {tab.label}
            </motion.button>
          ))}
        </motion.div>

        {/* FILTROS */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 backdrop-blur-sm space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-xs uppercase font-semibold text-slate-400 mb-2 block">Grado</label>
              <select
                value={filtroGrado}
                onChange={(e) => {
                  setFiltroGrado(e.target.value);
                  setFiltroSeccion('');
                }}
                className="w-full px-4 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white focus:border-cyan-500 focus:ring-cyan-500/20 text-sm"
              >
                <option value="">Seleccionar grado</option>
                {grados.map(g => <option key={g} value={g}>{g}°</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs uppercase font-semibold text-slate-400 mb-2 block">Sección</label>
              <select
                value={filtroSeccion}
                onChange={(e) => setFiltroSeccion(e.target.value)}
                disabled={!filtroGrado}
                className="w-full px-4 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white focus:border-cyan-500 focus:ring-cyan-500/20 text-sm disabled:opacity-50"
              >
                <option value="">Todas las secciones</option>
                {secciones.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs uppercase font-semibold text-slate-400 mb-2 block">Bimestre</label>
              <select
                value={filtroBimestre}
                onChange={(e) => setFiltroBimestre(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white focus:border-cyan-500 focus:ring-cyan-500/20 text-sm"
              >
                <option value="1">I Bimestre</option>
                <option value="2">II Bimestre</option>
                <option value="3">III Bimestre</option>
                <option value="4">IV Bimestre</option>
              </select>
            </div>
            <div>
              <label className="text-xs uppercase font-semibold text-slate-400 mb-2 block">Fecha</label>
              <input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white focus:border-cyan-500 focus:ring-cyan-500/20 text-sm"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-3">
              <label className="text-xs uppercase font-semibold text-slate-400 mb-2 block">Curso</label>
              <select
                value={filtroCurso}
                onChange={(e) => setFiltroCurso(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white focus:border-cyan-500 focus:ring-cyan-500/20 text-sm"
              >
                <option value="">Todos los cursos</option>
                {CURSOS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            {guardado && (
              <div className="flex items-center justify-center bg-emerald-900/30 border border-emerald-600 rounded-lg col-span-1">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-emerald-100 font-semibold text-sm">
                  {sincronizando ? '⏳ Sincronizando...' : '✓ Guardado'}
                </motion.div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Info Sesión */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-wrap items-center justify-between gap-4 px-6 py-3 bg-slate-800/40 border border-slate-700 rounded-lg">
          <div className="text-sm text-slate-300">
            <span className="font-semibold text-cyan-400">{filtroGrado || '—'}°</span>
            {filtroSeccion && <span className="ml-2">Sección <span className="font-semibold text-cyan-400">{filtroSeccion}</span></span>}
          </div>
          <div className="text-sm text-slate-300">
            Bimestre <span className="font-semibold text-cyan-400">{filtroBimestre}</span> •
            Curso <span className="font-semibold text-cyan-400">{cursoLabel}</span>
          </div>
          <div className="text-sm text-slate-400">
            📅 {new Date(fecha).toLocaleDateString('es-PE')}
          </div>
        </motion.div>

        {/* ======================== SECCIÓN ASISTENCIA ======================== */}
        <AnimatePresence mode="wait">
          {seccion === 'asistencia' && (
            <motion.div key="asistencia" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              {/* Estadísticas */}
              <motion.div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {Object.entries(estadoConfig).map(([key, config]) => (
                  <motion.div
                    key={key}
                    whileHover={{ scale: 1.05 }}
                    className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 text-center backdrop-blur-sm"
                  >
                    <p className="text-2xl font-bold">{statsAsistencia[key as EstadoAsistencia]}</p>
                    <p className="text-xs text-slate-400 mt-1">{config.label}</p>
                  </motion.div>
                ))}
              </motion.div>

              {/* Lista de Alumnos - todos visibles, sin checkboxes */}
              <motion.div className="bg-slate-800/50 border border-slate-700 rounded-lg backdrop-blur-sm overflow-hidden">
                <div className="px-4 py-2 bg-slate-700/30 border-b border-slate-600">
                  <span className="text-xs font-semibold text-slate-400 uppercase">Total alumnos: {alumnosFiltrados.length}</span>
                </div>
                <div className="max-h-[60vh] overflow-y-auto">
                  <AnimatePresence>
                    {alumnosFiltrados.length === 0 ? (
                      <div className="p-8 text-center text-slate-400">
                        Selecciona grado y sección para ver alumnos
                      </div>
                    ) : (
                      alumnosFiltrados.map((alumno, idx) => {
                        const asistencia = getAsistencia(alumno.id);
                        return (
                          <motion.div
                            key={alumno.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ delay: idx * 0.02 }}
                            className="border-b border-slate-700 last:border-0 p-4 hover:bg-slate-700/20 transition-colors"
                          >
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-white truncate">{alumno.apellidos_nombres}</p>
                                <p className="text-xs text-slate-400">{alumno.grado}° - Sección {alumno.seccion}</p>
                              </div>

                              {asistencia ? (
                                <motion.div className="flex items-center gap-1" initial={{ scale: 0.8 }} animate={{ scale: 1 }}>
                                  {Object.entries(estadoConfig).map(([key, config]) => (
                                    <motion.button
                                      key={key}
                                      whileHover={{ scale: 1.1 }}
                                      whileTap={{ scale: 0.95 }}
                                      onClick={() => marcarAsistencia(alumno.id, key as EstadoAsistencia)}
                                      title={config.label}
                                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                                        asistencia.estado === key
                                          ? `${config.color} ${config.textColor} ring-2 ring-white/40`
                                          : 'bg-slate-700/60 text-slate-400 hover:bg-slate-600/60'
                                      }`}
                                    >
                                      {config.icon}
                                    </motion.button>
                                  ))}
                                  <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => eliminarAsistencia(alumno.id)}
                                    className="px-2.5 py-1 rounded-lg bg-red-900/30 text-red-300 hover:bg-red-900/50 text-xs font-semibold ml-1"
                                    title="Limpiar"
                                  >
                                    ✕
                                  </motion.button>
                                </motion.div>
                              ) : (
                                <div className="flex gap-1 flex-wrap justify-end">
                                  {Object.entries(estadoConfig).map(([key, config]) => (
                                    <motion.button
                                      key={key}
                                      whileHover={{ scale: 1.1 }}
                                      whileTap={{ scale: 0.95 }}
                                      onClick={() => marcarAsistencia(alumno.id, key as EstadoAsistencia)}
                                      title={config.label}
                                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${config.color} ${config.textColor}`}
                                    >
                                      {config.icon}
                                    </motion.button>
                                  ))}
                                </div>
                              )}
                            </div>
                          </motion.div>
                        );
                      })
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ======================== SECCIÓN REFUERZO ======================== */}
        <AnimatePresence mode="wait">
          {seccion === 'refuerzo' && (
            <motion.div key="refuerzo" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">

              {/* Estadísticas Refuerzo */}
              <motion.div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.entries(refuerzoEstadoConfig).map(([key, config]) => (
                  <motion.div
                    key={key}
                    whileHover={{ scale: 1.05 }}
                    className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 text-center backdrop-blur-sm"
                  >
                    <p className="text-2xl font-bold">{statsRefuerzo[key as EstadoRefuerzo]}</p>
                    <p className="text-xs text-slate-400 mt-1">{config.label}</p>
                  </motion.div>
                ))}
              </motion.div>

              {/* FASE 1: Selección de alumnos para refuerzo */}
              <motion.div className="bg-slate-800/50 border border-cyan-800/50 rounded-lg backdrop-blur-sm overflow-hidden">
                <div className="flex items-center justify-between gap-3 px-4 py-3 bg-cyan-900/20 border-b border-cyan-700/40">
                  <div>
                    <span className="text-sm font-bold text-cyan-300 uppercase">Paso 1: Seleccionar alumnos del programa de refuerzo</span>
                    <span className="ml-3 text-xs text-slate-400">({alumnosSeleccionadosRefuerzo.length} seleccionados de {alumnosFiltrados.length})</span>
                  </div>
                  <div className="flex gap-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={seleccionarTodosRefuerzo}
                      className="flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold bg-cyan-900/30 text-cyan-300 hover:bg-cyan-800/40 border border-cyan-700/40"
                    >
                      <CheckCircle2 className="w-3 h-3" /> Todos
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={deseleccionarTodosRefuerzo}
                      className="flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold bg-slate-700/50 text-slate-400 hover:bg-slate-600/50 border border-slate-600"
                    >
                      <XCircle className="w-3 h-3" /> Ninguno
                    </motion.button>
                  </div>
                </div>
                <div className="max-h-[30vh] overflow-y-auto">
                  <AnimatePresence>
                    {alumnosFiltrados.length === 0 ? (
                      <div className="p-6 text-center text-slate-400">
                        Selecciona grado y sección para ver alumnos
                      </div>
                    ) : (
                      alumnosFiltrados.map((alumno, idx) => {
                        const seleccionado = seleccionRefuerzo.has(alumno.id);
                        return (
                          <motion.div
                            key={alumno.id}
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            transition={{ delay: idx * 0.015 }}
                            className={`border-b border-slate-700/50 last:border-0 px-4 py-2.5 flex items-center gap-3 transition-colors cursor-pointer ${
                              seleccionado ? 'bg-cyan-900/15 hover:bg-cyan-900/25' : 'hover:bg-slate-700/20'
                            }`}
                            onClick={() => toggleSeleccionRefuerzo(alumno.id)}
                          >
                            {seleccionado ? (
                              <CheckSquare className="w-5 h-5 text-cyan-400 flex-shrink-0" />
                            ) : (
                              <Square className="w-5 h-5 text-slate-500 flex-shrink-0" />
                            )}
                            <div className="min-w-0 flex-1">
                              <p className={`font-semibold text-sm truncate ${seleccionado ? 'text-white' : 'text-slate-400'}`}>
                                {alumno.apellidos_nombres}
                              </p>
                            </div>
                            <span className="text-xs text-slate-500">{alumno.grado}° - {alumno.seccion}</span>
                          </motion.div>
                        );
                      })
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>

              {/* FASE 2: Registro de asistencia para los seleccionados */}
              {alumnosSeleccionadosRefuerzo.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-slate-800/50 border border-emerald-800/50 rounded-lg backdrop-blur-sm overflow-hidden"
                >
                  <div className="px-4 py-3 bg-emerald-900/20 border-b border-emerald-700/40">
                    <span className="text-sm font-bold text-emerald-300 uppercase">Paso 2: Registrar asistencia de refuerzo</span>
                    <span className="ml-3 text-xs text-slate-400">({alumnosSeleccionadosRefuerzo.length} alumnos)</span>
                  </div>
                  <div className="max-h-[40vh] overflow-y-auto">
                    <AnimatePresence>
                      {alumnosSeleccionadosRefuerzo.map((alumno, idx) => {
                        const refuerzo = getRefuerzo(alumno.id);
                        return (
                          <motion.div
                            key={alumno.id}
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            transition={{ delay: idx * 0.02 }}
                            className="border-b border-slate-700/50 last:border-0 p-4 hover:bg-slate-700/20 transition-colors"
                          >
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-white truncate">{alumno.apellidos_nombres}</p>
                                <p className="text-xs text-slate-400">{alumno.grado}° - Sección {alumno.seccion}</p>
                              </div>

                              {refuerzo ? (
                                <motion.div className="flex items-center gap-1" initial={{ scale: 0.8 }} animate={{ scale: 1 }}>
                                  {Object.entries(refuerzoEstadoConfig).map(([key, config]) => (
                                    <motion.button
                                      key={key}
                                      whileHover={{ scale: 1.1 }}
                                      whileTap={{ scale: 0.95 }}
                                      onClick={() => marcarRefuerzo(alumno.id, key as EstadoRefuerzo)}
                                      title={config.label}
                                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                        refuerzo.estado === key
                                          ? `${config.color} ${config.textColor} ring-2 ring-white/40`
                                          : 'bg-slate-700/60 text-slate-400 hover:bg-slate-600/60'
                                      }`}
                                    >
                                      {config.icon} {config.label}
                                    </motion.button>
                                  ))}
                                  <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => eliminarRefuerzo(alumno.id)}
                                    className="px-2.5 py-1.5 rounded-lg bg-red-900/30 text-red-300 hover:bg-red-900/50 text-xs font-semibold ml-1"
                                    title="Limpiar"
                                  >
                                    ✕
                                  </motion.button>
                                </motion.div>
                              ) : (
                                <div className="flex gap-1 flex-wrap justify-end">
                                  {Object.entries(refuerzoEstadoConfig).map(([key, config]) => (
                                    <motion.button
                                      key={key}
                                      whileHover={{ scale: 1.1 }}
                                      whileTap={{ scale: 0.95 }}
                                      onClick={() => marcarRefuerzo(alumno.id, key as EstadoRefuerzo)}
                                      title={config.label}
                                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${config.color} ${config.textColor}`}
                                    >
                                      {config.icon} {config.label}
                                    </motion.button>
                                  ))}
                                </div>
                              )}
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                </motion.div>
              )}

              {alumnosSeleccionadosRefuerzo.length === 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-slate-800/30 border border-slate-700 rounded-lg p-8 text-center"
                >
                  <p className="text-slate-400 text-sm">Selecciona alumnos en el Paso 1 para registrar su asistencia de refuerzo</p>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
