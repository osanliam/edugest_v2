# 🚀 Guía Completa: Deployar Sistemita en Turso + Vercel

## Estado Actual
✅ **Frontend:** React + Vite  
✅ **Backend:** Vercel Functions (API Routes)  
✅ **Base de Datos:** Turso (SQLite Serverless)  
✅ **Autenticación:** JWT  

---

## 📋 Paso 1: Crear una Base de Datos en Turso

### 1.1 Ir a Turso
```
https://turso.tech
```

### 1.2 Crear Cuenta (Gratis)
- Sign up con email o GitHub
- Tier gratuito: 9 GB almacenamiento, suficiente para educación

### 1.3 Crear Nueva Base de Datos
```
Nombre: sistemita_db
Location: Frankfurt o la más cercana a ti
```

### 1.4 Obtener Credenciales
Verás dos valores importantes:

```
Connection URL: libsql://sistemita-xxx.turso.io
Auth Token: eyJhbGciOiJFZEdTUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Guarda estas credenciales 🔒**

---

## 📋 Paso 2: Preparar el Proyecto Localmente

### 2.1 Clonar o Copiar Proyecto
```bash
cd /Users/osmer/Downloads/Abril\ 2026/Sistemita_Nuevo
```

### 2.2 Crear archivo `.env.local`
```bash
cp .env.local.example .env.local
```

### 2.3 Llenar variables en `.env.local`
```env
TURSO_CONNECTION_URL=libsql://sistemita-xxx.turso.io
TURSO_AUTH_TOKEN=eyJhbGciOiJFZEdTUzI1NiIsInR5cCI6IkpXVCJ9...
JWT_SECRET=mi-secreto-super-seguro-cambia-esto-2026
VITE_API_URL=https://sistemita.vercel.app  # Cambiar a tu dominio
NODE_ENV=production
```

### 2.3 Instalar dependencias
```bash
npm install
```

### 2.4 Probar localmente
```bash
npm run build
npm run preview
```

Abre en navegador: `http://localhost:4173`

---

## 📋 Paso 3: Deployar en Vercel

### 3.1 Crear Cuenta en Vercel
```
https://vercel.com
Sign up con GitHub (recomendado)
```

### 3.2 Importar Proyecto
1. Click en "New Project"
2. Selecciona tu repositorio de GitHub (o importa manual)
3. Click "Import"

### 3.3 Configurar Variables de Entorno
En **Settings → Environment Variables**, agrega:

| Variable | Valor | 
|----------|-------|
| `TURSO_CONNECTION_URL` | `libsql://sistemita-xxx.turso.io` |
| `TURSO_AUTH_TOKEN` | `eyJhbGciOiJFZEdTUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `JWT_SECRET` | Tu secreto aleatorio largo |
| `VITE_API_URL` | `https://tu-proyecto.vercel.app` |
| `NODE_ENV` | `production` |

### 3.4 Deploy
1. Click "Deploy"
2. Espera 2-3 minutos
3. ¡Listo! Tu dominio será: `https://sistemita-xxxx.vercel.app`

---

## 📋 Paso 4: Inicializar Base de Datos

### 4.1 Opción A: Crear tablas via Turso Shell
```bash
# Instalar Turso CLI
npm install -g @turso/cli

# Login
turso auth login

# Conectar a tu BD
turso db shell sistemita_db
```

### 4.2 Ejecutar SQL en Shell
```sql
-- Crear tabla de usuarios
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  contraseña TEXT NOT NULL,
  rol TEXT NOT NULL,
  activo BOOLEAN DEFAULT 1,
  creado DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla de calificaciones
CREATE TABLE grades (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL,
  teacher_id TEXT NOT NULL,
  subject TEXT NOT NULL,
  competence TEXT NOT NULL,
  instrument TEXT NOT NULL,
  score REAL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES users(id),
  FOREIGN KEY (teacher_id) REFERENCES users(id)
);

-- Crear tabla de asistencia
CREATE TABLE attendance (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL,
  teacher_id TEXT NOT NULL,
  date DATE NOT NULL,
  status TEXT DEFAULT 'present',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES users(id),
  FOREIGN KEY (teacher_id) REFERENCES users(id)
);

-- Insertar usuarios demo
INSERT INTO users VALUES (
  'user-admin-001',
  'Admin Sistemita',
  'admin@sistemita.edu',
  'admin123',
  'admin',
  1,
  CURRENT_TIMESTAMP
);

INSERT INTO users VALUES (
  'user-teacher-001',
  'Juan Pérez García',
  'juan.perez@sistemita.edu',
  'teacher123',
  'teacher',
  1,
  CURRENT_TIMESTAMP
);

INSERT INTO users VALUES (
  'user-student-001',
  'Carlos Méndez López',
  'carlos.mendez@estudiantes.edu',
  'student123',
  'student',
  1,
  CURRENT_TIMESTAMP
);

INSERT INTO users VALUES (
  'user-parent-001',
  'Pedro Hernández Martínez',
  'pedro.hernandez@apoderados.edu',
  'parent123',
  'parent',
  1,
  CURRENT_TIMESTAMP
);
```

### 4.3 Verificar Datos
```sql
SELECT * FROM users;
```

---

## 🧪 Paso 5: Probar APIs

### 5.1 Test Health Check
```bash
curl https://sistemita.vercel.app/api/health
```

Respuesta esperada:
```json
{
  "status": "ok",
  "timestamp": "2026-04-20T12:30:00.000Z",
  "database": "Turso (SQLite)",
  "users": 4,
  "grades": 0
}
```

### 5.2 Test Login
```bash
curl -X POST https://sistemita.vercel.app/api/auth \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@sistemita.edu",
    "contraseña": "admin123"
  }'
```

Respuesta esperada:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user-admin-001",
    "nombre": "Admin Sistemita",
    "email": "admin@sistemita.edu",
    "rol": "admin"
  }
}
```

---

## 🔄 Paso 6: Conectar Frontend a Backend

En tu archivo `src/api/client.js` o similar:

```javascript
// src/api/client.js
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export async function login(email, contraseña) {
  const response = await fetch(`${API_URL}/api/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, contraseña })
  });
  
  if (!response.ok) throw new Error('Login failed');
  return response.json();
}

export async function getUsers(token) {
  const response = await fetch(`${API_URL}/api/users`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  if (!response.ok) throw new Error('Failed to fetch users');
  return response.json();
}

export async function createUser(token, userData) {
  const response = await fetch(`${API_URL}/api/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(userData)
  });
  
  if (!response.ok) throw new Error('Failed to create user');
  return response.json();
}
```

---

## 📊 Costos Estimados (Mensuales)

| Servicio | Precio | Límite |
|----------|--------|--------|
| **Turso** | $0 / mes | 9 GB (gratis) |
| **Vercel** | $0 / mes | 100 GB (gratis) |
| **Total** | **$0** | Suficiente para educación |

### Plan Upgrade si creces:
- Turso: $15/mes → 100 GB
- Vercel: $20/mes → 4 TB

---

## 🔐 Seguridad - Checklist

- [ ] Cambiar `JWT_SECRET` a algo único y largo
- [ ] Usar HTTPS en todas las URLs (Vercel lo hace automático)
- [ ] No commitear `.env.local` (añadir a `.gitignore`)
- [ ] Usar variables de entorno en Vercel
- [ ] Encriptar contraseñas en Turso (usar bcrypt)
- [ ] Validar inputs en backend

---

## 🚨 Troubleshooting

### Error: "TURSO_CONNECTION_URL not found"
**Solución:** Verifica que las variables estén en Vercel Settings → Environment Variables

### Error: "Token inválido"
**Solución:** Asegúrate que `JWT_SECRET` sea igual en frontend y backend

### Error: "Database connection failed"
**Solución:** Verifica credenciales de Turso, asegúrate que la BD existe

### Vercel dice "Build failed"
```bash
# Prueba localmente
npm run build

# Revisa los logs
vercel logs --tail
```

---

## 📚 Documentación Útil

- Turso Docs: https://docs.turso.tech
- Vercel Functions: https://vercel.com/docs/functions/serverless-functions
- JWT Guide: https://jwt.io/introduction
- libsql/client: https://github.com/libsql/libsql-client-js

---

## ✅ Checklist Final

- [ ] Crear BD en Turso
- [ ] Obtener credenciales (URL + Token)
- [ ] Crear `.env.local` con credenciales
- [ ] npm install
- [ ] Probar localmente (npm run build)
- [ ] Crear proyecto en Vercel
- [ ] Agregar variables de entorno en Vercel
- [ ] Deploy
- [ ] Inicializar tablas en Turso
- [ ] Insertar usuarios demo
- [ ] Probar APIs (curl o Postman)
- [ ] Probar login en frontend
- [ ] ¡Celebrar! 🎉

---

## 📞 Soporte

Si algo falla:
1. Revisa los logs de Vercel: `vercel logs --tail`
2. Verifica variables de entorno
3. Prueba la BD directamente: `turso db shell sistemita_db`
4. Check status: https://sistemita.vercel.app/api/health

---

**¡Listo! Tu sistema está en la nube, escalable y gratis.** ☁️
