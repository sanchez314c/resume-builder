#!/bin/bash
#
# build-all.sh
# Cross-platform build script
#
# Usage: ./scripts/build-all.sh
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR"

echo "=========================================="
echo "  Resume Builder - Build All Platforms"
echo "=========================================="

# Get CPU cores for parallel build
CORES=$(nproc 2>/dev/null || sysctl -n hw.ncpu 2>/dev/null || echo 4)
echo "[*] Using $CORES CPU cores for build"

# Clean previous builds
echo "[*] Cleaning previous builds..."
rm -rf dist/ out/

# Install dependencies
echo "[*] Checking dependencies..."
npm ci

# Run linting
echo "[*] Running linter..."
npm run lint || echo "[!] Lint warnings present"

# Run tests
echo "[*] Running tests..."
npm test || echo "[!] Some tests failed"

# Build application
echo "[*] Building application..."
npm run build:all

echo "=========================================="
echo "  Build Complete"
echo "  Output: dist/"
echo "=========================================="
