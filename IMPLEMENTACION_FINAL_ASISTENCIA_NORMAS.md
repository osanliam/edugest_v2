# Implementación: Asistencia y Normas de Convivencia - EDUGEST v2

> Basado en el sistema funcional de EduGest v43, adaptado y mejorado para EDUGEST v2

---

## 📋 ASISTENCIA

### Estructura de Datos (localStorage: `ie_asistencia_registro_v2`)

```typescript
interface RegistroAsistencia {
  id: string;
  alumnoId: string;
  fecha: string;           // YYYY-MM-DD
  estado: 'asistio' | 'falto' | 'retrasado' | 'justifico' | 'permiso';
  bimestre: number;        // 0-3
  horaRegistro?: string;   // HH:mm (opcional)
  observaciones?: string;
}
```

### Estados y Colores

```
P  → Asistió      | Verde    (Emerald-600/100)  | ✓
T  → Retrasado    | Naranja  (Amber-600/100)    | ⏰
F  → Falto        | Rojo     (Red-600/100)      | ✗
J  → Justificó    | Azul     (Blue-600/100)     | 📋
PE → Permiso      | Púrpura  (Violet-600/100)   | 📝
```

### Funcionalidades de Asistencia

#### 1. **Registro Diario** (Vista por defecto)
- **Filtro por Grado** - Dropdown para seleccionar grado
- **Filtro por Sección** - Dropdown (dependiente del grado)
- **Búsqueda de Alumno** - Campo de texto para buscar por nombre
- **Selector de Fecha** - Cambiar entre fechas
- **Tabla de Registro**:
  - Columna: Alumno (nombre, grado, sección)
  - 5 Botones de estado (P/T/F/J/PE)
  - Botón "Limpiar" para eliminar registro
  - Contador en tiempo real de cada estado

#### 2. **Acciones Rápidas**
- **Marcar Todos como Presente** (P)
- **Marcar Todos como Falto** (F)
- **Marcar Todos como Retrasado** (T)

#### 3. **Reporte Bimestral** (Segunda pestaña)
- Tabla por alumno mostrando:
  - Nombre y grado
  - Presentes, Retrasados, Faltos, Justificados, Permisos
  - Porcentaje de asistencia
  - Días hábiles registrados en el bimestre

#### 4. **Guardado Automático**
- localStorage se sincroniza en cada cambio
- Feedback visual de "Guardado" (flash de 2-3 segundos)

---

## 📜 NORMAS DE CONVIVENCIA

### Estructura de Datos

#### A. Ejes de Convivencia (Datos Base - Static)
```typescript
interface NormaConvivencia {
  id: string;
  eje: string;              // Ej: "Respeto y Buen Trato"
  icon: string;             // Emoji
  color: string;            // Color hexadecimal
  normaGeneral: string;     // Descripción general
  normas: Norma[];          // Array de 3-4 normas
}

interface Norma {
  id: string;
  num: number;              // 1, 2, 3, etc
  texto: string;            // Descripción de la norma
}
```

#### B. Registros de Infracciones (localStorage: `ie_infracciones_v2`)
```typescript
interface RegistroInfraccion {
  id: string;
  alumnoId: string;
  fecha: string;
  ejeId: string;
  normaNumerro: number;
  normaTexto: string;
  tipo: 'cumplimiento' | 'incumplimiento';
  descripcion: string;      // Lo que pasó
  accion: string;           // Cómo se resolvió
  observaciones?: string;   // Notas adicionales
  registradoPor: string;    // Nombre del docente
}
```

### Los 5 Ejes

```
1️⃣  Respeto y Buen Trato (Cyan) - 4 normas
    • Comunicación amable
    • Reconocimiento de diferencias
    • Escucha activa
    • Ambiente seguro

2️⃣  Responsabilidad (Lime) - 4 normas
    • Puntualidad
    • Presentación personal
    • Tareas académicas
    • Orientaciones del docente

3️⃣  Convivencia Pacífica (Magenta) - 3 normas
    • Diálogo para resolver
    • Regulación emocional
    • Cooperación

4️⃣  Responsabilidad Digital (Blue) - 4 normas
    • Seguridad en tecnología
    • Respeto de privacidad
    • Comportamiento ético digital
    • Cuidado de equipos

5️⃣  Cuidado de Espacios (Amber) - 3 normas
    • Orden y limpieza
    • Preservación de bienes
    • Recursos naturales
```

### Funcionalidades de Normas

#### 1. **Vista: Registro de Infracciones**

**Panel Izquierdo: Selección de Norma**
- Filtro de Grado y Sección (igual que Asistencia)
- Botones de los 5 Ejes (selectable)
- Lista de Normas del Eje (scrollable, máx 180px)
- Campo: Tipo (Cumplimiento / Incumplimiento) - Toggle
- Campo: Fecha (date picker)
- Textarea: Descripción de situación
- Input: Acción tomada
- Textarea: Observación (opcional)
- Botón: Registrar con contador de alumnos

**Panel Derecho: Lista de Alumnos**
- Contador total (Ej: "👥 Alumnos (28)")
- Botón Toggle: "☑ Todos" / "☐ Ninguno"
- Contador de seleccionados
- Checkboxes con:
  - Avatar/Inicial
  - Nombre del alumno
  - Badge si ya tiene registro en esa norma
- Scroll infinito

#### 2. **Vista: Historial de Infracciones**

**Por Alumno:**
- Búsqueda por nombre
- Acordeón expandible por alumno
- Resumen: ✅ Cumplimientos | ⚠️ Incumplimientos
- Historial de registros:
  - Badge de tipo (Cumplió/Incumplió)
  - Icono y número de norma
  - Fecha
  - Descripción de situación
  - Acción tomada
  - Observaciones
  - Registrado por
  - Botón "×" para eliminar
  
---

## 🎨 Componentes y Estilos

### Colores por Eje (Del sistema antiguo)
```
EJE_COLS=['#00E5FF', '#69FF47', '#B388FF', '#FF9F00', '#FF3D5A', '#FFD60A']
```

Asignados a:
1. Respeto → #00E5FF (Cyan)
2. Responsabilidad → #69FF47 (Lime)
3. Convivencia → #B388FF (Magenta)
4. Digital → #FF9F00 (Amber)
5. Espacios → #FF3D5A (Rose)

### Tipografía
- **Headlines**: Plus Jakarta Sans (700)
- **Body**: Manrope (400/500)
- **Monospace**: Para códigos

### Espaciado y Radios
- Border-radius: 8-12px (inputs), 20px (botones pill)
- Gap: 8-12px (flexbox)
- Padding: 10-16px (cards/inputs)

---

## 📊 Integración con Otros Módulos

### DirectorDashboardModern
Agregar tarjeta:
```
┌─────────────────────────┐
│ 📚 CONDUCTA INSTITUCIONAL│
├─────────────────────────┤
│ Sin Infracciones: 78%   │
│ Leves: 12               │
│ Graves: 3               │
│ Eje Crítico: Digital    │
└─────────────────────────┘
```

### AttendanceScreen
Integración ligera:
- Opción: "Ver Conducta de Alumno" (modal con historial)
- No necesita fusión directa

### AlumnosScreen
Botón en cada alumno: "📊 Ver Conducta"

---

## 🔄 Flujos de Uso

### Asistencia - Caso Normal
1. Docente selecciona grado y sección
2. Ve tabla con alumnos
3. Hace clic en estado (P/T/F/J/PE)
4. Se registra automáticamente
5. Estadísticas se actualizan en tiempo real
6. Puede modificar haciendo clic nuevamente
7. Al terminar, todos los registros están guardados

### Normas - Caso Normal
1. Docente selecciona grado y sección
2. Elige un eje (5 botones)
3. Selecciona la norma específica (listado)
4. Elige tipo (Cumplió/Incumplió)
5. Ingresa descripción, acción, observación
6. Selecciona 1 o más alumnos (checkboxes)
7. Registra → todos reciben ese registro
8. Puede ver historial de cada alumno

---

## 💾 localStorage Schema Completo

```javascript
// Asistencia
ie_asistencia_registro_v2: [
  {
    id: 'a1',
    alumnoId: 'alum-123',
    fecha: '2026-04-24',
    estado: 'asistio',
    bimestre: 1,
    horaRegistro: '08:05',
    observaciones: 'Llego 5 min tarde'
  },
  // ... más registros
]

// Normas
ie_infracciones_v2: [
  {
    id: 'inf-001',
    alumnoId: 'alum-456',
    fecha: '2026-04-24',
    ejeId: 'eje-1',
    normaNumerro: 2,
    normaTexto: 'Reconozco diferencias personales...',
    tipo: 'incumplimiento',
    descripcion: 'Burló a compañero por color de piel',
    accion: 'Llamado verbal, diálogo con padres',
    observaciones: 'Primera vez del estudiante',
    registradoPor: 'Prof. García'
  },
  // ... más infracciones
]
```

---

## ✅ Checklist de Implementación

**Asistencia:**
- [ ] Estructura de datos y tipos TypeScript
- [ ] Componente principal con 2 pestañas
- [ ] Vista Registro (tabla Excel-style)
- [ ] Vista Reporte (estadísticas bimestral)
- [ ] Filtros (grado, sección, búsqueda)
- [ ] localStorage sincronizado
- [ ] Estados con colores correctos
- [ ] Botones de marcar todos
- [ ] Feedback visual de guardado

**Normas:**
- [ ] Datos base de 5 ejes (hardcoded)
- [ ] Estructura de infracciones
- [ ] Vista Registro (2 paneles)
- [ ] Vista Historial (acordeón)
- [ ] Selección múltiple de alumnos
- [ ] localStorage sincronizado
- [ ] Colores por eje
- [ ] Filtros (grado, sección)
- [ ] Búsqueda de alumno en historial
- [ ] Eliminar registros

---

## 🚀 Notas Técnicas

- **Sin API**: Todo usa localStorage
- **Modo offline**: Funciona completamente offline
- **Datos compartidos**: Alumnos vienen de `ie_alumnos`
- **Sincronización**: Manual (se puede agregar auto-sync a Turso después)
- **Responsivo**: Grid/Flex para móvil y desktop
- **Animaciones**: Motion React para transiciones suaves

---

## 📝 Observaciones del Sistema Antiguo

✓ Sistema de asistencia probado y funcional  
✓ Estados claros con 5 opciones (P/T/F/J/PE)  
✓ Normas bien estructuradas con 5 ejes  
✓ Historial por alumno útil para seguimiento  
✓ Colores y diseño limpio  
✓ Feedback visual inmediato  

Mejoras para v2:
✓ Integración con nuevo diseño de EDUGEST  
✓ Colores sólidos en lugar de translúcidos  
✓ Componentes reutilizables (HeaderElegante)  
✓ TypeScript strict  
✓ Motion React para animaciones suaves  
