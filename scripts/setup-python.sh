#!/bin/bash
#
# Setup Script for Resume Builder Python NLP Sidecar
#
# Creates virtual environment, installs dependencies, and downloads
# required NLP models.
#
# Usage:
#   ./scripts/setup-python.sh [--full]
#
# Options:
#   --full    Install full spaCy model (en_core_web_trf) for accuracy
#             Default uses en_core_web_sm for speed
#

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
PYTHON_DIR="$PROJECT_ROOT/src/python"

# Default to small model
SPACY_MODEL="en_core_web_sm"

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --full)
            SPACY_MODEL="en_core_web_trf"
            shift
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            exit 1
            ;;
    esac
done

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Resume Builder Python NLP Sidecar Setup${NC}"
echo -e "${BLUE}========================================${NC}"
echo

# Check Python version
echo -e "${YELLOW}Checking Python version...${NC}"
if command -v python3 &> /dev/null; then
    PYTHON_CMD="python3"
elif command -v python &> /dev/null; then
    PYTHON_CMD="python"
else
    echo -e "${RED}ERROR: Python not found. Please install Python 3.10+${NC}"
    exit 1
fi

PYTHON_VERSION=$($PYTHON_CMD -c 'import sys; print(f"{sys.version_info.major}.{sys.version_info.minor}")')
echo -e "${GREEN}Found Python $PYTHON_VERSION${NC}"

# Check minimum version
MIN_VERSION="3.10"
if [ "$(printf '%s\n' "$MIN_VERSION" "$PYTHON_VERSION" | sort -V | head -n1)" != "$MIN_VERSION" ]; then
    echo -e "${RED}ERROR: Python $MIN_VERSION+ required, found $PYTHON_VERSION${NC}"
    exit 1
fi

# Check for conda
if command -v conda &> /dev/null; then
    echo -e "${GREEN}Conda detected. Using conda environment.${NC}"
    USE_CONDA=true
else
    USE_CONDA=false
fi

# Navigate to Python directory
cd "$PYTHON_DIR"

# Create virtual environment
VENV_DIR="$PYTHON_DIR/.venv"
CONDA_ENV_NAME="resume-builder-nlp"

if [ "$USE_CONDA" = true ]; then
    echo
    echo -e "${YELLOW}Setting up Conda environment...${NC}"

    # Check if environment exists
    if conda env list | grep -q "$CONDA_ENV_NAME"; then
        echo -e "${YELLOW}Conda environment '$CONDA_ENV_NAME' already exists.${NC}"
        echo -e "${YELLOW}Activating existing environment...${NC}"
    else
        echo -e "${YELLOW}Creating new Conda environment '$CONDA_ENV_NAME'...${NC}"
        conda create -n "$CONDA_ENV_NAME" python=$PYTHON_VERSION -y
    fi

    # Activate environment
    eval "$(conda shell.bash hook)"
    conda activate "$CONDA_ENV_NAME"

    PYTHON_CMD="python"
    PIP_CMD="pip"
else
    echo
    echo -e "${YELLOW}Setting up virtual environment...${NC}"

    if [ -d "$VENV_DIR" ]; then
        echo -e "${YELLOW}Virtual environment already exists at $VENV_DIR${NC}"
    else
        echo -e "${YELLOW}Creating virtual environment at $VENV_DIR...${NC}"
        $PYTHON_CMD -m venv "$VENV_DIR"
    fi

    # Activate virtual environment
    source "$VENV_DIR/bin/activate"

    PYTHON_CMD="python"
    PIP_CMD="pip"
fi

# Upgrade pip
echo
echo -e "${YELLOW}Upgrading pip...${NC}"
$PIP_CMD install --upgrade pip wheel setuptools

# Install requirements
echo
echo -e "${YELLOW}Installing Python dependencies...${NC}"
$PIP_CMD install -r requirements.txt

# Install spaCy model
echo
echo -e "${YELLOW}Downloading spaCy model: $SPACY_MODEL...${NC}"
$PYTHON_CMD -m spacy download "$SPACY_MODEL"

# Download NLTK data
echo
echo -e "${YELLOW}Downloading NLTK data...${NC}"
$PYTHON_CMD -c "
import nltk
import ssl
try:
    _create_unverified_https_context = ssl._create_unverified_context
except AttributeError:
    pass
else:
    ssl._create_default_https_context = _create_unverified_https_context

nltk.download('punkt', quiet=True)
nltk.download('stopwords', quiet=True)
nltk.download('wordnet', quiet=True)
nltk.download('averaged_perceptron_tagger', quiet=True)
print('NLTK data downloaded successfully')
"

# Verify installation
echo
echo -e "${YELLOW}Verifying installation...${NC}"
$PYTHON_CMD -c "
import sys
print(f'Python: {sys.version}')

import torch
print(f'PyTorch: {torch.__version__}')
if torch.cuda.is_available():
    print(f'CUDA: {torch.cuda.get_device_name(0)}')
elif hasattr(torch.backends, 'mps') and torch.backends.mps.is_available():
    print('MPS: Apple Silicon GPU available')
else:
    print('Device: CPU only')

import transformers
print(f'Transformers: {transformers.__version__}')

import sentence_transformers
print(f'Sentence Transformers: {sentence_transformers.__version__}')

import spacy
print(f'spaCy: {spacy.__version__}')

import fastapi
print(f'FastAPI: {fastapi.__version__}')

print()
print('All dependencies installed successfully!')
"

# Create run script shortcut
RUN_SCRIPT="$PROJECT_ROOT/run-nlp-server.sh"
cat > "$RUN_SCRIPT" << 'EOF'
#!/bin/bash
# Quick start script for NLP sidecar server

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PYTHON_DIR="$SCRIPT_DIR/src/python"

cd "$PYTHON_DIR"

# Activate environment
if [ -d ".venv" ]; then
    source .venv/bin/activate
elif command -v conda &> /dev/null; then
    eval "$(conda shell.bash hook)"
    conda activate resume-builder-nlp
fi

# Run server
python run.py "$@"
EOF
chmod +x "$RUN_SCRIPT"

echo
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Setup Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo
echo -e "To start the NLP server:"
echo -e "  ${BLUE}./run-nlp-server.sh${NC}"
echo
echo -e "Or manually:"
if [ "$USE_CONDA" = true ]; then
    echo -e "  ${BLUE}conda activate $CONDA_ENV_NAME${NC}"
else
    echo -e "  ${BLUE}source $VENV_DIR/bin/activate${NC}"
fi
echo -e "  ${BLUE}cd $PYTHON_DIR${NC}"
echo -e "  ${BLUE}python run.py${NC}"
echo
echo -e "Options:"
echo -e "  ${BLUE}--port 9000${NC}     Custom port"
echo -e "  ${BLUE}--debug${NC}         Enable debug mode"
echo -e "  ${BLUE}--preload${NC}       Preload models on startup"
echo
