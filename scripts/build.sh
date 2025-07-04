#!/bin/bash

# Build script for Embeddable CLI
# This script builds the CLI for all platforms using Bun

echo "Building Embeddable CLI..."

# Check if bun is installed
if ! command -v bun &> /dev/null; then
    echo "Bun is not installed. Please install Bun to build native binaries."
    echo "Visit: https://bun.sh"
    exit 1
fi

# Build TypeScript first
echo "Compiling TypeScript..."
npm run build

# Create binaries
echo "Creating platform binaries..."

# Linux x64
echo "Building for Linux x64..."
bun build src/index.ts --compile --target=bun-linux-x64 --outfile dist/embed-linux-x64

# macOS ARM64
echo "Building for macOS ARM64..."
bun build src/index.ts --compile --target=bun-darwin-arm64 --outfile dist/embed-macos-arm64

# Windows x64
echo "Building for Windows x64..."
bun build src/index.ts --compile --target=bun-windows-x64 --outfile dist/embed-win-x64.exe

echo "Build complete! Binaries are in the dist/ directory."