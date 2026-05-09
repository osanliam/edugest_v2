#!/usr/bin/env node

/**
 * 🧹 LIMPIAR TURSO - Script para optimizar BD
 * USO: node limpiar-turso.mjs
 */

import { createClient } from '@libsql/client';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

async function main() {
  console.log('🔗 Conectando a Turso...\n');

  const client = createClient({
    url: process.env.TURSO_CONNECTION_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  try {
    // 1. VER ESTRUCTURA DE TABLAS
    console.log('📋 TABLAS EN LA BASE DE DATOS:\n');

    const result = await client.execute(`
      SELECT name, sql FROM sqlite_master
      WHERE type='table'
      ORDER BY name
    `);

    const tables = result.rows.map(r => r.name);
    console.log('Tablas:', tables.join(', '), '\n');

    // 2. CONTAR REGISTROS Y TAMAÑO
    console.log('📊 ESTADÍSTICAS:\n');

    let totalSize = 0;

    for (const table of tables) {
      try {
        const countResult = await client.execute(
          `SELECT COUNT(*) as cnt FROM ${table}`
        );
        const count = countResult.rows[0]?.cnt || 0;

        // Estimar tamaño (aproximado)
        const sizeEst = (count * 100) / 1024; // Estimación cruda

        totalSize += sizeEst;

        console.log(`  ${table.padEnd(25)}: ${count} registros (~${sizeEst.toFixed(2)}KB)`);
      } catch (e) {
        console.log(`  ${table.padEnd(25)}: Error - ${e.message}`);
      }
    }

    console.log(`\n  TOTAL ESTIMADO: ${totalSize.toFixed(2)}KB\n`);

    // 3. DETECTAR DUPLICADOS
    console.log('🔍 VERIFICANDO DUPLICADOS:\n');

    for (const table of tables) {
      try {
        // Verificar si hay columna 'id'
        const schemaResult = await client.execute(
          `PRAGMA table_info(${table})`
        );

        const hasId = schemaResult.rows.some(col => col.name === 'id');

        if (hasId) {
          const dupResult = await client.execute(`
            SELECT COUNT(*) as total, COUNT(DISTINCT id) as unique_ids
            FROM ${table}
          `);

          const { total, unique_ids } = dupResult.rows[0];
          const dupes = total - unique_ids;

          if (dupes > 0) {
            console.log(`  ⚠️  ${table}: ${dupes} duplicados posibles (${total} total, ${unique_ids} únicos)`);
          } else {
            console.log(`  ✅ ${table}: sin duplicados`);
          }
        }
      } catch (e) {
        console.log(`  ⚠️  ${table}: No se pudo verificar - ${e.message}`);
      }
    }

    // 4. INFORMACIÓN DE TAMAÑO REAL
    console.log('\n📈 INFORMACIÓN DE BASE DE DATOS:\n');

    try {
      const pageResult = await client.execute('PRAGMA page_count');
      const pageSizeResult = await client.execute('PRAGMA page_size');

      const pageCount = pageResult.rows[0]?.page_count || 0;
      const pageSize = pageSizeResult.rows[0]?.page_size || 4096;
      const dbSizeBytes = pageCount * pageSize;
      const dbSizeKB = dbSizeBytes / 1024;
      const dbSizeMB = dbSizeKB / 1024;

      console.log(`  Tamaño real: ${dbSizeKB.toFixed(2)}KB (${dbSizeMB.toFixed(2)}MB)`);
      console.log(`  Páginas: ${pageCount}`);
      console.log(`  Tamaño página: ${pageSize} bytes\n`);
    } catch (e) {
      console.log(`  No se puede obtener tamaño: ${e.message}\n`);
    }

    // 5. CONSEJOS
    console.log('💡 RECOMENDACIONES:\n');

    if (tables.includes('grades') || tables.includes('calificativos')) {
      console.log('  ⚠️  Las calificaciones ocupan mucho espacio.');
      console.log('     Considera archivar registros > 1 año\n');
    }

    if (tables.includes('attendance') || tables.includes('asistencia')) {
      console.log('  ⚠️  Los registros de asistencia se acumulan.');
      console.log('     Considera limpiar registros > 6 meses\n');
    }

    console.log('✨ Diagnóstico completado\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
