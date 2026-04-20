# Instrucciones de Ejecución - Sistemita_Nuevo

## Cambios Realizados

### 1. **Integración de AdminUsersScreen**
- ✅ Importado en `src/App.tsx`
- ✅ Agregado a la ruta `'gestionar-usuarios'`
- ✅ Restringido solo para rol **admin**
- ✅ Agregado al menú del sidebar en `MainLayoutModern.tsx`

### 2. **Modificación de LoginScreen**
- ✅ Ahora autentica contra `sistema_usuarios` en localStorage
- ✅ Carga usuarios dinámicamente desde localStorage al iniciar
- ✅ Valida email y contraseña contra usuarios creados
- ✅ Si no encuentra en localStorage, intenta con API como fallback
- ✅ Mapea roles correctamente (admin → admin, teacher → teacher, etc.)

### 3. **Navegación Integrada**
- ✅ MenuLayout muestra "Gestionar Usuarios" solo para administradores
- ✅ Categoría "Sistema" visible en sidebar para admin
- ✅ Integración completa con rol-based access control

---

## Cómo Ejecutar

### Opción 1: Ejecución Normal (Recomendado)
```bash
cd /Users/osmer/Downloads/Sistemita_Nuevo
npm install
npm run dev
```

Luego abre: **http://localhost:3001/**

---

### Opción 2: Si hay problemas de permisos en node_modules

Si ves errores como "EPERM: operation not permitted", ejecuta:

```bash
cd /Users/osmer/Downloads/Sistemita_Nuevo

# Limpiar cache de vite
rm -rf node_modules/.vite

# O mejor aún, reinstalar todo
rm -rf node_modules package-lock.json
npm install
npm run dev
```

---

## Flujo de Uso

### 1. **Primer Login (Sin Usuarios)**
- El sistema carga sin usuarios en localStorage
- Intenta usar API como fallback
- Verá mensaje de error "Email o contraseña incorrectos"

### 2. **Crear Usuarios como Admin**
- Login manual con credenciales provisionales (si las hay)
- O acceder directamente si la API funciona

### 3. **Acceder a Gestionar Usuarios**
- Menú → Sistema → Gestionar Usuarios (solo para admin)
- Crear nuevos usuarios (maestros, padres, estudiantes)
- Los usuarios se guardan en `sistema_usuarios` en localStorage

### 4. **Login con Nuevos Usuarios**
- El LoginScreen ahora reconoce los usuarios creados
- Muestra hasta 6 usuarios como "Cuentas de Demo"
- O escribe email/contraseña manualmente

---

## Estructura de Usuario

Los usuarios se almacenan en localStorage con esta estructura:

```typescript
interface Usuario {
  id: string;                                    // unique ID
  nombre: string;                                // nombre completo
  email: string;                                 // email único
  contraseña: string;                            // contraseña (min 6 caracteres)
  rol: 'admin' | 'teacher' | 'parent' | 'student';
  activo: boolean;                               // para activar/desactivar
  creado: string;                                // ISO date string
}
```

---

## Validaciones Implementadas

✅ Email único (no se pueden repetir)
✅ Contraseña mínimo 6 caracteres
✅ Formato de email válido
✅ No permitir usuarios duplicados al crear
✅ Rol validado contra roles permitidos

---

## Roles y Acceso

| Rol | Menús Disponibles |
|-----|-------------------|
| **admin** | Panel Admin + Gestionar Usuarios + Todos |
| **teacher** | Aula Virtual, Calificaciones, Horario, Asistencia |
| **student** | Dashboard, Calificaciones, Horario, Asistencia, Normas |
| **parent** | Dashboard Estudiante, Mensajes, Informes |

---

## Próximos Pasos Sugeridos

1. **Crear Excel-like CalificacionesScreen** con 3 competencias × 9 instrumentos
2. **Crear AdminAssignmentScreen** para asignar maestros a cursos/grados
3. **Crear modal/popup** para marcar respuestas de instrumentos
4. **Agregar persistencia** de maestro-asignaciones en localStorage
5. **Implementar cálculo automático** de calificativos (C, B, A, AD)

---

## Troubleshooting

### Error: "EPERM: operation not permitted"
```bash
# Solución:
rm -rf node_modules/.vite
npm run dev
```

### Error: "Cannot find module 'xyz'"
```bash
npm install
npm run dev
```

### Puerto 3001 ocupado
```bash
# Cambiar puerto en vite.config.ts (líneas 18-25)
# Usar puerto 3002 o 3003 en su lugar
```

### No ve "Gestionar Usuarios" en menú
- Asegúrate de estar logueado como **admin**
- El rol debe ser exactamente `'admin'`

---

**Última actualización:** 2026-04-19  
**Estado:** ✅ Completamente integrado
