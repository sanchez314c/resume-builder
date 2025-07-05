@echo off
REM Resume Builder - Windows Source Runner v1.0.0
REM
REM Launches both the Electron frontend and Python NLP sidecar
REM with proper port management and conda activation.
REM
REM Usage:
REM   run-source-windows.bat [--dev] [--frontend-only] [--backend-only] [--debug] [--kill] [--status]

setlocal enabledelayedexpansion

REM =============================================================================
REM Port Configuration
REM =============================================================================

set FRONTEND_PORT=63263
set BACKEND_PORT=57964
set HMR_PORT=50026
set CONDA_ENV_NAME=resume-builder

REM =============================================================================
REM Options
REM =============================================================================

set DEV_MODE=false
set RUN_FRONTEND=true
set RUN_BACKEND=true
set DEBUG_MODE=false
set KILL_ONLY=false
set STATUS_ONLY=false

REM Parse arguments
:parse_args
if "%~1"=="" goto :start
if "%~1"=="--dev" (set DEV_MODE=true & shift & goto :parse_args)
if "%~1"=="--frontend-only" (set RUN_BACKEND=false & shift & goto :parse_args)
if "%~1"=="--backend-only" (set RUN_FRONTEND=false & shift & goto :parse_args)
if "%~1"=="--debug" (set DEBUG_MODE=true & shift & goto :parse_args)
if "%~1"=="--kill" (set KILL_ONLY=true & shift & goto :parse_args)
if "%~1"=="--status" (set STATUS_ONLY=true & shift & goto :parse_args)
if "%~1"=="--help" goto :show_help
echo Unknown option: %~1
exit /b 1

:show_help
echo Usage: run-source-windows.bat [--dev] [--frontend-only] [--backend-only] [--debug] [--kill] [--status]
echo.
echo Options:
echo   --dev             Run in development mode (HMR enabled)
echo   --frontend-only   Only start the Electron frontend
echo   --backend-only    Only start the Python NLP sidecar
echo   --debug           Enable debug mode
echo   --kill            Kill existing processes and exit
echo   --status          Show port/process status
exit /b 0

:start
REM =============================================================================
REM Banner
REM =============================================================================

echo.
echo  ============================================================
echo   RESUME BUILDER - Windows Source Runner v1.0.0
echo  ============================================================
echo.
echo   Frontend Port: %FRONTEND_PORT%
echo   Backend Port:  %BACKEND_PORT%
echo   HMR Port:      %HMR_PORT%
echo   Dev Mode:      %DEV_MODE%
echo.

REM =============================================================================
REM Kill Only
REM =============================================================================

if "%KILL_ONLY%"=="true" (
    echo Killing processes on configured ports...
    for %%p in (%FRONTEND_PORT% %BACKEND_PORT% %HMR_PORT%) do (
        for /f "tokens=5" %%i in ('netstat -ano ^| findstr ":%%p "') do (
            echo Killing PID %%i on port %%p
            taskkill /PID %%i /F >nul 2>&1
        )
    )
    echo Done.
    exit /b 0
)

REM =============================================================================
REM Status Only
REM =============================================================================

if "%STATUS_ONLY%"=="true" (
    echo Port Status:
    for %%p in (%FRONTEND_PORT% %BACKEND_PORT% %HMR_PORT%) do (
        netstat -ano | findstr ":%%p " >nul 2>&1 && echo   Port %%p: IN USE || echo   Port %%p: FREE
    )
    exit /b 0
)

REM =============================================================================
REM Pre-flight Checks
REM =============================================================================

echo [CHECK] Verifying prerequisites...

where node >nul 2>&1 || (echo [ERROR] Node.js not found. Install from https://nodejs.org & exit /b 1)
for /f "tokens=*" %%v in ('node --version') do echo [OK] Node.js %%v

where npm >nul 2>&1 || (echo [ERROR] npm not found & exit /b 1)
for /f "tokens=*" %%v in ('npm --version') do echo [OK] npm %%v

where conda >nul 2>&1 || (echo [WARN] Conda not found. Skipping Python backend. & set RUN_BACKEND=false)

if not exist node_modules (
    echo [WARN] node_modules not found. Installing...
    npm install
)
echo [OK] Node dependencies ready

REM =============================================================================
REM Port Cleanup
REM =============================================================================

echo.
echo [INFO] Clearing ports...
for %%p in (%FRONTEND_PORT% %BACKEND_PORT% %HMR_PORT%) do (
    for /f "tokens=5" %%i in ('netstat -ano ^| findstr ":%%p "') do (
        echo [WARN] Killing PID %%i on port %%p
        taskkill /PID %%i /F >nul 2>&1
    )
)
echo [OK] Ports cleared

REM =============================================================================
REM Start Backend
REM =============================================================================

if "%RUN_BACKEND%"=="true" (
    echo.
    echo [INFO] Starting Python NLP Backend...
    call conda activate %CONDA_ENV_NAME% 2>nul || (
        echo [WARN] Conda env '%CONDA_ENV_NAME%' not found. Run scripts\setup-conda.sh
        set RUN_BACKEND=false
    )

    if "%RUN_BACKEND%"=="true" (
        set UVICORN_ARGS=main:app --host 127.0.0.1 --port %BACKEND_PORT%
        if "%DEBUG_MODE%"=="true" set UVICORN_ARGS=!UVICORN_ARGS! --reload --log-level debug
        cd src\python
        start "NLP Backend" /B python -m uvicorn !UVICORN_ARGS!
        cd ..\..
        echo [OK] Backend starting on http://127.0.0.1:%BACKEND_PORT%
    )
)

REM =============================================================================
REM Start Frontend
REM =============================================================================

if "%RUN_FRONTEND%"=="true" (
    echo.
    echo [INFO] Starting Electron Frontend...

    set VITE_DEV_SERVER_PORT=%FRONTEND_PORT%
    set VITE_NLP_BACKEND_URL=http://127.0.0.1:%BACKEND_PORT%

    if "%DEV_MODE%"=="true" (
        start "Electron Frontend" /B npm run dev
    ) else (
        start "Electron Frontend" /B npm run start
    )
    echo [OK] Frontend starting on http://localhost:%FRONTEND_PORT%
)

REM =============================================================================
REM Running
REM =============================================================================

echo.
echo  ============================================================
echo   All services started. Close this window to stop.
echo.
if "%RUN_FRONTEND%"=="true" echo   Frontend: http://localhost:%FRONTEND_PORT%
if "%RUN_BACKEND%"=="true" (
    echo   Backend:  http://127.0.0.1:%BACKEND_PORT%
    echo   API Docs: http://127.0.0.1:%BACKEND_PORT%/docs
)
echo  ============================================================
echo.

pause
