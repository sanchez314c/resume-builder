# LINT_REPORT.md — resume-builder

**Date**: 2026-04-17
**Stack**: Electron + electron-vite + React 18 + TypeScript + Tailwind + Python NLP sidecar

## Tools Run

| Tool | Version | Command | Result |
|------|---------|---------|--------|
| ESLint | v8.57.1 | `eslint src --ext .ts,.tsx --fix` | 0 errors, 3 warnings (unfixable) |
| Prettier | 3.8.1 | `prettier --write "src/**/*.{ts,tsx,css,json}"` | All unchanged (already formatted) |
| TypeScript | 5.9.3 | `tsc --noEmit` | 0 errors |
| Ruff | 0.15.10 | `ruff check --fix src/python && ruff format src/python` | All passed, 14 files unchanged |

## Before/After Counts

| Tool | Before | After | Fixed |
|------|--------|-------|-------|
| ESLint errors | 0 | 0 | 0 |
| ESLint warnings | 3 | 3 | 0 (unfixable) |
| Prettier unformatted | 0 | 0 | 0 |
| TypeScript errors | 0 | 0 | 0 |
| Ruff violations | 0 | 0 | 0 |

## Files Modified

None. All source files were already compliant. No auto-fixes applied.

## Remaining Unfixable Issues (3 warnings)

All are `react-refresh/only-export-components` warnings — files export both components and non-component values (constants, hooks, types). These are informational and don't affect functionality.

| # | File:Line | Rule | Description |
|---|-----------|------|-------------|
| 1 | `src/renderer/components/ThemeProvider.tsx:238` | `react-refresh/only-export-components` | Exports non-component alongside components |
| 2 | `src/renderer/components/ui/button.tsx:95` | `react-refresh/only-export-components` | Exports non-component alongside components |
| 3 | `src/renderer/components/ui/toast.tsx:463` | `react-refresh/only-export-components` | Exports non-component alongside components |

**Resolution options** (not applied — requires architectural decision):
- Split non-component exports into separate utility files
- Add `// eslint-disable-next-line react-refresh/only-export-components` per-site
- Add rule override in `.eslintrc.cjs` if fast-refresh HMR isn't needed for these files

END OF LINE.
