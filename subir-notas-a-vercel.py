#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Script para subir las 1,166 notas directamente a la BD de Vercel
Mapea automáticamente por nombre de alumno y sube via /api/sync
"""

import json
import requests
from pathlib import Path
import time

# URLs - CAMBIA ESTO SEGÚN DONDE EJECUTES
URLS = {
    'local': 'http://localhost:3000',
    'vercel': 'https://edugestv2.vercel.app',
    'ip': 'http://192.168.100.71:3000'
}

def subir_notas_a_vercel(url_destino='vercel'):
    """
    Sube las notas a la BD
    url_destino: 'local', 'vercel', o 'ip'
    """

    print("\n" + "="*70)
    print("📤 SUBIENDO NOTAS A LA BASE DE DATOS")
    print("="*70)

    ruta_base = Path(__file__).parent
    archivo_datos = ruta_base / "sistemita_datos_final.json"

    if not archivo_datos.exists():
        print(f"❌ No se encontró: {archivo_datos}")
        return False

    # Cargar datos
    print("\n📂 Cargando datos del backup...")
    with open(archivo_datos, 'r', encoding='utf-8') as f:
        datos = json.load(f)

    estudiantes_backup = datos.get('estudiantes', [])
    notas_backup = datos.get('notas', [])

    print(f"   ✓ Estudiantes en backup: {len(estudiantes_backup)}")
    print(f"   ✓ Notas en backup: {len(notas_backup)}")

    # URL de destino
    api_url = URLS.get(url_destino, URLS['vercel'])
    print(f"\n🔗 Destino: {api_url}")

    # Verificar conexión
    print("   Verificando conexión...", end=" ")
    try:
        response = requests.get(f"{api_url}/api/health", timeout=5)
        print("✓")
    except Exception as e:
        print(f"❌\n   Error: {e}")
        print(f"   💡 Asegúrate que el servidor esté disponible")
        return False

    # Crear mapeo de estudiantes por nombre
    print("\n📚 Creando mapeo de estudiantes...")
    mapeo_estudiantes = {}
    for est in estudiantes_backup:
        nombre = est.get('nombre', '').upper()
        est_id = est.get('id')
        if nombre and est_id:
            mapeo_estudiantes[nombre] = {
                'id': est_id,
                'nombre': est.get('nombre'),
                'grado': est.get('grado', 'Desconocido'),
                'seccion': est.get('seccion', 'General')
            }

    print(f"   ✓ {len(mapeo_estudiantes)} estudiantes mapeados")

    # Transformar notas al formato que espera la BD
    print("\n🔄 Transformando notas...")
    calificaciones = []
    no_encontrados = set()
    mapeo_competencias = {
        'Lee textos diversos': 'comp-lee',
        'Produce textos escritos': 'comp-escribe',
        'Interactúa oralmente': 'comp-oral'
    }

    for nota in notas_backup:
        student_name = nota.get('student_name', '').upper()
        competencia = nota.get('competencia', '')
        instrumento = nota.get('instrumento', '')
        calificacion = nota.get('calificacion')

        # Buscar alumno
        est_info = mapeo_estudiantes.get(student_name)
        if not est_info:
            no_encontrados.add(student_name)
            continue

        # Convertir calificación a número
        nota_numerica = None
        if isinstance(calificacion, (int, float)):
            nota_numerica = float(calificacion)
        elif isinstance(calificacion, str):
            try:
                nota_numerica = float(calificacion)
            except:
                nota_numerica = 0

        # Crear estructura de calificación
        cal = {
            'id': f"cal-{est_info['id']}-{instrumento}-{len(calificaciones)}",
            'alumnoId': est_info['id'],
            'columnaId': instrumento,  # Usar instrumento como columnaId
            'marcados': [],
            'claves': [],
            'notaNumerica': nota_numerica,
            'calificativo': '',
            'esAD': False,
            'fecha': '2026-04-24',
            'competencia': competencia,
            'instrumento': instrumento,
            'valor_original': calificacion
        }

        # Agregar calificativo según nota
        if nota_numerica and nota_numerica >= 0:
            if nota_numerica >= 18:
                cal['calificativo'] = 'AD'
                cal['esAD'] = True
            elif nota_numerica >= 15:
                cal['calificativo'] = 'A'
            elif nota_numerica >= 11:
                cal['calificativo'] = 'B'
            elif nota_numerica >= 0:
                cal['calificativo'] = 'C'

        calificaciones.append(cal)

    print(f"   ✓ {len(calificaciones)} notas transformadas")
    if no_encontrados:
        print(f"   ⚠️  {len(no_encontrados)} estudiantes no encontrados")

    # Subir en lotes
    print(f"\n📤 Subiendo notas a la BD...")
    LOTE_SIZE = 50
    total_subidas = 0
    total_errores = 0

    for i in range(0, len(calificaciones), LOTE_SIZE):
        lote = calificaciones[i:i+LOTE_SIZE]

        try:
            response = requests.post(
                f"{api_url}/api/sync",
                json={"tipo": "calificativos", "datos": lote},
                headers={"Content-Type": "application/json"},
                timeout=30
            )

            if response.ok:
                result = response.json()
                ok = result.get('ok', 0)
                errores = result.get('errores', 0)
                total_subidas += ok
                total_errores += errores

                print(f"   Lote {i//LOTE_SIZE + 1}: ✓ {ok} subidas, {errores} errores")
            else:
                print(f"   Lote {i//LOTE_SIZE + 1}: ❌ {response.status_code}")
                total_errores += len(lote)

        except Exception as e:
            print(f"   Lote {i//LOTE_SIZE + 1}: ❌ {str(e)[:50]}")
            total_errores += len(lote)

        time.sleep(0.5)  # Pequeña pausa entre lotes

    # Resumen
    print("\n" + "="*70)
    print("✅ RESUMEN DE LA CARGA")
    print("="*70)
    print(f"\n📊 Resultados:")
    print(f"   ✓ Notas subidas: {total_subidas}")
    print(f"   ✗ Errores: {total_errores}")
    print(f"   📈 Tasa de éxito: {(total_subidas/(total_subidas+total_errores)*100):.1f}%")

    print(f"\n🎯 Próximos pasos:")
    print(f"   1. Abre: {api_url}")
    print(f"   2. Ve a Calificaciones/Notas")
    print(f"   3. Las 1,166 notas deberían estar allí")
    print(f"   4. Verifica que se vean los datos correctamente")

    if total_subidas > 0:
        print(f"\n✨ ¡{total_subidas} notas subidas exitosamente a tu BD!")
        return True
    else:
        print(f"\n⚠️  No se subió ninguna nota. Verifica la conexión o los datos.")
        return False

if __name__ == '__main__':
    import sys

    # Detectar a dónde subir
    if len(sys.argv) > 1:
        destino = sys.argv[1]  # 'local', 'vercel', o 'ip'
    else:
        print("\n🎯 ¿A dónde quieres subir las notas?")
        print("   1. local    (http://localhost:3000)")
        print("   2. vercel   (https://edugestv2.vercel.app)")
        print("   3. ip       (http://192.168.100.71:3000)")

        opcion = input("\n   Elige (1/2/3) [2]: ").strip() or "2"
        mapeo = {'1': 'local', '2': 'vercel', '3': 'ip'}
        destino = mapeo.get(opcion, 'vercel')

    print(f"\n   📍 Subirá a: {destino}")

    try:
        exito = subir_notas_a_vercel(destino)
        sys.exit(0 if exito else 1)
    except Exception as e:
        print(f"\n❌ Error fatal: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
