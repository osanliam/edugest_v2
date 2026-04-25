// ═══════════════════════════════════════════════════════════════════════════
// SCRIPT PARA EJECUTAR DESDE LA CONSOLA DEL NAVEGADOR
// ═══════════════════════════════════════════════════════════════════════════
//
// PASOS:
// 1. Abre tu sistema en el navegador
// 2. Presiona F12 (abre la consola)
// 3. Ve a la pestaña "Console"
// 4. Copia TODO el contenido de este archivo (desde aquí hasta el final)
// 5. Pégalo en la consola
// 6. Presiona Enter
//
// ═══════════════════════════════════════════════════════════════════════════

console.log('📊 Iniciando carga de calificativos...');

// 1. Verificar que los datos existen
const LS_KEY = 'ie_calificativos_v2';
const datosGuardados = localStorage.getItem(LS_KEY);

if (!datosGuardados) {
    console.error('❌ ERROR: No hay calificativos en localStorage');
    console.log('Usa FORZAR_RECARGA.html primero');
} else {
    try {
        const calificativos = JSON.parse(datosGuardados);
        console.log('✅ Encontrados:', calificativos.length, 'calificativos');

        // 2. Re-escribir en localStorage para asegurar que se cargan
        localStorage.setItem(LS_KEY, JSON.stringify(calificativos));
        console.log('✅ Datos re-guardados en localStorage');

        // 3. Mostrar resumen
        const porComp = {};
        calificativos.forEach(cal => {
            porComp[cal.competenciaId] = (porComp[cal.competenciaId] || 0) + 1;
        });

        console.log('\n📊 Por competencia:');
        console.table(porComp);

        // 4. Mostrar distribución de calificativos
        const porCalif = {};
        calificativos.forEach(cal => {
            porCalif[cal.calificativo] = (porCalif[cal.calificativo] || 0) + 1;
        });

        console.log('\n📊 Por calificativo:');
        console.table(porCalif);

        // 5. Instrucciones finales
        console.log('\n✅ LISTO PARA RECARGAR');
        console.log('Escribe esto en la consola:');
        console.log('    location.reload()');
        console.log('\nO haz clic en F5 para recargar la página');

    } catch(e) {
        console.error('❌ Error al procesar datos:', e.message);
    }
}

// Bonus: Función para recargar directamente
window.recargarSistema = function() {
    console.log('🔄 Recargando...');
    location.reload();
};

console.log('\n💡 Tip: Escribe recargarSistema() para recargar la página');
