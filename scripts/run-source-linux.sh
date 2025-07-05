#!/bin/bash
#
# run-source-linux.sh
# Development runner for Resume Builder
#
# Usage: ./scripts/run-source-linux.sh
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR"

# =============================================================================
# Port Configuration - App-specific ports
# =============================================================================
FRONTEND_PORT=5173
BACKEND_PORT=49372

echo "=========================================="
echo "  Resume Builder - Development Runner"
echo "=========================================="

# =============================================================================
# Kill existing Resume Builder processes
# =============================================================================
kill_port() {
    local port=$1
    local pid=$(lsof -ti:$port 2>/dev/null)
    if [ -n "$pid" ]; then
        echo "[*] Killing process on port $port (PID: $pid)"
        kill -9 $pid 2>/dev/null || true
        sleep 1
    fi
}

echo "[*] Checking for existing Resume Builder processes..."

# Kill Resume Builder Electron app specifically (by project path in process)
ELECTRON_PIDS=$(pgrep -f "resume-builder/node_modules/electron" 2>/dev/null || true)
if [ -n "$ELECTRON_PIDS" ]; then
    echo "[*] Killing Resume Builder Electron processes: $ELECTRON_PIDS"
    echo "$ELECTRON_PIDS" | xargs kill -9 2>/dev/null || true
    sleep 2
fi

# Kill electron-vite dev server for resume-builder
VITE_PIDS=$(pgrep -f "resume-builder.*electron-vite" 2>/dev/null || true)
if [ -n "$VITE_PIDS" ]; then
    echo "[*] Killing electron-vite processes: $VITE_PIDS"
    echo "$VITE_PIDS" | xargs kill -9 2>/dev/null || true
    sleep 1
fi

# Kill any node processes running in resume-builder directory
NODE_PIDS=$(pgrep -f "node.*resume-builder" 2>/dev/null || true)
if [ -n "$NODE_PIDS" ]; then
    echo "[*] Killing node processes: $NODE_PIDS"
    echo "$NODE_PIDS" | xargs kill -9 2>/dev/null || true
    sleep 1
fi

# =============================================================================
# Kill Python NLP Backend (GPU cleanup)
# =============================================================================
echo "[*] Checking for Python NLP backend processes..."

# Kill uvicorn processes on our backend port
UVICORN_PIDS=$(pgrep -f "uvicorn.*${BACKEND_PORT}" 2>/dev/null || true)
if [ -n "$UVICORN_PIDS" ]; then
    echo "[*] Killing uvicorn processes on port $BACKEND_PORT: $UVICORN_PIDS"
    echo "$UVICORN_PIDS" | xargs kill -9 2>/dev/null || true
    sleep 1
fi

# Kill any Python processes in resume-builder/src/python
PYTHON_PIDS=$(pgrep -f "python.*resume-builder" 2>/dev/null || true)
if [ -n "$PYTHON_PIDS" ]; then
    echo "[*] Killing Python resume-builder processes: $PYTHON_PIDS"
    echo "$PYTHON_PIDS" | xargs kill -9 2>/dev/null || true
    sleep 1
fi

# Kill any uvicorn main:app processes (NLP sidecar)
NLP_PIDS=$(pgrep -f "uvicorn main:app" 2>/dev/null || true)
if [ -n "$NLP_PIDS" ]; then
    echo "[*] Killing NLP sidecar processes: $NLP_PIDS"
    echo "$NLP_PIDS" | xargs kill -9 2>/dev/null || true
    sleep 1
fi

# Final cleanup: kill anything on backend port
kill_port $BACKEND_PORT

# Wait for GPU memory to release
echo "[*] Waiting for GPU memory release..."
sleep 2

echo "[*] Resume Builder processes cleared (including GPU)"

# =============================================================================
# Fix Electron sandbox on Linux
# =============================================================================
echo "[*] Configuring kernel for Electron sandbox..."
sudo sysctl -w kernel.unprivileged_userns_clone=1 2>/dev/null || true

# =============================================================================
# Check Node.js
# =============================================================================
if ! command -v node &> /dev/null; then
    echo "[!] Node.js not found. Please install Node.js >= 18"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
echo "[*] Node.js version: $(node -v)"

if [ "$NODE_VERSION" -lt 18 ]; then
    echo "[!] Node.js >= 18 required"
    exit 1
fi

# =============================================================================
# Install dependencies if needed
# =============================================================================
if [ ! -d "node_modules" ]; then
    echo "[*] Installing dependencies..."
    npm install
fi

# =============================================================================
# Start Python NLP Backend
# =============================================================================
echo "[*] Starting Python NLP backend on port $BACKEND_PORT..."

# Check if conda is available
if command -v conda &> /dev/null; then
    # Start NLP backend in background with conda environment
    (
        cd "$PROJECT_DIR/src/python"
        source ~/miniconda3/etc/profile.d/conda.sh
        conda activate resume-builder
        python -m uvicorn main:app --host 127.0.0.1 --port $BACKEND_PORT --log-level info &
    ) &
    NLP_PID=$!
    echo "[*] NLP backend starting (PID: $NLP_PID)"
else
    echo "[!] Conda not found - NLP backend will not start automatically"
    echo "[!] Please start manually: cd src/python && conda activate resume-builder && uvicorn main:app --port $BACKEND_PORT"
fi

# Wait for NLP backend to be ready
echo "[*] Waiting for NLP backend to initialize..."
MAX_WAIT=30
WAITED=0
while [ $WAITED -lt $MAX_WAIT ]; do
    if curl -s "http://127.0.0.1:$BACKEND_PORT/health" > /dev/null 2>&1; then
        echo "[✓] NLP backend is ready!"
        break
    fi
    sleep 1
    WAITED=$((WAITED + 1))
    if [ $((WAITED % 5)) -eq 0 ]; then
        echo "[*] Still waiting for NLP backend... (${WAITED}s)"
    fi
done

if [ $WAITED -ge $MAX_WAIT ]; then
    echo "[!] Warning: NLP backend may not be ready (timeout after ${MAX_WAIT}s)"
    echo "[!] The app will start but NLP features may not work initially"
fi

# =============================================================================
# Launch Electron development server
# =============================================================================
echo ""
echo "[*] Starting Electron development server on port $FRONTEND_PORT..."
echo ""

ELECTRON_DISABLE_SANDBOX=1 npm run dev
