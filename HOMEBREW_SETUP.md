# Homebrew Setup Guide

## For Local Testing (without GitHub)

1. Create release tarball:
   ```bash
   ./scripts/prepare-local-release.sh
   ```

2. Test locally:
   ```bash
   ./scripts/test-homebrew-local.sh
   ```

## For Production Release

### 1. Create GitHub Repositories

You need two repositories:
- **Main repo**: `embeddable-hq/embeddable-cli` (for your CLI code)
- **Tap repo**: `embeddable-hq/homebrew-embeddable` (for Homebrew formula)

### 2. Push Tap Repository

```bash
cd homebrew-tap
git remote add origin https://github.com/embeddable-hq/homebrew-embeddable.git
git push -u origin main
cd ..
```

### 3. Create GitHub Release

```bash
# Tag and push your main repository
git tag v0.1.0
git push origin v0.1.0
```

Then go to GitHub and create a release from this tag.

### 4. Update Formula with GitHub URL

After creating the release:

```bash
# Get the SHA256 of the GitHub release tarball
./scripts/update-formula-for-github.sh
```

Update `homebrew-tap/Formula/embed.rb` with the provided URL and SHA256, then:

```bash
cd homebrew-tap
git add Formula/embed.rb
git commit -m "Update embed formula for v0.1.0"
git push
cd ..
```

### 5. Install via Homebrew

Now anyone can install your CLI:

```bash
brew tap embeddable-hq/embeddable
brew install embed
```

## Alternative: Quick Local Install

If you just want to test locally without GitHub:

1. Build the project:
   ```bash
   pnpm install
   pnpm build
   ```

2. Create symlink:
   ```bash
   npm link
   ```

3. Use the CLI:
   ```bash
   embed version
   ```

## Updating the Formula

When releasing new versions:

1. Create new GitHub release
2. Run `./scripts/update-formula-for-github.sh`
3. Update formula with new URL and SHA256
4. Commit and push to tap repository

Users can then update with:
```bash
brew update
brew upgrade embed
```