# 🔧 Instrucciones: Arreglar Problema de Adriana

## El Problema
Adriana (adriana97818@manuelfidencio.edu.pe) está registrada pero **NO VE alumnos** en CalificativosScreen.

## Solución Rápida (2 minutos)

### Opción A: Herramienta Automática (RECOMENDADA) ✨

1. **Abre el archivo**: `TEST_ADRIANA_FIX.html`
   - Doble clic o arrastra a navegador

2. **Clic en**: `1️⃣ TEST: Verificar datos`
   - Lee el resultado
   - Si ve "0 alumnos después del filtro", continúa

3. **Clic en**: `2️⃣ FIX: Crear/actualizar asignación`
   - Debería ver "✓ FIX COMPLETADO"

4. **Recarga** la página del sistema
   - `Ctrl+R` o `Cmd+R`

5. **Login nuevamente** como Adriana
   - Debería ver alumnos ahora ✅

---

## Opción B: Manual (Si A no funciona)

### Paso 1: Verificar Asignación

1. Inicia sesión como **Admin**
2. Ve a **Configuración → Asignaciones**
3. Busca a Adriana en la lista

**Si NO está:**
→ Click "Nueva asignación"
→ Docente: Adriana
→ Curso: Comunicación (o el que corresponda)
→ Grados: 5° ✓
→ Secciones: A, B, C (o las que correspondan)
→ Click "Guardar"

**Si SÍ está:**
→ Verifica que tenga:
  - Grado: **5°** (con el símbolo °)
  - Secciones: A, B (o las asignadas)
→ Si falta algo, edita y actualiza

### Paso 2: Normalizar Grados (Si aún no ve alumnos)

Ejecuta en **Consola** (F12):

```javascript
// Normalizar grados
const alumnos = JSON.parse(localStorage.getItem('ie_alumnos') || '[]');
const gradoMap = {
  '1': '1°', '2': '2°', '3': '3°', '4': '4°', '5': '5°',
  'PRIMERO': '1°', 'SEGUNDO': '2°', 'TERCERO': '3°', 'CUARTO': '4°', 'QUINTO': '5°',
};

const fixed = alumnos.map(a => ({
  ...a,
  grado: gradoMap[a.grado] || a.grado
}));

localStorage.setItem('ie_alumnos', JSON.stringify(fixed));
console.log('✅ Normalizados ' + (alumnos.length) + ' alumnos');
location.reload();
```

3. Presiona **Enter**
4. La página se recarga automáticamente

### Paso 3: Verificar

1. Login como **Adriana**
2. Ve a **Calificativos**
3. Debería ver: `🏫 Grados: 5° · Secciones: A, B`
4. Debería ver alumnos en la tabla ✅

---

## Qué Pasó (Explicación Técnica)

### Antes
Adriana → No tiene docenteId en usuario
         → No encuentra asignación
         → alumnosBase filtra 0 alumnos
         → Pantalla vacía

### Después
Adriana → Tiene docenteId
       → Encuentra asignación (Grados: 5°, Secciones: A, B)
       → Filtra alumnos con `grado === "5°" && seccion === "A/B"`
       → Ve todos los alumnos de 5° A y B

---

## Si Aún No Funciona

Ejecuta el **TEST** nuevamente (TEST_ADRIANA_FIX.html) y comparte:
1. Lo que dice en el paso "DOCENTE ID USADO:"
2. Lo que dice en "ASIGNACIONES:"
3. Lo que dice en "FILTRADO:"

---

## Verificación Final

Después de los cambios, Adriana debería ver en **Calificativos**:

```
┌─────────────────────────────┐
│  🏫 Grados: 5° · Secciones: A, B  │  ← Verde con esto
│  120 alumnos · 8 columnas         │
└─────────────────────────────┘

[Tabla de alumnos visibles]
```

---

## Resumen en Una Frase

❌ **Antes**: Adriana no tiene asignación configurada
✅ **Después**: Adriana tiene grado 5° y puede ver sus alumnos

