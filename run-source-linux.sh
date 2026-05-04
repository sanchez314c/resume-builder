#!/bin/bash
#
# Resume Builder - Linux Source Runner v1.0.0
#
# Launches both the Electron frontend and Python NLP sidecar
# with proper port management, sandbox fix, and environment activation.
#
# Usage:
#   ./run-source-linux.sh [options]
#
# Options:
#   --dev             Run in development mode (with --dev flag)
#   --frontend-only   Only start the Electron frontend
#   --backend-only    Only start the Python NLP sidecar
#   --debug           Enable debug mode for both services
#   --no-sandbox      Force run Electron without sandbox
#   --kill            Kill existing processes and exit
#   --status          Show status of ports and processes
#

set -e

# =============================================================================
# Port Configuration
# =============================================================================

FRONTEND_PORT=63263
BACKEND_PORT=57964
HMR_PORT=50026

# =============================================================================
# Environment
# =============================================================================

CONDA_ENV_NAME="resume-builder"
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PYTHON_DIR="$PROJECT_ROOT/src/python"

# =============================================================================
# Colors
# =============================================================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m'

# =============================================================================
# Options
# =============================================================================

DEV_MODE=false
RUN_FRONTEND=true
RUN_BACKEND=true
DEBUG_MODE=false
NO_SANDBOX=false
KILL_ONLY=false
STATUS_ONLY=false

# =============================================================================
# Argument Parsing
# =============================================================================

while [[ $# -gt 0 ]]; do
    case $1 in
        --dev)
            DEV_MODE=true
            shift
            ;;
        --frontend-only)
            RUN_BACKEND=false
            shift
            ;;
        --backend-only)
            RUN_FRONTEND=false
            shift
            ;;
        --debug)
            DEBUG_MODE=true
            shift
            ;;
        --no-sandbox)
            NO_SANDBOX=true
            shift
            ;;
        --kill)
            KILL_ONLY=true
            shift
            ;;
        --status)
            STATUS_ONLY=true
            shift
            ;;
        -h|--help)
            echo "Usage: $0 [--dev] [--frontend-only] [--backend-only] [--debug] [--no-sandbox] [--kill] [--status]"
            echo
            echo "Options:"
            echo "  --dev             Run in development mode (HMR enabled)"
            echo "  --frontend-only   Only start the Electron frontend"
            echo "  --backend-only    Only start the Python NLP sidecar"
            echo "  --debug           Enable debug mode"
            echo "  --no-sandbox      Run Electron without sandbox (Linux fix)"
            echo "  --kill            Kill existing processes and exit"
            echo "  --status          Show port/process status"
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            exit 1
            ;;
    esac
done

# =============================================================================
# Utility Functions
# =============================================================================

log_info() {
    echo -e "${CYAN}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[OK]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_header() {
    echo
    echo -e "${MAGENTA}================================================================${NC}"
    echo -e "${MAGENTA}  $1${NC}"
    echo -e "${MAGENTA}================================================================${NC}"
    echo
}

is_port_in_use() {
    local port=$1
    if lsof -i :"$port" &>/dev/null; then
        return 0
    else
        return 1
    fi
}

get_pid_on_port() {
    local port=$1
    lsof -t -i :"$port" 2>/dev/null | head -1
}

kill_port() {
    local port=$1
    local pid
    pid=$(get_pid_on_port "$port")
    if [ -n "$pid" ]; then
        log_warn "Killing PID $pid on port $port..."
        kill -9 "$pid" 2>/dev/null || true
        sleep 0.5
        if is_port_in_use "$port"; then
            log_error "Failed to free port $port"
            return 1
        else
            log_success "Port $port freed"
        fi
    fi
}

show_status() {
    log_header "Port Status"

    for label_port in "Frontend:$FRONTEND_PORT" "Backend:$BACKEND_PORT" "HMR:$HMR_PORT"; do
        label="${label_port%%:*}"
        port="${label_port##*:}"
        echo -e "${BLUE}${label} Port:${NC} $port"
        if is_port_in_use "$port"; then
            local pid
            pid=$(get_pid_on_port "$port")
            local proc
            proc=$(ps -p "$pid" -o comm= 2>/dev/null || echo "unknown")
            echo -e "  ${YELLOW}IN USE${NC} by PID $pid ($proc)"
        else
            echo -e "  ${GREEN}FREE${NC}"
        fi
    done

    echo
    echo -e "${BLUE}Conda Environment:${NC} $CONDA_ENV_NAME"
    if conda env list 2>/dev/null | grep -q "^$CONDA_ENV_NAME "; then
        echo -e "  ${GREEN}EXISTS${NC}"
    else
        echo -e "  ${RED}NOT FOUND${NC} — run ./scripts/setup-conda.sh"
    fi

    echo
    echo -e "${BLUE}Node Modules:${NC}"
    if [ -d "$PROJECT_ROOT/node_modules" ]; then
        echo -e "  ${GREEN}INSTALLED${NC}"
    else
        echo -e "  ${RED}NOT FOUND${NC} — run npm install"
    fi
}

# =============================================================================
# Status / Kill Early Exit
# =============================================================================

if [ "$STATUS_ONLY" = true ]; then
    show_status
    exit 0
fi

if [ "$KILL_ONLY" = true ]; then
    log_header "Killing Existing Processes"
    kill_port "$FRONTEND_PORT"
    kill_port "$BACKEND_PORT"
    kill_port "$HMR_PORT"
    log_success "All processes terminated"
    exit 0
fi

# =============================================================================
# Cleanup on Exit
# =============================================================================

cleanup() {
    log_info "Shutting down services..."
    jobs -p | xargs -r kill 2>/dev/null || true
    kill_port "$FRONTEND_PORT" 2>/dev/null || true
    kill_port "$BACKEND_PORT" 2>/dev/null || true
    kill_port "$HMR_PORT" 2>/dev/null || true
    log_success "Cleanup complete"
    exit 0
}

trap cleanup SIGINT SIGTERM

# =============================================================================
# Banner
# =============================================================================

echo -e "${CYAN}"
cat << 'EOF'
╔══════════════════════════════════════════════════════════════════════╗
║                                                                      ║
║   ██████╗ ███████╗███████╗██╗   ██╗███╗   ███╗███████╗              ║
║   ██╔══██╗██╔════╝██╔════╝██║   ██║████╗ ████║██╔════╝              ║
║   ██████╔╝█████╗  ███████╗██║   ██║██╔████╔██║█████╗                ║
║   ██╔══██╗██╔══╝  ╚════██║██║   ██║██║╚██╔╝██║██╔══╝                ║
║   ██║  ██║███████╗███████║╚██████╔╝██║ ╚═╝ ██║███████╗              ║
║   ╚═╝  ╚═╝╚══════╝╚══════╝ ╚═════╝ ╚═╝     ╚═╝╚══════╝              ║
║                                                                      ║
║   ██████╗ ██╗   ██╗██╗██╗     ██████╗ ███████╗██████╗               ║
║   ██╔══██╗██║   ██║██║██║     ██╔══██╗██╔════╝██╔══██╗              ║
║   ██████╔╝██║   ██║██║██║     ██║  ██║█████╗  ██████╔╝              ║
║   ██╔══██╗██║   ██║██║██║     ██║  ██║██╔══╝  ██╔══██╗              ║
║   ██████╔╝╚██████╔╝██║███████╗██████╔╝███████╗██║  ██║              ║
║   ╚═════╝  ╚═════╝ ╚═╝╚══════╝╚═════╝ ╚══════╝╚═╝  ╚═╝              ║
║                                                                      ║
║               Linux Source Runner  v1.0.0                           ║
╚══════════════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

echo -e "${BLUE}Mode:${NC}          $([ "$DEV_MODE" = true ] && echo 'DEVELOPMENT' || echo 'PRODUCTION')"
echo -e "${BLUE}Frontend Port:${NC} $FRONTEND_PORT"
echo -e "${BLUE}Backend Port:${NC}  $BACKEND_PORT"
echo -e "${BLUE}HMR Port:${NC}      $HMR_PORT"
echo -e "${BLUE}Debug:${NC}         $DEBUG_MODE"
echo

# =============================================================================
# Pre-flight Checks
# =============================================================================

log_header "Pre-flight Checks"

if ! command -v node &>/dev/null; then
    log_error "Node.js not found. Install Node.js 18+"
    exit 1
fi
log_success "Node.js $(node --version)"

if ! command -v npm &>/dev/null; then
    log_error "npm not found"
    exit 1
fi
log_success "npm $(npm --version)"

PYTHON_ENV_TYPE=""
if command -v conda &>/dev/null; then
    log_success "Conda $(conda --version | cut -d' ' -f2)"
    PYTHON_ENV_TYPE="conda"
elif command -v python3 &>/dev/null; then
    log_success "Python3 $(python3 --version | cut -d' ' -f2)"
    PYTHON_ENV_TYPE="venv"
else
    log_warn "Neither conda nor python3 found. Python backend will be skipped."
    RUN_BACKEND=false
fi

if [ ! -d "$PROJECT_ROOT/node_modules" ]; then
    log_warn "node_modules not found. Installing..."
    cd "$PROJECT_ROOT"
    npm install
fi
log_success "Node dependencies ready"

# =============================================================================
# Port Cleanup
# =============================================================================

log_header "Port Management"

for port in "$FRONTEND_PORT" "$BACKEND_PORT" "$HMR_PORT"; do
    if is_port_in_use "$port"; then
        log_warn "Port $port in use — clearing..."
        kill_port "$port"
    else
        log_success "Port $port free"
    fi
done

# =============================================================================
# Linux Sandbox Fix
# =============================================================================

log_header "Linux Sandbox"

if [ -f /proc/sys/kernel/unprivileged_userns_clone ]; then
    userns_clone=$(cat /proc/sys/kernel/unprivileged_userns_clone 2>/dev/null || echo "0")
    if [ "$userns_clone" = "0" ]; then
        log_warn "Unprivileged user namespaces disabled. Enabling..."
        sudo sysctl -w kernel.unprivileged_userns_clone=1 2>/dev/null && {
            log_success "kernel.unprivileged_userns_clone=1 set"
        } || {
            log_warn "Could not set sysctl. Forcing --no-sandbox."
            NO_SANDBOX=true
        }
    else
        log_success "Unprivileged user namespaces enabled"
    fi
fi

# Always enable no-sandbox for safety on Linux
NO_SANDBOX=true
export ELECTRON_NO_SANDBOX=1
export ELECTRON_DISABLE_SANDBOX=1
log_success "Sandbox: disabled (Linux compatibility)"

# =============================================================================
# Start Backend (Python NLP Sidecar)
# =============================================================================

if [ "$RUN_BACKEND" = true ]; then
    log_header "Starting Python NLP Backend"

    PYTHON_EXEC=""
    ACTIVATED=false

    if [ "$PYTHON_ENV_TYPE" = "conda" ]; then
        if conda env list 2>/dev/null | grep -q "^$CONDA_ENV_NAME "; then
            eval "$(conda shell.bash hook)"
            conda activate "$CONDA_ENV_NAME"
            PYTHON_EXEC="python"
            ACTIVATED=true
            log_success "Activated conda env: $CONDA_DEFAULT_ENV"
        else
            log_warn "Conda env '$CONDA_ENV_NAME' not found. Falling back to .venv..."
            PYTHON_ENV_TYPE="venv"
        fi
    fi

    if [ "$PYTHON_ENV_TYPE" = "venv" ] && [ "$ACTIVATED" = false ]; then
        VENV_DIR="$PROJECT_ROOT/.venv"
        if [ ! -d "$VENV_DIR" ]; then
            log_info "Creating Python virtual environment (.venv)..."
            python3 -m venv "$VENV_DIR"
            log_success "Virtual environment created"
        fi
        source "$VENV_DIR/bin/activate"
        PYTHON_EXEC="python"
        ACTIVATED=true
        log_success "Activated .venv: $VIRTUAL_ENV"

        if ! "$PYTHON_EXEC" -c "import fastapi" &>/dev/null; then
            log_info "Installing Python dependencies (first run, may take a few minutes)..."
            "$PYTHON_EXEC" -m pip install --quiet --upgrade pip
            "$PYTHON_EXEC" -m pip install --quiet -r "$PYTHON_DIR/requirements.txt"
            "$PYTHON_EXEC" -m spacy download en_core_web_sm --quiet 2>/dev/null || true
            log_success "Python dependencies installed"
        fi
    fi

    if [ "$ACTIVATED" = false ]; then
        log_warn "Could not activate a Python environment. Backend skipped."
        RUN_BACKEND=false
    fi

    if [ "$RUN_BACKEND" = true ]; then
        UVICORN_ARGS=("main:app" "--host" "127.0.0.1" "--port" "$BACKEND_PORT")
        if [ "$DEBUG_MODE" = true ]; then
            UVICORN_ARGS+=("--reload" "--log-level" "debug")
        else
            UVICORN_ARGS+=("--log-level" "info")
        fi

        cd "$PYTHON_DIR"
        log_info "Starting uvicorn on port $BACKEND_PORT..."
        $PYTHON_EXEC -m uvicorn "${UVICORN_ARGS[@]}" &
        BACKEND_PID=$!

        log_info "Waiting for backend to initialize..."
        for i in {1..30}; do
            if curl -s "http://127.0.0.1:$BACKEND_PORT/health" &>/dev/null; then
                log_success "Backend ready at http://127.0.0.1:$BACKEND_PORT"
                break
            fi
            sleep 1
            if [ $i -eq 30 ]; then
                log_warn "Backend health check timeout (may still be loading models)"
            fi
        done

        cd "$PROJECT_ROOT"
    fi
fi

# =============================================================================
# Start Frontend (Electron + Vite)
# =============================================================================

if [ "$RUN_FRONTEND" = true ]; then
    log_header "Starting Electron Frontend"

    cd "$PROJECT_ROOT"

    export VITE_DEV_SERVER_PORT=$FRONTEND_PORT
    export VITE_NLP_BACKEND_URL="http://127.0.0.1:$BACKEND_PORT"

    if [ "$DEBUG_MODE" = true ]; then
        export ELECTRON_ENABLE_LOGGING=1
        export DEBUG="electron:*"
    fi

    if [ "$DEV_MODE" = true ]; then
        log_info "Starting in DEV mode with HMR on port $HMR_PORT..."
        npm run dev:linux &
    else
        log_info "Starting in production mode..."
        npm run start &
    fi
    FRONTEND_PID=$!

    log_success "Frontend starting on http://localhost:$FRONTEND_PORT"
fi

# =============================================================================
# Running Summary
# =============================================================================

log_header "Services Running"

echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                   All Services Started                      ║${NC}"
echo -e "${GREEN}╠══════════════════════════════════════════════════════════════╣${NC}"

if [ "$RUN_FRONTEND" = true ]; then
    echo -e "${GREEN}║${NC}  Frontend:  ${CYAN}http://localhost:$FRONTEND_PORT${NC}                    ${GREEN}║${NC}"
fi

if [ "$RUN_BACKEND" = true ]; then
    echo -e "${GREEN}║${NC}  Backend:   ${CYAN}http://127.0.0.1:$BACKEND_PORT${NC}                     ${GREEN}║${NC}"
    echo -e "${GREEN}║${NC}  API Docs:  ${CYAN}http://127.0.0.1:$BACKEND_PORT/docs${NC}                ${GREEN}║${NC}"
fi

echo -e "${GREEN}╠══════════════════════════════════════════════════════════════╣${NC}"
echo -e "${GREEN}║${NC}  Press ${YELLOW}Ctrl+C${NC} to stop all services                        ${GREEN}║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo

wait
