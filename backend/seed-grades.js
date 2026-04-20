import { db, save } from './db.js';

// Obtener IDs de estudiantes
const estudiantes = db.users.filter(u => u.role === 'student');

// Datos de calificaciones
const calificaciones = [
  {
    student_id: estudiantes[0]?.id,
    period: 'Abril 2026',
    subject: 'Comunicación',
    competencies: {
      comp1: { nombre: 'Lee textos diversos', calificativo: 'A', porcentaje: 100 },
      comp2: { nombre: 'Produce textos escritos', calificativo: 'A', porcentaje: 100 },
      comp3: { nombre: 'Interactúa oralmente', calificativo: 'B', porcentaje: 85 }
    },
    average: 18.5
  },
  {
    student_id: estudiantes[1]?.id,
    period: 'Abril 2026',
    subject: 'Comunicación',
    competencies: {
      comp1: { nombre: 'Lee textos diversos', calificativo: 'B', porcentaje: 85 },
      comp2: { nombre: 'Produce textos escritos', calificativo: 'A', porcentaje: 100 },
      comp3: { nombre: 'Interactúa oralmente', calificativo: 'A', porcentaje: 100 }
    },
    average: 18.3
  }
];

db.grades = calificaciones.map((c, i) => ({
  id: 'grade-' + (1000 + i),
  ...c
}));

save();
console.log('✅ ' + db.grades.length + ' calificaciones cargadas');
console.log('Estudiantes:', estudiantes.length);
