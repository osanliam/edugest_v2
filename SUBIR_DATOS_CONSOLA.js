// ═══════════════════════════════════════════════════════════════════════════
// SCRIPT PARA SUBIR DATOS DE LOCALSTORAGE A TURSO
// ═══════════════════════════════════════════════════════════════════════════
// INSTRUCCIONES:
// 1. Abre tu sistema EduGest en el navegador donde tienes los datos
// 2. Presiona F12 (abrir consola del desarrollador)
// 3. Ve a la pestaña "Console"
// 4. Copia y pega TODO este código
// 5. Presiona Enter
// 6. Espera a que termine (2-3 minutos). NO cierres la pestaña.
// ═══════════════════════════════════════════════════════════════════════════

(async function() {
  console.log('%c🚀 INICIANDO SUBIDA A TURSO', 'font-size:16px; color:#0ea5e9; font-weight:bold;');

  const CHUNK_SIZE = 25;
  const DELAY_MS = 1000;

  const COLECCIONES = [
    { key: 'ie_alumnos',             tipo: 'alumnos',            nombre: 'Alumnos' },
    { key: 'ie_docentes',            tipo: 'docentes',           nombre: 'Docentes' },
    { key: 'sistema_usuarios',       tipo: 'usuarios',           nombre: 'Usuarios' },
    { key: 'cal_columnas',           tipo: 'columnas',           nombre: 'Columnas' },
    { key: 'cfg_unidades',           tipo: 'unidades',           nombre: 'Unidades' },
    { key: 'cfg_normas_convivencia', tipo: 'normas',             nombre: 'Normas' },
    { key: 'ie_calificativos_v2',    tipo: 'calificativos',      nombre: 'Calificaciones' },
    { key: 'ie_asistencia',          tipo: 'asistencia',         nombre: 'Asistencia' },
    { key: 'ie_registros_normas',    tipo: 'registros_normas',   nombre: 'Registros Normas' },
    { key: 'cfg_asignaciones',       tipo: 'asignaciones',       nombre: 'Asignaciones' },
  ];

  // Mostrar diagnóstico
  console.log('%c📊 DATOS EN TU NAVEGADOR:', 'font-size:14px; color:#22c55e; font-weight:bold;');
  let total = 0;
  for (const col of COLECCIONES) {
    let items = [];
    try {
      const raw = localStorage.getItem(col.key);
      if (raw) items = JSON.parse(raw);
    } catch { items = []; }
    if (!Array.isArray(items)) items = [];
    total += items.length;
    const color = items.length > 0 ? '#22c55e' : '#ef4444';
    console.log(`  ${col.nombre}: %c${items.length} registros`, `color:${color}; font-weight:bold;`);
  }
  console.log(`  TOTAL: %c${total} registros`, 'color:#0ea5e9; font-size:14px; font-weight:bold;');

  if (total === 0) {
    console.error('%c❌ No se encontraron datos en localStorage', 'font-size:14px; color:#ef4444;');
    console.log('%cPosibles causas:', 'color:#fbbf24;');
    console.log('  1. No estás en el navegador correcto (Chrome vs Edge vs Firefox)');
    console.log('  2. Los datos están en otro perfil de usuario del navegador');
    console.log('  3. Borraste el caché/localStorage recientemente');
    console.log('  4. Los datos nunca se guardaron en localStorage (quizás están solo en memoria)');
    return;
  }

  const confirmar = confirm(`¿Subir ${total} registros a Turso?\n\nEsto tardará 2-3 minutos. No cierres la pestaña.`);
  if (!confirmar) return;

  // Función para subir chunk con reintentos
  async function subirChunk(tipo, chunk, intento = 1) {
    try {
      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo, datos: chunk })
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`);
      return body;
    } catch (e) {
      if (chunk.length > 5 && intento <= 2) {
        console.warn(`⏳ Reintentando ${tipo} (dividiendo chunk)...`);
        const mitad = Math.ceil(chunk.length / 2);
        const r1 = await subirChunk(tipo, chunk.slice(0, mitad), intento + 1);
        await new Promise(r => setTimeout(r, 500));
        const r2 = await subirChunk(tipo, chunk.slice(mitad), intento + 1);
        return { ok: (r1.ok||0)+(r2.ok||0), success: true };
      }
      throw e;
    }
  }

  let totalSubidos = 0;
  let totalFallados = 0;
  let procesados = 0;

  for (const col of COLECCIONES) {
    let items = [];
    try {
      const raw = localStorage.getItem(col.key);
      if (raw) items = JSON.parse(raw);
    } catch { items = []; }
    if (!Array.isArray(items) || items.length === 0) continue;

    console.log(`%c📤 Subiendo ${col.nombre} (${items.length} registros)...`, 'color:#0ea5e9; font-weight:bold;');

    const chunks = [];
    for (let i = 0; i < items.length; i += CHUNK_SIZE) {
      chunks.push(items.slice(i, i + CHUNK_SIZE));
    }

    let subidosTipo = 0;
    for (let i = 0; i < chunks.length; i++) {
      try {
        const res = await subirChunk(col.tipo, chunks[i]);
        subidosTipo += res.ok || chunks[i].length;
        totalSubidos += res.ok || chunks[i].length;
        procesados += chunks[i].length;
        console.log(`  ✅ Chunk ${i+1}/${chunks.length}: ${res.ok || chunks[i].length} OK`);
      } catch (e) {
        console.error(`  ❌ Chunk ${i+1}/${chunks.length}: ${e.message}`);
        totalFallados += chunks[i].length;
        procesados += chunks[i].length;
      }
      await new Promise(r => setTimeout(r, DELAY_MS));
    }
    console.log(`  🏁 ${col.nombre}: ${subidosTipo}/${items.length} subidos`);
  }

  // Verificar
  console.log('%c🔍 Verificando datos en Turso...', 'color:#fbbf24;');
  try {
    const res = await fetch('/api/sync');
    const data = await res.json();
    const totalTurso = (data.alumnos?.length||0) + (data.docentes?.length||0) + 
                       (data.usuarios?.length||0) + (data.calificaciones?.length||0) + 
                       (data.asistencia?.length||0);
    console.log(`%c☁️ Turso ahora tiene ~${totalTurso} registros`, 'color:#22c55e; font-size:14px;');
  } catch (e) {
    console.error('No se pudo verificar:', e.message);
  }

  console.log('%c═══════════════════════════════════════', 'color:#64748b');
  if (totalFallados === 0) {
    console.log('%c✅ SINCRONIZACIÓN COMPLETA', 'font-size:18px; color:#22c55e; font-weight:bold;');
    console.log(`%c${totalSubidos} registros subidos a Turso.`, 'color:#86efac;');
    console.log('%cTus docentes ya pueden ver todo desde cualquier dispositivo.', 'color:#86efac;');
  } else {
    console.log('%c⚠️ SINCRONIZACIÓN PARCIAL', 'font-size:18px; color:#fbbf24; font-weight:bold;');
    console.log(`%cSubidos: ${totalSubidos} | Fallados: ${totalFallados}`, 'color:#fcd34d;');
  }
  console.log('%c═══════════════════════════════════════', 'color:#64748b');

})();
