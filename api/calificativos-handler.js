/**
 * API Handler para Calificativos Multi-Docente
 * Ruta: /api/calificativos-handler
 * Métodos: GET, POST, PUT, DELETE
 */

import { query, execute } from './turso.js';

// Inicializar tablas
async function initializeCalificativosTable() {
  try {
    await execute(`
      CREATE TABLE IF NOT EXISTS calificativos (
        id TEXT PRIMARY KEY,
        docenteId TEXT NOT NULL,
        alumnoId TEXT NOT NULL,
        columnaId TEXT NOT NULL,
        competenciaId TEXT NOT NULL,
        competencia TEXT,
        alumnoNombre TEXT,
        notaNumerica REAL,
        calificativo TEXT,
        esAD BOOLEAN DEFAULT 0,
        marcados TEXT,
        claves TEXT,
        fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
        periodo TEXT,
        creado DATETIME DEFAULT CURRENT_TIMESTAMP,
        actualizado DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `).catch(() => {}); // Ignorar si ya existe
  } catch (e) {
    console.log('Tabla calificativos ya existe');
  }
}

// GET - Obtener calificativos
async function handleGet(req) {
  const {
    docenteId,
    alumnoId,
    columnaId,
    competenciaId,
    periodo,
    admin,
  } = req.query;

  try {
    let sql = 'SELECT * FROM calificativos WHERE 1=1';
    const params = [];

    if (!admin && docenteId) {
      sql += ' AND docenteId = ?';
      params.push(docenteId);
    }

    if (alumnoId) {
      sql += ' AND alumnoId = ?';
      params.push(alumnoId);
    }

    if (columnaId) {
      sql += ' AND columnaId = ?';
      params.push(columnaId);
    }

    if (competenciaId) {
      sql += ' AND competenciaId = ?';
      params.push(competenciaId);
    }

    if (periodo) {
      sql += ' AND periodo = ?';
      params.push(periodo);
    }

    sql += ' ORDER BY fecha DESC LIMIT 10000';

    const result = await query(sql, params);

    return {
      success: true,
      count: result.rows.length,
      calificativos: result.rows.map((row) => ({
        ...row,
        marcados: row.marcados ? JSON.parse(row.marcados) : [],
        claves: row.claves ? JSON.parse(row.claves) : [],
      })),
    };
  } catch (error) {
    console.error('❌ Error GET:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

// POST - Crear/actualizar calificativos
async function handlePost(req) {
  const { docenteId, calificativos } = req.body;

  if (!docenteId || !Array.isArray(calificativos)) {
    return {
      success: false,
      error: 'docenteId y calificativos requeridos',
    };
  }

  let insertados = 0;
  let actualizados = 0;
  const errores = [];

  try {
    for (const cal of calificativos) {
      const {
        id,
        alumnoId,
        columnaId,
        competenciaId,
        competencia,
        alumnoNombre,
        notaNumerica,
        calificativo,
        esAD,
        marcados,
        claves,
        fecha,
        periodo,
      } = cal;

      if (!id || !alumnoId || !columnaId || !competenciaId) {
        errores.push(`Calificativo falta campos`);
        continue;
      }

      const marcadosStr = JSON.stringify(marcados || []);
      const clavesStr = JSON.stringify(claves || []);
      const ahora = new Date().toISOString();

      try {
        const existente = await query('SELECT id FROM calificativos WHERE id = ?', [id]);

        if (existente.rows.length > 0) {
          await execute(
            `UPDATE calificativos
             SET notaNumerica = ?, calificativo = ?, competencia = ?,
                 alumnoNombre = ?, esAD = ?, marcados = ?, claves = ?,
                 periodo = ?, actualizado = ?
             WHERE id = ?`,
            [
              notaNumerica,
              calificativo,
              competencia,
              alumnoNombre,
              esAD ? 1 : 0,
              marcadosStr,
              clavesStr,
              periodo,
              ahora,
              id,
            ]
          );
          actualizados++;
        } else {
          await execute(
            `INSERT INTO calificativos
             (id, docenteId, alumnoId, columnaId, competenciaId,
              competencia, alumnoNombre, notaNumerica, calificativo,
              esAD, marcados, claves, fecha, periodo, creado, actualizado)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              id,
              docenteId,
              alumnoId,
              columnaId,
              competenciaId,
              competencia,
              alumnoNombre,
              notaNumerica,
              calificativo,
              esAD ? 1 : 0,
              marcadosStr,
              clavesStr,
              fecha || ahora,
              periodo,
              ahora,
              ahora,
            ]
          );
          insertados++;
        }
      } catch (error) {
        errores.push(`Error en ${id}: ${error.message}`);
      }
    }

    return {
      success: true,
      insertados,
      actualizados,
      total: insertados + actualizados,
      errores: errores.length > 0 ? errores : undefined,
    };
  } catch (error) {
    console.error('❌ Error POST:', error);
    return {
      success: false,
      error: error.message,
      insertados,
      actualizados,
    };
  }
}

// PUT - Actualizar un calificativo
async function handlePut(req, id) {
  const updates = req.body;

  if (!id) {
    return { success: false, error: 'ID requerido' };
  }

  try {
    const allowedFields = ['notaNumerica', 'calificativo', 'esAD', 'marcados', 'claves', 'periodo'];
    const fields = Object.keys(updates).filter((k) => allowedFields.includes(k));

    if (fields.length === 0) {
      return { success: false, error: 'Sin campos válidos' };
    }

    const setClauses = fields.map((f) => `${f} = ?`);
    const values = fields.map((f) => {
      const v = updates[f];
      if (f === 'marcados' || f === 'claves') return JSON.stringify(v);
      if (f === 'esAD') return v ? 1 : 0;
      return v;
    });

    values.push(new Date().toISOString());
    values.push(id);

    const sql = `UPDATE calificativos SET ${setClauses.join(', ')}, actualizado = ? WHERE id = ?`;
    const result = await execute(sql, values);

    return {
      success: true,
      message: 'Actualizado',
      changes: result.changes,
    };
  } catch (error) {
    console.error('❌ Error PUT:', error);
    return { success: false, error: error.message };
  }
}

// DELETE - Eliminar
async function handleDelete(id) {
  if (!id) {
    return { success: false, error: 'ID requerido' };
  }

  try {
    const result = await execute('DELETE FROM calificativos WHERE id = ?', [id]);
    return {
      success: true,
      message: 'Eliminado',
      changes: result.changes,
    };
  } catch (error) {
    console.error('❌ Error DELETE:', error);
    return { success: false, error: error.message };
  }
}

// Handler principal
export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token,X-Requested-With,Accept,Accept-Version,Content-Length,Content-MD5,Content-Type,Date,X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // Inicializar tablas
    await initializeCalificativosTable();

    const { method } = req;
    const path = req.url.replace('/api/calificativos-handler', '').split('?')[0];

    let result;

    if (method === 'GET') {
      result = await handleGet(req);
    } else if (method === 'POST') {
      result = await handlePost(req);
    } else if (method === 'PUT') {
      const id = path.slice(1);
      result = await handlePut(req, id);
    } else if (method === 'DELETE') {
      const id = path.slice(1);
      result = await handleDelete(id);
    } else {
      result = { success: false, error: 'Método no permitido' };
    }

    res.status(200).json(result);
  } catch (error) {
    console.error('❌ Error handler:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}
