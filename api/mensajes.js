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
    `CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      senderId TEXT NOT NULL,
      senderName TEXT DEFAULT '',
      receiverId TEXT,
      subject TEXT DEFAULT '',
      text TEXT NOT NULL,
      date TEXT NOT NULL,
      read INTEGER DEFAULT 0,
      isBroadcast INTEGER DEFAULT 0,
      priority TEXT DEFAULT 'normal',
      category TEXT DEFAULT 'general'
    )`,
  ];
  for (const sql of stmts) {
    try { await c.execute(sql); } catch (_) {}
  }
  const alterSafe = async (sql) => { try { await c.execute(sql); } catch (_) {} };
  await alterSafe(`CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(senderId)`);
  await alterSafe(`CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages(receiverId)`);
  await alterSafe(`CREATE INDEX IF NOT EXISTS idx_messages_date ON messages(date)`);
  tablesReady = true;
}

function cors(res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const c = getClient();
  if (!c) return res.status(503).json({ error: 'Base de datos no configurada' });

  try { await ensureTables(c); } catch (e) {
    return res.status(500).json({ error: 'Error inicializando tablas: ' + e.message });
  }

  const usuario = parseJWT(req);
  const userId = usuario?.id || usuario?.docenteId || 'anonymous';

  // ── GET: obtener mensajes ──────────────────────────────────────────────
  if (req.method === 'GET') {
    const accion = req.query?.accion;

    // Obtener todas las conversaciones del usuario
    if (!accion || accion === 'conversaciones') {
      try {
        const r = await c.execute({
          sql: `SELECT m.* FROM messages m
                WHERE m.senderId = ? OR m.receiverId = ? OR m.isBroadcast = 1
                ORDER BY m.date DESC`,
          args: [userId, userId]
        });
        return res.json({ ok: true, mensajes: r.rows || [] });
      } catch (e) {
        return res.status(500).json({ error: e.message });
      }
    }

    // Obtener mensajes entre dos usuarios (conversación)
    if (accion === 'conversacion') {
      const otherUserId = req.query?.userId;
      if (!otherUserId) return res.status(400).json({ error: 'Falta userId' });
      try {
        const r = await c.execute({
          sql: `SELECT * FROM messages
                WHERE (senderId = ? AND receiverId = ?) OR (senderId = ? AND receiverId = ?)
                ORDER BY date ASC`,
          args: [userId, otherUserId, otherUserId, userId]
        });
        return res.json({ ok: true, mensajes: r.rows || [] });
      } catch (e) {
        return res.status(500).json({ error: e.message });
      }
    }

    // Obtener mensajes broadcast
    if (accion === 'broadcasts') {
      try {
        const r = await c.execute(
          `SELECT * FROM messages WHERE isBroadcast = 1 ORDER BY date DESC`
        );
        return res.json({ ok: true, mensajes: r.rows || [] });
      } catch (e) {
        return res.status(500).json({ error: e.message });
      }
    }

    // Contar mensajes no leidos
    if (accion === 'noLeidos') {
      try {
        const r = await c.execute({
          sql: `SELECT COUNT(*) as count FROM messages WHERE receiverId = ? AND read = 0`,
          args: [userId]
        });
        const broadcastRead = await c.execute({
          sql: `SELECT DISTINCT senderId FROM messages WHERE isBroadcast = 1 AND receiverId = ?`,
          args: [userId]
        });
        return res.json({
          ok: true,
          noLeidos: Number(r.rows?.[0]?.count ?? 0)
        });
      } catch (e) {
        return res.status(500).json({ error: e.message });
      }
    }

    return res.status(400).json({ error: 'Acción GET no reconocida' });
  }

  // ── POST: crear mensaje ────────────────────────────────────────────────
  if (req.method === 'POST') {
    const { senderId, senderName, receiverId, subject, text, isBroadcast, priority, category } = req.body;
    if (!senderId || !text) {
      return res.status(400).json({ error: 'Falta senderId o text' });
    }
    const id = `m${Date.now()}_${senderId}_${Math.random().toString(36).slice(2, 6)}`;
    try {
      await c.execute({
        sql: `INSERT INTO messages (id, senderId, senderName, receiverId, subject, text, date, read, isBroadcast, priority, category)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          id,
          senderId,
          senderName || '',
          receiverId || null,
          subject || '',
          text,
          new Date().toISOString(),
          0,
          isBroadcast ? 1 : 0,
          priority || 'normal',
          category || 'general'
        ]
      });
      return res.json({ ok: true, id });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  // ── PUT: marcar como leído ───────────────────────────────────────────
  if (req.method === 'PUT') {
    const { accion } = req.query || {};

    // Marcar mensajes como leídos
    if (accion === 'marcarLeidos') {
      const { mensajeIds, otherUserId } = req.body;
      try {
        if (mensajeIds && Array.isArray(mensajeIds) && mensajeIds.length > 0) {
          const placeholders = mensajeIds.map(() => '?').join(',');
          await c.execute({
            sql: `UPDATE messages SET read = 1 WHERE id IN (${placeholders})`,
            args: mensajeIds
          });
        } else if (otherUserId) {
          await c.execute({
            sql: `UPDATE messages SET read = 1 WHERE senderId = ? AND receiverId = ? AND read = 0`,
            args: [otherUserId, userId]
          });
        }
        return res.json({ ok: true });
      } catch (e) {
        return res.status(500).json({ error: e.message });
      }
    }

    // Editar mensaje
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: 'Falta id' });
    const { subject, text, priority, category } = req.body;
    try {
      await c.execute({
        sql: `UPDATE messages SET subject = COALESCE(?, subject), text = COALESCE(?, text), priority = COALESCE(?, priority), category = COALESCE(?, category) WHERE id = ?`,
        args: [subject || null, text || null, priority || null, category || null, id]
      });
      return res.json({ ok: true });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  // ── DELETE: eliminar mensaje ──────────────────────────────────────────
  if (req.method === 'DELETE') {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'Falta id' });
    try {
      // Solo el emisor o receptor puede eliminar
      const msg = await c.execute({ sql: 'SELECT * FROM messages WHERE id = ?', args: [id] });
      if (!msg.rows?.length) return res.status(404).json({ error: 'Mensaje no encontrado' });
      await c.execute({ sql: 'DELETE FROM messages WHERE id = ?', args: [id] });
      return res.json({ ok: true });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  return res.status(405).json({ error: 'Método no permitido' });
}