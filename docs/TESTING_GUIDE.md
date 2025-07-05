# Testing Guide

## Test Structure

```
tests/
├── unit/           # Vitest unit tests
├── integration/    # Integration tests
└── e2e/           # Playwright E2E tests
```

## Unit Tests (Vitest)

### Running
```bash
npm run test              # Watch mode
npm run test:run         # Single run
npm run test:coverage    # With coverage
```

### Example
```typescript
import { describe, it, expect } from 'vitest';
import { extractSkills } from '@/lib/parsers/skills';

describe('Skill Extraction', () => {
  it('extracts Python skills from text', () => {
    const text = 'I have experience with Python and Django';
    const skills = extractSkills(text);
    expect(skills).toContain('python');
    expect(skills).toContain('django');
  });
});
```

## Integration Tests

### Running
```bash
npm run test:integration
```

### Example
```typescript
import { test, expect } from 'vitest';
import { parseChatGPTExport } from '@/lib/parsers/chatgpt-parser';

test('parses ChatGPT tree structure', async () => {
  const result = await parseChatGPTExport(validChatGPTJSON);
  expect(result.messages).toHaveLength(42);
});
```

## E2E Tests (Playwright)

### Running
```bash
npm run test:e2e              # Headless
npm run test:e2e:ui           # With UI
```

### Example
```typescript
import { test, expect } from '@playwright/test';

test('import and analyze conversation', async ({ page }) => {
  await page.goto('/');
  await page.click('[data-testid="import-button"]');
  await page.setInputFiles('input[type="file"]', 'test-data/chatgpt.json');
  await page.click('[data-testid="analyze-button"]');
  await expect(page.locator('[data-testid="skills-list"]')).toBeVisible();
});
```

## Test Data

Place test fixtures in `tests/fixtures/`:
- `chatgpt-export.json`
- `claude-export.json`
- `malformed.json`

## Coverage Goals

- **Statements**: >80%
- **Branches**: >75%
- **Functions**: >80%
- **Lines**: >80%

## CI/CD

GitHub Actions runs:
1. Linting
2. Type checking
3. Unit tests
4. E2E tests (on matrix of OS versions)

## Writing Good Tests

1. **Arrange-Act-Assert**: Setup, execute, verify
2. **Descriptive names**: `test('returns error when file is missing')`
3. **Test edge cases**: Empty input, null, malformed data
4. **Mock external deps**: File system, IPC, Python API
5. **Avoid brittle selectors**: Use `data-testid` attributes
