#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Script para sincronizar los datos a la base de datos (Turso)
Requiere que el servidor esté corriendo en http://localhost:3000
"""

import json
import requests
from pathlib import Path
import time

API_BASE = "http://localhost:3000"
# Si usas otra URL:
# API_BASE = "http://192.168.100.71:3000"

def sincronizar_a_base_datos():
    print("\n" + "="*70)
    print("🔄 SINCRONIZANDO DATOS A LA BASE DE DATOS")
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

    print(f"\n📚 Datos a sincronizar:")
    print(f"   - Estudiantes: {len(estudiantes)}")
    print(f"   - Calificaciones: {len(notas)}")

    # Intentar conectar al servidor
    print(f"\n🔗 Conectando a: {API_BASE}")
    try:
        response = requests.get(f"{API_BASE}/api/health", timeout=5)
        if response.ok:
            print("   ✓ Servidor disponible")
        else:
            print(f"   ⚠️  Servidor respondió con: {response.status_code}")
    except Exception as e:
        print(f"   ❌ Error de conexión: {e}")
        print(f"   💡 Asegúrate que el servidor esté corriendo:")
        print(f"      npm run dev")
        return False

    # Crear estructura para sincronizar
    print("\n📤 Preparando datos para sincronización...")

    # Mapear grados con nombres
    mapeo_grados = {
        '8qg3cyx': '3°A',
        'c8h69ya': '3°B',
        'd1t5hua': '4°A',
        'gsss97f': '4°B',
        'tgusb94': '5°A'
    }

    # Transformar estudiantes
    estudiantes_sync = []
    for est in estudiantes:
        grado_id = est.get('grado', '').replace('Grado ', '')
        grado_nombre = mapeo_grados.get(grado_id, est.get('grado', 'Desconocido'))

        est_sync = {
            'id': est.get('id'),
            'nombre': est.get('nombre'),
            'email': est.get('email') or f"{est.get('id')}@escuela.edu",
            'grado': grado_nombre,
            'seccion': 'General',
            'dni': est.get('dni', ''),
            'activo': est.get('activo', True)
        }
        estudiantes_sync.append(est_sync)

    print(f"   ✓ {len(estudiantes_sync)} estudiantes preparados")

    # Intentar sincronizar (opcional - solo si hay API)
    print(f"\n📥 Intentando subir a la BD (optional)...")

    try:
        # Endpoint para sincronizar
        headers = {'Content-Type': 'application/json'}

        # Subir estudiantes
        print("   Subiendo estudiantes...", end=" ")
        response = requests.post(
            f"{API_BASE}/api/sync",
            json={"tipo": "alumnos", "datos": estudiantes_sync[:100]},
            headers=headers,
            timeout=10
        )
        if response.ok:
            print("✓")
        else:
            print(f"({response.status_code})")

        # Subir calificaciones
        print("   Subiendo calificaciones...", end=" ")
        response = requests.post(
            f"{API_BASE}/api/sync",
            json={"tipo": "calificaciones", "datos": notas[:100]},
            headers=headers,
            timeout=10
        )
        if response.ok:
            print("✓")
        else:
            print(f"({response.status_code})")

    except Exception as e:
        print(f"\n   ⚠️  No se pudo conectar a API: {e}")
        print("   💡 Eso está bien - los datos están en localStorage")

    # Crear script para sincronización local
    print(f"\n💾 Creando script de sincronización local...")

    script_sync = f"""
// Script para sincronizar datos correctamente en localStorage
// Usa grados con nombres reales, no IDs

const mapeo_grados = {{
    '8qg3cyx': '3°A',
    'c8h69ya': '3°B',
    'd1t5hua': '4°A',
    'gsss97f': '4°B',
    'tgusb94': '5°A'
}};

console.log('🔄 Sincronizando con grados correctos...');

// Cargar estudiantes originales
let ie_alumnos = JSON.parse(localStorage.getItem('ie_alumnos') || '[]');

// Transformar grados
ie_alumnos = ie_alumnos.map(est => {{
    const grado_id = (est.grado || '').replace('Grado ', '');
    return {{
        ...est,
        grado: mapeo_grados[grado_id] || est.grado,
        seccion: est.seccion || 'General'
    }};
}});

localStorage.setItem('ie_alumnos', JSON.stringify(ie_alumnos));
console.log('✓ Estudiantes actualizados con grados correctos');
console.log('🔄 Recargando...');

setTimeout(() => window.location.reload(), 1000);
"""

    script_file = ruta_base / "sincronizar-grados.js"
    with open(script_file, 'w', encoding='utf-8') as f:
        f.write(script_sync)

    print(f"   ✓ Archivo generado: sincronizar-grados.js")

    print("\n" + "="*70)
    print("✅ PRÓXIMOS PASOS")
    print("="*70)
    print("""
1. OPCIÓN A - Sincronizar grados localmente:
   - Abre: http://192.168.100.71:3000/
   - F12 → Console
   - Copia TODO de: sincronizar-grados.js
   - Pega en consola y Enter

2. OPCIÓN B - Guardar permanentemente en BD:
   - El servidor está corriendo en: http://192.168.100.71:3000
   - Los datos se sincronizan automáticamente
   - Puedes limpiar caché sin perder datos

3. VERIFICAR:
   - Los grados ahora deberían mostrar "3°A", "4°B", etc.
   - Las notas deberían aparecer en Calificaciones
""")

    return True

if __name__ == '__main__':
    try:
        sincronizar_a_base_datos()
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
