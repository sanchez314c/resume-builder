# Architecture Overview

## System Design

Resume Builder is an Electron desktop application with three processes: the Electron main process, the React renderer, and a Python FastAPI sidecar. All NLP-heavy work runs in the Python sidecar to keep the JS side responsive.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            ELECTRON APPLICATION                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                         RENDERER PROCESS                                │ │
│  │                    React 18 + TypeScript + Tailwind                     │ │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐  │ │
│  │  │   Import     │ │   Analysis   │ │   Resume     │ │   Export     │  │ │
│  │  │   Page       │ │   Dashboard  │ │   Builder    │ │   Center     │  │ │
│  │  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘  │ │
│  │       Zustand app-store + TanStack Query                                │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                    │ IPC (contextBridge)                    │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                          MAIN PROCESS                                   │ │
│  │                         Node.js + Electron                              │ │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐  │ │
│  │  │    File      │ │   Python     │ │    PDF       │ │   SQLite     │  │ │
│  │  │   Service    │ │   Bridge     │ │   Service    │ │   (Drizzle)  │  │ │
│  │  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘  │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                    │ child_process (HTTP to localhost)       │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                         PYTHON SIDECAR                                  │ │
│  │                      FastAPI + NLP Pipeline                             │ │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐  │ │
│  │  │   spaCy      │ │  Sentence    │ │  Sentiment   │ │   BERTopic   │  │ │
│  │  │   NER        │ │ Transformers │ │  (DistilBERT)│ │ Topic Model  │  │ │
│  │  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘  │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Directory Structure

```
resume-builder/
├── src/
│   ├── main/                    # Electron main process
│   │   ├── index.ts             # App lifecycle, single-instance lock, security
│   │   ├── ipc-handlers.ts      # All ipcMain.handle() registrations
│   │   ├── python-bridge.ts     # Python sidecar spawn + HTTP client
│   │   ├── file-service.ts      # File I/O: open dialog, read, save
│   │   └── window.ts            # BrowserWindow factory, devtools
│   │
│   ├── preload/
│   │   └── index.ts             # contextBridge — exposes window.api to renderer
│   │
│   ├── renderer/                # React application
│   │   ├── index.tsx            # App entry, router setup
│   │   ├── pages/               # Route-level components
│   │   │   ├── ImportPage.tsx   # File import wizard
│   │   │   ├── AnalysisPage.tsx # NLP results dashboard
│   │   │   ├── JobsPage.tsx     # Job matching and gap analysis
│   │   │   ├── ResumePage.tsx   # Resume section editor
│   │   │   └── ExportPage.tsx   # PDF/DOCX export
│   │   ├── components/          # Shared UI components
│   │   │   ├── ui/              # shadcn/ui primitives (tabs, toast, spinner...)
│   │   │   ├── ThemeProvider.tsx
│   │   │   └── ThemeToggle.tsx
│   │   ├── hooks/               # Custom React hooks
│   │   │   ├── use-file-import.ts
│   │   │   ├── use-nlp-analysis.ts
│   │   │   └── use-resume-generator.ts
│   │   ├── stores/              # Zustand state
│   │   │   ├── app-store.ts     # Project state, current conversation
│   │   │   └── log-store.ts     # Processing log / progress feed
│   │   ├── services/
│   │   │   └── api.ts           # Renderer-side wrapper around window.api IPC
│   │   └── styles/
│   │       ├── animations.css
│   │       ├── typography.css
│   │       └── layout.css
│   │
│   ├── common/                  # Code shared across all processes
│   │   ├── types.ts             # TypeScript interfaces (Conversation, Resume, etc.)
│   │   ├── api-types.ts         # IPC request/response types
│   │   └── constants.ts         # IPC channel names, skill regex patterns
│   │
│   └── python/                  # Python FastAPI NLP sidecar
│       ├── main.py              # FastAPI app with all endpoints
│       ├── run.py               # CLI entry point (uvicorn wrapper)
│       ├── config.py            # Settings, device detection, logging
│       ├── models.py            # Pydantic request/response models
│       ├── requirements.txt
│       ├── nlp/
│       │   ├── __init__.py
│       │   ├── achievement_detector.py  # Pattern + sentiment achievement extraction
│       │   ├── topic_modeler.py         # BERTopic topic clustering
│       │   └── job_matcher.py           # Semantic skill-to-job matching
│       └── utils/
│           ├── __init__.py
│           ├── text_processing.py
│           └── device.py        # CUDA / MPS / CPU device selection
│
├── config/
│   └── electron-builder.yml     # Platform targets, file associations
│
├── scripts/
│   ├── build-all.sh             # Cross-platform build (uses all CPU cores)
│   └── setup-conda.sh           # One-time Python env creation
│
├── tests/
│   ├── unit/                    # Vitest unit tests
│   ├── integration/             # Integration tests
│   └── e2e/                     # Playwright E2E tests
│
├── legacy/                      # Prior Python prototypes (reference only)
│   ├── resume-builder-v00/      # Initial scripts
│   ├── resume-builder-v04-advanced/  # Most complete legacy NLP pipeline
│   └── data-insights-portal-v00/    # Web-based insights prototype
│
├── run-source-linux.sh          # Dev launcher (Electron + Python sidecar)
├── electron.vite.config.ts
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

## Data Flow

```
1. IMPORT
   User → File Dialog → ipcMain file:select → file-service.ts → JSON parsed in main
   → conversations stored in SQLite via Drizzle → sent to renderer via IPC

2. NLP ANALYSIS
   Renderer → window.api.nlp.analyze(conversations)
   → ipcMain nlp:analyze handler → python-bridge.ts
   → POST http://127.0.0.1:{port}/analyze → FastAPI
   → Pipeline: skill_extractor → achievement_detector → topic_modeler → sentiment
   → AnalysisResult JSON → back through IPC → renderer Zustand store

3. JOB MATCHING
   Renderer → window.api.nlp.matchJobs(skills, jobDescriptions)
   → python-bridge → POST /match-jobs → JobMatcher
   → cosine similarity (sentence-transformers) → JobMatch[] → renderer

4. RESUME BUILD
   Renderer → user edits sections in ResumePage
   → Zustand app-store holds Resume object
   → window.api.resume.generatePdf(resume) → ipcMain
   → pdf-lib generates bytes → saved to Documents folder

5. EXPORT
   PDF bytes or DOCX buffer streamed back to renderer
   → user selects save location via native dialog
```

## IPC Channel Reference

All channels are defined as constants in `src/common/constants.ts`. Never use string literals in `ipcMain.handle` or `ipcRenderer.invoke` calls.

| Channel | Direction | Description |
|---------|-----------|-------------|
| `file:select` | renderer → main | Open native file dialog, return paths |
| `file:read` | renderer → main | Read file at path, return string |
| `file:save` | renderer → main | Write content to path |
| `nlp:analyze` | renderer → main | Full NLP pipeline on conversations |
| `nlp:match-jobs` | renderer → main | Match skills against job descriptions |
| `nlp:progress` | main → renderer | Progress updates during analysis |
| `resume:generate-pdf` | renderer → main | Generate PDF bytes from Resume object |
| `resume:generate-docx` | renderer → main | Generate DOCX bytes |
| `resume:enhance` | renderer → main | Claude API content enhancement |
| `db:get-projects` | renderer → main | List all projects from SQLite |
| `db:save-project` | renderer → main | Persist project data |

## Python Sidecar API

The sidecar runs on a random high port set by `run-source-linux.sh` (default for standalone: `8765`). The main process spawns it and polls `/health` before connecting.

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check, reports loaded models and device |
| `/analyze` | POST | Full pipeline: skills, achievements, topics, sentiment |
| `/skills` | POST | Skill extraction only |
| `/match-jobs` | POST | Semantic job matching |
| `/enhance` | POST | Claude API passthrough for content improvement |

All request/response shapes are defined in `src/python/models.py` (Pydantic) and `src/common/api-types.ts` (TypeScript). They mirror each other exactly.

## Compute Device Detection

The Python sidecar auto-selects the best available device at startup:

- **CUDA** — if `torch.cuda.is_available()` (NVIDIA GPU)
- **MPS** — if `torch.backends.mps.is_available()` (Apple Silicon)
- **CPU** — fallback

**Critical note**: MPS is a single device. The string `"mps"` is correct. `"mps:0"` will crash. This is enforced in `src/python/utils/device.py` and `src/python/config.py`.

## State Management

The renderer uses two Zustand stores:

- **app-store** — persisted project state: current project, conversations, skills, achievements, resumes. Survives page refreshes.
- **log-store** — ephemeral processing log, progress feed during NLP analysis.

TanStack Query wraps the IPC calls to the main process, providing caching, retry, and loading states.

## Security Model

- The preload script is the only bridge between renderer and main. No `nodeIntegration`.
- All file I/O happens in the main process, never directly from the renderer.
- No telemetry. No external network calls except the optional Claude API (requires explicit API key in settings).
- Claude API key stored in OS keychain, never in plain config files.

## Database Schema

SQLite via Drizzle ORM, stored in the platform data directory.

```sql
CREATE TABLE projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE conversations (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id),
  title TEXT,
  source TEXT NOT NULL,   -- 'chatgpt' | 'claude' | 'generic'
  created_at INTEGER,
  updated_at INTEGER,
  raw_data TEXT NOT NULL  -- full JSON
);

CREATE TABLE skills (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id),
  name TEXT NOT NULL,
  category TEXT,
  frequency INTEGER NOT NULL,
  confidence REAL
);

CREATE TABLE resumes (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id),
  name TEXT NOT NULL,
  template TEXT NOT NULL,
  content TEXT NOT NULL,  -- JSON blob of ResumeSection[]
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
```

## ChatGPT Export Format Note

ChatGPT exports use a **tree structure** with `mapping` (a dict of nodes with `parent`/`children` IDs), not a flat message array. The parser must traverse this tree recursively starting from the root node. The canonical traversal is in `src/main/ipc-handlers.ts`. Claude exports are a flat array and parsed straightforwardly.
