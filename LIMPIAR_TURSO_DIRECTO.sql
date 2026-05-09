-- 🧹 LIMPIAR TURSO - Ejecuta esto en Turso Studio
-- https://studio.turso.io
--
-- 1. Login con tu cuenta
-- 2. Abre "edugestv2"
-- 3. Ve a "Shell" (terminal)
-- 4. Copia y pega TODA esta sección SQL

-- ════════════════════════════════════════════════════════════════
-- PASO 1: VER TABLAS Y CONTAR REGISTROS
-- ════════════════════════════════════════════════════════════════

-- Listar todas las tablas
.tables

-- Ver estructura de students
.schema students

-- Ver estructura de grades
.schema grades

-- Contar registros por tabla
SELECT 'students' as tabla, COUNT(*) as registros FROM students
UNION ALL
SELECT 'grades', COUNT(*) FROM grades
UNION ALL
SELECT 'users', COUNT(*) FROM users
UNION ALL
SELECT 'courses', COUNT(*) FROM courses;

-- ════════════════════════════════════════════════════════════════
-- PASO 2: BUSCAR DUPLICADOS
-- ════════════════════════════════════════════════════════════════

-- Duplicados en students (si existen)
SELECT id, COUNT(*) as duplicados
FROM students
GROUP BY id
HAVING COUNT(*) > 1;

-- Duplicados en grades
SELECT id, COUNT(*) as duplicados
FROM grades
GROUP BY id
HAVING COUNT(*) > 1;

-- ════════════════════════════════════════════════════════════════
-- PASO 3: ELIMINAR DUPLICADOS EXACTOS (SI LOS HAY)
-- ════════════════════════════════════════════════════════════════

-- CREAR TABLA TEMPORAL SIN DUPLICADOS
-- (Descomenta solo si hay duplicados detectados)

-- Para students:
-- CREATE TEMPORARY TABLE students_dedup AS
-- SELECT DISTINCT * FROM students;
-- DELETE FROM students;
-- INSERT INTO students SELECT * FROM students_dedup;
-- DROP TABLE students_dedup;

-- Para grades:
-- CREATE TEMPORARY TABLE grades_dedup AS
-- SELECT DISTINCT * FROM grades;
-- DELETE FROM grades;
-- INSERT INTO grades SELECT * FROM grades_dedup;
-- DROP TABLE grades_dedup;

-- ════════════════════════════════════════════════════════════════
-- PASO 4: ELIMINAR REGISTROS ANTIGUOS (> 1 AÑO)
-- ════════════════════════════════════════════════════════════════

-- Ver cuántos registros son > 1 año en grades
SELECT COUNT(*) as registros_antiguos
FROM grades
WHERE created_at < datetime('now', '-1 year');

-- ELIMINAR registros de calificaciones > 1 año
-- (DESCOMENTA SOLO SI QUIERES)
-- DELETE FROM grades
-- WHERE created_at < datetime('now', '-1 year');

-- ════════════════════════════════════════════════════════════════
-- PASO 5: COMPACTAR BASE DE DATOS
-- ════════════════════════════════════════════════════════════════

-- Ejecutar VACUUM (recompacta)
VACUUM;

-- ════════════════════════════════════════════════════════════════
-- PASO 6: VER TAMAÑO FINAL
-- ════════════════════════════════════════════════════════════════

-- Tamaño total de la BD
PRAGMA page_count;
PRAGMA page_size;

-- Calcular en KB (page_count * page_size / 1024)
SELECT (PRAGMA_page_count() * PRAGMA_page_size()) / 1024 as size_kb;

-- Ver uso por tabla (aproximado)
SELECT
  'students' as tabla,
  COUNT(*) as registros,
  (COUNT(*) * 100) / 1024 as size_kb_est
FROM students
UNION ALL
SELECT 'grades', COUNT(*), (COUNT(*) * 100) / 1024
FROM grades
UNION ALL
SELECT 'users', COUNT(*), (COUNT(*) * 100) / 1024
FROM users;
