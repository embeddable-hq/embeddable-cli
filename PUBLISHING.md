# Publishing Guide

## Quick Release

The easiest way to publish a new version:

```bash
# Interactive mode - prompts for version type
npm run publish

# Or directly specify version type:
npm run publish:patch  # For bug fixes (0.1.0 → 0.1.1)
npm run publish:minor  # For new features (0.1.0 → 0.2.0)
npm run publish:major  # For breaking changes (0.1.0 → 1.0.0)
```

## What Happens During Publishing

1. **Pre-checks**: Ensures you're on main branch with no uncommitted changes
2. **Tests**: Runs typecheck, lint, and build
3. **Version bump**: Updates version in package.json
4. **Git operations**: Commits, tags, and pushes
5. **Automated release**: GitHub Actions handles the rest

## After Publishing

GitHub Actions will automatically:
- Create a GitHub release
- Build binaries for all platforms
- Publish to npm as `@embeddable/cli`
- Update the Homebrew formula

Monitor progress at: https://github.com/embeddable-hq/embeddable-cli/actions

## Manual Steps (if needed)

### Update Homebrew Formula Manually

If the automated update fails:

1. Get the SHA256 of the new release:
   ```bash
   curl -L https://github.com/embeddable-hq/embeddable-cli/archive/refs/tags/v0.1.0.tar.gz | shasum -a 256
   ```

2. Update `embeddable-hq/homebrew-embeddable` repository:
   - Edit `Formula/embed.rb`
   - Update `url` and `sha256`
   - Commit and push

### Publish to npm Manually

If npm publish fails in CI:

```bash
npm publish --access public
```

## Troubleshooting

- **"You must be on the main branch"**: Switch to main with `git checkout main`
- **"You have uncommitted changes"**: Commit or stash changes
- **Build/lint failures**: Fix issues and try again
- **GitHub Actions failure**: Check logs at the actions page