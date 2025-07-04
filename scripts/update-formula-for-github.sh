#!/bin/bash

# Script to update formula for GitHub release
echo "📝 Update Formula for GitHub Release"
echo "===================================="

VERSION="0.1.0"
GITHUB_URL="https://github.com/embeddable-hq/embeddable-cli/archive/refs/tags/v${VERSION}.tar.gz"

echo "Downloading GitHub tarball to calculate SHA256..."
curl -L -o github-release.tar.gz "$GITHUB_URL"

SHA256=$(shasum -a 256 github-release.tar.gz | cut -d' ' -f1)
rm github-release.tar.gz

echo ""
echo "Update your Formula/embed.rb with:"
echo ""
echo "  url \"$GITHUB_URL\""
echo "  sha256 \"$SHA256\""
echo ""
echo "Then push to your tap repository."