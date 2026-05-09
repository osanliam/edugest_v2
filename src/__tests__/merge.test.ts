import { describe, it, expect } from 'vitest';

// ── Lógica de merge extraída de api/sync.js ────────────────────────────────
// Cuando dos docentes guardan el mismo calificativo (mismo alumno+columna),
// el servidor combina los marcados con OR para no perder trabajo de ninguno.
function mergeMarcados(existentes: boolean[], nuevos: boolean[]): boolean[] {
  const len = Math.max(existentes.length, nuevos.length);
  return Array.from({ length: len }, (_, i) => (nuevos[i] || false) || (existentes[i] || false));
}

// ── Escala de calificación (igual que CalificativosScreen) ─────────────────
function calcularEscala(pct: number): 'C' | 'B' | 'A' {
  return pct >= 100 ? 'A' : pct >= 55 ? 'B' : 'C';
}

// ── Promedio de competencia (igual que promedioCompetencia) ────────────────
const CAL_VALOR: Record<string, number> = { C: 1, B: 2, A: 3, AD: 4 };
const VALOR_CAL: Record<number, 'C' | 'B' | 'A' | 'AD'> = { 1: 'C', 2: 'B', 3: 'A', 4: 'AD' };

function promedioCompetencia(valores: Array<'C' | 'B' | 'A' | 'AD'>): 'C' | 'B' | 'A' | 'AD' | null {
  if (valores.length === 0) return null;
  const nums = valores.map(v => CAL_VALOR[v]);
  const r = Math.round(nums.reduce((a, b) => a + b, 0) / nums.length);
  return VALOR_CAL[Math.min(4, Math.max(1, r))];
}

// ─────────────────────────────────────────────────────────────────────────────

describe('Merge de marcados (conflicto multi-docente)', () => {
  it('combina con OR: si cualquiera marcó el ítem, queda marcado', () => {
    const docA = [true,  true,  false, false];
    const docB = [false, false, true,  true];
    expect(mergeMarcados(docA, docB)).toEqual([true, true, true, true]);
  });

  it('sin conflicto: el mismo docente sobrescribe su trabajo', () => {
    const anterior = [true, false, false];
    const nuevo    = [true, true,  false];
    expect(mergeMarcados(anterior, nuevo)).toEqual([true, true, false]);
  });

  it('arrays de largo distinto: el más largo gana en los índices extra', () => {
    const corto = [true, false];
    const largo  = [false, true, true, false];
    expect(mergeMarcados(corto, largo)).toEqual([true, true, true, false]);
  });

  it('arrays vacíos no rompen nada', () => {
    expect(mergeMarcados([], [])).toEqual([]);
    expect(mergeMarcados([], [true, false])).toEqual([true, false]);
    expect(mergeMarcados([true], [])).toEqual([true]);
  });

  it('no borra un ítem ya marcado aunque el nuevo lo tenga en false', () => {
    const anterior = [true,  true,  true];
    const nuevo    = [false, false, false];
    // El merge con OR preserva los true del anterior
    expect(mergeMarcados(anterior, nuevo)).toEqual([true, true, true]);
  });
});

describe('Escala de calificación', () => {
  it('100% → A (Logro Esperado)', () => {
    expect(calcularEscala(100)).toBe('A');
  });

  it('55%–99% → B (En Proceso)', () => {
    expect(calcularEscala(55)).toBe('B');
    expect(calcularEscala(75)).toBe('B');
    expect(calcularEscala(99)).toBe('B');
  });

  it('0%–54% → C (En Inicio)', () => {
    expect(calcularEscala(0)).toBe('C');
    expect(calcularEscala(30)).toBe('C');
    expect(calcularEscala(54)).toBe('C');
  });

  it('porcentaje calculado a partir de correctas/total', () => {
    const correctas = 8;
    const total     = 10;
    const pct       = Math.round((correctas / total) * 100);
    expect(calcularEscala(pct)).toBe('B'); // 80% → B
  });
});

describe('Promedio de competencia', () => {
  it('todos A → resultado A', () => {
    expect(promedioCompetencia(['A', 'A', 'A'])).toBe('A');
  });

  it('mezcla A y B → A (Math.round(2.5) = 3 en JS)', () => {
    // (A=3 + B=2) / 2 = 2.5 → Math.round(2.5) = 3 → A
    // JavaScript usa redondeo "half-up", no bancario
    expect(promedioCompetencia(['A', 'B'])).toBe('A');
  });

  it('todos C → resultado C', () => {
    expect(promedioCompetencia(['C', 'C', 'C'])).toBe('C');
  });

  it('array vacío → null', () => {
    expect(promedioCompetencia([])).toBeNull();
  });

  it('AD se promedia correctamente', () => {
    // AD=4, A=3 → (4+3)/2 = 3.5 → round = 4 → AD
    expect(promedioCompetencia(['AD', 'A'])).toBe('AD');
  });

  it('no puede salir de rango (mínimo C, máximo AD)', () => {
    const resultado = promedioCompetencia(['C']);
    expect(['C', 'B', 'A', 'AD']).toContain(resultado);
    expect(resultado).not.toBeNull();
  });
});
