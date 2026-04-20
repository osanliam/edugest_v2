import { query } from '../lib/turso.js';

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const usersResult = await query('SELECT COUNT(*) as count FROM users');
    const gradesResult = await query('SELECT COUNT(*) as count FROM grades');

    const status = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: 'Turso (SQLite)',
      users: usersResult.rows[0]?.count || 0,
      grades: gradesResult.rows[0]?.count || 0,
      environment: process.env.NODE_ENV || 'development',
    };

    return res.status(200).json(status);
  } catch (error) {
    console.error('Health check error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Database connection failed',
      error: error.message,
    });
  }
}
