// ── Persistencia localStorage + Turso ───────────────────────────────────────────

const TURSO_ENABLED = true;

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeout = 5000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return res;
  } catch (e) {
    clearTimeout(id);
    throw e;
  }
}

export async function getTursoDBSize(): Promise<number> {
  if (!TURSO_ENABLED) return 0;
  try {
    const res = await fetchWithTimeout('/api/sync?size=1', {}, 3000);
    if (res.ok) {
      const data = await res.json();
      return data.dbSize || 0;
    }
  } catch (e) {
    console.error('Error getting Turso size:', e);
  }
  return 0;
}

export function getStorageStats() {
  const keys = [
    'ie_alumnos', 'ie_docentes', 'sistema_usuarios', 'ie_calificativos_v2',
    'cal_columnas', 'cfg_bimestres', 'cfg_unidades', 'cfg_grados', 'cfg_secciones',
    'cfg_instrumentos', 'cfg_asignaciones', 'ie_asistencia', 'cfg_normas_convivencia',
    'ie_registros_normas', 'aula_aulas', 'aula_materiales', 'aula_entregas',
    'aula_comentarios', 'aula_archivos'
  ];
  
  let totalBytes = 0;
  const breakdown: Record<string, number> = {};
  
  keys.forEach(key => {
    const data = localStorage.getItem(key);
    if (data) {
      const bytes = new Blob([data]).size;
      breakdown[key] = bytes;
      totalBytes += bytes;
    }
  });
  
  return {
    total: totalBytes,
    totalKB: Math.round(totalBytes / 1024 * 10) / 10,
    totalMB: Math.round(totalBytes / (1024 * 1024) * 100) / 100,
    maxBytes: 5 * 1024 * 1024,
    percentage: Math.round((totalBytes / (5 * 1024 * 1024)) * 100),
    breakdown
  };
}

export function isSyncedToCloud() {
  return TURSO_ENABLED;
}

export function getEnv() {
  return TURSO_ENABLED ? 'production' : 'development';
}

export async function syncToTurso(tipo: string, datos: any[]) {
  if (!TURSO_ENABLED || !datos) return;
  const CHUNK = 50;
  try {
    if (datos.length === 0) {
      // Array vacío = "borra todo" para tipos con full-replace (unidades, asignaciones)
      await fetchWithTimeout('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo, datos: [] })
      }, 8000);
      console.log(`✅ Sincronizado: ${tipo} (0 registros — tabla limpiada en nube)`);
      return;
    }
    for (let i = 0; i < datos.length; i += CHUNK) {
      const chunk = datos.slice(i, i + CHUNK);
      const res = await fetchWithTimeout('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo, datos: chunk })
      }, 8000);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        console.error(`Sync error [${tipo}] chunk ${i}-${i+chunk.length}:`, body.error || res.status);
      }
    }
    console.log(`✅ Sincronizado: ${tipo} (${datos.length} registros)`);
  } catch (e) {
    console.error('Sync error:', e);
  }
}

async function loadFromTurso() {
  if (!TURSO_ENABLED) return null;
  try {
    const res = await fetchWithTimeout('/api/sync', {}, 5000);
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.error('Load from Turso error:', e);
  }
  return null;
}

export function getEstudiantes() {
  try { const d = JSON.parse(localStorage.getItem('ie_alumnos') || '[]'); return Array.isArray(d) ? d : []; } catch { return []; }
}

export function getMaestros() {
  try { const d = JSON.parse(localStorage.getItem('ie_docentes') || '[]'); return Array.isArray(d) ? d : []; } catch { return []; }
}

export function getUsuarios() {
  try { const d = JSON.parse(localStorage.getItem('sistema_usuarios') || '[]'); return Array.isArray(d) ? d : []; } catch { return []; }
}

export function getNotas() {
  try { const d = JSON.parse(localStorage.getItem('ie_calificativos') || '[]'); return Array.isArray(d) ? d : []; } catch { return []; }
}

export function getCalificativos() {
  try {
    const data = JSON.parse(localStorage.getItem('ie_calificativos_v2') || '[]');
    return Array.isArray(data) ? data : [];
  } catch { return []; }
}

export function getColumnas() {
  try { const d = JSON.parse(localStorage.getItem('cal_columnas') || '[]'); return Array.isArray(d) ? d : []; } catch { return []; }
}

export function getUnidades() {
  try { const d = JSON.parse(localStorage.getItem('cfg_unidades') || '[]'); return Array.isArray(d) ? d : []; } catch { return []; }
}

export function getNormas() {
  try { const d = JSON.parse(localStorage.getItem('cfg_normas_convivencia') || '[]'); return Array.isArray(d) ? d : []; } catch { return []; }
}

export function getRegistrosNormas() {
  try { const d = JSON.parse(localStorage.getItem('ie_registros_normas') || '[]'); return Array.isArray(d) ? d : []; } catch { return []; }
}

export function getAsignaciones() {
  try { const d = JSON.parse(localStorage.getItem('cfg_asignaciones') || '[]'); return Array.isArray(d) ? d : []; } catch { return []; }
}

export function guardarAsignaciones(asignaciones: any[]) {
  localStorage.setItem('cfg_asignaciones', JSON.stringify(asignaciones));
  syncToTurso('asignaciones', asignaciones);
}

export function getAsistencia() {
  try { const d = JSON.parse(localStorage.getItem('ie_asistencia') || '[]'); return Array.isArray(d) ? d : []; } catch { return []; }
}

// ── Funciones de guardado con sincronización automática ──────────────────────────

export function guardarAlumnos(alumnos: any[]) {
  localStorage.setItem('ie_alumnos', JSON.stringify(alumnos));
  syncToTurso('alumnos', alumnos);
}

export function guardarDocentes(docentes: any[]) {
  localStorage.setItem('ie_docentes', JSON.stringify(docentes));
  syncToTurso('docentes', docentes);
}

export function guardarUsuarios(usuarios: any[]) {
  localStorage.setItem('sistema_usuarios', JSON.stringify(usuarios));
  syncToTurso('usuarios', usuarios);
}

export function guardarColumnas(columnas: any[]) {
  localStorage.setItem('cal_columnas', JSON.stringify(columnas));
  syncToTurso('columnas', columnas);
}

export function guardarCalificativos(calificativos: any[]) {
  localStorage.setItem('ie_calificativos_v2', JSON.stringify(calificativos));
  syncToTurso('calificativos', calificativos);
}

export function guardarUnidades(unidades: any[]) {
  localStorage.setItem('cfg_unidades', JSON.stringify(unidades));
  syncToTurso('unidades', unidades);
}

export function guardarNormas(normas: any[]) {
  localStorage.setItem('cfg_normas_convivencia', JSON.stringify(normas));
  syncToTurso('normas', normas);
}

export function guardarRegistrosNormas(registros: any[]) {
  localStorage.setItem('ie_registros_normas', JSON.stringify(registros));
  syncToTurso('registros_normas', registros);
}

export function guardarAsistencia(asistencia: any[]) {
  localStorage.setItem('ie_asistencia', JSON.stringify(asistencia));
  syncToTurso('asistencia', asistencia);
}

// ── Sync manual completo: sube TODO localStorage a Turso ──────────────────────
export async function syncAllToTurso(): Promise<{ ok: boolean; message: string; syncedTypes: string[] }> {
  const tipos = [
    { key: 'ie_alumnos',             tipo: 'alumnos' },
    { key: 'ie_docentes',            tipo: 'docentes' },
    { key: 'sistema_usuarios',       tipo: 'usuarios' },
    { key: 'cal_columnas',           tipo: 'columnas' },
    { key: 'cfg_unidades',           tipo: 'unidades' },
    { key: 'cfg_normas_convivencia', tipo: 'normas' },
    { key: 'ie_calificativos_v2',    tipo: 'calificativos' },
    { key: 'ie_asistencia',          tipo: 'asistencia' },
    { key: 'ie_registros_normas',    tipo: 'registros_normas' },
    { key: 'cfg_asignaciones',       tipo: 'asignaciones' },
    { key: 'aula_aulas',             tipo: 'aulas' },
    { key: 'aula_materiales',        tipo: 'materiales' },
    { key: 'aula_entregas',          tipo: 'entregas' },
    { key: 'aula_comentarios',       tipo: 'comentarios' },
    { key: 'v5_mensajes',            tipo: 'mensajes' },
    { key: 'v5_notificaciones',      tipo: 'notificaciones' },
  ];

  // En desarrollo no hay servidor — mostrar resumen local sin intentar fetch
  if (!TURSO_ENABLED) {
    const syncedTypes: string[] = [];
    for (const { key, tipo } of tipos) {
      try {
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        const datos = JSON.parse(raw);
        if (Array.isArray(datos) && datos.length > 0) {
          syncedTypes.push(`${tipo} (${datos.length})`);
        }
      } catch { /* ignorar */ }
    }
    return {
      ok: true,
      message: `Modo local — datos listos para subir en producción (${syncedTypes.length} colecciones con datos)`,
      syncedTypes,
    };
  }

  const syncedTypes: string[] = [];
  const failedTypes: string[] = [];

  for (const { key, tipo } of tipos) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const datos = JSON.parse(raw);
      if (!Array.isArray(datos) || datos.length === 0) continue;

      // Usar syncToTurso que ya maneja chunks de 50
      await syncToTurso(tipo, datos);
      syncedTypes.push(`${tipo} (${datos.length})`);
    } catch (e: any) {
      failedTypes.push(tipo);
      console.error(`Error syncing ${tipo}:`, e);
    }
  }

  const ok = failedTypes.length === 0;
  const message = ok
    ? `Sincronización completa: ${syncedTypes.length} colecciones subidas a Turso`
    : `Sync parcial: ${syncedTypes.length} OK — falló: ${failedTypes.join(', ')}`;

  return { ok, message, syncedTypes };
}

// ── Aula Virtual — localStorage + sync ──────────────────────────────────

export function getAulas() {
  try { const d = JSON.parse(localStorage.getItem('aula_aulas') || '[]'); return Array.isArray(d) ? d : []; } catch { return []; }
}
export function getMateriales() {
  try { const d = JSON.parse(localStorage.getItem('aula_materiales') || '[]'); return Array.isArray(d) ? d : []; } catch { return []; }
}
export function getEntregas() {
  try { const d = JSON.parse(localStorage.getItem('aula_entregas') || '[]'); return Array.isArray(d) ? d : []; } catch { return []; }
}
export function getComentarios() {
  try { const d = JSON.parse(localStorage.getItem('aula_comentarios') || '[]'); return Array.isArray(d) ? d : []; } catch { return []; }
}

export function guardarAulas(aulas: any[]) {
  localStorage.setItem('aula_aulas', JSON.stringify(aulas));
  syncToTurso('aulas', aulas);
}
export function guardarMateriales(materiales: any[]) {
  localStorage.setItem('aula_materiales', JSON.stringify(materiales));
  syncToTurso('materiales', materiales);
}
export function guardarEntregas(entregas: any[]) {
  localStorage.setItem('aula_entregas', JSON.stringify(entregas));
  syncToTurso('entregas', entregas);
}
export function guardarComentarios(comentarios: any[]) {
  localStorage.setItem('aula_comentarios', JSON.stringify(comentarios));
  syncToTurso('comentarios', comentarios);
}

// ── Mensajes ────────────────────────────────────────────────────────────

export function getMensajes() {
  try { const d = JSON.parse(localStorage.getItem('v5_mensajes') || '[]'); return Array.isArray(d) ? d : []; } catch { return []; }
}
export function guardarMensajes(mensajes: any[]) {
  localStorage.setItem('v5_mensajes', JSON.stringify(mensajes));
  syncToTurso('mensajes', mensajes);
}

// ── Notificaciones ────────────────────────────────────────────────────

export function getNotificaciones() {
  try { const d = JSON.parse(localStorage.getItem('v5_notificaciones') || '[]'); return Array.isArray(d) ? d : []; } catch { return []; }
}
export function guardarNotificaciones(notificaciones: any[]) {
  localStorage.setItem('v5_notificaciones', JSON.stringify(notificaciones));
  syncToTurso('notificaciones', notificaciones);
}

export function guardarArchivoAula(materialId: string, contenido: string) {
  const store = JSON.parse(localStorage.getItem('aula_archivos') || '{}');
  store[materialId] = contenido;
  try { localStorage.setItem('aula_archivos', JSON.stringify(store)); } catch { console.warn('localStorage lleno, no se pudo guardar archivo'); }
}
export function obtenerArchivoAula(materialId: string): string | null {
  try {
    const store = JSON.parse(localStorage.getItem('aula_archivos') || '{}');
    return store[materialId] || null;
  } catch { return null; }
}

export function guardarEntregaArchivo(entregaId: string, contenido: string) {
  const store = JSON.parse(localStorage.getItem('aula_archivos_entregas') || '{}');
  store[entregaId] = contenido;
  try { localStorage.setItem('aula_archivos_entregas', JSON.stringify(store)); } catch { console.warn('localStorage lleno'); }
}
export function obtenerEntregaArchivo(entregaId: string): string | null {
  try {
    const store = JSON.parse(localStorage.getItem('aula_archivos_entregas') || '{}');
    return store[entregaId] || null;
  } catch { return null; }
}

// ── Cargar datos del sistema ───────────────────────────────────────────────────

export async function loadSystemData() {
  const cloudData = await loadFromTurso();
  
  if (cloudData) {
    // Fusionar datos de la nube con locales
    // Turso es la fuente de verdad — reemplazar localStorage directamente sin fusionar
    if (cloudData.alumnos?.length > 0) {
      localStorage.setItem('ie_alumnos', JSON.stringify(cloudData.alumnos));
    }
    if (cloudData.docentes?.length > 0) {
      localStorage.setItem('ie_docentes', JSON.stringify(cloudData.docentes));
    }
    if (cloudData.usuarios?.length > 0) {
      localStorage.setItem('sistema_usuarios', JSON.stringify(cloudData.usuarios));
    }
    
    if (cloudData.columnas?.length > 0) {
      localStorage.setItem('cal_columnas', JSON.stringify(cloudData.columnas));
    }
    
    if (Array.isArray(cloudData.unidades)) {
      localStorage.setItem('cfg_unidades', JSON.stringify(cloudData.unidades));
    }
    
    if (cloudData.normas?.length > 0) {
      localStorage.setItem('cfg_normas_convivencia', JSON.stringify(cloudData.normas));
    }
    
    if (cloudData.calificaciones?.length > 0) {
      const localCal = getCalificativos();
      const fusionados = [...localCal];
      cloudData.calificaciones.forEach((c: any) => {
        if (!fusionados.find(x => x.alumnoId === c.alumnoId && x.columnaId === c.columnaId && x.fecha === c.fecha)) {
          fusionados.push(c);
        }
      });
      localStorage.setItem('ie_calificativos_v2', JSON.stringify(fusionados));
    }
    
    if (cloudData.asistencia?.length > 0) {
      const localAsist = getAsistencia();
      const fusionados = [...localAsist];
      cloudData.asistencia.forEach((a: any) => {
        if (!fusionados.find(x => x.alumnoId === a.alumnoId && x.fecha === a.fecha)) {
          fusionados.push(a);
        }
      });
      localStorage.setItem('ie_asistencia', JSON.stringify(fusionados));
    }

    if (cloudData.registros_normas?.length > 0) {
      const localNorm = getRegistrosNormas();
      const fusionados = [...localNorm];
      cloudData.registros_normas.forEach((r: any) => {
        if (!fusionados.find(x => x.id === r.id)) {
          fusionados.push(r);
        }
      });
      localStorage.setItem('ie_registros_normas', JSON.stringify(fusionados));
    }

    if (Array.isArray(cloudData.asignaciones)) {
      // Turso es fuente de verdad para asignaciones — reemplazar sin fusionar
      const parseadas = cloudData.asignaciones.map((a: any) => ({
        ...a,
        grados:    typeof a.grados    === 'string' ? JSON.parse(a.grados    || '[]') : (a.grados    || []),
        secciones: typeof a.secciones === 'string' ? JSON.parse(a.secciones || '[]') : (a.secciones || []),
        cursos:    typeof a.cursos    === 'string' ? JSON.parse(a.cursos    || '[]') : (a.cursos    || []),
      }));
      localStorage.setItem('cfg_asignaciones', JSON.stringify(parseadas));
    }

    if (Array.isArray(cloudData.aulas))       localStorage.setItem('aula_aulas', JSON.stringify(cloudData.aulas));
    if (Array.isArray(cloudData.materiales))   localStorage.setItem('aula_materiales', JSON.stringify(cloudData.materiales));
    if (Array.isArray(cloudData.entregas)) {
      const localEnt = getEntregas();
      const fusionados = [...localEnt];
      cloudData.entregas.forEach((e: any) => {
        if (!fusionados.find(x => x.id === e.id)) fusionados.push(e);
      });
      localStorage.setItem('aula_entregas', JSON.stringify(fusionados));
    }
    if (Array.isArray(cloudData.comentarios))  localStorage.setItem('aula_comentarios', JSON.stringify(cloudData.comentarios));
    if (Array.isArray(cloudData.mensajes))       localStorage.setItem('v5_mensajes', JSON.stringify(cloudData.mensajes));
    if (Array.isArray(cloudData.notificaciones)) localStorage.setItem('v5_notificaciones', JSON.stringify(cloudData.notificaciones));
  }
  
  // Sincronizar datos locales a la nube
  // NO subir automáticamente a Turso — causa duplicados cada vez que alguien entra
  // La subida se hace solo manualmente desde Configuración → Sincronizar

  return {
    estudiantes: getEstudiantes(),
    maestros: getMaestros(),
    notas: getNotas(),
    competenciasMinedu: ['Lee textos diversos', 'Produce textos escritos', 'Interactúa oralmente']
  };
}