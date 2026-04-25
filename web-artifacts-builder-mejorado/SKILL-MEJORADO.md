# Web Artifacts Builder - V2 Enhanced 🚀

Versión mejorada del skill con automatización completa, templates pre-built y validación robusta.

## ✨ Novedades en V2

### 🎯 Nuevas Características
- ✅ **Script `create-and-bundle.sh`** - Automatiza todo de inicio a fin
- ✅ **3 Templates pre-built** - Dashboard, Formulario, Tabla de datos
- ✅ **Validación mejorada** - Pre-checks de Node, pnpm, dependencias
- ✅ **Reportes de bundling** - Tamaño, advertencias de optimización
- ✅ **Checklist de diseño** - Evita "AI slop"
- ✅ **Documentación expandida** - Common Development Tasks
- ✅ **Manejo de errores robusto** - Mensajes descriptivos

---

## 🚀 Inicio Rápido (3 comandos)

```bash
# 1. Crear proyecto con template (automático)
bash scripts/create-and-bundle.sh mi-app dashboard

# 2. Navega al proyecto
cd mi-app

# 3. Abre el bundle
open bundle.html
```

¡Listo! Tu artifact está listo.

---

## 📋 Uso Detallado

### Opción 1: Automatizado (Recomendado)

```bash
bash scripts/create-and-bundle.sh nombre-proyecto [template]
```

**Templates disponibles:**
- `dashboard` - Dashboard con gráficos y KPIs
- `form` - Formulario interactivo con validación
- `data-table` - Tabla con búsqueda, filtros y ordenamiento

**Ejemplo:**
```bash
bash scripts/create-and-bundle.sh mi-dashboard dashboard
```

**Qué hace:**
1. ✅ Valida Node.js 18+, pnpm, dependencias
2. ✅ Crea proyecto Vite + TypeScript
3. ✅ Instala Tailwind CSS + shadcn/ui
4. ✅ Copia el template seleccionado
5. ✅ Bundlea a `bundle.html`
6. ✅ Valida el bundle
7. ✅ Muestra resumen final

### Opción 2: Manual (Para Control Total)

```bash
# 1. Inicializar
bash scripts/init-artifact.sh mi-app
cd mi-app

# 2. Editar código
# Modifica src/App.tsx con tus cambios

# 3. Desarrollo local (opcional)
npm run dev

# 4. Bundlear
bash ../scripts/bundle-artifact.sh

# 5. Visualizar
open bundle.html
```

---

## 🎨 Checklist de Diseño (Anti "AI Slop")

Antes de compartir tu artifact, verifica:

### ❌ Evita:
- [ ] Layouts excesivamente centrados (espacios en blanco extremos)
- [ ] Gradientes morados/rosa genéricos
- [ ] Bordes redondeados uniformes en todo
- [ ] Fuente "Inter" en todo el sitio
- [ ] Iconos que no aportan valor
- [ ] Animaciones innecesarias
- [ ] Colores neon o vibrantes
- [ ] Tipografía inconsistente

### ✅ Haz:
- [ ] Usa espacios en blanco estratégicamente
- [ ] Gradientes sutiles (grises, azules, verdes)
- [ ] Bordes redondeados variables (sm, md, lg)
- [ ] Mezcla fuentes: headers (bold) + body (regular)
- [ ] Iconos de Lucide React solamente para funcionalidad
- [ ] Animaciones suave (duración: 150-300ms)
- [ ] Paleta de colores coherente (max 5 colores)
- [ ] Jerarquía visual clara

### 🎯 Checklist Final:
```
[ ] Diseño no parece "generado"
[ ] Contraste de colores accesible (WCAG AA)
[ ] Responsive (móvil, tablet, desktop)
[ ] Sin elementos visuales innecesarios
[ ] Coherencia en espaciado
[ ] Tipografía legible (16px+ body)
```

---

## 💻 Common Development Tasks

### Agregar Componentes shadcn/ui

```bash
# Dentro del proyecto
pnpm dlx shadcn-ui@latest add button
pnpm dlx shadcn-ui@latest add card
```

[Lista completa de componentes](https://ui.shadcn.com/docs/components)

### Estructura de Carpetas

```
mi-app/
├── src/
│   ├── App.tsx           # Componente principal
│   ├── main.tsx          # Punto de entrada
│   ├── index.css         # Estilos globales
│   └── components/       # Componentes reutilizables
├── index.html            # HTML raíz
├── package.json
├── tsconfig.json
└── bundle.html           # ¡Generado automáticamente!
```

### Modificar Template Base

```tsx
// src/App.tsx
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export default function App() {
  return (
    <div className="p-8">
      <Card>
        <h1>Mi Artifact</h1>
        <Button>Click me</Button>
      </Card>
    </div>
  )
}
```

### Agregar State Management

```tsx
import { useState } from 'react'

export default function Counter() {
  const [count, setCount] = useState(0)
  
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>
        Incrementar
      </button>
    </div>
  )
}
```

### Agregar Gráficos

```bash
pnpm install recharts
```

```tsx
import { LineChart, Line, XAxis, YAxis } from 'recharts'

const data = [
  { name: 'A', value: 400 },
  { name: 'B', value: 300 },
]

export default function Chart() {
  return (
    <LineChart width={600} height={300} data={data}>
      <XAxis dataKey="name" />
      <YAxis />
      <Line type="monotone" dataKey="value" stroke="#3b82f6" />
    </LineChart>
  )
}
```

---

## 🔍 Troubleshooting

### "pnpm not found"
```bash
npm install -g pnpm
```

### "Node.js version too old"
```bash
# Instala Node 18+
# macOS: brew install node
# Windows: https://nodejs.org
```

### "shadcn-components.tar.gz not found"
- Asegúrate que estás en el directorio correcto
- Verifica que los scripts están en `./scripts/`

### "bundle.html muy grande (>1MB)"
**Soluciones:**
1. Lazy-load componentes:
```tsx
const Dashboard = lazy(() => import('./Dashboard'))
```

2. Dynamic imports:
```tsx
const lib = await import('heavy-library')
```

3. Treeshake dependencias no usadas
4. Comprime imágenes (WebP)

### El bundle no funciona
1. Verifica que `index.html` existe
2. Reconstruye: `bash scripts/bundle-artifact.sh`
3. Abre en navegador moderno (Chrome, Firefox, Safari)

---

## 📊 Validación del Bundle

El script valida automáticamente:
- ✅ Tamaño del archivo
- ✅ Estructura HTML válida
- ✅ Presencia de React
- ✅ No hay referencias externas rotas

Salida esperada:
```
✅ Bundle validado ✓
════════════════════════════════════
✅ ARTIFACT COMPLETADO
════════════════════════════════════

📦 Proyecto: mi-app
📁 Ubicación: /ruta/mi-app/bundle.html
📊 Tamaño: 487KB
```

---

## 🎯 Ejemplos de Uso Real

### Dashboard Ejecutivo
```bash
bash scripts/create-and-bundle.sh dashboard-ventas dashboard
```
- KPIs con números en vivo
- Gráficos de línea y barras
- Filtros por período
- Exportar a CSV

### Formulario de Contacto
```bash
bash scripts/create-and-bundle.sh contact-form form
```
- Validación en cliente
- Estados de éxito/error
- Multi-step (opcional)
- Integración con API (opcional)

### Tabla de Datos
```bash
bash scripts/create-and-bundle.sh productos-tabla data-table
```
- Búsqueda en tiempo real
- Filtros avanzados
- Ordenamiento por columnas
- Exportar resultados

---

## 🚀 Mejores Prácticas

### Performance
- [ ] Usa React.memo() para componentes costosos
- [ ] Lazy-load de imágenes pesadas
- [ ] Minimize re-renders con useMemo()
- [ ] Code-split si bundle > 500KB

### Accesibilidad
- [ ] Prueba con screen readers (NVDA, JAWS)
- [ ] Contraste mínimo WCAG AA (4.5:1)
- [ ] Atributos alt en imágenes
- [ ] Navegación solo con teclado (Tab)

### Seguridad
- [ ] Nunca incluyas API keys en el código
- [ ] Valida inputs en cliente
- [ ] Usa variables de entorno (.env)
- [ ] Sanitiza contenido dinámico

### Calidad
- [ ] TypeScript habilitado por defecto
- [ ] Prueba en móvil/tablet/desktop
- [ ] Verifica en navegadores antiguos
- [ ] Mide Core Web Vitals

---

## 📞 Soporte

### Recursos
- [shadcn/ui Docs](https://ui.shadcn.com)
- [Tailwind CSS](https://tailwindcss.com)
- [React Docs](https://react.dev)
- [Lucide Icons](https://lucide.dev)

### Reportar Problemas
Incluye:
1. Error exacto
2. Pasos para reproducir
3. Versión de Node.js
4. Sistema operativo

---

## 📝 Changelog

### V2.0 (2026-04-25)
- ✨ Script `create-and-bundle.sh` automatizado
- ✨ 3 Templates pre-built
- ✨ Validación mejorada con pre-checks
- ✨ Reportes de bundling
- ✨ Checklist anti "AI slop"
- ✨ Documentación expandida

### V1.0 (Original)
- Init artifact workflow
- Bundle a HTML único
- Soporte para React + TypeScript

---

**¡Feliz desarrollo! 🎉**
