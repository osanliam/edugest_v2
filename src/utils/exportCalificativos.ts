// Exportación de calificativos a Excel XLSX con múltiples hojas
// Hoja 1: Resumen de calificaciones
// Hojas 2+: Detalle de respuestas pregunta por pregunta por instrumento

import * as XLSX from 'xlsx';

export interface ColExport {
  id: string;
  nombre: string;
  tipo: string;
  totalItems: number;
  items?: string[];
  itemsExamen?: { correcta: string }[];
  competenciaId?: string;
  bimestreId?: string;
}
export interface AluExport {
  id: string;
  apellidos_nombres: string;
  grado: string;
  seccion: string;
}
export interface CalExport {
  alumnoId: string;
  columnaId: string;
  marcados: boolean[];
  claves?: string[];
  notaNumerica?: number;
  calificativo: string;
  esAD?: boolean;
  fecha?: string;
}

const CAL_VALOR: Record<string, number> = { C: 1, B: 2, A: 3, AD: 4 };
const TIPO_LABEL: Record<string, string> = {
  examen: 'Examen',
  'lista-cotejo': 'Lista de Cotejo',
  'ficha-observacion': 'Ficha de Observación',
  rubrica: 'Rúbrica',
  'rubrica-2': 'Rúbrica Mixta',
  'portafolio-evidencias': 'Portafolio',
  'registro-anecdotico': 'Registro Anecdótico',
  'escala-valoracion': 'Escala de Valoración',
  'nota-numerica': 'Nota Numérica',
};

function promedioCompetencia(alumnoId: string, compId: string, columnas: ColExport[], calificativos: CalExport[]): number | null {
  const cols = columnas.filter(c => c.competenciaId === compId);
  if (cols.length === 0) return null;
  const vals = cols.map(c => {
    const cal = calificativos.find(cal => cal.alumnoId === alumnoId && cal.columnaId === c.id);
    return cal ? CAL_VALOR[cal.calificativo] || 0 : 0;
  }).filter(v => v > 0);
  if (vals.length === 0) return null;
  const prom = vals.reduce((a, b) => a + b, 0) / vals.length;
  return Math.round(prom * 100) / 100;
}

function calificativoDePromedio(prom: number): string {
  if (prom >= 3.5) return 'AD';
  if (prom >= 2.5) return 'A';
  if (prom >= 1.5) return 'B';
  return 'C';
}

// ── Hoja 1: Resumen General ──────────────────────────────────────────
function buildResumenSheet(columnas: ColExport[], alumnos: AluExport[], calificativos: CalExport[]) {
  const comps = [...new Map(columnas.map(c => [c.competenciaId, c.competenciaId])).values()].filter(Boolean);
  const colsOrdenadas = [...columnas].sort((a, b) => (a.bimestreId || '').localeCompare(b.bimestreId || '') || a.nombre.localeCompare(b.nombre));

  const headers = ['N°', 'Apellidos y Nombres', 'Grado', 'Sección', ...colsOrdenadas.map(c => c.nombre)];
  if (comps.length > 0) headers.push(...comps.map((_, i) => `Prom.${i + 1}`), 'Prom.Final');

  const rows = alumnos.map((alu, idx) => {
    const row: any[] = [idx + 1, alu.apellidos_nombres, alu.grado, alu.seccion];
    colsOrdenadas.forEach(col => {
      const cal = calificativos.find(c => c.alumnoId === alu.id && c.columnaId === col.id);
      row.push(cal ? (cal.esAD ? 'AD' : cal.calificativo) : '');
    });
    if (comps.length > 0) {
      const proms = comps.map(compId => promedioCompetencia(alu.id, compId, columnas, calificativos));
      proms.forEach(p => row.push(p !== null ? p : ''));
      const validos = proms.filter(p => p !== null) as number[];
      const final = validos.length > 0 ? validos.reduce((a, b) => a + b, 0) / validos.length : null;
      row.push(final !== null ? calificativoDePromedio(final) : '');
    }
    return row;
  });

  return { headers, rows };
}

// ── Hoja de Detalle por Columna ──────────────────────────────────────
function buildDetalleSheet(col: ColExport, alumnos: AluExport[], calificativos: CalExport[]) {
  const n = col.totalItems || 0;
  const tipo = col.tipo;

  // Headers
  const headers = ['N°', 'Apellidos y Nombres', 'Grado', 'Sección'];
  if (tipo === 'nota-numerica') {
    headers.push('Nota (0-20)');
  } else if (tipo === 'examen') {
    for (let i = 0; i < n; i++) {
      headers.push(`P${i + 1}`);
    }
    headers.push('Correctas', 'Total', '%', 'Cal.');
  } else {
    for (let i = 0; i < n; i++) {
      const label = col.items?.[i] ? String(col.items[i]).slice(0, 25) : `I${i + 1}`;
      headers.push(label);
    }
    headers.push('Cal.');
  }

  const sorted = [...alumnos].sort((a, b) =>
    (a.grado + a.seccion + a.apellidos_nombres).localeCompare(b.grado + b.seccion + b.apellidos_nombres)
  );

  const rows = sorted.map((alu, idx) => {
    const cal = calificativos.find(c => c.alumnoId === alu.id && c.columnaId === col.id);
    const row: any[] = [idx + 1, alu.apellidos_nombres, alu.grado, alu.seccion];

    if (tipo === 'nota-numerica') {
      row.push(cal?.notaNumerica ?? '');
    } else if (tipo === 'examen') {
      let correctas = 0;
      let respondidas = 0;
      const itemsExamenArr = Array.isArray(col.itemsExamen) ? col.itemsExamen : [];
      for (let i = 0; i < n; i++) {
        const resp = (cal?.claves?.[i] || '').toUpperCase();
        const corr = (itemsExamenArr[i]?.correcta || '').toUpperCase();
        if (resp) {
          respondidas++;
          if (resp === corr) correctas++;
          row.push(resp);
        } else {
          row.push('');
        }
      }
      const porcentaje = n > 0 ? Math.round((correctas / n) * 100) : 0;
      row.push(correctas, respondidas, `${porcentaje}%`, cal?.calificativo || '');
    } else {
      // lista-cotejo, ficha-observacion, portafolio, escala, rubrica, registro-anecdotico
      for (let i = 0; i < n; i++) {
        if (cal?.marcados?.length > i) {
          const m = cal.marcados[i];
          if (Array.isArray(m)) {
            // Array de strings (respuestas seleccionadas)
            const seleccionadas = m.filter((x: string) => x !== '');
            row.push(seleccionadas.join(', ') || '');
          } else if (typeof m === 'boolean') {
            row.push(m ? '✓' : '✗');
          } else {
            row.push(String(m));
          }
        } else {
          row.push('');
        }
      }
      row.push(cal?.esAD ? 'AD' : (cal?.calificativo || ''));
    }
    return row;
  });

  return { headers, rows, sheetName: `${col.nombre.slice(0, 25)}`.replace(/[*?:\/\[\]]/g, '_') };
}

// ── Exportar Todo ────────────────────────────────────────────────────
export function exportarExcelCompleto(
  columnas: ColExport[],
  alumnos: AluExport[],
  calificativos: CalExport[],
  nombreGrado?: string,
  nombreSeccion?: string
) {
  if (columnas.length === 0 || alumnos.length === 0) {
    alert('No hay datos para exportar');
    return;
  }

  const wb = XLSX.utils.book_new();

  // Hoja 1: Resumen
  const resumen = buildResumenSheet(columnas, alumnos, calificativos);
  const wsResumen = XLSX.utils.aoa_to_sheet([resumen.headers, ...resumen.rows]);
  XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen');

  // Hojas 2+: Una por cada columna/instrumento
  columnas.forEach(col => {
    const detalle = buildDetalleSheet(col, alumnos, calificativos);
    const ws = XLSX.utils.aoa_to_sheet([detalle.headers, ...detalle.rows]);
    XLSX.utils.book_append_sheet(wb, ws, detalle.sheetName);
  });

  const gradoSec = nombreGrado && nombreSeccion ? `_${nombreGrado}_${nombreSeccion}` : '';
  const filename = `Registro_Calificativos${gradoSec}_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, filename);
}

// ── Exportar una sola columna ────────────────────────────────────────
export function exportarColumnaXLSX(col: ColExport, alumnos: AluExport[], calificativos: CalExport[]) {
  const wb = XLSX.utils.book_new();
  const detalle = buildDetalleSheet(col, alumnos, calificativos);
  const ws = XLSX.utils.aoa_to_sheet([detalle.headers, ...detalle.rows]);
  XLSX.utils.book_append_sheet(wb, ws, 'Detalle');

  // También añadir resumen simple
  const resumenHeaders = ['N°', 'Apellidos y Nombres', 'Grado', 'Sección', 'Calificativo'];
  const resumenRows = alumnos.map((alu, idx) => {
    const cal = calificativos.find(c => c.alumnoId === alu.id && c.columnaId === col.id);
    return [idx + 1, alu.apellidos_nombres, alu.grado, alu.seccion, cal?.esAD ? 'AD' : (cal?.calificativo || '')];
  });
  const wsResumen = XLSX.utils.aoa_to_sheet([resumenHeaders, ...resumenRows]);
  XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen');

  const filename = `${col.nombre.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ ]/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, filename);
}

// Retro-compatibilidad con nombres anteriores
export const exportarColumna = exportarColumnaXLSX;
export const exportarTodas = exportarExcelCompleto;
