# 🔍 Debug: Por qué Adriana no ve alumnos

## Problema
Adriana (adriana97818@manuelfidencio.edu.pe) tiene:
- ✅ Cuenta registrada en sistema_usuarios
- ✅ Asignaciones en cfg_asignaciones (Grado 5°, Secciones A, B)
- ❌ NO VE alumnos en CalificativosScreen

## Causa Probable: Mismatch en Formato de Grado

El sistema busca coincidir grado/sección así:
```javascript
// Línea 915-917 en CalificativosScreen.tsx
return alumnos.filter(a =>
  asignacionDocente.grados.includes((a as any).grado) &&    // ← AQUÍ
  asignacionDocente.secciones.includes((a as any).seccion)
);
```

Posibles problemas:
1. Asignación guarda `"5°"` pero alumnos tienen `"5"`
2. Asignación guarda `"5"` pero alumnos tienen `"5°"`
3. Diferentes espacios/caracteres invisibles

## Cómo Verificar (Paso a Paso)

### Opción 1: Consola del Navegador (F12)

1. **Abre el sistema** como Adriana
2. Presiona **F12** → pestaña **Console**
3. Copia y pega:

```javascript
// Obtener datos
const usuarios = JSON.parse(localStorage.getItem('sistema_usuarios') || '[]');
const docentes = JSON.parse(localStorage.getItem('ie_docentes') || '[]');
const asignaciones = JSON.parse(localStorage.getItem('cfg_asignaciones') || '[]');
const alumnos = JSON.parse(localStorage.getItem('ie_alumnos') || '[]');

// Buscar a Adriana
const user = usuarios.find(u => u.email === 'adriana97818@manuelfidencio.edu.pe');
console.log('👤 Usuario:', user);

// Buscar docenteId
const doc = docentes.find(d => d.email === 'adriana97818@manuelfidencio.edu.pe');
console.log('📋 Docente:', doc);

// Obtener ID
const docenteId = user?.docenteId || doc?.id;
console.log('🔑 DocenteId:', docenteId);

// Buscar asignaciones
const mias = asignaciones.filter(a => a.docenteId === docenteId);
console.log('📌 Asignaciones:', mias);

// Verificar grados y secciones
if (mias.length > 0) {
  const grados = [...new Set(mias.flatMap(a => a.grados))];
  const secciones = [...new Set(mias.flatMap(a => a.secciones))];
  console.log('✅ Grados asignados:', grados);
  console.log('✅ Secciones asignadas:', secciones);
  
  // Ver alumnos y filtrado
  console.log('📚 Total alumnos:', alumnos.length);
  console.log('Primeros 3 alumnos:');
  alumnos.slice(0, 3).forEach((a, i) => {
    console.log(`  ${i+1}. ${a.apellidos_nombres} - Grado:"${a.grado}" Seccion:"${a.seccion}"`);
  });
  
  // Filtrar
  const filtrados = alumnos.filter(a =>
    grados.includes(a.grado) &&
    secciones.includes(a.seccion)
  );
  console.log('🎯 Alumnos filtrados:', filtrados.length);
}
```

4. **Copia la salida completa** y comparte en el chat

---

## Qué Buscar en la Salida

### ✅ Éxito (verás los alumnos)
```
✅ Grados asignados: ["5°"]
✅ Secciones asignadas: ["A", "B"]
🎯 Alumnos filtrados: 45
```

### ❌ Problema 1: Formato de Grado Distinto
```
✅ Grados asignados: ["5°"]
Primeros 3 alumnos:
  1. Perez Juan - Grado:"5" Seccion:"A"  ← ¡DISTINTO!
  
🎯 Alumnos filtrados: 0
```

**Solución**: Cambiar en cfg_asignaciones de "5°" a "5"

### ❌ Problema 2: Sin Asignación
```
🔑 DocenteId: undefined
📌 Asignaciones: []
```

**Solución**: Crear la asignación en Configuración → Asignaciones

### ❌ Problema 3: Asignación a grado distinto
```
✅ Grados asignados: ["4°"]  ← ¡QUINTO NO!
📌 Asignaciones: [{docenteId: "...", grados: ["4°"], secciones: ["A", "B"]}]

🎯 Alumnos filtrados: 0
```

**Solución**: Editar asignación y agregar "5°"

---

## Solución Rápida si Hay Mismatch

Si descubres que hay mismatch (ej: "5°" vs "5"), ejecuta en consola:

```javascript
// Normalizar todos los grados a formato sin °
const alumnos = JSON.parse(localStorage.getItem('ie_alumnos') || '[]');
const fixed = alumnos.map(a => ({
  ...a,
  grado: a.grado ? a.grado.replace('°', '') : a.grado
}));
localStorage.setItem('ie_alumnos', JSON.stringify(fixed));
console.log('✅ Normalizado');
location.reload(); // Recarga la página
```

---

## Siguientes Pasos

1. **Corre el debug script** en la consola
2. **Comparte la salida** conmigo
3. Juntos identificaremos el problema exacto
4. Aplicaremos la solución específica

