# 🚀 EduGest - Guía de Inicio Rápido

## Descripción General

EduGest es un **Sistema Integral de Gestión Educativa** construido con React 19, Tailwind CSS, TypeScript y Vite. Está diseñado específicamente para la **IE Manuel Fidencio Hidalgo Flores** con soporte completo para múltiples roles de usuario (director, subdirector, docente, estudiante, apoderado).

---

## ✨ Características Principales

### ✅ Completadas:
- ✅ Autenticación con múltiples roles
- ✅ 14 módulos/pantallas estructuradas
- ✅ Dark mode toggle
- ✅ Responsive design
- ✅ Sistema de routing automático según rol
- ✅ Componentes reutilizables
- ✅ Tipos TypeScript completos
- ✅ Docker containerización

### 📋 Por Completar:
- 📋 Backend API (Express.js/Node.js)
- 📋 Base de datos (MySQL/PostgreSQL)
- 📋 Integración de datos desde EduGest_final.html
- 📋 Implementación de lógica en cada módulo
- 📋 Sistema de notificaciones real-time
- 📋 Integración con Google Gemini API

---

## 🛠️ Instalación y Configuración

### 1. **Requisitos Previos**
```bash
- Node.js 18+ 
- npm o yarn
- Docker (opcional)
- Git
```

### 2. **Clonar/Preparar Repositorio**
```bash
cd /Users/osmer/Downloads/Sistemita/Sistemita_Nuevo
npm install
```

### 3. **Instalar dependencias faltantes**
```bash
npm install react-router-dom
```

### 4. **Variables de Entorno**
Crear archivo `.env.local`:
```env
VITE_API_URL=http://localhost:3001
VITE_GEMINI_API_KEY=tu-api-key-aqui
VITE_APP_NAME=EduGest
VITE_SCHOOL_NAME=IE Manuel Fidencio Hidalgo Flores
```

### 5. **Ejecutar en Desarrollo**

#### Opción A: Local (sin Docker)
```bash
npm run dev
# Abre: http://localhost:3000
```

#### Opción B: Con Docker
```bash
# Construir imagen
docker build -f Dockerfile.simple -t sistemita:latest .

# Ejecutar contenedor
docker-compose up
# Abre: http://localhost:3000
```

---

## 🔐 Cuentas de Demostración

Usa cualquiera de estas cuentas para probar:

| Rol | Email | Contraseña | Nombre |
|-----|-------|-----------|--------|
| **Director** | director@escuela.edu | director123 | Dr. Fernando López |
| **Subdirector** | subdirector@escuela.edu | sub123 | Mg. María García |
| **Docente** | profesor@escuela.edu | prof123 | Lic. Juan Pérez |
| **Estudiante** | estudiante@escuela.edu | est123 | Carlos Mendez |
| **Apoderado** | apoderado@escuela.edu | apod123 | Pedro Mendez |

---

## 📁 Estructura de Archivos

```
src/
├── App.tsx                      # Lógica principal y routing
├── main.tsx                     # Punto de entrada
├── types/index.ts              # Tipos TypeScript
├── components/
│   ├── MainLayout.tsx           # Sidebar + header
│   ├── ScreenContainer.tsx      # Wrapper de pantallas
│   └── GlassCard.tsx            # Componente Card
└── screens/                     # 14 módulos educativos
    ├── LoginScreen.tsx
    ├── DashboardScreen.tsx
    ├── VirtualClassroomScreen.tsx
    ├── MessagingScreen.tsx
    ├── ReportsScreen.tsx
    ├── DirectorDashboard.tsx
    ├── SubdirectorDashboard.tsx
    ├── CommunityScreen.tsx
    ├── TeachersScreen.tsx
    ├── StudentsScreen.tsx
    ├── StudentDashboard.tsx
    ├── GradesScreen.tsx
    ├── ScheduleScreen.tsx
    ├── AttendanceScreen.tsx
    └── ConductRulesScreen.tsx
```

---

## 🎨 Personalización

### Cambiar Colores Institucionales
Editar `src/index.css` o usar Tailwind:
```css
/* Rojo institucional */
--red-600: #af2428

/* Oro */
--amber-900: #705900

/* Cyan */
--cyan-900: #006381
```

### Agregar Logo
Reemplazar en `MainLayout.tsx`:
```tsx
<h1 className="text-xl font-bold text-red-600">
  {/* Tu logo aquí */}
  🏫 EduGest
</h1>
```

---

## 🔄 Control de Acceso por Rol

La aplicación automáticamente:

1. **Filtra el menú** según el rol del usuario
2. **Restringe acceso** a pantallas no autorizadas
3. **Muestra contenido específico** por rol en dashboards

**Ejemplo:** Un estudiante NO verá:
- Panel Director
- Panel Subdirector  
- Gestión de Profesores
- Gestión de Estudiantes

---

## 🗄️ Base de Datos

### Estructura SQL Incluida
El archivo `DATABASE_SCHEMA.sql` contiene:
- ✅ 15 tablas principales
- ✅ Relaciones y constraints
- ✅ Índices de performance
- ✅ Vistas útiles
- ✅ Datos iniciales

### Cómo Usar:
```bash
# Conectar a MySQL
mysql -u root -p

# Ejecutar schema
source DATABASE_SCHEMA.sql
```

---

## 🚀 Próximos Pasos (Roadmap)

### Fase 1: Backend (Semana 1-2)
```bash
# Crear API backend
mkdir backend && cd backend
npm init -y
npm install express cors dotenv mysql2 bcrypt jsonwebtoken
```

**Endpoints a crear:**
- `POST /api/auth/login`
- `GET /api/students`
- `POST /api/grades`
- `GET /api/courses/:courseId`
- etc.

### Fase 2: Migración de Datos (Semana 2-3)
```javascript
// Script para extraer datos de EduGest_final.html
// e importarlos a la base de datos
```

### Fase 3: Completar Módulos (Semana 3-4)
- Implementar lógica real en cada pantalla
- Agregar validaciones
- Testing y QA

### Fase 4: Deploy (Semana 4+)
```bash
# Build para producción
npm run build

# Deploy a servidor
docker build -t sistemita:prod .
docker push tu-registry/sistemita:prod
```

---

## 🔧 Configuración de Git

```bash
# Inicializar git (si no lo está)
git init

# Crear .gitignore
echo "node_modules/" >> .gitignore
echo ".env.local" >> .gitignore
echo "dist/" >> .gitignore

# Commit inicial
git add .
git commit -m "Initial commit: Complete EduGest structure"
```

---

## 📊 Monitoreo y Debugging

### Herramientas Recomendadas:
- **React DevTools**: Extensión de Chrome
- **Redux DevTools**: Para estado (si se agrega Redux)
- **Network Tab**: Revisar peticiones API
- **Console**: Ver logs y errores

### Habilitar Modo Debug:
```tsx
// En App.tsx
console.log('User:', user);
console.log('Current Screen:', currentScreen);
```

---

## 📞 Contacto y Soporte

**Para preguntas o issues:**
- Crear issue en GitHub
- Contactar al equipo de desarrollo
- Email: dev@mfhf.edu.pe

---

## 📝 Checklist de Implementación

- [ ] Instalar dependencias
- [ ] Ejecutar `npm run dev`
- [ ] Loguearse con cuenta demo
- [ ] Explorar cada módulo
- [ ] Diseñar API backend
- [ ] Crear base de datos
- [ ] Implementar endpoints
- [ ] Integrar con frontend
- [ ] Migrar datos de EduGest
- [ ] Testing y QA
- [ ] Deploy a producción

---

## 🎯 Métricas de Éxito

✅ **Sistema completamente funcional cuando:**
1. Todos los 14 módulos tengan lógica real
2. Datos migrados exitosamente
3. Tests automatizados pasan (>80% coverage)
4. Deploy en producción es exitoso
5. Tiempo de respuesta API < 200ms
6. Uptime >= 99.5%

---

**Versión:** 1.0.0-alpha  
**Última actualización:** Abril 2024  
**Creado por:** Claude & Equipo EduGest
