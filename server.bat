@echo off
cd /d %~dp0

echo Iniciando servidor local...

:: tenta usar Python
where python >nul 2>nul
if %errorlevel%==0 (
    start http://localhost:8000
    python -m http.server 8000
    goto end
)

:: tenta usar py (launcher do Python)
where py >nul 2>nul
if %errorlevel%==0 (
    start http://localhost:8000
    py -m http.server 8000
    goto end
)

echo.
echo ERRO: Python nao encontrado.
echo Instale Python ou use VSCode Live Server.
pause

:end