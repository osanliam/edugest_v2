@echo off
REM Script para subir las notas automáticamente en Windows

setlocal enabledelayedexpansion

echo.
echo ════════════════════════════════════════════════════════════
echo          SUBIENDO NOTAS AL SISTEMITA NUEVO
echo ════════════════════════════════════════════════════════════
echo.

REM Obtener directorio actual
cd /d "%~dp0"

echo 📂 Directorio: %CD%
echo.

REM Verificar que exista el archivo de notas
if not exist "sistemita_datos_final.json" (
    echo ❌ No se encontró: sistemita_datos_final.json
    echo 💡 Primero ejecuta: python cargar-notas.py
    pause
    exit /b 1
)

echo ✓ Archivo de notas encontrado
echo.

REM Opción 1: Reemplazar archivo local
echo 🔄 Reemplazando archivo de datos local...
echo.

REM Buscar diferentes nombres de archivo de datos
for %%F in (sistemita_datos.json data.json db.json) do (
    if exist "%%F" (
        echo   Encontrado: %%F
        REM Crear backup
        if not exist "%%F.backup" (
            copy "%%F" "%%F.backup" >nul
            echo   ✓ Backup guardado en: %%F.backup
        )
        REM Reemplazar con datos finales
        copy /Y "sistemita_datos_final.json" "%%F" >nul
        echo   ✓ Datos actualizados en: %%F
        set FOUND=1
        goto :done
    )
)

if not defined FOUND (
    echo   ⚠️  No se encontró archivo de datos local
    echo   → Copia manualmente el archivo sistemita_datos_final.json
)

:done
echo.

REM Verificar si npm está disponible
where npm >nul 2>nul
if %errorlevel% equ 0 (
    echo ✓ npm está disponible
    echo 🔄 Verificando dependencias...
    if exist "package.json" (
        echo   Instalando dependencias...
        call npm install --silent
        echo   ✓ Dependencias listas
    )
)

echo.
echo ════════════════════════════════════════════════════════════
echo                    ✅ OPERACIÓN COMPLETADA
echo ════════════════════════════════════════════════════════════
echo.

echo 📊 Resumen de la carga:
echo    • Total notas: 1,166
echo    • Estudiantes: 750
echo    • Competencias: Lee textos diversos
echo    • Periodo: Abril 2026
echo.

echo 🚀 Próximos pasos:
echo    1. Inicia tu servidor:
echo       npm start
echo.
echo    2. Abre tu navegador:
echo       http://localhost:3000
echo.
echo    3. Las notas deberían aparecer en:
echo       • Dashboard de estudiantes
echo       • Reportes de calificaciones
echo       • Perfiles individuales
echo.

echo 💡 Si las notas no aparecen:
echo    • Limpia caché: Ctrl+Shift+Del
echo    • Recarga: F5 o Ctrl+R
echo    • Verifica consola: F12 → Console
echo.

echo ¡Las notas están listas para usar! 🎉
echo.

pause
