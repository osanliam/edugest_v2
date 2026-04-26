import { createClient } from '@libsql/client';

let client = null;
let tablesReady = false;

function getClient() {
  if (!client) {
    const url = process.env.TURSO_CONNECTION_URL;
    const authToken = process.env.TURSO_AUTH_TOKEN;
    if (!url || !authToken) return null;
    client = createClient({ url, authToken });
  }
  return client;
}

async function ensureTables(c) {
  if (tablesReady) return;

  const stmts = [
    `CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      nombre TEXT,
      email TEXT,
      contraseña TEXT,
      rol TEXT,
      activo INTEGER DEFAULT 1,
      docenteId TEXT,
      creado DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS docentes (
      id TEXT PRIMARY KEY,
      apellidos_nombres TEXT,
      dni TEXT,
      genero TEXT,
      fecha_nacimiento TEXT,
      celular TEXT,
      cargo TEXT,
      email TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS apoderados (
      id TEXT PRIMARY KEY,
      apellidos_nombres TEXT,
      dni TEXT,
      celular TEXT,
      parentesco TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS alumnos (
      id TEXT PRIMARY KEY,
      apellidos_nombres TEXT,
      nombre TEXT,
      dni TEXT,
      fecha_nacimiento TEXT,
      edad TEXT,
      sexo TEXT,
      grado TEXT,
      seccion TEXT,
      telefono TEXT,
      direccion TEXT,
      apelidosPadre TEXT,
      nombreMadre TEXT,
      email TEXT,
      extra TEXT,
      madre_id TEXT,
      padre_id TEXT,
      user_id TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS columnas (
      id TEXT PRIMARY KEY,
      nombre TEXT,
      tipo TEXT,
      totalItems INTEGER,
      competenciaId TEXT,
      bimestreId TEXT,
      promediar INTEGER DEFAULT 0,
      itemsExamen TEXT,
      items TEXT,
      columnasEval TEXT,
      creatorId TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS calificaciones (
      id TEXT PRIMARY KEY,
      alumnoId TEXT,
      columnaId TEXT,
      marcados TEXT,
      claves TEXT,
      notaNumerica REAL,
      calificativo TEXT,
      esAD INTEGER DEFAULT 0,
      fecha TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS asistencia (
      id TEXT PRIMARY KEY,
      alumnoId TEXT,
      fecha TEXT,
      estado TEXT,
      modo TEXT,
      hora TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS unidades (
      id TEXT PRIMARY KEY,
      numero INTEGER,
      nombre TEXT,
      bimestreId TEXT,
      activa INTEGER DEFAULT 1
    )`,
    `CREATE TABLE IF NOT EXISTS normas (
      id TEXT PRIMARY KEY,
      titulo TEXT,
      descripcion TEXT,
      categoria TEXT,
      puntos INTEGER DEFAULT 1,
      visible INTEGER DEFAULT 1
    )`,
    `CREATE TABLE IF NOT EXISTS registros_normas (
      id TEXT PRIMARY KEY,
      alumnoId TEXT,
      conductaId TEXT,
      ejeId TEXT,
      fecha TEXT,
      cumplimiento TEXT,
      puntos INTEGER DEFAULT 0,
      observacion TEXT,
      registradoPor TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS asignaciones (
      id TEXT PRIMARY KEY,
      docenteId TEXT,
      grados TEXT,
      secciones TEXT,
      cursos TEXT,
      extra TEXT
    )`,
  ];

  for (const sql of stmts) {
    await c.execute(sql);
  }

  // Agregar columnas que pueden faltar en tablas ya existentes (migraciones seguras)
  const alterSafe = async (sql) => { try { await c.execute(sql); } catch (_) {} };
  await alterSafe(`ALTER TABLE alumnos ADD COLUMN nombre TEXT`);
  await alterSafe(`ALTER TABLE alumnos ADD COLUMN extra TEXT`);
  await alterSafe(`ALTER TABLE alumnos ADD COLUMN madre_id TEXT`);
  await alterSafe(`ALTER TABLE alumnos ADD COLUMN padre_id TEXT`);
  await alterSafe(`ALTER TABLE alumnos ADD COLUMN user_id TEXT`);
  await alterSafe(`ALTER TABLE asistencia ADD COLUMN modo TEXT`);
  await alterSafe(`ALTER TABLE asistencia ADD COLUMN hora TEXT`);
  await alterSafe(`ALTER TABLE users ADD COLUMN docenteId TEXT`);

  tablesReady = true;
}

// Helper: inserta un registro y retorna ok/error sin romper el batch
async function safeExec(c, sql, args) {
  try {
    await c.execute({ sql, args });
    return null;
  } catch (e) {
    return e.message;
  }
}

export default async function handler(req, res) {
  const c = getClient();
  if (!c) {
    return res.status(503).json({ error: 'Turso no configurado — faltan TURSO_CONNECTION_URL o TURSO_AUTH_TOKEN en las variables de entorno' });
  }

  try {
    await ensureTables(c);
  } catch (e) {
    return res.status(500).json({ error: 'Error inicializando tablas: ' + e.message });
  }

  // ── GET accion=contar  → solo devuelve COUNT de cada tabla (muy rápido) ──
  if (req.method === 'GET' && req.query?.accion === 'contar') {
    try {
      const tablas = ['calificaciones','asistencia','alumnos','columnas','unidades','asignaciones','users','docentes'];
      const conteos = {};
      for (const t of tablas) {
        try {
          const r = await c.execute(`SELECT COUNT(*) as n FROM ${t}`);
          conteos[t] = r.rows?.[0]?.n ?? 0;
        } catch { conteos[t] = '?'; }
      }
      // También fechas min/max de calificaciones
      try {
        const r = await c.execute(`SELECT MIN(fecha) as min_fecha, MAX(fecha) as max_fecha FROM calificaciones`);
        conteos.cal_fecha_min = r.rows?.[0]?.min_fecha ?? '';
        conteos.cal_fecha_max = r.rows?.[0]?.max_fecha ?? '';
      } catch {}
      return res.json(conteos);
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  // ── GET accion=borrar_cal → borra TODAS las calificaciones ─────────────────
  if (req.method === 'GET' && req.query?.accion === 'borrar_cal') {
    try {
      const r = await c.execute('DELETE FROM calificaciones');
      return res.json({ ok: true, deleted: r.rowsAffected });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  // ── GET accion=borrar_tabla&tabla=alumnos → borra tabla completa ──────────
  if (req.method === 'GET' && req.query?.accion === 'borrar_tabla') {
    const permitidas = ['alumnos', 'docentes', 'calificaciones', 'asistencia', 'columnas'];
    const tabla = req.query?.tabla;
    if (!permitidas.includes(tabla)) {
      return res.status(400).json({ error: `Tabla no permitida: ${tabla}` });
    }
    try {
      const r = await c.execute(`DELETE FROM ${tabla}`);
      return res.json({ ok: true, tabla, deleted: r.rowsAffected });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  // ── GET size ──────────────────────────────────────────────────────────────
  if (req.method === 'GET' && req.query?.size === '1') {
    try {
      const r = await c.execute('SELECT page_count * page_size as size FROM pragma_page_count(), pragma_page_size()');
      return res.json({ dbSize: r.rows?.[0]?.size || 0 });
    } catch (e) {
      return res.json({ dbSize: 0, error: e.message });
    }
  }

  // ── GET all data ──────────────────────────────────────────────────────────
  if (req.method === 'GET') {
    try {
      // Permitir filtrar por tipos para evitar timeout con grandes volúmenes
      // Ej: /api/sync?tipos=alumnos,asignaciones,docentes
      const tiposParam = req.query?.tipos || '';
      const tiposSolicitados = tiposParam
        ? tiposParam.split(',').map(t => t.trim()).filter(Boolean)
        : ['usuarios','docentes','alumnos','columnas','calificaciones','asistencia','unidades','normas','registros_normas','asignaciones'];

      const ejecutar = async (sql) => {
        try { return (await c.execute(sql)).rows || []; } catch { return []; }
      };

      const data = {};
      if (tiposSolicitados.includes('usuarios'))          data.usuarios          = await ejecutar('SELECT * FROM users');
      if (tiposSolicitados.includes('docentes'))          data.docentes          = await ejecutar('SELECT * FROM docentes');
      if (tiposSolicitados.includes('alumnos'))           data.alumnos           = await ejecutar('SELECT * FROM alumnos');
      if (tiposSolicitados.includes('columnas'))          data.columnas          = await ejecutar('SELECT * FROM columnas');
      if (tiposSolicitados.includes('calificaciones')) {
        const rawCal = await ejecutar('SELECT * FROM calificaciones');
        data.calificaciones = rawCal.map(c => ({
          ...c,
          marcados: typeof c.marcados === 'string' ? JSON.parse(c.marcados || '[]') : (c.marcados || []),
          claves:   typeof c.claves   === 'string' ? JSON.parse(c.claves   || '[]') : (c.claves   || []),
          esAD: c.esAD === 1 || c.esAD === true,
        }));
      }
      if (tiposSolicitados.includes('asistencia'))        data.asistencia        = await ejecutar('SELECT * FROM asistencia');
      if (tiposSolicitados.includes('unidades'))          data.unidades          = await ejecutar('SELECT * FROM unidades');
      if (tiposSolicitados.includes('normas'))            data.normas            = await ejecutar('SELECT * FROM normas');
      if (tiposSolicitados.includes('registros_normas'))  data.registros_normas  = await ejecutar('SELECT * FROM registros_normas');
      if (tiposSolicitados.includes('asignaciones')) {
        const rawAsigs = await ejecutar('SELECT * FROM asignaciones');
        // Parsear campos JSON que Turso devuelve como string
        data.asignaciones = rawAsigs.map(a => ({
          ...a,
          grados:    typeof a.grados    === 'string' ? JSON.parse(a.grados    || '[]') : (a.grados    || []),
          secciones: typeof a.secciones === 'string' ? JSON.parse(a.secciones || '[]') : (a.secciones || []),
          cursos:    typeof a.cursos    === 'string' ? JSON.parse(a.cursos    || '[]') : (a.cursos    || []),
        }));
      }

      return res.json(data);
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  // ── DELETE /api/sync?tipo=calificativos  → borra TODOS los registros de esa tabla
  if (req.method === 'DELETE') {
    const tipo = req.query?.tipo;
    const tablaMap = {
      calificativos: 'calificaciones',
      asistencia:    'asistencia',
      columnas:      'columnas',
    };
    const tabla = tablaMap[tipo];
    if (!tabla) {
      return res.status(400).json({ error: `Tipo no permitido para borrar: ${tipo}` });
    }
    try {
      const result = await c.execute(`DELETE FROM ${tabla}`);
      return res.json({ ok: true, deleted: result.rowsAffected, tabla });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  // ── POST sync ─────────────────────────────────────────────────────────────
  if (req.method === 'POST') {
    const { tipo, datos } = req.body;
    if (!tipo || !Array.isArray(datos)) {
      return res.status(400).json({ error: 'Falta tipo o datos' });
    }

    const errores = [];
    let ok = 0;

    try {
      if (tipo === 'usuarios') {
        for (const u of datos) {
          const e = await safeExec(c,
            `INSERT OR REPLACE INTO users (id, nombre, email, contraseña, rol, activo, docenteId)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [u.id, u.nombre || u.name || '', u.email || '', u.contraseña || u.password || '', u.rol || u.role || '', u.activo !== false ? 1 : 0, u.docenteId || null]
          );
          e ? errores.push(`usuario ${u.id}: ${e}`) : ok++;
        }
      }

      else if (tipo === 'docentes') {
        for (const d of datos) {
          const e = await safeExec(c,
            `INSERT OR REPLACE INTO docentes (id, apellidos_nombres, dni, genero, fecha_nacimiento, celular, cargo, email)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [d.id, d.apellidos_nombres || d.nombre || '', d.dni || '', d.genero || '', d.fecha_nacimiento || '', d.celular || d.telefono || '', d.cargo || '', d.email || '']
          );
          e ? errores.push(`docente ${d.id}: ${e}`) : ok++;
        }
      }

      else if (tipo === 'alumnos') {
        for (const a of datos) {
          // Guardar todos los campos extra como JSON para no perder nada
          const camposConocidos = ['id','apellidos_nombres','nombre','dni','fecha_nacimiento','edad','sexo','grado','seccion','telefono','direccion','apelidosPadre','nombreMadre','email'];
          const extra = {};
          for (const k of Object.keys(a)) {
            if (!camposConocidos.includes(k)) extra[k] = a[k];
          }
          const e = await safeExec(c,
            `INSERT OR REPLACE INTO alumnos (id, apellidos_nombres, nombre, dni, fecha_nacimiento, edad, sexo, grado, seccion, telefono, direccion, apelidosPadre, nombreMadre, email, extra)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              a.id,
              a.apellidos_nombres || '',
              a.nombre || '',
              a.dni || '',
              a.fecha_nacimiento || a.fechaNac || '',
              a.edad ? String(a.edad) : '',
              a.sexo || '',
              a.grado || '',
              a.seccion || '',
              a.telefono || '',
              a.direccion || '',
              a.apelidosPadre || '',
              a.nombreMadre || '',
              a.email || '',
              Object.keys(extra).length > 0 ? JSON.stringify(extra) : null,
            ]
          );
          e ? errores.push(`alumno ${a.id}: ${e}`) : ok++;
        }
      }

      else if (tipo === 'columnas') {
        for (const col of datos) {
          const e = await safeExec(c,
            `INSERT OR REPLACE INTO columnas (id, nombre, tipo, totalItems, competenciaId, bimestreId, promediar, itemsExamen, items, columnasEval, creatorId)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [col.id, col.nombre || '', col.tipo || '', col.totalItems || null, col.competenciaId || null, col.bimestreId || null, col.promediar ? 1 : 0, JSON.stringify(col.itemsExamen || []), JSON.stringify(col.items || []), JSON.stringify(col.columnasEval || []), col.creatorId || null]
          );
          e ? errores.push(`columna ${col.id}: ${e}`) : ok++;
        }
      }

      else if (tipo === 'calificativos') {
        for (const cal of datos) {
          const e = await safeExec(c,
            `INSERT OR REPLACE INTO calificaciones (id, alumnoId, columnaId, marcados, claves, notaNumerica, calificativo, esAD, fecha)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [cal.id || ('cal-' + cal.alumnoId + '-' + cal.columnaId), cal.alumnoId, cal.columnaId, JSON.stringify(cal.marcados || []), JSON.stringify(cal.claves || []), cal.notaNumerica || null, cal.calificativo || '', cal.esAD ? 1 : 0, cal.fecha || '']
          );
          e ? errores.push(`calificativo ${cal.id}: ${e}`) : ok++;
        }
      }

      else if (tipo === 'asistencia') {
        for (const a of datos) {
          const e = await safeExec(c,
            `INSERT OR REPLACE INTO asistencia (id, alumnoId, fecha, estado, modo, hora)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [a.id, a.alumnoId, a.fecha, a.estado, a.modo || null, a.hora || null]
          );
          e ? errores.push(`asistencia ${a.id}: ${e}`) : ok++;
        }
      }

      else if (tipo === 'unidades') {
        for (const u of datos) {
          const e = await safeExec(c,
            `INSERT OR REPLACE INTO unidades (id, numero, nombre, bimestreId, activa)
             VALUES (?, ?, ?, ?, ?)`,
            [u.id, u.numero || 0, u.nombre || '', u.bimestreId || null, u.activa !== false ? 1 : 0]
          );
          e ? errores.push(`unidad ${u.id}: ${e}`) : ok++;
        }
      }

      else if (tipo === 'normas') {
        for (const n of datos) {
          const e = await safeExec(c,
            `INSERT OR REPLACE INTO normas (id, titulo, descripcion, categoria, puntos, visible)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [n.id, n.titulo || '', n.descripcion || '', n.categoria || '', n.puntos || 1, n.visible !== false ? 1 : 0]
          );
          e ? errores.push(`norma ${n.id}: ${e}`) : ok++;
        }
      }

      else if (tipo === 'registros_normas') {
        for (const r of datos) {
          const e = await safeExec(c,
            `INSERT OR REPLACE INTO registros_normas (id, alumnoId, conductaId, ejeId, fecha, cumplimiento, puntos, observacion, registradoPor)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [r.id, r.alumnoId, r.conductaId, r.ejeId, r.fecha, r.cumplimiento, r.puntos || 0, r.observacion || '', r.registradoPor || '']
          );
          e ? errores.push(`registro_norma ${r.id}: ${e}`) : ok++;
        }
      }

      else if (tipo === 'asignaciones') {
        for (const a of datos) {
          const e = await safeExec(c,
            `INSERT OR REPLACE INTO asignaciones (id, docenteId, grados, secciones, cursos, extra)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
              a.id,
              a.docenteId || '',
              JSON.stringify(Array.isArray(a.grados) ? a.grados : []),
              JSON.stringify(Array.isArray(a.secciones) ? a.secciones : []),
              JSON.stringify(Array.isArray(a.cursos) ? a.cursos : []),
              a.extra ? JSON.stringify(a.extra) : null,
            ]
          );
          e ? errores.push(`asignacion ${a.id}: ${e}`) : ok++;
        }
      }

      else {
        return res.status(400).json({ error: `Tipo desconocido: ${tipo}` });
      }

      return res.json({
        success: errores.length === 0,
        ok,
        errores: errores.length,
        detalles: errores.slice(0, 10), // primeros 10 errores
      });

    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  return res.status(405).json({ error: 'Método no permitido' });
}
