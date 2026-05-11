import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  User, Search, BookOpen, CheckSquare, Shield,
  Clock, Calendar, CheckCircle, XCircle,
  BarChart3, Star, Users, ClipboardList, Download,
  ChevronLeft, Award, AlertTriangle, FileText
} from 'lucide-react';
import HeaderElegante from '../components/HeaderElegante';
import { cargarTodo } from '../utils/apiClient';

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
  id?: string;
  alumnoId: string;
  fecha: string;
  estado: string;
  bimestre?: number;
  horaRegistro?: string;
  modo?: string;
}

interface RegistroRefuerzo {
  id?: string;
  alumnoId: string;
  fecha: string;
  estado: string;
  bimestre?: number;
  horaRegistro?: string;
  seleccionado?: boolean;
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
  bimestre?: number;
}

interface Infraccion {
  id: string;
  alumnoId: string;
  fecha: string;
  bimestre: number;
  ejeId: string;
  normaNumero: number;
  normaTexto: string;
  tipo: 'cumplimiento' | 'incumplimiento';
  descripcion: string;
  accion: string;
  observaciones?: string;
  registradoPor: string;
  curso?: string;
}

interface Calificativo {
  id?: string;
  alumnoId: string;
  columnaId: string;
  calificativo: string;
  fecha?: string;
  marcados?: any[];
  bimestreId?: string;
}

interface Columna {
  id: string;
  nombre: string;
  tipo?: string;
  competenciaId?: string;
  promediar?: boolean;
  bimestreId?: string;
}

interface Unidad {
  id: string;
  numero: number;
  nombre: string;
  bimestreId?: string;
  activa?: boolean;
}

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

const CURSOS = ['Comunicación', 'Matemática', 'Ciencia y Tecnología', 'Historia', 'Inglés', 'Educación Física', 'Arte', 'Tutoría'];

function lsGet<T>(key: string, def: T): T {
  try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(def)); }
  catch { return def; }
}
function lsSet(key: string, val: any) {
  localStorage.setItem(key, JSON.stringify(val));
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

type Tab = 'resumen' | 'notas' | 'asistencia' | 'refuerzo' | 'normas' | 'datos';

export default function ReporteAlumnoScreen({ user }: ReporteAlumnoProps) {
  const [alumnos, setAlumnos] = useState<Alumno[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [filtroGrado, setFiltroGrado] = useState('');
  const [filtroSeccion, setFiltroSeccion] = useState('');
  const [filtroBimestre, setFiltroBimestre] = useState('');
  const [filtroUnidad, setFiltroUnidad] = useState('');
  const [filtroCurso, setFiltroCurso] = useState('');
  const [alumnoSelec, setAlumnoSelec] = useState<Alumno | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('resumen');

  const [calificativos, setCalificativos] = useState<Calificativo[]>([]);
  const [columnas, setColumnas] = useState<Columna[]>([]);
  const [asistenciaRegs, setAsistenciaRegs] = useState<RegistroAsistencia[]>([]);
  const [refuerzoRegs, setRefuerzoRegs] = useState<RegistroRefuerzo[]>([]);
  const [normasRegs, setNormasRegs] = useState<RegistroNorma[]>([]);
  const [infraccionesRegs, setInfraccionesRegs] = useState<Infraccion[]>([]);
  const [unidades, setUnidades] = useState<Unidad[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    setAlumnos(lsGet<Alumno[]>('ie_alumnos', []));
    setCalificativos(lsGet<Calificativo[]>('ie_calificativos_v2', []));
    setColumnas(lsGet<Columna[]>('cal_columnas', []));
    setAsistenciaRegs(lsGet<RegistroAsistencia[]>('ie_asistencia', []));
    setRefuerzoRegs(lsGet<RegistroRefuerzo[]>('ie_refuerzo', []));
    setNormasRegs(lsGet<RegistroNorma[]>('ie_registros_normas', []));
    setInfraccionesRegs(lsGet<Infraccion[]>('ie_infracciones_v2', []));
    setUnidades(lsGet<Unidad[]>('cfg_unidades', []));
    setCargando(false);

    cargarTodo('alumnos,calificaciones,columnas,asistencia,unidades,normas,registros_normas').then(datos => {
      if (datos.alumnos && datos.alumnos.length > 0) {
        const map = datos.alumnos.map((a: any) => ({
          id: a.id,
          apellidos_nombres: a.apellidos_nombres || a.nombre || '',
          nombre: a.nombre || '',
          dni: a.dni || '',
          grado: a.grado || '',
          seccion: a.seccion || '',
          sexo: a.sexo || '',
          fechaNac: a.fecha_nacimiento || a.fechaNac || '',
          direccion: a.direccion || '',
          apelidosPadre: a.padre_nombres || a.apelidosPadre || '',
          nombreMadre: a.madre_nombres || a.nombreMadre || '',
          telefono: a.madre_celular || a.telefono || '',
          email: a.email || '',
        }));
        lsSet('ie_alumnos', map);
        setAlumnos(map);
      }
      if (datos.calificaciones && datos.calificaciones.length > 0) {
        const map = datos.calificaciones.map((c: any) => ({
          id: c.id,
          alumnoId: c.alumnoId,
          columnaId: c.columnaId,
          calificativo: c.calificativo || '',
          fecha: c.fecha || '',
          bimestreId: c.bimestreId || '',
        }));
        lsSet('ie_calificativos_v2', map);
        setCalificativos(map);
      }
      if (datos.columnas && datos.columnas.length > 0) {
        const map = datos.columnas.map((c: any) => ({
          id: c.id,
          nombre: c.nombre || '',
          tipo: c.tipo || '',
          competenciaId: c.competenciaId || '',
          promediar: c.promediar ?? true,
          bimestreId: c.bimestreId || '',
        }));
        lsSet('cal_columnas', map);
        setColumnas(map);
      }
      if (datos.asistencia && datos.asistencia.length > 0) {
        const map = datos.asistencia.map((a: any) => ({
          id: a.id,
          alumnoId: a.alumnoId,
          fecha: a.fecha,
          estado: a.estado || '',
          bimestre: parseInt(a.modo) || parseInt(a.bimestre) || 0,
          horaRegistro: a.hora || a.horaRegistro || '',
          modo: a.modo || '',
        }));
        lsSet('ie_asistencia', map);
        setAsistenciaRegs(map);
      }
      if (datos.unidades && datos.unidades.length > 0) {
        const map = datos.unidades.map((u: any) => ({
          id: u.id,
          numero: u.numero || 0,
          nombre: u.nombre || '',
          bimestreId: u.bimestreId || '',
          activa: u.activa ?? true,
        }));
        lsSet('cfg_unidades', map);
        setUnidades(map);
      }
      if (datos.registros_normas && datos.registros_normas.length > 0) {
        const map = datos.registros_normas.map((r: any) => ({
          id: r.id,
          alumnoId: r.alumnoId,
          conductaId: r.conductaId || '',
          ejeId: r.ejeId || '',
          fecha: r.fecha || '',
          cumplimiento: r.cumplimiento || r.tipo || '',
          puntos: r.puntos || 0,
          observacion: r.observacion || r.observaciones || '',
          registradoPor: r.registradoPor || '',
          bimestre: r.bimestre || 0,
        }));
        lsSet('ie_registros_normas', map);
        setNormasRegs(map);
      }
    }).catch(e => console.warn('Error cargando datos de la nube:', e));
  }, []);

  const grados = useMemo(() => [...new Set(alumnos.map(a => normGrado(a.grado)).filter(Boolean))].sort(), [alumnos]);
  const secciones = useMemo(() => filtroGrado
    ? [...new Set(alumnos.filter(a => normGrado(a.grado) === filtroGrado).map(a => normSeccion(a.seccion)).filter(Boolean))].sort()
    : [], [alumnos, filtroGrado]);

  const bimestresOpciones = useMemo(() => {
    const bimIds = [...new Set(unidades.map(u => u.bimestreId).filter(Boolean))];
    if (bimIds.length === 0) {
      return [{ id: '1', label: 'I Bimestre' }, { id: '2', label: 'II Bimestre' }, { id: '3', label: 'III Bimestre' }, { id: '4', label: 'IV Bimestre' }];
    }
    const bimNums = new Set<number>();
    bimIds.forEach(id => {
      const match = id.match(/bim[_-]?(\d)/i);
      if (match) bimNums.add(parseInt(match[1]));
    });
    const romanos = ['', 'I', 'II', 'III', 'IV', 'V'];
    const ordenados = [...bimNums].sort();
    return ordenados.map(n => ({ id: String(n), label: `${romanos[n] || n}° Bimestre` }));
  }, [unidades]);

  const unidadesFiltradas = useMemo(() => {
    if (!filtroBimestre) return unidades.filter(u => u.activa !== false);
    const match = unidades.filter(u => {
      if (!u.bimestreId) return true;
      const m = u.bimestreId.match(/bim[_-]?(\d)/i);
      return m ? m[1] === filtroBimestre : u.bimestreId === filtroBimestre;
    });
    return match.length > 0 ? match : unidades.filter(u => u.activa !== false);
  }, [unidades, filtroBimestre]);

  const alumnosFiltrados = useMemo(() => alumnos.filter(a => {
    const ng = normGrado(a.grado);
    const ns = normSeccion(a.seccion);
    if (filtroGrado && ng !== filtroGrado) return false;
    if (filtroSeccion && ns !== filtroSeccion) return false;
    if (busqueda.trim()) {
      const b = busqueda.toLowerCase();
      const nombre = (a.apellidos_nombres || a.nombre || '').toLowerCase();
      if (!nombre.includes(b) && !(a.dni || '').includes(b)) return false;
    }
    return true;
  }), [alumnos, filtroGrado, filtroSeccion, busqueda]);

  const filtroBimNum = filtroBimestre ? parseInt(filtroBimestre) : 0;

  const columnaBimestreMatch = useCallback((col: Columna): boolean => {
    if (!filtroBimestre) return true;
    if (!col.bimestreId) return true;
    const m = col.bimestreId.match(/bim[_-]?(\d)/i);
    if (m) return m[1] === filtroBimestre;
    return col.bimestreId === filtroBimestre;
  }, [filtroBimestre]);

  const calAlumno = useMemo(() => {
    if (!alumnoSelec) return [];
    const colIdsMatch = new Set(columnas.filter(c => columnaBimestreMatch(c)).map(c => c.id));
    const colIdsAll = new Set(columnas.map(c => c.id));
    const useIds = filtroBimestre ? colIdsMatch : colIdsAll;
    return calificativos.filter(c => {
      if (c.alumnoId !== alumnoSelec.id) return false;
      if (!useIds.has(c.columnaId)) return false;
      return true;
    });
  }, [alumnoSelec, calificativos, filtroBimestre, filtroUnidad, columnas, columnaBimestreMatch]);

  const columnasFiltradas = useMemo(() => {
    return columnas.filter(c => {
      if (filtroBimestre && !columnaBimestreMatch(c)) return false;
      if (filtroUnidad && c.bimestreId && c.bimestreId !== filtroUnidad) return false;
      return true;
    });
  }, [columnas, filtroBimestre, filtroUnidad, columnaBimestreMatch]);

  const asistAlumno = useMemo(() => {
    if (!alumnoSelec) return [];
    return asistenciaRegs.filter(r => {
      if (r.alumnoId !== alumnoSelec.id) return false;
      if (filtroBimNum && r.bimestre && r.bimestre !== filtroBimNum) return false;
      return true;
    });
  }, [alumnoSelec, asistenciaRegs, filtroBimNum]);

  const refuerzoAlumno = useMemo(() => {
    if (!alumnoSelec) return [];
    return refuerzoRegs.filter(r => {
      if (r.alumnoId !== alumnoSelec.id) return false;
      if (filtroBimNum && r.bimestre && r.bimestre !== filtroBimNum) return false;
      return true;
    });
  }, [alumnoSelec, refuerzoRegs, filtroBimNum]);

  const normasAlumno = useMemo(() => {
    if (!alumnoSelec) return [];
    const todas = [...normasRegs, ...infraccionesRegs.map(i => ({
      id: i.id,
      alumnoId: i.alumnoId,
      conductaId: `c${i.normaNumero}`,
      ejeId: i.ejeId,
      fecha: i.fecha,
      cumplimiento: (i.tipo === 'cumplimiento' ? 'cumple' : 'no-cumple') as 'cumple' | 'no-cumple',
      puntos: i.tipo === 'cumplimiento' ? 1 : -1,
      observacion: i.descripcion || i.observaciones || '',
      registradoPor: i.registradoPor || '',
      bimestre: i.bimestre,
    }))];
    return todas.filter(r => {
      if (r.alumnoId !== alumnoSelec!.id) return false;
      if (filtroBimNum && r.bimestre && r.bimestre !== filtroBimNum) return false;
      return true;
    });
  }, [alumnoSelec, normasRegs, infraccionesRegs, filtroBimNum]);

  const totalDias = asistAlumno.length;
  const asistio = asistAlumno.filter(r => r.estado === 'asistio').length;
  const falto = asistAlumno.filter(r => r.estado === 'falto').length;
  const retrasado = asistAlumno.filter(r => r.estado === 'retrasado').length;
  const justifico = asistAlumno.filter(r => r.estado === 'justifico').length;
  const permiso = asistAlumno.filter(r => r.estado === 'permiso').length;
  const presentes = asistio + justifico;
  const pctAsist = totalDias > 0 ? Math.round((presentes / totalDias) * 100) : 0;

  const refAsistio = refuerzoAlumno.filter(r => r.estado === 'asistio').length;
  const refTardanza = refuerzoAlumno.filter(r => r.estado === 'tardanza').length;
  const refFalta = refuerzoAlumno.filter(r => r.estado === 'falta').length;
  const refPermiso = refuerzoAlumno.filter(r => r.estado === 'permiso').length;
  const refTotal = refuerzoAlumno.length;
  const refPctAsist = refTotal > 0 ? Math.round(((refAsistio + refPermiso) / refTotal) * 100) : 0;

  const normasCumple = normasAlumno.filter(r => r.cumplimiento === 'cumple');
  const normasNoCumple = normasAlumno.filter(r => r.cumplimiento === 'no-cumple');
  const totalPuntos = normasAlumno.reduce((acc, r) => acc + r.puntos, 0);

  function getPromComp(compId: string): string | null {
    const cols = columnasFiltradas.filter(c => c.competenciaId === compId && c.promediar);
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

  const normasPorEje: Record<string, { cumple: number; noCumple: number; puntos: number }> = {};
  normasAlumno.forEach(r => {
    if (!normasPorEje[r.ejeId]) normasPorEje[r.ejeId] = { cumple: 0, noCumple: 0, puntos: 0 };
    if (r.cumplimiento === 'cumple') normasPorEje[r.ejeId].cumple++;
    else normasPorEje[r.ejeId].noCumple++;
    normasPorEje[r.ejeId].puntos += r.puntos;
  });

  const ultimasAsistencias = useMemo(() =>
    [...asistAlumno].sort((a, b) => b.fecha.localeCompare(a.fecha)).slice(0, 20)
  , [asistAlumno]);

  function exportarInforme() {
    if (!alumnoSelec) return;
    const nombre = alumnoSelec.apellidos_nombres || alumnoSelec.nombre || 'Alumno';
    const lines = [
      '====================================================',
      `  INFORME DEL ALUMNO — IE MANUEL FIDENCIO HIDALGO`,
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
      `  Total registros   : ${totalDias}`,
      `  Asistencias       : ${asistio} (${pctAsist}%)`,
      `  Retrasados        : ${retrasado}`,
      `  Faltas            : ${falto}`,
      `  Justificados      : ${justifico}`,
      `  Permisos          : ${permiso}`,
      '',
      '── REFUERZO ────────────────────────────────────────',
      `  Total sesiones    : ${refTotal}`,
      `  Asistencias       : ${refAsistio}`,
      `  Tardanzas         : ${refTardanza}`,
      `  Faltas            : ${refFalta}`,
      `  Permisos          : ${refPermiso}`,
      '',
      '── NORMAS DE CONVIVENCIA ────────────────────────────',
      `  Registros totales : ${normasAlumno.length}`,
      `  Cumplidos         : ${normasCumple.length}`,
      `  Incumplidos       : ${normasNoCumple.length}`,
      `  Puntos netos      : ${totalPuntos > 0 ? '+' : ''}${totalPuntos}`,
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

  const tabConfig: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'resumen',    label: 'Resumen',      icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'notas',      label: 'Calificativos', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'asistencia', label: 'Asistencia',    icon: <CheckSquare className="w-4 h-4" /> },
    { id: 'refuerzo',   label: 'Refuerzo',      icon: <Award className="w-4 h-4" /> },
    { id: 'normas',     label: 'Normas',        icon: <Shield className="w-4 h-4" /> },
    { id: 'datos',      label: 'Datos',         icon: <User className="w-4 h-4" /> },
  ];

  const nombreAlumno = alumnoSelec
    ? (alumnoSelec.apellidos_nombres || alumnoSelec.nombre || 'Alumno')
    : '';

  const estadoAsistLabel: Record<string, { label: string; color: string }> = {
    asistio:    { label: 'Asistió',    color: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' },
    falto:      { label: 'Faltó',      color: 'bg-red-500/15 text-red-300 border-red-500/30' },
    retrasado:  { label: 'Retrasado',  color: 'bg-amber-500/15 text-amber-300 border-amber-500/30' },
    justifico:  { label: 'Justificó',  color: 'bg-blue-500/15 text-blue-300 border-blue-500/30' },
    permiso:    { label: 'Permiso',    color: 'bg-violet-500/15 text-violet-300 border-violet-500/30' },
  };

  const estadoRefLabel: Record<string, { label: string; color: string }> = {
    asistio:  { label: 'Asistió',  color: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' },
    tardanza: { label: 'Tardanza', color: 'bg-amber-500/15 text-amber-300 border-amber-500/30' },
    falta:    { label: 'Falta',    color: 'bg-red-500/15 text-red-300 border-red-500/30' },
    permiso:  { label: 'Permiso',  color: 'bg-violet-500/15 text-violet-300 border-violet-500/30' },
  };

  const allEjes = [
    ...Object.entries(normasPorEje),
    ...Object.keys(EJES_MAP).filter(k => !normasPorEje[k]).map(k => [k, { cumple: 0, noCumple: 0, puntos: 0 }] as const),
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6">
      <div className="fixed inset-0 -z-50">
        <div className="absolute inset-0 bg-gradient-cyber opacity-60"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto space-y-6">
        <HeaderElegante
          icon={ClipboardList}
          title="EDUGEST INFORME DEL ALUMNO"
          subtitle="Dashboard integral del estudiante"
        />

        {/* ═══ FILTROS ═══ */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="bg-slate-800/50 border border-slate-700 rounded-xl p-5 backdrop-blur-sm space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <div>
              <label className="text-xs uppercase font-semibold text-slate-400 mb-1 block">Curso</label>
              <select value={filtroCurso} onChange={e => setFiltroCurso(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white text-sm focus:border-cyan-500">
                <option value="">Todos</option>
                {CURSOS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs uppercase font-semibold text-slate-400 mb-1 block">Bimestre</label>
              <select value={filtroBimestre} onChange={e => { setFiltroBimestre(e.target.value); setFiltroUnidad(''); }}
                className="w-full px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white text-sm focus:border-cyan-500">
                <option value="">Todos</option>
                {bimestresOpciones.map(b => <option key={b.id} value={b.id}>{b.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs uppercase font-semibold text-slate-400 mb-1 block">Unidad</label>
              <select value={filtroUnidad} onChange={e => setFiltroUnidad(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white text-sm focus:border-cyan-500">
                <option value="">Todas</option>
                {unidadesFiltradas.map(u => <option key={u.id} value={u.id}>U{u.numero}: {u.nombre}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs uppercase font-semibold text-slate-400 mb-1 block">Grado</label>
              <select value={filtroGrado} onChange={e => { setFiltroGrado(e.target.value); setFiltroSeccion(''); }}
                className="w-full px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white text-sm focus:border-cyan-500">
                <option value="">Todos</option>
                {grados.map(g => <option key={g} value={g}>{g}° Grado</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs uppercase font-semibold text-slate-400 mb-1 block">Sección</label>
              <select value={filtroSeccion} onChange={e => setFiltroSeccion(e.target.value)}
                disabled={!filtroGrado}
                className="w-full px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white text-sm focus:border-cyan-500 disabled:opacity-50">
                <option value="">Todas</option>
                {secciones.map(s => <option key={s} value={s}>Sección {s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs uppercase font-semibold text-slate-400 mb-1 block">Buscar</label>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="text" placeholder="Nombre o DNI..." value={busqueda}
                  onChange={e => setBusqueda(e.target.value)}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg pl-8 pr-3 py-2 text-white text-sm placeholder-slate-500 focus:border-cyan-500" />
              </div>
            </div>
          </div>

          {filtroCurso && (
            <div className="text-xs text-slate-400">
              Curso: <span className="text-cyan-400 font-semibold">{filtroCurso}</span>
              {filtroBimestre && <> · Bimestre: <span className="text-cyan-400 font-semibold">{filtroBimestre}°</span></>}
              {filtroUnidad && <> · Unidad seleccionada</>}
            </div>
          )}
        </motion.div>

        {/* ═══ SELECTOR DE ALUMNO ═══ */}
        {!alumnoSelec && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-slate-800/50 border border-purple-500/20 rounded-xl backdrop-blur-sm overflow-hidden">
            <div className="px-5 py-3 bg-purple-900/20 border-b border-purple-700/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-400" />
                <h2 className="text-white font-bold">Seleccionar Alumno</h2>
                <span className="text-xs text-slate-400 ml-2">({alumnosFiltrados.length} encontrados)</span>
              </div>
            </div>
            <div className="max-h-[50vh] overflow-y-auto p-2">
              {cargando ? (
                <div className="text-center py-10 text-slate-400">
                  <div className="animate-spin w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full mx-auto mb-3"></div>
                  Cargando datos...
                </div>
              ) : alumnosFiltrados.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p>No hay alumnos {filtroGrado || busqueda ? 'que coincidan con los filtros' : 'registrados'}</p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {alumnosFiltrados.slice(0, 30).map(a => {
                    const ng = normGrado(a.grado);
                    const ns = normSeccion(a.seccion);
                    const asistA = asistenciaRegs.filter(r => r.alumnoId === a.id);
                    const calsA = calificativos.filter(c => c.alumnoId === a.id);
                    const pct = asistA.length > 0
                      ? Math.round((asistA.filter(r => r.estado === 'asistio').length / asistA.length) * 100)
                      : null;
                    return (
                      <motion.button key={a.id} onClick={() => { setAlumnoSelec(a); setActiveTab('resumen'); }}
                        whileHover={{ scale: 1.005 }}
                        whileTap={{ scale: 0.995 }}
                        className="w-full p-3 rounded-xl bg-slate-700/30 hover:bg-purple-500/15 border border-slate-700/40 hover:border-purple-500/30 flex items-center justify-between transition-all group">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                            {(a.apellidos_nombres || a.nombre || '?').charAt(0)}
                          </div>
                          <div className="text-left">
                            <p className="text-white font-semibold text-sm group-hover:text-purple-300 transition-colors">
                              {a.apellidos_nombres || a.nombre}
                            </p>
                            <p className="text-slate-400 text-xs">
                              {ng}° Sección {ns} · DNI: {a.dni || '—'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {calsA.length > 0 && (
                            <span className="text-xs text-slate-500">{calsA.length} notas</span>
                          )}
                          {pct !== null && (
                            <span className={`text-xs font-bold px-2 py-1 rounded-lg border ${
                              pct >= 80 ? 'bg-green-500/15 text-green-300 border-green-500/30'
                              : pct >= 60 ? 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30'
                              : 'bg-red-500/15 text-red-300 border-red-500/30'
                            }`}>
                              {pct}% asist.
                            </span>
                          )}
                        </div>
                      </motion.button>
                    );
                  })}
                  {alumnosFiltrados.length > 30 && (
                    <p className="text-center text-slate-500 text-xs py-2">
                      Mostrando 30 de {alumnosFiltrados.length} — usa filtros para refinar
                    </p>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ═══ PERFIL DEL ALUMNO ═══ */}
        {alumnoSelec && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">

            {/* Tarjeta de identidad */}
            <div className="bg-gradient-to-r from-purple-900/40 to-slate-800/60 border border-purple-500/30 rounded-xl p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-black text-2xl shrink-0">
                    {nombreAlumno.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white leading-tight">{nombreAlumno}</h2>
                    <p className="text-purple-300 text-sm font-medium">
                      {normGrado(alumnoSelec.grado)}° Grado · Sección {normSeccion(alumnoSelec.seccion)}
                    </p>
                    <p className="text-slate-400 text-xs mt-1">
                      DNI: {alumnoSelec.dni || '—'} · {alumnoSelec.sexo || ''}
                      {filtroCurso && <span className="ml-2 text-cyan-400">· {filtroCurso}</span>}
                      {filtroBimestre && <span className="ml-2 text-cyan-400">· {filtroBimestre}° Bim.</span>}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={exportarInforme}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-300 rounded-lg text-xs font-medium transition-colors">
                    <Download className="w-3.5 h-3.5" /> Exportar TXT
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
                <motion.button key={t.id} onClick={() => setActiveTab(t.id)}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${
                    activeTab === t.id
                      ? 'bg-cyan-600 text-white border-cyan-500 shadow-lg shadow-cyan-500/30'
                      : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-white hover:border-slate-600'
                  }`}>
                  {t.icon}
                  {t.label}
                </motion.button>
              ))}
            </div>

            {/* ══ TAB: RESUMEN ══ */}
            {activeTab === 'resumen' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-slate-800/60 border border-purple-500/20 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Award className="w-4 h-4 text-purple-400" />
                      <p className="text-slate-400 text-xs uppercase font-semibold">Promedio</p>
                    </div>
                    {pg ? (
                      <div>
                        <span className={`text-2xl font-black px-3 py-1 rounded-lg border ${CAL_BG[pg]}`} translate="no">{pg}</span>
                        <p className="text-slate-400 text-xs mt-1" translate="no">{CAL_LABEL[pg]}</p>
                      </div>
                    ) : (
                      <p className="text-2xl font-black text-slate-600">—</p>
                    )}
                  </div>

                  <div className={`bg-slate-800/60 border rounded-xl p-4 ${
                    pctAsist >= 80 ? 'border-green-500/20' : pctAsist >= 60 ? 'border-yellow-500/20' : 'border-red-500/20'
                  }`}>
                    <div className="flex items-center gap-2 mb-2">
                      <CheckSquare className={`w-4 h-4 ${pctAsist >= 80 ? 'text-green-400' : pctAsist >= 60 ? 'text-yellow-400' : 'text-red-400'}`} />
                      <p className="text-slate-400 text-xs uppercase font-semibold">Asistencia</p>
                    </div>
                    <p className={`text-2xl font-black ${pctAsist >= 80 ? 'text-green-300' : pctAsist >= 60 ? 'text-yellow-300' : 'text-red-300'}`}>
                      {totalDias > 0 ? `${pctAsist}%` : '—'}
                    </p>
                    {totalDias > 0 && <p className="text-slate-500 text-xs">{presentes}/{totalDias} días</p>}
                  </div>

                  <div className="bg-slate-800/60 border border-emerald-500/20 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Award className="w-4 h-4 text-emerald-400" />
                      <p className="text-slate-400 text-xs uppercase font-semibold">Refuerzo</p>
                    </div>
                    {refTotal > 0 ? (
                      <>
                        <p className={`text-2xl font-black ${refPctAsist >= 80 ? 'text-emerald-300' : refPctAsist >= 60 ? 'text-yellow-300' : 'text-red-300'}`}>
                          {refPctAsist}%
                        </p>
                        <p className="text-slate-500 text-xs">{refAsistio}/{refTotal} sesiones</p>
                      </>
                    ) : (
                      <p className="text-2xl font-black text-slate-600">—</p>
                    )}
                  </div>

                  <div className="bg-slate-800/60 border border-green-500/20 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="w-4 h-4 text-green-400" />
                      <p className="text-slate-400 text-xs uppercase font-semibold">Normas</p>
                    </div>
                    <p className="text-2xl font-black text-green-300">{normasCumple.length}</p>
                    <p className="text-slate-500 text-xs">de {normasAlumno.length} registros</p>
                  </div>
                </div>

                {/* Competencias resumen */}
                <div className="bg-slate-800/60 border border-purple-500/20 rounded-xl p-5">
                  <h3 className="text-white font-bold uppercase text-sm tracking-wider mb-4 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-purple-400" /> Competencias — Comunicación
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {COMPETENCIAS.map(comp => {
                      const prom = getPromComp(comp.id);
                      const cols = columnasFiltradas.filter(c => c.competenciaId === comp.id);
                      const calsComp = calAlumno.filter(c => cols.some(cc => cc.id === c.columnaId));
                      return (
                        <div key={comp.id} className="p-4 rounded-xl bg-slate-700/30 border border-slate-600/40">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <p className="text-white font-bold text-sm">{comp.label}</p>
                              <p className="text-slate-400 text-xs">{comp.nombre}</p>
                            </div>
                            {prom ? (
                              <span className={`text-xl font-black border-2 rounded-lg px-2 py-0.5 ${CAL_BG[prom]}`} translate="no">{prom}</span>
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
                  <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-5">
                    <h3 className="text-white font-bold uppercase text-sm tracking-wider mb-3 flex items-center gap-2">
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
                              <span className="px-2 py-0.5 bg-green-500/20 text-green-300 rounded-lg border border-green-500/30">
                                ✓ {stats.cumple}
                              </span>
                              <span className="px-2 py-0.5 bg-red-500/20 text-red-300 rounded-lg border border-red-500/30">
                                ✗ {stats.noCumple}
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

            {/* ══ TAB: CALIFICATIVOS ══ */}
            {activeTab === 'notas' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                {COMPETENCIAS.map(comp => {
                  const cols = columnasFiltradas.filter(c => c.competenciaId === comp.id);
                  const prom = getPromComp(comp.id);
                  return (
                    <div key={comp.id} className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-5">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-white font-bold">{comp.label} — {comp.nombre}</h3>
                          <p className="text-slate-400 text-xs mt-0.5">{cols.length} evaluaciones configuradas</p>
                        </div>
                        {prom && (
                          <div className="text-right">
                            <span className={`text-2xl font-black border-2 rounded-xl px-3 py-1 ${CAL_BG[prom]}`} translate="no">{prom}</span>
                            <p className="text-slate-400 text-xs mt-1">{CAL_LABEL[prom]}</p>
                          </div>
                        )}
                      </div>
                      {cols.length === 0 ? (
                        <p className="text-slate-500 text-sm text-center py-4">Sin evaluaciones configuradas para esta competencia</p>
                      ) : (
                        <div className="space-y-1.5">
                          {cols.map(col => {
                            const cal = calAlumno.find(c => c.columnaId === col.id);
                            return (
                              <div key={col.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-slate-700/20 border border-slate-700/40">
                                <div className="min-w-0 flex-1">
                                  <p className="text-white text-sm font-medium">{col.nombre}</p>
                                  {col.tipo && <p className="text-slate-500 text-xs">{col.tipo}</p>}
                                </div>
                                {cal ? (
                                  <span className={`text-sm font-bold border rounded-lg px-2.5 py-0.5 ml-3 ${CAL_BG[cal.calificativo]}`} translate="no">
                                    {cal.calificativo}
                                  </span>
                                ) : (
                                  <span className="text-slate-600 text-sm ml-3">—</span>
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

            {/* ══ TAB: ASISTENCIA ══ */}
            {activeTab === 'asistencia' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {[
                    { label: 'Asistió', val: asistio, icon: <CheckCircle className="w-4 h-4 text-emerald-400" />, bg: 'border-emerald-500/20' },
                    { label: 'Faltó', val: falto, icon: <XCircle className="w-4 h-4 text-red-400" />, bg: 'border-red-500/20' },
                    { label: 'Retrasado', val: retrasado, icon: <Clock className="w-4 h-4 text-amber-400" />, bg: 'border-amber-500/20' },
                    { label: 'Justificó', val: justifico, icon: <FileText className="w-4 h-4 text-blue-400" />, bg: 'border-blue-500/20' },
                    { label: 'Permiso', val: permiso, icon: <AlertTriangle className="w-4 h-4 text-violet-400" />, bg: 'border-violet-500/20' },
                  ].map(s => (
                    <div key={s.label} className={`bg-slate-800/60 border ${s.bg} rounded-xl p-4`}>
                      <div className="flex items-center gap-2 mb-1">{s.icon} <p className="text-slate-400 text-xs uppercase">{s.label}</p></div>
                      <p className="text-2xl font-black text-white">{s.val}</p>
                    </div>
                  ))}
                </div>

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
                      {pctAsist >= 80 ? '✓ Asistencia adecuada' : pctAsist >= 60 ? '⚠ Asistencia regular' : '✗ Asistencia crítica'}
                    </p>
                  </div>
                )}

                <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl overflow-hidden">
                  <div className="px-5 py-3 bg-slate-700/30 border-b border-slate-700">
                    <h3 className="text-white font-bold text-sm uppercase tracking-wider flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-cyan-400" /> Historial de Asistencia
                    </h3>
                  </div>
                  {ultimasAsistencias.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                      <CheckSquare className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      <p>Sin registros de asistencia</p>
                    </div>
                  ) : (
                    <div className="max-h-[40vh] overflow-y-auto divide-y divide-slate-700/40">
                      {ultimasAsistencias.map((r, i) => {
                        const est = estadoAsistLabel[r.estado] || { label: r.estado, color: 'bg-slate-700 text-slate-300 border-slate-600' };
                        return (
                          <div key={r.id || i} className="flex items-center gap-3 px-5 py-2.5 hover:bg-slate-700/20 transition-colors">
                            <div className={`w-2 h-2 rounded-full shrink-0 ${
                              r.estado === 'asistio' ? 'bg-emerald-400'
                              : r.estado === 'retrasado' ? 'bg-amber-400'
                              : r.estado === 'justifico' ? 'bg-blue-400'
                              : r.estado === 'permiso' ? 'bg-violet-400'
                              : 'bg-red-400'
                            }`} />
                            <p className="text-slate-300 text-sm font-mono w-24">{r.fecha}</p>
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded border ${est.color}`}>
                              {est.label}
                            </span>
                            {r.horaRegistro && <span className="text-xs text-slate-500 ml-auto">{r.horaRegistro}</span>}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* ══ TAB: REFUERZO ══ */}
            {activeTab === 'refuerzo' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: 'Asistió', val: refAsistio, bg: 'border-emerald-500/20', text: 'text-emerald-300' },
                    { label: 'Tardanza', val: refTardanza, bg: 'border-amber-500/20', text: 'text-amber-300' },
                    { label: 'Falta', val: refFalta, bg: 'border-red-500/20', text: 'text-red-300' },
                    { label: 'Permiso', val: refPermiso, bg: 'border-violet-500/20', text: 'text-violet-300' },
                  ].map(s => (
                    <div key={s.label} className={`bg-slate-800/60 border ${s.bg} rounded-xl p-4`}>
                      <p className="text-slate-400 text-xs uppercase mb-1">{s.label}</p>
                      <p className={`text-2xl font-black ${s.text}`}>{s.val}</p>
                    </div>
                  ))}
                </div>

                {refTotal > 0 && (
                  <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-white font-semibold text-sm">Porcentaje de asistencia a refuerzo</p>
                      <p className={`font-black text-lg ${refPctAsist >= 80 ? 'text-green-300' : refPctAsist >= 60 ? 'text-yellow-300' : 'text-red-300'}`}>
                        {refPctAsist}%
                      </p>
                    </div>
                    <div className="w-full h-3 bg-slate-700 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${refPctAsist >= 80 ? 'bg-green-500' : refPctAsist >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                        style={{ width: `${refPctAsist}%` }} />
                    </div>
                  </div>
                )}

                <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl overflow-hidden">
                  <div className="px-5 py-3 bg-emerald-900/20 border-b border-emerald-700/30">
                    <h3 className="text-white font-bold text-sm uppercase tracking-wider flex items-center gap-2">
                      <Award className="w-4 h-4 text-emerald-400" /> Historial de Refuerzo
                    </h3>
                  </div>
                  {refuerzoAlumno.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                      <Award className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      <p>Sin registros de refuerzo</p>
                    </div>
                  ) : (
                    <div className="max-h-[40vh] overflow-y-auto divide-y divide-slate-700/40">
                      {[...refuerzoAlumno].sort((a, b) => b.fecha.localeCompare(a.fecha)).map((r, i) => {
                        const est = estadoRefLabel[r.estado] || { label: r.estado, color: 'bg-slate-700 text-slate-300 border-slate-600' };
                        return (
                          <div key={r.id || i} className="flex items-center gap-3 px-5 py-2.5 hover:bg-slate-700/20 transition-colors">
                            <div className={`w-2 h-2 rounded-full shrink-0 ${
                              r.estado === 'asistio' ? 'bg-emerald-400'
                              : r.estado === 'tardanza' ? 'bg-amber-400'
                              : 'bg-red-400'
                            }`} />
                            <p className="text-slate-300 text-sm font-mono w-24">{r.fecha}</p>
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded border ${est.color}`}>
                              {est.label}
                            </span>
                            {r.horaRegistro && <span className="text-xs text-slate-500 ml-auto">{r.horaRegistro}</span>}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* ══ TAB: NORMAS ══ */}
            {activeTab === 'normas' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
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

                {allEjes.length > 0 && (
                  <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-5">
                    <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-3">Por Eje de Convivencia</h3>
                    <div className="space-y-2">
                      {allEjes.map(([ejeId, st]) => {
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

                <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl overflow-hidden">
                  <div className="px-5 py-3 bg-slate-700/30 border-b border-slate-700">
                    <h3 className="text-white font-bold text-sm uppercase tracking-wider flex items-center gap-2">
                      <Shield className="w-4 h-4 text-purple-400" /> Historial de Conductas
                    </h3>
                  </div>
                  {normasAlumno.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                      <Shield className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      <p>Sin registros de conducta</p>
                    </div>
                  ) : (
                    <div className="max-h-[40vh] overflow-y-auto divide-y divide-slate-700/40">
                      {[...normasAlumno].reverse().slice(0, 30).map((r, i) => {
                        const eje = EJES_MAP[r.ejeId];
                        const conducta = CONDUCTAS_MAP[r.conductaId] || r.conductaId;
                        return (
                          <div key={r.id || i} className={`flex items-start gap-3 px-5 py-3 ${
                            r.cumplimiento === 'cumple' ? 'bg-green-500/5' : 'bg-red-500/5'
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
                                {r.cumplimiento === 'cumple' ? '+' : '-'}{Math.abs(r.puntos)}pts
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

            {/* ══ TAB: DATOS ══ */}
            {activeTab === 'datos' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-5 space-y-4">
                <h3 className="text-white font-bold text-sm uppercase tracking-wider">Datos Personales</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
