# Installation Guide

## System Requirements

| Requirement | Minimum | Recommended |
|-------------|---------|-------------|
| OS | Linux Ubuntu 20.04+, Windows 10, macOS 12+ | Ubuntu 22.04 / macOS 14 |
| RAM | 4 GB | 8+ GB (NLP models can be large) |
| Disk | 5 GB free | 10+ GB (models cached locally) |
| Node.js | 18.0.0 | 20 LTS |
| Python | 3.10 | 3.11 |
| GPU | None required | NVIDIA CUDA or Apple Silicon (faster NLP) |

## Step 1: Install Node.js

The app requires Node.js 18+. The recommended approach is [nvm](https://github.com/nvm-sh/nvm):

```bash
# Install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

# Reload shell, then:
nvm install 20
nvm use 20
node --version   # should print v20.x.x
```

Or install from [nodejs.org](https://nodejs.org) directly.

## Step 2: Install Miniconda

The Python NLP sidecar requires conda for environment management.

```bash
# Linux
wget https://repo.anaconda.com/miniconda/Miniconda3-latest-Linux-x86_64.sh
bash Miniconda3-latest-Linux-x86_64.sh

# macOS (Intel)
wget https://repo.anaconda.com/miniconda/Miniconda3-latest-MacOSX-x86_64.sh
bash Miniconda3-latest-MacOSX-x86_64.sh

# macOS (Apple Silicon)
wget https://repo.anaconda.com/miniconda/Miniconda3-latest-MacOSX-arm64.sh
bash Miniconda3-latest-MacOSX-arm64.sh
```

Restart your terminal after installation, then verify: `conda --version`

## Step 3: Clone and Install

```bash
git clone https://github.com/sanchez314c/resume-builder.git
cd resume-builder
npm install
```

## Step 4: Set Up Python Environment

```bash
./scripts/setup-conda.sh
```

This script:

1. Creates a conda environment named `resume-builder` with Python 3.11
2. Installs all packages from `src/python/requirements.txt`
3. Downloads the spaCy language model (`en_core_web_sm`)

**This takes 3-10 minutes** depending on your internet connection. The ML models (PyTorch, Transformers) are large.

To verify the environment was created:

```bash
conda env list   # 'resume-builder' should appear
```

### Python Dependencies Summary

| Package | Version | Purpose |
|---------|---------|---------|
| fastapi | >=0.109 | HTTP API server |
| uvicorn | >=0.27 | ASGI server |
| spacy | >=3.7 | Named Entity Recognition |
| transformers | >=4.36 | BERT sentiment analysis |
| sentence-transformers | >=2.2 | Semantic embeddings for job matching |
| torch | >=2.1 | ML runtime (CUDA/MPS/CPU) |
| bertopic | >=0.16 | Topic modeling |
| hdbscan | >=0.8 | Clustering for BERTopic |
| umap-learn | >=0.5 | Dimensionality reduction |
| pandas | >=2.1 | Data processing |
| pydantic | >=2.5 | Data validation |
| loguru | >=0.7 | Structured logging |

## Step 5: Run the App

```bash
./run-source-linux.sh
```

See [QUICK_START.md](QUICK_START.md) for usage, or [DEVELOPMENT.md](DEVELOPMENT.md) for developer setup.

---

## Platform-Specific Notes

### Linux

**Electron sandbox**: Some Linux kernels disable unprivileged user namespaces, which Electron requires. The launcher auto-fixes this:

```bash
# The launcher tries this automatically:
sudo sysctl -w kernel.unprivileged_userns_clone=1

# If that fails (no sudo), use:
./run-source-linux.sh --no-sandbox
```

To make the fix permanent, add to `/etc/sysctl.conf`:
```
kernel.unprivileged_userns_clone=1
```

**Required system packages**:
```bash
sudo apt install lsof curl git build-essential
```

### macOS

No special setup needed beyond Node.js and Conda. The Python sidecar will use MPS (Metal Performance Shaders) automatically on Apple Silicon for faster NLP processing.

If you see Gatekeeper warnings on first launch:
```bash
xattr -cr /path/to/Resume\ Builder.app
```

### Windows

Use PowerShell or Git Bash. The `run-source-linux.sh` launcher is Linux/macOS only. On Windows, start the two processes manually:

**Terminal 1 — Python sidecar:**
```powershell
conda activate resume-builder
cd src\python
python run.py
```

**Terminal 2 — Electron:**
```powershell
npm run dev
```

Or build the packaged installer:
```bash
npm run build:win
```

---

## GPU Acceleration

The Python sidecar auto-detects the best available device. No configuration needed.

**NVIDIA GPU (CUDA)**:

Ensure CUDA toolkit 11.8+ is installed. The PyTorch install from `requirements.txt` includes CUDA support. Verify:

```bash
conda activate resume-builder
python -c "import torch; print(torch.cuda.is_available())"
```

**Apple Silicon (MPS)**:

No extra setup. PyTorch 2.1+ supports MPS out of the box. Verify:

```bash
conda activate resume-builder
python -c "import torch; print(torch.backends.mps.is_available())"
```

---

## Model Download Sizes

NLP models are downloaded on first use and cached locally:

| Model | Size | Location |
|-------|------|----------|
| spaCy `en_core_web_sm` | ~50 MB | conda env site-packages |
| `all-MiniLM-L6-v2` (sentence-transformers) | ~90 MB | HuggingFace cache |
| `distilbert-base-uncased-finetuned-sst-2-english` | ~250 MB | HuggingFace cache |
| BERTopic (no separate download — uses above) | — | — |

Cache location:

- Linux: `~/.cache/resume-builder/models/`
- macOS: `~/Library/Caches/resume-builder/models/`
- Windows: `%LOCALAPPDATA%/resume-builder/cache/models/`

Override with `RESUME_BUILDER_CACHE_DIR` env var.

---

## Updating

```bash
git pull
npm install           # update Node deps if package.json changed
./scripts/setup-conda.sh   # update Python deps if requirements.txt changed
```

---

## Uninstalling

```bash
# Remove conda environment
conda env remove -n resume-builder

# Remove model cache
rm -rf ~/.cache/resume-builder   # Linux
rm -rf ~/Library/Caches/resume-builder   # macOS

# Remove the repo
rm -rf /path/to/resume-builder
```
