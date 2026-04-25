/**
 * Script de inicialización: Carga las notas al localStorage
 * Se ejecuta automáticamente cuando carga la app
 */

(function() {
  console.log('🔄 Inicializando carga de notas...');

  // Función para cargar notas
  async function cargarNotasAutomaticamente() {
    try {
      // Verificar si ya hay notas
      const notasExistentes = localStorage.getItem('ie_calificativos_v2');
      if (notasExistentes && JSON.parse(notasExistentes).length > 1000) {
        console.log('✅ Notas ya cargadas. Saltando carga automática.');
        return;
      }

      console.log('📥 Descargando notas...');

      // Cargar el JSON
      const response = await fetch('/notas_convertidas_remapeadas.json');
      if (!response.ok) {
        console.warn(`⚠️ No se puede cargar notas desde la ruta /. Intentando desde /dist/`);
        const response2 = await fetch('/dist/notas_convertidas_remapeadas.json');
        if (!response2.ok) throw new Error('Archivo no encontrado en ambas rutas');
        return cargarFromResponse(response2);
      }

      return cargarFromResponse(response);

    } catch (error) {
      console.error('❌ Error cargando notas:', error.message);
      console.log('💡 Las notas se cargarán cuando hagas click en "Cargar Notas"');
    }
  }

  async function cargarFromResponse(response) {
    const notasRaw = await response.json();
    console.log(`📊 Descargadas ${notasRaw.length} notas`);

    // Convertir al formato esperado por CalificativosScreen
    const notas = notasRaw.map(nota => ({
      alumnoId: nota.alumnoId,
      columnaId: nota.columnaId || `col-${nota.instrumento}`,
      marcados: nota.marcados || [],
      claves: nota.claves || [],
      notaNumerica: nota.notaNumerica,
      calificativo: nota.calificativo || 'C',
      esAD: nota.esAD || false,
      fecha: nota.fecha || new Date().toISOString().split('T')[0],
    }));

    // Obtener existentes
    const existentes = JSON.parse(localStorage.getItem('ie_calificativos_v2') || '[]');
    console.log(`📝 Notas existentes: ${existentes.length}`);

    let nuevas = 0;
    let actualizadas = 0;

    // Merge inteligente
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

    // Guardar
    localStorage.setItem('ie_calificativos_v2', JSON.stringify(existentes));

    console.log(`✅ CARGA COMPLETADA:`);
    console.log(`   ➕ Nuevas: ${nuevas}`);
    console.log(`   🔄 Actualizadas: ${actualizadas}`);
    console.log(`   📊 Total: ${existentes.length}`);
    console.log(`🎉 Tus notas están listas en CalificativosScreen`);
  }

  // Ejecutar cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', cargarNotasAutomaticamente);
  } else {
    setTimeout(cargarNotasAutomaticamente, 500);
  }
})();
