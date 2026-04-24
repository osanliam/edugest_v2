#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Script para actualizar mockAuth.ts con las notas reales migradas
"""

import json
from pathlib import Path

def actualizar_mock_auth():
    print("\n🔄 Actualizando mockAuth.ts con notas reales...\n")

    ruta_base = Path(__file__).parent
    archivo_notas = ruta_base / "sistemita_datos_final.json"
    archivo_mock = ruta_base / "src/utils/mockAuth.ts"

    if not archivo_notas.exists():
        print(f"❌ No se encontró: {archivo_notas}")
        return False

    # Cargar datos
    with open(archivo_notas, 'r', encoding='utf-8') as f:
        datos = json.load(f)

    estudiantes = datos.get('estudiantes', [])[:50]  # Primeros 50 para el mock
    notas = datos.get('notas', [])

    # Mapear notas por estudiante
    notas_por_est = {}
    for nota in notas:
        sid = nota.get('student_id')
        if sid not in notas_por_est:
            notas_por_est[sid] = []
        notas_por_est[sid].append(nota)

    # Generar código TypeScript para los estudiantes
    estudiantes_ts = "const mockStudentsWithGrades = [\n"

    for est in estudiantes:
        est_id = est.get('id', 'unknown')
        est_nombre = est.get('nombre', 'Desconocido').replace('"', '\\"')
        est_email = est.get('email', f'{est_id}@escuela.edu')

        notas_est = notas_por_est.get(est_id, [])

        # Crear objeto de calificaciones
        calificaciones = {}
        for nota in notas_est:
            comp = nota.get('competencia', 'Desconocida')
            instr = nota.get('instrumento', 'Desconocido')
            calif = nota.get('calificacion', 0)

            if comp not in calificaciones:
                calificaciones[comp] = {}
            calificaciones[comp][instr] = calif

        # Generar JSON
        calif_json = json.dumps(calificaciones, ensure_ascii=False)

        estudiantes_ts += f"""  {{
    id: '{est_id}',
    name: '{est_nombre}',
    email: '{est_email}',
    enrollment_number: '{est.get("numero", "EST-000")}',
    grade_level: '3°',
    section: 'A',
    grades: {calif_json}
  }},
"""

    estudiantes_ts += "];\n"

    # Generar función mock
    mock_function = """
export async function mockGetGradesWithCompetencies() {
  await new Promise(resolve => setTimeout(resolve, 200));
  const formattedGrades = mockStudentsWithGrades.map(student => ({
    id: student.id,
    studentId: student.id,
    studentName: student.name,
    subject: 'Comunicación',
    competencies: student.grades,
    period: 'Abril 2026'
  }));

  return {
    success: true,
    data: formattedGrades
  };
}
"""

    # Leer el archivo actual
    with open(archivo_mock, 'r', encoding='utf-8') as f:
        contenido = f.read()

    # Buscar dónde insertar (después de las importaciones)
    import_end = contenido.find('\n\nconst mockUsers')
    if import_end == -1:
        import_end = contenido.find('const mockUsers')

    # Insertar los datos
    if import_end != -1:
        nuevo_contenido = contenido[:import_end] + '\n\n' + estudiantes_ts + '\n' + contenido[import_end:]
    else:
        nuevo_contenido = contenido + '\n\n' + estudiantes_ts

    # Agregar la función de mock si no existe
    if 'mockGetGradesWithCompetencies' not in nuevo_contenido:
        nuevo_contenido = nuevo_contenido.rstrip() + '\n' + mock_function

    # Guardar
    with open(archivo_mock, 'w', encoding='utf-8') as f:
        f.write(nuevo_contenido)

    print(f"✅ mockAuth.ts actualizado correctamente")
    print(f"   - {len(estudiantes)} estudiantes agregados")
    print(f"   - {len(notas)} calificaciones cargadas")
    print(f"\n📝 Ahora en tu aplicación:")
    print(f"   1. Importa mockGetGradesWithCompetencies en api.ts")
    print(f"   2. Úsalo en lugar de mockGetGrades()")
    print(f"   3. Reinicia el servidor")

    return True

if __name__ == '__main__':
    try:
        actualizar_mock_auth()
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
