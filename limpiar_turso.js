import { createClient } from '@libsql/client';

const c = createClient({
  url: 'libsql://edugestv2-osmer.aws-us-west-2.turso.io',
  authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzcwNDY1MzksImlkIjoiMDE5ZGMwM2EtMGQwMS03YmMwLTg1ZjEtMDIwZDM1ZDcxY2UzIiwicmlkIjoiMzdkNDkyMTUtZmUxZi00YTBkLTg2MzEtYjQzOWVlMjI2OWRjIn0.ILnrJuO9qmw9y3C8e8BvOsF4MpwhqENgyeo5sdosRg-PEoDq6MQq4DVmItGyIWxEqD_EeZZXOYNKC0vCHt2zDQ'
});

const tablas = [
  'calificaciones',
  'asistencia', 
  'registros_normas',
  'historial_calificaciones',
  'auditoria',
];

console.log('🗑️  Limpiando tablas de Turso...\n');

for (const tabla of tablas) {
  try {
    const antes = await c.execute(`SELECT COUNT(*) as n FROM ${tabla}`);
    const count = antes.rows[0]?.n ?? 0;
    await c.execute(`DELETE FROM ${tabla}`);
    console.log(`✅ ${tabla}: ${count} registros eliminados`);
  } catch (e) {
    console.log(`⚠️  ${tabla}: ${e.message}`);
  }
}

// Verificar conteos finales
console.log('\n📊 Estado final:');
const todas = ['alumnos','docentes','users','columnas','unidades','asignaciones','normas','calificaciones','asistencia'];
for (const t of todas) {
  try {
    const r = await c.execute(`SELECT COUNT(*) as n FROM ${t}`);
    console.log(`   ${t}: ${r.rows[0]?.n} registros`);
  } catch {}
}

console.log('\n✅ Listo. Las tablas de datos están limpias.');
console.log('   Las tablas de configuración (alumnos, docentes, columnas, etc.) se mantienen.');
