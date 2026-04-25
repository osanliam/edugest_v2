/**
 * REPORTE / INFORME DEL ALUMNO
 * Dashboard integrado: notas, asistencia, normas de convivencia, datos personales
 * IE Manuel Fidencio Hidalgo Flores — EduGest 2026
 */
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  User, Search, FileText, BookOpen, CheckSquare, Shield,
  TrendingUp, Award, Clock, Calendar, Phone, MapPin,
  ChevronLeft, Download, XCircle, CheckCircle, AlertTriangle,
  BarChart3, Star, Users, ClipboardList
} from 'lucide-react';
import HeaderElegante from '../components/HeaderElegante';

interface ReporteAlumnoProps {
  user: { id: string; name: string; email: string; role: string; schoolId: string };
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

interface RegistroAsistencia {
  id: string;
  alumnoId: string;
  fecha: string;
  estado: 'presente' | 'ausente' | 'tardanza';
  modo?: 'diaria' | 'refuerzo';
  hora?: string;
}

interface RegistroNorma {
  id: string;
  alumnoId: string;
  conductaId: string;
  ejeId: string;
  fecha: string;
  cumplimiento: 'cumple' | 'no-cumple';
  puntos: number;
  observacion?: string;
  registradoPor?: string;
}

interface Calificativo {
  id: string;
  alumnoId: string;
  columnaId: string;
  calificativo: string;
  fecha?: string;
}

interface Columna {
  id: string;
  nombre: string;
  tipo?: string;
  competenciaId?: string;
  promediar?: boolean;
}

// ── Ejes de convivencia (mapa rápido) ─────────────────────────────────────────
const EJES_MAP: Record<string, { eje: string; color: string; icono: string }> = {
  'eje-1': { eje: 'Respeto y Buen Trato', color: 'cyan', icono: '🤝' },
  'eje-2': { eje: 'Responsabilidad y Cumplimiento', color: 'lime', icono: '📋' },
  'eje-3': { eje: 'Convivencia Pacífica', color: 'pink', icono: '☮️' },
  'eje-4': { eje: 'Convivencia Digital', color: 'blue', icono: '💻' },
  'eje-5': { eje: 'Cuidado de Espacios', color: 'green', icono: '🌿' },
  'eje-6': { eje: 'Seguridad y Bienestar', color: 'orange', icono: '🛡️' },
};

const CONDUCTAS_MAP: Record<string, string> = {
  c1: 'Lenguaje amable y respetuoso',
  c2: 'Valora las diferencias personales',
  c3: 'Escucha con atención',
  c4: 'Fomenta ambiente seguro',
  c5: 'Puntualidad y participación',
  c6: 'Presentación personal adecuada',
  c7: 'Cumple tareas y compromisos',
  c8: 'Sigue orientaciones del docente',
  c9: 'Dialoga para resolver diferencias',
  c10: 'Regula sus emociones',
  c11: 'Empatía y cooperación',
  c12: 'Uso seguro de tecnología',
  c13: 'Respeta privacidad digital',
  c14: 'Participa con responsabilidad digital',
  c15: 'Cuida equipos tecnológicos',
  c16: 'Mantiene espacios ordenados',
  c17: 'Cuida materiales y mobiliario',
  c18: 'Cuida el medio ambiente',
  c19: 'Participa en planes de seguridad',
  c20: 'Prácticas de vida saludable',
  c21: 'Promueve ambiente seguro y protegido',
};

const COMPETENCIAS = [
  { id: 'comp1', label: 'C1', nombre: 'Lee diversos tipos de textos' },
  { id: 'comp2', label: 'C2', nombre: 'Escribe diversos tipos de textos' },
  { id: 'comp3', label: 'C3', nombre: 'Se comunica oralmente' },
];

const CAL_BG: Record<string, string> = {
  C:  'bg-red-500/20 text-red-300 border-red-500/40',
  B:  'bg-yellow-500/20 text-yellow-200 border-yellow-500/40',
  A:  'bg-green-500/20 text-green-300 border-green-500/40',
  AD: 'bg-blue-500/20 text-blue-300 border-blue-400/50',
};

const CAL_LABEL: Record<string, string> = {
  C: 'En Inicio', B: 'En Proceso', A: 'Logro Esperado', AD: 'Logro Destacado',
};

const VALORES: Record<string, number> = { C: 1, B: 2, A: 3, AD: 4 };
const CAL_LABELS = ['', 'C', 'B', 'A', 'AD'];

const GRADOS = ['1', '2', '3', '4', '5'];
const SECCIONES = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

function lsGet<T>(key: string, def: T): T {
  try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(def)); }
  catch { return def; }
}

function normGrado(g: string | undefined): string {
  if (!g) return '';
  const map: Record<string, string> = {
    'primero': '1', 'primer': '1', '1°': '1', '1º': '1',
    'segundo': '2', '2°': '2', '2º': '2',
    'tercero': '3', '3°': '3', '3º': '3',
    'cuarto':  '4', '4°': '4', '4º': '4',
    'quinto':  '5', '5°': '5', '5º': '5',
  };
  const s = g.trim();
  return map[s.toLowerCase()] || s.replace(/[°º]/g, '').trim();
}

function normSeccion(s: string | undefined): string {
  if (!s) return '';
  return s.trim().toUpperCase().replace(/^sección\s*/i, '').replace(/^seccion\s*/i, '');
}

type Tab = 'resumen' | 'notas' | 'asistencia' | 'normas' | 'datos';

export default function ReporteAlumnoScreen({ user }: ReporteAlumnoProps) {
  const [alumnos, setAlumnos] = useState<Alumno[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [gradoFiltro, setGradoFiltro] = useState('todos');
  const [seccionFiltro, setSeccionFiltro] = useState('todas');
  const [alumnoSelec, setAlumnoSelec] = useState<Alumno | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('resumen');

  const [calificativos, setCalificativos] = useState<Calificativo[]>([]);
  const [columnas, setColumnas] = useState<Columna[]>([]);
  const [asistenciaRegs, setAsistenciaRegs] = useState<RegistroAsistencia[]>([]);
  const [normasRegs, setNormasRegs] = useState<RegistroNorma[]>([]);

  useEffect(() => {
    setAlumnos(lsGet<Alumno[]>('ie_alumnos', []));
    setCalificativos(lsGet<Calificativo[]>('ie_calificativos_v2', []));
    setColumnas(lsGet<Columna[]>('cal_columnas', []));
    setAsistenciaRegs(lsGet<RegistroAsistencia[]>('ie_asistencia', []));
    setNormasRegs(lsGet<RegistroNorma[]>('ie_registros_normas', []));
  }, []);

  // ── Filtro de alumnos ──────────────────────────────────────────────────────
  const resultados = alumnos.filter(a => {
    const ng = normGrado(a.grado);
    const ns = normSeccion(a.seccion);
    if (gradoFiltro !== 'todos' && ng !== gradoFiltro) return false;
    if (seccionFiltro !== 'todas' && ns !== seccionFiltro) return false;
    if (busqueda.trim()) {
      const b = busqueda.toLowerCase();
      const nombre = (a.apellidos_nombres || a.nombre || '').toLowerCase();
      if (!nombre.includes(b) && !(a.dni || '').includes(b)) return false;
    }
    return true;
  }).slice(0, 15);

  // ── Datos del alumno seleccionado ──────────────────────────────────────────
  const calAlumno = alumnoSelec
    ? calificativos.filter(c => c.alumnoId === alumnoSelec.id)
    : [];

  const asistAlumno = alumnoSelec
    ? asistenciaRegs.filter(r => r.alumnoId === alumnoSelec.id)
    : [];

  const normasAlumno = alumnoSelec
    ? normasRegs.filter(r => r.alumnoId === alumnoSelec.id)
    : [];

  // Estadísticas asistencia
  const totalDias = asistAlumno.length;
  const presentes = asistAlumno.filter(r => r.estado === 'presente').length;
  const tardanzas = asistAlumno.filter(r => r.estado === 'tardanza').length;
  const ausentes  = asistAlumno.filter(r => r.estado === 'ausente').length;
  const pctAsist  = totalDias > 0 ? Math.round((presentes / totalDias) * 100) : 0;

  // Estadísticas normas
  const normasCumple    = normasAlumno.filter(r => r.cumplimiento === 'cumple');
  const normasNoCumple  = normasAlumno.filter(r => r.cumplimiento === 'no-cumple');
  const totalPuntos     = normasAlumno.reduce((acc, r) => acc + r.puntos, 0);

  // Estadísticas calificativos
  function getPromComp(compId: string): string | null {
    const cols = columnas.filter(c => c.competenciaId === compId && c.promediar);
    if (cols.length === 0) return null;
    const cals = calAlumno.filter(c => cols.some(cc => cc.id === c.columnaId));
    if (cals.length === 0) return null;
    const suma = cals.reduce((acc, c) => acc + (VALORES[c.calificativo] || 0), 0);
    const prom = Math.round(suma / cals.length);
    return CAL_LABELS[Math.min(4, Math.max(1, prom))];
  }

  const p1 = alumnoSelec ? getPromComp('comp1') : null;
  const p2 = alumnoSelec ? getPromComp('comp2') : null;
  const p3 = alumnoSelec ? getPromComp('comp3') : null;

  function promGeneral(): string | null {
    const vals = [p1, p2, p3].filter(Boolean) as string[];
    if (vals.length === 0) return null;
    const sum = vals.reduce((acc, v) => acc + (VALORES[v] || 0), 0);
    const avg = Math.round(sum / vals.length);
    return CAL_LABELS[Math.min(4, Math.max(1, avg))];
  }

  const pg = promGeneral();

  // ── Exportar TXT ──────────────────────────────────────────────────────────
  function exportarInforme() {
    if (!alumnoSelec) return;
    const nombre = alumnoSelec.apellidos_nombres || alumnoSelec.nombre || 'Alumno';
    const lines = [
      '====================================================',
      `  INFORME ACADÉMICO — IE MANUEL FIDENCIO HIDALGO`,
      '====================================================',
      `Alumno     : ${nombre}`,
      `DNI        : ${alumnoSelec.dni || 'No registrado'}`,
      `Grado      : ${normGrado(alumnoSelec.grado)}° Sección "${normSeccion(alumnoSelec.seccion)}"`,
      `Sexo       : ${alumnoSelec.sexo || 'No registrado'}`,
      `Fecha Nac. : ${alumnoSelec.fechaNac || 'No registrado'}`,
      '',
      '── CALIFICATIVOS ────────────────────────────────────',
      `  C1 (Lectura)      : ${p1 || '—'}  ${p1 ? CAL_LABEL[p1] : ''}`,
      `  C2 (Escritura)    : ${p2 || '—'}  ${p2 ? CAL_LABEL[p2] : ''}`,
      `  C3 (Comunicación) : ${p3 || '—'}  ${p3 ? CAL_LABEL[p3] : ''}`,
      `  Promedio General  : ${pg || '—'}`,
      '',
      '── ASISTENCIA ───────────────────────────────────────',
      `  Total días       : ${totalDias}`,
      `  Presentes        : ${presentes} (${pctAsist}%)`,
      `  Tardanzas        : ${tardanzas}`,
      `  Ausencias        : ${ausentes}`,
      '',
      '── NORMAS DE CONVIVENCIA ────────────────────────────',
      `  Registros totales: ${normasAlumno.length}`,
      `  Cumplidos        : ${normasCumple.length}`,
      `  Incumplidos      : ${normasNoCumple.length}`,
      `  Puntos netos     : ${totalPuntos > 0 ? '+' : ''}${totalPuntos}`,
      '',
      '── ÚLTIMAS 10 NORMAS ────────────────────────────────',
      ...normasAlumno.slice(-10).reverse().map(r => {
        const conducta = CONDUCTAS_MAP[r.conductaId] || r.conductaId;
        const signo = r.cumplimiento === 'cumple' ? '+' : '-';
        return `  [${r.fecha}] ${r.cumplimiento === 'cumple' ? '✓' : '✗'} ${conducta} (${signo}${r.puntos}pts) ${r.observacion || ''}`;
      }),
      '',
      '====================================================',
      `Generado: ${new Date().toLocaleString('es-PE')}`,
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/plain; charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `informe-${nombre.replace(/\s+/g, '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ── Últimas asistencias para mostrar ──────────────────────────────────────
  const ultimasAsistencias = [...asistAlumno]
    .sort((a, b) => b.fecha.localeCompare(a.fecha))
    .slice(0, 20);

  // ── Normas por eje ────────────────────────────────────────────────────────
  const normasPorEje: Record<string, { cumple: number; noCumple: number; puntos: number }> = {};
  normasAlumno.forEach(r => {
    if (!normasPorEje[r.ejeId]) normasPorEje[r.ejeId] = { cumple: 0, noCumple: 0, puntos: 0 };
    if (r.cumplimiento === 'cumple') normasPorEje[r.ejeId].cumple++;
    else normasPorEje[r.ejeId].noCumple++;
    normasPorEje[r.ejeId].puntos += r.puntos;
  });

  const tabConfig: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'resumen',    label: 'Resumen',    icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'notas',      label: 'Notas',      icon: <BookOpen className="w-4 h-4" /> },
    { id: 'asistencia', label: 'Asistencia', icon: <CheckSquare className="w-4 h-4" /> },
    { id: 'normas',     label: 'Normas',     icon: <Shield className="w-4 h-4" /> },
    { id: 'datos',      label: 'Datos',      icon: <User className="w-4 h-4" /> },
  ];

  const nombreAlumno = alumnoSelec
    ? (alumnoSelec.apellidos_nombres || alumnoSelec.nombre || 'Alumno')
    : '';

  return (
    <div className="min-h-screen bg-dark-bg text-white overflow-hidden p-6">
      {/* Fondo animado */}
      <div className="fixed inset-0 -z-50">
        <div className="absolute inset-0 bg-gradient-cyber opacity-60"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto space-y-8">
        <HeaderElegante
          icon={ClipboardList}
          title="EDUGEST REPORTE ALUMNO"
          subtitle="Dashboard académico integrado"
        />

      {/* ── SELECTOR DE ALUMNO ── */}
      {!alumnoSelec && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800/60 border border-purple-500/20 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Search className="w-5 h-5 text-purple-400" />
            <h2 className="text-white font-bold text-lg">Seleccionar Alumno</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            <select value={gradoFiltro} onChange={e => setGradoFiltro(e.target.value)}
              className="bg-slate-700/80 border border-slate-600 rounded-xl px-3 py-2 text-white text-sm">
              <option value="todos">Todos los grados</option>
              {GRADOS.map(g => <option key={g} value={g}>{g}° Grado</option>)}
            </select>
            <select value={seccionFiltro} onChange={e => setSeccionFiltro(e.target.value)}
              className="bg-slate-700/80 border border-slate-600 rounded-xl px-3 py-2 text-white text-sm">
              <option value="todas">Todas las secciones</option>
              {SECCIONES.map(s => <option key={s} value={s}>Sección {s}</option>)}
            </select>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" placeholder="Nombre o DNI..." value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                className="w-full bg-slate-700/80 border border-slate-600 rounded-xl pl-9 pr-3 py-2 text-white text-sm placeholder-slate-500" />
            </div>
          </div>

          {alumnos.length === 0 && (
            <div className="text-center py-8 text-slate-500">
              <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p>No hay alumnos registrados</p>
            </div>
          )}

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {resultados.map(a => {
              const ng = normGrado(a.grado);
              const ns = normSeccion(a.seccion);
              const asistA = asistenciaRegs.filter(r => r.alumnoId === a.id);
              const pct = asistA.length > 0
                ? Math.round((asistA.filter(r => r.estado === 'presente').length / asistA.length) * 100)
                : null;
              return (
                <button key={a.id} onClick={() => { setAlumnoSelec(a); setActiveTab('resumen'); }}
                  className="w-full p-3 rounded-xl bg-slate-700/40 hover:bg-purple-500/20 border border-slate-600/60 hover:border-purple-500/40 flex items-center justify-between transition-all group">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                      {(a.apellidos_nombres || a.nombre || '?').charAt(0)}
                    </div>
                    <div className="text-left">
                      <p className="text-white font-semibold text-sm group-hover:text-purple-300 transition-colors">
                        {a.apellidos_nombres || a.nombre}
                      </p>
                      <p className="text-slate-400 text-xs">
                        DNI: {a.dni || '—'} · {ng}° "{ns}"
                      </p>
                    </div>
                  </div>
                  {pct !== null && (
                    <span className={`text-xs font-bold px-2 py-1 rounded-lg border ${
                      pct >= 80 ? 'bg-green-500/20 text-green-300 border-green-500/30'
                      : pct >= 60 ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
                      : 'bg-red-500/20 text-red-300 border-red-500/30'
                    }`}>
                      {pct}% asist.
                    </span>
                  )}
                </button>
              );
            })}
            {busqueda && resultados.length === 0 && (
              <p className="text-center text-slate-500 py-6">Sin resultados</p>
            )}
          </div>
        </motion.div>
      )}

      {/* ── PERFIL DEL ALUMNO ── */}
      {alumnoSelec && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          className="space-y-4">

          {/* Tarjeta de identidad */}
          <div className="bg-gradient-to-r from-purple-900/40 to-slate-800/60 border border-purple-500/30 rounded-2xl p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-black text-2xl shrink-0">
                  {nombreAlumno.charAt(0)}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white leading-tight">{nombreAlumno}</h2>
                  <p className="text-purple-300 text-sm font-medium">
                    {normGrado(alumnoSelec.grado)}° Grado · Sección "{normSeccion(alumnoSelec.seccion)}"
                  </p>
                  <p className="text-slate-400 text-xs mt-1">
                    DNI: {alumnoSelec.dni || 'No registrado'} · {alumnoSelec.sexo || ''}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={exportarInforme}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-300 rounded-lg text-xs font-medium transition-colors">
                  <Download className="w-3.5 h-3.5" /> Exportar
                </button>
                <button onClick={() => setAlumnoSelec(null)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700/60 hover:bg-slate-700 border border-slate-600 text-slate-300 rounded-lg text-xs font-medium transition-colors">
                  <ChevronLeft className="w-3.5 h-3.5" /> Cambiar
                </button>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 flex-wrap">
            {tabConfig.map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${
                  activeTab === t.id
                    ? 'bg-purple-500/30 border-purple-500/50 text-purple-300'
                    : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-white hover:border-slate-600'
                }`}>
                {t.icon}
                {t.label}
              </button>
            ))}
          </div>

          {/* ── TAB: RESUMEN ── */}
          {activeTab === 'resumen' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              {/* KPI cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {/* Promedio */}
                <div className="bg-slate-800/60 border border-purple-500/20 rounded-xl p-4 flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-purple-400" />
                    <p className="text-slate-400 text-xs uppercase font-semibold">Promedio</p>
                  </div>
                  {pg ? (
                    <div>
                      <span className={`text-2xl font-black px-3 py-1 rounded-lg border ${CAL_BG[pg]}`}>{pg}</span>
                      <p className="text-slate-400 text-xs mt-1">{CAL_LABEL[pg]}</p>
                    </div>
                  ) : (
                    <p className="text-2xl font-black text-slate-600">—</p>
                  )}
                </div>

                {/* Asistencia */}
                <div className={`bg-slate-800/60 border rounded-xl p-4 flex flex-col gap-2 ${
                  pctAsist >= 80 ? 'border-green-500/20' : pctAsist >= 60 ? 'border-yellow-500/20' : 'border-red-500/20'
                }`}>
                  <div className="flex items-center gap-2">
                    <CheckSquare className={`w-4 h-4 ${pctAsist >= 80 ? 'text-green-400' : pctAsist >= 60 ? 'text-yellow-400' : 'text-red-400'}`} />
                    <p className="text-slate-400 text-xs uppercase font-semibold">Asistencia</p>
                  </div>
                  <p className={`text-2xl font-black ${pctAsist >= 80 ? 'text-green-300' : pctAsist >= 60 ? 'text-yellow-300' : 'text-red-300'}`}>
                    {totalDias > 0 ? `${pctAsist}%` : '—'}
                  </p>
                  {totalDias > 0 && (
                    <p className="text-slate-500 text-xs">{presentes}/{totalDias} días</p>
                  )}
                </div>

                {/* Normas cumplidas */}
                <div className="bg-slate-800/60 border border-green-500/20 rounded-xl p-4 flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <p className="text-slate-400 text-xs uppercase font-semibold">Normas ✓</p>
                  </div>
                  <p className="text-2xl font-black text-green-300">{normasCumple.length}</p>
                  <p className="text-slate-500 text-xs">de {normasAlumno.length} registros</p>
                </div>

                {/* Puntos normas */}
                <div className={`bg-slate-800/60 border rounded-xl p-4 flex flex-col gap-2 ${
                  totalPuntos > 0 ? 'border-cyan-500/20' : totalPuntos < 0 ? 'border-red-500/20' : 'border-slate-600/40'
                }`}>
                  <div className="flex items-center gap-2">
                    <Star className={`w-4 h-4 ${totalPuntos > 0 ? 'text-cyan-400' : totalPuntos < 0 ? 'text-red-400' : 'text-slate-400'}`} />
                    <p className="text-slate-400 text-xs uppercase font-semibold">Puntos</p>
                  </div>
                  <p className={`text-2xl font-black ${totalPuntos > 0 ? 'text-cyan-300' : totalPuntos < 0 ? 'text-red-300' : 'text-slate-500'}`}>
                    {totalPuntos > 0 ? '+' : ''}{normasAlumno.length > 0 ? totalPuntos : '—'}
                  </p>
                </div>
              </div>

              {/* Competencias resumen */}
              <div className="bg-slate-800/60 border border-purple-500/20 rounded-2xl p-5">
                <h3 className="text-white font-bold uppercase text-sm tracking-wider mb-4 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-purple-400" /> Competencias — Comunicación
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {COMPETENCIAS.map(comp => {
                    const prom = getPromComp(comp.id);
                    const cols = columnas.filter(c => c.competenciaId === comp.id);
                    const calsComp = calAlumno.filter(c => cols.some(cc => cc.id === c.columnaId));
                    return (
                      <div key={comp.id} className="p-4 rounded-xl bg-slate-700/30 border border-slate-600/40">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="text-white font-bold text-sm">{comp.label}</p>
                            <p className="text-slate-400 text-xs">{comp.nombre}</p>
                          </div>
                          {prom ? (
                            <span className={`text-xl font-black border-2 rounded-lg px-2 py-0.5 ${CAL_BG[prom]}`}>{prom}</span>
                          ) : (
                            <span className="text-slate-600 font-bold text-xl">—</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 mt-2">
                          <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full transition-all ${
                              prom === 'AD' ? 'bg-blue-500' : prom === 'A' ? 'bg-green-500' : prom === 'B' ? 'bg-yellow-500' : 'bg-red-500'
                            }`} style={{ width: prom ? `${(VALORES[prom] / 4) * 100}%` : '0%' }} />
                          </div>
                          <p className="text-slate-500 text-xs">{calsComp.length}/{cols.length}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Resumen normas por eje */}
              {Object.keys(normasPorEje).length > 0 && (
                <div className="bg-slate-800/60 border border-shield-500/20 border-slate-700/60 rounded-2xl p-5">
                  <h3 className="text-white font-bold uppercase text-sm tracking-wider mb-4 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-purple-400" /> Normas por Eje
                  </h3>
                  <div className="space-y-2">
                    {Object.entries(normasPorEje).map(([ejeId, stats]) => {
                      const eje = EJES_MAP[ejeId];
                      if (!eje) return null;
                      return (
                        <div key={ejeId} className="flex items-center gap-3 p-3 rounded-xl bg-slate-700/30 border border-slate-600/30">
                          <span className="text-lg">{eje.icono}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-medium truncate">{eje.eje}</p>
                          </div>
                          <div className="flex items-center gap-2 text-xs font-bold shrink-0">
                            <span className="flex items-center gap-1 px-2 py-0.5 bg-green-500/20 text-green-300 rounded-lg border border-green-500/30">
                              <CheckCircle className="w-3 h-3" /> {stats.cumple}
                            </span>
                            <span className="flex items-center gap-1 px-2 py-0.5 bg-red-500/20 text-red-300 rounded-lg border border-red-500/30">
                              <XCircle className="w-3 h-3" /> {stats.noCumple}
                            </span>
                            <span className={`px-2 py-0.5 rounded-lg border ${
                              stats.puntos > 0 ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                              : stats.puntos < 0 ? 'bg-red-500/20 text-red-300 border-red-500/30'
                              : 'bg-slate-700 text-slate-400 border-slate-600'
                            }`}>
                              {stats.puntos > 0 ? '+' : ''}{stats.puntos}pts
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* ── TAB: NOTAS ── */}
          {activeTab === 'notas' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              {COMPETENCIAS.map(comp => {
                const cols = columnas.filter(c => c.competenciaId === comp.id);
                const prom = getPromComp(comp.id);
                return (
                  <div key={comp.id} className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-white font-bold">{comp.label} — {comp.nombre}</h3>
                      </div>
                      {prom && (
                        <div className="text-right">
                          <span className={`text-2xl font-black border-2 rounded-xl px-3 py-1 ${CAL_BG[prom]}`}>{prom}</span>
                          <p className="text-slate-400 text-xs mt-1">{CAL_LABEL[prom]}</p>
                        </div>
                      )}
                    </div>
                    {cols.length === 0 ? (
                      <p className="text-slate-500 text-sm text-center py-4">Sin evaluaciones configuradas</p>
                    ) : (
                      <div className="space-y-2">
                        {cols.map(col => {
                          const cal = calAlumno.find(c => c.columnaId === col.id);
                          return (
                            <div key={col.id} className="flex items-center justify-between py-2 border-b border-slate-700/40 last:border-0">
                              <div>
                                <p className="text-white text-sm font-medium">{col.nombre}</p>
                                {col.tipo && <p className="text-slate-500 text-xs">{col.tipo}</p>}
                              </div>
                              {cal ? (
                                <span className={`text-sm font-bold border rounded-lg px-2 py-0.5 ${CAL_BG[cal.calificativo]}`}>
                                  {cal.calificativo}
                                </span>
                              ) : (
                                <span className="text-slate-600 text-sm">Sin nota</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}

              {calAlumno.length === 0 && (
                <div className="text-center py-10 text-slate-500">
                  <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p>No hay calificativos registrados</p>
                </div>
              )}
            </motion.div>
          )}

          {/* ── TAB: ASISTENCIA ── */}
          {activeTab === 'asistencia' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              {/* Estadísticas */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: 'Total días', val: totalDias, color: 'slate', icon: <Calendar className="w-4 h-4 text-slate-400" /> },
                  { label: 'Presentes', val: presentes, color: 'green', icon: <CheckCircle className="w-4 h-4 text-green-400" /> },
                  { label: 'Tardanzas', val: tardanzas, color: 'yellow', icon: <Clock className="w-4 h-4 text-yellow-400" /> },
                  { label: 'Ausencias', val: ausentes, color: 'red', icon: <XCircle className="w-4 h-4 text-red-400" /> },
                ].map(s => (
                  <div key={s.label} className={`bg-slate-800/60 border border-${s.color}-500/20 rounded-xl p-4`}>
                    <div className="flex items-center gap-2 mb-1">{s.icon} <p className="text-slate-400 text-xs uppercase">{s.label}</p></div>
                    <p className={`text-2xl font-black text-${s.color}-300`}>{s.val}</p>
                  </div>
                ))}
              </div>

              {/* Barra de progreso asistencia */}
              {totalDias > 0 && (
                <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-white font-semibold text-sm">Porcentaje de asistencia</p>
                    <p className={`font-black text-lg ${pctAsist >= 80 ? 'text-green-300' : pctAsist >= 60 ? 'text-yellow-300' : 'text-red-300'}`}>
                      {pctAsist}%
                    </p>
                  </div>
                  <div className="w-full h-3 bg-slate-700 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${pctAsist >= 80 ? 'bg-green-500' : pctAsist >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                      style={{ width: `${pctAsist}%` }} />
                  </div>
                  <p className="text-slate-500 text-xs mt-1">
                    {pctAsist >= 80 ? '✓ Asistencia adecuada' : pctAsist >= 60 ? '⚠ Asistencia regular — requiere atención' : '✗ Asistencia crítica'}
                  </p>
                </div>
              )}

              {/* Historial */}
              <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-5">
                <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-purple-400" /> Últimos Registros
                </h3>
                {ultimasAsistencias.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <CheckSquare className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p>Sin registros de asistencia</p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {ultimasAsistencias.map(r => (
                      <div key={r.id} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-slate-700/30 border border-slate-600/30">
                        <div className={`w-2 h-2 rounded-full shrink-0 ${
                          r.estado === 'presente' ? 'bg-green-400'
                          : r.estado === 'tardanza' ? 'bg-yellow-400'
                          : 'bg-red-400'
                        }`} />
                        <p className="text-slate-300 text-sm font-mono">{r.fecha}</p>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded border ${
                          r.estado === 'presente' ? 'bg-green-500/15 text-green-300 border-green-500/30'
                          : r.estado === 'tardanza' ? 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30'
                          : 'bg-red-500/15 text-red-300 border-red-500/30'
                        }`}>
                          {r.estado === 'presente' ? 'Presente' : r.estado === 'tardanza' ? 'Tardanza' : 'Ausente'}
                        </span>
                        {r.modo && (
                          <span className="text-xs text-slate-500 italic">{r.modo}</span>
                        )}
                        {r.hora && <span className="text-xs text-slate-500 ml-auto">{r.hora}</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ── TAB: NORMAS ── */}
          {activeTab === 'normas' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              {/* KPIs normas */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-800/60 border border-green-500/20 rounded-xl p-4 text-center">
                  <CheckCircle className="w-6 h-6 text-green-400 mx-auto mb-1" />
                  <p className="text-2xl font-black text-green-300">{normasCumple.length}</p>
                  <p className="text-slate-400 text-xs uppercase">Cumplidas</p>
                </div>
                <div className="bg-slate-800/60 border border-red-500/20 rounded-xl p-4 text-center">
                  <XCircle className="w-6 h-6 text-red-400 mx-auto mb-1" />
                  <p className="text-2xl font-black text-red-300">{normasNoCumple.length}</p>
                  <p className="text-slate-400 text-xs uppercase">Incumplidas</p>
                </div>
                <div className={`bg-slate-800/60 border rounded-xl p-4 text-center ${
                  totalPuntos > 0 ? 'border-cyan-500/20' : totalPuntos < 0 ? 'border-red-500/20' : 'border-slate-700/40'
                }`}>
                  <Star className={`w-6 h-6 mx-auto mb-1 ${totalPuntos > 0 ? 'text-cyan-400' : totalPuntos < 0 ? 'text-red-400' : 'text-slate-400'}`} />
                  <p className={`text-2xl font-black ${totalPuntos > 0 ? 'text-cyan-300' : totalPuntos < 0 ? 'text-red-300' : 'text-slate-500'}`}>
                    {totalPuntos > 0 ? '+' : ''}{normasAlumno.length > 0 ? totalPuntos : '—'}
                  </p>
                  <p className="text-slate-400 text-xs uppercase">Puntos netos</p>
                </div>
              </div>

              {/* Resumen por eje */}
              {Object.keys(normasPorEje).length > 0 && (
                <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-5">
                  <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-3">Por Eje de Convivencia</h3>
                  <div className="space-y-2">
                    {Object.entries(normasPorEje).map(([ejeId, st]) => {
                      const eje = EJES_MAP[ejeId];
                      if (!eje) return null;
                      const total = st.cumple + st.noCumple;
                      const pct = total > 0 ? Math.round((st.cumple / total) * 100) : 0;
                      return (
                        <div key={ejeId} className="p-3 rounded-xl bg-slate-700/30 border border-slate-600/30">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-white text-sm font-medium">{eje.icono} {eje.eje}</p>
                            <div className="flex gap-2 text-xs font-bold">
                              <span className="text-green-300">✓ {st.cumple}</span>
                              <span className="text-red-300">✗ {st.noCumple}</span>
                              <span className={st.puntos > 0 ? 'text-cyan-300' : 'text-red-300'}>
                                {st.puntos > 0 ? '+' : ''}{st.puntos}pts
                              </span>
                            </div>
                          </div>
                          <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${pct >= 70 ? 'bg-green-500' : pct >= 40 ? 'bg-yellow-500' : 'bg-red-500'}`}
                              style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Historial de normas */}
              <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-5">
                <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-purple-400" /> Historial de Conductas
                </h3>
                {normasAlumno.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <Shield className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p>Sin registros de conducta</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {[...normasAlumno].reverse().slice(0, 20).map(r => {
                      const eje = EJES_MAP[r.ejeId];
                      const conducta = CONDUCTAS_MAP[r.conductaId] || r.conductaId;
                      return (
                        <div key={r.id} className={`flex items-start gap-3 p-3 rounded-xl border ${
                          r.cumplimiento === 'cumple'
                            ? 'bg-green-500/10 border-green-500/20'
                            : 'bg-red-500/10 border-red-500/20'
                        }`}>
                          {r.cumplimiento === 'cumple'
                            ? <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                            : <XCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                          }
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-medium leading-tight">{conducta}</p>
                            {eje && <p className="text-slate-400 text-xs">{eje.icono} {eje.eje}</p>}
                            {r.observacion && <p className="text-slate-400 text-xs italic mt-0.5">"{r.observacion}"</p>}
                          </div>
                          <div className="text-right shrink-0">
                            <p className={`text-sm font-bold ${r.cumplimiento === 'cumple' ? 'text-green-300' : 'text-red-300'}`}>
                              {r.cumplimiento === 'cumple' ? '+' : '-'}{r.puntos}pts
                            </p>
                            <p className="text-slate-500 text-xs">{r.fecha}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ── TAB: DATOS ── */}
          {activeTab === 'datos' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-5 space-y-4">
              <h3 className="text-white font-bold text-sm uppercase tracking-wider">Datos Personales</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { label: 'Apellidos y Nombres', val: alumnoSelec.apellidos_nombres || alumnoSelec.nombre },
                  { label: 'DNI', val: alumnoSelec.dni },
                  { label: 'Grado', val: `${normGrado(alumnoSelec.grado)}° Grado` },
                  { label: 'Sección', val: normSeccion(alumnoSelec.seccion) },
                  { label: 'Sexo', val: alumnoSelec.sexo },
                  { label: 'Fecha de Nacimiento', val: alumnoSelec.fechaNac },
                  { label: 'Dirección', val: alumnoSelec.direccion },
                  { label: 'Teléfono', val: alumnoSelec.telefono },
                  { label: 'Email', val: alumnoSelec.email },
                  { label: 'Apoderado / Padre', val: alumnoSelec.apelidosPadre },
                  { label: 'Madre', val: alumnoSelec.nombreMadre },
                ].map(f => (
                  <div key={f.label} className="p-3 rounded-xl bg-slate-700/30 border border-slate-600/30">
                    <p className="text-slate-500 text-xs uppercase font-semibold mb-1">{f.label}</p>
                    <p className="text-white text-sm">{f.val || <span className="text-slate-600 italic">No registrado</span>}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

        </motion.div>
      )}
      </div>
    </div>
  );
}
