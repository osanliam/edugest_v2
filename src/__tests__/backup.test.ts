import { describe, it, expect } from 'vitest';

// ── Helpers para backup (lógica pura, sin I/O) ─────────────────────────────

function generarIdBackup(timestamp: string): string {
  return `bkp-${timestamp.slice(0, 19).replace(/[:T]/g, '-')}`;
}

function parsearResumen(resumenJson: string): Record<string, number> | null {
  try {
    return JSON.parse(resumenJson);
  } catch {
    return null;
  }
}

function totalRegistrosBackup(resumen: Record<string, number>): number {
  return Object.values(resumen).reduce((a, b) => a + b, 0);
}

// ─────────────────────────────────────────────────────────────────────────────

describe('Generación de IDs de backup', () => {
  it('produce un ID legible a partir del timestamp', () => {
    const ts = '2026-04-26T02:00:00.000Z';
    const id  = generarIdBackup(ts);
    // La T también se reemplaza con '-', quedando solo guiones
    expect(id).toBe('bkp-2026-04-26-02-00-00');
    expect(id).toMatch(/^bkp-/);
  });

  it('dos timestamps distintos producen IDs distintos', () => {
    const id1 = generarIdBackup('2026-04-26T02:00:00.000Z');
    const id2 = generarIdBackup('2026-04-27T02:00:00.000Z');
    expect(id1).not.toBe(id2);
  });
});

describe('Parsing de resumen de backup', () => {
  it('parsea JSON de resumen correctamente', () => {
    const json = '{"alumnos":1249,"calificaciones":3500,"columnas":12}';
    const r    = parsearResumen(json);
    expect(r).not.toBeNull();
    expect(r?.alumnos).toBe(1249);
    expect(r?.calificaciones).toBe(3500);
  });

  it('devuelve null para JSON inválido', () => {
    expect(parsearResumen('no es json')).toBeNull();
    expect(parsearResumen('')).toBeNull();
  });

  it('calcula total de registros en el backup', () => {
    const resumen = { alumnos: 100, calificaciones: 500, columnas: 10, docentes: 20 };
    expect(totalRegistrosBackup(resumen)).toBe(630);
  });
});

describe('Verificación de integridad de backup', () => {
  it('backup válido contiene todas las tablas esperadas', () => {
    const TABLAS_REQUERIDAS = ['alumnos', 'calificaciones', 'columnas', 'docentes', 'users'];
    const backupDatos = {
      alumnos:       [{ id: 'a1' }],
      calificaciones:[{ id: 'c1' }],
      columnas:      [],
      docentes:      [],
      users:         [{ id: 'u1' }],
      _timestamp:    '2026-04-26T02:00:00.000Z',
    };
    const tablasPresentes = Object.keys(backupDatos).filter(k => !k.startsWith('_'));
    const todasPresentes  = TABLAS_REQUERIDAS.every(t => tablasPresentes.includes(t));
    expect(todasPresentes).toBe(true);
  });

  it('backup no tiene datos vacíos en tablas críticas', () => {
    const verificarCriticas = (datos: Record<string, any[]>) => {
      const criticas = ['alumnos', 'calificaciones'];
      return criticas.every(t => Array.isArray(datos[t]) && datos[t].length > 0);
    };
    expect(verificarCriticas({ alumnos: [{}], calificaciones: [{}] })).toBe(true);
    expect(verificarCriticas({ alumnos: [], calificaciones: [{}] })).toBe(false);
  });
});
