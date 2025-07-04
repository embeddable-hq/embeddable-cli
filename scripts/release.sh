#!/bin/bash

# Release script for Embeddable CLI
set -e

echo "🚀 Embeddable CLI Release Script"
echo "================================"

# Check if we're on main branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ]; then
    echo "❌ Error: You must be on the main branch to release"
    exit 1
fi

# Check for uncommitted changes
if ! git diff-index --quiet HEAD --; then
    echo "❌ Error: You have uncommitted changes"
    exit 1
fi

# Get current version from package.json
CURRENT_VERSION=$(node -p "require('./package.json').version")
echo "Current version: v$CURRENT_VERSION"

# Prompt for new version
echo ""
echo "Enter new version (without 'v' prefix):"
read NEW_VERSION

if [ -z "$NEW_VERSION" ]; then
    echo "❌ Error: Version cannot be empty"
    exit 1
fi

# Validate version format
if ! [[ "$NEW_VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+(-[a-zA-Z0-9.-]+)?$ ]]; then
    echo "❌ Error: Invalid version format. Use semantic versioning (e.g., 1.2.3 or 1.2.3-beta.1)"
    exit 1
fi

echo ""
echo "📝 Release Notes"
echo "================"
echo "Enter release notes (press Ctrl+D when done):"
RELEASE_NOTES=$(cat)

echo ""
echo "📋 Release Summary"
echo "=================="
echo "Current version: v$CURRENT_VERSION"
echo "New version:     v$NEW_VERSION"
echo ""
echo "Release notes:"
echo "$RELEASE_NOTES"
echo ""

# Confirm release
echo "Do you want to proceed with the release? (y/N)"
read CONFIRM

if [ "$CONFIRM" != "y" ] && [ "$CONFIRM" != "Y" ]; then
    echo "❌ Release cancelled"
    exit 0
fi

echo ""
echo "🔧 Updating version..."

# Update package.json version
npm version $NEW_VERSION --no-git-tag-version

# Commit version bump
git add package.json package-lock.json
git commit -m "chore: bump version to v$NEW_VERSION"

# Create and push tag
echo "🏷️  Creating tag..."
git tag -a "v$NEW_VERSION" -m "Release v$NEW_VERSION

$RELEASE_NOTES"

echo "📤 Pushing changes..."
git push origin main
git push origin "v$NEW_VERSION"

echo ""
echo "✅ Release v$NEW_VERSION created successfully!"
echo ""
echo "The GitHub Actions workflow will now:"
echo "  1. Create a GitHub release"
echo "  2. Build binaries for all platforms"
echo "  3. Publish to npm"
echo "  4. Update the Homebrew tap"
echo ""
echo "You can monitor the progress at:"
echo "https://github.com/embeddable-hq/embeddable-cli/actions"