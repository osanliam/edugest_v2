import jwt from 'jsonwebtoken';
import { query, execute, initializeDatabase } from '../lib/turso.js';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'sistemita-secreto-2026-muy-seguro';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS,GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // GET /api/auth?action=fix-admin → reactivar/crear cuenta admin de emergencia
  if (req.method === 'GET' && req.query?.action === 'fix-admin') {
    const { email, password, nombre } = req.query;
    if (!email || !password) {
      return res.status(400).json({ error: 'Parámetros requeridos: email, password' });
    }
    try {
      await initializeDatabase();
      const existe = await query('SELECT id FROM users WHERE email = ?', [email]);
      if (existe.rows?.length > 0) {
        await execute('UPDATE users SET contraseña = ?, activo = 1, rol = ? WHERE email = ?', [password, 'admin', email]);
        return res.json({ ok: true, accion: 'reactivada', mensaje: `Cuenta ${email} reactivada. Ya puedes iniciar sesión.` });
      } else {
        const id = `admin-${crypto.randomUUID()}`;
        await execute('INSERT INTO users (id, nombre, email, contraseña, rol, activo) VALUES (?, ?, ?, ?, ?, 1)', [id, nombre || 'Administrador', email, password, 'admin']);
        return res.json({ ok: true, accion: 'creada', mensaje: `Cuenta ${email} creada. Ya puedes iniciar sesión.` });
      }
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  // GET /api/auth → inicializar DB
  if (req.method === 'GET') {
    try {
      await initializeDatabase();
      return res.status(200).json({ ok: true, message: 'Base de datos lista' });
    } catch (error) {
      console.error('Init error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  // POST /api/auth → login
  if (req.method === 'POST') {
    try {
      await initializeDatabase();

      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email y contraseña requeridos' });
      }

      const result = await query(
        'SELECT id, nombre, email, rol, docenteId FROM users WHERE email = ? AND contraseña = ? AND activo = 1',
        [email, password]
      );

      const user = result.rows[0];
      if (!user) {
        return res.status(401).json({ error: 'Credenciales inválidas' });
      }

      const token = jwt.sign(
        { id: user.id, role: user.rol, docenteId: user.docenteId },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      return res.status(200).json({
        token,
        user: {
          id: user.id,
          name: user.nombre,
          email: user.email,
          role: user.rol,
          school_id: '1',
          docenteId: user.docenteId,
        },
      });
    } catch (error) {
      console.error('Auth error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
