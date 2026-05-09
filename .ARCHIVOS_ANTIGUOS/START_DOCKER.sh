#!/bin/bash

echo "════════════════════════════════════════════════════════════"
echo "  🚀 SISTEMITA - DOCKER STARTUP"
echo "════════════════════════════════════════════════════════════"
echo ""

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}[1/4]${NC} Verificando Docker..."
if ! command -v docker &> /dev/null; then
    echo -e "${RED}✗ Docker no está instalado${NC}"
    echo "Descarga desde: https://www.docker.com/products/docker-desktop"
    exit 1
fi
docker --version
echo -e "${GREEN}✓ Docker encontrado${NC}"
echo ""

echo -e "${YELLOW}[2/4]${NC} Construyendo imagen Docker..."
docker build -t sistemita:latest .
if [ $? -ne 0 ]; then
    echo -e "${RED}✗ Error construyendo imagen${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Imagen construida${NC}"
echo ""

echo -e "${YELLOW}[3/4]${NC} Iniciando contenedores..."
docker-compose up -d
if [ $? -ne 0 ]; then
    echo -e "${RED}✗ Error iniciando docker-compose${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Contenedores iniciados${NC}"
echo ""

echo -e "${YELLOW}[4/4]${NC} Esperando a que la app esté lista..."
sleep 5

# Verificar que la app está corriendo
if curl -s http://localhost:3000 > /dev/null; then
    echo -e "${GREEN}✓ App está LISTA${NC}"
    echo ""
    echo "════════════════════════════════════════════════════════════"
    echo -e "  ${GREEN}✓ SISTEMITA CORRIENDO${NC}"
    echo "════════════════════════════════════════════════════════════"
    echo ""
    echo -e "  ${GREEN}→ Abre navegador:${NC} http://localhost:3000"
    echo ""
    echo -e "  ${YELLOW}Login:${NC}"
    echo "    Usuario: demo (cualquier cosa)"
    echo "    Password: demo (cualquier cosa)"
    echo ""
    echo -e "  ${YELLOW}Explorar:${NC}"
    echo "    Dashboard → Gráficos"
    echo "    Chat → Habla con IA Gemini"
    echo "    HUD → Panel estudiante"
    echo ""
    echo -e "  ${YELLOW}Para detener:${NC} docker-compose down"
    echo -e "  ${YELLOW}Para ver logs:${NC} docker-compose logs -f"
    echo ""
else
    echo -e "${RED}✗ App no respondió (timeout)${NC}"
    echo "Intenta:"
    echo "  docker-compose logs"
    echo "  docker-compose restart"
    exit 1
fi
