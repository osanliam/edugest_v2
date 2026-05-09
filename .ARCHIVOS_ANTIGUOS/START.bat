@echo off
cd /d "%~dp0"

echo Iniciando Sistemita Nuevo...
echo.
echo Opcion 1: Python (Recomendado)
echo python -m http.server 3000
echo.
echo Opcion 2: Node.js
echo node servidor.js
echo.
echo Luego accede a:
echo http://localhost:3000/
echo.

if command -v python >/dev/null 2>/dev/null (
    echo Python detectado. Iniciando...
    python -m http.server 3000
) else if command -v node >/dev/null 2>/dev/null (
    echo Node.js detectado. Iniciando...
    node servidor.js
) else (
    echo Error: No se encontro Python ni Node.js
    pause
    exit /b 1
)
