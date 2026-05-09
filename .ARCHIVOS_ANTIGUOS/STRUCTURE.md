# EduGest - Sistema Integral de Gestión Educativa
## Estructura Completa del Proyecto

### 📁 Organización de Carpetas

```
src/
├── App.tsx                          # Aplicación principal con routing
├── main.tsx                         # Punto de entrada
├── index.css                        # Estilos globales
│
├── components/                      # Componentes reutilizables
│   ├── MainLayout.tsx               # Layout principal con sidebar
│   ├── ScreenContainer.tsx          # Contenedor de pantallas
│   └── GlassCard.tsx                # Tarjeta con efecto glass
│
├── screens/                         # Pantallas principales (14 módulos)
│   ├── LoginScreen.tsx              # Autenticación
│   ├── DashboardScreen.tsx          # Panel inicial (Inicio)
│   ├── VirtualClassroomScreen.tsx   # Aula Virtual
│   ├── MessagingScreen.tsx          # Mensajes
│   ├── ReportsScreen.tsx            # Informes
│   ├── DirectorDashboard.tsx        # Panel Director
│   ├── SubdirectorDashboard.tsx     # Panel Subdirector
│   ├── CommunityScreen.tsx          # Comunidad
│   ├── TeachersScreen.tsx           # Profesores
│   ├── StudentsScreen.tsx           # Estudiantes
│   ├── StudentDashboard.tsx         # Dashboard del Estudiante
│   ├── GradesScreen.tsx             # Calificaciones
│   ├── ScheduleScreen.tsx           # Horario
│   ├── AttendanceScreen.tsx         # Asistencia
│   └── ConductRulesScreen.tsx       # Normas de Convivencia
│
├── types/                           # Definiciones de tipos TypeScript
│   └── index.ts                     # Interfaces y tipos
│
└── utils/                           # Utilidades (próximo)
    └── api.ts                       # Cliente API
    └── auth.ts                      # Funciones de autenticación
```

### 👥 Roles de Usuario y Acceso

#### **1. Director**
- ✅ Inicio
- ✅ Aula Virtual
- ✅ Mensajes
- ✅ Informes
- ✅ Comunidad
- ✅ Panel Director (gestión integral)
- ✅ Profesores (CRUD completo)
- ✅ Estudiantes (CRUD completo)

#### **2. Subdirector**
- ✅ Inicio
- ✅ Aula Virtual
- ✅ Mensajes
- ✅ Informes
- ✅ Comunidad
- ✅ Panel Director (lectura)
- ✅ Panel Subdirector (gestión académica)
- ✅ Profesores (lectura y asignaciones)
- ✅ Estudiantes (lectura y reportes)

#### **3. Docente**
- ✅ Inicio
- ✅ Aula Virtual
- ✅ Mensajes
- ✅ Informes
- ✅ Comunidad
- ✅ Calificaciones (registro y actualización)
- ✅ Horario (visualización)
- ✅ Asistencia (registro)

#### **4. Estudiante**
- ✅ Inicio
- ✅ Aula Virtual
- ✅ Mensajes
- ✅ Informes
- ✅ Comunidad
- ✅ Dashboard del Estudiante (mi desempeño)
- ✅ Calificaciones (lectura)
- ✅ Horario (visualización)
- ✅ Asistencia (visualización)
- ✅ Normas de Convivencia

#### **5. Apoderado/Padre**
- ✅ Inicio
- ✅ Mensajes
- ✅ Informes
- ✅ Comunidad
- ✅ Dashboard del Estudiante (datos del hijo)

---

### 📊 Módulos Implementados

| # | Módulo | Componente | Estado | Descripción |
|---|--------|-----------|--------|-------------|
| 1 | Inicio | DashboardScreen | ✅ Framework listo | Panel inicial con KPIs y gráficos |
| 2 | Aula Virtual | VirtualClassroomScreen | 📋 Placeholder | Clases en línea, tareas, recursos |
| 3 | Mensajes | MessagingScreen | 📋 Placeholder | Comunicación en tiempo real |
| 4 | Informes | ReportsScreen | 📋 Placeholder | Generación de reportes académicos |
| 5 | Panel Director | DirectorDashboard | 📋 Placeholder | Gestión integral institucional |
| 6 | Panel Subdirector | SubdirectorDashboard | 📋 Placeholder | Gestión académica |
| 7 | Comunidad | CommunityScreen | 📋 Placeholder | Eventos, galerías, noticias |
| 8 | Profesores | TeachersScreen | 📋 Placeholder | CRUD de docentes |
| 9 | Estudiantes | StudentsScreen | 📋 Placeholder | CRUD de alumnos |
| 10 | Dashboard Estudiante | StudentDashboard | 📋 Placeholder | Desempeño personal/hijo |
| 11 | Calificaciones | GradesScreen | 📋 Placeholder | Matriz de notas |
| 12 | Horario | ScheduleScreen | 📋 Placeholder | Calendario académico |
| 13 | Asistencia | AttendanceScreen | 📋 Placeholder | Registro de asistencia |
| 14 | Normas | ConductRulesScreen | 📋 Placeholder | Reglamento institucional |

---

### 🔐 Sistema de Autenticación

**Cuentas de demo disponibles:**

| Email | Contraseña | Rol | Nombre |
|-------|-----------|-----|--------|
| director@escuela.edu | director123 | director | Dr. Fernando López |
| subdirector@escuela.edu | sub123 | subdirector | Mg. María García |
| profesor@escuela.edu | prof123 | teacher | Lic. Juan Pérez |
| estudiante@escuela.edu | est123 | student | Carlos Mendez |
| apoderado@escuela.edu | apod123 | parent | Pedro Mendez |

---

### 🎨 Sistema de Diseño

**Colores Institucionales (EduGest):**
- Rojo Institucional: `#af2428`
- Oro: `#705900`
- Cyan: `#006381`
- Superficies: `#f7f6f6` (light) / `#0d0e0f` (dark)

**Tipografía:**
- Headlines: Plus Jakarta Sans (700, 800)
- Body: Manrope (400, 500, 600)

**Componentes Base:**
- Cards con glassmorphism
- Inputs sin bordes (ghost border on focus)
- Scrollbars finos y sutiles
- Animaciones suaves (cubic-bezier)
- Dark mode completo

---

### 🗄️ Esquema de Base de Datos (Próximo)

#### **Tablas Principales:**

```
users
├── id (PK)
├── name
├── email (UNIQUE)
├── password_hash
├── role (enum: director, subdirector, teacher, student, parent)
├── school_id (FK)
├── created_at
└── updated_at

students
├── id (PK)
├── user_id (FK)
├── enrollment_number (UNIQUE)
├── grade_level
├── section
├── guardian_id (FK: users)
├── status (active, inactive, graduated)
└── date_of_birth

courses
├── id (PK)
├── name
├── code (UNIQUE)
├── teacher_id (FK: users)
├── grade_level
├── section
├── credits
├── description

grades
├── id (PK)
├── student_id (FK)
├── course_id (FK)
├── period (Q1, Q2, Q3, Q4, Final)
├── competencies (JSON)
├── average
├── recorded_date

attendance
├── id (PK)
├── student_id (FK)
├── course_id (FK)
├── date
├── status (present, absent, late, excused)

messages
├── id (PK)
├── sender_id (FK: users)
├── recipient_id (FK: users)
├── subject
├── body
├── sent_date
├── read_date

schedule
├── id (PK)
├── course_id (FK)
├── day_of_week
├── start_time
├── end_time
├── room
```

---

### 🚀 Próximos Pasos

1. **Implementación de API Endpoints**
   - Express.js/Node.js backend
   - REST o GraphQL
   - Conexión a base de datos

2. **Migración de Datos**
   - Extracción de EduGest_final.html
   - Importación a base de datos
   - Validación de integridad

3. **Desarrollo de Módulos**
   - Completar cada pantalla
   - Implementar lógica de negocio
   - Testing y QA

4. **Deployment**
   - Containerización con Docker (ya configurado)
   - CI/CD pipeline
   - Hosting en servidor
   - Configuración de dominio

---

### 📦 Dependencias Instaladas

```json
{
  "react": "^19.0.0",
  "react-dom": "^19.0.0",
  "react-router-dom": "^6.20.0",
  "vite": "^6.2.0",
  "@vitejs/plugin-react": "^5.0.4",
  "tailwindcss": "^4.1.14",
  "lucide-react": "^0.546.0",
  "recharts": "^3.8.1",
  "motion": "^12.23.24",
  "@google/genai": "^1.29.0"
}
```

---

### 🔄 Flujo de Autenticación

1. Usuario ingresa credenciales en LoginScreen
2. Se validan contra array de demo (próximamente: API backend)
3. Se crea objeto User con rol y datos
4. Se guarda en localStorage para persistencia
5. App redirige a MainLayout con acceso según rol
6. Sidebar filtra menú según permisos del rol
7. Logout limpia localStorage y retorna a LoginScreen

---

### 🎯 Estado Actual

✅ **Completado:**
- Estructura de carpetas organizada
- 14 pantallas creadas (framework base)
- Sistema de routing funcional
- Autenticación simulada con demo accounts
- MainLayout con sidebar adaptativo
- Dark mode toggle
- Componentes base (ScreenContainer)
- Tipos TypeScript definidos
- DashboardScreen con gráficos

📋 **En Progreso:**
- Implementación de lógica en cada módulo
- Integración con API backend

---

### 📝 Notas Importantes

- **Migración de datos:** Los datos de EduGest_final.html están listos para extraer e importar
- **Escalabilidad:** La arquitectura está diseñada para crecer con nuevas características
- **Testing:** Se recomienda implementar pruebas unitarias y E2E
- **Performance:** Usar React.memo y useCallback para optimizar renders
- **Accesibilidad:** Mantener WCAG 2.1 AA

---

**Última actualización:** Abril 2024  
**Versión:** 1.0.0-alpha
