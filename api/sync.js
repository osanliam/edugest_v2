import { createClient } from '@libsql/client';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'sistemita-secreto-2026-muy-seguro';

function parseJWT(req) {
  try {
    const auth = req.headers?.authorization || '';
    if (!auth.startsWith('Bearer ')) return null;
    return jwt.verify(auth.slice(7), JWT_SECRET);
  } catch { return null; }
}

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
    `CREATE TABLE IF NOT EXISTS historial_calificaciones (
      id TEXT PRIMARY KEY,
      calificacion_id TEXT NOT NULL,
      docenteId TEXT,
      alumnoId TEXT,
      columnaId TEXT,
      datos_anteriores TEXT,
      datos_nuevos TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS auditoria (
      id TEXT PRIMARY KEY,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      usuario_id TEXT,
      accion TEXT,
      tabla TEXT,
      registro_id TEXT,
      cambios TEXT,
      ip TEXT
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
  await alterSafe(`ALTER TABLE calificaciones ADD COLUMN docenteId TEXT`);
  await alterSafe(`ALTER TABLE calificaciones ADD COLUMN updated_at DATETIME`);

  // Índices para acelerar las queries más frecuentes
  await alterSafe(`CREATE INDEX IF NOT EXISTS idx_cal_alumno    ON calificaciones(alumnoId)`);
  await alterSafe(`CREATE INDEX IF NOT EXISTS idx_cal_columna   ON calificaciones(columnaId)`);
  await alterSafe(`CREATE INDEX IF NOT EXISTS idx_cal_updated   ON calificaciones(updated_at)`);
  await alterSafe(`CREATE INDEX IF NOT EXISTS idx_cal_compound  ON calificaciones(alumnoId, columnaId)`);
  await alterSafe(`CREATE INDEX IF NOT EXISTS idx_asig_docente  ON asignaciones(docenteId)`);
  await alterSafe(`CREATE INDEX IF NOT EXISTS idx_alumnos_grado ON alumnos(grado, seccion)`);
  await alterSafe(`CREATE INDEX IF NOT EXISTS idx_users_email   ON users(email)`);

  // Garantizar unicidad de DNI (evita duplicados masivos en importaciones)
  await alterSafe(`CREATE UNIQUE INDEX IF NOT EXISTS idx_alumnos_dni ON alumnos(dni)`);
  await alterSafe(`CREATE UNIQUE INDEX IF NOT EXISTS idx_apoderados_dni_parentesco ON apoderados(dni, parentesco)`);

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

  // ── GET accion=verificar_conexion → diagnóstico de conexión a Turso ──────
  if (req.method === 'GET' && req.query?.accion === 'verificar_conexion') {
    const diagnosticos = [];

    // 1. Verificar variables de entorno
    let url = process.env.TURSO_CONNECTION_URL;
    const token = process.env.TURSO_AUTH_TOKEN;
    diagnosticos.push({ paso: 'env_url', ok: !!url, valor: url ? url.substring(0, 30) + '...' : 'NO DEFINIDO' });
    diagnosticos.push({ paso: 'env_token', ok: !!token, valor: token ? 'Definido (' + token.length + ' chars)' : 'NO DEFINIDO' });

    if (!url || !token) {
      return res.status(503).json({ ok: false, error: 'Faltan variables de entorno', diagnosticos });
    }

    // 2. Intentar crear cliente (probar con https:// si libsql:// falla)
    let testClient = null;
    let urlUsada = url;
    try {
      testClient = createClient({ url, authToken: token });
      diagnosticos.push({ paso: 'crear_cliente_libsql', ok: true });
    } catch (e) {
      diagnosticos.push({ paso: 'crear_cliente_libsql', ok: false, error: e.message });
      // Intentar con https://
      if (url.startsWith('libsql://')) {
        urlUsada = url.replace('libsql://', 'https://');
        try {
          testClient = createClient({ url: urlUsada, authToken: token });
          diagnosticos.push({ paso: 'crear_cliente_https', ok: true, url: urlUsada });
        } catch (e2) {
          diagnosticos.push({ paso: 'crear_cliente_https', ok: false, error: e2.message });
          return res.status(500).json({ ok: false, error: 'No se pudo crear cliente con ninguna URL', diagnosticos });
        }
      } else {
        return res.status(500).json({ ok: false, error: 'No se pudo crear cliente: ' + e.message, diagnosticos });
      }
    }

    // 3. Intentar ejecutar una query simple SIN crear tablas
    try {
      const r = await testClient.execute('SELECT 1 as test');
      diagnosticos.push({ paso: 'query_simple', ok: true, resultado: r.rows });
    } catch (e) {
      diagnosticos.push({ paso: 'query_simple', ok: false, error: e.message });
      return res.status(500).json({ ok: false, error: 'Query falló: ' + e.message, diagnosticos });
    }

    // 4. Intentar contar alumnos
    try {
      const r = await testClient.execute('SELECT COUNT(*) as n FROM alumnos');
      diagnosticos.push({ paso: 'contar_alumnos', ok: true, count: r.rows?.[0]?.n });
    } catch (e) {
      diagnosticos.push({ paso: 'contar_alumnos', ok: false, error: e.message });
    }

    return res.json({ ok: true, mensaje: 'Conexión exitosa', url_usada: urlUsada, diagnosticos });
  }

  // ── GET accion=auditoria → logs de auditoría (solo admin/director) ──────
  if (req.method === 'GET' && req.query?.accion === 'auditoria') {
    const usuarioJWT = parseJWT(req);
    const rolesPermitidos = ['admin', 'director', 'subdirector'];
    if (!usuarioJWT || !rolesPermitidos.includes(usuarioJWT.role)) {
      return res.status(403).json({ error: 'Sin permiso para ver auditoría' });
    }
    try {
      const limite = parseInt(req.query?.limite || '100');
      const r = await c.execute({
        sql: 'SELECT * FROM auditoria ORDER BY timestamp DESC LIMIT ?',
        args: [limite],
      });
      return res.json({ ok: true, registros: r.rows || [] });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  // ── GET accion=historial&id=cal-xxx → versiones anteriores de un calificativo ──
  if (req.method === 'GET' && req.query?.accion === 'historial') {
    const calId = req.query?.id;
    if (!calId) return res.status(400).json({ error: 'Falta id' });
    try {
      const r = await c.execute({
        sql: 'SELECT * FROM historial_calificaciones WHERE calificacion_id = ? ORDER BY timestamp DESC LIMIT 20',
        args: [calId],
      });
      return res.json({ ok: true, historial: r.rows || [] });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
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

  // ── GET accion=test_write → inserta y borra un registro de prueba ──────────
  if (req.method === 'GET' && req.query?.accion === 'test_write') {
    try {
      const testId = 'test-' + Date.now();
      await c.execute(
        `INSERT INTO alumnos (id, apellidos_nombres, dni, fecha_nacimiento, edad, sexo, grado, seccion) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [testId, 'TEST CONEXION', '00000000', '2020-01-01', 0, 'Masculino', '1°', 'A']
      );
      const verificar = await c.execute('SELECT COUNT(*) as n FROM alumnos WHERE id = ?', [testId]);
      const count = Number(verificar.rows?.[0]?.n ?? 0);
      await c.execute('DELETE FROM alumnos WHERE id = ?', [testId]);
      return res.json({ ok: true, escribio: count === 1, mensaje: count === 1 ? 'Turso escribe correctamente' : 'Turso no escribió el registro de prueba' });
    } catch (e) {
      return res.status(500).json({ ok: false, error: e.message });
    }
  }

  // ── GET accion=diagnostico → tamaño total + conteos de TODAS las tablas ──
  if (req.method === 'GET' && req.query?.accion === 'diagnostico') {
    try {
      const tablas = [
        'users','docentes','apoderados','alumnos','columnas',
        'calificaciones','asistencia','unidades','normas',
        'registros_normas','asignaciones','historial_calificaciones','auditoria'
      ];
      const conteos = {};
      for (const t of tablas) {
        try {
          const r = await c.execute(`SELECT COUNT(*) as n FROM ${t}`);
          conteos[t] = Number(r.rows?.[0]?.n ?? 0);
        } catch { conteos[t] = 0; }
      }
      // Tamaño real de la BD
      let dbSize = 0;
      try {
        const r = await c.execute('SELECT page_count * page_size as size FROM pragma_page_count(), pragma_page_size()');
        dbSize = r.rows?.[0]?.size || 0;
      } catch {}
      return res.json({ ok: true, dbSize, dbSizeKB: Math.round(dbSize/1024*10)/10, conteos });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  // ── GET accion=limpiar_historial&dias=30 → borra historial viejo ───────────
  if (req.method === 'GET' && req.query?.accion === 'limpiar_historial') {
    const dias = parseInt(req.query?.dias || '30');
    try {
      const r = await c.execute(
        `DELETE FROM historial_calificaciones WHERE timestamp < datetime('now', '-${dias} days')`
      );
      return res.json({ ok: true, eliminados: r.rowsAffected, dias });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  // ── GET accion=limpiar_auditoria&dias=30 → borra auditoría vieja ───────────
  if (req.method === 'GET' && req.query?.accion === 'limpiar_auditoria') {
    const dias = parseInt(req.query?.dias || '30');
    try {
      const r = await c.execute(
        `DELETE FROM auditoria WHERE timestamp < datetime('now', '-${dias} days')`
      );
      return res.json({ ok: true, eliminados: r.rowsAffected, dias });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  // ── GET accion=duplicados → cuenta duplicados en alumnos/apoderados/columnas ─
  if (req.method === 'GET' && req.query?.accion === 'duplicados') {
    try {
      const resultado = {};

      // Alumnos por DNI
      try {
        const total = await c.execute('SELECT COUNT(*) as n FROM alumnos');
        const unicos = await c.execute('SELECT COUNT(DISTINCT dni) as n FROM alumnos');
        resultado.alumnos = {
          total: Number(total.rows?.[0]?.n ?? 0),
          unicos: Number(unicos.rows?.[0]?.n ?? 0),
          duplicados: Number(total.rows?.[0]?.n ?? 0) - Number(unicos.rows?.[0]?.n ?? 0),
        };
      } catch (e) { resultado.alumnos = { error: e.message }; }

      // Apoderados por DNI + parentesco
      try {
        const total = await c.execute('SELECT COUNT(*) as n FROM apoderados');
        const unicos = await c.execute('SELECT COUNT(DISTINCT dni || "-" || parentesco) as n FROM apoderados');
        resultado.apoderados = {
          total: Number(total.rows?.[0]?.n ?? 0),
          unicos: Number(unicos.rows?.[0]?.n ?? 0),
          duplicados: Number(total.rows?.[0]?.n ?? 0) - Number(unicos.rows?.[0]?.n ?? 0),
        };
      } catch (e) { resultado.apoderados = { error: e.message }; }

      // Columnas por nombre + bimestreId
      try {
        const total = await c.execute('SELECT COUNT(*) as n FROM columnas');
        const unicos = await c.execute('SELECT COUNT(DISTINCT nombre || "-" || COALESCE(bimestreId,"")) as n FROM columnas');
        resultado.columnas = {
          total: Number(total.rows?.[0]?.n ?? 0),
          unicos: Number(unicos.rows?.[0]?.n ?? 0),
          duplicados: Number(total.rows?.[0]?.n ?? 0) - Number(unicos.rows?.[0]?.n ?? 0),
        };
      } catch (e) { resultado.columnas = { error: e.message }; }

      return res.json({ ok: true, duplicados: resultado });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  // ── GET accion=deduplicar&tabla=alumnos|apoderados|columnas ─────────────────
  if (req.method === 'GET' && req.query?.accion === 'deduplicar') {
    const tabla = req.query?.tabla;
    const permitidas = ['alumnos', 'apoderados', 'columnas'];
    if (!permitidas.includes(tabla)) {
      return res.status(400).json({ error: `Tabla no permitida: ${tabla}` });
    }
    try {
      let sql = '';
      if (tabla === 'alumnos') {
        sql = `DELETE FROM alumnos WHERE id IN (
          SELECT id FROM (
            SELECT id, ROW_NUMBER() OVER (PARTITION BY dni ORDER BY rowid DESC) as rn
            FROM alumnos
          ) WHERE rn > 1
        )`;
      } else if (tabla === 'apoderados') {
        sql = `DELETE FROM apoderados WHERE id IN (
          SELECT id FROM (
            SELECT id, ROW_NUMBER() OVER (PARTITION BY dni || '-' || parentesco ORDER BY rowid DESC) as rn
            FROM apoderados
          ) WHERE rn > 1
        )`;
      } else if (tabla === 'columnas') {
        sql = `DELETE FROM columnas WHERE id IN (
          SELECT id FROM (
            SELECT id, ROW_NUMBER() OVER (PARTITION BY nombre || '-' || COALESCE(bimestreId,'') ORDER BY rowid DESC) as rn
            FROM columnas
          ) WHERE rn > 1
        )`;
      }
      const r = await c.execute(sql);
      return res.json({ ok: true, tabla, eliminados: r.rowsAffected });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  // ── GET accion=reset_alumnos → BORRA TODOS los alumnos y apoderados ─────────
  if (req.method === 'GET' && req.query?.accion === 'reset_alumnos') {
    try {
      // Borrar en orden por foreign keys
      await c.execute('DELETE FROM alumnos');
      await c.execute('DELETE FROM apoderados');
      return res.json({ ok: true, mensaje: 'Tablas alumnos y apoderados vaciadas. Puedes reimportar desde Excel.' });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  // ── GET accion=vacuum → Turso no permite VACUUM desde SQL ──────────────────
  if (req.method === 'GET' && req.query?.accion === 'vacuum') {
    return res.status(400).json({
      ok: false,
      error: 'Turso no permite ejecutar VACUUM directamente. Los duplicados deben eliminarse con "Eliminar duplicados". El espacio se libera automáticamente con el tiempo en Turso.',
    });
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

      // Incremental: solo cambios desde una fecha dada
      const desde = req.query?.desde || null;

      const ejecutar = async (sql) => {
        try { return (await c.execute(sql)).rows || []; } catch { return []; }
      };

      const data = {};
      if (tiposSolicitados.includes('usuarios'))          data.usuarios          = await ejecutar('SELECT * FROM users');
      if (tiposSolicitados.includes('docentes'))          data.docentes          = await ejecutar('SELECT * FROM docentes');
      if (tiposSolicitados.includes('alumnos')) {
        const gradoFiltro = req.query?.grado || null;
        if (gradoFiltro) {
          const grados = gradoFiltro.split(',').map(g => g.trim());
          const placeholders = grados.map(() => '?').join(',');
          try {
            const r = await c.execute({ sql: `SELECT * FROM alumnos WHERE grado IN (${placeholders})`, args: grados });
            data.alumnos = r.rows || [];
          } catch { data.alumnos = []; }
        } else {
          data.alumnos = await ejecutar('SELECT * FROM alumnos');
        }
      }
      if (tiposSolicitados.includes('columnas'))          data.columnas          = await ejecutar('SELECT * FROM columnas');
      if (tiposSolicitados.includes('calificaciones')) {
        const page  = parseInt(req.query?.page  || '0');
        const limit = parseInt(req.query?.limit || '0'); // 0 = sin límite (retro-compat)

        let calSql = 'SELECT * FROM calificaciones';
        const calArgs = [];
        if (desde) {
          calSql += ' WHERE updated_at > ?';
          calArgs.push(desde);
        }
        if (limit > 0) calSql += ` LIMIT ${limit} OFFSET ${page * limit}`;

        // En la primera página también devolvemos el total para que el frontend calcule páginas
        if (limit > 0 && page === 0) {
          try {
            const cntSql = desde
              ? 'SELECT COUNT(*) as total FROM calificaciones WHERE updated_at > ?'
              : 'SELECT COUNT(*) as total FROM calificaciones';
            const cntRes = await c.execute(desde ? { sql: cntSql, args: [desde] } : cntSql);
            data.calificaciones_total = Number(cntRes.rows?.[0]?.total ?? 0);
          } catch { data.calificaciones_total = 0; }
        }

        const rawCal = calArgs.length
          ? (await c.execute({ sql: calSql, args: calArgs })).rows || []
          : await ejecutar(calSql);
        const toArr = (v) => { try { const p = typeof v === 'string' ? JSON.parse(v || '[]') : v; return Array.isArray(p) ? p : []; } catch { return []; } };
        data.calificaciones = rawCal.map(c => ({
          ...c,
          marcados: toArr(c.marcados),
          claves:   toArr(c.claves),
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
        // Batch en lotes de 100. Si el lote falla, fallback uno por uno.
        const LOTE = 100;
        const camposConocidos = ['id','apellidos_nombres','nombre','dni','fecha_nacimiento','edad','sexo','grado','seccion','telefono','direccion','apelidosPadre','nombreMadre','email'];
        for (let i = 0; i < datos.length; i += LOTE) {
          const lote = datos.slice(i, i + LOTE);
          const stmts = lote.map(a => {
            const extra = {};
            for (const k of Object.keys(a)) { if (!camposConocidos.includes(k)) extra[k] = a[k]; }
            const alumnoId = a.id || (a.dni ? `alu-dni-${a.dni}` : `alu-${Date.now()}-${Math.random().toString(36).slice(2,7)}`);
            return {
              sql: `INSERT OR REPLACE INTO alumnos (id, apellidos_nombres, nombre, dni, fecha_nacimiento, edad, sexo, grado, seccion, telefono, direccion, apelidosPadre, nombreMadre, email, extra) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              args: [alumnoId, a.apellidos_nombres||'', a.nombre||'', a.dni||'', a.fecha_nacimiento||a.fechaNac||'', a.edad?String(a.edad):'', a.sexo||'', a.grado||'', a.seccion||'', a.telefono||'', a.direccion||'', a.apelidosPadre||'', a.nombreMadre||'', a.email||'', Object.keys(extra).length>0?JSON.stringify(extra):null]
            };
          });
          try {
            await c.batch(stmts, 'write');
            ok += lote.length;
          } catch (batchErr) {
            // Si el batch falla, intentar uno por uno para no perder todo el lote
            for (const a of lote) {
              const extra = {};
              for (const k of Object.keys(a)) { if (!camposConocidos.includes(k)) extra[k] = a[k]; }
              const alumnoId = a.id || (a.dni ? `alu-dni-${a.dni}` : `alu-${Date.now()}-${Math.random().toString(36).slice(2,7)}`);
              const e = await safeExec(c,
                `INSERT OR REPLACE INTO alumnos (id, apellidos_nombres, nombre, dni, fecha_nacimiento, edad, sexo, grado, seccion, telefono, direccion, apelidosPadre, nombreMadre, email, extra) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [alumnoId, a.apellidos_nombres||'', a.nombre||'', a.dni||'', a.fecha_nacimiento||a.fechaNac||'', a.edad?String(a.edad):'', a.sexo||'', a.grado||'', a.seccion||'', a.telefono||'', a.direccion||'', a.apelidosPadre||'', a.nombreMadre||'', a.email||'', Object.keys(extra).length>0?JSON.stringify(extra):null]
              );
              e ? errores.push(`alumno ${a.dni}: ${e}`) : ok++;
            }
          }
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
        const usuarioJWT = parseJWT(req);
        const docenteId = usuarioJWT?.id || usuarioJWT?.docenteId || null;
        const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
        const ahora = new Date().toISOString();

        for (const cal of datos) {
          const id = cal.id || ('cal-' + cal.alumnoId + '-' + cal.columnaId);
          let marcadosFinales = cal.marcados || [];
          let accion = 'save';

          // Leer registro existente para historial y merge
          let datosAnteriores = null;
          try {
            const existente = await c.execute({
              sql: 'SELECT id, docenteId, marcados, calificativo, esAD FROM calificaciones WHERE id = ?',
              args: [id],
            });
            const reg = existente.rows[0];
            if (reg) {
              datosAnteriores = { marcados: reg.marcados, calificativo: reg.calificativo, esAD: reg.esAD, docenteId: reg.docenteId };
              // Merge: si otro docente tiene el mismo registro, combinar marcados con OR
              if (reg.docenteId && docenteId && reg.docenteId !== docenteId) {
                accion = 'merge';
                const prevMarcados = typeof reg.marcados === 'string' ? JSON.parse(reg.marcados || '[]') : (reg.marcados || []);
                marcadosFinales = marcadosFinales.map((v, i) => v || (prevMarcados[i] || false));
              }
            }
          } catch { /* continuar sin historial si falla */ }

          // Guardar con docenteId y updated_at
          const e = await safeExec(c,
            `INSERT OR REPLACE INTO calificaciones
               (id, alumnoId, columnaId, marcados, claves, notaNumerica, calificativo, esAD, fecha, docenteId, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [id, cal.alumnoId, cal.columnaId, JSON.stringify(marcadosFinales), JSON.stringify(cal.claves || []), cal.notaNumerica ?? null, cal.calificativo || '', cal.esAD ? 1 : 0, cal.fecha || ahora, docenteId, ahora]
          );

          if (e) {
            errores.push(`calificativo ${id}: ${e}`);
            continue;
          }
          ok++;

          // Historial: guardar snapshot antes/después
          await safeExec(c,
            `INSERT INTO historial_calificaciones (id, calificacion_id, docenteId, alumnoId, columnaId, datos_anteriores, datos_nuevos, timestamp)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              'hist-' + id + '-' + Date.now(),
              id, docenteId, cal.alumnoId, cal.columnaId,
              datosAnteriores ? JSON.stringify(datosAnteriores) : null,
              JSON.stringify({ marcados: marcadosFinales, calificativo: cal.calificativo, esAD: cal.esAD }),
              ahora,
            ]
          );

          // Auditoría: registrar quién guardó qué
          await safeExec(c,
            `INSERT INTO auditoria (id, timestamp, usuario_id, accion, tabla, registro_id, cambios, ip)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              'aud-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7),
              ahora, docenteId || 'anonymous', accion, 'calificaciones', id,
              JSON.stringify({ alumnoId: cal.alumnoId, columnaId: cal.columnaId, calificativo: cal.calificativo }),
              ip,
            ]
          );
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
        // Full-replace: eliminar todas y re-insertar para que las bajas se propaguen
        await c.execute('DELETE FROM unidades');
        for (const u of datos) {
          const e = await safeExec(c,
            `INSERT INTO unidades (id, numero, nombre, bimestreId, activa)
             VALUES (?, ?, ?, ?, ?)`,
            [u.id, u.numero || 0, u.nombre || '', u.bimestreId || null, u.activa !== false ? 1 : 0]
          );
          e ? errores.push(`unidad ${u.id}: ${e}`) : ok++;
        }
        if (datos.length === 0) ok = 0; // borrado exitoso aunque no haya inserts
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
        // Full-replace: eliminar todas y re-insertar para que las bajas se propaguen
        await c.execute('DELETE FROM asignaciones');
        for (const a of datos) {
          const e = await safeExec(c,
            `INSERT INTO asignaciones (id, docenteId, grados, secciones, cursos, extra)
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
        if (datos.length === 0) ok = 0;
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
