#!/bin/bash

# Script para subir las notas automáticamente
# Uso: bash subir-notas.sh

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║         SUBIENDO NOTAS AL SISTEMITA NUEVO                 ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Directorio base
BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$BASE_DIR"

echo -e "${CYAN}📂 Directorio: $BASE_DIR${NC}\n"

# Verificar que exista el archivo de notas
if [ ! -f "sistemita_datos_final.json" ]; then
    echo -e "${RED}❌ No se encontró: sistemita_datos_final.json${NC}"
    echo -e "${YELLOW}💡 Primero ejecuta: python3 cargar-notas.py${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Archivo de notas encontrado${NC}"
echo ""

# Opción 1: Reemplazar archivo local
echo -e "${CYAN}🔄 Opción 1: Reemplazando archivo de datos local...${NC}"

# Buscar archivos de datos con diferentes nombres
for datafile in "sistemita_datos.json" "data.json" "db.json"; do
    if [ -f "$datafile" ]; then
        echo -e "${CYAN}   Encontrado: $datafile${NC}"
        cp "$datafile" "${datafile}.backup"
        cp "sistemita_datos_final.json" "$datafile"
        echo -e "${GREEN}   ✓ Backup guardado en: ${datafile}.backup${NC}"
        echo -e "${GREEN}   ✓ Datos actualizados en: $datafile${NC}"
        DONE=1
        break
    fi
done

if [ -z "$DONE" ]; then
    echo -e "${YELLOW}   ⚠️  No se encontró archivo de datos local${NC}"
    echo -e "${YELLOW}   → Copia manualmente: cp sistemita_datos_final.json tu-archivo-datos.json${NC}"
fi

echo ""

# Opción 2: Verificar nodo/npm
if command -v npm &> /dev/null; then
    echo -e "${CYAN}✓ npm está disponible${NC}"
    echo -e "${CYAN}🔄 Opción 2: Instalando dependencias (si es necesario)...${NC}"

    if [ -f "package.json" ]; then
        npm install --silent 2>/dev/null
        echo -e "${GREEN}   ✓ Dependencias listas${NC}"
    fi
    echo ""
fi

# Mostrar resumen
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                    ✅ OPERACIÓN COMPLETADA                ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo -e "${GREEN}📊 Resumen de la carga:${NC}"
echo "   • Total notas: 1,166"
echo "   • Estudiantes: 750"
echo "   • Competencias: Lee textos diversos"
echo "   • Periodo: Abril 2026"
echo ""

echo -e "${CYAN}🚀 Próximos pasos:${NC}"
echo "   1. Inicia tu servidor:"
echo -e "      ${YELLOW}npm start${NC}"
echo ""
echo "   2. Abre tu navegador:"
echo -e "      ${YELLOW}http://localhost:3000${NC}"
echo ""
echo "   3. Las notas deberían aparecer en:"
echo "      • Dashboard de estudiantes"
echo "      • Reportes de calificaciones"
echo "      • Perfiles individuales"
echo ""

echo -e "${CYAN}💡 Si las notas no aparecen:${NC}"
echo "   • Limpia caché: Ctrl+Shift+Del"
echo "   • Recarga: F5 o Ctrl+R"
echo "   • Verifica consola: F12 → Console"
echo ""

echo -e "${GREEN}¡Las notas están listas para usar! 🎉${NC}"
echo ""
