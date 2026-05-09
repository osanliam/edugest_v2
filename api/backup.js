import { createClient } from '@libsql/client';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'sistemita-secreto-2026-muy-seguro';
const CRON_SECRET = process.env.CRON_SECRET;
const TABLAS_BACKUP = ['users', 'alumnos', 'docentes', 'calificaciones', 'columnas', 'asignaciones', 'asistencia', 'auditoria'];

function getClient() {
  const url = process.env.TURSO_CONNECTION_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;
  if (!url || !authToken) return null;
  return createClient({ url, authToken });
}

function autorizar(req) {
  const auth = req.headers?.authorization || '';
  if (CRON_SECRET && auth === `Bearer ${CRON_SECRET}`) return { ok: true, tipo: 'cron' };
  if (auth.startsWith('Bearer ')) {
    try {
      const payload = jwt.verify(auth.slice(7), JWT_SECRET);
      if (['admin', 'director'].includes(payload.role)) return { ok: true, tipo: 'user', payload };
    } catch {}
  }
  return { ok: false };
}

async function ensureBackupTable(c) {
  await c.execute(`
    CREATE TABLE IF NOT EXISTS backups (
      id        TEXT PRIMARY KEY,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      tipo      TEXT DEFAULT 'auto',
      resumen   TEXT,
      datos     TEXT
    )
  `);
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const c = getClient();
  if (!c) return res.status(503).json({ error: 'Turso no configurado' });

  try {
    await ensureBackupTable(c);
  } catch (e) {
    return res.status(500).json({ error: 'Error inicializando tabla backups: ' + e.message });
  }

  const auth = autorizar(req);

  // ── GET /api/backup → lista de backups (sin datos) ────────────────────────
  if (req.method === 'GET' && !req.query.download && !req.query.crear) {
    if (!auth.ok) return res.status(403).json({ error: 'Sin permiso' });
    try {
      const r = await c.execute('SELECT id, timestamp, tipo, resumen FROM backups ORDER BY timestamp DESC LIMIT 30');
      return res.json({ ok: true, backups: r.rows || [] });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  // ── GET /api/backup?download=<id> → descarga JSON de un backup ───────────
  if (req.method === 'GET' && req.query.download) {
    if (!auth.ok) return res.status(403).json({ error: 'Sin permiso' });
    const id = req.query.download;
    try {
      const r = await c.execute({ sql: 'SELECT * FROM backups WHERE id = ?', args: [id] });
      const backup = r.rows[0];
      if (!backup) return res.status(404).json({ error: 'Backup no encontrado' });
      const datos = typeof backup.datos === 'string' ? JSON.parse(backup.datos) : backup.datos;
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="backup-${id}.json"`);
      return res.end(JSON.stringify({ ...datos, _meta: { id, timestamp: backup.timestamp, tipo: backup.tipo } }, null, 2));
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  // ── POST /api/backup  o  GET /api/backup?crear=1  → crear backup ─────────
  // GET es para el cron de Vercel (que llama con GET), POST para uso manual
  if (req.method === 'POST' || (req.method === 'GET' && req.query.crear)) {
    if (!auth.ok) return res.status(403).json({ error: 'Sin permiso para crear backup' });

    try {
      const ahora = new Date().toISOString();
      const datos = { _timestamp: ahora };
      const resumen = {};

      for (const tabla of TABLAS_BACKUP) {
        try {
          const r = await c.execute(`SELECT * FROM ${tabla}`);
          datos[tabla] = r.rows || [];
          resumen[tabla] = datos[tabla].length;
        } catch {
          datos[tabla] = [];
          resumen[tabla] = 0;
        }
      }

      const tipo = auth.tipo === 'cron' ? 'auto' : 'manual';
      const id = `bkp-${ahora.slice(0, 19).replace(/[:T]/g, '-')}`;

      await c.execute({
        sql: `INSERT OR REPLACE INTO backups (id, timestamp, tipo, resumen, datos) VALUES (?, ?, ?, ?, ?)`,
        args: [id, ahora, tipo, JSON.stringify(resumen), JSON.stringify(datos)],
      });

      return res.json({ ok: true, id, timestamp: ahora, tipo, resumen });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  return res.status(405).json({ error: 'Método no permitido' });
}

// ── PUT /api/backup?restore=<id> → restaurar backup ─────────────────────────
if (req.method === 'PUT' && req.query?.restore) {
  if (!auth.ok) return res.status(403).json({ error: 'Sin permiso para restaurar' });
  if (!['admin', 'director'].includes(auth.payload?.role)) return res.status(403).json({ error: 'Solo admin o director pueden restaurar backups' });

  const backupId = req.query.restore;
  try {
    const r = await c.execute({ sql: 'SELECT * FROM backups WHERE id = ?', args: [backupId] });
    const backup = r.rows?.[0];
    if (!backup) return res.status(404).json({ error: 'Backup no encontrado' });

    const datos = typeof backup.datos === 'string' ? JSON.parse(backup.datos) : backup.datos;
    const tablasPermitidas = ['users', 'alumnos', 'docentes', 'calificaciones', 'columnas', 'asignaciones', 'asistencia'];
    let restauradas = {};

    for (const tabla of tablasPermitidas) {
      if (!datos[tabla] || !Array.isArray(datos[tabla])) continue;
      try {
        // Borrar datos actuales
        await c.execute(`DELETE FROM ${tabla}`);
        // Insertar datos del backup en lotes de 50
        const lote = datos[tabla].slice(0, 50);
        const columnas = Object.keys(lote[0] || {});
        for (const row of datos[tabla]) {
          const cols = Object.keys(row);
          const placeholders = cols.map(() => '?').join(',');
          const values = cols.map(k => {
            const v = row[k];
            return typeof v === 'object' && v !== null ? JSON.stringify(v) : v;
          });
          try {
            await c.execute({ sql: `INSERT OR REPLACE INTO ${tabla} (${cols.join(',')}) VALUES (${placeholders})`, args: values });
          } catch (e2) { /* continuar con siguiente registro */ }
        }
        restauradas[tabla] = datos[tabla].length;
      } catch (e) {
        restauradas[tabla] = `Error: ${e.message}`;
      }
    }

    // Registrar en auditoría
    try {
      await c.execute({
        sql: `INSERT INTO auditoria (id, timestamp, usuario_id, accion, tabla, registro_id, cambios, ip) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [`aud-restore-${Date.now()}`, new Date().toISOString(), auth.payload?.id || auth.payload?.docenteId || 'unknown', 'restaurar_backup', 'backups', backupId, JSON.stringify(restauradas), req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown']
      });
    } catch {}

    return res.json({ ok: true, backupId, restauradas });
  } catch (e) {
    return res.status(500).json({ error: 'Error restaurando backup: ' + e.message });
  }
}
