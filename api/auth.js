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

  // GET /api/auth → inicializar DB y seed de usuarios demo
  if (req.method === 'GET') {
    try {
      await initializeDatabase();

      // Insertar usuarios demo si no existen
      const demoUsers = [
        { id: 'user-admin', nombre: 'Administrador del Sistema', email: 'admin@escuela.edu',       contraseña: 'admin123',    rol: 'admin' },
        { id: 'user-001',   nombre: 'Dr. Fernando López',        email: 'director@escuela.edu',    contraseña: 'director123', rol: 'director' },
        { id: 'user-002',   nombre: 'Mg. María García',          email: 'subdirector@escuela.edu', contraseña: 'sub123',      rol: 'subdirector' },
        { id: 'user-003',   nombre: 'Lic. Juan Pérez',           email: 'profesor@escuela.edu',    contraseña: 'prof123',     rol: 'teacher' },
        { id: 'user-004',   nombre: 'Carlos Mendez',             email: 'estudiante@escuela.edu',  contraseña: 'est123',      rol: 'student' },
        { id: 'user-005',   nombre: 'Pedro Mendez',              email: 'apoderado@escuela.edu',   contraseña: 'apod123',     rol: 'parent' },
      ];

      for (const u of demoUsers) {
        await execute(
          `INSERT OR IGNORE INTO users (id, nombre, email, contraseña, rol, activo) VALUES (?, ?, ?, ?, ?, 1)`,
          [u.id, u.nombre, u.email, u.contraseña, u.rol]
        );
      }

      return res.status(200).json({ ok: true, message: 'Base de datos inicializada con usuarios demo' });
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
