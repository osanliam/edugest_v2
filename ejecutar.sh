#!/bin/bash

# Script de ejecución para Sistemita_Nuevo
# Uso: bash ejecutar.sh

echo "======================================"
echo "Sistemita_Nuevo - Script de Ejecución"
echo "======================================"
echo ""

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
  echo "❌ Error: package.json no encontrado"
  echo "Ejecuta este script desde: /Users/osmer/Downloads/Sistemita_Nuevo"
  exit 1
fi

# Limpiar cache si es necesario
if [ "$1" == "--limpiar" ] || [ "$1" == "-c" ]; then
  echo "🧹 Limpiando cache..."
  rm -rf node_modules/.vite 2>/dev/null || true
  rm -rf .vite 2>/dev/null || true
  echo "✅ Cache limpiado"
fi

# Reinstalar si se especifica --reinstalar
if [ "$1" == "--reinstalar" ] || [ "$1" == "-r" ]; then
  echo "📦 Reinstalando dependencias..."
  rm -rf node_modules package-lock.json
  npm install
fi

# Verificar si node_modules existe
if [ ! -d "node_modules" ]; then
  echo "📦 Instalando dependencias..."
  npm install
fi

echo ""
echo "🚀 Iniciando servidor de desarrollo..."
echo "   URL: http://localhost:3001/"
echo ""
echo "Presiona Ctrl+C para detener el servidor"
echo ""

npm run dev
