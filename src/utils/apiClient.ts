// ─────────────────────────────────────────────────────────────────────────────
// apiClient.ts — Todas las llamadas van DIRECTO a Turso via API REST
// Con detección automática de conectividad y fallback a localStorage
// ─────────────────────────────────────────────────────────────────────────────

const BASE = '';  // misma origin que el frontend

// ── Estado de conectividad ────────────────────────────────────────────────────
let _apiDisponible: boolean | null = null;
let _ultimaVerificacion: number = 0;
const VERIFICACION_TTL = 30_000; // 30 segundos

export async function verificarAPI(): Promise<boolean> {
  const ahora = Date.now();
  if (_apiDisponible !== null && (ahora - _ultimaVerificacion) < VERIFICACION_TTL) {
    return _apiDisponible;
  }
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(BASE + '/api/auth', { 
      method: 'OPTIONS',
      signal: controller.signal 
    });
    clearTimeout(id);
    _apiDisponible = res.ok || res.status === 401 || res.status === 405; // 405 = Method Not Allowed está bien, significa que el endpoint existe
    _ultimaVerificacion = ahora;
    return _apiDisponible;
  } catch {
    _apiDisponible = false;
    _ultimaVerificacion = ahora;
    return false;
  }
}

export function apiDisponible(): boolean | null {
  return _apiDisponible;
}

export function forzarVerificacionAPI() {
  _apiDisponible = null;
  _ultimaVerificacion = 0;
}

// ── Token JWT (se guarda solo en memoria de sesión) ───────────────────────────
let _token: string | null = sessionStorage.getItem('auth_token');

export function setToken(t: string) {
  _token = t;
  sessionStorage.setItem('auth_token', t);
}
export function getToken() { return _token; }
export function clearToken() {
  _token = null;
  sessionStorage.removeItem('auth_token');
}

// ── Fetch con auth ─────────────────────────────────────────────────────────────
async function api(path: string, opts: RequestInit = {}) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(opts.headers as Record<string, string> || {}),
  };
  if (_token) headers['Authorization'] = `Bearer ${_token}`;

  const res = await fetch(BASE + path, { ...opts, headers });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Error ${res.status}`);
  }
  return res.json();
}

// ─────────────────────────────────────────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────────────────────────────────────────
export async function login(email: string, password: string) {
  const data = await fetch(BASE + '/api/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!data.ok) {
    const err = await data.json().catch(() => ({}));
    throw new Error(err.error || 'Credenciales inválidas');
  }
  const result = await data.json();
  if (result.token) setToken(result.token);
  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// ALUMNOS  →  /api/alumnos
// ─────────────────────────────────────────────────────────────────────────────
export async function getAlumnos(): Promise<any[]> {
  return api('/api/alumnos') as Promise<any[]>;
}
export async function getAlumnosPaginado(limit: number, offset: number): Promise<{ alumnos: any[]; total: number }> {
  return api(`/api/alumnos?limit=${limit}&offset=${offset}`) as Promise<{ alumnos: any[]; total: number }>;
}
export async function crearAlumno(data: any) {
  return api('/api/alumnos', { method: 'POST', body: JSON.stringify(data) });
}
export async function editarAlumno(id: string, data: any) {
  return api(`/api/alumnos?id=${id}`, { method: 'PUT', body: JSON.stringify(data) });
}
export async function eliminarAlumno(id: string) {
  return api(`/api/alumnos?id=${id}`, { method: 'DELETE' });
}

// ─────────────────────────────────────────────────────────────────────────────
// DOCENTES  →  /api/docentes
// ─────────────────────────────────────────────────────────────────────────────
export async function getDocentes() {
  return api('/api/docentes') as Promise<any[]>;
}
export async function crearDocente(data: any) {
  return api('/api/docentes', { method: 'POST', body: JSON.stringify(data) });
}
export async function editarDocente(id: string, data: any) {
  return api(`/api/docentes?id=${id}`, { method: 'PUT', body: JSON.stringify(data) });
}
export async function eliminarDocente(id: string) {
  return api(`/api/docentes?id=${id}`, { method: 'DELETE' });
}

// ─────────────────────────────────────────────────────────────────────────────
// USUARIOS  →  /api/users
// ─────────────────────────────────────────────────────────────────────────────
export async function getUsuarios() {
  return api('/api/users') as Promise<any[]>;
}
export async function crearUsuario(data: any) {
  return api('/api/users', { method: 'POST', body: JSON.stringify(data) });
}
export async function editarUsuario(id: string, data: any) {
  return api(`/api/users?id=${id}`, { method: 'PUT', body: JSON.stringify(data) });
}
export async function eliminarUsuario(id: string) {
  return api(`/api/users?id=${id}`, { method: 'DELETE' });
}

// Helper: fetch con timeout
async function fetchWithTimeout(url: string, opts: RequestInit = {}, timeout = 5000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, { ...opts, signal: controller.signal });
    clearTimeout(id);
    return res;
  } catch (e) {
    clearTimeout(id);
    throw e;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// TODO EN UNO  →  /api/sync  (GET devuelve todo: alumnos, docentes, asignaciones,
//                              columnas, calificativos, asistencia, unidades…)
// ─────────────────────────────────────────────────────────────────────────────
export async function cargarTodo(tipos?: string, extras?: Record<string, string>) {
  const headers: Record<string, string> = {};
  if (_token) headers['Authorization'] = `Bearer ${_token}`;
  let url = BASE + '/api/sync' + (tipos ? `?tipos=${tipos}` : '');
  if (extras) {
    const params = new URLSearchParams(extras).toString();
    url += (url.includes('?') ? '&' : '?') + params;
  }
  // Vercel serverless tiene límite de 10s — usar 9s para dejar margen
  const res = await fetchWithTimeout(url, { headers }, 9000);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Error ${res.status}`);
  }
  return res.json() as Promise<{
    alumnos: any[];
    docentes: any[];
    usuarios: any[];
    columnas: any[];
    calificaciones: any[];
    asistencia: any[];
    unidades: any[];
    normas: any[];
    registros_normas: any[];
    asignaciones: any[];
  }>;
}

// ─────────────────────────────────────────────────────────────────────────────
// COLUMNAS (instrumentos de evaluación)  →  /api/sync  POST tipo='columnas'
// ─────────────────────────────────────────────────────────────────────────────
export async function guardarColumnas(columnas: any[]) {
  return api('/api/sync', {
    method: 'POST',
    body: JSON.stringify({ tipo: 'columnas', datos: columnas }),
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// CALIFICATIVOS  →  /api/sync  POST tipo='calificativos'
// ─────────────────────────────────────────────────────────────────────────────
export async function guardarCalificativos(calificativos: any[]) {
  return api('/api/sync', {
    method: 'POST',
    body: JSON.stringify({ tipo: 'calificativos', datos: calificativos }),
  });
}

// ── Caché en memoria para calificaciones (TTL 10 min) ────────────────────────
// Persiste entre renders pero se borra si el usuario cierra/recarga la pestaña.
// localStorage sigue siendo el fallback offline; esto evita re-fetches innecesarios.
const CAL_TTL = 10 * 60 * 1000;
let _calCache: { data: any[]; ts: number } | null = null;

export function getCacheCalificaciones(): any[] | null {
  if (!_calCache) return null;
  if (Date.now() - _calCache.ts > CAL_TTL) { _calCache = null; return null; }
  return _calCache.data;
}
export function setCacheCalificaciones(data: any[]): void {
  _calCache = { data, ts: Date.now() };
}
export function actualizarCalEnCache(cal: any): void {
  if (!_calCache) return;
  const idx = _calCache.data.findIndex(
    c => c.alumnoId === cal.alumnoId && c.columnaId === cal.columnaId
  );
  if (idx >= 0) _calCache.data[idx] = cal;
  else _calCache.data.push(cal);
  _calCache.ts = Date.now(); // refrescar TTL
}
export function invalidarCacheCalificaciones(): void { _calCache = null; }

// Carga una página de calificaciones (limit=500 por defecto)
export async function cargarCalPaginado(
  page: number,
  limit = 500
): Promise<{ calificaciones: any[]; total?: number }> {
  const headers: Record<string, string> = {};
  if (_token) headers['Authorization'] = `Bearer ${_token}`;
  const res = await fetchWithTimeout(
    `${BASE}/api/sync?tipos=calificaciones&page=${page}&limit=${limit}`,
    { headers },
    9000
  );
  if (!res.ok) return { calificaciones: [] };
  const data = await res.json();
  const toArr = (v: any) => { try { const p = typeof v === 'string' ? JSON.parse(v || '[]') : v; return Array.isArray(p) ? p : []; } catch { return []; } };
  return {
    calificaciones: (data.calificaciones || []).map((c: any) => ({
      ...c, marcados: toArr(c.marcados), claves: toArr(c.claves),
    })),
    total: data.calificaciones_total,
  };
}

// Guarda UN SOLO calificativo (más eficiente y permite merge correcto en servidor)
export async function guardarUnCalificativo(cal: any) {
  return api('/api/sync', {
    method: 'POST',
    body: JSON.stringify({ tipo: 'calificativos', datos: [cal] }),
  });
}

// Obtiene solo calificaciones modificadas DESPUÉS de una fecha (para polling)
export async function getCalificacionesDesdeFecha(desde: string): Promise<any[]> {
  const headers: Record<string, string> = {};
  if (_token) headers['Authorization'] = `Bearer ${_token}`;
  const res = await fetch(
    `${BASE}/api/sync?tipos=calificaciones&desde=${encodeURIComponent(desde)}`,
    { headers }
  );
  if (!res.ok) return [];
  const data = await res.json();
  return data.calificaciones || [];
}

// ─────────────────────────────────────────────────────────────────────────────
// BACKUPS  →  /api/backup
// ─────────────────────────────────────────────────────────────────────────────
export async function getBackups(): Promise<any[]> {
  const data = await api('/api/backup');
  return data.backups || [];
}

export async function crearBackupManual(): Promise<any> {
  return api('/api/backup', { method: 'POST' });
}

export async function descargarBackup(id: string): Promise<void> {
  const headers: Record<string, string> = {};
  if (_token) headers['Authorization'] = `Bearer ${_token}`;
  const res = await fetch(`${BASE}/api/backup?download=${encodeURIComponent(id)}`, { headers });
  if (!res.ok) throw new Error('No se pudo descargar el backup');
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `backup-${id}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

// Obtiene logs de auditoría (solo admin/director)
export async function getAuditoria(limite = 100): Promise<any[]> {
  const data = await api(`/api/sync?accion=auditoria&limite=${limite}`);
  return data.registros || [];
}

// Obtiene historial de versiones de un calificativo
export async function getHistorialCalificativo(calId: string): Promise<any[]> {
  const data = await api(`/api/sync?accion=historial&id=${encodeURIComponent(calId)}`);
  return data.historial || [];
}

// ─────────────────────────────────────────────────────────────────────────────
// ASISTENCIA  →  /api/sync  POST tipo='asistencia'
// ─────────────────────────────────────────────────────────────────────────────
export async function guardarAsistencia(registros: any[]) {
  return api('/api/sync', {
    method: 'POST',
    body: JSON.stringify({ tipo: 'asistencia', datos: registros }),
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// ASIGNACIONES  →  /api/sync  POST tipo='asignaciones'
// ─────────────────────────────────────────────────────────────────────────────
export async function guardarAsignaciones(asignaciones: any[]) {
  return api('/api/sync', {
    method: 'POST',
    body: JSON.stringify({ tipo: 'asignaciones', datos: asignaciones }),
  });
}
export async function getAsignaciones(): Promise<any[]> {
  const todo = await cargarTodo();
  return (todo.asignaciones || []).map((a: any) => ({
    ...a,
    grados:    typeof a.grados    === 'string' ? JSON.parse(a.grados    || '[]') : (a.grados    || []),
    secciones: typeof a.secciones === 'string' ? JSON.parse(a.secciones || '[]') : (a.secciones || []),
    cursos:    typeof a.cursos    === 'string' ? JSON.parse(a.cursos    || '[]') : (a.cursos    || []),
  }));
}

// ─────────────────────────────────────────────────────────────────────────────
// UNIDADES / BIMESTRES  →  /api/sync
// ─────────────────────────────────────────────────────────────────────────────
export async function guardarUnidades(unidades: any[]) {
  return api('/api/sync', {
    method: 'POST',
    body: JSON.stringify({ tipo: 'unidades', datos: unidades }),
  });
}
export async function guardarNormas(normas: any[]) {
  return api('/api/sync', {
    method: 'POST',
    body: JSON.stringify({ tipo: 'normas', datos: normas }),
  });
}
export async function guardarRegistrosNormas(registros: any[]) {
  return api('/api/sync', {
    method: 'POST',
    body: JSON.stringify({ tipo: 'registros_normas', datos: registros }),
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// CURSOS  →  /api/sync
// ─────────────────────────────────────────────────────────────────────────────
export async function guardarCursos(cursos: any[]) {
  return api('/api/sync', {
    method: 'POST',
    body: JSON.stringify({ tipo: 'cursos', datos: cursos }),
  });
}
export async function getCursos(): Promise<any[]> {
  const todo = await cargarTodo('cursos');
  return todo.cursos || [];
}

export async function guardarConfiguraciones(configs: Record<string, any>) {
  return api('/api/sync', {
    method: 'POST',
    body: JSON.stringify({ tipo: 'configuraciones', datos: configs }),
  });
}
export async function getConfiguraciones(): Promise<Record<string, any>> {
  const todo = await cargarTodo('configuraciones');
  return todo.configuraciones || {};
}

// ─────────────────────────────────────────────────────────────────────────────
// AULA VIRTUAL  →  /api/aula-virtual
// ─────────────────────────────────────────────────────────────────────────────

async function aulaApi(path: string, opts: RequestInit = {}) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(opts.headers as Record<string, string> || {}),
  };
  if (_token) headers['Authorization'] = `Bearer ${_token}`;
  const res = await fetchWithTimeout(BASE + '/api/aula-virtual' + path, { ...opts, headers }, 8000);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Error ${res.status}`);
  }
  return res.json();
}

export async function getAulas(): Promise<any[]> {
  try {
    const data = await aulaApi('?accion=aulas');
    return data.aulas || [];
  } catch { return []; }
}

export async function getMaterialesAula(aulaId: string): Promise<any[]> {
  try {
    const data = await aulaApi(`?accion=materiales&aulaId=${encodeURIComponent(aulaId)}`);
    return data.materiales || [];
  } catch { return []; }
}

export async function getEntregasMaterial(materialId?: string, aulaId?: string): Promise<any[]> {
  try {
    let path = '?accion=entregas';
    if (materialId) path += `&materialId=${encodeURIComponent(materialId)}`;
    if (aulaId) path += `&aulaId=${encodeURIComponent(aulaId)}`;
    const data = await aulaApi(path);
    return data.entregas || [];
  } catch { return []; }
}

export async function getComentariosMaterial(materialId: string): Promise<any[]> {
  try {
    const data = await aulaApi(`?accion=comentarios&materialId=${encodeURIComponent(materialId)}`);
    return data.comentarios || [];
  } catch { return []; }
}

export async function getStatsAula(aulaId: string) {
  try {
    const data = await aulaApi(`?accion=stats&aulaId=${encodeURIComponent(aulaId)}`);
    return data.stats || {};
  } catch { return {}; }
}

export async function crearAula(aula: any) {
  return aulaApi('', { method: 'POST', body: JSON.stringify({ tipo: 'aula', datos: aula }) });
}

export async function crearMaterial(material: any) {
  return aulaApi('', { method: 'POST', body: JSON.stringify({ tipo: 'material', datos: material }) });
}

export async function crearEntrega(entrega: any) {
  return aulaApi('', { method: 'POST', body: JSON.stringify({ tipo: 'entrega', datos: entrega }) });
}

export async function crearComentario(comentario: any) {
  return aulaApi('', { method: 'POST', body: JSON.stringify({ tipo: 'comentario', datos: comentario }) });
}

export async function actualizarAula(id: string, datos: any) {
  return aulaApi('', { method: 'PUT', body: JSON.stringify({ tipo: 'aula', id, datos }) });
}

export async function actualizarEntrega(id: string, datos: any) {
  return aulaApi('', { method: 'PUT', body: JSON.stringify({ tipo: 'entrega', id, datos }) });
}

export async function actualizarMaterial(id: string, datos: any) {
  return aulaApi('', { method: 'PUT', body: JSON.stringify({ tipo: 'material', id, datos }) });
}

export async function eliminarAula(id: string) {
  return aulaApi(`?tipo=aula&id=${encodeURIComponent(id)}`, { method: 'DELETE' });
}

export async function eliminarMaterial(id: string) {
  return aulaApi(`?tipo=material&id=${encodeURIComponent(id)}`, { method: 'DELETE' });
}

export async function eliminarEntrega(id: string) {
  return aulaApi(`?tipo=entrega&id=${encodeURIComponent(id)}`, { method: 'DELETE' });
}

export async function eliminarComentario(id: string) {
  return aulaApi(`?tipo=comentario&id=${encodeURIComponent(id)}`, { method: 'DELETE' });
}

// ─────────────────────────────────────────────────────────────────────────────
// MENSAJES  →  /api/mensajes
// ─────────────────────────────────────────────────────────────────────────────

async function mensajesApi(path: string, opts: RequestInit = {}) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(opts.headers as Record<string, string> || {}),
  };
  if (_token) headers['Authorization'] = `Bearer ${_token}`;
  const res = await fetchWithTimeout(BASE + '/api/mensajes' + path, { ...opts, headers }, 8000);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Error ${res.status}`);
  }
  return res.json();
}

export async function getConversaciones(): Promise<any[]> {
  try {
    const data = await mensajesApi('?accion=conversaciones');
    return data.mensajes || [];
  } catch { return []; }
}

export async function getConversacion(otherUserId: string): Promise<any[]> {
  try {
    const data = await mensajesApi(`?accion=conversacion&userId=${encodeURIComponent(otherUserId)}`);
    return data.mensajes || [];
  } catch { return []; }
}

export async function getBroadcasts(): Promise<any[]> {
  try {
    const data = await mensajesApi('?accion=broadcasts');
    return data.mensajes || [];
  } catch { return []; }
}

export async function getMensajesNoLeidos(): Promise<number> {
  try {
    const data = await mensajesApi('?accion=noLeidos');
    return data.noLeidos || 0;
  } catch { return 0; }
}

export async function enviarMensaje(mensaje: { senderId: string; senderName: string; receiverId: string; subject?: string; text: string; isBroadcast?: boolean; priority?: string; category?: string }) {
  return mensajesApi('', { method: 'POST', body: JSON.stringify(mensaje) });
}

export async function marcarMensajesLeidos(params: { mensajeIds?: string[]; otherUserId?: string }) {
  return mensajesApi('?accion=marcarLeidos', { method: 'PUT', body: JSON.stringify(params) });
}

export async function editarMensaje(id: string, datos: { subject?: string; text?: string; priority?: string; category?: string }) {
  return mensajesApi('', { method: 'PUT', body: JSON.stringify({ id, ...datos }) });
}

export async function eliminarMensaje(id: string) {
  return mensajesApi(`?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
}

// ─────────────────────────────────────────────────────────────────────────────
// CALIFICACIONES  →  /api/calificaciones  (REST API dedicada)
// ─────────────────────────────────────────────────────────────────────────────

async function calApi(path: string, opts: RequestInit = {}) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(opts.headers as Record<string, string> || {}),
  };
  if (_token) headers['Authorization'] = `Bearer ${_token}`;
  const res = await fetchWithTimeout(BASE + '/api/calificaciones' + path, { ...opts, headers }, 9000);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Error ${res.status}`);
  }
  return res.json();
}

export async function getCalificacionesREST(params?: { alumnoId?: string; columnaId?: string; grado?: string; page?: number; limit?: number; desde?: string }): Promise<{ calificaciones: any[]; total?: number }> {
  try {
    const searchParams = new URLSearchParams();
    if (params?.alumnoId) searchParams.set('alumnoId', params.alumnoId);
    if (params?.columnaId) searchParams.set('columnaId', params.columnaId);
    if (params?.grado) searchParams.set('grado', params.grado);
    if (params?.page !== undefined) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.desde) searchParams.set('desde', params.desde);
    const qs = searchParams.toString();
    return await calApi(qs ? `?${qs}` : '') as any;
  } catch { return { calificaciones: [] }; }
}

export async function crearCalificacionREST(cal: any) {
  return calApi('', { method: 'POST', body: JSON.stringify(cal) });
}

export async function actualizarCalificacionREST(id: string, cal: any) {
  return calApi(`?id=${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(cal) });
}

export async function eliminarCalificacionREST(id: string) {
  return calApi(`?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
}

// ─────────────────────────────────────────────────────────────────────────────
// NOTIFICACIONES  →  /api/notificaciones
// ─────────────────────────────────────────────────────────────────────────────

async function notifApi(path: string, opts: RequestInit = {}) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(opts.headers as Record<string, string> || {}),
  };
  if (_token) headers['Authorization'] = `Bearer ${_token}`;
  const res = await fetchWithTimeout(BASE + '/api/notificaciones' + path, { ...opts, headers }, 5000);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Error ${res.status}`);
  }
  return res.json();
}

export async function getNotificaciones(userId: string, limit = 50): Promise<any[]> {
  try {
    const data = await notifApi(`?userId=${encodeURIComponent(userId)}&limit=${limit}`);
    return data.notifications || [];
  } catch { return []; }
}

export async function getNotificacionesNoLeidas(userId: string): Promise<number> {
  try {
    const data = await notifApi(`?userId=${encodeURIComponent(userId)}&unread=1`);
    return data.count || 0;
  } catch { return 0; }
}

export async function crearNotificacion(notif: { userId: string; type: string; title: string; body?: string; data?: any }) {
  return notifApi('', { method: 'POST', body: JSON.stringify(notif) });
}

export async function marcarNotificacionesLeidas(userId: string, notifIds?: string[]) {
  return notifApi('?accion=marcarLeidas', { method: 'PUT', body: JSON.stringify({ userId, notifIds }) });
}

export async function eliminarNotificacion(id: string) {
  return notifApi(`?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
}

export function connectSSE(): EventSource | null {
  try {
    const url = `${BASE}/api/notificaciones?accion=stream`;
    const es = new EventSource(url);
    return es;
  } catch { return null; }
}

// ─────────────────────────────────────────────────────────────────────────────
// BACKUP RESTORE  →  /api/backup?restore=<id>
// ─────────────────────────────────────────────────────────────────────────────

export async function restaurarBackup(id: string): Promise<any> {
  const headers: Record<string, string> = {};
  if (_token) headers['Authorization'] = `Bearer ${_token}`;
  const res = await fetchWithTimeout(`${BASE}/api/backup?restore=${encodeURIComponent(id)}`, { method: 'PUT', headers }, 30000);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Error ${res.status}`);
  }
  return res.json();
}
