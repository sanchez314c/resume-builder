#!/bin/bash
#
# Run the NLP sidecar server
#
# Usage:
#   ./run-nlp-server.sh [options]
#
# Options:
#   --port PORT    Server port (default: 8765)
#   --host HOST    Server host (default: 127.0.0.1)
#   --debug        Enable debug mode
#   --preload      Preload ML models on startup
#   --reload       Enable auto-reload (development)
#

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PYTHON_DIR="$SCRIPT_DIR/src/python"
ENV_NAME="resume-builder"

# Activate Conda environment
eval "$(conda shell.bash hook)"
conda activate "$ENV_NAME"

if [[ "$CONDA_DEFAULT_ENV" != "$ENV_NAME" ]]; then
    echo "ERROR: Failed to activate Conda environment '$ENV_NAME'"
    echo "Run ./scripts/setup-conda.sh first"
    exit 1
fi

# Change to Python directory
cd "$PYTHON_DIR"

# Run server
python run.py "$@"
