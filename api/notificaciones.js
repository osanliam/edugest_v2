import { createClient } from '@libsql/client';

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
  await c.execute(`CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT,
    data TEXT,
    read INTEGER DEFAULT 0,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  const alterSafe = async (sql) => { try { await c.execute(sql); } catch (_) {} };
  await alterSafe(`CREATE INDEX IF NOT EXISTS idx_notif_user ON notifications(userId)`);
  await alterSafe(`CREATE INDEX IF NOT EXISTS idx_notif_read ON notifications(userId, read)`);
  tablesReady = true;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const c = getClient();
  if (!c) return res.status(503).json({ error: 'Base de datos no configurada' });

  try { await ensureTables(c); } catch (e) {
    return res.status(500).json({ error: 'Error inicializando: ' + e.message });
  }

  // ── SSE: streaming de eventos en tiempo real ──
  if (req.method === 'GET' && req.query?.accion === 'stream') {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    let lastCheck = new Date().toISOString();
    const interval = setInterval(async () => {
      try {
        const r = await c.execute({
          sql: `SELECT COUNT(*) as n FROM calificaciones WHERE updated_at > ?`,
          args: [lastCheck]
        });
        const count = Number(r.rows?.[0]?.n ?? 0);
        if (count > 0) {
          res.write(`event: calificaciones\ndata: {"count":${count},"since":"${lastCheck}"}\n\n`);
          lastCheck = new Date().toISOString();
        }

        const notifs = await c.execute({
          sql: `SELECT COUNT(*) as n FROM notifications WHERE read = 0`,
          args: []
        });
        res.write(`event: ping\ndata: {"unread":${Number(notifs.rows?.[0]?.n ?? 0)}}\n\n`);
      } catch {}
    }, 5000);

    req.on('close', () => { clearInterval(interval); });
    return;
  }

  // ── GET: obtener notificaciones del usuario ──
  if (req.method === 'GET') {
    const { userId, unread } = req.query || {};
    if (userId) {
      try {
        if (unread === '1') {
          const r = await c.execute({ sql: 'SELECT COUNT(*) as count FROM notifications WHERE userId = ? AND read = 0', args: [userId] });
          return res.json({ ok: true, count: Number(r.rows?.[0]?.count ?? 0) });
        }
        const limit = parseInt(req.query?.limit || '50');
        const r = await c.execute({ sql: 'SELECT * FROM notifications WHERE userId = ? ORDER BY createdAt DESC LIMIT ?', args: [userId, limit] });
        return res.json({ ok: true, notifications: r.rows || [] });
      } catch (e) { return res.status(500).json({ error: e.message }); }
    }
    return res.status(400).json({ error: 'Falta userId' });
  }

  // ── POST: crear notificación ──
  if (req.method === 'POST') {
    const { userId, type, title, body, data } = req.body;
    if (!userId || !type || !title) return res.status(400).json({ error: 'Falta userId, type o title' });
    const id = `notif-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    try {
      await c.execute({
        sql: `INSERT INTO notifications (id, userId, type, title, body, data, read, createdAt) VALUES (?, ?, ?, ?, ?, ?, 0, ?)`,
        args: [id, userId, type, title, body || '', typeof data === 'string' ? data : JSON.stringify(data || {}), new Date().toISOString()]
      });
      return res.json({ ok: true, id });
    } catch (e) { return res.status(500).json({ error: e.message }); }
  }

  // ── PUT: marcar como leídas ──
  if (req.method === 'PUT') {
    const { accion } = req.query || {};
    if (accion === 'marcarLeidas') {
      const { userId, notifIds } = req.body;
      if (!userId) return res.status(400).json({ error: 'Falta userId' });
      try {
        if (notifIds && Array.isArray(notifIds) && notifIds.length > 0) {
          const placeholders = notifIds.map(() => '?').join(',');
          await c.execute({ sql: `UPDATE notifications SET read = 1 WHERE userId = ? AND id IN (${placeholders})`, args: [userId, ...notifIds] });
        } else {
          await c.execute({ sql: 'UPDATE notifications SET read = 1 WHERE userId = ?', args: [userId] });
        }
        return res.json({ ok: true });
      } catch (e) { return res.status(500).json({ error: e.message }); }
    }
    return res.status(400).json({ error: 'Acción PUT no reconocida' });
  }

  // ── DELETE: eliminar notificaciones ──
  if (req.method === 'DELETE') {
    const { id, userId } = req.query || {};
    if (id) {
      try {
        await c.execute({ sql: 'DELETE FROM notifications WHERE id = ?', args: [id] });
        return res.json({ ok: true });
      } catch (e) { return res.status(500).json({ error: e.message }); }
    }
    if (userId) {
      try {
        await c.execute({ sql: 'DELETE FROM notifications WHERE userId = ? AND read = 1', args: [userId] });
        return res.json({ ok: true, mensaje: 'Notificaciones leídas eliminadas' });
      } catch (e) { return res.status(500).json({ error: e.message }); }
    }
    return res.status(400).json({ error: 'Falta id o userId' });
  }

  return res.status(405).json({ error: 'Método no permitido' });
}