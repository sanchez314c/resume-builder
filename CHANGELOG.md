# Changelog

All notable changes to this project are documented here.

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
Versioning follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased] — Repo Pipeline Step 9 Neo-Noir + AboutModal — 2026-04-17

### Added

- `src/renderer/components/layout/AboutModal.tsx`: Standalone Neo-Noir Glass Monitor AboutModal
  component. Props `{ isOpen: boolean; onClose: () => void }`. Features: Lucide `FileText` 64px
  icon, teal mono version label, description, "MIT License | J. Michaels" footer, GitHub pill badge
  (openExternal IPC), email pill badge (`jason@speedheathens.com`), overlay click + X button close.

### Changed

- `src/renderer/components/layout/TitleBar.tsx`: Removed inline `AboutModal` definition. Now
  accepts `onAboutClick?: () => void` prop; About ⓘ button calls it instead of managing local state.
- `src/renderer/components/layout/MainLayout.tsx`: Added `useState<boolean>` for `aboutOpen`.
  Passes `onAboutClick` to `TitleBar`; renders `<AboutModal>` at layout root so modal is
  available app-wide.
- `src/renderer/components/layout/index.ts`: Added `AboutModal` barrel export.

### Verified

- Neo-Noir design tokens intact: teal accent (#00d2be/#00e5cc), glass system, layered shadows in
  `tailwind.config.js` + `src/renderer/styles/themes.css`.
- AppShell structure confirmed: TitleBar → [Sidebar | (main content)] → StatusBar.
- `frame: false`, `transparent: true`, `hasShadow: false` at `src/main/window.ts:144-147`.
- `npx tsc --noEmit` exit 0. `npm run build` exit 0.

---

## [Unreleased] — Repo Pipeline Step 5 audit pass — 2026-04-17

### Security (HIGH)

- **`src/main/ipc-handlers.ts:208`**: Fixed `FILE_GET_DATA_PATH` handler using `app.getAppPath()`
  to derive the project data directory. `app.getAppPath()` resolves to the read-only ASAR
  in packaged builds — all project data writes would silently fail. Changed to
  `app.getPath('userData')` (`~/.config/resume-builder` on Linux) which is writable in
  both dev and packaged modes.

- **`src/main/file-service.ts`**: Added `BLOCKED_PATH_PREFIXES` (14 Linux system directory
  prefixes) and `checkBlockedPath()` helper. Applied to `readFile()`, `saveFile()`,
  `copyFile()`, and `ensureDir()` after the existing `isAbsolute()` check. Closes the gap
  where a compromised renderer could call `window.api.file.read('/etc/shadow')` or write
  to system directories. Mirrors the protection `_validate_file_path()` already provided
  on the Python sidecar side.

### Security (MEDIUM)

- **`src/main/ipc-handlers.ts:334`**: Fixed NLP IPC `nlp:analyze` message validation
  that only checked the first 5 messages (`Math.min(data.messages.length, 5)`). Messages
  at index 6+ with invalid types bypassed the IPC gate. Changed loop bound to validate
  all messages.

- **`src/python/main.py`**: Added 10 MB file size guard to the `/analyze-file` upload
  endpoint — `len(content) > _MAX_FILE_SIZE_BYTES` check immediately after `await file.read()`.
  Parity with `/analyze-file-path` which already enforced this limit. Also moved
  `_MAX_FILE_SIZE_BYTES` constant above both endpoints (removed duplicate definition).

### Security (LOW)

- **`src/python/main.py`** (6 endpoints): Sanitized `detail=str(e)` in all outer
  `except Exception` blocks in `/analyze`, `/extract-skills`, `/analyze-file`,
  `/analyze-file-path`, `/match-jobs`, `/enhance`. Was leaking internal error strings
  (model paths, spaCy/Torch exception details) to HTTP callers. Changed to descriptive but
  opaque messages; underlying errors still logged via `logger.error()`.

- **`src/python/main.py`**: Removed `.docx` from `_ALLOWED_EXTENSIONS`. There is no DOCX
  parser in `extract_text_from_file()` — DOCX files fell through to raw UTF-8 decode of
  ZIP binary, raising `UnicodeDecodeError` → HTTP 400 "Unsupported file type: .docx"
  while the allowlist implied DOCX was supported. Error message now accurately reflects
  supported types.

- **`src/python/config.py:22`**: Updated default `port` from `8765` to `57964` to match
  `API_CONFIG.DEFAULT_PORT` in TypeScript constants and `run-source-linux.sh`. Direct
  invocation of `python main.py` without CLI overrides now binds to the correct port.

- **`src/main/python-bridge.ts:443`**: Fixed health check timer that early-returned via
  `if (!this.isRunning()) return` — `isRunning()` always returns `false` for external
  backends (not spawned by the bridge), meaning the health check never ran for them.
  Changed to always run the health check; distinguishes spawned process (stop + restart)
  from external backend (emit `'error'`, no restart attempt).

### Documentation

- `AUDIT_REPORT.md` — Rewritten to cover both audit passes. All Step 5 findings documented
  with severity, root cause, fix description, and file:line references.

---

## [1.0.5] - 2026-04-10 — Repo Pipeline Final Pass

### Fixed
- **`package.json`**: Moved `electron` from `dependencies` to `devDependencies` (electron-builder requirement)
- **`config/electron-builder.yml`**: Changed `directories.output` from `dist` to `release` to prevent asar self-inclusion. Removed icon references (no icon files exist yet). Changed Linux target to AppImage only (deb requires fpm tool).
- **`assets/icons/icon.png`**: Generated placeholder 512x512 teal PNG icon for electron-builder packaging

### Changed
- Prettier formatting applied to 19 files across `src/renderer/`
- Cleaned `dist/src`, `dist/assets`, old `dist/linux-unpacked` build artifacts
- Removed empty data subdirectories (1111, 1234, 12345, etc.) — only `data/.gitkeep` remains

### Verified
- `npx electron-vite build` — clean build (main 52kB, preload 9kB, renderer 637kB JS + 117kB CSS)
- `npx tsc --noEmit` — zero type errors
- `npx vitest run` — 70/70 tests passing
- `npx eslint src` — 0 errors (3 react-refresh warnings)
- `npx electron-builder --linux` — AppImage built (114MB)

---

## [1.0.4] - 2026-04-10 — Neo-Noir Glass Monitor Polish (Repo Pipeline Step 9)

### Changed
- **`tailwind.config.js`**: Added shadcn-style semantic color tokens (`primary`, `secondary`, `destructive`, `muted`, `card`, `popover`, `border`, `input`, `ring`, `foreground`) wired to the Neo-Noir CSS variables so shadcn-pattern components (Tabs, DropdownMenu, ExportPage) pick up the dark glass palette instead of falling through to undefined colors. Added a full `teal` palette (50-900 + glow) and promoted `glass`/`glass-sm`/`glass-lg`/`glass-xl` box shadows. Retuned legacy `resume` colors from ChatGPT green/purple to teal family.
- **`src/renderer/components/layout/TitleBar.tsx`**: Fixed inverted window control colors — now macOS traffic-light convention (close=red, minimize=yellow, maximize=green) with matching hover glows. Expanded About modal: added logo badge, tech stack chips (Electron, React 18, TypeScript, Tailwind, Zustand, Vite, Python NLP, pdf-lib), monospace metadata row, backdrop blur, teal inner glow, scale-in animation.
- **`src/renderer/components/layout/StatusBar.tsx`**: Added current page indicator (center), current project name (left), READY state tag (right), status dot pulse for offline state, gradient background with backdrop blur, teal-accented separators.
- **`src/renderer/components/layout/MainLayout.tsx`**: Root container now uses true glass treatment with `backdrop-filter: blur(24px) saturate(140%)`, layered shadows (elevation + teal ambient glow), inset highlight, ambient teal glow strip at top. Loading overlay moved to absolute positioning so it respects the floating window's rounded corners.
- **`src/renderer/components/layout/Sidebar.tsx`**: Added `backdrop-filter: blur(16px)` for true glass feel and a right-edge teal glow line to separate from main content area.
- **`src/renderer/styles/globals.css`**: Made `#root` fully transparent so MainLayout owns the glass treatment (eliminates stacked backgrounds).
- **`src/renderer/styles/animations.css`**: Added missing `@keyframes pulse` (referenced by `.animate-pulse-slow` and now by StatusBar offline indicator).

### Verified
- `npx electron-vite build` — clean build, 117 kB CSS, 637 kB JS
- `npx tsc --noEmit` — no type errors
- `npm run test` — 70/70 tests passing
- `npm run lint` — 0 errors (3 pre-existing fast-refresh warnings)

---

## [1.0.3] - 2026-04-09 — Dead Code Removal (Repo Pipeline Step 6)

### Removed
- **`src/common/api-types.ts`**: Entire file (387 lines) — zero imports anywhere in the codebase. Contained AnalysisOptions, AnalyzeRequest/Response, MatchJobs, EnhanceRequest/Response, HealthResponse, WSMessage, APIError types plus type guards (isAPIError, isValidationError, isAnalyzeResponse) that were never consumed.
- **`src/renderer/lib/parsers/sample-data.ts`**: Entire file (547 lines) — zero imports. Dev/test fixtures that were never referenced.
- **`src/main/menu.ts`**: Removed `createMenu()` (223 lines), `createEditContextMenu()`, `createReadOnlyContextMenu()`, and `showAboutDialog()` — none were ever called. `Menu.setApplicationMenu(null)` is used in main/index.ts and only `createDockMenu` survives. Pruned imports accordingly.
- **`src/main/window.ts`**: Removed `toggleDevTools()`, `reloadWindow()`, `toggleFullscreen()`, `setZoom()` — only consumed by the removed `createMenu()`.
- **`src/main/file-service.ts`**: Removed `getFileInfo()`, `fileExists()`, `readBinaryFile()`, `saveBinaryFile()`, and the `FileInfo` type — never imported.
- **`src/common/constants.ts`**: Removed `SKILL_PATTERNS`, `COMBINED_SKILL_PATTERN`, `ACHIEVEMENT_PATTERNS`, `COMBINED_ACHIEVEMENT_PATTERN`, `THEME`, `ThemeMode`, `ThemeColors`, `SUPPORTED_IMPORT_TYPES`, `EXPORT_FORMATS`, `NLP_CONFIG`, `IPCChannel` — the JS/TS constants duplicated patterns that only exist in the Python sidecar side (src/python/nlp/*), and UI theming lives in Tailwind/components, not these constants.
- **`src/common/types.ts`**: Removed `DBRecord<T>` — zero imports.
- **`src/renderer/lib/utils.ts`**: Removed `debounce()`, `sleep()`, `safeJsonParse()`, `generateId()` — never imported (`cn` and `formatFileSize` are the only consumers).
- **`src/renderer/lib/parsers/types.ts`**: Removed `RawMessage`, `ParserStats`, `TypeGuard`, `ParserFunction`, `BatchParserFunction` — unused type declarations.
- **`src/renderer/lib/parsers/validation.ts`**: Removed `deduplicateMessagesWithStats()` and `validateConversations()` — never imported. Pruned unused `ParseError` import.
- **`src/renderer/lib/parsers/chatgpt-parser.ts`**: Removed `printTreeStructure()` — debug helper with no consumers.
- **`src/renderer/lib/parsers/index.ts`**: Removed `parseWithFormat()` (64 lines) — never imported externally. Pruned unused `ConversationSource` import.
- **`src/types/electron.d.ts`**: Removed `getElectronAPI()` (non-safe version) — only `getElectronAPISafe()` and `isElectron()` are consumed.

### Notes
- Barrel export files (`components/index.ts`, `components/ui/index.ts`, `hooks/index.ts`, `services/index.ts`) were left intact per policy even where unreferenced, to preserve the public surface.
- Legacy `/legacy` directory: verified zero imports from `src/` into `legacy/`.
- All removals verified clean via `npx electron-vite build` and `npx tsc --noEmit` after each batch.

---

## [1.0.2] - 2026-03-14 21:00 UTC — Neo-Noir Glass Monitor Restyle

### Changed
- **`src/renderer/components/ui/button.tsx`**: Replaced CashCommand green (`#4ade80`) with teal (`#00d2be`) across all button variants; primary variant now uses teal gradient with 2-layer shadows
- **`src/renderer/components/ui/card.tsx`**: Removed inline `backdropFilter` style (no `backdrop-filter` primary); glass treatment now comes from `glass-card` CSS class with 2-layer box shadow
- **`src/renderer/components/ui/input.tsx`**: Replaced green focus glow with teal focus glow (`rgba(0,210,190,...)`) on both `Input` and `Textarea`
- **`src/renderer/components/ui/progress.tsx`**: Progress fill now uses teal gradient (`#00d2be` to `#00a896`) with teal glow shadow
- **`src/renderer/components/ui/dialog.tsx`**: Dialog border updated to teal; shadow deepened to multi-layer; removed `backdrop-filter`
- **`src/renderer/components/ui/terminal-log.tsx`**: All green accent colors replaced with teal
- **`src/renderer/components/layout/StatusBar.tsx`**: Full rewrite to Neo-Noir spec — NLP dot + status text + `|` + file count left; version `v1.0.0` in teal right only
- **`src/renderer/components/layout/Header.tsx`**: All green references replaced with teal
- **`src/renderer/styles/components.css`**: `glass-card`, `glass-button`, `glass-button-primary`, `glass-input`, `glass-panel`, `nav-item`, `glow-accent` all updated to teal Neo-Noir palette; removed `backdrop-filter` from primary glass classes
- **`src/renderer/pages/ProjectsPage.tsx`**: Complete restyle — all `#4ade80` replaced with teal; active accent bar uses teal gradient; progress bars use teal gradient; status badges use teal/amber/muted per state
- **`src/renderer/pages/ImportPage.tsx`**: File list mini-cards and format guide cards updated to teal borders
- **`src/renderer/pages/AnalysisPage.tsx`**: Loader and highlight colors updated to teal
- **`src/renderer/pages/ExportPage.tsx`**: Progress fill gradient updated to teal

---

## [1.0.1] - 2026-03-14 21:30 UTC — Forensic Security Audit Remediation

### Security (CRITICAL)
- **`run-source-linux.sh`**: Removed hardcoded sudo password (`echo "1234" | sudo -S ...`); sudo now prompts interactively
- **`src/python/main.py`**: Restricted FastAPI CORS from wildcard `"*"` to localhost-only origins with explicit methods/headers

### Security (HIGH)
- **`src/python/main.py`**: Added `_validate_file_path()` to `/analyze-file-path` endpoint blocking path traversal — validates extension, blocks system dirs, enforces 10 MB size cap
- **`src/main/ipc-handlers.ts`**: Added `sanitizeProjectId()` to all DB IPC handlers (SAVE/LOAD/DELETE); validates UUID format and verifies path stays within projects directory
- **`src/common/constants.ts`**, **`src/renderer/services/api.ts`**, **`src/renderer/hooks/use-file-import.ts`**: Fixed three-way port mismatch — all consumers now use `API_CONFIG.DEFAULT_PORT = 57964` matching the launch script
- **`src/renderer/hooks/use-file-import.ts`**: Fixed `updateFileStatus` to use file UUID (looked up from store after `addFileToProject`) instead of filename string

### Fixed (MEDIUM)
- **`src/python/main.py`**: Exception handlers now return `JSONResponse` instead of raw Pydantic model — were previously silently failing
- **`src/python/main.py`**: Replaced bare `except:` with `except (UnicodeDecodeError, ValueError)`
- **`src/main/python-bridge.ts`**: `detectPythonPath()` now iterates all candidates with `execSync` instead of always returning the first
- **`src/main/window.ts`**, **`src/main/index.ts`**: Replaced dynamic `require('electron')` with static imports for `shell`
- **`src/python/nlp/skill_extractor.py`**, **`src/python/nlp/sentiment.py`**, **`src/python/main.py`**: Moved `import json`, `import sys`, `import os` out of hot loops/callbacks to module level
- **`src/common/constants.ts`**: Fixed `APP_INFO.version` from `"0.1.0"` to `"1.0.0"` to match `package.json`

### Fixed (LOW/INFO)
- **`src/renderer/stores/app-store.ts`**: Replaced deprecated `String.substr()` with `String.substring()`
- **`src/python/nlp/sentiment.py`**: Fixed timeline sort null-timestamp comparison (datetime vs int 0 would raise TypeError)
- **`run-source-linux.sh`**: Changed `$UVICORN_ARGS` string expansion to bash array `"${UVICORN_ARGS[@]}"` to prevent word-splitting
- **`src/main/ipc-handlers.ts`**: Fixed `pdfDoc.addPage()` return value assignment on page overflow (changed `const page` to `let page`)
- **`src/main/index.ts`**: Clarified `handleLinuxSandbox()` is diagnostic-only (was misleadingly named as if it performed setup)

### Documentation
- `AUDIT_REPORT.md` — Full forensic audit report with all findings, severity ratings, and remediation log

---

## [0.2.0] - 2026-03-14 — Documentation Standardization

### Added
- README.md rewritten with accurate tech stack, structure, and usage
- AGENTS.md — AI agent interaction guide
- VERSION_MAP.md — version tracking with history and legacy info
- CLAUDE.md updated with correct file paths and architecture
- CODE_OF_CONDUCT.md updated to Contributor Covenant v2.1
- SECURITY.md updated with real security model (local processing, no telemetry)
- CONTRIBUTING.md updated with actual dev setup (conda, Node 18+, electron-vite)
- docs/README.md — documentation index
- docs/INSTALLATION.md — full installation guide with conda setup
- docs/DEVELOPMENT.md — rewritten with real commands and architecture
- docs/API.md — complete IPC channel reference and Python FastAPI endpoint docs
- docs/BUILD_COMPILE.md — electron-builder config, platform targets, output formats
- docs/DEPLOYMENT.md — release process and distribution
- docs/FAQ.md — real questions from the codebase
- docs/TROUBLESHOOTING.md — common errors with real fixes
- docs/TECHSTACK.md — full dependency listing with versions and rationale
- docs/WORKFLOW.md — development workflow and branching strategy
- docs/QUICK_START.md — minimal path from clone to running
- docs/LEARNINGS.md — lessons from legacy audit and current architecture
- docs/PRD.md preserved from original (comprehensive product requirements)
- docs/TODO.md — current known issues and planned work
- .github/ISSUE_TEMPLATE/bug_report.md
- .github/ISSUE_TEMPLATE/feature_request.md
- .github/PULL_REQUEST_TEMPLATE.md
- docs/LEGACY_AUDIT_SUMMARY.md moved to archive/

### Changed
- docs/ARCHITECTURE.md rewritten — removed TBD placeholders, reflects actual code
- LICENSE copyright updated to 2026 Jason Paul Michaels

---

## [0.1.0] - 2026-02-07 — Repository Compliance Fixes

### Added
- CLAUDE.md created from AGENTS.md
- .gitkeep files for protected empty folders (archive/, tests/, config/)

### Fixed
- Removed OS junk files (.DS_Store, Thumbs.db)
- Removed runtime artifacts from tracking

---

## [0.0.1] - 2026-02-02 — Initial Project

### Added
- Electron + Vite + React + TypeScript project structure
- Python FastAPI NLP sidecar (spaCy, Transformers, BERTopic)
- IPC handlers for file, NLP, resume, assessment, and database operations
- Python bridge for sidecar process management
- preload/index.ts contextBridge API
- Zustand app store with persisted project state
- Six renderer pages: Projects, Import, Analysis, Jobs, Resume, Export
- PDF generation via pdf-lib (resume + assessment report)
- run-source-linux.sh launcher with conda env management
- scripts/setup-conda.sh and scripts/setup-python.sh
- Legacy Python versions archived in legacy/
