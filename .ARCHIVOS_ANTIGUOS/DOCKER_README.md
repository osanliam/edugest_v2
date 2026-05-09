# Sistemita Nuevo - Con Docker

## Requisitos
- Docker instalado
- Docker Compose instalado

## Para ejecutar

### Opción 1: Con Docker Compose (Recomendado)
```bash
cd /Users/osmer/Downloads/Sistemita/Sistemita_Nuevo
docker-compose up
```

Luego accede a:
```
http://localhost:3000/
```

### Opción 2: Con Docker manual
```bash
cd /Users/osmer/Downloads/Sistemita/Sistemita_Nuevo

# Construir imagen
docker build -t sistemita_nuevo .

# Ejecutar contenedor
docker run -p 3000:3000 -v $(pwd):/app sistemita_nuevo
```

### Opción 3: Con Python (sin Docker)
```bash
cd /Users/osmer/Downloads/Sistemita/Sistemita_Nuevo
python3 -m http.server 3000
```

Luego accede a:
```
http://localhost:3000/instrumentos/registro_calificaciones_v2.html
```

## Datos cargados
✅ 1249 Estudiantes
✅ 12 Maestros
✅ 6997 Notas

## Para detener
```
docker-compose down
```

O presionar Ctrl+C si ejecutas con Python.
