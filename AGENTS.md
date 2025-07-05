# AGENTS.md

This file provides guidance to AI coding agents when working with code in this repository.

## Project Overview

Resume Builder is an AI-powered Electron desktop application that transforms personal data from AI conversation histories (ChatGPT, Claude) into professional resumes and career analytics. The system uses NLP and GenAI to extract skills, achievements, and work history, then maps them to industry job titles.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Desktop | Electron 28+ |
| UI | React 18 + TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| State | Zustand + TanStack Query |
| Build | Vite / electron-vite |
| Testing | Vitest + Playwright |
| PDF | pdf-lib |
| Charts | Recharts |
| NLP | Python sidecar (spaCy, Transformers) |
| GenAI | Anthropic Claude API |
| Database | SQLite + Drizzle ORM |

## Commands

```bash
# Development
./run-source-linux.sh           # Full stack dev runner (Linux — recommended)
npm run dev                     # Electron + Vite dev server
npm run dev:linux               # Linux sandbox fix variant

# Production start
npm run start                   # Start built app (no --dev flag)

# Building
npm run build                   # Current platform
npm run build:all               # All platforms
npm run build:linux             # Linux packages

# Quality
npm run lint                    # ESLint
npm run lint:fix                # ESLint auto-fix
npm run test                    # Vitest unit tests
npm run test:e2e                # Playwright E2E tests
npm run typecheck               # TypeScript check
npm run clean                   # Clean build artifacts

# Python sidecar
cd src/python && uvicorn main:app --host 127.0.0.1 --port 57964 --reload
```

## Architecture

```
src/
├── main/               # Electron main process
│   ├── index.ts        # App lifecycle, Chromium flags, security
│   ├── window.ts       # Window management + state persistence
│   ├── ipc-handlers.ts # IPC channel registration
│   ├── python-bridge.ts# Python sidecar process manager
│   ├── file-service.ts # File system operations
│   └── menu.ts         # Application menu
├── preload/            # Security bridge (contextBridge)
│   └── index.ts        # Exposed safe APIs
├── renderer/           # React application
│   ├── components/     # UI components
│   ├── hooks/          # Custom React hooks
│   ├── pages/          # Route pages
│   ├── stores/         # Zustand state stores
│   └── services/       # API/IPC service layer
├── common/             # Shared between main + renderer
│   ├── types.ts        # TypeScript interfaces
│   ├── constants.ts    # App constants, IPC channels
│   └── api-types.ts    # API type definitions
└── python/             # Python NLP sidecar
    ├── main.py         # FastAPI entry point
    ├── models.py       # Pydantic models
    ├── config.py       # Configuration
    ├── run.py          # Process runner
    └── requirements.txt
```

## Port Assignments

| Service | Port |
|---------|------|
| Frontend (Vite dev) | 63263 |
| Python NLP backend | 57964 |
| HMR WebSocket | 50026 |

## Linux Electron Notes

- Chromium flags are injected before `app.whenReady()` in `src/main/index.ts`
- `--no-sandbox` is passed automatically on Linux
- Sandbox fix: `sudo sysctl -w kernel.unprivileged_userns_clone=1`
- Always use `contextBridge` in preload — never expose Node.js APIs directly

## IPC Channels

Defined in `src/common/constants.ts`:

```typescript
export const IPC = {
  FILE_SELECT: 'file:select',
  FILE_READ: 'file:read',
  NLP_ANALYZE: 'nlp:analyze',
  NLP_PROGRESS: 'nlp:progress',
  RESUME_GENERATE: 'resume:generate',
  RESUME_ENHANCE: 'resume:enhance'
} as const;
```

## Critical Implementation Notes

### ChatGPT JSON Parsing
ChatGPT exports use a **tree structure** (`mapping` with `parent/children`), NOT flat arrays. Use the canonical tree traversal algorithm in `CLAUDE.md`.

### Known Legacy Issues (DO NOT PORT)
- `mps:0`, `mps:1` device syntax in legacy Python files (MPS is single device)
- `generate_resume()` undefined in v03-v05
- `REAL_DEAL_NLP_RESUME.py` is corrupted
- v04 and v05 legacy files are identical duplicates

## Key Documentation

| Document | Purpose |
|----------|---------|
| `docs/PRD.md` | Product Requirements Document |
| `docs/ARCHITECTURE.md` | System design |
| `docs/DEVELOPMENT.md` | Developer guide |
| `docs/INSTALLATION.md` | Setup instructions |
| `docs/QUICK_START.md` | Getting started fast |
| `docs/LEGACY_AUDIT_SUMMARY.md` | Legacy codebase analysis |
| `CHANGELOG.md` | Version history |
| `VERSION_MAP.md` | Version layout reference |
