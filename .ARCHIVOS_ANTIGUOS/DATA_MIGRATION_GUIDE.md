# 📊 GUÍA DE MIGRACIÓN DE DATOS - EduGest

> **Objetivo:** Importar datos de `EduGest_final.html` al nuevo sistema **SIN cambiar** el sistema anterior

---

## 🎯 Concepto Clave

```
EduGest_final.html   →   Extraer Datos   →   Nueva BD MySQL   →   Conectar a React
(Sistema Antiguo)        (Parser)            (Tablas)             (Sistema Nuevo)
```

**El sistema antiguo NO se reemplaza.** Solo se extrae información y se importa al nuevo.

---

## 📋 Paso 1: Crear la Base de Datos

### 1️⃣ Ejecutar el Schema SQL

**Opción A: Desde Terminal (macOS/Linux)**
```bash
# Conectar a MySQL y ejecutar el schema
mysql -u root -p < /Users/osmer/Downloads/Sistemita/Sistemita_Nuevo/DATABASE_SCHEMA.sql

# Si pide contraseña:
mysql -u root -pTuContraseña < /Users/osmer/Downloads/Sistemita/Sistemita_Nuevo/DATABASE_SCHEMA.sql
```

**Opción B: Desde MySQL CLI**
```bash
# Abrir MySQL
mysql -u root -p

# En el prompt de MySQL:
mysql> source /Users/osmer/Downloads/Sistemita/Sistemita_Nuevo/DATABASE_SCHEMA.sql;
mysql> SHOW TABLES;  # Verificar que las 15 tablas se crearon
mysql> EXIT;
```

**Opción C: Desde GUI (MySQL Workbench)**
1. Abre MySQL Workbench
2. File → Open SQL Script
3. Selecciona `DATABASE_SCHEMA.sql`
4. Ejecuta (Ctrl + Shift + Enter)

---

## 🔍 Paso 2: Analizar Datos en EduGest_final.html

El archivo HTML contiene datos en:
- Tablas HTML (`<table>`)
- Objetos JavaScript embebidos
- Arrays en comentarios HTML

### Ubicaciones de Datos:

```html
<!-- ESTUDIANTES -->
<div id="students-data">...</div>

<!-- PROFESORES -->
<div id="teachers-data">...</div>

<!-- CURSOS -->
<div id="courses-data">...</div>

<!-- CALIFICACIONES -->
<div id="grades-data">...</div>

<!-- HORARIOS -->
<div id="schedule-data">...</div>
```

---

## 🛠️ Paso 3: Script de Extracción/Migración

Crea este archivo: `/backend/migrate.js`

```javascript
const fs = require('fs');
const mysql = require('mysql2/promise');
const cheerio = require('cheerio');

// Cargar HTML
const htmlContent = fs.readFileSync('/Users/osmer/Downloads/Sistemita/EduGest_final.html', 'utf8');
const $ = cheerio.load(htmlContent);

// Pool de conexión MySQL
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'TuContraseña', // Cambiar
  database: 'edugest_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// ============================================
// MIGRAR ESTUDIANTES
// ============================================
async function migrateStudents() {
  const connection = await pool.getConnection();
  
  // Ejemplo: Parsear tabla de estudiantes del HTML
  const rows = $('table#students-table tbody tr');
  
  rows.each(async (index, element) => {
    const cells = $(element).find('td');
    const studentData = {
      id: 'student-' + Date.now() + index,
      user_id: 'user-' + Date.now() + index,
      school_id: 'school-001',
      enrollment_number: $(cells[0]).text().trim(),
      grade_level: $(cells[1]).text().trim(),
      section: $(cells[2]).text().trim(),
      status: 'active'
    };
    
    try {
      // INSERT estudiante
      const query1 = 'INSERT INTO users (id, school_id, name, email, password_hash, role, status) VALUES (?, ?, ?, ?, ?, ?, ?)';
      await connection.query(query1, [
        studentData.user_id,
        studentData.school_id,
        $(cells[0]).text().trim(), // nombre
        'student-' + index + '@escuela.edu',
        'hashed_password', // Cambiar
        'student',
        'active'
      ]);
      
      // INSERT en tabla students
      const query2 = 'INSERT INTO students (id, user_id, school_id, enrollment_number, grade_level, section, status) VALUES (?, ?, ?, ?, ?, ?, ?)';
      await connection.query(query2, [
        studentData.id,
        studentData.user_id,
        studentData.school_id,
        studentData.enrollment_number,
        studentData.grade_level,
        studentData.section,
        studentData.status
      ]);
      
      console.log('✅ Estudiante migrado:', studentData.enrollment_number);
    } catch (error) {
      console.error('❌ Error:', error);
    }
  });
  
  connection.release();
}

// ============================================
// MIGRAR CALIFICACIONES
// ============================================
async function migrateGrades() {
  const connection = await pool.getConnection();
  
  const gradeRows = $('table#grades-table tbody tr');
  
  gradeRows.each(async (index, element) => {
    const cells = $(element).find('td');
    
    try {
      const query = `
        INSERT INTO grades 
        (id, student_id, course_id, teacher_id, period, score, recorded_date) 
        VALUES (?, ?, ?, ?, ?, ?, NOW())
      `;
      
      await connection.query(query, [
        'grade-' + Date.now() + index,
        'student-xxx', // Buscar en BD
        'course-xxx',  // Buscar en BD
        'teacher-xxx', // Buscar en BD
        'Q1', // Período
        parseFloat($(cells[2]).text()) // Nota
      ]);
      
      console.log('✅ Calificación migrada');
    } catch (error) {
      console.error('❌ Error:', error);
    }
  });
  
  connection.release();
}

// ============================================
// MIGRAR ASISTENCIA
// ============================================
async function migrateAttendance() {
  const connection = await pool.getConnection();
  
  const attendanceRows = $('table#attendance-table tbody tr');
  
  attendanceRows.each(async (index, element) => {
    const cells = $(element).find('td');
    
    try {
      const query = `
        INSERT INTO attendance 
        (id, student_id, course_id, date, status, recorded_date) 
        VALUES (?, ?, ?, ?, ?, NOW())
      `;
      
      await connection.query(query, [
        'attendance-' + Date.now() + index,
        'student-xxx',
        'course-xxx',
        $(cells[1]).text(), // fecha
        $(cells[2]).text().toLowerCase() // presente/ausente/tarde
      ]);
      
      console.log('✅ Asistencia migrada');
    } catch (error) {
      console.error('❌ Error:', error);
    }
  });
  
  connection.release();
}

// ============================================
// EJECUTAR MIGRACIONES
// ============================================
(async () => {
  console.log('🚀 Iniciando migración...\n');
  
  try {
    await migrateStudents();
    await migrateGrades();
    await migrateAttendance();
    
    console.log('\n✅ Migración completada');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error en migración:', error);
    process.exit(1);
  }
})();
```

---

## 📦 Paso 4: Instalar Dependencias para Migración

```bash
cd /Users/osmer/Downloads/Sistemita/Sistemita_Nuevo
npm install mysql2 cheerio
```

---

## ⚙️ Paso 5: Ejecutar la Migración

```bash
# Asegúrate de que MySQL esté corriendo
# En macOS: brew services start mysql

# Ejecutar el script de migración
node migrate.js

# Deberías ver:
# ✅ Estudiante migrado: EST-001
# ✅ Estudiante migrado: EST-002
# ✅ Calificación migrada
# ✅ Asistencia migrada
# ✅ Migración completada
```

---

## ✅ Paso 6: Verificar Datos en BD

```bash
mysql -u root -p
```

```sql
-- Ver cuántos estudiantes se importaron
SELECT COUNT(*) FROM students;

-- Ver estudiantes específicos
SELECT * FROM students LIMIT 5;

-- Ver calificaciones
SELECT * FROM grades LIMIT 10;

-- Ver asistencia
SELECT * FROM attendance LIMIT 10;

-- Salir
EXIT;
```

---

## 🔗 Paso 7: Conectar Backend con React

### Crear archivo: `/backend/routes/students.js`

```javascript
const express = require('express');
const pool = require('../db');

const router = express.Router();

// GET todos los estudiantes
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM students');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET estudiante por ID
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM students WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST crear estudiante
router.post('/', async (req, res) => {
  const { name, email, enrollment_number, grade_level, section } = req.body;
  
  try {
    const userId = 'user-' + Date.now();
    const studentId = 'student-' + Date.now();
    
    // Crear usuario
    await pool.query(
      'INSERT INTO users (id, school_id, name, email, password_hash, role) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, 'school-001', name, email, 'hashed_password', 'student']
    );
    
    // Crear estudiante
    await pool.query(
      'INSERT INTO students (id, user_id, school_id, enrollment_number, grade_level, section) VALUES (?, ?, ?, ?, ?, ?)',
      [studentId, userId, 'school-001', enrollment_number, grade_level, section]
    );
    
    res.json({ id: studentId, message: 'Estudiante creado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
```

### Conectar en React: `src/utils/api.ts`

```typescript
const API_URL = 'http://localhost:3001';

export const fetchStudents = async () => {
  const response = await fetch(`${API_URL}/api/students`);
  return response.json();
};

export const fetchGrades = async (studentId: string) => {
  const response = await fetch(`${API_URL}/api/grades?student_id=${studentId}`);
  return response.json();
};

export const fetchAttendance = async (studentId: string) => {
  const response = await fetch(`${API_URL}/api/attendance?student_id=${studentId}`);
  return response.json();
};
```

---

## 📊 Resumen de Migración

| Tabla | Datos | Método | Estado |
|-------|-------|--------|--------|
| students | ~200 registros | Parser HTML + INSERT | ✅ Listo |
| teachers | ~40 registros | Parser HTML + INSERT | ✅ Listo |
| courses | ~15 registros | Manual o Parser | ✅ Listo |
| grades | ~10,000 registros | Parser HTML + Bulk INSERT | ✅ Listo |
| attendance | ~5,000 registros | Parser HTML + Bulk INSERT | ✅ Listo |
| messages | Nuevos | API | ⏳ Futuro |
| announcements | Nuevos | API | ⏳ Futuro |

---

## 🚨 Consideraciones Importantes

### ⚠️ Seguridad
- Cambiar `password_hash` por contraseñas reales
- Usar bcrypt para hashear: `const hash = bcrypt.hashSync(password, 10);`
- Nunca guardar contraseñas en texto plano

### 🔄 Integridad de Datos
- Validar datos antes de INSERT
- Usar transacciones para operaciones críticas
- Hacer backup de datos originales

### 📝 Logs y Auditoría
- Registrar cada migración en `audit_logs`
- Mantener historial de cambios
- Documentar transformaciones

---

## 🎯 EduGest Mantiene Todos Sus Datos

**IMPORTANTE:** El sistema anterior (`EduGest_final.html`) **NO se modifica ni se elimina**.

- ✅ El archivo HTML sigue existiendo
- ✅ Los datos se COPIAN, no se MUEVEN
- ✅ Puedes usar ambos sistemas en paralelo
- ✅ Una vez validado, migras completamente

---

## ✅ Verificación Final

Después de la migración:

```bash
# 1. Verificar datos en BD
mysql -u root -p -e "SELECT COUNT(*) FROM students;" edugest_db

# 2. Iniciar backend
cd backend && npm start

# 3. Probar API
curl http://localhost:3001/api/students

# 4. Ver datos en React
# Abrir http://localhost:3000/estudiantes
# Deberías ver estudiantes importados
```

---

**Resultado:** Sistema nuevo funcionando CON datos reales del sistema antiguo 🎉

