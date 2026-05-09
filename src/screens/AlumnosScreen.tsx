import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Trash2, Edit2, Search, Upload, Download, X, Check, AlertCircle, RefreshCw, ChevronDown, ChevronUp, Phone, Users, GraduationCap, School } from 'lucide-react';
import { getAlumnosPaginado, crearAlumno, editarAlumno, eliminarAlumno, getAsignaciones, cargarTodo } from '../utils/apiClient';
import { getAlumnosFB, guardarAlumnoFB, eliminarAlumnoFB, guardarAlumnosBatchFB, getAsignacionesFB, AlumnoFB } from '../services/firebaseDataService';
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
  foto?: string;
}

const GRADOS = ['1°', '2°', '3°', '4°', '5°'];
const SECCIONES = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
const SEXOS = ['Masculino', 'Femenino'];
const LS_ALUMNOS = 'ie_alumnos';
const LS_ASIGNACIONES = 'cfg_asignaciones';

function calcularEdad(fecha: string): number {
  if (!fecha) return 0;
  const hoy = new Date(); const nac = new Date(fecha);
  let edad = hoy.getFullYear() - nac.getFullYear();
  if (hoy.getMonth() - nac.getMonth() < 0 || (hoy.getMonth() - nac.getMonth() === 0 && hoy.getDate() < nac.getDate())) edad--;
  return edad;
}

function lsGet<T>(key: string, def: T): T {
  try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(def)); } catch { return def; }
}
function lsSet(key: string, val: any) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) { console.error('Error guardando:', e); }
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

interface AlumnosScreenProps {
  user?: { id: string; name: string; email: string; role: string; schoolId?: string };
}

export default function AlumnosScreen({ user }: AlumnosScreenProps = {}) {
  const esDocente = user?.role === 'teacher';
  const [asignacionDocente, setAsignacionDocente] = useState<{ grados: string[]; secciones: string[] } | null>(null);

  const [alumnos, setAlumnos] = useState<Alumno[]>([]);
  const [cargando, setCargando] = useState(true);
  const [rescatando, setRescatando] = useState(false);
  const [busqueda, setBusqueda] = useState('');
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
  const fileRef = useRef<HTMLInputElement>(null);

  // NUEVO: vista dividida por grado y sección
  const [gradoSeleccionado, setGradoSeleccionado] = useState<string>('');
  const [seccionSeleccionada, setSeccionSeleccionada] = useState<string>('');
  const [modoVista, setModoVista] = useState<'grados' | 'secciones' | 'lista'>('grados');

  const mostrar = (tipo: 'ok' | 'err', texto: string) => {
    setMsg({ tipo, texto }); setTimeout(() => setMsg(null), 3500);
  };

  // CARGA INMEDIATA desde localStorage (igual que DocentesScreen/NormasConvivencia)
  const cargarDesdeLocal = (): Alumno[] => {
    const local = lsGet<Alumno[]>(LS_ALUMNOS, []);
    if (Array.isArray(local) && local.length > 0) {
      return local;
    }
    return [];
  };

  // Carga principal: FIREBASE PRIMERO, luego localStorage, luego Turso como último recurso
  // 🔄 RESCATE: si Turso tiene MÁS alumnos que Firebase, completa automáticamente
  const cargar = async () => {
    setCargando(true);
    let finalAlumnos: Alumno[] = [];
    try {
      // 1) INTENTAR FIREBASE PRIMERO (conexión directa desde el navegador)
      let fbCount = 0;
      try {
        const fbAlumnos = await getAlumnosFB();
        fbCount = fbAlumnos.length;
        if (fbAlumnos.length > 0) {
          const mapped = fbAlumnos.map(a => ({
            id: a.id,
            apellidos_nombres: a.apellidos_nombres,
            dni: a.dni,
            fecha_nacimiento: a.fecha_nacimiento,
            edad: a.edad,
            sexo: a.sexo,
            grado: a.grado,
            seccion: a.seccion,
            madre_nombres: a.madre_nombres,
            madre_dni: a.madre_dni,
            madre_celular: a.madre_celular,
            padre_nombres: a.padre_nombres,
            padre_dni: a.padre_dni,
            padre_celular: a.padre_celular,
          } as Alumno));
          finalAlumnos = mapped;
          setAlumnos(mapped);
          lsSet(LS_ALUMNOS, mapped);
          mostrar('ok', `${fbAlumnos.length} alumnos cargados desde Firebase`);
        }
      } catch {
        // Firebase no disponible, continuar
      }

      // 2) RESCATE: intentar Turso con token primero, luego SIN token (lectura pública)
      let tursoOk = false;
      try {
        const LOTE = 200;
        let todos: Alumno[] = [];
        const primera = await getAlumnosPaginado(LOTE, 0);
        if (primera.alumnos && Array.isArray(primera.alumnos)) {
          todos = primera.alumnos;
          let total = primera.total || 0;
          while (todos.length < total) {
            const offset = todos.length;
            const pag = await getAlumnosPaginado(LOTE, offset);
            if (pag.alumnos && Array.isArray(pag.alumnos)) todos = [...todos, ...pag.alumnos];
          }
          tursoOk = true;
          if (todos.length > fbCount) {
            finalAlumnos = todos;
            lsSet(LS_ALUMNOS, todos);
            setAlumnos(todos);
            mostrar('ok', `${todos.length} alumnos completos desde Turso (faltaban ${todos.length - fbCount})`);
            try { await guardarAlumnosBatchFB(todos as AlumnoFB[]); mostrar('ok', 'Todos los alumnos ahora en Firebase'); } catch {}
          }
        }
      } catch {
        // Turso con token falló, intentar SIN token (rescate de emergencia)
        try {
          const res = await fetch('/api/alumnos?limit=200&offset=0');
          if (res.ok) {
            const data = await res.json();
            let todos = data.alumnos || data || [];
            if (Array.isArray(todos) && todos.length > fbCount) {
              // Traer todas las páginas
              let all = [...todos];
              while (true) {
                const r = await fetch(`/api/alumnos?limit=200&offset=${all.length}`);
                if (!r.ok) break;
                const d = await r.json();
                const page = d.alumnos || d || [];
                if (!Array.isArray(page) || page.length === 0) break;
                all = [...all, ...page];
              }
              finalAlumnos = all;
              lsSet(LS_ALUMNOS, all);
              setAlumnos(all);
              mostrar('ok', `${all.length} alumnos rescatados de Turso (sin token)`);
              try { await guardarAlumnosBatchFB(all as AlumnoFB[]); mostrar('ok', 'Todos los alumnos ahora en Firebase'); } catch {}
              tursoOk = true;
            }
          }
        } catch { /* Turso realmente no disponible */ }
      }

      if (!tursoOk) {
        // 3) Fallback a localStorage si Turso falló y Firebase estaba vacío
        if (fbCount === 0) {
          const locales = cargarDesdeLocal();
          if (locales.length > 0) {
            finalAlumnos = locales;
            setAlumnos(locales);
            mostrar('ok', `${locales.length} alumnos cargados del almacenamiento local`);
          } else {
            mostrar('err', 'Sin conexión a internet y sin datos guardados');
          }
        }
      }
    } catch (e: any) {
      mostrar('err', 'Error al cargar alumnos: ' + e.message);
    } finally {
      setCargando(false);
    }
  };

  // ── RESCATE MANUAL: descargar TODO desde Turso (con token) y subir a Firebase ─
  const rescatarDesdeTurso = async () => {
    setRescatando(true);
    mostrar('ok', '📥 Conectando con Turso...');
    try {
      // Paso 1: descargar primera página para ver cuántos hay
      const primera = await getAlumnosPaginado(200, 0);
      if (!primera.alumnos || primera.alumnos.length === 0) {
        mostrar('err', 'Turso no tiene alumnos o el token no es válido. Cierra sesión y vuelve a entrar.');
        setRescatando(false);
        return;
      }
      let todos: any[] = [...primera.alumnos];
      let total = primera.total || 0;
      mostrar('ok', `📥 ${todos.length} de ${total} alumnos descargados...`);

      // Paso 2: descargar el resto página por página
      while (todos.length < total) {
        const offset = todos.length;
        const pag = await getAlumnosPaginado(200, offset);
        if (!pag.alumnos || pag.alumnos.length === 0) break;
        todos = [...todos, ...pag.alumnos];
        mostrar('ok', `📥 ${todos.length} de ${total} alumnos descargados...`);
      }

      // Paso 3: guardar en localStorage y Firebase
      lsSet(LS_ALUMNOS, todos);
      setAlumnos(todos);
      mostrar('ok', `${todos.length} alumnos descargados. Subiendo a Firebase...`);
      const batchResult = await guardarAlumnosBatchFB(todos as AlumnoFB[]);
      mostrar('ok', `${batchResult.ok} alumnos subidos a Firebase. ¡Completo!`);
    } catch (e: any) {
      mostrar('err', 'Error en rescate: ' + e.message + '. Intenta cerrar sesión y volver a entrar.');
    } finally {
      setRescatando(false);
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
      let asignaciones: any[] = [];

      // 1) INTENTAR FIREBASE PRIMERO
      try {
        const fbAsigs = await getAsignacionesFB();
        if (fbAsigs.length > 0) {
          asignaciones = fbAsigs;
          lsSet(LS_ASIGNACIONES, asignaciones);
        }
      } catch {
        // Firebase no disponible
      }

      // 2) Fallback: localStorage
      if (asignaciones.length === 0) {
        const localAsigs = lsGet<any[]>(LS_ASIGNACIONES, []);
        if (localAsigs.length > 0) {
          asignaciones = parsearAsignaciones(localAsigs);
        } else {
          // 3) Último recurso: Turso
          try {
            const todo = await cargarTodo('asignaciones');
            asignaciones = parsearAsignaciones(todo.asignaciones || []);
            if (asignaciones.length > 0) {
              lsSet(LS_ASIGNACIONES, todo.asignaciones);
            }
          } catch {
            asignaciones = [];
          }
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
      }
    } catch (e) {
      console.error('Error cargando asignación:', e);
    }
  };

  const sincronizarDesdeTurso = async () => {
    setCargando(true);
    try {
      mostrar('ok', '📥 Descargando datos de la nube...');
      const todo = await cargarTodo('alumnos,asignaciones,docentes,columnas,unidades,normas');
      let guardados = 0;
      if (todo.asignaciones?.length) { lsSet(LS_ASIGNACIONES, todo.asignaciones); guardados++; }
      if (todo.alumnos?.length) { lsSet(LS_ALUMNOS, todo.alumnos); setAlumnos(todo.alumnos); guardados++; }
      if (todo.docentes?.length) { lsSet('ie_docentes', todo.docentes); guardados++; }
      if (todo.columnas?.length) { lsSet('cal_columnas', todo.columnas); guardados++; }
      if (todo.unidades?.length) { lsSet('cfg_unidades', todo.unidades); guardados++; }
      if (todo.normas?.length) { lsSet('cfg_normas_convivencia', todo.normas); guardados++; }
      mostrar('ok', `✅ ${guardados} tablas descargadas`);
      // En segundo plano, descargar calificaciones y asistencia
      try {
        const resto = await cargarTodo('calificaciones,asistencia');
        if (resto.calificaciones?.length) lsSet('ie_calificativos_v2', resto.calificaciones);
        if (resto.asistencia?.length) lsSet('ie_asistencia', resto.asistencia);
      } catch { /* silencioso */ }
    } catch (e: any) {
      mostrar('err', '❌ Error descargando: ' + e.message);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    // Cargar inmediatamente desde localStorage (como NormasConvivencia y DocentesScreen)
    const locales = cargarDesdeLocal();
    if (locales.length > 0) {
      setAlumnos(locales);
      setCargando(false);
    }
    cargarAsignacion();
    // Luego intentar nube en segundo plano
    cargar();
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
      let alumnoId: string = editando?.id || `alu-dni-${payload.dni}`;

      // 1) Guardar en Firebase primero
      try {
        const fbAlumno: any = {
          id: alumnoId,
          apellidos_nombres: payload.apellidos_nombres,
          dni: payload.dni,
          fecha_nacimiento: payload.fecha_nacimiento,
          edad: calcularEdad(payload.fecha_nacimiento),
          sexo: payload.sexo,
          grado: payload.grado,
          seccion: payload.seccion,
          madre_nombres: payload.madre?.apellidos_nombres || '',
          madre_dni: payload.madre?.dni || '',
          madre_celular: payload.madre?.celular || '',
          padre_nombres: payload.padre?.apellidos_nombres || '',
          padre_dni: payload.padre?.dni || '',
          padre_celular: payload.padre?.celular || '',
        };
        await guardarAlumnoFB(fbAlumno);
        mostrar('ok', editando ? 'Alumno actualizado en Firebase' : 'Alumno registrado en Firebase');
      } catch (fbErr) {
        // 2) Fallback a Turso si Firebase falla
        console.warn('Firebase falló, intentando Turso:', fbErr);
        if (editando) {
          await editarAlumno(editando.id, payload);
        } else {
          const res = await crearAlumno(payload);
          alumnoId = res?.id || alumnoId;
        }
        mostrar('ok', editando ? 'Alumno actualizado (Turso)' : 'Alumno registrado (Turso)');
      }

      const nuevoAlumno = {
        id: alumnoId,
        apellidos_nombres: payload.apellidos_nombres,
        dni: payload.dni,
        fecha_nacimiento: payload.fecha_nacimiento,
        edad: calcularEdad(payload.fecha_nacimiento),
        sexo: payload.sexo,
        grado: payload.grado,
        seccion: payload.seccion,
        madre_nombres: payload.madre?.apellidos_nombres || '',
        madre_dni: payload.madre?.dni || '',
        madre_celular: payload.madre?.celular || '',
        padre_nombres: payload.padre?.apellidos_nombres || '',
        padre_dni: payload.padre?.dni || '',
        padre_celular: payload.padre?.celular || '',
      };
      const actuales = lsGet<Alumno[]>(LS_ALUMNOS, []);
      const idx = actuales.findIndex((a: any) => a.id === alumnoId);
      if (idx >= 0) actuales[idx] = nuevoAlumno;
      else actuales.push(nuevoAlumno);
      lsSet(LS_ALUMNOS, actuales);
      setAlumnos(actuales);
      setShowForm(false); setEditando(null); setForm(emptyForm);
      cargar();
    } catch (e: any) { mostrar('err', e.message); }
    finally { setGuardando(false); }
  };

  const handleEliminar = async (id: string) => {
    if (!confirm('¿Eliminar este alumno?')) return;
    setEliminando(id);
    try {
      // 1) Eliminar de Firebase primero
      try {
        await eliminarAlumnoFB(id);
        mostrar('ok', 'Alumno eliminado de Firebase');
      } catch (fbErr) {
        // 2) Fallback a Turso
        console.warn('Firebase falló, intentando Turso:', fbErr);
        await eliminarAlumno(id);
        mostrar('ok', 'Alumno eliminado (Turso)');
      }
      const actuales = lsGet<Alumno[]>(LS_ALUMNOS, []);
      const filtrados = actuales.filter((a: any) => a.id !== id);
      lsSet(LS_ALUMNOS, filtrados);
      setAlumnos(filtrados);
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

      const normDNI = (raw: any): string => {
        const s = String(raw ?? '').trim().replace(/\D/g, '');
        if (s.length === 7) return '0' + s;
        return s;
      };

      const rows = dataRows.map((r: any[]) => ({
        apellidos_nombres: colVal(r, 'APELLIDOS Y NOMBRES', 'APELLIDO'),
        dni:               normDNI(colVal(r, 'N° DNI DEL ALUMNO', 'DNI DEL ALUMNO', 'DNI', 'N°DNI', 'N° DNI')),
        fecha_nacimiento:  toDate(r[headers.findIndex(h => h.includes('NACIMIENTO'))]),
        sexo:              normalizarSexo(colVal(r, 'SEXO')),
        grado:             normalizarGrado(colVal(r, 'GRADO DE ESTUDIOS', 'GRADO')),
        seccion:           (() => {
          const raw = colVal(r, 'SECCI', 'SECCION', 'SECCIÓN');
          const m = raw.toUpperCase().match(/[A-Z]/);
          return m ? m[0] : raw.toUpperCase();
        })(),
        madre: {
          apellidos_nombres: colVal(r, 'APELLIDOS Y NOMBRES DE LA MADRE', 'NOMBRES DE LA MADRE', 'MADRE'),
          dni:               normDNI(colVal(r, 'DNI MADRE', 'DNI DE LA MADRE')),
          celular:           colVal(r, 'N° DE CELULAR  DE LA MADRE', 'CELULAR  DE LA MADRE', 'CELULAR DE LA MADRE', 'CELULAR MADRE'),
        },
        padre: {
          apellidos_nombres: colVal(r, 'APELLIDOS Y NOMBRES DEL PADRE', 'NOMBRES DEL PADRE', 'PADRE'),
          dni:               normDNI(colVal(r, 'DNI PADRE', 'DNI DEL PADRE')),
          celular:           colVal(r, 'N° DE CELULAR DEL PADRE', 'CELULAR DEL PADRE', 'CELULAR PADRE'),
        },
      }));
      setImportRows(rows.filter((r: any) => r.apellidos_nombres && r.dni));
      setImportResult(null);
      setShowImport(true);
    } catch { mostrar('err', 'Error leyendo el archivo Excel'); }
  };

  const handleImportar = async () => {
    setImportando(true);
    const filas = importRows.filter((r: any) => r.apellidos_nombres && r.dni);
    let ok = 0, err = 0;
    const erroresDetalle: string[] = [];

    // Guardar en localStorage inmediatamente (funciona offline)
    const nuevosLocal = filas.map((r: any) => ({
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
    const existentes = lsGet<Alumno[]>(LS_ALUMNOS, []);
    const combinados = [...existentes.filter((a: any) => !nuevosLocal.find((n: any) => n.dni === a.dni)), ...nuevosLocal];
    lsSet(LS_ALUMNOS, combinados);
    setAlumnos(combinados);

    // Guardar directamente en Firebase (más rápido y confiable que Turso)
    try {
      mostrar('ok', 'Subiendo a Firebase...');
      const batchResult = await guardarAlumnosBatchFB(nuevosLocal as AlumnoFB[]);
      mostrar('ok', `${batchResult.ok} alumnos subidos a Firebase`);
    } catch (e) {
      console.warn('Error subiendo a Firebase:', e);
    }

    try {
      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token') || '';
      const LOTE = 100;
      for (let i = 0; i < filas.length; i += LOTE) {
        const lote = filas.slice(i, i + LOTE).map((r: any) => ({
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
          erroresDetalle.push(`Lote ${Math.floor(i/LOTE)+1}: ${body.error || 'Error desconocido'}`);
          continue;
        }
        const data = await res.json();
        ok += data.ok || lote.length;
        err += data.errores?.length || 0;
      }

      setImportResult({ ok, err });
      if (err === 0) {
        mostrar('ok', `${filas.length} alumnos importados correctamente a Turso.`);
      } else {
        mostrar('err', `${ok} OK, ${err} con errores. Revisa la consola.`);
        console.error('Errores importación:', erroresDetalle);
      }
    } catch (e: any) {
      mostrar('ok', `${nuevosLocal.length} alumnos guardados localmente. Turso no disponible.`);
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

  // ── Filtrado por asignación docente ─────────────────────────────────
  const normGrado = (g: string) => String(g || '').trim().replace(/°$/, '');
  const alumnosBase = React.useMemo(() => {
    if (!esDocente || !asignacionDocente) return alumnos;
    const gradosNorm    = asignacionDocente.grados.map(normGrado);
    const seccionesNorm = asignacionDocente.secciones.map(s => s.trim().toUpperCase());
    const filtrados = alumnos.filter(a =>
      gradosNorm.includes(normGrado(a.grado)) &&
      seccionesNorm.includes((a.seccion || '').trim().toUpperCase())
    );
    // FALLBACK: si el filtro deja 0 alumnos, mostrar TODOS
    if (filtrados.length === 0 && alumnos.length > 0) {
      console.warn('[EduGest] AlumnosScreen: filtro dejó 0 alumnos. Mostrando todos como fallback.');
      return alumnos;
    }
    return filtrados;
  }, [alumnos, esDocente, asignacionDocente]);

  // Búsqueda global
  const filtradosBusqueda = alumnosBase.filter(a => {
    const b = busqueda.toLowerCase();
    return a.apellidos_nombres.toLowerCase().includes(b) || a.dni.includes(b) ||
      (a.madre_nombres || '').toLowerCase().includes(b) || (a.padre_nombres || '').toLowerCase().includes(b);
  });

  // NUEVO: Calcular grados y secciones disponibles
  const gradosDisponibles = React.useMemo(() => {
    const grados = [...new Set(alumnosBase.map(a => a.grado).filter(Boolean))].sort((a, b) => {
      const na = parseInt(a?.replace('°', '') || '0');
      const nb = parseInt(b?.replace('°', '') || '0');
      return na - nb;
    });
    return grados;
  }, [alumnosBase]);

  const seccionesPorGrado = React.useMemo(() => {
    if (!gradoSeleccionado) return [];
    return [...new Set(alumnosBase.filter(a => a.grado === gradoSeleccionado).map(a => a.seccion).filter(Boolean))].sort();
  }, [alumnosBase, gradoSeleccionado]);

  const alumnosDeSeccion = React.useMemo(() => {
    if (!gradoSeleccionado || !seccionSeleccionada) return [];
    return filtradosBusqueda
      .filter(a => a.grado === gradoSeleccionado && a.seccion === seccionSeleccionada)
      .sort((a, b) => a.apellidos_nombres.localeCompare(b.apellidos_nombres));
  }, [filtradosBusqueda, gradoSeleccionado, seccionSeleccionada]);

  // Conteo por grado
  const conteoPorGrado = (grado: string) => alumnosBase.filter(a => a.grado === grado).length;
  const conteoPorSeccion = (grado: string, seccion: string) => alumnosBase.filter(a => a.grado === grado && a.seccion === seccion).length;

  // Navegación de vista
  const seleccionarGrado = (g: string) => {
    setGradoSeleccionado(g);
    setSeccionSeleccionada('');
    setModoVista('secciones');
  };
  const seleccionarSeccion = (s: string) => {
    setSeccionSeleccionada(s);
    setModoVista('lista');
  };
  const volverAGrados = () => {
    setGradoSeleccionado('');
    setSeccionSeleccionada('');
    setModoVista('grados');
  };
  const volverASecciones = () => {
    setSeccionSeleccionada('');
    setModoVista('secciones');
  };

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
            ? `${alumnosBase.length} alumnos · Grados: ${asignacionDocente.grados.join(', ')} · Secciones: ${asignacionDocente.secciones.join(', ')}`
            : `${alumnos.length} alumnos registrados`}
        >
          <button onClick={cargar} className="flex items-center gap-2 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors">
            <RefreshCw size={14} /> Actualizar
          </button>
          <button onClick={rescatarDesdeTurso} disabled={rescatando}
            className="flex items-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-500 disabled:bg-slate-700 text-white rounded-lg text-sm font-medium transition-colors">
            {rescatando ? <><RefreshCw size={14} className="animate-spin" /> Rescatando...</> : <><Download size={14} /> Rescatar de Turso</>}
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
        {alumnos.length > 0 && alumnos.length < 1000 && (
          <div className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm bg-amber-500/10 border border-amber-500/30 text-amber-300">
            <AlertCircle size={16} />
            <span>Firebase tiene solo {alumnos.length} alumnos. Haz clic en <strong>"Rescatar de Turso"</strong> para descargar todos.</span>
          </div>
        )}
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
                      <div><div className="text-3xl font-black text-red-400">{importResult.err}</div><div className="text-slate-400 text-sm">con errores</div></div>
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

        {/* Búsqueda global */}
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
            <input type="text" placeholder="Buscar por nombre, DNI o apoderado..." value={busqueda} onChange={e => setBusqueda(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 transition-colors text-sm font-medium" />
          </div>
          {modoVista !== 'grados' && (
            <button onClick={modoVista === 'lista' ? volverASecciones : volverAGrados}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors">
              <ChevronDown size={14} className="rotate-90" /> {modoVista === 'lista' ? 'Cambiar sección' : 'Cambiar grado'}
            </button>
          )}
        </div>

        {/* ========== VISTA POR GRADOS ========== */}
        {modoVista === 'grados' && (
          <div className="space-y-4">
            {cargando && alumnos.length === 0 ? (
              <div className="text-center py-16">
                <RefreshCw size={30} className="animate-spin text-green-400 mx-auto mb-3" />
                <p className="text-slate-400">Cargando alumnos...</p>
              </div>
            ) : gradosDisponibles.length === 0 ? (
              <div className="text-center py-16 space-y-4">
                <p className="text-slate-500">No se encontraron alumnos</p>
                <button onClick={sincronizarDesdeTurso} disabled={cargando}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-xl text-sm hover:from-green-400 hover:to-emerald-500 transition-all shadow-lg hover:shadow-green-500/30 disabled:opacity-50">
                  {cargando ? <RefreshCw size={16} className="animate-spin" /> : <Download size={16} />}
                  {cargando ? 'Descargando...' : '📥 Cargar datos de la nube'}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {gradosDisponibles.map(g => {
                  const count = conteoPorGrado(g);
                  return (
                    <motion.button
                      key={g}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => seleccionarGrado(g)}
                      className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 hover:border-green-500/50 rounded-2xl p-6 text-left transition-all group"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <GraduationCap size={28} className="text-green-400 group-hover:text-green-300" />
                        <span className="text-3xl font-black text-white">{count}</span>
                      </div>
                      <p className="text-white font-bold text-lg">{g} Grado</p>
                      <p className="text-slate-400 text-xs mt-1">{[...new Set(alumnosBase.filter(a => a.grado === g).map(a => a.seccion))].length} secciones</p>
                      <div className="mt-3 flex flex-wrap gap-1">
                        {[...new Set(alumnosBase.filter(a => a.grado === g).map(a => a.seccion))].sort().map(s => (
                          <span key={s} className="px-2 py-0.5 bg-slate-700 rounded text-[10px] text-slate-300 font-medium">{s}</span>
                        ))}
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ========== VISTA POR SECCIONES ========== */}
        {modoVista === 'secciones' && gradoSeleccionado && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <button onClick={volverAGrados} className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-300">
                <ChevronDown size={18} className="rotate-90" />
              </button>
              <h2 className="text-xl font-bold text-white">{gradoSeleccionado} Grado — Selecciona una sección</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {seccionesPorGrado.map(s => {
                const count = conteoPorSeccion(gradoSeleccionado, s);
                const mujeres = alumnosBase.filter(a => a.grado === gradoSeleccionado && a.seccion === s && a.sexo === 'Femenino').length;
                const varones = count - mujeres;
                return (
                  <motion.button
                    key={s}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => seleccionarSeccion(s)}
                    className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 hover:border-cyan-500/50 rounded-2xl p-6 text-left transition-all group"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <School size={28} className="text-cyan-400 group-hover:text-cyan-300" />
                      <span className="text-3xl font-black text-white">{count}</span>
                    </div>
                    <p className="text-white font-bold text-lg">Sección {s}</p>
                    <div className="flex gap-2 mt-2 text-xs">
                      <span className="text-pink-400">{mujeres} ♀</span>
                      <span className="text-slate-600">|</span>
                      <span className="text-blue-400">{varones} ♂</span>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>
        )}

        {/* ========== VISTA LISTA DE ALUMNOS ========== */}
        {modoVista === 'lista' && gradoSeleccionado && seccionSeleccionada && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 flex-wrap">
              <button onClick={volverASecciones} className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-300">
                <ChevronDown size={18} className="rotate-90" />
              </button>
              <h2 className="text-xl font-bold text-white">{gradoSeleccionado} Grado — Sección {seccionSeleccionada}</h2>
              <span className="px-3 py-1 bg-green-500/20 border border-green-500/40 rounded-lg text-green-300 text-sm font-bold">
                {alumnosDeSeccion.length} alumnos
              </span>
            </div>

            {alumnosDeSeccion.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                No hay alumnos en {gradoSeleccionado} Grado, Sección {seccionSeleccionada}
              </div>
            ) : (
              <div className="space-y-2">
                {alumnosDeSeccion.map((a, i) => (
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
        )}

        </div>
      </div>
    </div>
  );
}
