// ═══════════════════════════════════════════════════════════════
// SCRIPT LIMPIEZA DE NOTAS — ejecutar en F12 → Console
// en https://edugestv2.vercel.app (estando logueado)
// ═══════════════════════════════════════════════════════════════

const token = sessionStorage.getItem('auth_token');

// PASO 1: Ver cuántas notas hay (respuesta inmediata, sin descargar nada)
async function verConteo() {
  const res = await fetch('/api/sync?accion=contar', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await res.json();
  console.log('📊 Conteo en Turso:');
  console.table(data);
  console.log(`\n📅 Notas: desde ${data.cal_fecha_min?.slice(0,10)} hasta ${data.cal_fecha_max?.slice(0,10)}`);
  return data;
}

// PASO 2: Borrar TODAS las notas de Turso (instantáneo, no descarga nada)
async function borrarNotasTurso() {
  const conteo = await verConteo();
  const n = conteo.calificaciones;
  if (!confirm(`¿Borrar las ${n} notas de Turso? Tus notas locales (localStorage) NO se tocan.`)) {
    console.log('Cancelado.'); return;
  }
  const res = await fetch('/api/sync?accion=borrar_cal', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const r = await res.json();
  console.log('🗑️ Borradas:', r);
}

// PASO 3: Subir tus notas locales a Turso (después de haber borrado)
async function subirNotasLocales() {
  const notas = JSON.parse(localStorage.getItem('ie_calificativos_v2') || '[]');
  console.log(`📦 Notas en localStorage: ${notas.length}`);
  if (notas.length === 0) { console.error('❌ localStorage vacío'); return; }

  const CHUNK = 50;
  let ok = 0;
  for (let i = 0; i < notas.length; i += CHUNK) {
    const chunk = notas.slice(i, i + CHUNK);
    const res = await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ tipo: 'calificativos', datos: chunk })
    });
    const r = await res.json();
    ok += r.ok || 0;
    process?.stdout?.write?.('.') || console.log(`  chunk ${i+1}-${i+chunk.length}: ok=${r.ok}`);
  }
  console.log(`\n✅ ${ok} notas subidas. Recarga la página.`);
}

console.log('✅ Listo. Comandos disponibles:');
console.log('  await verConteo()          → ver cuántas notas hay en Turso');
console.log('  await borrarNotasTurso()   → borrar todas las notas de Turso');
console.log('  await subirNotasLocales()  → subir tus notas del localStorage');
