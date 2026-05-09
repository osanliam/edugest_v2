#!/bin/bash

#################################
# Web Artifacts Builder - V2 Enhanced
# Automatiza: init → develop → bundle → visualiza
#################################

set -e

# Color codes para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funciones de utilidad
log_info() { echo -e "${BLUE}ℹ️ $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; exit 1; }
log_warning() { echo -e "${YELLOW}⚠️ $1${NC}"; }

#################################
# PASO 0: VALIDACIONES PREVIAS
#################################

validate_environment() {
    log_info "Validando entorno..."

    # Verificar Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js no está instalado. Visita: https://nodejs.org"
    fi

    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        log_error "Node.js 18+ requerido. Tienes: $(node -v)"
    fi
    log_success "Node.js $(node -v) ✓"

    # Verificar pnpm
    if ! command -v pnpm &> /dev/null; then
        log_warning "pnpm no encontrado. Instalando..."
        npm install -g pnpm
    fi
    log_success "pnpm $(pnpm -v) ✓"

    # Verificar componentes tarball
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    if [ ! -f "$SCRIPT_DIR/shadcn-components.tar.gz" ]; then
        log_error "shadcn-components.tar.gz no encontrado en $SCRIPT_DIR"
    fi
    log_success "shadcn-components.tar.gz encontrado ✓"
}

#################################
# PASO 1: INICIALIZAR PROYECTO
#################################

init_project() {
    local project_name="$1"
    local template="$2"

    log_info "Creando proyecto: $project_name (template: $template)"

    # Detectar Node version para Vite
    local node_version=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    local vite_version="latest"
    if [ "$node_version" -lt 20 ]; then
        vite_version="5.4.11"
    fi

    # Crear proyecto Vite
    pnpm create vite "$project_name" --template react-ts
    cd "$project_name"

    log_info "Limpiando template de Vite..."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' '/<link rel="icon".*vite\.svg/d' index.html
        sed -i '' 's/<title>.*<\/title>/<title>'"$project_name"'<\/title>/' index.html
    else
        sed -i '/<link rel="icon".*vite\.svg/d' index.html
        sed -i 's/<title>.*<\/title>/<title>'"$project_name"'<\/title>/' index.html
    fi

    log_info "Instalando dependencias base..."
    pnpm install

    if [ "$node_version" -lt 20 ]; then
        pnpm add -D vite@$vite_version
    fi

    log_info "Instalando Tailwind CSS..."
    pnpm install -D tailwindcss@3.4.1 postcss autoprefixer @types/node tailwindcss-animate
    pnpm install class-variance-authority clsx tailwind-merge lucide-react next-themes

    log_success "Proyecto inicializado ✓"
}

#################################
# PASO 2: COPIAR TEMPLATE
#################################

apply_template() {
    local template="$1"
    local templates_path="../../../templates"

    if [ ! -d "$templates_path/$template" ]; then
        log_warning "Template '$template' no encontrado. Usando estructura base."
        return
    fi

    log_info "Aplicando template: $template"
    cp -r "$templates_path/$template"/* src/ 2>/dev/null || true
    log_success "Template aplicado ✓"
}

#################################
# PASO 3: BUNDLING MEJORADO
#################################

bundle_artifact() {
    log_info "Bundleando artifact..."

    # Instalar dependencias de bundling
    pnpm install -D parcel @parcel/config-default parcel-resolver-tspaths html-inline

    # Crear .parcelrc
    cat > .parcelrc << 'EOF'
{
  "extends": "@parcel/config-default",
  "resolvers": ["parcel-resolver-tspaths"]
}
EOF

    # Build con Parcel
    pnpm exec parcel build index.html --no-source-maps --dist-dir dist

    # Inline assets
    pnpm exec html-inline dist/index.html -o bundle.html

    # Estadísticas
    local bundle_size=$(du -h bundle.html | cut -f1)
    log_success "Bundle creado: $bundle_size"

    # Mostrar recomendaciones si es muy grande
    local size_kb=$(du -b bundle.html | awk '{print $1/1024}')
    if (( $(echo "$size_kb > 1000" | bc -l) )); then
        log_warning "Bundle muy grande (${size_kb%.*}KB). Considera:"
        log_warning "  - Usar código splitting"
        log_warning "  - Lazy loading de componentes"
        log_warning "  - Tree-shaking de dependencias"
    fi
}

#################################
# PASO 4: VALIDACIÓN DE BUNDLE
#################################

validate_bundle() {
    log_info "Validando bundle..."

    if [ ! -f "bundle.html" ]; then
        log_error "bundle.html no generado correctamente"
    fi

    # Verificar que es HTML válido
    if ! grep -q "<html" bundle.html; then
        log_error "bundle.html no parece ser HTML válido"
    fi

    # Verificar que contiene React
    if ! grep -q "React" bundle.html; then
        log_warning "bundle.html no contiene referencias a React"
    fi

    log_success "Bundle validado ✓"
}

#################################
# PASO 5: RESUMEN FINAL
#################################

print_summary() {
    local project_name="$1"

    echo ""
    echo -e "${GREEN}════════════════════════════════════${NC}"
    echo -e "${GREEN}✅ ARTIFACT COMPLETADO${NC}"
    echo -e "${GREEN}════════════════════════════════════${NC}"
    echo ""
    echo -e "📦 Proyecto: ${BLUE}$project_name${NC}"
    echo -e "📁 Ubicación: ${BLUE}$(pwd)/bundle.html${NC}"
    echo -e "📊 Tamaño: ${BLUE}$(du -h bundle.html | cut -f1)${NC}"
    echo ""
    echo -e "${YELLOW}Próximos pasos:${NC}"
    echo "  1. Visualizar: Abre bundle.html en navegador"
    echo "  2. Editar: Modifica src/ y ejecuta: npm run dev"
    echo "  3. Re-bundlear: bash $(dirname $0)/bundle-artifact.sh"
    echo ""
    echo -e "${BLUE}Ubicación del proyecto: $(pwd)${NC}"
    echo ""
}

#################################
# MAIN EXECUTION
#################################

main() {
    if [ $# -lt 1 ]; then
        echo "Uso: $0 <project-name> [template]"
        echo ""
        echo "Templates disponibles:"
        echo "  - dashboard  : Dashboard con KPIs"
        echo "  - form       : Formulario interactivo"
        echo "  - data-table : Tabla de datos con filtros"
        echo ""
        echo "Ejemplo:"
        echo "  $0 mi-app dashboard"
        exit 1
    fi

    local project_name="$1"
    local template="${2:-dashboard}"

    validate_environment
    init_project "$project_name" "$template"
    apply_template "$template"
    bundle_artifact
    validate_bundle
    print_summary "$project_name"
}

main "$@"
