# 📊 Migración de Datos EduGest → Sistemita_Nuevo

## 🚀 INICIO RÁPIDO

Tienes **3 herramientas** listas para migrar tus datos:

### 1. **Extractor de Datos** (Paso 1)
   - Archivo: `MIGRACION_DATOS_MANUAL.txt`
   - Qué hace: Te guía cómo extraer datos de EduGest
   - Cómo: Copia código → Abre consola (F12) → Pega → ENTER

### 2. **Conversor de Datos** (Paso 2)
   - Archivo: `CONVERSOR_DATOS.html`
   - Qué hace: Convierte datos EduGest al formato Sistemita_Nuevo
   - Cómo: Abre en navegador → Carga JSON → Convierte → Descarga

### 3. **Registro Principal** (Paso 3)
   - Archivo: `registro_calificaciones_v2.html`
   - Qué hace: Importa y usa los datos migrados
   - Cómo: Abre y comienza a evaluar

---

## 📋 PROCESO COMPLETO PASO A PASO

### **PASO 1: Extraer Datos de EduGest** (10 minutos)

```
1. Abre EduGest en tu navegador:
   file:///Users/osmer/Downloads/Sistemita/EduGest.html

2. Inicia sesión como ADMIN

3. Abre Consola:
   macOS: Cmd + Option + J
   Windows: Ctrl + Shift + J

4. Lee el archivo: MIGRACION_DATOS_MANUAL.txt

5. Copia el código JavaScript del archivo

6. Pégalo en la consola y presiona ENTER

7. Se descargará: edugest_datos_[número].json

8. Guarda este archivo en:
   /Users/osmer/Downloads/Sistemita_Nuevo/
```

### **PASO 2: Convertir Datos** (5 minutos)

```
1. Abre CONVERSOR_DATOS.html en tu navegador:
   file:///Users/osmer/Downloads/Sistemita_Nuevo/CONVERSOR_DATOS.html

2. Clic en "📂 Cargar Archivo"

3. Selecciona el archivo: edugest_datos_[número].json

4. Verifica las estadísticas (estudiantes, maestros, etc.)

5. Clic en "⚙️ Convertir a Formato Sistemita"

6. Clic en "⬇️ Descargar JSON Convertido"

7. Archivo descargado: sistemita_datos_[número].json

8. Guarda en: /Users/osmer/Downloads/Sistemita_Nuevo/
```

### **PASO 3: Usar Datos en Sistemita** (2 minutos)

```
1. Abre registro_calificaciones_v2.html en navegador:
   file:///Users/osmer/Downloads/Sistemita_Nuevo/instrumentos/registro_calificaciones_v2.html

2. Abre Consola (Cmd+Option+J o Ctrl+Shift+J)

3. Copia este código:

const importarDatos = () => {
    // Pega el contenido del JSON convertido aquí
    const datos = { /* contenido del JSON */ };
    
    // Guardar en localStorage
    localStorage.setItem('sistemita_datos', JSON.stringify(datos));
    console.log('✅ Datos importados exitosamente');
    location.reload();
};

importarDatos();

4. Presiona ENTER

5. El sistema se recargará con tus datos
```

---

## 📂 ARCHIVOS GENERADOS

```
/Users/osmer/Downloads/Sistemita_Nuevo/
├── MIGRACION_DATOS_MANUAL.txt          ← Instrucciones para extraer
├── CONVERSOR_DATOS.html                ← Herramienta de conversión
├── INSTRUCCIONES_MIGRACION_COMPLETA.md ← Este archivo
├── registro_calificaciones_v2.html     ← Sistema principal
├── [datos_extraidos.json]              ← Lo que descargas del paso 1
└── [sistemita_datos_[número].json]     ← Lo que descargas del paso 2
```

---

## 🔄 FLUJO DE DATOS

```
EduGest (localStorage)
       ↓
[Código de extracción]
       ↓
edugest_datos.json
       ↓
CONVERSOR_DATOS.html
       ↓
sistemita_datos.json
       ↓
Registro Principal (Sistemita_Nuevo)
       ↓
Evaluación en marcha ✅
```

---

## 📊 QUÉ SE MIGRA

### ✅ Datos que se copian:
- ✓ Estudiantes (nombre, email, dni, grado)
- ✓ Maestros (nombre, email, especialidad, rol)
- ✓ Notas (calificativos, competencia, periodo)
- ✓ Materias/Competencias
- ✓ Periodos (bimestres)
- ✓ Observaciones

### ⚠️ Datos que se adaptan:
- Competencias → Se mapean a formato MINEDU (C/B/A/AD)
- Calificativos → Se convierten a formato MINEDU
- Periodos → Se alinean con estructura nueva
- Instrumentos → Se preservan con names originales

### ❌ Datos que NO se migran:
- Contraseñas (por seguridad)
- Fotos/Archivos (por tamaño)
- Historial de cambios
- Logs de auditoría

---

## 🐛 SOLUCIÓN DE PROBLEMAS

### Problema: "No se descarga el archivo en Paso 1"
**Solución:**
- Verifica que usas ADMIN en EduGest
- Intenta en Chrome o Firefox
- Comprueba que localStorage no esté vacío

### Problema: "Error en la consola"
**Solución:**
- Revisa que hayas copiado TODO el código
- No dejes caracteres sin copiar
- Intenta nuevamente

### Problema: "El conversor no carga el JSON"
**Solución:**
- Asegúrate que el archivo sea JSON válido
- Abre en un editor de texto para verificar
- Revisa que el archivo comience con `{` y termine con `}`

### Problema: "Los datos no aparecen en Sistemita"
**Solución:**
- Limpia cache (Cmd+Shift+Delete)
- Intenta en navegador privado
- Verifica que el JSON se importó correctamente

---

## ✅ CHECKLIST FINAL

- [ ] Extracte datos de EduGest (paso 1)
- [ ] Convertí datos con CONVERSOR (paso 2)
- [ ] Importé datos en Sistemita (paso 3)
- [ ] Verifico que estudiantes aparezcan
- [ ] Verifico que maestros aparezcan
- [ ] Verifico que notas aparezcan
- [ ] Pruebo un instrumento (Rúbrica, Lista Cotejo, etc.)
- [ ] Guardo una evaluación nueva
- [ ] Exporto como JSON para verificar

---

## 🎯 DESPUÉS DE LA MIGRACIÓN

Una vez que tus datos estén en Sistemita_Nuevo:

1. **Prueba con un estudiante**: Evalúa con uno de los instrumentos
2. **Verifica las notas**: Que se vean correctamente
3. **Usa los 8 instrumentos**: Prueba cada uno
4. **Exporta los resultados**: Descarga JSON para verificar
5. **Integra en tu flujo**: Úsalo regularmente

---

## 📞 SOPORTE

Si necesitas ayuda:

1. **Consulta**: `MIGRACION_DATOS_MANUAL.txt`
2. **Verifica**: Las instrucciones en `CONVERSOR_DATOS.html`
3. **Prueba**: En diferente navegador (Chrome, Firefox)
4. **Revisa**: Que los archivos JSON sean válidos

---

## 🎓 ¿QUÉ SIGUE?

Después de migrar y usar el sistema:

- [ ] Dashboard de reportes
- [ ] Análisis de progreso
- [ ] Gráficos de desempeño
- [ ] Exportación a Excel
- [ ] Base de datos persistente
- [ ] Respaldo automático

---

**Sistema listo. Datos listos. ¡A empezar!**

📅 Fecha de preparación: 19 de Abril de 2026
🔧 Versión: Sistemita_Nuevo v2.0
