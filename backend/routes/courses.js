import express from 'express';
import pool from '../db.js';
import { verifyToken, verifyRole } from '../middleware/auth.js';
import { mockCourses } from '../mockData.js';

const router = express.Router();

// GET /api/courses - Obtener todos los cursos
router.get('/', verifyToken, async (req, res) => {
  try {
    const { school_id, grade_level } = req.query;

    try {
      let query = `SELECT
        c.id,
        c.school_id,
        c.name,
        c.code,
        c.grade_level,
        c.semester,
        c.credits,
        c.status,
        COUNT(DISTINCT e.student_id) as enrolled_students
      FROM courses c
      LEFT JOIN enrollments e ON c.id = e.course_id
      WHERE 1=1`;

      const params = [];

      if (school_id) {
        query += ' AND c.school_id = ?';
        params.push(school_id);
      }
      if (grade_level) {
        query += ' AND c.grade_level = ?';
        params.push(grade_level);
      }

      query += ' GROUP BY c.id ORDER BY c.grade_level, c.name LIMIT 200';

      const [rows] = await pool.query(query, params);

      res.json({ success: true, data: rows });
    } catch (dbError) {
      // Fallback a mock data
      let filtered = mockCourses;
      if (grade_level) {
        filtered = filtered.filter(c => c.grade_level.includes(grade_level));
      }
      res.json({ success: true, data: filtered });
    }
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({ error: 'Error al obtener cursos' });
  }
});

// GET /api/courses/:id - Obtener curso por ID
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.query(
      `SELECT
        c.id,
        c.school_id,
        c.name,
        c.code,
        c.grade_level,
        c.semester,
        c.credits,
        c.status,
        COUNT(DISTINCT e.student_id) as enrolled_students
      FROM courses c
      LEFT JOIN enrollments e ON c.id = e.course_id
      WHERE c.id = ?
      GROUP BY c.id`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Curso no encontrado' });
    }

    res.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error('Error fetching course:', error);
    res.status(500).json({ error: 'Error al obtener curso' });
  }
});

// POST /api/courses - Crear curso
router.post('/', verifyToken, verifyRole(['director', 'subdirector']), async (req, res) => {
  try {
    const { name, code, grade_level, semester, credits } = req.body;

    if (!name || !code || !grade_level) {
      return res.status(400).json({
        error: 'Campos requeridos: name, code, grade_level'
      });
    }

    const courseId = 'course-' + Date.now();

    await pool.query(
      'INSERT INTO courses (id, school_id, name, code, grade_level, semester, credits, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [courseId, 'school-001', name, code, grade_level, semester || 'I', credits || 4, 'active']
    );

    res.status(201).json({
      success: true,
      message: 'Curso creado exitosamente',
      data: { id: courseId }
    });
  } catch (error) {
    console.error('Error creating course:', error);
    res.status(500).json({ error: 'Error al crear curso' });
  }
});

// PUT /api/courses/:id - Actualizar curso
router.put('/:id', verifyToken, verifyRole(['director', 'subdirector']), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, semester, credits, status } = req.body;

    let query = 'UPDATE courses SET';
    const params = [];

    if (name) {
      query += ' name = ?,';
      params.push(name);
    }
    if (semester) {
      query += ' semester = ?,';
      params.push(semester);
    }
    if (credits) {
      query += ' credits = ?,';
      params.push(credits);
    }
    if (status) {
      query += ' status = ?,';
      params.push(status);
    }

    if (params.length === 0) {
      return res.status(400).json({ error: 'Al menos un campo debe ser proporcionado' });
    }

    query = query.slice(0, -1) + ' WHERE id = ?';
    params.push(id);

    const [result] = await pool.query(query, params);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Curso no encontrado' });
    }

    res.json({ success: true, message: 'Curso actualizado' });
  } catch (error) {
    console.error('Error updating course:', error);
    res.status(500).json({ error: 'Error al actualizar curso' });
  }
});

export default router;
