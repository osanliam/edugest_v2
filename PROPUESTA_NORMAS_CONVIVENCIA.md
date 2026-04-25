# Propuesta: Sistema de Normas de Convivencia Mejorado - EDUGEST

## 🎯 Objetivo
Integrar un sistema de Normas de Convivencia con arquitectura moderna que:
- Muestre los 5 ejes de convivencia con sus normas y conductas observables
- Permita registrar infracciones por estudiante con niveles de gravedad
- Genere reportes de conducta por alumno y por grupo
- Se integre con el módulo de Asistencia (marcar conducta al mismo tiempo)
- Mantenga historial completo de infracciones

---

## 📋 Estructura de Datos

### 1. EJES DE CONVIVENCIA (Datos Base - No Cambian)
```typescript
interface EjeConvivencia {
  id: string;
  valor: string;          // Ej: "Respeto"
  eje: string;            // Ej: "Respeto y Buen Trato"
  color: 'cyan' | 'lime' | 'magenta' | 'blue' | 'amber';
  icono: string;          // Emoji
  normaGeneral: string;   // Descripción general
  conductas: Conducta[];
}

interface Conducta {
  id: string;
  num: number;
  texto: string;
}
```

**Los 5 Ejes:**
1. **Respeto y Buen Trato** (Cyan) - 4 conductas
2. **Responsabilidad y Cumplimiento** (Lime) - 4 conductas
3. **Convivencia Pacífica** (Magenta) - 3 conductas
4. **Responsabilidad Digital** (Blue) - 4 conductas
5. **Cuidado de Espacios** (Amber) - 3 conductas

---

### 2. NIVELES DE INFRACCIÓN
```typescript
type NivelInfraccion = 'leve' | 'grave' | 'muy-grave';

interface Infraccion {
  id: string;
  alumnoId: string;
  fecha: string;          // YYYY-MM-DD
  ejeId: string;          // Referencia al eje
  conductaId: string;     // Referencia a la conducta específica
  nivel: NivelInfraccion;
  descripcion: string;    // Observación libre
  docente: string;        // Quien registra
  evidencia?: string;     // Notas adicionales
}
```

**Definición de Niveles:**
- **Leve**: Comportamientos que afectan minimamente la convivencia
- **Grave**: Comportamientos que comprometen la convivencia
- **Muy Grave**: Comportamientos que constituyen riesgo o incumplen normas fundamentales

---

### 3. DATOS PERSISTIDOS EN localStorage
```
ie_ejes_convivencia           → Configuración de ejes (estática)
ie_infracciones_v2            → Array de infracciones registradas
ie_conducta_por_alumno_v2     → Resumen de conducta por estudiante
```

---

## 🎨 Pantalla Principal: NormasConvivenciaScreen.tsx

### Secciones:

#### 1. **Header Elegante**
```
EDUGEST NORMAS DE CONVIVENCIA
Registro y seguimiento de infracciones | Comunicación de conducta a padres
```

#### 2. **Navegación por Pestañas**
- 📖 **Ver Normas** - Consultar los 5 ejes y sus conductas
- 📝 **Registrar Infracción** - Marcar nueva infracción
- 📊 **Mi Conducta** - Dashboard por alumno
- 📋 **Reporte General** - Estadísticas por curso

---

### Pestaña 1: 📖 Ver Normas

**Estructura:**
- Acordeón con los 5 ejes
- Al expandir un eje:
  - Norma General (texto descriptivo)
  - Lista de 3-4 conductas observables
  - Color visual del eje

**Ejemplo:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🤝 RESPETO Y BUEN TRATO (Cyan)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Promuevo relaciones basadas en la amabilidad, 
aceptación y reconocimiento del otro.

Conductas Observables:
  1. Me comunico con lenguaje amable y respetuoso
  2. Reconozco y valoro las diferencias personales
  3. Escucho con atención las ideas y sentimientos
  4. Fomento un ambiente donde todos se sientan seguros
```

---

### Pestaña 2: 📝 Registrar Infracción

**Flujo:**
1. Selector de alumno (búsqueda + dropdown)
2. Selector de eje (5 tarjetas coloreadas)
3. Selector de conducta (dentro del eje seleccionado)
4. Selector de nivel (3 botones: Leve/Grave/Muy Grave)
5. Campo de observación (textarea)
6. Botón "Registrar"

**Colores de Nivel:**
- **Leve**: Amber-600/700
- **Grave**: Orange-600/700
- **Muy Grave**: Red-600/700

**Historial en la misma pantalla:**
- Últimas 10 infracciones registradas
- Filtrable por alumno
- Con opción de editar/eliminar

---

### Pestaña 3: 📊 Mi Conducta

**Solo visible para alumnos logueados:**
- Tarjeta con su información
- 5 indicadores visuales (uno por eje)
  - Barra de progreso verde/amarillo/rojo según infracciones
  - Total de infracciones por eje
- Historial de sus infracciones
- Mensaje positivo si no tiene infracciones

**Ejemplo:**
```
┌─────────────────────────────┐
│ Juan Pérez García - 4to A   │
├─────────────────────────────┤
│                             │
│ Respeto          ━━━━━━━━━  │ 0 infracciones
│ Responsabilidad  ━━━━━━━━━  │ 2 infracciones
│ Convivencia      ━━━━━━━━━  │ 0 infracciones
│ Digital          ━━━━━━━━━  │ 1 infracción
│ Cuidado Espacios ━━━━━━━━━  │ 0 infracciones
│                             │
│ Total: 3 infracciones       │
└─────────────────────────────┘
```

---

### Pestaña 4: 📋 Reporte General

**Vistas:**
1. **Por Grado**
   - Tabla: Grado | Estudiantes | Leves | Graves | Muy Graves
   
2. **Por Eje**
   - Gráfico pie/barra mostrando distribución de infracciones

3. **Top Infracciones**
   - Ranking de conductas más infringidas

4. **Estudiantes con Mayor Conducta**
   - Ranking de estudiantes con más infracciones (últimos 30 días)

---

## 🔧 Integración con Otros Módulos

### 1. **AttendanceScreen** (Asistencia)
- Opción: "Marcar conducta al mismo tiempo"
- Quick-register de infracción leve sin salir de asistencia

### 2. **DirectorDashboardModern** (Panel Director)
- Card con "Conducta Institucional"
  - % estudiantes sin infracciones
  - Infracciones registradas hoy
  - Eje con más infracciones

### 3. **AlumnosScreen** (Gestión de Alumnos)
- Button: "Ver Conducta" → abre modal con historial de infracciones

---

## 📊 Estadísticas y Reportes

### Para Directores:
- Tendencia de infracciones (gráfico temporal)
- Docentes más activos en registro
- Patrones de comportamiento por grado

### Para Docentes:
- Conducta de su grupo
- Seguimiento individual

### Para Padres:
- Historial de su hijo
- Comunicación automática en infracciones graves/muy graves

---

## 💾 localStorage Schema

```typescript
// Configuración estática de ejes (se carga al iniciar)
localStorage.setItem('ie_ejes_convivencia', JSON.stringify([
  {
    id: 'eje-1',
    valor: 'Respeto',
    eje: 'Respeto y Buen Trato',
    color: 'cyan',
    icono: '🤝',
    normaGeneral: '...',
    conductas: [...]
  },
  // ... 4 ejes más
]));

// Registro de infracciones
localStorage.setItem('ie_infracciones_v2', JSON.stringify([
  {
    id: 'inf-001',
    alumnoId: 'alum-123',
    fecha: '2026-04-24',
    ejeId: 'eje-1',
    conductaId: 'c1',
    nivel: 'leve',
    descripcion: 'No respetó turno de palabra en clase',
    docente: 'Prof. García',
    evidencia: 'Testigos: 3 compañeros'
  },
  // ... más infracciones
]));

// Resumen por alumno
localStorage.setItem('ie_conducta_por_alumno_v2', JSON.stringify([
  {
    alumnoId: 'alum-123',
    totalInfracciones: 3,
    porNivel: {
      leve: 2,
      grave: 1,
      'muy-grave': 0
    },
    porEje: {
      'eje-1': 1,
      'eje-2': 0,
      'eje-3': 1,
      'eje-4': 1,
      'eje-5': 0
    },
    ultimas: ['inf-001', 'inf-002', 'inf-003'],
    ultimaInfraccion: '2026-04-24'
  }
]));
```

---

## 🎨 Componentes Reutilizables

### 1. **EjeCard**
- Muestra un eje con su color, icono y descripción
- Usado en: Vista Normas, Selector de Eje

### 2. **InfraccionBadge**
- Pequeña etiqueta coloreada (Leve/Grave/Muy Grave)
- Usado en: Historiales, Reportes

### 3. **ConductaIndicator**
- Barra visual con indicador de infracciones
- Usado en: "Mi Conducta", Dashboard

---

## 🚀 Implementación Sugerida

### Fase 1: Core
- `NormasConvivenciaScreen.tsx` con 2 tabs básicos (Ver Normas + Registrar)
- Estructura de datos completa
- localStorage funcionando

### Fase 2: Visualización
- Tabs "Mi Conducta" y "Reporte General"
- Gráficos y estadísticas
- Estilos mejorados con colores sólidos

### Fase 3: Integración
- Conectar con AttendanceScreen
- Actualizar DirectorDashboardModern
- Agregar a AlumnosScreen

---

## ✅ Ventajas de Esta Propuesta

✓ **Educativo**: Alinea con normas MINEDU  
✓ **Claro**: 5 ejes bien definidos y comunicables  
✓ **Completo**: Incluye registro, seguimiento y reportes  
✓ **Integrado**: Se conecta naturalmente con otros módulos  
✓ **Escalable**: Fácil de extender con nuevos ejes o niveles  
✓ **Visual**: Usa colores y gráficos para claridad  
✓ **Histórico**: Mantiene registro completo de conducta  
