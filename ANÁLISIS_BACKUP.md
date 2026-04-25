# 📋 Análisis del Backup

## Resumen ejecutivo

Se procesó el archivo `EduGest_backup_2026-04-25.json` y se extrajeron **747 promedios** de estudiantes. El backup contiene datos completos del sistema antiguo pero solo tiene **evaluaciones de la competencia C1 (Lee textos diversos)**.

---

## Estructura del backup

El archivo tiene la siguiente estructura:

```
EduGest_backup_2026-04-25.json
├── students (1249 estudiantes)
├── subjects (1 subject: Comunicación)
│   ├── 4 competencias definidas:
│   │   ├── C1: Lee diversos tipos de textos
│   │   ├── C2: Escribe diversos tipos de textos
│   │   ├── C3: Se comunica oralmente
│   │   └── Nueva competencia (no usada)
├── grades (7085 registros de notas)
│   └── Formato: "studentId|competenciaId|..." = notaNumerica
├── diagClaves (claves de evaluación diagnóstica)
├── gradeDefs (definición de grados: 1er a 5to grado)
└── Otros: incidents, attendance, users, etc.
```

---

## Datos disponibles

### Estudiantes
- **Total:** 1249 estudiantes
- **Con notas:** 747 estudiantes
- **Sin notas:** 502 estudiantes

### Competencias definidas
```
1. Lee diversos tipos de textos escritos en lengua materna (C1)
2. Escribe diversos tipos de textos en lengua materna (C2)
3. Se comunica oralmente en lengua materna (C3)
4. Nueva competencia (no usada)
```

### Grados disponibles
```
• 1er Grado (8 secciones: A-H)
• 2do Grado (8 secciones: A-H)
• 3er Grado (8 secciones: A-H)
• 4to Grado (8 secciones: A-H)
• 5to Grado (5 secciones: A-E)
```

---

## Qué contienen los datos de notas

### Competencia C1 (Lee) ✅
- **Registros:** 4101 notas individuales
- **Estudiantes:** 747 con promedios
- **Rango de notas:** 0-20
- **Estado:** Completo, listo para cargar

### Competencia C2 (Escribe) ❌
- **Registros:** 0 (No hay datos)
- **Razón:** El backup no incluye evaluaciones de esta competencia

### Competencia C3 (Se comunica) ❌
- **Registros:** 0 (No hay datos)
- **Razón:** El backup no incluye evaluaciones de esta competencia

---

## Procesamiento realizado

### 1. Extracción de promedios
Se leyeron todos los registros de `grades` con clave `studentId|c1|...`:
- Se agruparon por estudiante
- Se calculó el promedio aritmético
- Se redondeó a 2 decimales

**Ejemplo:**
```
Estudiante: ZAMORA VASQUEZ JEIMY LUCERO (ID: 3vbmgrg)
Notas extraídas: [7, 7, 7, 7.1, ...]
Promedio: 7.1
Calificativo: C (En inicio)
```

### 2. Conversión a nuevo formato
Se transformó cada promedio al formato del nuevo sistema:

```json
{
  "id": "3vbmgrg-comp1-1777133297",
  "alumnoId": "3vbmgrg",
  "columnaId": "col-1776863791573",
  "competenciaId": "comp1",
  "competencia": "Lee textos diversos",
  "alumnoNombre": "ZAMORA VASQUEZ JEIMY LUCERO",
  "notaNumerica": 7.1,
  "calificativo": "C",
  "esAD": false,
  "marcados": [],
  "claves": [],
  "fecha": "2026-04-25T16:08:17",
  "periodo": "Abril 2026"
}
```

### 3. Mapeo de escalas
Conversión de promedio (0-20) a calificativo (C/B/A/AD):
```
18-20 → AD (Logro Destacado)
15-17 → A  (Logro Esperado)
11-14 → B  (En Proceso)
0-10  → C  (En Inicio)
```

---

## Distribución de calificativos generados

```
Calificativo  Cantidad  Porcentaje
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
AD            5         0.67%
A             50        6.69%
B             164       21.95%
C             528       70.69%
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total         747       100%
```

---

## Archivos generados

| Archivo | Tamaño | Contenido |
|---------|--------|-----------|
| `cargar_calificativos_promedios.html` | 273 KB | Interfaz para cargar (recomendado) |
| `calificativos_para_cargar.json` | 308 KB | Datos JSON puros (opción manual) |
| `promedios_backup.json` | 285 KB | Promedios intermedios (referencia) |

---

## Próximos pasos

### Para cargar C1
✅ Usa `cargar_calificativos_promedios.html` (instrucciones arriba)

### Para cargar C2 y C3
Se necesitaría:
1. Verificar si existen datos en otra parte del backup
2. Buscar archivos adicionales de backup con evaluaciones de C2 y C3
3. O capturar los datos manualmente en el nuevo sistema

### Notas técnicas
- Los datos se guardan en `localStorage['ie_calificativos_v2']`
- Están diseñados para el nuevo sistema (no son compatibles con el antiguo)
- Se pueden cargar múltiples veces (actualizan los datos)
- No afectan otros calificativos de otras competencias

---

**Análisis completado:** 25 de Abril, 2026
**Fuente:** EduGest_backup_2026-04-25.json (1249 estudiantes, 7085 notas)
