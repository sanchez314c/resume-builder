# Build and Compile Guide

## Overview

Resume Builder uses [electron-vite](https://electron-vite.org) to bundle the Electron main/preload/renderer processes, and [electron-builder](https://www.electron.build) to package the app for distribution.

Builds use all available CPU cores automatically (`nproc`).

## Quick Build

```bash
# Build for current platform
npm run build

# Build specific platforms
npm run build:linux     # AppImage + .deb
npm run build:win       # NSIS installer + portable
npm run build:mac       # DMG + ZIP

# Build all platforms (requires platform-specific tooling)
npm run build:all
./scripts/build-all.sh  # Includes lint + test gate
```

## Output Formats

| Platform | Format | Description |
|----------|--------|-------------|
| Linux | AppImage | Portable, no install needed |
| Linux | .deb | Debian/Ubuntu package |
| Windows | NSIS | Standard installer wizard |
| Windows | Portable | No-install executable |
| macOS | DMG | Drag-to-Applications disk image |
| macOS | ZIP | For auto-update distribution |

Artifacts land in `dist/` after the build.

## Build Configuration

`config/electron-builder.yml` contains all packaging configuration. Key settings:

- **App ID**: set to your reverse-domain identifier
- **Product name**: `Resume Builder`
- **Platform targets**: as above
- **Files**: controls what gets bundled into the app package

The Python sidecar is **not bundled** by default — it requires the user to have the conda environment set up. For a fully self-contained distributable, you would need to bundle a Python runtime (see below).

## electron-vite Build Process

`electron-vite build` compiles three targets in one pass:

1. `main` — TypeScript → CommonJS, output to `dist/main/`
2. `preload` — TypeScript → CommonJS, output to `dist/preload/`
3. `renderer` — React + TypeScript → ESM + HTML, output to `dist/renderer/`

Configuration is in `electron.vite.config.ts`.

## TypeScript Compilation

TypeScript is compiled as part of the Vite build. To check types without building:

```bash
npm run typecheck
```

Config files:

- `tsconfig.json` — renderer + shared types
- `tsconfig.node.json` — main process + preload (Node.js env)

## Python Sidecar Bundling

The Python sidecar at `src/python/` is a FastAPI server that runs as a separate process. For development and Linux distributions, users are expected to manage the conda environment themselves.

For a packaged distributable that includes Python:

- **Option A**: PyInstaller — bundle the sidecar into a single executable
- **Option B**: Miniconda bootstrap — ship a minimal Python with the app and run `pip install` on first launch

Neither is implemented yet (tracked in `docs/TODO.md`). The current distribution model requires users to run `./scripts/setup-conda.sh` before launching.

## Running the Build Script

`scripts/build-all.sh` is a full pipeline:

```bash
./scripts/build-all.sh
```

It runs:

1. `rm -rf dist/ out/` — clean previous builds
2. `npm ci` — reproducible install from lockfile
3. `npm run lint` — ESLint (non-blocking, warns on failure)
4. `npm test` — Vitest (non-blocking, warns on failure)
5. `npm run build:all` — electron-vite + electron-builder for all platforms

## Cross-Platform Builds

Building for all platforms from a single machine requires platform-specific native modules. The practical approach:

- **Linux builds**: build on Linux (or a Linux CI runner)
- **Windows builds**: build on Windows or use Wine + electron-builder
- **macOS builds**: must build on macOS (code signing requires macOS)

For CI/CD, use separate runners per platform and combine artifacts.

## Code Signing

Code signing is not configured in the current `electron-builder.yml`. For distribution:

- **macOS**: requires Apple Developer ID certificate
- **Windows**: requires a code signing certificate (EV or OV)
- **Linux**: AppImages can be signed with GPG

Add signing config to `config/electron-builder.yml` when setting up a release pipeline.

## Environment Variables at Build Time

Vite exposes env vars prefixed with `VITE_` to the renderer at build time. Set them in `.env.production` for production builds:

```env
VITE_APP_VERSION=1.0.0
VITE_NLP_BACKEND_URL=http://127.0.0.1:49372
```

## Cleaning

```bash
npm run clean
# removes: dist/, out/, node_modules/.cache/
```

## Build Troubleshooting

**`electron-builder` fails on `better-sqlite3`**: This native module must be compiled for Electron's Node version. Run:

```bash
npm run postinstall   # triggers electron-builder install-app-deps
```

**Vite HMR broken after `npm install`**: Clear the Vite cache:

```bash
rm -rf node_modules/.cache
npm run dev
```

**`typecheck` fails but build succeeds**: electron-vite has less strict type checking than `tsc --noEmit`. Fix type errors before committing:

```bash
npm run typecheck
```

**Python sidecar not starting in packaged app**: The packaged app expects the conda env `resume-builder` to exist. Check `python-bridge.ts` for the conda activation logic and ensure the env name matches `CONDA_ENV_NAME` in the bridge.
