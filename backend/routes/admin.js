import express from 'express';
import pool from '../db.js';
import { verifyToken, verifyRole } from '../middleware/auth.js';
import { mockUsers, mockStats, mockAuditLogs } from '../mockData.js';

const router = express.Router();

// ============================================
// SOLO PARA ADMIN - Gestión de Usuarios
// ============================================

// GET /api/admin/users - Obtener todos los usuarios
router.get('/users', verifyToken, verifyRole(['admin']), async (req, res) => {
  try {
    try {
      const [rows] = await pool.query(
        `SELECT
          u.id,
          u.name,
          u.email,
          u.role,
          u.status,
          u.created_at,
          u.updated_at,
          s.name as school_name
        FROM users u
        LEFT JOIN schools s ON u.school_id = s.id
        ORDER BY u.created_at DESC`
      );

      res.json({ success: true, data: rows });
    } catch (dbError) {
      res.json({ success: true, data: mockUsers });
    }
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
});

// GET /api/admin/users/:id - Obtener usuario específico
router.get('/users/:id', verifyToken, verifyRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.query(
      `SELECT
        u.id,
        u.name,
        u.email,
        u.role,
        u.status,
        u.phone,
        u.address,
        u.school_id,
        u.created_at,
        u.updated_at
      FROM users u
      WHERE u.id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Error al obtener usuario' });
  }
});

// POST /api/admin/users - Crear nuevo usuario
router.post('/users', verifyToken, verifyRole(['admin']), async (req, res) => {
  try {
    const { name, email, role, password, school_id, phone, address } = req.body;

    // Validar entrada
    if (!name || !email || !role || !password) {
      return res.status(400).json({
        error: 'Campos requeridos: name, email, role, password'
      });
    }

    // Validar rol
    const validRoles = ['admin', 'director', 'subdirector', 'teacher', 'student', 'parent'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        error: `Rol inválido. Roles válidos: ${validRoles.join(', ')}`
      });
    }

    const userId = 'user-' + Date.now();

    await pool.query(
      'INSERT INTO users (id, school_id, name, email, password_hash, role, phone, address, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [userId, school_id || 'school-001', name, email, 'hashed_' + password, role, phone || null, address || null, 'active']
    );

    res.status(201).json({
      success: true,
      message: 'Usuario creado exitosamente',
      data: { id: userId }
    });
  } catch (error) {
    console.error('Error creating user:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'El email ya existe' });
    }
    res.status(500).json({ error: 'Error al crear usuario' });
  }
});

// PUT /api/admin/users/:id - Actualizar usuario
router.put('/users/:id', verifyToken, verifyRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, role, status, phone, address } = req.body;

    if (!name && !role && !status && !phone && !address) {
      return res.status(400).json({ error: 'Al menos un campo debe ser proporcionado' });
    }

    // Si se actualiza rol, validar
    if (role) {
      const validRoles = ['admin', 'director', 'subdirector', 'teacher', 'student', 'parent'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({
          error: `Rol inválido. Roles válidos: ${validRoles.join(', ')}`
        });
      }
    }

    let query = 'UPDATE users SET';
    const params = [];

    if (name) {
      query += ' name = ?,';
      params.push(name);
    }
    if (role) {
      query += ' role = ?,';
      params.push(role);
    }
    if (status) {
      query += ' status = ?,';
      params.push(status);
    }
    if (phone) {
      query += ' phone = ?,';
      params.push(phone);
    }
    if (address) {
      query += ' address = ?,';
      params.push(address);
    }

    query = query.slice(0, -1) + ' WHERE id = ?';
    params.push(id);

    const [result] = await pool.query(query, params);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json({ success: true, message: 'Usuario actualizado' });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Error al actualizar usuario' });
  }
});

// DELETE /api/admin/users/:id - Eliminar usuario (soft delete)
router.delete('/users/:id', verifyToken, verifyRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;

    // Soft delete: marcar como inactivo
    const [result] = await pool.query(
      'UPDATE users SET status = ? WHERE id = ?',
      ['inactive', id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json({ success: true, message: 'Usuario desactivado' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Error al eliminar usuario' });
  }
});

// GET /api/admin/stats - Obtener estadísticas del sistema
router.get('/stats', verifyToken, verifyRole(['admin']), async (req, res) => {
  try {
    const [userStats] = await pool.query(
      `SELECT
        COUNT(*) as total_users,
        SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as admins,
        SUM(CASE WHEN role = 'director' THEN 1 ELSE 0 END) as directors,
        SUM(CASE WHEN role = 'subdirector' THEN 1 ELSE 0 END) as subdirectors,
        SUM(CASE WHEN role = 'teacher' THEN 1 ELSE 0 END) as teachers,
        SUM(CASE WHEN role = 'student' THEN 1 ELSE 0 END) as students,
        SUM(CASE WHEN role = 'parent' THEN 1 ELSE 0 END) as parents,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_users
      FROM users`
    );

    const [schoolStats] = await pool.query(
      `SELECT
        COUNT(*) as total_schools,
        (SELECT COUNT(*) FROM students) as total_students,
        (SELECT COUNT(*) FROM teachers) as total_teachers,
        (SELECT COUNT(*) FROM courses) as total_courses,
        (SELECT COUNT(*) FROM grades) as total_grades
      FROM schools`
    );

    res.json({
      success: true,
      data: {
        users: userStats[0],
        schools: schoolStats[0]
      }
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
});

// GET /api/admin/audit-logs - Ver logs de auditoría
router.get('/audit-logs', verifyToken, verifyRole(['admin']), async (req, res) => {
  try {
    const [logs] = await pool.query(
      `SELECT
        id,
        user_id,
        action,
        table_name,
        record_id,
        changes,
        created_at
      FROM audit_logs
      ORDER BY created_at DESC
      LIMIT 100`
    );

    res.json({ success: true, data: logs });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ error: 'Error al obtener logs de auditoría' });
  }
});

export default router;
