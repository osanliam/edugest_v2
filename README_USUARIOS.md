# 👥 Gestión de Usuarios - Sistemita_Nuevo

## 🎯 Objetivo
Integrar un sistema completo de gestión de usuarios donde:
- ✅ Los administradores pueden crear, editar y eliminar usuarios
- ✅ Los usuarios creados son reconocidos automáticamente en el login
- ✅ No hay duplicación ni conflictos de usuarios
- ✅ Cada usuario ve solo los menús de su rol
- ✅ Los datos persisten en localStorage

---

## 🚀 Inicio Rápido

### 1. Abrir la página de carga de usuarios demo
Abre en tu navegador:
```
file:///Users/osmer/Downloads/Sistemita_Nuevo/CARGAR_USUARIOS_DEMO.html
```

O simplemente haz doble clic en `CARGAR_USUARIOS_DEMO.html`

### 2. Cargar usuarios de prueba
- Verás una lista de 6 usuarios predefinidos
- Haz clic en "✅ Cargar Todos los Usuarios"
- Serás redirigido automáticamente al login

### 3. Iniciar sesión
Usa cualquiera de estos usuarios:
- **Admin:** admin@sistemita.edu / admin123
- **Docente:** juan.perez@sistemita.edu / teacher123
- **Estudiante:** carlos.mendez@estudiantes.edu / student123
- **Apoderado:** pedro.hernandez@apoderados.edu / parent123

---

## 🎛️ Gestión de Usuarios (Solo Admin)

### Acceso:
1. Login como **admin**
2. Menú lateral → Sistema → **Gestionar Usuarios**

### Funcionalidades:

#### ➕ Crear Usuario
- Nombre completo (requerido)
- Email (debe ser único y válido)
- Contraseña (mínimo 6 caracteres)
- Rol: Admin, Docente, Estudiante o Apoderado
- Validaciones automáticas
- Se guarda en localStorage inmediatamente

#### ✏️ Editar Usuario
- Haz clic en el botón de edición (lápiz azul)
- Modifica cualquier campo
- Las validaciones se aplican igual
- Se actualiza en localStorage

#### 🗑️ Eliminar Usuario
- Haz clic en el botón de eliminar (basura roja)
- Confirma la eliminación
- El usuario se remove de localStorage

#### 🔍 Buscar Usuarios
- Usa el campo de búsqueda
- Filtra por nombre o email en tiempo real

#### 👁️ Ver Contraseñas
- Haz clic en el ojo junto a "Contraseña"
- Alterna entre mostrar/ocultar

---

## 📊 Datos de Usuarios

### Estructura (en localStorage):
```json
{
  "id": "unique-id",
  "nombre": "Juan Pérez García",
  "email": "juan@ejemplo.edu",
  "contraseña": "password123",
  "rol": "teacher",
  "activo": true,
  "creado": "2026-04-19T18:00:00Z"
}
```

### Clave en localStorage:
```javascript
localStorage.getItem('sistema_usuarios')  // Array de usuarios
```

### Roles disponibles:
| Rol | Código | Menús Disponibles |
|-----|--------|-------------------|
| 👑 Administrador | admin | Panel Admin, Gestionar Usuarios, TODOS |
| 👨‍🏫 Docente | teacher | Aula Virtual, Calificaciones, Horario, Asistencia |
| 👨‍🎓 Estudiante | student | Dashboard, Calificaciones, Horario, Asistencia, Normas |
| 👨‍👩‍👧 Apoderado | parent | Dashboard Estudiante, Mensajes, Informes |

---

## 🔐 Validaciones

### En Creación/Edición:
- ✅ Nombre no puede estar vacío
- ✅ Email debe ser formato válido (xxx@xxx.xxx)
- ✅ Email debe ser único (no puede repetirse)
- ✅ Contraseña debe tener 6+ caracteres
- ✅ Rol debe ser uno de los 4 permitidos

### En Login:
- ✅ Email debe existir en la base de datos
- ✅ Contraseña debe coincidir exactamente
- ✅ Usuario debe estar activo (activo=true)
- ✅ Mensaje genérico si falla: "Email o contraseña incorrectos"

---

## 📱 Flujos de Uso

### Flujo 1: Admin crea nuevo maestro

```
1. Admin → Sistema → Gestionar Usuarios
2. Clic en "+ Nuevo Usuario"
3. Completa formulario:
   - Nombre: "María García"
   - Email: "maria@sistemita.edu"
   - Contraseña: "teacher456"
   - Rol: "Docente"
4. Clic en "✓ Crear Usuario"
5. Mensaje: "✓ Usuario creado correctamente"
6. María aparece en la lista
7. Se guardó en localStorage
```

**Resultado:** María puede loguear con maria@sistemita.edu / teacher456

---

### Flujo 2: Admin edita contraseña de usuario

```
1. Admin → Sistema → Gestionar Usuarios
2. Busca el usuario en la lista
3. Clic en botón editar (lápiz azul)
4. Cambia la contraseña en el formulario
5. Clic en "✓ Actualizar Usuario"
6. Cambio guardado inmediatamente
```

**Resultado:** Usuario debe usar nueva contraseña en próximo login

---

### Flujo 3: Admin desactiva usuario

```
1. Admin → Sistema → Gestionar Usuarios
2. Clic en botón eliminar (basura roja)
3. Confirma: "¿Eliminar usuario?"
4. Usuario removido de la lista
5. Se actualiza en localStorage
```

**Resultado:** Usuario NO puede loguear (no existe en la BD)

---

### Flujo 4: Nuevo usuario intenta login

```
1. Usuario ve pantalla de login
2. Ve lista de "Cuentas de Demo" (primeros 6 usuarios)
3. O escribe email y contraseña manualmente
4. Sistema busca en localStorage
5. Si encuentra y contraseña es correcta → Acceso
6. Si no → "Email o contraseña incorrectos"
```

---

## 🛠️ Troubleshooting

### Problema: "No puedo acceder a Gestionar Usuarios"
**Causa:** No estás logueado como admin
**Solución:** 
1. Logout (Cerrar Sesión)
2. Login como admin@sistemita.edu
3. Si no tienes usuarios, carga desde CARGAR_USUARIOS_DEMO.html

### Problema: "Usuarios desaparecieron"
**Causa:** Se limpió el almacenamiento del navegador (cookies, caché)
**Solución:**
1. Abre CARGAR_USUARIOS_DEMO.html
2. Haz clic en "✅ Cargar Todos los Usuarios"
3. Los usuarios vuelven a localStorage

### Problema: "No puedo crear usuario con email X"
**Causa:** Ya existe un usuario con ese email
**Solución:**
1. Usa otro email
2. O edita el usuario existente para cambiar su email
3. O elimina el usuario y crea uno nuevo

### Problema: "Olvidé la contraseña de admin"
**Causa:** Las contraseñas se almacenan en texto plano
**Solución:**
1. Abre la consola del navegador (F12)
2. Escribe: `console.log(JSON.parse(localStorage.getItem('sistema_usuarios')))`
3. Busca el usuario admin y copia su contraseña
4. O carga nuevamente desde CARGAR_USUARIOS_DEMO.html

---

## 🔄 Integración Técnica

### LoginScreen.tsx
```typescript
// Busca en localStorage primero
const stored = localStorage.getItem('sistema_usuarios');
if (stored) {
  const usuarios = JSON.parse(stored);
  const encontrado = usuarios.find(u => 
    u.email === email && 
    u.contraseña === password && 
    u.activo
  );
  if (encontrado) {
    // Login exitoso
    onLogin(usuarioEncontrado);
  }
}
```

### AdminUsersScreen.tsx
```typescript
// Guarda en localStorage
const nuevosUsuarios = [...usuarios, nuevoUsuario];
localStorage.setItem('sistema_usuarios', JSON.stringify(nuevosUsuarios));
setSuccess('Usuario creado correctamente');
```

---

## 📈 Estadísticas

Después de cargar usuarios demo, verás:
- 👥 Total: 6 usuarios
- 👑 Administradores: 1
- 👨‍🏫 Docentes: 2
- 👨‍🎓 Estudiantes: 2
- 👨‍👩‍👧 Apoderados: 1

---

## ⚠️ Notas Importantes

### Seguridad en Desarrollo
- Las contraseñas se guardan **en texto plano**
- Esto es solo para desarrollo
- En producción usar backend con:
  - Hash de contraseñas (bcrypt)
  - JWT tokens
  - HTTPS
  - Base de datos segura

### Persistencia
- Los datos se guardan en localStorage del navegador
- Se pierden si:
  - Limpias el almacenamiento del navegador
  - Borras cookies/caché
  - Usas modo incógnito/privado
  
### Sincronización
- No hay sincronización entre navegadores diferentes
- Cada navegador tiene su propio localStorage
- Si abres en Chrome y luego en Firefox, tendrá usuarios diferentes

---

## 🎓 Próximos Pasos

1. **Crear Asignaciones Maestro-Curso:**
   - Crear panel para asignar maestros a grados/secciones
   - Validar no sobrecargar maestros
   - Mostrar estudiantes asignados

2. **Mejorar Seguridad:**
   - Migrar a backend API
   - Implementar hash de contraseñas
   - Añadir tokens JWT

3. **Mejorar UX:**
   - Añadir validación de email
   - Permitir cambio de contraseña
   - Añadir recuperación de contraseña

4. **Integración Calificaciones:**
   - Conectar maestros asignados con estudiantes
   - Mostrar solo estudiantes del maestro
   - Registrar notas solo para sus estudiantes

---

## 📞 Soporte

Para dudas o problemas:
- Revisa INSTRUCCIONES_EJECUCION.md
- Revisa CAMBIOS_REALIZADOS.md
- Abre la consola (F12) y busca mensajes de error
- Verifica localStorage: `localStorage.getItem('sistema_usuarios')`

---

**Última actualización:** 2026-04-19
**Versión:** v1.0
**Estado:** ✅ Completamente funcional
