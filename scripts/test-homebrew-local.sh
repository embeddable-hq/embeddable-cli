#!/bin/bash

echo "🧪 Testing Homebrew installation locally"
echo "======================================="

# Tap the local repository
echo "Adding local tap..."
brew tap embeddable-local "$(pwd)/homebrew-tap"

# Install the formula
echo "Installing embed..."
brew install embeddable-local/tap/embed

# Test the installation
echo "Testing installation..."
embed version

echo ""
echo "To uninstall:"
echo "  brew uninstall embed"
echo "  brew untap embeddable-local/tap"