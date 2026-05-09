import { createClient } from '@libsql/client';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'sistemita-secreto-2026-muy-seguro';

function verifyToken(authHeader) {
  const token = authHeader?.split(' ')[1];
  if (!token) throw new Error('Token requerido');
  try { return jwt.verify(token, JWT_SECRET); } catch { throw new Error('Token inválido'); }
}

function cors(res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

let db = null;
let tablesReady = false;

function getDB() {
  if (!db) {
    const url = process.env.TURSO_CONNECTION_URL;
    const authToken = process.env.TURSO_AUTH_TOKEN;
    if (!url || !authToken) return null;
    db = createClient({ url, authToken });
  }
  return db;
}

async function ensureTables(c) {
  if (tablesReady) return;
  await c.execute(`CREATE TABLE IF NOT EXISTS docentes (
    id TEXT PRIMARY KEY,
    apellidos_nombres TEXT,
    dni TEXT UNIQUE,
    genero TEXT,
    fecha_nacimiento TEXT,
    celular TEXT,
    cargo TEXT,
    email TEXT,
    user_id TEXT,
    foto TEXT
  )`);
  await c.execute(`CREATE TABLE IF NOT EXISTS calificaciones (
    id TEXT PRIMARY KEY,
    alumnoId TEXT NOT NULL,
    columnaId TEXT NOT NULL,
    marcados TEXT,
    claves TEXT,
    notaNumerica REAL,
    calificativo TEXT,
    esAD INTEGER DEFAULT 0,
    fecha TEXT,
    docenteId TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  await c.execute(`CREATE TABLE IF NOT EXISTS historial_calificaciones (
    id TEXT PRIMARY KEY,
    calificacion_id TEXT NOT NULL,
    docenteId TEXT,
    alumnoId TEXT,
    columnaId TEXT,
    datos_anteriores TEXT,
    datos_nuevos TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  await c.execute(`CREATE TABLE IF NOT EXISTS auditoria (
    id TEXT PRIMARY KEY,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    usuario_id TEXT,
    accion TEXT,
    tabla TEXT,
    registro_id TEXT,
    cambios TEXT,
    ip TEXT
  )`);
  await c.execute(`CREATE TABLE IF NOT EXISTS rubrica_evaluaciones (
    id TEXT PRIMARY KEY,
    alumnoId TEXT,
    docenteId TEXT,
    rubrica_id TEXT,
    respuestas TEXT,
    calificativo TEXT,
    fecha TEXT
  )`);
  tablesReady = true;
}

const RUBRICA = {
  id: 'rubrica-logro-AD-6p',
  nombre: 'Rúbrica de Logro Esperado y Desempeño AD',
  descripcion: 'Instrumento de evaluación con 6 preguntas: 4 de logro esperado y 2 preguntas adicionales para alcanzar AD (logro máximo).',
  preguntas: [
    { id: 'q1', texto: 'Logro esperado 1: House of quality? (elige la opción correcta)', opciones: ['Opción A', 'Opción B', 'Opción C'], respuesta: 0 },
    { id: 'q2', texto: 'Logro esperado 2: Evalúa conceptos clave. (elige la opción correcta)', opciones: ['Opción A', 'Opción B', 'Opción C'], respuesta: 1 },
    { id: 'q3', texto: 'Logro esperado 3: Aplica la regla en un caso práctico. (elige la opción correcta)', opciones: ['Opción A', 'Opción B', 'Opción C'], respuesta: 2 },
    { id: 'q4', texto: 'Logro esperado 4: Interpretación de un enunciado. (elige la opción correcta)', opciones: ['Opción A', 'Opción B', 'Opción C'], respuesta: 0 },
    { id: 'q5', texto: 'Pregunta adicional 1: Resuelve el desafío para AD. (elige la opción correcta)', opciones: ['Opción A', 'Opción B', 'Opción C'], respuesta: 1 },
    { id: 'q6', texto: 'Pregunta adicional 2: Responde para avanzar hacia AD. (elige la opción correcta)', opciones: ['Opción A', 'Opción B', 'Opción C'], respuesta: 2 }
  ]
};

function evaluarRubrica(respuestas) {
  const r = Array.isArray(respuestas) ? respuestas.map(v => Number(v)) : [];
  if (r.length !== RUBRICA.preguntas.length) {
    throw new Error('Se requieren 6 respuestas (q1..q6)');
  }
  const correct = RUBRICA.preguntas.map((p, idx) => r[idx] === p.respuesta);
  const mainCorrect = correct.slice(0, 4).filter(Boolean).length;
  const extraCorrectCount = (correct[4] ? 1 : 0) + (correct[5] ? 1 : 0);
  const allCorrect = correct.every(Boolean);
  if (allCorrect) return { calificativo: 'AD', detalles: { correct, mainCorrect, extraCorrectCount } };
  const mainAll = correct.slice(0, 4).every(Boolean);
  if (mainAll) return { calificativo: 'A', detalles: { correct, mainCorrect, extraCorrectCount } };
  if (extraCorrectCount === 2 && mainCorrect >= 3) return { calificativo: 'AD', detalles: { correct, mainCorrect, extraCorrectCount } };
  const totalCorrect = correct.filter(Boolean).length;
  if (totalCorrect >= 3) return { calificativo: 'B', detalles: { correct, mainCorrect, extraCorrectCount } };
  return { calificativo: 'C', detalles: { correct, mainCorrect, extraCorrectCount } };
}

// Handlers para router interno
async function handleDocentesGET(c) {
  const r = await c.execute({ sql: 'SELECT * FROM docentes ORDER BY apellidos_nombres ASC' });
  return r.rows || [];
}
async function handleAsignacionesGET(c) {
  const r = await c.execute(`SELECT d.*,
                                  u.id AS usuario_id,
                                  u.nombre AS usuario_nombre,
                                  u.email AS usuario_email,
                                  u.rol AS usuario_rol,
                                  u.activo AS usuario_activo
                               FROM docentes d
                               LEFT JOIN users u ON d.user_id = u.id
                               ORDER BY d.apellidos_nombres ASC`);
  return r.rows || [];
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const c = getDB();
  if (!c) return res.status(503).json({ error: 'Base de datos no configurada' });
  try { await ensureTables(c); } catch (e) { return res.status(500).json({ error: 'Error inicializando tablas: ' + e.message }); }

  let usuario;
  try { usuario = verifyToken(req.headers.authorization); } catch {
    return res.status(401).json({ error: 'Token requerido' });
  }
  const userId = usuario?.id || usuario?.docenteId || 'anonymous';
  const userRole = usuario?.role || '';
  const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';

  // Auditoría simple
  async function auditar(accion, tabla, registro_id, cambios) {
    await c.execute({ sql: `INSERT INTO auditoria (id, timestamp, usuario_id, accion, tabla, registro_id, cambios, ip) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, args: [`aud-${Date.now()}-${Math.random().toString(36).slice(2,7)}`, new Date().toISOString(), userId, accion, tabla, registro_id, typeof cambios === 'string' ? cambios : JSON.stringify(cambios), ip] }).catch(() => {});
  }

  // Compat: route using path parameter or original path
  const u = new URL(req.url, `http://${req.headers.host}`);
  let endpoint = u.pathname;
  if (u.searchParams.has('path')) endpoint = '/' + u.searchParams.get('path');
  if (endpoint.startsWith('/docentes')) {
    if (req.method === 'GET') {
      const rows = await handleDocentesGET(c);
      return res.status(200).json(rows);
    }
    if (req.method === 'POST') {
      const { apellidos_nombres, dni, genero, fecha_nacimiento, celular, cargo, email, user_id, foto } = req.body;
      if (!apellidos_nombres || !dni || !genero || !fecha_nacimiento) {
        return res.status(400).json({ error: 'Faltan campos obligatorios' });
      }
      const id = `doc-${crypto.randomUUID()}`;
      await c.execute(`INSERT INTO docentes (id, apellidos_nombres, dni, genero, fecha_nacimiento, celular, cargo, email, user_id, foto) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [id, apellidos_nombres, dni, genero, fecha_nacimiento, celular || '', cargo || '', email || '', user_id || null, foto || null]);
      return res.status(201).json({ ok: true, id });
    }
    if (req.method === 'PUT') {
      const { id } = req.query;
      const { apellidos_nombres, dni, genero, fecha_nacimiento, celular, cargo, email, foto } = req.body;
      if (!id) return res.status(400).json({ error: 'ID requerido' });
      await c.execute(`UPDATE docentes SET apellidos_nombres=?, dni=?, genero=?, fecha_nacimiento=?, celular=?, cargo=?, email=?, foto=? WHERE id=?`, [apellidos_nombres, dni, genero, fecha_nacimiento, celular || '', cargo || '', email || '', foto || null, id]);
      return res.status(200).json({ ok: true });
    }
    if (req.method === 'DELETE') {
      const { id } = req.query;
      if (!id) return res.status(400).json({ error: 'ID requerido' });
      await c.execute('DELETE FROM docentes WHERE id = ?', [id]);
      return res.status(200).json({ ok: true });
    }
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (endpoint.startsWith('/calificaciones')) {
    if (req.method === 'GET') {
      try {
        const { alumnoId, columnaId, desde, page, limit } = req.query || {};
        let sql = 'SELECT * FROM calificaciones';
        const args = [];
        const cond = [];
        if (alumnoId) { cond.push('alumnoId = ?'); args.push(alumnoId); }
        if (columnaId) { cond.push('columnaId = ?'); args.push(columnaId); }
        if (desde) { cond.push('updated_at > ?'); args.push(desde); }
        if (cond.length) sql += ' WHERE ' + cond.join(' AND ');
        sql += ' ORDER BY alumnoId, columnaId';
        const p = parseInt(page || '0');
        const l = parseInt(limit || '0');
        if (l > 0) sql += ` LIMIT ${l} OFFSET ${p * l}`;
        const r = await c.execute({ sql, args });
        const calificaciones = (r.rows || []).map(row => ({ ...row, marcados: Array.isArray(row.marcados) ? row.marcados : (row.marcados ? JSON.parse(row.marcados) : []), claves: Array.isArray(row.claves) ? row.claves : (row.claves ? JSON.parse(row.claves) : []), esAD: row.esAD === 1 || row.esAD === true }));
        return res.json({ ok: true, calificaciones });
      } catch (e) {
        return res.status(500).json({ error: e.message });
      }
    }
    if (req.method === 'POST') {
      const cal = req.body;
      if (!cal.alumnoId || !cal.columnaId) return res.status(400).json({ error: 'Falta alumnoId o columnaId' });
      const id = cal.id || `cal-${cal.alumnoId}-${cal.columnaId}`;
      let marcadosFinales = cal.marcados || [];
      let accion = 'crear';
      let datosAnteriores = null;
      // Lectura existente
      try {
        const existente = await c.execute({ sql: 'SELECT id, docenteId, marcados, calificativo, esAD FROM calificaciones WHERE id = ?', args: [id] });
        const reg = existente.rows?.[0];
        if (reg) {
          accion = 'editar';
          datosAnteriores = { marcados: reg.marcados, calificativo: reg.calificativo, esAD: reg.esAD, docenteId: reg.docenteId };
        }
      } catch {}
      const ahora = new Date().toISOString();
      // Persistencia simple
      try {
        await c.execute({ sql: `INSERT OR REPLACE INTO calificaciones (id, alumnoId, columnaId, marcados, claves, notaNumerica, calificativo, esAD, fecha, docenteId, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, args: [id, cal.alumnoId, cal.columnaId, JSON.stringify(marcadosFinales), JSON.stringify(cal.claves || []), cal.notaNumerica ?? null, cal.calificativo || '', cal.esAD ? 1 : 0, cal.fecha || ahora, userId, ahora] });
        await auditar(accion, 'calificaciones', id, { alumnoId: cal.alumnoId, columnaId: cal.columnaId, calificativo: cal.calificativo, docenteId: userId });
        return res.json({ ok: true, id, accion });
      } catch (e) {
        return res.status(500).json({ error: e.message });
      }
    }
    if (req.method === 'PUT') {
      const { id } = req.query || {};
      if (!id) return res.status(400).json({ error: 'Falta id' });
      const body = req.body;
      const ahora = new Date().toISOString();
      try {
        await c.execute({ sql: `UPDATE calificaciones SET marcados = ?, claves = ?, notaNumerica = ?, calificativo = ?, esAD = ?, fecha = ?, docenteId = ?, updated_at = ? WHERE id = ?`, args: [JSON.stringify(body.marcados || []), JSON.stringify(body.claves || []), body.notaNumerica ?? null, body.calificativo || '', body.esAD ? 1 : 0, body.fecha || ahora, userId, ahora, id] });
        await auditar('editar', 'calificaciones', id, { docenteId: userId, cambios: body });
        return res.json({ ok: true, id, accion: 'editar' });
      } catch (e) {
        return res.status(500).json({ error: e.message });
      }
    }
    if (req.method === 'DELETE') {
      const { id } = req.query || {};
      if (!id) return res.status(400).json({ error: 'Falta id' });
      try {
        await c.execute({ sql: 'DELETE FROM calificaciones WHERE id = ?', args: [id] });
        await auditar('eliminar', 'calificaciones', id, {});
        return res.json({ ok: true, id });
      } catch (e) { return res.status(500).json({ error: e.message }); }
    }
    return res.status(405).json({ error: 'Método no permitido' });
  }

  if (endpoint.startsWith('/configuracion/rubrica')) {
    if (req.method === 'GET') {
      return res.status(200).json(RUBRICA);
    }
    if (req.method === 'POST') {
      const { respuestas, alumnoId } = req.body || {};
      if (!alumnoId) return res.status(400).json({ error: 'alumnoId es requerido' });
      const respuestasArr = Array.isArray(respuestas) ? respuestas : [];
      const result = evaluarRubrica(respuestasArr);
      const cdb = getDB();
      if (cdb) {
        try { await ensureTables(cdb); } catch { /* ignore */ }
        const idEval = `rub-eval-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
        const ahora = new Date().toISOString();
        const docenteId = userId;
        await cdb.execute({ sql: `INSERT INTO rubrica_evaluaciones (id, alumnoId, docenteId, rubrica_id, respuestas, calificativo, fecha) VALUES (?, ?, ?, ?, ?, ?, ?)`, args: [idEval, alumnoId, docenteId, RUBRICA.id, JSON.stringify(respuestasArr), result.calificativo, ahora] }).catch(() => {});
        return res.status(200).json({ ok: true, id: idEval, calificativo: result.calificativo, detalles: result.detalles, rubrica: RUBRICA });
      }
      return res.status(200).json({ ok: true, calificativo: result.calificativo, detalles: result.detalles, rubrica: RUBRICA });
    }
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (endpoint.startsWith('/configuracion/asignaciones')) {
    if (req.method === 'GET') {
      const rows = await handleAsignacionesGET(c);
      return res.status(200).json(rows);
    }
    return res.status(405).json({ error: 'Method not allowed' });
  }

  res.status(404).json({ error: 'Endpoint no encontrado' });
}
