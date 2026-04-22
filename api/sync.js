import { createClient } from '@libsql/client';

let client = null;

function getClient() {
  if (!client) {
    const url = process.env.TURSO_CONNECTION_URL;
    const authToken = process.env.TURSO_AUTH_TOKEN;
    if (!url || !authToken) {
      return null;
    }
    client = createClient({ url, authToken });
  }
  return client;
}

export default async function handler(req, res) {
  const c = getClient();
  if (!c) {
    return res.status(503).json({ error: 'Turso no configurado' });
  }

  if (req.method === 'GET') {
    // Sincronizar datos desde Turso
    try {
      const usuarios = await c.execute('SELECT * FROM users WHERE activo = 1');
      const docentes = await c.execute('SELECT * FROM docentes');
      const alumnos = await c.execute('SELECT * FROM alumnos');
      
      return res.json({
        usuarios: usuarios.rows || [],
        docentes: docente.rows || [],
        alumnos: alumno.rows || []
      });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  if (req.method === 'POST') {
    const { tipo, datos } = req.body;
    
    try {
      if (tipo === 'usuarios') {
        for (const u of datos) {
          await c.execute(
            `INSERT OR REPLACE INTO users (id, nombre, email, contraseña, rol, activo, docenteId) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [u.id, u.nombre, u.email, u.contraseña, u.rol, u.activo ? 1 : 0, u.docenteId || null]
          );
        }
      }
      
      if (tipo === 'docentes') {
        for (const d of datos) {
          await c.execute(
            `INSERT OR REPLACE INTO docentes (id, apellidos_nombres, dni, genero, fecha_nacimiento, celular, cargo, email) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [d.id, d.apellidos_nombres, d.dni, d.genero, d.fecha_nacimiento, d.celular, d.cargo, d.email]
          );
        }
      }
      
      if (tipo === 'alumnos') {
        for (const a of datos) {
          await c.execute(
            `INSERT OR REPLACE INTO alumnos (id, apellidos_nombres, dni, fecha_nacimiento, edad, sexo, grado, seccion) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [a.id, a.apellidos_nombres, a.dni, a.fecha_nacimiento, a.edad, a.sexo, a.grado, a.seccion]
          );
        }
      }

      return res.json({ success: true });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  return res.status(405).json({ error: 'Método no Allowed' });
}