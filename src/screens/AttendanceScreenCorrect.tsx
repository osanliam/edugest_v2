import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, FileText, Lock, Eye, EyeOff } from 'lucide-react';
import HeaderElegante from '../components/HeaderElegante';

type EstadoAsistencia = 'asistio' | 'falto' | 'justifico' | 'permiso';
type SeccionLista = 'asistencia' | 'refuerzo';

interface Alumno {
  id: string;
  apellidos_nombres: string;
  grado: string;
  seccion: string;
}

interface RegistroAsistencia {
  alumnoId: string;
  fecha: string;
  estado: EstadoAsistencia;
  observaciones?: string;
}

interface RegistroRefuerzo {
  alumnoId: string;
  fecha: string;
  participa: boolean;
}

const LS_ALUMNOS = 'ie_alumnos';
const LS_ASISTENCIA_REGISTRO = 'ie_asistencia_registro_v2';
const LS_REFUERZO_REGISTRO = 'ie_refuerzo_registro_v2';

function lsGet<T>(key: string, def: T): T {
  try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(def)); } catch { return def; }
}

function lsSet(key: string, val: any) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) { console.error('Error guardando:', e); }
}

export default function AttendanceScreen() {
  const [seccionActiva, setSeccionActiva] = useState<SeccionLista>('asistencia');
  const [alumnos, setAlumnos] = useState<Alumno[]>([]);
  const [fechaActual, setFechaActual] = useState(new Date().toISOString().split('T')[0]);
  const [registrosAsistencia, setRegistrosAsistencia] = useState<RegistroAsistencia[]>([]);
  const [registrosRefuerzo, setRegistrosRefuerzo] = useState<RegistroRefuerzo[]>([]);
  const [filtroGrado, setFiltroGrado] = useState('');
  const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'err'; texto: string } | null>(null);

  useEffect(() => {
    const lista = lsGet<Alumno[]>(LS_ALUMNOS, []);
    setAlumnos(lista);
  }, []);

  useEffect(() => {
    const asistencia = lsGet<RegistroAsistencia[]>(LS_ASISTENCIA_REGISTRO, []);
    const refuerzo = lsGet<RegistroRefuerzo[]>(LS_REFUERZO_REGISTRO, []);
    setRegistrosAsistencia(asistencia.filter(r => r.fecha === fechaActual));
    setRegistrosRefuerzo(refuerzo.filter(r => r.fecha === fechaActual));
  }, [fechaActual]);

  const mostrar = (tipo: 'ok' | 'err', texto: string) => {
    setMensaje({ tipo, texto });
    setTimeout(() => setMensaje(null), 3500);
  };

  const grados = [...new Set(alumnos.map(a => a.grado))].sort();
  const alumnosFiltrados = filtroGrado ? alumnos.filter(a => a.grado === filtroGrado) : alumnos;

  const handleMarcarAsistencia = (alumnoId: string, estado: EstadoAsistencia) => {
    const todos = lsGet<RegistroAsistencia[]>(LS_ASISTENCIA_REGISTRO, []);
    const idx = todos.findIndex(r => r.alumnoId === alumnoId && r.fecha === fechaActual);
    if (idx >= 0) {
      todos[idx].estado = estado;
    } else {
      todos.push({ alumnoId, fecha: fechaActual, estado });
    }
    lsSet(LS_ASISTENCIA_REGISTRO, todos);
    setRegistrosAsistencia(todos.filter(r => r.fecha === fechaActual));
    mostrar('ok', `Registro actualizado`);
  };

  const handleEliminarAsistencia = (alumnoId: string) => {
    const todos = lsGet<RegistroAsistencia[]>(LS_ASISTENCIA_REGISTRO, []);
    const filtrados = todos.filter(r => !(r.alumnoId === alumnoId && r.fecha === fechaActual));
    lsSet(LS_ASISTENCIA_REGISTRO, filtrados);
    setRegistrosAsistencia(filtrados.filter(r => r.fecha === fechaActual));
    mostrar('ok', 'Registro eliminado');
  };

  const handleToggleRefuerzo = (alumnoId: string) => {
    const todos = lsGet<RegistroRefuerzo[]>(LS_REFUERZO_REGISTRO, []);
    const idx = todos.findIndex(r => r.alumnoId === alumnoId && r.fecha === fechaActual);
    if (idx >= 0) {
      todos[idx].participa = !todos[idx].participa;
    } else {
      todos.push({ alumnoId, fecha: fechaActual, participa: true });
    }
    lsSet(LS_REFUERZO_REGISTRO, todos);
    setRegistrosRefuerzo(todos.filter(r => r.fecha === fechaActual));
  };

  const getRegistroAsistencia = (alumnoId: string) => registrosAsistencia.find(r => r.alumnoId === alumnoId);
  const getRegistroRefuerzo = (alumnoId: string) => registrosRefuerzo.find(r => r.alumnoId === alumnoId);

  const statsAsistencia = {
    asistio: registrosAsistencia.filter(r => r.estado === 'asistio').length,
    falto: registrosAsistencia.filter(r => r.estado === 'falto').length,
    justifico: registrosAsistencia.filter(r => r.estado === 'justifico').length,
    permiso: registrosAsistencia.filter(r => r.estado === 'permiso').length,
  };

  const statsRefuerzo = {
    participa: registrosRefuerzo.filter(r => r.participa).length,
    noParticipa: registrosRefuerzo.filter(r => !r.participa).length,
  };

  const getEstadoColor = (estado: EstadoAsistencia) => {
    switch (estado) {
      case 'asistio': return 'bg-emerald-900 text-emerald-100 border-emerald-600';
      case 'falto': return 'bg-red-900 text-red-100 border-red-600';
      case 'justifico': return 'bg-blue-900 text-blue-100 border-blue-600';
      case 'permiso': return 'bg-amber-800 text-amber-100 border-amber-600';
    }
  };

  const getEstadoLabel = (estado: EstadoAsistencia) => {
    switch (estado) {
      case 'asistio': return 'Asistió';
      case 'falto': return 'Faltó';
      case 'justifico': return 'Justificó';
      case 'permiso': return 'Permiso';
    }
  };

  const getEstadoIcon = (estado: EstadoAsistencia) => {
    switch (estado) {
      case 'asistio': return <CheckCircle className="w-5 h-5" />;
      case 'falto': return <XCircle className="w-5 h-5" />;
      case 'justifico': return <FileText className="w-5 h-5" />;
      case 'permiso': return <Lock className="w-5 h-5" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden p-6">
      <div className="fixed inset-0 -z-50">
        <div className="absolute inset-0 bg-gradient-cyber opacity-60"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto space-y-8">
        <HeaderElegante
          icon={CheckCircle}
          title="EDUGEST ASISTENCIA"
          subtitle={`Registro - ${fechaActual}`}
        />

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
          <label className="text-sm font-semibold text-cyan-300 uppercase tracking-widest">Seleccionar Fecha</label>
          <input
            type="date"
            value={fechaActual}
            onChange={e => setFechaActual(e.target.value)}
            className="w-full md:w-64 bg-slate-800 border border-slate-600 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50"
          />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3">
          {(['asistencia', 'refuerzo'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setSeccionActiva(tab)}
              className={`flex-1 md:flex-none px-6 py-3 rounded-lg font-bold transition-all ${
                seccionActiva === tab
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/40'
                  : 'bg-slate-800 border border-slate-600 text-slate-300 hover:border-slate-500'
              }`}
            >
              {tab === 'asistencia' ? '📋 Registro de Asistencia' : '🎯 Registro de Refuerzo'}
            </button>
          ))}
        </motion.div>

        <AnimatePresence>
          {mensaje && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`p-3 rounded-lg text-sm font-medium ${
                mensaje.tipo === 'ok'
                  ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
                  : 'bg-red-500/20 border border-red-500/40 text-red-300'
              }`}
            >
              {mensaje.texto}
            </motion.div>
          )}
        </AnimatePresence>

        {seccionActiva === 'asistencia' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Asistió', valor: statsAsistencia.asistio, color: 'emerald', icon: CheckCircle },
                { label: 'Faltó', valor: statsAsistencia.falto, color: 'red', icon: XCircle },
                { label: 'Justificó', valor: statsAsistencia.justifico, color: 'blue', icon: FileText },
                { label: 'Permiso', valor: statsAsistencia.permiso, color: 'amber', icon: Lock },
              ].map((stat, i) => (
                <motion.div key={i} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.1 }} className={`bg-slate-800/80 border border-${stat.color}-600/50 rounded-xl p-4 text-center`}>
                  <stat.icon className={`w-6 h-6 text-${stat.color}-400 mx-auto mb-2`} />
                  <p className={`text-2xl font-black text-${stat.color}-300`}>{stat.valor}</p>
                  <p className="text-xs text-slate-400 mt-1">{stat.label}</p>
                </motion.div>
              ))}
            </div>

            <div className="space-y-3">
              <p className="text-sm font-semibold text-cyan-300 uppercase tracking-widest">Filtrar por Grado</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setFiltroGrado('')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    filtroGrado === ''
                      ? 'bg-cyan-600 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  Todos
                </button>
                {grados.map(grado => (
                  <button
                    key={grado}
                    onClick={() => setFiltroGrado(grado)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      filtroGrado === grado
                        ? 'bg-cyan-600 text-white'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    {grado}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              {alumnosFiltrados.map((alumno, i) => {
                const registro = getRegistroAsistencia(alumno.id);
                return (
                  <motion.div key={alumno.id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.02 }} className="bg-slate-800/80 border border-slate-700 rounded-xl p-4 flex items-center justify-between gap-4 hover:border-cyan-500/50 transition-all">
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold">{alumno.apellidos_nombres}</p>
                      <p className="text-xs text-slate-400">{alumno.grado}° "{alumno.seccion}"</p>
                    </div>
                    {registro ? (
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          {getEstadoIcon(registro.estado)}
                          <span className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${getEstadoColor(registro.estado)}`}>
                            {getEstadoLabel(registro.estado)}
                          </span>
                        </div>
                        <button onClick={() => handleEliminarAsistencia(alumno.id)} className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-all text-sm">
                          Limpiar
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <button onClick={() => handleMarcarAsistencia(alumno.id, 'asistio')} className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-sm transition-all" title="Asistió">
                          ✓
                        </button>
                        <button onClick={() => handleMarcarAsistencia(alumno.id, 'falto')} className="px-3 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg text-sm transition-all" title="Faltó">
                          ✗
                        </button>
                        <button onClick={() => handleMarcarAsistencia(alumno.id, 'justifico')} className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-sm transition-all" title="Justificó">
                          📄
                        </button>
                        <button onClick={() => handleMarcarAsistencia(alumno.id, 'permiso')} className="px-3 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg text-sm transition-all" title="Permiso">
                          🔐
                        </button>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {seccionActiva === 'refuerzo' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Participa', valor: statsRefuerzo.participa, color: 'emerald', icon: Eye },
                { label: 'No Participa', valor: statsRefuerzo.noParticipa, color: 'slate', icon: EyeOff },
              ].map((stat, i) => (
                <motion.div key={i} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.1 }} className={`bg-slate-800/80 border border-${stat.color}-600/50 rounded-xl p-4 text-center`}>
                  <stat.icon className={`w-6 h-6 text-${stat.color}-400 mx-auto mb-2`} />
                  <p className={`text-2xl font-black text-${stat.color}-300`}>{stat.valor}</p>
                  <p className="text-xs text-slate-400 mt-1">{stat.label}</p>
                </motion.div>
              ))}
            </div>

            <div className="space-y-3">
              <p className="text-sm font-semibold text-cyan-300 uppercase tracking-widest">Filtrar por Grado</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setFiltroGrado('')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    filtroGrado === ''
                      ? 'bg-cyan-600 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  Todos
                </button>
                {grados.map(grado => (
                  <button
                    key={grado}
                    onClick={() => setFiltroGrado(grado)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      filtroGrado === grado
                        ? 'bg-cyan-600 text-white'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    {grado}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              {alumnosFiltrados.map((alumno, i) => {
                const registro = getRegistroRefuerzo(alumno.id);
                const participa = registro?.participa ?? false;
                return (
                  <motion.div key={alumno.id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.02 }} className={`rounded-xl p-4 flex items-center justify-between gap-4 transition-all border ${
                    participa
                      ? 'bg-emerald-900/30 border-emerald-600/50 hover:border-emerald-500/70'
                      : 'bg-slate-800/50 border-slate-700 opacity-60 hover:opacity-100 hover:border-slate-600'
                  }`}>
                    <div className="flex-1 min-w-0">
                      <p className={`font-semibold ${participa ? 'text-white' : 'text-slate-400'}`}>
                        {alumno.apellidos_nombres}
                      </p>
                      <p className="text-xs text-slate-400">{alumno.grado}° "{alumno.seccion}"</p>
                    </div>
                    <button
                      onClick={() => handleToggleRefuerzo(alumno.id)}
                      className={`px-4 py-2.5 rounded-lg font-bold transition-all flex items-center gap-2 ${
                        participa
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                          : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                      }`}
                    >
                      {participa ? (
                        <>
                          <Eye size={18} /> Participa
                        </>
                      ) : (
                        <>
                          <EyeOff size={18} /> Oculto
                        </>
                      )}
                    </button>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
