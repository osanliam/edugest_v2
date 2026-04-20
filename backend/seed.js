import { db, save } from './db.js';

const usuarios = [
  { nombre: 'Administrador Sistema', email: 'admin@sistemita.edu', password: 'admin123', rol: 'admin' },
  { nombre: 'Juan Pérez García', email: 'juan.perez@sistemita.edu', password: 'teacher123', rol: 'teacher' },
  { nombre: 'María López Rodríguez', email: 'maria.lopez@sistemita.edu', password: 'teacher123', rol: 'teacher' },
  { nombre: 'Carlos Méndez Gómez', email: 'carlos.mendez@estudiantes.edu', password: 'student123', rol: 'student' },
  { nombre: 'Ana Martínez Silva', email: 'ana.martinez@estudiantes.edu', password: 'student123', rol: 'student' },
  { nombre: 'Pedro Hernández Flores', email: 'pedro.hernandez@apoderados.edu', password: 'parent123', rol: 'parent' }
];

db.users = usuarios.map((u, i) => ({
  id: 'user-' + (1000 + i),
  name: u.nombre,
  email: u.email,
  password: u.password,
  role: u.rol,
  status: 'active'
}));

save();
console.log('✅ ' + db.users.length + ' usuarios cargados en data.json');
