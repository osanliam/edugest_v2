import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backupFile = '/sessions/dazzling-zen-fermat/mnt/Downloads/Último backup/19 de abril/EduGest_backup_2026-04-19.json';
const dbFile = path.join(__dirname, 'data.json');

const backup = JSON.parse(fs.readFileSync(backupFile, 'utf-8'));

let db = { users: [], grades: [], schools: [] };

// Estudiantes
if (backup.students) {
  db.users.push(...backup.students.map(s => ({
    id: s.id || 'student-' + Math.random(),
    name: s.name || 'Sin nombre',
    email: s.code ? `${s.code}@estudiantes.edu` : `student${Math.random()}@est.edu`,
    password: 'student123',
    role: 'student',
    status: 'active',
    code: s.code
  })));
  console.log('✅ ' + backup.students.length + ' estudiantes');
}

// Docentes
if (backup.teachers) {
  db.users.push(...backup.teachers.map(t => ({
    id: t.id || 'teacher-' + Math.random(),
    name: t.name || 'Sin nombre',
    email: t.email || `teacher${Math.random()}@doc.edu`,
    password: 'teacher123',
    role: 'teacher',
    status: 'active'
  })));
  console.log('✅ ' + backup.teachers.length + ' docentes');
}

// Usuarios
if (backup.users) {
  db.users.push(...backup.users.map(u => ({
    id: u.id || 'user-' + Math.random(),
    name: u.name || 'Sin nombre',
    email: u.email || `user${Math.random()}@edu.edu`,
    password: u.password || 'admin123',
    role: u.role || 'parent',
    status: 'active'
  })));
  console.log('✅ ' + backup.users.length + ' usuarios');
}

// Calificaciones (grades es objeto clave:valor)
if (backup.grades && typeof backup.grades === 'object') {
  const gradesArray = Object.entries(backup.grades).map(([key, value]) => {
    const [studentId, comp, ...rest] = key.split('|');
    return {
      id: key,
      student_id: studentId,
      competence: comp,
      period: 'Abril 2026',
      value: value,
      subject: 'Comunicación'
    };
  });
  db.grades.push(...gradesArray);
  console.log('✅ ' + gradesArray.length + ' calificaciones');
}

fs.writeFileSync(dbFile, JSON.stringify(db, null, 2));
console.log('\n📊 MIGRACIÓN COMPLETADA');
console.log('👥 Total usuarios: ' + db.users.length);
console.log('📊 Total calificaciones: ' + db.grades.length);
