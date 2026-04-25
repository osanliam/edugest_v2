# 📊 Arquitectura de Almacenamiento Multi-Docente

## El Problema

Cada docente es **independiente**:
- Crea sus propias **columnas** (instrumentos de evaluación)
- Usa **competencias diferentes** (C1, C2, C3 o las que defina)
- Define sus **criterios propios**
- **Escala de notas** puede variar

**Pregunta:** Si Docente A usa C1 con columnas [Prueba, Tarea, Participación] y Docente B usa C2 con columnas [Examen, Proyecto], ¿cómo se sincroniza en el panel del Administrador sin conflictos?

---

## La Solución: Estructura de Almacenamiento

### 1. **Separación por Docente** (Clave)

Cada **calificativo debe incluir**:
```json
{
  "id": "docente-001|alumno-xyz|comp1|col-123|timestamp",
  "docenteId": "docente-001",           // ← NUEVO: ID del docente que registró
  "alumnoId": "alumno-xyz",
  "columnaId": "col-1776863791573",
  "competenciaId": "comp1",
  "competencia": "Lee textos diversos",
  "notaNumerica": 7.1,
  "calificativo": "C",
  "fecha": "2026-04-25T16:08:17",
  "periodo": "Abril 2026"
}
```

**Por qué funciona:**
- La clave única `docenteId|alumnoId|columnaId` evita conflictos
- Si Docente A y Docente B califican al mismo alumno en C1, se almacenan **separadamente**
- El Admin ve TODOS los registros sin conflicto

### 2. **localStorage vs Base de Datos**

**PROBLEMA ACTUAL:** Todo está en localStorage (navegador)
```
localStorage['ie_calificativos_v2'] = [747 calificativos]
```

**Cuando hay múltiples docentes:**
- ❌ Docente A abre navegador → carga sus 200 calificativos
- ❌ Docente B abre mismo navegador → **sobrescribe** datos de A
- ❌ Admin intenta ver → solo ve los últimos que se cargaron
- ❌ Pierdes datos

**SOLUCIÓN:** Necesitas una **Base de Datos Real**

---

## Arquitectura Recomendada

### Opción 1: Turso + Edge SQLite (Recomendado)

```
┌─────────────┐
│ Navegador   │
│ Docente A   │
└──────┬──────┘
       │ POST /api/calificativos
       ▼
┌─────────────────────────────┐
│ Edge Function (Vercel/Edge) │
└──────┬──────────────────────┘
       │ INSERT INTO calificativos
       ▼
┌─────────────────────────────┐
│ Turso Database (SQLite)     │
│ (Almacenamiento persistente)│
└─────────────────────────────┘
       ▲
       │ SELECT * FROM calificativos
       │ WHERE docenteId = ? OR admin = true
┌──────┴──────────────────────┐
│ Panel Admin (ve todos)      │
└─────────────────────────────┘
```

**Ventajas:**
- Cada docente guarda en DB
- No hay sobrescritura
- Admin ve TODO centralizado
- Escalable a 100+ docentes

**Estructura de tabla Turso:**
```sql
CREATE TABLE calificativos (
  id TEXT PRIMARY KEY,
  docenteId TEXT NOT NULL,
  alumnoId TEXT NOT NULL,
  columnaId TEXT NOT NULL,
  competenciaId TEXT NOT NULL,
  notaNumerica REAL,
  calificativo TEXT,
  fecha DATETIME,
  periodo TEXT,
  INDEX(docenteId, alumnoId, columnaId)
);

CREATE TABLE columnas (
  id TEXT PRIMARY KEY,
  docenteId TEXT NOT NULL,
  nombre TEXT,
  competenciaId TEXT,
  tipo TEXT, -- "Prueba", "Tarea", "Participación"
  fechaCreacion DATETIME
);

CREATE TABLE competencias (
  id TEXT PRIMARY KEY,
  docenteId TEXT,
  nombre TEXT,
  descripcion TEXT
);
```

---

## Cómo Funcionaría el Flujo

### Docente A llena calificativos:
```javascript
// En navegador del Docente A
const calificativos = [
  {
    docenteId: "docente-001",
    alumnoId: "est-123",
    columnaId: "col-123", // Prueba de Docente A
    competenciaId: "comp1",
    notaNumerica: 8.5,
    calificativo: "B"
  },
  // ... más calificativos de A
];

// Envía a servidor (NO localStorage)
fetch('/api/calificativos', {
  method: 'POST',
  body: JSON.stringify(calificativos)
});
```

### Docente B llena calificativos diferentes:
```javascript
// En navegador del Docente B
const calificativos = [
  {
    docenteId: "docente-002",
    alumnoId: "est-123", // MISMO alumno, pero OTRO docente
    columnaId: "col-456", // Proyecto de Docente B
    competenciaId: "comp2",
    notaNumerica: 9.0,
    calificativo: "A"
  },
  // ... más calificativos de B
];

// Envía a servidor
fetch('/api/calificativos', {
  method: 'POST',
  body: JSON.stringify(calificativos)
});
```

### Admin ve ambos sin conflicto:
```javascript
// Panel Admin
GET /api/calificativos?alumnoId=est-123
// Retorna:
[
  {
    docenteId: "docente-001", // Nota de Docente A
    columnaId: "col-123",
    competenciaId: "comp1",
    notaNumerica: 8.5,
    calificativo: "B"
  },
  {
    docenteId: "docente-002", // Nota de Docente B
    columnaId: "col-456",
    competenciaId: "comp2",
    notaNumerica: 9.0,
    calificativo: "A"
  }
]
```

**Sin conflictos** porque cada registro identifica su origen.

---

## Opción 2: Mantener localStorage pero Sincronizar

Si no puedes usar base de datos aún:

```javascript
// Estructura de localStorage
{
  "ie_calificativos_v2": [...todas las notas...],
  "ie_docentes": {
    "docente-001": { columnas: [...], competencias: [...] },
    "docente-002": { columnas: [...], competencias: [...] }
  },
  "ie_sync_timestamp": "2026-04-25T16:00:00"
}
```

**Riesgo:** Sigue siendo single-browser. Si abres en 2 pestañas/navegadores simultáneamente, hay conflicto.

---

## Recomendación Final

### ❌ NO HAGAS:
- Guardar todo en un único array `ie_calificativos_v2`
- Confiar solo en localStorage con múltiples docentes
- Sobrescribir datos de otros docentes

### ✅ HAZ:
1. **Identifica cada registro con `docenteId`**
2. **Usa una base de datos** (Turso es gratis y perfecto)
3. **Un endpoint `/api/calificativos` para guardar/traer**
4. **El Admin consulta sin filtro** → ve de TODOS los docentes
5. **Cada Docente consulta con filtro** → ve solo SUS notas

---

## Ejemplo de Implementación Rápida

### Backend (Edge Function - Vercel):

```typescript
// /api/calificativos
import { turso } from '@/lib/turso';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    // Guardar calificativos
    const { calificativos, docenteId } = req.body;
    
    for (const cal of calificativos) {
      cal.docenteId = docenteId; // Asignar docente
      
      await turso.execute(
        'INSERT INTO calificativos VALUES (...)',
        [cal.id, cal.docenteId, cal.alumnoId, ...]
      );
    }
    
    return res.json({ success: true, saved: calificativos.length });
  }
  
  if (req.method === 'GET') {
    const { docenteId } = req.query;
    
    // Si es Admin → trae TODO
    // Si es Docente → trae solo sus notas
    const query = docenteId === 'admin' 
      ? 'SELECT * FROM calificativos'
      : `SELECT * FROM calificativos WHERE docenteId = ?`;
    
    const result = await turso.execute(query, [docenteId]);
    return res.json(result);
  }
}
```

### Frontend (Docente):

```javascript
// En CalificativosScreen.tsx
async function guardarCalificativos(calificativos) {
  const response = await fetch('/api/calificativos', {
    method: 'POST',
    body: JSON.stringify({
      calificativos,
      docenteId: currentUser.id // Identifica al docente
    })
  });
  
  const result = await response.json();
  console.log(`✅ ${result.saved} calificativos guardados`);
}

// Cargar calificativos
async function loadCalificativos() {
  const response = await fetch(
    `/api/calificativos?docenteId=${currentUser.id}`
  );
  const calificativos = await response.json();
  setCalificativos(calificativos);
}
```

---

## Resumen

| Aspecto | Problema Actual | Solución |
|--------|---|---|
| **Almacenamiento** | localStorage único | Base de datos (Turso) |
| **Múltiples docentes** | Sobrescritura | Cada docente tiene su `docenteId` |
| **Admin ve todos** | Ve solo últimos cargados | Query sin filtro |
| **Conflictos** | Sí, frecuentes | No, registros separados |
| **Escalabilidad** | Máx 100-200 notas | Miles de notas |

---

## ¿Necesitas que implemente esto?

Si quieres evitar problemas como los de C2 y C3 (sin datos), la solución es:
1. **Crear endpoint API**
2. **Conectar a Turso**
3. **Agregar `docenteId` a cada calificativo**

¿Quieres que lo haga?
