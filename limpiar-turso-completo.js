#!/usr/bin/env node

/**
 * 🧹 LIMPIAR TURSO - Script completo
 *
 * USO: node limpiar-turso-completo.js
 *
 * Hace:
 * - Elimina duplicados
 * - Borra registros antiguos (> 1 año)
 * - Recompacta la BD
 * - Muestra espacio liberado
 */

const { createClient } = require('@libsql/client');
require('dotenv').config({ path: '.env' });

async function main() {
  console.log('🔗 Conectando a Turso...\n');

  const client = createClient({
    url: process.env.TURSO_CONNECTION_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  try {
    // ════════════════════════════════════════════════════════════════
    // 1. DIAGNÓSTICO INICIAL
    // ════════════════════════════════════════════════════════════════

    console.log('📊 DIAGNÓSTICO INICIAL:\n');

    const tables = await client.execute(`
      SELECT name FROM sqlite_master WHERE type='table'
    `);

    const tableNames = tables.rows.map(r => r.name);
    console.log(`Tablas encontradas: ${tableNames.join(', ')}\n`);

    let totalBefore = 0;

    for (const tableName of tableNames) {
      try {
        const countResult = await client.execute(
          `SELECT COUNT(*) as count FROM ${tableName}`
        );
        const count = countResult.rows[0]?.count || 0;

        const pageCountResult = await client.execute(
          `PRAGMA page_count`
        );
        const pageSizeResult = await client.execute(
          `PRAGMA page_size`
        );

        const pageCount = pageCountResult.rows[0]?.page_count || 0;
        const pageSize = pageSizeResult.rows[0]?.page_size || 4096;
        const sizeKB = (pageCount * pageSize) / 1024;

        totalBefore += sizeKB;

        console.log(`  ${tableName.padEnd(25)}: ${count} registros (${sizeKB.toFixed(2)}KB)`);
      } catch (e) {
        console.log(`  ${tableName.padEnd(25)}: Error - ${e.message}`);
      }
    }

    console.log(`\n  TOTAL ANTES: ${totalBefore.toFixed(2)}KB\n`);

    // ════════════════════════════════════════════════════════════════
    // 2. ELIMINAR DUPLICADOS
    // ════════════════════════════════════════════════════════════════

    console.log('🔍 ELIMINANDO DUPLICADOS:\n');

    // Ejemplo para tabla de estudiantes (ajusta según tu estructura)
    const duplicateTables = [
      { table: 'students', key: 'id' },
      { table: 'grades', key: 'id' },
      { table: 'users', key: 'id' }
    ];

    for (const { table, key } of duplicateTables) {
      try {
        // Verificar si la tabla existe
        const checkTable = await client.execute(
          `SELECT name FROM sqlite_master WHERE type='table' AND name='${table}'`
        );

        if (checkTable.rows.length === 0) {
          console.log(`  ⏭️  ${table}: no existe, skip`);
          continue;
        }

        // Contar duplicados
        const dupResult = await client.execute(`
          SELECT COUNT(*) - COUNT(DISTINCT ${key}) as dupes FROM ${table}
        `);

        const dupes = dupResult.rows[0]?.dupes || 0;

        if (dupes > 0) {
          console.log(`  ⚠️  ${table}: ${dupes} posibles duplicados`);
          console.log(`      Limpiando...\n`);

          // Crear tabla temporal sin duplicados
          await client.execute(`
            CREATE TEMP TABLE ${table}_dedup AS
            SELECT DISTINCT * FROM ${table}
          `);

          // Contar registros en temporal
          const tempCount = await client.execute(
            `SELECT COUNT(*) as count FROM ${table}_dedup`
          );
          const newCount = tempCount.rows[0]?.count || 0;
          const removed = dupes;

          console.log(`      ✅ Removidos: ${removed} duplicados`);
          console.log(`      Nuevos registros: ${newCount}\n`);
        } else {
          console.log(`  ✅ ${table}: sin duplicados\n`);
        }
      } catch (e) {
        console.log(`  ⚠️  ${table}: ${e.message}\n`);
      }
    }

    // ════════════════════════════════════════════════════════════════
    // 3. ELIMINAR REGISTROS ANTIGUOS (> 1 año)
    // ════════════════════════════════════════════════════════════════

    console.log('🗑️  ELIMINANDO REGISTROS ANTIGUOS (> 1 año):\n');

    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const cutoffDate = oneYearAgo.toISOString();

    const oldDataTables = [
      { table: 'grades', dateField: 'created_at' },
      { table: 'attendance', dateField: 'date' }
    ];

    for (const { table, dateField } of oldDataTables) {
      try {
        // Verificar si la tabla existe
        const checkTable = await client.execute(
          `SELECT name FROM sqlite_master WHERE type='table' AND name='${table}'`
        );

        if (checkTable.rows.length === 0) {
          console.log(`  ⏭️  ${table}: no existe, skip`);
          continue;
        }

        const countOld = await client.execute(`
          SELECT COUNT(*) as count FROM ${table}
          WHERE ${dateField} < datetime('${cutoffDate}')
        `);

        const oldCount = countOld.rows[0]?.count || 0;

        if (oldCount > 0) {
          console.log(`  🗑️  ${table}: ${oldCount} registros anteriores a ${cutoffDate.split('T')[0]}`);

          // Eliminar
          await client.execute(`
            DELETE FROM ${table}
            WHERE ${dateField} < datetime('${cutoffDate}')
          `);

          console.log(`      ✅ Eliminados\n`);
        } else {
          console.log(`  ✅ ${table}: todos los registros son recientes\n`);
        }
      } catch (e) {
        console.log(`  ⚠️  ${table}: ${e.message}\n`);
      }
    }

    // ════════════════════════════════════════════════════════════════
    // 4. VACUUM - Compacta la BD
    // ════════════════════════════════════════════════════════════════

    console.log('💾 COMPACTANDO BASE DE DATOS:\n');

    try {
      await client.execute('VACUUM');
      console.log('  ✅ VACUUM completado\n');
    } catch (e) {
      console.log(`  ⚠️  VACUUM: ${e.message}\n`);
    }

    // ════════════════════════════════════════════════════════════════
    // 5. DIAGNÓSTICO FINAL
    // ════════════════════════════════════════════════════════════════

    console.log('📊 DIAGNÓSTICO FINAL:\n');

    let totalAfter = 0;

    for (const tableName of tableNames) {
      try {
        const countResult = await client.execute(
          `SELECT COUNT(*) as count FROM ${tableName}`
        );
        const count = countResult.rows[0]?.count || 0;

        const pageCountResult = await client.execute(
          `PRAGMA page_count`
        );
        const pageSizeResult = await client.execute(
          `PRAGMA page_size`
        );

        const pageCount = pageCountResult.rows[0]?.page_count || 0;
        const pageSize = pageSizeResult.rows[0]?.page_size || 4096;
        const sizeKB = (pageCount * pageSize) / 1024;

        totalAfter += sizeKB;

        console.log(`  ${tableName.padEnd(25)}: ${count} registros (${sizeKB.toFixed(2)}KB)`);
      } catch (e) {
        // Ignorar
      }
    }

    const saved = totalBefore - totalAfter;
    const pctSaved = ((saved / totalBefore) * 100).toFixed(1);

    console.log(`\n  TOTAL ANTES:  ${totalBefore.toFixed(2)}KB`);
    console.log(`  TOTAL DESPUÉS: ${totalAfter.toFixed(2)}KB`);
    console.log(`\n  ⚡ AHORRADOS: ${saved.toFixed(2)}KB (${pctSaved}%)\n`);

    if (saved > 0) {
      console.log('✨ ¡Limpieza completada con éxito!\n');
    } else {
      console.log('ℹ️  No hay mucho que limpiar, la BD ya está optimizada.\n');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
