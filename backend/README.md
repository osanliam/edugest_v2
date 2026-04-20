# 🎓 EduGest Backend API

Backend Express.js para el Sistema Integral de Gestión Educativa **EduGest**.

---

## 📋 Requisitos

- **Node.js** 16+ 
- **MySQL** 8.0+
- **npm** 8+

---

## 🚀 Instalación Rápida

### 1️⃣ Instalar Dependencias

```bash
cd backend
npm install
```

### 2️⃣ Configurar Variables de Entorno

Copia `.env.example` a `.env`:

```bash
cp .env.example .env
```

Edita `.env` con tus credenciales MySQL:

```env
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=  # Tu contraseña de MySQL (vacío si no tiene)
MYSQL_DATABASE=edugest_db
MYSQL_PORT=3306

PORT=3001
NODE_ENV=development

JWT_SECRET=tu_clave_secreta_super_segura_aqui
JWT_EXPIRE=7d

CORS_ORIGIN=http://localhost:3000
```

### 3️⃣ Crear Base de Datos

Primero, asegúrate de que MySQL está corriendo:

```bash
mysql -u root -p
```

Dentro de MySQL, ejecuta el schema:

```sql
source /Users/osmer/Downloads/Sistemita/Sistemita_Nuevo/DATABASE_SCHEMA.sql;
```

O desde terminal:

```bash
mysql -u root < ../DATABASE_SCHEMA.sql
```

### 4️⃣ Iniciar el Servidor

**Modo Desarrollo (con auto-reload):**

```bash
npm run dev
```

**Modo Producción:**

```bash
npm start
```

Deberías ver:

```
╔════════════════════════════════════════╗
║     🎓 EduGest Backend Started        ║
╠════════════════════════════════════════╣
║ Server running on: http://localhost:3001
║ Environment: development
║ Database: edugest_db
╚════════════════════════════════════════╝
```

---

## 📚 Documentación de API

### Autenticación

#### `POST /api/auth/login`

Autentica un usuario y retorna JWT token.

**Request:**
```json
{
  "email": "director@escuela.edu",
  "password": "director123"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGc...",
  "user": {
    "id": "user-001",
    "email": "director@escuela.edu",
    "name": "Dr. Fernando López",
    "role": "director",
    "school_id": "school-001"
  }
}
```

**Demo Accounts:**
```
director@escuela.edu / director123
subdirector@escuela.edu / sub123
profesor@escuela.edu / prof123
estudiante@escuela.edu / est123
apoderado@escuela.edu / apod123
```

#### `GET /api/auth/verify`

Verifica que un token JWT es válido.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "valid": true,
  "user": { ... }
}
```

---

### Estudiantes

#### `GET /api/students`

Obtiene lista de estudiantes (requiere rol: director, subdirector, teacher).

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "student-xxx",
      "name": "Carlos Mendez",
      "email": "carlos@escuela.edu",
      "enrollment_number": "EST-001",
      "grade_level": "3A",
      "section": "A",
      "status": "active"
    }
  ]
}
```

#### `GET /api/students/:id`

Obtiene datos de un estudiante específico.

#### `POST /api/students`

Crea un nuevo estudiante (requiere rol: director, subdirector).

**Request:**
```json
{
  "email": "nuevo@escuela.edu",
  "name": "Nuevo Estudiante",
  "enrollment_number": "EST-100",
  "grade_level": "2A",
  "section": "B",
  "password": "temporal123"
}
```

#### `PUT /api/students/:id`

Actualiza datos de un estudiante (requiere rol: director, subdirector).

**Request:**
```json
{
  "grade_level": "3A",
  "section": "B",
  "status": "inactive"
}
```

#### `DELETE /api/students/:id`

Elimina un estudiante (requiere rol: director).

---

### Calificaciones

#### `GET /api/grades`

Obtiene calificaciones. Filtrar con query params:

```
GET /api/grades?student_id=xxx&course_id=yyy&period=Q1
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "grade-xxx",
      "student_id": "student-xxx",
      "course_id": "course-xxx",
      "teacher_id": "teacher-xxx",
      "period": "Q1",
      "score": 18.5,
      "recorded_date": "2024-04-19T12:00:00Z",
      "enrollment_number": "EST-001",
      "course_name": "Matemáticas",
      "teacher_name": "Lic. Juan Pérez"
    }
  ]
}
```

#### `POST /api/grades`

Registra una nueva calificación (requiere rol: teacher, director, subdirector).

**Request:**
```json
{
  "student_id": "student-xxx",
  "course_id": "course-xxx",
  "teacher_id": "teacher-xxx",
  "period": "Q1",
  "score": 18.5
}
```

#### `PUT /api/grades/:id`

Actualiza una calificación.

**Request:**
```json
{
  "score": 19.0,
  "period": "Q2"
}
```

---

### Asistencia

#### `GET /api/attendance`

Obtiene registros de asistencia. Filtros:

```
GET /api/attendance?student_id=xxx&course_id=yyy&start_date=2024-01-01&end_date=2024-04-30
```

#### `POST /api/attendance`

Registra asistencia (requiere rol: teacher, director, subdirector).

**Request:**
```json
{
  "student_id": "student-xxx",
  "course_id": "course-xxx",
  "date": "2024-04-19",
  "status": "present"
}
```

**Status válidos:** `present`, `absent`, `late`

#### `GET /api/attendance/stats/:student_id`

Obtiene estadísticas de asistencia del estudiante.

**Response:**
```json
{
  "success": true,
  "data": {
    "total_days": 150,
    "days_present": 145,
    "days_absent": 3,
    "days_late": 2,
    "attendance_rate": 96.67
  }
}
```

---

### Cursos

#### `GET /api/courses`

Obtiene lista de cursos. Filtros:

```
GET /api/courses?school_id=school-001&grade_level=3A
```

#### `POST /api/courses`

Crea un nuevo curso (requiere rol: director, subdirector).

**Request:**
```json
{
  "name": "Matemáticas Avanzadas",
  "code": "MAT-301",
  "grade_level": "3A",
  "semester": "I",
  "credits": 4
}
```

---

## 🔐 Autenticación

Todos los endpoints (excepto `/api/auth/login`) requieren JWT token en header:

```bash
curl -H "Authorization: Bearer <token>" http://localhost:3001/api/students
```

En React, usar:

```typescript
const token = localStorage.getItem('auth_token');
const response = await fetch('http://localhost:3001/api/students', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

---

## 🧪 Testing con cURL

### Login

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "director@escuela.edu",
    "password": "director123"
  }'
```

### Obtener Estudiantes

```bash
TOKEN="eyJhbGc..." # Token del login anterior

curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/api/students
```

### Registrar Calificación

```bash
curl -X POST http://localhost:3001/api/grades \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": "student-xxx",
    "course_id": "course-xxx",
    "period": "Q1",
    "score": 18.5
  }'
```

---

## 📝 Estructura del Proyecto

```
backend/
├── index.js                  ← Servidor principal
├── db.js                     ← Conexión a MySQL
├── package.json
├── .env.example
├── README.md
├── middleware/
│   └── auth.js              ← JWT y autorización
└── routes/
    ├── auth.js              ← Autenticación
    ├── students.js          ← CRUD estudiantes
    ├── grades.js            ← CRUD calificaciones
    ├── attendance.js        ← CRUD asistencia
    └── courses.js           ← CRUD cursos
```

---

## 🐛 Solución de Problemas

### Error: "Cannot find module 'mysql2'"

```bash
rm -rf node_modules package-lock.json
npm install
```

### Error: "connect ECONNREFUSED 127.0.0.1:3306"

MySQL no está corriendo. Inicia:

```bash
brew services start mysql  # macOS
# O
mysql.server start         # macOS alternativa
```

### Error: "database does not exist"

Asegúrate de haber ejecutado `DATABASE_SCHEMA.sql`:

```bash
mysql -u root < ../DATABASE_SCHEMA.sql
```

### Puerto 3001 ya está en uso

```bash
lsof -i :3001
kill -9 <PID>
```

---

## 🚀 Despliegue

### Producción con PM2

```bash
npm install -g pm2

pm2 start index.js --name "edugest-api"
pm2 save
pm2 startup
```

### Docker

```bash
docker build -t edugest-api .
docker run -p 3001:3001 --env-file .env edugest-api
```

---

## 📞 Próximos Pasos

1. ✅ Backend API creado
2. ⏳ Conectar React frontend con endpoints
3. ⏳ Migrar datos de EduGest HTML
4. ⏳ Implementar más endpoints (mensajes, anuncios, etc.)
5. ⏳ Agregar tests automatizados

---

**Status:** 🟢 Listo para usar

Created: April 19, 2024
