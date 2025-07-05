# Resume Builder

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D18-brightgreen)](https://nodejs.org)
[![Electron](https://img.shields.io/badge/Electron-28-blue)](https://electronjs.org)
[![Python](https://img.shields.io/badge/Python-3.11-blue)](https://python.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://typescriptlang.org)

An AI-powered Electron desktop application that transforms AI conversation exports (ChatGPT, Claude) into professional resumes. Import your conversation history, run NLP analysis to extract skills and achievements, match against job titles, and export polished PDF or DOCX resumes.

## What It Does

1. **Import** ChatGPT or Claude conversation JSON exports (including the tree-structured ChatGPT format)
2. **Analyze** using a Python NLP sidecar (spaCy, BERT, BERTopic) running locally — no data leaves your machine
3. **Review** extracted skills, achievements, topic clusters, and job matches in an analytics dashboard
4. **Build** a resume by editing NLP-extracted content organized into sections
5. **Export** to PDF (via pdf-lib) or DOCX, saved to your Documents folder

## Quick Start

```bash
git clone https://github.com/sanchez314c/resume-builder.git
cd resume-builder
npm install
./scripts/setup-conda.sh   # one-time Python env setup
./run-source-linux.sh       # starts both Electron + Python sidecar
```

See [docs/QUICK_START.md](docs/QUICK_START.md) for the full zero-to-running guide.

## Installation

Full setup instructions including Python environment, spaCy model downloads, and platform-specific notes are in [docs/INSTALLATION.md](docs/INSTALLATION.md).

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Desktop | Electron 28 |
| UI | React 18 + TypeScript + Tailwind CSS |
| State | Zustand + TanStack Query |
| NLP | Python FastAPI sidecar (spaCy, Transformers, BERTopic) |
| PDF | pdf-lib |
| Charts | Recharts |
| Database | SQLite + Drizzle ORM |
| Build | electron-vite |
| Tests | Vitest + Playwright |

## Project Structure

```
resume-builder/
├── src/
│   ├── main/               # Electron main process
│   │   ├── index.ts        # App lifecycle, security, single-instance lock
│   │   ├── ipc-handlers.ts # All IPC channel handlers
│   │   ├── python-bridge.ts# Python sidecar spawn + HTTP client
│   │   ├── file-service.ts # File I/O operations
│   │   └── window.ts       # BrowserWindow management
│   ├── preload/
│   │   └── index.ts        # contextBridge API exposed as window.api
│   ├── renderer/           # React application
│   │   ├── pages/          # ImportPage, AnalysisPage, JobsPage, ResumePage, ExportPage
│   │   ├── components/     # UI components (layout, shadcn/ui primitives)
│   │   ├── hooks/          # use-file-import, use-nlp-analysis, use-resume-generator
│   │   ├── stores/         # Zustand app-store, log-store
│   │   └── services/       # api.ts (renderer-side IPC wrapper)
│   ├── common/
│   │   ├── constants.ts    # IPC channels, skill patterns, API config
│   │   └── types.ts        # Shared TypeScript interfaces
│   └── python/             # FastAPI NLP sidecar
│       ├── main.py         # FastAPI app with all endpoints
│       ├── config.py       # Settings, device detection, logging
│       ├── models.py       # Pydantic request/response models
│       └── nlp/            # pipeline.py, skill_extractor.py, sentiment.py, job_matcher.py
├── config/
│   └── electron-builder.yml
├── scripts/
│   ├── run-source-linux.sh # Dev launcher (frontend + backend)
│   ├── setup-conda.sh      # Python env setup
│   └── build-all.sh        # Cross-platform build
└── legacy/                 # Prior Python versions (reference only)
```

## Building

```bash
npm run build           # current platform
npm run build:linux     # AppImage + .deb
npm run build:win       # NSIS + portable
npm run build:mac       # DMG + ZIP
```

See [docs/BUILD_COMPILE.md](docs/BUILD_COMPILE.md) for full build documentation.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup, code standards, and PR process.

## Security

All NLP processing runs locally. No telemetry. Claude API integration is optional and requires an explicit API key. See [SECURITY.md](SECURITY.md) for vulnerability reporting.

## License

MIT License. Copyright (c) 2026 Jason Paul Michaels. See [LICENSE](LICENSE) for details.
