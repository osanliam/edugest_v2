// ── Persistencia localStorage ─────────────────────────────────────────────────

export function getEstudiantes() {
  try { return JSON.parse(localStorage.getItem('ie_alumnos') || '[]'); } catch { return []; }
}

export function getMaestros() {
  try { return JSON.parse(localStorage.getItem('ie_docentes') || '[]'); } catch { return []; }
}

export function getNotas() {
  try { return JSON.parse(localStorage.getItem('ie_calificativos') || '[]'); } catch { return []; }
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
  return {
    estudiantes: getEstudiantes(),
    maestros: getMaestros(),
    notas: getNotas(),
    competenciasMinedu: ['Lee textos diversos', 'Produce textos escritos', 'Interactúa oralmente']
  };
}
