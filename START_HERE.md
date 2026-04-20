# 🎯 EMPIEZA AQUÍ - Guía Rápida para Ejecutar EduGest

> **Tl;dr:** Copia, pega, y ¡listo! Tu sistema educativo está funcionando en 2 minutos.

---

## ✨ Lo que acabamos de construir

Un **sistema educativo profesional** con:
- ✅ 14 módulos educativos
- ✅ Autenticación con 5 roles (director, subdirector, docente, estudiante, apoderado)
- ✅ Dark mode
- ✅ Gráficos y reportes
- ✅ Responsive design
- ✅ Structure completa lista para agregar datos

---

## 🚀 Ejecución Rápida (Opción 1: Local)

### 1️⃣ Abre Terminal/CMD
```bash
cd /Users/osmer/Downloads/Sistemita/Sistemita_Nuevo
```

### 2️⃣ Instala dependencias (primera vez)
```bash
npm install
```

### 3️⃣ Ejecuta el proyecto
```bash
npm run dev
```

### 4️⃣ Abre en navegador
```
http://localhost:3000
```

### 5️⃣ Usa una cuenta de demo
```
Email: director@escuela.edu
Contraseña: director123
```

**¡Listo! Tu sistema está corriendo** 🎉

---

## 🐳 Ejecución con Docker (Opción 2: Container)

### 1️⃣ Construir imagen
```bash
cd /Users/osmer/Downloads/Sistemita/Sistemita_Nuevo
docker build -f Dockerfile.simple -t sistemita:latest .
```

### 2️⃣ Ejecutar con Docker Compose
```bash
docker-compose up
```

### 3️⃣ Abre en navegador
```
http://localhost:3000
```

**¡Tu sistema está en un contenedor!** 🐳

---

## 👤 Cuentas de Demo Disponibles

Puedes probar el sistema con cualquiera de estas cuentas:

### Director (Acceso total)
```
Email: director@escuela.edu
Contraseña: director123
Nombre: Dr. Fernando López
```

### Subdirector (Gestión académica)
```
Email: subdirector@escuela.edu
Contraseña: sub123
Nombre: Mg. María García
```

### Docente (Gestión de clase)
```
Email: profesor@escuela.edu
Contraseña: prof123
Nombre: Lic. Juan Pérez
```

### Estudiante (Vista estudiante)
```
Email: estudiante@escuela.edu
Contraseña: est123
Nombre: Carlos Mendez
```

### Apoderado/Padre (Seguimiento)
```
Email: apoderado@escuela.edu
Contraseña: apod123
Nombre: Pedro Mendez
```

---

## 🗺️ Módulos Disponibles

Una vez logueado, navega a través de estos 14 módulos:

| # | Módulo | ¿Para quién? | Icono |
|---|--------|-------------|-------|
| 1 | **Inicio** | Todos | 🏠 |
| 2 | **Aula Virtual** | Docente, Estudiante | 📚 |
| 3 | **Mensajes** | Todos | 💬 |
| 4 | **Informes** | Todos | 📊 |
| 5 | **Comunidad** | Todos | 👥 |
| 6 | **Panel Director** | Director, Subdirector | 🏢 |
| 7 | **Panel Subdirector** | Subdirector | 👔 |
| 8 | **Profesores** | Director, Subdirector | 👨‍🏫 |
| 9 | **Estudiantes** | Director, Subdirector | 🎓 |
| 10 | **Mi Desempeño** | Estudiante, Apoderado | 🔥 |
| 11 | **Calificaciones** | Docente, Estudiante | 📝 |
| 12 | **Horario** | Docente, Estudiante | ⏰ |
| 13 | **Asistencia** | Docente, Estudiante | ✓ |
| 14 | **Normas de Convivencia** | Estudiante | 📖 |

---

## 🎨 Características del Sistema

### 🌙 Dark Mode
Haz clic en el ícono de luna/sol en la esquina superior derecha para cambiar tema.

### 📱 Responsive
Funciona perfectamente en:
- Desktop (1920px+)
- Tablet (768px - 1024px)
- Mobile (< 768px)

### 🔒 Control de Acceso
El menú se filtra automáticamente según tu rol:
- **Director:** Ve todos los módulos
- **Subdirector:** Ve menos que el director
- **Docente:** Ve módulos académicos
- **Estudiante:** Ve su información personal
- **Apoderado:** Ve info del hijo

---

## 📊 El Dashboard (Pantalla Inicio)

Muestra:
- **Promedio General:** Tu calificación actual
- **Asistencia:** Porcentaje de asistencia
- **Cursos Activos:** Cantidad de materias
- **Tareas Pendientes:** Tareas sin entregar
- **Gráficos de Tendencias:** Mejora a lo largo del tiempo
- **Anuncios:** Noticias recientes
- **Próximos Eventos:** Clases y reuniones

---

## 🔧 Solución de Problemas

### Puerto 3000 ya está en uso
```bash
# Cambia el puerto en vite.config.ts o usa:
lsof -i :3000  # Identifica qué ocupa el puerto
kill -9 <PID>  # Cierra el proceso
```

### Error: "Cannot find module"
```bash
# Reinstala dependencias
rm -rf node_modules package-lock.json
npm install
```

### Error: "VITE not found"
```bash
# Instala dependencias globales
npm install -g vite
# O usa npx:
npx vite --port 3000
```

### Docker no funciona
```bash
# Verifica que Docker esté instalado y corriendo
docker --version
# En Mac/Windows, abre la aplicación Docker Desktop
```

---

## 🚀 Próximos Pasos (Cuando estés listo)

### 1. Revisar la estructura
```bash
cd src/
ls -la

# Verás:
# screens/      → 14 módulos educativos
# components/   → Componentes reutilizables
# types/        → Definiciones TypeScript
```

### 2. Leer documentación
```bash
# Abre estos archivos:
STRUCTURE.md                 # Estructura del proyecto
DATABASE_SCHEMA.sql         # Schema de la base de datos
GETTING_STARTED.md          # Guía completa
IMPLEMENTATION_SUMMARY.md   # Resumen técnico
```

### 3. Crear Backend
```bash
# Cuando estés listo para conectar base de datos:
mkdir backend
cd backend
npm init -y
npm install express mysql2 cors dotenv
```

### 4. Migrar Datos
```bash
# Cuando tengas datos listos:
# 1. Exporta de EduGest_final.html
# 2. Importa a la nueva BD usando DATABASE_SCHEMA.sql
# 3. Conecta backend a frontend
```

---

## 💡 Tips Útiles

### Cambiar Colores Institucionales
Edita `tailwind.config.js` o `src/index.css`:
```css
/* Rojo institucional */
--red-600: #af2428

/* Oro */
--amber-900: #705900

/* Cyan */
--cyan-900: #006381
```

### Agregar tu Logo
En `src/components/MainLayout.tsx`:
```tsx
<img src="/tu-logo.png" alt="Logo" className="w-12 h-12" />
```

### Cambiar Nombre de la Escuela
En `src/components/MainLayout.tsx`:
```tsx
<h1 className="text-xl font-bold text-red-600">
  Tu Nombre de Escuela
</h1>
```

### Agregar Nuevos Usuarios Demo
En `src/screens/LoginScreen.tsx`, edita el array `demoAccounts`.

---

## 📞 Estructura de Carpetas Rápida

```
Sistemita_Nuevo/
├── src/
│   ├── App.tsx                 ← Lógica principal
│   ├── screens/                ← 14 módulos (aquí van tus pantallas)
│   │   ├── LoginScreen.tsx
│   │   ├── DashboardScreen.tsx
│   │   ├── CalificacionesScreen.tsx
│   │   └── ...13 más
│   ├── components/             ← Componentes reutilizables
│   │   ├── MainLayout.tsx      ← Sidebar y header
│   │   └── ScreenContainer.tsx ← Wrapper de pantallas
│   └── types/                  ← Tipos TypeScript
├── public/                      ← Imágenes, logos, etc
├── package.json                ← Dependencias
├── vite.config.ts              ← Configuración Vite
├── tailwind.config.js           ← Configuración Tailwind
├── DATABASE_SCHEMA.sql          ← Schema de BD
└── README.md                    ← Este archivo
```

---

## ⚡ Comandos Útiles

```bash
# Instalar nuevas dependencias
npm install nombre-paquete

# Ejecutar en modo desarrollo
npm run dev

# Compilar para producción
npm run build

# Ver preview de compilación
npm run preview

# Hacer lint del código
npm run lint

# Con Docker
docker build -f Dockerfile.simple -t sistemita .
docker run -p 3000:3000 sistemita
docker-compose up
```

---

## 🎯 ¿Qué sigue?

### Opción A: Exploración (10 minutos)
1. Loguéate como Director
2. Explora todos los módulos
3. Prueba Dark Mode
4. Redimensiona el navegador (prueba responsive)
5. Loguéate con otros roles

### Opción B: Implementación (1-2 horas)
1. Abre `GETTING_STARTED.md`
2. Crea el backend API
3. Conecta la base de datos
4. Integra con el frontend

### Opción C: Migración (2-4 horas)
1. Abre `DATABASE_SCHEMA.sql`
2. Crea la base de datos
3. Extrae datos de `EduGest_final.html`
4. Importa los datos
5. Conecta todo

---

## 🎉 ¡Felicidades!

Tienes un **sistema educativo profesional** funcionando.

Ahora puedes:
- ✅ Explorar la interfaz
- ✅ Entender la estructura
- ✅ Agregar datos reales
- ✅ Personalizar según necesites
- ✅ Escalar a producción

---

## 📧 ¿Preguntas?

Consulta estos archivos:
- **Cómo comenzar:** `GETTING_STARTED.md`
- **Estructura:** `STRUCTURE.md`
- **Base de datos:** `DATABASE_SCHEMA.sql`
- **Resumen técnico:** `IMPLEMENTATION_SUMMARY.md`

---

## 🏫 Bienvenido a EduGest

**Sistema Integral de Gestión Educativa**  
IE Manuel Fidencio Hidalgo Flores  
Versión 1.0.0-alpha  
Abril 2024

---

**¿Listo? Abre tu terminal y ejecuta:**

```bash
cd /Users/osmer/Downloads/Sistemita/Sistemita_Nuevo
npm install
npm run dev
```

**Luego abre:** http://localhost:3000

**¡Bienvenido al futuro de la educación!** 🚀

