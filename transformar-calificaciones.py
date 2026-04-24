#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Script para transformar notas del formato antiguo al formato que espera tu app
Las agrupa por alumno y competencia, calculando promedios
"""

import json
from pathlib import Path
from collections import defaultdict
import uuid

def transformar_calificaciones():
    print("\n" + "="*70)
    print("🔄 TRANSFORMANDO CALIFICACIONES AL FORMATO CORRECTO")
    print("="*70)

    ruta_base = Path(__file__).parent
    archivo_datos = ruta_base / "sistemita_datos_final.json"

    if not archivo_datos.exists():
        print(f"❌ No se encontró: {archivo_datos}")
        return False

    # Cargar datos
    with open(archivo_datos, 'r', encoding='utf-8') as f:
        datos = json.load(f)

    estudiantes = datos.get('estudiantes', [])
    notas = datos.get('notas', [])

    print(f"\n📚 Datos cargados:")
    print(f"   - Estudiantes: {len(estudiantes)}")
    print(f"   - Notas: {len(notas)}")

    # Crear mapeo de estudiantes
    mapeo_estudiantes = {est['id']: est for est in estudiantes}

    # Agrupar notas por alumno y competencia
    calificaciones_por_alumno = defaultdict(lambda: defaultdict(list))

    for nota in notas:
        sid = nota.get('student_id')
        comp = nota.get('competencia', 'Desconocida')
        calif = nota.get('calificacion')

        if sid and comp:
            # Convertir calificación a número si es posible
            valor_numerico = None
            if isinstance(calif, (int, float)):
                valor_numerico = float(calif)
            elif isinstance(calif, str):
                try:
                    valor_numerico = float(calif)
                except:
                    # Si no es número, guardar como está (para rúbricas)
                    valor_numerico = calif

            calificaciones_por_alumno[sid][comp].append({
                'instrumento': nota.get('instrumento', 'Desconocido'),
                'valor': valor_numerico,
                'original': calif
            })

    # Transformar a estructura final
    calificaciones_finales = []

    for sid, competencias in calificaciones_por_alumno.items():
        est = mapeo_estudiantes.get(sid)
        if not est:
            continue

        # Calcular promedio general
        todos_valores = []
        competencias_transformadas = {}

        for comp, datos_comp in competencias.items():
            # Calcular promedio de esta competencia
            valores = [d['valor'] for d in datos_comp if isinstance(d['valor'], (int, float))]

            if valores:
                promedio_comp = sum(valores) / len(valores)
                todos_valores.append(promedio_comp)
            else:
                promedio_comp = 0

            # Agrupar por instrumento
            por_instrumento = defaultdict(list)
            for d in datos_comp:
                por_instrumento[d['instrumento']].append(d['original'])

            competencias_transformadas[comp] = {
                'promedio': round(promedio_comp, 2) if valores else 0,
                'instrumentos': dict(por_instrumento),
                'total_registros': len(datos_comp)
            }

        # Promedio general
        promedio_general = sum(todos_valores) / len(todos_valores) if todos_valores else 0

        # Crear calificación final
        calif_final = {
            'id': f'grade-{uuid.uuid4()}',
            'student_id': sid,
            'student_name': est.get('nombre', 'Desconocido'),
            'student_code': est.get('codigo') or est.get('code') or '',
            'grado': est.get('grado', 'Sin asignar'),
            'seccion': est.get('seccion') or est.get('section') or 'General',
            'period': 'Abril 2026',
            'subject': 'Comunicación',
            'average': round(promedio_general, 2),
            'competencies': competencias_transformadas,
            'fecha': '2026-04-24'
        }

        calificaciones_finales.append(calif_final)

    print(f"\n✓ Calificaciones transformadas: {len(calificaciones_finales)}")

    # Guardar archivo final
    output_file = ruta_base / "calificaciones_transformadas.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump({
            'calificaciones': calificaciones_finales,
            'total': len(calificaciones_finales),
            'fecha_transformacion': '2026-04-24',
            'periodo': 'Abril 2026'
        }, f, ensure_ascii=False, indent=2)

    print(f"💾 Archivo guardado: {output_file.name}")

    # Mostrar ejemplo
    print(f"\n📋 EJEMPLO DE CALIFICACIÓN TRANSFORMADA:")
    if calificaciones_finales:
        ejemplo = calificaciones_finales[0]
        print(json.dumps(ejemplo, indent=2, ensure_ascii=False)[:800])

    # Crear script para cargar en localStorage
    script_cargar = f"""
// INSTRUCCIONES:
// 1. Abre DevTools: F12
// 2. Ve a CONSOLE
// 3. Copia y pega TODO este código
// 4. Presiona Enter

const calificacionesData = {json.dumps(calificaciones_finales[:100], ensure_ascii=False)};

// Guardar en localStorage
localStorage.setItem('ie_calificativos_v2', JSON.stringify(calificacionesData));
console.log('✅ Calificaciones cargadas:', calificacionesData.length);
console.log('🔄 Recargando página...');

// Recargac después de 1 segundo
setTimeout(() => window.location.reload(), 1000);
"""

    script_file = ruta_base / "cargar-calificaciones.js"
    with open(script_file, 'w', encoding='utf-8') as f:
        f.write(script_cargar)

    print(f"\n✨ Script generado: cargar-calificaciones.js")
    print(f"\n📍 PRÓXIMO PASO:")
    print(f"   1. Abre: http://192.168.100.71:3001/")
    print(f"   2. F12 → Console")
    print(f"   3. Copia el contenido de: cargar-calificaciones.js")
    print(f"   4. Pégalo en la consola y presiona Enter")
    print(f"   5. Las calificaciones aparecerán 🎉")

    return True

if __name__ == '__main__':
    try:
        transformar_calificaciones()
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
