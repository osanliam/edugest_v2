import express from 'express';
import pool from '../db.js';
import { verifyToken, verifyRole } from '../middleware/auth.js';
import { mockAttendance } from '../mockData.js';

const router = express.Router();

// GET /api/attendance - Obtener asistencia
router.get('/', verifyToken, async (req, res) => {
  try {
    const { student_id, course_id, start_date, end_date } = req.query;

    try {
      let query = `SELECT
        a.id,
        a.student_id,
        a.course_id,
        a.date,
        a.status,
        a.recorded_date,
        s.enrollment_number,
        c.name AS course_name
      FROM attendance a
      JOIN students s ON a.student_id = s.id
      JOIN courses c ON a.course_id = c.id
      WHERE 1=1`;

      const params = [];

      if (student_id) {
        query += ' AND a.student_id = ?';
        params.push(student_id);
      }
      if (course_id) {
        query += ' AND a.course_id = ?';
        params.push(course_id);
      }
      if (start_date) {
        query += ' AND a.date >= ?';
        params.push(start_date);
      }
      if (end_date) {
        query += ' AND a.date <= ?';
        params.push(end_date);
      }

      query += ' ORDER BY a.date DESC LIMIT 500';

      const [rows] = await pool.query(query, params);

      res.json({ success: true, data: rows });
    } catch (dbError) {
      // Fallback a mock data
      let filtered = mockAttendance;
      if (student_id) {
        filtered = filtered.filter(a => a.student_id === student_id);
      }
      if (course_id) {
        filtered = filtered.filter(a => a.course_id === course_id);
      }
      res.json({ success: true, data: filtered });
    }
  } catch (error) {
    console.error('Error fetching attendance:', error);
    res.status(500).json({ error: 'Error al obtener asistencia' });
  }
});

// GET /api/attendance/:id - Obtener registro de asistencia por ID
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.query(
      `SELECT
        a.id,
        a.student_id,
        a.course_id,
        a.date,
        a.status,
        a.recorded_date,
        s.enrollment_number,
        c.name AS course_name
      FROM attendance a
      JOIN students s ON a.student_id = s.id
      JOIN courses c ON a.course_id = c.id
      WHERE a.id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Registro de asistencia no encontrado' });
    }

    res.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error('Error fetching attendance record:', error);
    res.status(500).json({ error: 'Error al obtener asistencia' });
  }
});

// POST /api/attendance - Registrar asistencia
router.post('/', verifyToken, verifyRole(['teacher', 'director', 'subdirector']), async (req, res) => {
  try {
    const { student_id, course_id, date, status } = req.body;

    // Validar entrada
    if (!student_id || !course_id || !date || !status) {
      return res.status(400).json({
        error: 'Campos requeridos: student_id, course_id, date, status'
      });
    }

    // Validar estado (presente, ausente, tarde)
    const validStatuses = ['present', 'absent', 'late'];
    if (!validStatuses.includes(status.toLowerCase())) {
      return res.status(400).json({
        error: `Status debe ser uno de: ${validStatuses.join(', ')}`
      });
    }

    const attendanceId = 'attendance-' + Date.now();

    await pool.query(
      'INSERT INTO attendance (id, student_id, course_id, date, status, recorded_date) VALUES (?, ?, ?, ?, ?, NOW())',
      [attendanceId, student_id, course_id, date, status.toLowerCase()]
    );

    res.status(201).json({
      success: true,
      message: 'Asistencia registrada exitosamente',
      data: { id: attendanceId }
    });
  } catch (error) {
    console.error('Error creating attendance:', error);
    res.status(500).json({ error: 'Error al registrar asistencia' });
  }
});

// PUT /api/attendance/:id - Actualizar asistencia
router.put('/:id', verifyToken, verifyRole(['teacher', 'director', 'subdirector']), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status es requerido' });
    }

    const validStatuses = ['present', 'absent', 'late'];
    if (!validStatuses.includes(status.toLowerCase())) {
      return res.status(400).json({
        error: `Status debe ser uno de: ${validStatuses.join(', ')}`
      });
    }

    const [result] = await pool.query(
      'UPDATE attendance SET status = ? WHERE id = ?',
      [status.toLowerCase(), id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Registro de asistencia no encontrado' });
    }

    res.json({ success: true, message: 'Asistencia actualizada' });
  } catch (error) {
    console.error('Error updating attendance:', error);
    res.status(500).json({ error: 'Error al actualizar asistencia' });
  }
});

// GET /api/attendance/stats/:student_id - Obtener estadísticas de asistencia
router.get('/stats/:student_id', verifyToken, async (req, res) => {
  try {
    const { student_id } = req.params;

    const [stats] = await pool.query(
      `SELECT
        COUNT(*) as total_days,
        SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as days_present,
        SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as days_absent,
        SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) as days_late,
        ROUND(SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) * 100 / COUNT(*), 2) as attendance_rate
      FROM attendance
      WHERE student_id = ?`,
      [student_id]
    );

    res.json({ success: true, data: stats[0] });
  } catch (error) {
    console.error('Error fetching attendance stats:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
});

export default router;
