# 🚀 Web Artifacts Builder V2 - Enhanced Edition

Skill mejorado para crear artifacts React profesionales sin "AI slop".

## ✨ Cambios vs V1

| Característica | V1 | V2 |
|---|---|---|
| Scripts | init + bundle | create-and-bundle (todo automático) |
| Templates | Ninguno | 3 pre-built (dashboard, form, tabla) |
| Validación | Básica | Robusta con pre-checks |
| Documentación | Minimal | Expandida + Design Guidelines |
| Análisis de Bundle | No | Sí (tamaño, sugerencias) |
| Anti "AI Slop" | No | Sí (checklist visual) |
| Manejo de Errores | Básico | Detallado con soluciones |

---

## 📦 Contenidos

```
web-artifacts-builder-mejorado/
├── scripts/
│   ├── create-and-bundle.sh          ✨ NUEVO - Automatiza TODO
│   ├── bundle-artifact-v2.sh         ✨ MEJORADO - Con validación
│   └── shadcn-components.tar.gz      (incluye 40+ componentes)
├── templates/
│   ├── dashboard/App.tsx              ✨ NUEVO - Dashboard con KPIs
│   ├── form/App.tsx                  ✨ NUEVO - Formulario interactivo
│   └── data-table/App.tsx            ✨ NUEVO - Tabla con filtros
├── docs/
│   └── DESIGN-GUIDELINES.md          ✨ NUEVO - Evita "AI slop"
├── SKILL-MEJORADO.md                 ✨ Documentación completa
└── README.md                         (este archivo)
```

---

## 🚀 Quick Start

### 1️⃣ Lo más fácil (Recomendado)

```bash
bash scripts/create-and-bundle.sh mi-dashboard dashboard
```

¡Listo! Tu artifact está en `mi-dashboard/bundle.html`

### 2️⃣ Lo manual (Si necesitas control total)

```bash
bash scripts/init-artifact.sh mi-app
cd mi-app
# Edita src/App.tsx
bash ../scripts/bundle-artifact-v2.sh
open bundle.html
```

---

## 📚 Documentación

### Para empezar
- **[SKILL-MEJORADO.md](./SKILL-MEJORADO.md)** - Guía completa de uso
  - Inicio rápido
  - Common Development Tasks
  - Troubleshooting

### Para evitar "AI slop"
- **[docs/DESIGN-GUIDELINES.md](./docs/DESIGN-GUIDELINES.md)** - Cómo hacerlo bien
  - Qué evitar
  - Patrones probados
  - Paletas de color
  - Checklist final

---

## 🎯 Casos de Uso

### Dashboard Ejecutivo
```bash
bash scripts/create-and-bundle.sh dashboard dashboard
```
**Incluye:**
- KPIs con números
- Gráficos de línea y barras (Recharts)
- Filtros por período
- Cards informativos

### Formulario
```bash
bash scripts/create-and-bundle.sh contact-form form
```
**Incluye:**
- Inputs validados
- Select personalizado
- Textarea
- Checkbox
- Manejo de envío

### Tabla de Datos
```bash
bash scripts/create-and-bundle.sh products data-table
```
**Incluye:**
- Búsqueda en tiempo real
- Filtros por estado
- Ordenamiento (clickeable)
- Exportar
- Responsive

---

## 🛠️ Mejoras Implementadas

### ✅ Script Automatizado
- Una línea para crear proyecto completo
- Valida Node.js, pnpm, dependencias
- Aplica template automáticamente
- Bundlea sin intervención

### ✅ Templates Pre-built
- Dashboard profesional con gráficos
- Formulario con validación
- Tabla con búsqueda y filtros
- Código limpio + comentado
- Listos para customizar

### ✅ Validación Mejorada
- Pre-checks de entorno
- Validación de HTML generado
- Verificación de librerías
- Detección de tamaño
- Sugerencias de optimización

### ✅ Documentación Expandida
- Guía de desarrollo común
- Design guidelines anti "AI slop"
- Ejemplos de código
- Troubleshooting detallado
- Mejores prácticas

### ✅ Análisis de Bundle
- Tamaño en KB/MB
- Librerías detectadas
- Recomendaciones de optimización
- Alertas si es muy grande

### ✅ Checklist de Diseño
- Qué evitar (AI slop)
- Patrones recomendados
- Paletas de color
- Escala tipográfica
- Espaciado consistente

---

## 📊 Comparación Rápida

### V1: Flujo Original
```
init-artifact.sh → (editar) → bundle-artifact.sh → visualizar
4 pasos manuales
Sin templates
Sin guía de diseño
```

### V2: Flujo Mejorado
```
create-and-bundle.sh nombre template
1 comando
Con template incluido
Con validación automática
Con guía de diseño
```

---

## 💡 Destacados

### 🎨 Templates Lista para Usar
No tienes que empezar en blanco. Cada template es:
- ✅ Código limpio y comentado
- ✅ Responsive (móvil/tablet/desktop)
- ✅ Usa shadcn/ui correctamente
- ✅ Sin "AI slop"
- ✅ Fácil de customizar

### 📚 Design Guidelines Completas
La guía `DESIGN-GUIDELINES.md` incluye:
- ✅ Qué es "AI slop" y cómo evitarlo
- ✅ Ejemplos antes/después
- ✅ Patrones de layout probados
- ✅ Paletas de color listas
- ✅ Checklist visual

### 🔍 Validación Inteligente
El nuevo bundler:
- ✅ Detecta problemas antes de buildear
- ✅ Analiza tamaño y da recomendaciones
- ✅ Identifica librerías cargadas
- ✅ Advierte sobre bundle grande

---

## 📋 Estructura del Proyecto

Una vez ejecutas `create-and-bundle.sh`:

```
mi-dashboard/
├── src/
│   ├── App.tsx           # Componente principal
│   ├── main.tsx          # Punto de entrada
│   ├── index.css         # Estilos globales
│   └── components/       # (vacío, agregar tus componentes)
├── index.html            # Root HTML
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
├── bundle.html           # ¡Tu artifact final!
└── node_modules/         # Dependencias
```

---

## 🎓 Learning Path

1. **Comienza aquí:** `SKILL-MEJORADO.md` (3 min read)
2. **Crea tu primer artifact:** `create-and-bundle.sh` (2 min)
3. **Aprende a diseñar:** `docs/DESIGN-GUIDELINES.md` (10 min read)
4. **Customiza el código:** Modifica `src/App.tsx`
5. **Rebundlea:** `bash ../scripts/bundle-artifact-v2.sh`

---

## 🚨 Requirements

- Node.js 18+
- pnpm (se instala automáticamente si no existe)
- Navegador moderno (Chrome, Firefox, Safari, Edge)

```bash
# Verificar requisitos
node -v  # Debe ser v18+
pnpm -v  # Debe estar disponible
```

---

## 🆘 Troubleshooting Rápido

### "pnpm not found"
```bash
npm install -g pnpm
```

### "Node version too old"
Actualiza a Node 18+ desde https://nodejs.org

### "bundle.html no funciona"
1. Verifica que `index.html` existe
2. Ejecuta: `bash scripts/bundle-artifact-v2.sh`
3. Abre en navegador moderno

### "Bundle muy grande (>1MB)"
Lee sugerencias en output o en `SKILL-MEJORADO.md` → Troubleshooting

---

## 📊 Stats

| Métrica | Valor |
|---|---|
| Templates pre-built | 3 |
| Componentes shadcn/ui incluidos | 40+ |
| Líneas de documentación | 800+ |
| Scripts mejorados | 2 |
| Validaciones añadidas | 8+ |
| Ejemplos de código | 25+ |
| Paletas de color | 3 |
| Patrones de diseño | 3 |

---

## 🎯 Próximas Mejoras (Roadmap)

- [ ] CLI interactivo para preguntar preferencias
- [ ] Más templates (landing page, blog, admin)
- [ ] Script de actualización automática
- [ ] Testing integrado (Vitest)
- [ ] Performance profiling
- [ ] PWA support automático

---

## 📞 Soporte

### Recursos Incluidos
- ✅ SKILL-MEJORADO.md (guía principal)
- ✅ DESIGN-GUIDELINES.md (diseño)
- ✅ README.md (este archivo)
- ✅ 3 templates con código comentado

### Recursos Externos
- [shadcn/ui Docs](https://ui.shadcn.com)
- [Tailwind CSS](https://tailwindcss.com)
- [React Docs](https://react.dev)
- [Lucide Icons](https://lucide.dev)

---

## 📝 Changelog

### V2.0 (2026-04-25) - RELEASE 🎉
- ✨ `create-and-bundle.sh` - Automatiza todo
- ✨ 3 Templates pre-built (dashboard, form, data-table)
- ✨ Script `bundle-artifact-v2.sh` mejorado
- ✨ Design Guidelines completas
- ✨ Validación robusta con pre-checks
- ✨ Análisis de bundle y optimización
- ✨ Documentación expandida 3x
- ✨ Checklist anti "AI slop"
- ✨ Ejemplos de código en contexto

### V1.0 (Original)
- init-artifact.sh
- bundle-artifact.sh
- Documentación básica

---

## 🙌 Contributing

¿Tienes una mejora? Sugerencias:
1. Menciona qué mejoraría
2. Proporciona ejemplo
3. Explicar para qué casos de uso

---

**Versión:** 2.0 Enhanced  
**Última actualización:** 2026-04-25  
**Licencia:** MIT  

**¡Feliz desarrollo! 🚀**
