#!/bin/bash
#
# Resume Builder - macOS Source Runner v1.0.0
#
# Launches both the Electron frontend and Python NLP sidecar
# with proper port management and conda activation.
#
# Usage:
#   ./run-source-mac.sh [options]
#
# Options:
#   --dev             Run in development mode (HMR enabled)
#   --frontend-only   Only start the Electron frontend
#   --backend-only    Only start the Python NLP sidecar
#   --debug           Enable debug mode
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
KILL_ONLY=false
STATUS_ONLY=false

# =============================================================================
# Argument Parsing
# =============================================================================

while [[ $# -gt 0 ]]; do
    case $1 in
        --dev) DEV_MODE=true; shift ;;
        --frontend-only) RUN_BACKEND=false; shift ;;
        --backend-only) RUN_FRONTEND=false; shift ;;
        --debug) DEBUG_MODE=true; shift ;;
        --kill) KILL_ONLY=true; shift ;;
        --status) STATUS_ONLY=true; shift ;;
        -h|--help)
            echo "Usage: $0 [--dev] [--frontend-only] [--backend-only] [--debug] [--kill] [--status]"
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"; exit 1 ;;
    esac
done

# =============================================================================
# Utility Functions
# =============================================================================

log_info()    { echo -e "${CYAN}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[OK]${NC} $1"; }
log_warn()    { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error()   { echo -e "${RED}[ERROR]${NC} $1"; }

log_header() {
    echo
    echo -e "${MAGENTA}================================================================${NC}"
    echo -e "${MAGENTA}  $1${NC}"
    echo -e "${MAGENTA}================================================================${NC}"
    echo
}

is_port_in_use() {
    lsof -i :"$1" &>/dev/null
}

get_pid_on_port() {
    lsof -t -i :"$1" 2>/dev/null | head -1
}

kill_port() {
    local port=$1
    local pid
    pid=$(get_pid_on_port "$port")
    if [ -n "$pid" ]; then
        log_warn "Killing PID $pid on port $port..."
        kill -9 "$pid" 2>/dev/null || true
        sleep 0.5
        is_port_in_use "$port" && log_error "Failed to free port $port" || log_success "Port $port freed"
    fi
}

show_status() {
    log_header "Port Status"
    for label_port in "Frontend:$FRONTEND_PORT" "Backend:$BACKEND_PORT" "HMR:$HMR_PORT"; do
        label="${label_port%%:*}"; port="${label_port##*:}"
        echo -e "${BLUE}${label} Port:${NC} $port"
        if is_port_in_use "$port"; then
            local pid; pid=$(get_pid_on_port "$port")
            echo -e "  ${YELLOW}IN USE${NC} by PID $pid"
        else
            echo -e "  ${GREEN}FREE${NC}"
        fi
    done
}

# =============================================================================
# Early Exits
# =============================================================================

[ "$STATUS_ONLY" = true ] && { show_status; exit 0; }

if [ "$KILL_ONLY" = true ]; then
    log_header "Killing Processes"
    kill_port "$FRONTEND_PORT"; kill_port "$BACKEND_PORT"; kill_port "$HMR_PORT"
    exit 0
fi

# =============================================================================
# Cleanup on Exit
# =============================================================================

cleanup() {
    log_info "Shutting down..."
    jobs -p | xargs -r kill 2>/dev/null || true
    kill_port "$FRONTEND_PORT" 2>/dev/null || true
    kill_port "$BACKEND_PORT" 2>/dev/null || true
    exit 0
}
trap cleanup SIGINT SIGTERM

# =============================================================================
# Pre-flight Checks
# =============================================================================

log_header "Pre-flight Checks"

command -v node &>/dev/null && log_success "Node.js $(node --version)" || { log_error "Node.js not found"; exit 1; }
command -v npm &>/dev/null && log_success "npm $(npm --version)" || { log_error "npm not found"; exit 1; }
command -v conda &>/dev/null && log_success "Conda $(conda --version | cut -d' ' -f2)" || { log_warn "Conda not found. Skipping backend."; RUN_BACKEND=false; }

[ ! -d "$PROJECT_ROOT/node_modules" ] && { log_warn "Installing node_modules..."; cd "$PROJECT_ROOT" && npm install; }
log_success "Node dependencies ready"

# =============================================================================
# Port Cleanup
# =============================================================================

log_header "Port Management"
for port in "$FRONTEND_PORT" "$BACKEND_PORT" "$HMR_PORT"; do
    is_port_in_use "$port" && kill_port "$port" || log_success "Port $port free"
done

# =============================================================================
# Start Backend
# =============================================================================

if [ "$RUN_BACKEND" = true ]; then
    log_header "Starting Python NLP Backend"

    if conda env list 2>/dev/null | grep -q "^$CONDA_ENV_NAME "; then
        eval "$(conda shell.bash hook)"
        conda activate "$CONDA_ENV_NAME"
        log_success "Conda env: $CONDA_DEFAULT_ENV"
    else
        log_warn "Conda env '$CONDA_ENV_NAME' not found. Run ./scripts/setup-conda.sh"; RUN_BACKEND=false
    fi

    if [ "$RUN_BACKEND" = true ]; then
        ARGS="main:app --host 127.0.0.1 --port $BACKEND_PORT"
        [ "$DEBUG_MODE" = true ] && ARGS="$ARGS --reload --log-level debug" || ARGS="$ARGS --log-level info"
        cd "$PYTHON_DIR"
        python -m uvicorn $ARGS &
        BACKEND_PID=$!
        log_info "Waiting for backend..."
        for i in {1..30}; do
            curl -s "http://127.0.0.1:$BACKEND_PORT/health" &>/dev/null && { log_success "Backend ready"; break; }
            sleep 1
            [ $i -eq 30 ] && log_warn "Backend health check timeout"
        done
        cd "$PROJECT_ROOT"
    fi
fi

# =============================================================================
# Start Frontend
# =============================================================================

if [ "$RUN_FRONTEND" = true ]; then
    log_header "Starting Electron Frontend"
    cd "$PROJECT_ROOT"
    export VITE_DEV_SERVER_PORT=$FRONTEND_PORT
    export VITE_NLP_BACKEND_URL="http://127.0.0.1:$BACKEND_PORT"
    [ "$DEBUG_MODE" = true ] && export ELECTRON_ENABLE_LOGGING=1

    if [ "$DEV_MODE" = true ]; then
        npm run dev &
    else
        npm run start &
    fi
    FRONTEND_PID=$!
    log_success "Frontend starting on http://localhost:$FRONTEND_PORT"
fi

# =============================================================================
# Running Summary
# =============================================================================

log_header "Services Running"
echo -e "${GREEN}  Frontend:  http://localhost:$FRONTEND_PORT${NC}"
[ "$RUN_BACKEND" = true ] && echo -e "${GREEN}  Backend:   http://127.0.0.1:$BACKEND_PORT${NC}"
echo
echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"
echo

wait
