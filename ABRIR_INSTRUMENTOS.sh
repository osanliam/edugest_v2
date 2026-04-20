#!/bin/bash

# Script para abrir los instrumentos en tu navegador predeterminado
# Uso: Doble clic en este archivo o ejecuta: bash ABRIR_INSTRUMENTOS.sh

RUTA_ACTUAL="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
RUTA_INSTRUMENTOS="$RUTA_ACTUAL/instrumentos/index.html"

# Convertir a URL válida con file://
if [ -f "$RUTA_INSTRUMENTOS" ]; then
    # Abrir con open (macOS)
    open "file://$RUTA_INSTRUMENTOS"
    echo "✅ Panel de instrumentos abierto en tu navegador"
    echo "Archivo: $RUTA_INSTRUMENTOS"
else
    echo "❌ Error: No se encontró el archivo index.html"
    echo "Buscaba en: $RUTA_INSTRUMENTOS"
fi
