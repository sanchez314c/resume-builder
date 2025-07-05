# VERSION_MAP.md

## Current Version: 1.0.0

### Active Codebase (root)

| Path | Description |
|------|-------------|
| `src/` | Active Electron + React + Python source |
| `src/main/` | Electron main process |
| `src/preload/` | Security bridge (contextBridge) |
| `src/renderer/` | React UI application |
| `src/common/` | Shared types and constants |
| `src/python/` | Python NLP FastAPI sidecar |
| `tests/` | Vitest unit + Playwright E2E tests |
| `assets/` | Icons and images |
| `config/` | electron-builder configuration |

### Legacy Versions (legacy/)

| Folder | Description | Status |
|--------|-------------|--------|
| `legacy/resume-builder-v00/` | Initial Python CLI resume generators (v01-v06) | Superseded |
| `legacy/resume-builder-v01/` | JSON parse to resume + training data | Superseded |
| `legacy/resume-builder-v02-o1/` | O1 model variants | Superseded |
| `legacy/resume-builder-v03/` | NLP resume builder with skill extractor | Superseded |
| `legacy/resume-builder-v04-advanced/` | Advanced NLP pipeline (best reference) | Reference only |
| `legacy/data-insights-portal-v00/` | Early web-based data portal | Superseded |
| `legacy/data-console-v00/` | Web console with Python server | Superseded |
| `legacy/job-market-analyzer-v00/` | AI job market analysis tool | Superseded |

### Best Legacy References for Porting

| Feature | Source File |
|---------|------------|
| JSON parsing | `legacy/resume-builder-v00/resume-builder-v06-enhanced.py` |
| NLP pipeline | `legacy/resume-builder-v04-advanced/improved_resume_builder.py` |
| Skills extractor | `legacy/resume-builder-v04-advanced/nlp-skills-extractor.py` |
| CSS theme | `legacy/data-console-v00/styles.css` |

### Archive

| Path | Contents |
|------|----------|
| `archive/` | Timestamped `.tar.gz` backups |
