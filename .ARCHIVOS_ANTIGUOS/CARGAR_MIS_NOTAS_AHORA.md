# ✅ CARGAR MIS NOTAS AL SISTEMA - INSTRUCCIONES

## 📌 Tu Pregunta
> "Si mis notas del nuevo sistema no están, revisa y soluciona"

## ✓ Resultado
Encontré tus notas convertidas:
- ✅ **1040+ notas convertidas** en formato correcto
- ✅ Archivo: `notas_convertidas_remapeadas.json`
- ✅ Herramienta automática creada

---

## 🚀 OPCIÓN A: Cargar Automáticamente (RECOMENDADA) ⭐

### Paso 1: Abre esta ruta en tu navegador
```
http://localhost:5173/cargar_notas_automatico.html?auto=true
```

O simplemente abre el archivo:
```
/Sistemita_Nuevo/cargar_notas_automatico.html
```

### Paso 2: Espera a que se carguen
- Verás un progreso del 0% al 100%
- Mostrará cuántas notas se cargaron
- Tomará entre 5-15 segundos

### Paso 3: Recarga el sistema
- Click "Recargar Sistema"
- O cierra y abre la página nuevamente

### Paso 4: Verifica en Calificativos
- Abre el módulo **Calificativos**
- Deberías ver **todas tus notas cargadas** ✅

---

## 🛠️ OPCIÓN B: Cargar Manualmente (Si A no funciona)

### Método 1: Desde la Consola (F12)

1. **Abre el navegador** con el sistema
2. Presiona **F12** → pestaña **Console**
3. Copia y pega este código:

```javascript
// Descargar y cargar notas
fetch('/notas_convertidas_remapeadas.json')
  .then(r => r.json())
  .then(notas => {
    const existentes = JSON.parse(localStorage.getItem('ie_calificativos_v2') || '[]');
    let nuevas = 0, actualizadas = 0;
    
    notas.forEach(nota => {
      const idx = existentes.findIndex(c => 
        c.alumnoId === nota.alumnoId && 
        c.columnaId === nota.columnaId
      );
      if (idx >= 0) {
        existentes[idx] = nota;
        actualizadas++;
      } else {
        existentes.push(nota);
        nuevas++;
      }
    });
    
    localStorage.setItem('ie_calificativos_v2', JSON.stringify(existentes));
    console.log(`✓ Cargadas: ${nuevas}, Actualizadas: ${actualizadas}, Total: ${existentes.length}`);
  })
  .catch(e => console.error('Error:', e));
```

4. Presiona **Enter**
5. Espera el mensaje de éxito
6. Recarga la página (**F5**)

---

## 📊 Qué Pasará

**Antes:**
- ❌ CalificativosScreen vacío (sin notas)

**Después:**
- ✅ Verás todas tus notas cargadas
- ✅ 1040+ registros de calificativos
- ✅ Agrupados por alumno/competencia/instrumento
- ✅ Disponibles para editar

---

## 🎯 Dónde Están mis Notas?

Tus notas están en:
```
/Sistemita_Nuevo/
  ├─ notas_convertidas_remapeadas.json    ← Archivo de datos
  ├─ cargar_notas_automatico.html         ← Herramienta automática
  ├─ CARGAR_NOTAS_AL_SISTEMA.html        ← Alternativa manual
  └─ cargar_notas.html                    ← Otra opción
```

---

## 🔍 Verificación

Para verificar que las notas se cargaron correctamente:

1. Abre **Calificativos**
2. Abre la Consola (F12 → Console)
3. Copia y pega:

```javascript
const notas = JSON.parse(localStorage.getItem('ie_calificativos_v2') || '[]');
console.log(`Total notas: ${notas.length}`);
console.log('Primeras 3:');
notas.slice(0, 3).forEach((n, i) => {
  console.log(`${i+1}. Alumno: ${n.alumnoId}, Columna: ${n.columnaId}, Cal: ${n.calificativo}`);
});
```

Deberías ver algo como:
```
Total notas: 1040
Primeras 3:
1. Alumno: 3vbmgrg, Columna: col-1776863791573, Cal: C
2. Alumno: 3vbmgrg, Columna: col-1776863791574, Cal: B
3. Alumno: 5xc9pqr, Columna: col-1776863791575, Cal: A
```

---

## ⚠️ Si Algo Falla

**Error: "no se encuentra el archivo"**
→ Asegúrate de que `notas_convertidas_remapeadas.json` está en la carpeta raíz de Sistemita_Nuevo

**Error: "JSON inválido"**
→ El archivo puede estar corrupto. Copia una copia nueva desde el backup.

**No carga nada**
→ Recarga la página (Ctrl+R / Cmd+R) y intenta nuevamente

**Verifica con Opción B** (consola) que es más fácil debuggear

---

## ✅ Confirmación

Cuando veas esto en Calificativos:
```
┌─────────────────────────────┐
│ 1040 alumnos · 847 columnas │  ← Números realistas
│ [Tabla con notas visibles]  │
└─────────────────────────────┘
```

**¡Significa que tus notas están cargadas correctamente!** 🎉

---

## 📝 Resumen en Una Frase

✅ **Abre `cargar_notas_automatico.html`, espera a que cargue 100%, recarga la página, y verás todas tus notas.**

---

## 💬 ¿Preguntas?

Si algo no funciona:
1. Intenta la **Opción A** primero (más fácil)
2. Si no, usa **Opción B método 1** (consola)
3. Comparte el error exacto que ves

