import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect } from 'react';
import { Clock, Eye, EyeOff } from 'lucide-react';
import HeaderElegante from '../components/HeaderElegante';

type EstadoAsistencia = 'asistio' | 'falto' | 'retrasado' | 'justifico' | 'permiso';

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
  alumnoId: string;
  fecha: string;
  bimestre: number;
  participa: boolean;
}

import { cargarTodo, guardarAsistencia } from '../utils/apiClient';

// Helper para localStorage
function lsGet<T>(key: string, def: T): T {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : def; } catch { return def; }
}
const LS_ALUMNOS = 'ie_alumnos';
const LS_ASISTENCIA_REGISTRO = 'ie_asistencia';
const LS_REFUERZO_REGISTRO = 'ie_refuerzo';

// Configuración de cursos
const CURSOS = ['Comunicación', 'Matemática', 'Ciencia y Tecnología', 'Historia', 'Inglés', 'Educación Física', 'Arte', 'Tutoría'];

export default function AttendanceScreen() {
  const [seccion, setSeccion] = useState<'asistencia' | 'refuerzo'>('asistencia');
  const [alumnos, setAlumnos] = useState<Alumno[]>([]);
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [registrosAsistencia, setRegistrosAsistencia] = useState<RegistroAsistencia[]>([]);
  const [registrosRefuerzo, setRegistrosRefuerzo] = useState<RegistroRefuerzo[]>([]);

  // Filtros
  const [filtroGrado, setFiltroGrado] = useState('');
  const [filtroSeccion, setFiltroSeccion] = useState('');
  const [filtroBimestre, setFiltroBimestre] = useState('1');
  const [filtroCurso, setFiltroCurso] = useState('');

  const [guardado, setGuardado] = useState(false);

  useEffect(() => {
    const lista = lsGet<Alumno[]>(LS_ALUMNOS, []);
    setAlumnos(lista);
    if (lista.length > 0) {
      setFiltroGrado(lista[0].grado);
    }
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

  const grados = [...new Set(alumnos.map(a => a.grado))].sort();
  const secciones = filtroGrado ? [...new Set(alumnos.filter(a => a.grado === filtroGrado).map(a => a.seccion))].sort() : [];

  const alumnosFiltrados = alumnos.filter(a =>
    (!filtroGrado || a.grado === filtroGrado) &&
    (!filtroSeccion || a.seccion === filtroSeccion)
  );

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
  };

  const eliminarAsistencia = (alumnoId: string) => {
    const todos = lsGet<RegistroAsistencia[]>(LS_ASISTENCIA_REGISTRO, []);
    const filtrados = todos.filter(r => !(r.alumnoId === alumnoId && r.fecha === fecha && r.bimestre === parseInt(filtroBimestre)));
    lsSet(LS_ASISTENCIA_REGISTRO, filtrados);
    const bim = parseInt(filtroBimestre);
    setRegistrosAsistencia(filtrados.filter(r => r.fecha === fecha && r.bimestre === bim));
    mostrarGuardado();
  };

  const toggleRefuerzo = (alumnoId: string) => {
    const todos = lsGet<RegistroRefuerzo[]>(LS_REFUERZO_REGISTRO, []);
    const idx = todos.findIndex(r => r.alumnoId === alumnoId && r.fecha === fecha && r.bimestre === parseInt(filtroBimestre));
    if (idx >= 0) {
      todos[idx].participa = !todos[idx].participa;
    } else {
      todos.push({
        alumnoId,
        fecha,
        bimestre: parseInt(filtroBimestre),
        participa: true
      });
    }
    lsSet(LS_REFUERZO_REGISTRO, todos);
    const bim = parseInt(filtroBimestre);
    setRegistrosRefuerzo(todos.filter(r => r.fecha === fecha && r.bimestre === bim));
    mostrarGuardado();
  };

  const getAsistencia = (alumnoId: string) => registrosAsistencia.find(r => r.alumnoId === alumnoId);
  const getRefuerzo = (alumnoId: string) => registrosRefuerzo.find(r => r.alumnoId === alumnoId);

  const estadoConfig = {
    asistio: { label: 'Asistió', color: 'bg-emerald-600 hover:bg-emerald-700', textColor: 'text-emerald-100', icon: '✓' },
    falto: { label: 'Faltó', color: 'bg-red-600 hover:bg-red-700', textColor: 'text-red-100', icon: '✗' },
    retrasado: { label: 'Retrasado', color: 'bg-amber-600 hover:bg-amber-700', textColor: 'text-amber-100', icon: '⏰' },
    justifico: { label: 'Justificó', color: 'bg-blue-600 hover:bg-blue-700', textColor: 'text-blue-100', icon: '📄' },
    permiso: { label: 'Permiso', color: 'bg-violet-600 hover:bg-violet-700', textColor: 'text-violet-100', icon: '🔐' },
  };

  const statsAsistencia = {
    asistio: registrosAsistencia.filter(r => r.estado === 'asistio').length,
    falto: registrosAsistencia.filter(r => r.estado === 'falto').length,
    retrasado: registrosAsistencia.filter(r => r.estado === 'retrasado').length,
    justifico: registrosAsistencia.filter(r => r.estado === 'justifico').length,
    permiso: registrosAsistencia.filter(r => r.estado === 'permiso').length,
  };

  const statsRefuerzo = {
    participa: registrosRefuerzo.filter(r => r.participa).length,
    noParticipa: registrosRefuerzo.filter(r => !r.participa).length,
  };

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

        {/* FILTROS PRINCIPALES */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 backdrop-blur-sm space-y-4">
          {/* Fila 1: Grado, Sección, Bimestre */}
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

          {/* Fila 2: Curso y Guardado */}
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
                  ✓ Guardado
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

        {/* SECCIÓN ASISTENCIA */}
        <AnimatePresence mode="wait">
          {seccion === 'asistencia' && (
            <motion.div key="asistencia" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              {/* Estadísticas */}
              <motion.div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {Object.entries(estadoConfig).map(([key, config]: any) => (
                  <motion.div
                    key={key}
                    whileHover={{ scale: 1.05 }}
                    className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 text-center backdrop-blur-sm"
                  >
                    <p className="text-2xl font-bold">{statsAsistencia[key as keyof typeof statsAsistencia]}</p>
                    <p className="text-xs text-slate-400 mt-1">{config.label}</p>
                  </motion.div>
                ))}
              </motion.div>

              {/* Lista de Alumnos */}
              <motion.div className="bg-slate-800/50 border border-slate-700 rounded-lg backdrop-blur-sm overflow-hidden">
                <div className="max-h-[65vh] overflow-y-auto">
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
                            className="border-b border-slate-700 last:border-0 p-4 hover:bg-slate-700/30 transition-colors"
                          >
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-white truncate">{alumno.apellidos_nombres}</p>
                                <p className="text-xs text-slate-400">{alumno.grado}° - Sección {alumno.seccion}</p>
                              </div>

                              {asistencia ? (
                                <motion.div className="flex items-center gap-2" initial={{ scale: 0.8 }} animate={{ scale: 1 }}>
                                  <div className={`px-3 py-1 rounded-lg text-xs font-semibold ${estadoConfig[asistencia.estado].color} ${estadoConfig[asistencia.estado].textColor}`}>
                                    {estadoConfig[asistencia.estado].label}
                                  </div>
                                  <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => eliminarAsistencia(alumno.id)}
                                    className="px-3 py-1 rounded-lg bg-red-900/30 text-red-300 hover:bg-red-900/50 text-xs font-semibold"
                                  >
                                    Limpiar
                                  </motion.button>
                                </motion.div>
                              ) : (
                                <div className="flex gap-1 flex-wrap justify-end">
                                  {Object.entries(estadoConfig).map(([key, config]: any) => (
                                    <motion.button
                                      key={key}
                                      whileHover={{ scale: 1.1 }}
                                      whileTap={{ scale: 0.95 }}
                                      onClick={() => marcarAsistencia(alumno.id, key)}
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

        {/* SECCIÓN REFUERZO */}
        <AnimatePresence mode="wait">
          {seccion === 'refuerzo' && (
            <motion.div key="refuerzo" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              {/* Estadísticas Refuerzo */}
              <motion.div className="grid grid-cols-2 gap-3">
                <motion.div whileHover={{ scale: 1.05 }} className="bg-emerald-900/30 border border-emerald-600 rounded-lg p-4 text-center backdrop-blur-sm">
                  <p className="text-2xl font-bold text-emerald-100">{statsRefuerzo.participa}</p>
                  <p className="text-xs text-emerald-300 mt-1">Participan</p>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} className="bg-slate-700/50 border border-slate-600 rounded-lg p-4 text-center backdrop-blur-sm">
                  <p className="text-2xl font-bold text-slate-200">{statsRefuerzo.noParticipa}</p>
                  <p className="text-xs text-slate-400 mt-1">No Participan</p>
                </motion.div>
              </motion.div>

              {/* Lista Refuerzo */}
              <motion.div className="bg-slate-800/50 border border-slate-700 rounded-lg backdrop-blur-sm overflow-hidden">
                <div className="max-h-[65vh] overflow-y-auto">
                  <AnimatePresence>
                    {alumnosFiltrados.length === 0 ? (
                      <div className="p-8 text-center text-slate-400">
                        Selecciona grado y sección para ver alumnos
                      </div>
                    ) : (
                      alumnosFiltrados.map((alumno, idx) => {
                        const refuerzo = getRefuerzo(alumno.id);
                        const participa = refuerzo?.participa ?? false;
                        return (
                          <motion.div
                            key={alumno.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ delay: idx * 0.02 }}
                            className={`border-b border-slate-700 last:border-0 p-4 transition-all ${participa ? 'bg-slate-700/20' : 'opacity-60 bg-slate-800/30'}`}
                          >
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <p className={`font-semibold truncate ${participa ? 'text-white' : 'text-slate-400'}`}>
                                  {alumno.apellidos_nombres}
                                </p>
                                <p className="text-xs text-slate-400">{alumno.grado}° - Sección {alumno.seccion}</p>
                              </div>

                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => toggleRefuerzo(alumno.id)}
                                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                                  participa
                                    ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                }`}
                              >
                                {participa ? (
                                  <span className="flex items-center gap-2">
                                    <Eye className="w-4 h-4" /> Participa
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-2">
                                    <EyeOff className="w-4 h-4" /> No Participa
                                  </span>
                                )}
                              </motion.button>
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
      </div>
    </div>
  );
}
