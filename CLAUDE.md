# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Resume Builder is an AI-powered Electron desktop application that transforms personal data from AI conversation histories (ChatGPT, Claude) into professional resumes and career analytics. The system uses NLP and GenAI to extract skills, achievements, and work history, then maps them to industry job titles.

## Tech Stack (Finalized)

| Layer | Technology |
|-------|------------|
| Desktop | Electron 28+ |
| UI | React 18 + TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| State | Zustand + TanStack Query |
| Build | Vite |
| Testing | Vitest + Playwright |
| PDF | pdf-lib |
| Charts | Recharts |
| NLP | Python sidecar (spaCy, Transformers) |
| GenAI | Anthropic Claude API |
| Database | SQLite + Drizzle ORM |

## Commands

```bash
# Development
npm run dev                       # Start dev server
./scripts/run-source-linux.sh    # Linux runner (fixes sandbox)

# Building
npm run build                     # Current platform
npm run build:all                 # All platforms

# Quality
npm run lint                      # Linting
npm run test                      # Tests
npm run clean                     # Clean artifacts

# Python sidecar (when implemented)
cd python && uvicorn main:app --reload
```

## Architecture

```
src/
├── main/               # Electron main process
│   ├── index.ts        # Window management
│   ├── ipc-handlers.ts # IPC communication
│   └── python-bridge.ts# Python sidecar manager
├── preload/            # Security bridge
│   └── index.ts        # contextBridge APIs
├── renderer/           # React application
│   ├── components/     # UI components
│   ├── hooks/          # Custom hooks
│   ├── pages/          # Route pages
│   ├── stores/         # Zustand stores
│   └── services/       # API services
├── common/             # Shared code
│   ├── types.ts        # TypeScript interfaces
│   └── constants.ts    # App constants
└── python/             # Python NLP sidecar
    ├── main.py         # FastAPI entry
    ├── nlp/            # NLP modules
    └── requirements.txt
```

## Key Documentation

| Document | Purpose |
|----------|---------|
| `docs/PRD.md` | Product Requirements Document |
| `docs/LEGACY_AUDIT_SUMMARY.md` | Legacy codebase analysis |
| `docs/ARCHITECTURE.md` | System design |
| `docs/DEVELOPMENT.md` | Dev guide |

## Critical Implementation Notes

### ChatGPT JSON Parsing
ChatGPT exports use a **tree structure** (`mapping` with `parent/children`), NOT flat arrays. The canonical tree traversal algorithm:

```typescript
function extractMessages(mapping: Record<string, Node>, nodeId: string): Message[] {
  const messages: Message[] = [];
  const node = mapping[nodeId];

  if (node?.message?.content?.parts) {
    messages.push({
      role: node.message.author.role,
      content: node.message.content.parts.join('\n'),
      timestamp: node.message.create_time
    });
  }

  for (const childId of node?.children || []) {
    messages.push(...extractMessages(mapping, childId));
  }
  return messages;
}
```

### Skill Extraction Pattern
```typescript
const SKILLS_REGEX = /\b(python|javascript|typescript|react|vue|angular|node\.js|sql|mongodb|aws|azure|docker|kubernetes|machine learning|deep learning|nlp|data science)\b/gi;
```

### Legacy Code Reference
Best sources for porting:
- **JSON parsing**: `legacy/resume-builder-v00/resume-builder-v06-enhanced.py`
- **NLP pipeline**: `legacy/resume-builder-v04-advanced/improved_resume_builder.py`
- **Skills extractor**: `legacy/resume-builder-v04-advanced/nlp-skills-extractor.py`
- **CSS theme**: `legacy/data-console-v00/styles.css`

### Known Legacy Issues (DO NOT PORT)
- `mps:0`, `mps:1` device syntax (MPS is single device)
- `generate_resume()` undefined in v03-v05
- v04 and v05 are identical (duplicate)
- REAL_DEAL_NLP_RESUME.py is corrupted

## Python Sidecar

The NLP-heavy operations run in a Python FastAPI sidecar:
- spaCy NER (en_core_web_trf model)
- Sentence Transformers (all-MiniLM-L6-v2)
- BERT embeddings (bert-base-uncased)
- BERTopic for topic modeling
- VADER + DistilBERT for sentiment

Communication via `child_process` spawn or HTTP to localhost.

## IPC Channels

```typescript
// Define in src/common/constants.ts
export const IPC = {
  FILE_SELECT: 'file:select',
  FILE_READ: 'file:read',
  NLP_ANALYZE: 'nlp:analyze',
  NLP_PROGRESS: 'nlp:progress',
  RESUME_GENERATE: 'resume:generate',
  RESUME_ENHANCE: 'resume:enhance'
} as const;
```

## Build Outputs

| Platform | Formats |
|----------|---------|
| Linux | AppImage, .deb |
| Windows | NSIS, portable |
| macOS | DMG, ZIP |

## Electron Notes

- **Linux Sandbox**: `sudo sysctl -w kernel.unprivileged_userns_clone=1`
- **Security**: Always use preload + contextBridge
- **Python**: Bundle Python runtime or require system install
