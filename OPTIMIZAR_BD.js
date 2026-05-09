#!/usr/bin/env node

/**
 * OPTIMIZAR BASE DE DATOS - Corre en Node.js
 * node OPTIMIZAR_BD.js
 */

const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

const client = new Client({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD
});

async function optimizar() {
  try {
    await client.connect();
    console.log('✅ Conectado a PostgreSQL\n');

    // 1. ANALIZAR TAMAÑOS
    console.log('📊 ANÁLISIS DE TABLAS:\n');
    const tableSizes = await client.query(`
      SELECT
        schemaname,
        tablename,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
    `);

    tableSizes.rows.forEach(row => {
      console.log(`  ${row.tablename.padEnd(20)} ${row.size}`);
    });

    // 2. CONTAR REGISTROS DUPLICADOS
    console.log('\n🔍 BÚSQUEDA DE DUPLICADOS:\n');

    const duplicates = await client.query(`
      SELECT 'students' as tabla, COUNT(*) - COUNT(DISTINCT id) as duplicados
      FROM students
      UNION ALL
      SELECT 'users', COUNT(*) - COUNT(DISTINCT id) FROM users
      UNION ALL
      SELECT 'grades', COUNT(*) - COUNT(DISTINCT id) FROM grades
    `);

    duplicates.rows.forEach(row => {
      if (row.duplicados > 0) {
        console.log(`  ⚠️  ${row.tabla}: ${row.duplicados} duplicados`);
      } else {
        console.log(`  ✅ ${row.tabla}: Sin duplicados`);
      }
    });

    // 3. MOSTRAR ESTADÍSTICAS
    console.log('\n📈 ESTADÍSTICAS:\n');
    const stats = await client.query(`
      SELECT
        (SELECT COUNT(*) FROM students) as estudiantes,
        (SELECT COUNT(*) FROM users) as usuarios,
        (SELECT COUNT(*) FROM grades) as calificaciones,
        (SELECT COUNT(*) FROM courses) as cursos
    `);

    const data = stats.rows[0];
    console.log(`  Estudiantes: ${data.estudiantes}`);
    console.log(`  Usuarios: ${data.usuarios}`);
    console.log(`  Calificaciones: ${data.calificaciones}`);
    console.log(`  Cursos: ${data.cursos}`);

    // 4. SUGERENCIAS DE OPTIMIZACIÓN
    console.log('\n💡 OPTIMIZACIONES A HACER:\n');

    // Verifica índices
    const missingIndexes = await client.query(`
      SELECT schemaname, tablename, indexname
      FROM pg_indexes
      WHERE schemaname = 'public'
    `);

    if (missingIndexes.rows.length < 5) {
      console.log('  ⚠️  Faltan índices. Sugiero:');
      console.log('     CREATE INDEX idx_students_course ON students(course_id)');
      console.log('     CREATE INDEX idx_grades_student ON grades(student_id)');
      console.log('     CREATE INDEX idx_grades_course ON grades(course_id)');
    }

    // 5. EJECUTAR VACUUM (limpieza)
    console.log('\n🧹 EJECUTANDO VACUUM...\n');
    await client.query('VACUUM ANALYZE');
    console.log('  ✅ VACUUM completado');

    await client.end();
    console.log('\n✨ Optimización terminada');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

optimizar();
