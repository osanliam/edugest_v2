# 📊 Cargar Calificativos desde Backup

## ¿Qué es esto?

He extraído **747 calificativos de promedio** del backup antiguo de tu sistema (`EduGest_backup_2026-04-25.json`). Estos son los promedios de todos tus estudiantes en la competencia **C1: Lee textos diversos**.

## Los números

- **Total de calificativos**: 747
- **Estudiantes únicos**: 747
- **Competencia**: C1 - Lee textos diversos
- **Período**: Abril 2026

**Distribución:**
- 🟢 AD (Logro Destacado): 5 estudiantes
- 🔵 A (Logro Esperado): 50 estudiantes
- 🟡 B (En Proceso): 164 estudiantes
- 🔴 C (En Inicio): 528 estudiantes

## Cómo cargar

### Opción 1: Automática (Recomendado)

1. Abre tu sistema en el navegador
2. Abre este archivo: **`cargar_calificativos_promedios.html`**
3. Haz clic en el botón **"✅ Cargar Ahora"**
4. El sistema se recargará automáticamente con los datos

### Opción 2: Manual

Si tienes problemas con la opción 1:

1. Abre tu sistema en el navegador
2. Abre la consola (F12 → Consola)
3. Copia y pega esto:

```javascript
// Paso 1: Obtener los datos
const calificativos = [AQUI_VAN_LOS_DATOS];

// Paso 2: Cargar en localStorage
localStorage.setItem('ie_calificativos_v2', JSON.stringify(calificativos));

// Paso 3: Recargar
window.location.reload();
```

4. Reemplaza `[AQUI_VAN_LOS_DATOS]` con el contenido del archivo **`calificativos_para_cargar.json`**

## Archivos que necesitas

En la carpeta `Sistemita_Nuevo/` encontrarás:

- **`cargar_calificativos_promedios.html`** ← Abre esto primero
- **`calificativos_para_cargar.json`** ← Datos (solo si usas la opción manual)

## ¿Dónde aparecerán?

Los calificativos aparecerán en:

**Registro de Calificativos → C1: Lee textos diversos**

Cada estudiante verá su promedio (0-20) convertido a calificativo (C/B/A/AD).

## Importante ⚠️

- ✅ Puedes cargar múltiples veces (actualiza los datos)
- ✅ No borra otros calificativos de otras competencias
- ⚠️ Reemplaza los calificativos existentes de C1 del mismo estudiante
- 💾 Se guarda en `localStorage` (navegador local)
- 🔄 Si cambias de navegador, los datos no estarán allí

## ¿Y las otras competencias?

El backup actual solo tiene datos de **C1 (Lee)**. 

Para cargar **C2 (Escribe)** y **C3 (Se comunica)**, necesitaría:
- Datos adicionales del backup con notas de esas competencias
- O que agregues esos datos manualmente en el sistema

---

**Fecha generada:** 25 de Abril 2026
**Origen:** EduGest_backup_2026-04-25.json
