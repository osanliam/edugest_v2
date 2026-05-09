# ✅ Botones de Sincronización Agregados

## Cambios Realizados

### 1. **Imports Actualizados** (línea 2-7)
```javascript
import { Cloud, Download, Upload } from 'lucide-react'; // Nuevos iconos
import {
  getCalificativos,
  saveCalificativos,
  updateCalificativo,
} from '../utils/calificativosAPI'; // Nueva API
```

### 2. **Estados Agregados** (línea 883-884)
```javascript
const [syncing, setSyncing] = useState(false); // Para disable durante sync
const [syncMsg, setSyncMsg] = useState<{tipo:'ok'|'err';texto:string}|null>(null); // Mensajes
```

### 3. **Funciones de Sincronización** (después línea 891)

#### **handleDescargarDeNube()**
- Descarga calificativos desde Turso a localStorage
- Usa `getCalificativos()` del API
- Filtra por docenteId actual
- Muestra mensaje de éxito/error

#### **handleSubirANube()**
- Carga calificativos desde localStorage a Turso
- Usa `saveCalificativos()` del API
- Agrega automáticamente docenteId a cada calificativo
- Muestra conteo de insertados/actualizados

### 4. **Botones en UI** (dentro del toolbar)

**Visible solo para docentes** (`esDocente && (...)`):
- **"Bajar nube"**: Descarga datos desde cloud
- **"Subir nube"**: Carga datos a cloud
- Ambos disabled durante sincronización
- Muestran loading state: "Descargando..." / "Subiendo..."

### 5. **Mensaje de Feedback**
Aparece por 3.5 segundos mostrando:
- ✅ "X calificativos descargados"
- ✅ "X insertados, Y actualizados"
- ❌ Cualquier error de conexión

---

## Cómo Funciona

### Flujo de Descarga (Bajar nube)
```
Usuario clica "Bajar nube"
    ↓
getCalificativos({docenteId, periodo})
    ↓
Conversión de formato API → local
    ↓
setCalificativos(nuevos datos)
    ↓
localStorage.setItem(LS_CALS, nuevos datos)
    ↓
Mensaje de éxito
```

### Flujo de Carga (Subir nube)
```
Usuario clica "Subir nube"
    ↓
Agrega docenteId a cada calificativo
    ↓
saveCalificativos(docenteId, cals)
    ↓
API inserta o actualiza registros
    ↓
Mensaje de éxito con conteo
```

---

## Diferencia vs Guardar Anterior

| Acción | Antes | Ahora |
|--------|-------|-------|
| Guardar en popup | `lsSet()` local | Mismo (local) |
| Guardar todos | Sin opción | **"Subir nube"** → API |
| Recargar datos | Sin opción | **"Bajar nube"** → API |
| Múltiples docentes | Conflictaban datos | Aislados por docenteId |

---

## Testing

1. **Maestro A carga datos en Turso**
   - Click "Subir nube"
   - Debería ver: "X insertados, Y actualizados"

2. **Maestro B descarga datos de Maestro A**
   - Click "Bajar nube"
   - Debería ver calificativos de A (si tiene acceso)

3. **Offline → Online**
   - Trabajar sin internet (localStorage)
   - Luego click "Subir nube" para sincronizar

---

## Próximos Pasos (Opcional)

1. Sincronización automática cada 5 minutos
2. Indicador visual de cambios pendientes
3. Conflicto resolution (qué hacer si hubo ediciones simultaneas)
4. Historial de sincronizaciones

---

## Notas Técnicas

- docenteId se obtiene de `localStorage.getItem('docenteId')`
- período hardcodeado a "Abril 2026" (puede parametrizarse)
- Conversión de datos maneja: marcados, claves, notaNumerica, etc.
- Fallback a localStorage si la API falla (graceful degradation)

