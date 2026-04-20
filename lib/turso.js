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

  // Crear tablas si no existen
  await client.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      nombre TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      contraseña TEXT NOT NULL,
      rol TEXT NOT NULL,
      activo BOOLEAN DEFAULT 1,
      creado DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS grades (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL,
      teacher_id TEXT NOT NULL,
      subject TEXT NOT NULL,
      competence TEXT NOT NULL,
      instrument TEXT NOT NULL,
      score REAL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES users(id),
      FOREIGN KEY (teacher_id) REFERENCES users(id)
    );
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS attendance (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL,
      teacher_id TEXT NOT NULL,
      date DATE NOT NULL,
      status TEXT DEFAULT 'present',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
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
