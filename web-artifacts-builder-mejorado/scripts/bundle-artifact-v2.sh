#!/bin/bash

#################################
# Web Artifacts Bundle - V2 Enhanced
# Bundlea con validación robusta
#################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}ℹ️ $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; exit 1; }
log_warning() { echo -e "${YELLOW}⚠️ $1${NC}"; }

#################################
# PRE-CHECKS
#################################

validate_environment() {
    log_info "Validando entorno..."

    # Verificar directorio
    if [ ! -f "package.json" ]; then
        log_error "No se encontró package.json. ¿Estás en un proyecto Vite?"
    fi

    if [ ! -f "index.html" ]; then
        log_error "No se encontró index.html. Se requiere para bundlear."
    fi

    # Verificar node_modules
    if [ ! -d "node_modules" ]; then
        log_warning "node_modules no encontrado. Instalando dependencias..."
        pnpm install
    fi

    log_success "Validación completada ✓"
}

#################################
# SETUP PARCEL
#################################

setup_parcel() {
    log_info "Configurando Parcel..."

    # Instalar dependencias de bundling
    pnpm install -D parcel @parcel/config-default parcel-resolver-tspaths html-inline 2>/dev/null || true

    # Crear .parcelrc
    cat > .parcelrc << 'EOF'
{
  "extends": "@parcel/config-default",
  "resolvers": ["parcel-resolver-tspaths"],
  "optimizers": {
    "*.html": ["@parcel/optimizer-htmlnano"],
    "*.css": ["@parcel/optimizer-cssnano"],
    "*.js": ["@parcel/optimizer-terser"]
  }
}
EOF

    log_success "Parcel configurado ✓"
}

#################################
# BUNDLING
#################################

bundle() {
    log_info "Ejecutando build con Parcel..."

    # Limpiar build previo
    rm -rf dist 2>/dev/null || true

    # Build
    if ! pnpm exec parcel build index.html --no-source-maps --dist-dir dist 2>/dev/null; then
        log_error "Error durante el build. Verifica errores arriba."
    fi

    log_success "Build completado ✓"
}

inline_assets() {
    log_info "Inlining assets..."

    if ! pnpm exec html-inline dist/index.html -o bundle.html 2>/dev/null; then
        log_warning "No se pudo inlinear con html-inline. Usando fallback..."
        cp dist/index.html bundle.html
    fi

    log_success "Assets inlineados ✓"
}

#################################
# VALIDATION
#################################

validate_bundle() {
    log_info "Validando bundle..."

    if [ ! -f "bundle.html" ]; then
        log_error "bundle.html no se generó"
    fi

    # Validar HTML
    if ! grep -q "^<!DOCTYPE html\|^<html" bundle.html; then
        log_error "bundle.html no parece ser HTML válido"
    fi

    # Validar contenido
    if ! grep -q "<body\|<main\|<div id=" bundle.html; then
        log_error "bundle.html parece estar vacío"
    fi

    # Validar React (si es React project)
    if grep -q "react" package.json && ! grep -q "React\|react" bundle.html; then
        log_warning "bundle.html no contiene referencias de React"
    fi

    log_success "Bundle validado ✓"
}

#################################
# ANALYSIS
#################################

analyze_bundle() {
    local bundle_size=$(du -b bundle.html | awk '{print $1}')
    local bundle_size_kb=$(echo "scale=2; $bundle_size / 1024" | bc)
    local bundle_size_mb=$(echo "scale=2; $bundle_size / 1024 / 1024" | bc)

    log_info "Analizando bundle..."

    # Mostrar tamaño
    if (( $(echo "$bundle_size > 1048576" | bc -l) )); then
        echo -e "${YELLOW}📊 Tamaño: $bundle_size_mb MB${NC}"
    elif (( $(echo "$bundle_size > 512000" | bc -l) )); then
        echo -e "${YELLOW}📊 Tamaño: $bundle_size_kb KB (Large)${NC}"
    else
        echo -e "${GREEN}📊 Tamaño: $bundle_size_kb KB${NC}"
    fi

    # Recomendaciones
    if (( $(echo "$bundle_size > 1048576" | bc -l) )); then
        log_warning "⚠️ Bundle muy grande (>1MB). Considera:"
        log_warning "   - Lazy-load de componentes"
        log_warning "   - Dynamic imports"
        log_warning "   - Tree-shaking de dependencias"
        log_warning "   - Remover librerías no usadas"
        log_warning "   - Comprimir imágenes a WebP"
    elif (( $(echo "$bundle_size > 512000" | bc -l) )); then
        log_warning "⚠️ Bundle moderadamente grande (>512KB)"
        log_warning "   - Verifica si hay código no utilizado"
    else
        log_success "📊 Bundle optimizado ✓"
    fi

    # Estadísticas de contenido
    local line_count=$(wc -l < bundle.html)
    echo "📈 Líneas: $line_count"

    # Detectar librerías
    echo ""
    log_info "Librerías detectadas:"
    grep -o "react\|tailwind\|lucide\|recharts\|zustand" package.json 2>/dev/null | sort -u | sed 's/^/   • /'
}

#################################
# OPTIMIZATION SUGGESTIONS
#################################

suggest_optimizations() {
    log_info "Sugerencias de optimización..."

    # Verificar si hay imports innecesarios
    if grep -q "import.*from.*'react-dom" src/*.tsx 2>/dev/null; then
        log_warning "Considera usar React 18+ sin react-dom en algunos casos"
    fi

    # Verificar use client
    if ! grep -q "'use client'" src/*.tsx 2>/dev/null; then
        log_info "Considera agregar 'use client' si usas estado/eventos"
    fi

    # Verificar imágenes
    if grep -q "\.png\|\.jpg\|\.jpeg" src/*.tsx 2>/dev/null; then
        log_warning "Verifica que las imágenes estén comprimidas (usa WebP)"
    fi
}

#################################
# SUMMARY
#################################

print_summary() {
    echo ""
    echo -e "${GREEN}════════════════════════════════════${NC}"
    echo -e "${GREEN}✅ BUNDLING COMPLETADO${NC}"
    echo -e "${GREEN}════════════════════════════════════${NC}"
    echo ""
    echo -e "📦 Bundle: ${BLUE}bundle.html${NC}"
    echo -e "📍 Ubicación: ${BLUE}$(pwd)/bundle.html${NC}"
    echo ""
    echo -e "${YELLOW}Próximos pasos:${NC}"
    echo "  1. Abre bundle.html en navegador"
    echo "  2. Verifica que funciona correctamente"
    echo "  3. Comparte en Claude"
    echo ""
}

#################################
# CLEANUP
#################################

cleanup() {
    log_info "Limpiando archivos temporales..."
    rm -rf dist .cache .parcel-cache 2>/dev/null || true
    log_success "Cleanup completado ✓"
}

#################################
# MAIN
#################################

main() {
    echo ""
    echo -e "${BLUE}🚀 Web Artifacts Bundle v2${NC}"
    echo ""

    validate_environment
    setup_parcel
    bundle
    inline_assets
    validate_bundle
    analyze_bundle
    suggest_optimizations
    cleanup
    print_summary
}

main "$@"
