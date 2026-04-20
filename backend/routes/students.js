import express from 'express';
import pool from '../db.js';
import { verifyToken, verifyRole } from '../middleware/auth.js';
import { mockStudents } from '../mockData.js';

const router = express.Router();

// GET /api/students - Obtener todos los estudiantes
router.get('/', verifyToken, verifyRole(['director', 'subdirector', 'teacher']), async (req, res) => {
  try {
    try {
      const [rows] = await pool.query(
        `SELECT
          s.id,
          s.enrollment_number,
          s.grade_level,
          s.section,
          s.status,
          u.name,
          u.email
        FROM students s
        JOIN users u ON s.user_id = u.id
        LIMIT 100`
      );
      res.json({ success: true, data: rows });
    } catch (dbError) {
      console.log('BD no disponible, usando MOCK DATA');
      res.json({ success: true, data: mockStudents });
    }
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ error: 'Error al obtener estudiantes' });
  }
});

// GET /api/students/:id - Obtener estudiante por ID
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    try {
      const [rows] = await pool.query(
        `SELECT
          s.id,
          s.enrollment_number,
          s.grade_level,
          s.section,
          s.status,
          u.name,
          u.email
        FROM students s
        JOIN users u ON s.user_id = u.id
        WHERE s.id = ?`,
        [id]
      );

      if (rows.length === 0) {
        return res.status(404).json({ error: 'Estudiante no encontrado' });
      }

      res.json({ success: true, data: rows[0] });
    } catch (dbError) {
      // Mock data fallback
      const student = mockStudents.find(s => s.id === id);
      if (!student) {
        return res.status(404).json({ error: 'Estudiante no encontrado' });
      }
      res.json({ success: true, data: student });
    }
  } catch (error) {
    console.error('Error fetching student:', error);
    res.status(500).json({ error: 'Error al obtener estudiante' });
  }
});

// POST /api/students - Crear estudiante
router.post('/', verifyToken, verifyRole(['director', 'subdirector']), async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const { email, name, enrollment_number, grade_level, section, password } = req.body;

    // Validar entrada
    if (!email || !name || !enrollment_number || !grade_level || !section) {
      return res.status(400).json({ error: 'Campos requeridos: email, name, enrollment_number, grade_level, section' });
    }

    // Iniciar transacción
    await connection.beginTransaction();

    // Crear usuario
    const userId = 'user-' + Date.now();
    const studentId = 'student-' + Date.now();

    await connection.query(
      'INSERT INTO users (id, school_id, name, email, password_hash, role, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [userId, 'school-001', name, email, 'hashed_' + password, 'student', 'active']
    );

    // Crear estudiante
    await connection.query(
      'INSERT INTO students (id, user_id, school_id, enrollment_number, grade_level, section, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [studentId, userId, 'school-001', enrollment_number, grade_level, section, 'active']
    );

    // Confirmar transacción
    await connection.commit();

    res.status(201).json({
      success: true,
      message: 'Estudiante creado exitosamente',
      data: { id: studentId, user_id: userId }
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error creating student:', error);
    res.status(500).json({ error: 'Error al crear estudiante' });
  } finally {
    connection.release();
  }
});

// PUT /api/students/:id - Actualizar estudiante
router.put('/:id', verifyToken, verifyRole(['director', 'subdirector']), async (req, res) => {
  try {
    const { id } = req.params;
    const { grade_level, section, status } = req.body;

    if (!grade_level && !section && !status) {
      return res.status(400).json({ error: 'Al menos un campo debe ser proporcionado' });
    }

    let query = 'UPDATE students SET';
    const params = [];

    if (grade_level) {
      query += ' grade_level = ?,';
      params.push(grade_level);
    }
    if (section) {
      query += ' section = ?,';
      params.push(section);
    }
    if (status) {
      query += ' status = ?,';
      params.push(status);
    }

    query = query.slice(0, -1) + ' WHERE id = ?';
    params.push(id);

    const [result] = await pool.query(query, params);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Estudiante no encontrado' });
    }

    res.json({ success: true, message: 'Estudiante actualizado' });
  } catch (error) {
    console.error('Error updating student:', error);
    res.status(500).json({ error: 'Error al actualizar estudiante' });
  }
});

// DELETE /api/students/:id - Eliminar estudiante
router.delete('/:id', verifyToken, verifyRole(['director']), async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.query('DELETE FROM students WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Estudiante no encontrado' });
    }

    res.json({ success: true, message: 'Estudiante eliminado' });
  } catch (error) {
    console.error('Error deleting student:', error);
    res.status(500).json({ error: 'Error al eliminar estudiante' });
  }
});

export default router;
