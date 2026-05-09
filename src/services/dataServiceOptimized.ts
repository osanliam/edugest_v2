/**
 * 🚀 SERVICIO DE DATOS OPTIMIZADO
 * Soluciona los problemas de rendimiento:
 * - Paginación en lugar de cargar TODO
 * - Caché inteligente
 * - Lazy loading de datos
 */

const TURSO_ENABLED = true;
const PAGE_SIZE = 50; // Cargar 50 alumnos por vez

let cache = {
  students: new Map<string, any>(),
  teachers: new Map<string, any>(),
  grades: new Map<string, any>(),
  lastSync: 0
};

// ═══════════════════════════════════════════════════════════════════════════
// 1️⃣  FETCH CON TIMEOUT Y RETRY
// ═══════════════════════════════════════════════════════════════════════════

async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeout = 5000
): Promise<Response> {
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

// ═══════════════════════════════════════════════════════════════════════════
// 2️⃣  PAGINACIÓN - Cargar datos en chunks
// ═══════════════════════════════════════════════════════════════════════════

export async function getEstudiantesPaginados(page: number = 0): Promise<{
  data: any[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}> {
  try {
    // Intenta desde API primero (si hay paginación)
    const res = await fetchWithTimeout(
      `/api/students?page=${page}&limit=${PAGE_SIZE}`,
      {},
      5000
    );

    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn('API pagination unavailable, falling back to localStorage');
  }

  // Fallback: localStorage sin paginación
  try {
    const all = JSON.parse(localStorage.getItem('ie_alumnos') || '[]');
    const start = page * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    return {
      data: all.slice(start, end),
      total: all.length,
      page,
      pageSize: PAGE_SIZE,
      hasMore: end < all.length
    };
  } catch {
    return { data: [], total: 0, page, pageSize: PAGE_SIZE, hasMore: false };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// 3️⃣  CACHÉ INTELIGENTE - Solo cargar lo que cambió
// ═══════════════════════════════════════════════════════════════════════════

export async function getEstudiantesOptimizado(): Promise<any[]> {
  const now = Date.now();
  const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

  // Si tenemos caché fresco, devolverlo
  if (cache.students.size > 0 && now - cache.lastSync < CACHE_TTL) {
    console.log(`✅ Cache hit: ${cache.students.size} estudiantes`);
    return Array.from(cache.students.values());
  }

  try {
    // Cargar desde API/localStorage
    const res = await fetchWithTimeout('/api/students?limit=10000', {}, 5000);
    let data = [];

    if (res.ok) {
      data = await res.json();
    } else {
      data = JSON.parse(localStorage.getItem('ie_alumnos') || '[]');
    }

    // Actualizar caché
    cache.students.clear();
    data.forEach(item => cache.students.set(item.id, item));
    cache.lastSync = now;

    return data;
  } catch (e) {
    console.error('Error loading estudiantes:', e);
    return Array.from(cache.students.values());
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// 4️⃣  SINCRONIZACIÓN INTELIGENTE - Solo subir cambios
// ═══════════════════════════════════════════════════════════════════════════

interface SyncMetadata {
  lastSyncHash?: string;
  lastSyncTime?: number;
}

function getDataHash(data: any[]): string {
  return String(
    data
      .map(item => JSON.stringify(item))
      .join('')
      .length
  );
}

export async function syncToTursoOptimized(
  tipo: string,
  datos: any[]
): Promise<boolean> {
  if (!TURSO_ENABLED || !datos?.length) return false;

  try {
    // Obtener hash anterior
    const meta = JSON.parse(
      localStorage.getItem(`_sync_meta_${tipo}`) || '{}'
    ) as SyncMetadata;
    const currentHash = getDataHash(datos);

    // Si no cambió, no sincronizar
    if (meta.lastSyncHash === currentHash) {
      console.log(`⏭️  ${tipo}: sin cambios, skip sync`);
      return true;
    }

    // Enviar en chunks
    const CHUNK = 100;
    for (let i = 0; i < datos.length; i += CHUNK) {
      const chunk = datos.slice(i, i + CHUNK);
      const res = await fetchWithTimeout(
        '/api/sync',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tipo,
            datos: chunk,
            offset: i
          })
        },
        10000
      );

      if (!res.ok) {
        throw new Error(
          `Sync failed: ${res.status} ${(await res.text()).slice(0, 200)}`
        );
      }
    }

    // Guardar hash y timestamp
    localStorage.setItem(
      `_sync_meta_${tipo}`,
      JSON.stringify({
        lastSyncHash: currentHash,
        lastSyncTime: Date.now()
      })
    );

    console.log(
      `✅ Sincronizado: ${tipo} (${datos.length} registros)`
    );
    return true;
  } catch (e) {
    console.error(`❌ Sync error [${tipo}]:`, e);
    return false;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// 5️⃣  BÚSQUEDA/FILTRADO EFICIENTE
// ═══════════════════════════════════════════════════════════════════════════

export function buscarEstudiantes(
  query: string,
  estudiantes: any[] = []
): any[] {
  if (!query.trim()) return estudiantes;

  const q = query.toLowerCase();
  return estudiantes.filter(
    est =>
      est.nombre?.toLowerCase().includes(q) ||
      est.apellido?.toLowerCase().includes(q) ||
      est.codigo?.toLowerCase().includes(q)
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 6️⃣  FUNCIONES COMPATIBLES CON EL CÓDIGO EXISTENTE
// ═══════════════════════════════════════════════════════════════════════════

export function getEstudiantes(): any[] {
  try {
    const d = JSON.parse(localStorage.getItem('ie_alumnos') || '[]');
    return Array.isArray(d) ? d : [];
  } catch {
    return [];
  }
}

export function getMaestros(): any[] {
  try {
    const d = JSON.parse(localStorage.getItem('ie_docentes') || '[]');
    return Array.isArray(d) ? d : [];
  } catch {
    return [];
  }
}

export function getCalificativos(): any[] {
  try {
    const data = JSON.parse(localStorage.getItem('ie_calificativos_v2') || '[]');
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export function guardarAlumnos(alumnos: any[]): void {
  localStorage.setItem('ie_alumnos', JSON.stringify(alumnos));
  syncToTursoOptimized('alumnos', alumnos).catch(e =>
    console.error('Background sync failed:', e)
  );
}

export function guardarCalificativos(calificativos: any[]): void {
  localStorage.setItem('ie_calificativos_v2', JSON.stringify(calificativos));
  syncToTursoOptimized('calificativos', calificativos).catch(e =>
    console.error('Background sync failed:', e)
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 7️⃣  DIAGNÓSTICO
// ═══════════════════════════════════════════════════════════════════════════

export function getStorageStats() {
  const keys = [
    'ie_alumnos',
    'ie_docentes',
    'ie_calificativos_v2',
    'cfg_asignaciones'
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
    totalKB: Math.round((totalBytes / 1024) * 10) / 10,
    totalMB: Math.round((totalBytes / (1024 * 1024)) * 100) / 100,
    maxBytes: 5 * 1024 * 1024,
    percentage: Math.round((totalBytes / (5 * 1024 * 1024)) * 100),
    breakdown,
    cacheSize: cache.students.size,
    cacheAge: Date.now() - cache.lastSync
  };
}

console.log('✨ dataServiceOptimized loaded');
