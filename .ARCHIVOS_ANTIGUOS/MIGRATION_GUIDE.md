# 📊 Guía de Migración de Datos - EduGest

Instrucciones para importar datos a la base de datos MySQL.

---

## 🎯 Opciones de Migración

### **Opción 1: Migración Automática de EduGest HTML** (Recomendado)

Si tienes el archivo `EduGest_final.html` en `/Users/osmer/Downloads/Sistemita/edugest/`:

```bash
cd /Users/osmer/Downloads/Sistemita/Sistemita_Nuevo/backend
node migrate.js
```

El script automáticamente:
- ✅ Lee el archivo HTML
- ✅ Parsea los datos
- ✅ Inserta en MySQL
- ✅ Muestra reporte

### **Opción 2: Migración de Datos de Ejemplo** (Actual)

Si no tienes el HTML o quieres probar primero:

```bash
cd /Users/osmer/Downloads/Sistemita/Sistemita_Nuevo/backend
node migrate.js
```

Inserta **datos de ejemplo**:
- 5 estudiantes
- 5 cursos
- 5 calificaciones
- 4 registros de asistencia

---

## 🚀 Ejecución Paso a Paso

### Paso 1: Verifica que MySQL está corriendo

```bash
mysql -u root -p
# Deberías poder conectar
EXIT;
```

### Paso 2: Verifica que la BD existe

```bash
mysql -u root -e "SHOW DATABASES;" | grep edugest_db
# Deberías ver: edugest_db
```

### Paso 3: Ejecuta la migración

```bash
cd /Users/osmer/Downloads/Sistemita/Sistemita_Nuevo/backend
node migrate.js
```

**Output esperado:**

```
╔════════════════════════════════════════╗
║    🔄 Iniciando Migración de Datos    ║
╠════════════════════════════════════════╣
║ Archivo: /Users/osmer/Downloads...
║ Base de Datos: edugest_db
╚════════════════════════════════════════╝

✅ Institución registrada
✅ Usuarios demo registrados
✅ 5 estudiantes registrados
✅ 5 cursos registrados
✅ 5 calificaciones registradas
✅ 4 registros de asistencia insertados

╔════════════════════════════════════════╗
║         ✅ Migración Completada        ║
╠════════════════════════════════════════╣
║ Instituciones:      1
║ Estudiantes:        5
║ Cursos:             5
║ Calificaciones:     5
║ Asistencia:         4
║ Errores:            0
╚════════════════════════════════════════╝
```

### Paso 4: Verifica los datos en MySQL

```bash
mysql -u root -p

USE edugest_db;

# Ver estudiantes
SELECT COUNT(*) FROM students;
# Deberías ver: 5

# Ver cursos
SELECT COUNT(*) FROM courses;
# Deberías ver: 5

# Ver calificaciones
SELECT * FROM grades LIMIT 5;

# Ver asistencia
SELECT * FROM attendance LIMIT 5;

EXIT;
```

### Paso 5: Recarga el Frontend

1. Abre `http://localhost:3000`
2. Haz logout
3. Haz login de nuevo
4. **Dashboard ahora muestra:**
   - ✅ "5 Cursos Activos"
   - ✅ "5 Estudiantes"

---

## 🎓 ¿Cómo Editar y Modificar Datos Después?

Excelente pregunta. Hay **4 formas** de modificar datos:

### **Forma 1️⃣: Directamente en MySQL (SQL)**

```bash
mysql -u root -p
USE edugest_db;

# Ver estudiantes
SELECT * FROM students;

# Agregar nuevo estudiante
INSERT INTO users (id, school_id, name, email, password_hash, role, status)
VALUES ('user-006', 'school-001', 'Nuevo Estudiante', 'nuevo@escuela.edu', 'hash', 'student', 'active');

INSERT INTO students (id, user_id, school_id, enrollment_number, grade_level, section, status)
VALUES ('student-EST-006', 'user-006', 'school-001', 'EST-006', '1A', 'A', 'active');

# Actualizar datos
UPDATE students SET grade_level = '2A' WHERE enrollment_number = 'EST-001';

# Eliminar
DELETE FROM students WHERE id = 'student-EST-006';

EXIT;
```

### **Forma 2️⃣: Con API REST (Desde Frontend o cURL)**

```bash
# Crear estudiante vía API
curl -X POST http://localhost:3001/api/students \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "nuevo@escuela.edu",
    "name": "Nuevo Estudiante",
    "enrollment_number": "EST-006",
    "grade_level": "2A",
    "section": "A",
    "password": "temporal123"
  }'

# Actualizar estudiante
curl -X PUT http://localhost:3001/api/students/student-EST-001 \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "grade_level": "3B",
    "status": "inactive"
  }'

# Eliminar estudiante
curl -X DELETE http://localhost:3001/api/students/student-EST-001 \
  -H "Authorization: Bearer <token>"
```

### **Forma 3️⃣: Crear Interfaz en React (Dashboard Admin)**

Edita el módulo "Panel Director" o "Panel Subdirector":

**Archivo:** `src/screens/DirectorDashboard.tsx`

```tsx
import { useState } from 'react';
import api from '../utils/api';

export default function DirectorDashboard() {
  const [newStudent, setNewStudent] = useState({
    name: '',
    email: '',
    enrollment_number: '',
    grade_level: '',
    section: ''
  });

  const handleAddStudent = async () => {
    try {
      const response = await api.createStudent({
        ...newStudent,
        password: 'temporal123'
      });
      alert('Estudiante creado: ' + response.data.id);
      setNewStudent({ name: '', email: '', enrollment_number: '', grade_level: '', section: '' });
    } catch (error) {
      alert('Error: ' + (error as Error).message);
    }
  };

  return (
    <div className="p-6">
      <h2>Agregar Estudiante</h2>
      
      <input 
        placeholder="Nombre"
        value={newStudent.name}
        onChange={(e) => setNewStudent({...newStudent, name: e.target.value})}
        className="w-full mb-2 p-2 border rounded"
      />
      
      <input 
        placeholder="Email"
        value={newStudent.email}
        onChange={(e) => setNewStudent({...newStudent, email: e.target.value})}
        className="w-full mb-2 p-2 border rounded"
      />
      
      {/* ... más campos ... */}
      
      <button 
        onClick={handleAddStudent}
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        Crear Estudiante
      </button>
    </div>
  );
}
```

### **Forma 4️⃣: Script de Migración Personalizado**

Modifica `backend/migrate.js` para tu caso específico:

```javascript
// Dentro de migrate.js, modificar la función insertSampleStudents:

async function insertCustomStudents(connection) {
  const students = [
    { enrollment: 'EST-001', name: 'Tu Nombre Aquí', grade: '3A', section: 'A' },
    // ... agregar más estudiantes
  ];

  for (const student of students) {
    // ... código de inserción
  }
}
```

Luego ejecuta:
```bash
node migrate.js
```

---

## 📝 Resumen: ¿Cuál Usar?

| Forma | Cuándo Usar | Ventajas | Desventajas |
|-------|------------|----------|------------|
| **1. SQL Directo** | Cambios rápidos, testing | Rápido, preciso | Requiere conocer SQL |
| **2. API REST** | Scripts automatizados, integraciones | Usa la API oficial | Requiere token JWT |
| **3. Panel Admin React** | Usuarios finales, frontend bonito | Interfaz visual, fácil | Requiere implementación |
| **4. Script Personalizado** | Migración inicial, datos masivos | Automatizado, repetible | Requiere editar código |

---

## 🧪 Ejemplo Completo: Agregar 10 Estudiantes

### Opción A: Con SQL

```bash
mysql -u root -p << EOF
USE edugest_db;

-- Crear 10 estudiantes de una vez
INSERT INTO users (id, school_id, name, email, password_hash, role, status) VALUES
('user-s01', 'school-001', 'Estudiante 01', 'est01@escuela.edu', 'hash', 'student', 'active'),
('user-s02', 'school-001', 'Estudiante 02', 'est02@escuela.edu', 'hash', 'student', 'active'),
('user-s03', 'school-001', 'Estudiante 03', 'est03@escuela.edu', 'hash', 'student', 'active'),
-- ... más estudiantes ...
('user-s10', 'school-001', 'Estudiante 10', 'est10@escuela.edu', 'hash', 'student', 'active');

INSERT INTO students (id, user_id, school_id, enrollment_number, grade_level, section, status) VALUES
('student-s01', 'user-s01', 'school-001', 'EST-001', '3A', 'A', 'active'),
('student-s02', 'user-s02', 'school-001', 'EST-002', '3A', 'A', 'active'),
-- ... más estudiantes ...
('student-s10', 'user-s10', 'school-001', 'EST-010', '3B', 'B', 'active');

SELECT COUNT(*) FROM students;
EOF
```

### Opción B: Con Script Node.js

Crea archivo `backend/add-students.js`:

```javascript
import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  database: 'edugest_db'
});

async function addStudents() {
  const connection = await pool.getConnection();
  
  const students = [];
  for (let i = 1; i <= 10; i++) {
    students.push({
      id: `user-s${String(i).padStart(2, '0')}`,
      name: `Estudiante ${String(i).padStart(2, '0')}`,
      email: `est${String(i).padStart(2, '0')}@escuela.edu`
    });
  }
  
  for (const student of students) {
    await connection.query(
      'INSERT INTO users (id, school_id, name, email, password_hash, role, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [student.id, 'school-001', student.name, student.email, 'hash', 'student', 'active']
    );
  }
  
  console.log('✅ 10 estudiantes agregados');
  connection.release();
  pool.end();
}

addStudents();
```

Ejecuta:
```bash
node backend/add-students.js
```

---

## ✅ Próximos Pasos

1. ✅ Ejecuta `node migrate.js` para cargar datos iniciales
2. ⏳ Recarga React para ver los datos en dashboard
3. ⏳ Elige una forma de editar (SQL, API, Panel Admin, Script)
4. ⏳ Implementa módulo de Administración en React

---

**¿Listo para ejecutar la migración?**

```bash
cd /Users/osmer/Downloads/Sistemita/Sistemita_Nuevo/backend
node migrate.js
```

Una vez hecho, los datos aparecerán en el Dashboard. 🚀

