# Contributing Guide

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/your-username/resume-builder.git`
3. Install dependencies: `npm install`
4. Install Python env: `./scripts/setup-conda.sh`
5. Create a feature branch: `git checkout -b feature/my-feature`

## Development Workflow

### Making Changes

1. Code with TypeScript strict mode enabled
2. Follow existing code style (see `CLAUDE.md`)
3. Write tests for new features
4. Run linting: `npm run lint:fix`
5. Type check: `npm run typecheck`

### Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Coverage
npm run test:coverage
```

### Commit Messages

Follow conventional commits:

```
feat: add skill category filtering
fix: resolve ChatGPT parser edge case
docs: update installation instructions
refactor: simplify IPC handler structure
test: add achievement detector tests
```

## Pull Requests

1. Update documentation if needed
2. Ensure all tests pass
3. Request review from maintainers
4. Address review feedback

### PR Description Template

```markdown
## What this PR does

- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Changes made

- Bullet point 1
- Bullet point 2

## Testing

- [ ] Unit tests added/updated
- [ ] E2E tests added/updated
- [ ] Manual testing completed

## Screenshots (if applicable)

[Attach screenshots]

## Checklist

- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No new warnings generated
- [ ] Tests added/updated
- [ ] All tests passing
```

## Code Style

- TypeScript strict mode
- Functional React components with hooks
- Zustand for state (no Redux)
- Tailwind for styling
- Absolute imports: `import { foo } from '@/components/foo'`

## Adding Features

1. Discuss in issue first
2. Update PRD if major feature
3. Update ARCHITECTURE.md if structural change
4. Add tests for coverage

## Reporting Bugs

Use GitHub Issues with:
- Clear title
- Steps to reproduce
- Expected vs actual behavior
- OS and app version
- Screenshots if applicable

## Questions?

Open a GitHub Discussion or contact maintainers.
