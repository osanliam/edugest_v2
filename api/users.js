import jwt from 'jsonwebtoken';
import { query, execute } from '../lib/turso.js';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'tu-secreto-super-seguro-2026';

function verifyToken(authHeader) {
  const token = authHeader?.split(' ')[1];
  if (!token) throw new Error('Token requerido');

  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    throw new Error('Token inválido');
  }
}

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const user = verifyToken(req.headers.authorization);

    if (req.method === 'GET') {
      // GET /api/users - Listar todos los usuarios
      const result = await query(
        'SELECT id, nombre, email, rol, activo, docenteId, creado FROM users ORDER BY creado DESC'
      );

      return res.status(200).json(result.rows || []);
    }

    if (req.method === 'POST') {
      // POST /api/users - Crear nuevo usuario
      const { nombre, email, contraseña, rol, docenteId } = req.body;

      if (!nombre || !email || !contraseña || !rol) {
        return res.status(400).json({ error: 'Faltan campos requeridos' });
      }

      const id = `user-${crypto.randomUUID()}`;

      try {
        await execute(
          'INSERT INTO users (id, nombre, email, contraseña, rol, activo, docenteId) VALUES (?, ?, ?, ?, ?, 1, ?)',
          [id, nombre, email, contraseña, rol, docenteId || null]
        );

        return res.status(201).json({
          message: 'Usuario creado',
          id,
          usuario: { id, nombre, email, rol, docenteId: docenteId || null },
        });
      } catch (error) {
        if (error.message?.includes('UNIQUE')) {
          return res.status(400).json({ error: 'El email ya existe' });
        }
        throw error;
      }
    }

    if (req.method === 'PUT') {
      // PUT /api/users/:id - Actualizar usuario
      const { id } = req.query;
      const { nombre, email, contraseña, rol, activo, docenteId } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'ID requerido' });
      }

      const updates = [];
      const values = [];

      if (nombre) {
        updates.push('nombre = ?');
        values.push(nombre);
      }
      if (email) {
        updates.push('email = ?');
        values.push(email);
      }
      if (contraseña) {
        updates.push('contraseña = ?');
        values.push(contraseña);
      }
      if (rol) {
        updates.push('rol = ?');
        values.push(rol);
      }
      if (activo !== undefined) {
        updates.push('activo = ?');
        values.push(activo ? 1 : 0);
      }
      if (docenteId !== undefined) {
        updates.push('docenteId = ?');
        values.push(docenteId);
      }

      if (updates.length === 0) {
        return res.status(400).json({ error: 'No hay campos para actualizar' });
      }

      values.push(id);

      try {
        await execute(
          `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
          values
        );

        return res.status(200).json({ message: 'Usuario actualizado' });
      } catch (error) {
        if (error.message?.includes('UNIQUE')) {
          return res.status(400).json({ error: 'El email ya existe' });
        }
        throw error;
      }
    }

    if (req.method === 'DELETE') {
      // DELETE /api/users/:id - Eliminar usuario
      const { id } = req.query;

      if (!id) {
        return res.status(400).json({ error: 'ID requerido' });
      }

      await execute('DELETE FROM users WHERE id = ?', [id]);

      return res.status(200).json({ message: 'Usuario eliminado' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Users API error:', error);

    if (error.message.includes('Token')) {
      return res.status(401).json({ error: error.message });
    }

    return res.status(500).json({ error: 'Internal server error' });
  }
}
