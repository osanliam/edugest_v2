/**
 * INSTRUCCIONES:
 * 1. Abre tu navegador: http://192.168.100.71:3001/
 * 2. Inicia sesión con: admin@manuelfidencio.edu.pe / admin123
 * 3. Abre DevTools: F12
 * 4. Ve a CONSOLE
 * 5. Copia TODO el código de este archivo
 * 6. Pégalo en la consola
 * 7. Presiona Enter
 * 8. Recarga la página: F5
 */

// Función para cargar datos desde el JSON
async function cargarDatos() {
  console.log('🔄 Cargando datos desde sistemita_datos_final.json...');

  try {
    // Cargar el archivo JSON
    const response = await fetch('/sistemita_datos_final.json');
    if (!response.ok) {
      throw new Error('No se pudo cargar el archivo JSON');
    }

    const datos = await response.json();

    // Extraer datos
    const estudiantes = datos.estudiantes || [];
    const docentes = datos.maestros || [];
    const notas = datos.notas || [];
    const competenciasMinedu = datos.competenciasMinedu || [];

    console.log('📊 Datos cargados:');
    console.log(`   - Estudiantes: ${estudiantes.length}`);
    console.log(`   - Docentes: ${docentes.length}`);
    console.log(`   - Notas: ${notas.length}`);

    // Guardar en localStorage con las claves que tu app usa
    localStorage.setItem('ie_alumnos', JSON.stringify(estudiantes));
    localStorage.setItem('ie_docentes', JSON.stringify(docentes));
    localStorage.setItem('ie_calificativos', JSON.stringify(notas));
    localStorage.setItem('ie_calificativos_v2', JSON.stringify(notas));
    localStorage.setItem('competenciasMinedu', JSON.stringify(competenciasMinedu));

    // Agregar usuario admin si no existe
    let usuarios = JSON.parse(localStorage.getItem('sistema_usuarios') || '[]');
    if (!usuarios.find(u => u.email === 'admin@manuelfidencio.edu.pe')) {
      usuarios.push({
        id: 'user-admin',
        nombre: 'Administrador',
        email: 'admin@manuelfidencio.edu.pe',
        rol: 'admin',
        name: 'Administrador',
        role: 'admin'
      });
    }
    localStorage.setItem('sistema_usuarios', JSON.stringify(usuarios));

    console.log('✅ Datos guardados en localStorage');
    console.log('📍 Ahora recarga la página: window.location.reload()');

    return true;
  } catch (error) {
    console.error('❌ Error:', error);
    return false;
  }
}

// Ejecutar
console.log('🚀 Iniciando carga de datos...');
cargarDatos().then(ok => {
  if (ok) {
    console.log('\n✨ ¡Datos cargados! Recargando página en 2 segundos...');
    setTimeout(() => window.location.reload(), 2000);
  }
});
