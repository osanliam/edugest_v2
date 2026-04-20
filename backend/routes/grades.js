import express from 'express';
import pool from '../db.js';
import { verifyToken, verifyRole } from '../middleware/auth.js';
import { mockGrades } from '../mockData.js';

const router = express.Router();

// GET /api/grades - Obtener calificaciones
router.get('/', verifyToken, async (req, res) => {
  try {
    const { student_id, course_id, teacher_id } = req.query;

    try {
      let query = `SELECT
        g.id,
        g.student_id,
        g.course_id,
        g.teacher_id,
        g.period,
        g.score,
        g.recorded_date,
        s.enrollment_number,
        c.name AS course_name,
        t.name AS teacher_name
      FROM grades g
      JOIN students s ON g.student_id = s.id
      JOIN courses c ON g.course_id = c.id
      LEFT JOIN teachers t ON g.teacher_id = t.id
      WHERE 1=1`;

      const params = [];

      if (student_id) {
        query += ' AND g.student_id = ?';
        params.push(student_id);
      }
      if (course_id) {
        query += ' AND g.course_id = ?';
        params.push(course_id);
      }
      if (teacher_id) {
        query += ' AND g.teacher_id = ?';
        params.push(teacher_id);
      }

      query += ' LIMIT 500';

      const [rows] = await pool.query(query, params);

      res.json({ success: true, data: rows });
    } catch (dbError) {
      // Fallback a mock data
      let filtered = mockGrades;
      if (student_id) {
        filtered = filtered.filter(g => g.student_id === student_id);
      }
      if (course_id) {
        filtered = filtered.filter(g => g.course_id === course_id);
      }
      if (teacher_id) {
        filtered = filtered.filter(g => g.teacher_id === teacher_id);
      }
      res.json({ success: true, data: filtered });
    }
  } catch (error) {
    console.error('Error fetching grades:', error);
    res.status(500).json({ error: 'Error al obtener calificaciones' });
  }
});

// GET /api/grades/:id - Obtener calificación por ID
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.query(
      `SELECT
        g.id,
        g.student_id,
        g.course_id,
        g.teacher_id,
        g.period,
        g.score,
        g.recorded_date,
        s.enrollment_number,
        c.name AS course_name,
        t.name AS teacher_name
      FROM grades g
      JOIN students s ON g.student_id = s.id
      JOIN courses c ON g.course_id = c.id
      LEFT JOIN teachers t ON g.teacher_id = t.id
      WHERE g.id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Calificación no encontrada' });
    }

    res.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error('Error fetching grade:', error);
    res.status(500).json({ error: 'Error al obtener calificación' });
  }
});

// POST /api/grades - Crear calificación
router.post('/', verifyToken, verifyRole(['teacher', 'director', 'subdirector']), async (req, res) => {
  try {
    const { student_id, course_id, teacher_id, period, score } = req.body;

    // Validar entrada
    if (!student_id || !course_id || !period || score === undefined) {
      return res.status(400).json({
        error: 'Campos requeridos: student_id, course_id, period, score'
      });
    }

    // Validar rango de puntuación
    if (score < 0 || score > 20) {
      return res.status(400).json({ error: 'La calificación debe estar entre 0 y 20' });
    }

    const gradeId = 'grade-' + Date.now();

    await pool.query(
      'INSERT INTO grades (id, student_id, course_id, teacher_id, period, score, recorded_date) VALUES (?, ?, ?, ?, ?, ?, NOW())',
      [gradeId, student_id, course_id, teacher_id || null, period, score]
    );

    res.status(201).json({
      success: true,
      message: 'Calificación registrada exitosamente',
      data: { id: gradeId }
    });
  } catch (error) {
    console.error('Error creating grade:', error);
    res.status(500).json({ error: 'Error al registrar calificación' });
  }
});

// PUT /api/grades/:id - Actualizar calificación
router.put('/:id', verifyToken, verifyRole(['teacher', 'director', 'subdirector']), async (req, res) => {
  try {
    const { id } = req.params;
    const { score, period } = req.body;

    if (score === undefined && !period) {
      return res.status(400).json({ error: 'Al menos score o period debe ser proporcionado' });
    }

    if (score !== undefined && (score < 0 || score > 20)) {
      return res.status(400).json({ error: 'La calificación debe estar entre 0 y 20' });
    }

    let query = 'UPDATE grades SET';
    const params = [];

    if (score !== undefined) {
      query += ' score = ?,';
      params.push(score);
    }
    if (period) {
      query += ' period = ?,';
      params.push(period);
    }

    query = query.slice(0, -1) + ' WHERE id = ?';
    params.push(id);

    const [result] = await pool.query(query, params);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Calificación no encontrada' });
    }

    res.json({ success: true, message: 'Calificación actualizada' });
  } catch (error) {
    console.error('Error updating grade:', error);
    res.status(500).json({ error: 'Error al actualizar calificación' });
  }
});

export default router;
