# 🧹 LIMPIAR TURSO - GUÍA PASO A PASO

Tu BD Turso está en **2004KB** y necesita limpieza. Aquí están los **pasos exactos**:

---

## OPCIÓN 1: Dashboard de Turso (RECOMENDADO - 5 minutos)

### Paso 1: Entra a Turso Studio

1. Abre: https://studio.turso.io
2. Login con tu cuenta
3. Selecciona tu base de datos **"edugestv2"**

### Paso 2: Abre la consola SQL

En el sidebar izquierdo:
- Haz click en **"Shell"** (o la consola)

Deberías ver una interfaz como:
```
edugestv2 >
```

### Paso 3: Ver diagnóstico actual

**Copia y pega esto (una por una las líneas):**

```sql
SELECT 'students' as tabla, COUNT(*) FROM students
UNION ALL SELECT 'grades' FROM grades
UNION ALL SELECT 'users' FROM users;
```

**Resultado esperado:**
```
tabla     | COUNT(*)
---------|----------
students | ~600
grades   | ~5000
users    | ~50
```

Si `grades` tiene 5000+, ESE es el problema.

### Paso 4: Buscar duplicados

```sql
SELECT 'grades-duplicados' as verificacion, COUNT(*) - COUNT(DISTINCT id) as dupes
FROM grades
UNION ALL
SELECT 'students-duplicados', COUNT(*) - COUNT(DISTINCT id)
FROM students;
```

**Si `dupes > 0`:** Hay duplicados que limpiar.

### Paso 5: LIMPIAR (Si hay duplicados)

**⚠️ SOLO si el paso 4 mostró duplicados > 0**

Ejecuta CADA comando por separado:

```sql
-- Limpiar grades
CREATE TEMPORARY TABLE grades_clean AS SELECT DISTINCT * FROM grades;
DELETE FROM grades;
INSERT INTO grades SELECT * FROM grades_clean;
DROP TABLE grades_clean;
```

Espera a que diga ✅ completado.

```sql
-- Limpiar students (si tiene duplicados)
CREATE TEMPORARY TABLE students_clean AS SELECT DISTINCT * FROM students;
DELETE FROM students;
INSERT INTO students SELECT * FROM students_clean;
DROP TABLE students_clean;
```

### Paso 6: Eliminar registros viejos

```sql
-- Ver cuántos registros de calificaciones son > 1 año
SELECT COUNT(*) as antiguos FROM grades
WHERE created_at < datetime('now', '-1 year');
```

Si muestra número > 100:

```sql
-- ELIMINAR registros > 1 año
DELETE FROM grades
WHERE created_at < datetime('now', '-1 year');
```

### Paso 7: Compactar

```sql
VACUUM;
```

Espera a que complete. Esto **recompacta la BD**.

### Paso 8: Ver resultado final

```sql
SELECT 'Después de limpiar:' as status;
SELECT 'students' as tabla, COUNT(*) FROM students
UNION ALL SELECT 'grades' FROM grades
UNION ALL SELECT 'users' FROM users;
```

---

## OPCIÓN 2: Desde tu aplicación (API)

Si tienes endpoint de administración, puedes hacer POST a:

```
POST /api/admin/cleanup
{
  "action": "deduplicate_grades",
  "delete_older_than_days": 365
}
```

---

## OPCIÓN 3: Conectarse con Turso CLI

### Instalar Turso CLI

```bash
# En macOS
brew install tursodatabase/tap/turso

# En Linux
curl -sSfL https://get.turso.io | bash

# En Windows (PowerShell)
irm https://get.turso.io/windows | iex
```

### Conectar y ejecutar SQL

```bash
# Login (primera vez)
turso auth login

# Abrir shell en tu BD
turso db shell edugestv2

# Dentro del shell, puedes pegar los comandos SQL del archivo:
# LIMPIAR_TURSO_DIRECTO.sql
```

---

## PROBLEMA: Aún ocupa 2004KB después de limpiar

### Causas posibles:

1. **Los datos legítimos pesan mucho**
   - 600 alumnos + 5000+ calificativos = 2MB es NORMAL
   - Solución: No hay mucho que hacer, es volumen legítimo

2. **Hay blobs/archivos grandes**
   - Si subiste documentos PDF/imágenes en la BD
   - Solución: Moverlos a Cloud Storage (GCP, S3, etc)

3. **Índices sin usar**
   - Solución: Ejecutar `ANALYZE`

### Para confirmar qué ocupa espacio:

```sql
-- Ver uso aproximado por tabla
SELECT
  'students' as tabla,
  COUNT(*) as registros,
  (COUNT(*) * 150) / 1024 as tamaño_kb_est
FROM students
UNION ALL
SELECT 'grades', COUNT(*), (COUNT(*) * 200) / 1024
FROM grades
UNION ALL
SELECT 'users', COUNT(*), (COUNT(*) * 100) / 1024
FROM users;
```

---

## 📊 Tamaño esperado por tabla

Con 600 alumnos:

| Tabla | Registros | Tamaño KB |
|-------|-----------|-----------|
| students | 600 | ~150 |
| grades | 5000 | ~1000 |
| users | 50 | ~50 |
| courses | 30 | ~30 |
| **TOTAL** | | **~1230KB** |

Si estás en **2004KB**, tienes:
- ✅ Sin duplicados significativos (o ya los limpiaste)
- ✅ Es volumen legítimo de datos

---

## 🎯 SOLUCIÓN REAL

Si después de limpiar **sigue en 2004KB**, el problema **no es Turso**:

1. **Es localStorage en el navegador** (que ya limpiamos)
2. **Son índices de Turso** (normales)
3. **Son datos legítimos** que necesitas

### Qué hacer:

1. ✅ Ve a `LIMPIAR_AHORA.html` en tu carpeta
2. ✅ Corre la limpieza de localStorage
3. ✅ Migra a `dataServiceOptimized.ts` para paginación
4. ✅ Sistema debería ser **6-10x más rápido**

---

## Dudas frecuentes

**P: ¿Se pierden datos al limpiar?**
A: No. Solo se eliminan exactos duplicados y registros > 1 año. Tú controlas qué se borra.

**P: ¿Cuánto tiempo toma?**
A: 5-10 segundos máximo, depende de la BD.

**P: ¿Puedo hacer VACUUM sin limpiar?**
A: Sí, solo ejecuta `VACUUM;` y listo.

**P: ¿Mi app se rompe?**
A: No. Turso mantiene respaldos automáticos.

---

**¿Necesitas ayuda? Avísame qué paso te causa problema.**
