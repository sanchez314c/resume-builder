# Versioning Policy

## Semantic Versioning

Resume Builder follows [Semantic Versioning 2.0.0](https://semver.org/).

- **MAJOR**: Incompatible API changes
- **MINOR**: Backwards-compatible functionality
- **PATCH**: Backwards-compatible bug fixes

Format: `MAJOR.MINOR.PATCH` (e.g., `1.2.3`)

## Version Release Process

1. Update version in `package.json`
2. Update CHANGELOG.md with release notes
3. Commit: `git commit -m "chore: release v1.2.3"`
4. Tag: `git tag v1.2.3`
5. Push: `git push && git push --tags`
6. GitHub Actions builds release artifacts

## Changelog Format

```markdown
## [1.2.3] - 2026-04-09

### Added
- Feature A
- Feature B

### Changed
- Updated dependency X to v2.0

### Fixed
- Bug fix C

### Removed
- Deprecated feature D
```

## Branch Strategy

- `main`: Stable releases
- `develop`: Development branch
- `feature/*`: Feature branches
- `fix/*`: Bugfix branches
- `release/*`: Release preparation

## Compatibility

### Python Sidecar
Version pinned in `src/python/requirements.txt`. Major version bumps require migration guide.

### Database Schema
SQLite schema migrations handled via Drizzle. Backwards-compatible changes only in MINOR versions.

### File Format
Project files use JSON. Backwards compatibility maintained for at least one MAJOR version.
