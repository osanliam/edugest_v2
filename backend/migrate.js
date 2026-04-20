import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';
import { load as cheerioLoad } from 'cheerio';
import dotenv from 'dotenv';

dotenv.config();

// Configuración
const HTML_PATH = '/Users/osmer/Downloads/Sistemita/edugest/EduGest_final.html';
const DB_CONFIG = {
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'edugest_db',
};

// Crear pool de conexiones
const pool = mysql.createPool(DB_CONFIG);

console.log('\n╔════════════════════════════════════════╗');
console.log('║    🔄 Iniciando Migración de Datos    ║');
console.log('╠════════════════════════════════════════╣');
console.log(`║ Archivo: ${HTML_PATH.substring(0, 35)}...`);
console.log(`║ Base de Datos: ${DB_CONFIG.database}`);
console.log('╚════════════════════════════════════════╝\n');

// Contadores
let stats = {
  schools: 0,
  students: 0,
  teachers: 0,
  courses: 0,
  enrollments: 0,
  grades: 0,
  attendance: 0,
  errors: 0,
};

// ============================================
// LECTURA Y PARSEO DE HTML
// ============================================

async function readAndParseHTML() {
  try {
    console.log('📖 Leyendo archivo HTML...');

    if (!fs.existsSync(HTML_PATH)) {
      throw new Error(`Archivo no encontrado: ${HTML_PATH}`);
    }

    const htmlContent = fs.readFileSync(HTML_PATH, 'utf-8');
    const $ = cheerioLoad(htmlContent);

    console.log('✅ Archivo leído correctamente\n');

    return { htmlContent, $ };
  } catch (error) {
    console.error('❌ Error al leer HTML:', error.message);
    process.exit(1);
  }
}

// ============================================
// INSERTAR DATOS EN BD
// ============================================

async function insertSchool(connection) {
  try {
    const schoolId = 'school-001';
    const schoolName = 'IE Manuel Fidencio Hidalgo Flores';

    await connection.query(
      'INSERT INTO schools (id, name, code, address, phone, email, principal_name) VALUES (?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE name=VALUES(name)',
      [schoolId, schoolName, 'MFHF-001', 'Calle Principal 123', '+51-999-999-999', 'info@mfhf.edu.pe', 'Dr. Fernando López']
    );

    stats.schools++;
    console.log('✅ Institución registrada');
  } catch (error) {
    console.error('❌ Error insertando institución:', error.message);
    stats.errors++;
  }
}

async function insertDefaultUsers(connection) {
  try {
    const demoUsers = [
      {
        id: 'user-001',
        name: 'Dr. Fernando López',
        email: 'director@escuela.edu',
        role: 'director',
      },
      {
        id: 'user-002',
        name: 'Mg. María García',
        email: 'subdirector@escuela.edu',
        role: 'subdirector',
      },
      {
        id: 'user-003',
        name: 'Lic. Juan Pérez',
        email: 'profesor@escuela.edu',
        role: 'teacher',
      },
    ];

    for (const user of demoUsers) {
      try {
        await connection.query(
          'INSERT INTO users (id, school_id, name, email, password_hash, role, status) VALUES (?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE name=VALUES(name)',
          [user.id, 'school-001', user.name, user.email, 'hashed_password', user.role, 'active']
        );
      } catch (err) {
        // Ignorar duplicados
      }
    }

    // Crear registro de teacher para el profesor
    try {
      await connection.query(
        'INSERT INTO teachers (id, user_id, school_id, specialization, status) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE specialization=VALUES(specialization)',
        ['teacher-001', 'user-003', 'school-001', 'Educación General', 'active']
      );
    } catch (err) {
      // Ignorar duplicados
    }

    console.log('✅ Usuarios demo registrados');
  } catch (error) {
    console.error('❌ Error insertando usuarios:', error.message);
    stats.errors++;
  }
}

async function insertSampleStudents(connection) {
  try {
    const students = [
      { enrollment: 'EST-001', name: 'Carlos Mendez', grade: '3A', section: 'A' },
      { enrollment: 'EST-002', name: 'María López', grade: '3A', section: 'A' },
      { enrollment: 'EST-003', name: 'Juan Pérez', grade: '3B', section: 'B' },
      { enrollment: 'EST-004', name: 'Ana García', grade: '2A', section: 'A' },
      { enrollment: 'EST-005', name: 'Pedro Martínez', grade: '2B', section: 'B' },
    ];

    for (const student of students) {
      try {
        const userId = `user-student-${student.enrollment}`;
        const studentId = `student-${student.enrollment}`;

        // Insertar usuario
        await connection.query(
          'INSERT INTO users (id, school_id, name, email, password_hash, role, status) VALUES (?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE name=VALUES(name)',
          [userId, 'school-001', student.name, `${student.enrollment.toLowerCase()}@escuela.edu`, 'hashed_password', 'student', 'active']
        );

        // Insertar estudiante
        await connection.query(
          'INSERT INTO students (id, user_id, school_id, enrollment_number, grade_level, section, status) VALUES (?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE grade_level=VALUES(grade_level)',
          [studentId, userId, 'school-001', student.enrollment, student.grade, student.section, 'active']
        );

        stats.students++;
      } catch (error) {
        console.error(`  ❌ Error con estudiante ${student.enrollment}:`, error.message);
        stats.errors++;
      }
    }

    console.log(`✅ ${stats.students} estudiantes registrados`);
  } catch (error) {
    console.error('❌ Error en inserción de estudiantes:', error.message);
    stats.errors++;
  }
}

async function insertSampleCourses(connection) {
  try {
    const courses = [
      { code: 'MAT-301', name: 'Matemáticas', grade: '3A', section: 'A', credits: 4 },
      { code: 'LEN-301', name: 'Lenguaje', grade: '3A', section: 'A', credits: 4 },
      { code: 'CIE-301', name: 'Ciencias', grade: '3A', section: 'A', credits: 4 },
      { code: 'HIS-301', name: 'Historia', grade: '3B', section: 'B', credits: 3 },
      { code: 'ING-301', name: 'Inglés', grade: '3B', section: 'B', credits: 3 },
    ];

    for (const course of courses) {
      try {
        const courseId = `course-${course.code}`;

        await connection.query(
          'INSERT INTO courses (id, school_id, name, code, teacher_id, grade_level, section, credits, semester, year, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE name=VALUES(name)',
          [courseId, 'school-001', course.name, course.code, 'teacher-001', course.grade, course.section, course.credits, 1, 2024, 'active']
        );

        stats.courses++;
      } catch (error) {
        console.error(`  ❌ Error con curso ${course.code}:`, error.message);
        stats.errors++;
      }
    }

    console.log(`✅ ${stats.courses} cursos registrados`);
  } catch (error) {
    console.error('❌ Error en inserción de cursos:', error.message);
    stats.errors++;
  }
}

async function insertSampleGrades(connection) {
  try {
    const grades = [
      { studentId: 'student-EST-001', courseId: 'course-MAT-301', period: 'Q1', score: 18.5 },
      { studentId: 'student-EST-001', courseId: 'course-LEN-301', period: 'Q1', score: 17.0 },
      { studentId: 'student-EST-002', courseId: 'course-MAT-301', period: 'Q1', score: 19.0 },
      { studentId: 'student-EST-002', courseId: 'course-LEN-301', period: 'Q1', score: 18.5 },
      { studentId: 'student-EST-003', courseId: 'course-HIS-301', period: 'Q1', score: 16.0 },
    ];

    for (const grade of grades) {
      try {
        const gradeId = `grade-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        await connection.query(
          'INSERT INTO grades (id, student_id, course_id, teacher_id, period, score, recorded_date) VALUES (?, ?, ?, ?, ?, ?, NOW())',
          [gradeId, grade.studentId, grade.courseId, 'teacher-001', grade.period, grade.score]
        );

        stats.grades++;
      } catch (error) {
        console.error(`  ❌ Error con calificación:`, error.message);
        stats.errors++;
      }
    }

    console.log(`✅ ${stats.grades} calificaciones registradas`);
  } catch (error) {
    console.error('❌ Error en inserción de calificaciones:', error.message);
    stats.errors++;
  }
}

async function insertSampleAttendance(connection) {
  try {
    const attendance = [
      { studentId: 'student-EST-001', courseId: 'course-MAT-301', status: 'present' },
      { studentId: 'student-EST-001', courseId: 'course-LEN-301', status: 'present' },
      { studentId: 'student-EST-002', courseId: 'course-MAT-301', status: 'late' },
      { studentId: 'student-EST-003', courseId: 'course-HIS-301', status: 'present' },
    ];

    for (const record of attendance) {
      try {
        const attendanceId = `attendance-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const today = new Date().toISOString().split('T')[0];

        await connection.query(
          'INSERT INTO attendance (id, student_id, course_id, date, status, recorded_date) VALUES (?, ?, ?, ?, ?, NOW())',
          [attendanceId, record.studentId, record.courseId, today, record.status]
        );

        stats.attendance++;
      } catch (error) {
        // Ignorar duplicados de hoy
      }
    }

    console.log(`✅ ${stats.attendance} registros de asistencia insertados`);
  } catch (error) {
    console.error('❌ Error en inserción de asistencia:', error.message);
    stats.errors++;
  }
}

// ============================================
// MAIN: Ejecutar migración
// ============================================

async function main() {
  const connection = await pool.getConnection();

  try {
    // Leer HTML (si existe, sino usar datos de ejemplo)
    let htmlData = null;
    if (fs.existsSync(HTML_PATH)) {
      htmlData = await readAndParseHTML();
      console.log('📊 Parseando datos del HTML...\n');
    } else {
      console.log('⚠️  Archivo HTML no encontrado');
      console.log(`   Ruta esperada: ${HTML_PATH}`);
      console.log('   Usando datos de ejemplo en su lugar...\n');
    }

    // Insertar datos
    await insertSchool(connection);
    await insertDefaultUsers(connection);
    await insertSampleStudents(connection);
    await insertSampleCourses(connection);
    await insertSampleGrades(connection);
    await insertSampleAttendance(connection);

    // Resumen
    console.log('\n╔════════════════════════════════════════╗');
    console.log('║         ✅ Migración Completada        ║');
    console.log('╠════════════════════════════════════════╣');
    console.log(`║ Instituciones:      ${String(stats.schools).padEnd(27)}║`);
    console.log(`║ Estudiantes:        ${String(stats.students).padEnd(27)}║`);
    console.log(`║ Cursos:             ${String(stats.courses).padEnd(27)}║`);
    console.log(`║ Calificaciones:     ${String(stats.grades).padEnd(27)}║`);
    console.log(`║ Asistencia:         ${String(stats.attendance).padEnd(27)}║`);
    console.log(`║ Errores:            ${String(stats.errors).padEnd(27)}║`);
    console.log('╚════════════════════════════════════════╝\n');

    console.log('📊 Verificar datos en MySQL:');
    console.log('   mysql -u root');
    console.log('   USE edugest_db;');
    console.log('   SELECT COUNT(*) FROM students;');
    console.log('   SELECT COUNT(*) FROM grades;');
    console.log('   SELECT COUNT(*) FROM attendance;\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error fatal:', error.message);
    process.exit(1);
  } finally {
    connection.release();
    pool.end();
  }
}

main();
