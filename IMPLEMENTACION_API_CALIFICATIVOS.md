# 🔧 Implementación API de Calificativos Multi-Docente

## ¿Qué se implementó?

Se creó una arquitectura **API + Base de Datos** para gestionar calificativos sin perder datos cuando múltiples docentes trabajan simultáneamente.

---

## Archivos Creados

### Backend (API)

1. **`api/calificativos.js`** (Lógica central)
   - `initializeCalificativosTable()` - Crear tablas en Turso
   - `getCalificativos()` - Obtener calificativos con filtros
   - `createCalificativos()` - Guardar calificativos en DB
   - `updateCalificativo()` - Actualizar un calificativo
   - `deleteCalificativo()` - Eliminar un calificativo
   - `saveColumna()` - Guardar columnas personalizadas
   - `getColumnasDocente()` - Obtener columnas de un docente
   - `getEstadisticas()` - Estadísticas agregadas

2. **`api/calificativos-endpoint.js`** (Endpoint HTTP)
   - Expone todos los métodos como rutas REST
   - Maneja CORS
   - Rutas:
     - `GET /api/calificativos` - Obtener calificativos
     - `POST /api/calificativos` - Crear calificativos
     - `PUT /api/calificativos/:id` - Actualizar
     - `DELETE /api/calificativos/:id` - Eliminar
     - `GET /api/calificativos/columnas` - Obtener columnas
     - `POST /api/calificativos/columnas` - Guardar columna
     - `GET /api/calificativos/estadisticas` - Estadísticas

### Frontend (Cliente)

3. **`src/utils/calificativosAPI.js`** (Cliente JavaScript)
   - `getCalificativos(options)` - Obtener calificativos
   - `saveCalificativos(docenteId, calificativos)` - Guardar
   - `updateCalificativo(id, updates)` - Actualizar
   - `deleteCalificativo(id)` - Eliminar
   - `getColumnasDocente(docenteId)` - Obtener columnas
   - `saveColumna(columna)` - Guardar columna
   - `getEstadisticas(options)` - Estadísticas
   - `migrateFromLocalStorage(docenteId)` - Migrar datos antiguos

---

## Cómo Usar en tu Componente React

### 1. Importar el cliente API

```javascript
import {
  getCalificativos,
  saveCalificativos,
  updateCalificativo,
  deleteCalificativo,
  getColumnasDocente,
  saveColumna,
  migrateFromLocalStorage,
} from '@/utils/calificativosAPI';
```

### 2. Cargar calificativos de un docente

```javascript
useEffect(() => {
  async function loadCalificativos() {
    const currentDocenteId = 'docente-001'; // El ID del docente logueado
    
    const result = await getCalificativos({
      docenteId: currentDocenteId,
      periodo: 'Abril 2026',
    });

    if (result.success) {
      setCalificativos(result.calificativos);
    }
  }

  loadCalificativos();
}, []);
```

### 3. Guardar calificativos (reemplaza localStorage)

```javascript
async function guardarCalificativos() {
  const currentDocenteId = 'docente-001';
  
  const result = await saveCalificativos(currentDocenteId, calificativos);

  if (result.success) {
    console.log(`✅ ${result.insertados} guardados, ${result.actualizados} actualizados`);
  } else {
    console.error('❌ Error:', result.error);
  }
}
```

### 4. Actualizar un calificativo específico

```javascript
async function actualizarNota(calificativoId, nuevosDatos) {
  const result = await updateCalificativo(calificativoId, {
    notaNumerica: nuevosDatos.nota,
    calificativo: nuevosDatos.calificativo,
  });

  if (result.success) {
    // Recargar o actualizar la lista
    await loadCalificativos();
  }
}
```

### 5. Obtener columnas personalizadas

```javascript
useEffect(() => {
  async function loadColumnasDocente() {
    const currentDocenteId = 'docente-001';
    
    const result = await getColumnasDocente(currentDocenteId);

    if (result.success) {
      setColumnasDocente(result.columnas);
    }
  }

  loadColumnasDocente();
}, []);
```

### 6. Guardar nueva columna

```javascript
async function crearNuevaColumna(nombre, competenciaId) {
  const result = await saveColumna({
    id: `col-${Date.now()}`,
    docenteId: 'docente-001',
    nombre: nombre,
    competenciaId: competenciaId,
    tipo: 'Evaluación',
  });

  if (result.success) {
    // Recargar columnas
    await loadColumnasDocente();
  }
}
```

### 7. Migrar datos desde localStorage

```javascript
async function migrateOldData() {
  const currentDocenteId = 'docente-001';
  
  const result = await migrateFromLocalStorage(currentDocenteId);

  if (result.success) {
    console.log(`✅ ${result.total} registros migrados`);
    // Limpiar localStorage
    localStorage.removeItem('ie_calificativos_v2');
  }
}
```

---

## Panel del Admin

El admin puede ver **TODOS** los calificativos sin importar el docente:

```javascript
// En AdminPanel.tsx
async function loadAllCalificativos() {
  const result = await getCalificativos({
    admin: true, // Ver todos
  });

  if (result.success) {
    setCalificativos(result.calificativos);
  }
}
```

Verá algo como:

```json
[
  {
    "id": "docente-001|est-123|col-456|...",
    "docenteId": "docente-001",
    "alumnoId": "est-123",
    "columnaId": "col-456",
    "competenciaId": "comp1",
    "notaNumerica": 8.5,
    "calificativo": "B"
  },
  {
    "id": "docente-002|est-123|col-789|...",
    "docenteId": "docente-002",
    "alumnoId": "est-123",
    "columnaId": "col-789",
    "competenciaId": "comp2",
    "notaNumerica": 9.0,
    "calificativo": "A"
  }
]
```

**Sin conflictos** porque cada uno tiene su `docenteId`.

---

## Flujo Completo de Uso

### Docente A abre su sesión:

```javascript
// 1. Login
const docenteActual = { id: 'docente-001', nombre: 'María García' };

// 2. Cargar calificativos
const cals = await getCalificativos({ docenteId: 'docente-001' });

// 3. Crear columnas personalizadas
await saveColumna({
  id: 'col-nueva-1',
  docenteId: 'docente-001',
  nombre: 'Prueba Escrita',
  competenciaId: 'comp1',
  tipo: 'Evaluación',
});

// 4. Llenar notas
const calificativos = [
  {
    id: 'cal-1',
    alumnoId: 'est-001',
    columnaId: 'col-nueva-1',
    competenciaId: 'comp1',
    notaNumerica: 8.5,
    calificativo: 'B',
  },
  // ... más calificativos
];

// 5. Guardar en DB (NO localStorage)
await saveCalificativos('docente-001', calificativos);
```

### Docente B abre su sesión (diferente navegador):

```javascript
// 1. Login
const docenteActual = { id: 'docente-002', nombre: 'Juan Pérez' };

// 2. Cargar SUS calificativos (NO ve los de María)
const cals = await getCalificativos({ docenteId: 'docente-002' });

// 3. Crear SUS columnas
await saveColumna({
  id: 'col-nueva-2',
  docenteId: 'docente-002',
  nombre: 'Proyecto Grupal',
  competenciaId: 'comp2',
  tipo: 'Proyecto',
});

// 4. Llenar notas en C2
const calificativos = [
  {
    id: 'cal-2',
    alumnoId: 'est-001', // MISMO alumno que María
    columnaId: 'col-nueva-2', // PERO columna diferente
    competenciaId: 'comp2', // PERO competencia diferente
    notaNumerica: 9.0,
    calificativo: 'A',
  },
  // ... más calificativos
];

// 5. Guardar en DB
await saveCalificativos('docente-002', calificativos);
```

### Admin ve ambos:

```javascript
// Admin obtiene TODO
const todasLasNotas = await getCalificativos({ admin: true });

// Verá: 747 de María (docente-001) + 300 de Juan (docente-002) = 1047 total
// SIN CONFLICTO porque están etiquetadas con docenteId
```

---

## Ventajas de esta Arquitectura

| Problema | Antes | Ahora |
|----------|-------|-------|
| **Múltiples docentes** | ❌ Se sobrescriben | ✅ Cada uno independiente |
| **Pérdida de datos** | ❌ Al abrir en otro navegador | ✅ Persistente en DB |
| **C2/C3 vacíos** | ❌ Sin solución | ✅ Cada docente llena su competencia |
| **Admin ve todo** | ❌ Solo últimos cargados | ✅ Todos sin filtro |
| **Columnas personalizadas** | ❌ Se pierden | ✅ Guardadas por docente |
| **Escalabilidad** | ❌ Máx 200 notas | ✅ Miles de notas |

---

## Pasos para Implementar en tu App

### Paso 1: Asegúrate que tienes variables de entorno

```bash
# .env.local (en tu proyecto local)
TURSO_CONNECTION_URL=libsql://...
TURSO_AUTH_TOKEN=...
```

### Paso 2: Actualiza tu CalificativosScreen.tsx

Reemplaza:
```javascript
// ❌ VIEJO - localStorage
const calificativos = lsGet(LS_CALS);
```

Con:
```javascript
// ✅ NUEVO - API
const result = await getCalificativos({ 
  docenteId: currentUser.id 
});
const calificativos = result.calificativos;
```

Reemplaza:
```javascript
// ❌ VIEJO - localStorage
lsSet(LS_CALS, calificativos);
```

Con:
```javascript
// ✅ NUEVO - API
await saveCalificativos(currentUser.id, calificativos);
```

### Paso 3: Migra datos antiguos (opcional)

En tu landing o página de bienvenida:

```javascript
async function migrateData() {
  const result = await migrateFromLocalStorage(currentUser.id);
  if (result.success) {
    console.log('✅ Datos migrados');
  }
}
```

### Paso 4: Desplega a Vercel

```bash
git add .
git commit -m "Implementar API multi-docente"
git push
# Vercel se despliega automáticamente
```

---

## Queries SQL Útiles (si necesitas debuggear)

```sql
-- Ver todos los calificativos
SELECT * FROM calificativos LIMIT 10;

-- Ver calificativos de un docente
SELECT * FROM calificativos WHERE docenteId = 'docente-001';

-- Ver cuántos docentes tienen datos
SELECT DISTINCT docenteId, COUNT(*) FROM calificativos GROUP BY docenteId;

-- Ver un estudiante y todas sus notas de todos los docentes
SELECT * FROM calificativos WHERE alumnoId = 'est-001';

-- Estadísticas por competencia
SELECT 
  competenciaId,
  COUNT(*) total,
  AVG(notaNumerica) promedio,
  MIN(notaNumerica) minimo,
  MAX(notaNumerica) maximo
FROM calificativos
GROUP BY competenciaId;
```

---

## Soporte & Debugging

Si algo no funciona:

1. Verifica que `api/calificativos-endpoint.js` esté en la raíz de `/api`
2. Revisa la consola del navegador (F12) para ver errores
3. Verifica que `TURSO_CONNECTION_URL` y `TURSO_AUTH_TOKEN` estén en `.env.local`
4. Intenta hacer una prueba manual:

```javascript
// En consola del navegador
import { getCalificativos } from '@/utils/calificativosAPI';

const result = await getCalificativos({ docenteId: 'test' });
console.log(result);
```

---

## ¿Preguntas?

Esta arquitectura:
- ✅ Permite múltiples docentes sin conflictos
- ✅ Preserva datos en base de datos
- ✅ Admin ve TODO centralizado
- ✅ Cada docente crea sus propias columnas e instrumentos
- ✅ C2 y C3 ahora pueden tener datos (si otros docentes los llenan)

¿Hay algo que no esté claro? 📧
