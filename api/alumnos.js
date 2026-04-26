import jwt from 'jsonwebtoken';
import { query, execute, initializeDatabase } from '../lib/turso.js';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'sistemita-secreto-2026-muy-seguro';

function verifyToken(authHeader) {
  const token = authHeader?.split(' ')[1];
  if (!token) throw new Error('Token requerido');
  return jwt.verify(token, JWT_SECRET);
}

function cors(res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

// Calcular edad a partir de fecha de nacimiento
function calcularEdad(fechaNac) {
  if (!fechaNac) return null;
  const hoy = new Date();
  const nac = new Date(fechaNac);
  let edad = hoy.getFullYear() - nac.getFullYear();
  const m = hoy.getMonth() - nac.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--;
  return edad;
}

// Insertar o recuperar apoderado por DNI
async function upsertApoderado(datos, parentesco) {
  if (!datos?.dni || !datos?.apellidos_nombres) return null;

  const existing = await query('SELECT id FROM apoderados WHERE dni = ?', [datos.dni]);
  if (existing.rows?.length > 0) {
    // Actualizar datos si ya existe
    await execute(
      'UPDATE apoderados SET apellidos_nombres=?, celular=?, parentesco=? WHERE dni=?',
      [datos.apellidos_nombres, datos.celular || '', parentesco, datos.dni]
    );
    return existing.rows[0].id;
  }

  const id = `apod-${crypto.randomUUID()}`;
  await execute(
    'INSERT INTO apoderados (id, apellidos_nombres, dni, celular, parentesco) VALUES (?, ?, ?, ?, ?)',
    [id, datos.apellidos_nombres, datos.dni, datos.celular || '', parentesco]
  );
  return id;
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    verifyToken(req.headers.authorization);
    await initializeDatabase();

    // GET → listar alumnos con datos de apoderados
    if (req.method === 'GET') {
      try {
        const result = await query(`
          SELECT
            a.*,
            m.apellidos_nombres AS madre_nombres,
            m.dni AS madre_dni,
            m.celular AS madre_celular,
            p.apellidos_nombres AS padre_nombres,
            p.dni AS padre_dni,
            p.celular AS padre_celular
          FROM alumnos a
          LEFT JOIN apoderados m ON a.madre_id = m.id
          LEFT JOIN apoderados p ON a.padre_id = p.id
          ORDER BY a.apellidos_nombres ASC
        `);
        return res.status(200).json(result.rows || []);
      } catch (err) {
        console.error('Alumnos GET error:', err);
        return res.status(500).json({ error: 'Error cargando alumnos: ' + err.message });
      }
    }

    // POST → crear alumno + apoderados
    if (req.method === 'POST') {
      const {
        apellidos_nombres, dni, fecha_nacimiento, sexo, grado, seccion,
        madre, padre, user_id
      } = req.body;

      if (!apellidos_nombres || !dni || !fecha_nacimiento || !sexo || !grado || !seccion)
        return res.status(400).json({ error: 'Faltan campos obligatorios del alumno' });

      const edad = calcularEdad(fecha_nacimiento);
      const madre_id = await upsertApoderado(madre, 'madre');
      const padre_id = await upsertApoderado(padre, 'padre');

      const id = `alu-${crypto.randomUUID()}`;
      await execute(
        `INSERT INTO alumnos (id, apellidos_nombres, dni, fecha_nacimiento, edad, sexo, grado, seccion, madre_id, padre_id, user_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, apellidos_nombres, dni, fecha_nacimiento, edad, sexo, grado, seccion,
         madre_id, padre_id, user_id || null]
      );
      return res.status(201).json({ ok: true, id });
    }

    // PUT → editar alumno + apoderados
    if (req.method === 'PUT') {
      const { id } = req.query;
      if (!id) return res.status(400).json({ error: 'ID requerido' });

      const {
        apellidos_nombres, dni, fecha_nacimiento, sexo, grado, seccion,
        madre, padre
      } = req.body;

      const edad = calcularEdad(fecha_nacimiento);
      const madre_id = await upsertApoderado(madre, 'madre');
      const padre_id = await upsertApoderado(padre, 'padre');

      await execute(
        `UPDATE alumnos SET apellidos_nombres=?, dni=?, fecha_nacimiento=?, edad=?, sexo=?, grado=?, seccion=?, madre_id=?, padre_id=? WHERE id=?`,
        [apellidos_nombres, dni, fecha_nacimiento, edad, sexo, grado, seccion,
         madre_id, padre_id, id]
      );
      return res.status(200).json({ ok: true });
    }

    // DELETE → eliminar alumno
    if (req.method === 'DELETE') {
      const { id } = req.query;
      if (!id) return res.status(400).json({ error: 'ID requerido' });
      await execute('DELETE FROM alumnos WHERE id = ?', [id]);
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Alumnos API error:', error);
    if (error.message?.includes('Token') || error.name === 'JsonWebTokenError')
      return res.status(401).json({ error: 'No autorizado' });
    if (error.message?.includes('UNIQUE'))
      return res.status(400).json({ error: 'El DNI ya está registrado' });
    return res.status(500).json({ error: error.message });
  }
}
