import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import path from 'path';
import { fileURLToPath } from 'url';
import { db, save } from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = 3000;
const JWT_SECRET = 'tu-secreto-super-seguro-2026';

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../dist')));

app.post('/api/auth/login', (req, res) => {
  const { usuario, email, password } = req.body;
  const loginField = usuario || email;
  const user = db.users.find(u => u.email === loginField && u.password === password);
  if (!user) return res.status(401).json({ error: 'Credenciales inválidas' });
  const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});

const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token requerido' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido' });
  }
};

app.get('/api/users', authMiddleware, (req, res) => {
  res.json(db.users.map(u => ({ id: u.id, name: u.name, email: u.email, role: u.role })));
});

app.post('/api/users', authMiddleware, (req, res) => {
  const { name, email, password, role } = req.body;
  const user = { id: 'user-' + Date.now(), name, email, password, role, status: 'active' };
  db.users.push(user);
  save();
  res.status(201).json({ message: 'Usuario creado', id: user.id });
});

app.get('/api/grades/all', authMiddleware, (req, res) => {
  res.json(db.grades);
});

app.get('/api/grades/:studentId', authMiddleware, (req, res) => {
  const grades = db.grades.filter(g => g.student_id === req.params.studentId);
  res.json(grades);
});

app.post('/api/grades', authMiddleware, (req, res) => {
  const grade = { id: 'grade-' + Date.now(), ...req.body };
  db.grades.push(grade);
  save();
  res.status(201).json({ message: 'Calificación registrada', id: grade.id });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', users: db.users.length, grades: db.grades.length });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Servidor escuchando en puerto ${PORT}`);
  console.log(`Accede desde: http://<tu-ip>:${PORT}`);
});

server.on('error', (err) => {
  console.error('Error del servidor:', err);
  process.exit(1);
});
