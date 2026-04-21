import jwt from 'jsonwebtoken';
import { query, execute, initializeDatabase } from '../lib/turso.js';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'sistemita-secreto-2026-muy-seguro';

function verifyToken(authHeader) {
  const token = authHeader?.split(' ')[1];
  if (!token) throw new Error('Token requerido');
  return jwt.verify(token, JWT_SECRET);
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

  try {
    verifyToken(req.headers.authorization);
    await initializeDatabase();

    // GET → listar todos
    if (req.method === 'GET') {
      const result = await query('SELECT * FROM docentes ORDER BY apellidos_nombres ASC');
      return res.status(200).json(result.rows || []);
    }

    // POST → crear uno
    if (req.method === 'POST') {
      const { apellidos_nombres, dni, genero, fecha_nacimiento, celular, cargo, email, user_id } = req.body;
      if (!apellidos_nombres || !dni || !genero || !fecha_nacimiento)
        return res.status(400).json({ error: 'Faltan campos obligatorios' });

      const id = `doc-${crypto.randomUUID()}`;
      await execute(
        `INSERT INTO docentes (id, apellidos_nombres, dni, genero, fecha_nacimiento, celular, cargo, email, user_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, apellidos_nombres, dni, genero, fecha_nacimiento, celular || '', cargo || '', email || '', user_id || null]
      );
      return res.status(201).json({ ok: true, id });
    }

    // PUT → editar
    if (req.method === 'PUT') {
      const { id } = req.query;
      const { apellidos_nombres, dni, genero, fecha_nacimiento, celular, cargo, email } = req.body;
      if (!id) return res.status(400).json({ error: 'ID requerido' });

      await execute(
        `UPDATE docentes SET apellidos_nombres=?, dni=?, genero=?, fecha_nacimiento=?, celular=?, cargo=?, email=? WHERE id=?`,
        [apellidos_nombres, dni, genero, fecha_nacimiento, celular || '', cargo || '', email || '', id]
      );
      return res.status(200).json({ ok: true });
    }

    // DELETE → eliminar
    if (req.method === 'DELETE') {
      const { id } = req.query;
      if (!id) return res.status(400).json({ error: 'ID requerido' });
      await execute('DELETE FROM docentes WHERE id = ?', [id]);
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Docentes API error:', error);
    if (error.message?.includes('Token') || error.name === 'JsonWebTokenError')
      return res.status(401).json({ error: 'No autorizado' });
    if (error.message?.includes('UNIQUE'))
      return res.status(400).json({ error: 'El DNI ya está registrado' });
    return res.status(500).json({ error: error.message });
  }
}
