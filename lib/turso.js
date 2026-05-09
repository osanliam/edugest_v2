import { createClient } from '@libsql/client';

let client = null;
let configError = null;

export function getTursoConfigStatus() {
  const url = process.env.TURSO_CONNECTION_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;
  return {
    ok: !!url && !!authToken,
    url: url ? url.substring(0, 30) + '...' : null,
    tokenLength: authToken ? authToken.length : 0,
    missing: !url ? 'TURSO_CONNECTION_URL' : !authToken ? 'TURSO_AUTH_TOKEN' : null,
  };
}

function getClient() {
  if (configError) throw configError;
  if (!client) {
    const url = process.env.TURSO_CONNECTION_URL;
    const authToken = process.env.TURSO_AUTH_TOKEN;

    if (!url || !authToken) {
      configError = new Error('TURSO_NOT_CONFIGURED: Faltan TURSO_CONNECTION_URL o TURSO_AUTH_TOKEN');
      configError.code = 'TURSO_NOT_CONFIGURED';
      throw configError;
    }

    try {
      client = createClient({
        url,
        authToken,
      });
    } catch (e) {
      // Intentar con https:// si libsql:// falla
      if (url.startsWith('libsql://')) {
        try {
          client = createClient({
            url: url.replace('libsql://', 'https://'),
            authToken,
          });
        } catch (e2) {
          configError = new Error('TURSO_CONNECTION_ERROR: ' + e2.message);
          configError.code = 'TURSO_CONNECTION_ERROR';
          throw configError;
        }
      } else {
        configError = new Error('TURSO_CONNECTION_ERROR: ' + e.message);
        configError.code = 'TURSO_CONNECTION_ERROR';
        throw configError;
      }
    }
  }

  return client;
}

export async function initializeDatabase() {
  const client = getClient();

  // ── users (login) ────────────────────────────────────────────────
  await client.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id         TEXT PRIMARY KEY,
      nombre     TEXT NOT NULL,
      email      TEXT UNIQUE NOT NULL,
      contraseña TEXT NOT NULL,
      rol        TEXT NOT NULL,
      activo     INTEGER DEFAULT 1,
      docenteId  TEXT,
      creado     TEXT DEFAULT (datetime('now'))
    );
  `);
  // Agregar docenteId si la tabla ya existe sin esa columna
  try {
    await client.execute(`ALTER TABLE users ADD COLUMN docenteId TEXT`);
  } catch { /* ya existe, ignorar */ }
  // Agregar foto si no existe
  try {
    await client.execute(`ALTER TABLE users ADD COLUMN foto TEXT`);
  } catch { /* ya existe, ignorar */ }

  // ── docentes ─────────────────────────────────────────────────────
  await client.execute(`
    CREATE TABLE IF NOT EXISTS docentes (
      id                TEXT PRIMARY KEY,
      apellidos_nombres TEXT NOT NULL,
      dni               TEXT UNIQUE NOT NULL,
      genero            TEXT NOT NULL,
      fecha_nacimiento  TEXT NOT NULL,
      celular           TEXT,
      cargo             TEXT,
      email             TEXT,
      user_id           TEXT,
      creado            TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);
  // Agregar foto si no existe
  try {
    await client.execute(`ALTER TABLE docentes ADD COLUMN foto TEXT`);
  } catch { /* ya existe, ignorar */ }

  // ── apoderados (padre y madre) ───────────────────────────────────
  await client.execute(`
    CREATE TABLE IF NOT EXISTS apoderados (
      id                TEXT PRIMARY KEY,
      apellidos_nombres TEXT,
      dni               TEXT,
      celular           TEXT,
      parentesco        TEXT,
      creado            TEXT DEFAULT (datetime('now'))
    );
  `);

  // ── alumnos ──────────────────────────────────────────────────────
  await client.execute(`
    CREATE TABLE IF NOT EXISTS alumnos (
      id                TEXT PRIMARY KEY,
      apellidos_nombres TEXT,
      dni               TEXT,
      fecha_nacimiento  TEXT,
      edad              TEXT,
      sexo              TEXT,
      grado             TEXT,
      seccion           TEXT,
      madre_id          TEXT,
      padre_id          TEXT,
      user_id           TEXT,
      creado            TEXT DEFAULT (datetime('now'))
    );
  `);
  // Agregar columnas que puedan faltar en tablas ya existentes
  try { await client.execute(`ALTER TABLE alumnos ADD COLUMN madre_id TEXT`); } catch { /* ya existe */ }
  try { await client.execute(`ALTER TABLE alumnos ADD COLUMN padre_id TEXT`); } catch { /* ya existe */ }
  try { await client.execute(`ALTER TABLE alumnos ADD COLUMN user_id TEXT`);  } catch { /* ya existe */ }
  try { await client.execute(`ALTER TABLE alumnos ADD COLUMN foto TEXT`);  } catch { /* ya existe */ }

  // Eliminar UNIQUE indexes que bloquean importación masiva (DNIs vacíos o padres con 2+ hijos)
  try { await client.execute(`DROP INDEX IF EXISTS idx_alumnos_dni`); } catch { /* ignorar */ }
  try { await client.execute(`DROP INDEX IF EXISTS idx_apoderados_dni_parentesco`); } catch { /* ignorar */ }

  // ── grades ───────────────────────────────────────────────────────
  await client.execute(`
    CREATE TABLE IF NOT EXISTS grades (
      id         TEXT PRIMARY KEY,
      student_id TEXT NOT NULL,
      teacher_id TEXT NOT NULL,
      subject    TEXT NOT NULL,
      competence TEXT NOT NULL,
      instrument TEXT NOT NULL,
      score      REAL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (student_id) REFERENCES users(id),
      FOREIGN KEY (teacher_id) REFERENCES users(id)
    );
  `);

  // ── attendance ───────────────────────────────────────────────────
  await client.execute(`
    CREATE TABLE IF NOT EXISTS attendance (
      id         TEXT PRIMARY KEY,
      student_id TEXT NOT NULL,
      teacher_id TEXT NOT NULL,
      date       TEXT NOT NULL,
      status     TEXT DEFAULT 'present',
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (student_id) REFERENCES users(id),
      FOREIGN KEY (teacher_id) REFERENCES users(id)
    );
  `);

  // ── cursos ───────────────────────────────────────────────────────
  await client.execute(`
    CREATE TABLE IF NOT EXISTS cursos (
      id     TEXT PRIMARY KEY,
      nombre TEXT NOT NULL,
      color  TEXT,
      creado TEXT DEFAULT (datetime('now'))
    );
  `);

  // ── unidades (bimestres) ─────────────────────────────────────────
  await client.execute(`
    CREATE TABLE IF NOT EXISTS unidades (
      id     TEXT PRIMARY KEY,
      nombre TEXT,
      activa INTEGER DEFAULT 1,
      creado TEXT DEFAULT (datetime('now'))
    );
  `);

  // ── columnas (instrumentos de evaluación) ──────────────────────────
  await client.execute(`
    CREATE TABLE IF NOT EXISTS columnas (
      id           TEXT PRIMARY KEY,
      nombre       TEXT,
      tipo         TEXT,
      totalItems   INTEGER,
      competenciaId TEXT,
      bimestreId   TEXT,
      promediar    INTEGER DEFAULT 0,
      itemsExamen  TEXT,
      items        TEXT,
      columnasEval TEXT,
      creatorId    TEXT
    );
  `);

  // ── calificaciones ───────────────────────────────────────────────
  await client.execute(`
    CREATE TABLE IF NOT EXISTS calificaciones (
      id            TEXT PRIMARY KEY,
      alumnoId      TEXT,
      columnaId     TEXT,
      marcados      TEXT,
      claves        TEXT,
      notaNumerica  REAL,
      calificativo  TEXT,
      esAD          INTEGER DEFAULT 0,
      fecha         TEXT,
      docenteId     TEXT,
      updated_at    DATETIME
    );
  `);
  try { await client.execute(`ALTER TABLE calificaciones ADD COLUMN docenteId TEXT`);    } catch { /* ya existe */ }
  try { await client.execute(`ALTER TABLE calificaciones ADD COLUMN updated_at DATETIME`); } catch { /* ya existe */ }

  // ── historial_calificaciones ─────────────────────────────────────
  await client.execute(`
    CREATE TABLE IF NOT EXISTS historial_calificaciones (
      id              TEXT PRIMARY KEY,
      calificacion_id TEXT NOT NULL,
      docenteId       TEXT,
      alumnoId        TEXT,
      columnaId       TEXT,
      datos_anteriores TEXT,
      datos_nuevos     TEXT,
      timestamp       DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // ── normas_convivencia ───────────────────────────────────────────
  await client.execute(`
    CREATE TABLE IF NOT EXISTS normas_convivencia (
      id        TEXT PRIMARY KEY,
      categoria TEXT,
      descripcion TEXT,
      puntos    INTEGER DEFAULT 0
    );
  `);

  // ── registros_normas ─────────────────────────────────────────────
  await client.execute(`
    CREATE TABLE IF NOT EXISTS registros_normas (
      id            TEXT PRIMARY KEY,
      alumnoId      TEXT,
      conductaId    TEXT,
      ejeId         TEXT,
      fecha         TEXT,
      cumplimiento  TEXT,
      puntos        INTEGER DEFAULT 0,
      observacion   TEXT,
      registradoPor TEXT
    );
  `);

  // ── asignaciones ─────────────────────────────────────────────────
  await client.execute(`
    CREATE TABLE IF NOT EXISTS asignaciones (
      id        TEXT PRIMARY KEY,
      docenteId TEXT,
      grados    TEXT,
      secciones TEXT,
      cursos    TEXT,
      extra     TEXT
    );
  `);

  // ── auditoria ────────────────────────────────────────────────────
  await client.execute(`
    CREATE TABLE IF NOT EXISTS auditoria (
      id        TEXT PRIMARY KEY,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      usuario_id TEXT,
      accion    TEXT,
      tabla     TEXT,
      registro_id TEXT,
      datos     TEXT,
      ip        TEXT
    );
  `);

  // ── asistencia ───────────────────────────────────────────────────
  await client.execute(`
    CREATE TABLE IF NOT EXISTS asistencia (
      id        TEXT PRIMARY KEY,
      alumnoId  TEXT,
      fecha     TEXT,
      estado    TEXT,
      modo      TEXT,
      hora      TEXT,
      docenteId TEXT
    );
  `);

  // ── configuraciones generales (competencias, años, instrumentos, etc.) ──
  await client.execute(`
    CREATE TABLE IF NOT EXISTS configuraciones (
      clave  TEXT PRIMARY KEY,
      valor  TEXT NOT NULL
    );
  `);

  // ── aulas (aulas virtuales) ──────────────────────────────────────
  await client.execute(`
    CREATE TABLE IF NOT EXISTS aulas (
      id           TEXT PRIMARY KEY,
      nombre       TEXT NOT NULL,
      descripcion  TEXT,
      docenteId    TEXT,
      grado        TEXT,
      seccion      TEXT,
      curso        TEXT,
      imagen       TEXT,
      estado       TEXT DEFAULT 'activa',
      creado       TEXT DEFAULT (datetime('now')),
      actualizado  TEXT DEFAULT (datetime('now'))
    );
  `);
  try { await client.execute(`ALTER TABLE aulas ADD COLUMN actualizado TEXT DEFAULT (datetime('now'))`); } catch { /* ya existe */ }

  // ── materiales (recursos del aula: videos, docs, enlaces, tareas, archivos) ──
  await client.execute(`
    CREATE TABLE IF NOT EXISTS materiales (
      id           TEXT PRIMARY KEY,
      aulaId       TEXT NOT NULL,
      tipo         TEXT NOT NULL,
      titulo       TEXT NOT NULL,
      descripcion  TEXT,
      contenido    TEXT,
      url          TEXT,
      nombreArchivo TEXT,
      tipoArchivo  TEXT,
      pesoArchivo  INTEGER DEFAULT 0,
      fechaEntrega TEXT,
      creadoPor    TEXT,
      creado       TEXT DEFAULT (datetime('now')),
      actualizado  TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (aulaId) REFERENCES aulas(id)
    );
  `);
  try { await client.execute(`ALTER TABLE materiales ADD COLUMN actualizado TEXT DEFAULT (datetime('now'))`); } catch { /* ya existe */ }

  // ── entregas (entregas de estudiantes para tareas) ────────────────
  await client.execute(`
    CREATE TABLE IF NOT EXISTS entregas (
      id            TEXT PRIMARY KEY,
      materialId    TEXT NOT NULL,
      alumnoId      TEXT NOT NULL,
      aulaId        TEXT NOT NULL,
      contenido     TEXT,
      nombreArchivo TEXT,
      tipoArchivo   TEXT,
      pesoArchivo   INTEGER DEFAULT 0,
      nota          REAL,
      comentarioDoc TEXT,
      estado        TEXT DEFAULT 'pendiente',
      creado        TEXT DEFAULT (datetime('now')),
      actualizado   TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (materialId) REFERENCES materiales(id),
      FOREIGN KEY (aulaId) REFERENCES aulas(id)
    );
  `);
  try { await client.execute(`ALTER TABLE entregas ADD COLUMN comentarioDoc TEXT`); } catch { /* ya existe */ }
  try { await client.execute(`ALTER TABLE entregas ADD COLUMN actualizado TEXT DEFAULT (datetime('now'))`); } catch { /* ya existe */ }

  // ── comentarios (en materiales del aula) ──────────────────────────
  await client.execute(`
    CREATE TABLE IF NOT EXISTS comentarios (
      id         TEXT PRIMARY KEY,
      materialId TEXT NOT NULL,
      aulaId     TEXT NOT NULL,
      userId     TEXT,
      userName   TEXT,
      contenido  TEXT NOT NULL,
      creado     TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (materialId) REFERENCES materiales(id),
      FOREIGN KEY (aulaId) REFERENCES aulas(id)
    );
  `);

  return client;
}

export function getDatabase() {
  return getClient();
}

export async function query(sql, params = []) {
  const client = getClient();
  const result = await client.execute({
    sql,
    args: params,
  });
  return result;
}

export async function execute(sql, params = []) {
  const client = getClient();
  return await client.execute({
    sql,
    args: params,
  });
}
