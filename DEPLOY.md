# Desplegar en Vercel

## Opción 1: Desde GitHub (Recomendado)

1. **Sube el proyecto a GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Sistemita completo con 1262 usuarios y 6997 calificaciones"
   git remote add origin https://github.com/tu-usuario/sistemita.git
   git push -u origin main
   ```

2. **En Vercel:**
   - Ve a https://vercel.com
   - Haz click en "New Project"
   - Conecta tu repositorio de GitHub
   - Vercel detectará automáticamente el `vercel.json`
   - Click en "Deploy"

## Opción 2: Desde CLI

```bash
npm install -g vercel
vercel login
vercel --prod
```

## Puerto

- **Producción**: Vercel asigna automáticamente un URL
- **Local**: http://localhost:3000

## Credenciales de prueba

**Usuario**: `MFHF0001@estudiantes.edu`
**Contraseña**: `student123`

## Datos

- **1262 usuarios** (1249 estudiantes, 12 docentes, 1 admin)
- **6997 calificaciones** migradas
- Almacenados en `backend/data.json`
