#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Script para cargar notas migradas del backup antiguo al Sistemita Nuevo
Carga directamente en el archivo JSON de datos
"""

import json
import sys
from pathlib import Path
from datetime import datetime
import uuid

def cargar_notas():
    print("\n🔄 Iniciando carga de notas...\n")

    # Rutas
    ruta_base = Path(__file__).parent
    archivo_notas = ruta_base / "sistemita_datos_con_notas.json"
    archivo_sistema = ruta_base / "sistemita_datos_backup_convertido.json"
    archivo_final = ruta_base / "sistemita_datos_final.json"

    # Validar archivos
    if not archivo_notas.exists():
        print(f"❌ No se encontró: {archivo_notas.name}")
        print("💡 Ejecuta primero el script de migración Python")
        return False

    if not archivo_sistema.exists():
        print(f"❌ No se encontró: {archivo_sistema.name}")
        return False

    print(f"📂 Leyendo archivos...")

    # Cargar datos
    with open(archivo_notas, 'r', encoding='utf-8') as f:
        datos_migracion = json.load(f)

    with open(archivo_sistema, 'r', encoding='utf-8') as f:
        sistema = json.load(f)

    # Crear mapeo de estudiantes por nombre e ID
    mapeo_estudiantes = {}
    for est in sistema.get('estudiantes', []):
        mapeo_estudiantes[est.get('id')] = est
        if 'nombre' in est:
            mapeo_estudiantes[est.get('nombre')] = est

    # Crear estructura de notas para el sistema
    notas_estructuradas = []
    contador = 0
    errores = 0

    print(f"📊 Procesando notas...\n")

    for student_id, student_data in datos_migracion['notas'].items():
        nombre = student_data['nombre']
        competencias = student_data['competencias']

        # Buscar ID correcto del estudiante
        est_info = mapeo_estudiantes.get(student_id)
        if not est_info:
            # Buscar por nombre
            est_info = mapeo_estudiantes.get(nombre)

        if not est_info:
            errores += 1
            print(f"⚠️  No se encontró estudiante: {nombre}")
            continue

        student_id_correcto = est_info.get('id')

        # Procesar competencias
        for competencia, instrumentos in competencias.items():
            for instrumento, score in instrumentos.items():

                # Convertir score si es JSON string
                score_final = score
                if isinstance(score, str) and score.startswith('{'):
                    try:
                        score_final = json.loads(score)
                    except:
                        score_final = score

                nota = {
                    'id': f"note-{uuid.uuid4()}",
                    'student_id': student_id_correcto,
                    'student_name': nombre,
                    'competencia': competencia,
                    'instrumento': instrumento,
                    'calificacion': score_final,
                    'fecha': datetime.now().isoformat(),
                    'periodo': 'Abril 2026'
                }

                notas_estructuradas.append(nota)
                contador += 1

                # Mostrar progreso
                if contador % 50 == 0:
                    print(f"✓ {contador} notas procesadas...")

    # Agregar al sistema
    if 'notas' not in sistema:
        sistema['notas'] = []

    sistema['notas'].extend(notas_estructuradas)
    sistema['timestamp'] = datetime.now().isoformat()

    # Actualizar resumen
    if 'resumen' not in sistema:
        sistema['resumen'] = {}

    sistema['resumen']['totalNotas'] = len(sistema['notas'])
    sistema['resumen']['notasAgregadas'] = contador

    # Guardar archivo final
    with open(archivo_final, 'w', encoding='utf-8') as f:
        json.dump(sistema, f, ensure_ascii=False, indent=2)

    # Resultados
    print(f"\n{'='*50}")
    print(f"✅ Carga completada exitosamente")
    print(f"{'='*50}")
    print(f"📝 Total notas cargadas: {contador}")
    print(f"⚠️  Estudiantes no encontrados: {errores}")
    print(f"💾 Archivo guardado: {archivo_final.name}")
    print(f"📊 Resumen del sistema:")
    print(f"   - Total estudiantes: {sistema['resumen'].get('totalEstudiantes', 'N/A')}")
    print(f"   - Total notas: {sistema['resumen'].get('totalNotas', 'N/A')}")
    print(f"\n✨ Las notas están listas para usar en el sistema")

    return True

if __name__ == '__main__':
    try:
        exito = cargar_notas()
        sys.exit(0 if exito else 1)
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
