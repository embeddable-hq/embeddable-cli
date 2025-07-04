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

# Pull latest changes
echo "📥 Pulling latest changes..."
git pull origin main

# Get current version
CURRENT_VERSION=$(node -p "require('./package.json').version")
echo "📌 Current version: v$CURRENT_VERSION"

# Determine version bump type
if [ -z "$1" ]; then
    echo ""
    echo "Select version bump type:"
    echo "  1) Patch (bug fixes)     - $CURRENT_VERSION → $(npx semver $CURRENT_VERSION -i patch)"
    echo "  2) Minor (new features)  - $CURRENT_VERSION → $(npx semver $CURRENT_VERSION -i minor)"
    echo "  3) Major (breaking)      - $CURRENT_VERSION → $(npx semver $CURRENT_VERSION -i major)"
    echo "  4) Custom version"
    echo ""
    read -p "Enter your choice (1-4): " CHOICE
    
    case $CHOICE in
        1) VERSION_TYPE="patch" ;;
        2) VERSION_TYPE="minor" ;;
        3) VERSION_TYPE="major" ;;
        4) 
            read -p "Enter custom version (without 'v'): " CUSTOM_VERSION
            VERSION_TYPE="custom"
            ;;
        *)
            echo "❌ Invalid choice"
            exit 1
            ;;
    esac
else
    VERSION_TYPE="$1"
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

# Bump version
echo ""
echo "📝 Bumping version..."

if [ "$VERSION_TYPE" = "custom" ]; then
    npm version "$CUSTOM_VERSION" --no-git-tag-version
    NEW_VERSION="$CUSTOM_VERSION"
else
    npm version "$VERSION_TYPE" --no-git-tag-version
    NEW_VERSION=$(node -p "require('./package.json').version")
fi

echo "✅ Version bumped to v$NEW_VERSION"

# Commit version bump
echo ""
echo "💾 Committing version bump..."
git add package.json package-lock.json
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
echo "  • Create a GitHub release"
echo "  • Build binaries for all platforms"
echo "  • Publish to npm"
echo "  • Update the Homebrew formula"
echo ""
echo "📊 Monitor progress at:"
echo "   https://github.com/embeddable-hq/embeddable-cli/actions"
echo ""
echo "🎉 Done! The release will be available in a few minutes."