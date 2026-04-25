#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
REMAPEO DE NOTAS CON COLUMNAIDS CORRECTOS
Mapea las notas a las columnas reales del sistema nuevo
"""

import json

# Mapeo de competencias a columnasIds según cantidad de respuestas
MAPEO_COLUMNAS = {
    'Lee textos diversos': {
        'competenciaId': 'comp1',
        'columnaId': 'col-1776863791573',  # Diagnóstica C1
        'respuestasEsperadas': 10
    },
    'Escribe textos diversos': {
        'competenciaId': 'comp2',
        'columnaId': 'col-1776864861592',  # Diagnóstica C2
        'respuestasEsperadas': 2
    },
    'Se comunica oralmente': {
        'competenciaId': 'comp3',
        'columnaIds': {
            3: 'col-1776867041867',      # Cotejo (3 columnas)
            5: 'col-1776867183106'       # Observación (5 criterios)
        }
    }
}

def cargar_json(ruta):
    """Carga notas convertidas"""
    try:
        with open(ruta, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"❌ Error: {e}")
        return None

def remapear_nota(nota):
    """Remapea una nota con los columnaIds correctos"""
    competencia = nota.get('competencia', '')

    # C1: Lee
    if 'Lee' in competencia or 'lee' in competencia.lower():
        nota['competenciaId'] = 'comp1'
        nota['columnaId'] = 'col-1776863791573'
        return nota

    # C2: Escribe
    elif 'Escribe' in competencia or 'escribe' in competencia.lower():
        nota['competenciaId'] = 'comp2'
        nota['columnaId'] = 'col-1776864861592'
        return nota

    # C3: Se comunica
    elif 'comunica' in competencia.lower() or 'oral' in competencia.lower():
        nota['competenciaId'] = 'comp3'

        # Detectar instrumento según cantidad de respuestas/criterios
        respuestas = len(nota.get('claves', []))

        if respuestas == 3:
            nota['columnaId'] = 'col-1776867041867'  # Cotejo
        elif respuestas == 5:
            nota['columnaId'] = 'col-1776867183106'  # Observación
        else:
            nota['columnaId'] = 'col-1776867041867'  # Default a Cotejo

        return nota

    else:
        # Si no matchea, intentar por cantidad de claves
        respuestas = len(nota.get('claves', []))

        if respuestas == 10:
            nota['competenciaId'] = 'comp1'
            nota['columnaId'] = 'col-1776863791573'
        elif respuestas == 2:
            nota['competenciaId'] = 'comp2'
            nota['columnaId'] = 'col-1776864861592'
        elif respuestas in [3, 5]:
            nota['competenciaId'] = 'comp3'
            nota['columnaId'] = 'col-1776867041867' if respuestas == 3 else 'col-1776867183106'

        return nota

def remapear_todas(notas):
    """Remapea todas las notas"""
    remapeadas = 0
    sin_mapeo = []

    for i, nota in enumerate(notas):
        nota_remapeada = remapear_nota(nota)

        if nota_remapeada.get('columnaId'):
            remapeadas += 1
        else:
            sin_mapeo.append(nota)

        notas[i] = nota_remapeada

    return notas, remapeadas, sin_mapeo

# ────────────────────────────────────────────────────────────────────────────
# MAIN
# ────────────────────────────────────────────────────────────────────────────

if __name__ == '__main__':
    print("🔄 REMAPEANDO NOTAS CON COLUMNAIDS CORRECTOS\n")

    # Cargar
    print("1️⃣  Cargando notas...")
    notas = cargar_json('notas_convertidas.json')
    if not notas:
        exit(1)
    print(f"   ✅ {len(notas)} notas cargadas")

    # Remapear
    print("\n2️⃣  Remapeando...")
    notas_remapeadas, exitosas, sin_mapeo = remapear_todas(notas)
    print(f"   ✅ {exitosas} notas remapeadas")
    print(f"   ⚠️  {len(sin_mapeo)} sin mapeo")

    # Guardar
    print("\n3️⃣  Guardando...")
    with open('notas_convertidas_remapeadas.json', 'w', encoding='utf-8') as f:
        json.dump(notas_remapeadas, f, indent=2, ensure_ascii=False)
    print("   ✅ notas_convertidas_remapeadas.json")

    # Resumen
    print("\n" + "="*60)
    print("✅ REMAPEO COMPLETADO")
    print("="*60)

    # Agrupar por competencia
    por_comp = {'comp1': 0, 'comp2': 0, 'comp3': 0}
    por_col = {}

    for nota in notas_remapeadas:
        comp = nota.get('competenciaId')
        col = nota.get('columnaId')

        if comp in por_comp:
            por_comp[comp] += 1

        if col:
            por_col[col] = por_col.get(col, 0) + 1

    print("\n📊 Por Competencia:")
    print(f"   C1 (Lee):           {por_comp['comp1']} notas")
    print(f"   C2 (Escribe):       {por_comp['comp2']} notas")
    print(f"   C3 (Se comunica):   {por_comp['comp3']} notas")

    print("\n📊 Por Columna:")
    for col, cant in sorted(por_col.items()):
        print(f"   {col}: {cant} notas")

    print("\n⚠️  PRÓXIMO PASO:")
    print("1. Copia el contenido de: notas_convertidas_remapeadas.json")
    print("2. Ve a tu sistema → Consola (F12)")
    print("3. Pega:")
    print("""
const notasRemapeadas = [AQUI_PEGA_EL_JSON];
localStorage.setItem('ie_calificativos_v2', JSON.stringify(notasRemapeadas));
window.location.reload();
""")
    print("="*60)
