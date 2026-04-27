// Endpoint de recuperación de cuenta administrador
// Uso: POST /api/fix-admin  { "email": "...", "password": "..." }
// Solo funciona si la cuenta no existe O está desactivada

import { query, execute, initializeDatabase } from '../lib/turso.js';
import crypto from 'crypto';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Usar POST' });

  const { email, password, nombre } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'Se requiere email y password' });
  }

  try {
    await initializeDatabase();

    // Buscar si existe la cuenta
    const existe = await query('SELECT id, activo FROM users WHERE email = ?', [email]);
    const usuario = existe.rows?.[0];

    if (usuario) {
      // Cuenta existe → reactivar y actualizar contraseña
      await execute(
        'UPDATE users SET contraseña = ?, activo = 1, rol = ? WHERE email = ?',
        [password, 'admin', email]
      );
      return res.json({ ok: true, accion: 'reactivada', mensaje: `Cuenta ${email} reactivada como admin. Ya puedes iniciar sesión.` });
    } else {
      // Cuenta no existe → crear nueva
      const id = `admin-${crypto.randomUUID()}`;
      await execute(
        'INSERT INTO users (id, nombre, email, contraseña, rol, activo) VALUES (?, ?, ?, ?, ?, 1)',
        [id, nombre || 'Administrador', email, password, 'admin']
      );
      return res.json({ ok: true, accion: 'creada', mensaje: `Cuenta ${email} creada como admin. Ya puedes iniciar sesión.` });
    }
  } catch (err) {
    console.error('fix-admin error:', err);
    return res.status(500).json({ error: err.message });
  }
}
