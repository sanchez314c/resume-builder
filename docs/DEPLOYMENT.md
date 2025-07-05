# Deployment Guide

## Distribution Channels

### GitHub Releases
1. Build all platforms: `npm run build:all`
2. Artifacts appear in `dist/` directory
3. Upload to GitHub Releases with version tag

### Platform-Specific Outputs

| Platform | Format | Command | Location |
|----------|--------|---------|----------|
| Linux | AppImage | `npm run build:linux` | `dist/Resume-Builder-1.0.0.AppImage` |
| Linux | deb | `npm run build:linux` | `dist/resume-builder_1.0.0_amd64.deb` |
| Windows | NSIS | `npm run build:win` | `dist/Resume Builder Setup 1.0.0.exe` |
| Windows | Portable | `npm run build:win` | `dist/Resume Builder 1.0.0.exe` |
| macOS | DMG | `npm run build:mac` | `dist/Resume-Builder-1.0.0.dmg` |
| macOS | ZIP | `npm run build:mac` | `dist/Resume-Builder-1.0.0-mac.zip` |

## Pre-Release Checklist

- [ ] Version updated in `package.json`
- [ ] CHANGELOG.md updated with release notes
- [ ] All tests passing: `npm run test:run`
- [ ] Lint clean: `npm run lint`
- [ ] Type check passes: `npm run typecheck`
- [ ] Built on target platform for platform-specific builds
- [ ] Tested installation on clean system

## Signing (Future)

macOS and Windows builds should be code-signed before distribution. Keys must be configured in `electron-builder.yml`.

## Auto-Update (Future)

Consider integrating electron-updater for silent updates. Requires update server configuration.
