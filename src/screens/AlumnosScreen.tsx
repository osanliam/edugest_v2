import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Trash2, Edit2, Search, Upload, Download, X, Check, AlertCircle, RefreshCw, ChevronDown, ChevronUp, Phone, Users } from 'lucide-react';
import { getAlumnosPaginado, crearAlumno, editarAlumno, eliminarAlumno, getAsignaciones, cargarTodo } from '../utils/apiClient';
import * as XLSX from 'xlsx';
import HeaderElegante from '../components/HeaderElegante';

interface Apoderado {
  apellidos_nombres: string;
  dni: string;
  celular: string;
}

interface Alumno {
  id: string;
  apellidos_nombres: string;
  dni: string;
  fecha_nacimiento: string;
  edad: number;
  sexo: string;
  grado: string;
  seccion: string;
  madre?: Apoderado;
  padre?: Apoderado;
  madre_nombres?: string;
  madre_dni?: string;
  madre_celular?: string;
  padre_nombres?: string;
  padre_dni?: string;
  padre_celular?: string;
}

const GRADOS = ['1°', '2°', '3°', '4°', '5°'];
const SECCIONES = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
const SEXOS = ['Masculino', 'Femenino'];

// ── Sin localStorage — todo va directo a Turso vía API ───────────────────────

function calcularEdad(fecha: string): number {
  if (!fecha) return 0;
  const hoy = new Date(); const nac = new Date(fecha);
  let edad = hoy.getFullYear() - nac.getFullYear();
  if (hoy.getMonth() - nac.getMonth() < 0 || (hoy.getMonth() - nac.getMonth() === 0 && hoy.getDate() < nac.getDate())) edad--;
  return edad;
}

const inputCls = "w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2.5 text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 transition-colors text-sm font-medium";

function ApoderadoForm({ label, data, onChange }: { label: string; data: Apoderado; onChange: (d: Apoderado) => void }) {
  return (
    <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-xl p-5 space-y-4">
      <p className="text-xs font-bold text-cyan-300 uppercase tracking-widest">{label}</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="sm:col-span-3">
          <label className="block text-xs text-slate-300 mb-2 font-semibold">Apellidos y Nombres</label>
          <input type="text" value={data.apellidos_nombres}
            onChange={e => onChange({ ...data, apellidos_nombres: e.target.value })}
            placeholder="GARCÍA TORRES, María Elena" className={inputCls} />
        </div>
        <div>
          <label className="block text-xs text-slate-300 mb-2 font-semibold">DNI</label>
          <input type="text" maxLength={8} value={data.dni}
            onChange={e => onChange({ ...data, dni: e.target.value.replace(/\D/g, '') })}
            placeholder="12345678" className={inputCls} />
        </div>
        <div>
          <label className="block text-xs text-slate-300 mb-2 font-semibold">N° Celular</label>
          <input type="text" maxLength={9} value={data.celular}
            onChange={e => onChange({ ...data, celular: e.target.value.replace(/\D/g, '') })}
            placeholder="987654321" className={inputCls} />
        </div>
      </div>
    </div>
  );
}

const emptyApod: Apoderado = { apellidos_nombres: '', dni: '', celular: '' };
const emptyForm = {
  id: '', apellidos_nombres: '', dni: '', fecha_nacimiento: '',
  edad: 0, sexo: '', grado: '', seccion: '',
  madre: { ...emptyApod }, padre: { ...emptyApod },
};

// Helper: ejecuta promesas con concurrencia limitada
async function asyncPool<T>(concurrency: number, items: T[], fn: (item: T) => Promise<any>) {
  const results: any[] = [];
  const executing: Promise<void>[] = [];
  for (const item of items) {
    const p = Promise.resolve().then(() => fn(item));
    results.push(p);
    if (items.length >= concurrency) {
      const e: Promise<void> = p.then(() => {
        executing.splice(executing.indexOf(e), 1);
      });
      executing.push(e);
      if (executing.length >= concurrency) {
        await Promise.race(executing);
      }
    }
  }
  return Promise.all(results);
}

interface AlumnosScreenProps {
  user?: { id: string; name: string; email: string; role: string; schoolId?: string };
}

export default function AlumnosScreen({ user }: AlumnosScreenProps = {}) {
  const esDocente = user?.role === 'teacher';
  const [asignacionDocente, setAsignacionDocente] = useState<{ grados: string[]; secciones: string[] } | null>(null);

  const [alumnos, setAlumnos] = useState<Alumno[]>([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filtroGrado, setFiltroGrado] = useState('');
  const [filtroSeccion, setFiltroSeccion] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState<Alumno | null>(null);
  const [expandido, setExpandido] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [eliminando, setEliminando] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ tipo: 'ok' | 'err'; texto: string } | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [showImport, setShowImport] = useState(false);
  const [importRows, setImportRows] = useState<any[]>([]);
  const [importando, setImportando] = useState(false);
  const [importResult, setImportResult] = useState<{ ok: number; err: number } | null>(null);
  const [cargaProgreso, setCargaProgreso] = useState<{ actual: number; total: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const mostrar = (tipo: 'ok' | 'err', texto: string) => {
    setMsg({ tipo, texto }); setTimeout(() => setMsg(null), 3500);
  };

  const cargar = async () => {
    setCargando(true);
    setCargaProgreso(null);
    try {
      // 1) Cargar desde localStorage PRIMERO (siempre funciona)
      const local = JSON.parse(localStorage.getItem('ie_alumnos') || '[]');
      if (Array.isArray(local) && local.length > 0) {
        setAlumnos(local);
      }

      // 2) Intentar descargar desde API en lotes de 200 (solo si hay conexión)
      const LOTE = 200;
      let todos: Alumno[] = local || [];
      try {
        const primera = await getAlumnosPaginado(LOTE, 0);
        if (primera.alumnos && Array.isArray(primera.alumnos)) {
          todos = primera.alumnos;
          let total = primera.total || 0;
          setCargaProgreso({ actual: todos.length, total });

          while (todos.length < total) {
            const offset = todos.length;
            const pag = await getAlumnosPaginado(LOTE, offset);
            if (pag.alumnos && Array.isArray(pag.alumnos)) {
              todos = [...todos, ...pag.alumnos];
            }
            setCargaProgreso({ actual: todos.length, total });
          }
          localStorage.setItem('ie_alumnos', JSON.stringify(todos));
          setAlumnos(todos);
        }
      } catch (e) {
        // Turso no responde, usar localStorage que ya cargamos arriba
        console.log('Turso no disponible, usando localStorage:', local.length, 'alumnos');
      }
    } catch (e: any) {
      mostrar('err', 'Error al cargar alumnos: ' + e.message);
    } finally {
      setCargando(false);
      setCargaProgreso(null);
    }
  };

  const parsearAsignaciones = (asigs: any[]): any[] =>
    asigs.map((a: any) => ({
      ...a,
      grados:    typeof a.grados    === 'string' ? JSON.parse(a.grados    || '[]') : (a.grados    || []),
      secciones: typeof a.secciones === 'string' ? JSON.parse(a.secciones || '[]') : (a.secciones || []),
      cursos:    typeof a.cursos    === 'string' ? JSON.parse(a.cursos    || '[]') : (a.cursos    || []),
    }));

  const cargarAsignacion = async () => {
    if (!esDocente || !user?.email) return;
    try {
      // 1) Intentar primero desde localStorage (rápido, sin red)
      let asignaciones: any[] = [];
      const localAsigs = JSON.parse(localStorage.getItem('cfg_asignaciones') || '[]');
      if (localAsigs.length > 0) {
        asignaciones = parsearAsignaciones(localAsigs);
      } else {
        // 2) Solo si localStorage está vacío, consultar Turso (solo asignaciones)
        try {
          const todo = await cargarTodo('asignaciones');
          asignaciones = parsearAsignaciones(todo.asignaciones || []);
          if (asignaciones.length > 0) {
            localStorage.setItem('cfg_asignaciones', JSON.stringify(todo.asignaciones));
          }
        } catch {
          asignaciones = [];
        }
      }

      const docenteId = (user as any).docenteId;
      const userId    = (user as any).id;
      const mias = asignaciones.filter((a: any) =>
        (docenteId && a.docenteId === docenteId) ||
        (userId    && a.docenteId === userId)
      );
      if (mias.length > 0) {
        const grados   = [...new Set(mias.flatMap((a: any) => a.grados || []))] as string[];
        const secciones = [...new Set(mias.flatMap((a: any) => a.secciones || []))] as string[];
        setAsignacionDocente({ grados, secciones });
        if (grados.length > 0)   setFiltroGrado(grados[0]);
        if (secciones.length > 0) setFiltroSeccion(secciones[0]);
      }
    } catch (e) {
      console.error('Error cargando asignación:', e);
    }
  };

  const sincronizarDesdeTurso = async () => {
    setCargando(true);
    try {
      mostrar('ok', '📥 Descargando datos de la nube...');
      // Paso 1: descargar lo esencial (sin calificaciones ni asistencia que son muy grandes)
      const todo = await cargarTodo('alumnos,asignaciones,docentes,columnas,unidades,normas');
      let guardados = 0;
      if (todo.asignaciones?.length) {
        localStorage.setItem('cfg_asignaciones', JSON.stringify(todo.asignaciones));
        guardados++;
      }
      if (todo.alumnos?.length) {
        localStorage.setItem('ie_alumnos', JSON.stringify(todo.alumnos));
        guardados++;
      }
      if (todo.docentes?.length) {
        localStorage.setItem('ie_docentes', JSON.stringify(todo.docentes));
        guardados++;
      }
      if (todo.columnas?.length) {
        localStorage.setItem('cal_columnas', JSON.stringify(todo.columnas));
        guardados++;
      }
      if (todo.unidades?.length) {
        localStorage.setItem('cfg_unidades', JSON.stringify(todo.unidades));
        guardados++;
      }
      if (todo.normas?.length) {
        localStorage.setItem('cfg_normas_convivencia', JSON.stringify(todo.normas));
        guardados++;
      }
      mostrar('ok', `✅ ${guardados} tablas descargadas. Recargando...`);
      cargar();
      cargarAsignacion();
      // Paso 2: en segundo plano, descargar calificaciones y asistencia
      try {
        const resto = await cargarTodo('calificaciones,asistencia');
        if (resto.calificaciones?.length) {
          localStorage.setItem('ie_calificativos_v2', JSON.stringify(resto.calificaciones));
        }
        if (resto.asistencia?.length) {
          localStorage.setItem('ie_asistencia', JSON.stringify(resto.asistencia));
        }
      } catch { /* silencioso */ }
    } catch (e: any) {
      mostrar('err', '❌ Error descargando: ' + e.message);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
    cargarAsignacion();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.apellidos_nombres || !form.dni || !form.fecha_nacimiento || !form.sexo || !form.grado || !form.seccion)
      return mostrar('err', 'Completa los campos obligatorios');
    setGuardando(true);
    try {
      const payload = {
        apellidos_nombres: form.apellidos_nombres,
        dni: form.dni,
        fecha_nacimiento: form.fecha_nacimiento,
        sexo: form.sexo,
        grado: form.grado,
        seccion: form.seccion,
        madre: form.madre,
        padre: form.padre,
      };
      if (editando) {
        await editarAlumno(editando.id, payload);
        mostrar('ok', 'Alumno actualizado');
      } else {
        await crearAlumno(payload);
        mostrar('ok', 'Alumno registrado');
      }
      setShowForm(false); setEditando(null); setForm(emptyForm);
      cargar();
    } catch (e: any) { mostrar('err', e.message); }
    finally { setGuardando(false); }
  };

  const handleEliminar = async (id: string) => {
    if (!confirm('¿Eliminar este alumno?')) return;
    setEliminando(id);
    try {
      await eliminarAlumno(id);
      mostrar('ok', 'Alumno eliminado');
      cargar();
    } catch (e: any) { mostrar('err', e.message); }
    finally { setEliminando(null); }
  };

  const handleEditar = (a: Alumno) => {
    setEditando(a);
    setForm({
      ...a,
      madre: { apellidos_nombres: a.madre_nombres || '', dni: a.madre_dni || '', celular: a.madre_celular || '' },
      padre: { apellidos_nombres: a.padre_nombres || '', dni: a.padre_dni || '', celular: a.padre_celular || '' },
    });
    setShowForm(true);
  };

  const handleArchivo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    try {
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(new Uint8Array(buffer), { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const allRows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

      let hIdx = 0;
      for (let i = 0; i < Math.min(allRows.length, 5); i++) {
        const r = allRows[i];
        if (r.some((c: any) => String(c).toUpperCase().includes('APELLIDO') || String(c).toUpperCase().includes('DNI'))) {
          hIdx = i; break;
        }
      }
      const headers: string[] = allRows[hIdx].map((h: any) => String(h).trim().toUpperCase());
      const dataRows = allRows.slice(hIdx + 1).filter((r: any[]) => r.some((c: any) => c !== ''));

      const colVal = (row: any[], ...terms: string[]): string => {
        for (const t of terms) {
          const i = headers.findIndex(h => h.includes(t.toUpperCase()));
          if (i >= 0 && row[i] !== undefined && row[i] !== '') return String(row[i]).trim();
        }
        return '';
      };

      const toDate = (val: any): string => {
        if (!val) return '';
        if (typeof val === 'number') {
          const d = new Date(Math.round((val - 25569) * 86400 * 1000));
          return d.toISOString().split('T')[0];
        }
        if (val instanceof Date) return val.toISOString().split('T')[0];
        const s = String(val).trim();
        const parts = s.split(/[\/\-\.]/);
        if (parts.length === 3) {
          const [p1, p2, p3] = parts.map(Number);
          if (p3 > 999) {
            const day = p1 > 12 ? p1 : p2;
            const month = p1 > 12 ? p2 : p1;
            const d = new Date(p3, month - 1, day);
            if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
          }
          if (p1 > 999) {
            const d = new Date(p1, p2 - 1, p3);
            if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
          }
        }
        const d = new Date(s);
        return isNaN(d.getTime()) ? s : d.toISOString().split('T')[0];
      };

      const normalizarSexo = (val: string): string => {
        const v = val.trim().toUpperCase();
        if (v.startsWith('M') || v === 'H' || v === 'HOMBRE' || v === 'MASC') return 'Masculino';
        if (v.startsWith('F') || v === 'MUJER' || v === 'FEM') return 'Femenino';
        return val;
      };

      const gradoMap: Record<string, string> = {
        'PRIMERO': '1°', 'SEGUNDO': '2°', 'TERCERO': '3°',
        'CUARTO': '4°', 'QUINTO': '5°', 'SEXTO': '6°',
        '1': '1°', '2': '2°', '3': '3°', '4': '4°', '5': '5°', '6': '6°',
      };

      const normalizarGrado = (val: string): string => {
        const v = val.trim().toUpperCase();
        if (gradoMap[v]) return gradoMap[v];
        if (/^\d°$/.test(v)) return v;
        const match = v.match(/^(\d)/);
        if (match) return gradoMap[match[1]] || val;
        for (const [key, mapped] of Object.entries(gradoMap)) {
          if (v.startsWith(key)) return mapped;
        }
        return val;
      };

      const rows = dataRows.map((r: any[]) => ({
        apellidos_nombres: colVal(r, 'APELLIDOS Y NOMBRES', 'APELLIDO'),
        dni:               colVal(r, 'N° DNI DEL ALUMNO', 'DNI DEL ALUMNO', 'DNI'),
        fecha_nacimiento:  toDate(r[headers.findIndex(h => h.includes('NACIMIENTO'))]),
        sexo:              normalizarSexo(colVal(r, 'SEXO')),
        grado:             normalizarGrado(colVal(r, 'GRADO DE ESTUDIOS', 'GRADO')),
        seccion:           (() => {
          const raw = colVal(r, 'SECCI', 'SECCION', 'SECCIÓN');
          const m = raw.toUpperCase().match(/[A-Z]/);
          return m ? m[0] : raw.toUpperCase();
        })(),
        madre: {
          apellidos_nombres: colVal(r, 'NOMBRES DE LA MADRE', 'MADRE'),
          dni:               colVal(r, 'DNI MADRE'),
          celular:           colVal(r, 'CELULAR  DE LA MADRE', 'CELULAR DE LA MADRE'),
        },
        padre: {
          apellidos_nombres: colVal(r, 'NOMBRES DEL PADRE', 'PADRE'),
          dni:               colVal(r, 'DNI PADRE'),
          celular:           colVal(r, 'CELULAR DEL PADRE'),
        },
      }));
      setImportRows(rows.filter((r: any) => r.apellidos_nombres && r.dni));
      setImportResult(null);
      setShowImport(true);
    } catch { mostrar('err', 'Error leyendo el archivo Excel'); }
  };

  const handleImportar = async () => {
    setImportando(true);
    const dniExistentes = new Set(alumnos.map(a => a.dni));
    const nuevos = importRows.filter((r: any) => r.apellidos_nombres && r.dni && !dniExistentes.has(r.dni));
    const duplicados = importRows.length - nuevos.length;
    let ok = 0, err = 0;
    const erroresDetalle: string[] = [];

    // SIEMPRE guardar en localStorage primero (funciona offline)
    const localNuevos = nuevos.map((r: any) => ({
      id: `alu-dni-${r.dni}`,
      apellidos_nombres: r.apellidos_nombres,
      dni: r.dni,
      fecha_nacimiento: r.fecha_nacimiento,
      edad: calcularEdad(r.fecha_nacimiento),
      sexo: r.sexo,
      grado: r.grado,
      seccion: r.seccion,
      madre_nombres: r.madre?.apellidos_nombres || '',
      madre_dni: r.madre?.dni || '',
      madre_celular: r.madre?.celular || '',
      padre_nombres: r.padre?.apellidos_nombres || '',
      padre_dni: r.padre?.dni || '',
      padre_celular: r.padre?.celular || '',
    }));
    const existentes = JSON.parse(localStorage.getItem('ie_alumnos') || '[]');
    const todos = [...existentes.filter((a: any) => !localNuevos.find((n: any) => n.dni === a.dni)), ...localNuevos];
    localStorage.setItem('ie_alumnos', JSON.stringify(todos));
    setAlumnos(todos);

    try {
      // Intentar subir a Turso via /api/sync con batches de 100
      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token') || '';
      const LOTE = 100;
      for (let i = 0; i < nuevos.length; i += LOTE) {
        const lote = nuevos.slice(i, i + LOTE).map((r: any) => ({
          id: `alu-dni-${r.dni}`,
          apellidos_nombres: r.apellidos_nombres,
          nombre: '',
          dni: r.dni,
          fecha_nacimiento: r.fecha_nacimiento,
          edad: calcularEdad(r.fecha_nacimiento),
          sexo: r.sexo,
          grado: r.grado,
          seccion: r.seccion,
          telefono: '',
          direccion: '',
          apelidosPadre: r.padre?.apellidos_nombres || '',
          nombreMadre: r.madre?.apellidos_nombres || '',
          email: '',
          extra: JSON.stringify({ madre: r.madre, padre: r.padre }),
        }));
        const res = await fetch('/api/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ tipo: 'alumnos', datos: lote }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
          err += lote.length;
          erroresDetalle.push(`Lote ${i}-${i+lote.length}: ${body.error || 'Error desconocido'}`);
          continue;
        }
        const data = await res.json();
        if (data.success === false || data.error) {
          err += lote.length;
          erroresDetalle.push(`Lote ${i}-${i+lote.length}: ${data.error || 'Error del servidor'}`);
          continue;
        }
        ok += data.ok || 0;
        err += data.errores || 0;
      }
      const yaExistian = duplicados;
      const fallaron = err;
      const subieron = ok;

      setImportResult({ ok: subieron + localNuevos.length, err: fallaron });

      if (yaExistian > 0 && subieron === 0 && fallaron === 0) {
        mostrar('ok', `${yaExistian} alumnos ya estaban importados. Listos para trabajar.`);
      } else if (subieron > 0) {
        mostrar('ok', `${subieron} alumnos subidos a Turso. ${yaExistian} ya existían.`);
      } else if (fallaron > 0) {
        mostrar('err', `${fallaron} alumnos fallaron en Turso, pero ${localNuevos.length} están guardados localmente.`);
        console.error('Errores Turso:', erroresDetalle);
      } else {
        mostrar('ok', `${localNuevos.length} alumnos guardados localmente. Listos para trabajar.`);
      }
    } catch (e: any) {
      mostrar('ok', `${localNuevos.length} alumnos guardados localmente. Turso no responde.`);
      console.error('Error Turso:', e);
    } finally {
      setImportando(false);
      setShowImport(false);
      setImportRows([]);
    }
  };

  const descargarPlantilla = () => {
    const data = [
      { 'APELLIDOS Y NOMBRES': 'MENDEZ FLORES, Carlos Alberto', 'DNI': '75123456', 'FECHA DE NACIMIENTO': '2010-05-12', 'SEXO': 'Masculino', 'GRADO': '3°', 'SECCIÓN': 'A', 'NOMBRES DE LA MADRE': 'FLORES RÍOS, Ana María', 'DNI MADRE': '41234567', 'CELULAR DE LA MADRE': '987654321', 'NOMBRES DEL PADRE': 'MENDEZ TORRES, Pedro Luis', 'DNI PADRE': '40123456', 'CELULAR DEL PADRE': '976543210' },
    ];
    const ws = XLSX.utils.json_to_sheet(data);
    ws['!cols'] = Array(12).fill({ wch: 28 });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Alumnos');
    XLSX.writeFile(wb, 'plantilla_alumnos.xlsx');
  };

  const importarAsignacionDocente = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(String(ev.target?.result || '{}'));
        if (data.tipo !== 'asignacion_docente') {
          mostrar('err', 'Archivo no válido. Usa el archivo generado desde Configuración > Asignaciones.');
          return;
        }
        // Guardar asignaciones y alumnos en localStorage
        if (Array.isArray(data.asignaciones)) {
          localStorage.setItem('cfg_asignaciones', JSON.stringify(data.asignaciones));
        }
        if (Array.isArray(data.alumnos)) {
          localStorage.setItem('ie_alumnos', JSON.stringify(data.alumnos));
        }
        mostrar('ok', '✅ Asignación cargada. Recargando...');
        cargar();
        cargarAsignacion();
      } catch {
        mostrar('err', 'Error leyendo el archivo JSON');
      }
    };
    reader.readAsText(file);
  };

  // Si es docente, filtrar solo por sus grados y secciones asignadas
  const normGrado = (g: string) => String(g || '').trim().replace(/°$/, '');
  const alumnosBase = esDocente && asignacionDocente
    ? alumnos.filter(a => {
        const gradosNorm    = asignacionDocente.grados.map(normGrado);
        const seccionesNorm = asignacionDocente.secciones.map(s => s.trim().toUpperCase());
        return gradosNorm.includes(normGrado(a.grado)) &&
               seccionesNorm.includes((a.seccion || '').trim().toUpperCase());
      })
    : alumnos;

  const filtrados = alumnosBase.filter(a => {
    const b = busqueda.toLowerCase();
    const matchB = a.apellidos_nombres.toLowerCase().includes(b) || a.dni.includes(b) ||
      (a.madre_nombres || '').toLowerCase().includes(b) || (a.padre_nombres || '').toLowerCase().includes(b);
    const matchG = !filtroGrado || a.grado === filtroGrado;
    const matchS = !filtroSeccion || a.seccion === filtroSeccion;
    return matchB && matchG && matchS;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden p-6">
      {/* Fondo animado */}
      <div className="fixed inset-0 -z-50">
        <div className="absolute inset-0 bg-gradient-cyber opacity-60"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto space-y-8">
        <HeaderElegante
          icon={Users}
          title={esDocente ? "MIS ALUMNOS" : "EDUGEST ALUMNOS"}
          subtitle={esDocente && asignacionDocente
            ? `${filtrados.length} alumnos · Grados: ${asignacionDocente.grados.join(', ')} · Secciones: ${asignacionDocente.secciones.join(', ')}`
            : `${alumnos.length} alumnos registrados`}
        >
          <button onClick={cargar} className="flex items-center gap-2 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors">
            <RefreshCw size={14} /> Actualizar
          </button>
          <button onClick={descargarPlantilla} className="flex items-center gap-2 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors">
            <Download size={14} /> Plantilla Excel
          </button>
          <label className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium cursor-pointer transition-colors shadow-lg hover:shadow-emerald-500/40">
            <Upload size={14} /> Importar Excel
            <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleArchivo} />
          </label>
          <button onClick={() => { setEditando(null); setForm(emptyForm); setShowForm(!showForm); }}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-lg text-sm hover:from-cyan-400 hover:to-blue-500 transition-all shadow-lg hover:shadow-cyan-500/40">
            <Plus size={16} /> Nuevo Alumno
          </button>
          {esDocente && !asignacionDocente && (
            <span className="text-amber-400 text-xs px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-lg">
              ⚠️ Sin asignación — contacta al administrador
            </span>
          )}
        </HeaderElegante>

        <div className="space-y-5">
        <AnimatePresence>
          {msg && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm ${msg.tipo === 'ok' ? 'bg-green-500/20 border border-green-500/40 text-green-300' : 'bg-red-500/20 border border-red-500/40 text-red-300'}`}>
              {msg.tipo === 'ok' ? <Check size={16} /> : <AlertCircle size={16} />} {msg.texto}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Modal importación */}
        <AnimatePresence>
          {showImport && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
              <div className="bg-slate-800 border border-green-500/30 rounded-2xl w-full max-w-4xl max-h-[80vh] flex flex-col">
                <div className="flex items-center justify-between p-6 border-b border-slate-700">
                  <h2 className="text-xl font-bold text-white">📥 Importar {importRows.length} alumnos</h2>
                  <button onClick={() => { setShowImport(false); setImportRows([]); setImportResult(null); }}>
                    <X size={20} className="text-slate-400 hover:text-white" />
                  </button>
                </div>
                {importResult ? (
                  <div className="p-8 text-center space-y-4">
                    <div className="text-5xl">{importResult.err === 0 ? '🎉' : '⚠️'}</div>
                    <p className="text-white text-xl font-bold">Importación completada</p>
                    <div className="flex justify-center gap-8">
                      <div><div className="text-3xl font-black text-green-400">{importResult.ok}</div><div className="text-slate-400 text-sm">registrados</div></div>
                      <div><div className="text-3xl font-black text-red-400">{importResult.err}</div><div className="text-slate-400 text-sm">errores (DNI duplicado)</div></div>
                    </div>
                    <button onClick={() => { setShowImport(false); setImportRows([]); setImportResult(null); }}
                      className="mt-2 px-6 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg font-bold">Cerrar</button>
                  </div>
                ) : (
                  <>
                    <div className="overflow-auto flex-1 p-4">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="text-slate-400 border-b border-slate-700">
                            {['Apellidos y Nombres', 'DNI', 'Grado', 'Sección', 'Madre', 'Padre'].map(h => (
                              <th key={h} className="text-left pb-2 pr-3 font-medium">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/50">
                          {importRows.map((r, i) => (
                            <tr key={i}>
                              <td className="py-1.5 pr-3 text-white">{r.apellidos_nombres}</td>
                              <td className="py-1.5 pr-3 text-slate-300">{r.dni}</td>
                              <td className="py-1.5 pr-3 text-slate-300">{r.grado}</td>
                              <td className="py-1.5 pr-3 text-slate-300">{r.seccion}</td>
                              <td className="py-1.5 pr-3 text-slate-300">{r.madre?.apellidos_nombres || '—'}</td>
                              <td className="py-1.5 pr-3 text-slate-300">{r.padre?.apellidos_nombres || '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="p-4 border-t border-slate-700 flex gap-3">
                      <button onClick={handleImportar} disabled={importando}
                        className="flex-1 py-2.5 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold rounded-lg disabled:opacity-60 flex items-center justify-center gap-2">
                        {importando ? <><RefreshCw size={15} className="animate-spin" />Importando...</> : `✓ Importar ${importRows.length} alumnos`}
                      </button>
                      <button onClick={() => { setShowImport(false); setImportRows([]); }}
                        className="px-5 py-2.5 bg-slate-700 text-white rounded-lg hover:bg-slate-600">Cancelar</button>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Formulario */}
        {showForm && (
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-cyan-500/30 rounded-xl p-7 space-y-6">
            <h2 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-300">{editando ? '✏️ Editar Alumno' : '➕ Nuevo Alumno'}</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <p className="text-xs font-bold text-cyan-300 uppercase tracking-widest mb-4">Datos del Alumno</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  <div className="sm:col-span-2">
                    <label className="block text-xs text-slate-300 mb-2 font-semibold">Apellidos y Nombres <span className="text-red-400">*</span></label>
                    <input type="text" value={form.apellidos_nombres} onChange={e => setForm({ ...form, apellidos_nombres: e.target.value })} placeholder="MENDEZ FLORES, Carlos Alberto" className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">DNI <span className="text-red-400">*</span></label>
                    <input type="text" maxLength={8} value={form.dni} onChange={e => setForm({ ...form, dni: e.target.value.replace(/\D/g, '') })} placeholder="75123456" className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-300 mb-2 font-semibold">Fecha de Nacimiento <span className="text-red-400">*</span></label>
                    <input type="date" value={form.fecha_nacimiento} onChange={e => setForm({ ...form, fecha_nacimiento: e.target.value })} className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Edad</label>
                    <input type="text" readOnly value={form.fecha_nacimiento ? calcularEdad(form.fecha_nacimiento) + ' años' : '—'} className={inputCls + ' opacity-60 cursor-not-allowed'} />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Sexo <span className="text-red-400">*</span></label>
                    <select value={form.sexo} onChange={e => setForm({ ...form, sexo: e.target.value })} className={inputCls}>
                      <option value="">Seleccionar...</option>
                      {SEXOS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Grado <span className="text-red-400">*</span></label>
                    <select value={form.grado} onChange={e => setForm({ ...form, grado: e.target.value })} className={inputCls}>
                      <option value="">Seleccionar...</option>
                      {GRADOS.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Sección <span className="text-red-400">*</span></label>
                    <select value={form.seccion} onChange={e => setForm({ ...form, seccion: e.target.value })} className={inputCls}>
                      <option value="">Seleccionar...</option>
                      {SECCIONES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <ApoderadoForm label="👩 Datos de la Madre" data={form.madre || emptyApod} onChange={madre => setForm({ ...form, madre })} />
                <ApoderadoForm label="👨 Datos del Padre" data={form.padre || emptyApod} onChange={padre => setForm({ ...form, padre })} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={guardando}
                  className="flex-1 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-lg disabled:opacity-60 flex items-center justify-center gap-2 text-sm">
                  {guardando ? <><RefreshCw size={14} className="animate-spin" />Guardando...</> : `✓ ${editando ? 'Actualizar' : 'Registrar'} Alumno`}
                </button>
                <button type="button" onClick={() => { setShowForm(false); setEditando(null); }} className="px-6 py-2.5 bg-slate-700 text-white rounded-lg hover:bg-slate-600 text-sm">Cancelar</button>
              </div>
            </form>
          </div>
        )}

        {/* Filtros */}
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
            <input type="text" placeholder="Buscar por nombre, DNI o apoderado..." value={busqueda} onChange={e => setBusqueda(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 transition-colors text-sm font-medium" />
          </div>
          <select value={filtroGrado} onChange={e => setFiltroGrado(e.target.value)} className="bg-slate-800 border border-slate-600 rounded-lg px-4 py-2.5 text-white text-sm font-medium focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 transition-colors">
            <option value="">Todos los grados</option>
            {GRADOS.map(g => <option key={g} value={g}>{g} Grado</option>)}
          </select>
          <select value={filtroSeccion} onChange={e => setFiltroSeccion(e.target.value)} className="bg-slate-800 border border-slate-600 rounded-lg px-4 py-2.5 text-white text-sm font-medium focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 transition-colors">
            <option value="">Todas las secciones</option>
            {SECCIONES.map(s => <option key={s} value={s}>Sección {s}</option>)}
          </select>
        </div>

        {/* Stats */}
        <div className="flex gap-3 flex-wrap text-xs">
          {GRADOS.map(g => {
            const count = alumnos.filter(a => a.grado === g).length;
            if (count === 0) return null;
            return (
              <button key={g} onClick={() => setFiltroGrado(filtroGrado === g ? '' : g)}
                className={`px-3 py-1.5 rounded-lg border transition-all ${filtroGrado === g ? 'bg-green-500/20 border-green-500/50 text-green-300' : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'}`}>
                {g} Grado · <span className="font-bold">{count}</span>
              </button>
            );
          })}
        </div>

        {/* Lista */}
        {cargando ? (
          <div className="text-center py-16">
            <RefreshCw size={30} className="animate-spin text-green-400 mx-auto mb-3" />
            <p className="text-slate-400">
              {cargaProgreso
                ? `Cargando alumnos... ${cargaProgreso.actual} de ${cargaProgreso.total}`
                : 'Cargando alumnos...'}
            </p>
            {cargaProgreso && (
              <div className="w-64 h-2 bg-slate-700 rounded-full mx-auto mt-3 overflow-hidden">
                <div
                  className="h-full bg-green-400 transition-all"
                  style={{ width: `${Math.min((cargaProgreso.actual / cargaProgreso.total) * 100, 100)}%` }}
                />
              </div>
            )}
          </div>
        ) : filtrados.length === 0 ? (
          <div className="text-center py-16 space-y-4">
            <p className="text-slate-500">No se encontraron alumnos</p>
            {esDocente && (
              <button onClick={sincronizarDesdeTurso} disabled={cargando}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-xl text-sm hover:from-green-400 hover:to-emerald-500 transition-all shadow-lg hover:shadow-green-500/30 disabled:opacity-50">
                {cargando ? <RefreshCw size={16} className="animate-spin" /> : <Download size={16} />}
                {cargando ? 'Descargando...' : '📥 Cargar datos de la nube'}
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {filtrados.map((a, i) => (
              <motion.div key={a.id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.02 }}
                className="bg-slate-800/70 border border-slate-700/60 hover:border-green-500/30 rounded-xl overflow-hidden transition-all">
                <div className="px-5 py-4 flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ${a.sexo === 'Femenino' ? 'bg-gradient-to-br from-pink-500 to-rose-600' : 'bg-gradient-to-br from-green-500 to-emerald-600'}`}>
                    {a.apellidos_nombres.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold truncate">{a.apellidos_nombres}</p>
                    <div className="flex gap-3 text-xs text-slate-400 flex-wrap mt-0.5">
                      <span>DNI: {a.dni}</span>
                      <span className="text-green-400 font-medium">{a.grado} Grado "{a.seccion}"</span>
                      <span>{a.edad} años</span>
                      <span>{a.sexo}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 items-center">
                    <button onClick={() => setExpandido(expandido === a.id ? null : a.id)} className="p-2 bg-slate-700/60 hover:bg-slate-600 rounded-lg text-slate-400">
                      {expandido === a.id ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                    </button>
                    <button onClick={() => handleEditar(a)} className="p-2 bg-blue-500/15 hover:bg-blue-500/30 rounded-lg text-blue-400"><Edit2 size={15} /></button>
                    <button onClick={() => handleEliminar(a.id)} disabled={eliminando === a.id} className="p-2 bg-red-500/15 hover:bg-red-500/30 rounded-lg text-red-400 disabled:opacity-50">
                      {eliminando === a.id ? <RefreshCw size={15} className="animate-spin" /> : <Trash2 size={15} />}
                    </button>
                  </div>
                </div>
                <AnimatePresence>
                  {expandido === a.id && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      className="border-t border-slate-700/50 px-5 py-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div className="space-y-1">
                        <p className="text-slate-500 font-medium uppercase tracking-wide">👩 Madre</p>
                        {a.madre_nombres ? (<><p className="text-white">{a.madre_nombres}</p><p className="text-slate-400">DNI: {a.madre_dni || '—'}</p>{a.madre_celular && <a href={`tel:${a.madre_celular}`} className="flex items-center gap-1 text-green-400"><Phone size={11} /> {a.madre_celular}</a>}</>) : <p className="text-slate-600">No registrada</p>}
                      </div>
                      <div className="space-y-1">
                        <p className="text-slate-500 font-medium uppercase tracking-wide">👨 Padre</p>
                        {a.padre_nombres ? (<><p className="text-white">{a.padre_nombres}</p><p className="text-slate-400">DNI: {a.padre_dni || '—'}</p>{a.padre_celular && <a href={`tel:${a.padre_celular}`} className="flex items-center gap-1 text-green-400"><Phone size={11} /> {a.padre_celular}</a>}</>) : <p className="text-slate-600">No registrado</p>}
                      </div>
                      <div className="sm:col-span-2 border-t border-slate-700/50 pt-3 grid grid-cols-3 gap-3">
                        <div><p className="text-slate-500">F. Nacimiento</p><p className="text-white">{a.fecha_nacimiento}</p></div>
                        <div><p className="text-slate-500">Edad</p><p className="text-white">{a.edad} años</p></div>
                        <div><p className="text-slate-500">Sexo</p><p className="text-white">{a.sexo}</p></div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
