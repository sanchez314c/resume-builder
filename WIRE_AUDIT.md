# Wire Audit — Resume Builder
Generated: 2026-04-17

---

## 1. Wire Inventory Table

| Source | Bridge API | IPC Handler | Sink | Status |
|--------|-----------|-------------|------|--------|
| ImportPage drop zone / click | `api.file.select` → `api.selectFile` | `IPC.FILE_SELECT` → `fileService.selectFiles` | Native dialog | LIVE |
| ImportPage drag-and-drop (browser) | FileReader (no IPC) | — | Parser in-renderer | LIVE |
| ImportPage "Analyze Now" button | `setCurrentPage('analysis')` | — | Store nav | LIVE |
| ImportPage "Remove file" (Trash icon) | `removeFileFromProject(file.id)` | — | Zustand store | LIVE |
| use-file-import `processFile` | `api.readFile` → `electronApi.file.read` | `IPC.FILE_READ` | fs.readFile | LIVE |
| use-file-import `importFile` | `api.copyFile` | `IPC.FILE_COPY` | fs.copyFile | LIVE |
| use-file-import `importFile` | `api.ensureDir` | `IPC.FILE_ENSURE_DIR` | fs.mkdir | LIVE |
| use-file-import `importFile` | `api.getDataPath` | `IPC.FILE_GET_DATA_PATH` | app.getPath | LIVE |
| use-file-import `importFile` | `api.saveFile` | `IPC.FILE_SAVE` | fs.writeFile | LIVE |
| use-file-import `analyzeDocumentFile` | `fetch /analyze-file-path` | Python FastAPI | NLP sidecar | LIVE |
| AnalysisPage "Run Analysis" | `api.readFile` → `analyze(messages)` | `IPC.NLP_ANALYZE` | Python `/analyze` | LIVE |
| use-nlp-analysis `analyze` | `api.analyzeConversation` → `electronApi.nlp.analyze` | `IPC.NLP_ANALYZE` | python-bridge `/analyze` | LIVE |
| use-nlp-analysis `analyze` | `api.nlp.onProgress` → `electronApi.nlp.onProgress` | `IPC.NLP_PROGRESS` (push) | Renderer progress UI | LIVE |
| use-nlp-analysis `analyze` | `new WebSocket ws://127.0.0.1:PORT/ws/progress` | Python WebSocket | Progress UI | LIVE |
| use-nlp-analysis `extractSkillsFromText` | `api.extractSkills` | `IPC.NLP_EXTRACT_SKILLS` | python-bridge `/extract-skills` | LIVE |
| ResumePage "Auto-Fill" | `populateFromAnalysis()` | — | Local state from store | LIVE |
| ResumePage "AI Enhance" per section | `api.resume.enhanceText` → `electronApi.resume.enhance` | `IPC.RESUME_ENHANCE` | python-bridge `/enhance` | LIVE |
| ResumePage "Generate PDF" | `api.resume.generatePdf` | `IPC.RESUME_GENERATE_PDF` | pdf-lib in main | LIVE |
| ResumePage "Export as DOCX" | `api.resume.generateDocx` | `IPC.RESUME_GENERATE_DOCX` | Buffer in main | LIVE |
| use-resume-generator `generate` (autoSave) | `api.file.saveFile` | `IPC.FILE_SAVE` | fs.writeFile | LIVE |
| ExportPage "Export" (PDF resume) | `api.resume.generatePdf` + `api.saveFile` | `IPC.RESUME_GENERATE_PDF` + `IPC.FILE_SAVE` | pdf-lib + save dialog | LIVE |
| ExportPage "Export" (DOCX resume) | `api.resume.generateDocx` + `api.saveFile` | `IPC.RESUME_GENERATE_DOCX` + `IPC.FILE_SAVE` | Buffer + save dialog | LIVE |
| ExportPage "Export" (Assessment PDF) | `api.assessment.generatePdf` + `api.saveFile` | `IPC.ASSESSMENT_GENERATE_PDF` + `IPC.FILE_SAVE` | pdf-lib + save dialog | LIVE |
| ExportPage "Export" (text formats) | `api.saveFile` | `IPC.FILE_SAVE` | save dialog | LIVE |
| ExportPage "Open Export Folder" | `api.openPath` | `IPC.APP_OPEN_PATH` | shell.openPath | LIVE |
| ExportPage history item "Show in Folder" | `api.showItemInFolder` | `IPC.APP_SHOW_ITEM_IN_FOLDER` | shell.showItemInFolder | LIVE |
| ExportPage mount | `api.getExportsPath` | `IPC.APP_GET_EXPORTS_PATH` | app.getPath('documents') | LIVE |
| TitleBar minimize | `window.api.window.minimize` | `window-minimize` | BrowserWindow.minimize | LIVE |
| TitleBar maximize | `window.api.window.maximize` | `window-maximize` | BrowserWindow.maximize/unmaximize | LIVE |
| TitleBar close | `window.api.window.close` | `window-close` | BrowserWindow.close | LIVE |
| TitleBar About link click | `window.api.window.openExternal` | `open-external` | shell.openExternal | LIVE |
| ProjectsPage create project | `createProject(name)` | — | Zustand store | LIVE |
| ProjectsPage delete project | `deleteProject(id)` | — | Zustand store | LIVE |
| ProjectsPage resume project | `setCurrentProject` + `setCurrentPage` | — | Zustand store | LIVE |
| App NLP health monitor | `api.health.checkNlpBackend` → `fetch /health` | Python HTTP | Status in store | LIVE |
| JobsPage "Analyze Match" | `setTimeout` mock | — | Mock data | DEAD (mock only) |
| JobsPage "Copy Recommendations" | `navigator.clipboard.writeText` | — | Clipboard | LIVE (fixed) |
| JobsPage "Add Job" | disabled (no handler) | — | — | DEAD → disabled |
| TitleBar Settings button | disabled (no handler) | — | — | DEAD → disabled |
| Header Search button | disabled (no handler) | — | — | DEAD → disabled |
| Header User/Avatar button | disabled (no handler) | — | — | DEAD → disabled |
| Header ThemeToggle | `ThemeProvider` context | — | DOM class/attr | LIVE (wired in fix) |
| `useNlpAnalysis.analyzeCurrentProject` | stub (not wired) | — | — | ORPHAN stub → documented |
| `ipcMain` `open-external` handler | `shell.openExternal` | — | No renderer caller via IPC.* | ORPHAN (called via window controls path) |

---

## 2. Fixes Applied

### FIX-01 — ThemeToggle wired into Header
- **File**: `src/renderer/components/layout/Header.tsx`
- **Change**: Imported `ThemeToggle` from `../ThemeToggle` and inserted `<ThemeToggle showDropdown size="sm" />` in the right-side action row.
- **Why**: `ThemeProvider` wraps the whole app (App.tsx), context is available. Toggle existed fully implemented but was never rendered anywhere.

### FIX-02 — Header Search button: disabled + tooltip
- **File**: `src/renderer/components/layout/Header.tsx`
- **Change**: Added `disabled` prop and `title="Search (coming soon)"`, replaced hover classes with `opacity-40 cursor-not-allowed`.
- **Why**: Button had no onClick — clicking it was silently inert.

### FIX-03 — Header User/Avatar button: disabled + tooltip
- **File**: `src/renderer/components/layout/Header.tsx`
- **Change**: Added `disabled` prop and `title="User profile (coming soon)"`, replaced hover classes with `opacity-40 cursor-not-allowed`.
- **Why**: Button had no onClick.

### FIX-04 — Header Bell/Notifications: added title
- **File**: `src/renderer/components/layout/Header.tsx`
- **Change**: Added `title="Notifications"` and inline `onClick` comment explaining badge behavior.
- **Why**: Button was clickable but silent. Error count shows via badge already — documented intent.

### FIX-05 — TitleBar Settings button: disabled + tooltip
- **File**: `src/renderer/components/layout/TitleBar.tsx`
- **Change**: Added `disabled` prop, `title="Settings (coming soon)"`, `cursor: 'not-allowed'`, `opacity: 0.4`. Removed hover handlers (disabled elements don't fire them).
- **Why**: Button had no onClick — pure no-op with misleading hover effect.

### FIX-06 — JobsPage "Copy Recommendations": wired to clipboard
- **File**: `src/renderer/pages/JobsPage.tsx`
- **Change**: Added `handleCopyRecommendations` function using `navigator.clipboard.writeText`, added `copied` state for button feedback, wired button `onClick`.
- **Why**: Button with explicit Copy icon and label had no handler.

### FIX-07 — JobsPage "Add Job": disabled + tooltip
- **File**: `src/renderer/pages/JobsPage.tsx`
- **Change**: Added `disabled` prop and `title` explaining saved jobs require analysis first.
- **Why**: Button had no onClick — intent is to save analyzed jobs, which requires the jobs feature to be fully implemented.

### FIX-08 — `analyzeCurrentProject` stub documented
- **File**: `src/renderer/hooks/use-nlp-analysis.ts`
- **Change**: Replaced vague "not yet implemented" comment with precise explanation: the active analysis path goes through `analyze()` directly (AnalysisPage loads parsed-conversations.json then calls `analyze(messages)`). This wrapper is future convenience — not needed until a second call site exists.
- **Why**: Clarifies why this isn't a bug and what would wire it.

---

## 3. Deferred Issues

### DEFER-01 — JobsPage "Analyze Match" uses setTimeout mock
- **File**: `src/renderer/pages/JobsPage.tsx`, `handleAnalyze`
- **Status**: Intent is clear (NLP job matching) but the actual endpoint does not exist in the Python sidecar (`/job-match` or similar not implemented). Wiring this requires: (a) Python endpoint, (b) IPC handler, (c) preload bridge method. Architecture-level work — deferred.
- **Current state**: Mock shows hardcoded `mockMatchResults` after 2s delay. UI is otherwise correct.

### DEFER-02 — JobsPage saved jobs persistence
- **File**: `src/renderer/pages/JobsPage.tsx`, "Saved Jobs" section
- **Status**: No store slice or IPC for job persistence. Requires Zustand store extension + file save IPC. Feature scope — deferred.

### DEFER-03 — Header "Skills Found" and "Job Matches" badges show `--`
- **File**: `src/renderer/components/layout/Header.tsx`
- **Status**: These are hardcoded placeholders. Wiring them to store state is straightforward but was not in audit scope. Would need `analysisResult?.skills.length` from store.

### DEFER-04 — ResumePage section drag-and-drop reorder
- **File**: `src/renderer/pages/ResumePage.tsx`, `GripVertical` icon
- **Status**: `GripVertical` icon renders but no drag handler is wired. `reorderSections()` exists in the hook. Requires a DnD library integration (react-dnd or dnd-kit). Not a dead wire — the function exists, the UX affordance just isn't connected.

### DEFER-05 — DOCX generation returns plain text buffer
- **File**: `src/main/ipc-handlers.ts`, `generateDocxResume()`
- **Status**: The handler returns `Buffer.from(content, 'utf-8')` — not actual OOXML. The comment says "Full DOCX implementation would create proper Office Open XML." The IPC wire is LIVE but the sink is incomplete. Requires `docx` or `officegen` library.

### DEFER-06 — Export PDF options (page size / margins) are cosmetic selects
- **File**: `src/renderer/pages/ExportPage.tsx`, PDF Options section
- **Status**: Two `<select>` elements render but their values are not read during export. The PDF generator in main uses hardcoded 612×792 / 50pt margins. Wiring them through to the IPC payload is a feature enhancement — deferred.

---

## 4. TypeScript Status

```
npx tsc --noEmit → exit 0, no errors
```

All fixes maintain strict TypeScript compliance.
