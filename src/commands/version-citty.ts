import { defineCommand } from 'citty';
import * as p from '@clack/prompts';
import { ConfigManager } from '../lib/config-manager.js';
import { Logger } from '../utils/logger.js';
import { handleError } from '../utils/errors.js';
import packageJson from '../../package.json' with { type: 'json' };
import { execSync } from 'child_process';
import semver from 'semver';

const { version: currentVersion } = packageJson;

interface GitHubRelease {
  tag_name: string;
  name: string;
  published_at: string;
  html_url: string;
  body: string;
}

export function createVersionCommand() {
  return defineCommand({
    meta: {
      name: 'version',
      description: 'Check current version and updates',
    },
    args: {
      check: {
        type: 'boolean',
        alias: 'c',
        description: 'Check for updates',
      },
      update: {
        type: 'boolean',
        alias: 'u',
        description: 'Update to latest version',
      },
    },
    async run({ args }) {
      try {
        const config = ConfigManager.getConfig();
        const regionDisplay = config ? ConfigManager.getRegionDisplay(config.region) : '';
        
        Logger.info(`Embeddable CLI v${currentVersion}`);
        if (regionDisplay) {
          Logger.log(`Region: ${regionDisplay}`);
        }
        
        if (args.check || args.update) {
          await checkForUpdates(args.update as boolean);
        }
      } catch (error) {
        handleError(error);
      }
    },
  });
}

async function checkForUpdates(autoUpdate: boolean = false) {
  const spinner = p.spinner();
  spinner.start('Checking for updates...');
  
  try {
    // Check GitHub releases
    const response = await fetch('https://api.github.com/repos/embeddable-hq/embeddable-cli/releases/latest', {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
      },
    });
    
    if (!response.ok) {
      spinner.stop('Failed to check for updates', 1);
      return;
    }
    
    const release = await response.json() as GitHubRelease;
    const latestVersion = release.tag_name.replace(/^v/, '');
    
    spinner.stop();
    
    if (semver.gt(latestVersion, currentVersion)) {
      Logger.success(`New version available: v${latestVersion} (current: v${currentVersion})`);
      
      // Extract actual release notes, filtering out installation instructions
      const releaseNotes = extractReleaseNotes(release.body || '');
      if (releaseNotes) {
        Logger.log(`\nChanges:`);
        Logger.log(releaseNotes);
      }
      
      if (autoUpdate || await confirmUpdate()) {
        await performUpdate(latestVersion);
      } else {
        Logger.log(`\nTo update: embed version --update`);
      }
    } else if (semver.eq(latestVersion, currentVersion)) {
      Logger.success(`You're on the latest version (v${currentVersion})`);
    } else {
      Logger.info(`You're on a newer version (v${currentVersion}) than the latest release (v${latestVersion})`);
    }
  } catch (error) {
    spinner.stop('Failed to check for updates', 1);
    Logger.debug(`Update check error: ${error}`);
  }
}

async function confirmUpdate(): Promise<boolean> {
  const confirm = await p.confirm({
    message: 'Would you like to update now?',
    initialValue: false,
  });
  
  return !p.isCancel(confirm) && confirm;
}

async function performUpdate(newVersion: string) {
  const spinner = p.spinner();
  
  try {
    // Detect installation method
    const installMethod = detectInstallMethod();
    
    switch (installMethod) {
      case 'homebrew':
        spinner.start('Updating via Homebrew...');
        execSync('brew update && brew upgrade embed', { stdio: 'inherit' });
        spinner.stop('Updated successfully via Homebrew', 0);
        break;
        
        
      case 'binary':
        spinner.stop();
        Logger.info('Binary installation detected. Please download the latest version from:');
        Logger.log(`https://github.com/embeddable-hq/embeddable-cli/releases/latest`);
        break;
        
      default:
        spinner.stop();
        Logger.info('Could not detect installation method. Please update manually:');
        Logger.log('\nHomebrew: brew upgrade embed');
        Logger.log('Binary:   Download from https://github.com/embeddable-hq/embeddable-cli/releases/latest');
    }
    
    Logger.success(`\nUpdated to v${newVersion}!`);
  } catch (error) {
    spinner.stop('Update failed', 1);
    Logger.error('Failed to update automatically. Please update manually.');
    Logger.debug(`Update error: ${error}`);
  }
}

function detectInstallMethod(): string {
  try {
    // Check if installed via Homebrew
    const brewPrefix = execSync('brew --prefix 2>/dev/null', { encoding: 'utf8' }).trim();
    const execPath = process.execPath;
    
    if (execPath.startsWith(brewPrefix)) {
      return 'homebrew';
    }
  } catch {
    // Not installed via Homebrew
  }
  
  
  return 'binary';
}

function extractReleaseNotes(body: string): string {
  // Remove common installation sections
  const installationMarkers = [
    '## Installation',
    '### Installation',
    '## How to Install',
    '### How to Install',
    '## Download',
    '### Download'
  ];
  
  // Find the first installation marker
  let cutoffIndex = body.length;
  for (const marker of installationMarkers) {
    const index = body.indexOf(marker);
    if (index !== -1 && index < cutoffIndex) {
      cutoffIndex = index;
    }
  }
  
  // Extract content before installation instructions
  let releaseNotes = body.substring(0, cutoffIndex).trim();
  
  // Also remove any trailing markdown headers that might be empty
  releaseNotes = releaseNotes.replace(/^#+\s*$/gm, '').trim();
  
  // If notes are too short or empty after filtering, return empty
  if (releaseNotes.length < 10) {
    return '';
  }
  
  return releaseNotes;
}