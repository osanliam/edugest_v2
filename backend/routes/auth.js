import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../db.js';

const router = express.Router();

// Cuentas de demo (en producción, verificar contra BD)
const demoAccounts = [
  {
    id: 'user-admin',
    email: 'admin@escuela.edu',
    password: 'admin123',
    name: 'Administrador del Sistema',
    role: 'admin',
    school_id: 'school-001'
  },
  {
    id: 'user-001',
    email: 'director@escuela.edu',
    password: 'director123',
    name: 'Dr. Fernando López',
    role: 'director',
    school_id: 'school-001'
  },
  {
    id: 'user-002',
    email: 'subdirector@escuela.edu',
    password: 'sub123',
    name: 'Mg. María García',
    role: 'subdirector',
    school_id: 'school-001'
  },
  {
    id: 'user-003',
    email: 'profesor@escuela.edu',
    password: 'prof123',
    name: 'Lic. Juan Pérez',
    role: 'teacher',
    school_id: 'school-001'
  },
  {
    id: 'user-004',
    email: 'estudiante@escuela.edu',
    password: 'est123',
    name: 'Carlos Mendez',
    role: 'student',
    school_id: 'school-001'
  },
  {
    id: 'user-005',
    email: 'apoderado@escuela.edu',
    password: 'apod123',
    name: 'Pedro Mendez',
    role: 'parent',
    school_id: 'school-001'
  }
];

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validar entrada
    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña requeridos' });
    }

    // Buscar usuario en cuentas demo
    const user = demoAccounts.find(acc => acc.email === email);

    if (!user || user.password !== password) {
      return res.status(401).json({ error: 'Email o contraseña incorrectos' });
    }

    // Generar JWT
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        school_id: user.school_id
      },
      process.env.JWT_SECRET || 'tu_clave_secreta_super_segura_aqui',
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        school_id: user.school_id
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error en autenticación' });
  }
});

// POST /api/auth/register (TODO: Implementar registro real)
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, role } = req.body;

    // Validar entrada
    if (!email || !password || !name || !role) {
      return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }

    // TODO: Verificar que el email no existe en BD
    // TODO: Hashear contraseña con bcrypt
    // TODO: Insertar en tabla users
    // TODO: Generar token y retornar

    res.status(501).json({ error: 'Registro aún no implementado' });
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ error: 'Error en registro' });
  }
});

// GET /api/auth/verify
router.get('/verify', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token no proporcionado' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'tu_clave_secreta_super_segura_aqui');
    res.json({ valid: true, user: decoded });
  } catch (error) {
    res.status(401).json({ valid: false, error: 'Token inválido' });
  }
});

export default router;
