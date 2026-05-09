import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';

// Importar handlers de API
import alumnosHandler from './api/alumnos.js';
import docentesHandler from './api/docentes.js';
import authHandler from './api/auth.js';
import syncHandler from './api/sync.js';
import usersHandler from './api/users.js';

const app = express();
const PORT = 3001;

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(bodyParser.json());

// Helper para convertir query params
function parseQuery(req, res, next) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  req.query = Object.fromEntries(url.searchParams);
  next();
}
app.use(parseQuery);

// Rutas API
app.all('/api/alumnos', async (req, res) => {
  try { await alumnosHandler(req, res); }
  catch (e) { console.error('Alumnos API Error:', e); res.status(500).json({ error: e.message }); }
});

app.all('/api/docentes', async (req, res) => {
  try { await docentesHandler(req, res); }
  catch (e) { console.error('Docentes API Error:', e); res.status(500).json({ error: e.message }); }
});

app.all('/api/auth', async (req, res) => {
  try { await authHandler(req, res); }
  catch (e) { console.error('Auth API Error:', e); res.status(500).json({ error: e.message }); }
});

app.all('/api/sync', async (req, res) => {
  try { await syncHandler(req, res); }
  catch (e) { console.error('Sync API Error:', e); res.status(500).json({ error: e.message }); }
});

app.all('/api/users', async (req, res) => {
  try { await usersHandler(req, res); }
  catch (e) { console.error('Users API Error:', e); res.status(500).json({ error: e.message }); }
});

app.listen(PORT, () => {
  console.log(`🚀 API Server running on http://localhost:${PORT}`);
  console.log('📡 Conectado a Turso DB');
  console.log('💡 Este servidor solo maneja /api/* routes');
});
