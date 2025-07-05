# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 1.0.x   | ✓ Yes     |
| < 1.0   | ✗ No      |

## Reporting Vulnerabilities

**DO NOT** open public issues for security vulnerabilities.

Email: security@jasonpaulmichaels.co

Include:
- Vulnerability description
- Steps to reproduce
- Impact assessment
- Suggested fix (optional)

Response within 48 hours.

## Security Model

### Local-First Processing
- All NLP processing runs locally
- No telemetry or data collection
- Optional Claude API requires explicit key entry

### Data Storage
- SQLite database in user data directory
- Claude API key stored in OS keychain
- No plain-text credentials in config files

### Electron Security
- `nodeIntegration: disabled`
- Context bridge for IPC
- CSP headers configured
- Navigation to external URLs blocked

### Python Sidecar
- Runs on localhost only
- No external network access
- Input validation on all endpoints

## Vulnerability Types

### Known Mitigations

| Type | Mitigation |
|------|------------|
| XSS | React escaping, CSP |
| Code Injection | No eval(), typed IPC |
| Path Traversal | Validated file paths |
| CSRF | N/A (desktop app) |
| XXE | Disabled in JSON parser |

## Dependency Updates

Automated via:
- Dependabot (GitHub Actions)
- Manual audits monthly

## Security Audits

| Date | Auditor | Scope | Results |
|------|---------|-------|---------|
| TBD | TBD | Full app | Pending |

## Best Practices for Contributors

1. Never commit API keys or tokens
2. Use TypeScript strict mode
3. Validate all user input
4. Follow principle of least privilege
5. Keep dependencies updated

## Disclosure Policy

- Confirmed vulnerabilities patched within 7 days
- Users notified via security advisory
- CVE requested for critical issues
- Full disclosure after patch release
