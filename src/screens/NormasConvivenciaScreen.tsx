/**
 * NORMAS DE CONVIVENCIA 2026
 * IE Manuel Fidencio Hidalgo Flores
 * Estructura: Eje → Norma General → Conductas Observables
 * Funciones: selección múltiple de alumnos, puntuación 1-10, historial
 */
import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  BookOpen, Shield, Heart, Wifi, WifiOff, Users, Check, X,
  ChevronRight, ChevronDown, Plus, Trash2, Edit2, Save,
  Search, Download, AlertTriangle, Star, BarChart3
} from 'lucide-react';
import FuturisticCard from '../components/FuturisticCard';
import HologramText from '../components/HologramText';
import { syncToTurso, isSyncedToCloud } from '../services/dataService';

// ── ESTRUCTURA DEL PDF ────────────────────────────────────────────────────────
export const EJES_CONVIVENCIA = [
  {
    id: 'eje-1',
    valor: 'Respeto',
    eje: 'Respeto y Buen Trato',
    color: 'cyan' as const,
    icono: '🤝',
    normaGeneral: 'Promuevo relaciones basadas en la amabilidad, la aceptación y el reconocimiento del otro.',
    conductas: [
      { id: 'c1', num: 1, texto: 'Me comunico con los demás usando un lenguaje amable y respetuoso.' },
      { id: 'c2', num: 2, texto: 'Reconozco y valoro las diferencias personales, culturales y de opinión.' },
      { id: 'c3', num: 3, texto: 'Escucho con atención cuando otros expresan sus ideas y sentimientos.' },
      { id: 'c4', num: 4, texto: 'Fomento un ambiente donde todos se sientan aceptados y seguros.' },
    ]
  },
  {
    id: 'eje-2',
    valor: 'Responsabilidad',
    eje: 'Responsabilidad y Cumplimiento',
    color: 'lime' as const,
    icono: '📋',
    normaGeneral: 'Cumplo con mis deberes escolares y formativos, contribuyendo a un ambiente de orden y aprendizaje.',
    conductas: [
      { id: 'c5', num: 5, texto: 'Ingreso puntualmente y participo activamente en cada actividad.' },
      { id: 'c6', num: 6, texto: 'Mantengo una presentación personal adecuada y uso correctamente el uniforme.' },
      { id: 'c7', num: 7, texto: 'Cumplo con mis tareas, compromisos académicos y acuerdos de aula.' },
      { id: 'c8', num: 8, texto: 'Sigo las orientaciones del docente para favorecer el aprendizaje de todos.' },
    ]
  },
  {
    id: 'eje-3',
    valor: 'Empatía y Paz',
    eje: 'Convivencia Pacífica',
    color: 'magenta' as const,
    icono: '☮️',
    normaGeneral: 'Construyo relaciones positivas mediante el diálogo, la regulación emocional y la cooperación.',
    conductas: [
      { id: 'c9', num: 9, texto: 'Dialogo para resolver diferencias, buscando acuerdos que beneficien a todos.' },
      { id: 'c10', num: 10, texto: 'Expreso mis emociones de manera adecuada y busco apoyo cuando lo necesito.' },
      { id: 'c11', num: 11, texto: 'Construyo relaciones positivas basadas en la empatía y la cooperación.' },
    ]
  },
  {
    id: 'eje-4',
    valor: 'Responsabilidad Digital',
    eje: 'Convivencia Digital y Tecnología',
    color: 'blue' as const,
    icono: '💻',
    normaGeneral: 'Utilizo las tecnologías de manera segura, ética y orientada al aprendizaje.',
    conductas: [
      { id: 'c12', num: 12, texto: 'Utilizo los dispositivos tecnológicos para aprender y trabajar de forma segura.' },
      { id: 'c13', num: 13, texto: 'Respeto la privacidad de mis compañeros y solo registro o comparto contenido con autorización.' },
      { id: 'c14', num: 14, texto: 'Participo en entornos digitales con responsabilidad, cordialidad y respeto.' },
      { id: 'c15', num: 15, texto: 'Cuido los equipos tecnológicos de la institución y los uso con fines educativos.' },
    ]
  },
  {
    id: 'eje-5',
    valor: 'Responsabilidad – Orden – Cuidado',
    eje: 'Cuidado de los Espacios y Recursos',
    color: 'lime' as const,
    icono: '🌿',
    normaGeneral: 'Protejo y conservo los ambientes y materiales de la institución como parte de mi formación.',
    conductas: [
      { id: 'c16', num: 16, texto: 'Mantengo mi aula y los ambientes escolares limpios y ordenados.' },
      { id: 'c17', num: 17, texto: 'Cuido el mobiliario, materiales e infraestructura como parte de mi responsabilidad escolar.' },
      { id: 'c18', num: 18, texto: 'Promuevo prácticas de cuidado del ambiente dentro y fuera de la institución.' },
    ]
  },
  {
    id: 'eje-6',
    valor: 'Autocuidado – Seguridad – Bienestar',
    eje: 'Seguridad y Bienestar',
    color: 'cyan' as const,
    icono: '🛡️',
    normaGeneral: 'Protejo mi integridad física y emocional, actuando con responsabilidad en todos los espacios.',
    conductas: [
      { id: 'c19', num: 19, texto: 'Me desplazo con responsabilidad y prudencia dentro de la institución.' },
      { id: 'c20', num: 20, texto: 'Practico el autocuidado y protejo mi integridad física y emocional.' },
      { id: 'c21', num: 21, texto: 'Participo en los protocolos de seguridad siguiendo las orientaciones del personal.' },
    ]
  },
];

const LS_REGISTROS = 'ie_registros_normas';
const GRADOS = ['1', '2', '3', '4', '5'];
const SECCIONES = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

function lsGet<T>(key: string, def: T): T {
  try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(def)); } catch { return def; }
}
function lsSet(key: string, val: any) { localStorage.setItem(key, JSON.stringify(val)); }

function normGrado(g: string | undefined): string {
  if (!g) return '';
  const s = String(g).trim();
  const map: Record<string, string> = {
    'primero': '1', '1°': '1', '1º': '1', 'segundo': '2', '2°': '2', '2º': '2',
    'tercero': '3', '3°': '3', '3º': '3', 'cuarto': '4', '4°': '4', '4º': '4',
    'quinto': '5', '5°': '5', '5º': '5',
  };
  return map[s.toLowerCase()] || s.replace(/[°º]/g, '').trim();
}
function normSeccion(s: string | undefined): string {
  if (!s) return '';
  return String(s).trim().replace(/^\d+/, '').replace(/[^A-Za-z]/g, '').toUpperCase();
}
function nombreAlumno(a: any): string {
  return a.apellidos_nombres || a.nombre || 'Sin nombre';
}

interface RegistroNorma {
  id: string;
  alumnoId: string;
  conductaId: string;
  ejeId: string;
  fecha: string;
  cumplimiento: 'cumple' | 'no-cumple';
  puntos: number;
  observacion: string;
  registradoPor: string;
}

interface User { id?: string; name?: string; email?: string; role?: string; }

export default function NormasConvivenciaScreen({ user }: { user: User }) {
  const [tab, setTab] = useState<'registro' | 'historial'>('registro');
  const [ejeSeleccionado, setEjeSeleccionado] = useState<string>(EJES_CONVIVENCIA[0].id);
  const [conductaSeleccionada, setConductaSeleccionada] = useState<string | null>(null);

  // Filtros alumnos
  const [grado, setGrado] = useState('1');
  const [seccion, setSeccion] = useState('A');
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [busqueda, setBusqueda] = useState('');

  // Alumnos
  const [alumnos, setAlumnos] = useState<any[]>([]);
  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set());

  // Registro
  const [registros, setRegistros] = useState<RegistroNorma[]>([]);
  const [puntos, setPuntos] = useState<number>(5);
  const [observacion, setObservacion] = useState('');
  const [cumplimiento, setCumplimiento] = useState<'cumple' | 'no-cumple'>('cumple');
  const [flashMsg, setFlashMsg] = useState('');

  // Historial filtros
  const [histGrado, setHistGrado] = useState('');
  const [histSeccion, setHistSeccion] = useState('');

  useEffect(() => {
    setAlumnos(lsGet('ie_alumnos', []));
    setRegistros(lsGet(LS_REGISTROS, []));
  }, []);

  const gradosDisponibles = useMemo(() =>
    [...new Set(alumnos.map(a => normGrado(a.grado)).filter(Boolean))].sort(), [alumnos]);

  const alumnosFiltrados = useMemo(() =>
    alumnos
      .filter(a =>
        normGrado(a.grado) === grado &&
        normSeccion(a.seccion) === seccion &&
        (!busqueda || nombreAlumno(a).toLowerCase().includes(busqueda.toLowerCase()))
      )
      .sort((a, b) => nombreAlumno(a).localeCompare(nombreAlumno(b))),
    [alumnos, grado, seccion, busqueda]
  );

  const ejeActual = EJES_CONVIVENCIA.find(e => e.id === ejeSeleccionado)!;
  const conductaActual = ejeActual?.conductas.find(c => c.id === conductaSeleccionada);

  const toggleAlumno = (id: string) => {
    const nueva = new Set(seleccionados);
    if (nueva.has(id)) nueva.delete(id); else nueva.add(id);
    setSeleccionados(nueva);
  };

  const toggleTodos = () => {
    if (seleccionados.size === alumnosFiltrados.length) {
      setSeleccionados(new Set());
    } else {
      setSeleccionados(new Set(alumnosFiltrados.map(a => a.id)));
    }
  };

  const registrarNorma = () => {
    if (!conductaSeleccionada) { setFlashMsg('⚠️ Selecciona una conducta observable'); setTimeout(() => setFlashMsg(''), 3000); return; }
    if (seleccionados.size === 0) { setFlashMsg('⚠️ Selecciona al menos un alumno'); setTimeout(() => setFlashMsg(''), 3000); return; }

    const ptsFinales = cumplimiento === 'cumple' ? Math.abs(puntos) : -Math.abs(puntos);
    const nuevos: RegistroNorma[] = [...seleccionados].map(alumnoId => ({
      id: `reg-${Date.now()}-${alumnoId}`,
      alumnoId,
      conductaId: conductaSeleccionada,
      ejeId: ejeSeleccionado,
      fecha,
      cumplimiento,
      puntos: ptsFinales,
      observacion,
      registradoPor: user?.email || 'docente',
    }));

    const actualizados = [...registros, ...nuevos];
    setRegistros(actualizados);
    lsSet(LS_REGISTROS, actualizados);
    syncToTurso('registros_normas', actualizados);
    setFlashMsg(`✅ Registrado para ${seleccionados.size} alumno(s) — ${ptsFinales > 0 ? '+' : ''}${ptsFinales} pts`);
    setTimeout(() => setFlashMsg(''), 4000);
    setSeleccionados(new Set());
    setObservacion('');
  };

  // Puntos de un alumno en la fecha actual
  const puntosAlumnoHoy = (alumnoId: string): number =>
    registros.filter(r => r.alumnoId === alumnoId && r.fecha === fecha)
      .reduce((acc, r) => acc + r.puntos, 0);

  // Historial: resumen por alumno
  const historialAlumnos = useMemo(() => {
    const filtrados = alumnos.filter(a =>
      (!histGrado || normGrado(a.grado) === histGrado) &&
      (!histSeccion || normSeccion(a.seccion) === histSeccion)
    );
    return filtrados.map(a => {
      const regs = registros.filter(r => r.alumnoId === a.id);
      const ptsTotales = regs.reduce((acc, r) => acc + r.puntos, 0);
      const cumplidos = regs.filter(r => r.cumplimiento === 'cumple').length;
      const incumplidos = regs.filter(r => r.cumplimiento === 'no-cumple').length;
      return { alumno: a, ptsTotales, cumplidos, incumplidos, total: regs.length };
    }).sort((a, b) => b.ptsTotales - a.ptsTotales);
  }, [alumnos, registros, histGrado, histSeccion]);

  const exportarHistorial = () => {
    let txt = `NORMAS DE CONVIVENCIA — Resumen\n${'='.repeat(55)}\n\n`;
    historialAlumnos.forEach((item, i) => {
      txt += `${String(i+1).padStart(2,'0')}. ${nombreAlumno(item.alumno).padEnd(38)} | Pts: ${item.ptsTotales > 0 ? '+' : ''}${item.ptsTotales} | ✓${item.cumplidos} ✗${item.incumplidos}\n`;
    });
    const blob = new Blob([txt], {type:'text/plain'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `normas_resumen.txt`; a.click();
    URL.revokeObjectURL(url);
  };

  const colorMap: Record<string, string> = {
    cyan: 'text-neon-cyan border-neon-cyan bg-neon-cyan/10',
    lime: 'text-neon-lime border-neon-lime bg-neon-lime/10',
    magenta: 'text-neon-magenta border-neon-magenta bg-neon-magenta/10',
    blue: 'text-blue-400 border-blue-400 bg-blue-400/10',
  };

  return (
    <div className="min-h-screen bg-dark-bg text-white overflow-hidden p-4 md:p-6">
      <div className="fixed inset-0 -z-50">
        <div className="absolute inset-0 bg-gradient-cyber opacity-60" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto space-y-6">

        {/* ── HEADER ── */}
        <motion.div initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter">
              Normas de <HologramText>Convivencia</HologramText>
            </h1>
            <p className="text-white/50 font-mono tracking-widest text-xs mt-1">IE MANUEL FIDENCIO HIDALGO FLORES — 2026</p>
          </div>
          <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold mt-2 ${isSyncedToCloud() ? 'border-neon-lime/50 bg-neon-lime/10 text-neon-lime' : 'border-neon-cyan/40 bg-neon-cyan/10 text-neon-cyan'}`}>
            {isSyncedToCloud() ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
            {isSyncedToCloud() ? 'TURSO CONECTADO' : 'MODO LOCAL'}
          </div>
        </motion.div>

        {/* ── TABS ── */}
        <div className="flex gap-2 flex-wrap">
          {[
            { id: 'registro', label: '📝 Registrar Conducta' },
            { id: 'historial', label: '📊 Historial / Resumen' },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id as any)}
              className={`px-5 py-2.5 rounded-xl font-bold text-sm border transition-all ${tab === t.id ? 'bg-neon-cyan/20 border-neon-cyan text-neon-cyan shadow-[0_0_20px_rgba(0,217,255,0.2)]' : 'bg-white/5 border-white/20 text-white/60 hover:bg-white/10'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ═══════════════════════════════════════
            TAB: REGISTRO
        ═══════════════════════════════════════ */}
        {tab === 'registro' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* ── COLUMNA IZQUIERDA: Ejes + Conductas ── */}
            <div className="space-y-4">

              {/* Fecha */}
              <FuturisticCard variant="cyan" glow>
                <div className="p-4 flex items-center gap-3">
                  <label className="text-white/60 text-sm font-bold uppercase">Fecha:</label>
                  <input type="date" value={fecha} onChange={e => setFecha(e.target.value)}
                    className="bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-neon-cyan" />
                </div>
              </FuturisticCard>

              {/* Ejes */}
              <div className="space-y-2">
                <p className="text-white/50 text-xs uppercase font-bold tracking-wider px-1">1. Selecciona el Eje</p>
                {EJES_CONVIVENCIA.map((eje, idx) => {
                  const selec = ejeSeleccionado === eje.id;
                  return (
                    <motion.div key={eje.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.04 }}>
                      <button onClick={() => { setEjeSeleccionado(eje.id); setConductaSeleccionada(null); }}
                        className={`w-full text-left rounded-xl border transition-all p-3 ${selec ? `${colorMap[eje.color]} border-2` : 'border-white/10 bg-white/5 hover:bg-white/10'}`}>
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{eje.icono}</span>
                          <div className="flex-1 min-w-0">
                            <p className={`font-bold text-sm ${selec ? '' : 'text-white'}`}>{eje.eje}</p>
                            <p className="text-white/40 text-xs truncate">{eje.valor}</p>
                          </div>
                          <ChevronRight className={`w-4 h-4 flex-shrink-0 transition-transform ${selec ? 'rotate-90 text-current' : 'text-white/30'}`} />
                        </div>
                        {/* Norma general expandida */}
                        {selec && (
                          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                            className="mt-3 pt-3 border-t border-current/20">
                            <p className="text-xs italic text-current/80">"{eje.normaGeneral}"</p>
                          </motion.div>
                        )}
                      </button>

                      {/* Conductas del eje seleccionado */}
                      {selec && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="ml-4 mt-2 space-y-1.5">
                          <p className="text-white/40 text-xs uppercase font-bold tracking-wider mb-2">2. Selecciona la conducta observable</p>
                          {eje.conductas.map(c => {
                            const selC = conductaSeleccionada === c.id;
                            return (
                              <button key={c.id} onClick={() => setConductaSeleccionada(selC ? null : c.id)}
                                className={`w-full text-left rounded-xl border px-4 py-3 text-sm transition-all ${selC ? `${colorMap[eje.color]} border font-bold` : 'border-white/10 bg-white/5 hover:bg-white/10 text-white/80'}`}>
                                <div className="flex items-start gap-2">
                                  <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${selC ? 'bg-current/20' : 'bg-white/10 text-white/60'}`}>{c.num}</span>
                                  <span className="leading-snug">{c.texto}</span>
                                </div>
                              </button>
                            );
                          })}
                        </motion.div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* ── COLUMNA DERECHA: Alumnos + Puntuación ── */}
            <div className="space-y-4">

              {/* Panel puntuación */}
              <AnimatePresence>
                {conductaSeleccionada && conductaActual && (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                    <FuturisticCard variant={ejeActual.color} glow>
                      <div className="p-5 space-y-4">
                        <div>
                          <p className="text-white/50 text-xs uppercase font-bold">Conducta seleccionada</p>
                          <p className="text-white text-sm mt-1 leading-snug">{conductaActual.num}. {conductaActual.texto}</p>
                        </div>

                        {/* Cumplimiento */}
                        <div>
                          <p className="text-white/50 text-xs uppercase font-bold mb-2">¿La cumple o incumple?</p>
                          <div className="flex gap-3">
                            <button onClick={() => setCumplimiento('cumple')}
                              className={`flex-1 py-3 rounded-xl font-bold text-sm border transition-all ${cumplimiento === 'cumple' ? 'bg-neon-lime/20 border-neon-lime text-neon-lime shadow-[0_0_15px_rgba(176,255,94,0.3)]' : 'bg-white/5 border-white/20 text-white/60 hover:bg-white/10'}`}>
                              ✓ Cumple
                            </button>
                            <button onClick={() => setCumplimiento('no-cumple')}
                              className={`flex-1 py-3 rounded-xl font-bold text-sm border transition-all ${cumplimiento === 'no-cumple' ? 'bg-red-500/20 border-red-500 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.3)]' : 'bg-white/5 border-white/20 text-white/60 hover:bg-white/10'}`}>
                              ✗ Incumple
                            </button>
                          </div>
                        </div>

                        {/* Puntuación 1-10 */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-white/50 text-xs uppercase font-bold">Puntuación (1 – 10)</p>
                            <span className={`text-2xl font-black ${cumplimiento === 'cumple' ? 'text-neon-lime' : 'text-red-400'}`}>
                              {cumplimiento === 'cumple' ? '+' : '-'}{puntos}
                            </span>
                          </div>
                          <div className="flex gap-2 flex-wrap">
                            {[1,2,3,4,5,6,7,8,9,10].map(n => (
                              <button key={n} onClick={() => setPuntos(n)}
                                className={`w-10 h-10 rounded-xl font-bold text-sm transition-all ${puntos === n ? (cumplimiento === 'cumple' ? 'bg-neon-lime text-black shadow-[0_0_10px_#b0ff5e]' : 'bg-red-500 text-white shadow-[0_0_10px_#ef4444]') : 'bg-white/10 text-white/60 hover:bg-white/20'}`}>
                                {n}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Observación */}
                        <div>
                          <label className="text-white/50 text-xs uppercase font-bold block mb-1">Observación (opcional)</label>
                          <input type="text" value={observacion} onChange={e => setObservacion(e.target.value)}
                            placeholder="Descripción breve..."
                            className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-neon-cyan placeholder-white/30" />
                        </div>

                        {/* Botón registrar */}
                        <button onClick={registrarNorma}
                          className={`w-full py-3 rounded-xl font-bold text-sm border transition-all flex items-center justify-center gap-2 ${seleccionados.size > 0 ? 'bg-neon-cyan/20 hover:bg-neon-cyan/30 border-neon-cyan text-neon-cyan' : 'bg-white/5 border-white/20 text-white/40 cursor-not-allowed'}`}>
                          <Save className="w-4 h-4" />
                          Registrar para {seleccionados.size} alumno{seleccionados.size !== 1 ? 's' : ''}
                        </button>

                        {/* Flash message */}
                        {flashMsg && (
                          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="text-center text-sm font-bold text-neon-lime">
                            {flashMsg}
                          </motion.p>
                        )}
                      </div>
                    </FuturisticCard>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Selector de alumnos */}
              <FuturisticCard variant="lime" glow>
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-white/50 text-xs uppercase font-bold">3. Selecciona alumno(s)</p>
                    <span className="text-neon-lime text-xs font-bold">{seleccionados.size} seleccionado(s)</span>
                  </div>

                  {/* Filtros */}
                  <div className="flex flex-wrap gap-2">
                    <select value={grado} onChange={e => setGrado(e.target.value)}
                      className="bg-white/10 border border-white/20 rounded-lg px-2 py-1.5 text-white text-xs focus:outline-none focus:border-neon-lime">
                      {(gradosDisponibles.length > 0 ? gradosDisponibles : GRADOS).map(g => (
                        <option key={g} value={g} className="bg-slate-800">{g}°</option>
                      ))}
                    </select>
                    <select value={seccion} onChange={e => setSeccion(e.target.value)}
                      className="bg-white/10 border border-white/20 rounded-lg px-2 py-1.5 text-white text-xs focus:outline-none focus:border-neon-lime">
                      {SECCIONES.map(s => (
                        <option key={s} value={s} className="bg-slate-800">Sec. {s}</option>
                      ))}
                    </select>
                    <div className="flex items-center gap-1 flex-1 min-w-[120px]">
                      <Search className="w-3.5 h-3.5 text-white/40 flex-shrink-0" />
                      <input value={busqueda} onChange={e => setBusqueda(e.target.value)}
                        placeholder="Buscar..." className="flex-1 bg-white/10 border border-white/20 rounded-lg px-2 py-1.5 text-white text-xs focus:outline-none focus:border-neon-lime placeholder-white/30" />
                    </div>
                  </div>

                  {/* Seleccionar todos */}
                  {alumnosFiltrados.length > 0 && (
                    <button onClick={toggleTodos}
                      className="w-full flex items-center justify-between px-3 py-2 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-all">
                      <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center flex-shrink-0 ${seleccionados.size === alumnosFiltrados.length && alumnosFiltrados.length > 0 ? 'bg-neon-lime border-neon-lime text-black' : 'border-white/30'}`}>
                        {seleccionados.size === alumnosFiltrados.length && alumnosFiltrados.length > 0 && <span className="text-[10px] font-black">✓</span>}
                      </div>
                      <span className="text-white/70 text-xs flex-1 text-left ml-2">Seleccionar todos ({alumnosFiltrados.length})</span>
                    </button>
                  )}

                  {/* Lista alumnos */}
                  <div className="space-y-1 max-h-72 overflow-y-auto">
                    {alumnosFiltrados.length === 0 && (
                      <div className="text-center py-6">
                        <p className="text-white/40 text-sm">Sin alumnos en {grado}° sección {seccion}</p>
                        {alumnos.length === 0 && (
                          <p className="text-yellow-400/70 text-xs mt-2">No hay alumnos en el sistema. Ve a Gestión → Alumnos.</p>
                        )}
                      </div>
                    )}
                    {alumnosFiltrados.map(alumno => {
                      const sel = seleccionados.has(alumno.id);
                      const pts = puntosAlumnoHoy(alumno.id);
                      return (
                        <button key={alumno.id} onClick={() => toggleAlumno(alumno.id)}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all text-left ${sel ? 'bg-neon-lime/10 border border-neon-lime/30' : 'bg-white/5 border border-transparent hover:bg-white/10'}`}>
                          <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center flex-shrink-0 ${sel ? 'bg-neon-lime border-neon-lime text-black' : 'border-white/30'}`}>
                            {sel && <span className="text-[10px] font-black">✓</span>}
                          </div>
                          <span className="flex-1 text-white text-xs font-medium truncate">{nombreAlumno(alumno)}</span>
                          {pts !== 0 && (
                            <span className={`text-xs font-bold flex-shrink-0 ${pts > 0 ? 'text-neon-lime' : 'text-red-400'}`}>
                              {pts > 0 ? '+' : ''}{pts}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </FuturisticCard>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════
            TAB: HISTORIAL
        ═══════════════════════════════════════ */}
        {tab === 'historial' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">

            {/* Filtros historial */}
            <FuturisticCard variant="cyan" glow>
              <div className="p-4 flex flex-wrap items-center gap-4">
                <select value={histGrado} onChange={e => setHistGrado(e.target.value)}
                  className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-neon-cyan">
                  <option value="" className="bg-slate-800">Todos los grados</option>
                  {(gradosDisponibles.length > 0 ? gradosDisponibles : GRADOS).map(g => (
                    <option key={g} value={g} className="bg-slate-800">{g}°</option>
                  ))}
                </select>
                <select value={histSeccion} onChange={e => setHistSeccion(e.target.value)}
                  className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-neon-cyan">
                  <option value="" className="bg-slate-800">Todas las secciones</option>
                  {SECCIONES.map(s => <option key={s} value={s} className="bg-slate-800">Sección {s}</option>)}
                </select>
                <button onClick={exportarHistorial}
                  className="ml-auto flex items-center gap-2 px-4 py-2 bg-neon-cyan/20 hover:bg-neon-cyan/30 border border-neon-cyan text-neon-cyan font-bold text-xs rounded-xl transition-all">
                  <Download className="w-4 h-4" /> Exportar Resumen
                </button>
              </div>
            </FuturisticCard>

            {/* Tabla historial */}
            <FuturisticCard variant="lime" glow>
              <div className="p-5">
                <h3 className="text-white font-bold uppercase tracking-wider mb-4 flex items-center gap-2 text-sm">
                  <BarChart3 className="w-4 h-4 text-neon-lime" /> Resumen de Conducta por Alumno
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/10 text-white/50 text-xs uppercase">
                        <th className="px-3 py-2 text-left">#</th>
                        <th className="px-3 py-2 text-left">Alumno</th>
                        <th className="px-3 py-2 text-center">Grado</th>
                        <th className="px-3 py-2 text-center text-neon-lime">✓ Cumple</th>
                        <th className="px-3 py-2 text-center text-red-400">✗ Incumple</th>
                        <th className="px-3 py-2 text-center">Puntos</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historialAlumnos.length === 0 && (
                        <tr><td colSpan={6} className="text-center text-white/40 py-8">Sin registros aún</td></tr>
                      )}
                      {historialAlumnos.map((item, i) => (
                        <tr key={item.alumno.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="px-3 py-2.5 text-white/40">{i+1}</td>
                          <td className="px-3 py-2.5 text-white font-medium">{nombreAlumno(item.alumno)}</td>
                          <td className="px-3 py-2.5 text-center text-white/50 text-xs">{normGrado(item.alumno.grado)}°{normSeccion(item.alumno.seccion)}</td>
                          <td className="px-3 py-2.5 text-center">
                            <span className="px-2 py-1 rounded-full bg-neon-lime/20 text-neon-lime text-xs font-bold">{item.cumplidos}</span>
                          </td>
                          <td className="px-3 py-2.5 text-center">
                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${item.incumplidos > 0 ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-white/40'}`}>{item.incumplidos}</span>
                          </td>
                          <td className="px-3 py-2.5 text-center">
                            <span className={`font-black text-sm ${item.ptsTotales > 0 ? 'text-neon-lime' : item.ptsTotales < 0 ? 'text-red-400' : 'text-white/40'}`}>
                              {item.ptsTotales > 0 ? '+' : ''}{item.ptsTotales}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </FuturisticCard>

            {/* Últimos registros recientes */}
            {registros.length > 0 && (
              <FuturisticCard variant="magenta" glow>
                <div className="p-5">
                  <h3 className="text-white font-bold uppercase tracking-wider mb-4 text-sm flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-neon-magenta" /> Últimos 15 Registros
                  </h3>
                  <div className="space-y-2">
                    {[...registros].reverse().slice(0, 15).map(reg => {
                      const alumno = alumnos.find(a => a.id === reg.alumnoId);
                      const eje = EJES_CONVIVENCIA.find(e => e.id === reg.ejeId);
                      const conducta = eje?.conductas.find(c => c.id === reg.conductaId);
                      return (
                        <div key={reg.id} className="flex items-center gap-3 px-4 py-2.5 bg-white/5 rounded-xl">
                          <span className={`text-xs font-black flex-shrink-0 w-10 text-center ${reg.puntos > 0 ? 'text-neon-lime' : 'text-red-400'}`}>
                            {reg.puntos > 0 ? '+' : ''}{reg.puntos}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-xs font-medium truncate">{alumno ? nombreAlumno(alumno) : reg.alumnoId}</p>
                            <p className="text-white/40 text-xs truncate">{eje?.icono} {conducta?.num}. {conducta?.texto}</p>
                          </div>
                          <span className="text-white/30 text-xs flex-shrink-0">{reg.fecha}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </FuturisticCard>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
