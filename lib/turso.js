import { createClient } from '@libsql/client';

let client = null;

function getClient() {
  if (!client) {
    const url = process.env.TURSO_CONNECTION_URL;
    const authToken = process.env.TURSO_AUTH_TOKEN;

    if (!url || !authToken) {
      throw new Error('Missing TURSO_CONNECTION_URL or TURSO_AUTH_TOKEN');
    }

    client = createClient({
      url,
      authToken,
    });
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
