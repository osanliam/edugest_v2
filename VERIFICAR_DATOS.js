/**
 * ✅ VERIFICAR QUÉ DATOS EXISTEN
 *
 * Copia y pega EN LA CONSOLA DEL NAVEGADOR (F12)
 */

(async function verificar() {
  console.clear();
  console.log('🔍 VERIFICANDO DÓNDE ESTÁN LOS DATOS...\n');

  // 1. VERIFICAR LOCALSTORAGE
  console.log('📱 LOCALSTORAGE:\n');

  const localStorageData = {
    alumnos: JSON.parse(localStorage.getItem('ie_alumnos') || '[]'),
    docentes: JSON.parse(localStorage.getItem('ie_docentes') || '[]'),
    calificativos: JSON.parse(localStorage.getItem('ie_calificativos_v2') || '[]'),
    usuarios: JSON.parse(localStorage.getItem('sistema_usuarios') || '[]')
  };

  console.log(`  ie_alumnos: ${localStorageData.alumnos.length} registros`);
  console.log(`  ie_docentes: ${localStorageData.docentes.length} registros`);
  console.log(`  ie_calificativos_v2: ${localStorageData.calificativos.length} registros`);
  console.log(`  sistema_usuarios: ${localStorageData.usuarios.length} registros\n`);

  if (localStorageData.alumnos.length > 0) {
    console.log('  ✅ ALUMNOS EN LOCALSTORAGE:');
    console.log('  Primero:', localStorageData.alumnos[0]);
    console.log('');
  } else {
    console.log('  ❌ SIN ALUMNOS EN LOCALSTORAGE\n');
  }

  // 2. VERIFICAR API
  console.log('🌐 VERIFICANDO API:\n');

  try {
    const res = await fetch('/api/students');
    if (res.ok) {
      const apiData = await res.json();
      console.log(`  ✅ API /api/students: ${Array.isArray(apiData) ? apiData.length : '?'} registros`);
      if (Array.isArray(apiData) && apiData.length > 0) {
        console.log('  Primero:', apiData[0]);
      }
    } else {
      console.log(`  ❌ API /api/students retorna: ${res.status}`);
    }
  } catch (e) {
    console.log(`  ❌ API error: ${e.message}`);
  }

  console.log('');

  // 3. VERIFICAR TURSO
  console.log('🗄️  VERIFICANDO TURSO:\n');

  try {
    const res = await fetch('/api/sync');
    if (res.ok) {
      const tursoData = await res.json();
      console.log('  ✅ TURSO tiene datos:');
      console.log(`     alumnos: ${tursoData.alumnos?.length || 0}`);
      console.log(`     docentes: ${tursoData.docentes?.length || 0}`);
      console.log(`     calificativos: ${tursoData.calificativos?.length || 0}`);
      console.log(`     usuarios: ${tursoData.usuarios?.length || 0}`);
    } else {
      console.log(`  ❌ /api/sync retorna: ${res.status}`);
    }
  } catch (e) {
    console.log(`  ❌ Turso error: ${e.message}`);
  }

  console.log('\n\n📊 RESUMEN:\n');

  if (localStorageData.alumnos.length > 0) {
    console.log('✅ ALUMNOS EN LOCALSTORAGE - Sistema debería mostrarlos');
  } else {
    console.log('❌ SIN ALUMNOS EN LOCALSTORAGE');
    console.log('   Necesitas subirlos primero');
  }

  console.log('\n💡 PRÓXIMOS PASOS:');
  console.log('   1. Si hay alumnos → recarga página (Ctrl+F5)');
  console.log('   2. Si no hay → sube los datos desde tu sistema');
  console.log('   3. Si sube pero no aparecen → hay error en la UI\n');
})();
