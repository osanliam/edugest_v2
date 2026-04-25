# Guía de Diseño - Evitar "AI Slop"

Una guía visual y práctica para crear artifacts que NO parecen generados por IA.

---

## 🎨 Problema: "AI Slop"

### ¿Qué es?
Artifacts que tienen características visuales predecibles y genéricas que les hacen parecer "obviamente generados":
- Layouts simétricos y centrados
- Colores neon o gradientes morados
- Bordes redondeados uniformes
- Iconos innecesarios
- Animaciones excesivas

### Resultado
Parece amateur, poco confiable, falta de intención de diseño.

---

## ✅ Cómo Hacerlo Bien

### 1. Layout Asimétrico

❌ **Malo:**
```tsx
<div className="flex justify-center items-center min-h-screen">
  <div className="w-96 text-center">
    {/* Completamente centrado */}
  </div>
</div>
```

✅ **Bueno:**
```tsx
<div className="flex">
  <aside className="w-64 bg-gray-50 p-6">
    {/* Sidebar left */}
  </aside>
  <main className="flex-1 p-8">
    {/* Contenido con variación */}
  </main>
</div>
```

### 2. Paleta de Colores Intencional

❌ **Malo:**
```tsx
// Gradiente morado neon genérico
className="bg-gradient-to-r from-purple-500 to-pink-500"
```

✅ **Bueno:**
```tsx
// Colores que transmiten intención
className="bg-blue-50"  // Fondo sereno
className="text-slate-900"  // Texto legible
className="border-slate-200"  // Divisor sutil
className="bg-emerald-100 text-emerald-900"  // Éxito
```

**Paletas recomendadas:**
- **Profesional:** Grises, azules, verdes
- **Creativo:** Naranja, índigo, teal
- **Serio:** Negros, blancos, grises

### 3. Tipografía Coherente

❌ **Malo:**
```tsx
{/* Mezcla de tamaños sin sentido */}
<h1 className="text-4xl font-bold">Título</h1>
<h2 className="text-3xl font-light">Subtítulo</h2>
<p className="text-sm font-medium">Texto</p>
```

✅ **Bueno:**
```tsx
{/* Escala tipográfica clara */}
<h1 className="text-4xl font-bold">Título Principal</h1>      {/* 36px, Bold */}
<h2 className="text-2xl font-semibold">Subtítulo</h2>         {/* 24px, Semi-bold */}
<p className="text-base font-normal">Párrafo normal</p>       {/* 16px, Regular */}
<span className="text-sm font-medium">Label</span>             {/* 14px, Medium */}
```

### 4. Espaciado Consistente

❌ **Malo:**
```tsx
<div className="p-3">
  <div className="mt-7">
    <div className="mb-12">
```

✅ **Bueno:**
```tsx
// Escala 4: 4px, 8px, 12px, 16px, 24px, 32px, 48px, 64px
<div className="p-6">           {/* 24px */}
  <div className="mt-4">        {/* 16px */}
    <div className="mb-6">      {/* 24px */}
```

### 5. Bordes Redondeados Estratégicos

❌ **Malo:**
```tsx
// Rounded en todo
className="rounded-full"  {/* Todo circular */}
```

✅ **Bueno:**
```tsx
{/* Variables según contexto */}
<div className="rounded-lg">           {/* Cards: 8px */}
  <button className="rounded-md">      {/* Buttons: 6px */}
    ...
  </button>
  <div className="rounded">            {/* Inputs: 4px */}
</div>
```

### 6. Iconos con Propósito

❌ **Malo:**
```tsx
{/* Icono decorativo sin valor */}
<div className="flex items-center gap-2">
  <Heart className="w-5 h-5" />
  Nombre largo
</div>
```

✅ **Bueno:**
```tsx
{/* Icono que añade información */}
<div className="flex items-center gap-2">
  <CheckCircle2 className="w-5 h-5 text-green-600" />
  <span>Activo</span>
</div>
```

### 7. Animaciones Sutiles

❌ **Malo:**
```tsx
className="animate-bounce animate-pulse transition-all duration-1000"
```

✅ **Bueno:**
```tsx
{/* Corta, propositiva */}
className="transition-colors duration-200 hover:bg-gray-100"
className="transform hover:scale-105 transition-transform duration-150"
```

---

## 🎯 Patrones de Diseño Probados

### Pattern 1: Sidebar + Main

```tsx
export default function Layout() {
  return (
    <div className="flex h-screen bg-white">
      <aside className="w-64 bg-slate-50 border-r border-slate-200 p-6">
        <nav className="space-y-4">
          {/* Navegación */}
        </nav>
      </aside>
      
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          {/* Contenido */}
        </div>
      </main>
    </div>
  )
}
```

### Pattern 2: Hero + Content

```tsx
export default function Marketing() {
  return (
    <div>
      <section className="bg-slate-900 text-white py-24">
        <div className="max-w-4xl mx-auto px-6">
          <h1 className="text-5xl font-bold mb-4">Título impactante</h1>
          <p className="text-xl text-slate-300 mb-8">Descripción clara</p>
          <button className="bg-blue-600 hover:bg-blue-700 px-8 py-3 rounded-lg font-medium">
            CTA
          </button>
        </div>
      </section>

      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          {/* Contenido */}
        </div>
      </section>
    </div>
  )
}
```

### Pattern 3: Grid Cards

```tsx
export default function Products() {
  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map(item => (
          <div key={item.id} className="bg-white border border-slate-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
            <h3 className="font-semibold text-slate-900 mb-2">{item.name}</h3>
            <p className="text-slate-600 text-sm mb-4">{item.desc}</p>
            <button className="w-full bg-slate-100 hover:bg-slate-200 text-slate-900 py-2 rounded-md transition-colors">
              Ver más
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
```

---

## 🎨 Paletas de Color Listas

### Paleta Profesional (Safe Choice)

```tailwind
Primario: blue-600
Secundario: slate-600
Fondos: white / slate-50 / slate-100
Textos: slate-900 / slate-700 / slate-600
Bordes: slate-200
Éxito: green-600 / green-100
Error: red-600 / red-100
Advertencia: amber-600 / amber-100
Info: blue-600 / blue-100
```

### Paleta Moderna (Tech)

```tailwind
Primario: indigo-600
Secundario: purple-600
Fondos: white / indigo-50 / slate-900
Textos: slate-900 / slate-600
Bordes: slate-200 / slate-800
Éxito: emerald-600
Error: rose-600
```

### Paleta Cálida (Creative)

```tailwind
Primario: orange-600
Secundario: amber-600
Fondos: white / orange-50
Textos: amber-900 / amber-700
Bordes: orange-200
Éxito: teal-600
Énfasis: orange-600
```

---

## ✨ Checklist Final

Antes de publicar tu artifact:

- [ ] **Layout**: ¿Es asimétrico? ¿Tiene zonas claras (header, sidebar, main)?
- [ ] **Colores**: ¿Máx 5 colores? ¿Coherente con intención?
- [ ] **Tipografía**: ¿Jerarquía clara? ¿Escala consistente?
- [ ] **Espaciado**: ¿Usa múltiplos de 4-8px?
- [ ] **Iconos**: ¿Solo iconos con propósito? ¿De Lucide React?
- [ ] **Animaciones**: ¿Cortas (<300ms)? ¿Suaves?
- [ ] **Responsive**: ¿Se ve bien en móvil y desktop?
- [ ] **Contraste**: ¿WCAG AA (4.5:1) para texto?
- [ ] **No AI Slop**: ¿Parece intencional y profesional?

---

## 🚫 Las 10 Cosas MÁS "AI Slop"

1. Gradiente púrpura → naranja en todo
2. Cartas con bordes redondeados extremos (rounded-3xl)
3. Icono decorativo en cada elemento
4. "Coming soon" con efecto glitch
5. Animación bounce excesiva
6. Layouts perfectamente centrados
7. Fuente "Inter" con peso 300 (muy delgada)
8. Grid de 4 columnas en móvil
9. Botones con gradientes
10. Sombras en blanco puro (shadow-2xl en #fff)

### Cómo Evitarlas

```tsx
// ❌ NO HAGAS:
className="bg-gradient-to-r from-purple-500 to-orange-500 rounded-3xl animate-bounce shadow-2xl"

// ✅ HAZ:
className="bg-slate-50 rounded-lg hover:shadow-md transition-shadow duration-200"
```

---

## 🎓 Inspiración

Visita estos sitios para ver diseño PRO (sin AI slop):

- https://dribbble.com (filter: Clean, minimal)
- https://www.producthunt.com (nuevos productos)
- https://stripe.com (referencia de SaaS)
- https://tailwindui.com (componentes bien diseñados)

---

## 📚 Recursos

- [Tailwind CSS Colors](https://tailwindcss.com/docs/customizing-colors)
- [Lucide Icons](https://lucide.dev) - Iconos minimalistas
- [Design Systems](https://www.designsystems.com) - Referencia
- [WebAIM Contrast](https://webaim.org/resources/contrastchecker/) - Verificar contraste

---

**Recuerda:** El mejor diseño es el que parece intencional, no accidental. 🎨
