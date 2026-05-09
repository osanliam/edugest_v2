// src/services/firebaseDataService.ts
// Servicio de datos unificado: Firebase Firestore + localStorage fallback

import {
  getFirestore, collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc,
  query, where, orderBy, onSnapshot, enableIndexedDbPersistence,
  writeBatch, Timestamp, type Firestore, type DocumentData
} from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, updateProfile } from 'firebase/auth';
import { getFirebaseApp, isFirebaseConfigured } from '../lib/firebase';

// ── Estado de conectividad ────────────────────────────────────────────────────
let _firestore: Firestore | null = null;

function getDB(): Firestore | null {
  if (_firestore) return _firestore;
  if (!isFirebaseConfigured()) return null;
  try {
    const app = getFirebaseApp();
    if (!app) return null;
    _firestore = getFirestore(app);
    // Activar persistencia offline (IndexedDB)
    enableIndexedDbPersistence(_firestore).catch(() => {
      // Puede fallar si hay múltiples pestañas abiertas, es normal
    });
    return _firestore;
  } catch {
    return null;
  }
}

// ── localStorage helpers (fallback universal) ─────────────────────────────────
function lsGet<T>(key: string, def: T): T {
  try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(def)); } catch { return def; }
}
function lsSet(key: string, val: any) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) { console.error('LS Error:', e); }
}

// ── Determinar modo ──────────────────────────────────────────────────────────
function modoFirestore(): boolean {
  return !!getDB();
}

// ── IDs ──────────────────────────────────────────────────────────────────────
function generarId(prefijo: string): string {
  return `${prefijo}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ALUMNOS
// ═══════════════════════════════════════════════════════════════════════════════

export interface AlumnoFB {
  id: string;
  apellidos_nombres: string;
  dni: string;
  fecha_nacimiento: string;
  edad: number;
  sexo: string;
  grado: string;
  seccion: string;
  madre_nombres?: string;
  madre_dni?: string;
  madre_celular?: string;
  padre_nombres?: string;
  padre_dni?: string;
  padre_celular?: string;
  creado?: any;
  actualizado?: any;
}

export async function getAlumnosFB(): Promise<AlumnoFB[]> {
  const db = getDB();
  if (!db) {
    return lsGet<AlumnoFB[]>('ie_alumnos', []);
  }
  try {
    const snap = await getDocs(query(collection(db, 'alumnos'), orderBy('apellidos_nombres')));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as AlumnoFB));
  } catch {
    return lsGet<AlumnoFB[]>('ie_alumnos', []);
  }
}

export async function getAlumnosPorGradoSeccionFB(grado: string, seccion: string): Promise<AlumnoFB[]> {
  const db = getDB();
  if (!db) {
    return lsGet<AlumnoFB[]>('ie_alumnos', []).filter(a => a.grado === grado && a.seccion === seccion);
  }
  try {
    const q = query(
      collection(db, 'alumnos'),
      where('grado', '==', grado),
      where('seccion', '==', seccion),
      orderBy('apellidos_nombres')
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as AlumnoFB));
  } catch {
    return lsGet<AlumnoFB[]>('ie_alumnos', []).filter(a => a.grado === grado && a.seccion === seccion);
  }
}

export async function guardarAlumnoFB(alumno: AlumnoFB): Promise<string> {
  const db = getDB();
  const id = alumno.id || generarId('alu');
  const data = { ...alumno, id, actualizado: Timestamp.now() };
  if (!data.creado) data.creado = Timestamp.now();

  if (db) {
    try {
      await setDoc(doc(db, 'alumnos', id), data);
    } catch {
      // Fallback silencioso a localStorage
    }
  }
  // SIEMPRE guardar en localStorage también (backup local)
  const actuales = lsGet<AlumnoFB[]>('ie_alumnos', []);
  const idx = actuales.findIndex(a => a.id === id);
  if (idx >= 0) actuales[idx] = { ...actuales[idx], ...alumno, id };
  else actuales.push({ ...alumno, id });
  lsSet('ie_alumnos', actuales);
  return id;
}

/* Subir muchos alumnos de una vez (útil para migración desde Turso) */
export async function guardarAlumnosBatchFB(alumnos: AlumnoFB[]): Promise<{ ok: number; err: number }> {
  const db = getDB();
  if (!db) return { ok: 0, err: alumnos.length };
  let ok = 0, err = 0;
  let batch = writeBatch(db);
  let count = 0;
  for (const alumno of alumnos) {
    const id = alumno.id || generarId('alu');
    const data = { ...alumno, id, actualizado: Timestamp.now(), creado: alumno.creado || Timestamp.now() };
    batch.set(doc(db, 'alumnos', id), data);
    count++;
    if (count >= 400) {
      try { await batch.commit(); ok += count; } catch { err += count; }
      batch = writeBatch(db);
      count = 0;
    }
  }
  if (count > 0) {
    try { await batch.commit(); ok += count; } catch { err += count; }
  }
  // También guardar en localStorage
  const actuales = lsGet<AlumnoFB[]>('ie_alumnos', []);
  for (const a of alumnos) {
    const id = a.id || generarId('alu');
    const idx = actuales.findIndex(x => x.id === id);
    if (idx >= 0) actuales[idx] = { ...actuales[idx], ...a, id };
    else actuales.push({ ...a, id });
  }
  lsSet('ie_alumnos', actuales);
  return { ok, err };
}

export async function eliminarAlumnoFB(id: string): Promise<void> {
  const db = getDB();
  if (db) {
    try { await deleteDoc(doc(db, 'alumnos', id)); } catch {}
  }
  const actuales = lsGet<AlumnoFB[]>('ie_alumnos', []);
  lsSet('ie_alumnos', actuales.filter(a => a.id !== id));
}

// ═══════════════════════════════════════════════════════════════════════════════
// DOCENTES
// ═══════════════════════════════════════════════════════════════════════════════

export interface DocenteFB {
  id: string;
  apellidos_nombres: string;
  dni: string;
  genero: string;
  fecha_nacimiento: string;
  celular?: string;
  cargo?: string;
  email?: string;
  user_id?: string;
}

export async function getDocentesFB(): Promise<DocenteFB[]> {
  const db = getDB();
  if (!db) return lsGet<DocenteFB[]>('ie_docentes', []);
  try {
    const snap = await getDocs(query(collection(db, 'docentes'), orderBy('apellidos_nombres')));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as DocenteFB));
  } catch {
    return lsGet<DocenteFB[]>('ie_docentes', []);
  }
}

export async function guardarDocenteFB(docente: DocenteFB): Promise<string> {
  const db = getDB();
  const id = docente.id || generarId('doc');
  const data = { ...docente, id, actualizado: Timestamp.now() };
  if (db) { try { await setDoc(doc(db, 'docentes', id), data); } catch {} }
  const actuales = lsGet<DocenteFB[]>('ie_docentes', []);
  const idx = actuales.findIndex(d => d.id === id);
  if (idx >= 0) actuales[idx] = { ...actuales[idx], ...docente, id };
  else actuales.push({ ...docente, id });
  lsSet('ie_docentes', actuales);
  return id;
}

export async function eliminarDocenteFB(id: string): Promise<void> {
  const db = getDB();
  if (db) { try { await deleteDoc(doc(db, 'docentes', id)); } catch {} }
  const actuales = lsGet<DocenteFB[]>('ie_docentes', []);
  lsSet('ie_docentes', actuales.filter(d => d.id !== id));
}

// ═══════════════════════════════════════════════════════════════════════════════
// USUARIOS / AUTH
// ═══════════════════════════════════════════════════════════════════════════════

export interface UsuarioFB {
  id: string;
  nombre: string;
  email: string;
  rol: 'admin' | 'director' | 'subdirector' | 'teacher' | 'parent' | 'student';
  activo: boolean;
  docenteId?: string;
  creado?: string;
}

export async function loginFB(email: string, password: string): Promise<{ user: any; token: string }> {
  const auth = getAuth(getFirebaseApp()!);
  const cred = await signInWithEmailAndPassword(auth, email, password);
  const token = await cred.user.getIdToken();
  return { user: cred.user, token };
}

export async function registerFB(email: string, password: string, nombre: string): Promise<any> {
  const auth = getAuth(getFirebaseApp()!);
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(cred.user, { displayName: nombre });
  return cred.user;
}

export async function logoutFB(): Promise<void> {
  const auth = getAuth(getFirebaseApp()!);
  await signOut(auth);
}

export async function getUsuariosFB(): Promise<UsuarioFB[]> {
  const db = getDB();
  if (!db) return lsGet<UsuarioFB[]>('sistema_usuarios', []);
  try {
    const snap = await getDocs(collection(db, 'usuarios'));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as UsuarioFB));
  } catch {
    return lsGet<UsuarioFB[]>('sistema_usuarios', []);
  }
}

export async function guardarUsuarioFB(usuario: UsuarioFB): Promise<void> {
  const db = getDB();
  const id = usuario.id || generarId('usr');
  const data = { ...usuario, id, creado: usuario.creado || new Date().toISOString() };
  if (db) { try { await setDoc(doc(db, 'usuarios', id), data); } catch {} }
  const actuales = lsGet<UsuarioFB[]>('sistema_usuarios', []);
  const idx = actuales.findIndex(u => u.id === id);
  if (idx >= 0) actuales[idx] = { ...actuales[idx], ...usuario, id };
  else actuales.push({ ...usuario, id });
  lsSet('sistema_usuarios', actuales);
}

// ═══════════════════════════════════════════════════════════════════════════════
// CALIFICATIVOS
// ═══════════════════════════════════════════════════════════════════════════════

export interface CalificativoFB {
  id: string;
  alumnoId: string;
  columnaId: string;
  marcados: any;
  claves?: string[];
  notaNumerica?: number;
  calificativo: 'C' | 'B' | 'A' | 'AD';
  esAD: boolean;
  fecha: string;
  docenteId?: string;
  items?: any[];
  observaciones?: string[];
}

export async function getCalificativosFB(): Promise<CalificativoFB[]> {
  const db = getDB();
  if (!db) return lsGet<CalificativoFB[]>('ie_calificativos_v2', []);
  try {
    const snap = await getDocs(collection(db, 'calificativos'));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as CalificativoFB));
  } catch {
    return lsGet<CalificativoFB[]>('ie_calificativos_v2', []);
  }
}

export async function guardarCalificativoFB(cal: CalificativoFB): Promise<void> {
  const db = getDB();
  const id = cal.id || `${cal.alumnoId}-${cal.columnaId}`;
  const data = { ...cal, id };
  if (db) { try { await setDoc(doc(db, 'calificativos', id), data); } catch {} }
  const actuales = lsGet<CalificativoFB[]>('ie_calificativos_v2', []);
  const idx = actuales.findIndex(c => c.alumnoId === cal.alumnoId && c.columnaId === cal.columnaId);
  if (idx >= 0) actuales[idx] = { ...actuales[idx], ...cal };
  else actuales.push({ ...cal, id });
  lsSet('ie_calificativos_v2', actuales);
}

export async function guardarCalificativosBatchFB(cals: CalificativoFB[]): Promise<void> {
  const db = getDB();
  if (db && cals.length > 0) {
    try {
      const batch = writeBatch(db);
      for (const cal of cals) {
        const id = cal.id || `${cal.alumnoId}-${cal.columnaId}`;
        batch.set(doc(db, 'calificativos', id), { ...cal, id });
      }
      await batch.commit();
    } catch {}
  }
  // También guardar en localStorage
  const actuales = lsGet<CalificativoFB[]>('ie_calificativos_v2', []);
  for (const cal of cals) {
    const idx = actuales.findIndex(c => c.alumnoId === cal.alumnoId && c.columnaId === cal.columnaId);
    if (idx >= 0) actuales[idx] = { ...actuales[idx], ...cal };
    else actuales.push(cal);
  }
  lsSet('ie_calificativos_v2', actuales);
}

// ═══════════════════════════════════════════════════════════════════════════════
// COLUMNAS (Instrumentos)
// ═══════════════════════════════════════════════════════════════════════════════

export interface ColumnaFB {
  id: string;
  nombre: string;
  tipo: string;
  totalItems: number;
  competenciaId: string;
  bimestreId?: string;
  promediar: boolean;
  itemsExamen?: any[];
  items?: string[];
  columnasEval?: string[];
  creatorId?: string;
}

export async function getColumnasFB(): Promise<ColumnaFB[]> {
  const db = getDB();
  if (!db) return lsGet<ColumnaFB[]>('cal_columnas', []);
  try {
    const snap = await getDocs(collection(db, 'columnas'));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as ColumnaFB));
  } catch {
    return lsGet<ColumnaFB[]>('cal_columnas', []);
  }
}

export async function guardarColumnasFB(columnas: ColumnaFB[]): Promise<void> {
  const db = getDB();
  if (db) {
    try {
      const batch = writeBatch(db);
      for (const col of columnas) {
        batch.set(doc(db, 'columnas', col.id), col);
      }
      await batch.commit();
    } catch {}
  }
  lsSet('cal_columnas', columnas);
}

export async function eliminarColumnaFB(id: string): Promise<void> {
  const db = getDB();
  if (db) {
    try {
      await deleteDoc(doc(db, 'columnas', id));
    } catch {}
  }
  const actuales = lsGet<ColumnaFB[]>('cal_columnas', []);
  lsSet('cal_columnas', actuales.filter(c => c.id !== id));
}

export async function eliminarCalificativosPorColumnaFB(columnaId: string): Promise<void> {
  const db = getDB();
  if (db) {
    try {
      const q = query(collection(db, 'calificativos'), where('columnaId', '==', columnaId));
      const snap = await getDocs(q);
      const batch = writeBatch(db);
      snap.docs.forEach(d => batch.delete(doc(db, 'calificativos', d.id)));
      await batch.commit();
    } catch {}
  }
  const actuales = lsGet<CalificativoFB[]>('ie_calificativos_v2', []);
  lsSet('ie_calificativos_v2', actuales.filter(c => c.columnaId !== columnaId));
}

// ═══════════════════════════════════════════════════════════════════════════════
// UNIDADES / BIMESTRES
// ═══════════════════════════════════════════════════════════════════════════════

export interface UnidadFB {
  id: string;
  numero: number;
  nombre: string;
  bimestreId?: string;
  activa: boolean;
}

export async function getUnidadesFB(): Promise<UnidadFB[]> {
  const db = getDB();
  if (!db) return lsGet<UnidadFB[]>('cfg_unidades', []);
  try {
    const snap = await getDocs(collection(db, 'unidades'));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as UnidadFB));
  } catch {
    return lsGet<UnidadFB[]>('cfg_unidades', []);
  }
}

export async function guardarUnidadesFB(unidades: UnidadFB[]): Promise<void> {
  const db = getDB();
  if (db) {
    try {
      // Borrar todas y reinsertar
      const existentes = await getDocs(collection(db, 'unidades'));
      const batch = writeBatch(db);
      existentes.docs.forEach(d => batch.delete(d.ref));
      for (const u of unidades) {
        batch.set(doc(db, 'unidades', u.id), u);
      }
      await batch.commit();
    } catch {}
  }
  lsSet('cfg_unidades', unidades);
}

// ═══════════════════════════════════════════════════════════════════════════════
// ASIGNACIONES
// ═══════════════════════════════════════════════════════════════════════════════

export interface AsignacionFB {
  id: string;
  docenteId: string;
  grados: string[];
  secciones: string[];
  cursos?: string[];
}

export async function getAsignacionesFB(): Promise<AsignacionFB[]> {
  const db = getDB();
  if (!db) return lsGet<AsignacionFB[]>('cfg_asignaciones', []);
  try {
    const snap = await getDocs(collection(db, 'asignaciones'));
    return snap.docs.map(d => {
      const data = d.data();
      return {
        id: d.id,
        docenteId: data.docenteId || '',
        grados: data.grados || [],
        secciones: data.secciones || [],
        cursos: data.cursos || [],
      } as AsignacionFB;
    });
  } catch {
    return lsGet<AsignacionFB[]>('cfg_asignaciones', []);
  }
}

export async function guardarAsignacionesFB(asignaciones: AsignacionFB[]): Promise<void> {
  const db = getDB();
  if (db) {
    try {
      const existentes = await getDocs(collection(db, 'asignaciones'));
      const batch = writeBatch(db);
      existentes.docs.forEach(d => batch.delete(d.ref));
      for (const a of asignaciones) {
        batch.set(doc(db, 'asignaciones', a.id), a);
      }
      await batch.commit();
    } catch {}
  }
  lsSet('cfg_asignaciones', asignaciones);
}

// ═══════════════════════════════════════════════════════════════════════════════
// ASISTENCIA
// ═══════════════════════════════════════════════════════════════════════════════

export interface AsistenciaFB {
  id: string;
  alumnoId: string;
  fecha: string;
  estado: string;
  modo?: string;
  hora?: string;
}

export async function getAsistenciaFB(): Promise<AsistenciaFB[]> {
  const db = getDB();
  if (!db) return lsGet<AsistenciaFB[]>('ie_asistencia', []);
  try {
    const snap = await getDocs(collection(db, 'asistencia'));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as AsistenciaFB));
  } catch {
    return lsGet<AsistenciaFB[]>('ie_asistencia', []);
  }
}

export async function guardarAsistenciaFB(registros: AsistenciaFB[]): Promise<void> {
  const db = getDB();
  if (db) {
    try {
      const batch = writeBatch(db);
      for (const r of registros) {
        const id = r.id || generarId('asist');
        batch.set(doc(db, 'asistencia', id), { ...r, id });
      }
      await batch.commit();
    } catch {}
  }
  const actuales = lsGet<AsistenciaFB[]>('ie_asistencia', []);
  for (const r of registros) {
    const idx = actuales.findIndex(a => a.alumnoId === r.alumnoId && a.fecha === r.fecha);
    if (idx >= 0) actuales[idx] = r;
    else actuales.push(r);
  }
  lsSet('ie_asistencia', actuales);
}

// ═══════════════════════════════════════════════════════════════════════════════
// NUEVO: Importar datos desde localStorage a Firebase (migración unidireccional)
// ═══════════════════════════════════════════════════════════════════════════════

export async function migrarDatosLocalesAFirebase(): Promise<{ ok: boolean; mensajes: string[] }> {
  const db = getDB();
  if (!db) return { ok: false, mensajes: ['Firebase no está configurado'] };

  const mensajes: string[] = [];

  const migrarColeccion = async (nombre: string, lsKey: string) => {
    const datos = lsGet<any[]>(lsKey, []);
    if (datos.length === 0) {
      mensajes.push(`⚪ ${nombre}: sin datos locales`);
      return;
    }
    try {
      let batch = writeBatch(db);
      let count = 0;
      let totalSubidos = 0;
      for (const item of datos) {
        if (!item.id) continue;
        batch.set(doc(db, nombre, item.id), item);
        count++;
        totalSubidos++;
        // Firestore limita a 500 operaciones por batch
        if (count >= 400) {
          await batch.commit();
          batch = writeBatch(db); // NUEVO batch después de commit
          count = 0;
        }
      }
      if (count > 0) {
        await batch.commit();
      }
      mensajes.push(`✅ ${nombre}: ${totalSubidos} registros migrados`);
    } catch (e: any) {
      mensajes.push(`❌ ${nombre}: error - ${e.message}`);
    }
  };

  await migrarColeccion('alumnos', 'ie_alumnos');
  await migrarColeccion('docentes', 'ie_docentes');
  await migrarColeccion('usuarios', 'sistema_usuarios');
  await migrarColeccion('calificativos', 'ie_calificativos_v2');
  await migrarColeccion('columnas', 'cal_columnas');
  await migrarColeccion('asignaciones', 'cfg_asignaciones');
  await migrarColeccion('unidades', 'cfg_unidades');
  await migrarColeccion('asistencia', 'ie_asistencia');

  return { ok: true, mensajes };
}

// ═══════════════════════════════════════════════════════════════════════════════
// UTILIDAD: Exportar TODO (para respaldos)
// ═══════════════════════════════════════════════════════════════════════════════

export async function exportarTodoFB(): Promise<Record<string, any[]>> {
  const [alumnos, docentes, usuarios, calificativos, columnas, unidades, asignaciones, asistencia] = await Promise.all([
    getAlumnosFB(),
    getDocentesFB(),
    getUsuariosFB(),
    getCalificativosFB(),
    getColumnasFB(),
    getUnidadesFB(),
    getAsignacionesFB(),
    getAsistenciaFB(),
  ]);
  return { alumnos, docentes, usuarios, calificativos, columnas, unidades, asignaciones, asistencia };
}
