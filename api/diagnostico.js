import { createClient } from '@libsql/client';

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const diagnosticos = [];
  let ok = true;

  // 1. Variables de entorno
  const url = process.env.TURSO_CONNECTION_URL;
  const token = process.env.TURSO_AUTH_TOKEN;
  const jwtSecret = process.env.JWT_SECRET;

  const envOk = !!url && !!token;
  diagnosticos.push({
    paso: 'variables_entorno',
    ok: envOk,
    detalles: {
      TURSO_CONNECTION_URL: url ? 'Definida (' + url.substring(0, 20) + '...)' : 'NO DEFINIDA',
      TURSO_AUTH_TOKEN: token ? 'Definida (' + token.length + ' chars)' : 'NO DEFINIDA',
      JWT_SECRET: jwtSecret ? 'Definida' : 'Usando default (no recomendado)',
    }
  });

  if (!envOk) {
    ok = false;
    return res.status(503).json({
      ok: false,
      error: 'Faltan variables de entorno en Vercel',
      solucion: 'Configura TURSO_CONNECTION_URL y TURSO_AUTH_TOKEN en el dashboard de Vercel: Settings > Environment Variables',
      diagnosticos
    });
  }

  // 2. Crear cliente Turso
  let client = null;
  let urlUsada = url;
  try {
    client = createClient({ url, authToken: token });
    diagnosticos.push({ paso: 'crear_cliente_libsql', ok: true });
  } catch (e) {
    diagnosticos.push({ paso: 'crear_cliente_libsql', ok: false, error: e.message });
    // Intentar con https://
    if (url.startsWith('libsql://')) {
      urlUsada = url.replace('libsql://', 'https://');
      try {
        client = createClient({ url: urlUsada, authToken: token });
        diagnosticos.push({ paso: 'crear_cliente_https', ok: true, url: urlUsada });
      } catch (e2) {
        diagnosticos.push({ paso: 'crear_cliente_https', ok: false, error: e2.message });
        ok = false;
        return res.status(500).json({ ok: false, error: 'No se pudo crear cliente Turso', diagnosticos });
      }
    } else {
      ok = false;
      return res.status(500).json({ ok: false, error: 'No se pudo crear cliente: ' + e.message, diagnosticos });
    }
  }

  // 3. Query simple
  try {
    const r = await client.execute('SELECT 1 as test');
    diagnosticos.push({ paso: 'query_simple', ok: true, resultado: r.rows });
  } catch (e) {
    diagnosticos.push({ paso: 'query_simple', ok: false, error: e.message });
    ok = false;
    return res.status(500).json({ ok: false, error: 'Query falló: ' + e.message, diagnosticos });
  }

  // 4. Contar alumnos
  try {
    const r = await client.execute('SELECT COUNT(*) as n FROM alumnos');
    const count = Number(r.rows?.[0]?.n ?? 0);
    diagnosticos.push({ paso: 'contar_alumnos', ok: true, count });
  } catch (e) {
    diagnosticos.push({ paso: 'contar_alumnos', ok: false, error: e.message });
    // No es crítico, puede que la tabla no exista todavía
  }

  // 5. Contar docentes
  try {
    const r = await client.execute('SELECT COUNT(*) as n FROM docentes');
    const count = Number(r.rows?.[0]?.n ?? 0);
    diagnosticos.push({ paso: 'contar_docentes', ok: true, count });
  } catch (e) {
    diagnosticos.push({ paso: 'contar_docentes', ok: false, error: e.message });
  }

  // 6. Contar calificaciones
  try {
    const r = await client.execute('SELECT COUNT(*) as n FROM calificaciones');
    const count = Number(r.rows?.[0]?.n ?? 0);
    diagnosticos.push({ paso: 'contar_calificaciones', ok: true, count });
  } catch (e) {
    diagnosticos.push({ paso: 'contar_calificaciones', ok: false, error: e.message });
  }

  // 7. Test de escritura
  try {
    const testId = 'test-' + Date.now();
    await client.execute(
      `INSERT INTO alumnos (id, apellidos_nombres, dni, fecha_nacimiento, edad, sexo, grado, seccion) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [testId, 'TEST CONEXION', '00000000', '2020-01-01', 0, 'Masculino', '1°', 'A']
    );
    const verificar = await client.execute('SELECT COUNT(*) as n FROM alumnos WHERE id = ?', [testId]);
    const count = Number(verificar.rows?.[0]?.n ?? 0);
    await client.execute('DELETE FROM alumnos WHERE id = ?', [testId]);
    diagnosticos.push({ paso: 'test_escritura', ok: count === 1, escribio: count === 1 });
  } catch (e) {
    diagnosticos.push({ paso: 'test_escritura', ok: false, error: e.message });
  }

  return res.json({
    ok,
    mensaje: ok ? 'Turso está funcionando correctamente' : 'Hay problemas con Turso',
    url_usada: urlUsada,
    diagnosticos
  });
}
