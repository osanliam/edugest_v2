/**
 * ⚡ SCRIPT DE LIMPIEZA INMEDIATA
 *
 * Copia y pega COMPLETO en DevTools (F12) → Consola
 * (Está diseñado para correr en el navegador, no en Node.js)
 */

(async function limpiarCache() {
  console.clear();
  console.log('🧹 Iniciando limpieza de cache...\n');

  // 1. DIAGNÓSTICO ACTUAL
  console.log('📊 ANTES DE LA LIMPIEZA:\n');

  const keysToAnalyze = [
    'ie_alumnos',
    'ie_docentes',
    'sistema_usuarios',
    'ie_calificativos_v2',
    'cal_columnas',
    'cfg_asignaciones',
    'ie_asistencia'
  ];

  let totalBefore = 0;
  const breakdown = {};

  keysToAnalyze.forEach(key => {
    const data = localStorage.getItem(key);
    if (data) {
      const sizeKB = (new Blob([data]).size / 1024).toFixed(2);
      breakdown[key] = parseFloat(sizeKB);
      totalBefore += parseFloat(sizeKB);
      console.log(`  ${key.padEnd(30)}: ${sizeKB}KB`);
    }
  });

  console.log(`\n  TOTAL: ${totalBefore.toFixed(2)}KB\n`);

  // 2. LIMPIAR DUPLICADOS EN CALIFICATIVOS (CULPABLE)
  console.log('🔍 Buscando duplicados...\n');

  try {
    const calStr = localStorage.getItem('ie_calificativos_v2');
    if (calStr) {
      const calificativos = JSON.parse(calStr);
      const original = calificativos.length;

      // Eliminar duplicados exactos
      const unicos = Array.from(
        new Map(
          calificativos.map(item => [
            JSON.stringify(item), // clave = serialización completa
            item
          ])
        ).values()
      );

      const removed = original - unicos.length;
      if (removed > 0) {
        console.log(`  ✅ Eliminados ${removed} calificativos exactamente duplicados`);
        localStorage.setItem('ie_calificativos_v2', JSON.stringify(unicos));
      } else {
        console.log('  ✅ Sin duplicados exactos encontrados');
      }
    }
  } catch (e) {
    console.error('  ❌ Error limpiando calificativos:', e.message);
  }

  // 3. ELIMINAR CALIFICATIVOS VIEJOS (> 1 año)
  console.log('\n🗑️  Eliminando registros antiguos (> 1 año)...\n');

  try {
    const calStr = localStorage.getItem('ie_calificativos_v2');
    if (calStr) {
      const calificativos = JSON.parse(calStr);
      const original = calificativos.length;

      const now = Date.now();
      const oneYearAgo = now - (365 * 24 * 60 * 60 * 1000);

      const recent = calificativos.filter(c => {
        if (!c.fecha) return true; // Mantener sin fecha
        try {
          return new Date(c.fecha).getTime() > oneYearAgo;
        } catch {
          return true;
        }
      });

      const removed = original - recent.length;
      if (removed > 0) {
        console.log(`  ✅ Eliminados ${removed} registros viejos`);
        localStorage.setItem('ie_calificativos_v2', JSON.stringify(recent));
      } else {
        console.log('  ✅ Todos los registros son recientes');
      }
    }
  } catch (e) {
    console.error('  ❌ Error limpiando antiguos:', e.message);
  }

  // 4. COMPACTAR ASISTENCIA
  console.log('\n✂️  Compactando asistencia...\n');

  try {
    const asistStr = localStorage.getItem('ie_asistencia');
    if (asistStr) {
      const asistencia = JSON.parse(asistStr);
      const original = asistencia.length;

      // Eliminar duplicados
      const unicos = Array.from(
        new Map(
          asistencia.map(item => [
            `${item.alumnoId}_${item.fecha}`,
            item
          ])
        ).values()
      );

      const removed = original - unicos.length;
      if (removed > 0) {
        console.log(`  ✅ Eliminados ${removed} registros duplicados de asistencia`);
        localStorage.setItem('ie_asistencia', JSON.stringify(unicos));
      } else {
        console.log('  ✅ Asistencia sin duplicados');
      }
    }
  } catch (e) {
    console.error('  ❌ Error compactando:', e.message);
  }

  // 5. LIMPIAR METADATA DE SYNC ANTIGUA
  console.log('\n🧹 Limpiando metadata de sincronización...\n');

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('_sync_meta_')) {
      localStorage.removeItem(key);
    }
  }
  console.log('  ✅ Metadata limpiada');

  // 6. DIAGNÓSTICO FINAL
  console.log('\n\n📊 DESPUÉS DE LA LIMPIEZA:\n');

  let totalAfter = 0;
  keysToAnalyze.forEach(key => {
    const data = localStorage.getItem(key);
    if (data) {
      const sizeKB = (new Blob([data]).size / 1024).toFixed(2);
      const before = breakdown[key] || 0;
      const change = before - parseFloat(sizeKB);
      const pct = change > 0 ? ` (-${((change/before)*100).toFixed(1)}%)` : '';

      totalAfter += parseFloat(sizeKB);
      console.log(
        `  ${key.padEnd(30)}: ${sizeKB}KB ${change > 0 ? '✅' : ''}${pct}`
      );
    }
  });

  const totalReduced = totalBefore - totalAfter;
  const pctReduced = ((totalReduced / totalBefore) * 100).toFixed(1);

  console.log(`\n  TOTAL: ${totalAfter.toFixed(2)}KB`);
  console.log(`\n  ⚡ AHORRADOS: ${totalReduced.toFixed(2)}KB (${pctReduced}%)\n`);

  // 7. RECOMENDACIONES
  console.log('💡 RECOMENDACIONES:\n');

  if (totalAfter > 2000) {
    console.log('  ⚠️  localStorage aún ocupa mucho (>2MB)');
    console.log('      → Considera dividir por bimestre/año');
  }

  if (totalAfter < 1500) {
    console.log('  ✅ Excelente! Rendimiento debe mejorar notablemente');
  }

  console.log('\n  🔄 Recarga la página para ver cambios:');
  console.log('  location.reload();\n');

  // 8. OPCIÓN DE RECARGA
  const shouldReload = confirm(
    `\n✅ Limpieza completada!\n\n` +
    `Ahorrados: ${totalReduced.toFixed(2)}KB (${pctReduced}%)\n\n` +
    `¿Recargar página ahora?`
  );

  if (shouldReload) {
    location.reload();
  }
})();
