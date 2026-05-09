# 📤 CÓMO SUBIR LAS NOTAS A TU APLICACIÓN

## ✅ Las notas ya están listas

Archivo principal: **`sistemita_datos_final.json`**

---

## 🚀 OPCIÓN 1: Forma Más Fácil (RECOMENDADO)

### Paso 1: Reemplazar archivo de datos

Si tu aplicación carga datos desde un JSON local:

```bash
# En tu carpeta Sistemita_Nuevo:
# Reemplaza el archivo data con el que tiene las notas

cp sistemita_datos_final.json sistemita_datos.json
# o simplemente renombralo
```

### Paso 2: Reiniciar la aplicación

```bash
# Si estás usando Node/npm:
npm start

# o si usas otro comando, úsalo normalmente
```

### ✅ Listo - Las notas aparecerán en:
- Dashboard de estudiantes
- Reportes de calificaciones
- Perfil de cada alumno

---

## 🔌 OPCIÓN 2: Si usas Backend/API

### Para cargar en la base de datos:

```bash
# 1. Asegúrate que tu servidor está corriendo
npm run dev

# 2. Ejecuta el script de carga
node api/sync.js
# o
python3 cargar-notas.py

# 3. Verifica en tu aplicación
```

---

## 📊 Verificar que se cargaron

### Opción A: En la terminal
```bash
# Contar cuántas notas hay en el archivo
grep -c "calificacion" sistemita_datos_final.json
# Debería mostrar: 1166
```

### Opción B: En tu navegador
1. Abre la aplicación
2. Ve a cualquier perfil de estudiante
3. Deberías ver sus notas en las competencias

---

## 🎯 Estructura de las Notas

Cada nota contiene:
```json
{
  "id": "note-xxxxx",
  "student_id": "ID_ALUMNO",
  "student_name": "Nombre Alumno",
  "competencia": "Lee textos diversos",
  "instrumento": "examen",
  "calificacion": "7",
  "fecha": "2026-04-24",
  "periodo": "Abril 2026"
}
```

---

## ⚙️ Configuración en código (si es necesario)

### Si necesitas actualizar el mockAuth.ts:

```bash
python3 actualizar-mockAuth.py
```

Esto actualizará automáticamente el archivo `src/utils/mockAuth.ts` con todos los estudiantes y sus notas.

---

## 🆘 Problemas Comunes

### "No veo las notas en la aplicación"
✅ Solución:
1. Borra el caché: `Ctrl+Shift+Del` en navegador
2. Recarga la página: `F5` o `Ctrl+R`
3. Abre las DevTools: `F12` → Console
4. Busca errores en la consola

### "El archivo no se carga"
✅ Solución:
1. Verifica que el archivo `sistemita_datos_final.json` existe
2. Comprueba que tiene contenido válido
3. Intenta renombrarlo a un nombre más simple sin espacios

### "Algunas notas no aparecen"
✅ Es normal - se migraron solo las notas existentes del backup antiguo

---

## 📋 Resumen de Archivos

| Archivo | Propósito | Acción |
|---------|-----------|--------|
| **sistemita_datos_final.json** | **Datos completos con notas** | **USA ESTE** ✓ |
| sistemita_datos_con_notas.json | Intermedio | Respaldo |
| cargar_notas_api.json | Formato API | Opcional |
| cargar-notas.py | Script de carga | Ejecutar si necesario |
| actualizar-mockAuth.py | Actualiza mockAuth.ts | Ejecutar si necesario |

---

## ✨ ¡Listo!

Una vez hagas esto, las **1,166 notas** estarán disponibles en tu sistema para todos los **750 estudiantes** que las tienen.

Si tienes dudas, verifica:
- `INSTRUCCIONES_NOTAS.md` - Guía técnica detallada
- `sistemita_datos_final.json` - Tu archivo de datos principal
