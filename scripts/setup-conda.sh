#!/bin/bash
#
# Setup Script for Resume Builder - Conda Environment
#
# Creates a fully self-contained Conda environment for the NLP sidecar.
# This is the RECOMMENDED setup method.
#
# Usage:
#   ./scripts/setup-conda.sh [options]
#
# Options:
#   --full         Install full spaCy model (en_core_web_trf) for better accuracy
#   --gpu          Enable CUDA/GPU support (requires NVIDIA GPU)
#   --mps          Enable Apple Silicon MPS support (macOS M1/M2/M3)
#   --clean        Remove existing environment before creating
#   --update       Update existing environment instead of creating
#
# Requirements:
#   - Conda or Miniconda installed
#   - Internet connection for downloading packages
#

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Script paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
PYTHON_DIR="$PROJECT_ROOT/src/python"
ENV_FILE="$PYTHON_DIR/environment.yml"

# Environment name
ENV_NAME="resume-builder"

# Options
SPACY_MODEL="en_core_web_sm"
CLEAN=false
UPDATE=false
GPU_MODE=""

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --full)
            SPACY_MODEL="en_core_web_trf"
            shift
            ;;
        --gpu)
            GPU_MODE="cuda"
            shift
            ;;
        --mps)
            GPU_MODE="mps"
            shift
            ;;
        --clean)
            CLEAN=true
            shift
            ;;
        --update)
            UPDATE=true
            shift
            ;;
        -h|--help)
            echo "Usage: $0 [--full] [--gpu|--mps] [--clean] [--update]"
            echo
            echo "Options:"
            echo "  --full     Install full spaCy model (en_core_web_trf)"
            echo "  --gpu      Enable CUDA GPU support"
            echo "  --mps      Enable Apple Silicon MPS support"
            echo "  --clean    Remove existing environment first"
            echo "  --update   Update existing environment"
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            exit 1
            ;;
    esac
done

# Banner
echo -e "${CYAN}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║        Resume Builder - Conda Environment Setup              ║"
echo "║              Fully Self-Contained NLP Sidecar                ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Check for Conda
if ! command -v conda &> /dev/null; then
    echo -e "${RED}ERROR: Conda not found!${NC}"
    echo
    echo "Please install Miniconda or Anaconda first:"
    echo "  https://docs.conda.io/en/latest/miniconda.html"
    echo
    echo "Quick install (Linux):"
    echo "  wget https://repo.anaconda.com/miniconda/Miniconda3-latest-Linux-x86_64.sh"
    echo "  bash Miniconda3-latest-Linux-x86_64.sh"
    exit 1
fi

# Get conda info
CONDA_VERSION=$(conda --version 2>/dev/null | cut -d' ' -f2)
echo -e "${GREEN}✓ Conda found: version $CONDA_VERSION${NC}"

# Initialize conda for bash
eval "$(conda shell.bash hook)"

# Check if environment exists
ENV_EXISTS=false
if conda env list | grep -q "^$ENV_NAME "; then
    ENV_EXISTS=true
    echo -e "${YELLOW}⚠ Environment '$ENV_NAME' already exists${NC}"
fi

# Handle clean option
if [ "$CLEAN" = true ] && [ "$ENV_EXISTS" = true ]; then
    echo -e "${YELLOW}Removing existing environment...${NC}"
    conda deactivate 2>/dev/null || true
    conda env remove -n "$ENV_NAME" -y
    ENV_EXISTS=false
fi

# Create or update environment
if [ "$UPDATE" = true ] && [ "$ENV_EXISTS" = true ]; then
    echo
    echo -e "${BLUE}Updating existing environment from environment.yml...${NC}"
    conda env update -n "$ENV_NAME" -f "$ENV_FILE" --prune
elif [ "$ENV_EXISTS" = false ]; then
    echo
    echo -e "${BLUE}Creating new Conda environment from environment.yml...${NC}"
    echo -e "${YELLOW}This may take 5-10 minutes on first install...${NC}"
    conda env create -f "$ENV_FILE"
else
    echo -e "${GREEN}Using existing environment. Use --update to update packages.${NC}"
fi

# Activate environment
echo
echo -e "${BLUE}Activating environment...${NC}"
conda activate "$ENV_NAME"

# Verify activation
if [[ "$CONDA_DEFAULT_ENV" != "$ENV_NAME" ]]; then
    echo -e "${RED}ERROR: Failed to activate environment${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Environment activated: $CONDA_DEFAULT_ENV${NC}"

# GPU Configuration
echo
echo -e "${BLUE}Configuring compute device...${NC}"

if [ "$GPU_MODE" = "cuda" ]; then
    # Check CUDA availability
    python -c "import torch; assert torch.cuda.is_available(), 'CUDA not available'" 2>/dev/null
    if [ $? -eq 0 ]; then
        CUDA_DEVICE=$(python -c "import torch; print(torch.cuda.get_device_name(0))")
        echo -e "${GREEN}✓ CUDA GPU detected: $CUDA_DEVICE${NC}"
    else
        echo -e "${YELLOW}⚠ CUDA requested but not available. Falling back to CPU.${NC}"
    fi
elif [ "$GPU_MODE" = "mps" ]; then
    # Check MPS availability (Apple Silicon)
    python -c "import torch; assert torch.backends.mps.is_available(), 'MPS not available'" 2>/dev/null
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Apple Silicon MPS acceleration available${NC}"
    else
        echo -e "${YELLOW}⚠ MPS requested but not available. Falling back to CPU.${NC}"
    fi
else
    # Auto-detect
    if python -c "import torch; exit(0 if torch.cuda.is_available() else 1)" 2>/dev/null; then
        CUDA_DEVICE=$(python -c "import torch; print(torch.cuda.get_device_name(0))")
        echo -e "${GREEN}✓ Auto-detected CUDA GPU: $CUDA_DEVICE${NC}"
    elif python -c "import torch; exit(0 if torch.backends.mps.is_available() else 1)" 2>/dev/null; then
        echo -e "${GREEN}✓ Auto-detected Apple Silicon MPS${NC}"
    else
        echo -e "${YELLOW}ℹ Using CPU (no GPU detected)${NC}"
    fi
fi

# Download spaCy model
echo
echo -e "${BLUE}Downloading spaCy model: $SPACY_MODEL...${NC}"
python -m spacy download "$SPACY_MODEL" --quiet
echo -e "${GREEN}✓ spaCy model installed${NC}"

# Download NLTK data
echo
echo -e "${BLUE}Downloading NLTK data...${NC}"
python -c "
import nltk
import ssl
import os

# Handle SSL certificate issues
try:
    _create_unverified_https_context = ssl._create_unverified_context
except AttributeError:
    pass
else:
    ssl._create_default_https_context = _create_unverified_https_context

# Download required data
packages = ['punkt', 'stopwords', 'wordnet', 'averaged_perceptron_tagger', 'punkt_tab']
for pkg in packages:
    try:
        nltk.download(pkg, quiet=True)
    except Exception as e:
        print(f'Warning: Could not download {pkg}: {e}')

print('NLTK data downloaded')
"
echo -e "${GREEN}✓ NLTK data installed${NC}"

# Verify installation
echo
echo -e "${BLUE}Verifying installation...${NC}"
echo

python << 'VERIFY_EOF'
import sys

print(f"Python:              {sys.version.split()[0]}")

import torch
print(f"PyTorch:             {torch.__version__}")

# Device info
if torch.cuda.is_available():
    print(f"Compute Device:      CUDA ({torch.cuda.get_device_name(0)})")
elif hasattr(torch.backends, 'mps') and torch.backends.mps.is_available():
    print(f"Compute Device:      MPS (Apple Silicon)")
else:
    print(f"Compute Device:      CPU")

import transformers
print(f"Transformers:        {transformers.__version__}")

import sentence_transformers
print(f"Sentence-Transform:  {sentence_transformers.__version__}")

import spacy
print(f"spaCy:               {spacy.__version__}")

import sklearn
print(f"scikit-learn:        {sklearn.__version__}")

import fastapi
print(f"FastAPI:             {fastapi.__version__}")

try:
    import bertopic
    print(f"BERTopic:            {bertopic.__version__}")
except ImportError:
    print("BERTopic:            Not installed")

print()
print("✓ All core dependencies verified!")
VERIFY_EOF

# Create activation script
ACTIVATE_SCRIPT="$PROJECT_ROOT/activate-nlp.sh"
cat > "$ACTIVATE_SCRIPT" << EOF
#!/bin/bash
# Activate the Resume Builder Conda environment
eval "\$(conda shell.bash hook)"
conda activate $ENV_NAME
echo "Activated: \$CONDA_DEFAULT_ENV"
EOF
chmod +x "$ACTIVATE_SCRIPT"

# Create run script
RUN_SCRIPT="$PROJECT_ROOT/run-nlp-server.sh"
cat > "$RUN_SCRIPT" << 'EOF'
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
EOF
chmod +x "$RUN_SCRIPT"

# Summary
echo
echo -e "${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║                    Setup Complete!                           ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo
echo -e "${GREEN}Environment:${NC} $ENV_NAME"
echo -e "${GREEN}Location:${NC}    $(conda info --envs | grep "$ENV_NAME" | awk '{print $NF}')"
echo -e "${GREEN}spaCy Model:${NC} $SPACY_MODEL"
echo
echo -e "${BLUE}Quick Commands:${NC}"
echo
echo "  Activate environment:"
echo -e "    ${YELLOW}source ./activate-nlp.sh${NC}"
echo -e "    ${YELLOW}# or: conda activate $ENV_NAME${NC}"
echo
echo "  Start NLP server:"
echo -e "    ${YELLOW}./run-nlp-server.sh${NC}"
echo -e "    ${YELLOW}./run-nlp-server.sh --port 9000 --debug${NC}"
echo
echo "  Update environment:"
echo -e "    ${YELLOW}./scripts/setup-conda.sh --update${NC}"
echo
echo -e "${GREEN}The NLP sidecar is ready!${NC}"
echo
