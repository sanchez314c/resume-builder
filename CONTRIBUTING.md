# Contributing to Resume Builder

Thanks for your interest in contributing.

## Dev Environment Setup

**Prerequisites:**
- Node.js >= 18.0.0
- Miniconda or Anaconda (for Python NLP sidecar)
- Git

```bash
# Clone and install Node deps
git clone https://github.com/sanchez314c/resume-builder.git
cd resume-builder
npm install

# Set up Python environment (one-time)
./scripts/setup-conda.sh

# Start dev mode (Electron + Python backend)
./run-source-linux.sh

# Or on Linux if sandbox issues occur:
./run-source-linux.sh --no-sandbox
```

## Commit Convention

This project uses [Conventional Commits](https://www.conventionalcommits.org/):

| Prefix | When to use |
|--------|-------------|
| `feat:` | New feature |
| `fix:` | Bug fix |
| `docs:` | Documentation only |
| `refactor:` | Code change with no behavior change |
| `test:` | Adding or updating tests |
| `chore:` | Build system, dependency updates |
| `perf:` | Performance improvement |

## Code Standards

- TypeScript strict mode — no implicit `any`
- ESLint runs on all `.ts` and `.tsx` files: `npm run lint`
- Prettier for formatting: `npm run format`
- All IPC channels defined in `src/common/constants.ts` — never use string literals in `ipcMain.handle` or `ipcRenderer.invoke`
- Python code: PEP 8, type annotations required on all function signatures
- Functions under 50 lines; files under 800 lines

## Testing

```bash
npm run test              # Vitest unit tests
npm run test:run          # Single run (CI mode)
npm run test:coverage     # Coverage report
npm run test:e2e          # Playwright E2E
```

Unit tests live in `tests/unit/`. Parser tests are in `tests/unit/parsers.test.ts`.

## Branch Workflow

1. Branch from `main`: `git checkout -b feat/your-feature`
2. Make changes with incremental commits
3. Run `npm run lint` and `npm run test:run` before pushing
4. Open a Pull Request using the PR template
5. Reference any related issues

## Pull Request Guidelines

- Keep PRs focused — one feature or fix per PR
- Include tests for new behavior
- Update relevant docs in `docs/` if the change affects documented behavior
- Update `CHANGELOG.md` under `[Unreleased]`

## Security Issues

Do not open public issues for security vulnerabilities. See [SECURITY.md](SECURITY.md) for the reporting process.

## Code of Conduct

This project follows the [Contributor Covenant](CODE_OF_CONDUCT.md). Be respectful.
