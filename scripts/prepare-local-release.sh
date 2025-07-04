#!/bin/bash

# Script to prepare a local release for Homebrew testing
set -e

echo "🍺 Preparing local Homebrew release"
echo "===================================="

# Get current version
VERSION=$(node -p "require('./package.json').version")
echo "Version: $VERSION"

# Create a temporary directory for the release
TEMP_DIR=$(mktemp -d)
RELEASE_NAME="embeddable-cli-v${VERSION}"
RELEASE_DIR="${TEMP_DIR}/${RELEASE_NAME}"

echo "Creating release directory: $RELEASE_DIR"
mkdir -p "$RELEASE_DIR"

# Copy necessary files
echo "Copying files..."
cp -r src package.json package-lock.json tsconfig.json README.md LICENSE "$RELEASE_DIR/" 2>/dev/null || true

# Create tarball
cd "$TEMP_DIR"
tar -czf "${RELEASE_NAME}.tar.gz" "$RELEASE_NAME"

# Calculate SHA256
SHA256=$(shasum -a 256 "${RELEASE_NAME}.tar.gz" | cut -d' ' -f1)

# Move tarball to project root
mv "${RELEASE_NAME}.tar.gz" "${OLDPWD}/"

# Clean up
rm -rf "$TEMP_DIR"

cd "$OLDPWD"

echo ""
echo "✅ Release tarball created: ${RELEASE_NAME}.tar.gz"
echo "📊 SHA256: $SHA256"
echo ""
echo "Next steps:"
echo "1. Upload ${RELEASE_NAME}.tar.gz to GitHub releases (or host locally)"
echo "2. Update the formula with:"
echo "   - URL to the tarball"
echo "   - SHA256: $SHA256"
echo ""

# Update formula with local path for testing
FORMULA_PATH="homebrew-tap/Formula/embed.rb"
if [ -f "$FORMULA_PATH" ]; then
    echo "For local testing, you can use:"
    echo "  url \"file://$(pwd)/${RELEASE_NAME}.tar.gz\""
    echo "  sha256 \"$SHA256\""
fi