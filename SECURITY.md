# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

If you discover a security vulnerability, please report it responsibly:

1. **Do NOT** open a public issue
2. Email security concerns to: [security@example.com]
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

## Response Timeline

- **Initial Response**: Within 48 hours
- **Status Update**: Within 7 days
- **Resolution Target**: Within 30 days (severity dependent)

## Security Practices

This application:
- Processes data locally by default
- Does not transmit personal data without consent
- Stores sensitive data encrypted at rest
- Follows OWASP security guidelines

## Scope

Security reports are accepted for:
- The Electron application
- Build and distribution pipeline
- Dependencies with known vulnerabilities

Out of scope:
- Legacy Python scripts (reference only)
- Third-party services
