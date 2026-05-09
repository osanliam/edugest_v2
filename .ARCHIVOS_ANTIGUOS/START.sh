#!/bin/bash

# Script para iniciar Sistemita Nuevo

cd "$(dirname "$0")"

echo "🚀 Iniciando Sistemita Nuevo..."
echo ""
echo "Opción 1: Python (Recomendado - Sin dependencias)"
echo "python3 -m http.server 3000"
echo ""
echo "Opción 2: Node.js"
echo "node servidor.js"
echo ""
echo "Luego accede a:"
echo "http://localhost:3000/"
echo ""

# Detectar qué está disponible
if command -v python3 &> /dev/null; then
    echo "✅ Python3 detectado. Iniciando..."
    python3 -m http.server 3000
elif command -v node &> /dev/null; then
    echo "✅ Node.js detectado. Iniciando..."
    node servidor.js
else
    echo "❌ No se encontró Python3 ni Node.js"
    exit 1
fi
