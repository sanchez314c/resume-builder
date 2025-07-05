# Development Guide

## Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | >= 18.0.0 | Electron + build tooling |
| npm | >= 9 (bundled with Node 18) | Package management |
| Miniconda or Anaconda | Any recent | Python environment management |
| Git | Any | Version control |

On Linux, you also need `lsof` installed (`apt install lsof`) for port management in the dev launcher.

## First-Time Setup

```bash
git clone https://github.com/sanchez314c/resume-builder.git
cd resume-builder

# Install Node dependencies
npm install

# Set up Python conda environment (one-time, takes a few minutes)
./scripts/setup-conda.sh
```

`setup-conda.sh` creates a conda env named `resume-builder` and installs all Python packages from `src/python/requirements.txt`, then downloads the spaCy language model (`en_core_web_sm`).

## Running in Development

```bash
# Start both Electron frontend and Python NLP sidecar (recommended)
./run-source-linux.sh

# Linux sandbox fix if you get Electron permission errors
./run-source-linux.sh --no-sandbox

# Frontend only (no NLP features)
./run-source-linux.sh --frontend-only

# Python sidecar only
./run-source-linux.sh --backend-only

# Debug mode (verbose logging, auto-reload)
./run-source-linux.sh --debug

# Check what's running / port status
./run-source-linux.sh --status

# Kill all running instances
./run-source-linux.sh --kill
```

The launcher handles:
- Conda environment activation
- Port conflict resolution (frontend: 53291, backend: 49372)
- Linux sandbox fix (`kernel.unprivileged_userns_clone`)
- Graceful shutdown on Ctrl+C

## npm Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | electron-vite dev mode (HMR) |
| `npm run dev:linux` | Same with `ELECTRON_DISABLE_SANDBOX=1` |
| `npm run build` | Production build for current platform |
| `npm run build:linux` | AppImage + .deb |
| `npm run build:win` | NSIS installer + portable |
| `npm run build:mac` | DMG + ZIP |
| `npm run build:all` | All platforms |
| `npm run lint` | ESLint on all `.ts`/`.tsx` |
| `npm run lint:fix` | ESLint with auto-fix |
| `npm run format` | Prettier on all source files |
| `npm run format:check` | Prettier check (no write) |
| `npm run test` | Vitest in watch mode |
| `npm run test:run` | Vitest single run (CI) |
| `npm run test:coverage` | Coverage report |
| `npm run test:e2e` | Playwright E2E tests |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run clean` | Remove `dist/`, `out/`, `node_modules/.cache/` |

## Project Structure Highlights

```
src/
├── main/               # Electron main process (Node.js)
│   ├── index.ts        # App lifecycle, window creation, security policy
│   ├── ipc-handlers.ts # All ipcMain.handle() registrations
│   ├── python-bridge.ts# Spawns Python sidecar, health-checks, HTTP client
│   └── file-service.ts # Native file dialog + filesystem ops
├── preload/
│   └── index.ts        # contextBridge — only bridge between renderer and main
├── renderer/           # React app (runs in Chromium)
│   ├── pages/          # ImportPage, AnalysisPage, JobsPage, ResumePage, ExportPage
│   ├── components/ui/  # shadcn/ui primitives
│   ├── hooks/          # use-file-import, use-nlp-analysis, use-resume-generator
│   ├── stores/         # Zustand: app-store (persisted), log-store (ephemeral)
│   └── services/api.ts # Renderer-side IPC wrappers
├── common/
│   ├── types.ts        # Shared TypeScript interfaces
│   ├── api-types.ts    # IPC request/response shapes
│   └── constants.ts    # IPC channel strings, skill patterns, config
└── python/             # FastAPI NLP sidecar
    ├── main.py         # FastAPI app, all route handlers
    ├── run.py          # CLI entry (uvicorn, argparse)
    ├── config.py       # Pydantic Settings, device detection, logging
    ├── models.py       # Pydantic request/response models
    ├── nlp/            # achievement_detector, topic_modeler, job_matcher
    └── utils/          # text_processing, device manager
```

## Code Standards

### TypeScript

- Strict mode enforced. No implicit `any`.
- All IPC channel strings must come from `src/common/constants.ts`. Never use string literals in `ipcMain.handle` or `ipcRenderer.invoke`.
- Functions under 50 lines. Files under 800 lines.
- `npm run lint` must pass before committing.

### Python

- PEP 8, with type annotations required on all function signatures.
- Pydantic models for all data that crosses process boundaries.
- MPS device: always `"mps"`, never `"mps:0"` (will crash).
- Lazy model loading — models load on first request, not at server start.

## Debugging

### Renderer Process

Open DevTools from the Electron window: `Ctrl+Shift+I`.

### Main Process

Start with `--debug` flag for verbose Electron logging:

```bash
./run-source-linux.sh --debug
```

Or attach a Node.js debugger:

```bash
ELECTRON_ENABLE_LOGGING=1 npm run dev
# then in Chrome: chrome://inspect
```

### Python Sidecar

The sidecar logs to stderr (captured by the launcher) and to a rotating log file:

- Linux: `~/.cache/resume-builder/logs/nlp-sidecar.log`
- macOS: `~/Library/Caches/resume-builder/logs/nlp-sidecar.log`
- Windows: `%LOCALAPPDATA%/resume-builder/cache/logs/nlp-sidecar.log`

Run standalone for isolated debugging:

```bash
conda activate resume-builder
cd src/python
python run.py --debug --log-level DEBUG

# Optional: preload models on startup (avoids first-request lag)
python run.py --preload
```

FastAPI auto-docs available at `http://127.0.0.1:8765/docs` when running standalone.

## Environment Variables

Create `.env` in the project root for local overrides:

```env
# Python sidecar config (prefixed RESUME_BUILDER_)
RESUME_BUILDER_HOST=127.0.0.1
RESUME_BUILDER_PORT=8765
RESUME_BUILDER_DEBUG=false
RESUME_BUILDER_LOG_LEVEL=INFO

# spaCy model (en_core_web_trf for higher accuracy, slower)
RESUME_BUILDER_SPACY_MODEL=en_core_web_sm

# Claude API (optional — for content enhancement feature)
RESUME_BUILDER_ANTHROPIC_API_KEY=sk-ant-...

# Model cache location
RESUME_BUILDER_CACHE_DIR=/path/to/cache
```

## Adding a New IPC Channel

1. Add the channel constant to `src/common/constants.ts`
2. Add the TypeScript types to `src/common/api-types.ts`
3. Add the handler to `src/main/ipc-handlers.ts`
4. Expose the method in `src/preload/index.ts` via `contextBridge`
5. Add the renderer-side call to `src/renderer/services/api.ts`

## Running the Python Sidecar Standalone

Useful for testing NLP endpoints without running Electron:

```bash
conda activate resume-builder
cd src/python

# Default port 8765
python run.py

# Custom port, debug mode
python run.py --port 9000 --debug

# Preload all models on startup
python run.py --preload

# Check API docs
open http://127.0.0.1:8765/docs
```

## Testing

```bash
# Unit tests (Vitest)
npm run test:run

# With coverage
npm run test:coverage

# E2E tests (Playwright — requires Electron to be built or running)
npm run test:e2e

# Python tests
conda activate resume-builder
cd src/python
pytest tests/ -v
```

Unit tests live in `tests/unit/`. Parsers and NLP utilities should have unit coverage. E2E tests cover the full import-to-export flow.

## Linux Sandbox Issues

If Electron won't start with a `credentials.cc: Permission denied` error:

```bash
# Option 1: enable user namespaces (persistent)
sudo sysctl -w kernel.unprivileged_userns_clone=1

# Option 2: use the no-sandbox flag
./run-source-linux.sh --no-sandbox
```

The launcher handles this automatically and will fall back to `--no-sandbox` if the sysctl write fails.
