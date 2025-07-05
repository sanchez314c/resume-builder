# Documentation Index

## Resume Builder v1.0.0

**Author:** J. Michaels ([@sanchez314c](https://github.com/sanchez314c))
**Repository:** https://github.com/sanchez314c/resume-builder

---

## Core Documents

| Document | Location | Purpose |
|----------|----------|---------|
| README | `README.md` | Project overview and quick start |
| CLAUDE.md | `CLAUDE.md` | AI coding agent guidance |
| AGENTS.md | `AGENTS.md` | AI agent configuration reference |
| CHANGELOG | `CHANGELOG.md` | Version history |
| LICENSE | `LICENSE` | MIT License |
| VERSION MAP | `VERSION_MAP.md` | Version layout and legacy reference |

## Technical Documentation

| Document | Location | Purpose |
|----------|----------|---------|
| Product Requirements | `docs/PRD.md` | Full feature and requirement spec |
| Architecture | `docs/ARCHITECTURE.md` | System design and component overview |
| Development Guide | `docs/DEVELOPMENT.md` | Local dev setup and workflow |
| Installation | `docs/INSTALLATION.md` | Step-by-step setup instructions |
| Quick Start | `docs/QUICK_START.md` | Get running in under 5 minutes |
| Tech Stack | `docs/TECHSTACK.md` | Technology decisions and versions |
| Build & Compile | `docs/BUILD_COMPILE.md` | Build instructions for all platforms |
| Legacy Audit | `docs/LEGACY_AUDIT_SUMMARY.md` | Analysis of legacy codebase |

## Project Standards

| Document | Location | Purpose |
|----------|----------|---------|
| Editor Config | `.editorconfig` | Code formatting rules |
| NVM Version | `.nvmrc` | Node.js version (24) |
| Python Version | `.python-version` | Python version (3.11) |
| Git Ignore | `.gitignore` | Files excluded from version control |

## Runner Scripts

| Script | Platform | Usage |
|--------|----------|-------|
| `run-source-linux.sh` | Linux | Full stack runner with sandbox fix |
| `run-source-mac.sh` | macOS | Full stack runner |
| `run-source-windows.bat` | Windows | Full stack runner |

## Source Layout

```
src/
├── main/               Electron main process
├── preload/            Security bridge
├── renderer/           React UI
├── common/             Shared types & constants
└── python/             FastAPI NLP sidecar

tests/                  Vitest + Playwright tests
legacy/                 Previous versions (reference only)
archive/                Timestamped backups
docs/                   All documentation (here)
```
