# 🔄 Cambios para Actualizar CalificativosScreen.tsx

## ¿QUÉ CAMBIAR?

Necesitas reemplazar estos 3 puntos en tu CalificativosScreen.tsx:

---

## CAMBIO 1: Agregar imports al inicio (después de línea 3)

BUSCA esto:
```javascript
import { syncToTurso } from '../services/dataService';
```

Y AÑADE debajo:
```javascript
import {
  getCalificativos,
  saveCalificativos,
  updateCalificativo,
  getEstadisticas,
} from '../utils/calificativosAPI';
```

**Resultado:**
```javascript
import React, { useState, useEffect } from 'react';
import { Plus, X, Save, Settings, ChevronDown, ChevronRight, Edit2, Search } from 'lucide-react';
import { syncToTurso } from '../services/dataService';
import {
  getCalificativos,
  saveCalificativos,
  updateCalificativo,
  getEstadisticas,
} from '../utils/calificativosAPI';
```

---

## CAMBIO 2: Reemplazar localStorage con API (función de carga)

BUSCA esto en tu código (alrededor de useEffect):
```javascript
const calificativos = lsGet(LS_CALS);
```

Y REEMPLAZALO con:
```javascript
useEffect(() => {
  const loadFromAPI = async () => {
    try {
      // Obtener ID del docente actual (ajusta según tu lógica de auth)
      const docenteId = localStorage.getItem('docenteId') || 'docente-default';
      
      const result = await getCalificativos({
        docenteId: docenteId,
        periodo: 'Abril 2026', // Ajusta el período
      });

      if (result.success) {
        setCalificativos(result.calificativos);
        console.log(`✅ ${result.count} calificativos cargados desde API`);
      } else {
        console.error('❌ Error cargando calificativos:', result.error);
        // Fallback a localStorage si API falla
        const localData = lsGet(LS_CALS);
        setCalificativos(localData);
      }
    } catch (error) {
      console.error('❌ Error en loadFromAPI:', error);
      const localData = lsGet(LS_CALS);
      setCalificativos(localData);
    }
  };

  loadFromAPI();
}, []); // Se ejecuta al montar el componente
```

---

## CAMBIO 3: Reemplazar guardado en localStorage con API

BUSCA esto:
```javascript
lsSet(LS_CALS, calificativos);
```

Y REEMPLAZALO con:
```javascript
const guardarEnAPI = async () => {
  try {
    const docenteId = localStorage.getItem('docenteId') || 'docente-default';
    
    const result = await saveCalificativos(docenteId, calificativos);

    if (result.success) {
      console.log(`✅ ${result.insertados} insertados, ${result.actualizados} actualizados`);
      
      // También guardar en localStorage como respaldo
      lsSet(LS_CALS, calificativos);
    } else {
      console.error('❌ Error guardando en API:', result.error);
      // Si falla API, guardar al menos en localStorage
      lsSet(LS_CALS, calificativos);
    }
  } catch (error) {
    console.error('❌ Error en guardarEnAPI:', error);
    // Fallback a localStorage
    lsSet(LS_CALS, calificativos);
  }
};

// Llamar cuando hagas clic en "Guardar"
await guardarEnAPI();
```

---

## CAMBIO 4 (OPCIONAL): Cuando actualices un calificativo

Si tienes un botón de guardar individual, reemplaza:
```javascript
lsSet(LS_CALS, calificativos); // guardar todos
```

Con:
```javascript
// Opción A: Guardar todos
const docenteId = localStorage.getItem('docenteId') || 'docente-default';
await saveCalificativos(docenteId, calificativos);

// Opción B: Actualizar solo uno (más eficiente)
const idCalificativoActualizado = calificativos[0].id; // ejemplo
const cambios = {
  notaNumerica: 8.5,
  calificativo: 'B',
};
await updateCalificativo(idCalificativoActualizado, cambios);
```

---

## CAMBIO 5: Agregar docenteId a cada calificativo

Cuando CREES un nuevo calificativo, asegúrate de incluir:

```javascript
const nuevoCalificativo = {
  id: `${alumnoId}-${columnaId}-${Date.now()}`,
  docenteId: localStorage.getItem('docenteId') || 'docente-default', // ← NUEVO
  alumnoId: alumnoId,
  columnaId: columnaId,
  competenciaId: columnaId,
  notaNumerica: 8.5,
  calificativo: 'B',
  esAD: false,
  marcados: [],
  claves: [],
  fecha: new Date().toISOString(),
  periodo: 'Abril 2026',
};

// Guardar
calificativos.push(nuevoCalificativo);
await saveCalificativos(docenteId, [nuevoCalificativo]); // API
```

---

## RESUMEN DE CAMBIOS

| Línea | Busca | Reemplaza con |
|-------|-------|---------------|
| ~3 | (después de imports) | Agregar imports de calificativosAPI |
| ~variable calificativos | `lsGet(LS_CALS)` | `loadFromAPI()` con useEffect |
| ~guardar | `lsSet(LS_CALS, ...)` | `await saveCalificativos(docenteId, ...)` |
| ~actualizar | `lsSet(LS_CALS, ...)` | `await updateCalificativo(id, changes)` |
| ~crear | (sin docenteId) | Agregar `docenteId: ...` |

---

## VERIFICACIÓN

Después de hacer los cambios:

1. Abre el navegador (F12) y ve a la pestaña **Network**
2. Haz clic en "Guardar calificativos"
3. Deberías ver una llamada `POST /api/calificativos` 
4. La respuesta debe ser: `{"success": true, "insertados": X, "actualizados": Y}`

Si ves error, verifica:
- ✅ Las variables de entorno estén configuradas (TURSO_CONNECTION_URL, TURSO_AUTH_TOKEN)
- ✅ El archivo `api/calificativos-endpoint.js` exista
- ✅ El archivo `src/utils/calificativosAPI.js` exista

---

## SI ALGO FALLA

Copia la respuesta del error de la consola (F12 → Console) y comparte conmigo. El sistema está preparado para "fallar con gracia" y usar localStorage como respaldo mientras se soluciona.

---

## ¿LISTO?

Una vez hagas estos cambios:
- ✅ Cada docente guardará SUS datos en Turso
- ✅ Múltiples docentes NO tendrán conflictos
- ✅ Admin verá TODO sin filtro
- ✅ C2 y C3 funcionarán correctamente (si otro docente las llena)
