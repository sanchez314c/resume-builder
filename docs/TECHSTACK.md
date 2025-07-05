# Tech Stack

## Resume Builder v1.0.0

---

## Core Technologies

### Desktop Layer
- **Electron 28+** — cross-platform desktop runtime
- **electron-vite 2.0** — Vite-powered build system for Electron

### Frontend (Renderer Process)
- **React 18** — UI component framework
- **TypeScript 5.3** — type-safe JavaScript
- **Tailwind CSS 3.3** — utility-first styling
- **shadcn/ui** — accessible component primitives
- **Zustand 4.4** — lightweight state management
- **TanStack Query 5** — async data fetching and caching
- **Recharts 2.10** — chart and visualization library
- **Lucide React** — icon set
- **pdf-lib 1.17** — PDF generation

### Main Process
- **Node.js 24** (via NVM, see `.nvmrc`)
- **better-sqlite3 9.2** — synchronous SQLite bindings
- **drizzle-orm 0.29** — type-safe ORM layer
- **uuid 9** — unique ID generation

### Python NLP Sidecar
- **Python 3.11** (via conda, see `.python-version`)
- **FastAPI** — async HTTP framework
- **uvicorn** — ASGI server
- **spaCy** — NLP pipeline (en_core_web_trf)
- **Sentence Transformers** — embeddings (all-MiniLM-L6-v2)
- **Transformers (HuggingFace)** — BERT, DistilBERT
- **BERTopic** — topic modeling
- **VADER** — sentiment analysis
- **Pydantic** — data validation

### Build & Tooling
- **Vite 5** — bundler and dev server
- **electron-builder 24.9** — packaging for all platforms
- **postcss 8.4** — CSS processing
- **autoprefixer** — CSS vendor prefixes

### Testing
- **Vitest 1.0** — unit and integration testing
- **@vitest/coverage-v8** — code coverage
- **@testing-library/react 14** — React component testing
- **Playwright 1.40** — end-to-end browser testing

### Code Quality
- **ESLint 8.55** — linting
- **@typescript-eslint** — TypeScript ESLint rules
- **Prettier 3.1** — code formatting
- **prettier-plugin-tailwindcss** — Tailwind class sorting

---

## Port Assignments

| Service | Port |
|---------|------|
| Vite dev server (frontend) | 63263 |
| Python FastAPI sidecar | 57964 |
| Vite HMR WebSocket | 50026 |

---

## Platform Targets

| Platform | Output Formats |
|----------|----------------|
| Linux | AppImage, .deb |
| Windows | NSIS installer, portable |
| macOS | DMG, ZIP |

---

## Communication Architecture

```
Renderer (React) <--> Preload (contextBridge) <--> Main (Node)
                                                        |
                                              IPC Handlers
                                                        |
                                           Python Bridge (spawn/HTTP)
                                                        |
                                          FastAPI sidecar :57964
```

### IPC Security Model
- `nodeIntegration: false` in all renderer windows
- `contextIsolation: true` always enabled
- All Node.js APIs exposed only via `contextBridge` in preload
- Sandbox disabled on Linux only (via `--no-sandbox` flag)

---

## Conda Environment

The Python sidecar runs in a dedicated conda environment named `resume-builder`.

Setup:
```bash
./scripts/setup-conda.sh
# or
conda create -n resume-builder python=3.11
conda activate resume-builder
pip install -r src/python/requirements.txt
```
