import { createClient } from '@libsql/client';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'sistemita-secreto-2026-muy-seguro';

function parseJWT(req) {
  try {
    const auth = req.headers?.authorization || '';
    if (!auth.startsWith('Bearer ')) return null;
    return jwt.verify(auth.slice(7), JWT_SECRET);
  } catch { return null; }
}

let client = null;
let tablesReady = false;

function getClient() {
  if (!client) {
    const url = process.env.TURSO_CONNECTION_URL;
    const authToken = process.env.TURSO_AUTH_TOKEN;
    if (!url || !authToken) return null;
    client = createClient({ url, authToken });
  }
  return client;
}

async function ensureTables(c) {
  if (tablesReady) return;
  const stmts = [
    `CREATE TABLE IF NOT EXISTS aulas (
      id TEXT PRIMARY KEY, nombre TEXT NOT NULL, descripcion TEXT,
      docenteId TEXT, grado TEXT, seccion TEXT, curso TEXT,
      imagen TEXT, estado TEXT DEFAULT 'activa',
      creado DATETIME DEFAULT CURRENT_TIMESTAMP,
      actualizado DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS materiales (
      id TEXT PRIMARY KEY, aulaId TEXT NOT NULL, tipo TEXT NOT NULL,
      titulo TEXT NOT NULL, descripcion TEXT, contenido TEXT, url TEXT,
      nombreArchivo TEXT, tipoArchivo TEXT, pesoArchivo INTEGER DEFAULT 0,
      fechaEntrega TEXT, creadoPor TEXT,
      creado DATETIME DEFAULT CURRENT_TIMESTAMP,
      actualizado DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS entregas (
      id TEXT PRIMARY KEY, materialId TEXT NOT NULL, alumnoId TEXT NOT NULL,
      aulaId TEXT NOT NULL, contenido TEXT, nombreArchivo TEXT,
      tipoArchivo TEXT, pesoArchivo INTEGER DEFAULT 0,
      nota REAL, comentarioDoc TEXT, estado TEXT DEFAULT 'pendiente',
      creado DATETIME DEFAULT CURRENT_TIMESTAMP,
      actualizado DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS comentarios (
      id TEXT PRIMARY KEY, materialId TEXT NOT NULL, aulaId TEXT NOT NULL,
      userId TEXT, userName TEXT, contenido TEXT NOT NULL,
      creado DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
  ];
  for (const sql of stmts) {
    try { await c.execute(sql); } catch (_) {}
  }
  const alterSafe = async (sql) => { try { await c.execute(sql); } catch (_) {} };
  await alterSafe(`CREATE INDEX IF NOT EXISTS idx_materiales_aula ON materiales(aulaId)`);
  await alterSafe(`CREATE INDEX IF NOT EXISTS idx_entregas_material ON entregas(materialId)`);
  await alterSafe(`CREATE INDEX IF NOT EXISTS idx_entregas_alumno ON entregas(alumnoId)`);
  await alterSafe(`CREATE INDEX IF NOT EXISTS idx_comentarios_material ON comentarios(materialId)`);
  tablesReady = true;
}

export default async function handler(req, res) {
  const c = getClient();
  if (!c) return res.status(503).json({ error: 'Base de datos no configurada' });

  try { await ensureTables(c); } catch (e) {
    return res.status(500).json({ error: 'Error inicializando tablas: ' + e.message });
  }

  const usuario = parseJWT(req);
  const userId = usuario?.id || usuario?.docenteId || 'anonymous';

  // ── GET: fetch aula virtual data ──────────────────────────────────────
  if (req.method === 'GET') {
    const accion = req.query?.accion;

    // Listar aulas
    if (!accion || accion === 'aulas') {
      try {
        const r = await c.execute('SELECT * FROM aulas ORDER BY creado DESC');
        return res.json({ ok: true, aulas: r.rows || [] });
      } catch (e) {
        return res.status(500).json({ error: e.message });
      }
    }

    // Materiales de un aula
    if (accion === 'materiales') {
      const aulaId = req.query?.aulaId;
      if (!aulaId) return res.status(400).json({ error: 'Falta aulaId' });
      try {
        const r = await c.execute({ sql: 'SELECT * FROM materiales WHERE aulaId = ? ORDER BY creado DESC', args: [aulaId] });
        return res.json({ ok: true, materiales: r.rows || [] });
      } catch (e) {
        return res.status(500).json({ error: e.message });
      }
    }

    // Entregas de un material
    if (accion === 'entregas') {
      const materialId = req.query?.materialId;
      const aulaId = req.query?.aulaId;
      try {
        let sql = 'SELECT * FROM entregas WHERE 1=1';
        const args = [];
        if (materialId) { sql += ' AND materialId = ?'; args.push(materialId); }
        if (aulaId) { sql += ' AND aulaId = ?'; args.push(aulaId); }
        sql += ' ORDER BY creado DESC';
        const r = await c.execute({ sql, args });
        return res.json({ ok: true, entregas: r.rows || [] });
      } catch (e) {
        return res.status(500).json({ error: e.message });
      }
    }

    // Comentarios de un material
    if (accion === 'comentarios') {
      const materialId = req.query?.materialId;
      if (!materialId) return res.status(400).json({ error: 'Falta materialId' });
      try {
        const r = await c.execute({ sql: 'SELECT * FROM comentarios WHERE materialId = ? ORDER BY creado ASC', args: [materialId] });
        return res.json({ ok: true, comentarios: r.rows || [] });
      } catch (e) {
        return res.status(500).json({ error: e.message });
      }
    }

    // Estadísticas del aula
    if (accion === 'stats') {
      const aulaId = req.query?.aulaId;
      if (!aulaId) return res.status(400).json({ error: 'Falta aulaId' });
      try {
        const matCount = await c.execute({ sql: 'SELECT COUNT(*) as n FROM materiales WHERE aulaId = ?', args: [aulaId] });
        const entCount = await c.execute({ sql: 'SELECT COUNT(*) as n FROM entregas WHERE aulaId = ?', args: [aulaId] });
        const comCount = await c.execute({ sql: 'SELECT COUNT(*) as n FROM comentarios WHERE aulaId = ?', args: [aulaId] });
        const tareas = await c.execute({ sql: "SELECT id, titulo, fechaEntrega FROM materiales WHERE aulaId = ? AND tipo = 'tarea' ORDER BY fechaEntrega ASC", args: [aulaId] });
        return res.json({
          ok: true,
          stats: {
            materiales: Number(matCount.rows?.[0]?.n ?? 0),
            entregas: Number(entCount.rows?.[0]?.n ?? 0),
            comentarios: Number(comCount.rows?.[0]?.n ?? 0),
            tareas: tareas.rows || []
          }
        });
      } catch (e) {
        return res.status(500).json({ error: e.message });
      }
    }

    return res.status(400).json({ error: 'Acción no reconocida' });
  }

  // ── POST: create/update ───────────────────────────────────────────────
  if (req.method === 'POST') {
    const { tipo, datos } = req.body;
    if (!tipo || !datos) return res.status(400).json({ error: 'Falta tipo o datos' });

    const safeExec = async (sql, args) => {
      try { await c.execute({ sql, args }); return null; }
      catch (e) { return e.message; }
    };

    if (tipo === 'aula') {
      const a = Array.isArray(datos) ? datos[0] : datos;
      const e = await safeExec(
        `INSERT OR REPLACE INTO aulas (id, nombre, descripcion, docenteId, grado, seccion, curso, imagen, estado, creado, actualizado)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [a.id, a.nombre || '', a.descripcion || '', a.docenteId || '', a.grado || '', a.seccion || '', a.curso || '', a.imagen || '', a.estado || 'activa', a.creado || new Date().toISOString(), new Date().toISOString()]
      );
      if (e) return res.status(500).json({ error: e });
      return res.json({ ok: true, id: a.id });
    }

    if (tipo === 'material') {
      const m = Array.isArray(datos) ? datos[0] : datos;
      const e = await safeExec(
        `INSERT OR REPLACE INTO materiales (id, aulaId, tipo, titulo, descripcion, contenido, url, nombreArchivo, tipoArchivo, pesoArchivo, fechaEntrega, creadoPor, creado, actualizado)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [m.id, m.aulaId, m.tipo, m.titulo || '', m.descripcion || '', m.contenido || '', m.url || '', m.nombreArchivo || '', m.tipoArchivo || '', m.pesoArchivo || 0, m.fechaEntrega || '', m.creadoPor || userId, m.creado || new Date().toISOString(), new Date().toISOString()]
      );
      if (e) return res.status(500).json({ error: e });
      return res.json({ ok: true, id: m.id });
    }

    if (tipo === 'entrega') {
      const ent = Array.isArray(datos) ? datos[0] : datos;
      const e = await safeExec(
        `INSERT OR REPLACE INTO entregas (id, materialId, alumnoId, aulaId, contenido, nombreArchivo, tipoArchivo, pesoArchivo, nota, comentarioDoc, estado, creado, actualizado)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [ent.id, ent.materialId, ent.alumnoId, ent.aulaId, ent.contenido || '', ent.nombreArchivo || '', ent.tipoArchivo || '', ent.pesoArchivo || 0, ent.nota ?? null, ent.comentarioDoc || '', ent.estado || 'pendiente', ent.creado || new Date().toISOString(), new Date().toISOString()]
      );
      if (e) return res.status(500).json({ error: e });
      return res.json({ ok: true, id: ent.id });
    }

    if (tipo === 'comentario') {
      const com = Array.isArray(datos) ? datos[0] : datos;
      const e = await safeExec(
        `INSERT OR REPLACE INTO comentarios (id, materialId, aulaId, userId, userName, contenido, creado)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [com.id, com.materialId, com.aulaId, com.userId || userId, com.userName || '', com.contenido || '', com.creado || new Date().toISOString()]
      );
      if (e) return res.status(500).json({ error: e });
      return res.json({ ok: true, id: com.id });
    }

    return res.status(400).json({ error: `Tipo desconocido: ${tipo}` });
  }

  // ── PUT: update ───────────────────────────────────────────────────────
  if (req.method === 'PUT') {
    const { tipo, id, datos } = req.body;
    if (!tipo || !id || !datos) return res.status(400).json({ error: 'Falta tipo, id o datos' });

    const safeExec = async (sql, args) => {
      try { await c.execute({ sql, args }); return null; }
      catch (e) { return e.message; }
    };

    if (tipo === 'aula') {
      const e = await safeExec(
        `UPDATE aulas SET nombre=?, descripcion=?, grado=?, seccion=?, curso=?, imagen=?, estado=?, actualizado=? WHERE id=?`,
        [datos.nombre || '', datos.descripcion || '', datos.grado || '', datos.seccion || '', datos.curso || '', datos.imagen || '', datos.estado || 'activa', new Date().toISOString(), id]
      );
      if (e) return res.status(500).json({ error: e });
      return res.json({ ok: true });
    }

    if (tipo === 'entrega') {
      const e = await safeExec(
        `UPDATE entregas SET nota=?, comentarioDoc=?, estado=?, actualizado=? WHERE id=?`,
        [datos.nota ?? null, datos.comentarioDoc || '', datos.estado || 'pendiente', new Date().toISOString(), id]
      );
      if (e) return res.status(500).json({ error: e });
      return res.json({ ok: true });
    }

    if (tipo === 'material') {
      const e = await safeExec(
        `UPDATE materiales SET titulo=?, descripcion=?, url=?, fechaEntrega=?, actualizado=? WHERE id=?`,
        [datos.titulo || '', datos.descripcion || '', datos.url || '', datos.fechaEntrega || '', new Date().toISOString(), id]
      );
      if (e) return res.status(500).json({ error: e });
      return res.json({ ok: true });
    }

    return res.status(400).json({ error: `Tipo desconocido: ${tipo}` });
  }

  // ── DELETE ────────────────────────────────────────────────────────────
  if (req.method === 'DELETE') {
    const tipo = req.query?.tipo;
    const id = req.query?.id;

    if (tipo === 'aula' && id) {
      try {
        await c.execute({ sql: 'DELETE FROM comentarios WHERE aulaId = ?', args: [id] });
        await c.execute({ sql: 'DELETE FROM entregas WHERE aulaId = ?', args: [id] });
        await c.execute({ sql: 'DELETE FROM materiales WHERE aulaId = ?', args: [id] });
        await c.execute({ sql: 'DELETE FROM aulas WHERE id = ?', args: [id] });
        return res.json({ ok: true });
      } catch (e) {
        return res.status(500).json({ error: e.message });
      }
    }

    if (tipo === 'material' && id) {
      try {
        await c.execute({ sql: 'DELETE FROM comentarios WHERE materialId = ?', args: [id] });
        await c.execute({ sql: 'DELETE FROM entregas WHERE materialId = ?', args: [id] });
        await c.execute({ sql: 'DELETE FROM materiales WHERE id = ?', args: [id] });
        return res.json({ ok: true });
      } catch (e) {
        return res.status(500).json({ error: e.message });
      }
    }

    if (tipo === 'entrega' && id) {
      try {
        await c.execute({ sql: 'DELETE FROM entregas WHERE id = ?', args: [id] });
        return res.json({ ok: true });
      } catch (e) {
        return res.status(500).json({ error: e.message });
      }
    }

    if (tipo === 'comentario' && id) {
      try {
        await c.execute({ sql: 'DELETE FROM comentarios WHERE id = ?', args: [id] });
        return res.json({ ok: true });
      } catch (e) {
        return res.status(500).json({ error: e.message });
      }
    }

    return res.status(400).json({ error: 'Falta tipo o id' });
  }

  return res.status(405).json({ error: 'Método no permitido' });
}