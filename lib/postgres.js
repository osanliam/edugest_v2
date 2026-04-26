// lib/postgres.js — Conexión a Cloud SQL PostgreSQL
import { Pool } from 'pg';

// Usar socket Unix para Cloud Run (recomendado) o IP pública para desarrollo
const isCloudRun = process.env.K_SERVICE !== undefined;

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: isCloudRun ? `/cloudsql/${process.env.CLOUD_SQL_CONNECTION_NAME}` : (process.env.DB_HOST || '34.28.208.182'),
  database: process.env.DB_NAME || 'edugest',
  password: process.env.DB_PASSWORD || '',
  port: isCloudRun ? undefined : (parseInt(process.env.DB_PORT || '5432')),
  // Para Cloud Run con socket Unix
  ...(isCloudRun && { host: `/cloudsql/${process.env.CLOUD_SQL_CONNECTION_NAME}` }),
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export async function query(sql, params = []) {
  const client = await pool.connect();
  try {
    const result = await client.query(sql, params);
    return { rows: result.rows };
  } finally {
    client.release();
  }
}

export async function execute(sql, params = []) {
  const client = await pool.connect();
  try {
    await client.query(sql, params);
  } finally {
    client.release();
  }
}

export async function initializeDatabase() {
  // Tablas del sistema
  const tables = [
    `CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      nombre TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      contraseña TEXT NOT NULL,
      rol TEXT NOT NULL,
      activo INTEGER DEFAULT 1,
      docenteId TEXT,
      creado TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS docentes (
      id TEXT PRIMARY KEY,
      apellidos_nombres TEXT NOT NULL,
      dni TEXT UNIQUE NOT NULL,
      genero TEXT,
      fecha_nacimiento TEXT,
      celular TEXT,
      cargo TEXT,
      email TEXT,
      user_id TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS apoderados (
      id TEXT PRIMARY KEY,
      apellidos_nombres TEXT,
      dni TEXT UNIQUE,
      celular TEXT,
      parentesco TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS alumnos (
      id TEXT PRIMARY KEY,
      apellidos_nombres TEXT NOT NULL,
      nombre TEXT,
      dni TEXT UNIQUE NOT NULL,
      fecha_nacimiento TEXT,
      edad TEXT,
      sexo TEXT,
      grado TEXT NOT NULL,
      seccion TEXT NOT NULL,
      telefono TEXT,
      direccion TEXT,
      email TEXT,
      extra TEXT,
      madre_id TEXT,
      padre_id TEXT,
      user_id TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS columnas (
      id TEXT PRIMARY KEY,
      nombre TEXT,
      tipo TEXT,
      totalItems INTEGER,
      competenciaId TEXT,
      bimestreId TEXT,
      promediar INTEGER DEFAULT 0,
      itemsExamen TEXT,
      items TEXT,
      columnasEval TEXT,
      creatorId TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS calificaciones (
      id TEXT PRIMARY KEY,
      alumnoId TEXT,
      columnaId TEXT,
      marcados TEXT,
      claves TEXT,
      notaNumerica REAL,
      calificativo TEXT,
      esAD INTEGER DEFAULT 0,
      fecha TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS asistencia (
      id TEXT PRIMARY KEY,
      alumnoId TEXT,
      fecha TEXT,
      estado TEXT,
      modo TEXT,
      hora TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS unidades (
      id TEXT PRIMARY KEY,
      numero INTEGER,
      nombre TEXT,
      bimestreId TEXT,
      activa INTEGER DEFAULT 1
    )`,
    `CREATE TABLE IF NOT EXISTS asignaciones (
      id TEXT PRIMARY KEY,
      docenteId TEXT,
      grados TEXT,
      secciones TEXT,
      cursos TEXT,
      extra TEXT
    )`,
  ];

  for (const sql of tables) {
    await execute(sql);
  }

  // Columnas adicionales si faltan
  try { await execute(`ALTER TABLE alumnos ADD COLUMN IF NOT EXISTS madre_id TEXT`); } catch (_) {}
  try { await execute(`ALTER TABLE alumnos ADD COLUMN IF NOT EXISTS padre_id TEXT`); } catch (_) {}
  try { await execute(`ALTER TABLE alumnos ADD COLUMN IF NOT EXISTS user_id TEXT`); } catch (_) {}
  try { await execute(`ALTER TABLE users ADD COLUMN IF NOT EXISTS docenteId TEXT`); } catch (_) {}

  return pool;
}

export function getDatabase() {
  return pool;
}

export default pool;