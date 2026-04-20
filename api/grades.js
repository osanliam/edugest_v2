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
  // CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    verifyToken(req.headers.authorization);

    if (req.method === 'GET') {
      const { studentId } = req.query;

      let sql = 'SELECT * FROM grades ORDER BY created_at DESC';
      const params = [];

      if (studentId) {
        sql = 'SELECT * FROM grades WHERE student_id = ? ORDER BY created_at DESC';
        params.push(studentId);
      }

      const result = await query(sql, params);
      return res.status(200).json(result.rows || []);
    }

    if (req.method === 'POST') {
      const { student_id, teacher_id, subject, competence, instrument, score } = req.body;

      if (!student_id || !teacher_id || !subject) {
        return res.status(400).json({ error: 'Faltan campos requeridos' });
      }

      const id = `grade-${crypto.randomUUID()}`;

      await execute(
        'INSERT INTO grades (id, student_id, teacher_id, subject, competence, instrument, score) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [id, student_id, teacher_id, subject, competence || '', instrument || '', score || null]
      );

      return res.status(201).json({
        message: 'Calificación registrada',
        id,
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Grades API error:', error);

    if (error.message.includes('Token')) {
      return res.status(401).json({ error: error.message });
    }

    return res.status(500).json({ error: 'Internal server error' });
  }
}
