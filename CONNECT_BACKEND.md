# 🔗 Conectar React Frontend con Backend API

Guía rápida para conectar el frontend React con el backend Express.

---

## 📋 Requisitos

✅ MySQL corriendo con base de datos `edugest_db` creada  
✅ Backend API iniciado en `http://localhost:3001`  
✅ Frontend React en `http://localhost:3000`

---

## 🚀 Instalación (Ya Hecho)

Se han realizado los siguientes cambios automáticamente:

### 1️⃣ Creado `src/utils/api.ts`
- Funciones para hacer requests HTTP a todos los endpoints
- Gestión automática de JWT token
- Funciones para: login, students, grades, attendance, courses

### 2️⃣ Actualizado `src/screens/LoginScreen.tsx`
- Ahora llama a `/api/auth/login` en el backend
- Almacena token JWT en localStorage
- Manejo de errores desde el servidor

### 3️⃣ Actualizado `src/screens/DashboardScreen.tsx`
- Carga datos reales de estudiantes y cursos
- Muestra cantidad de estudiantes en KPI
- Detecta y muestra errores de conexión

### 4️⃣ Creado `.env.local`
```
VITE_API_URL="http://localhost:3001"
```

---

## ⚙️ Próximos Pasos en Tu Terminal

### Terminal 1: Asegúrate que MySQL está corriendo

```bash
mysql -u root -p
# Verifica que existe la BD
SHOW DATABASES;
# Deberías ver: edugest_db
EXIT;
```

### Terminal 2: Backend API debe estar corriendo

```bash
cd /Users/osmer/Downloads/Sistemita/Sistemita_Nuevo/backend
npm run dev

# Output esperado:
# ╔════════════════════════════════════════╗
# ║     🎓 EduGest Backend Started        ║
# ║ Server running on: http://localhost:3001
```

### Terminal 3: Frontend React (si no está corriendo)

```bash
cd /Users/osmer/Downloads/Sistemita/Sistemita_Nuevo
npm run dev

# Output esperado:
# ➜  Local:   http://localhost:3000
```

---

## ✅ Verificar Conexión

Una vez todo corriendo:

1. **Abre:** `http://localhost:3000`

2. **Haz clic en:** Una de las cuentas demo (ej: Dr. Fernando López)

3. **Esperado:** 
   - ✅ Login exitoso
   - ✅ Dashboard muestra datos reales de BD
   - ✅ Número de estudiantes aparece en KPI
   - ✅ Número de cursos aparece en KPI

4. **Si hay error:**
   - Abre Console del navegador (F12)
   - Verifica que NO hay errores de CORS
   - Verifica que backend está corriendo en :3001

---

## 🧪 Testing de API con cURL

Desde Terminal, prueba el login directamente:

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "director@escuela.edu",
    "password": "director123"
  }'

# Deberías obtener un JSON con token y usuario
```

Obtener estudiantes con token:

```bash
TOKEN="eyJhbGc..." # Copia el token del login anterior

curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/api/students
```

---

## 📝 Cómo Funciona la Conexión

```
┌─────────────────┐
│  React Frontend │
│  (localhost:3000)
└────────┬────────┘
         │
         │ Llama api.login()
         │ (src/utils/api.ts)
         │
         ▼
┌─────────────────────┐
│  Backend Express    │
│  (localhost:3001)   │
│  /api/auth/login    │
└────────┬────────────┘
         │
         │ Valida credenciales
         │ Retorna JWT token
         │
         ▼
┌─────────────────┐
│  MySQL Database │
│  (edugest_db)   │
└─────────────────┘
```

---

## 🔐 JWT Token Storage

El token se guarda automáticamente en localStorage:

```javascript
// En browser console:
localStorage.getItem('auth_token')
localStorage.getItem('user')
```

Se usa en todos los requests posteriores:

```javascript
// Header automático en cada request:
Authorization: Bearer <token>
```

---

## ⚠️ Solución de Problemas

### Error: "Failed to fetch"
- Verifica que backend está corriendo en :3001
- Verifica que MySQL está corriendo

### Error: CORS
- Backend tiene CORS habilitado
- Verifica que `CORS_ORIGIN=http://localhost:3000` en backend/.env

### Error: "Email o contraseña inválidos"
- Usa una cuenta demo:
  - `director@escuela.edu` / `director123`
  - `profesor@escuela.edu` / `prof123`
  - `estudiante@escuela.edu` / `est123`

### Dashboard no muestra datos
- Abre Console (F12) y busca errores
- Verifica que hay estudiantes en BD:
  ```bash
  mysql -u root
  USE edugest_db;
  SELECT COUNT(*) FROM students;
  ```

---

## 🎯 Próximo Paso

Una vez verificado que funciona:

1. **Migrar datos** de EduGest_final.html a MySQL
   - Ver: `DATA_MIGRATION_GUIDE.md`

2. **Implementar lógica** en otros módulos (calificaciones, asistencia, etc.)

3. **Agregar más endpoints** para las 14 pantallas

---

**Estado:** ✅ Frontend y Backend conectados

Created: April 19, 2024
