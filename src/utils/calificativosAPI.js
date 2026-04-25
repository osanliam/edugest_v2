/**
 * Cliente API para gestionar calificativos multi-docente
 * Reemplaza el almacenamiento en localStorage con API calls a Turso
 */

const API_BASE = '/api/calificativos-handler';

/**
 * Obtener calificativos
 * @param {Object} options
 *   - docenteId: ID del docente (requerido para docentes)
 *   - alumnoId: Filtrar por alumno (opcional)
 *   - columnaId: Filtrar por columna (opcional)
 *   - competenciaId: Filtrar por competencia (opcional)
 *   - periodo: Filtrar por período (opcional)
 *   - admin: true para ver todos (requerido para admin)
 */
export async function getCalificativos(options = {}) {
  try {
    const params = new URLSearchParams(options).toString();
    const url = `${API_BASE}?${params}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.success) {
      console.error('❌ Error obteniendo calificativos:', data.error);
      return {
        success: false,
        calificativos: [],
        error: data.error,
      };
    }

    console.log(`✅ ${data.count} calificativos obtenidos`);
    return data;
  } catch (error) {
    console.error('❌ Error en getCalificativos:', error);
    return {
      success: false,
      calificativos: [],
      error: error.message,
    };
  }
}

/**
 * Crear/actualizar calificativos
 * @param {string} docenteId - ID del docente
 * @param {Array} calificativos - Array de calificativos
 */
export async function saveCalificativos(docenteId, calificativos) {
  if (!docenteId) {
    console.error('❌ docenteId es requerido');
    return {
      success: false,
      error: 'docenteId es requerido',
    };
  }

  if (!Array.isArray(calificativos) || calificativos.length === 0) {
    console.error('❌ calificativos debe ser un array no vacío');
    return {
      success: false,
      error: 'calificativos debe ser un array no vacío',
    };
  }

  try {
    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        docenteId,
        calificativos,
      }),
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.success) {
      console.error('❌ Error guardando calificativos:', data.error);
      return data;
    }

    console.log(
      `✅ ${data.insertados} insertados, ${data.actualizados} actualizados`
    );
    if (data.errores?.length > 0) {
      console.warn('⚠️ Errores durante la carga:', data.errores);
    }

    return data;
  } catch (error) {
    console.error('❌ Error en saveCalificativos:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Actualizar un calificativo específico
 * @param {string} id - ID del calificativo
 * @param {Object} updates - Cambios a realizar
 */
export async function updateCalificativo(id, updates) {
  if (!id) {
    console.error('❌ ID es requerido');
    return {
      success: false,
      error: 'ID es requerido',
    };
  }

  try {
    const response = await fetch(`${API_BASE}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.success) {
      console.error('❌ Error actualizando:', data.error);
      return data;
    }

    console.log('✅ Calificativo actualizado');
    return data;
  } catch (error) {
    console.error('❌ Error en updateCalificativo:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Eliminar un calificativo
 * @param {string} id - ID del calificativo
 */
export async function deleteCalificativo(id) {
  if (!id) {
    console.error('❌ ID es requerido');
    return {
      success: false,
      error: 'ID es requerido',
    };
  }

  try {
    const response = await fetch(`${API_BASE}/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.success) {
      console.error('❌ Error eliminando:', data.error);
      return data;
    }

    console.log('✅ Calificativo eliminado');
    return data;
  } catch (error) {
    console.error('❌ Error en deleteCalificativo:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Obtener columnas de un docente
 * @param {string} docenteId - ID del docente
 */
export async function getColumnasDocente(docenteId) {
  // Por ahora, usa localStorage para columnas
  // Esto se puede mejorar después
  const columnas = localStorage.getItem('cal_columnas');
  return {
    success: true,
    columnas: columnas ? JSON.parse(columnas) : [],
  };
}

/**
 * Guardar columna personalizada
 * @param {Object} columna - Datos de la columna
 */
export async function saveColumna(columna) {
  // Por ahora, guarda en localStorage
  // Esto se puede mejorar después
  const columnas = localStorage.getItem('cal_columnas');
  const list = columnas ? JSON.parse(columnas) : [];
  const idx = list.findIndex((c) => c.id === columna.id);
  if (idx >= 0) {
    list[idx] = columna;
  } else {
    list.push(columna);
  }
  localStorage.setItem('cal_columnas', JSON.stringify(list));
  console.log('✅ Columna guardada');
  return { success: true };
}

/**
 * Obtener estadísticas de calificativos
 * @param {Object} options
 *   - docenteId: Filtrar por docente (opcional)
 *   - periodo: Filtrar por período (opcional)
 */
export async function getEstadisticas(options = {}) {
  // Función simplificada por ahora
  return {
    success: true,
    estadisticas: [],
  };
}

/**
 * Migración: Cargar calificativos desde localStorage a API
 * Útil para migrar datos existentes
 */
export async function migrateFromLocalStorage(docenteId) {
  try {
    const key = 'ie_calificativos_v2';
    const stored = localStorage.getItem(key);

    if (!stored) {
      console.warn('⚠️ No hay datos en localStorage');
      return {
        success: false,
        migrados: 0,
        error: 'No hay datos en localStorage',
      };
    }

    const calificativos = JSON.parse(stored);

    if (!Array.isArray(calificativos)) {
      console.error('❌ localStorage no contiene un array');
      return {
        success: false,
        migrados: 0,
        error: 'Formato inválido en localStorage',
      };
    }

    console.log(`📦 Migrando ${calificativos.length} calificativos...`);

    const result = await saveCalificativos(docenteId, calificativos);

    if (result.success) {
      console.log('✅ Migración completada');
      // Opcional: limpiar localStorage después de migración exitosa
      // localStorage.removeItem(key);
    }

    return result;
  } catch (error) {
    console.error('❌ Error en migrateFromLocalStorage:', error);
    return {
      success: false,
      migrados: 0,
      error: error.message,
    };
  }
}
