---
name: web-artifacts-builder-v2-enhanced
description: Suite de herramientas para crear artifacts React profesionales sin "AI slop". Incluye automatización completa, 3 templates pre-built, validación robusta y design guidelines.
license: Complete terms in LICENSE.txt
version: 2.0 Enhanced
---

# Web Artifacts Builder V2 - Enhanced Edition

Versión completamente mejorada del skill original con automatización, templates y documentación expandida.

## 🚀 Quick Start (2 minutos)

```bash
bash scripts/create-and-bundle.sh mi-dashboard dashboard
```

¡Tu artifact está en `mi-dashboard/bundle.html`!

---

## 📚 DOCUMENTACIÓN PRINCIPAL

### Para Empezar
- **[README.md](./README.md)** - Visión general (5 min)
- **[SKILL-MEJORADO.md](./SKILL-MEJORADO.md)** - Guía completa (20 min)
- **[INDICE.md](./INDICE.md)** - Navegación de todos los recursos

### Para Diseñar Bien
- **[docs/DESIGN-GUIDELINES.md](./docs/DESIGN-GUIDELINES.md)** - Evita "AI slop"
- **[docs/ADVANCED-EXAMPLES.md](./docs/ADVANCED-EXAMPLES.md)** - Casos complejos

### Para Entender Mejoras
- **[RESUMEN-MEJORAS.md](./RESUMEN-MEJORAS.md)** - Todas las mejoras implementadas

---

## ✨ Stack

- **React 18** + TypeScript
- **Vite** (dev server rápido)
- **Tailwind CSS 3.4.1** (estilos)
- **shadcn/ui** (40+ componentes pre-instalados)
- **Parcel** (bundling a HTML único)
- **Lucide Icons** (iconos minimalistas)

---

## 🎯 Casos de Uso

### Dashboard
```bash
bash scripts/create-and-bundle.sh mi-dashboard dashboard
```
Incluye: KPIs, gráficos, filtros, responsive

### Formulario
```bash
bash scripts/create-and-bundle.sh mi-form form
```
Incluye: Inputs, selects, validación, manejo de envío

### Tabla de Datos
```bash
bash scripts/create-and-bundle.sh mi-tabla data-table
```
Incluye: Búsqueda, filtros, ordenamiento, exportar

---

## 🎨 3 Templates Pre-built

### Dashboard Template
Características:
- ✅ 4 KPI cards
- ✅ Gráfico de línea (Recharts)
- ✅ Gráfico de barras (Recharts)
- ✅ Filtro por período
- ✅ Responsive (móvil/tablet/desktop)

### Form Template
Características:
- ✅ Inputs validados
- ✅ Select personalizado
- ✅ Textarea
- ✅ Checkbox
- ✅ Manejo de envío

### Data-Table Template
Características:
- ✅ Búsqueda en tiempo real
- ✅ Filtros por estado
- ✅ Ordenamiento (clickeable)
- ✅ Botón exportar
- ✅ Resumen de totales

---

## 🔧 Scripts Principales

### `create-and-bundle.sh`
**Lo más importante** - Automatiza TODO

```bash
bash scripts/create-and-bundle.sh <project-name> [template]
```

Opciones:
- `dashboard` - Dashboard con KPIs y gráficos
- `form` - Formulario interactivo
- `data-table` - Tabla con filtros

**Qué hace:**
1. ✅ Valida Node.js 18+, pnpm, dependencias
2. ✅ Crea proyecto Vite + TypeScript
3. ✅ Instala Tailwind CSS + shadcn/ui
4. ✅ Aplica template seleccionado
5. ✅ Bundlea a bundle.html
6. ✅ Valida bundle
7. ✅ Muestra resumen

### `bundle-artifact-v2.sh`
**Para rebundlear después de cambios**

```bash
# Dentro de tu proyecto
bash ../scripts/bundle-artifact-v2.sh
```

**Qué hace:**
1. Valida entorno (package.json, index.html)
2. Instala Parcel
3. Build con optimizaciones
4. Analiza tamaño
5. Sugiere mejoras
6. Limpia archivos temporales

---

## 🎨 Evitar "AI Slop"

### ❌ No hagas esto:
```
- Layouts centrados extremos
- Gradientes morados neon
- Bordes redondeados uniformes
- Iconos decorativos sin sentido
- Animaciones excesivas
```

### ✅ Haz esto:
```
- Layouts asimétricos intencionales
- Colores coherentes (max 5)
- Espaciado consistente (múltiplos de 4-8px)
- Iconos con propósito
- Animaciones suave (<300ms)
```

**Lee:** `docs/DESIGN-GUIDELINES.md` para detalles completos

---

## 🚀 Flujo de Uso

### Opción 1: Automatizado (Recomendado)
```bash
# 1. Crear con template
bash scripts/create-and-bundle.sh mi-app dashboard
cd mi-app

# 2. Editar src/App.tsx
# (tus cambios)

# 3. Rebundlear
bash ../scripts/bundle-artifact-v2.sh

# 4. Abrir bundle.html
open bundle.html
```

### Opción 2: Manual (Control Total)
```bash
bash scripts/init-artifact.sh mi-app
cd mi-app
npm run dev  # desarrollo local
# edita src/App.tsx
bash ../scripts/bundle-artifact-v2.sh
```

---

## 📊 Validación Automática

El script **create-and-bundle.sh** valida:
- ✅ Node.js 18+
- ✅ pnpm instalado
- ✅ Componentes disponibles
- ✅ Estructura HTML válida
- ✅ Librerías presentes
- ✅ Tamaño del bundle
- ✅ No hay referencias rotas

---

## 💡 Common Development Tasks

### Agregar componentes shadcn/ui
```bash
pnpm dlx shadcn-ui@latest add button
pnpm dlx shadcn-ui@latest add card
```

### Agregar librerías
```bash
pnpm add recharts  # Gráficos
pnpm add date-fns  # Fechas
pnpm add zustand   # State management
```

### Usar React Hooks
```tsx
import { useState, useEffect, useMemo } from 'react'
```

### Estructura de carpetas
```
mi-app/
├── src/
│   ├── App.tsx              # Componente principal
│   ├── main.tsx             # Punto de entrada
│   ├── index.css            # Estilos globales
│   └── components/          # Tus componentes
├── index.html
├── tsconfig.json
├── tailwind.config.js
└── bundle.html              # ¡Artifact final!
```

---

## 🐛 Troubleshooting Rápido

### "pnpm not found"
```bash
npm install -g pnpm
```

### "Node version too old"
Actualiza a Node 18+ desde https://nodejs.org

### "shadcn-components.tar.gz not found"
Asegúrate de estar en el directorio correcto

### "bundle.html muy grande (>1MB)"
Lee: SKILL-MEJORADO.md → Troubleshooting

### El bundle no funciona
1. Verifica que `index.html` existe
2. Reconstruye: `bash ../scripts/bundle-artifact-v2.sh`
3. Abre en navegador moderno

---

## 🔗 Recursos

### Documentación Oficial
- [React](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [shadcn/ui](https://ui.shadcn.com)
- [Lucide Icons](https://lucide.dev)

### Design
- [WCAG Contrast](https://webaim.org/resources/contrastchecker/)
- [Stripe Design](https://stripe.com)
- [Tailwind UI](https://tailwindui.com)

---

## 📊 Comparación V1 vs V2

| Aspecto | V1 | V2 |
|---|---|---|
| Setup | 5 pasos | 1 comando |
| Templates | 0 | 3 pre-built |
| Documentación | 3KB | 50KB |
| Validación | Básica | Robusta |
| Ejemplos | 0 | 25+ |
| Anti AI Slop | No | Sí |
| Tiempo setup | 10 min | 2 min |

---

## ✅ Checklist de Uso

### Primer artifact
- [ ] Leer README.md
- [ ] Ejecutar `create-and-bundle.sh`
- [ ] Abrir bundle.html
- [ ] Verificar funcionamiento

### Customizado
- [ ] Editar src/App.tsx
- [ ] Ejecutar bundle-artifact-v2.sh
- [ ] Verificar cambios
- [ ] Compartir artifact

### Aprendizaje completo
- [ ] Leer DESIGN-GUIDELINES.md
- [ ] Leer ADVANCED-EXAMPLES.md
- [ ] Crear 3 artifacts
- [ ] Implementar cada uno

---

## 🎓 Learning Path

1. **5 min:** README.md
2. **2 min:** Ejecutar `create-and-bundle.sh`
3. **10 min:** DESIGN-GUIDELINES.md
4. **5 min:** Editar código
5. **2 min:** Rebundlear
6. **10 min:** ADVANCED-EXAMPLES.md

**Total: 34 minutos para dominar V2**

---

## 📋 Documentos Incluidos

1. **README.md** - Visión general (200 líneas)
2. **SKILL-MEJORADO.md** - Guía completa (400 líneas)
3. **DESIGN-GUIDELINES.md** - Diseño sin AI slop (250 líneas)
4. **ADVANCED-EXAMPLES.md** - Casos avanzados (300 líneas)
5. **RESUMEN-MEJORAS.md** - Para project managers (180 líneas)
6. **INDICE.md** - Navegación completa (250 líneas)
7. **SKILL.md** - Este archivo

**Total documentación:** 1,580 líneas

---

## 🎯 Próximas Acciones

1. ✅ Lee: README.md
2. ✅ Ejecuta: `create-and-bundle.sh mi-app dashboard`
3. ✅ Abre: bundle.html
4. ✅ Lee: DESIGN-GUIDELINES.md
5. ✅ Personaliza: src/App.tsx
6. ✅ Comparte: Tu artifact

---

## 📝 Changelog

### V2.0 Enhanced (2026-04-25)
- ✨ Script automatizado `create-and-bundle.sh`
- ✨ 3 Templates pre-built
- ✨ Validación mejorada
- ✨ Documentación expandida 5x
- ✨ Design guidelines completas
- ✨ Ejemplos avanzados
- ✨ Análisis de bundle
- ✨ Anti "AI slop" checklist

### V1.0 (Original)
- init-artifact.sh
- bundle-artifact.sh
- Documentación básica

---

## 🏆 Resumen

**El mejor skill para crear React artifacts profesionales y sin "AI slop".**

✅ Fácil (1 comando)  
✅ Rápido (2 minutos)  
✅ Profesional (templates + guidelines)  
✅ Documentado (1,500+ líneas)  

---

**¡Comienza ahora!**

```bash
bash scripts/create-and-bundle.sh mi-primer-artifact dashboard
```

**¡Feliz desarrollo!** 🚀
