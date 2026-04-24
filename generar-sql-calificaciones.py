#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Script para generar SQL INSERT statements
Puedes ejecutar estos SQL directamente en tu BD de Turso
"""

import json
from pathlib import Path
import uuid

def generar_sql():
    print("\n" + "="*70)
    print("📝 GENERANDO SQL PARA INSERTAR CALIFICACIONES")
    print("="*70)

    ruta_base = Path(__file__).parent
    archivo_datos = ruta_base / "sistemita_datos_final.json"

    if not archivo_datos.exists():
        print(f"❌ No se encontró: {archivo_datos}")
        return False

    # Cargar datos
    print("\n📂 Cargando datos...")
    with open(archivo_datos, 'r', encoding='utf-8') as f:
        datos = json.load(f)

    estudiantes_backup = datos.get('estudiantes', [])
    notas_backup = datos.get('notas', [])

    print(f"   ✓ Estudiantes: {len(estudiantes_backup)}")
    print(f"   ✓ Notas: {len(notas_backup)}")

    # Crear mapeo
    mapeo_estudiantes = {}
    for est in estudiantes_backup:
        nombre = est.get('nombre', '').upper()
        est_id = est.get('id')
        if nombre and est_id:
            mapeo_estudiantes[nombre] = est_id

    # Generar SQL
    print("\n🔄 Generando SQL...")
    sql_statements = []

    for nota in notas_backup:
        student_name = nota.get('student_name', '').upper()
        est_id = mapeo_estudiantes.get(student_name)

        if not est_id:
            continue

        cal_id = f"cal-{uuid.uuid4()}"
        instrumento = nota.get('instrumento', '')
        calificacion = nota.get('calificacion')

        # Convertir a número
        nota_numerica = None
        if isinstance(calificacion, (int, float)):
            nota_numerica = float(calificacion)
        elif isinstance(calificacion, str):
            try:
                nota_numerica = float(calificacion)
            except:
                nota_numerica = 0

        # Generar calificativo
        calificativo = ''
        esAD = 0
        if nota_numerica and nota_numerica >= 18:
            calificativo = 'AD'
            esAD = 1
        elif nota_numerica and nota_numerica >= 15:
            calificativo = 'A'
        elif nota_numerica and nota_numerica >= 11:
            calificativo = 'B'
        elif nota_numerica and nota_numerica >= 0:
            calificativo = 'C'

        # SQL statement
        sql = f"""INSERT OR REPLACE INTO calificaciones (id, alumnoId, columnaId, marcados, claves, notaNumerica, calificativo, esAD, fecha)
VALUES ('{cal_id}', '{est_id}', '{instrumento}', '[]', '[]', {nota_numerica}, '{calificativo}', {esAD}, '2026-04-24');"""

        sql_statements.append(sql)

    print(f"   ✓ {len(sql_statements)} statements generados")

    # Guardar SQL
    output_file = ruta_base / "calificaciones.sql"
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write("-- Calificaciones importadas del backup\n")
        f.write("-- Fecha: 2026-04-24\n")
        f.write(f"-- Total: {len(sql_statements)} registros\n\n")
        for sql in sql_statements:
            f.write(sql + "\n")

    print(f"\n💾 Archivo SQL guardado: {output_file.name}")
    print(f"   Tamaño: {output_file.stat().st_size / 1024:.1f} KB")

    # Mostrar instrucciones
    print("\n" + "="*70)
    print("📋 INSTRUCCIONES PARA USAR")
    print("="*70)
    print("""
OPCIÓN 1 - Ejecutar en Turso Studio:
  1. Abre: https://studio.turso.io/
  2. Selecciona tu BD
  3. Ve a Shell/Query
  4. Copia TODO el contenido de: calificaciones.sql
  5. Pega y ejecuta

OPCIÓN 2 - Usar tu app local:
  1. Asegúrate que el servidor esté corriendo: npm run dev
  2. En terminal, ejecuta:
     sqlite3 tu_base_datos.db < calificaciones.sql

OPCIÓN 3 - Script automático (próximo paso):
  - Contacta a tu equipo de DevOps para ejecutar el SQL
""")

    return True

if __name__ == '__main__':
    try:
        generar_sql()
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
