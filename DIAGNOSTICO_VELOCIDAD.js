/**
 * SCRIPT DE DIAGNÓSTICO - Ejecuta en consola del navegador
 * Abre DevTools (F12) → Consola y copia/pega este código
 */

async function diagnosticarVelocidad() {
  console.log('🔍 Analizando velocidad de cargas...\n');

  // 1. MEDIR TIEMPO DE CARGAS
  const tests = {
    'Alumnos': '/api/students',
    'Usuarios': '/api/users',
    'Calificaciones': '/api/grades',
    'Curso actual': '/api/current-course'
  };

  for (const [nombre, endpoint] of Object.entries(tests)) {
    const inicio = performance.now();
    try {
      const res = await fetch(endpoint);
      const data = await res.json();
      const tiempo = (performance.now() - inicio).toFixed(2);
      const cantidad = Array.isArray(data) ? data.length : '?';

      console.log(`⏱️  ${nombre}: ${tiempo}ms (${cantidad} items)`);
    } catch (e) {
      console.error(`❌ ${nombre}: ${e.message}`);
    }
  }

  // 2. VERIFICAR SIZE DE DATOS EN MEMORIA
  console.log('\n📊 Tamaño de datos en navegador:');
  const stores = {
    'localStorage': localStorage,
    'sessionStorage': sessionStorage
  };

  for (const [name, store] of Object.entries(stores)) {
    let size = 0;
    let count = 0;
    for (let key in store) {
      if (store.hasOwnProperty(key)) {
        size += store[key].length;
        count++;
      }
    }
    const sizeKB = (size / 1024).toFixed(2);
    console.log(`${name}: ${sizeKB}KB (${count} items)`);
  }

  // 3. PROBLEMAS COMUNES
  console.log('\n⚠️  DIAGNÓSTICO RÁPIDO:');

  const issues = [];

  // Verifica si hay múltiples listeners
  if (document.querySelectorAll('[onclick]').length > 50) {
    issues.push('❌ Demasiados event listeners inline');
  }

  // Verifica tamaño de peticiones
  const perfEntries = performance.getEntriesByType('resource');
  const largeRequests = perfEntries.filter(r => r.transferSize > 100000);
  if (largeRequests.length > 0) {
    issues.push(`⚠️  ${largeRequests.length} peticiones > 100KB`);
  }

  if (issues.length === 0) {
    issues.push('✅ Sin problemas detectados');
  }

  issues.forEach(i => console.log(i));
}

// EJECUTAR
diagnosticarVelocidad();
