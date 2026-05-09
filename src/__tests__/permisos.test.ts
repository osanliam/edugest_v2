import { describe, it, expect } from 'vitest';

// ── Lógica de acceso por rol (espejo de App.tsx canAccessScreen) ───────────
type UserRole = 'admin' | 'director' | 'subdirector' | 'teacher' | 'student' | 'parent';

const roleAccess: Record<UserRole, string[]> = {
  admin:       ['panel-admin', 'inicio', 'calificativos', 'gestionar-usuarios', 'gestion-docentes', 'auditoria', 'configuracion'],
  director:    ['inicio', 'panel-director', 'calificativos', 'gestion-docentes', 'gestion-alumnos', 'auditoria'],
  subdirector: ['inicio', 'panel-subdirector', 'calificativos', 'gestion-docentes', 'gestion-alumnos', 'auditoria'],
  teacher:     ['inicio', 'calificativos', 'asistencia', 'horario', 'gestion-alumnos'],
  student:     ['inicio', 'horario', 'asistencia', 'dashboard-estudiante'],
  parent:      ['inicio', 'reporte-alumno'],
};

function puedeAcceder(role: UserRole, screen: string): boolean {
  return roleAccess[role]?.includes(screen) ?? false;
}

// ─────────────────────────────────────────────────────────────────────────────

describe('Control de acceso por rol', () => {

  describe('admin', () => {
    it('puede acceder al panel-admin', () => {
      expect(puedeAcceder('admin', 'panel-admin')).toBe(true);
    });
    it('puede ver la auditoría', () => {
      expect(puedeAcceder('admin', 'auditoria')).toBe(true);
    });
    it('puede acceder a calificativos', () => {
      expect(puedeAcceder('admin', 'calificativos')).toBe(true);
    });
  });

  describe('director', () => {
    it('puede ver la auditoría', () => {
      expect(puedeAcceder('director', 'auditoria')).toBe(true);
    });
    it('NO puede acceder al panel-admin', () => {
      expect(puedeAcceder('director', 'panel-admin')).toBe(false);
    });
    it('puede acceder a calificativos', () => {
      expect(puedeAcceder('director', 'calificativos')).toBe(true);
    });
  });

  describe('subdirector', () => {
    it('puede ver la auditoría', () => {
      expect(puedeAcceder('subdirector', 'auditoria')).toBe(true);
    });
    it('puede acceder a calificativos', () => {
      expect(puedeAcceder('subdirector', 'calificativos')).toBe(true);
    });
  });

  describe('teacher (docente)', () => {
    it('puede acceder a sus calificativos', () => {
      expect(puedeAcceder('teacher', 'calificativos')).toBe(true);
    });
    it('puede ver asistencia', () => {
      expect(puedeAcceder('teacher', 'asistencia')).toBe(true);
    });
    it('NO puede ver la auditoría', () => {
      expect(puedeAcceder('teacher', 'auditoria')).toBe(false);
    });
    it('NO puede acceder al panel-admin', () => {
      expect(puedeAcceder('teacher', 'panel-admin')).toBe(false);
    });
  });

  describe('student', () => {
    it('puede ver su horario', () => {
      expect(puedeAcceder('student', 'horario')).toBe(true);
    });
    it('NO puede acceder a calificativos (solo lectura del docente)', () => {
      expect(puedeAcceder('student', 'calificativos')).toBe(false);
    });
    it('NO puede ver la auditoría', () => {
      expect(puedeAcceder('student', 'auditoria')).toBe(false);
    });
  });

  describe('parent (apoderado)', () => {
    it('puede ver el reporte del alumno', () => {
      expect(puedeAcceder('parent', 'reporte-alumno')).toBe(true);
    });
    it('NO puede acceder a calificativos', () => {
      expect(puedeAcceder('parent', 'calificativos')).toBe(false);
    });
    it('NO puede ver la auditoría', () => {
      expect(puedeAcceder('parent', 'auditoria')).toBe(false);
    });
  });
});

describe('Validaciones de datos de calificativo', () => {
  it('nota numérica debe estar entre 0 y 20', () => {
    const esValida = (n: number) => n >= 0 && n <= 20;
    expect(esValida(0)).toBe(true);
    expect(esValida(20)).toBe(true);
    expect(esValida(10.5)).toBe(true);
    expect(esValida(-1)).toBe(false);
    expect(esValida(21)).toBe(false);
  });

  it('calificativo solo puede ser C, B, A o AD', () => {
    const VALIDOS = ['C', 'B', 'A', 'AD'];
    const esValido = (c: string) => VALIDOS.includes(c);
    expect(esValido('A')).toBe(true);
    expect(esValido('AD')).toBe(true);
    expect(esValido('B')).toBe(true);
    expect(esValido('C')).toBe(true);
    expect(esValido('D')).toBe(false);
    expect(esValido('')).toBe(false);
    expect(esValido('ad')).toBe(false); // case-sensitive
  });

  it('ID de calificativo sigue el patrón cal-{alumnoId}-{columnaId}', () => {
    const generarId = (alumnoId: string, columnaId: string) => `cal-${alumnoId}-${columnaId}`;
    expect(generarId('alu123', 'col456')).toBe('cal-alu123-col456');
    // El mismo alumno y columna siempre producen el mismo ID (idempotente)
    expect(generarId('abc', 'xyz')).toBe(generarId('abc', 'xyz'));
  });

  it('marcados es un array de booleanos', () => {
    const validarMarcados = (m: unknown): m is boolean[] =>
      Array.isArray(m) && m.every(v => typeof v === 'boolean');
    expect(validarMarcados([true, false, true])).toBe(true);
    expect(validarMarcados([1, 0, 1])).toBe(false);
    expect(validarMarcados([])).toBe(true);
  });
});
