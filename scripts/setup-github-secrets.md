# GitHub Secrets Setup

To enable automatic releases, you need to set up the following GitHub secrets in your repository settings:

## Required Secret

### HOMEBREW_TAP_TOKEN

This is a GitHub Personal Access Token that allows the workflow to update your Homebrew tap repository.

1. Go to https://github.com/settings/tokens/new
2. Give it a descriptive name like "Homebrew Tap Update"
3. Select expiration (recommend 1 year)
4. Select scopes:
   - `repo` (Full control of private repositories)
   - Or if tap is public: `public_repo` (Access public repositories)
5. Click "Generate token"
6. Copy the token
7. Go to https://github.com/embeddable-hq/embeddable-cli/settings/secrets/actions
8. Click "New repository secret"
9. Name: `HOMEBREW_TAP_TOKEN`
10. Value: paste the token
11. Click "Add secret"

## Optional Secret

### SCOOP_BUCKET_TOKEN

Only needed if you have a Scoop bucket repository for Windows users.

Follow the same steps as above but name it `SCOOP_BUCKET_TOKEN`.

## Testing

After setting up the secrets, your next release will automatically:
- Build binaries for all platforms
- Update the Homebrew formula
- Create a GitHub release with all assets

Test by pushing a new tag:
```bash
git tag v0.1.1
git push origin v0.1.1
```