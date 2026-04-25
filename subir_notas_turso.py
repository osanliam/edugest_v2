#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
SUBIR NOTAS A TURSO
Conecta a la BD en Turso y sube las 1040 notas convertidas
"""

import json
import requests
from datetime import datetime

# ────────────────────────────────────────────────────────────────────────────
# CONFIGURACIÓN TURSO
# ────────────────────────────────────────────────────────────────────────────

TURSO_URL = "libsql://edugestv2-osmer.aws-us-west-2.turso.io"
TURSO_TOKEN = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzcxMjk1MTYsImlkIjoiMDE5ZGMwM2EtMGQwMS03YmMwLTg1ZjEtMDIwZDM1ZDcxY2UzIiwicmlkIjoiMzdkNDkyMTUtZmUxZi00YTBkLTg2MzEtYjQzOWVlMjI2OWRjIn0.7HnHfUO9nTkdYQ7NCpiwO8upAPJehHTX_0CVGsMDrXXwCansk2MlhpHOrRjn0EEzYJTrAevxUGLDcgCi_YJSAg"
TURSO_DB = "edugestv2"

# API REST de Turso
TURSO_API = f"https://api.turso.tech/v1/namespaces/{TURSO_DB}/query"

HEADERS = {
    "Authorization": f"Bearer {TURSO_TOKEN}",
    "Content-Type": "application/json"
}

# ────────────────────────────────────────────────────────────────────────────
# FUNCIONES
# ────────────────────────────────────────────────────────────────────────────

def ejecutar_query(sql, parametros=None):
    """Ejecuta una query en Turso"""
    payload = {
        "statements": [
            {
                "sql": sql,
                "args": parametros or []
            }
        ]
    }

    try:
        response = requests.post(TURSO_API, json=payload, headers=HEADERS, timeout=10)
        if response.status_code == 200:
            return response.json()
        else:
            print(f"❌ Error Turso: {response.status_code}")
            print(f"   {response.text}")
            return None
    except Exception as e:
        print(f"❌ Error conectando a Turso: {e}")
        return None

def verificar_estructura():
    """Verifica la estructura de las tablas"""
    print("\n1️⃣  Verificando estructura de Turso...")

    # Ver tabla de calificaciones
    result = ejecutar_query("PRAGMA table_info(calificaciones)")
    if result:
        print("   ✅ Tabla 'calificaciones' existe")
        return True

    # Si no existe, crear
    print("   ⚠️  Tabla no existe. Creando...")
    crear_tabla()
    return True

def crear_tabla():
    """Crea la tabla de calificaciones"""
    sql = """
    CREATE TABLE IF NOT EXISTS calificaciones (
        id TEXT PRIMARY KEY,
        alumnoId TEXT NOT NULL,
        columnaId TEXT NOT NULL,
        marcados TEXT,
        claves TEXT,
        notaNumerica INTEGER,
        calificativo TEXT CHECK(calificativo IN ('C', 'B', 'A', 'AD')),
        esAD BOOLEAN,
        fecha TEXT,
        periodo TEXT,
        alumnoNombre TEXT,
        competencia TEXT,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP
    )
    """
    result = ejecutar_query(sql)
    if result:
        print("   ✅ Tabla creada correctamente")
    else:
        print("   ❌ Error creando tabla")

def limpiar_datos_viejos():
    """Limpia datos viejos que no estén en formato correcto"""
    print("\n2️⃣  Limpiando datos viejos...")

    sql = "DELETE FROM calificaciones WHERE columnaId IS NULL OR columnaId = ''"
    result = ejecutar_query(sql)

    if result:
        print("   ✅ Datos viejos limpios")
    else:
        print("   ⚠️  No había datos para limpiar")

def subir_notas(notas):
    """Sube las notas a Turso"""
    print(f"\n3️⃣  Subiendo {len(notas)} notas a Turso...")

    exitosas = 0
    errores = 0

    for i, nota in enumerate(notas):
        # Generar ID único
        nota_id = f"{nota['alumnoId']}-{nota['columnaId']}-{i}"

        sql = """
        INSERT INTO calificaciones (
            id, alumnoId, columnaId, marcados, claves, notaNumerica,
            calificativo, esAD, fecha, periodo, alumnoNombre, competencia
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """

        parametros = [
            nota_id,
            nota.get('alumnoId', ''),
            nota.get('columnaId', ''),
            json.dumps(nota.get('marcados', [])),
            json.dumps(nota.get('claves', [])),
            nota.get('notaNumerica'),
            nota.get('calificativo', 'C'),
            nota.get('esAD', False),
            nota.get('fecha', datetime.now().isoformat()),
            nota.get('periodo', 'Abril 2026'),
            nota.get('alumnoNombre', ''),
            nota.get('competencia', '')
        ]

        result = ejecutar_query(sql, parametros)

        if result:
            exitosas += 1
        else:
            errores += 1

        # Mostrar progreso cada 100
        if (i + 1) % 100 == 0:
            print(f"   ... {i + 1}/{len(notas)}")

    print(f"   ✅ {exitosas} notas subidas")
    if errores > 0:
        print(f"   ⚠️  {errores} errores")

    return exitosas

def verificar_datos():
    """Verifica que las notas se guardaron"""
    print("\n4️⃣  Verificando datos...")

    sql = "SELECT COUNT(*) as total FROM calificaciones"
    result = ejecutar_query(sql)

    if result and result.get('results'):
        total = result['results'][0].get('rows', [[0]])[0][0] if result['results'][0].get('rows') else 0
        print(f"   ✅ Total de notas en BD: {total}")
        return total
    else:
        print("   ❌ Error verificando datos")
        return 0

# ────────────────────────────────────────────────────────────────────────────
# MAIN
# ────────────────────────────────────────────────────────────────────────────

if __name__ == '__main__':
    print("🔄 SUBIENDO NOTAS A TURSO - Iniciando...\n")
    print(f"📍 Turso DB: {TURSO_DB}")
    print(f"🔗 URL: {TURSO_URL}")

    # 1. Cargar notas convertidas
    print("\n📂 Cargando notas convertidas...")
    try:
        with open('notas_convertidas.json', 'r', encoding='utf-8') as f:
            notas = json.load(f)
        print(f"   ✅ {len(notas)} notas cargadas desde JSON")
    except Exception as e:
        print(f"   ❌ Error: {e}")
        exit(1)

    # 2. Verificar estructura
    verificar_estructura()

    # 3. Limpiar viejos
    limpiar_datos_viejos()

    # 4. Subir notas
    exitosas = subir_notas(notas)

    # 5. Verificar
    total_bd = verificar_datos()

    # Resumen
    print("\n" + "="*60)
    print("✅ PROCESO COMPLETADO")
    print("="*60)
    print(f"📊 Notas subidas: {exitosas}")
    print(f"💾 Total en BD: {total_bd}")
    print("\n⚠️  PRÓXIMO PASO:")
    print("1. Abre tu sistema")
    print("2. Ve a Calificativos")
    print("3. Deberías ver las 1040 notas")
    print("="*60)
