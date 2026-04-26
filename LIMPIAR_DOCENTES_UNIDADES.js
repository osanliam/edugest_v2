// Ejecutar en F12 → Console (logueado como admin)

const token = sessionStorage.getItem('auth_token');

async function limpiarYSincronizar() {
  // ── 1) DOCENTES: quedarse solo con los que tienen cargo ──────────────────
  const todosDocentes = JSON.parse(localStorage.getItem('ie_docentes')||'[]');
  const docentesOk = todosDocentes.filter(d => d.cargo && d.cargo.trim() !== '');
  console.log(`Docentes: ${todosDocentes.length} → ${docentesOk.length} (eliminados: ${todosDocentes.length - docentesOk.length})`);
  localStorage.setItem('ie_docentes', JSON.stringify(docentesOk));

  // ── 2) UNIDADES: quedarse solo con las 3 correctas ───────────────────────
  const idsCorrectos = ['uni-1776803839888','uni-1776803853151','uni-1776952103230'];
  const todasUnidades = JSON.parse(localStorage.getItem('cfg_unidades')||'[]');
  const unidadesOk = todasUnidades.filter(u => idsCorrectos.includes(u.id));
  console.log(`Unidades: ${todasUnidades.length} → ${unidadesOk.length} (eliminadas: ${todasUnidades.length - unidadesOk.length})`);
  localStorage.setItem('cfg_unidades', JSON.stringify(unidadesOk));

  // ── 3) Borrar docentes y unidades en Turso ───────────────────────────────
  console.log('🗑️ Limpiando Turso...');
  const r1 = await fetch('/api/sync?accion=borrar_tabla&tabla=docentes', { headers: { 'Authorization': `Bearer ${token}` } });
  console.log('docentes borrados:', (await r1.json()).deleted);

  const r2 = await fetch('/api/sync?accion=borrar_tabla&tabla=unidades', { headers: { 'Authorization': `Bearer ${token}` } });
  console.log('unidades borradas:', (await r2.json()).deleted);

  // ── 4) Subir los datos correctos a Turso ─────────────────────────────────
  async function subir(datos, tipo) {
    const CHUNK = 50;
    let ok = 0;
    for (let i = 0; i < datos.length; i += CHUNK) {
      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo, datos: datos.slice(i, i+CHUNK) })
      });
      const r = await res.json();
      ok += r.ok || 0;
    }
    console.log(`✅ ${tipo}: ${ok} subidos`);
  }

  await subir(docentesOk, 'docentes');
  await subir(unidadesOk, 'unidades');

  // ── 5) Verificar ─────────────────────────────────────────────────────────
  const rv = await fetch('/api/sync?accion=contar', { headers: { 'Authorization': `Bearer ${token}` } });
  const conteo = await rv.json();
  console.log(`\n📊 Turso ahora: alumnos=${conteo.alumnos} | docentes=${conteo.docentes} | unidades=${conteo.unidades}`);
  console.log('✅ Listo — recarga la página');
}

limpiarYSincronizar();
