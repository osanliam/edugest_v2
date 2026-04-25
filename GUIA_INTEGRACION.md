# Guía de Integración - Nuevos Módulos Mejorados

## 🎯 Objetivo
Integrar todos los nuevos componentes y pantallas al sistema principal de manera organizada y funcional.

---

## 📋 Checklist de Integración

### 1. Importar el Sistema de Diseño
- [ ] Asegurar que `src/styles/theme.css` esté importado en `src/index.css` o `src/main.tsx`
- [ ] Verificar que los colores CSS variables estén disponibles globalmente
- [ ] Probar que las animaciones funcionen correctamente

### 2. Registrar Componentes Base
- [ ] Importar `ModuleHeader` en componentes que lo necesiten
- [ ] Importar `ElegantCard` para reemplazar tarjetas antiguas
- [ ] Verificar que las props estén correctamente tipadas

### 3. Actualizar App.tsx
```typescript
// Agregar estos imports al inicio del archivo
import AdminPanelScreenModernV2 from './screens/AdminPanelScreenModern_v2';
import VirtualClassroomScreenModernV2 from './screens/VirtualClassroomScreenModern_v2';
import ReportsScreenModernV2 from './screens/ReportsScreenModern_v2';
import CommunityScreenModern from './screens/CommunityScreenModern';
import ScheduleScreenModernV2 from './screens/ScheduleScreenModern_v2';
import AttendanceScreenModernV2 from './screens/AttendanceScreenModern_v2';
import NormasConvivenciaModerno from './screens/NormasConvivenciaModerno';
```

### 4. Actualizar el ScreenType
```typescript
type ScreenType = 'login' | 'panel-admin-v2' | 'aula-virtual-v2' | 'informes-v2' |
                 'comunidad' | 'horario-v2' | 'asistencia-v2' | 'normas-v2' |
                 // ... resto de tipos
```

### 5. Actualizar el Switch de Routing
```typescript
const renderScreen = () => {
  switch (currentScreen) {
    case 'panel-admin-v2':
      return <AdminPanelScreenModernV2 />;
    case 'aula-virtual-v2':
      return <VirtualClassroomScreenModernV2 />;
    case 'informes-v2':
      return <ReportsScreenModernV2 />;
    case 'comunidad':
      return <CommunityScreenModern />;
    case 'horario-v2':
      return <ScheduleScreenModernV2 />;
    case 'asistencia-v2':
      return <AttendanceScreenModernV2 />;
    case 'normas-v2':
      return <NormasConvivenciaModerno />;
    // ... resto de casos
    default:
      return <DashboardScreen />;
  }
};
```

### 6. Actualizar Sidebar/Menu
Cambiar las rutas del sidebar para apuntar a las nuevas pantallas:

```typescript
// En MainLayout o componente de navegación
const menuItems = [
  { label: 'Inicio', icon: Home, screen: 'inicio' },
  { label: 'Aula Virtual', icon: BookOpen, screen: 'aula-virtual-v2' },
  { label: 'Mensajes', icon: MessageCircle, screen: 'mensajes' },
  { label: 'Informes', icon: FileText, screen: 'informes-v2' },
  { label: 'Comunidad', icon: Users, screen: 'comunidad' },
  { label: 'Horario', icon: Calendar, screen: 'horario-v2' },
  { label: 'Asistencia', icon: CheckCircle, screen: 'asistencia-v2' },
  { label: 'Normas', icon: Shield, screen: 'normas-v2' },
  // ... resto
];
```

---

## 🔧 Configuración de Turso API

### En AdminPanelScreenModernV2.tsx
El componente ya tiene todo listo para conectarse a Turso. Solo necesitas:

```typescript
// 1. Crear variables de entorno en .env
VITE_TURSO_API_URL=https://your-turso-instance.turso.io
VITE_TURSO_API_TOKEN=your_api_token

// 2. Actualizar el archivo de API utils
// src/utils/api.ts
export const fetchTursoData = async (endpoint: string) => {
  const response = await fetch(
    `${import.meta.env.VITE_TURSO_API_URL}${endpoint}`,
    {
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_TURSO_API_TOKEN}`,
        'Content-Type': 'application/json'
      }
    }
  );
  return response.json();
};

// 3. En AdminPanelScreenModernV2.tsx, reemplazar la función refreshData
const refreshData = async () => {
  setIsRefreshing(true);
  try {
    const data = await fetchTursoData('/admin/system-stats');
    setStats(data.stats);
    setDatabaseStatus(data.services);
  } catch (error) {
    console.error('Error cargando datos:', error);
  } finally {
    setIsRefreshing(false);
  }
};
```

---

## 🎨 Aplicar Sistema de Diseño

### En todos los componentes nuevos:

1. **Headers**: Usar siempre `ModuleHeader`
```typescript
<ModuleHeader
  icon={BookOpen}
  title="Aula Virtual"
  subtitle="Tus clases, tareas y recursos"
  badge="ACTIVO"
  badgeColor="green"
/>
```

2. **Tarjetas**: Usar `ElegantCard` para consistencia
```typescript
<ElegantCard index={0} variant="default">
  <div>Contenido aquí</div>
</ElegantCard>
```

3. **Colores**: Usar CSS variables
```css
/* ✅ Correcto */
background: var(--color-primary);
color: var(--color-text-primary);

/* ❌ Evitar */
background: #6366f1;
color: #f1f5f9;
```

---

## 📱 Testing por Resolución

### Desktop (1920px)
- [ ] Headers se ven completos
- [ ] Grid se distribuye correctamente
- [ ] Espaciado es el esperado
- [ ] Animaciones son suaves

### Tablet (768px)
- [ ] Elementos se apilan apropiadamente
- [ ] Touch targets son suficientemente grandes
- [ ] Texto es legible sin zoom
- [ ] Scroll horizontal no es necesario

### Mobile (375px)
- [ ] Single column layout
- [ ] Botones clickeables
- [ ] Texto no se corta
- [ ] Imágenes se escalan bien

---

## 🔍 Verificación de Calidad

### Visual
- [ ] Paleta de colores consistente
- [ ] Iconografía clara
- [ ] Headers distintivos
- [ ] Sin elementos desteñidos
- [ ] Sombras y glows elegantes

### Funcionalidad
- [ ] Links y botones funcionan
- [ ] Formularios registran entrada
- [ ] Filtros aplican correctamente
- [ ] Animaciones no son lentas
- [ ] No hay errores en consola

### Accesibilidad
- [ ] Contraste suficiente
- [ ] Texto escalable
- [ ] Navegación por teclado
- [ ] Labels para inputs
- [ ] ARIA labels donde sea necesario

---

## 📊 Ejemplo de Integración Completa

### App.tsx actualizado (fragmento):

```typescript
import { useState, useEffect } from 'react';
import { loadSystemData } from './services/dataService';

// Imports de pantallas
import LoginScreen from './screens/LoginScreen';
import AdminPanelScreenModernV2 from './screens/AdminPanelScreenModern_v2';
import VirtualClassroomScreenModernV2 from './screens/VirtualClassroomScreenModern_v2';
import ReportsScreenModernV2 from './screens/ReportsScreenModern_v2';
import CommunityScreenModern from './screens/CommunityScreenModern';
import ScheduleScreenModernV2 from './screens/ScheduleScreenModern_v2';
import AttendanceScreenModernV2 from './screens/AttendanceScreenModern_v2';
import NormasConvivenciaModerno from './screens/NormasConvivenciaModerno';

type UserRole = 'admin' | 'director' | 'subdirector' | 'teacher' | 'student' | 'parent';

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  schoolId: string;
}

type ScreenType = 'login' | 'panel-admin-v2' | 'aula-virtual-v2' | 'informes-v2' |
                 'comunidad' | 'horario-v2' | 'asistencia-v2' | 'normas-v2';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('login');
  const [darkMode, setDarkMode] = useState(true);

  // ... resto del código

  const renderScreen = () => {
    switch (currentScreen) {
      case 'panel-admin-v2':
        return <AdminPanelScreenModernV2 />;
      case 'aula-virtual-v2':
        return <VirtualClassroomScreenModernV2 />;
      case 'informes-v2':
        return <ReportsScreenModernV2 />;
      case 'comunidad':
        return <CommunityScreenModern />;
      case 'horario-v2':
        return <ScheduleScreenModernV2 />;
      case 'asistencia-v2':
        return <AttendanceScreenModernV2 />;
      case 'normas-v2':
        return <NormasConvivenciaModerno />;
      case 'login':
      default:
        return <LoginScreen onLogin={handleLogin} />;
    }
  };

  return (
    <div className={darkMode ? 'dark' : ''}>
      {renderScreen()}
    </div>
  );
}
```

---

## 🚨 Errores Comunes y Soluciones

### Error: "Cannot find module ModuleHeader"
**Solución**: Verificar que el archivo esté en `src/components/ModuleHeader.tsx`

### Error: Colores no aplicados
**Solución**: Importar `src/styles/theme.css` en el punto de entrada principal

### Error: Animaciones lentas
**Solución**: Verificar que `motion/react` esté correctamente importado y la versión sea reciente

### Responsive no funciona
**Solución**: Asegurar que Tailwind está configurado correctamente con el archivo de configuración

---

## 📚 Recursos Útiles

### Documentación de Librerías:
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Lucide Icons](https://lucide.dev/)
- [Motion React](https://motion.dev/)
- [React Router](https://reactrouter.com/)

### Archivos de Referencia:
- `MEJORAS_IMPLEMENTADAS.md` - Detalle de cada módulo
- `STRUCTURE.md` - Estructura general del proyecto
- `DATABASE_SCHEMA.sql` - Esquema de base de datos

---

## ✅ Checklist Final de Deployment

- [ ] Todos los imports están correctos
- [ ] No hay errores de TypeScript
- [ ] Responsive funciona en 3 tamaños
- [ ] Paleta de colores es consistente
- [ ] Animaciones son suaves
- [ ] Turso API está configurada
- [ ] Headers tienen iconografía
- [ ] Módulos tienen títulos y subtítulos
- [ ] Sin elementos desteñidos
- [ ] Testing en diferentes navegadores

---

**Última actualización:** Abril 24, 2026
**Versión:** 1.0.0
