#!/usr/bin/env node
/**
 * Script para migrar datos de Turso a PostgreSQL
 * Uso: node scripts/migrate-to-postgres.js
 */

import { createClient } from '@libsql/client';
import { Pool } from 'pg';
import fs from 'fs';

const TURSO_URL = process.env.TURSO_CONNECTION_URL;
const TURSO_TOKEN = process.env.TURSO_AUTH_TOKEN;

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST,
  database: process.env.DB_NAME || 'edugest',
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432'),
});

async function migrate() {
  console.log('🔄 Iniciando migración de Turso a PostgreSQL...\n');

  if (!TURSO_URL || !TURSO_TOKEN) {
    console.log('⚠️  No hay configuración de Turso. Usando datos de localStorage...');
    await migrateFromLocalStorage();
    return;
  }

  const turso = createClient({ url: TURSO_URL, authToken: TURSO_TOKEN });

  // Tablas a migrar
  const tables = [
    { name: 'users', insert: `INSERT INTO users (id, nombre, email, contraseña, rol, activo, docenteId, creado) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT (id) DO NOTHING` },
    { name: 'docentes', insert: `INSERT INTO docentes (id, apellidos_nombres, dni, genero, fecha_nacimiento, celular, cargo, email, user_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) ON CONFLICT (id) DO NOTHING` },
    { name: 'alumnos', insert: `INSERT INTO alumnos (id, apellidos_nombres, nombre, dni, fecha_nacimiento, edad, sexo, grado, seccion, telefono, direccion, email, extra, madre_id, padre_id, user_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) ON CONFLICT (id) DO NOTHING` },
    { name: 'columnas', insert: `INSERT INTO columnas (id, nombre, tipo, totalItems, competenciaId, bimestreId, promediar, itemsExamen, items, columnasEval, creatorId) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) ON CONFLICT (id) DO NOTHING` },
    { name: 'calificaciones', insert: `INSERT INTO calificaciones (id, alumnoId, columnaId, marcados, claves, notaNumerica, calificativo, esAD, fecha) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) ON CONFLICT (id) DO NOTHING` },
    { name: 'asistencia', insert: `INSERT INTO asistencia (id, alumnoId, fecha, estado, modo, hora) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (id) DO NOTHING` },
    { name: 'unidades', insert: `INSERT INTO unidades (id, numero, nombre, bimestreId, activa) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (id) DO NOTHING` },
    { name: 'asignaciones', insert: `INSERT INTO asignaciones (id, docenteId, grados, secciones, cursos, extra) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (id) DO NOTHING` },
  ];

  for (const table of tables) {
    try {
      console.log(`📊 Migrando ${table.name}...`);
      const result = await turso.execute(`SELECT * FROM ${table.name}`);
      const rows = result.rows || [];
      
      if (rows.length === 0) {
        console.log(`   ⏭️  Tabla vacía, saltando`);
        continue;
      }

      let migrated = 0;
      for (const row of rows) {
        try {
          const values = Object.values(row).map(v => 
            typeof v === 'object' && v !== null ? JSON.stringify(v) : v
          );
          await pool.query(table.insert, values);
          migrated++;
        } catch (e) {
          console.error(`   ❌ Error fila ${migrated}:`, e.message);
        }
      }
      console.log(`   ✅ ${migrated}/${rows.length} registros migrados`);
    } catch (e) {
      console.error(`   ❌ Error tabla ${table.name}:`, e.message);
    }
  }

  console.log('\n🎉 Migración completada');
  await pool.end();
}

async function migrateFromLocalStorage() {
  console.log('💾 Migrando desde archivos JSON...\n');
  
  // Si tienes backups JSON, los podemos cargar aquí
  const backupDir = './backups';
  if (!fs.existsSync(backupDir)) {
    console.log('⚠️  No hay carpeta ./backups. Coloca tus archivos JSON allí.');
    return;
  }

  // Implementación para cargar desde JSON...
  console.log('📝 Función de carga desde JSON pendiente de implementar');
}

migrate().catch(console.error);
