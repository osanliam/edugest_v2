# 🐳 SISTEMITA NUEVO - DESPLIEGUE CON DOCKER

**Ubicación:** `/Users/osmer/Downloads/Sistemita/Sistemita_Nuevo`

## Requisitos
- Docker instalado
- Docker Desktop corriendo (en Mac: `open -a Docker`)

## Pasos para desplegar

### 1. Navegar a la carpeta
```bash
cd /Users/osmer/Downloads/Sistemita/Sistemita_Nuevo
```

### 2. Construir y ejecutar con Docker Compose
```bash
docker-compose up --build
```

### 3. Esperar a que compile
Deberías ver algo como:
```
✓ 1000+ modules compiled successfully
VITE v6.2.0 ready in XXX ms
local:   http://localhost:5173/
```

### 4. Acceder al sistema

**Opción A - Interfaz de desarrollo (Recomendado):**
```
http://localhost:5173/
```

**Opción B - Puerto alternativo:**
```
http://localhost:3000/
```

**Opción C - Acceso directo a instrumentos:**
```
http://localhost:5173/instrumentos/registro_calificaciones_v2.html
```

## Datos disponibles

✅ **1249 Estudiantes**
✅ **12 Maestros**  
✅ **6997 Notas**

Los datos están en `localStorage` y se cargaron del backup del 19 de abril.

## Para detener el servidor

```bash
Ctrl + C
```

O en otra terminal:
```bash
docker-compose down
```

## Solucionar problemas

### Puerto 3000 o 5173 ya en uso
```bash
# Cambiar puerto en docker-compose.yml
# Línea: - "3000:3000" → - "8000:3000"
```

### Docker daemon no está corriendo (Mac)
```bash
open -a Docker
```

### Limpiar y reconstruir
```bash
docker-compose down
docker system prune -a
docker-compose up --build
```

## Estructura del proyecto

```
Sistemita_Nuevo/
├── backend/              (API Express)
├── src/                  (Código React)
├── instrumentos/         (8 módulos pedagógicos)
├── package.json         (Dependencias)
├── Dockerfile           (Configuración Docker)
├── docker-compose.yml   (Orquestación)
└── vite.config.ts      (Configuración Vite)
```

---

**IMPORTANTE:** Asegúrate de estar en la carpeta correcta: `/Users/osmer/Downloads/Sistemita/Sistemita_Nuevo`
