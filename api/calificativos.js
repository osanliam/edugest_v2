import { query, execute } from './turso.js';

/**
 * Endpoint para gestionar calificativos multi-docente
 * GET /api/calificativos - Obtener calificativos
 * POST /api/calificativos - Crear/actualizar calificativos
 * PUT /api/calificativos/:id - Actualizar un calificativo
 * DELETE /api/calificativos/:id - Eliminar un calificativo
 */

// Crear tabla de calificativos si no existe
export async function initializeCalificativosTable() {
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
        actualizado DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_docente (docenteId),
        INDEX idx_alumno (alumnoId),
        INDEX idx_docente_alumno (docenteId, alumnoId),
        INDEX idx_columna (columnaId),
        INDEX idx_competencia (competenciaId)
      );
    `);

    await execute(`
      CREATE TABLE IF NOT EXISTS columnas (
        id TEXT PRIMARY KEY,
        docenteId TEXT NOT NULL,
        nombre TEXT NOT NULL,
        competenciaId TEXT NOT NULL,
        tipo TEXT,
        descripcion TEXT,
        creado DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_docente_competencia (docenteId, competenciaId)
      );
    `);

    await execute(`
      CREATE TABLE IF NOT EXISTS competencias (
        id TEXT PRIMARY KEY,
        docenteId TEXT,
        nombre TEXT NOT NULL,
        descripcion TEXT,
        creado DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_docente (docenteId)
      );
    `);

    console.log('✅ Tablas de calificativos inicializadas');
    return true;
  } catch (error) {
    console.error('❌ Error inicializando tablas:', error);
    throw error;
  }
}

/**
 * GET /api/calificativos
 * Query params:
 *   - docenteId: ID del docente (obligatorio para docentes)
 *   - alumnoId: Filtrar por alumno (opcional)
 *   - columnaId: Filtrar por columna (opcional)
 *   - competenciaId: Filtrar por competencia (opcional)
 *   - periodo: Filtrar por período (opcional)
 *   - admin: true/false (si es admin, ve todos)
 */
export async function getCalificativos(req) {
  const {
    docenteId,
    alumnoId,
    columnaId,
    competenciaId,
    periodo,
    admin = false,
  } = req.query;

  try {
    let sql = 'SELECT * FROM calificativos WHERE 1=1';
    const params = [];

    // Si es admin, ve todos. Si no, solo sus calificativos
    if (!admin && docenteId) {
      sql += ' AND docenteId = ?';
      params.push(docenteId);
    }

    // Filtros adicionales
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

    sql += ' ORDER BY fecha DESC';

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
    console.error('❌ Error obteniendo calificativos:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * POST /api/calificativos
 * Body:
 *   {
 *     docenteId: string,
 *     calificativos: Array<{
 *       id, alumnoId, columnaId, competenciaId, notaNumerica, calificativo, ...
 *     }>
 *   }
 */
export async function createCalificativos(req) {
  const { docenteId, calificativos } = req.body;

  if (!docenteId) {
    return {
      success: false,
      error: 'docenteId es requerido',
    };
  }

  if (!Array.isArray(calificativos) || calificativos.length === 0) {
    return {
      success: false,
      error: 'calificativos debe ser un array no vacío',
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
        esAD = false,
        marcados = [],
        claves = [],
        fecha,
        periodo,
      } = cal;

      // Validar campos requeridos
      if (!id || !alumnoId || !columnaId || !competenciaId) {
        errores.push(`Calificativo ${id} falta campos requeridos`);
        continue;
      }

      try {
        // Verificar si ya existe
        const existente = await query(
          'SELECT id FROM calificativos WHERE id = ?',
          [id]
        );

        const marcadosStr = JSON.stringify(marcados);
        const clavesStr = JSON.stringify(claves);
        const ahora = new Date().toISOString();

        if (existente.rows.length > 0) {
          // Actualizar
          await execute(
            `UPDATE calificativos
             SET notaNumerica = ?,
                 calificativo = ?,
                 competencia = ?,
                 alumnoNombre = ?,
                 esAD = ?,
                 marcados = ?,
                 claves = ?,
                 periodo = ?,
                 actualizado = ?
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
          // Insertar
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
        errores.push(`Error en calificativo ${id}: ${error.message}`);
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
    console.error('❌ Error guardando calificativos:', error);
    return {
      success: false,
      error: error.message,
      insertados,
      actualizados,
      errores,
    };
  }
}

/**
 * PUT /api/calificativos/:id
 * Body: { notaNumerica, calificativo, ... }
 */
export async function updateCalificativo(req, id) {
  const updates = req.body;

  if (!id) {
    return {
      success: false,
      error: 'ID es requerido',
    };
  }

  try {
    const allowedFields = [
      'notaNumerica',
      'calificativo',
      'esAD',
      'marcados',
      'claves',
      'periodo',
    ];
    const fields = Object.keys(updates).filter((key) =>
      allowedFields.includes(key)
    );

    if (fields.length === 0) {
      return {
        success: false,
        error: 'No hay campos válidos para actualizar',
      };
    }

    const setClauses = fields.map((field) => {
      if (field === 'marcados' || field === 'claves') {
        return `${field} = ?`;
      }
      return `${field} = ?`;
    });

    const values = fields.map((field) => {
      const value = updates[field];
      if (field === 'marcados' || field === 'claves') {
        return JSON.stringify(value);
      }
      if (field === 'esAD') {
        return value ? 1 : 0;
      }
      return value;
    });

    values.push(new Date().toISOString());
    values.push(id);

    const sql = `UPDATE calificativos
                 SET ${setClauses.join(', ')}, actualizado = ?
                 WHERE id = ?`;

    const result = await execute(sql, values);

    return {
      success: true,
      message: 'Calificativo actualizado',
      changes: result.changes,
    };
  } catch (error) {
    console.error('❌ Error actualizando calificativo:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * DELETE /api/calificativos/:id
 */
export async function deleteCalificativo(id) {
  if (!id) {
    return {
      success: false,
      error: 'ID es requerido',
    };
  }

  try {
    const result = await execute('DELETE FROM calificativos WHERE id = ?', [
      id,
    ]);

    return {
      success: true,
      message: 'Calificativo eliminado',
      changes: result.changes,
    };
  } catch (error) {
    console.error('❌ Error eliminando calificativo:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Guardar columnas personalizadas de un docente
 */
export async function saveColumna(req) {
  const { id, docenteId, nombre, competenciaId, tipo, descripcion } =
    req.body;

  if (!id || !docenteId || !nombre || !competenciaId) {
    return {
      success: false,
      error: 'Faltan campos requeridos: id, docenteId, nombre, competenciaId',
    };
  }

  try {
    const existente = await query(
      'SELECT id FROM columnas WHERE id = ?',
      [id]
    );

    if (existente.rows.length > 0) {
      await execute(
        `UPDATE columnas
         SET nombre = ?, tipo = ?, descripcion = ?
         WHERE id = ?`,
        [nombre, tipo, descripcion, id]
      );
    } else {
      await execute(
        `INSERT INTO columnas (id, docenteId, nombre, competenciaId, tipo, descripcion)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [id, docenteId, nombre, competenciaId, tipo, descripcion]
      );
    }

    return {
      success: true,
      message: 'Columna guardada',
    };
  } catch (error) {
    console.error('❌ Error guardando columna:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Obtener columnas de un docente
 */
export async function getColumnasDocente(req) {
  const { docenteId } = req.query;

  if (!docenteId) {
    return {
      success: false,
      error: 'docenteId es requerido',
    };
  }

  try {
    const result = await query(
      'SELECT * FROM columnas WHERE docenteId = ? ORDER BY creado DESC',
      [docenteId]
    );

    return {
      success: true,
      columnas: result.rows,
    };
  } catch (error) {
    console.error('❌ Error obteniendo columnas:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Estadísticas de calificativos por docente
 */
export async function getEstadisticas(req) {
  const { docenteId, periodo } = req.query;

  try {
    let sql = `
      SELECT
        docenteId,
        COUNT(*) as total_calificativos,
        COUNT(DISTINCT alumnoId) as estudiantes_evaluados,
        COUNT(DISTINCT columnaId) as total_instrumentos,
        AVG(notaNumerica) as promedio_notas,
        MIN(notaNumerica) as nota_minima,
        MAX(notaNumerica) as nota_maxima,
        SUM(CASE WHEN calificativo = 'AD' THEN 1 ELSE 0 END) as cantidad_AD,
        SUM(CASE WHEN calificativo = 'A' THEN 1 ELSE 0 END) as cantidad_A,
        SUM(CASE WHEN calificativo = 'B' THEN 1 ELSE 0 END) as cantidad_B,
        SUM(CASE WHEN calificativo = 'C' THEN 1 ELSE 0 END) as cantidad_C
      FROM calificativos
      WHERE 1=1
    `;

    const params = [];

    if (docenteId) {
      sql += ' AND docenteId = ?';
      params.push(docenteId);
    }

    if (periodo) {
      sql += ' AND periodo = ?';
      params.push(periodo);
    }

    sql += ' GROUP BY docenteId';

    const result = await query(sql, params);

    return {
      success: true,
      estadisticas: result.rows,
    };
  } catch (error) {
    console.error('❌ Error obteniendo estadísticas:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}
