// ── Persistencia localStorage + Turso ───────────────────────────────────────────

const TURSO_ENABLED = import.meta.env.PROD;

async function syncToTurso(tipo: string, datos: any[]) {
  if (!TURSO_ENABLED || datos.length === 0) return;
  try {
    await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tipo, datos })
    });
  } catch (e) {
    console.error('Sync error:', e);
  }
}

async function loadFromTurso() {
  if (!TURSO_ENABLED) return null;
  try {
    const res = await fetch('/api/sync');
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

export function guardarNota(nota: any) {
  const notas = getNotas();
  const idx = notas.findIndex((n: any) =>
    n.estudianteId === nota.estudianteId &&
    n.competencia === nota.competencia &&
    n.instrumento === nota.instrumento &&
    n.periodo === nota.periodo
  );
  if (idx >= 0) notas[idx] = nota;
  else notas.push({ ...nota, id: 'cal-' + Date.now() });
  localStorage.setItem('ie_calificativos', JSON.stringify(notas));
}

export function eliminarNota(id: string) {
  const notas = getNotas().filter((n: any) => n.id !== id);
  localStorage.setItem('ie_calificativos', JSON.stringify(notas));
}

// Guardar y sincronizar
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

// ── Lógica calificativos MINEDU ───────────────────────────────────────────────
// Instrumentos (criterios): >= 80% → A, >= 40% → B, < 40% → C
// AD: solo asignado manualmente por el docente cuando supera lo esperado
export function calcularCalificativo(resueltos: number, total: number): 'C' | 'B' | 'A' {
  if (total === 0) return 'C';
  const pct = resueltos / total;
  if (pct >= 0.80) return 'A';
  if (pct >= 0.40) return 'B';
  return 'C';
}

// Exámenes: >= 80% → A, >= 50% → B, < 50% → C
export function calcularCalificativoExamen(correctas: number, total: number): 'C' | 'B' | 'A' {
  if (total === 0) return 'C';
  const pct = correctas / total;
  if (pct >= 0.80) return 'A';
  if (pct >= 0.50) return 'B';
  return 'C';
}

export async function loadSystemData() {
  // Intentar cargar desde Turso primero
  const cloudData = await loadFromTurso();
  
  if (cloudData) {
    // Si hay datos en la nube, guardarlos en localStorage
    if (cloudData.alumnos?.length > 0 && !localStorage.getItem('ie_alumnos')) {
      localStorage.setItem('ie_alumnos', JSON.stringify(cloudData.alumnos));
    }
    if (cloudData.docentes?.length > 0 && !localStorage.getItem('ie_docentes')) {
      localStorage.setItem('ie_docentes', JSON.stringify(cloudData.docentes));
    }
    if (cloudData.usuarios?.length > 0 && !localStorage.getItem('sistema_usuarios')) {
      localStorage.setItem('sistema_usuarios', JSON.stringify(cloudData.usuarios));
    }
  }
  
  // Sincronizar datos locales a la nube
  const estudiantes = getEstudiantes();
  const maestros = getMaestros();
  const usuarios = getUsuarios();
  
  if (estudiantes.length > 0) syncToTurso('alumnos', estudiantes);
  if (maestros.length > 0) syncToTurso('docentes', maestros);
  if (usuarios.length > 0) syncToTurso('usuarios', usuarios);

  return {
    estudiantes: getEstudiantes(),
    maestros: getMaestros(),
    notas: getNotas(),
    competenciasMinedu: ['Lee textos diversos', 'Produce textos escritos', 'Interactúa oralmente']
  };
}
