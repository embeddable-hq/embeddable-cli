#!/bin/bash

# Simple publish script for Embeddable CLI
set -e

echo "🚀 Embeddable CLI Release"
echo "========================"

# Check if we're on main branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ]; then
    echo "❌ Error: You must be on the main branch to release"
    echo "   Current branch: $CURRENT_BRANCH"
    exit 1
fi

# Check for uncommitted changes
if ! git diff-index --quiet HEAD --; then
    echo "❌ Error: You have uncommitted changes"
    echo "   Please commit or stash your changes first"
    exit 1
fi

# Pull latest changes and tags
echo "📥 Pulling latest changes and tags..."
git pull origin main
git fetch --tags

# Get the latest tag from remote
LATEST_TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "v0.0.0")
LATEST_VERSION=${LATEST_TAG#v}  # Remove 'v' prefix

echo "📌 Latest published version: $LATEST_TAG"

# Get current version from package.json
PACKAGE_VERSION=$(node -p "require('./package.json').version")

# If package.json version is different from latest tag, use package.json version
if [ "$PACKAGE_VERSION" != "$LATEST_VERSION" ]; then
    echo "📦 Package.json version ($PACKAGE_VERSION) differs from latest tag ($LATEST_VERSION)"
    echo "   Using package.json version as base"
    CURRENT_VERSION=$PACKAGE_VERSION
else
    CURRENT_VERSION=$LATEST_VERSION
fi

# Determine version bump type
VERSION_TYPE="${1:-patch}"  # Default to patch if not specified

if [ "$VERSION_TYPE" = "help" ] || [ "$VERSION_TYPE" = "--help" ] || [ "$VERSION_TYPE" = "-h" ]; then
    echo ""
    echo "Usage: pnpm publish [patch|minor|major|<version>]"
    echo ""
    echo "Options:"
    echo "  patch    - Increment patch version (default)"
    echo "  minor    - Increment minor version"
    echo "  major    - Increment major version"
    echo "  <version> - Set specific version (e.g., 1.2.3)"
    echo ""
    echo "Examples:"
    echo "  pnpm publish          # Bump patch version"
    echo "  pnpm publish patch    # Bump patch version"
    echo "  pnpm publish minor    # Bump minor version"
    echo "  pnpm publish major    # Bump major version"
    echo "  pnpm publish 1.2.3    # Set specific version"
    exit 0
fi

# Check if it's a custom version
if [[ "$VERSION_TYPE" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    NEW_VERSION="$VERSION_TYPE"
    VERSION_TYPE="custom"
    echo "📝 Setting custom version: v$NEW_VERSION"
else
    # Calculate new version using semver
    case $VERSION_TYPE in
        patch|minor|major)
            NEW_VERSION=$(npx semver $CURRENT_VERSION -i $VERSION_TYPE)
            echo "📝 Bumping $VERSION_TYPE version: v$CURRENT_VERSION → v$NEW_VERSION"
            ;;
        *)
            echo "❌ Invalid version type: $VERSION_TYPE"
            echo "   Use: patch, minor, major, or a specific version (e.g., 1.2.3)"
            exit 1
            ;;
    esac
fi

# Run pre-release checks
echo ""
echo "🧪 Running pre-release checks..."

echo "  → Type checking..."
pnpm typecheck

echo "  → Linting..."
pnpm lint

echo "  → Building..."
pnpm build

echo "✅ All checks passed!"

# Update package.json version
echo ""
echo "📝 Updating package.json..."
npm version "$NEW_VERSION" --no-git-tag-version
echo "✅ Version updated to v$NEW_VERSION"

# Show what will be released
echo ""
echo "📋 Release Summary:"
echo "   • Version: v$NEW_VERSION"
echo "   • Type: $VERSION_TYPE"
echo "   • Branch: $CURRENT_BRANCH"
echo ""

# Confirm release
read -p "🤔 Proceed with release? (y/N) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Release cancelled"
    # Revert package.json changes
    git checkout -- package.json package-lock.json
    exit 1
fi

# Commit version bump
echo ""
echo "💾 Committing version bump..."
git add package.json package-lock.json pnpm-lock.yaml 2>/dev/null || git add package.json pnpm-lock.yaml
git commit -m "chore: release v$NEW_VERSION"

# Create and push tag
echo ""
echo "🏷️  Creating tag v$NEW_VERSION..."
git tag -a "v$NEW_VERSION" -m "Release v$NEW_VERSION"

# Push everything
echo ""
echo "📤 Pushing to GitHub..."
git push origin main
git push origin "v$NEW_VERSION"

echo ""
echo "✨ Release v$NEW_VERSION pushed successfully!"
echo ""
echo "🤖 GitHub Actions will now:"
echo "  • Create a GitHub release with installation instructions"
echo "  • Build binaries for Linux, macOS (Intel & ARM), and Windows"
echo "  • Automatically update the Homebrew formula"
echo "  • Update Scoop manifest (if configured)"
echo ""
echo "📊 Monitor progress at:"
echo "   https://github.com/embeddable-hq/embeddable-cli/actions"
echo ""
echo "📦 Once complete, users can install via:"
echo "  • Homebrew: brew install embeddable-hq/embeddable/embed"
echo "  • Direct download from GitHub releases"
echo "  • Scoop: scoop install embed"
echo ""
echo "🎉 Done! The release will be available in a few minutes."