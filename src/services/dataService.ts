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
    'ie_registros_normas'
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
  if (!TURSO_ENABLED || !datos || datos.length === 0) return;
  const CHUNK = 50;
  try {
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
    console.log(`✅ Sincronizado: ${tipo} (${datos.length} registros en ${Math.ceil(datos.length/CHUNK)} chunks)`);
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
  try { return JSON.parse(localStorage.getItem('ie_alumnos') || '[]'); } catch { return []; }
}

export function getMaestros() {
  try { return JSON.parse(localStorage.getItem('ie_docentes') || '[]'); } catch { return []; }
}

export function getUsuarios() {
  try { return JSON.parse(localStorage.getItem('sistema_usuarios') || '[]'); } catch { return []; }
}

export function getNotas() {
  try { return JSON.parse(localStorage.getItem('ie_calificativos') || '[]'); } catch { return []; }
}

export function getCalificativos() {
  try { return JSON.parse(localStorage.getItem('ie_calificativos_v2') || '[]'); } catch { return []; }
}

export function getColumnas() {
  try { return JSON.parse(localStorage.getItem('cal_columnas') || '[]'); } catch { return []; }
}

export function getUnidades() {
  try { return JSON.parse(localStorage.getItem('cfg_unidades') || '[]'); } catch { return []; }
}

export function getNormas() {
  try { return JSON.parse(localStorage.getItem('cfg_normas_convivencia') || '[]'); } catch { return []; }
}

export function getRegistrosNormas() {
  try { return JSON.parse(localStorage.getItem('ie_registros_normas') || '[]'); } catch { return []; }
}

export function getAsignaciones() {
  try { return JSON.parse(localStorage.getItem('cfg_asignaciones') || '[]'); } catch { return []; }
}

export function guardarAsignaciones(asignaciones: any[]) {
  localStorage.setItem('cfg_asignaciones', JSON.stringify(asignaciones));
  syncToTurso('asignaciones', asignaciones);
}

export function getAsistencia() {
  try { return JSON.parse(localStorage.getItem('ie_asistencia') || '[]'); } catch { return []; }
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
  const allDetalles: string[] = [];

  for (const { key, tipo } of tipos) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const datos = JSON.parse(raw);
      if (!Array.isArray(datos) || datos.length === 0) continue;

      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo, datos }),
      });

      const body = await res.json().catch(() => ({ success: false }));

      if (res.ok && body.success) {
        syncedTypes.push(`${tipo} (${body.ok ?? datos.length})`);
      } else if (res.ok && body.ok > 0) {
        // Parcialmente OK
        syncedTypes.push(`${tipo} (${body.ok}/${datos.length})`);
        if (body.detalles?.length) allDetalles.push(...body.detalles);
      } else {
        failedTypes.push(tipo);
        const msg = body.error || body.detalles?.[0] || 'error desconocido';
        allDetalles.push(`[${tipo}] ${msg}`);
        console.error(`Sync error [${tipo}]:`, body);
      }
    } catch (e: any) {
      failedTypes.push(tipo);
      allDetalles.push(`[${tipo}] ${e.message}`);
      console.error(`Error syncing ${tipo}:`, e);
    }
  }

  const ok = failedTypes.length === 0;
  const message = ok
    ? `Sincronización completa: ${syncedTypes.length} colecciones subidas a Turso`
    : `Sync parcial: ${syncedTypes.length} OK — falló: ${failedTypes.join(', ')}`;

  return { ok, message, syncedTypes: [...syncedTypes, ...allDetalles.map(d => `⚠ ${d}`)] };
}

// ── Cargar datos del sistema ───────────────────────────────────────────────────

export async function loadSystemData() {
  const cloudData = await loadFromTurso();
  
  if (cloudData) {
    // Fusionar datos de la nube con locales
    if (cloudData.alumnos?.length > 0) {
      const localAlum = getEstudiantes();
      const cloudIds = new Set(cloudData.alumnos.map((a: any) => a.id));
      const fusionados = [...localAlum];
      cloudData.alumnos.forEach((a: any) => {
        if (!fusionados.find(x => x.id === a.id)) {
          fusionados.push(a);
        }
      });
      localStorage.setItem('ie_alumnos', JSON.stringify(fusionados));
    }
    
    if (cloudData.docentes?.length > 0) {
      const localDoc = getMaestros();
      const fusionados = [...localDoc];
      cloudData.docentes.forEach((d: any) => {
        if (!fusionados.find(x => x.id === d.id)) {
          fusionados.push(d);
        }
      });
      localStorage.setItem('ie_docentes', JSON.stringify(fusionados));
    }
    
    if (cloudData.usuarios?.length > 0) {
      const localUsr = getUsuarios();
      const fusionados = [...localUsr];
      cloudData.usuarios.forEach((u: any) => {
        if (!fusionados.find(x => x.id === u.id)) {
          fusionados.push(u);
        }
      });
      localStorage.setItem('sistema_usuarios', JSON.stringify(fusionados));
    }
    
    if (cloudData.columnas?.length > 0) {
      localStorage.setItem('cal_columnas', JSON.stringify(cloudData.columnas));
    }
    
    if (cloudData.unidades?.length > 0) {
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

    if (cloudData.asignaciones?.length > 0) {
      // Las asignaciones vienen con grados/secciones/cursos como JSON strings desde Turso
      const localAsig = getAsignaciones();
      const fusionadas = [...localAsig];
      cloudData.asignaciones.forEach((a: any) => {
        // Parsear campos JSON si vienen como string
        const parsed = {
          ...a,
          grados:   typeof a.grados   === 'string' ? JSON.parse(a.grados   || '[]') : (a.grados   || []),
          secciones: typeof a.secciones === 'string' ? JSON.parse(a.secciones || '[]') : (a.secciones || []),
          cursos:   typeof a.cursos   === 'string' ? JSON.parse(a.cursos   || '[]') : (a.cursos   || []),
        };
        const idx = fusionadas.findIndex(x => x.id === parsed.id);
        if (idx >= 0) fusionadas[idx] = parsed; // actualizar si ya existe
        else fusionadas.push(parsed);
      });
      localStorage.setItem('cfg_asignaciones', JSON.stringify(fusionadas));
    }
  }
  
  // Sincronizar datos locales a la nube
  const estudiantes = getEstudiantes();
  const maestros = getMaestros();
  const usuarios = getUsuarios();
  const columnas = getColumnas();
  const unidades = getUnidades();
  const normas = getNormas();
  const calificaciones = getCalificativos();
  const asistencia = getAsistencia();
  
  if (estudiantes.length > 0) syncToTurso('alumnos', estudiantes);
  if (maestros.length > 0) syncToTurso('docentes', maestros);
  if (usuarios.length > 0) syncToTurso('usuarios', usuarios);
  if (columnas.length > 0) syncToTurso('columnas', columnas);
  if (unidades.length > 0) syncToTurso('unidades', unidades);
  if (normas.length > 0) syncToTurso('normas', normas);
  if (calificaciones.length > 0) syncToTurso('calificativos', calificaciones);
  if (asistencia.length > 0) syncToTurso('asistencia', asistencia);
  const registrosNormas = getRegistrosNormas();
  if (registrosNormas.length > 0) syncToTurso('registros_normas', registrosNormas);
  const asignaciones = getAsignaciones();
  if (asignaciones.length > 0) syncToTurso('asignaciones', asignaciones);

  return {
    estudiantes: getEstudiantes(),
    maestros: getMaestros(),
    notas: getNotas(),
    competenciasMinedu: ['Lee textos diversos', 'Produce textos escritos', 'Interactúa oralmente']
  };
}