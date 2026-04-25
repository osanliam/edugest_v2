/**
 * Endpoint HTTP para calificativos
 * GET /api/calificativos
 * POST /api/calificativos
 * PUT /api/calificativos/:id
 * DELETE /api/calificativos/:id
 */

import {
  initializeCalificativosTable,
  getCalificativos,
  createCalificativos,
  updateCalificativo,
  deleteCalificativo,
  saveColumna,
  getColumnasDocente,
  getEstadisticas,
} from './calificativos.js';

export default async function handler(req, res) {
  // Habilitar CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET,OPTIONS,PATCH,DELETE,POST,PUT'
  );
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token,X-Requested-With,Accept,Accept-Version,Content-Length,Content-MD5,Content-Type,Date,X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // Inicializar tablas en primera llamada
    if (!global.calificativosInitialized) {
      await initializeCalificativosTable();
      global.calificativosInitialized = true;
    }

    // Rutas
    const { method, query: queryParams } = req;
    const path = req.url.replace('/api/calificativos', '').split('?')[0];

    // GET /api/calificativos
    if (method === 'GET' && path === '') {
      const result = await getCalificativos({ query: queryParams });
      return res.status(200).json(result);
    }

    // POST /api/calificativos
    if (method === 'POST' && path === '') {
      const result = await createCalificativos(req);
      return res.status(200).json(result);
    }

    // GET /api/calificativos/columnas?docenteId=xxx
    if (method === 'GET' && path === '/columnas') {
      const result = await getColumnasDocente({ query: queryParams });
      return res.status(200).json(result);
    }

    // POST /api/calificativos/columnas
    if (method === 'POST' && path === '/columnas') {
      const result = await saveColumna(req);
      return res.status(200).json(result);
    }

    // GET /api/calificativos/estadisticas?docenteId=xxx
    if (method === 'GET' && path === '/estadisticas') {
      const result = await getEstadisticas({ query: queryParams });
      return res.status(200).json(result);
    }

    // PUT /api/calificativos/:id
    if (method === 'PUT' && path.startsWith('/')) {
      const id = path.slice(1);
      const result = await updateCalificativo(req, id);
      return res.status(200).json(result);
    }

    // DELETE /api/calificativos/:id
    if (method === 'DELETE' && path.startsWith('/')) {
      const id = path.slice(1);
      const result = await deleteCalificativo(id);
      return res.status(200).json(result);
    }

    // Ruta no encontrada
    return res.status(404).json({
      success: false,
      error: 'Ruta no encontrada',
    });
  } catch (error) {
    console.error('❌ Error en endpoint calificativos:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}
