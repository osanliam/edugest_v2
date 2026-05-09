# 📚 Instrucciones para Usar las Notas Cargadas

## ✅ Estado

Las notas del backup antiguo han sido **exitosamente migradas y cargadas** en tu Sistemita Nuevo.

- **Total notas cargadas:** 1,166
- **Estudiantes con notas:** 750
- **Fecha de carga:** 2026-04-24

## 📂 Archivos Generados

1. **sistemita_datos_final.json** ← **ARCHIVO PRINCIPAL** (úsalo)
   - Contiene todos los datos originales + notas migradas
   - Estructura completa lista para tu aplicación

2. **sistemita_datos_con_notas.json**
   - Archivo intermedio con notas transformadas

3. **cargar_notas_api.json**
   - Formato para carga vía API (opcional)

## 🚀 Próximos Pasos

### Opción 1: Usar directamente el archivo JSON (RECOMENDADO)

Si tu aplicación carga datos desde un archivo JSON:

```bash
# Reemplaza el archivo de datos original
cp sistemita_datos_final.json sistemita_datos.json
```

Luego reinicia tu aplicación y las notas aparecerán.

### Opción 2: Sincronizar con Base de Datos

Si tu aplicación usa base de datos (Turso/LibSQL):

```bash
# Ejecuta el script de sincronización
node api/sync.js
```

Este script tomará los datos del JSON y los sincronizará a la BD.

### Opción 3: Cargar vía API (si el servidor está corriendo)

```bash
# Requiere que el servidor esté levantado en puerto 3000
# y tengas configurado JWT_TOKEN

export JWT_TOKEN="tu-token-jwt"
node cargar-notas.js
```

## 📊 Estructura de las Notas

Cada nota contiene:

```json
{
  "id": "note-xxxxx",
  "student_id": "ID del alumno",
  "student_name": "Nombre del alumno",
  "competencia": "Lee textos diversos | Produce textos escritos | Interactúa oralmente",
  "instrumento": "examen | rúbrica | observación | escala | coevaluación",
  "calificacion": "Número, texto o JSON según tipo",
  "fecha": "ISO 8601 timestamp",
  "periodo": "Abril 2026"
}
```

## 🔄 Mapeo de Competencias

| Sistema Antiguo | Sistema Nuevo |
|---|---|
| Lee diversos tipos de textos | Lee textos diversos |
| Escribe diversos tipos de textos | Produce textos escritos |
| Se comunica oralmente | Interactúa oralmente |

## 📋 Mapeo de Instrumentos

| Antiguo | Nuevo |
|---|---|
| diag | examen |
| rub | rúbrica |
| obs | observación |
| escact | escala |
| co | coevaluación |

## ⚠️ Notas Importantes

- ✓ Se migraron **750 estudiantes** con notas
- ✓ Se procesaron **1,166 calificaciones**
- ⚠️ 4 registros sin estudiante asignado (verificar en caso necesario)

## 🆘 Solución de Problemas

### Las notas no aparecen en la aplicación

1. Verifica que estés usando **sistemita_datos_final.json**
2. Limpia el caché del navegador (Ctrl+Shift+Del)
3. Reinicia la aplicación
4. Revisa la consola del navegador (F12) para errores

### Algunos estudiantes no tienen notas

Es normal - solo se migraron notas existentes en el backup antiguo.

### ¿Cómo verificar que se cargaron las notas?

```bash
# Buscar en el archivo JSON
grep -c "calificacion" sistemita_datos_final.json
# Debería mostrar: ~1166
```

## 📞 Contacto

Si tienes dudas sobre la migración, consulta los archivos:
- `sistemita_datos_con_notas.json` (datos de transición)
- `cargar_notas_api.json` (formato API)
- `cargar-notas.py` (script de carga, ejecutable nuevamente)

---

**¡Las notas están listas para usar! 🎉**
